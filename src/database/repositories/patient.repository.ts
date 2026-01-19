// src/database/repositories/patient.repository.ts
// Patient data access operations
// Reference: data_schemas.md Section 1 (Patient_Overview), Section 3 (patients table)

import { v4 as uuidv4 } from 'uuid';
import { sqliteManager } from '../sqlite.js';
import { logger, logAuditEvent } from '../../utils/logger.js';

export interface PatientRecord {
  patient_id: string;
  created_at: string;
  updated_at: string;
  overview_version: number;
  overview_checksum: string | null;
  encryption_key_id: string;
  is_active: number;
  last_session_date: string | null;
  total_sessions: number;
  current_risk_level: 'low' | 'moderate' | 'high' | 'crisis';
  focus_areas: string; // JSON string
  todos: string; // JSON string
}

export interface CreatePatientInput {
  encryption_key_id: string;
  current_risk_level?: 'low' | 'moderate' | 'high' | 'crisis';
  focus_areas?: string[];
  todos?: string[];
}

/**
 * Patient Repository
 * Handles all patient-related database operations
 */
export class PatientRepository {
  /**
   * Create a new patient record
   * @returns The created patient ID
   */
  public create(input: CreatePatientInput): string {
    const db = sqliteManager.getDb();
    const patientId = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO patients (
        patient_id, encryption_key_id, current_risk_level,
        focus_areas, todos
      )
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      patientId,
      input.encryption_key_id,
      input.current_risk_level || 'low',
      JSON.stringify(input.focus_areas || []),
      JSON.stringify(input.todos || [])
    );

    logAuditEvent('data_modify', patientId, null, 'patient_created');
    logger.info('Patient created', { patientId });

    return patientId;
  }

  /**
   * Get patient by ID
   * @returns Patient record or null if not found
   */
  public getById(patientId: string): PatientRecord | null {
    const db = sqliteManager.getDb();

    const stmt = db.prepare('SELECT * FROM patients WHERE patient_id = ?');
    const result = stmt.get(patientId) as PatientRecord | undefined;

    if (result) {
      logAuditEvent('data_access', patientId, null, 'patient_read');
    }

    return result || null;
  }

  /**
   * Update patient's last session date and increment session count
   */
  public updateSessionInfo(patientId: string): void {
    const db = sqliteManager.getDb();

    const stmt = db.prepare(`
      UPDATE patients
      SET last_session_date = datetime('now'),
          total_sessions = total_sessions + 1,
          updated_at = datetime('now')
      WHERE patient_id = ?
    `);

    stmt.run(patientId);
    logAuditEvent('data_modify', patientId, null, 'patient_session_updated');
  }

  /**
   * Update patient risk level
   * Reference: Requirements R31 (Crisis Detection updates risk level)
   */
  public updateRiskLevel(patientId: string, riskLevel: PatientRecord['current_risk_level']): void {
    const db = sqliteManager.getDb();

    const stmt = db.prepare(`
      UPDATE patients
      SET current_risk_level = ?,
          updated_at = datetime('now')
      WHERE patient_id = ?
    `);

    stmt.run(riskLevel, patientId);
    logAuditEvent('data_modify', patientId, null, `risk_level_updated_to_${riskLevel}`);
    logger.info('Patient risk level updated', { patientId, riskLevel });
  }

  /**
   * Get all active patients
   */
  public getAllActive(): PatientRecord[] {
    const db = sqliteManager.getDb();
    const stmt = db.prepare('SELECT * FROM patients WHERE is_active = 1');
    return stmt.all() as PatientRecord[];
  }

  /**
   * Soft delete patient (set is_active = 0)
   * Reference: Requirements R37 (data deletion with audit trail)
   */
  public softDelete(patientId: string): void {
    const db = sqliteManager.getDb();

    const stmt = db.prepare(`
      UPDATE patients
      SET is_active = 0,
          updated_at = datetime('now')
      WHERE patient_id = ?
    `);

    stmt.run(patientId);
    logAuditEvent('data_delete', patientId, null, 'patient_soft_deleted');
    logger.info('Patient soft deleted', { patientId });
  }
}

// Export singleton
export const patientRepository = new PatientRepository();
