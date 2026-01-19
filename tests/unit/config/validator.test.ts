// tests/unit/config/validator.test.ts
// Unit tests for configuration validation
// Reference: AGENTS.md Article III (Test-First Imperative)

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  validateEnvironment,
  validateSessionConfig,
  validateAudioConfig,
  validatePrivacyConfig,
  validateHardwareRequirements,
  validateConfiguration,
  sessionConfigSchema,
  audioConfigSchema,
  privacyConfigSchema
} from '../../../src/config/validator.js';

describe('Configuration Validator', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should pass validation with valid API keys', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';

      const result = validateEnvironment();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when no AI API keys are present (offline mode)', () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GEMINI_API_KEY;
      process.env.NODE_ENV = 'development';

      const result = validateEnvironment();
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('OFFLINE mode')
      );
    });

    it('should warn when OPENAI_API_KEY is missing', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      delete process.env.OPENAI_API_KEY;

      const result = validateEnvironment();
      expect(result.warnings).toContain(
        expect.stringContaining('OPENAI_API_KEY not found')
      );
    });

    it('should warn when speech API keys are missing', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      delete process.env.DEEPGRAM_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const result = validateEnvironment();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateSessionConfig', () => {
    it('should validate correct session configuration', () => {
      const config = {
        maxDurationMinutes: 25,
        warningAtMinutes: 20,
        minDurationMinutes: 5,
        autoSaveIntervalSeconds: 30
      };

      const result = validateSessionConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when warning time >= max duration', () => {
      const config = {
        maxDurationMinutes: 25,
        warningAtMinutes: 25,  // Invalid: equal to max
        minDurationMinutes: 5,
        autoSaveIntervalSeconds: 30
      };

      const result = validateSessionConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid duration values', () => {
      const config = {
        maxDurationMinutes: 100,  // Too high (max 60)
        warningAtMinutes: 20,
        minDurationMinutes: 5,
        autoSaveIntervalSeconds: 30
      };

      const result = validateSessionConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAudioConfig', () => {
    it('should validate correct audio configuration', () => {
      const config = {
        sampleRate: 16000,
        silenceThresholdMs: 500,
        maxSilenceSeconds: 10
      };

      const result = validateAudioConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-16000 sample rate', () => {
      const config = {
        sampleRate: 44100,  // Invalid: must be 16000
        silenceThresholdMs: 500,
        maxSilenceSeconds: 10
      };

      const result = validateAudioConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid silence threshold', () => {
      const config = {
        sampleRate: 16000,
        silenceThresholdMs: 50,  // Too low (min 100)
        maxSilenceSeconds: 10
      };

      const result = validateAudioConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePrivacyConfig', () => {
    it('should validate correct privacy configuration', () => {
      const config = {
        encryptionEnabled: true,
        auditLoggingEnabled: true,
        dataRetentionDays: -1
      };

      const result = validatePrivacyConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid retention days', () => {
      const config = {
        encryptionEnabled: true,
        auditLoggingEnabled: true,
        dataRetentionDays: 365
      };

      const result = validatePrivacyConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateHardwareRequirements', () => {
    it('should return hardware check with valid structure', () => {
      const result = validateHardwareRequirements();

      expect(result).toHaveProperty('cpuCores');
      expect(result).toHaveProperty('memoryGB');
      expect(result).toHaveProperty('gpuVRAMGB');
      expect(result).toHaveProperty('recommendedMode');
      expect(result).toHaveProperty('warnings');

      expect(typeof result.cpuCores).toBe('number');
      expect(typeof result.memoryGB).toBe('number');
      expect(result.cpuCores).toBeGreaterThan(0);
      expect(result.memoryGB).toBeGreaterThan(0);
    });

    it('should recommend appropriate mode based on hardware', () => {
      const result = validateHardwareRequirements();

      const validModes = ['online_only', 'hybrid', 'full_offline', 'insufficient'];
      expect(validModes).toContain(result.recommendedMode);
    });
  });

  describe('validateConfiguration', () => {
    it('should return comprehensive validation results', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      process.env.NODE_ENV = 'development';

      const result = await validateConfiguration();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('details');
      expect(result.details).toHaveProperty('environment');
      expect(result.details).toHaveProperty('hardware');
    });
  });

  describe('Zod Schemas', () => {
    it('sessionConfigSchema should have correct defaults', () => {
      const result = sessionConfigSchema.parse({});
      expect(result.maxDurationMinutes).toBe(25);
      expect(result.warningAtMinutes).toBe(20);
      expect(result.minDurationMinutes).toBe(5);
      expect(result.autoSaveIntervalSeconds).toBe(30);
    });

    it('audioConfigSchema should enforce 16kHz sample rate', () => {
      const result = audioConfigSchema.parse({
        sampleRate: 16000,
        silenceThresholdMs: 500,
        maxSilenceSeconds: 10
      });
      expect(result.sampleRate).toBe(16000);
    });

    it('privacyConfigSchema should have correct defaults', () => {
      const result = privacyConfigSchema.parse({});
      expect(result.encryptionEnabled).toBe(true);
      expect(result.auditLoggingEnabled).toBe(true);
      expect(result.dataRetentionDays).toBe(-1);
    });
  });
});
