// src/database/repositories/session.repository.ts
// Session data access operations
// Reference: data_schemas.md Section 3 (sessions table)

import { v4 as uuidv4 } from 'uuid';
import { sqliteManager } from '../sqlite.js';
import { logger, logAuditEvent } from '../../utils/logger.js';

export interface SessionRecord {
  session_id: string;
  patient_id: string;
  session_number: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  session_status: 'active' | 'completed' | 'interrupted' | 'crashed' | 'paused';
  transcript_path: string | null;
  summary_path: string | null;
  risk_level_start: string | null;
  risk_level_end: string | null;
  model_configuration: string | null;
  session_quality_score: number | null;
  created_at: string;
}

export interface CreateSessionInput {
  patient_id: string;
  risk_level_start?: string;
  model_configuration?: Record<string, unknown>;
}

/**
 * Session Repository
 * Handles all session-related database operations
 */
export class SessionRepository {
  /**
   * Create a new session
   * @returns The created session ID
   */
  public create(input: CreateSessionInput): string {
    const db = sqliteManager.getDb();
    const sessionId = uuidv4();

    // Get next session number for this patient
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE patient_id = ?');
    const countResult = countStmt.get(input.patient_id) as { count: number };
    const sessionNumber = countResult.count + 1;

    const stmt = db.prepare(`
      INSERT INTO sessions (
        session_id, patient_id, session_number, started_at,
        session_status, risk_level_start, model_configuration
      )
      VALUES (?, ?, ?, datetime('now'), 'active', ?, ?)
    `);

    stmt.run(
      sessionId,
      input.patient_id,
      sessionNumber,
      input.risk_level_start || null,
      input.model_configuration ? JSON.stringify(input.model_configuration) : null
    );

    logAuditEvent('session_event', input.patient_id, sessionId, 'session_created');
    logger.info('Session created', { sessionId, patientId: input.patient_id, sessionNumber });

    return sessionId;
  }

  /**
   * Get session by ID
   */
  public getById(sessionId: string): SessionRecord | null {
    const db = sqliteManager.getDb();
    const stmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
    return stmt.get(sessionId) as SessionRecord | undefined || null;
  }

  /**
   * Get active session for patient (should only be one)
   */
  public getActiveForPatient(patientId: string): SessionRecord | null {
    const db = sqliteManager.getDb();
    const stmt = db.prepare(`
      SELECT * FROM sessions
      WHERE patient_id = ? AND session_status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `);
    return stmt.get(patientId) as SessionRecord | undefined || null;
  }

  /**
   * Get recent sessions for patient
   * @param limit Number of sessions to return (default: 10)
   */
  public getRecentForPatient(patientId: string, limit: number = 10): SessionRecord[] {
    const db = sqliteManager.getDb();
    const stmt = db.prepare(`
      SELECT * FROM sessions
      WHERE patient_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `);
    return stmt.all(patientId, limit) as SessionRecord[];
  }

  /**
   * Complete a session
   * Reference: Requirements R1 (session ends at 25 min)
   */
  public complete(
    sessionId: string,
    riskLevelEnd: string,
    qualityScore: number | null,
    transcriptPath: string,
    summaryPath: string
  ): void {
    const db = sqliteManager.getDb();

    // Calculate duration
    const session = this.getById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const startTime = new Date(session.started_at);
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const stmt = db.prepare(`
      UPDATE sessions
      SET ended_at = datetime('now'),
          duration_seconds = ?,
          session_status = 'completed',
          risk_level_end = ?,
          session_quality_score = ?,
          transcript_path = ?,
          summary_path = ?
      WHERE session_id = ?
    `);

    stmt.run(durationSeconds, riskLevelEnd, qualityScore, transcriptPath, summaryPath, sessionId);
    logAuditEvent('session_event', session.patient_id, sessionId, 'session_completed');
    logger.info('Session completed', { sessionId, durationSeconds });
  }

  /**
   * Update session status (for pause, interrupt, crash)
   */
  public updateStatus(sessionId: string, status: SessionRecord['session_status']): void {
    const db = sqliteManager.getDb();
    const stmt = db.prepare('UPDATE sessions SET session_status = ? WHERE session_id = ?');
    stmt.run(status, sessionId);

    const session = this.getById(sessionId);
    logAuditEvent('session_event', session?.patient_id || null, sessionId, `session_status_${status}`);
  }
}

// Export singleton
export const sessionRepository = new SessionRepository();
