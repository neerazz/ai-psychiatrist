// tests/embeddings/factory.test.ts
// Unit tests for EmbeddingProviderFactory
// Reference: AGENTS.md Article III (Test-First)

// Mock the logger to avoid ESM issues
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import {
  EmbeddingProviderFactory,
  createEmbeddingProvider,
  createEmbeddingProviderFromEnv
} from '../../src/embeddings/factory.js';
import { LocalEmbeddingProvider } from '../../src/embeddings/providers/local.js';
import { OpenAIEmbeddingProvider } from '../../src/embeddings/providers/openai.js';
import { OllamaEmbeddingProvider } from '../../src/embeddings/providers/ollama.js';
import { PROVIDER_DEFAULTS } from '../../src/embeddings/types.js';

describe('EmbeddingProviderFactory', () => {
  // Store original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('create()', () => {
    describe('default behavior', () => {
      it('should create LocalEmbeddingProvider by default', () => {
        const provider = EmbeddingProviderFactory.create();

        expect(provider).toBeInstanceOf(LocalEmbeddingProvider);
        expect(provider.name).toBe('local');
        expect(provider.dimensions).toBe(384);
      });

      it('should use default config when no config provided', () => {
        const provider = EmbeddingProviderFactory.create({});

        expect(provider).toBeInstanceOf(LocalEmbeddingProvider);
      });
    });

    describe('local provider', () => {
      it('should create LocalEmbeddingProvider with explicit config', () => {
        const provider = EmbeddingProviderFactory.create({
          provider: 'local',
          model: 'Xenova/bge-small-en-v1.5',
          dimensions: 384
        });

        expect(provider).toBeInstanceOf(LocalEmbeddingProvider);
        expect(provider.dimensions).toBe(384);
      });

      it('should use provider defaults when not specified', () => {
        const provider = EmbeddingProviderFactory.create({
          provider: 'local'
        });

        expect(provider.dimensions).toBe(PROVIDER_DEFAULTS.local.dimensions);
      });
    });

    describe('openai provider', () => {
      it('should create OpenAIEmbeddingProvider', () => {
        const provider = EmbeddingProviderFactory.create({
          provider: 'openai'
        });

        expect(provider).toBeInstanceOf(OpenAIEmbeddingProvider);
        expect(provider.name).toBe('openai');
        expect(provider.dimensions).toBe(PROVIDER_DEFAULTS.openai.dimensions);
      });

      it('should use custom openai config when provided', () => {
        const provider = EmbeddingProviderFactory.create({
          provider: 'openai',
          openaiConfig: {
            model: 'text-embedding-3-small',
            dimensions: 1536
          }
        });

        expect(provider.dimensions).toBe(1536);
      });
    });

    describe('ollama provider', () => {
      it('should create OllamaEmbeddingProvider', () => {
        const provider = EmbeddingProviderFactory.create({
          provider: 'ollama'
        });

        expect(provider).toBeInstanceOf(OllamaEmbeddingProvider);
        expect(provider.name).toBe('ollama');
        expect(provider.dimensions).toBe(PROVIDER_DEFAULTS.ollama.dimensions);
      });

      it('should use custom ollama config when provided', () => {
        const provider = EmbeddingProviderFactory.create({
          provider: 'ollama',
          ollamaConfig: {
            model: 'mxbai-embed-large',
            dimensions: 1024,
            host: 'http://custom-host:11434'
          }
        });

        expect(provider.dimensions).toBe(1024);
      });
    });

    describe('custom provider', () => {
      it('should throw error for custom provider', () => {
        expect(() => {
          EmbeddingProviderFactory.create({
            provider: 'custom'
          });
        }).toThrow('Custom provider requires manual implementation');
      });
    });

    describe('unknown provider', () => {
      it('should throw error for unknown provider', () => {
        expect(() => {
          EmbeddingProviderFactory.create({
            provider: 'unknown' as any
          });
        }).toThrow('Unknown embedding provider: unknown');
      });
    });
  });

  describe('createFromEnv()', () => {
    it('should create local provider when no env var set', () => {
      delete process.env.EMBEDDING_PROVIDER;

      const provider = EmbeddingProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(LocalEmbeddingProvider);
    });

    it('should create provider based on EMBEDDING_PROVIDER env var', () => {
      process.env.EMBEDDING_PROVIDER = 'openai';

      const provider = EmbeddingProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(OpenAIEmbeddingProvider);
    });

    it('should use EMBEDDING_MODEL env var when set', () => {
      process.env.EMBEDDING_PROVIDER = 'ollama';
      process.env.EMBEDDING_MODEL = 'custom-model';
      process.env.OLLAMA_HOST = 'http://localhost:11434';

      const provider = EmbeddingProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(OllamaEmbeddingProvider);
    });

    it('should use EMBEDDING_DIMENSIONS env var when set', () => {
      process.env.EMBEDDING_PROVIDER = 'openai';
      process.env.EMBEDDING_DIMENSIONS = '1536';

      const provider = EmbeddingProviderFactory.createFromEnv();

      expect(provider.dimensions).toBe(1536);
    });

    it('should use OLLAMA_HOST env var for ollama provider', () => {
      process.env.EMBEDDING_PROVIDER = 'ollama';
      process.env.OLLAMA_HOST = 'http://custom-host:11434';

      const provider = EmbeddingProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(OllamaEmbeddingProvider);
    });
  });

  describe('getProviderDefaults()', () => {
    it('should return local defaults', () => {
      const defaults = EmbeddingProviderFactory.getProviderDefaults('local');

      expect(defaults.model).toBe(PROVIDER_DEFAULTS.local.model);
      expect(defaults.dimensions).toBe(PROVIDER_DEFAULTS.local.dimensions);
    });

    it('should return openai defaults', () => {
      const defaults = EmbeddingProviderFactory.getProviderDefaults('openai');

      expect(defaults.model).toBe(PROVIDER_DEFAULTS.openai.model);
      expect(defaults.dimensions).toBe(PROVIDER_DEFAULTS.openai.dimensions);
    });

    it('should return ollama defaults', () => {
      const defaults = EmbeddingProviderFactory.getProviderDefaults('ollama');

      expect(defaults.model).toBe(PROVIDER_DEFAULTS.ollama.model);
      expect(defaults.dimensions).toBe(PROVIDER_DEFAULTS.ollama.dimensions);
    });

    it('should return local defaults for unknown provider', () => {
      const defaults = EmbeddingProviderFactory.getProviderDefaults('unknown' as any);

      expect(defaults.model).toBe(PROVIDER_DEFAULTS.local.model);
    });
  });

  describe('getAvailableProviders()', () => {
    it('should return all available provider types', () => {
      const providers = EmbeddingProviderFactory.getAvailableProviders();

      expect(providers).toContain('local');
      expect(providers).toContain('openai');
      expect(providers).toContain('ollama');
      expect(providers).toContain('custom');
      expect(providers).toHaveLength(4);
    });
  });

  describe('convenience exports', () => {
    it('should export createEmbeddingProvider function', () => {
      expect(typeof createEmbeddingProvider).toBe('function');
    });

    it('should export createEmbeddingProviderFromEnv function', () => {
      expect(typeof createEmbeddingProviderFromEnv).toBe('function');
    });

    it('createEmbeddingProvider should work same as factory method', () => {
      const provider = createEmbeddingProvider({ provider: 'local' });

      expect(provider).toBeInstanceOf(LocalEmbeddingProvider);
    });
  });
});
