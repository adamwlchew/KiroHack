import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { logger } from '@pageflow/utils';
import { config } from '../config';
import { costMonitor } from '../services/costMonitor';
import { v4 as uuidv4 } from 'uuid';

export interface ModelOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  requestId?: string;
  userId?: string;
  useCache?: boolean;
  retryOnFailure?: boolean;
}

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  seed?: number;
  requestId?: string;
  userId?: string;
  useCache?: boolean;
  retryOnFailure?: boolean;
}

export interface BedrockResponse<T = any> {
  data: T;
  modelId: string;
  requestId: string;
  inputTokens?: number;
  outputTokens?: number;
  cached: boolean;
  cost: number;
}

// Simple in-memory cache
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; cost: number }>();

  get(key: string): any | null {
    if (!config.caching.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > config.caching.ttl * 1000;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, data: any, cost: number): void {
    if (!config.caching.enabled) return;

    // Remove oldest entries if cache is full
    if (this.cache.size >= config.caching.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      cost,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const responseCache = new ResponseCache();

/**
 * Enhanced Bedrock client with model selection, fallback strategies, caching, and cost monitoring
 */
export class BedrockClient {
  private client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: config.region,
      maxAttempts: config.retryPolicy.maxRetries,
    });

    logger.info({ message: 'Initialized Bedrock client', region: config.region });
  }

  /**
   * Generate a cache key for a request
   */
  private generateCacheKey(modelId: string, request: any): string {
    const requestString = JSON.stringify(request);
    return `${modelId}:${Buffer.from(requestString).toString('base64')}`;
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = config.retryPolicy.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        const delay = Math.min(
          config.retryPolicy.baseDelay * Math.pow(2, attempt),
          config.retryPolicy.maxDelay
        );

        logger.warn({
          message: 'Bedrock operation failed, retrying',
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Invoke a model with fallback support
   */
  private async invokeModelWithFallback(
    primaryModelId: string,
    fallbackModelId: string | undefined,
    request: any,
    options: ModelOptions = {}
  ): Promise<BedrockResponse> {
    const requestId = options.requestId || uuidv4();
    const cacheKey = this.generateCacheKey(primaryModelId, request);

    // Check cache first
    if (options.useCache !== false) {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        logger.debug({ message: 'Cache hit for Bedrock request', requestId, modelId: primaryModelId });
        return {
          data: cached.data,
          modelId: primaryModelId,
          requestId,
          cached: true,
          cost: cached.cost,
        };
      }
    }

    // Check cost limits
    const limits = costMonitor.isWithinLimits();
    if (!limits.daily || !limits.monthly) {
      throw new Error('Cost limits exceeded. Cannot make Bedrock request.');
    }

    const tryInvokeModel = async (modelId: string): Promise<BedrockResponse> => {
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(request),
      });

      const startTime = Date.now();
      const response = await this.client.send(command);
      const endTime = Date.now();

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Extract token counts (model-specific)
      let inputTokens = 0;
      let outputTokens = 0;

      if (modelId.includes('claude')) {
        inputTokens = responseBody.usage?.input_tokens || 0;
        outputTokens = responseBody.usage?.output_tokens || 0;
      } else if (modelId.includes('titan')) {
        inputTokens = responseBody.inputTextTokenCount || 0;
        outputTokens = responseBody.results?.[0]?.tokenCount || 0;
      } else if (modelId.includes('cohere')) {
        // Cohere token counting may vary
        inputTokens = responseBody.meta?.tokens?.input_tokens || 0;
        outputTokens = responseBody.meta?.tokens?.output_tokens || 0;
      }

      // Record cost
      costMonitor.recordCost({
        modelId,
        operation: 'text_generation',
        inputTokens,
        outputTokens,
        requestId,
        userId: options.userId,
      });

      const result: BedrockResponse = {
        data: responseBody,
        modelId,
        requestId,
        inputTokens,
        outputTokens,
        cached: false,
        cost: 0, // Will be calculated by cost monitor
      };

      // Cache the response
      if (options.useCache !== false) {
        responseCache.set(cacheKey, responseBody, result.cost);
      }

      logger.info({
        message: 'Bedrock model invoked successfully',
        modelId,
        requestId,
        inputTokens,
        outputTokens,
        duration: endTime - startTime,
        cached: false,
      });

      return result;
    };

    try {
      // Try primary model
      if (options.retryOnFailure !== false) {
        return await this.retryWithBackoff(() => tryInvokeModel(primaryModelId));
      } else {
        return await tryInvokeModel(primaryModelId);
      }
    } catch (primaryError) {
      logger.warn({
        message: 'Primary model failed',
        primaryModelId,
        error: primaryError instanceof Error ? primaryError.message : String(primaryError),
      });

      // Try fallback model if available
      if (fallbackModelId) {
        try {
          logger.info({ message: 'Attempting fallback model', fallbackModelId, requestId });
          
          if (options.retryOnFailure !== false) {
            return await this.retryWithBackoff(() => tryInvokeModel(fallbackModelId));
          } else {
            return await tryInvokeModel(fallbackModelId);
          }
        } catch (fallbackError) {
          logger.error({
            message: 'Fallback model also failed',
            fallbackModelId,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
          throw fallbackError;
        }
      } else {
        throw primaryError;
      }
    }
  }

  /**
   * Invoke Claude model for text generation
   */
  async invokeClaudeModel(prompt: string, options: ModelOptions = {}): Promise<BedrockResponse> {
    const modelConfig = config.models.claude;
    
    const request = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      temperature: options.temperature || modelConfig.temperature,
      top_p: options.topP || modelConfig.topP,
      top_k: options.topK || modelConfig.topK,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    };

    return this.invokeModelWithFallback(
      modelConfig.modelId,
      modelConfig.fallbackModelId,
      request,
      options
    );
  }

  /**
   * Invoke Titan model for text generation
   */
  async invokeTitanModel(prompt: string, options: ModelOptions = {}): Promise<BedrockResponse> {
    const modelConfig = config.models.titan;
    
    const request = {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: options.maxTokens || modelConfig.maxTokens,
        temperature: options.temperature || modelConfig.temperature,
        topP: options.topP || modelConfig.topP,
      },
    };

    return this.invokeModelWithFallback(
      modelConfig.modelId,
      modelConfig.fallbackModelId,
      request,
      options
    );
  }

  /**
   * Invoke Cohere model for text generation and summarization
   */
  async invokeCohereModel(prompt: string, options: ModelOptions = {}): Promise<BedrockResponse> {
    const modelConfig = config.models.cohere;
    
    const request = {
      prompt,
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      temperature: options.temperature || modelConfig.temperature,
      p: options.topP || modelConfig.p,
      k: options.topK || modelConfig.k,
    };

    return this.invokeModelWithFallback(
      modelConfig.modelId,
      modelConfig.fallbackModelId,
      request,
      options
    );
  }

  /**
   * Invoke Stable Diffusion model for image generation
   */
  async invokeStableDiffusionModel(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<BedrockResponse> {
    const modelConfig = config.models.stableDiffusion;
    const requestId = options.requestId || uuidv4();
    
    const request = {
      text_prompts: [
        {
          text: prompt,
          weight: 1,
        },
      ],
      cfg_scale: options.cfgScale || modelConfig.cfgScale,
      height: options.height || modelConfig.height,
      width: options.width || modelConfig.width,
      steps: options.steps || modelConfig.steps,
      seed: options.seed || Math.floor(Math.random() * 1000000),
    };

    const cacheKey = this.generateCacheKey(modelConfig.modelId, request);

    // Check cache first
    if (options.useCache !== false) {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        logger.debug({ message: 'Cache hit for image generation', requestId, modelId: modelConfig.modelId });
        return {
          data: cached.data,
          modelId: modelConfig.modelId,
          requestId,
          cached: true,
          cost: cached.cost,
        };
      }
    }

    // Check cost limits
    const limits = costMonitor.isWithinLimits();
    if (!limits.daily || !limits.monthly) {
      throw new Error('Cost limits exceeded. Cannot make image generation request.');
    }

    const command = new InvokeModelCommand({
      modelId: modelConfig.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(request),
    });

    try {
      const startTime = Date.now();
      const response = await this.client.send(command);
      const endTime = Date.now();

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Record cost for image generation
      costMonitor.recordCost({
        modelId: modelConfig.modelId,
        operation: 'image_generation',
        imageCount: responseBody.artifacts?.length || 1,
        requestId,
        userId: options.userId,
      });

      const result: BedrockResponse = {
        data: responseBody,
        modelId: modelConfig.modelId,
        requestId,
        cached: false,
        cost: 0, // Will be calculated by cost monitor
      };

      // Cache the response
      if (options.useCache !== false) {
        responseCache.set(cacheKey, responseBody, result.cost);
      }

      logger.info({
        message: 'Image generated successfully',
        modelId: modelConfig.modelId,
        requestId,
        imageCount: responseBody.artifacts?.length || 1,
        duration: endTime - startTime,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Image generation failed',
        modelId: modelConfig.modelId,
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate embeddings using Titan
   */
  async generateEmbeddings(text: string, options: ModelOptions = {}): Promise<BedrockResponse> {
    const modelId = 'amazon.titan-embed-text-v1';
    const requestId = options.requestId || uuidv4();
    
    const request = {
      inputText: text,
    };

    const cacheKey = this.generateCacheKey(modelId, request);

    // Check cache first
    if (options.useCache !== false) {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        logger.debug({ message: 'Cache hit for embeddings', requestId, modelId });
        return {
          data: cached.data,
          modelId,
          requestId,
          cached: true,
          cost: cached.cost,
        };
      }
    }

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(request),
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Record cost for embeddings
      costMonitor.recordCost({
        modelId,
        operation: 'embedding',
        inputTokens: responseBody.inputTextTokenCount || 0,
        requestId,
        userId: options.userId,
      });

      const result: BedrockResponse = {
        data: responseBody,
        modelId,
        requestId,
        cached: false,
        cost: 0,
      };

      // Cache the response
      if (options.useCache !== false) {
        responseCache.set(cacheKey, responseBody, result.cost);
      }

      logger.info({
        message: 'Embeddings generated successfully',
        modelId,
        requestId,
        inputTokens: responseBody.inputTextTokenCount || 0,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Embedding generation failed',
        modelId,
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    responseCache.clear();
    logger.info({ message: 'Bedrock response cache cleared' });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: responseCache.size(),
      maxSize: config.caching.maxSize,
      enabled: config.caching.enabled,
    };
  }
}

// Export singleton instance
export const bedrockClient = new BedrockClient();