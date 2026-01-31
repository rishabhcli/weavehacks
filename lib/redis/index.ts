/**
 * Knowledge Base
 *
 * Redis-backed knowledge base for storing and retrieving failure traces
 * and fix patterns. Enables PatchPilot to learn from past bugs.
 */

import { v4 as uuidv4 } from 'uuid';
import { getRedisClient, closeRedisClient, isRedisAvailable, RedisClientType } from './client';
import {
  generateEmbedding,
  createEmbeddingText,
  embeddingToBuffer,
  EMBEDDING_DIMENSION,
} from './embeddings';
import type { FailureReport, FailureType, Patch, SimilarIssue } from '@/lib/types';

// Index configuration
const INDEX_NAME = 'failure_idx';
const KEY_PREFIX = 'failure:';

/**
 * Stored failure document in Redis
 */
export interface FailureDocument {
  id: string;
  errorMessage: string;
  stackTrace: string;
  file: string;
  line: number;
  failureType: FailureType;
  fixDescription: string | null;
  fixDiff: string | null;
  success: boolean;
  createdAt: number;
  embedding: number[];
}

/**
 * Knowledge Base class for managing failure traces
 */
export class KnowledgeBase {
  private initialized = false;

  /**
   * Initialize the knowledge base
   * Creates the vector index if it doesn't exist
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const available = await isRedisAvailable();
    if (!available) {
      console.warn('Redis not available, knowledge base will be disabled');
      return;
    }

    const redis = await getRedisClient();
    await this.createIndex(redis);
    this.initialized = true;
  }

  /**
   * Create the vector index for failure traces
   */
  private async createIndex(redis: RedisClientType): Promise<void> {
    try {
      // Check if index already exists
      await redis.ft.info(INDEX_NAME);
      console.log('Knowledge base index already exists');
    } catch (e: unknown) {
      // Index doesn't exist, create it
      if (e instanceof Error && e.message.includes('Unknown index name')) {
        await redis.ft.create(
          INDEX_NAME,
          {
            '$.embedding': {
              type: 'VECTOR',
              AS: 'embedding',
              ALGORITHM: 'HNSW',
              TYPE: 'FLOAT32',
              DIM: EMBEDDING_DIMENSION,
              DISTANCE_METRIC: 'COSINE',
            },
            '$.errorMessage': {
              type: 'TEXT',
              AS: 'error_message',
            },
            '$.failureType': {
              type: 'TAG',
              AS: 'failure_type',
            },
            '$.file': {
              type: 'TAG',
              AS: 'file',
            },
            '$.success': {
              type: 'TAG',
              AS: 'success',
            },
            '$.createdAt': {
              type: 'NUMERIC',
              AS: 'created_at',
              SORTABLE: true,
            },
          },
          {
            ON: 'JSON',
            PREFIX: KEY_PREFIX,
          }
        );
        console.log('Knowledge base index created');
      } else {
        throw e;
      }
    }
  }

  /**
   * Store a failure trace in the knowledge base
   */
  async storeFailure(
    failure: FailureReport,
    patch?: Patch,
    success: boolean = false
  ): Promise<string> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.initialized) {
      console.warn('Knowledge base not initialized, skipping store');
      return '';
    }

    const redis = await getRedisClient();
    const id = uuidv4();

    // Generate embedding from error message and stack trace
    const embeddingText = createEmbeddingText(failure.error.message, failure.error.stack);
    const embedding = await generateEmbedding(embeddingText);

    // Parse file and line from stack trace if available
    const stackMatch = failure.error.stack.match(/at\s+.*?\s+\(?(.*?):(\d+):(\d+)\)?/);
    const file = stackMatch ? stackMatch[1] : 'unknown';
    const line = stackMatch ? parseInt(stackMatch[2], 10) : 0;

    // Classify failure type
    const failureType = this.classifyFailure(failure.error.message);

    const document: FailureDocument = {
      id,
      errorMessage: failure.error.message,
      stackTrace: failure.error.stack,
      file,
      line,
      failureType,
      fixDescription: patch?.description || null,
      fixDiff: patch?.diff || null,
      success,
      createdAt: Date.now(),
      embedding,
    };

    // @ts-expect-error - Redis JSON type mismatch
    await redis.json.set(`${KEY_PREFIX}${id}`, '$', document);

    console.log(`Stored failure trace: ${id}`);
    return id;
  }

  /**
   * Find similar failures to the given error
   */
  async findSimilar(
    errorMessage: string,
    stackTrace?: string,
    limit: number = 3,
    minSimilarity: number = 0.7
  ): Promise<SimilarIssue[]> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.initialized) {
      return [];
    }

    try {
      const redis = await getRedisClient();

      // Generate query embedding
      const embeddingText = createEmbeddingText(errorMessage, stackTrace);
      const queryEmbedding = await generateEmbedding(embeddingText);
      const vectorBuffer = embeddingToBuffer(queryEmbedding);

      // KNN search
      const results = await redis.ft.search(
        INDEX_NAME,
        '*=>[KNN $K @embedding $BLOB AS similarity]',
        {
          PARAMS: {
            K: limit,
            BLOB: vectorBuffer,
          },
          RETURN: ['error_message', 'file', 'fixDescription', 'fixDiff', 'success', 'similarity'],
          SORTBY: { BY: 'similarity', DIRECTION: 'ASC' },
          DIALECT: 2,
        }
      );

      // Filter by similarity threshold and format results
      return results.documents
        .filter((doc) => {
          const similarity = 1 - parseFloat(doc.value.similarity as string);
          return similarity >= minSimilarity;
        })
        .map((doc) => ({
          id: doc.id.replace(KEY_PREFIX, ''),
          similarity: 1 - parseFloat(doc.value.similarity as string),
          fix: (doc.value.fixDescription as string) || '',
          diff: (doc.value.fixDiff as string) || undefined,
        }));
    } catch (error) {
      console.error('Error finding similar failures:', error);
      return [];
    }
  }

  /**
   * Get successful fix patterns for a specific failure type
   */
  async getFixPatterns(
    failureType: FailureType,
    limit: number = 5
  ): Promise<{ description: string; diff: string }[]> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.initialized) {
      return [];
    }

    try {
      const redis = await getRedisClient();

      // Search for successful fixes of this failure type
      const results = await redis.ft.search(
        INDEX_NAME,
        `@failure_type:{${failureType}} @success:{true}`,
        {
          RETURN: ['fixDescription', 'fixDiff'],
          LIMIT: { from: 0, size: limit },
          SORTBY: { BY: 'created_at', DIRECTION: 'DESC' },
        }
      );

      return results.documents
        .filter((doc) => doc.value.fixDescription && doc.value.fixDiff)
        .map((doc) => ({
          description: doc.value.fixDescription as string,
          diff: doc.value.fixDiff as string,
        }));
    } catch (error) {
      console.error('Error getting fix patterns:', error);
      return [];
    }
  }

  /**
   * Record a successful fix for a failure
   */
  async recordFix(failureId: string, patch: Patch, success: boolean): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      const redis = await getRedisClient();
      const key = `${KEY_PREFIX}${failureId}`;

      await redis.json.set(key, '$.fixDescription', patch.description);
      await redis.json.set(key, '$.fixDiff', patch.diff);
      await redis.json.set(key, '$.success', success);

      console.log(`Recorded fix for failure: ${failureId}, success: ${success}`);
    } catch (error) {
      console.error('Error recording fix:', error);
    }
  }

  /**
   * Get statistics about the knowledge base
   */
  async getStats(): Promise<{ totalFailures: number; successfulFixes: number }> {
    if (!this.initialized) {
      return { totalFailures: 0, successfulFixes: 0 };
    }

    try {
      const redis = await getRedisClient();

      // Count all failures
      const allResults = await redis.ft.search(INDEX_NAME, '*', {
        LIMIT: { from: 0, size: 0 },
      });

      // Count successful fixes
      const successResults = await redis.ft.search(INDEX_NAME, '@success:{true}', {
        LIMIT: { from: 0, size: 0 },
      });

      return {
        totalFailures: allResults.total,
        successfulFixes: successResults.total,
      };
    } catch {
      return { totalFailures: 0, successfulFixes: 0 };
    }
  }

  /**
   * Classify failure type from error message
   */
  private classifyFailure(errorMessage: string): FailureType {
    const msg = errorMessage.toLowerCase();

    if (
      msg.includes('onclick') ||
      msg.includes('handler') ||
      msg.includes('click') ||
      msg.includes('element not found')
    ) {
      return 'UI_BUG';
    }

    if (
      msg.includes('404') ||
      msg.includes('500') ||
      msg.includes('api') ||
      msg.includes('fetch') ||
      msg.includes('network')
    ) {
      return 'BACKEND_ERROR';
    }

    if (
      msg.includes('null') ||
      msg.includes('undefined') ||
      msg.includes('cannot read property') ||
      msg.includes('cannot read properties')
    ) {
      return 'DATA_ERROR';
    }

    if (msg.includes('timeout') || msg.includes('race') || msg.includes('flaky')) {
      return 'TEST_FLAKY';
    }

    return 'UNKNOWN';
  }

  /**
   * Close the knowledge base connection
   */
  async close(): Promise<void> {
    await closeRedisClient();
    this.initialized = false;
  }
}

// Singleton instance
let knowledgeBase: KnowledgeBase | null = null;

/**
 * Get the singleton knowledge base instance
 */
export function getKnowledgeBase(): KnowledgeBase {
  if (!knowledgeBase) {
    knowledgeBase = new KnowledgeBase();
  }
  return knowledgeBase;
}

export { isRedisAvailable, closeRedisClient };
