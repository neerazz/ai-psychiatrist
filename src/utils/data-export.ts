// src/utils/data-export.ts
// GDPR/CCPA Data Export Functionality
// Reference: Requirements R37 (GDPR/CCPA compliance)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger, logAuditEvent } from './logger.js';
import { patientRepository } from '../database/repositories/patient.repository.js';
import { sessionRepository } from '../database/repositories/session.repository.js';
import { encryptionManager } from '../encryption/encryption-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Data export result
 */
export interface DataExportResult {
    success: boolean;
    exportId: string;
    filePath: string;
    fileSize: number;
    includedData: {
        patientInfo: boolean;
        sessions: number;
        transcripts: number;
        memories: number;
    };
    exportedAt: string;
}

/**
 * Export options
 */
export interface ExportOptions {
    includeTranscripts: boolean;
    includeMemories: boolean;
    includeSummaries: boolean;
    encryptExport: boolean;
    format: 'json' | 'zip';
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
    includeTranscripts: true,
    includeMemories: true,
    includeSummaries: true,
    encryptExport: true,
    format: 'zip'
};

/**
 * Export all patient data (GDPR/CCPA Right to Access)
 */
export async function exportPatientData(
    patientId: string,
    options: Partial<ExportOptions> = {}
): Promise<DataExportResult> {
    const exportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
    const exportId = uuidv4();
    const exportDir = path.join(__dirname, '../../memory_directory/exports', exportId);

    logger.info('Starting data export', { patientId, exportId });
    logAuditEvent('data_export', patientId, null, 'export_started', { exportId });

    try {
        // Create export directory
        await fs.mkdir(exportDir, { recursive: true });

        // Get patient info
        const patient = patientRepository.getById(patientId);
        if (!patient) {
            throw new Error('Patient not found');
        }

        // Get sessions
        const sessions = sessionRepository.getRecentForPatient(patientId, 1000);

        // Prepare export data
        const exportData: Record<string, unknown> = {
            exportInfo: {
                exportId,
                exportedAt: new Date().toISOString(),
                dataSubject: patientId,
                requestType: 'GDPR_ACCESS_REQUEST'
            },
            patientInfo: {
                patientId: patient.patient_id,
                createdAt: patient.created_at,
                lastSession: patient.last_session_date,
                totalSessions: patient.total_sessions,
                currentRiskLevel: patient.current_risk_level
            },
            sessions: sessions.map(s => ({
                sessionId: s.session_id,
                sessionNumber: s.session_number,
                startedAt: s.started_at,
                endedAt: s.ended_at,
                durationSeconds: s.duration_seconds,
                riskLevelStart: s.risk_level_start,
                riskLevelEnd: s.risk_level_end,
                transcriptPath: exportOptions.includeTranscripts ? s.transcript_path : '[redacted]',
                summaryPath: exportOptions.includeSummaries ? s.summary_path : '[redacted]'
            }))
        };

        // Include transcripts if requested
        if (exportOptions.includeTranscripts) {
            const transcripts: Record<string, unknown>[] = [];
            for (const session of sessions) {
                if (session.transcript_path) {
                    try {
                        const transcriptPath = path.join(__dirname, '../..', session.transcript_path);
                        const content = await fs.readFile(transcriptPath, 'utf-8');
                        transcripts.push({
                            sessionId: session.session_id,
                            transcript: JSON.parse(content)
                        });
                    } catch {
                        // Transcript file may not exist
                    }
                }
            }
            exportData.transcripts = transcripts;
        }

        // Write main export file
        const dataPath = path.join(exportDir, 'patient_data.json');
        await fs.writeFile(dataPath, JSON.stringify(exportData, null, 2));

        // Create ZIP archive if requested
        let finalPath = dataPath;
        let fileSize = 0;

        if (exportOptions.format === 'zip') {
            finalPath = path.join(exportDir, `export_${patientId}_${exportId}.zip`);
            await createZipArchive(exportDir, finalPath, [dataPath]);

            const stats = await fs.stat(finalPath);
            fileSize = stats.size;

            // Clean up JSON file
            await fs.unlink(dataPath);
        } else {
            const stats = await fs.stat(dataPath);
            fileSize = stats.size;
        }

        // Encrypt if requested (encryption manager integration)
        if (exportOptions.encryptExport) {
            // Note: File encryption would require the encryption manager to support
            // file-level encryption. For now, we skip encryption and note in logs.
            logger.info('Export encryption requested but not yet implemented', { exportId });
        }

        const result: DataExportResult = {
            success: true,
            exportId,
            filePath: finalPath,
            fileSize,
            includedData: {
                patientInfo: true,
                sessions: sessions.length,
                transcripts: exportOptions.includeTranscripts ? sessions.length : 0,
                memories: 0 // TODO: Add vector memories export
            },
            exportedAt: new Date().toISOString()
        };

        logAuditEvent('data_export', patientId, null, 'export_completed', {
            exportId,
            fileSize,
            sessionsExported: sessions.length
        });

        logger.info('Data export completed', result);
        return result;

    } catch (error) {
        logger.error('Data export failed', { patientId, exportId, error });
        logAuditEvent('data_export', patientId, null, 'export_failed', {
            exportId,
            error: (error as Error).message
        });
        throw error;
    }
}

/**
 * Create ZIP archive
 */
async function createZipArchive(
    sourceDir: string,
    outputPath: string,
    files: string[]
): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        for (const file of files) {
            archive.file(file, { name: path.basename(file) });
        }

        archive.finalize();
    });
}
