/**
 * Redis Initialization Script
 *
 * Creates the failure_idx vector index with correct schema for Gemini embeddings.
 * Run with: pnpm run redis:init
 */

// Load environment variables from .env.local
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

import { createClient } from 'redis';

// Gemini text-embedding-004 uses 768 dimensions
const EMBEDDING_DIMENSION = 768;
const INDEX_NAME = 'failure_idx';
const KEY_PREFIX = 'failure:';

// Type for Redis FT.INFO response
interface FTInfoResponse {
  numDocs?: number;
  attributes?: Array<{
    attribute?: string;
    DIM?: number;
  }>;
}

async function main() {
  console.log('=== PatchPilot Redis Initialization ===\n');

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const useTls = url.startsWith('rediss://');

  console.log(`Connecting to Redis: ${url.replace(/:[^:@]+@/, ':***@')}`);

  const redis = createClient({
    url,
    socket: useTls
      ? {
          tls: true,
          rejectUnauthorized: false,
        }
      : undefined,
  });

  redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  try {
    await redis.connect();
    console.log('Connected to Redis successfully\n');

    // Check if Redis Stack modules are available
    console.log('Checking Redis modules...');
    try {
      const modules = await redis.moduleList();
      const moduleNames = modules.map((m) => m.name);
      console.log(`Available modules: ${moduleNames.join(', ') || 'none'}`);

      const hasSearch = moduleNames.some(
        (name) => name.toLowerCase().includes('search') || name.toLowerCase().includes('ft')
      );
      const hasJson = moduleNames.some((name) => name.toLowerCase().includes('json'));

      if (!hasSearch) {
        console.warn('\nWARNING: RediSearch module not detected.');
        console.warn(
          'Vector search requires Redis Stack or Redis Cloud with Search module enabled.'
        );
      }
      if (!hasJson) {
        console.warn('\nWARNING: RedisJSON module not detected.');
        console.warn('JSON storage requires Redis Stack or Redis Cloud with JSON module enabled.');
      }
    } catch {
      console.log('Could not list modules (may require Redis Stack)');
    }

    // Check if index already exists
    console.log(`\nChecking for existing index: ${INDEX_NAME}...`);
    try {
      const rawInfo = await redis.ft.info(INDEX_NAME);
      const indexInfo = rawInfo as unknown as FTInfoResponse;
      console.log(`Index "${INDEX_NAME}" already exists with ${indexInfo.numDocs ?? 0} documents`);

      // Check if dimension matches
      const vectorAttr = indexInfo.attributes?.find((attr) => attr.attribute === 'embedding');
      if (vectorAttr) {
        console.log(`Current vector dimension: ${vectorAttr.DIM || 'unknown'}`);
        if (vectorAttr.DIM && vectorAttr.DIM !== EMBEDDING_DIMENSION) {
          console.warn(
            `\nWARNING: Current dimension (${vectorAttr.DIM}) does not match Gemini (${EMBEDDING_DIMENSION})`
          );
          console.log('You may need to drop and recreate the index:');
          console.log(`  FT.DROPINDEX ${INDEX_NAME}`);
        }
      }
    } catch (e: unknown) {
      // Handle both "Unknown index name" and "no such index" error formats
      if (e instanceof Error && (e.message.includes('Unknown index name') || e.message.includes('no such index'))) {
        console.log(`Index "${INDEX_NAME}" does not exist. Creating...`);

        // Create the index
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

        console.log(`\nIndex "${INDEX_NAME}" created successfully!`);
        console.log(`  - Vector dimension: ${EMBEDDING_DIMENSION} (Gemini text-embedding-004)`);
        console.log(`  - Distance metric: COSINE`);
        console.log(`  - Algorithm: HNSW`);
        console.log(`  - Key prefix: ${KEY_PREFIX}`);
      } else {
        throw e;
      }
    }

    // Verify index was created
    console.log('\nVerifying index...');
    const rawInfo = await redis.ft.info(INDEX_NAME);
    const info = rawInfo as unknown as FTInfoResponse;
    console.log(`Index verified: ${info.numDocs ?? 0} documents indexed`);

    console.log('\n=== Redis initialization complete ===');
  } catch (error) {
    console.error('\nFailed to initialize Redis:', error);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

main();
