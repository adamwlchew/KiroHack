import { logger } from '@pageflow/utils';
import { bedrockClient, ModelOptions } from '../clients/bedrockClient';
import { promptManager, PromptVariables } from './promptManager';
import { contentModerationService } from './contentModerationService';

export interface TextGenerationRequest {
  prompt?: string;
  templateId?: string;
  templateVariables?: PromptVariables;
  model?: 'claude' | 'titan' | 'cohere';
  options?: ModelOptions;
  moderateContent?: boolean;
  userId?: string;
}

export interface TextGenerationResponse {
  text: string;
  modelUsed: string;
  requestId: string;
  inputTokens?: number;
  outputTokens?: number;
  cost: number;
  moderationResult?: {
    flagged: boolean;
    categories: string[];
    confidence: number;
  };
  cached: boolean;
}

export interface ContentGenerationRequest extends TextGenerationRequest {
  contentType: 'lesson' | 'quiz' | 'explanation' | 'summary' | 'feedback';
  subject: string;
  gradeLevel: string;
  readingLevel: 'elementary' | 'intermediate' | 'advanced' | 'expert';
  duration?: number; // in minutes
  includeAssessment?: boolean;
  curriculumStandards?: string[];
}

export interface CompanionResponseRequest extends TextGenerationRequest {
  studentName: string;
  currentTopic: string;
  recentProgress: string;
  emotionalState: 'neutral' | 'happy' | 'frustrated' | 'confused' | 'excited';
  platform: 'web' | 'mobile' | 'ar' | 'vr';
  personalityTraits: {
    enthusiasm: number;
    helpfulness: number;
    humor: number;
    formality: number;
  };
}

export interface AssessmentFeedbackRequest extends TextGenerationRequest {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  gradeLevel: string;
  subject: string;
  isCorrect?: boolean;
}

export class TextGenerationService {
  /**
   * Generate text using a direct prompt
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const { prompt, model = 'claude', options = {}, moderateContent = true, userId } = request;

    if (!prompt) {
      throw new Error('Prompt is required for text generation');
    }

    logger.info({
      message: 'Starting text generation',
      model,
      userId,
      promptLength: prompt.length,
    });

    try {
      // Generate text using the specified model
      let response;
      const modelOptions = { ...options, userId };

      switch (model) {
        case 'claude':
          response = await bedrockClient.invokeClaudeModel(prompt, modelOptions);
          break;
        case 'titan':
          response = await bedrockClient.invokeTitanModel(prompt, modelOptions);
          break;
        case 'cohere':
          response = await bedrockClient.invokeCohereModel(prompt, modelOptions);
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
      }

      // Extract text from model-specific response format
      const generatedText = this.extractTextFromResponse(response.data, model);

      // Moderate content if requested
      let moderationResult;
      if (moderateContent) {
        moderationResult = await contentModerationService.moderateText(generatedText);
        
        if (moderationResult.flagged) {
          logger.warn({
            message: 'Generated content flagged by moderation',
            requestId: response.requestId,
            categories: moderationResult.categories,
          });
          
          // Optionally throw error or return sanitized content
          if (moderationResult.confidence > 0.8) {
            throw new Error('Generated content violates content policy');
          }
        }
      }

      const result: TextGenerationResponse = {
        text: generatedText,
        modelUsed: response.modelId,
        requestId: response.requestId,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost: response.cost,
        moderationResult,
        cached: response.cached,
      };

      logger.info({
        message: 'Text generation completed',
        requestId: response.requestId,
        modelUsed: response.modelId,
        outputLength: generatedText.length,
        cached: response.cached,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Text generation failed',
        error: error instanceof Error ? error.message : String(error),
        model,
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate text using a prompt template
   */
  async generateFromTemplate(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const { templateId, templateVariables, model, options, moderateContent, userId } = request;

    if (!templateId || !templateVariables) {
      throw new Error('Template ID and variables are required for template-based generation');
    }

    try {
      // Build prompt from template
      const prompt = promptManager.buildPrompt(templateId, templateVariables);
      
      // Determine model from template if not specified
      const template = promptManager.getTemplate(templateId);
      const selectedModel = model || template?.model || 'claude';

      logger.info({
        message: 'Generating text from template',
        templateId,
        selectedModel,
        userId,
      });

      // Generate text using the built prompt
      return await this.generateText({
        prompt,
        model: selectedModel,
        options,
        moderateContent,
        userId,
      });
    } catch (error) {
      logger.error({
        message: 'Template-based text generation failed',
        templateId,
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate educational content
   */
  async generateContent(request: ContentGenerationRequest): Promise<TextGenerationResponse> {
    const {
      contentType,
      subject,
      gradeLevel,
      readingLevel,
      duration,
      includeAssessment = false,
      curriculumStandards = [],
      options,
      userId,
    } = request;

    const templateVariables: PromptVariables = {
      contentType,
      subject,
      gradeLevel,
      readingLevel,
      duration: duration || 30,
      includeAssessment: includeAssessment ? 'yes' : 'no',
      curriculumStandards: curriculumStandards.join(', '),
      topic: subject, // For template compatibility
      context: `Generate ${contentType} content for ${subject}`,
    };

    logger.info({
      message: 'Generating educational content',
      contentType,
      subject,
      gradeLevel,
      userId,
    });

    return await this.generateFromTemplate({
      templateId: 'content_generation_basic',
      templateVariables,
      model: 'claude',
      options,
      moderateContent: true,
      userId,
    });
  }

  /**
   * Generate Page companion response
   */
  async generateCompanionResponse(request: CompanionResponseRequest): Promise<TextGenerationResponse> {
    const {
      studentName,
      currentTopic,
      recentProgress,
      emotionalState,
      platform,
      personalityTraits,
      options,
      userId,
    } = request;

    const templateVariables: PromptVariables = {
      studentName,
      currentTopic,
      recentProgress,
      emotionalState,
      platform,
      enthusiasm: personalityTraits.enthusiasm,
      helpfulness: personalityTraits.helpfulness,
      humor: personalityTraits.humor,
      formality: personalityTraits.formality,
      studentMessage: request.templateVariables?.studentMessage || '',
    };

    logger.info({
      message: 'Generating Page companion response',
      studentName,
      platform,
      emotionalState,
      userId,
    });

    return await this.generateFromTemplate({
      templateId: 'page_companion_response',
      templateVariables,
      model: 'claude',
      options,
      moderateContent: true,
      userId,
    });
  }

  /**
   * Generate assessment feedback
   */
  async generateAssessmentFeedback(request: AssessmentFeedbackRequest): Promise<TextGenerationResponse> {
    const {
      question,
      studentAnswer,
      correctAnswer,
      gradeLevel,
      subject,
      isCorrect,
      options,
      userId,
    } = request;

    // Determine correctness if not provided
    const correct = isCorrect !== undefined ? isCorrect : 
      studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    const templateVariables: PromptVariables = {
      question,
      studentAnswer,
      correctAnswer,
      gradeLevel,
      subject,
      isCorrect: correct ? 'correct' : 'incorrect',
    };

    logger.info({
      message: 'Generating assessment feedback',
      subject,
      gradeLevel,
      isCorrect: correct,
      userId,
    });

    return await this.generateFromTemplate({
      templateId: 'assessment_feedback_detailed',
      templateVariables,
      model: 'claude',
      options,
      moderateContent: true,
      userId,
    });
  }

  /**
   * Summarize content using Cohere
   */
  async summarizeContent(
    content: string,
    gradeLevel: string,
    summaryLength: 'short' | 'medium' | 'long' = 'medium',
    focusAreas: string[] = [],
    options: ModelOptions = {},
    userId?: string
  ): Promise<TextGenerationResponse> {
    const templateVariables: PromptVariables = {
      content,
      gradeLevel,
      summaryLength,
      focusAreas: focusAreas.join(', ') || 'key concepts and main ideas',
    };

    logger.info({
      message: 'Summarizing content',
      gradeLevel,
      summaryLength,
      contentLength: content.length,
      userId,
    });

    return await this.generateFromTemplate({
      templateId: 'content_summarization',
      templateVariables,
      model: 'cohere',
      options,
      moderateContent: true,
      userId,
    });
  }

  /**
   * Extract text from model-specific response format
   */
  private extractTextFromResponse(responseData: any, model: string): string {
    switch (model) {
      case 'claude':
        return responseData.content?.[0]?.text || responseData.completion || '';
      case 'titan':
        return responseData.results?.[0]?.outputText || responseData.outputText || '';
      case 'cohere':
        return responseData.generations?.[0]?.text || responseData.text || '';
      default:
        // Try common response formats
        return responseData.text || responseData.content || responseData.output || String(responseData);
    }
  }

  /**
   * Batch generate multiple texts
   */
  async batchGenerate(requests: TextGenerationRequest[]): Promise<TextGenerationResponse[]> {
    logger.info({
      message: 'Starting batch text generation',
      requestCount: requests.length,
    });

    const results = await Promise.allSettled(
      requests.map(request => this.generateText(request))
    );

    const responses: TextGenerationResponse[] = [];
    const errors: Error[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
      } else {
        logger.error({
          message: 'Batch generation item failed',
          index,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        errors.push(result.reason);
      }
    });

    logger.info({
      message: 'Batch text generation completed',
      successCount: responses.length,
      errorCount: errors.length,
    });

    return responses;
  }

  /**
   * Get generation statistics
   */
  getStats(): {
    templatesAvailable: number;
    modelsSupported: string[];
    moderationEnabled: boolean;
  } {
    const stats = promptManager.getStats();
    
    return {
      templatesAvailable: stats.totalTemplates,
      modelsSupported: ['claude', 'titan', 'cohere'],
      moderationEnabled: true,
    };
  }
}

// Export singleton instance
export const textGenerationService = new TextGenerationService();