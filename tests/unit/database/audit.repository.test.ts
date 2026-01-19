// tests/unit/database/audit.repository.test.ts
// Unit tests for Audit Repository with HMAC signatures
// Reference: Task 2.7 verification criteria

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { sqliteManager } from '../../../src/database/sqlite.js';
import { initializeSchema } from '../../../src/database/schema.js';
import { auditRepository, AuditRepository } from '../../../src/database/repositories/audit.repository.js';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = 'memory_directory/databases/test_audit.db';

describe('AuditRepository', () => {
  beforeAll(() => {
    // Ensure test database directory exists
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize test database
    sqliteManager.initialize(TEST_DB_PATH);
    initializeSchema();
  });

  afterAll(() => {
    // Clean up test database
    sqliteManager.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    // Clear audit_log table before each test
    const db = sqliteManager.getDb();
    db.prepare('DELETE FROM audit_log').run();

    // Re-initialize repository
    await auditRepository.initialize();
  });

  describe('create', () => {
    it('should create audit entry with checksum', () => {
      const logId = auditRepository.create({
        event_type: 'session_event',
        patient_id: 'patient_123',
        session_id: 'session_456',
        action: 'session_started',
        details: { test: 'data' }
      });

      expect(logId).toBeTruthy();
      expect(typeof logId).toBe('string');

      // Verify entry was created
      const entries = auditRepository.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].log_id).toBe(logId);
      expect(entries[0].checksum).toBeTruthy();
    });

    it('should create multiple entries with unique checksums', () => {
      const logId1 = auditRepository.create({
        event_type: 'data_access',
        action: 'first_entry'
      });

      const logId2 = auditRepository.create({
        event_type: 'data_modify',
        action: 'second_entry'
      });

      const logId3 = auditRepository.create({
        event_type: 'data_delete',
        action: 'third_entry'
      });

      const entries = auditRepository.getAll();
      expect(entries).toHaveLength(3);

      // All checksums should be unique
      const checksums = entries.map(e => e.checksum);
      const uniqueChecksums = new Set(checksums);
      expect(uniqueChecksums.size).toBe(3);
    });

    it('should create chained checksums', () => {
      auditRepository.create({
        event_type: 'session_event',
        action: 'entry_1'
      });

      auditRepository.create({
        event_type: 'session_event',
        action: 'entry_2'
      });

      const entries = auditRepository.getAll();
      expect(entries).toHaveLength(2);

      // Checksums should be different (chained)
      expect(entries[0].checksum).not.toBe(entries[1].checksum);
    });
  });

  describe('verifyIntegrity', () => {
    it('should return valid for untampered logs', () => {
      // Create multiple entries
      auditRepository.create({
        event_type: 'session_event',
        action: 'entry_1'
      });

      auditRepository.create({
        event_type: 'data_access',
        action: 'entry_2'
      });

      auditRepository.create({
        event_type: 'data_modify',
        action: 'entry_3'
      });

      const result = auditRepository.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect(result.brokenAt).toBeNull();
    });

    it('should detect tampered log entry', () => {
      // Create entries
      auditRepository.create({
        event_type: 'session_event',
        action: 'entry_1'
      });

      const logId2 = auditRepository.create({
        event_type: 'data_access',
        action: 'entry_2'
      });

      auditRepository.create({
        event_type: 'data_modify',
        action: 'entry_3'
      });

      // Manually tamper with middle entry
      const db = sqliteManager.getDb();
      db.prepare('UPDATE audit_log SET action = ? WHERE log_id = ?')
        .run('tampered_action', logId2);

      // Verify should detect tampering
      const result = auditRepository.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect(result.brokenAt).toBe(logId2);
    });

    it('should detect tampered checksum', () => {
      // Create entries
      auditRepository.create({
        event_type: 'session_event',
        action: 'entry_1'
      });

      const logId2 = auditRepository.create({
        event_type: 'data_access',
        action: 'entry_2'
      });

      // Manually tamper with checksum
      const db = sqliteManager.getDb();
      db.prepare('UPDATE audit_log SET checksum = ? WHERE log_id = ?')
        .run('fake_checksum_12345', logId2);

      // Verify should detect tampering
      const result = auditRepository.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect(result.brokenAt).toBe(logId2);
    });

    it('should return valid for empty log', () => {
      const result = auditRepository.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect(result.brokenAt).toBeNull();
    });
  });

  describe('getForPatient', () => {
    it('should retrieve audit entries for specific patient', () => {
      auditRepository.create({
        event_type: 'session_event',
        patient_id: 'patient_123',
        action: 'session_started'
      });

      auditRepository.create({
        event_type: 'data_access',
        patient_id: 'patient_456',
        action: 'data_read'
      });

      auditRepository.create({
        event_type: 'data_modify',
        patient_id: 'patient_123',
        action: 'data_updated'
      });

      const patient123Entries = auditRepository.getForPatient('patient_123');
      expect(patient123Entries).toHaveLength(2);
      expect(patient123Entries.every(e => e.patient_id === 'patient_123')).toBe(true);

      const patient456Entries = auditRepository.getForPatient('patient_456');
      expect(patient456Entries).toHaveLength(1);
      expect(patient456Entries[0].patient_id).toBe('patient_456');
    });

    it('should respect limit parameter', () => {
      // Create 5 entries for same patient
      for (let i = 0; i < 5; i++) {
        auditRepository.create({
          event_type: 'session_event',
          patient_id: 'patient_123',
          action: `action_${i}`
        });
      }

      const entries = auditRepository.getForPatient('patient_123', 3);
      expect(entries).toHaveLength(3);
    });
  });

  describe('getByEventType', () => {
    it('should retrieve entries by event type', () => {
      auditRepository.create({
        event_type: 'session_event',
        action: 'session_1'
      });

      auditRepository.create({
        event_type: 'data_access',
        action: 'access_1'
      });

      auditRepository.create({
        event_type: 'session_event',
        action: 'session_2'
      });

      const sessionEvents = auditRepository.getByEventType('session_event');
      expect(sessionEvents).toHaveLength(2);
      expect(sessionEvents.every(e => e.event_type === 'session_event')).toBe(true);

      const accessEvents = auditRepository.getByEventType('data_access');
      expect(accessEvents).toHaveLength(1);
      expect(accessEvents[0].event_type).toBe('data_access');
    });
  });

  describe('initialize', () => {
    it('should load last checksum on initialization', async () => {
      // Create some entries
      auditRepository.create({
        event_type: 'session_event',
        action: 'entry_1'
      });

      auditRepository.create({
        event_type: 'session_event',
        action: 'entry_2'
      });

      // Create new repository instance and initialize
      const newRepo = new AuditRepository();
      await newRepo.initialize();

      // Create new entry - should chain from last checksum
      const logId = newRepo.create({
        event_type: 'session_event',
        action: 'entry_3'
      });

      // Verify integrity should still pass
      const result = newRepo.verifyIntegrity();
      expect(result.valid).toBe(true);
    });
  });

  describe('HMAC chain integrity', () => {
    it('should maintain chain integrity across multiple entries', () => {
      // Create 10 entries
      for (let i = 0; i < 10; i++) {
        auditRepository.create({
          event_type: 'session_event',
          action: `entry_${i}`,
          details: { index: i }
        });
      }

      // Verify entire chain
      const result = auditRepository.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect(result.brokenAt).toBeNull();
    });

    it('should detect tampering at any position in chain', () => {
      // Create 5 entries
      const logIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const logId = auditRepository.create({
          event_type: 'session_event',
          action: `entry_${i}`
        });
        logIds.push(logId);
      }

      // Tamper with first entry
      const db = sqliteManager.getDb();
      db.prepare('UPDATE audit_log SET action = ? WHERE log_id = ?')
        .run('tampered', logIds[0]);

      const result = auditRepository.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect(result.brokenAt).toBe(logIds[0]);
    });

    it('should detect tampering in middle of chain', () => {
      // Create 5 entries
      const logIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const logId = auditRepository.create({
          event_type: 'session_event',
          action: `entry_${i}`
        });
        logIds.push(logId);
      }

      // Tamper with middle entry
      const db = sqliteManager.getDb();
      db.prepare('UPDATE audit_log SET action = ? WHERE log_id = ?')
        .run('tampered', logIds[2]);

      const result = auditRepository.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect(result.brokenAt).toBe(logIds[2]);
    });
  });
});
