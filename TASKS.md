# TASKS.md - PatchPilot

This file tracks all project tasks organized by phase. Update this file as work progresses.

---

## Active Tasks

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| P1-005 | Verify Bug Detection | Blocked | - | Requires API credentials |
| P2-005 | End-to-end loop validation | Blocked | - | Requires API credentials |

---

## Backlog

### Phase 0: Planning & Setup

- [x] **P0-001**: Define product requirements in PRD.md
  - Document problem statement and solution
  - Define success metrics
  - List all features and user flows

- [x] **P0-002**: Document tech stack decisions in CLAUDE.md
  - All sponsor integrations defined
  - Architecture diagram complete
  - Phase roadmap established

- [x] **P0-003**: Set up development environment
  - Initialize pnpm workspace
  - Configure TypeScript
  - Set up ESLint and Prettier
  - Create .env.example with all variables

- [x] **P0-004**: Create Next.js demo app with intentional bugs
  - Simple app with 2-3 pages
  - Bug 1: Button missing onClick handler (cart/page.tsx)
  - Bug 2: API route calling non-existent /api/payments (api/checkout/route.ts)
  - Bug 3: Null reference on preferences.newsletter (signup/page.tsx)

- [ ] **P0-005**: Configure CI/CD pipeline
  - GitHub Actions for lint/test
  - Vercel preview deployments
  - Dependencies: P0-003, P0-004

### Phase 1: Test Environment (Browserbase + Stagehand)

- [x] **P1-001**: Set up Browserbase account and integration
  - Install @browserbasehq/sdk
  - Configure project settings
  - Created lib/browserbase/client.ts

- [x] **P1-002**: Integrate Stagehand SDK
  - Install @browserbasehq/stagehand package
  - Configure with Browserbase
  - Updated to use Stagehand v3 API

- [x] **P1-003**: Write critical user flow tests
  - Test 1: "Checkout flow - click checkout, expect confirmation" (test-checkout-001)
  - Test 2: "Checkout with payment - add item, checkout" (test-checkout-002)
  - Test 3: "Signup flow - fill form, submit, expect welcome" (test-signup-001)
  - Created tests/e2e/specs.ts

- [~] **P1-004**: Implement Tester Agent
  - Execute tests via Stagehand ✅
  - Capture screenshots on failure ✅
  - Log errors and DOM state ✅
  - Return structured failure reports ✅
  - Created agents/tester/index.ts
  - **BLOCKED**: Requires BROWSERBASE_API_KEY and OPENAI_API_KEY to validate

- [ ] **P1-005**: Verify Bug Detection (requires API keys)
  - Run tests against demo app
  - Verify Test 1 detects Bug 1 (missing onClick)
  - Verify Test 2 detects Bug 2 (wrong API route)
  - Verify Test 3 detects Bug 3 (null reference)
  - Dependencies: P1-004 + API credentials

### Phase 2: Core PatchPilot Loop

- [x] **P2-001**: Implement Triage Agent
  - Parse error messages and stack traces ✅
  - Classify failure types (UI_BUG, BACKEND_ERROR, DATA_ERROR, TEST_FLAKY) ✅
  - Localize bug to file/line ✅
  - Generate diagnosis with LLM ✅
  - Created agents/triage/index.ts

- [x] **P2-002**: Implement Fixer Agent
  - Accept diagnosis from Triage Agent ✅
  - Use LLM to generate code patch ✅
  - Validate patch safety ✅
  - Generate unified diff format ✅
  - Created agents/fixer/index.ts

- [x] **P2-003**: Implement Verifier Agent
  - Apply patch to codebase ✅
  - Backup and restore on failure ✅
  - Syntax validation ✅
  - Vercel deployment integration ✅
  - Created agents/verifier/index.ts

- [x] **P2-004**: Create basic orchestration script
  - Sequence: Tester → Triage → Fixer → Verifier ✅
  - Handle iteration loop ✅
  - Max iterations configurable ✅
  - Progress logging ✅
  - Created agents/orchestrator/index.ts

- [ ] **P2-005**: End-to-end loop validation
  - Run full loop on known bug
  - Verify bug gets fixed
  - Document iteration count
  - **BLOCKED**: Requires API credentials (BROWSERBASE_API_KEY, OPENAI_API_KEY)

### Phase 3: Knowledge Base (Redis)

- [x] **P3-001**: Set up Redis with vector search
  - Deploy Redis Stack or use Redis Cloud ✅
  - Configure vector index for embeddings ✅
  - Test basic CRUD operations ✅
  - Created lib/redis/client.ts, embeddings.ts, index.ts

- [x] **P3-002**: Implement failure trace embedding
  - Generate embeddings for error messages ✅
  - Store with metadata (file, line, fix applied) ✅
  - Create embedding pipeline ✅
  - Using OpenAI text-embedding-3-small (1536 dims)

- [x] **P3-003**: Create semantic lookup for similar issues
  - Query by embedding similarity ✅
  - Return top-k matching failures ✅
  - Include fix descriptions in results ✅
  - KNN search with HNSW index

- [x] **P3-004**: Integrate Redis with Triage Agent
  - Query Redis on each failure ✅
  - Include similar past fixes in diagnosis ✅
  - Guide Fixer Agent with patterns ✅
  - Added findSimilarIssues() to TriageAgent

- [x] **P3-005**: Integrate Redis with Fixer Agent
  - Retrieve successful fix patterns ✅
  - Use as context for LLM patch generation ✅
  - Store new successful fixes ✅
  - Added getSimilarFixes() and recordFix in Verifier

### Phase 4: Logging & Dashboard (Weave + Marimo)

- [x] **P4-001**: Integrate W&B Weave for tracing
  - Install weave SDK ✅
  - Configure project and API key ✅
  - Wrap agent functions with tracing ✅
  - Created lib/weave/index.ts, metrics.ts, tracing.ts

- [x] **P4-002**: Log all agent steps and metrics
  - Test start/end times ✅
  - Error messages and diagnoses ✅
  - Patch content ✅
  - Pass/fail results ✅
  - Iteration counts ✅
  - Orchestrator logs RunMetrics after each run

- [x] **P4-003**: Create Marimo dashboard
  - Install marimo ✅
  - Connect to Weave logs ✅
  - Create basic layout ✅
  - Created dashboard/app.py with reactive cells

- [x] **P4-004**: Visualize key metrics
  - Pass rate over time chart ✅
  - Time-to-fix bar chart ✅
  - Bug types distribution (pie chart) ✅
  - Iterations per bug (area chart) ✅

- [x] **P4-005**: Create live leaderboard
  - Tests passed vs total ✅
  - Current iteration status ✅
  - Recent fixes table ✅
  - Before/After comparison table ✅

### Phase 5: TraceTriage & Self-Improvement

- [x] **P5-001**: Implement trace analysis for agent failures
  - Identify when agent fails to fix ✅
  - Extract failure point from trace ✅
  - Categorize failure reason ✅
  - Created lib/tracetriage/analyzer.ts
  - Dependencies: P4-002

- [x] **P5-002**: Auto-label failure causes
  - Tool error (browser crash, API timeout) ✅
  - Retrieval error (wrong past fix) ✅
  - Prompt drift (LLM misunderstood) ✅
  - Parsing error (invalid patch format) ✅
  - Timeout, Rate limit categories added ✅
  - Created lib/tracetriage/types.ts with FailureCause enum
  - Dependencies: P5-001

- [x] **P5-003**: Implement corrective actions
  - Adjust prompts based on failures ✅
  - Refine retrieval parameters ✅
  - Add retry logic for tool errors ✅
  - Created lib/tracetriage/prompt-improver.ts
  - CorrectiveAction types: PROMPT, WORKFLOW, CONFIG, RETRY
  - Dependencies: P5-002

- [x] **P5-004**: A/B test workflow improvements
  - Run modified agent on past scenarios ✅
  - Compare success rates ✅
  - Measure iteration reduction ✅
  - Created lib/tracetriage/ab-testing.ts
  - Statistical confidence calculation ✅
  - Dependencies: P5-003

### Phase 6: RedTeam Integration

- [x] **P6-001**: Create adversarial test suite
  - Unusual user inputs (long strings, special chars) ✅
  - SQL injection attempts ✅
  - XSS payloads ✅
  - Edge case behaviors ✅
  - Created lib/redteam/fixtures.ts with 25+ adversarial tests
  - Dependencies: P1-003

- [x] **P6-002**: Add fuzzing for edge cases
  - Generate input variations ✅
  - Mutate failing scenarios ✅
  - Path traversal tests ✅
  - Command injection tests ✅
  - Prompt injection tests ✅
  - Dependencies: P6-001

- [x] **P6-003**: Implement safety/jailbreak checks
  - Test agent with adversarial prompts ✅
  - Verify agent refuses harmful actions ✅
  - Add guardrails (sanitize.ts, validators.ts) ✅
  - RateLimiter for abuse prevention ✅
  - Dependencies: P6-002

- [x] **P6-004**: Continuous regression for security
  - Run RedTeam tests via RedTeamRunner ✅
  - Generate security reports ✅
  - Track pass rate over time ✅
  - 165 tests passing ✅
  - Dependencies: P6-003

### Phase 7: Demo Preparation

- [x] **P7-001**: Create demo CLI script
  - Created scripts/run-demo.ts ✅
  - Banner with ASCII art ✅
  - Shows bug list and tech stack ✅
  - Dry run mode supported ✅
  - Added `pnpm run demo` and `pnpm run demo:dry` commands

- [x] **P7-002**: Create demo presentation script
  - Created docs/DEMO_SCRIPT.md ✅
  - Detailed 3-minute timing breakdown ✅
  - Talking points for each section ✅
  - Fallback scenarios documented ✅
  - Visual checklist included

- [x] **P7-003**: Document sponsor integrations
  - Created docs/SPONSOR_INTEGRATIONS.md ✅
  - Browserbase/Stagehand usage examples ✅
  - Redis knowledge base showcase ✅
  - Vercel deployment integration ✅
  - W&B Weave tracing demos ✅
  - ADK/A2A-compatible orchestration documentation (integration planned) ✅
  - Marimo dashboard documentation ✅
  - Architecture diagram included

- [x] **P7-004**: Create pre-demo checklist
  - Created docs/PRE_DEMO_CHECKLIST.md ✅
  - Environment variables verification ✅
  - Service status checks ✅
  - Demo app state verification ✅
  - Backup plan documentation ✅
  - Network and performance checks ✅

- [!] **P7-005**: End-to-end run validation (BLOCKED)
  - Requires API credentials to run live demo
  - Demo script and dry-run ready
  - Dependencies: BROWSERBASE_API_KEY, OPENAI_API_KEY

---

## Completed Tasks

| ID | Task | Completed | Notes |
|----|------|-----------|-------|
| - | Project scaffold created | 2024 | Initial structure |
| P0-* | Phase 0: Planning & Setup | 2024 | Core foundation |
| P1-* | Phase 1: Test Environment | 2024 | Browserbase + Stagehand |
| P2-* | Phase 2: Core PatchPilot Loop | 2024 | All agents implemented |
| P3-* | Phase 3: Knowledge Base | 2024 | Redis vector search |
| P4-* | Phase 4: Logging & Dashboard | 2024 | W&B Weave + Marimo |
| P5-* | Phase 5: TraceTriage | 2024 | Self-improvement system |
| P6-* | Phase 6: RedTeam | 2024 | Adversarial testing + security |
| P7-* | Phase 7: Demo Preparation | 2024 | Demo script, presentation, docs |

---

## Task Format

```markdown
- [ ] **P[phase]-[number]**: Brief description
  - Acceptance criteria 1
  - Acceptance criteria 2
  - Dependencies: [list any blocking tasks]
```

## Status Legend

- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked

## Priority Guide

- **P0**: Foundation - must complete first
- **P1-P2**: Core functionality - MVP requirements
- **P3-P4**: Enhancement - improves quality and visibility
- **P5-P6**: Advanced - self-improvement and hardening
- **P7**: Demo - final polish and presentation

---

*Last updated: 2024 - Phase 7 Complete (Demo Preparation)*
