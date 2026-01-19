// tests/unit/database/repositories.test.ts
// Unit tests for patient and session repositories
// Reference: AGENTS.md Article III (Test-First), Task 2.6 verification

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { sqliteManager } from '../../../src/database/sqlite.js';
import { initializeSchema } from '../../../src/database/schema.js';
import { patientRepository, PatientRecord } from '../../../src/database/repositories/patient.repository.js';
import { sessionRepository, SessionRecord } from '../../../src/database/repositories/session.repository.js';

describe('Patient Repository', () => {
  beforeAll(() => {
    // Initialize in-memory database for testing
    process.env.NODE_ENV = 'test';
    sqliteManager.initialize();
    initializeSchema();
  });

  afterAll(() => {
    sqliteManager.close();
  });

  beforeEach(() => {
    // Clean up patients table before each test
    const db = sqliteManager.getDb();
    db.prepare('DELETE FROM patients').run();
    db.prepare('DELETE FROM sessions').run();
  });

  describe('create()', () => {
    it('should create a new patient and return patient ID', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-123',
        current_risk_level: 'low'
      });

      expect(patientId).toBeDefined();
      expect(typeof patientId).toBe('string');
      expect(patientId.length).toBeGreaterThan(0);
    });

    it('should create patient with default risk level if not provided', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-456'
      });

      const patient = patientRepository.getById(patientId);
      expect(patient).not.toBeNull();
      expect(patient?.current_risk_level).toBe('low');
    });

    it('should set initial values correctly', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-789',
        current_risk_level: 'moderate'
      });

      const patient = patientRepository.getById(patientId);
      expect(patient).not.toBeNull();
      expect(patient?.patient_id).toBe(patientId);
      expect(patient?.encryption_key_id).toBe('test-key-789');
      expect(patient?.current_risk_level).toBe('moderate');
      expect(patient?.is_active).toBe(1);
      expect(patient?.total_sessions).toBe(0);
      expect(patient?.overview_version).toBe(1);
    });
  });

  describe('getById()', () => {
    it('should return patient record when patient exists', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-123'
      });

      const patient = patientRepository.getById(patientId);
      expect(patient).not.toBeNull();
      expect(patient?.patient_id).toBe(patientId);
    });

    it('should return null when patient does not exist', () => {
      const patient = patientRepository.getById('non-existent-id');
      expect(patient).toBeNull();
    });
  });

  describe('updateSessionInfo()', () => {
    it('should increment total_sessions and update last_session_date', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-123'
      });

      const patientBefore = patientRepository.getById(patientId);
      expect(patientBefore?.total_sessions).toBe(0);
      expect(patientBefore?.last_session_date).toBeNull();

      patientRepository.updateSessionInfo(patientId);

      const patientAfter = patientRepository.getById(patientId);
      expect(patientAfter?.total_sessions).toBe(1);
      expect(patientAfter?.last_session_date).not.toBeNull();
    });
  });

  describe('updateRiskLevel()', () => {
    it('should update patient risk level', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-123',
        current_risk_level: 'low'
      });

      patientRepository.updateRiskLevel(patientId, 'high');

      const patient = patientRepository.getById(patientId);
      expect(patient?.current_risk_level).toBe('high');
    });
  });

  describe('getAllActive()', () => {
    it('should return only active patients', () => {
      const patientId1 = patientRepository.create({ encryption_key_id: 'key-1' });
      const patientId2 = patientRepository.create({ encryption_key_id: 'key-2' });
      patientRepository.softDelete(patientId2);

      const activePatients = patientRepository.getAllActive();
      expect(activePatients.length).toBe(1);
      expect(activePatients[0].patient_id).toBe(patientId1);
    });
  });

  describe('softDelete()', () => {
    it('should set is_active to 0', () => {
      const patientId = patientRepository.create({
        encryption_key_id: 'test-key-123'
      });

      patientRepository.softDelete(patientId);

      const patient = patientRepository.getById(patientId);
      expect(patient?.is_active).toBe(0);
    });
  });
});

describe('Session Repository', () => {
  let testPatientId: string;

  beforeAll(() => {
    // Initialize in-memory database for testing
    process.env.NODE_ENV = 'test';
    if (!sqliteManager.isReady()) {
      sqliteManager.initialize();
      initializeSchema();
    }
  });

  afterAll(() => {
    sqliteManager.close();
  });

  beforeEach(() => {
    // Clean up and create test patient
    const db = sqliteManager.getDb();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM patients').run();

    testPatientId = patientRepository.create({
      encryption_key_id: 'test-key-123'
    });
  });

  describe('create()', () => {
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

    it('should set initial values correctly', () => {
      const modelConfig = { model: 'claude-sonnet-4.5', temperature: 0.25 };
      const sessionId = sessionRepository.create({
        patient_id: testPatientId,
        risk_level_start: 'low',
        model_configuration: modelConfig
      });

      const session = sessionRepository.getById(sessionId);
      expect(session).not.toBeNull();
      expect(session?.session_id).toBe(sessionId);
      expect(session?.patient_id).toBe(testPatientId);
      expect(session?.session_status).toBe('active');
      expect(session?.risk_level_start).toBe('low');
      expect(session?.model_configuration).toBe(JSON.stringify(modelConfig));
    });
  });

  describe('getById()', () => {
    it('should return session record when session exists', () => {
      const sessionId = sessionRepository.create({ patient_id: testPatientId });

      const session = sessionRepository.getById(sessionId);
      expect(session).not.toBeNull();
      expect(session?.session_id).toBe(sessionId);
    });

    it('should return null when session does not exist', () => {
      const session = sessionRepository.getById('non-existent-id');
      expect(session).toBeNull();
    });
  });

  describe('getActiveForPatient()', () => {
    it('should return active session for patient', () => {
      const sessionId = sessionRepository.create({ patient_id: testPatientId });

      const activeSession = sessionRepository.getActiveForPatient(testPatientId);
      expect(activeSession).not.toBeNull();
      expect(activeSession?.session_id).toBe(sessionId);
      expect(activeSession?.session_status).toBe('active');
    });

    it('should return null when no active session exists', () => {
      const activeSession = sessionRepository.getActiveForPatient(testPatientId);
      expect(activeSession).toBeNull();
    });

    it('should return most recent active session when multiple exist', () => {
      const sessionId1 = sessionRepository.create({ patient_id: testPatientId });
      // Wait a bit to ensure different timestamps
      const sessionId2 = sessionRepository.create({ patient_id: testPatientId });

      const activeSession = sessionRepository.getActiveForPatient(testPatientId);
      expect(activeSession?.session_id).toBe(sessionId2);
    });
  });

  describe('getRecentForPatient()', () => {
    it('should return recent sessions in descending order', () => {
      const sessionId1 = sessionRepository.create({ patient_id: testPatientId });
      const sessionId2 = sessionRepository.create({ patient_id: testPatientId });
      const sessionId3 = sessionRepository.create({ patient_id: testPatientId });

      const recentSessions = sessionRepository.getRecentForPatient(testPatientId, 10);
      expect(recentSessions.length).toBe(3);
      expect(recentSessions[0].session_id).toBe(sessionId3);
      expect(recentSessions[1].session_id).toBe(sessionId2);
      expect(recentSessions[2].session_id).toBe(sessionId1);
    });

    it('should respect limit parameter', () => {
      sessionRepository.create({ patient_id: testPatientId });
      sessionRepository.create({ patient_id: testPatientId });
      sessionRepository.create({ patient_id: testPatientId });

      const recentSessions = sessionRepository.getRecentForPatient(testPatientId, 2);
      expect(recentSessions.length).toBe(2);
    });
  });

  describe('complete()', () => {
    it('should complete a session and set all fields', () => {
      const sessionId = sessionRepository.create({ patient_id: testPatientId });

      sessionRepository.complete(
        sessionId,
        'low',
        8.5,
        '/path/to/transcript.json',
        '/path/to/summary.json'
      );

      const session = sessionRepository.getById(sessionId);
      expect(session).not.toBeNull();
      expect(session?.session_status).toBe('completed');
      expect(session?.risk_level_end).toBe('low');
      expect(session?.session_quality_score).toBe(8.5);
      expect(session?.transcript_path).toBe('/path/to/transcript.json');
      expect(session?.summary_path).toBe('/path/to/summary.json');
      expect(session?.ended_at).not.toBeNull();
      expect(session?.duration_seconds).toBeGreaterThan(0);
    });

    it('should throw error when session does not exist', () => {
      expect(() => {
        sessionRepository.complete(
          'non-existent-id',
          'low',
          8.5,
          '/path/to/transcript.json',
          '/path/to/summary.json'
        );
      }).toThrow('Session not found');
    });
  });

  describe('updateStatus()', () => {
    it('should update session status', () => {
      const sessionId = sessionRepository.create({ patient_id: testPatientId });

      sessionRepository.updateStatus(sessionId, 'paused');

      const session = sessionRepository.getById(sessionId);
      expect(session?.session_status).toBe('paused');
    });
  });
});
