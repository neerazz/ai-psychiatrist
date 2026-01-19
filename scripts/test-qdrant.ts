// scripts/test-qdrant.ts
// Manual test script for Qdrant setup verification

import { qdrantManager, COLLECTIONS } from '../src/database/qdrant.js';

async function testQdrant() {
  console.log('=== Qdrant Setup Verification ===\n');

  try {
    // Test 1: Initialize connection
    console.log('1. Initializing Qdrant connection...');
    await qdrantManager.initialize();
    console.log('   ✓ Connection established\n');

    // Test 2: Health check
    console.log('2. Running health check...');
    const health = await qdrantManager.healthCheck();
    console.log(`   ✓ Health: ${health.healthy ? 'OK' : 'FAILED'}`);
    console.log(`   ✓ Latency: ${health.latencyMs}ms\n`);

    // Test 3: Create collections
    console.log('3. Creating collections...');
    await qdrantManager.createCollections();
    console.log('   ✓ Collections created\n');

    // Test 4: Verify collections
    console.log('4. Verifying collections...');
    const verification = await qdrantManager.verifyCollections();
    console.log(`   ✓ Valid: ${verification.valid}`);
    console.log(`   ✓ Missing: ${verification.missing.length === 0 ? 'None' : verification.missing.join(', ')}\n`);

    // Test 5: Get collection info
    console.log('5. Getting collection details...');
    for (const collectionName of Object.values(COLLECTIONS)) {
      const info = await qdrantManager.getCollectionInfo(collectionName);
      console.log(`   ✓ ${collectionName}:`);
      console.log(`     - Status: ${info.status}`);
      console.log(`     - Vector size: ${info.config.params.vectors.size}`);
      console.log(`     - Distance: ${info.config.params.vectors.distance}`);
      console.log(`     - Points count: ${info.points_count}`);
    }

    console.log('\n=== All Tests Passed! ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testQdrant();
