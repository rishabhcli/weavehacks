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

// Local state for initialization
let initialized = false;
let weaveEnabled = true;
let weaveClient: WeaveClient | null = null;

/**
 * Initialize Weave with the PatchPilot project.
 * Enhanced with project metadata for WeaveHacks observability.
 */
export async function initWeave(projectName: string = 'patchpilot'): Promise<void> {
  if (initialized) {
    return;
  }

  if (!process.env.WANDB_API_KEY) {
    console.warn('⚠️ WANDB_API_KEY not set - Weave tracing disabled');
    weaveEnabled = false;
    return;
  }

  try {
    const initOptions = {
      project: projectName,
      metadata: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        sponsors: ['wandb', 'redis', 'browserbase', 'vercel', 'daily', 'google-adk'],
      },
    };
    weaveClient = await (weave.init as (arg: string | typeof initOptions) => Promise<WeaveClient>)(
      initOptions
    );
    initialized = true;
    weaveEnabled = true;
    console.log(`✅ Weave initialized for project: ${projectName}`);
  } catch (error) {
    console.warn('⚠️ Failed to initialize Weave:', error);
    weaveEnabled = false;
  }
}

/**
 * Check if Weave is enabled.
 */
export function isWeaveEnabled(): boolean {
  return weaveEnabled && initialized;
}

/**
 * Get the Weave client (if initialized).
 */
export function getWeaveClient(): WeaveClient | null {
  return weaveClient;
}

/**
 * Create a traced operation.
 * Wraps a function to track inputs, outputs, and execution time in Weave.
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
 * Weave reference for direct access.
 */
export { weave };

// Re-export common weave functions
export const op = weave.op;

// Re-export Weave modules for deep integration
export { weaveInference, weaveInferenceWithJson } from './inference';
export type { InferenceOptions } from './inference';
export { queryRecentFailures, getTraceDetails, analyzeFailurePatterns } from './mcp-client';
export type { TraceSummary } from './mcp-client';
export { selfImprove } from './self-improve';
export {
  runEvaluation,
  createDatasetFromRuns,
  fixSuccessScorer,
  efficiencyScorer,
  knowledgeReuseScorer,
  timeToFixScorer,
} from './evaluations';
export type { ScorerFn, EvalRow } from './evaluations';
