// src/encryption/data-export.ts
// GDPR/CCPA compliant data export
// Reference: Requirements R37 (data export on user request)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { patientRepository } from '../database/repositories/patient.repository.js';
import { sessionRepository } from '../database/repositories/session.repository.js';
import { auditRepository } from '../database/repositories/audit.repository.js';
import { logger, logAuditEvent } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORTS_DIR = path.join(__dirname, '../../memory_directory/exports');

export interface ExportResult {
  success: boolean;
  exportPath: string;
  fileCount: number;
  exportedAt: string;
}

/**
 * Export all patient data to a ZIP file
 * Reference: Requirements R37 (GDPR/CCPA compliance)
 *
 * Includes:
 * - Patient overview
 * - All session transcripts and summaries
 * - Audit log entries for this patient
 */
export async function exportPatientData(patientId: string): Promise<ExportResult> {
  logger.info('Starting patient data export', { patientId });
  logAuditEvent('data_export', patientId, null, 'export_started');

  const exportTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFileName = `patient_${patientId}_export_${exportTimestamp}.zip`;
  const exportPath = path.join(EXPORTS_DIR, exportFileName);

  // Ensure exports directory exists
  await fs.mkdir(EXPORTS_DIR, { recursive: true });

  // Create ZIP archive
  const output = createWriteStream(exportPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    let fileCount = 0;

    output.on('close', async () => {
      logAuditEvent('data_export', patientId, null, 'export_completed', {
        exportPath,
        size: archive.pointer()
      });

      resolve({
        success: true,
        exportPath,
        fileCount,
        exportedAt: new Date().toISOString()
      });
    });

    archive.on('error', (err) => {
      logger.error('Export failed', { patientId, error: err });
      reject(err);
    });

    archive.on('entry', () => {
      fileCount++;
    });

    archive.pipe(output);

    // Add export manifest
    const manifest = {
      patientId,
      exportedAt: new Date().toISOString(),
      exportFormat: 'GDPR/CCPA Data Export',
      contents: [] as string[]
    };

    // Add patient record
    const patient = patientRepository.getById(patientId);
    if (patient) {
      archive.append(JSON.stringify(patient, null, 2), { name: 'patient_record.json' });
      manifest.contents.push('patient_record.json');
    }

    // Add sessions
    const sessions = sessionRepository.getRecentForPatient(patientId, 1000);
    archive.append(JSON.stringify(sessions, null, 2), { name: 'sessions.json' });
    manifest.contents.push('sessions.json');

    // Add audit log entries for this patient
    const auditEntries = auditRepository.getForPatient(patientId, 10000);
    archive.append(JSON.stringify(auditEntries, null, 2), { name: 'audit_log.json' });
    manifest.contents.push('audit_log.json');

    // Add manifest
    archive.append(JSON.stringify(manifest, null, 2), { name: 'MANIFEST.json' });

    archive.finalize();
  });
}
