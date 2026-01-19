// src/embeddings/types.ts
// Embedding provider interfaces and types
// Reference: data_schemas.md Section 6 (embedding_config)
// Implements: R27 (Vector Database Management)

/**
 * Supported embedding provider types
 * - local: Uses Transformers.js (DEFAULT, no API key required)
 * - openai: Uses OpenAI API (text-embedding-3-large)
 * - ollama: Uses local Ollama server
 * - custom: Custom endpoint implementation
 */
export type EmbeddingProviderType = 'local' | 'openai' | 'ollama' | 'custom';

/**
 * Configuration for OpenAI embedding provider
 */
export interface OpenAIEmbeddingConfig {
  /** Model to use (default: text-embedding-3-large) */
  model: string;
  /** Vector dimensions (default: 3072) */
  dimensions: number;
}

/**
 * Configuration for Ollama embedding provider
 */
export interface OllamaEmbeddingConfig {
  /** Model to use (default: nomic-embed-text) */
  model: string;
  /** Vector dimensions (default: 768) */
  dimensions: number;
  /** Ollama server URL (default: http://localhost:11434) */
  host: string;
}

/**
 * Configuration for custom embedding provider
 */
export interface CustomEmbeddingConfig {
  /** API endpoint URL */
  endpoint: string;
  /** Vector dimensions */
  dimensions: number;
  /** Optional headers for authentication */
  headers?: Record<string, string>;
}

/**
 * Main embedding configuration
 * Reference: data_schemas.md Section 6 (embedding_config)
 */
export interface EmbeddingConfig {
  /** Provider type (default: 'local') */
  provider: EmbeddingProviderType;
  /** Model identifier for the selected provider */
  model: string;
  /** Vector dimensions produced by the model */
  dimensions: number;
  /** Batch size for embedding multiple texts (default: 10) */
  batchSize: number;
  /** OpenAI-specific configuration */
  openaiConfig?: OpenAIEmbeddingConfig;
  /** Ollama-specific configuration */
  ollamaConfig?: OllamaEmbeddingConfig;
  /** Custom provider configuration */
  customConfig?: CustomEmbeddingConfig;
}

/**
 * Result from embedding a single text
 */
export interface EmbeddingResult {
  /** The embedding vector */
  embedding: number[];
  /** Model used to generate the embedding */
  model: string;
  /** Token count (if available from provider) */
  tokenCount?: number;
}

/**
 * Interface that all embedding providers must implement
 * Implements: AGENTS.md Article I (Library-First - clear interfaces)
 */
export interface IEmbeddingProvider {
  /** Provider name for identification */
  readonly name: string;
  /** Vector dimensions this provider produces */
  readonly dimensions: number;

  /**
   * Initialize the provider (load models, connect to services)
   * @throws Error if initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Generate embedding for a single text
   * @param text - Text to embed
   * @returns Embedding result with vector and metadata
   */
  embed(text: string): Promise<EmbeddingResult>;

  /**
   * Generate embeddings for multiple texts
   * @param texts - Array of texts to embed
   * @returns Array of embedding results
   */
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;

  /**
   * Check if the provider is available and properly configured
   * @returns true if provider can be used
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Default configuration values
 */
export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  provider: 'local',
  model: 'Xenova/all-MiniLM-L6-v2',
  dimensions: 384,
  batchSize: 10
};

/**
 * Provider-specific defaults
 */
export const PROVIDER_DEFAULTS = {
  local: {
    model: 'Xenova/all-MiniLM-L6-v2',
    dimensions: 384
  },
  openai: {
    model: 'text-embedding-3-large',
    dimensions: 3072
  },
  ollama: {
    model: 'nomic-embed-text',
    dimensions: 768,
    host: 'http://localhost:11434'
  }
} as const;
