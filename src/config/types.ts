// src/config/types.ts
// Configuration type definitions based on data_schemas.md Section 6

export type ModelMode = 'claude_only' | 'gemini_only' | 'hybrid' | 'offline';

export interface AgentModelConfig {
  provider: 'anthropic' | 'google' | 'ollama';
  model: string;
  temperature: number;
  maxTokens: number;
  thinkingBudget?: number;  // Only for Dr. Sterling
}

export interface ModelConfig {
  mode: ModelMode;
  drSterling: AgentModelConfig;
  contextFetcher: AgentModelConfig;
  deepResearcher: AgentModelConfig;
  analystAI: AgentModelConfig;
}

export interface SessionConfig {
  maxDurationMinutes: number;      // Default: 25 (from R1)
  warningAtMinutes: number;        // Default: 20 (from R1)
  minDurationMinutes: number;      // Default: 5
  autoSaveIntervalSeconds: number; // Default: 30 (from R1)
}

export interface AudioConfig {
  sampleRate: number;              // Default: 16000 (from R4)
  silenceThresholdMs: number;      // Default: 500 (from R4)
  maxSilenceSeconds: number;       // Default: 10 (from R4)
}

export interface PrivacyConfig {
  encryptionEnabled: boolean;      // Default: true (from R37)
  auditLoggingEnabled: boolean;    // Default: true (from R38)
  dataRetentionDays: number;       // Default: -1 (unlimited)
}

/**
 * Embedding provider configuration
 * Reference: data_schemas.md Section 6 (embedding_config)
 */
export type EmbeddingProviderType = 'local' | 'openai' | 'ollama' | 'custom';

export interface EmbeddingConfig {
  provider: EmbeddingProviderType;  // Default: 'local' (no API key required)
  model: string;                    // Default: 'Xenova/all-MiniLM-L6-v2'
  dimensions: number;               // Default: 384 (for local), 3072 (for OpenAI)
  batchSize: number;                // Default: 10
  openaiConfig?: {
    model: string;                  // Default: 'text-embedding-3-large'
    dimensions: number;             // Default: 3072
  };
  ollamaConfig?: {
    model: string;                  // Default: 'nomic-embed-text'
    dimensions: number;             // Default: 768
    host: string;                   // Default: 'http://localhost:11434'
  };
}

export interface AppConfig {
  version: string;
  modelConfig: ModelConfig;
  sessionConfig: SessionConfig;
  audioConfig: AudioConfig;
  privacyConfig: PrivacyConfig;
  embeddingConfig: EmbeddingConfig;
}

export interface EnvironmentVariables {
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  DEEPGRAM_API_KEY?: string;
  OPENAI_API_KEY?: string;  // For OpenAI embeddings (text-embedding-3-large)
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Embedding configuration (see src/embeddings/factory.ts)
  EMBEDDING_PROVIDER?: EmbeddingProviderType;  // Default: 'local'
  EMBEDDING_MODEL?: string;                     // Override default model
  EMBEDDING_DIMENSIONS?: string;                // Override default dimensions
  OLLAMA_HOST?: string;                         // Ollama server URL (default: http://localhost:11434)
}
