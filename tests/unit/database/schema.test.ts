// tests/unit/database/schema.test.ts
// Unit tests for database schema initialization
// Reference: Task 2.2 verification criteria

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { sqliteManager } from '../../../src/database/sqlite.js';
import { initializeSchema, verifySchema } from '../../../src/database/schema.js';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = 'memory_directory/databases/test_schema.db';

describe('Database Schema', () => {
  beforeEach(() => {
    // Clean up test database if it exists
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // Initialize with test database
    process.env.DB_PATH = TEST_DB_PATH;
    sqliteManager.initialize();
  });

  afterEach(() => {
    // Close database connection
    sqliteManager.close();
    
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('initializeSchema', () => {
    it('should create all 7 required tables', () => {
      // Execute
      initializeSchema();

      // Verify
      const verification = verifySchema();
      expect(verification.valid).toBe(true);
      expect(verification.missingTables).toEqual([]);
    });

    it('should create patients table with correct structure', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const tableInfo = db.prepare("PRAGMA table_info(patients)").all();
      
      const columnNames = tableInfo.map((col: any) => col.name);
      expect(columnNames).toContain('patient_id');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('overview_version');
      expect(columnNames).toContain('encryption_key_id');
      expect(columnNames).toContain('current_risk_level');
    });

    it('should create sessions table with correct structure', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const tableInfo = db.prepare("PRAGMA table_info(sessions)").all();
      
      const columnNames = tableInfo.map((col: any) => col.name);
      expect(columnNames).toContain('session_id');
      expect(columnNames).toContain('patient_id');
      expect(columnNames).toContain('session_number');
      expect(columnNames).toContain('started_at');
      expect(columnNames).toContain('session_status');
      expect(columnNames).toContain('model_configuration');
    });

    it('should create session_events table with correct structure', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const tableInfo = db.prepare("PRAGMA table_info(session_events)").all();
      
      const columnNames = tableInfo.map((col: any) => col.name);
      expect(columnNames).toContain('event_id');
      expect(columnNames).toContain('session_id');
      expect(columnNames).toContain('event_type');
      expect(columnNames).toContain('event_timestamp');
      expect(columnNames).toContain('agent_source');
    });

    it('should create crisis_events table with correct structure', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const tableInfo = db.prepare("PRAGMA table_info(crisis_events)").all();
      
      const columnNames = tableInfo.map((col: any) => col.name);
      expect(columnNames).toContain('crisis_id');
      expect(columnNames).toContain('session_id');
      expect(columnNames).toContain('patient_id');
      expect(columnNames).toContain('severity_tier');
      expect(columnNames).toContain('trigger_indicators');
    });

    it('should create embedding_jobs table with correct structure', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const tableInfo = db.prepare("PRAGMA table_info(embedding_jobs)").all();
      
      const columnNames = tableInfo.map((col: any) => col.name);
      expect(columnNames).toContain('job_id');
      expect(columnNames).toContain('job_type');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('progress_percent');
    });

    it('should create audit_log table with correct structure', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const tableInfo = db.prepare("PRAGMA table_info(audit_log)").all();
      
      const columnNames = tableInfo.map((col: any) => col.name);
      expect(columnNames).toContain('log_id');
      expect(columnNames).toContain('timestamp');
      expect(columnNames).toContain('event_type');
      expect(columnNames).toContain('action');
      expect(columnNames).toContain('checksum');
    });

    it('should create conversation_highlights table with correct structure', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const tableInfo = db.prepare("PRAGMA table_info(conversation_highlights)").all();
      
      const columnNames = tableInfo.map((col: any) => col.name);
      expect(columnNames).toContain('highlight_id');
      expect(columnNames).toContain('session_id');
      expect(columnNames).toContain('timestamp_minutes');
      expect(columnNames).toContain('highlight_type');
      expect(columnNames).toContain('speaker');
    });

    it('should create all required indexes', () => {
      initializeSchema();

      const db = sqliteManager.getDb();
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
      const indexNames = indexes.map((idx: any) => idx.name);

      // Check for key indexes
      expect(indexNames).toContain('idx_patients_active');
      expect(indexNames).toContain('idx_patients_risk');
      expect(indexNames).toContain('idx_sessions_patient');
      expect(indexNames).toContain('idx_sessions_status');
      expect(indexNames).toContain('idx_events_session');
      expect(indexNames).toContain('idx_crisis_severity');
      expect(indexNames).toContain('idx_audit_timestamp');
      expect(indexNames).toContain('idx_highlights_session');
    });

    it('should be idempotent (can run multiple times)', () => {
      // First initialization
      initializeSchema();
      const firstVerification = verifySchema();

      // Second initialization
      initializeSchema();
      const secondVerification = verifySchema();

      // Both should succeed
      expect(firstVerification.valid).toBe(true);
      expect(secondVerification.valid).toBe(true);
    });
  });

  describe('verifySchema', () => {
    it('should return valid=false when no tables exist', () => {
      const verification = verifySchema();
      
      expect(verification.valid).toBe(false);
      expect(verification.missingTables.length).toBeGreaterThan(0);
    });

    it('should return valid=true when all tables exist', () => {
      initializeSchema();
      
      const verification = verifySchema();
      
      expect(verification.valid).toBe(true);
      expect(verification.missingTables).toEqual([]);
    });

    it('should list missing tables correctly', () => {
      // Don't initialize schema
      const verification = verifySchema();
      
      expect(verification.missingTables).toContain('patients');
      expect(verification.missingTables).toContain('sessions');
      expect(verification.missingTables).toContain('session_events');
      expect(verification.missingTables).toContain('crisis_events');
      expect(verification.missingTables).toContain('embedding_jobs');
      expect(verification.missingTables).toContain('audit_log');
      expect(verification.missingTables).toContain('conversation_highlights');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should enforce foreign key constraint on sessions.patient_id', () => {
      initializeSchema();
      const db = sqliteManager.getDb();

      // Enable foreign keys
      db.exec('PRAGMA foreign_keys = ON');

      // Try to insert session without patient
      expect(() => {
        db.prepare(`
          INSERT INTO sessions (session_id, patient_id, session_number, started_at)
          VALUES ('session-1', 'nonexistent-patient', 1, datetime('now'))
        `).run();
      }).toThrow();
    });

    it('should cascade delete sessions when patient is deleted', () => {
      initializeSchema();
      const db = sqliteManager.getDb();
      db.exec('PRAGMA foreign_keys = ON');

      // Insert patient
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES ('patient-1', 'key-1')
      `).run();

      // Insert session
      db.prepare(`
        INSERT INTO sessions (session_id, patient_id, session_number, started_at)
        VALUES ('session-1', 'patient-1', 1, datetime('now'))
      `).run();

      // Delete patient
      db.prepare('DELETE FROM patients WHERE patient_id = ?').run('patient-1');

      // Session should be deleted
      const sessions = db.prepare('SELECT * FROM sessions WHERE session_id = ?').all('session-1');
      expect(sessions.length).toBe(0);
    });
  });

  describe('Check Constraints', () => {
    it('should enforce risk_level check constraint on patients', () => {
      initializeSchema();
      const db = sqliteManager.getDb();

      expect(() => {
        db.prepare(`
          INSERT INTO patients (patient_id, encryption_key_id, current_risk_level)
          VALUES ('patient-1', 'key-1', 'invalid_level')
        `).run();
      }).toThrow();
    });

    it('should enforce session_status check constraint on sessions', () => {
      initializeSchema();
      const db = sqliteManager.getDb();

      // First insert a patient
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES ('patient-1', 'key-1')
      `).run();

      expect(() => {
        db.prepare(`
          INSERT INTO sessions (session_id, patient_id, session_number, started_at, session_status)
          VALUES ('session-1', 'patient-1', 1, datetime('now'), 'invalid_status')
        `).run();
      }).toThrow();
    });

    it('should enforce severity_tier check constraint on crisis_events', () => {
      initializeSchema();
      const db = sqliteManager.getDb();

      // Insert patient and session
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES ('patient-1', 'key-1')
      `).run();
      
      db.prepare(`
        INSERT INTO sessions (session_id, patient_id, session_number, started_at)
        VALUES ('session-1', 'patient-1', 1, datetime('now'))
      `).run();

      expect(() => {
        db.prepare(`
          INSERT INTO crisis_events (crisis_id, session_id, patient_id, detected_at, severity_tier, trigger_indicators)
          VALUES ('crisis-1', 'session-1', 'patient-1', datetime('now'), 5, '[]')
        `).run();
      }).toThrow();
    });
  });
});
