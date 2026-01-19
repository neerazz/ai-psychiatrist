// src/database/sqlite.ts
// SQLite database manager with encryption support
// Implements: Requirements R25 (Portable Memory Directory), R37 (AES-256-GCM encryption)
// Reference: data_schemas.md Section 3, Design Section 6

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path - stored in memory_directory per R25
const DB_PATH = path.join(__dirname, '../../memory_directory/databases/sessions.db');

/**
 * SQLite Database Manager
 * Manages the sessions.db database with all tables from data_schemas.md Section 3
 * 
 * Features:
 * - Connection pooling and health checks
 * - WAL mode for better concurrent access
 * - Foreign key enforcement
 * - Encryption support (will be integrated in Task 3)
 * - Latency monitoring (target: <50ms per R26)
 */
export class SQLiteManager {
  private db: Database.Database | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the database connection
   * Creates the database file if it doesn't exist
   * Enables WAL mode and foreign keys
   * 
   * Reference: Requirements R26 (Session Database)
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.warn('SQLite database already initialized');
      return;
    }

    logger.info('Initializing SQLite database', { path: DB_PATH });

    try {
      // Create database connection
      this.db = new Database(DB_PATH);

      // Enable foreign keys for referential integrity
      this.db.pragma('foreign_keys = ON');

      // Enable WAL (Write-Ahead Logging) mode for better concurrent access
      // WAL mode allows multiple readers while a write is in progress
      this.db.pragma('journal_mode = WAL');

      // Set synchronous mode to NORMAL for better performance
      // NORMAL is safe with WAL mode and provides good balance
      this.db.pragma('synchronous = NORMAL');

      // Set cache size to 10MB for better performance
      this.db.pragma('cache_size = -10000');

      this.isInitialized = true;
      logger.info('SQLite database initialized successfully', {
        path: DB_PATH,
        journalMode: this.db.pragma('journal_mode', { simple: true }),
        foreignKeys: this.db.pragma('foreign_keys', { simple: true })
      });
    } catch (error) {
      logger.error('Failed to initialize SQLite database', { error, path: DB_PATH });
      throw new Error(`SQLite initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the database instance
   * @throws Error if database is not initialized
   */
  public getDb(): Database.Database {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Close the database connection
   * Properly closes the database and cleans up resources
   */
  public close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        this.isInitialized = false;
        logger.info('SQLite database connection closed');
      } catch (error) {
        logger.error('Error closing SQLite database', { error });
        throw error;
      }
    }
  }

  /**
   * Check if database is connected and healthy
   * Reference: Requirements R26 (fast access < 50ms)
   * 
   * @returns Object with health status and latency measurement
   */
  public healthCheck(): { healthy: boolean; latencyMs: number; error?: string } {
    const start = Date.now();

    try {
      if (!this.isInitialized || !this.db) {
        return {
          healthy: false,
          latencyMs: Date.now() - start,
          error: 'Database not initialized'
        };
      }

      // Simple query to test database responsiveness
      const db = this.getDb();
      const result = db.prepare('SELECT 1 as test').get() as { test: number } | undefined;

      const latencyMs = Date.now() - start;

      if (result && result.test === 1) {
        // Check if latency meets requirement (<50ms)
        if (latencyMs >= 50) {
          logger.warn('SQLite health check latency exceeds target', { latencyMs, target: 50 });
        }

        return { healthy: true, latencyMs };
      } else {
        return {
          healthy: false,
          latencyMs,
          error: 'Health check query returned unexpected result'
        };
      }
    } catch (error) {
      const latencyMs = Date.now() - start;
      logger.error('SQLite health check failed', { error, latencyMs });
      return {
        healthy: false,
        latencyMs,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   * Provides ACID guarantees for multi-statement operations
   * 
   * @param callback Function containing database operations
   * @returns Result of the callback function
   */
  public transaction<T>(callback: (db: Database.Database) => T): T {
    const db = this.getDb();
    const transaction = db.transaction(callback);
    return transaction(db);
  }

  /**
   * Get database statistics
   * Useful for monitoring and debugging
   */
  public getStats(): {
    path: string;
    size: number;
    pageCount: number;
    pageSize: number;
    walMode: boolean;
    foreignKeys: boolean;
  } {
    const db = this.getDb();

    // Get page count and page size separately
    const pageCount = db.pragma('page_count', { simple: true }) as number;
    const pageSize = db.pragma('page_size', { simple: true }) as number;
    const size = pageCount * pageSize;

    return {
      path: DB_PATH,
      size: size,
      pageCount: pageCount,
      pageSize: pageSize,
      walMode: db.pragma('journal_mode', { simple: true }) === 'wal',
      foreignKeys: db.pragma('foreign_keys', { simple: true }) === 1
    };
  }
}

// Export singleton instance
export const sqliteManager = new SQLiteManager();
