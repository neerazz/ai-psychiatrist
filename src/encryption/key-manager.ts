// src/encryption/key-manager.ts
// Key management with secure storage
// Reference: Requirements R37, Design Section 16

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { encryptionManager } from './encryption-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE_PATH = path.join(__dirname, '../../memory_directory/config/encryption.key.enc');
const MASTER_KEY_ENV_VAR = 'MASTER_ENCRYPTION_KEY';

/**
 * Key Manager
 * Handles master key generation, storage, and patient key derivation
 */
export class KeyManager {
  private initialized = false;

  /**
   * Initialize key management system
   * Loads existing master key or creates new one
   */
  public async initialize(): Promise<void> {
    // Check for master key in environment variable (preferred for production)
    const envKey = process.env[MASTER_KEY_ENV_VAR];

    if (envKey) {
      encryptionManager.initialize(envKey);
      logger.info('Master key loaded from environment variable');
    } else {
      // Try to load from encrypted file (for development)
      try {
        const keyData = await fs.readFile(KEY_FILE_PATH, 'utf-8');
        encryptionManager.initialize(keyData.trim());
        logger.info('Master key loaded from file');
      } catch {
        // Generate new key if none exists
        await this.generateAndSaveMasterKey();
      }
    }

    this.initialized = true;
  }

  /**
   * Generate a new master key and save to file
   * ONLY for initial setup - in production, use environment variable
   */
  private async generateAndSaveMasterKey(): Promise<void> {
    const masterKey = crypto.randomBytes(32).toString('hex');

    // Ensure config directory exists
    const configDir = path.dirname(KEY_FILE_PATH);
    await fs.mkdir(configDir, { recursive: true });

    // Save to file (development only - use secure storage in production)
    await fs.writeFile(KEY_FILE_PATH, masterKey, { mode: 0o600 });

    encryptionManager.initialize(masterKey);
    logger.warn('New master key generated and saved - SECURE THIS FILE');
  }

  /**
   * Generate a unique encryption key ID for a new patient
   * This ID is stored in the database and used to identify the key derivation
   */
  public generatePatientKeyId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Check if key management is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton
export const keyManager = new KeyManager();
