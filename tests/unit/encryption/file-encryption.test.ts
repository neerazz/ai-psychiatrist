// tests/unit/encryption/file-encryption.test.ts
// Unit tests for File Encryption
// Reference: Task 3.4 verification

import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { encryptionManager } from '../../../src/encryption/encryption-manager.js';
import {
  encryptFile,
  decryptFile,
  decryptJSONFile,
  encryptedFileExists
} from '../../../src/encryption/file-encryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = path.join(__dirname, '../../../memory_directory/test-encryption');
const TEST_FILE = path.join(TEST_DIR, 'test-patient.json');
const TEST_PATIENT_ID = 'test-patient-123';

describe('File Encryption', () => {
  beforeAll(async () => {
    // Initialize encryption manager with test key
    const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    encryptionManager.initialize(testKey);

    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
      await fs.mkdir(TEST_DIR, { recursive: true });
    } catch {
      // Ignore errors
    }
  });

  describe('encryptFile', () => {
    it('should encrypt and save string data', async () => {
      const testData = 'This is sensitive patient data';

      await encryptFile(TEST_PATIENT_ID, TEST_FILE, testData);

      // Verify file exists
      const exists = await encryptedFileExists(TEST_FILE);
      expect(exists).toBe(true);

      // Verify file content is encrypted (not plaintext)
      const fileContent = await fs.readFile(TEST_FILE, 'utf-8');
      expect(fileContent).not.toContain(testData);
      expect(fileContent).toContain('"encrypted"');
    });

    it('should encrypt and save object data', async () => {
      const testData = {
        name: 'John Doe',
        age: 35,
        diagnosis: 'Anxiety'
      };

      await encryptFile(TEST_PATIENT_ID, TEST_FILE, testData);

      // Verify file exists
      const exists = await encryptedFileExists(TEST_FILE);
      expect(exists).toBe(true);

      // Verify file content is encrypted
      const fileContent = await fs.readFile(TEST_FILE, 'utf-8');
      expect(fileContent).not.toContain('John Doe');
    });

    it('should include patient ID in encrypted file', async () => {
      const testData = 'Test data';

      await encryptFile(TEST_PATIENT_ID, TEST_FILE, testData);

      const fileContent = await fs.readFile(TEST_FILE, 'utf-8');
      const parsed = JSON.parse(fileContent);

      expect(parsed.patientId).toBe(TEST_PATIENT_ID);
    });
  });

  describe('decryptFile', () => {
    it('should decrypt string data', async () => {
      const testData = 'This is sensitive patient data';

      await encryptFile(TEST_PATIENT_ID, TEST_FILE, testData);
      const decrypted = await decryptFile(TEST_PATIENT_ID, TEST_FILE);

      expect(decrypted).toBe(testData);
    });

    it('should throw error with wrong patient ID', async () => {
      const testData = 'Test data';

      await encryptFile(TEST_PATIENT_ID, TEST_FILE, testData);

      await expect(
        decryptFile('wrong-patient-id', TEST_FILE)
      ).rejects.toThrow('Patient ID mismatch');
    });
  });

  describe('decryptJSONFile', () => {
    it('should decrypt and parse JSON data', async () => {
      const testData = {
        name: 'John Doe',
        age: 35,
        diagnosis: 'Anxiety'
      };

      await encryptFile(TEST_PATIENT_ID, TEST_FILE, testData);
      const decrypted = await decryptJSONFile(TEST_PATIENT_ID, TEST_FILE);

      expect(decrypted).toEqual(testData);
    });
  });

  describe('encryptedFileExists', () => {
    it('should return true for existing file', async () => {
      await encryptFile(TEST_PATIENT_ID, TEST_FILE, 'test');

      const exists = await encryptedFileExists(TEST_FILE);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const exists = await encryptedFileExists(path.join(TEST_DIR, 'nonexistent.json'));
      expect(exists).toBe(false);
    });
  });
});
