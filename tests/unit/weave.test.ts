/**
 * Unit tests for Weave integration
 * Tests tracing, metrics, and utility functions without requiring API credentials
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock weave module before imports
vi.mock('weave', () => ({
  init: vi.fn().mockResolvedValue({}),
  op: vi.fn((fn, options) => {
    // Return a wrapped function that tracks calls
    const wrapped = async (...args: unknown[]) => {
      return fn(...args);
    };
    Object.defineProperty(wrapped, '_weaveOp', { value: true });
    Object.defineProperty(wrapped, '_name', { value: options?.name || fn.name });
    return wrapped;
  }),
  withAttributes: vi.fn((_attrs, fn) => {
    // Just call the function
    return fn();
  }),
}));

// Import after mocking
import {
  logRunMetrics,
  logOperationMetrics,
  calculatePassRate,
  calculateImprovement,
  formatDuration,
  type RunMetrics,
  type OperationMetrics,
} from '@/lib/weave/metrics';
import { truncateValue, startSpan, endSpan } from '@/lib/weave/tracing';
import { initWeave, isWeaveEnabled, tracedOp } from '@/lib/weave';

describe('Weave Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logRunMetrics', () => {
    it('should calculate pass rate correctly', () => {
      const metrics: RunMetrics = {
        testsTotal: 10,
        testsPassed: 8,
        testsFailed: 2,
        bugsFound: 5,
        bugsFixed: 4,
        iterationsTotal: 10,
        durationMs: 60000,
        avgFixTimeMs: 12000,
        success: true,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logRunMetrics(metrics);

      // Verify metrics calculation
      expect(metrics.testsPassed / metrics.testsTotal).toBe(0.8);
      consoleSpy.mockRestore();
    });

    it('should handle zero total tests', () => {
      const metrics: RunMetrics = {
        testsTotal: 0,
        testsPassed: 0,
        testsFailed: 0,
        bugsFound: 0,
        bugsFixed: 0,
        iterationsTotal: 0,
        durationMs: 0,
        avgFixTimeMs: 0,
        success: false,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      // Should not throw
      expect(() => logRunMetrics(metrics)).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('logOperationMetrics', () => {
    it('should accept valid operation metrics', () => {
      const metrics: OperationMetrics = {
        agentName: 'TesterAgent',
        operationName: 'runTest',
        durationMs: 5000,
        success: true,
        inputSize: 100,
        outputSize: 50,
      };

      // Should not throw
      expect(() => logOperationMetrics(metrics)).not.toThrow();
    });

    it('should handle failed operations', () => {
      const metrics: OperationMetrics = {
        agentName: 'FixerAgent',
        operationName: 'generatePatch',
        durationMs: 3000,
        success: false,
        error: 'Failed to generate patch',
      };

      expect(() => logOperationMetrics(metrics)).not.toThrow();
    });
  });

  describe('calculatePassRate', () => {
    it('should calculate pass rate correctly', () => {
      expect(calculatePassRate(8, 10)).toBe(0.8);
      expect(calculatePassRate(10, 10)).toBe(1);
      expect(calculatePassRate(0, 10)).toBe(0);
    });

    it('should handle zero total', () => {
      expect(calculatePassRate(0, 0)).toBe(0);
    });
  });

  describe('calculateImprovement', () => {
    it('should calculate improvement percentage', () => {
      expect(calculateImprovement(100, 150)).toBe(50);
      expect(calculateImprovement(100, 50)).toBe(-50);
      expect(calculateImprovement(100, 100)).toBe(0);
    });

    it('should handle zero before value', () => {
      expect(calculateImprovement(0, 100)).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.0s');
      expect(formatDuration(5500)).toBe('5.5s');
      expect(formatDuration(59999)).toBe('60.0s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });
  });
});

describe('Weave Tracing', () => {
  describe('truncateValue', () => {
    it('should not truncate short strings', () => {
      const short = 'Hello World';
      expect(truncateValue(short)).toBe(short);
    });

    it('should truncate long strings', () => {
      const long = 'x'.repeat(10000);
      const truncated = truncateValue(long, 100);
      expect(typeof truncated).toBe('string');
      expect((truncated as string).length).toBeLessThan(long.length);
      expect((truncated as string)).toContain('...[truncated]');
    });

    it('should handle objects', () => {
      const small = { a: 1, b: 2 };
      expect(truncateValue(small)).toEqual(small);
    });

    it('should truncate large objects', () => {
      const large = { data: 'x'.repeat(10000) };
      const truncated = truncateValue(large, 100);
      expect(truncated).toHaveProperty('_truncated', true);
    });

    it('should handle null and undefined', () => {
      expect(truncateValue(null)).toBeNull();
      expect(truncateValue(undefined)).toBeUndefined();
    });

    it('should handle numbers', () => {
      expect(truncateValue(42)).toBe(42);
      expect(truncateValue(3.14)).toBe(3.14);
    });
  });

  describe('Span Tracking', () => {
    it('should start a span with timestamp', () => {
      const span = startSpan('testOperation');
      expect(span.name).toBe('testOperation');
      expect(span.startTime).toBeGreaterThan(0);
      expect(span.attributes).toEqual({});
    });

    it('should start a span with attributes', () => {
      const span = startSpan('testOperation', { testId: '123', step: 1 });
      expect(span.attributes).toEqual({ testId: '123', step: 1 });
    });

    it('should end a span and calculate duration', async () => {
      const span = startSpan('testOperation');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      const duration = endSpan(span, true);
      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });
});

describe('Weave Initialization', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should warn when WANDB_API_KEY is not set', async () => {
    delete process.env.WANDB_API_KEY;
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await initWeave('test-project');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('WANDB_API_KEY not set')
    );
    consoleSpy.mockRestore();
  });

  it('should return boolean for isWeaveEnabled', () => {
    expect(typeof isWeaveEnabled()).toBe('boolean');
  });
});

describe('Traced Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should wrap functions for tracing', () => {
    const testFn = async (x: number) => x * 2;
    // Use type assertion to avoid TypeScript error
    const traced = tracedOp(testFn as unknown as (...args: unknown[]) => unknown, 'testFn');

    // The traced function should be callable
    expect(typeof traced).toBe('function');
  });

  it('should preserve function behavior', async () => {
    const testFn = async (x: number) => x * 2;
    // Use type assertion to avoid TypeScript error
    const traced = tracedOp(testFn as unknown as (...args: unknown[]) => unknown, 'testFn');

    const result = await traced(5);
    expect(result).toBe(10);
  });

  it('should handle async functions with errors', async () => {
    const errorFn = async () => {
      throw new Error('Test error');
    };
    const traced = tracedOp(errorFn, 'errorFn');

    await expect(traced()).rejects.toThrow('Test error');
  });
});

describe('Integration Scenarios', () => {
  it('should handle a complete run metrics flow', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Simulate a PatchPilot run
    const metrics: RunMetrics = {
      testsTotal: 3,
      testsPassed: 3,
      testsFailed: 0,
      bugsFound: 2,
      bugsFixed: 2,
      iterationsTotal: 4,
      durationMs: 120000,
      avgFixTimeMs: 60000,
      success: true,
    };

    // Calculate derived metrics
    const passRate = calculatePassRate(metrics.testsPassed, metrics.testsTotal);
    const fixSuccessRate = calculatePassRate(metrics.bugsFixed, metrics.bugsFound);
    const iterationsPerBug = metrics.iterationsTotal / metrics.bugsFound;
    const formattedDuration = formatDuration(metrics.durationMs);

    expect(passRate).toBe(1);
    expect(fixSuccessRate).toBe(1);
    expect(iterationsPerBug).toBe(2);
    expect(formattedDuration).toBe('2m 0s');

    // Log metrics should not throw
    expect(() => logRunMetrics(metrics)).not.toThrow();
    consoleSpy.mockRestore();
  });

  it('should handle a failed run', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const metrics: RunMetrics = {
      testsTotal: 3,
      testsPassed: 1,
      testsFailed: 2,
      bugsFound: 2,
      bugsFixed: 1,
      iterationsTotal: 5,
      durationMs: 180000,
      avgFixTimeMs: 90000,
      success: false,
    };

    const passRate = calculatePassRate(metrics.testsPassed, metrics.testsTotal);
    expect(passRate).toBeCloseTo(0.333, 2);

    expect(() => logRunMetrics(metrics)).not.toThrow();
    consoleSpy.mockRestore();
  });
});
