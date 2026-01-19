// src/database/repositories/audit.repository.ts
// Audit logging with HMAC signatures for tamper detection
// Reference: Requirements R38 (6-year retention, tamper-evident)

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sqliteManager } from '../sqlite.js';
import { logger } from '../../utils/logger.js';

// HMAC secret key - in production, load from secure storage
const AUDIT_HMAC_SECRET = process.env.AUDIT_HMAC_SECRET || 'default-audit-secret-change-in-production';

export type AuditEventType =
  | 'data_access'
  | 'data_modify'
  | 'data_delete'
  | 'data_export'
  | 'auth_success'
  | 'auth_failure'
  | 'crisis_detection'
  | 'session_event';

export interface AuditLogEntry {
  log_id: string;
  timestamp: string;
  event_type: AuditEventType;
  patient_id: string | null;
  session_id: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  checksum: string;
}

export interface CreateAuditEntryInput {
  event_type: AuditEventType;
  patient_id?: string | null;
  session_id?: string | null;
  action: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Audit Repository
 * Creates tamper-evident audit log entries with HMAC checksums
 *
 * Checksum chain: Each entry's checksum includes the previous entry's checksum
 * This creates a tamper-evident chain similar to blockchain
 */
export class AuditRepository {
  private lastChecksum: string | null = null;

  /**
   * Initialize by loading the last checksum from the database
   */
  public async initialize(): Promise<void> {
    const db = sqliteManager.getDb();

    const stmt = db.prepare(`
      SELECT checksum FROM audit_log
      ORDER BY timestamp DESC
      LIMIT 1
    `);
    const result = stmt.get() as { checksum: string } | undefined;

    this.lastChecksum = result?.checksum || null;
    logger.info('Audit repository initialized', { hasExistingEntries: !!this.lastChecksum });
  }

  /**
   * Generate HMAC checksum for an entry
   * Includes previous checksum for chain integrity
   */
  private generateChecksum(
    entry: Omit<AuditLogEntry, 'checksum'>,
    previousChecksum: string | null
  ): string {
    const data = JSON.stringify({
      ...entry,
      previousChecksum
    });

    return crypto
      .createHmac('sha256', AUDIT_HMAC_SECRET)
      .update(data)
      .digest('hex');
  }

  /**
   * Create a new audit log entry
   * Automatically generates tamper-evident checksum
   */
  public create(input: CreateAuditEntryInput): string {
    const db = sqliteManager.getDb();
    const logId = uuidv4();
    const timestamp = new Date().toISOString();

    const entry: Omit<AuditLogEntry, 'checksum'> = {
      log_id: logId,
      timestamp,
      event_type: input.event_type,
      patient_id: input.patient_id || null,
      session_id: input.session_id || null,
      action: input.action,
      details: input.details ? JSON.stringify(input.details) : null,
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null
    };

    // Generate checksum including previous entry's checksum
    const checksum = this.generateChecksum(entry, this.lastChecksum);

    const stmt = db.prepare(`
      INSERT INTO audit_log (
        log_id, timestamp, event_type, patient_id, session_id,
        action, details, ip_address, user_agent, checksum
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      logId,
      timestamp,
      input.event_type,
      entry.patient_id,
      entry.session_id,
      input.action,
      entry.details,
      entry.ip_address,
      entry.user_agent,
      checksum
    );

    // Update last checksum for next entry
    this.lastChecksum = checksum;

    return logId;
  }

  /**
   * Verify the integrity of the audit log chain
   * Returns true if all checksums are valid
   */
  public verifyIntegrity(): { valid: boolean; brokenAt: string | null } {
    const db = sqliteManager.getDb();

    const stmt = db.prepare('SELECT * FROM audit_log ORDER BY timestamp ASC');
    const entries = stmt.all() as AuditLogEntry[];

    let previousChecksum: string | null = null;

    for (const entry of entries) {
      const expectedChecksum = this.generateChecksum(
        {
          log_id: entry.log_id,
          timestamp: entry.timestamp,
          event_type: entry.event_type,
          patient_id: entry.patient_id,
          session_id: entry.session_id,
          action: entry.action,
          details: entry.details,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent
        },
        previousChecksum
      );

      if (entry.checksum !== expectedChecksum) {
        logger.error('Audit log integrity violation detected', { logId: entry.log_id });
        return { valid: false, brokenAt: entry.log_id };
      }

      previousChecksum = entry.checksum;
    }

    return { valid: true, brokenAt: null };
  }

  /**
   * Get audit entries for a patient
   * Reference: Requirements R38 (data export for GDPR)
   */
  public getForPatient(patientId: string, limit: number = 100): AuditLogEntry[] {
    const db = sqliteManager.getDb();
    const stmt = db.prepare(`
      SELECT * FROM audit_log
      WHERE patient_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(patientId, limit) as AuditLogEntry[];
  }

  /**
   * Get all audit entries (for integrity verification)
   */
  public getAll(limit: number = 1000): AuditLogEntry[] {
    const db = sqliteManager.getDb();
    const stmt = db.prepare(`
      SELECT * FROM audit_log
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit) as AuditLogEntry[];
  }

  /**
   * Get audit entries by event type
   */
  public getByEventType(eventType: AuditEventType, limit: number = 100): AuditLogEntry[] {
    const db = sqliteManager.getDb();
    const stmt = db.prepare(`
      SELECT * FROM audit_log
      WHERE event_type = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(eventType, limit) as AuditLogEntry[];
  }
}

// Export singleton
export const auditRepository = new AuditRepository();
