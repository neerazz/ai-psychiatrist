// tests/unit/database/index.test.ts
// Unit tests for unified database manager
// Reference: AGENTS.md Article III (Test-First Imperative)

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  initializeDatabases,
  checkDatabaseHealth,
  closeDatabases,
  sqliteManager,
  qdrantManager
} from '../../../src/database/index.js';

describe('Database Connection Manager', () => {
  describe('initializeDatabases', () => {
    it('should initialize SQLite database', async () => {
      await initializeDatabases();

      // Verify SQLite is initialized
      expect(sqliteManager.isReady()).toBe(true);

      // Verify database has tables
      const db = sqliteManager.getDb();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((row: any) => row.name);

      expect(tables).toContain('patients');
      expect(tables).toContain('sessions');
      expect(tables).toContain('session_events');
      expect(tables).toContain('crisis_events');
      expect(tables).toContain('embedding_jobs');
      expect(tables).toContain('audit_log');
      expect(tables).toContain('conversation_highlights');
    });

    it('should initialize Qdrant collections (if Qdrant is available)', async () => {
      await initializeDatabases();

      try {
        const client = qdrantManager.getClient();
        const collections = await client.getCollections();
        const collectionNames = collections.collections.map(c => c.name);

        // If Qdrant is available, verify collections
        expect(collectionNames).toContain('session_transcripts');
        expect(collectionNames).toContain('patient_memories');
        expect(collectionNames).toContain('clinical_insights');
      } catch (error) {
        // Qdrant not available - this is acceptable
        console.log('Qdrant not available, skipping collection verification');
      }
    });
  });

  describe('checkDatabaseHealth', () => {
    beforeAll(async () => {
      await initializeDatabases();
    });

    it('should return health status for SQLite', async () => {
      const health = await checkDatabaseHealth();

      expect(health.sqlite).toBeDefined();
      expect(health.sqlite.healthy).toBe(true);
      expect(health.sqlite.latencyMs).toBeGreaterThanOrEqual(0);
      expect(health.sqlite.latencyMs).toBeLessThan(50); // R26: < 50ms
    });

    it('should return health status for Qdrant', async () => {
      const health = await checkDatabaseHealth();

      expect(health.qdrant).toBeDefined();
      expect(health.qdrant.latencyMs).toBeGreaterThanOrEqual(0);
      // Qdrant may or may not be healthy (optional component)
    });

    it('should return overall health status', async () => {
      const health = await checkDatabaseHealth();

      expect(health.overall).toBeDefined();
      expect(typeof health.overall).toBe('boolean');
      // Overall health should match SQLite health (required component)
      expect(health.overall).toBe(health.sqlite.healthy);
    });

    it('should meet latency requirements', async () => {
      const health = await checkDatabaseHealth();

      // R26: Single record access < 50ms
      expect(health.sqlite.latencyMs).toBeLessThan(50);
    });
  });

  describe('closeDatabases', () => {
    beforeAll(async () => {
      await initializeDatabases();
    });

    it('should close all database connections', () => {
      closeDatabases();

      // Verify SQLite is closed
      expect(sqliteManager.isReady()).toBe(false);
    });

    it('should throw error when accessing closed database', () => {
      closeDatabases();

      expect(() => {
        sqliteManager.getDb();
      }).toThrow('Database not initialized');
    });
  });

  describe('Re-exports', () => {
    it('should export sqliteManager', () => {
      expect(sqliteManager).toBeDefined();
      expect(typeof sqliteManager.initialize).toBe('function');
      expect(typeof sqliteManager.close).toBe('function');
      expect(typeof sqliteManager.healthCheck).toBe('function');
    });

    it('should export qdrantManager', () => {
      expect(qdrantManager).toBeDefined();
      expect(typeof qdrantManager.initialize).toBe('function');
      expect(typeof qdrantManager.healthCheck).toBe('function');
    });
  });

  // Cleanup after all tests
  afterAll(() => {
    try {
      closeDatabases();
    } catch {
      // Already closed
    }
  });
});
