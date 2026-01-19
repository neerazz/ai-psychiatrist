// src/embeddings/index.ts
// Main entry point for the embedding system
// Implements: R27-R28 (Vector Database Management)

// Export types
export * from './types.js';

// Export providers
export * from './providers/index.js';

// Export factory
export {
  EmbeddingProviderFactory,
  createEmbeddingProvider,
  createEmbeddingProviderFromEnv
} from './factory.js';
