// src/database/index.ts
// Unified Database Manager
// Manages both SQLite and Qdrant connections
// Implements: Design Section 6 (Database connection with health checks)
// Reference: Requirements R26-R28 (Database Management)

import { sqliteManager } from './sqlite.js';
import { initializeSchema, verifySchema } from './schema.js';
import { qdrantManager, COLLECTIONS } from './qdrant.js';
import { logger } from '../utils/logger.js';

export interface DatabaseHealth {
  sqlite: { healthy: boolean; latencyMs: number; error?: string };
  qdrant: { healthy: boolean; latencyMs: number };
  overall: boolean;
}

/**
 * Initialize all database connections
 * Must be called at application startup
 * 
 * Reference: AGENTS.md Gate 1 (Pre-Code checks)
 * 
 * Initialization sequence:
 * 1. Initialize SQLite connection
 * 2. Create database schema (all 7 tables)
 * 3. Verify schema integrity
 * 4. Initialize Qdrant connection (optional)
 * 5. Create vector collections (3 collections)
 * 6. Verify collections exist
 * 
 * @throws Error if SQLite initialization fails (required)
 * @note Qdrant failures are logged but don't throw (optional component)
 */
export async function initializeDatabases(): Promise<void> {
  logger.info('Initializing all databases...');

  // Initialize SQLite (REQUIRED)
  try {
    sqliteManager.initialize();
    initializeSchema();

    const sqliteVerify = verifySchema();
    if (!sqliteVerify.valid) {
      throw new Error(`SQLite schema invalid. Missing tables: ${sqliteVerify.missingTables.join(', ')}`);
    }

    logger.info('SQLite database initialized and verified', {
      tables: 7,
      status: 'ready'
    });
  } catch (error) {
    logger.error('SQLite initialization failed - application cannot start', { error });
    throw error; // SQLite is required, so we throw
  }

  // Initialize Qdrant (OPTIONAL - app can work without vector search)
  try {
    await qdrantManager.initialize();
    await qdrantManager.createCollections();

    const qdrantVerify = await qdrantManager.verifyCollections();
    if (!qdrantVerify.valid) {
      logger.warn('Qdrant collections incomplete', {
        missing: qdrantVerify.missing,
        status: 'degraded'
      });
      // Don't throw - app can work without vector DB in degraded mode
    } else {
      logger.info('Qdrant database initialized and verified', {
        collections: 3,
        status: 'ready'
      });
    }
  } catch (error) {
    logger.warn('Qdrant initialization failed - vector search will be unavailable', {
      error: error instanceof Error ? error.message : String(error),
      status: 'degraded'
    });
    // Don't throw - app can work without vector DB in degraded mode
  }

  logger.info('Database initialization complete');
}

/**
 * Check health of all database connections
 * Reference: Requirements R26 (< 50ms for single record)
 * 
 * Health check performs:
 * - SQLite: Simple SELECT query with latency measurement
 * - Qdrant: Collection list query with latency measurement
 * 
 * Overall health is determined by SQLite only (required component)
 * Qdrant health is informational (optional component)
 * 
 * @returns Health status for both databases and overall system health
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  // Check SQLite health (REQUIRED)
  const sqliteHealth = sqliteManager.healthCheck();

  // Check Qdrant health (OPTIONAL)
  let qdrantHealth = { healthy: false, latencyMs: 0 };
  try {
    qdrantHealth = await qdrantManager.healthCheck();
  } catch (error) {
    logger.debug('Qdrant health check failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Qdrant not available - this is acceptable
  }

  const overall = sqliteHealth.healthy; // Overall health = SQLite health

  if (!overall) {
    logger.error('Database health check failed', {
      sqlite: sqliteHealth,
      qdrant: qdrantHealth
    });
  } else if (!qdrantHealth.healthy) {
    logger.warn('Database health check: SQLite healthy, Qdrant unavailable', {
      sqlite: sqliteHealth,
      qdrant: qdrantHealth
    });
  } else {
    logger.debug('Database health check: All systems healthy', {
      sqlite: sqliteHealth,
      qdrant: qdrantHealth
    });
  }

  return {
    sqlite: sqliteHealth,
    qdrant: qdrantHealth,
    overall
  };
}

/**
 * Close all database connections
 * Call at application shutdown for graceful cleanup
 * 
 * Reference: AGENTS.md Article I (Library-First - proper resource management)
 * 
 * Shutdown sequence:
 * 1. Close SQLite connection (flushes WAL, closes file handles)
 * 2. Log shutdown completion
 * 
 * Note: Qdrant client doesn't require explicit cleanup
 */
export function closeDatabases(): void {
  logger.info('Closing all database connections...');

  try {
    sqliteManager.close();
    logger.info('All database connections closed successfully');
  } catch (error) {
    logger.error('Error closing database connections', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Re-export for convenience
export { sqliteManager } from './sqlite.js';
export { qdrantManager, COLLECTIONS } from './qdrant.js';
export { initializeSchema, verifySchema } from './schema.js';
