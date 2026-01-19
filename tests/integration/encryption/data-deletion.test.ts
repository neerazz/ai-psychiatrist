// tests/integration/encryption/data-deletion.test.ts
// Integration tests for Data Deletion
// Reference: Task 3.7 verification

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { deletePatientData } from '../../../src/encryption/data-deletion.js';
import { sqliteManager } from '../../../src/database/sqlite.js';
import { patientRepository } from '../../../src/database/repositories/patient.repository.js';
import { sessionRepository } from '../../../src/database/repositories/session.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_PATH = path.join(__dirname, '../../../memory_directory/databases/test-deletion.db');
const PATIENTS_DIR = path.join(__dirname, '../../../memory_directory/patients');

describe('Data Deletion (Integration)', () => {
  const testPatientId = 'test-patient-deletion-123';

  beforeAll(async () => {
    // Initialize database
    await sqliteManager.initialize(TEST_DB_PATH);
  });

  afterAll(async () => {
    // Clean up test database
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch {
      // Ignore
    }
  });

  describe('deletePatientData', () => {
    beforeEach(async () => {
      // Create test patient
      patientRepository.create({
        patient_id: testPatientId,
        name: 'Test Patient',
        created_at: new Date().toISOString(),
        overview_version: 1,
        overview_checksum: 'test-checksum',
        encryption_key_id: 'test-key-id',
        is_active: 1,
        total_sessions: 1,
        current_risk_level: 'low'
      });

      // Create test session
      sessionRepository.create({
        session_id: 'session-delete-1',
        patient_id: testPatientId,
        session_number: 1,
        started_at: new Date().toISOString(),
        session_status: 'completed',
        duration_seconds: 1500
      });

      // Create test patient directory
      const patientDir = path.join(PATIENTS_DIR, testPatientId);
      await fs.mkdir(patientDir, { recursive: true });
      await fs.writeFile(path.join(patientDir, 'test.txt'), 'test data');
    });

    it('should require correct confirmation code', async () => {
      await expect(
        deletePatientData(testPatientId, 'WRONG-CODE')
      ).rejects.toThrow('Invalid confirmation code');
    });

    it('should delete patient files', async () => {
      const patientDir = path.join(PATIENTS_DIR, testPatientId);

      const result = await deletePatientData(testPatientId, `DELETE-${testPatientId}`);

      expect(result.success).toBe(true);
      expect(result.deletedItems.files).toBeGreaterThan(0);

      // Verify directory is deleted
      const dirExists = await fs.access(patientDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(false);
    });

    it('should delete patient sessions', async () => {
      const result = await deletePatientData(testPatientId, `DELETE-${testPatientId}`);

      expect(result.success).toBe(true);
      expect(result.deletedItems.sessions).toBeGreaterThan(0);

      // Verify sessions are deleted
      const sessions = sessionRepository.getRecentForPatient(testPatientId, 10);
      expect(sessions).toHaveLength(0);
    });

    it('should soft-delete patient record', async () => {
      await deletePatientData(testPatientId, `DELETE-${testPatientId}`);

      // Patient record should still exist but be marked inactive
      const patient = patientRepository.getById(testPatientId);
      expect(patient).toBeDefined();
      expect(patient?.is_active).toBe(0);
    });

    it('should preserve audit trail', async () => {
      const result = await deletePatientData(testPatientId, `DELETE-${testPatientId}`);

      expect(result.auditPreserved).toBe(true);
    });
  });
});
