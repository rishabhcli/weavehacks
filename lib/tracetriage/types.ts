/**
 * TraceTriage Type Definitions
 *
 * Types for the self-improvement system that analyzes PatchPilot's
 * execution traces to identify failure patterns and improve performance.
 */

// ============================================================================
// Trace Data Types
// ============================================================================

/**
 * Represents a single operation within a trace
 */
export interface TraceOperation {
  id: string;
  name: string;
  agentName: AgentName;
  startTime: number;
  endTime: number;
  durationMs: number;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    type: string;
  };
  children: TraceOperation[];
}

/**
 * Complete trace of a PatchPilot run
 */
export interface TraceData {
  id: string;
  runId: string;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  success: boolean;
  operations: TraceOperation[];
  metadata: {
    testsTotal: number;
    testsPassed: number;
    iterationsTotal: number;
    patchesApplied: number;
  };
}

// ============================================================================
// Failure Analysis Types
// ============================================================================

/**
 * Agents in the PatchPilot system
 */
export type AgentName = 'Tester' | 'Triage' | 'Fixer' | 'Verifier' | 'Orchestrator';

/**
 * Types of failures that can occur
 */
export type FailureCause =
  | 'TOOL_ERROR'      // External service error (browser, Redis, Vercel)
  | 'RETRIEVAL_ERROR' // Wrong/no results from knowledge base
  | 'PROMPT_DRIFT'    // LLM didn't follow format or instructions
  | 'PARSE_ERROR'     // Failed to parse input/output
  | 'TIMEOUT'         // Operation exceeded time limit
  | 'RATE_LIMIT'      // API rate limiting
  | 'UNKNOWN';        // Could not determine cause

/**
 * Priority levels for corrective actions
 */
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Types of corrective actions
 */
export type ActionType = 'PROMPT' | 'WORKFLOW' | 'CONFIG' | 'RETRY';

/**
 * Analysis of a single failure
 */
export interface FailureAnalysis {
  traceId: string;
  operationId: string;
  agent: AgentName;
  failureCause: FailureCause;
  errorMessage: string;
  details: string;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  suggestedActions: CorrectiveAction[];
}

/**
 * A corrective action to fix a failure pattern
 */
export interface CorrectiveAction {
  id: string;
  type: ActionType;
  target: string;           // Which component to modify
  description: string;      // What to change
  priority: Priority;
  expectedImpact: string;   // What improvement to expect
  applied: boolean;
  appliedAt?: Date;
  result?: ActionResult;
}

/**
 * Result of applying a corrective action
 */
export interface ActionResult {
  success: boolean;
  improvement: number;      // Percentage improvement (positive = better)
  notes: string;
}

// ============================================================================
// Pattern Detection Types
// ============================================================================

/**
 * A detected failure pattern
 */
export interface FailurePattern {
  id: string;
  name: string;
  description: string;
  matchCriteria: PatternCriteria;
  occurrences: number;
  agents: AgentName[];
  suggestedFix: string;
}

/**
 * Criteria for matching a failure pattern
 */
export interface PatternCriteria {
  errorMessageRegex?: string;
  agent?: AgentName;
  operationNameRegex?: string;
  minOccurrences: number;
  timeWindowMs?: number;
}

// ============================================================================
// A/B Testing Types
// ============================================================================

/**
 * Configuration for a prompt or workflow variant
 */
export interface PromptConfig {
  id: string;
  name: string;
  version: string;
  prompt: string;
  parameters: Record<string, unknown>;
}

/**
 * Result of an A/B test comparison
 */
export interface ABTestResult {
  testId: string;
  controlConfig: PromptConfig;
  variantConfig: PromptConfig;
  startTime: Date;
  endTime: Date;
  metrics: {
    controlPassRate: number;
    variantPassRate: number;
    controlAvgIterations: number;
    variantAvgIterations: number;
    controlAvgDurationMs: number;
    variantAvgDurationMs: number;
    sampleSize: number;
  };
  winner: 'control' | 'variant' | 'tie';
  confidence: number;
  recommendation: string;
}

/**
 * Test case for A/B testing
 */
export interface ABTestCase {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
  expectedOutcome?: unknown;
}

// ============================================================================
// TraceTriage Session Types
// ============================================================================

/**
 * A TraceTriage analysis session
 */
export interface TriageSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  tracesAnalyzed: number;
  failuresFound: number;
  patternsDetected: number;
  actionsGenerated: number;
  actionsApplied: number;
  improvementMeasured: number;
}

/**
 * Summary of TraceTriage effectiveness
 */
export interface TriageSummary {
  totalSessions: number;
  totalTracesAnalyzed: number;
  totalFailuresFound: number;
  totalActionsGenerated: number;
  totalActionsApplied: number;
  averageImprovement: number;
  topPatterns: FailurePattern[];
  topActions: CorrectiveAction[];
}
