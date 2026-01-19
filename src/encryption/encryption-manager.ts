// src/encryption/encryption-manager.ts
// AES-256-GCM encryption for data at rest
// Reference: Requirements R37, Design Section 16

import crypto from 'crypto';
import { logger } from '../utils/logger.js';

// Encryption constants from Requirements R37
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;  // 256 bits
const IV_LENGTH = 16;   // 128 bits
const AUTH_TAG_LENGTH = 16;  // 128 bits
const PBKDF2_ITERATIONS = 100000;  // From Design spec
const PBKDF2_DIGEST = 'sha256';

export interface EncryptedData {
  iv: string;        // Base64 encoded IV
  authTag: string;   // Base64 encoded auth tag
  data: string;      // Base64 encoded encrypted data
}

/**
 * Encryption Manager
 * Provides AES-256-GCM encryption/decryption for patient data
 *
 * Key derivation uses PBKDF2 with patient-specific salt
 * to ensure each patient's data is encrypted with a unique key
 */
export class EncryptionManager {
  private masterKey: Buffer | null = null;

  /**
   * Initialize with master key
   * Master key should be loaded from secure storage (encrypted file or OS keychain)
   *
   * @param masterKeyHex - 64-character hex string (256 bits)
   */
  public initialize(masterKeyHex: string): void {
    if (masterKeyHex.length !== 64) {
      throw new Error('Master key must be 64 hex characters (256 bits)');
    }

    this.masterKey = Buffer.from(masterKeyHex, 'hex');
    logger.info('Encryption manager initialized');
  }

  /**
   * Generate a new random master key
   * Use this for initial setup, then store securely
   *
   * @returns 64-character hex string
   */
  public static generateMasterKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Derive a patient-specific encryption key using PBKDF2
   * Reference: Design Section 16 (100,000 iterations)
   *
   * @param patientId - Patient UUID used as salt component
   */
  public derivePatientKey(patientId: string): Buffer {
    if (!this.masterKey) {
      throw new Error('Encryption manager not initialized');
    }

    // Create salt from patient ID (hashed for consistency)
    const salt = crypto.createHash('sha256').update(patientId).digest();

    // Derive patient-specific key
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST
    );
  }

  /**
   * Encrypt data using patient-specific key
   *
   * @param patientId - Patient ID for key derivation
   * @param plaintext - Data to encrypt (string or object)
   * @returns Encrypted data structure
   */
  public encrypt(patientId: string, plaintext: string | object): EncryptedData {
    const key = this.derivePatientKey(patientId);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Convert object to string if needed
    const data = typeof plaintext === 'object' ? JSON.stringify(plaintext) : plaintext;

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted.toString('base64')
    };
  }

  /**
   * Decrypt data using patient-specific key
   *
   * @param patientId - Patient ID for key derivation
   * @param encrypted - Encrypted data structure
   * @returns Decrypted plaintext string
   */
  public decrypt(patientId: string, encrypted: EncryptedData): string {
    const key = this.derivePatientKey(patientId);
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    const encryptedData = Buffer.from(encrypted.data, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Decrypt and parse JSON data
   */
  public decryptJSON<T = unknown>(patientId: string, encrypted: EncryptedData): T {
    const plaintext = this.decrypt(patientId, encrypted);
    return JSON.parse(plaintext) as T;
  }
}

// Export singleton
export const encryptionManager = new EncryptionManager();
