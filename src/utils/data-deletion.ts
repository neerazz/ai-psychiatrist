// src/utils/data-deletion.ts
// Secure Data Deletion (GDPR/CCPA Right to Erasure)
// Reference: Requirements R37 (data deletion), AGENTS.md Article V

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { logger, logAuditEvent } from './logger.js';
import { patientRepository } from '../database/repositories/patient.repository.js';
import { sessionRepository } from '../database/repositories/session.repository.js';
import { sqliteManager } from '../database/sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deletion result
 */
export interface DeletionResult {
    success: boolean;
    deletionId: string;
    patientId: string;
    deletedItems: {
        patientRecord: boolean;
        sessions: number;
        transcripts: number;
        memories: number;
        encryptionKeys: boolean;
        fileSystem: number;
    };
    deletedAt: string;
    retentionExemptions: string[];
}

/**
 * Deletion options
 */
export interface DeletionOptions {
    deleteTranscripts: boolean;
    deleteMemories: boolean;
    deleteEncryptionKeys: boolean;
    secureWipe: boolean; // Multi-pass overwrite
    auditRetention: boolean; // Keep audit logs (legal requirement)
}

const DEFAULT_DELETION_OPTIONS: DeletionOptions = {
    deleteTranscripts: true,
    deleteMemories: true,
    deleteEncryptionKeys: true,
    secureWipe: true,
    auditRetention: true // 6-year retention per R38
};

/**
 * Delete all patient data (GDPR/CCPA Right to Erasure)
 */
export async function deletePatientData(
    patientId: string,
    options: Partial<DeletionOptions> = {}
): Promise<DeletionResult> {
    const deletionOptions = { ...DEFAULT_DELETION_OPTIONS, ...options };
    const deletionId = crypto.randomUUID();

    logger.info('Starting secure data deletion', { patientId, deletionId });
    logAuditEvent('data_delete', patientId, null, 'deletion_started', { deletionId });

    const result: DeletionResult = {
        success: false,
        deletionId,
        patientId,
        deletedItems: {
            patientRecord: false,
            sessions: 0,
            transcripts: 0,
            memories: 0,
            encryptionKeys: false,
            fileSystem: 0
        },
        deletedAt: new Date().toISOString(),
        retentionExemptions: []
    };

    try {
        // Get all sessions first
        const sessions = sessionRepository.getRecentForPatient(patientId, 1000);

        // Delete session transcripts from file system
        if (deletionOptions.deleteTranscripts) {
            for (const session of sessions) {
                if (session.transcript_path) {
                    try {
                        const transcriptPath = path.join(__dirname, '../..', session.transcript_path);
                        await secureDeleteFile(transcriptPath, deletionOptions.secureWipe);
                        result.deletedItems.transcripts++;
                        result.deletedItems.fileSystem++;
                    } catch {
                        // File may not exist
                    }
                }
                if (session.summary_path) {
                    try {
                        const summaryPath = path.join(__dirname, '../..', session.summary_path);
                        await secureDeleteFile(summaryPath, deletionOptions.secureWipe);
                        result.deletedItems.fileSystem++;
                    } catch {
                        // File may not exist
                    }
                }
            }
        }

        // Delete patient directory
        const patientDir = path.join(__dirname, '../../memory_directory/patients', patientId);
        try {
            await secureDeleteDirectory(patientDir, deletionOptions.secureWipe);
            result.deletedItems.fileSystem++;
        } catch {
            // Directory may not exist
        }

        // Delete from SQLite database
        const db = sqliteManager.getDb();

        // Delete sessions
        const deleteSessionsStmt = db.prepare('DELETE FROM sessions WHERE patient_id = ?');
        const sessionsDeleted = deleteSessionsStmt.run(patientId);
        result.deletedItems.sessions = sessionsDeleted.changes;

        // Delete patient record
        const deletePatientStmt = db.prepare('DELETE FROM patients WHERE patient_id = ?');
        const patientDeleted = deletePatientStmt.run(patientId);
        result.deletedItems.patientRecord = patientDeleted.changes > 0;

        // Delete encryption keys if requested
        if (deletionOptions.deleteEncryptionKeys) {
            const deleteKeysStmt = db.prepare('DELETE FROM encryption_keys WHERE entity_id = ?');
            deleteKeysStmt.run(patientId);
            result.deletedItems.encryptionKeys = true;
        }

        // TODO: Delete from Qdrant vector database
        // This would require getting all memory IDs and deleting them

        // Note audit retention exemption
        if (deletionOptions.auditRetention) {
            result.retentionExemptions.push(
                'Audit logs retained for 6 years per R38 (HIPAA/legal requirement)'
            );
        }

        result.success = true;
        result.deletedAt = new Date().toISOString();

        logAuditEvent('data_delete', patientId, null, 'deletion_completed', {
            deletionId,
            deletedItems: result.deletedItems
        });

        logger.info('Secure data deletion completed', result);
        return result;

    } catch (error) {
        logger.error('Data deletion failed', { patientId, deletionId, error });
        logAuditEvent('data_delete', patientId, null, 'deletion_failed', {
            deletionId,
            error: (error as Error).message
        });
        throw error;
    }
}

/**
 * Securely delete a file (multi-pass overwrite)
 */
async function secureDeleteFile(filePath: string, multiPass: boolean = true): Promise<void> {
    try {
        const stats = await fs.stat(filePath);

        if (multiPass) {
            // DOD 5220.22-M style overwrite (3 passes)
            const passes = [
                Buffer.alloc(stats.size, 0x00),  // Pass 1: zeros
                Buffer.alloc(stats.size, 0xFF),  // Pass 2: ones
                crypto.randomBytes(stats.size)   // Pass 3: random
            ];

            const handle = await fs.open(filePath, 'r+');
            try {
                for (const data of passes) {
                    await handle.write(data, 0, data.length, 0);
                    await handle.sync();
                }
            } finally {
                await handle.close();
            }
        }

        // Delete the file
        await fs.unlink(filePath);

        logger.debug('File securely deleted', { filePath, multiPass });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }
}

/**
 * Securely delete a directory and its contents
 */
async function secureDeleteDirectory(dirPath: string, multiPass: boolean = true): Promise<void> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                await secureDeleteDirectory(fullPath, multiPass);
            } else {
                await secureDeleteFile(fullPath, multiPass);
            }
        }

        await fs.rmdir(dirPath);
        logger.debug('Directory securely deleted', { dirPath });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }
}

/**
 * Anonymize patient data (alternative to full deletion)
 */
export async function anonymizePatientData(patientId: string): Promise<boolean> {
    const anonymizedId = `anon_${crypto.randomBytes(8).toString('hex')}`;

    logger.info('Anonymizing patient data', { patientId, anonymizedId });
    logAuditEvent('data_modify', patientId, null, 'anonymization_started');

    try {
        const db = sqliteManager.getDb();

        // Update patient record with anonymized ID
        const updatePatientStmt = db.prepare(`
      UPDATE patients 
      SET patient_id = ?, current_risk_level = 'low'
      WHERE patient_id = ?
    `);
        updatePatientStmt.run(anonymizedId, patientId);

        // Update sessions to reference anonymized patient
        const updateSessionsStmt = db.prepare(`
      UPDATE sessions SET patient_id = ? WHERE patient_id = ?
    `);
        updateSessionsStmt.run(anonymizedId, patientId);

        logAuditEvent('data_modify', anonymizedId, null, 'anonymization_completed', {
            originalId: '[REDACTED]'
        });

        logger.info('Patient data anonymized', { anonymizedId });
        return true;

    } catch (error) {
        logger.error('Anonymization failed', { patientId, error });
        return false;
    }
}
