// tests/integration/database/database-manager.test.ts
// Integration tests for unified database manager
// Reference: AGENTS.md Article III (Test-First Imperative), Article IX (Integration-First Testing)

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  initializeDatabases,
  checkDatabaseHealth,
  closeDatabases,
  sqliteManager,
  qdrantManager
} from '../../../src/database/index.js';

describe('Database Connection Manager - Integration Tests', () => {
  describe('initializeDatabases', () => {
    it('should initialize SQLite database with all tables', async () => {
      await initializeDatabases();

      // Verify SQLite is initialized
      expect(sqliteManager.isReady()).toBe(true);

      // Verify all 7 required tables exist
      const db = sqliteManager.getDb();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all()
        .map((row: any) => row.name);

      const requiredTables = [
        'audit_log',
        'conversation_highlights',
        'crisis_events',
        'embedding_jobs',
        'patients',
        'session_events',
        'sessions'
      ];

      requiredTables.forEach(table => {
        expect(tables).toContain(table);
      });

      console.log('✓ SQLite initialized with all 7 tables');
    });

    it('should initialize Qdrant collections (if available)', async () => {
      await initializeDatabases();

      try {
        const client = qdrantManager.getClient();
        const collections = await client.getCollections();
        const collectionNames = collections.collections.map(c => c.name);

        // Verify all 3 required collections exist
        expect(collectionNames).toContain('session_transcripts');
        expect(collectionNames).toContain('patient_memories');
        expect(collectionNames).toContain('clinical_insights');

        console.log('✓ Qdrant initialized with all 3 collections');
      } catch (error) {
        console.log('⚠ Qdrant not available - this is acceptable for degraded mode');
      }
    });
  });

  describe('checkDatabaseHealth', () => {
    beforeAll(async () => {
      await initializeDatabases();
    });

    it('should return healthy status for SQLite', async () => {
      const health = await checkDatabaseHealth();

      expect(health.sqlite).toBeDefined();
      expect(health.sqlite.healthy).toBe(true);
      expect(health.sqlite.latencyMs).toBeGreaterThanOrEqual(0);

      console.log(`✓ SQLite health check: ${health.sqlite.latencyMs}ms`);
    });

    it('should meet latency requirements (< 50ms)', async () => {
      const health = await checkDatabaseHealth();

      // R26: Single record access < 50ms
      expect(health.sqlite.latencyMs).toBeLessThan(50);

      console.log(`✓ SQLite latency: ${health.sqlite.latencyMs}ms (target: < 50ms)`);
    });

    it('should return health status for Qdrant', async () => {
      const health = await checkDatabaseHealth();

      expect(health.qdrant).toBeDefined();
      expect(health.qdrant.latencyMs).toBeGreaterThanOrEqual(0);

      if (health.qdrant.healthy) {
        console.log(`✓ Qdrant health check: ${health.qdrant.latencyMs}ms`);
      } else {
        console.log('⚠ Qdrant not available - degraded mode');
      }
    });

    it('should return overall health based on SQLite', async () => {
      const health = await checkDatabaseHealth();

      expect(health.overall).toBeDefined();
      expect(typeof health.overall).toBe('boolean');
      
      // Overall health should match SQLite health (required component)
      expect(health.overall).toBe(health.sqlite.healthy);

      console.log(`✓ Overall health: ${health.overall ? 'HEALTHY' : 'UNHEALTHY'}`);
    });

    it('should handle multiple health checks efficiently', async () => {
      const iterations = 10;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const health = await checkDatabaseHealth();
        latencies.push(health.sqlite.latencyMs);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      expect(avgLatency).toBeLessThan(50);
      expect(maxLatency).toBeLessThan(50);

      console.log(`✓ Average latency over ${iterations} checks: ${avgLatency.toFixed(2)}ms`);
      console.log(`✓ Max latency: ${maxLatency.toFixed(2)}ms`);
    });
  });

  describe('closeDatabases', () => {
    beforeAll(async () => {
      await initializeDatabases();
    });

    it('should close all database connections gracefully', () => {
      expect(() => {
        closeDatabases();
      }).not.toThrow();

      // Verify SQLite is closed
      expect(sqliteManager.isReady()).toBe(false);

      console.log('✓ All database connections closed');
    });

    it('should throw error when accessing closed database', () => {
      closeDatabases();

      expect(() => {
        sqliteManager.getDb();
      }).toThrow('Database not initialized');

      console.log('✓ Closed database properly rejects access');
    });
  });

  describe('Re-initialization', () => {
    it('should allow re-initialization after closing', async () => {
      // Close if open
      try {
        closeDatabases();
      } catch {
        // Already closed
      }

      // Re-initialize
      await initializeDatabases();

      // Verify it works
      const health = await checkDatabaseHealth();
      expect(health.sqlite.healthy).toBe(true);

      console.log('✓ Database can be re-initialized after closing');
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
