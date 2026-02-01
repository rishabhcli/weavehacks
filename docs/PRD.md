# Product Requirements Document (PRD)

## Project: PatchPilot - Self-Healing QA Agent

**Version:** 1.0
**Status:** Approved
**Last Updated:** 2024

---

## 1. Overview

### 1.1 Problem Statement

Every team ships buggy applications, and manually writing tests and patches is time-consuming. Current challenges include:

- **Manual Testing Burden**: QA engineers spend countless hours writing and maintaining tests
- **Slow Bug Resolution**: Time from bug discovery to fix deployment can take days or weeks
- **Regression Risk**: Fixes often introduce new bugs without proper verification
- **Knowledge Loss**: Fix patterns and solutions aren't systematically captured for reuse
- **Inconsistent Quality**: Test coverage varies and edge cases are frequently missed

### 1.2 Solution

PatchPilot is a **self-healing QA agent** that automatically:

1. **Tests** web applications using real browser interactions
2. **Identifies** bugs through failure detection and analysis
3. **Fixes** code by generating and applying patches
4. **Verifies** fixes work without introducing regressions
5. **Learns** from each bug to improve future diagnosis and fixing

The system operates in a closed-loop: deploy app → test → find bugs → fix → redeploy → verify → repeat until all tests pass.

### 1.3 Target Users

| User Type | Description | Pain Point Addressed |
|-----------|-------------|---------------------|
| **Solo Developers** | Individual developers building web apps | No time for comprehensive testing |
| **Small Teams** | 2-10 person engineering teams | Can't afford dedicated QA |
| **Hackathon Participants** | Time-constrained builders | Need rapid bug detection and fixing |
| **Open Source Maintainers** | Project maintainers | Overwhelmed by bug reports |

---

## 2. Goals & Success Metrics

### 2.1 Goals

1. **Automatic Bug Detection**: Find bugs in web applications without manual test writing
2. **Automatic Bug Fixing**: Generate and apply code patches that resolve identified issues
3. **Self-Improvement**: Learn from past bugs to diagnose and fix faster over time
4. **Measurable Quality**: Provide clear metrics showing application quality improvement
5. **Demo-Friendly**: Create a compelling 3-minute demonstration for hackathon judges

### 2.2 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Test Pass Rate | 100% after fixes | Automated test suite results |
| Time-to-Fix | < 5 minutes per bug | Weave trace timestamps |
| Fix Success Rate | > 80% first attempt | Iterations needed per bug |
| Knowledge Reuse | > 50% fixes use past patterns | Redis retrieval hits |
| Self-Improvement | 30% faster fixes over time | Compare early vs late runs |

---

## 3. Features & Requirements

### 3.1 Core Features (MVP)

#### Feature 1: Tester Agent (Browser Automation)

**Description:** Executes end-to-end tests on the web application using real browser interactions via Browserbase and Stagehand.

**User Story:** As a developer, I want tests to run automatically on my deployed app so that I can find bugs without writing test code.

**Acceptance Criteria:**
- [ ] Tests execute in isolated Browserbase browser environment
- [ ] Stagehand interprets natural language test descriptions
- [ ] Screenshots and DOM state captured on failure
- [ ] Console errors and network failures logged
- [ ] Structured failure report generated

**Technical Requirements:**
- Browserbase SDK integration
- Stagehand natural language to browser action conversion
- Screenshot capture on assertion failure
- Error log aggregation

---

#### Feature 2: Triage Agent (Failure Analysis)

**Description:** Diagnoses test failures by analyzing error messages, stack traces, DOM state, and querying the knowledge base for similar past issues.

**User Story:** As a developer, I want failures automatically diagnosed so that I understand what went wrong and why.

**Acceptance Criteria:**
- [ ] Parses JavaScript errors and stack traces
- [ ] Identifies failure type (UI bug, backend error, test flakiness)
- [ ] Captures minimal reproduction steps
- [ ] Queries Redis for similar past failures
- [ ] Generates structured diagnosis report with fix suggestions

**Technical Requirements:**
- Error message parsing and classification
- DOM diff analysis between expected/actual
- Redis vector similarity search
- LLM-powered root cause analysis

---

#### Feature 3: Fixer Agent (Patch Generation)

**Description:** Generates code patches to fix identified bugs using LLM with context from the diagnosis and similar past fixes.

**User Story:** As a developer, I want bugs to be automatically fixed so that I don't have to write patches manually.

**Acceptance Criteria:**
- [ ] Localizes bug to specific file and line
- [ ] Retrieves similar past fixes from Redis
- [ ] Uses LLM to generate code patch
- [ ] Outputs valid git diff or modified file
- [ ] Handles common bug types (missing handlers, wrong routes, typos)

**Technical Requirements:**
- Code localization from stack trace
- Redis retrieval of fix patterns
- OpenAI/Anthropic API integration
- Git diff generation
- Syntax validation before applying

---

#### Feature 4: Verifier Agent (Deploy & Retest)

**Description:** Applies patches to the codebase, triggers deployment via Vercel, and re-runs tests to verify the fix works.

**User Story:** As a developer, I want fixes verified automatically so that I know they work without breaking other features.

**Acceptance Criteria:**
- [ ] Applies patch to codebase programmatically
- [ ] Triggers Vercel deployment
- [ ] Waits for deployment to complete
- [ ] Re-runs the originally failing test
- [ ] Runs regression tests on related features
- [ ] Reports pass/fail with details

**Technical Requirements:**
- Git operations (commit, push)
- Vercel API integration
- Deployment status polling
- Test re-execution
- Regression test selection

---

#### Feature 5: Orchestrator (Workflow Coordination)

**Description:** Coordinates the multi-agent workflow: Tester → Triage → Fixer → Verifier, with iteration until success.

**User Story:** As a developer, I want the entire bug-fix cycle automated so that I can deploy my app and let the agent handle quality.

**Acceptance Criteria:**
- [ ] Sequences agent execution correctly
- [ ] Passes context between agents
- [ ] Handles iteration (retry if fix fails)
- [ ] Respects max iteration limit
- [ ] Logs all steps to Weave

**Technical Requirements:**
- ADK/A2A-compatible orchestration (full ADK/A2A integration planned)
- Agent-to-agent message passing
- State management across iterations
- Weave trace integration

**Implementation Note:** The current codebase uses a custom orchestrator; ADK/A2A integration is deferred.

---

#### Feature 6: Knowledge Base (Redis Vector Store)

**Description:** Stores failure traces and successful fixes with embeddings for semantic similarity search.

**User Story:** As a developer, I want the agent to learn from past bugs so that it fixes similar issues faster.

**Acceptance Criteria:**
- [ ] Stores error messages with embeddings
- [ ] Associates fixes with failure patterns
- [ ] Retrieves top-k similar issues on new failure
- [ ] Updates knowledge base after successful fix
- [ ] Handles versioning of fix patterns

**Technical Requirements:**
- Redis Stack with vector search
- OpenAI embeddings for text
- HNSW index for similarity search
- Metadata storage (file, line, fix diff)

---

#### Feature 7: Observability Dashboard (Weave + Marimo)

**Description:** Provides real-time visibility into agent runs, metrics, and improvement trends.

**User Story:** As a developer, I want to see how the agent is performing so that I can trust it's working and improving.

**Acceptance Criteria:**
- [ ] All agent steps logged to Weave
- [ ] Marimo dashboard shows live metrics
- [ ] Pass rate chart over time
- [ ] Time-to-fix histogram
- [ ] Bug type distribution
- [ ] Leaderboard of recent runs

**Technical Requirements:**
- W&B Weave SDK integration
- Marimo reactive notebook
- Chart components for visualization
- Real-time data refresh

---

### 3.2 Future Features (Post-MVP)

- [ ] **TraceTriage**: Auto-diagnose and fix agent failures using trace analysis
- [ ] **RedTeam Suite**: Adversarial testing with fuzzing and security checks
- [ ] **Multi-App Support**: Target multiple applications from single PatchPilot instance
- [ ] **PR Creation**: Automatically create pull requests instead of direct commits
- [ ] **Human-in-the-Loop**: Optional approval step before deploying fixes
- [ ] **Slack/Discord Integration**: Notify team of bugs found and fixed
- [ ] **Custom Test Generation**: AI-generated tests based on app exploration

---

## 4. User Flows

### 4.1 Main Flow: Automatic Bug Fix

```
1. Developer deploys web app to Vercel
2. Developer triggers PatchPilot agent
3. Tester Agent runs E2E tests
4. Test fails on "checkout" button (no onClick handler)
5. Triage Agent:
   - Captures error: "Button click had no effect"
   - Identifies: Missing onClick handler in Checkout.jsx
   - Queries Redis: Finds similar "missing handler" fix from past
   - Diagnosis: "Add onClick callback to trigger payment API"
6. Fixer Agent:
   - Localizes to Checkout.jsx line 42
   - Retrieves past fix pattern from Redis
   - Generates patch adding onClick handler
   - Validates syntax
7. Verifier Agent:
   - Applies patch to codebase
   - Commits and pushes to git
   - Triggers Vercel deployment
   - Waits for deployment (~30 seconds)
   - Re-runs checkout test
   - Test passes!
8. Agent logs success to Weave
9. New failure/fix pattern stored in Redis
10. Dashboard updates: Pass rate 67% → 100%
```

### 4.2 Iteration Flow: Fix Fails, Retry

```
1. First patch attempt fails (introduces new error)
2. Verifier detects new failure
3. Failure fed back to Triage Agent
4. Triage identifies: "Undefined variable introduced"
5. Fixer generates refined patch
6. Verifier applies and retests
7. Test passes on second iteration
8. Both attempts logged to Weave for TraceTriage analysis
```

### 4.3 Knowledge Base Flow: Learning

```
1. New failure type encountered: "API route 404"
2. Redis query returns no similar issues
3. Fixer generates patch from scratch
4. Fix succeeds
5. Failure pattern + fix stored in Redis
6. Next time similar 404 occurs:
   - Redis returns this fix as reference
   - Fixer uses pattern to generate faster
   - Time-to-fix reduced by 40%
```

---

## 5. Non-Functional Requirements

### 5.1 Performance

- [ ] Test execution: < 30 seconds per test
- [ ] Patch generation: < 10 seconds per patch
- [ ] Vercel deployment: < 60 seconds
- [ ] Full loop: < 5 minutes per bug
- [ ] Redis query: < 100ms

### 5.2 Security

- [ ] No secrets in logs or traces
- [ ] API keys stored in environment variables only
- [ ] Patches reviewed for malicious code patterns
- [ ] RedTeam tests for agent jailbreak resistance
- [ ] No arbitrary code execution from LLM output

### 5.3 Reliability

- [ ] Retry logic for transient failures
- [ ] Timeout handling for all external calls
- [ ] Graceful degradation if Redis unavailable
- [ ] Max iteration limit to prevent infinite loops
- [ ] Error recovery in orchestrator

### 5.4 Observability

- [ ] All agent actions logged to Weave
- [ ] Structured logging with trace IDs
- [ ] Metrics exported for dashboard
- [ ] Alert on repeated failures

---

## 6. Constraints & Assumptions

### 6.1 Constraints

- **Time**: Hackathon deadline requires focused MVP
- **Scope**: Target single demo Next.js app, not arbitrary apps
- **Bug Types**: Handle 3 specific bug types reliably
- **LLM Limits**: Token limits and latency of API calls
- **Browser Limits**: Browserbase session limits

### 6.2 Assumptions

- Demo app has known, fixable bugs planted
- Vercel deployments complete within 60 seconds
- LLM can generate valid TypeScript/JavaScript patches
- Redis vector search provides relevant results
- Network connectivity is stable during demo

---

## 7. Timeline & Phases

| Phase | Scope | Duration |
|-------|-------|----------|
| Phase 0 | Planning & Setup | Day 1 |
| Phase 1 | Test Environment (Browserbase + Stagehand) | Day 1-2 |
| Phase 2 | Core PatchPilot Loop | Day 2-3 |
| Phase 3 | Knowledge Base (Redis) | Day 3 |
| Phase 4 | Logging & Dashboard (Weave + Marimo) | Day 3-4 |
| Phase 5 | TraceTriage (if time) | Day 4 |
| Phase 6 | RedTeam (if time) | Day 4 |
| Phase 7 | Demo Preparation | Day 4 |

---

## 8. Open Questions

- [x] Which LLM provider to use? → OpenAI primary, Anthropic backup
- [x] How to handle multi-file patches? → Start with single-file, extend later
- [x] What if Vercel deployment fails? → Retry once, then log and skip
- [ ] How to select regression tests? → Start with all tests, optimize later
- [ ] What constitutes a "similar" past failure? → Embedding similarity > 0.8

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **PatchPilot** | The self-healing QA agent system |
| **Tester Agent** | Component that runs E2E tests |
| **Triage Agent** | Component that diagnoses failures |
| **Fixer Agent** | Component that generates patches |
| **Verifier Agent** | Component that applies and verifies fixes |
| **Ralph Loop** | Iterative development workflow |
| **TraceTriage** | Meta-system for improving the agent itself |
| **RedTeam** | Adversarial testing component |

### B. References

- [PatchPilot Paper](https://arxiv.org/html/2502.02747v1) - Agentic patching framework research
- [Stagehand](https://www.stagehand.dev/) - AI browser automation
- [Browserbase](https://browserbase.com/) - Cloud browser infrastructure
- [Panto AI](https://www.getpanto.ai/) - Self-healing test automation concept
- [W&B Weave](https://wandb.ai/site/weave) - LLM evaluation tools

### C. Sponsor Integration Summary

| Sponsor | Integration | Value |
|---------|-------------|-------|
| **Browserbase** | Cloud browsers for testing | Reliable, isolated test execution |
| **Stagehand** | AI browser automation | Natural language to browser actions |
| **Vercel** | Hosting and deployment | Instant deploy after fixes |
| **Redis** | Vector knowledge base | Learn from past bugs |
| **W&B Weave** | Tracing and evaluation | Prove agent improvement |
| **Google ADK (planned)** | Agent orchestration | Coordinate multi-agent workflow |
| **Marimo** | Interactive dashboard | Visualize metrics and progress |

---

*Last updated: 2024*
