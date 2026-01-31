/**
 * FailureAnalyzer
 *
 * Analyzes traces from PatchPilot runs to identify failure patterns,
 * categorize errors, and generate corrective actions.
 */

import { isWeaveEnabled, op } from '@/lib/weave';
import type {
  TraceData,
  TraceOperation,
  FailureAnalysis,
  FailureCause,
  CorrectiveAction,
  FailurePattern,
  PatternCriteria,
  AgentName,
  Priority,
} from './types';

/**
 * Classifies failures and generates corrective actions
 */
export class FailureAnalyzer {
  private failureHistory: FailureAnalysis[] = [];
  private patterns: FailurePattern[] = [];

  constructor() {
    // Initialize built-in patterns
    this.initializePatterns();
  }

  /**
   * Analyze traces and extract failure information
   * Traced by Weave for observability
   */
  analyzeTraces = isWeaveEnabled()
    ? op(this._analyzeTraces.bind(this), { name: 'FailureAnalyzer.analyzeTraces' })
    : this._analyzeTraces.bind(this);

  private async _analyzeTraces(traces: TraceData[]): Promise<FailureAnalysis[]> {
    const analyses: FailureAnalysis[] = [];

    for (const trace of traces) {
      if (!trace.success) {
        const failedOps = this.findFailedOperations(trace);

        for (const op of failedOps) {
          const analysis = this.analyzeFailedOperation(trace.id, op);
          analyses.push(analysis);
        }
      }
    }

    // Aggregate with existing history
    this.aggregateFailures(analyses);

    return analyses;
  }

  /**
   * Find all failed operations in a trace
   */
  private findFailedOperations(trace: TraceData): TraceOperation[] {
    const failed: TraceOperation[] = [];

    const traverse = (ops: TraceOperation[]) => {
      for (const op of ops) {
        if (op.error) {
          failed.push(op);
        }
        if (op.children.length > 0) {
          traverse(op.children);
        }
      }
    };

    traverse(trace.operations);
    return failed;
  }

  /**
   * Analyze a single failed operation
   */
  private analyzeFailedOperation(
    traceId: string,
    operation: TraceOperation
  ): FailureAnalysis {
    const cause = this.classifyFailure(operation);
    const actions = this.generateActions(operation, cause);

    return {
      traceId,
      operationId: operation.id,
      agent: operation.agentName,
      failureCause: cause.type,
      errorMessage: operation.error?.message || 'Unknown error',
      details: cause.details,
      frequency: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      suggestedActions: actions,
    };
  }

  /**
   * Classify the failure cause based on error characteristics
   */
  classifyFailure(operation: TraceOperation): { type: FailureCause; details: string } {
    const errorMsg = operation.error?.message || '';
    const errorType = operation.error?.type || '';

    // Tool errors (external services)
    if (
      errorMsg.includes('timeout') ||
      errorMsg.includes('ETIMEDOUT') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ECONNRESET')
    ) {
      return {
        type: 'TOOL_ERROR',
        details: `External service error in ${operation.name}: Connection or timeout issue`,
      };
    }

    if (
      errorMsg.includes('browser') ||
      errorMsg.includes('Browserbase') ||
      errorMsg.includes('Session')
    ) {
      return {
        type: 'TOOL_ERROR',
        details: `Browser automation error in ${operation.name}: ${errorMsg}`,
      };
    }

    // Rate limiting
    if (
      errorMsg.includes('rate limit') ||
      errorMsg.includes('429') ||
      errorMsg.includes('Too Many Requests')
    ) {
      return {
        type: 'RATE_LIMIT',
        details: `Rate limited in ${operation.name}: ${errorMsg}`,
      };
    }

    // Timeout
    if (
      errorMsg.includes('timed out') ||
      errorMsg.includes('deadline exceeded') ||
      errorType.includes('Timeout')
    ) {
      return {
        type: 'TIMEOUT',
        details: `Operation ${operation.name} exceeded time limit`,
      };
    }

    // Retrieval errors (Redis/knowledge base)
    if (
      operation.name.includes('findSimilar') ||
      operation.name.includes('redis') ||
      operation.name.includes('Redis')
    ) {
      return {
        type: 'RETRIEVAL_ERROR',
        details: `Knowledge base query failed in ${operation.name}: ${errorMsg}`,
      };
    }

    // Parse errors
    if (
      errorMsg.includes('JSON') ||
      errorMsg.includes('parse') ||
      errorMsg.includes('syntax') ||
      errorMsg.includes('Unexpected token')
    ) {
      return {
        type: 'PARSE_ERROR',
        details: `Failed to parse output in ${operation.name}: ${errorMsg}`,
      };
    }

    // Prompt drift (LLM output issues)
    if (
      operation.name.includes('LLM') ||
      operation.name.includes('generate') ||
      operation.name.includes('openai')
    ) {
      if (
        errorMsg.includes('format') ||
        errorMsg.includes('expected') ||
        errorMsg.includes('invalid')
      ) {
        return {
          type: 'PROMPT_DRIFT',
          details: `LLM output did not match expected format in ${operation.name}`,
        };
      }
    }

    return {
      type: 'UNKNOWN',
      details: `Unclassified error in ${operation.name}: ${errorMsg}`,
    };
  }

  /**
   * Generate corrective actions for a failure
   */
  generateActions(
    operation: TraceOperation,
    cause: { type: FailureCause; details: string }
  ): CorrectiveAction[] {
    const actions: CorrectiveAction[] = [];
    const actionId = () => `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    switch (cause.type) {
      case 'TOOL_ERROR':
        actions.push({
          id: actionId(),
          type: 'RETRY',
          target: operation.name,
          description: 'Add retry logic with exponential backoff',
          priority: 'HIGH',
          expectedImpact: 'Reduce transient failures by 80%',
          applied: false,
        });
        actions.push({
          id: actionId(),
          type: 'CONFIG',
          target: operation.name,
          description: 'Increase timeout values and add connection pooling',
          priority: 'MEDIUM',
          expectedImpact: 'Reduce timeout errors by 50%',
          applied: false,
        });
        break;

      case 'RETRIEVAL_ERROR':
        actions.push({
          id: actionId(),
          type: 'CONFIG',
          target: 'redis',
          description: 'Lower similarity threshold for knowledge base queries',
          priority: 'MEDIUM',
          expectedImpact: 'Increase hit rate by 30%',
          applied: false,
        });
        actions.push({
          id: actionId(),
          type: 'WORKFLOW',
          target: operation.agentName,
          description: 'Add fallback when no similar issues found',
          priority: 'HIGH',
          expectedImpact: 'Handle 100% of no-match cases gracefully',
          applied: false,
        });
        break;

      case 'PROMPT_DRIFT':
        actions.push({
          id: actionId(),
          type: 'PROMPT',
          target: operation.agentName,
          description: 'Add output format validation and retry on format error',
          priority: 'HIGH',
          expectedImpact: 'Reduce format errors by 90%',
          applied: false,
        });
        actions.push({
          id: actionId(),
          type: 'PROMPT',
          target: operation.agentName,
          description: 'Use function calling / structured output instead of free-form',
          priority: 'MEDIUM',
          expectedImpact: 'Eliminate format errors entirely',
          applied: false,
        });
        break;

      case 'PARSE_ERROR':
        actions.push({
          id: actionId(),
          type: 'WORKFLOW',
          target: operation.name,
          description: 'Add input sanitization and validation',
          priority: 'HIGH',
          expectedImpact: 'Prevent 95% of parse errors',
          applied: false,
        });
        break;

      case 'TIMEOUT':
        actions.push({
          id: actionId(),
          type: 'CONFIG',
          target: operation.name,
          description: 'Increase timeout threshold or break into smaller operations',
          priority: 'MEDIUM',
          expectedImpact: 'Reduce timeout failures by 70%',
          applied: false,
        });
        break;

      case 'RATE_LIMIT':
        actions.push({
          id: actionId(),
          type: 'CONFIG',
          target: 'api-client',
          description: 'Implement request throttling and rate limit handling',
          priority: 'HIGH',
          expectedImpact: 'Eliminate rate limit errors',
          applied: false,
        });
        break;

      default:
        actions.push({
          id: actionId(),
          type: 'WORKFLOW',
          target: operation.agentName,
          description: 'Add better error logging and manual investigation',
          priority: 'LOW',
          expectedImpact: 'Improve debugging capability',
          applied: false,
        });
    }

    return actions;
  }

  /**
   * Aggregate new failures with existing history
   */
  private aggregateFailures(newAnalyses: FailureAnalysis[]): void {
    for (const analysis of newAnalyses) {
      // Find matching existing failure
      const existing = this.failureHistory.find(
        (f) =>
          f.agent === analysis.agent &&
          f.failureCause === analysis.failureCause &&
          f.errorMessage === analysis.errorMessage
      );

      if (existing) {
        existing.frequency++;
        existing.lastSeen = analysis.lastSeen;
      } else {
        this.failureHistory.push(analysis);
      }
    }
  }

  /**
   * Initialize built-in failure patterns
   */
  private initializePatterns(): void {
    this.patterns = [
      {
        id: 'pattern-session-timeout',
        name: 'Browser Session Timeout',
        description: 'Browser session times out during test execution',
        matchCriteria: {
          errorMessageRegex: 'session.*timeout|Session.*closed',
          agent: 'Tester',
          minOccurrences: 2,
        },
        occurrences: 0,
        agents: ['Tester'],
        suggestedFix: 'Increase session timeout or add keepalive pings',
      },
      {
        id: 'pattern-element-not-found',
        name: 'Element Not Found',
        description: 'Stagehand cannot find the target element',
        matchCriteria: {
          errorMessageRegex: 'element.*not found|could not find|selector.*failed',
          agent: 'Tester',
          minOccurrences: 3,
        },
        occurrences: 0,
        agents: ['Tester'],
        suggestedFix: 'Improve action descriptions or add fallback selectors',
      },
      {
        id: 'pattern-llm-format-error',
        name: 'LLM Format Error',
        description: 'LLM output does not match expected JSON format',
        matchCriteria: {
          errorMessageRegex: 'JSON|parse|unexpected token',
          minOccurrences: 2,
        },
        occurrences: 0,
        agents: ['Triage', 'Fixer'],
        suggestedFix: 'Use structured output or add format validation with retry',
      },
      {
        id: 'pattern-deployment-failure',
        name: 'Deployment Failure',
        description: 'Vercel deployment fails after applying patch',
        matchCriteria: {
          errorMessageRegex: 'build.*failed|deployment.*error|vercel.*error',
          agent: 'Verifier',
          minOccurrences: 1,
        },
        occurrences: 0,
        agents: ['Verifier'],
        suggestedFix: 'Add syntax validation before committing patches',
      },
      {
        id: 'pattern-repeated-fix-failure',
        name: 'Repeated Fix Failure',
        description: 'Same bug fails to fix after multiple iterations',
        matchCriteria: {
          operationNameRegex: 'generatePatch|verify',
          minOccurrences: 3,
          timeWindowMs: 300000, // 5 minutes
        },
        occurrences: 0,
        agents: ['Fixer', 'Verifier'],
        suggestedFix: 'Escalate to human review or try alternative fix approach',
      },
    ];
  }

  /**
   * Detect patterns in failure history
   */
  detectPatterns = isWeaveEnabled()
    ? op(this._detectPatterns.bind(this), { name: 'FailureAnalyzer.detectPatterns' })
    : this._detectPatterns.bind(this);

  private async _detectPatterns(): Promise<FailurePattern[]> {
    const detectedPatterns: FailurePattern[] = [];

    for (const pattern of this.patterns) {
      const matches = this.failureHistory.filter((f) =>
        this.matchesPattern(f, pattern.matchCriteria)
      );

      // Count total occurrences including frequency of aggregated failures
      const totalOccurrences = matches.reduce((sum, f) => sum + f.frequency, 0);

      if (totalOccurrences >= pattern.matchCriteria.minOccurrences) {
        detectedPatterns.push({
          ...pattern,
          occurrences: totalOccurrences,
        });
      }
    }

    return detectedPatterns;
  }

  /**
   * Check if a failure matches pattern criteria
   */
  private matchesPattern(failure: FailureAnalysis, criteria: PatternCriteria): boolean {
    if (criteria.agent && failure.agent !== criteria.agent) {
      return false;
    }

    if (criteria.errorMessageRegex) {
      const regex = new RegExp(criteria.errorMessageRegex, 'i');
      if (!regex.test(failure.errorMessage) && !regex.test(failure.details)) {
        return false;
      }
    }

    if (criteria.timeWindowMs) {
      const now = Date.now();
      const failureTime = failure.lastSeen.getTime();
      if (now - failureTime > criteria.timeWindowMs) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get failure statistics
   */
  getStatistics(): {
    totalFailures: number;
    byAgent: Record<AgentName, number>;
    byCause: Record<FailureCause, number>;
    topErrors: Array<{ message: string; count: number }>;
  } {
    const byAgent: Record<AgentName, number> = {
      Tester: 0,
      Triage: 0,
      Fixer: 0,
      Verifier: 0,
      Orchestrator: 0,
    };

    const byCause: Record<FailureCause, number> = {
      TOOL_ERROR: 0,
      RETRIEVAL_ERROR: 0,
      PROMPT_DRIFT: 0,
      PARSE_ERROR: 0,
      TIMEOUT: 0,
      RATE_LIMIT: 0,
      UNKNOWN: 0,
    };

    const errorCounts: Map<string, number> = new Map();

    for (const failure of this.failureHistory) {
      byAgent[failure.agent] = (byAgent[failure.agent] || 0) + failure.frequency;
      byCause[failure.failureCause] = (byCause[failure.failureCause] || 0) + failure.frequency;

      const count = errorCounts.get(failure.errorMessage) || 0;
      errorCounts.set(failure.errorMessage, count + failure.frequency);
    }

    const topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalFailures: this.failureHistory.reduce((sum, f) => sum + f.frequency, 0),
      byAgent,
      byCause,
      topErrors,
    };
  }

  /**
   * Get all failures
   */
  getFailures(): FailureAnalysis[] {
    return [...this.failureHistory];
  }

  /**
   * Get high priority actions
   */
  getHighPriorityActions(): CorrectiveAction[] {
    const allActions: CorrectiveAction[] = [];

    for (const failure of this.failureHistory) {
      allActions.push(...failure.suggestedActions.filter((a) => a.priority === 'HIGH'));
    }

    return allActions;
  }

  /**
   * Reset the analyzer state
   */
  reset(): void {
    this.failureHistory = [];
    this.initializePatterns();
  }
}

export default FailureAnalyzer;
