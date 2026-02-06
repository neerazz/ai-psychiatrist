import dotenv from 'dotenv';
import type { AIProvider, AudioProviderType, Config, TTSProvider } from './types.js';

dotenv.config();

function parseModel(modelStr: string): { provider: AIProvider; model: string } {
  const lower = modelStr.toLowerCase();

  if (lower.startsWith('claude')) {
    return { provider: 'anthropic', model: modelStr };
  }
  if (lower.startsWith('gpt')) {
    return { provider: 'openai', model: modelStr };
  }
  if (lower.startsWith('gemini')) {
    return { provider: 'google', model: modelStr };
  }

  // Default fallback
  return { provider: 'anthropic', model: modelStr };
}

export function loadConfig(): Config {
  const modelStr = process.env.AI_MODEL || 'claude-sonnet-4-5';
  const { provider, model } = parseModel(modelStr);

  return {
    provider,
    model,
    audioProvider: (process.env.AUDIO_PROVIDER || 'text') as AudioProviderType,
    whisperModel: process.env.WHISPER_MODEL || 'base',
    ttsProvider: (process.env.TTS_PROVIDER || 'say') as TTSProvider,
    externalContextPaths: (process.env.EXTERNAL_CONTEXT_PATHS || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean),
    dataDir: process.env.DATA_DIR || './data/sessions',
    apiKeys: {
      anthropic: process.env.ANTHROPIC_API_KEY || undefined,
      openai: process.env.OPENAI_API_KEY || undefined,
      google: process.env.GEMINI_API_KEY || undefined,
    },
  };
}
