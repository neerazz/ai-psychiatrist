// tests/integration/database/qdrant.test.ts
// Integration tests for Qdrant Vector Database
// Reference: Task 2.4 verification criteria

import { qdrantManager, COLLECTIONS } from '../../../src/database/qdrant.js';

describe('Qdrant Vector Database Integration', () => {
  beforeAll(async () => {
    // Initialize Qdrant connection
    await qdrantManager.initialize();
  });

  describe('Connection and Health', () => {
    test('should establish connection to Qdrant', async () => {
      const health = await qdrantManager.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.latencyMs).toBeLessThan(1000); // Should be fast
    });

    test('should get Qdrant client instance', () => {
      const client = qdrantManager.getClient();
      expect(client).toBeDefined();
    });
  });

  describe('Collection Management', () => {
    test('should create all required collections', async () => {
      await qdrantManager.createCollections();
      
      const verification = await qdrantManager.verifyCollections();
      expect(verification.valid).toBe(true);
      expect(verification.missing).toHaveLength(0);
    });

    test('should verify session_transcripts collection exists', async () => {
      const info = await qdrantManager.getCollectionInfo(COLLECTIONS.SESSION_TRANSCRIPTS);
      expect(info).toBeDefined();
      expect(info.status).toBe('green');
    });

    test('should verify patient_memories collection exists', async () => {
      const info = await qdrantManager.getCollectionInfo(COLLECTIONS.PATIENT_MEMORIES);
      expect(info).toBeDefined();
      expect(info.status).toBe('green');
    });

    test('should verify clinical_insights collection exists', async () => {
      const info = await qdrantManager.getCollectionInfo(COLLECTIONS.CLINICAL_INSIGHTS);
      expect(info).toBeDefined();
      expect(info.status).toBe('green');
    });

    test('should handle creating collections that already exist', async () => {
      // Should not throw error when collections already exist
      await expect(qdrantManager.createCollections()).resolves.not.toThrow();
    });
  });

  describe('Collection Verification', () => {
    test('should return valid status when all collections exist', async () => {
      const result = await qdrantManager.verifyCollections();
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test('should list all required collections', async () => {
      const client = qdrantManager.getClient();
      const collections = await client.getCollections();
      const collectionNames = collections.collections.map(c => c.name);
      
      expect(collectionNames).toContain(COLLECTIONS.SESSION_TRANSCRIPTS);
      expect(collectionNames).toContain(COLLECTIONS.PATIENT_MEMORIES);
      expect(collectionNames).toContain(COLLECTIONS.CLINICAL_INSIGHTS);
    });
  });

  describe('Vector Configuration', () => {
    test('session_transcripts should have correct vector configuration', async () => {
      const info = await qdrantManager.getCollectionInfo(COLLECTIONS.SESSION_TRANSCRIPTS);
      expect(info.config.params.vectors.size).toBe(3072); // text-embedding-3-large
      expect(info.config.params.vectors.distance).toBe('Cosine');
    });

    test('patient_memories should have correct vector configuration', async () => {
      const info = await qdrantManager.getCollectionInfo(COLLECTIONS.PATIENT_MEMORIES);
      expect(info.config.params.vectors.size).toBe(3072);
      expect(info.config.params.vectors.distance).toBe('Cosine');
    });

    test('clinical_insights should have correct vector configuration', async () => {
      const info = await qdrantManager.getCollectionInfo(COLLECTIONS.CLINICAL_INSIGHTS);
      expect(info.config.params.vectors.size).toBe(3072);
      expect(info.config.params.vectors.distance).toBe('Cosine');
    });
  });
});
