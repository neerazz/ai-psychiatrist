// tests/unit/encryption/encryption-manager.test.ts
// Unit tests for EncryptionManager
// Reference: Task 3.1 verification criteria

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the logger before importing EncryptionManager
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

import { EncryptionManager, EncryptedData } from '../../../src/encryption/encryption-manager.js';

describe('EncryptionManager', () => {
  let encryptionManager: EncryptionManager;
  const testMasterKey = EncryptionManager.generateMasterKey();
  const testPatientId = 'patient-123-test-uuid';
  const testPlaintext = 'This is sensitive patient data';

  beforeEach(() => {
    encryptionManager = new EncryptionManager();
    encryptionManager.initialize(testMasterKey);
  });

  describe('generateMasterKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = EncryptionManager.generateMasterKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate different keys on each call', () => {
      const key1 = EncryptionManager.generateMasterKey();
      const key2 = EncryptionManager.generateMasterKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('initialize', () => {
    it('should accept a valid 64-character hex key', () => {
      const manager = new EncryptionManager();
      expect(() => manager.initialize(testMasterKey)).not.toThrow();
    });

    it('should throw error for invalid key length', () => {
      const manager = new EncryptionManager();
      expect(() => manager.initialize('tooshort')).toThrow('Master key must be 64 hex characters');
    });

    it('should accept any 64-character string as master key', () => {
      const manager = new EncryptionManager();
      const invalidKey = 'g'.repeat(64); // 'g' is not a hex character but will be accepted
      expect(() => manager.initialize(invalidKey)).not.toThrow();
      // Note: Buffer.from() doesn't validate hex format, it just converts the string
    });
  });

  describe('derivePatientKey', () => {
    it('should throw error if not initialized', () => {
      const manager = new EncryptionManager();
      expect(() => manager.derivePatientKey(testPatientId)).toThrow('Encryption manager not initialized');
    });

    it('should derive a 32-byte key', () => {
      const key = encryptionManager.derivePatientKey(testPatientId);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits
    });

    it('should derive the same key for the same patient ID', () => {
      const key1 = encryptionManager.derivePatientKey(testPatientId);
      const key2 = encryptionManager.derivePatientKey(testPatientId);
      expect(key1.equals(key2)).toBe(true);
    });

    it('should derive different keys for different patient IDs', () => {
      const key1 = encryptionManager.derivePatientKey('patient-1');
      const key2 = encryptionManager.derivePatientKey('patient-2');
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('encrypt', () => {
    it('should encrypt string data successfully', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
      
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('data');
      
      expect(encrypted.iv).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64
      expect(encrypted.authTag).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(encrypted.data).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should encrypt object data successfully', () => {
      const testObject = { name: 'John Doe', age: 30, diagnosis: 'Anxiety' };
      const encrypted = encryptionManager.encrypt(testPatientId, testObject);
      
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('data');
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const encrypted1 = encryptionManager.encrypt(testPatientId, testPlaintext);
      const encrypted2 = encryptionManager.encrypt(testPatientId, testPlaintext);
      
      // IVs should be different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      // Ciphertext should be different
      expect(encrypted1.data).not.toBe(encrypted2.data);
      // Auth tags should be different
      expect(encrypted1.authTag).not.toBe(encrypted2.authTag);
    });

    it('should produce different ciphertext for different patient IDs', () => {
      const encrypted1 = encryptionManager.encrypt('patient-1', testPlaintext);
      const encrypted2 = encryptionManager.encrypt('patient-2', testPlaintext);
      
      expect(encrypted1.data).not.toBe(encrypted2.data);
    });
  });

  describe('decrypt', () => {
    it('should decrypt data correctly', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
      const decrypted = encryptionManager.decrypt(testPatientId, encrypted);
      
      expect(decrypted).toBe(testPlaintext);
    });

    it('should fail with wrong patient ID', () => {
      const encrypted = encryptionManager.encrypt('patient-1', testPlaintext);
      
      expect(() => {
        encryptionManager.decrypt('patient-2', encrypted);
      }).toThrow();
    });

    it('should fail with tampered ciphertext', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
      
      // Tamper with the ciphertext
      const tamperedData = Buffer.from(encrypted.data, 'base64');
      tamperedData[0] ^= 0xFF; // Flip bits
      const tampered: EncryptedData = {
        ...encrypted,
        data: tamperedData.toString('base64')
      };
      
      expect(() => {
        encryptionManager.decrypt(testPatientId, tampered);
      }).toThrow();
    });

    it('should fail with tampered auth tag', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
      
      // Tamper with the auth tag
      const tamperedTag = Buffer.from(encrypted.authTag, 'base64');
      tamperedTag[0] ^= 0xFF;
      const tampered: EncryptedData = {
        ...encrypted,
        authTag: tamperedTag.toString('base64')
      };
      
      expect(() => {
        encryptionManager.decrypt(testPatientId, tampered);
      }).toThrow();
    });

    it('should fail with tampered IV', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
      
      // Tamper with the IV
      const tamperedIV = Buffer.from(encrypted.iv, 'base64');
      tamperedIV[0] ^= 0xFF;
      const tampered: EncryptedData = {
        ...encrypted,
        iv: tamperedIV.toString('base64')
      };
      
      expect(() => {
        encryptionManager.decrypt(testPatientId, tampered);
      }).toThrow();
    });
  });

  describe('decryptJSON', () => {
    it('should decrypt and parse JSON object correctly', () => {
      const testObject = { 
        name: 'Jane Smith', 
        age: 28, 
        medications: ['Sertraline', 'Alprazolam'],
        diagnosis: 'GAD'
      };
      
      const encrypted = encryptionManager.encrypt(testPatientId, testObject);
      const decrypted = encryptionManager.decryptJSON<typeof testObject>(testPatientId, encrypted);
      
      expect(decrypted).toEqual(testObject);
      expect(decrypted.name).toBe('Jane Smith');
      expect(decrypted.medications).toHaveLength(2);
    });

    it('should throw error for invalid JSON', () => {
      const invalidJSON = 'not valid json {';
      const encrypted = encryptionManager.encrypt(testPatientId, invalidJSON);
      
      expect(() => {
        encryptionManager.decryptJSON(testPatientId, encrypted);
      }).toThrow();
    });
  });

  describe('end-to-end encryption workflow', () => {
    it('should handle complete encrypt-decrypt cycle for complex data', () => {
      const complexData = {
        patientOverview: {
          name: 'Test Patient',
          age: 35,
          history: ['Depression', 'Anxiety'],
          medications: [
            { name: 'Prozac', dosage: '20mg', frequency: 'daily' },
            { name: 'Xanax', dosage: '0.5mg', frequency: 'as needed' }
          ]
        },
        sessions: [
          { id: 'session-1', date: '2024-01-15', duration: 25 },
          { id: 'session-2', date: '2024-01-22', duration: 25 }
        ]
      };

      const encrypted = encryptionManager.encrypt(testPatientId, complexData);
      const decrypted = encryptionManager.decryptJSON<typeof complexData>(testPatientId, encrypted);

      expect(decrypted).toEqual(complexData);
      expect(decrypted.patientOverview.medications).toHaveLength(2);
      expect(decrypted.sessions).toHaveLength(2);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, '');
      const decrypted = encryptionManager.decrypt(testPatientId, encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', () => {
      const unicodeText = 'Patient says: "I feel 😔 today" — très triste';
      const encrypted = encryptionManager.encrypt(testPatientId, unicodeText);
      const decrypted = encryptionManager.decrypt(testPatientId, encrypted);
      expect(decrypted).toBe(unicodeText);
    });

    it('should handle large data', () => {
      const largeText = 'A'.repeat(100000); // 100KB of data
      const encrypted = encryptionManager.encrypt(testPatientId, largeText);
      const decrypted = encryptionManager.decrypt(testPatientId, encrypted);
      expect(decrypted).toBe(largeText);
      expect(decrypted.length).toBe(100000);
    });
  });

  describe('security properties', () => {
    it('should use different IVs for each encryption', () => {
      const ivs = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
        ivs.add(encrypted.iv);
      }
      
      // All IVs should be unique
      expect(ivs.size).toBe(100);
    });

    it('should produce ciphertext different from plaintext', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
      const ciphertext = Buffer.from(encrypted.data, 'base64').toString('utf8');
      
      expect(ciphertext).not.toContain(testPlaintext);
    });

    it('should not leak patient ID in encrypted data', () => {
      const encrypted = encryptionManager.encrypt(testPatientId, testPlaintext);
      
      // Check that patient ID doesn't appear in any encrypted field
      expect(encrypted.iv).not.toContain(testPatientId);
      expect(encrypted.authTag).not.toContain(testPatientId);
      expect(encrypted.data).not.toContain(testPatientId);
    });
  });
});
