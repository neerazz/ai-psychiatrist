// src/config/validator.ts
// Configuration validation using Zod schemas
// Reference: data_schemas.md Section 6, Requirements R41

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import os from 'os';

/**
 * Environment variables schema
 * Validates API keys and required environment variables
 */
export const environmentSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000)
});

/**
 * Session configuration schema
 * Reference: Requirements R1 (Session lifecycle)
 */
export const sessionConfigSchema = z.object({
  maxDurationMinutes: z.number().min(5).max(60).default(25),
  warningAtMinutes: z.number().min(1).max(59).default(20),
  minDurationMinutes: z.number().min(1).max(30).default(5),
  autoSaveIntervalSeconds: z.number().min(10).max(120).default(30)
}).refine(
  (data) => data.warningAtMinutes < data.maxDurationMinutes,
  { message: 'Warning time must be less than max duration' }
);

/**
 * Audio configuration schema
 * Reference: Requirements R4-R5 (Speech processing)
 */
export const audioConfigSchema = z.object({
  sampleRate: z.literal(16000),  // Must be 16kHz per spec
  silenceThresholdMs: z.number().min(100).max(2000).default(500),
  maxSilenceSeconds: z.number().min(5).max(30).default(10)
});

/**
 * Privacy configuration schema
 * Reference: Requirements R37-R38 (Encryption and Audit Logging)
 */
export const privacyConfigSchema = z.object({
  encryptionEnabled: z.boolean().default(true),
  auditLoggingEnabled: z.boolean().default(true),
  dataRetentionDays: z.number().default(-1)  // -1 means unlimited
});

/**
 * Hardware requirements validation
 * Reference: Requirements R41 (minimum hardware requirements)
 *
 * Mode requirements:
 * - Online Only: 4 cores, 8GB RAM
 * - Hybrid: 6 cores, 16GB RAM
 * - Full Offline: 8 cores, 32GB RAM, GPU 12GB+
 */
export interface HardwareCheck {
  cpuCores: number;
  memoryGB: number;
  gpuVRAMGB: number | null;
  recommendedMode: 'online_only' | 'hybrid' | 'full_offline' | 'insufficient';
  warnings: string[];
}

/**
 * Validates hardware requirements and recommends operating mode
 */
export function validateHardwareRequirements(): HardwareCheck {
  const cpuCores = os.cpus().length;
  const memoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));

  // GPU detection is platform-specific - simplified check
  // In production, use a library like 'systeminformation'
  const gpuVRAMGB: number | null = null;  // Placeholder

  const warnings: string[] = [];
  let recommendedMode: HardwareCheck['recommendedMode'];

  if (cpuCores >= 8 && memoryGB >= 32) {
    recommendedMode = 'full_offline';
    if (!gpuVRAMGB || gpuVRAMGB < 12) {
      warnings.push('GPU with 12GB+ VRAM recommended for full offline mode');
    }
  } else if (cpuCores >= 6 && memoryGB >= 16) {
    recommendedMode = 'hybrid';
  } else if (cpuCores >= 4 && memoryGB >= 8) {
    recommendedMode = 'online_only';
  } else {
    recommendedMode = 'insufficient';
    warnings.push(`Minimum requirements not met. Need: 4 cores, 8GB RAM. Have: ${cpuCores} cores, ${memoryGB}GB RAM`);
  }

  return { cpuCores, memoryGB, gpuVRAMGB, recommendedMode, warnings };
}

/**
 * Validates environment variables
 * Returns validation result with errors if any
 */
export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    environmentSchema.parse({
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`));
    }
  }

  // Check for AI API keys - warn if missing (offline mode)
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  
  if (!hasAnthropic && !hasGemini) {
    warnings.push('No AI API keys found (ANTHROPIC_API_KEY or GEMINI_API_KEY). System will run in OFFLINE mode with local models.');
  }

  // Check for embedding API key
  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not found. Vector embeddings will be unavailable.');
  }

  // Check for speech API keys
  if (!process.env.DEEPGRAM_API_KEY) {
    warnings.push('DEEPGRAM_API_KEY not found. Will use offline STT (Whisper).');
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    warnings.push('ELEVENLABS_API_KEY not found. Will use offline TTS.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates session configuration
 */
export function validateSessionConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    sessionConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`));
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates audio configuration
 */
export function validateAudioConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    audioConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`));
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates privacy configuration
 */
export function validatePrivacyConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    privacyConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`));
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Runs complete startup validation
 * Reference: Requirements R41 (validate all components and report status)
 */
export async function runStartupValidation(): Promise<{
  success: boolean;
  envValid: boolean;
  hardwareCheck: HardwareCheck;
  errors: string[];
  warnings: string[];
}> {
  logger.info('Running startup validation...');

  const envResult = validateEnvironment();
  const hardwareCheck = validateHardwareRequirements();

  const allErrors = [
    ...envResult.errors
  ];

  const allWarnings = [
    ...envResult.warnings,
    ...hardwareCheck.warnings
  ];

  const success = envResult.valid && hardwareCheck.recommendedMode !== 'insufficient';

  if (success) {
    logger.info('Startup validation passed', {
      mode: hardwareCheck.recommendedMode,
      cpuCores: hardwareCheck.cpuCores,
      memoryGB: hardwareCheck.memoryGB
    });

    if (allWarnings.length > 0) {
      logger.warn('Startup validation warnings:', { warnings: allWarnings });
    }
  } else {
    logger.error('Startup validation failed', { errors: allErrors });
  }

  return {
    success,
    envValid: envResult.valid,
    hardwareCheck,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Validates complete application configuration
 * Logs validation results and returns validated config
 */
export async function validateConfiguration(): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    environment: { valid: boolean; errors: string[]; warnings: string[] };
    hardware: HardwareCheck;
  };
}> {
  const envResult = validateEnvironment();
  const hardwareCheck = validateHardwareRequirements();

  const allErrors = [...envResult.errors];
  const allWarnings = [...envResult.warnings, ...hardwareCheck.warnings];

  const valid = envResult.valid && hardwareCheck.recommendedMode !== 'insufficient';

  return {
    valid,
    errors: allErrors,
    warnings: allWarnings,
    details: {
      environment: envResult,
      hardware: hardwareCheck
    }
  };
}
