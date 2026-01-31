/**
 * W&B Weave Integration
 *
 * Provides observability and tracing for PatchPilot agents.
 * - Traces all agent method calls
 * - Logs metrics after each run
 * - Enables debugging and evaluation
 */

import * as weave from 'weave';
import type { WeaveClient } from 'weave';

let initialized = false;
let weaveEnabled = true;
let weaveClient: WeaveClient | null = null;

/**
 * Initialize Weave with the PatchPilot project
 */
export async function initWeave(projectName: string = 'patchpilot'): Promise<void> {
  if (initialized) {
    return;
  }

  // Check if API key is available
  if (!process.env.WANDB_API_KEY) {
    console.warn('⚠️ WANDB_API_KEY not set - Weave tracing disabled');
    weaveEnabled = false;
    return;
  }

  try {
    // Weave init takes project name as string
    weaveClient = await weave.init(projectName);
    initialized = true;
    weaveEnabled = true;
    console.log(`✅ Weave initialized for project: ${projectName}`);
  } catch (error) {
    console.warn('⚠️ Failed to initialize Weave:', error);
    weaveEnabled = false;
  }
}

/**
 * Check if Weave is enabled
 */
export function isWeaveEnabled(): boolean {
  return weaveEnabled && initialized;
}

/**
 * Get the Weave client (if initialized)
 */
export function getWeaveClient(): WeaveClient | null {
  return weaveClient;
}

/**
 * Create a traced operation
 * Wraps a function to track inputs, outputs, and execution time in Weave
 */
export function tracedOp<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name?: string
): T {
  if (!weaveEnabled) {
    return fn;
  }

  // Use weave.op to wrap the function
  return weave.op(fn, { name: name || fn.name }) as T;
}

/**
 * Weave reference for direct access
 */
export { weave };

// Re-export common weave functions
export const op = weave.op;
