import { BedrockClient } from '../clients/bedrockClient';
import { config } from '../config';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  const mockSend = jest.fn();
  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    InvokeModelCommand: jest.fn().mockImplementation((params) => params),
    mockSend, // Export for test access
  };
});

// Mock cost monitor
jest.mock('../services/costMonitor', () => ({
  costMonitor: {
    recordCost: jest.fn(),
    isWithinLimits: jest.fn().mockReturnValue({ daily: true, monthly: true }),
  },
}));

describe('BedrockClient', () => {
  let client: BedrockClient;
  let mockCostMonitor: any;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCostMonitor = require('../services/costMonitor').costMonitor;
    mockCostMonitor.isWithinLimits.mockReturnValue({ daily: true, monthly: true });
    
    // Get the mock send function
    const awsMock = require('@aws-sdk/client-bedrock-runtime');
    mockSend = awsMock.mockSend;
    
    client = new BedrockClient();
  });

  describe('invokeClaudeModel', () => {
    it('should invoke Claude model successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: 'Generated response' }],
          usage: { input_tokens: 10, output_tokens: 20 },
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await client.invokeClaudeModel('Test prompt');

      expect(result).toMatchObject({
        data: expect.objectContaining({
          content: [{ text: 'Generated response' }],
        }),
        modelId: config.models.claude.modelId,
        cached: false,
        inputTokens: 10,
        outputTokens: 20,
      });

      expect(mockCostMonitor.recordCost).toHaveBeenCalledWith({
        modelId: config.models.claude.modelId,
        operation: 'text_generation',
        inputTokens: 10,
        outputTokens: 20,
        requestId: expect.any(String),
        userId: undefined,
      });
    });

    it('should use custom options', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: 'Generated response' }],
          usage: { input_tokens: 15, output_tokens: 25 },
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const options = {
        maxTokens: 2000,
        temperature: 0.5,
        topP: 0.9,
        topK: 100,
        userId: 'test-user',
      };

      await client.invokeClaudeModel('Test prompt', options);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('"max_tokens":2000'),
        })
      );
    });

    it('should handle cost limit exceeded', async () => {
      mockCostMonitor.isWithinLimits.mockReturnValue({ daily: false, monthly: true });

      await expect(client.invokeClaudeModel('Test prompt')).rejects.toThrow(
        'Cost limits exceeded. Cannot make Bedrock request.'
      );
    });

    it('should retry on failure', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          body: new TextEncoder().encode(JSON.stringify({
            content: [{ text: 'Generated response' }],
            usage: { input_tokens: 10, output_tokens: 20 },
          })),
        });

      const result = await client.invokeClaudeModel('Test prompt');

      expect(result.data.content[0].text).toBe('Generated response');
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('invokeTitanModel', () => {
    it('should invoke Titan model successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          results: [{ outputText: 'Titan response', tokenCount: 15 }],
          inputTextTokenCount: 8,
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await client.invokeTitanModel('Test prompt');

      expect(result).toMatchObject({
        data: expect.objectContaining({
          results: [{ outputText: 'Titan response', tokenCount: 15 }],
        }),
        modelId: config.models.titan.modelId,
        cached: false,
        inputTokens: 8,
        outputTokens: 15,
      });
    });
  });

  describe('invokeCohereModel', () => {
    it('should invoke Cohere model successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          generations: [{ text: 'Cohere response' }],
          meta: { tokens: { input_tokens: 12, output_tokens: 18 } },
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await client.invokeCohereModel('Test prompt');

      expect(result).toMatchObject({
        data: expect.objectContaining({
          generations: [{ text: 'Cohere response' }],
        }),
        modelId: config.models.cohere.modelId,
        cached: false,
        inputTokens: 12,
        outputTokens: 18,
      });
    });
  });

  describe('invokeStableDiffusionModel', () => {
    it('should generate images successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          artifacts: [
            { base64: 'base64-image-data', finishReason: 'SUCCESS' },
          ],
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await client.invokeStableDiffusionModel('A beautiful landscape');

      expect(result).toMatchObject({
        data: expect.objectContaining({
          artifacts: expect.arrayContaining([
            expect.objectContaining({ base64: 'base64-image-data' }),
          ]),
        }),
        modelId: config.models.stableDiffusion.modelId,
        cached: false,
      });

      expect(mockCostMonitor.recordCost).toHaveBeenCalledWith({
        modelId: config.models.stableDiffusion.modelId,
        operation: 'image_generation',
        imageCount: 1,
        requestId: expect.any(String),
        userId: undefined,
      });
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          embedding: [0.1, 0.2, 0.3, 0.4],
          inputTextTokenCount: 5,
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await client.generateEmbeddings('Test text');

      expect(result).toMatchObject({
        data: expect.objectContaining({
          embedding: [0.1, 0.2, 0.3, 0.4],
        }),
        modelId: 'amazon.titan-embed-text-v1',
        cached: false,
        inputTokens: 5,
      });

      expect(mockCostMonitor.recordCost).toHaveBeenCalledWith({
        modelId: 'amazon.titan-embed-text-v1',
        operation: 'embedding',
        inputTokens: 5,
        requestId: expect.any(String),
        userId: undefined,
      });
    });
  });

  describe('caching', () => {
    it('should return cached response when available', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: 'Cached response' }],
          usage: { input_tokens: 10, output_tokens: 20 },
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      // First call - should hit the API
      const result1 = await client.invokeClaudeModel('Test prompt');
      expect(result1.cached).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await client.invokeClaudeModel('Test prompt');
      expect(result2.cached).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1); // No additional API call
    });

    it('should skip cache when useCache is false', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: 'Fresh response' }],
          usage: { input_tokens: 10, output_tokens: 20 },
        })),
      };

      mockSend.mockResolvedValue(mockResponse);

      // First call
      await client.invokeClaudeModel('Test prompt');
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Second call with useCache: false
      await client.invokeClaudeModel('Test prompt', { useCache: false });
      expect(mockSend).toHaveBeenCalledTimes(2); // Should make API call
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      client.clearCache();
      const stats = client.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', () => {
      const stats = client.getCacheStats();
      expect(stats).toMatchObject({
        size: expect.any(Number),
        maxSize: config.caching.maxSize,
        enabled: config.caching.enabled,
      });
    });
  });
});