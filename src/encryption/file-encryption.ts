// src/encryption/file-encryption.ts
// File encryption utilities for Memory_Directory
// Reference: Requirements R37

import fs from 'fs/promises';
import path from 'path';
import { encryptionManager, EncryptedData } from './encryption-manager.js';
import { logger, logAuditEvent } from '../utils/logger.js';

export interface EncryptedFile {
  version: string;
  patientId: string;
  encrypted: EncryptedData;
  createdAt: string;
  checksum: string;
}

/**
 * Encrypt and save data to a file
 *
 * @param patientId - Patient ID for key derivation
 * @param filePath - Path to save the encrypted file
 * @param data - Data to encrypt (string or object)
 */
export async function encryptFile(
  patientId: string,
  filePath: string,
  data: string | object
): Promise<void> {
  const encrypted = encryptionManager.encrypt(patientId, data);

  const fileData: EncryptedFile = {
    version: '1.0.0',
    patientId: patientId,
    encrypted,
    createdAt: new Date().toISOString(),
    checksum: encrypted.authTag  // Use authTag as integrity check
  };

  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Write file
  await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));

  logAuditEvent('data_modify', patientId, null, 'file_encrypted', { filePath });
  logger.debug('File encrypted', { filePath });
}

/**
 * Read and decrypt a file
 *
 * @param patientId - Patient ID for key derivation
 * @param filePath - Path to the encrypted file
 * @returns Decrypted data as string
 */
export async function decryptFile(
  patientId: string,
  filePath: string
): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  const fileData: EncryptedFile = JSON.parse(content);

  // Verify patient ID matches
  if (fileData.patientId !== patientId) {
    throw new Error('Patient ID mismatch - cannot decrypt file');
  }

  const decrypted = encryptionManager.decrypt(patientId, fileData.encrypted);

  logAuditEvent('data_access', patientId, null, 'file_decrypted', { filePath });
  return decrypted;
}

/**
 * Read and decrypt a JSON file
 */
export async function decryptJSONFile<T = unknown>(
  patientId: string,
  filePath: string
): Promise<T> {
  const content = await decryptFile(patientId, filePath);
  return JSON.parse(content) as T;
}

/**
 * Check if an encrypted file exists
 */
export async function encryptedFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
