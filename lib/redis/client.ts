/**
 * Redis Client Configuration
 *
 * Provides a singleton Redis client for the knowledge base.
 * Supports both local Redis and Redis Cloud with TLS.
 */

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export interface RedisConfig {
  url: string;
  useTls?: boolean;
}

/**
 * Get or create the Redis client singleton
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const useTls = url.startsWith('rediss://');

  redisClient = createClient({
    url,
    socket: useTls
      ? {
          tls: true,
          rejectUnauthorized: false,
        }
      : undefined,
  });

  redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  await redisClient.connect();
  return redisClient;
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
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

export type { RedisClientType };
