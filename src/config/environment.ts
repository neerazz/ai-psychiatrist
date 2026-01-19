// src/config/environment.ts
// Environment loader and configuration validator
// Reference: agent_protocols.md Section 5.1 for model selection logic

import dotenv from 'dotenv';
import path from 'path';
import {
  EnvironmentVariables,
  AppConfig,
  ModelMode,
  ModelConfig,
  AgentModelConfig,
  EmbeddingConfig,
  EmbeddingProviderType
} from './types.js';

// Load .env file
dotenv.config();

/**
 * Loads and validates environment variables
 * @throws Error if required variables are missing in production
 */
export function loadEnvironment(): EnvironmentVariables {
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    // Embedding configuration
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER as EmbeddingProviderType | undefined,
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS: process.env.EMBEDDING_DIMENSIONS,
    OLLAMA_HOST: process.env.OLLAMA_HOST
  };
}

/**
 * Determines the model mode based on available API keys
 * Reference: Requirements R20 (Smart Model Orchestration)
 * Priority: ANTHROPIC_API_KEY, then GEMINI_API_KEY, then offline
 */
export function determineModelMode(env: EnvironmentVariables): ModelMode {
  const hasAnthropic = !!env.ANTHROPIC_API_KEY;
  const hasGemini = !!env.GEMINI_API_KEY;

  if (hasAnthropic && hasGemini) {
    return 'hybrid';
  } else if (hasAnthropic) {
    return 'claude_only';
  } else if (hasGemini) {
    return 'gemini_only';
  } else {
    return 'offline';
  }
}

/**
 * Generates model configuration based on detected mode
 * Reference: agent_protocols.md Section 5.1, Requirements R21
 *
 * Model Parameters (from Requirements R21):
 * - Dr. Sterling: temperature 0.25, top-p 0.9, thinking budget 32768
 * - Context Fetcher: temperature 0.1, top-p 0.8
 * - Deep Researcher: temperature 0.3, top-p 0.9
 * - Analyst AI: temperature 0.2, top-p 0.85
 */
export function generateModelConfig(mode: ModelMode): ModelConfig {
  switch (mode) {
    case 'hybrid':
      // Claude for Dr. Sterling, Gemini for support agents
      return {
        mode: 'hybrid',
        drSterling: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-5-20241022',
          temperature: 0.25,
          maxTokens: 2048,
          thinkingBudget: 32768
        },
        contextFetcher: {
          provider: 'google',
          model: 'gemini-1.5-flash',
          temperature: 0.1,
          maxTokens: 1024
        },
        deepResearcher: {
          provider: 'google',
          model: 'gemini-1.5-pro',
          temperature: 0.3,
          maxTokens: 4096
        },
        analystAI: {
          provider: 'google',
          model: 'gemini-1.5-pro',
          temperature: 0.2,
          maxTokens: 2048
        }
      };

    case 'claude_only':
      return {
        mode: 'claude_only',
        drSterling: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-5-20241022',
          temperature: 0.25,
          maxTokens: 2048,
          thinkingBudget: 32768
        },
        contextFetcher: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-5-20241022',
          temperature: 0.1,
          maxTokens: 1024
        },
        deepResearcher: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-5-20241022',
          temperature: 0.3,
          maxTokens: 4096
        },
        analystAI: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-5-20241022',
          temperature: 0.2,
          maxTokens: 2048
        }
      };

    case 'gemini_only':
      return {
        mode: 'gemini_only',
        drSterling: {
          provider: 'google',
          model: 'gemini-1.5-pro',
          temperature: 0.35,  // Slightly higher for Gemini
          maxTokens: 2048
        },
        contextFetcher: {
          provider: 'google',
          model: 'gemini-1.5-flash',
          temperature: 0.1,
          maxTokens: 1024
        },
        deepResearcher: {
          provider: 'google',
          model: 'gemini-1.5-pro',
          temperature: 0.4,
          maxTokens: 4096
        },
        analystAI: {
          provider: 'google',
          model: 'gemini-1.5-pro',
          temperature: 0.25,
          maxTokens: 2048
        }
      };

    case 'offline':
    default:
      // Ollama local models
      return {
        mode: 'offline',
        drSterling: {
          provider: 'ollama',
          model: 'llama3:70b-instruct-q4_K_M',
          temperature: 0.3,
          maxTokens: 2048
        },
        contextFetcher: {
          provider: 'ollama',
          model: 'mistral:7b-instruct-q4_K_M',
          temperature: 0.1,
          maxTokens: 1024
        },
        deepResearcher: {
          provider: 'ollama',
          model: 'llama3:8b-instruct-q4_K_M',
          temperature: 0.4,
          maxTokens: 2048
        },
        analystAI: {
          provider: 'ollama',
          model: 'mistral:7b-instruct-q4_K_M',
          temperature: 0.2,
          maxTokens: 1024
        }
      };
  }
}

/**
 * Generates embedding configuration based on environment variables
 * Reference: data_schemas.md Section 6 (embedding_config)
 */
export function generateEmbeddingConfig(env: EnvironmentVariables): EmbeddingConfig {
  const provider = (env.EMBEDDING_PROVIDER || 'local') as EmbeddingProviderType;
  const model = env.EMBEDDING_MODEL;
  const dimensions = env.EMBEDDING_DIMENSIONS
    ? parseInt(env.EMBEDDING_DIMENSIONS, 10)
    : undefined;

  // Default configurations per provider
  const providerDefaults = {
    local: { model: 'Xenova/all-MiniLM-L6-v2', dimensions: 384 },
    openai: { model: 'text-embedding-3-large', dimensions: 3072 },
    ollama: { model: 'nomic-embed-text', dimensions: 768 }
  };

  const defaults = providerDefaults[provider as keyof typeof providerDefaults]
    || providerDefaults.local;

  return {
    provider,
    model: model || defaults.model,
    dimensions: dimensions || defaults.dimensions,
    batchSize: 10,
    ...(provider === 'openai' && {
      openaiConfig: {
        model: model || 'text-embedding-3-large',
        dimensions: dimensions || 3072
      }
    }),
    ...(provider === 'ollama' && {
      ollamaConfig: {
        model: model || 'nomic-embed-text',
        dimensions: dimensions || 768,
        host: env.OLLAMA_HOST || 'http://localhost:11434'
      }
    })
  };
}

/**
 * Creates the complete application configuration
 */
export function createAppConfig(env: EnvironmentVariables): AppConfig {
  const mode = determineModelMode(env);

  return {
    version: '1.0.0',
    modelConfig: generateModelConfig(mode),
    sessionConfig: {
      maxDurationMinutes: 25,        // R1: Session ends at 25 min
      warningAtMinutes: 20,          // R1: Warning at 20 min
      minDurationMinutes: 5,         // R1: Min session duration
      autoSaveIntervalSeconds: 30    // R1: Persist state every 30s
    },
    audioConfig: {
      sampleRate: 16000,             // R4: 16kHz sample rate
      silenceThresholdMs: 500,       // R4: VAD threshold
      maxSilenceSeconds: 10          // R4: Prompt after 10s silence
    },
    privacyConfig: {
      encryptionEnabled: true,       // R37: AES-256-GCM encryption
      auditLoggingEnabled: true,     // R38: Audit logging
      dataRetentionDays: -1          // Unlimited retention
    },
    embeddingConfig: generateEmbeddingConfig(env)
  };
}

// Export singleton instance
const env = loadEnvironment();
export const appConfig = createAppConfig(env);
export const environmentVariables = env;

/**
 * Get convenient access to configuration values
 */
export function getConfig(): {
  anthropicApiKey: string | undefined;
  geminiApiKey: string | undefined;
  openaiApiKey: string | undefined;
  nodeEnv: string;
  port: number;
  modelMode: ModelMode;
} {
  return {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    geminiApiKey: env.GEMINI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    modelMode: appConfig.modelConfig.mode
  };
}

