// tests/integration/database/repositories.test.ts
// Integration tests for patient and session repositories
// Reference: AGENTS.md Article III (Test-First), Task 2.6 verification

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { sqliteManager } from '../../../src/database/sqlite.js';
import { initializeSchema } from '../../../src/database/schema.js';
import { patientRepository } from '../../../src/database/repositories/patient.repository.js';
import { sessionRepository } from '../../../src/database/repositories/session.repository.js';

describe('Repository Integration Tests', () => {
  beforeAll(() => {
    // Initialize database for testing
    sqliteManager.initialize();
    initializeSchema();
  });

  afterAll(() => {
    sqliteManager.close();
  });

  beforeEach(() => {
    // Clean up tables before each test
    const db = sqliteManager.getDb();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM patients').run();
  });

  describe('Patient Repository', () => {
    it('should create a new patient and return patient ID', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-123',
        current_risk_level: 'low'
      });

      expect(patientId).toBeDefined();
      expect(typeof patientId).toBe('string');
      expect(patientId.length).toBeGreaterThan(0);
    });

    it('should retrieve patient by ID', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-456'
      });

      const patient = patientRepository.getById(patientId);
      expect(patient).not.toBeNull();
      expect(patient?.patient_id).toBe(patientId);
      expect(patient?.encryption_key_id).toBe('test-key-456');
      expect(patient?.current_risk_level).toBe('low');
      expect(patient?.is_active).toBe(1);
      expect(patient?.total_sessions).toBe(0);
    });

    it('should update patient session info', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-789'
      });

      patientRepository.updateSessionInfo(patientId);

      const patient = patientRepository.getById(patientId);
      expect(patient?.total_sessions).toBe(1);
      expect(patient?.last_session_date).not.toBeNull();
    });

    it('should update patient risk level', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-abc',
        current_risk_level: 'low'
      });

      patientRepository.updateRiskLevel(patientId, 'high');

      const patient = patientRepository.getById(patientId);
      expect(patient?.current_risk_level).toBe('high');
    });
  });

  describe('Session Repository', () => {
    let testPatientId: string;

    beforeEach(() => {
      // Create test patient for session tests
      testPatientId = patientRepository.create({
        encryption_key_id: 'test-key-session'
      });
    });

    it('should create a new session and return session ID', () => {
      const sessionId = sessionRepository.create({
        patient_id: testPatientId
      });

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should set session_number correctly for first session', () => {
      const sessionId = sessionRepository.create({
        patient_id: testPatientId
      });

      const session = sessionRepository.getById(sessionId);
      expect(session).not.toBeNull();
      expect(session?.session_number).toBe(1);
      expect(session?.patient_id).toBe(testPatientId);
      expect(session?.session_status).toBe('active');
    });

    it('should increment session_number for subsequent sessions', () => {
      const sessionId1 = sessionRepository.create({ patient_id: testPatientId });
      const sessionId2 = sessionRepository.create({ patient_id: testPatientId });
      const sessionId3 = sessionRepository.create({ patient_id: testPatientId });

      const session1 = sessionRepository.getById(sessionId1);
      const session2 = sessionRepository.getById(sessionId2);
      const session3 = sessionRepository.getById(sessionId3);

      expect(session1?.session_number).toBe(1);
      expect(session2?.session_number).toBe(2);
      expect(session3?.session_number).toBe(3);
    });

    it('should store model configuration as JSON', () => {
      const modelConfig = { model: 'claude-sonnet-4.5', temperature: 0.25 };
      const sessionId = sessionRepository.create({
        patient_id: testPatientId,
        risk_level_start: 'low',
        model_configuration: modelConfig
      });

      const session = sessionRepository.getById(sessionId);
      expect(session?.model_configuration).toBe(JSON.stringify(modelConfig));
    });

    it('should complete a session with all required fields', () => {
      const sessionId = sessionRepository.create({ patient_id: testPatientId });

      sessionRepository.complete(
        sessionId,
        'low',
        8.5,
        '/path/to/transcript.json',
        '/path/to/summary.json'
      );

      const session = sessionRepository.getById(sessionId);
      expect(session?.session_status).toBe('completed');
      expect(session?.risk_level_end).toBe('low');
      expect(session?.session_quality_score).toBe(8.5);
      expect(session?.transcript_path).toBe('/path/to/transcript.json');
      expect(session?.summary_path).toBe('/path/to/summary.json');
      expect(session?.ended_at).not.toBeNull();
      expect(session?.duration_seconds).toBeGreaterThan(0);
    });

    it('should get active session for patient', () => {
      const sessionId = sessionRepository.create({ patient_id: testPatientId });

      const activeSession = sessionRepository.getActiveForPatient(testPatientId);
      expect(activeSession).not.toBeNull();
      expect(activeSession?.session_id).toBe(sessionId);
      expect(activeSession?.session_status).toBe('active');
    });

    it('should get recent sessions for patient', () => {
      const sessionId1 = sessionRepository.create({ patient_id: testPatientId });
      const sessionId2 = sessionRepository.create({ patient_id: testPatientId });
      const sessionId3 = sessionRepository.create({ patient_id: testPatientId });

      const recentSessions = sessionRepository.getRecentForPatient(testPatientId, 10);
      expect(recentSessions.length).toBe(3);
      // Most recent first
      expect(recentSessions[0].session_id).toBe(sessionId3);
      expect(recentSessions[1].session_id).toBe(sessionId2);
      expect(recentSessions[2].session_id).toBe(sessionId1);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events for patient operations', () => {
      // This test verifies that audit logging doesn't throw errors
      // Actual audit log verification would require reading the audit.log file
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-audit'
      });

      expect(() => {
        patientRepository.getById(patientId);
        patientRepository.updateRiskLevel(patientId, 'moderate');
        patientRepository.softDelete(patientId);
      }).not.toThrow();
    });

    it('should log audit events for session operations', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-audit-session'
      });

      expect(() => {
        const sessionId = sessionRepository.create({ patient_id: patientId });
        sessionRepository.updateStatus(sessionId, 'paused');
        sessionRepository.complete(sessionId, 'low', 8.0, '/transcript', '/summary');
      }).not.toThrow();
    });
  });
});
