import { logger } from '@pageflow/utils';
import { bedrockClient, ModelOptions } from '../clients/bedrockClient';

export interface EmbeddingRequest {
  text: string;
  options?: ModelOptions;
  userId?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  modelUsed: string;
  requestId: string;
  inputTokens?: number;
  cost: number;
  cached: boolean;
}

export interface SemanticSearchRequest {
  query: string;
  documents: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
  topK?: number;
  threshold?: number;
  options?: ModelOptions;
  userId?: string;
}

export interface SemanticSearchResult {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  similarity: number;
  embedding?: number[];
}

export interface SemanticSearchResponse {
  query: string;
  results: SemanticSearchResult[];
  queryEmbedding: number[];
  totalDocuments: number;
  requestId: string;
  cost: number;
}

export interface ContentSimilarityRequest {
  sourceText: string;
  targetTexts: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
  threshold?: number;
  options?: ModelOptions;
  userId?: string;
}

export interface ContentSimilarityResponse {
  sourceText: string;
  similarities: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
    similarity: number;
  }>;
  requestId: string;
  cost: number;
}

export class EmbeddingService {
  /**
   * Generate embeddings for text
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const { text, options = {}, userId } = request;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for embedding generation');
    }

    logger.info({
      message: 'Generating embedding',
      textLength: text.length,
      userId,
    });

    try {
      const response = await bedrockClient.generateEmbeddings(text, {
        ...options,
        userId,
      });

      const result: EmbeddingResponse = {
        embedding: response.data.embedding,
        modelUsed: response.modelId,
        requestId: response.requestId,
        inputTokens: response.inputTokens,
        cost: response.cost,
        cached: response.cached,
      };

      logger.info({
        message: 'Embedding generated successfully',
        requestId: response.requestId,
        embeddingDimensions: response.data.embedding?.length || 0,
        cached: response.cached,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Embedding generation failed',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async batchGenerateEmbeddings(
    texts: string[],
    options: ModelOptions = {},
    userId?: string
  ): Promise<EmbeddingResponse[]> {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array is required and must not be empty');
    }

    if (texts.length > 25) {
      throw new Error('Maximum 25 texts allowed per batch');
    }

    logger.info({
      message: 'Starting batch embedding generation',
      textCount: texts.length,
      userId,
    });

    const results = await Promise.allSettled(
      texts.map(text => this.generateEmbedding({ text, options, userId }))
    );

    const embeddings: EmbeddingResponse[] = [];
    const errors: Error[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        embeddings.push(result.value);
      } else {
        logger.error({
          message: 'Batch embedding generation item failed',
          index,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        errors.push(result.reason);
      }
    });

    logger.info({
      message: 'Batch embedding generation completed',
      successCount: embeddings.length,
      errorCount: errors.length,
    });

    return embeddings;
  }

  /**
   * Perform semantic search
   */
  async semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    const {
      query,
      documents,
      topK = 10,
      threshold = 0.0,
      options = {},
      userId,
    } = request;

    if (!query || query.trim().length === 0) {
      throw new Error('Query is required for semantic search');
    }

    if (!documents || documents.length === 0) {
      throw new Error('Documents array is required and must not be empty');
    }

    logger.info({
      message: 'Starting semantic search',
      query,
      documentCount: documents.length,
      topK,
      threshold,
      userId,
    });

    try {
      // Generate embedding for the query
      const queryEmbeddingResponse = await this.generateEmbedding({
        text: query,
        options,
        userId,
      });

      const queryEmbedding = queryEmbeddingResponse.embedding;
      let totalCost = queryEmbeddingResponse.cost;

      // Generate embeddings for all documents
      const documentTexts = documents.map(doc => doc.text);
      const documentEmbeddings = await this.batchGenerateEmbeddings(
        documentTexts,
        options,
        userId
      );

      // Calculate total cost
      totalCost += documentEmbeddings.reduce((sum, emb) => sum + emb.cost, 0);

      // Calculate similarities
      const similarities: SemanticSearchResult[] = [];
      
      documents.forEach((doc, index) => {
        const docEmbedding = documentEmbeddings[index];
        if (docEmbedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding.embedding);
          
          if (similarity >= threshold) {
            similarities.push({
              id: doc.id,
              text: doc.text,
              metadata: doc.metadata,
              similarity,
              embedding: docEmbedding.embedding,
            });
          }
        }
      });

      // Sort by similarity (descending) and take top K
      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      const response: SemanticSearchResponse = {
        query,
        results,
        queryEmbedding,
        totalDocuments: documents.length,
        requestId: queryEmbeddingResponse.requestId,
        cost: totalCost,
      };

      logger.info({
        message: 'Semantic search completed',
        query,
        resultsCount: results.length,
        totalDocuments: documents.length,
        requestId: queryEmbeddingResponse.requestId,
      });

      return response;
    } catch (error) {
      logger.error({
        message: 'Semantic search failed',
        query,
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Detect content similarity
   */
  async detectContentSimilarity(request: ContentSimilarityRequest): Promise<ContentSimilarityResponse> {
    const {
      sourceText,
      targetTexts,
      threshold = 0.7,
      options = {},
      userId,
    } = request;

    if (!sourceText || sourceText.trim().length === 0) {
      throw new Error('Source text is required for similarity detection');
    }

    if (!targetTexts || targetTexts.length === 0) {
      throw new Error('Target texts array is required and must not be empty');
    }

    logger.info({
      message: 'Starting content similarity detection',
      sourceTextLength: sourceText.length,
      targetTextsCount: targetTexts.length,
      threshold,
      userId,
    });

    try {
      // Generate embedding for source text
      const sourceEmbeddingResponse = await this.generateEmbedding({
        text: sourceText,
        options,
        userId,
      });

      const sourceEmbedding = sourceEmbeddingResponse.embedding;
      let totalCost = sourceEmbeddingResponse.cost;

      // Generate embeddings for target texts
      const targetTextStrings = targetTexts.map(target => target.text);
      const targetEmbeddings = await this.batchGenerateEmbeddings(
        targetTextStrings,
        options,
        userId
      );

      // Calculate total cost
      totalCost += targetEmbeddings.reduce((sum, emb) => sum + emb.cost, 0);

      // Calculate similarities
      const similarities: Array<{
        id: string;
        text: string;
        metadata?: Record<string, any>;
        similarity: number;
      }> = [];
      
      targetTexts.forEach((target, index) => {
        const targetEmbedding = targetEmbeddings[index];
        if (targetEmbedding) {
          const similarity = this.cosineSimilarity(sourceEmbedding, targetEmbedding.embedding);
          
          if (similarity >= threshold) {
            similarities.push({
              id: target.id,
              text: target.text,
              metadata: target.metadata,
              similarity,
            });
          }
        }
      });

      // Sort by similarity (descending)
      const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity);

      const response: ContentSimilarityResponse = {
        sourceText,
        similarities: sortedSimilarities,
        requestId: sourceEmbeddingResponse.requestId,
        cost: totalCost,
      };

      logger.info({
        message: 'Content similarity detection completed',
        sourceTextLength: sourceText.length,
        similaritiesFound: sortedSimilarities.length,
        requestId: sourceEmbeddingResponse.requestId,
      });

      return response;
    } catch (error) {
      logger.error({
        message: 'Content similarity detection failed',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Find duplicate or near-duplicate content
   */
  async findDuplicates(
    texts: Array<{ id: string; text: string; metadata?: Record<string, any> }>,
    threshold: number = 0.95,
    options: ModelOptions = {},
    userId?: string
  ): Promise<Array<{
    group: Array<{ id: string; text: string; metadata?: Record<string, any>; similarity: number }>;
    representative: { id: string; text: string; metadata?: Record<string, any> };
  }>> {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array is required and must not be empty');
    }

    logger.info({
      message: 'Starting duplicate detection',
      textsCount: texts.length,
      threshold,
      userId,
    });

    try {
      // Generate embeddings for all texts
      const textStrings = texts.map(item => item.text);
      const embeddings = await this.batchGenerateEmbeddings(textStrings, options, userId);

      // Find groups of similar texts
      const groups: Array<{
        group: Array<{ id: string; text: string; metadata?: Record<string, any>; similarity: number }>;
        representative: { id: string; text: string; metadata?: Record<string, any> };
      }> = [];

      const processed = new Set<number>();

      for (let i = 0; i < texts.length; i++) {
        if (processed.has(i) || !embeddings[i]) continue;

        const currentGroup = [{ ...texts[i], similarity: 1.0 }];
        processed.add(i);

        // Find similar texts
        for (let j = i + 1; j < texts.length; j++) {
          if (processed.has(j) || !embeddings[j]) continue;

          const similarity = this.cosineSimilarity(embeddings[i].embedding, embeddings[j].embedding);
          
          if (similarity >= threshold) {
            currentGroup.push({ ...texts[j], similarity });
            processed.add(j);
          }
        }

        // Only include groups with more than one item
        if (currentGroup.length > 1) {
          // Sort by similarity and use the first as representative
          currentGroup.sort((a, b) => b.similarity - a.similarity);
          
          groups.push({
            group: currentGroup,
            representative: texts[i],
          });
        }
      }

      logger.info({
        message: 'Duplicate detection completed',
        textsCount: texts.length,
        duplicateGroups: groups.length,
        userId,
      });

      return groups;
    } catch (error) {
      logger.error({
        message: 'Duplicate detection failed',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  private euclideanDistance(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Cluster embeddings using k-means
   */
  async clusterContent(
    texts: Array<{ id: string; text: string; metadata?: Record<string, any> }>,
    k: number,
    maxIterations: number = 100,
    options: ModelOptions = {},
    userId?: string
  ): Promise<Array<{
    cluster: number;
    centroid: number[];
    items: Array<{ id: string; text: string; metadata?: Record<string, any>; distance: number }>;
  }>> {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array is required and must not be empty');
    }

    if (k <= 0 || k > texts.length) {
      throw new Error('K must be between 1 and the number of texts');
    }

    logger.info({
      message: 'Starting content clustering',
      textsCount: texts.length,
      k,
      maxIterations,
      userId,
    });

    try {
      // Generate embeddings for all texts
      const textStrings = texts.map(item => item.text);
      const embeddings = await this.batchGenerateEmbeddings(textStrings, options, userId);

      const validEmbeddings = embeddings.filter(emb => emb && emb.embedding);
      if (validEmbeddings.length === 0) {
        throw new Error('No valid embeddings generated');
      }

      const dimensions = validEmbeddings[0].embedding.length;

      // Initialize centroids randomly
      let centroids: number[][] = [];
      for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * validEmbeddings.length);
        centroids.push([...validEmbeddings[randomIndex].embedding]);
      }

      let assignments: number[] = new Array(validEmbeddings.length).fill(0);
      let hasChanged = true;
      let iteration = 0;

      // K-means iterations
      while (hasChanged && iteration < maxIterations) {
        hasChanged = false;
        const newAssignments: number[] = [];

        // Assign each point to the nearest centroid
        for (let i = 0; i < validEmbeddings.length; i++) {
          let minDistance = Infinity;
          let closestCentroid = 0;

          for (let j = 0; j < k; j++) {
            const distance = this.euclideanDistance(validEmbeddings[i].embedding, centroids[j]);
            if (distance < minDistance) {
              minDistance = distance;
              closestCentroid = j;
            }
          }

          newAssignments.push(closestCentroid);
          if (assignments[i] !== closestCentroid) {
            hasChanged = true;
          }
        }

        assignments = newAssignments;

        // Update centroids
        const newCentroids: number[][] = [];
        for (let j = 0; j < k; j++) {
          const clusterPoints = validEmbeddings.filter((_, i) => assignments[i] === j);
          
          if (clusterPoints.length === 0) {
            // Keep the old centroid if no points assigned
            newCentroids.push([...centroids[j]]);
          } else {
            // Calculate mean of assigned points
            const newCentroid = new Array(dimensions).fill(0);
            for (const point of clusterPoints) {
              for (let d = 0; d < dimensions; d++) {
                newCentroid[d] += point.embedding[d];
              }
            }
            for (let d = 0; d < dimensions; d++) {
              newCentroid[d] /= clusterPoints.length;
            }
            newCentroids.push(newCentroid);
          }
        }

        centroids = newCentroids;
        iteration++;
      }

      // Build result clusters
      const clusters: Array<{
        cluster: number;
        centroid: number[];
        items: Array<{ id: string; text: string; metadata?: Record<string, any>; distance: number }>;
      }> = [];

      for (let j = 0; j < k; j++) {
        const clusterItems = texts
          .map((text, i) => {
            if (assignments[i] === j && validEmbeddings[i]) {
              const distance = this.euclideanDistance(validEmbeddings[i].embedding, centroids[j]);
              return { ...text, distance };
            }
            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .sort((a, b) => a.distance - b.distance);

        clusters.push({
          cluster: j,
          centroid: centroids[j],
          items: clusterItems,
        });
      }

      logger.info({
        message: 'Content clustering completed',
        textsCount: texts.length,
        clusters: k,
        iterations: iteration,
        userId,
      });

      return clusters;
    } catch (error) {
      logger.error({
        message: 'Content clustering failed',
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get embedding service statistics
   */
  getStats(): {
    supportedModels: string[];
    maxBatchSize: number;
    embeddingDimensions: number;
    similarityMethods: string[];
  } {
    return {
      supportedModels: ['amazon.titan-embed-text-v1'],
      maxBatchSize: 25,
      embeddingDimensions: 1536, // Titan embedding dimensions
      similarityMethods: ['cosine', 'euclidean'],
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();