// src/embeddings/providers/local.ts
// Local embedding provider using Transformers.js
// DEFAULT provider - no API key required
// Model: Xenova/all-MiniLM-L6-v2 (384 dimensions)
// Implements: R27 (Vector Database Management)

import { BaseEmbeddingProvider } from './base.js';
import { EmbeddingResult, PROVIDER_DEFAULTS } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Local embedding provider using Transformers.js
 * This is the DEFAULT provider - works offline with no API keys required
 *
 * Supported models:
 * - Xenova/all-MiniLM-L6-v2 (384 dimensions) - DEFAULT, fast and efficient
 * - Xenova/all-MiniLM-L12-v2 (384 dimensions) - Slightly better quality
 * - Xenova/bge-small-en-v1.5 (384 dimensions) - Good for retrieval
 * - Xenova/bge-base-en-v1.5 (768 dimensions) - Better quality, larger
 */
export class LocalEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'local';
  readonly dimensions: number;

  private pipeline: any = null;
  private modelName: string;
  private isInitialized = false;

  /**
   * Create a new local embedding provider
   * @param modelName - Hugging Face model name (default: Xenova/all-MiniLM-L6-v2)
   * @param dimensions - Vector dimensions (default: 384)
   */
  constructor(
    modelName: string = PROVIDER_DEFAULTS.local.model,
    dimensions: number = PROVIDER_DEFAULTS.local.dimensions
  ) {
    super();
    this.modelName = modelName;
    this.dimensions = dimensions;
  }

  /**
   * Initialize the Transformers.js pipeline
   * Downloads the model on first use (cached afterward)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Local embedding provider already initialized');
      return;
    }

    logger.info('Initializing local embedding provider', {
      model: this.modelName,
      dimensions: this.dimensions
    });

    try {
      // Dynamic import for Transformers.js
      // This allows the module to work even if transformers isn't installed
      const { pipeline } = await import('@xenova/transformers');

      logger.info('Loading embedding model (may download on first use)...');
      this.pipeline = await pipeline('feature-extraction', this.modelName);

      this.isInitialized = true;
      logger.info('Local embedding provider initialized successfully', {
        model: this.modelName,
        dimensions: this.dimensions
      });
    } catch (error) {
      logger.error('Failed to initialize local embedding provider', { error });
      throw new Error(
        `Failed to initialize local embedding provider: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'Make sure @xenova/transformers is installed: npm install @xenova/transformers'
      );
    }
  }

  /**
   * Generate embedding for a single text
   * @param text - Text to embed
   * @returns Embedding result with 384-dimensional vector
   */
  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.pipeline) {
      throw new Error(
        'Local embedding provider not initialized. Call initialize() first.'
      );
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Cannot embed empty text');
    }

    try {
      // Run through the feature extraction pipeline
      // pooling: 'mean' - average all token embeddings
      // normalize: true - normalize to unit length for cosine similarity
      const output = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true
      });

      // Convert to array and validate
      const embedding = Array.from(output.data) as number[];
      this.validateDimensions(embedding);

      return {
        embedding,
        model: this.modelName
      };
    } catch (error) {
      logger.error('Local embedding failed', { error, textLength: text.length });
      throw new Error(
        `Local embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for multiple texts
   * Uses parallel processing for efficiency
   * @param texts - Array of texts to embed
   * @returns Array of embedding results
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.pipeline) {
      throw new Error(
        'Local embedding provider not initialized. Call initialize() first.'
      );
    }

    if (texts.length === 0) {
      return [];
    }

    logger.debug(`Processing batch of ${texts.length} texts`, { provider: this.name });

    // Process in parallel using Promise.all
    // Transformers.js handles batching internally
    return Promise.all(texts.map(text => this.embed(text)));
  }

  /**
   * Check if the local provider is available
   * Always returns true since it doesn't require API keys
   */
  async isAvailable(): Promise<boolean> {
    // Local provider is always available if transformers.js is installed
    try {
      await import('@xenova/transformers');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get information about the current model
   */
  getModelInfo(): { name: string; dimensions: number; initialized: boolean } {
    return {
      name: this.modelName,
      dimensions: this.dimensions,
      initialized: this.isInitialized
    };
  }
}
