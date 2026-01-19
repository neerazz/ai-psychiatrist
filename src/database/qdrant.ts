// src/database/qdrant.ts
// Qdrant Vector Database Manager
// Reference: data_schemas.md Section 4 (collection schemas)
// Implements: Requirements R27-R28 (Vector Database Management)

import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '../utils/logger.js';
import { PROVIDER_DEFAULTS } from '../embeddings/types.js';

// Qdrant configuration
const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
const QDRANT_PORT = parseInt(process.env.QDRANT_PORT || '6333', 10);

/**
 * Get vector size based on embedding provider configuration
 * Reads from EMBEDDING_PROVIDER and EMBEDDING_DIMENSIONS env vars
 * Default: 384 (for local provider)
 */
function getVectorSize(): number {
  const provider = process.env.EMBEDDING_PROVIDER || 'local';
  const customDimensions = process.env.EMBEDDING_DIMENSIONS;

  if (customDimensions) {
    return parseInt(customDimensions, 10);
  }

  switch (provider) {
    case 'openai':
      return PROVIDER_DEFAULTS.openai.dimensions; // 3072
    case 'ollama':
      return PROVIDER_DEFAULTS.ollama.dimensions; // 768
    case 'local':
    default:
      return PROVIDER_DEFAULTS.local.dimensions;  // 384
  }
}

/**
 * Collection definitions from data_schemas.md Section 4
 */
export const COLLECTIONS = {
  SESSION_TRANSCRIPTS: 'session_transcripts',
  PATIENT_MEMORIES: 'patient_memories',
  CLINICAL_INSIGHTS: 'clinical_insights'
} as const;

/**
 * Qdrant Vector Database Manager
 * Manages vector collections for semantic search
 * 
 * Collections:
 * - session_transcripts: Conversation content with emotional context
 * - patient_memories: Personal details, hobbies, aspirations
 * - clinical_insights: Cognitive distortions, behavioral patterns
 */
export class QdrantManager {
  private client: QdrantClient | null = null;

  /**
   * Initialize connection to Qdrant
   * @throws Error if connection fails
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing Qdrant connection', { host: QDRANT_HOST, port: QDRANT_PORT });

    this.client = new QdrantClient({
      url: `http://${QDRANT_HOST}:${QDRANT_PORT}`
    });

    // Verify connection
    const health = await this.healthCheck();
    if (!health.healthy) {
      throw new Error('Failed to connect to Qdrant');
    }

    logger.info('Qdrant connection established', { latencyMs: health.latencyMs });
  }

  /**
   * Get the Qdrant client instance
   * @throws Error if not initialized
   */
  public getClient(): QdrantClient {
    if (!this.client) {
      throw new Error('Qdrant not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Health check for Qdrant connection
   * Reference: Requirements R27 (Vector Database Management)
   */
  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();

    try {
      const client = this.getClient();
      await client.getCollections();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      logger.error('Qdrant health check failed', { error });
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Create all required collections
   * Reference: data_schemas.md Section 4 (3 collections)
   *
   * Collections created:
   * 1. session_transcripts - Conversation turns with emotional states
   * 2. patient_memories - Personal details and casual mentions
   * 3. clinical_insights - Therapeutic observations and patterns
   *
   * @param vectorSize - Optional vector size override (defaults to getVectorSize())
   */
  public async createCollections(vectorSize?: number): Promise<void> {
    const client = this.getClient();
    const size = vectorSize ?? getVectorSize();

    logger.info('Creating collections with vector size', { vectorSize: size });

    // Get existing collections
    const existing = await client.getCollections();
    const existingNames = existing.collections.map(c => c.name);

    // Collection 1: Session Transcripts
    // Stores conversation content with emotional context and timestamps
    if (!existingNames.includes(COLLECTIONS.SESSION_TRANSCRIPTS)) {
      await client.createCollection(COLLECTIONS.SESSION_TRANSCRIPTS, {
        vectors: {
          size,
          distance: 'Cosine'
        }
      });
      logger.info('Created collection: session_transcripts', { vectorSize: size });
    } else {
      logger.debug('Collection already exists: session_transcripts');
    }

    // Collection 2: Patient Memories
    // Stores hobbies, aspirations, relationships, medications, etc.
    if (!existingNames.includes(COLLECTIONS.PATIENT_MEMORIES)) {
      await client.createCollection(COLLECTIONS.PATIENT_MEMORIES, {
        vectors: {
          size,
          distance: 'Cosine'
        }
      });
      logger.info('Created collection: patient_memories', { vectorSize: size });
    } else {
      logger.debug('Collection already exists: patient_memories');
    }

    // Collection 3: Clinical Insights
    // Stores cognitive distortions, behavioral patterns, breakthroughs
    if (!existingNames.includes(COLLECTIONS.CLINICAL_INSIGHTS)) {
      await client.createCollection(COLLECTIONS.CLINICAL_INSIGHTS, {
        vectors: {
          size,
          distance: 'Cosine'
        }
      });
      logger.info('Created collection: clinical_insights', { vectorSize: size });
    } else {
      logger.debug('Collection already exists: clinical_insights');
    }
  }

  /**
   * Get the current vector size based on embedding configuration
   */
  public getVectorSize(): number {
    return getVectorSize();
  }

  /**
   * Verify all collections exist
   * Reference: Requirements R27 (Vector Database Management)
   * 
   * @returns Object with validation status and list of missing collections
   */
  public async verifyCollections(): Promise<{ valid: boolean; missing: string[] }> {
    const client = this.getClient();
    const existing = await client.getCollections();
    const existingNames = existing.collections.map(c => c.name);

    const required = Object.values(COLLECTIONS);
    const missing = required.filter(c => !existingNames.includes(c));

    if (missing.length === 0) {
      logger.info('All required collections verified');
    } else {
      logger.warn('Missing collections', { missing });
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Delete a collection (for testing/cleanup)
   * @param collectionName - Name of collection to delete
   */
  public async deleteCollection(collectionName: string): Promise<void> {
    const client = this.getClient();
    await client.deleteCollection(collectionName);
    logger.info('Deleted collection', { collectionName });
  }

  /**
   * Get collection info
   * @param collectionName - Name of collection
   */
  public async getCollectionInfo(collectionName: string): Promise<any> {
    const client = this.getClient();
    return await client.getCollection(collectionName);
  }
}

// Export singleton instance
export const qdrantManager = new QdrantManager();
