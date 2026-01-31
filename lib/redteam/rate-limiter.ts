/**
 * Rate Limiter
 *
 * Implements sliding window rate limiting to prevent abuse.
 */

import type { RateLimiterConfig, RateLimitResult } from './types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<RateLimiterConfig> = {
  limit: 100,
  windowMs: 60000, // 1 minute
  throwOnLimit: false,
};

// ============================================================================
// Rate Limiter Error
// ============================================================================

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends Error {
  public readonly retryAfterMs: number;
  public readonly remaining: number;
  public readonly resetAt: number;

  constructor(result: RateLimitResult) {
    super(`Rate limit exceeded. Try again in ${Math.ceil((result.retryAfterMs || 0) / 1000)} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfterMs = result.retryAfterMs || 0;
    this.remaining = result.remaining;
    this.resetAt = result.resetAt;
  }
}

// ============================================================================
// Rate Limiter Class
// ============================================================================

/**
 * Sliding window rate limiter
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: Required<RateLimiterConfig>;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a request is allowed
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove timestamps outside the window
    const windowStart = now - this.config.windowMs;
    const recentTimestamps = timestamps.filter((t) => t > windowStart);

    // Calculate result
    const remaining = Math.max(0, this.config.limit - recentTimestamps.length);
    const resetAt = recentTimestamps.length > 0
      ? Math.min(...recentTimestamps) + this.config.windowMs
      : now + this.config.windowMs;

    const allowed = recentTimestamps.length < this.config.limit;

    const result: RateLimitResult = {
      allowed,
      remaining,
      resetAt,
      retryAfterMs: allowed ? undefined : resetAt - now,
    };

    if (!allowed && this.config.throwOnLimit) {
      throw new RateLimitError(result);
    }

    return result;
  }

  /**
   * Record a request (call after check)
   */
  record(key: string): void {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps
    const windowStart = now - this.config.windowMs;
    const recentTimestamps = timestamps.filter((t) => t > windowStart);

    // Add new timestamp
    recentTimestamps.push(now);
    this.requests.set(key, recentTimestamps);
  }

  /**
   * Check and record in one operation
   */
  checkAndRecord(key: string): RateLimitResult {
    const result = this.check(key);
    if (result.allowed) {
      this.record(key);
    }
    return result;
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string): { count: number; limit: number; remaining: number } {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const windowStart = now - this.config.windowMs;
    const count = timestamps.filter((t) => t > windowStart).length;

    return {
      count,
      limit: this.config.limit,
      remaining: Math.max(0, this.config.limit - count),
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter((t) => t > windowStart);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalKeys: number;
    totalRequests: number;
    keysAtLimit: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    let totalRequests = 0;
    let keysAtLimit = 0;

    for (const [, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter((t) => t > windowStart);
      totalRequests += recent.length;
      if (recent.length >= this.config.limit) {
        keysAtLimit++;
      }
    }

    return {
      totalKeys: this.requests.size,
      totalRequests,
      keysAtLimit,
    };
  }
}

// ============================================================================
// Timeout Protection
// ============================================================================

/**
 * Execute a function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next retry
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a rate limiter with common presets
 */
export function createRateLimiter(
  preset: 'strict' | 'standard' | 'relaxed' | 'custom',
  customConfig?: Partial<RateLimiterConfig>
): RateLimiter {
  const presets: Record<string, Partial<RateLimiterConfig>> = {
    strict: { limit: 10, windowMs: 60000 },
    standard: { limit: 100, windowMs: 60000 },
    relaxed: { limit: 1000, windowMs: 60000 },
    custom: customConfig || {},
  };

  return new RateLimiter(presets[preset]);
}

/**
 * Global rate limiter instance (singleton)
 */
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get the global rate limiter
 */
export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();
  }
  return globalRateLimiter;
}

/**
 * Set the global rate limiter
 */
export function setGlobalRateLimiter(limiter: RateLimiter): void {
  globalRateLimiter = limiter;
}
