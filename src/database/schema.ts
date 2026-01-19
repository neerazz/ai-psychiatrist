// src/database/schema.ts
// Database schema initialization
// Implements: Requirements R26 (Session Database), R38 (Audit Logging)
// Reference: data_schemas.md Section 3 (exact table definitions)

import { sqliteManager } from './sqlite.js';
import { logger } from '../utils/logger.js';

/**
 * Complete database schema from data_schemas.md Section 3
 *
 * Tables (7 total):
 * 1. patients: Patient records with risk levels
 * 2. sessions: Session records with status tracking
 * 3. session_events: Audit trail for session events
 * 4. crisis_events: Crisis detection records
 * 5. embedding_jobs: Vector embedding job queue
 * 6. audit_log: Security audit trail (6-year retention)
 * 7. conversation_highlights: Session highlights
 */
export const SCHEMA_SQL = `
-- ============================================
-- PATIENTS TABLE
-- Reference: data_schemas.md Section 3
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
-- Reference: data_schemas.md Section 3, R1 (session lifecycle)
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
-- SESSION EVENTS TABLE (Audit Trail)
-- Reference: data_schemas.md Section 3, system_architecture.md S2
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
-- Reference: data_schemas.md Section 3, R31 (Crisis Detection)
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
-- Reference: data_schemas.md Section 3, R27-R28 (Vector Database)
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
-- Reference: data_schemas.md Section 3, R38 (6-year retention)
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
-- Reference: data_schemas.md Section 3, R14 (Conversation_Highlights)
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

/**
 * Initialize the database schema
 * Creates all tables and indexes if they don't exist
 * 
 * Reference: AGENTS.md Article III (Test-First), Gate 1 (Pre-Code checks)
 */
export function initializeSchema(): void {
  logger.info('Initializing database schema...');

  const db = sqliteManager.getDb();

  // Execute schema SQL
  db.exec(SCHEMA_SQL);

  logger.info('Database schema initialized successfully');
}

/**
 * Verify schema is correctly initialized
 * Checks that all required tables exist
 * 
 * @returns Object with validation status and list of missing tables
 */
export function verifySchema(): { valid: boolean; missingTables: string[] } {
  const requiredTables = [
    'patients',
    'sessions',
    'session_events',
    'crisis_events',
    'embedding_jobs',
    'audit_log',
    'conversation_highlights'
  ];

  const db = sqliteManager.getDb();
  const existingTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((row: any) => row.name);

  const missingTables = requiredTables.filter(t => !existingTables.includes(t));

  return {
    valid: missingTables.length === 0,
    missingTables
  };
}
