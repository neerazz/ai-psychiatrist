// src/encryption/data-deletion.ts
// Secure data deletion with audit trail preservation
// Reference: Requirements R37 (GDPR right to erasure)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { patientRepository } from '../database/repositories/patient.repository.js';
import { sqliteManager } from '../database/sqlite.js';
import { qdrantManager, COLLECTIONS } from '../database/qdrant.js';
import { logger, logAuditEvent } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PATIENTS_DIR = path.join(__dirname, '../../memory_directory/patients');

export interface DeletionResult {
  success: boolean;
  deletedItems: {
    files: number;
    sessions: number;
    vectors: number;
  };
  deletedAt: string;
  auditPreserved: boolean;
}

/**
 * Delete all patient data with audit trail preservation
 * Reference: Requirements R37 (GDPR right to erasure with audit retention)
 *
 * IMPORTANT: Requires confirmation code to prevent accidental deletion
 * Confirmation code must be: "DELETE-{patientId}"
 *
 * @param patientId - Patient ID to delete
 * @param confirmationCode - Must be "DELETE-{patientId}"
 */
export async function deletePatientData(
  patientId: string,
  confirmationCode: string
): Promise<DeletionResult> {
  // Verify confirmation code
  const expectedCode = `DELETE-${patientId}`;
  if (confirmationCode !== expectedCode) {
    throw new Error(`Invalid confirmation code. Expected: ${expectedCode}`);
  }

  logger.warn('Starting patient data deletion', { patientId });
  logAuditEvent('data_delete', patientId, null, 'deletion_started');

  let filesDeleted = 0;
  let sessionsDeleted = 0;
  let vectorsDeleted = 0;

  try {
    // 1. Delete patient files from Memory_Directory
    const patientDir = path.join(PATIENTS_DIR, patientId);
    try {
      await fs.rm(patientDir, { recursive: true, force: true });
      filesDeleted = 1;  // Count as 1 directory
      logger.info('Patient files deleted', { patientId, dir: patientDir });
    } catch (error) {
      logger.debug('No patient directory to delete', { patientId });
    }

    // 2. Delete sessions from SQLite (CASCADE will delete related records)
    const db = sqliteManager.getDb();
    const deleteSessionsStmt = db.prepare('DELETE FROM sessions WHERE patient_id = ?');
    const sessionsResult = deleteSessionsStmt.run(patientId);
    sessionsDeleted = sessionsResult.changes;

    // 3. Soft-delete patient record (preserve for audit trail)
    patientRepository.softDelete(patientId);

    // 4. Delete vectors from Qdrant
    try {
      const client = qdrantManager.getClient();

      // Delete from each collection
      for (const collection of Object.values(COLLECTIONS)) {
        await client.delete(collection, {
          filter: {
            must: [{ key: 'patient_id', match: { value: patientId } }]
          }
        });
      }
      vectorsDeleted = 1;  // Mark as success
    } catch (error) {
      logger.warn('Qdrant deletion failed - vectors may remain', { patientId, error });
    }

    logAuditEvent('data_delete', patientId, null, 'deletion_completed', {
      filesDeleted,
      sessionsDeleted,
      vectorsDeleted
    });

    return {
      success: true,
      deletedItems: {
        files: filesDeleted,
        sessions: sessionsDeleted,
        vectors: vectorsDeleted
      },
      deletedAt: new Date().toISOString(),
      auditPreserved: true  // Audit log entries are NOT deleted
    };

  } catch (error) {
    logger.error('Patient data deletion failed', { patientId, error });
    logAuditEvent('data_delete', patientId, null, 'deletion_failed', { error: String(error) });
    throw error;
  }
}
