/**
 * Core Weave init and op - used by inference/self-improve/evaluations to avoid circular imports.
 */

import * as weave from 'weave';
import type { WeaveClient } from 'weave';

let initialized = false;
let weaveEnabled = true;
let weaveClient: WeaveClient | null = null;

export async function initWeave(projectName: string = 'qagent'): Promise<void> {
  if (initialized) return;
  const name = process.env.WEAVE_PROJECT || projectName;
  if (!process.env.WANDB_API_KEY) {
    console.warn('⚠️ WANDB_API_KEY not set - Weave tracing disabled');
    weaveEnabled = false;
    return;
  }
  try {
    weaveClient = await weave.init(name);
    initialized = true;
    weaveEnabled = true;
    console.log(`✅ Weave initialized for project: ${name}`);
  } catch (error) {
    console.warn('⚠️ Failed to initialize Weave:', error);
    weaveEnabled = false;
  }
}

export function isWeaveEnabled(): boolean {
  return weaveEnabled && initialized;
}

export function getWeaveClient(): WeaveClient | null {
  return weaveClient;
}

export function tracedOp<T extends (...args: unknown[]) => unknown>(fn: T, name?: string): T {
  if (!weaveEnabled) return fn;
  return weave.op(fn, { name: name || fn.name }) as T;
}

export { weave };

// Export op function - use a getter to avoid initialization order issues
type AnyFunction = (...args: never[]) => unknown;
export function op<T extends AnyFunction>(fn: T, options?: { name?: string }): T {
  return weave.op(fn, options) as T;
}
