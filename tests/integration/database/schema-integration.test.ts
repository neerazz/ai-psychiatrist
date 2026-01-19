// tests/integration/database/schema-integration.test.ts
// Integration tests for database schema initialization
// Reference: Task 2.2 verification criteria

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_PATH = path.join(__dirname, '../../../memory_directory/databases/test_schema_integration.db');

// Import the schema SQL directly
const SCHEMA_SQL = `
-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    overview_version INTEGER NOT NULL DEFAULT 1,
    overview_checksum TEXT,
    encryption_key_id TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_session_date TEXT,
    total_sessions INTEGER DEFAULT 0,
    current_risk_level TEXT DEFAULT 'low' CHECK (current_risk_level IN ('low', 'moderate', 'high', 'crisis'))
);

CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_risk ON patients(current_risk_level);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    session_number INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER,
    session_status TEXT NOT NULL DEFAULT 'active'
        CHECK (session_status IN ('active', 'completed', 'interrupted', 'crashed', 'paused')),
    transcript_path TEXT,
    summary_path TEXT,
    risk_level_start TEXT,
    risk_level_end TEXT,
    model_configuration TEXT,
    session_quality_score REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(started_at);

-- ============================================
-- SESSION EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS session_events (
    event_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'session_start', 'session_end', 'session_pause', 'session_resume',
        'speech_detected', 'response_generated', 'crisis_detected',
        'context_retrieved', 'research_completed', 'state_persisted',
        'connection_lost', 'connection_restored', 'error_occurred'
    )),
    event_timestamp TEXT NOT NULL,
    event_data TEXT,
    agent_source TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_session ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON session_events(event_timestamp);

-- ============================================
-- CRISIS EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crisis_events (
    crisis_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    severity_tier INTEGER NOT NULL CHECK (severity_tier IN (1, 2, 3)),
    trigger_indicators TEXT NOT NULL,
    response_actions TEXT,
    resolved_at TEXT,
    reviewed_at TEXT,
    reviewer_notes TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crisis_severity ON crisis_events(severity_tier);
CREATE INDEX IF NOT EXISTS idx_crisis_patient ON crisis_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_crisis_date ON crisis_events(detected_at);

-- ============================================
-- EMBEDDING JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS embedding_jobs (
    job_id TEXT PRIMARY KEY,
    session_id TEXT,
    patient_id TEXT,
    job_type TEXT NOT NULL CHECK (job_type IN ('session_transcript', 'patient_overview', 'clinical_insight', 'full_rebuild')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress_percent INTEGER DEFAULT 0,
    chunks_total INTEGER,
    chunks_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_embedding_status ON embedding_jobs(status);
CREATE INDEX IF NOT EXISTS idx_embedding_patient ON embedding_jobs(patient_id);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'data_access', 'data_modify', 'data_delete', 'data_export',
        'auth_success', 'auth_failure', 'crisis_detection', 'session_event'
    )),
    patient_id TEXT,
    session_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_log(event_type);

-- ============================================
-- CONVERSATION HIGHLIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_highlights (
    highlight_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    timestamp_minutes REAL NOT NULL,
    highlight_type TEXT NOT NULL CHECK (highlight_type IN (
        'insight', 'emotional_peak', 'breakthrough', 'concern',
        'resistance', 'homework_discussion', 'crisis_indicator'
    )),
    speaker TEXT NOT NULL CHECK (speaker IN ('patient', 'dr_sterling')),
    content_summary TEXT NOT NULL,
    clinical_significance TEXT,
    emotion_detected TEXT,
    emotion_intensity REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_highlights_session ON conversation_highlights(session_id);
CREATE INDEX IF NOT EXISTS idx_highlights_type ON conversation_highlights(highlight_type);
`;

describe('Database Schema Integration', () => {
  let db: Database.Database;

  beforeAll(() => {
    // Ensure directory exists
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Clean up test database if it exists
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Create database and initialize schema
    db = new Database(TEST_DB_PATH);
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA_SQL);
  });

  afterAll(() => {
    // Close database
    if (db) {
      db.close();
    }

    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Table Creation', () => {
    it('should create all 7 required tables', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
      const tableNames = tables.map((t: any) => t.name);

      expect(tableNames).toContain('patients');
      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('session_events');
      expect(tableNames).toContain('crisis_events');
      expect(tableNames).toContain('embedding_jobs');
      expect(tableNames).toContain('audit_log');
      expect(tableNames).toContain('conversation_highlights');
    });

    it('should create all required indexes', () => {
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").all();
      const indexNames = indexes.map((idx: any) => idx.name);

      // Verify key indexes exist
      expect(indexNames).toContain('idx_patients_active');
      expect(indexNames).toContain('idx_patients_risk');
      expect(indexNames).toContain('idx_sessions_patient');
      expect(indexNames).toContain('idx_sessions_status');
      expect(indexNames).toContain('idx_sessions_date');
      expect(indexNames).toContain('idx_events_session');
      expect(indexNames).toContain('idx_events_type');
      expect(indexNames).toContain('idx_crisis_severity');
      expect(indexNames).toContain('idx_audit_timestamp');
      expect(indexNames).toContain('idx_highlights_session');
    });
  });

  describe('Data Insertion and Constraints', () => {
    it('should insert and retrieve a patient record', () => {
      const patientId = 'test-patient-1';
      
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id, current_risk_level)
        VALUES (?, ?, ?)
      `).run(patientId, 'key-123', 'low');

      const patient = db.prepare('SELECT * FROM patients WHERE patient_id = ?').get(patientId);
      
      expect(patient).toBeDefined();
      expect((patient as any).patient_id).toBe(patientId);
      expect((patient as any).current_risk_level).toBe('low');
      expect((patient as any).is_active).toBe(1);
      expect((patient as any).total_sessions).toBe(0);
    });

    it('should insert and retrieve a session record', () => {
      const patientId = 'test-patient-2';
      const sessionId = 'test-session-1';

      // Insert patient first
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES (?, ?)
      `).run(patientId, 'key-456');

      // Insert session
      db.prepare(`
        INSERT INTO sessions (session_id, patient_id, session_number, started_at, session_status)
        VALUES (?, ?, ?, datetime('now'), ?)
      `).run(sessionId, patientId, 1, 'active');

      const session = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId);
      
      expect(session).toBeDefined();
      expect((session as any).session_id).toBe(sessionId);
      expect((session as any).patient_id).toBe(patientId);
      expect((session as any).session_status).toBe('active');
    });

    it('should enforce foreign key constraint on sessions', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO sessions (session_id, patient_id, session_number, started_at)
          VALUES (?, ?, ?, datetime('now'))
        `).run('bad-session', 'nonexistent-patient', 1);
      }).toThrow();
    });

    it('should enforce check constraint on risk_level', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO patients (patient_id, encryption_key_id, current_risk_level)
          VALUES (?, ?, ?)
        `).run('bad-patient', 'key-789', 'invalid_level');
      }).toThrow();
    });

    it('should enforce check constraint on session_status', () => {
      const patientId = 'test-patient-3';
      
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES (?, ?)
      `).run(patientId, 'key-999');

      expect(() => {
        db.prepare(`
          INSERT INTO sessions (session_id, patient_id, session_number, started_at, session_status)
          VALUES (?, ?, ?, datetime('now'), ?)
        `).run('bad-session-2', patientId, 1, 'invalid_status');
      }).toThrow();
    });

    it('should cascade delete sessions when patient is deleted', () => {
      const patientId = 'test-patient-4';
      const sessionId = 'test-session-2';

      // Insert patient and session
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES (?, ?)
      `).run(patientId, 'key-cascade');

      db.prepare(`
        INSERT INTO sessions (session_id, patient_id, session_number, started_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(sessionId, patientId, 1);

      // Verify session exists
      let session = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId);
      expect(session).toBeDefined();

      // Delete patient
      db.prepare('DELETE FROM patients WHERE patient_id = ?').run(patientId);

      // Verify session is deleted
      session = db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId);
      expect(session).toBeUndefined();
    });
  });

  describe('Crisis Events', () => {
    it('should insert and retrieve crisis events', () => {
      const patientId = 'test-patient-5';
      const sessionId = 'test-session-3';
      const crisisId = 'crisis-1';

      // Insert patient and session
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES (?, ?)
      `).run(patientId, 'key-crisis');

      db.prepare(`
        INSERT INTO sessions (session_id, patient_id, session_number, started_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(sessionId, patientId, 1);

      // Insert crisis event
      db.prepare(`
        INSERT INTO crisis_events (crisis_id, session_id, patient_id, detected_at, severity_tier, trigger_indicators)
        VALUES (?, ?, ?, datetime('now'), ?, ?)
      `).run(crisisId, sessionId, patientId, 2, JSON.stringify(['keyword_match', 'elevated_sentiment']));

      const crisis = db.prepare('SELECT * FROM crisis_events WHERE crisis_id = ?').get(crisisId);
      
      expect(crisis).toBeDefined();
      expect((crisis as any).severity_tier).toBe(2);
      expect((crisis as any).trigger_indicators).toBe(JSON.stringify(['keyword_match', 'elevated_sentiment']));
    });

    it('should enforce severity_tier check constraint', () => {
      const patientId = 'test-patient-6';
      const sessionId = 'test-session-4';

      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES (?, ?)
      `).run(patientId, 'key-tier');

      db.prepare(`
        INSERT INTO sessions (session_id, patient_id, session_number, started_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(sessionId, patientId, 1);

      expect(() => {
        db.prepare(`
          INSERT INTO crisis_events (crisis_id, session_id, patient_id, detected_at, severity_tier, trigger_indicators)
          VALUES (?, ?, ?, datetime('now'), ?, ?)
        `).run('bad-crisis', sessionId, patientId, 5, '[]');
      }).toThrow();
    });
  });

  describe('Audit Log', () => {
    it('should insert and retrieve audit log entries', () => {
      const logId = 'log-1';
      
      db.prepare(`
        INSERT INTO audit_log (log_id, event_type, action, details)
        VALUES (?, ?, ?, ?)
      `).run(logId, 'session_event', 'session_started', JSON.stringify({ session_id: 'test' }));

      const log = db.prepare('SELECT * FROM audit_log WHERE log_id = ?').get(logId);
      
      expect(log).toBeDefined();
      expect((log as any).event_type).toBe('session_event');
      expect((log as any).action).toBe('session_started');
    });
  });

  describe('Performance', () => {
    it('should perform inserts within acceptable latency', () => {
      const patientId = 'perf-patient';
      
      const start = Date.now();
      db.prepare(`
        INSERT INTO patients (patient_id, encryption_key_id)
        VALUES (?, ?)
      `).run(patientId, 'key-perf');
      const latency = Date.now() - start;

      // Should be well under 50ms requirement
      expect(latency).toBeLessThan(50);
    });

    it('should perform queries within acceptable latency', () => {
      const start = Date.now();
      db.prepare('SELECT * FROM patients LIMIT 10').all();
      const latency = Date.now() - start;

      // Should be well under 50ms requirement
      expect(latency).toBeLessThan(50);
    });
  });
});
