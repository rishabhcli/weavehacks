/**
 * Redis Client Configuration
 *
 * Provides a singleton Redis client for the knowledge base.
 * Supports both local Redis and Redis Cloud with TLS.
 */

import { createClient, RedisClientType } from 'redis';

// Store client in globalThis to survive HMR in development
const globalForRedis = globalThis as unknown as {
  redisClient: RedisClientType | null;
  redisConnectionFailed: boolean;
};

// Use global storage to prevent connection leaks during HMR
let redisClient: RedisClientType | null = globalForRedis.redisClient ?? null;
let connectionFailed = globalForRedis.redisConnectionFailed ?? false;

export interface RedisConfig {
  url: string;
  useTls?: boolean;
}

/**
 * Check if we're in a build environment (no Redis available)
 */
function isBuildTime(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build' ||
         process.env.VERCEL_ENV === undefined && !process.env.REDIS_URL;
}

/**
 * Get or create the Redis client singleton
 */
export async function getRedisClient(): Promise<RedisClientType> {
  // Don't attempt connection during build
  if (isBuildTime()) {
    throw new Error('Redis not available during build');
  }

  // Don't retry if connection already failed
  if (connectionFailed) {
    throw new Error('Redis connection previously failed');
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    connectionFailed = true;
    throw new Error('REDIS_URL not configured');
  }

  const useTls = url.startsWith('rediss://');

  redisClient = createClient({
    url,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        // Stop retrying after 3 attempts
        if (retries >= 3) {
          connectionFailed = true;
          globalForRedis.redisConnectionFailed = true;
          return new Error('Max retries reached');
        }
        return Math.min(retries * 100, 3000);
      },
      ...(useTls
        ? {
            tls: true,
            rejectUnauthorized: false,
          }
        : {}),
    },
  });

  redisClient.on('error', (err) => {
    // Only log once per session
    if (!connectionFailed) {
      console.error('Redis client error:', err.message);
    }
  });

  try {
    await redisClient.connect();
    // Store in global for HMR persistence
    globalForRedis.redisClient = redisClient;
    return redisClient;
  } catch (err) {
    connectionFailed = true;
    globalForRedis.redisConnectionFailed = true;
    redisClient = null;
    globalForRedis.redisClient = null;
    throw err;
  }
}

/**
 * Close the Redis connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Check if Redis connection is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  // Don't attempt connection during build
  if (isBuildTime() || connectionFailed) {
    return false;
  }

  if (!process.env.REDIS_URL) {
    return false;
  }

  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

export type { RedisClientType };
