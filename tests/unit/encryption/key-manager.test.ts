// tests/unit/encryption/key-manager.test.ts
// Unit tests for Key Manager
// Reference: Task 3.2 verification

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { KeyManager } from '../../../src/encryption/key-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_KEY_FILE = path.join(__dirname, '../../../memory_directory/config/encryption.key.enc');

describe('KeyManager', () => {
  let keyManager: KeyManager;

  beforeEach(() => {
    keyManager = new KeyManager();
  });

  afterEach(async () => {
    // Clean up test key file
    try {
      await fs.unlink(TEST_KEY_FILE);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('initialize', () => {
    it('should initialize with environment variable', async () => {
      const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.MASTER_ENCRYPTION_KEY = testKey;

      await keyManager.initialize();

      expect(keyManager.isInitialized()).toBe(true);

      delete process.env.MASTER_ENCRYPTION_KEY;
    });

    it('should generate and save new key if none exists', async () => {
      delete process.env.MASTER_ENCRYPTION_KEY;

      await keyManager.initialize();

      expect(keyManager.isInitialized()).toBe(true);

      // Verify key file was created
      const keyExists = await fs.access(TEST_KEY_FILE).then(() => true).catch(() => false);
      expect(keyExists).toBe(true);
    });

    it('should load existing key from file', async () => {
      delete process.env.MASTER_ENCRYPTION_KEY;

      // First initialization creates the key
      await keyManager.initialize();
      const firstKeyManager = keyManager;

      // Second initialization should load the same key
      const secondKeyManager = new KeyManager();
      await secondKeyManager.initialize();

      expect(secondKeyManager.isInitialized()).toBe(true);
    });
  });

  describe('generatePatientKeyId', () => {
    it('should generate a 32-character hex string', () => {
      const keyId = keyManager.generatePatientKeyId();

      expect(keyId).toHaveLength(32);
      expect(keyId).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate unique key IDs', () => {
      const keyId1 = keyManager.generatePatientKeyId();
      const keyId2 = keyManager.generatePatientKeyId();

      expect(keyId1).not.toBe(keyId2);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(keyManager.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.MASTER_ENCRYPTION_KEY = testKey;

      await keyManager.initialize();

      expect(keyManager.isInitialized()).toBe(true);

      delete process.env.MASTER_ENCRYPTION_KEY;
    });
  });
});
