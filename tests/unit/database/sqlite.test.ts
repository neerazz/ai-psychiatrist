// tests/unit/database/sqlite.test.ts
// Unit tests for SQLite database manager
// Reference: Task 2.1 verification criteria

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { SQLiteManager } from '../../../src/database/sqlite.js';
import fs from 'fs';
import path from 'path';

// Test database path - using relative path from project root
const TEST_DB_PATH = path.join(process.cwd(), 'memory_directory/databases/sessions.db');

describe('SQLiteManager', () => {
  let manager: SQLiteManager;

  beforeAll(() => {
    // Create a new instance for testing
    manager = new SQLiteManager();
  });

  afterAll(() => {
    // Clean up: close the database connection
    if (manager.isReady()) {
      manager.close();
    }
  });

  describe('Initialization', () => {
    test('should initialize database successfully', () => {
      expect(() => manager.initialize()).not.toThrow();
      expect(manager.isReady()).toBe(true);
    });

    test('should create database file', () => {
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    });

    test('should not throw when initializing twice', () => {
      expect(() => manager.initialize()).not.toThrow();
    });
  });

  describe('Database Connection', () => {
    test('should get database instance after initialization', () => {
      const db = manager.getDb();
      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');
    });

    test('should have foreign keys enabled', () => {
      const db = manager.getDb();
      const result = db.pragma('foreign_keys', { simple: true });
      expect(result).toBe(1);
    });

    test('should have WAL mode enabled', () => {
      const db = manager.getDb();
      const result = db.pragma('journal_mode', { simple: true });
      expect(result).toBe('wal');
    });
  });

  describe('Health Check', () => {
    test('should return healthy status', () => {
      const health = manager.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    });

    test('should have latency less than 50ms (R26 requirement)', () => {
      const health = manager.healthCheck();
      expect(health.latencyMs).toBeLessThan(50);
    });

    test('should measure latency accurately', () => {
      const start = Date.now();
      const health = manager.healthCheck();
      const elapsed = Date.now() - start;
      
      // Health check latency should be close to actual elapsed time
      expect(health.latencyMs).toBeLessThanOrEqual(elapsed + 5); // Allow 5ms margin
    });
  });

  describe('Database Statistics', () => {
    test('should return database statistics', () => {
      const stats = manager.getStats();
      
      expect(stats).toHaveProperty('path');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('pageCount');
      expect(stats).toHaveProperty('pageSize');
      expect(stats).toHaveProperty('walMode');
      expect(stats).toHaveProperty('foreignKeys');
      
      expect(stats.walMode).toBe(true);
      expect(stats.foreignKeys).toBe(true);
    });
  });

  describe('Transaction Support', () => {
    test('should execute transaction successfully', () => {
      const result = manager.transaction((db) => {
        // Simple transaction test
        const stmt = db.prepare('SELECT 1 + 1 as result');
        return stmt.get() as { result: number };
      });
      
      expect(result.result).toBe(2);
    });

    test('should rollback transaction on error', () => {
      expect(() => {
        manager.transaction((db) => {
          // This should fail and rollback
          db.prepare('SELECT * FROM nonexistent_table').get();
        });
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should throw error when getting db before initialization', () => {
      const uninitializedManager = new SQLiteManager();
      expect(() => uninitializedManager.getDb()).toThrow('Database not initialized');
    });

    test('should return unhealthy status when not initialized', () => {
      const uninitializedManager = new SQLiteManager();
      const health = uninitializedManager.healthCheck();
      
      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Database not initialized');
    });
  });

  describe('Connection Management', () => {
    test('should close database connection', () => {
      const tempManager = new SQLiteManager();
      tempManager.initialize();
      expect(tempManager.isReady()).toBe(true);
      
      tempManager.close();
      expect(tempManager.isReady()).toBe(false);
    });

    test('should not throw when closing uninitialized database', () => {
      const tempManager = new SQLiteManager();
      expect(() => tempManager.close()).not.toThrow();
    });
  });
});
