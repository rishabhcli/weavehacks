# TASKS.md - PatchPilot

This file tracks all project tasks organized by phase. Update this file as work progresses.

---

## Active Tasks

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| P1-004 | Implement Tester Agent | In Progress | - | Testing with demo app |

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
  - Execute tests via Stagehand
  - Capture screenshots on failure
  - Log errors and DOM state
  - Return structured failure reports
  - Created agents/tester/index.ts

### Phase 2: Core PatchPilot Loop

- [ ] **P2-001**: Implement Triage Agent
  - Parse error messages and stack traces
  - Capture minimal reproduction steps
  - Identify failure type (UI bug, backend error, etc.)
  - Generate diagnosis report
  - Dependencies: P1-004

- [ ] **P2-002**: Implement Fixer Agent
  - Accept diagnosis from Triage Agent
  - Use LLM to generate code patch
  - Localize bug in codebase
  - Output git diff or modified file
  - Dependencies: P2-001

- [ ] **P2-003**: Implement Verifier Agent
  - Apply patch to codebase
  - Trigger Vercel deployment
  - Wait for deployment to complete
  - Re-run failing test
  - Report pass/fail status
  - Dependencies: P2-002

- [ ] **P2-004**: Create basic orchestration script
  - Sequence: Tester → Triage → Fixer → Verifier
  - Handle iteration loop
  - Set max iterations limit
  - Log each step
  - Dependencies: P2-003

- [ ] **P2-005**: End-to-end loop validation
  - Run full loop on known bug
  - Verify bug gets fixed
  - Document iteration count
  - Dependencies: P2-004

### Phase 3: Knowledge Base (Redis)

- [ ] **P3-001**: Set up Redis with vector search
  - Deploy Redis Stack or use Redis Cloud
  - Configure vector index for embeddings
  - Test basic CRUD operations
  - Dependencies: P0-003

- [ ] **P3-002**: Implement failure trace embedding
  - Generate embeddings for error messages
  - Store with metadata (file, line, fix applied)
  - Create embedding pipeline
  - Dependencies: P3-001

- [ ] **P3-003**: Create semantic lookup for similar issues
  - Query by embedding similarity
  - Return top-k matching failures
  - Include fix descriptions in results
  - Dependencies: P3-002

- [ ] **P3-004**: Integrate Redis with Triage Agent
  - Query Redis on each failure
  - Include similar past fixes in diagnosis
  - Guide Fixer Agent with patterns
  - Dependencies: P3-003, P2-001

- [ ] **P3-005**: Integrate Redis with Fixer Agent
  - Retrieve successful fix patterns
  - Use as context for LLM patch generation
  - Store new successful fixes
  - Dependencies: P3-004, P2-002

### Phase 4: Logging & Dashboard (Weave + Marimo)

- [ ] **P4-001**: Integrate W&B Weave for tracing
  - Install weave SDK
  - Configure project and API key
  - Wrap agent functions with tracing
  - Dependencies: P2-004

- [ ] **P4-002**: Log all agent steps and metrics
  - Test start/end times
  - Error messages and diagnoses
  - Patch content
  - Pass/fail results
  - Iteration counts
  - Dependencies: P4-001

- [ ] **P4-003**: Create Marimo dashboard
  - Install marimo
  - Connect to Weave logs
  - Create basic layout
  - Dependencies: P4-002

- [ ] **P4-004**: Visualize key metrics
  - Pass rate over time chart
  - Time-to-fix histogram
  - Bug types distribution
  - Iterations per bug
  - Dependencies: P4-003

- [ ] **P4-005**: Create live leaderboard
  - Tests passed vs total
  - Current iteration status
  - Recent fixes applied
  - Dependencies: P4-004

### Phase 5: TraceTriage & Self-Improvement

- [ ] **P5-001**: Implement trace analysis for agent failures
  - Identify when agent fails to fix
  - Extract failure point from trace
  - Categorize failure reason
  - Dependencies: P4-002

- [ ] **P5-002**: Auto-label failure causes
  - Tool error (browser crash, API timeout)
  - Retrieval error (wrong past fix)
  - Prompt drift (LLM misunderstood)
  - Parsing error (invalid patch format)
  - Dependencies: P5-001

- [ ] **P5-003**: Implement corrective actions
  - Adjust prompts based on failures
  - Refine retrieval parameters
  - Add retry logic for tool errors
  - Dependencies: P5-002

- [ ] **P5-004**: A/B test workflow improvements
  - Run modified agent on past scenarios
  - Compare success rates
  - Measure iteration reduction
  - Dependencies: P5-003

### Phase 6: RedTeam Integration

- [ ] **P6-001**: Create adversarial test suite
  - Unusual user inputs (long strings, special chars)
  - SQL injection attempts
  - XSS payloads
  - Edge case behaviors
  - Dependencies: P1-003

- [ ] **P6-002**: Add fuzzing for edge cases
  - Generate input variations
  - Mutate failing scenarios
  - Expand test coverage automatically
  - Dependencies: P6-001

- [ ] **P6-003**: Implement safety/jailbreak checks
  - Test agent with adversarial prompts
  - Verify agent refuses harmful actions
  - Add guardrails if needed
  - Dependencies: P6-002

- [ ] **P6-004**: Continuous regression for security
  - Run RedTeam tests periodically
  - Feed failures into PatchPilot loop
  - Track security improvement metrics
  - Dependencies: P6-003

### Phase 7: Demo Preparation

- [ ] **P7-001**: End-to-end run validation
  - Run complete system on demo app
  - Fix all known bugs automatically
  - Document full trace
  - Dependencies: All previous phases

- [ ] **P7-002**: Record demo scenarios
  - Screen record successful fix
  - Capture Weave traces
  - Screenshot dashboard metrics
  - Dependencies: P7-001

- [ ] **P7-003**: Prepare 3-minute presentation
  - Write script following demo outline
  - Create slides if needed
  - Practice timing
  - Dependencies: P7-002

- [ ] **P7-004**: Document sponsor integrations
  - Browserbase/Stagehand usage examples
  - Redis knowledge base showcase
  - Vercel deployment integration
  - W&B Weave tracing demos
  - Google ADK orchestration
  - Marimo dashboard screenshots
  - Dependencies: P7-003

---

## Completed Tasks

| ID | Task | Completed | Notes |
|----|------|-----------|-------|
| - | Project scaffold created | 2024 | Initial structure |

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

*Last updated: 2024*
