// src/embeddings/providers/ollama.ts
// Ollama embedding provider for local LLM embeddings
// Model: nomic-embed-text (768 dimensions) or mxbai-embed-large (1024 dimensions)
// Implements: R27 (Vector Database Management), R22 (Hybrid Cloud/Local Architecture)

import { BaseEmbeddingProvider } from './base.js';
import { EmbeddingResult, OllamaEmbeddingConfig, PROVIDER_DEFAULTS } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Ollama API response for embeddings
 */
interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Ollama embedding provider
 * Uses local Ollama server for embeddings - good for privacy and offline use
 *
 * Supported models (install with `ollama pull <model>`):
 * - nomic-embed-text (768 dimensions) - DEFAULT, good quality
 * - mxbai-embed-large (1024 dimensions) - Higher quality
 * - all-minilm (384 dimensions) - Fast and compact
 */
export class OllamaEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'ollama';
  readonly dimensions: number;

  private host: string;
  private modelName: string;
  private isInitialized = false;

  /**
   * Create a new Ollama embedding provider
   * @param config - Ollama configuration (model, dimensions, host)
   */
  constructor(config: OllamaEmbeddingConfig = {
    model: PROVIDER_DEFAULTS.ollama.model,
    dimensions: PROVIDER_DEFAULTS.ollama.dimensions,
    host: PROVIDER_DEFAULTS.ollama.host
  }) {
    super();
    this.modelName = config.model;
    this.dimensions = config.dimensions;
    this.host = config.host;
  }

  /**
   * Initialize the Ollama provider
   * Checks if Ollama server is running and model is available
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Ollama embedding provider already initialized');
      return;
    }

    logger.info('Initializing Ollama embedding provider', {
      model: this.modelName,
      dimensions: this.dimensions,
      host: this.host
    });

    // Check if Ollama is running
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        `Ollama not available at ${this.host}. ` +
        'Make sure Ollama is running: ollama serve'
      );
    }

    // Check if model is available
    const hasModel = await this.hasModel(this.modelName);
    if (!hasModel) {
      throw new Error(
        `Ollama model '${this.modelName}' not found. ` +
        `Install it with: ollama pull ${this.modelName}`
      );
    }

    this.isInitialized = true;
    logger.info('Ollama embedding provider initialized successfully', {
      model: this.modelName,
      host: this.host
    });
  }

  /**
   * Generate embedding for a single text using Ollama API
   * @param text - Text to embed
   * @returns Embedding result
   */
  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.isInitialized) {
      throw new Error(
        'Ollama embedding provider not initialized. Call initialize() first.'
      );
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Cannot embed empty text');
    }

    try {
      const response = await fetch(`${this.host}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: text
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as OllamaEmbeddingResponse;

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid response from Ollama: missing embedding array');
      }

      return {
        embedding: data.embedding,
        model: this.modelName
      };
    } catch (error) {
      logger.error('Ollama embedding failed', { error, textLength: text.length });

      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error(
          `Cannot connect to Ollama at ${this.host}. Is Ollama running?`
        );
      }

      throw new Error(
        `Ollama embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for multiple texts
   * Ollama doesn't support native batch embedding, so we process sequentially
   * @param texts - Array of texts to embed
   * @returns Array of embedding results
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.isInitialized) {
      throw new Error(
        'Ollama embedding provider not initialized. Call initialize() first.'
      );
    }

    if (texts.length === 0) {
      return [];
    }

    logger.debug(`Processing batch of ${texts.length} texts`, { provider: this.name });

    // Ollama doesn't support batch embedding natively
    // Process sequentially (could be parallelized with Promise.all if needed)
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  /**
   * Check if Ollama server is running
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      logger.debug('Ollama not available', { host: this.host, error });
      return false;
    }
  }

  /**
   * Check if a specific model is available in Ollama
   * @param modelName - Name of the model to check
   */
  private async hasModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      if (!response.ok) return false;

      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];

      return models.some(m =>
        m.name === modelName ||
        m.name.startsWith(`${modelName}:`)
      );
    } catch {
      return false;
    }
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json() as { models?: Array<{ name: string }> };
      return (data.models || []).map(m => m.name);
    } catch {
      return [];
    }
  }

  /**
   * Get information about the current configuration
   */
  getModelInfo(): { name: string; dimensions: number; host: string; initialized: boolean } {
    return {
      name: this.modelName,
      dimensions: this.dimensions,
      host: this.host,
      initialized: this.isInitialized
    };
  }
}
