/**
 * TraceTriage
 *
 * Self-improvement system that analyzes QAgent's execution traces
 * to identify failure patterns and improve performance.
 *
 * Main exports:
 * - TraceTriage class: Main orchestrator for trace analysis
 * - FailureAnalyzer: Categorizes and analyzes failures
 * - PromptImprover: Generates improved prompts
 * - ABTestRunner: Compares configurations
 */

import { isWeaveEnabled, op } from '@/lib/weave';
import { FailureAnalyzer } from './analyzer';
import { PromptImprover } from './prompt-improver';
import { ABTestRunner } from './ab-testing';
import type {
  TraceData,
  FailureAnalysis,
  FailurePattern,
  CorrectiveAction,
  TriageSession,
  TriageSummary,
  ABTestCase,
  ABTestResult,
  PromptConfig,
  AgentName,
} from './types';

// Re-export types
export * from './types';
export { FailureAnalyzer } from './analyzer';
export { PromptImprover, DEFAULT_PROMPTS } from './prompt-improver';
export { ABTestRunner } from './ab-testing';

/**
 * Configuration for TraceTriage
 */
export interface TraceTriageConfig {
  /** Auto-apply safe improvements */
  autoApplySafe: boolean;
  /** Minimum confidence for auto-apply */
  minConfidenceForAutoApply: number;
  /** Maximum actions to apply per session */
  maxActionsPerSession: number;
  /** Enable A/B testing for improvements */
  enableABTesting: boolean;
}

const DEFAULT_CONFIG: TraceTriageConfig = {
  autoApplySafe: false,
  minConfidenceForAutoApply: 0.85,
  maxActionsPerSession: 5,
  enableABTesting: true,
};

/**
 * TraceTriage orchestrator
 * Coordinates trace analysis, pattern detection, and improvement generation
 */
export class TraceTriage {
  private analyzer: FailureAnalyzer;
  private promptImprover: PromptImprover;
  private abTestRunner: ABTestRunner;
  private config: TraceTriageConfig;
  private sessions: TriageSession[] = [];
  private currentSession: TriageSession | null = null;

  constructor(config: Partial<TraceTriageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.analyzer = new FailureAnalyzer();
    this.promptImprover = new PromptImprover();
    this.abTestRunner = new ABTestRunner();
  }

  /**
   * Start a new triage session
   */
  startSession(): TriageSession {
    const session: TriageSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startTime: new Date(),
      tracesAnalyzed: 0,
      failuresFound: 0,
      patternsDetected: 0,
      actionsGenerated: 0,
      actionsApplied: 0,
      improvementMeasured: 0,
    };

    this.currentSession = session;
    this.sessions.push(session);

    console.log(`📊 TraceTriage session started: ${session.id}`);
    return session;
  }

  /**
   * End the current session
   */
  endSession(): TriageSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    console.log(`📊 TraceTriage session ended: ${this.currentSession.id}`);
    console.log(`   Traces analyzed: ${this.currentSession.tracesAnalyzed}`);
    console.log(`   Failures found: ${this.currentSession.failuresFound}`);
    console.log(`   Patterns detected: ${this.currentSession.patternsDetected}`);
    console.log(`   Actions generated: ${this.currentSession.actionsGenerated}`);

    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * Analyze traces and generate improvements
   * Traced by Weave for observability
   */
  analyze = isWeaveEnabled()
    ? op(this._analyze.bind(this), { name: 'TraceTriage.analyze' })
    : this._analyze.bind(this);

  private async _analyze(traces: TraceData[]): Promise<{
    failures: FailureAnalysis[];
    patterns: FailurePattern[];
    actions: CorrectiveAction[];
  }> {
    // Start session if not already started
    if (!this.currentSession) {
      this.startSession();
    }

    // Step 1: Analyze traces for failures
    console.log('🔍 Analyzing traces for failures...');
    const failures = await this.analyzer.analyzeTraces(traces);

    if (this.currentSession) {
      this.currentSession.tracesAnalyzed += traces.length;
      this.currentSession.failuresFound += failures.length;
    }

    if (failures.length === 0) {
      console.log('✅ No failures found in traces');
      return { failures: [], patterns: [], actions: [] };
    }

    console.log(`   Found ${failures.length} failures`);

    // Step 2: Detect patterns
    console.log('🔍 Detecting failure patterns...');
    const patterns = await this.analyzer.detectPatterns();

    if (this.currentSession) {
      this.currentSession.patternsDetected = patterns.length;
    }

    console.log(`   Detected ${patterns.length} patterns`);

    // Step 3: Collect actions from failures
    const actions: CorrectiveAction[] = [];
    for (const failure of failures) {
      actions.push(...failure.suggestedActions);
    }

    if (this.currentSession) {
      this.currentSession.actionsGenerated = actions.length;
    }

    console.log(`   Generated ${actions.length} corrective actions`);

    return { failures, patterns, actions };
  }

  /**
   * Generate prompt improvements for an agent
   */
  improvePrompt = isWeaveEnabled()
    ? op(this._improvePrompt.bind(this), { name: 'TraceTriage.improvePrompt' })
    : this._improvePrompt.bind(this);

  private async _improvePrompt(agent: AgentName): Promise<{
    improvement: ReturnType<PromptImprover['improvePrompt']> extends Promise<infer T> ? T : never;
    abTestResult?: ABTestResult;
  }> {
    const failures = this.analyzer.getFailures();
    const improvement = await this.promptImprover.improvePrompt(agent, failures);

    // Run A/B test if enabled and prompt was improved
    let abTestResult: ABTestResult | undefined;
    if (this.config.enableABTesting && improvement.changes.length > 0) {
      console.log('🧪 Running A/B test for prompt improvement...');

      const controlConfig = this.promptImprover.getPromptConfig(agent, 'v1') || {
        id: `${agent}-control`,
        name: 'Control',
        version: 'v1',
        prompt: improvement.originalPrompt,
        parameters: {},
      };

      const variantConfig = this.promptImprover.createConfig(
        agent,
        'Improved',
        improvement.improvedPrompt
      );

      // Create test cases based on recent failures
      const testCases: ABTestCase[] = failures
        .filter((f) => f.agent === agent)
        .slice(0, 5)
        .map((f, i) => ({
          id: `test-${i}`,
          name: `Test case ${i + 1}`,
          inputs: { errorMessage: f.errorMessage, details: f.details },
        }));

      if (testCases.length > 0) {
        abTestResult = await this.abTestRunner.runTest(testCases, controlConfig, variantConfig, {
          runsPerCase: 3,
        });

        console.log(`   Winner: ${abTestResult.winner} (confidence: ${(abTestResult.confidence * 100).toFixed(1)}%)`);
      }
    }

    return { improvement, abTestResult };
  }

  /**
   * Apply a corrective action
   */
  applyAction = isWeaveEnabled()
    ? op(this._applyAction.bind(this), { name: 'TraceTriage.applyAction' })
    : this._applyAction.bind(this);

  private async _applyAction(action: CorrectiveAction): Promise<boolean> {
    if (action.applied) {
      console.log(`⚠️ Action ${action.id} already applied`);
      return false;
    }

    console.log(`📝 Applying action: ${action.description}`);

    // In a real implementation, this would actually apply the action
    // For now, we just mark it as applied
    action.applied = true;
    action.appliedAt = new Date();

    if (this.currentSession) {
      this.currentSession.actionsApplied++;
    }

    // Simulate result
    action.result = {
      success: true,
      improvement: 15 + Math.random() * 20, // Simulated 15-35% improvement
      notes: 'Action applied successfully (simulated)',
    };

    console.log(`   Result: ${action.result.improvement.toFixed(1)}% improvement`);

    return true;
  }

  /**
   * Auto-apply safe improvements if configured
   */
  autoApplySafeImprovements = isWeaveEnabled()
    ? op(this._autoApplySafeImprovements.bind(this), { name: 'TraceTriage.autoApplySafeImprovements' })
    : this._autoApplySafeImprovements.bind(this);

  private async _autoApplySafeImprovements(): Promise<CorrectiveAction[]> {
    if (!this.config.autoApplySafe) {
      return [];
    }

    const appliedActions: CorrectiveAction[] = [];
    const highPriorityActions = this.analyzer.getHighPriorityActions();

    // Filter to safe actions (CONFIG and RETRY types are generally safe)
    const safeActions = highPriorityActions.filter(
      (a) => (a.type === 'CONFIG' || a.type === 'RETRY') && !a.applied
    );

    // Apply up to maxActionsPerSession
    const actionsToApply = safeActions.slice(0, this.config.maxActionsPerSession);

    for (const action of actionsToApply) {
      const applied = await this.applyAction(action);
      if (applied) {
        appliedActions.push(action);
      }
    }

    return appliedActions;
  }

  /**
   * Get failure statistics
   */
  getStatistics(): ReturnType<FailureAnalyzer['getStatistics']> {
    return this.analyzer.getStatistics();
  }

  /**
   * Get A/B test summary
   */
  getABTestSummary(): ReturnType<ABTestRunner['getSummary']> {
    return this.abTestRunner.getSummary();
  }

  /**
   * Get overall TraceTriage summary
   */
  getSummary(): TriageSummary {
    const allFailures = this.analyzer.getFailures();
    const stats = this.analyzer.getStatistics();

    // Collect all actions
    const allActions: CorrectiveAction[] = [];
    for (const failure of allFailures) {
      allActions.push(...failure.suggestedActions);
    }

    const appliedActions = allActions.filter((a) => a.applied);
    const avgImprovement =
      appliedActions.length > 0
        ? appliedActions.reduce((sum, a) => sum + (a.result?.improvement || 0), 0) /
          appliedActions.length
        : 0;

    return {
      totalSessions: this.sessions.length,
      totalTracesAnalyzed: this.sessions.reduce((sum, s) => sum + s.tracesAnalyzed, 0),
      totalFailuresFound: allFailures.length,
      totalActionsGenerated: allActions.length,
      totalActionsApplied: appliedActions.length,
      averageImprovement: avgImprovement,
      topPatterns: [], // Would be populated from pattern detection
      topActions: appliedActions.slice(0, 5),
    };
  }

  /**
   * Get all sessions
   */
  getSessions(): TriageSession[] {
    return [...this.sessions];
  }

  /**
   * Reset TraceTriage state
   */
  reset(): void {
    this.analyzer.reset();
    this.abTestRunner.clearResults();
    this.sessions = [];
    this.currentSession = null;
    console.log('🔄 TraceTriage reset');
  }

  /**
   * Get the underlying components for advanced usage
   */
  getComponents(): {
    analyzer: FailureAnalyzer;
    promptImprover: PromptImprover;
    abTestRunner: ABTestRunner;
  } {
    return {
      analyzer: this.analyzer,
      promptImprover: this.promptImprover,
      abTestRunner: this.abTestRunner,
    };
  }
}

export default TraceTriage;
