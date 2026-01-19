// tests/embeddings/providers.test.ts
// Unit tests for embedding providers
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

import { LocalEmbeddingProvider } from '../../src/embeddings/providers/local.js';
import { OpenAIEmbeddingProvider } from '../../src/embeddings/providers/openai.js';
import { OllamaEmbeddingProvider } from '../../src/embeddings/providers/ollama.js';
import { PROVIDER_DEFAULTS } from '../../src/embeddings/types.js';

describe('Embedding Providers', () => {
  describe('LocalEmbeddingProvider', () => {
    let provider: LocalEmbeddingProvider;

    beforeEach(() => {
      provider = new LocalEmbeddingProvider();
    });

    describe('constructor', () => {
      it('should use default model and dimensions', () => {
        expect(provider.name).toBe('local');
        expect(provider.dimensions).toBe(PROVIDER_DEFAULTS.local.dimensions);
      });

      it('should accept custom model and dimensions', () => {
        const customProvider = new LocalEmbeddingProvider(
          'Xenova/bge-base-en-v1.5',
          768
        );

        expect(customProvider.dimensions).toBe(768);
      });
    });

    describe('getModelInfo()', () => {
      it('should return model info before initialization', () => {
        const info = provider.getModelInfo();

        expect(info.name).toBe(PROVIDER_DEFAULTS.local.model);
        expect(info.dimensions).toBe(PROVIDER_DEFAULTS.local.dimensions);
        expect(info.initialized).toBe(false);
      });
    });

    describe('isAvailable()', () => {
      it('should check if transformers.js is installed', async () => {
        // This will return true if @xenova/transformers is installed
        const available = await provider.isAvailable();
        expect(typeof available).toBe('boolean');
      });
    });

    // Note: Full initialization tests require the model to be downloaded
    // which takes time. These are integration tests.
    describe('embed() - not initialized', () => {
      it('should throw error when not initialized', async () => {
        await expect(provider.embed('test')).rejects.toThrow(
          'Local embedding provider not initialized'
        );
      });
    });

    describe('embedBatch() - not initialized', () => {
      it('should throw error when not initialized', async () => {
        await expect(provider.embedBatch(['test1', 'test2'])).rejects.toThrow(
          'Local embedding provider not initialized'
        );
      });
    });
  });

  describe('OpenAIEmbeddingProvider', () => {
    // Store original env
    const originalKey = process.env.OPENAI_API_KEY;

    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    afterAll(() => {
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    describe('constructor', () => {
      it('should use default config', () => {
        const provider = new OpenAIEmbeddingProvider();

        expect(provider.name).toBe('openai');
        expect(provider.dimensions).toBe(PROVIDER_DEFAULTS.openai.dimensions);
      });

      it('should accept custom config', () => {
        const provider = new OpenAIEmbeddingProvider({
          model: 'text-embedding-3-small',
          dimensions: 1536
        });

        expect(provider.dimensions).toBe(1536);
      });
    });

    describe('initialize() - without API key', () => {
      it('should throw error when OPENAI_API_KEY not set', async () => {
        const provider = new OpenAIEmbeddingProvider();

        await expect(provider.initialize()).rejects.toThrow(
          'OPENAI_API_KEY environment variable not set'
        );
      });
    });

    describe('isAvailable()', () => {
      it('should return false when API key not set', async () => {
        const provider = new OpenAIEmbeddingProvider();

        const available = await provider.isAvailable();
        expect(available).toBe(false);
      });

      it('should return true when API key is set', async () => {
        process.env.OPENAI_API_KEY = 'sk-test-key';
        const provider = new OpenAIEmbeddingProvider();

        const available = await provider.isAvailable();
        expect(available).toBe(true);
      });
    });

    describe('embed() - not initialized', () => {
      it('should throw error when not initialized', async () => {
        const provider = new OpenAIEmbeddingProvider();

        await expect(provider.embed('test')).rejects.toThrow(
          'OpenAI embedding provider not initialized'
        );
      });
    });

    describe('getModelInfo()', () => {
      it('should return model info', () => {
        const provider = new OpenAIEmbeddingProvider({
          model: 'text-embedding-3-small',
          dimensions: 1536
        });

        const info = provider.getModelInfo();

        expect(info.name).toBe('text-embedding-3-small');
        expect(info.dimensions).toBe(1536);
        expect(info.initialized).toBe(false);
      });
    });
  });

  describe('OllamaEmbeddingProvider', () => {
    describe('constructor', () => {
      it('should use default config', () => {
        const provider = new OllamaEmbeddingProvider();

        expect(provider.name).toBe('ollama');
        expect(provider.dimensions).toBe(PROVIDER_DEFAULTS.ollama.dimensions);
      });

      it('should accept custom config', () => {
        const provider = new OllamaEmbeddingProvider({
          model: 'mxbai-embed-large',
          dimensions: 1024,
          host: 'http://custom-host:11434'
        });

        expect(provider.dimensions).toBe(1024);
      });
    });

    describe('isAvailable()', () => {
      it('should return false when Ollama not running', async () => {
        // Use a port that's unlikely to have Ollama running
        const provider = new OllamaEmbeddingProvider({
          model: 'nomic-embed-text',
          dimensions: 768,
          host: 'http://localhost:99999'
        });

        const available = await provider.isAvailable();
        expect(available).toBe(false);
      });
    });

    describe('embed() - not initialized', () => {
      it('should throw error when not initialized', async () => {
        const provider = new OllamaEmbeddingProvider();

        await expect(provider.embed('test')).rejects.toThrow(
          'Ollama embedding provider not initialized'
        );
      });
    });

    describe('getModelInfo()', () => {
      it('should return model info including host', () => {
        const provider = new OllamaEmbeddingProvider({
          model: 'nomic-embed-text',
          dimensions: 768,
          host: 'http://custom:11434'
        });

        const info = provider.getModelInfo();

        expect(info.name).toBe('nomic-embed-text');
        expect(info.dimensions).toBe(768);
        expect(info.host).toBe('http://custom:11434');
        expect(info.initialized).toBe(false);
      });
    });

    describe('listModels() - Ollama not running', () => {
      it('should return empty array when Ollama not available', async () => {
        const provider = new OllamaEmbeddingProvider({
          model: 'nomic-embed-text',
          dimensions: 768,
          host: 'http://localhost:99999'
        });

        const models = await provider.listModels();
        expect(models).toEqual([]);
      });
    });
  });
});
