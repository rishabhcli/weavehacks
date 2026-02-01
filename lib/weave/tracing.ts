/**
 * Weave Tracing Utilities
 *
 * Provides tracing wrappers for QAgent agents.
 * Each agent method is wrapped to track inputs, outputs, and duration.
 */

import { weave } from './index';
import { isWeaveEnabled } from './index';

/**
 * Configuration for traced operations
 */
export interface TracingConfig {
  /** Name for the operation in Weave UI */
  name: string;
  /** Whether to truncate large inputs/outputs */
  truncate?: boolean;
  /** Maximum length for truncated strings */
  maxLength?: number;
}

/**
 * Truncate a value for logging (avoid huge payloads)
 */
export function truncateValue<T>(value: T, maxLength: number = 5000): T {
  if (typeof value === 'string' && value.length > maxLength) {
    return (value.substring(0, maxLength) + '...[truncated]') as T;
  }

  if (typeof value === 'object' && value !== null) {
    const json = JSON.stringify(value);
    if (json.length > maxLength) {
      // For objects, we need to serialize and truncate
      const truncated = json.substring(0, maxLength) + '...[truncated]';
      try {
        // Try to return a valid object with truncation note
        return { _truncated: true, preview: truncated } as T;
      } catch {
        return value;
      }
    }
  }

  return value;
}

/**
 * Create a traced version of an async method
 * This wraps the method to log inputs, outputs, and execution time
 */
export function createTracedMethod<TArgs extends unknown[], TResult>(
  methodName: string,
  agentName: string,
  method: (...args: TArgs) => Promise<TResult>,
  config?: Partial<TracingConfig>
): (...args: TArgs) => Promise<TResult> {
  const fullName = `${agentName}.${methodName}`;

  // If Weave is not enabled, return the original method
  if (!isWeaveEnabled()) {
    return method;
  }

  // Create the wrapped function with proper name
  const tracedFn = async function tracedMethod(...args: TArgs): Promise<TResult> {
    const startTime = Date.now();

    try {
      const result = await method(...args);
      const duration = Date.now() - startTime;

      // Log successful completion
      console.log(`✓ ${fullName} completed in ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      console.error(`✗ ${fullName} failed after ${duration}ms:`, error);

      throw error;
    }
  };

  // Wrap with Weave op
  return weave.op(tracedFn, { name: fullName }) as (...args: TArgs) => Promise<TResult>;
}

/**
 * Trace decorator-like function for class methods
 * Usage: this.method = trace(this.method.bind(this), 'MyAgent', 'myMethod')
 */
export function trace<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  agentName: string,
  methodName: string
): T {
  if (!isWeaveEnabled()) {
    return fn;
  }

  const fullName = `${agentName}.${methodName}`;
  return weave.op(fn, { name: fullName }) as T;
}

/**
 * Create a traced class wrapper
 * Wraps all async methods of a class instance with Weave tracing
 */
export function traceAgent<T extends object>(agent: T, agentName: string): T {
  if (!isWeaveEnabled()) {
    return agent;
  }

  const proto = Object.getPrototypeOf(agent);
  const methodNames = Object.getOwnPropertyNames(proto).filter(
    (name) => name !== 'constructor' && typeof (agent as Record<string, unknown>)[name] === 'function'
  );

  for (const methodName of methodNames) {
    const original = (agent as Record<string, unknown>)[methodName] as (...args: unknown[]) => unknown;

    // Only wrap async methods
    if (original.constructor.name === 'AsyncFunction' || methodName.includes('async')) {
      const traced = weave.op(original.bind(agent), { name: `${agentName}.${methodName}` });
      (agent as Record<string, unknown>)[methodName] = traced;
    }
  }

  return agent;
}

/**
 * Span type for manual tracing
 */
export interface TraceSpan {
  name: string;
  startTime: number;
  attributes: Record<string, unknown>;
}

/**
 * Start a manual trace span
 */
export function startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan {
  return {
    name,
    startTime: Date.now(),
    attributes: attributes || {},
  };
}

/**
 * End a trace span and calculate duration
 * Returns the duration in milliseconds
 */
export function endSpan(span: TraceSpan, success: boolean = true): number {
  const duration = Date.now() - span.startTime;

  if (isWeaveEnabled()) {
    // Attach span data to current trace context using withAttributes
    weave.withAttributes(
      {
        span_name: span.name,
        duration_ms: duration,
        success,
        ...span.attributes,
      },
      () => {}
    );
  }

  return duration;
}
