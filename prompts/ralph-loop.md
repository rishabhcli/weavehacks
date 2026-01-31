# Ralph Loop Prompts - PatchPilot

This file contains prompt templates for the Ralph Loop iterative development cycle specific to PatchPilot.

---

## Standard Ralph Loop

```
## Ralph Loop - Phase [X] - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for project context
- [ ] Check TASKS.md for current work
- [ ] Review relevant docs (PRD, DESIGN, ARCHITECTURE)
- [ ] Load applicable skills from .claude/skills/

### 2. ANALYZE
- Current phase: [Phase X]
- Active task: [Task ID and description]
- Dependencies: [Any blocking items]
- Context needed: [Skills or docs to reference]

### 3. PLAN
Increments for this iteration:
1. [Small, testable increment 1]
2. [Small, testable increment 2]
3. [Small, testable increment 3]

### 4. EXECUTE
[Implement one increment at a time]

### 5. VALIDATE
- [ ] Code compiles/runs without errors
- [ ] Tests pass
- [ ] Lint passes
- [ ] Acceptance criteria met
- [ ] No regressions introduced

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit working code
- [ ] Return to step 1 or end iteration
```

---

## Phase-Specific Prompts

### Phase 0: Planning & Setup

```
## Phase 0 Ralph Loop - Planning & Setup

Focus: Project foundation and documentation

### Skills to Load
- None (documentation phase)

### Tasks
- [ ] Complete PRD with all features documented
- [ ] Document architecture decisions
- [ ] Set up development environment
- [ ] Create Next.js demo app with intentional bugs
- [ ] Configure environment variables

### Validation
- [ ] All docs have content (no [TODO] in critical sections)
- [ ] pnpm install works
- [ ] pnpm dev starts the app
- [ ] Demo app has 3 intentional bugs
- [ ] .env.example has all required variables
```

### Phase 1: Test Environment (Browserbase + Stagehand)

```
## Phase 1 Ralph Loop - Test Environment

Focus: Browser automation and test execution

### Skills to Load
- browserbase-stagehand/

### Tasks
- [ ] Set up Browserbase SDK integration
- [ ] Configure Stagehand with API keys
- [ ] Write test spec for signup flow
- [ ] Write test spec for login flow
- [ ] Write test spec for checkout flow
- [ ] Implement Tester Agent class
- [ ] Verify tests detect planted bugs

### Validation
- [ ] Browserbase session creates successfully
- [ ] Stagehand executes natural language actions
- [ ] Tests fail on buggy app (expected)
- [ ] Screenshots captured on failure
- [ ] Failure reports are structured and complete
```

### Phase 2: Core PatchPilot Loop

```
## Phase 2 Ralph Loop - Core Loop

Focus: Triage, Fixer, Verifier agents and orchestration

### Skills to Load
- patchpilot-agents/
- vercel-deployment/

### Tasks
- [ ] Implement Triage Agent (failure analysis)
- [ ] Implement Fixer Agent (LLM patch generation)
- [ ] Implement Verifier Agent (deploy + retest)
- [ ] Create orchestration script
- [ ] Wire agents together in sequence
- [ ] Test end-to-end on one bug

### Validation
- [ ] Triage correctly identifies bug type
- [ ] Fixer generates valid patch
- [ ] Verifier applies patch and deploys
- [ ] Vercel deployment succeeds
- [ ] Test passes after fix
- [ ] Full loop completes without errors
```

### Phase 3: Knowledge Base (Redis)

```
## Phase 3 Ralph Loop - Knowledge Base

Focus: Redis vector store for learning from past bugs

### Skills to Load
- redis-vectorstore/

### Tasks
- [ ] Set up Redis with vector search
- [ ] Create embedding pipeline for errors
- [ ] Implement failure trace storage
- [ ] Implement similarity search
- [ ] Integrate Redis with Triage Agent
- [ ] Integrate Redis with Fixer Agent
- [ ] Verify learning improves fix speed

### Validation
- [ ] Redis connection works
- [ ] Embeddings generated correctly
- [ ] Similar failures retrieved
- [ ] Second similar bug fixed faster
- [ ] Fix patterns stored after success
```

### Phase 4: Logging & Dashboard (Weave + Marimo)

```
## Phase 4 Ralph Loop - Observability

Focus: Tracing and visualization

### Skills to Load
- wandb-weave/
- marimo-dashboards/

### Tasks
- [ ] Integrate Weave SDK
- [ ] Wrap all agent methods with @weave.op()
- [ ] Log metrics after each run
- [ ] Create Marimo dashboard
- [ ] Add pass rate chart
- [ ] Add time-to-fix metrics
- [ ] Add recent fixes table

### Validation
- [ ] Traces appear in Weave UI
- [ ] Metrics logged correctly
- [ ] Marimo dashboard loads
- [ ] Charts update with data
- [ ] Dashboard shows improvement
```

### Phase 5: TraceTriage & Self-Improvement

```
## Phase 5 Ralph Loop - Self-Improvement

Focus: Agent learns from its own failures

### Skills to Load
- wandb-weave/
- patchpilot-agents/

### Tasks
- [ ] Implement trace analysis
- [ ] Auto-label failure causes
- [ ] Create corrective action rules
- [ ] Test prompt improvements
- [ ] A/B test workflow changes
- [ ] Measure iteration reduction

### Validation
- [ ] Agent failures categorized
- [ ] Corrective actions applied
- [ ] Prompts improved based on data
- [ ] Fewer iterations needed over time
```

### Phase 6: RedTeam Integration

```
## Phase 6 Ralph Loop - Adversarial Testing

Focus: Security and edge case handling

### Skills to Load
- patchpilot-agents/

### Tasks
- [ ] Create adversarial input suite
- [ ] Add fuzzing for edge cases
- [ ] Test agent with jailbreak prompts
- [ ] Add guardrails if needed
- [ ] Run RedTeam tests in CI

### Validation
- [ ] Edge cases handled gracefully
- [ ] Agent resists jailbreak attempts
- [ ] Security issues caught and fixed
- [ ] RedTeam pass rate tracked
```

### Phase 7: Demo Preparation

```
## Phase 7 Ralph Loop - Demo

Focus: Polish and presentation

### Skills to Load
- All skills for reference

### Tasks
- [ ] Full end-to-end validation
- [ ] Record demo video
- [ ] Prepare presentation script
- [ ] Document sponsor integrations
- [ ] Create backup demo if live fails

### Validation
- [ ] Demo runs smoothly
- [ ] All bugs fixed automatically
- [ ] Dashboard shows improvement
- [ ] Timing fits 3 minutes
- [ ] Backup demo ready
```

---

## Quick Reference Prompts

### Start of Session

```
Starting session for PatchPilot.

1. Read CLAUDE.md for full context
2. Check TASKS.md for current phase and tasks
3. Load relevant skills for current phase
4. Begin Ralph Loop for active task
```

### Before Commit

```
Pre-commit checklist for PatchPilot:
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes
- [ ] pnpm test passes
- [ ] No console.log or debug code
- [ ] No hardcoded API keys
- [ ] Weave logging in place for new functions
- [ ] Commit message is descriptive
```

### End of Session

```
Session wrap-up for PatchPilot:
- [ ] Update TASKS.md with progress
- [ ] Commit all working code
- [ ] Note any blockers in task comments
- [ ] Document next steps
- [ ] Push to trigger Vercel preview
```

---

## Agent-Specific Prompts

### Tester Agent Implementation

```
Implementing Tester Agent:

1. Initialize Browserbase client
2. Create Stagehand instance with browser
3. Load test specification
4. Execute each step:
   - navigate: Go to URL
   - click: Click element
   - type: Enter text
   - assert: Check condition
   - wait: Pause for async
5. On failure:
   - Capture screenshot
   - Get DOM state
   - Collect console logs
   - Build FailureReport
6. Return TestResult
```

### Triage Agent Implementation

```
Implementing Triage Agent:

1. Receive FailureReport from Tester
2. Parse error message and stack trace
3. Classify failure type:
   - UI_BUG: Missing handler, selector issue
   - BACKEND_ERROR: 404, 500, wrong route
   - TEST_FLAKY: Timeout, race condition
   - DATA_ERROR: Null reference, missing field
4. Localize to file:line using stack trace
5. Query Redis for similar failures
6. Generate diagnosis with LLM if needed
7. Return DiagnosisReport with:
   - failureType
   - rootCause
   - file, line
   - similarIssues[]
   - suggestedFix
   - confidence
```

### Fixer Agent Implementation

```
Implementing Fixer Agent:

1. Receive DiagnosisReport from Triage
2. Load source file at localized path
3. Query Redis for similar fix patterns
4. Build LLM prompt with:
   - Diagnosis details
   - Current code around bug
   - Similar past fixes as examples
5. Call OpenAI API for patch
6. Validate patch:
   - Parse JSON response
   - Check syntax validity
   - Ensure reasonable size
7. Format as git diff
8. Return Patch with metadata
```

### Verifier Agent Implementation

```
Implementing Verifier Agent:

1. Receive Patch from Fixer
2. Apply patch to local files
3. Run local syntax/lint check
4. If fails: return to Fixer with error
5. Commit changes with message
6. Push to GitHub (triggers Vercel)
7. Poll Vercel API for deployment status
8. Wait until READY (timeout 2 min)
9. Get deployment URL
10. Re-run original failing test
11. Run regression tests
12. If pass:
    - Store fix in Redis
    - Return success
13. If fail:
    - Return to Triage with new error
    - Increment iteration count
```

---

## Demo Script Prompt

```
## 3-Minute Demo Script

### 0:00-0:20 - Introduction
"This is PatchPilot, a self-healing QA agent. Watch as it
automatically finds a bug, fixes it, and verifies the fix."

[Show buggy app - click checkout button, nothing happens]

### 0:20-1:10 - Bug Detection
"PatchPilot is now running E2E tests using Browserbase and Stagehand."

[Show Tester Agent running in terminal]
[Show failure report with screenshot]

"It found the bug - the checkout button has no click handler."

### 1:10-2:10 - Diagnosis and Fix
"The Triage Agent diagnosed the issue and queried our
Redis knowledge base for similar past fixes."

[Show diagnosis in terminal]

"Now the Fixer Agent is generating a patch using GPT-4..."

[Show patch diff]

"Deploying to Vercel..."

[Show Vercel deployment]

### 2:10-2:40 - Verification
"The fix is deployed. Let's verify..."

[Show test passing]
[Click checkout button - it works!]

"All tests passing. The Marimo dashboard shows our improvement."

[Show dashboard with pass rate going from 67% to 100%]

### 2:40-3:00 - Conclusion
"PatchPilot used:
- Browserbase + Stagehand for testing
- Redis for learning from past bugs
- Vercel for instant deployment
- W&B Weave for tracing
- Google ADK for orchestration
- Marimo for visualization

A self-improving agent that gets smarter with every bug it fixes."
```

---

## Iteration Log Template

```markdown
## Iteration Log - [Date]

### Run 1
- **Start Time:** [HH:MM]
- **Test:** [Test name]
- **Result:** [Pass/Fail]
- **Bug Found:** [Description]
- **Iterations to Fix:** [N]
- **Time to Fix:** [MM:SS]
- **Redis Hit:** [Yes/No]
- **Notes:** [Observations]

### Run 2
...
```

---

*Last updated: 2024*
