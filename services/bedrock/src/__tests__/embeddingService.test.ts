import { EmbeddingService } from '../services/embeddingService';
import { bedrockClient } from '../clients/bedrockClient';

// Mock dependencies
jest.mock('../clients/bedrockClient');

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let mockBedrockClient: jest.Mocked<typeof bedrockClient>;

  beforeEach(() => {
    service = new EmbeddingService();
    mockBedrockClient = bedrockClient as jest.Mocked<typeof bedrockClient>;
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockResponse = {
        data: { embedding: [0.1, 0.2, 0.3, 0.4] },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'test-request-id',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      };

      mockBedrockClient.generateEmbeddings.mockResolvedValue(mockResponse);

      const result = await service.generateEmbedding({
        text: 'Test text for embedding',
        userId: 'test-user',
      });

      expect(result).toMatchObject({
        embedding: [0.1, 0.2, 0.3, 0.4],
        modelUsed: 'amazon.titan-embed-text-v1',
        requestId: 'test-request-id',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      });

      expect(mockBedrockClient.generateEmbeddings).toHaveBeenCalledWith(
        'Test text for embedding',
        expect.objectContaining({ userId: 'test-user' })
      );
    });

    it('should throw error for empty text', async () => {
      await expect(service.generateEmbedding({
        text: '',
      })).rejects.toThrow('Text is required for embedding generation');
    });

    it('should throw error for whitespace-only text', async () => {
      await expect(service.generateEmbedding({
        text: '   ',
      })).rejects.toThrow('Text is required for embedding generation');
    });
  });

  describe('batchGenerateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockResponse1 = {
        data: { embedding: [0.1, 0.2, 0.3, 0.4] },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'test-request-1',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      };

      const mockResponse2 = {
        data: { embedding: [0.5, 0.6, 0.7, 0.8] },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'test-request-2',
        inputTokens: 6,
        cost: 0.0012,
        cached: false,
      };

      mockBedrockClient.generateEmbeddings
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const texts = ['First text', 'Second text'];
      const results = await service.batchGenerateEmbeddings(texts, {}, 'test-user');

      expect(results).toHaveLength(2);
      expect(results[0].embedding).toEqual([0.1, 0.2, 0.3, 0.4]);
      expect(results[1].embedding).toEqual([0.5, 0.6, 0.7, 0.8]);
      expect(mockBedrockClient.generateEmbeddings).toHaveBeenCalledTimes(2);
    });

    it('should throw error for empty texts array', async () => {
      await expect(service.batchGenerateEmbeddings([])).rejects.toThrow(
        'Texts array is required and must not be empty'
      );
    });

    it('should throw error for too many texts', async () => {
      const texts = new Array(26).fill('text');
      await expect(service.batchGenerateEmbeddings(texts)).rejects.toThrow(
        'Maximum 25 texts allowed per batch'
      );
    });

    it('should handle partial failures', async () => {
      const mockResponse = {
        data: { embedding: [0.1, 0.2, 0.3, 0.4] },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'test-request-1',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      };

      mockBedrockClient.generateEmbeddings
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(new Error('Embedding failed'));

      const texts = ['First text', 'Second text'];
      const results = await service.batchGenerateEmbeddings(texts);

      expect(results).toHaveLength(1);
      expect(results[0].embedding).toEqual([0.1, 0.2, 0.3, 0.4]);
    });
  });

  describe('semanticSearch', () => {
    it('should perform semantic search', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3, 0.4];
      const doc1Embedding = [0.15, 0.25, 0.35, 0.45]; // Similar to query
      const doc2Embedding = [0.9, 0.8, 0.7, 0.6]; // Different from query

      const mockQueryResponse = {
        data: { embedding: queryEmbedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'query-request',
        inputTokens: 3,
        cost: 0.0006,
        cached: false,
      };

      const mockDoc1Response = {
        data: { embedding: doc1Embedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'doc1-request',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      };

      const mockDoc2Response = {
        data: { embedding: doc2Embedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'doc2-request',
        inputTokens: 4,
        cost: 0.0008,
        cached: false,
      };

      mockBedrockClient.generateEmbeddings
        .mockResolvedValueOnce(mockQueryResponse)
        .mockResolvedValueOnce(mockDoc1Response)
        .mockResolvedValueOnce(mockDoc2Response);

      const documents = [
        { id: 'doc1', text: 'Similar document' },
        { id: 'doc2', text: 'Different document' },
      ];

      const result = await service.semanticSearch({
        query: 'Test query',
        documents,
        topK: 2,
        threshold: 0.0,
      });

      expect(result.query).toBe('Test query');
      expect(result.results).toHaveLength(2);
      expect(result.queryEmbedding).toEqual(queryEmbedding);
      expect(result.totalDocuments).toBe(2);
      
      // Results should be sorted by similarity (descending)
      expect(result.results[0].similarity).toBeGreaterThan(result.results[1].similarity);
      expect(result.results[0].id).toBe('doc1'); // More similar document first
    });

    it('should filter results by threshold', async () => {
      const queryEmbedding = [1, 0, 0, 0];
      const doc1Embedding = [0.9, 0.1, 0.1, 0.1]; // High similarity
      const doc2Embedding = [0, 1, 0, 0]; // Low similarity

      const mockQueryResponse = {
        data: { embedding: queryEmbedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'query-request',
        inputTokens: 3,
        cost: 0.0006,
        cached: false,
      };

      const mockDoc1Response = {
        data: { embedding: doc1Embedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'doc1-request',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      };

      const mockDoc2Response = {
        data: { embedding: doc2Embedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'doc2-request',
        inputTokens: 4,
        cost: 0.0008,
        cached: false,
      };

      mockBedrockClient.generateEmbeddings
        .mockResolvedValueOnce(mockQueryResponse)
        .mockResolvedValueOnce(mockDoc1Response)
        .mockResolvedValueOnce(mockDoc2Response);

      const documents = [
        { id: 'doc1', text: 'Similar document' },
        { id: 'doc2', text: 'Different document' },
      ];

      const result = await service.semanticSearch({
        query: 'Test query',
        documents,
        topK: 10,
        threshold: 0.5, // High threshold
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].id).toBe('doc1');
      expect(result.results[0].similarity).toBeGreaterThan(0.5);
    });

    it('should limit results by topK', async () => {
      const queryEmbedding = [1, 0, 0, 0];
      const embeddings = [
        [0.9, 0.1, 0.1, 0.1],
        [0.8, 0.2, 0.1, 0.1],
        [0.7, 0.3, 0.1, 0.1],
      ];

      const mockQueryResponse = {
        data: { embedding: queryEmbedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'query-request',
        inputTokens: 3,
        cost: 0.0006,
        cached: false,
      };

      mockBedrockClient.generateEmbeddings.mockResolvedValueOnce(mockQueryResponse);

      // Mock document embeddings
      embeddings.forEach((embedding, index) => {
        mockBedrockClient.generateEmbeddings.mockResolvedValueOnce({
          data: { embedding },
          modelId: 'amazon.titan-embed-text-v1',
          requestId: `doc${index + 1}-request`,
          inputTokens: 5,
          cost: 0.001,
          cached: false,
        });
      });

      const documents = [
        { id: 'doc1', text: 'Document 1' },
        { id: 'doc2', text: 'Document 2' },
        { id: 'doc3', text: 'Document 3' },
      ];

      const result = await service.semanticSearch({
        query: 'Test query',
        documents,
        topK: 2, // Limit to top 2
        threshold: 0.0,
      });

      expect(result.results).toHaveLength(2);
      // Should return the 2 most similar documents
      expect(result.results[0].id).toBe('doc1');
      expect(result.results[1].id).toBe('doc2');
    });

    it('should throw error for empty query', async () => {
      await expect(service.semanticSearch({
        query: '',
        documents: [{ id: 'doc1', text: 'Document' }],
      })).rejects.toThrow('Query is required for semantic search');
    });

    it('should throw error for empty documents', async () => {
      await expect(service.semanticSearch({
        query: 'Test query',
        documents: [],
      })).rejects.toThrow('Documents array is required and must not be empty');
    });
  });

  describe('detectContentSimilarity', () => {
    it('should detect content similarity', async () => {
      const sourceEmbedding = [1, 0, 0, 0];
      const target1Embedding = [0.9, 0.1, 0.1, 0.1]; // High similarity
      const target2Embedding = [0, 1, 0, 0]; // Low similarity

      const mockSourceResponse = {
        data: { embedding: sourceEmbedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'source-request',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      };

      const mockTarget1Response = {
        data: { embedding: target1Embedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'target1-request',
        inputTokens: 5,
        cost: 0.001,
        cached: false,
      };

      const mockTarget2Response = {
        data: { embedding: target2Embedding },
        modelId: 'amazon.titan-embed-text-v1',
        requestId: 'target2-request',
        inputTokens: 4,
        cost: 0.0008,
        cached: false,
      };

      mockBedrockClient.generateEmbeddings
        .mockResolvedValueOnce(mockSourceResponse)
        .mockResolvedValueOnce(mockTarget1Response)
        .mockResolvedValueOnce(mockTarget2Response);

      const targetTexts = [
        { id: 'target1', text: 'Similar text' },
        { id: 'target2', text: 'Different text' },
      ];

      const result = await service.detectContentSimilarity({
        sourceText: 'Source text',
        targetTexts,
        threshold: 0.5,
      });

      expect(result.sourceText).toBe('Source text');
      expect(result.similarities).toHaveLength(1); // Only one above threshold
      expect(result.similarities[0].id).toBe('target1');
      expect(result.similarities[0].similarity).toBeGreaterThan(0.5);
    });

    it('should throw error for empty source text', async () => {
      await expect(service.detectContentSimilarity({
        sourceText: '',
        targetTexts: [{ id: 'target1', text: 'Target text' }],
      })).rejects.toThrow('Source text is required for similarity detection');
    });

    it('should throw error for empty target texts', async () => {
      await expect(service.detectContentSimilarity({
        sourceText: 'Source text',
        targetTexts: [],
      })).rejects.toThrow('Target texts array is required and must not be empty');
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicate content groups', async () => {
      const embeddings = [
        [1, 0, 0, 0],     // Group 1
        [0.95, 0.05, 0, 0], // Group 1 (similar)
        [0, 1, 0, 0],     // Group 2
        [0, 0.95, 0.05, 0], // Group 2 (similar)
        [0, 0, 1, 0],     // Unique
      ];

      // Mock embedding responses
      embeddings.forEach((embedding, index) => {
        mockBedrockClient.generateEmbeddings.mockResolvedValueOnce({
          data: { embedding },
          modelId: 'amazon.titan-embed-text-v1',
          requestId: `request-${index + 1}`,
          inputTokens: 5,
          cost: 0.001,
          cached: false,
        });
      });

      const texts = [
        { id: 'text1', text: 'First text' },
        { id: 'text2', text: 'Similar to first' },
        { id: 'text3', text: 'Second text' },
        { id: 'text4', text: 'Similar to second' },
        { id: 'text5', text: 'Unique text' },
      ];

      const result = await service.findDuplicates(texts, 0.9);

      expect(result).toHaveLength(2); // Two duplicate groups
      expect(result[0].group).toHaveLength(2); // First group has 2 items
      expect(result[1].group).toHaveLength(2); // Second group has 2 items
    });

    it('should throw error for empty texts array', async () => {
      await expect(service.findDuplicates([])).rejects.toThrow(
        'Texts array is required and must not be empty'
      );
    });
  });

  describe('clusterContent', () => {
    it('should cluster content using k-means', async () => {
      const embeddings = [
        [1, 0, 0, 0],     // Cluster 1
        [0.9, 0.1, 0, 0], // Cluster 1
        [0, 1, 0, 0],     // Cluster 2
        [0, 0.9, 0.1, 0], // Cluster 2
      ];

      // Mock embedding responses
      embeddings.forEach((embedding, index) => {
        mockBedrockClient.generateEmbeddings.mockResolvedValueOnce({
          data: { embedding },
          modelId: 'amazon.titan-embed-text-v1',
          requestId: `request-${index + 1}`,
          inputTokens: 5,
          cost: 0.001,
          cached: false,
        });
      });

      const texts = [
        { id: 'text1', text: 'First cluster text' },
        { id: 'text2', text: 'Also first cluster' },
        { id: 'text3', text: 'Second cluster text' },
        { id: 'text4', text: 'Also second cluster' },
      ];

      const result = await service.clusterContent(texts, 2);

      expect(result).toHaveLength(2); // Two clusters
      expect(result[0].cluster).toBe(0);
      expect(result[1].cluster).toBe(1);
      expect(result[0].items.length + result[1].items.length).toBe(4); // All texts assigned
    });

    it('should throw error for invalid k', async () => {
      const texts = [{ id: 'text1', text: 'Text' }];
      
      await expect(service.clusterContent(texts, 0)).rejects.toThrow(
        'K must be between 1 and the number of texts'
      );
      
      await expect(service.clusterContent(texts, 2)).rejects.toThrow(
        'K must be between 1 and the number of texts'
      );
    });

    it('should throw error for empty texts array', async () => {
      await expect(service.clusterContent([], 1)).rejects.toThrow(
        'Texts array is required and must not be empty'
      );
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      const stats = service.getStats();

      expect(stats).toEqual({
        supportedModels: ['amazon.titan-embed-text-v1'],
        maxBatchSize: 25,
        embeddingDimensions: 1536,
        similarityMethods: ['cosine', 'euclidean'],
      });
    });
  });
});