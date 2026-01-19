// tests/embeddings/types.test.ts
// Unit tests for embedding types and defaults
// Reference: data_schemas.md Section 6 (embedding_config)

import {
  EmbeddingProviderType,
  EmbeddingConfig,
  EmbeddingResult,
  IEmbeddingProvider,
  DEFAULT_EMBEDDING_CONFIG,
  PROVIDER_DEFAULTS
} from '../../src/embeddings/types.js';

describe('Embedding Types', () => {
  describe('EmbeddingProviderType', () => {
    it('should support local provider', () => {
      const type: EmbeddingProviderType = 'local';
      expect(type).toBe('local');
    });

    it('should support openai provider', () => {
      const type: EmbeddingProviderType = 'openai';
      expect(type).toBe('openai');
    });

    it('should support ollama provider', () => {
      const type: EmbeddingProviderType = 'ollama';
      expect(type).toBe('ollama');
    });

    it('should support custom provider', () => {
      const type: EmbeddingProviderType = 'custom';
      expect(type).toBe('custom');
    });
  });

  describe('DEFAULT_EMBEDDING_CONFIG', () => {
    it('should default to local provider', () => {
      expect(DEFAULT_EMBEDDING_CONFIG.provider).toBe('local');
    });

    it('should use correct default model', () => {
      expect(DEFAULT_EMBEDDING_CONFIG.model).toBe('Xenova/all-MiniLM-L6-v2');
    });

    it('should use correct default dimensions', () => {
      expect(DEFAULT_EMBEDDING_CONFIG.dimensions).toBe(384);
    });

    it('should use correct default batch size', () => {
      expect(DEFAULT_EMBEDDING_CONFIG.batchSize).toBe(10);
    });
  });

  describe('PROVIDER_DEFAULTS', () => {
    describe('local provider defaults', () => {
      it('should have correct model', () => {
        expect(PROVIDER_DEFAULTS.local.model).toBe('Xenova/all-MiniLM-L6-v2');
      });

      it('should have correct dimensions', () => {
        expect(PROVIDER_DEFAULTS.local.dimensions).toBe(384);
      });
    });

    describe('openai provider defaults', () => {
      it('should have correct model', () => {
        expect(PROVIDER_DEFAULTS.openai.model).toBe('text-embedding-3-large');
      });

      it('should have correct dimensions', () => {
        expect(PROVIDER_DEFAULTS.openai.dimensions).toBe(3072);
      });
    });

    describe('ollama provider defaults', () => {
      it('should have correct model', () => {
        expect(PROVIDER_DEFAULTS.ollama.model).toBe('nomic-embed-text');
      });

      it('should have correct dimensions', () => {
        expect(PROVIDER_DEFAULTS.ollama.dimensions).toBe(768);
      });

      it('should have correct host', () => {
        expect(PROVIDER_DEFAULTS.ollama.host).toBe('http://localhost:11434');
      });
    });
  });

  describe('EmbeddingConfig interface', () => {
    it('should create valid config with all fields', () => {
      const config: EmbeddingConfig = {
        provider: 'openai',
        model: 'text-embedding-3-small',
        dimensions: 1536,
        batchSize: 20,
        openaiConfig: {
          model: 'text-embedding-3-small',
          dimensions: 1536
        }
      };

      expect(config.provider).toBe('openai');
      expect(config.dimensions).toBe(1536);
      expect(config.openaiConfig?.model).toBe('text-embedding-3-small');
    });

    it('should allow optional provider-specific configs', () => {
      const config: EmbeddingConfig = {
        provider: 'local',
        model: 'Xenova/all-MiniLM-L6-v2',
        dimensions: 384,
        batchSize: 10
        // No openaiConfig, ollamaConfig, or customConfig
      };

      expect(config.openaiConfig).toBeUndefined();
      expect(config.ollamaConfig).toBeUndefined();
      expect(config.customConfig).toBeUndefined();
    });
  });

  describe('EmbeddingResult interface', () => {
    it('should create valid result with required fields', () => {
      const result: EmbeddingResult = {
        embedding: [0.1, 0.2, 0.3],
        model: 'test-model'
      };

      expect(result.embedding).toHaveLength(3);
      expect(result.model).toBe('test-model');
      expect(result.tokenCount).toBeUndefined();
    });

    it('should allow optional tokenCount', () => {
      const result: EmbeddingResult = {
        embedding: [0.1, 0.2, 0.3],
        model: 'test-model',
        tokenCount: 5
      };

      expect(result.tokenCount).toBe(5);
    });
  });

  describe('IEmbeddingProvider interface', () => {
    it('should define required methods', () => {
      // Type check that interface has required properties
      const providerMethods: Array<keyof IEmbeddingProvider> = [
        'name',
        'dimensions',
        'initialize',
        'embed',
        'embedBatch',
        'isAvailable'
      ];

      expect(providerMethods).toHaveLength(6);
    });
  });
});
