# Phase 2: Core QAgent Loop

**Focus:** Triage, Fixer, Verifier agents and end-to-end orchestration

**Status:** Pending (requires Phase 1 completion)

---

## Overview

Phase 2 implements the heart of QAgent: the three remaining agents (Triage, Fixer, Verifier) and the orchestration logic that connects them. By the end of this phase, QAgent should be able to detect a bug, diagnose it, generate a patch, deploy it, and verify the fix.

---

## Skills to Load

```
.claude/skills/qagent-agents/
├── SKILL.md      # Agent specifications and data flow
└── reference.md  # Full agent implementations

.claude/skills/vercel-deployment/
├── SKILL.md      # Deployment lifecycle
└── reference.md  # Vercel API patterns
```

---

## Ralph Loop Template

```
## Ralph Loop - Phase 2 - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for project context
- [ ] Check TASKS.md for Phase 2 tasks
- [ ] Load qagent-agents skill
- [ ] Load vercel-deployment skill
- [ ] Review agent interfaces in DESIGN.md

### 2. ANALYZE
- Current task: [Task ID and description]
- Agents implemented: [List]
- Agents remaining: [List]
- Integration status: [Wired/Not wired]

### 3. PLAN
Increments for this iteration:
1. [Specific agent or integration task]
2. [Testing task]
3. [Validation task]

### 4. EXECUTE
[Implement one increment at a time]

### 5. VALIDATE
- [ ] Agent compiles without errors
- [ ] Agent produces correct output type
- [ ] Integration passes data correctly
- [ ] End-to-end test works

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit working code
- [ ] Continue to next task or end iteration
```

---

## Tasks

### P2.1: Triage Agent Implementation
- [ ] Create TriageAgent class
- [ ] Implement failure classification
- [ ] Add stack trace parsing for localization
- [ ] Build diagnosis prompt for LLM
- [ ] Return structured DiagnosisReport

### P2.2: Fixer Agent Implementation
- [ ] Create FixerAgent class
- [ ] Load source file at localized path
- [ ] Build patch generation prompt
- [ ] Call OpenAI API for patch
- [ ] Parse and validate response
- [ ] Generate diff format

### P2.3: Verifier Agent Implementation
- [ ] Create VerifierAgent class
- [ ] Implement patch application
- [ ] Add syntax validation (tsc --noEmit)
- [ ] Implement git commit and push
- [ ] Add Vercel deployment polling
- [ ] Integrate TesterAgent for re-test

### P2.4: Orchestration Script
- [ ] Create QAgentOrchestrator class
- [ ] Wire agents in sequence
- [ ] Add iteration tracking
- [ ] Implement max iteration limit
- [ ] Add success/failure handling
- [ ] Return comprehensive result

### P2.5: End-to-End Test
- [ ] Run full loop on Bug 1
- [ ] Verify each agent produces correct output
- [ ] Confirm patch is applied correctly
- [ ] Verify Vercel deployment succeeds
- [ ] Confirm test passes after fix

---

## Agent Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  TESTER AGENT                                                    │
│  Input: TestSpec                                                 │
│  Output: TestResult { passed: false, failureReport }             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ FailureReport
┌─────────────────────────────────────────────────────────────────┐
│  TRIAGE AGENT                                                    │
│  Input: FailureReport                                            │
│  Output: DiagnosisReport { failureType, rootCause, localization }│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ DiagnosisReport
┌─────────────────────────────────────────────────────────────────┐
│  FIXER AGENT                                                     │
│  Input: DiagnosisReport                                          │
│  Output: Patch { file, diff, changes }                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Patch
┌─────────────────────────────────────────────────────────────────┐
│  VERIFIER AGENT                                                  │
│  Input: Patch + TestSpec                                         │
│  Output: VerificationResult { passed, deployUrl }                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  passed: true   │──────▶ SUCCESS
                    │  passed: false  │──────▶ LOOP (increment iteration)
                    └─────────────────┘
```

---

## Agent Interfaces

### Triage Agent
```typescript
interface TriageAgent {
  diagnose(failure: FailureReport): Promise<DiagnosisReport>;
}

interface DiagnosisReport {
  failureId: string;
  failureType: 'UI_BUG' | 'BACKEND_ERROR' | 'TEST_FLAKY' | 'DATA_ERROR' | 'UNKNOWN';
  rootCause: string;
  localization: {
    file: string;
    startLine: number;
    endLine: number;
    codeSnippet: string;
  };
  similarIssues: { id: string; similarity: number; fix: string }[];
  suggestedFix: string;
  confidence: number;
}
```

### Fixer Agent
```typescript
interface FixerAgent {
  generatePatch(diagnosis: DiagnosisReport): Promise<Patch>;
}

interface Patch {
  id: string;
  file: string;
  diff: string;
  description: string;
  changes: { line: number; old: string; new: string }[];
}
```

### Verifier Agent
```typescript
interface VerifierAgent {
  verify(patch: Patch, testSpec: TestSpec): Promise<VerificationResult>;
}

interface VerificationResult {
  passed: boolean;
  deployUrl: string;
  duration: number;
  error?: string;
}
```

### Orchestrator
```typescript
interface QAgentOrchestrator {
  run(config: {
    testSpec: TestSpec;
    appUrl: string;
    maxIterations?: number;
  }): Promise<OrchestratorResult>;
}

interface OrchestratorResult {
  success: boolean;
  iterations: number;
  finalTestResult: TestResult;
  patches: Patch[];
  totalDuration: number;
}
```

---

## Validation Checklist

### Triage Agent
- [ ] Classifies UI_BUG correctly for Bug 1
- [ ] Classifies BACKEND_ERROR correctly for Bug 2
- [ ] Classifies DATA_ERROR correctly for Bug 3
- [ ] Localizes to correct file and line
- [ ] Provides actionable root cause
- [ ] Confidence score is reasonable

### Fixer Agent
- [ ] Generates syntactically valid patches
- [ ] Patches are minimal (no extra changes)
- [ ] Diff format is correct
- [ ] Description is accurate

### Verifier Agent
- [ ] Applies patches correctly
- [ ] Syntax check catches bad patches
- [ ] Git commit succeeds
- [ ] Vercel deployment completes
- [ ] Re-test runs on deployed version

### Orchestrator
- [ ] Agents execute in correct order
- [ ] Data passes between agents correctly
- [ ] Iteration limit is respected
- [ ] Final result includes all metadata

### End-to-End
- [ ] Bug 1 is fixed in ≤3 iterations
- [ ] Deployed app works correctly
- [ ] No regressions introduced

---

## Common Issues

### Triage Misclassification
```
Expected: UI_BUG
Got: UNKNOWN
```
- Improve error message parsing
- Add more classification heuristics
- Check stack trace format

### Fixer Invalid Patch
```
Error: Patch syntax error
```
- Validate LLM response JSON
- Check line numbers are correct
- Verify old_string matches exactly

### Verifier Deploy Timeout
```
Error: Deployment timeout after 120s
```
- Check Vercel project configuration
- Verify git push succeeded
- Check for build errors in Vercel

### Orchestrator Infinite Loop
```
Warning: Max iterations reached
```
- Check if same error repeats
- Verify patch is actually applied
- Check deployment URL is correct

---

## Exit Criteria

Phase 2 is complete when:

1. All four agents are implemented
2. Orchestrator coordinates the full loop
3. At least one bug is fixed end-to-end
4. Vercel deployment works correctly
5. Re-test confirms fix works
6. All code is committed

---

## Next Phase

Upon completion, proceed to **Phase 3: Knowledge Base** where we add Redis vector storage to enable learning from past bugs.

---

## References

- [.claude/skills/qagent-agents/SKILL.md](../.claude/skills/qagent-agents/SKILL.md)
- [.claude/skills/qagent-agents/reference.md](../.claude/skills/qagent-agents/reference.md)
- [.claude/skills/vercel-deployment/SKILL.md](../.claude/skills/vercel-deployment/SKILL.md)
- [.claude/skills/vercel-deployment/reference.md](../.claude/skills/vercel-deployment/reference.md)
- [docs/DESIGN.md](../docs/DESIGN.md) - Agent specifications
