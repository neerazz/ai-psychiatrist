// scripts/migrations/init-database.ts
// Database initialization script - run this to set up the database
// Implements: Task 2.3 - Create Database Initialization Script
// Reference: data_schemas.md Section 3 (7 tables), AGENTS.md Article III (Test-First)

import { sqliteManager } from '../../dist/database/sqlite.js';
import { initializeSchema, verifySchema } from '../../dist/database/schema.js';
import { logger } from '../../dist/utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main database initialization function
 * Creates database file, initializes schema, and verifies all tables
 */
async function main() {
  console.log('='.repeat(60));
  console.log('AI Psychiatrist - Database Initialization');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 0: Ensure memory_directory/databases exists
    console.log('0. Checking directory structure...');
    const dbDir = path.join(__dirname, '../../memory_directory/databases');
    if (!fs.existsSync(dbDir)) {
      console.log('   Creating memory_directory/databases...');
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('   ✓ Directory created');
    } else {
      console.log('   ✓ Directory exists');
    }

    // Step 1: Initialize database connection
    console.log('\n1. Initializing database connection...');
    sqliteManager.initialize();
    console.log('   ✓ Database connection established');

    // Step 2: Create schema
    console.log('\n2. Creating database schema...');
    console.log('   Creating 7 tables:');
    console.log('   - patients');
    console.log('   - sessions');
    console.log('   - session_events');
    console.log('   - crisis_events');
    console.log('   - embedding_jobs');
    console.log('   - audit_log');
    console.log('   - conversation_highlights');
    
    initializeSchema();
    console.log('   ✓ Schema creation complete');

    // Step 3: Verify schema
    console.log('\n3. Verifying schema...');
    const verification = verifySchema();

    if (verification.valid) {
      console.log('   ✓ All 7 tables created successfully');
    } else {
      console.error('   ✗ Schema verification failed!');
      console.error('   Missing tables:', verification.missingTables);
      process.exit(1);
    }

    // Step 4: Health check
    console.log('\n4. Running health check...');
    const health = sqliteManager.healthCheck();
    
    if (health.healthy) {
      console.log(`   ✓ Database healthy (latency: ${health.latencyMs}ms)`);
      
      // Check if latency meets requirement (<50ms per R26)
      if (health.latencyMs < 50) {
        console.log(`   ✓ Latency within target (<50ms)`);
      } else {
        console.log(`   ⚠ Latency exceeds target (${health.latencyMs}ms > 50ms)`);
      }
    } else {
      console.error('   ✗ Health check failed:', health.error);
      process.exit(1);
    }

    // Step 5: Display database statistics
    console.log('\n5. Database statistics:');
    const stats = sqliteManager.getStats();
    console.log(`   Path: ${stats.path}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Page count: ${stats.pageCount}`);
    console.log(`   Page size: ${stats.pageSize} bytes`);
    console.log(`   WAL mode: ${stats.walMode ? 'enabled' : 'disabled'}`);
    console.log(`   Foreign keys: ${stats.foreignKeys ? 'enabled' : 'disabled'}`);

    // Success message
    console.log('\n' + '='.repeat(60));
    console.log('✓ Database initialization complete!');
    console.log('='.repeat(60));
    console.log('\nDatabase location:');
    console.log(`  ${stats.path}`);
    console.log('\nYou can now:');
    console.log('  - Run tests: npm run test:unit');
    console.log('  - Start development: npm run dev');
    console.log('');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Database initialization failed!');
    console.error('='.repeat(60));
    console.error('\nError details:');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    // Always close the database connection
    try {
      sqliteManager.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Run the initialization
main();
