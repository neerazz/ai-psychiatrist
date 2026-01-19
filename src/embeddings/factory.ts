// src/embeddings/factory.ts
// Factory for creating embedding providers from configuration
// Implements: AGENTS.md Article VIII (Framework Trust - use SDKs directly)
// Implements: R27 (Vector Database Management)

import {
  IEmbeddingProvider,
  EmbeddingConfig,
  EmbeddingProviderType,
  DEFAULT_EMBEDDING_CONFIG,
  PROVIDER_DEFAULTS
} from './types.js';
import { LocalEmbeddingProvider } from './providers/local.js';
import { OpenAIEmbeddingProvider } from './providers/openai.js';
import { OllamaEmbeddingProvider } from './providers/ollama.js';
import { logger } from '../utils/logger.js';

/**
 * Factory for creating embedding providers
 * Supports easy switching between providers via configuration
 *
 * Usage:
 * ```typescript
 * // Create default local provider
 * const provider = EmbeddingProviderFactory.create();
 *
 * // Create OpenAI provider
 * const provider = EmbeddingProviderFactory.create({ provider: 'openai' });
 *
 * // Create from environment
 * const provider = EmbeddingProviderFactory.createFromEnv();
 * ```
 */
export class EmbeddingProviderFactory {
  /**
   * Create an embedding provider based on configuration
   * Default: local provider (no API key required)
   *
   * @param config - Partial configuration (merged with defaults)
   * @returns Configured embedding provider (not yet initialized)
   */
  static create(config: Partial<EmbeddingConfig> = {}): IEmbeddingProvider {
    const mergedConfig = { ...DEFAULT_EMBEDDING_CONFIG, ...config };

    logger.info('Creating embedding provider', {
      provider: mergedConfig.provider,
      model: mergedConfig.model,
      dimensions: mergedConfig.dimensions
    });

    switch (mergedConfig.provider) {
      case 'local':
        return new LocalEmbeddingProvider(
          mergedConfig.model || PROVIDER_DEFAULTS.local.model,
          mergedConfig.dimensions || PROVIDER_DEFAULTS.local.dimensions
        );

      case 'openai':
        return new OpenAIEmbeddingProvider(
          mergedConfig.openaiConfig ?? {
            model: PROVIDER_DEFAULTS.openai.model,
            dimensions: PROVIDER_DEFAULTS.openai.dimensions
          }
        );

      case 'ollama':
        return new OllamaEmbeddingProvider(
          mergedConfig.ollamaConfig ?? {
            model: PROVIDER_DEFAULTS.ollama.model,
            dimensions: PROVIDER_DEFAULTS.ollama.dimensions,
            host: PROVIDER_DEFAULTS.ollama.host
          }
        );

      case 'custom':
        throw new Error(
          'Custom provider requires manual implementation. ' +
          'Extend BaseEmbeddingProvider to create a custom provider.'
        );

      default:
        throw new Error(`Unknown embedding provider: ${mergedConfig.provider}`);
    }
  }

  /**
   * Create provider from environment variables
   * Uses EMBEDDING_PROVIDER env var, defaults to 'local'
   *
   * Environment variables:
   * - EMBEDDING_PROVIDER: 'local' | 'openai' | 'ollama' (default: 'local')
   * - EMBEDDING_MODEL: Model name (optional, uses provider default)
   * - EMBEDDING_DIMENSIONS: Vector dimensions (optional, uses provider default)
   * - OPENAI_API_KEY: Required for OpenAI provider
   * - OLLAMA_HOST: Ollama server URL (default: http://localhost:11434)
   *
   * @returns Configured embedding provider (not yet initialized)
   */
  static createFromEnv(): IEmbeddingProvider {
    const providerType = (process.env.EMBEDDING_PROVIDER || 'local') as EmbeddingProviderType;
    const model = process.env.EMBEDDING_MODEL;
    const dimensions = process.env.EMBEDDING_DIMENSIONS
      ? parseInt(process.env.EMBEDDING_DIMENSIONS, 10)
      : undefined;

    logger.info('Creating embedding provider from environment', {
      provider: providerType,
      model: model || '(default)',
      dimensions: dimensions || '(default)'
    });

    const config: Partial<EmbeddingConfig> = {
      provider: providerType
    };

    // Apply model and dimensions if specified
    if (model) config.model = model;
    if (dimensions) config.dimensions = dimensions;

    // Provider-specific environment configuration
    switch (providerType) {
      case 'openai':
        config.openaiConfig = {
          model: model || PROVIDER_DEFAULTS.openai.model,
          dimensions: dimensions || PROVIDER_DEFAULTS.openai.dimensions
        };
        break;

      case 'ollama':
        config.ollamaConfig = {
          model: model || PROVIDER_DEFAULTS.ollama.model,
          dimensions: dimensions || PROVIDER_DEFAULTS.ollama.dimensions,
          host: process.env.OLLAMA_HOST || PROVIDER_DEFAULTS.ollama.host
        };
        break;
    }

    return this.create(config);
  }

  /**
   * Create and initialize a provider
   * Convenience method that creates and initializes in one call
   *
   * @param config - Partial configuration
   * @returns Initialized embedding provider ready for use
   */
  static async createAndInitialize(
    config: Partial<EmbeddingConfig> = {}
  ): Promise<IEmbeddingProvider> {
    const provider = this.create(config);
    await provider.initialize();
    return provider;
  }

  /**
   * Create from environment and initialize
   * Convenience method for quick setup
   *
   * @returns Initialized embedding provider ready for use
   */
  static async createFromEnvAndInitialize(): Promise<IEmbeddingProvider> {
    const provider = this.createFromEnv();
    await provider.initialize();
    return provider;
  }

  /**
   * Get the default configuration for a provider type
   * @param providerType - Provider type to get defaults for
   */
  static getProviderDefaults(providerType: EmbeddingProviderType): {
    model: string;
    dimensions: number;
  } {
    switch (providerType) {
      case 'local':
        return { ...PROVIDER_DEFAULTS.local };
      case 'openai':
        return { ...PROVIDER_DEFAULTS.openai };
      case 'ollama':
        return {
          model: PROVIDER_DEFAULTS.ollama.model,
          dimensions: PROVIDER_DEFAULTS.ollama.dimensions
        };
      default:
        return { ...PROVIDER_DEFAULTS.local };
    }
  }

  /**
   * Get list of available provider types
   */
  static getAvailableProviders(): EmbeddingProviderType[] {
    return ['local', 'openai', 'ollama', 'custom'];
  }
}

// Export convenience functions
export const createEmbeddingProvider = EmbeddingProviderFactory.create;
export const createEmbeddingProviderFromEnv = EmbeddingProviderFactory.createFromEnv;
