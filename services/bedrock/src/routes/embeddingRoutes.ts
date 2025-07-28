import { Router, Request, Response } from 'express';
import { logger } from '@pageflow/utils';
import { 
  embeddingService, 
  EmbeddingRequest, 
  SemanticSearchRequest, 
  ContentSimilarityRequest 
} from '../services/embeddingService';

const router = Router();

/**
 * Generate embedding for text
 * POST /api/embeddings/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const request: EmbeddingRequest = {
      text: req.body.text,
      options: req.body.options || {},
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.text || request.text.trim().length === 0) {
      return res.status(400).json({
        error: 'Text is required for embedding generation',
        code: 'MISSING_TEXT',
      });
    }

    const result = await embeddingService.generateEmbedding(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Embedding generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/generate',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Embedding generation failed',
      code: 'EMBEDDING_ERROR',
    });
  }
});

/**
 * Generate embeddings for multiple texts
 * POST /api/embeddings/batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { texts, options = {}, userId } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Texts array is required and must not be empty',
        code: 'MISSING_TEXTS',
      });
    }

    if (texts.length > 25) {
      return res.status(400).json({
        error: 'Maximum 25 texts allowed per batch',
        code: 'BATCH_SIZE_EXCEEDED',
      });
    }

    // Validate that all texts are strings
    const invalidTexts = texts.filter(text => typeof text !== 'string' || text.trim().length === 0);
    if (invalidTexts.length > 0) {
      return res.status(400).json({
        error: 'All texts must be non-empty strings',
        code: 'INVALID_TEXT_FORMAT',
      });
    }

    const results = await embeddingService.batchGenerateEmbeddings(
      texts,
      options,
      userId || req.headers['x-user-id'] as string
    );
    
    res.json({
      success: true,
      data: {
        embeddings: results,
        count: results.length,
        totalRequests: texts.length,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Batch embedding generation endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/batch',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Batch embedding generation failed',
      code: 'BATCH_EMBEDDING_ERROR',
    });
  }
});

/**
 * Perform semantic search
 * POST /api/embeddings/search
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const request: SemanticSearchRequest = {
      query: req.body.query,
      documents: req.body.documents,
      topK: req.body.topK || 10,
      threshold: req.body.threshold || 0.0,
      options: req.body.options || {},
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.query || request.query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required for semantic search',
        code: 'MISSING_QUERY',
      });
    }

    if (!Array.isArray(request.documents) || request.documents.length === 0) {
      return res.status(400).json({
        error: 'Documents array is required and must not be empty',
        code: 'MISSING_DOCUMENTS',
      });
    }

    // Validate document format
    const invalidDocs = request.documents.filter(doc => 
      !doc.id || !doc.text || typeof doc.id !== 'string' || typeof doc.text !== 'string'
    );
    
    if (invalidDocs.length > 0) {
      return res.status(400).json({
        error: 'All documents must have id and text properties as strings',
        code: 'INVALID_DOCUMENT_FORMAT',
      });
    }

    if (request.topK && (request.topK < 1 || request.topK > 100)) {
      return res.status(400).json({
        error: 'topK must be between 1 and 100',
        code: 'INVALID_TOP_K',
      });
    }

    if (request.threshold && (request.threshold < 0 || request.threshold > 1)) {
      return res.status(400).json({
        error: 'Threshold must be between 0 and 1',
        code: 'INVALID_THRESHOLD',
      });
    }

    const result = await embeddingService.semanticSearch(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Semantic search endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/search',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Semantic search failed',
      code: 'SEMANTIC_SEARCH_ERROR',
    });
  }
});

/**
 * Detect content similarity
 * POST /api/embeddings/similarity
 */
router.post('/similarity', async (req: Request, res: Response) => {
  try {
    const request: ContentSimilarityRequest = {
      sourceText: req.body.sourceText,
      targetTexts: req.body.targetTexts,
      threshold: req.body.threshold || 0.7,
      options: req.body.options || {},
      userId: req.body.userId || req.headers['x-user-id'] as string,
    };

    if (!request.sourceText || request.sourceText.trim().length === 0) {
      return res.status(400).json({
        error: 'Source text is required for similarity detection',
        code: 'MISSING_SOURCE_TEXT',
      });
    }

    if (!Array.isArray(request.targetTexts) || request.targetTexts.length === 0) {
      return res.status(400).json({
        error: 'Target texts array is required and must not be empty',
        code: 'MISSING_TARGET_TEXTS',
      });
    }

    // Validate target text format
    const invalidTargets = request.targetTexts.filter(target => 
      !target.id || !target.text || typeof target.id !== 'string' || typeof target.text !== 'string'
    );
    
    if (invalidTargets.length > 0) {
      return res.status(400).json({
        error: 'All target texts must have id and text properties as strings',
        code: 'INVALID_TARGET_FORMAT',
      });
    }

    if (request.threshold && (request.threshold < 0 || request.threshold > 1)) {
      return res.status(400).json({
        error: 'Threshold must be between 0 and 1',
        code: 'INVALID_THRESHOLD',
      });
    }

    const result = await embeddingService.detectContentSimilarity(request);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      message: 'Content similarity endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/similarity',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Content similarity detection failed',
      code: 'SIMILARITY_ERROR',
    });
  }
});

/**
 * Find duplicate content
 * POST /api/embeddings/duplicates
 */
router.post('/duplicates', async (req: Request, res: Response) => {
  try {
    const { texts, threshold = 0.95, options = {}, userId } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Texts array is required and must not be empty',
        code: 'MISSING_TEXTS',
      });
    }

    // Validate text format
    const invalidTexts = texts.filter(text => 
      !text.id || !text.text || typeof text.id !== 'string' || typeof text.text !== 'string'
    );
    
    if (invalidTexts.length > 0) {
      return res.status(400).json({
        error: 'All texts must have id and text properties as strings',
        code: 'INVALID_TEXT_FORMAT',
      });
    }

    if (threshold < 0 || threshold > 1) {
      return res.status(400).json({
        error: 'Threshold must be between 0 and 1',
        code: 'INVALID_THRESHOLD',
      });
    }

    const result = await embeddingService.findDuplicates(
      texts,
      threshold,
      options,
      userId || req.headers['x-user-id'] as string
    );
    
    res.json({
      success: true,
      data: {
        duplicateGroups: result,
        totalGroups: result.length,
        totalTexts: texts.length,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Duplicate detection endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/duplicates',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Duplicate detection failed',
      code: 'DUPLICATE_DETECTION_ERROR',
    });
  }
});

/**
 * Cluster content
 * POST /api/embeddings/cluster
 */
router.post('/cluster', async (req: Request, res: Response) => {
  try {
    const { texts, k, maxIterations = 100, options = {}, userId } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Texts array is required and must not be empty',
        code: 'MISSING_TEXTS',
      });
    }

    if (!k || typeof k !== 'number' || k < 1 || k > texts.length) {
      return res.status(400).json({
        error: 'K must be a number between 1 and the number of texts',
        code: 'INVALID_K',
      });
    }

    // Validate text format
    const invalidTexts = texts.filter(text => 
      !text.id || !text.text || typeof text.id !== 'string' || typeof text.text !== 'string'
    );
    
    if (invalidTexts.length > 0) {
      return res.status(400).json({
        error: 'All texts must have id and text properties as strings',
        code: 'INVALID_TEXT_FORMAT',
      });
    }

    if (maxIterations < 1 || maxIterations > 1000) {
      return res.status(400).json({
        error: 'Max iterations must be between 1 and 1000',
        code: 'INVALID_MAX_ITERATIONS',
      });
    }

    const result = await embeddingService.clusterContent(
      texts,
      k,
      maxIterations,
      options,
      userId || req.headers['x-user-id'] as string
    );
    
    res.json({
      success: true,
      data: {
        clusters: result,
        k,
        totalTexts: texts.length,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Content clustering endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/cluster',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Content clustering failed',
      code: 'CLUSTERING_ERROR',
    });
  }
});

/**
 * Get embedding service statistics
 * GET /api/embeddings/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = embeddingService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error({
      message: 'Embedding stats endpoint error',
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/stats',
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to retrieve embedding statistics',
      code: 'STATS_ERROR',
    });
  }
});

export { router as embeddingRoutes };