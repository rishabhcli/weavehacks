# Phase 5: TraceTriage

**Focus:** Self-improvement through trace analysis

**Status:** Pending (requires Phase 4 completion)

---

## Overview

Phase 5 implements TraceTriage, a meta-system that analyzes PatchPilot's own execution traces to identify failure patterns and improve performance. The system automatically categorizes agent failures, identifies root causes, and generates corrective actions that can be applied to improve prompts, workflows, or configurations.

---

## Skills to Load

```
.claude/skills/wandb-weave/
├── SKILL.md      # Trace analysis patterns
└── reference.md  # TraceTriage implementation

.claude/skills/patchpilot-agents/
├── SKILL.md      # Agent behavior understanding
└── reference.md  # Agent interfaces
```

---

## Ralph Loop Template

```
## Ralph Loop - Phase 5 - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for project context
- [ ] Check TASKS.md for Phase 5 tasks
- [ ] Load wandb-weave skill (TraceTriage section)
- [ ] Review trace data from Phase 4

### 2. ANALYZE
- Current task: [Task ID and description]
- Trace data available: [Yes/No]
- Failure patterns identified: [Count]

### 3. PLAN
Increments for this iteration:
1. [Specific analysis task]
2. [Improvement implementation]
3. [Validation task]

### 4. EXECUTE
[Implement one increment at a time]

### 5. VALIDATE
- [ ] Trace analysis runs without errors
- [ ] Failures are categorized correctly
- [ ] Corrective actions are generated
- [ ] Improvements are measurable

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit working code
- [ ] Continue to next task or end iteration
```

---

## Tasks

### P5.1: Trace Collection
- [ ] Query all traces from Weave
- [ ] Filter failed runs
- [ ] Extract agent-level traces
- [ ] Store in analyzable format

### P5.2: Failure Categorization
- [ ] Implement FailureAnalyzer class
- [ ] Categorize by agent (Tester/Triage/Fixer/Verifier)
- [ ] Categorize by failure type
- [ ] Track frequency and patterns

### P5.3: Root Cause Analysis
- [ ] Parse trace metadata
- [ ] Identify common failure sequences
- [ ] Correlate with inputs/outputs
- [ ] Generate root cause hypotheses

### P5.4: Corrective Actions
- [ ] Define action types (prompt, workflow, config)
- [ ] Generate specific recommendations
- [ ] Prioritize by impact
- [ ] Track action effectiveness

### P5.5: Prompt Improvement
- [ ] Identify prompts that lead to failures
- [ ] Generate improved prompt variants
- [ ] A/B test improvements
- [ ] Measure accuracy gains

### P5.6: Workflow Optimization
- [ ] Identify inefficient sequences
- [ ] Suggest workflow changes
- [ ] Test optimizations
- [ ] Measure iteration reduction

### P5.7: Self-Improvement Loop
- [ ] Automate trace analysis
- [ ] Auto-apply safe improvements
- [ ] Track improvement over time
- [ ] Alert on regression

---

## TraceTriage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRACETRIAGE                               │
│                   Self-Improvement System                        │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Trace Collector │  │ Failure Analyzer│  │ Action Generator│
│                 │  │                 │  │                 │
│ - Query Weave   │  │ - Categorize    │  │ - Prompt fixes  │
│ - Filter failed │  │ - Find patterns │  │ - Workflow opts │
│ - Extract data  │  │ - Root cause    │  │ - Config tuning │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │ Improvement     │
                    │ Tracker         │
                    │                 │
                    │ - A/B tests     │
                    │ - Metrics       │
                    │ - Rollback      │
                    └─────────────────┘
```

---

## Failure Categories

### Agent-Level Failures

| Agent | Failure Type | Cause | Action |
|-------|-------------|-------|--------|
| Tester | SESSION_ERROR | Browserbase timeout | Increase timeout, retry |
| Tester | ACTION_FAILED | Stagehand can't find element | Improve action description |
| Triage | MISCLASSIFICATION | Wrong failure type | Improve classification heuristics |
| Triage | LOCALIZATION_FAILED | Can't find file/line | Better stack trace parsing |
| Fixer | INVALID_PATCH | Syntax error in generated code | Improve prompt, add validation |
| Fixer | WRONG_FIX | Patch doesn't address root cause | Include more context in prompt |
| Verifier | DEPLOY_FAILED | Vercel build error | Check syntax before commit |
| Verifier | TEST_STILL_FAILS | Fix didn't work | Improve Fixer prompt |

### Pattern-Based Failures

| Pattern | Description | Corrective Action |
|---------|-------------|-------------------|
| REPEATED_FAILURE | Same error 3+ times | Escalate to human review |
| OSCILLATING_FIX | Fix/break cycle | Lock working state, investigate |
| SLOW_CONVERGENCE | >5 iterations | Analyze Redis misses, improve triage |
| REGRESSION | Previously fixed bug returns | Add regression test, improve verification |

---

## Key Components

### Failure Analyzer

```typescript
interface FailureAnalysis {
  traceId: string;
  agent: 'Tester' | 'Triage' | 'Fixer' | 'Verifier';
  failureType: string;
  rootCause: string;
  frequency: number;
  suggestedAction: CorrectiveAction;
}

interface CorrectiveAction {
  type: 'PROMPT' | 'WORKFLOW' | 'CONFIG';
  target: string;           // Which component to modify
  change: string;           // What to change
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedImpact: string;   // What improvement to expect
}

class FailureAnalyzer {
  @weave.op()
  async analyzeTraces(since: Date): Promise<FailureAnalysis[]> {
    // 1. Fetch failed traces from Weave
    const traces = await this.fetchFailedTraces(since);

    // 2. Categorize each failure
    const analyses: FailureAnalysis[] = [];
    for (const trace of traces) {
      const analysis = await this.categorizeFailure(trace);
      analyses.push(analysis);
    }

    // 3. Aggregate patterns
    const patterns = this.aggregatePatterns(analyses);

    // 4. Generate corrective actions
    return this.generateActions(patterns);
  }
}
```

### Prompt Improver

```typescript
class PromptImprover {
  @weave.op()
  async improvePrompt(
    agent: string,
    currentPrompt: string,
    failures: FailureAnalysis[]
  ): Promise<string> {
    const prompt = `You are improving an AI agent's prompt.

Current prompt:
${currentPrompt}

Recent failures:
${failures.map(f => `- ${f.failureType}: ${f.rootCause}`).join('\n')}

Generate an improved prompt that addresses these failures.
Keep the same structure but improve clarity and edge case handling.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });

    return response.choices[0].message.content!;
  }
}
```

### A/B Test Runner

```typescript
interface ABTestResult {
  controlPassRate: number;
  variantPassRate: number;
  controlIterations: number;
  variantIterations: number;
  winner: 'control' | 'variant' | 'tie';
  confidence: number;
}

class ABTestRunner {
  @weave.op()
  async runTest(
    testCases: TestSpec[],
    control: PromptConfig,
    variant: PromptConfig,
    runsPerCase: number = 5
  ): Promise<ABTestResult> {
    const controlResults: boolean[] = [];
    const variantResults: boolean[] = [];

    for (const testCase of testCases) {
      for (let i = 0; i < runsPerCase; i++) {
        // Run with control
        const controlResult = await this.runWithConfig(testCase, control);
        controlResults.push(controlResult.success);

        // Run with variant
        const variantResult = await this.runWithConfig(testCase, variant);
        variantResults.push(variantResult.success);
      }
    }

    return this.analyzeResults(controlResults, variantResults);
  }
}
```

---

## Metrics to Track

### Improvement Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Pass Rate Improvement | % increase in test pass rate | +20% |
| Iteration Reduction | Fewer loops to fix bugs | -30% |
| Fix Time Reduction | Faster time to fix | -25% |
| First-Try Success | Fixes that work immediately | +40% |

### TraceTriage Effectiveness

| Metric | Description | Target |
|--------|-------------|--------|
| Actions Generated | Corrective actions per analysis | 3-5 |
| Actions Applied | % of actions safely auto-applied | 50% |
| Action Success Rate | % of actions that improved metrics | 70% |
| Regression Rate | % of improvements that regressed | <5% |

---

## Validation Checklist

### Trace Collection
- [ ] Failed traces are retrieved
- [ ] Trace data is complete
- [ ] Agent-level details are extracted

### Failure Analysis
- [ ] Failures are categorized correctly
- [ ] Patterns are identified
- [ ] Root causes are accurate

### Corrective Actions
- [ ] Actions are generated
- [ ] Actions are specific and actionable
- [ ] Priority is assigned correctly

### A/B Testing
- [ ] Tests run successfully
- [ ] Results are statistically meaningful
- [ ] Winner is determined correctly

### Self-Improvement
- [ ] Improvements are measurable
- [ ] Regressions are detected
- [ ] Safe rollback works

---

## Common Issues

### Not Enough Trace Data
```
Warning: Insufficient traces for analysis
```
- Run more tests to generate traces
- Lower minimum trace threshold
- Use synthetic failures for testing

### False Positive Patterns
```
Pattern detected but not actionable
```
- Increase pattern frequency threshold
- Add confirmation step
- Require multiple evidence points

### A/B Test Inconclusive
```
Result: tie (confidence: 0.45)
```
- Increase runs per case
- Use more diverse test cases
- Check for high variance

---

## Exit Criteria

Phase 5 is complete when:

1. Trace collection from Weave works
2. Failure analysis categorizes correctly
3. Corrective actions are generated
4. At least one prompt improvement is validated
5. A/B testing framework works
6. Measurable improvement demonstrated
7. All code is committed

---

## Next Phase

Upon completion, proceed to **Phase 6: RedTeam** where we implement adversarial testing and security hardening.

---

## References

- [.claude/skills/wandb-weave/SKILL.md](../.claude/skills/wandb-weave/SKILL.md) - TraceTriage section
- [.claude/skills/wandb-weave/reference.md](../.claude/skills/wandb-weave/reference.md) - Implementation patterns
- [W&B Weave Docs](https://wandb.ai/site/weave)
