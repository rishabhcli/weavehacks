/**
 * W&B Weave Integration
 *
 * Comprehensive observability and tracing for PatchPilot agents.
 *
 * Features:
 * - Traces all agent method calls with inputs/outputs
 * - Logs metrics and custom attributes
 * - Supports evaluations with custom scorers
 * - Datasets for storing run history
 * - Feedback collection for quality tracking
 * - Models for agent versioning
 * - Self-improvement loop using trace analysis
 *
 * Built for WeaveHacks 2026 - Best Use of Weave
 */

import * as weave from 'weave';
import type { WeaveClient } from 'weave';

// Local state for initialization
let initialized = false;
let weaveEnabled = true;
let weaveClient: WeaveClient | null = null;
let projectName = 'patchpilot';

/**
 * Initialize Weave with the PatchPilot project.
 * Enhanced with project metadata for WeaveHacks observability.
 */
export async function initWeave(project: string = 'patchpilot'): Promise<void> {
  if (initialized) {
    return;
  }

  projectName = project;

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
        hackathon: 'weavehacks-2026',
      },
    };
    weaveClient = await (weave.init as (arg: string | typeof initOptions) => Promise<WeaveClient>)(
      initOptions
    );
    initialized = true;
    weaveEnabled = true;
    console.log(`✅ Weave initialized for project: ${projectName}`);
    console.log(`📊 View traces at: ${getWeaveProjectUrl()}`);
  } catch (error) {
    console.warn('⚠️ Failed to initialize Weave:', error);
    weaveEnabled = false;
  }
}

/**
 * Get the Weave project URL for viewing traces
 */
export function getWeaveProjectUrl(): string {
  const entity = process.env.WANDB_ENTITY || process.env.WANDB_USERNAME || 'default';
  return `https://wandb.ai/${entity}/${projectName}/weave`;
}

/**
 * Get URL for a specific trace
 */
export function getWeaveTraceUrl(traceId: string): string {
  return `${getWeaveProjectUrl()}/traces/${traceId}`;
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

// Re-export common weave functions - wrap to avoid initialization order issues
type AnyFunction = (...args: never[]) => unknown;
export function op<T extends AnyFunction>(fn: T, options?: { name?: string }): T {
  return weave.op(fn, options) as T;
}

// ============================================================================
// RE-EXPORTS - Weave Modules for Deep Integration
// ============================================================================

// Inference - LLM calls with tracing
export { weaveInference, weaveInferenceWithJson } from './inference';
export type { InferenceOptions } from './inference';

// MCP Client - Query Weave traces
export { queryRecentFailures, getTraceDetails, analyzeFailurePatterns } from './mcp-client';
export type { TraceSummary } from './mcp-client';

// Self-Improvement - Automatic agent optimization
export { selfImprove } from './self-improve';

// Evaluations - Custom scorers and evaluation runner
export {
  runEvaluation,
  createDatasetFromRuns,
  fixSuccessScorer,
  efficiencyScorer,
  knowledgeReuseScorer,
  timeToFixScorer,
  patchSizeScorer,
  diagnosisConfidenceScorer,
  firstTimeFix,
  compareEvaluations,
  logEvaluationComparison,
  generateEvaluationReport,
} from './evaluations';
export type { EvaluationRow, EvaluationResult, ComparisonResult } from './evaluations';

// Metrics - Run metrics logging
export {
  logRunMetrics,
  logOperationMetrics,
  tracedLogMetrics,
  calculatePassRate,
  calculateImprovement,
  formatDuration,
} from './metrics';
export type { RunMetrics, OperationMetrics } from './metrics';

// Tracing - Low-level tracing utilities
export {
  createTracedMethod,
  trace,
  traceAgent,
  startSpan,
  endSpan,
  truncateValue,
} from './tracing';
export type { TracingConfig, TraceSpan } from './tracing';

// Datasets - Historical run data storage
export {
  storeRunInDataset,
  createEvaluationDataset,
  logDatasetRow,
  computeDatasetMetrics,
  logDatasetMetrics,
} from './datasets';
export type { RunDatasetRow, EvaluationDatasetRow, DatasetMetrics } from './datasets';

// Feedback - User feedback collection
export {
  recordFeedback,
  recordPositiveFeedback,
  recordNegativeFeedback,
  recordRatedFeedback,
  computeFeedbackSummary,
  logFeedbackSummary,
} from './feedback';
export type { Feedback, FeedbackType, FeedbackSummary } from './feedback';

// Models - Agent model definitions
export {
  TesterModel,
  TriageModel,
  FixerModel,
  VerifierModel,
  OrchestratorModel,
  AGENT_VERSIONS,
  getAgentModelConfig,
} from './models';
export type { AgentModelConfig } from './models';
