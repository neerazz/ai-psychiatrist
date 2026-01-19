// src/embeddings/providers/openai.ts
// OpenAI embedding provider
// Model: text-embedding-3-large (3072 dimensions) or text-embedding-3-small (1536 dimensions)
// Implements: R27 (Vector Database Management)

import { BaseEmbeddingProvider } from './base.js';
import { EmbeddingResult, OpenAIEmbeddingConfig, PROVIDER_DEFAULTS } from '../types.js';
import { logger } from '../../utils/logger.js';

// Type for OpenAI client (dynamic import)
type OpenAIClient = {
  embeddings: {
    create: (params: {
      model: string;
      input: string | string[];
      dimensions?: number;
    }) => Promise<{
      data: Array<{ embedding: number[]; index: number }>;
      usage?: { total_tokens: number };
    }>;
  };
};

/**
 * OpenAI embedding provider
 * Uses OpenAI's embedding API for high-quality embeddings
 *
 * Supported models:
 * - text-embedding-3-large (3072 dimensions) - Highest quality, DEFAULT
 * - text-embedding-3-small (1536 dimensions) - Faster, lower cost
 * - text-embedding-ada-002 (1536 dimensions) - Legacy model
 */
export class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'openai';
  readonly dimensions: number;

  private client: OpenAIClient | null = null;
  private modelName: string;
  private isInitialized = false;

  /**
   * Create a new OpenAI embedding provider
   * @param config - OpenAI configuration (model, dimensions)
   */
  constructor(config: OpenAIEmbeddingConfig = {
    model: PROVIDER_DEFAULTS.openai.model,
    dimensions: PROVIDER_DEFAULTS.openai.dimensions
  }) {
    super();
    this.modelName = config.model;
    this.dimensions = config.dimensions;
  }

  /**
   * Initialize the OpenAI client
   * Requires OPENAI_API_KEY environment variable
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('OpenAI embedding provider already initialized');
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable not set. ' +
        'Set it in .env file or environment: OPENAI_API_KEY=sk-...'
      );
    }

    logger.info('Initializing OpenAI embedding provider', {
      model: this.modelName,
      dimensions: this.dimensions
    });

    try {
      // Dynamic import for OpenAI SDK
      const { default: OpenAI } = await import('openai');
      this.client = new OpenAI({ apiKey }) as unknown as OpenAIClient;

      this.isInitialized = true;
      logger.info('OpenAI embedding provider initialized successfully', {
        model: this.modelName
      });
    } catch (error) {
      logger.error('Failed to initialize OpenAI embedding provider', { error });
      throw new Error(
        `Failed to initialize OpenAI embedding provider: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'Make sure openai is installed: npm install openai'
      );
    }
  }

  /**
   * Generate embedding for a single text using OpenAI API
   * @param text - Text to embed
   * @returns Embedding result with vector and token count
   */
  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.client) {
      throw new Error(
        'OpenAI embedding provider not initialized. Call initialize() first.'
      );
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Cannot embed empty text');
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.modelName,
        input: text,
        // Only text-embedding-3-* models support custom dimensions
        ...(this.modelName.includes('text-embedding-3') && this.dimensions
          ? { dimensions: this.dimensions }
          : {})
      });

      const embedding = response.data[0].embedding;
      this.validateDimensions(embedding);

      return {
        embedding,
        model: this.modelName,
        tokenCount: response.usage?.total_tokens
      };
    } catch (error) {
      logger.error('OpenAI embedding failed', { error, textLength: text.length });

      // Handle specific OpenAI errors
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('OpenAI rate limit exceeded. Please wait and retry.');
        }
        if (error.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key. Check OPENAI_API_KEY.');
        }
      }

      throw new Error(
        `OpenAI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for multiple texts in a single API call
   * OpenAI supports native batch embedding for efficiency
   * @param texts - Array of texts to embed
   * @returns Array of embedding results
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.client) {
      throw new Error(
        'OpenAI embedding provider not initialized. Call initialize() first.'
      );
    }

    if (texts.length === 0) {
      return [];
    }

    logger.debug(`Processing batch of ${texts.length} texts`, { provider: this.name });

    try {
      // OpenAI API supports batch embedding natively
      const response = await this.client.embeddings.create({
        model: this.modelName,
        input: texts,
        ...(this.modelName.includes('text-embedding-3') && this.dimensions
          ? { dimensions: this.dimensions }
          : {})
      });

      // Sort by index to ensure correct order
      const sortedData = response.data.sort((a, b) => a.index - b.index);

      return sortedData.map(item => ({
        embedding: item.embedding,
        model: this.modelName,
        tokenCount: response.usage?.total_tokens
          ? Math.round(response.usage.total_tokens / texts.length)
          : undefined
      }));
    } catch (error) {
      logger.error('OpenAI batch embedding failed', { error, batchSize: texts.length });

      // Fall back to sequential processing on batch failure
      logger.warn('Falling back to sequential embedding');
      return super.embedBatch(texts);
    }
  }

  /**
   * Check if OpenAI is available (API key is set)
   */
  async isAvailable(): Promise<boolean> {
    const hasKey = !!process.env.OPENAI_API_KEY;
    if (!hasKey) {
      logger.debug('OpenAI provider not available: OPENAI_API_KEY not set');
    }
    return hasKey;
  }

  /**
   * Get information about the current configuration
   */
  getModelInfo(): { name: string; dimensions: number; initialized: boolean } {
    return {
      name: this.modelName,
      dimensions: this.dimensions,
      initialized: this.isInitialized
    };
  }
}
