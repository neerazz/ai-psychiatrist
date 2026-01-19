// src/embeddings/providers/base.ts
// Abstract base class for embedding providers
// Implements: AGENTS.md Article I (Library-First - standalone module with clear interfaces)

import { IEmbeddingProvider, EmbeddingResult } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Abstract base class for all embedding providers
 * Provides default implementations for batch processing and availability checks
 */
export abstract class BaseEmbeddingProvider implements IEmbeddingProvider {
  abstract readonly name: string;
  abstract readonly dimensions: number;

  /**
   * Initialize the provider - must be implemented by subclasses
   */
  abstract initialize(): Promise<void>;

  /**
   * Generate embedding for a single text - must be implemented by subclasses
   */
  abstract embed(text: string): Promise<EmbeddingResult>;

  /**
   * Generate embeddings for multiple texts
   * Default implementation processes texts sequentially
   * Override for providers that support native batch processing
   *
   * @param texts - Array of texts to embed
   * @returns Array of embedding results
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    logger.debug(`Embedding batch of ${texts.length} texts`, { provider: this.name });

    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  /**
   * Check if the provider is available
   * Default implementation attempts a test embedding
   * Override for providers that have specific availability checks
   *
   * @returns true if provider can be used
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.embed('test availability');
      return true;
    } catch (error) {
      logger.debug(`Provider ${this.name} not available`, { error });
      return false;
    }
  }

  /**
   * Validate that embedding dimensions match expected
   * @param embedding - The embedding vector to validate
   * @throws Error if dimensions don't match
   */
  protected validateDimensions(embedding: number[]): void {
    if (embedding.length !== this.dimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.dimensions}, got ${embedding.length}`
      );
    }
  }

  /**
   * Normalize an embedding vector to unit length
   * @param embedding - The embedding vector to normalize
   * @returns Normalized embedding vector
   */
  protected normalize(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return embedding;
    return embedding.map(val => val / magnitude);
  }
}
