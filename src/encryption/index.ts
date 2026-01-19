// src/encryption/index.ts
// Encryption module exports
// Provides centralized access to all encryption functionality

// Core encryption manager (Task 3.1)
export { encryptionManager, EncryptionManager, EncryptedData } from './encryption-manager.js';

// Key management (Task 3.2-3.3)
export { keyManager, KeyManager } from './key-manager.js';

// File encryption (Task 3.4)
export {
  encryptFile,
  decryptFile,
  decryptJSONFile,
  encryptedFileExists,
  EncryptedFile
} from './file-encryption.js';

// Data export (Task 3.6)
export { exportPatientData, ExportResult } from './data-export.js';

// Data deletion (Task 3.7)
export { deletePatientData, DeletionResult } from './data-deletion.js';
