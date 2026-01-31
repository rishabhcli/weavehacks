# CLAUDE.md - PatchPilot

This file is the **single source of truth** for AI agents working on this project. Read this file at the start of every session.

## Project Overview

**Project:** PatchPilot - Self-Healing QA Agent
**Description:** A self-improving QA agent that automatically tests web applications, identifies bugs, applies fixes to the app's code, and verifies the fixes – all without human intervention. It combines automated bug-finding and fixing in a closed-loop system that iterates until all tests pass.
**Status:** Phase 0 - Planning

### Why This Matters

- **Continuous Testing**: Constantly crawls and tests your web app like a QA engineer, simulating real user flows
- **Automatic Bug Fixing**: When it finds a failure, it reports it AND fixes the code, then redeploys
- **Self-Improvement**: Learns common failure patterns and fix strategies over time, reducing future bugs
- **Measurable Impact**: Track test pass rate, time-to-fix, iterations needed to demonstrate improvement

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Browser Automation | **Browserbase + Stagehand** | Run E2E tests in real browsers with AI-powered actions |
| Hosting/Deployment | **Vercel** | Host web app and instant deploy after fixes |
| Vector Memory | **Redis** | Store failure traces, fixes, and enable semantic lookup |
| Observability | **W&B Weave** | Trace agent runs, log metrics, evaluate improvements |
| Orchestration | **Google Cloud ADK/A2A** | Multi-agent workflow coordination |
| Dashboard | **Marimo** | Interactive analytics and live visualization |
| Demo App | **Next.js** | Target application for testing/fixing |
| LLM | **OpenAI/Anthropic** | Patch generation and diagnosis |

---

## System Architecture

### Core Agents

1. **Tester Agent** - Generates and executes E2E tests using Browserbase/Stagehand
2. **Triage Agent** - Diagnoses failures, collects reproduction steps, queries knowledge base
3. **Fixer Agent** - Generates code patches using LLM + past fix patterns from Redis
4. **Verifier Agent** - Applies patches, redeploys via Vercel, re-runs tests
5. **Orchestrator** - Coordinates workflow via Google ADK/A2A

### The PatchPilot Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                     PATCHPILOT LOOP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  TESTER  │───▶│  TRIAGE  │───▶│  FIXER   │───▶│ VERIFIER │ │
│   │  Agent   │    │  Agent   │    │  Agent   │    │  Agent   │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│        │                                               │        │
│        │           ┌──────────────┐                    │        │
│        │           │    Redis     │                    │        │
│        │           │ (Knowledge   │◀───────────────────┘        │
│        │           │    Base)     │                             │
│        │           └──────────────┘                             │
│        │                  │                                     │
│        ▼                  ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                   W&B Weave (Logging)                   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                 Marimo Dashboard                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Roadmap

### Phase 0: Planning & Setup
- [x] Define PRD and architecture
- [ ] Set up project structure
- [ ] Configure development environment
- [ ] Initialize Next.js demo app with intentional bugs

### Phase 1: Test Environment (Browserbase + Stagehand)
- [ ] Set up Browserbase account and API access
- [ ] Integrate Stagehand SDK
- [ ] Write 2-3 critical user flow tests
- [ ] Implement Tester Agent with failure detection

### Phase 2: Core PatchPilot Loop
- [ ] Implement Triage Agent (failure analysis)
- [ ] Implement Fixer Agent (LLM patch generation)
- [ ] Implement Verifier Agent (deploy + retest)
- [ ] Create basic orchestration script

### Phase 3: Knowledge Base (Redis)
- [ ] Set up Redis with vector search
- [ ] Implement failure trace embedding
- [ ] Create semantic lookup for similar issues
- [ ] Store and retrieve fix patterns

### Phase 4: Logging & Dashboard (Weave + Marimo)
- [ ] Integrate W&B Weave for tracing
- [ ] Log all agent steps and metrics
- [ ] Create Marimo dashboard
- [ ] Visualize pass rate, time-to-fix, iterations

### Phase 5: TraceTriage & Self-Improvement
- [ ] Implement trace analysis for agent failures
- [ ] Auto-label failure causes (tool error, prompt drift, etc.)
- [ ] A/B test workflow improvements
- [ ] Refine prompts based on trace data

### Phase 6: RedTeam Integration
- [ ] Create adversarial test suite
- [ ] Add fuzzing for edge cases
- [ ] Implement safety/jailbreak checks
- [ ] Continuous regression for security

### Phase 7: Demo Preparation
- [ ] End-to-end run validation
- [ ] Record demo scenarios
- [ ] Prepare 3-minute presentation
- [ ] Document sponsor integrations

---

## Environment Variables

```bash
# Copy to .env.local and fill in values
cp .env.example .env.local
```

| Variable | Description | Required |
|----------|-------------|----------|
| `BROWSERBASE_API_KEY` | Browserbase API key for browser automation | Yes |
| `BROWSERBASE_PROJECT_ID` | Browserbase project identifier | Yes |
| `OPENAI_API_KEY` | OpenAI API key for LLM patch generation | Yes |
| `REDIS_URL` | Redis connection string with vector support | Yes |
| `VERCEL_TOKEN` | Vercel API token for deployments | Yes |
| `VERCEL_PROJECT_ID` | Vercel project identifier | Yes |
| `WANDB_API_KEY` | Weights & Biases API key for Weave | Yes |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project for ADK | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional, backup LLM) | No |

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (demo app)
pnpm dev

# Run the PatchPilot agent
pnpm run agent

# Run tests manually
pnpm test

# Run E2E tests with Stagehand
pnpm run test:e2e

# Build for production
pnpm build

# Lint and format
pnpm lint && pnpm format

# Start Marimo dashboard
marimo run dashboard/app.py

# Deploy to Vercel
vercel deploy --prod
```

---

## Skills Directory

The `.claude/skills/` directory contains domain-specific knowledge modules:

| Skill | Purpose |
|-------|---------|
| `browserbase-stagehand/` | Browser automation, E2E testing, Stagehand SDK |
| `redis-vectorstore/` | Vector embeddings, semantic search, knowledge base |
| `vercel-deployment/` | Programmatic deployments, git integration |
| `wandb-weave/` | Tracing, evaluation, metrics logging |
| `google-adk/` | Multi-agent orchestration, A2A protocol |
| `marimo-dashboards/` | Reactive notebooks, data visualization |
| `patchpilot-agents/` | Agent implementations, prompts, workflows |

---

## Ralph Loop Workflow

The agent follows the **Ralph Loop** cycle for iterative development:

1. **Read** - Load CLAUDE.md, TASKS.md, relevant skills
2. **Analyze** - Understand current phase requirements
3. **Plan** - Break down into small, testable increments
4. **Execute** - Implement one increment at a time
5. **Validate** - Test, lint, verify acceptance criteria
6. **Loop** - Update tasks, commit, return to step 1

---

## Always / Never Rules

### Always
- Read CLAUDE.md at session start
- Check TASKS.md before starting work
- Write tests before marking tasks complete
- Commit working code with descriptive messages
- Keep secrets out of version control
- Follow the defined tech stack
- Log all agent actions to Weave
- Store failure patterns in Redis
- Verify fixes don't introduce regressions

### Never
- Skip testing
- Commit broken code
- Add dependencies without justification
- Ignore lint/type errors
- Hardcode secrets or credentials
- Deviate from phase scope without approval
- Deploy untested patches
- Ignore Redis lookup results
- Skip Weave logging for agent runs

---

## File Structure

```
weavehacks/
├── .claude/
│   ├── settings.json
│   └── skills/
│       ├── browserbase-stagehand/
│       ├── redis-vectorstore/
│       ├── vercel-deployment/
│       ├── wandb-weave/
│       ├── google-adk/
│       ├── marimo-dashboards/
│       └── patchpilot-agents/
├── agents/
│   ├── tester/
│   ├── triage/
│   ├── fixer/
│   ├── verifier/
│   └── orchestrator/
├── app/                    # Next.js demo app (target for testing)
├── dashboard/              # Marimo analytics dashboard
├── docs/
│   ├── PRD.md
│   ├── DESIGN.md
│   └── ARCHITECTURE.md
├── lib/
│   ├── browserbase/
│   ├── redis/
│   ├── vercel/
│   ├── weave/
│   └── llm/
├── prompts/
│   └── ralph-loop.md
├── tests/
│   ├── e2e/
│   └── unit/
├── CLAUDE.md
├── TASKS.md
├── README.md
└── .env.example
```

---

## Current Focus

**Active Phase:** Phase 0 - Planning
**Current Task:** Define full project structure and documentation
**Blockers:** None

---

## Demo Script (3 Minutes)

| Time | Section | Content |
|------|---------|---------|
| 0:00-0:20 | Intro | Show buggy app, explain PatchPilot concept |
| 0:20-1:10 | Detection | Run Tester agent, show failure capture |
| 1:10-2:10 | Fix | Show diagnosis, patch generation, Vercel deploy |
| 2:10-2:40 | Verify | Re-run test, show success, Weave dashboard |
| 2:40-3:00 | Wrap-up | Summary, sponsor credits, metrics improvement |

---

## References

- [PatchPilot Paper](https://arxiv.org/html/2502.02747v1) - Five-step agentic patching framework
- [Stagehand Docs](https://www.stagehand.dev/) - AI-powered browser automation
- [Browserbase Docs](https://docs.browserbase.com/) - Cloud browser infrastructure
- [Redis Vector Search](https://redis.io/docs/stack/search/reference/vectors/) - Semantic similarity
- [W&B Weave](https://wandb.ai/site/weave) - LLM observability
- [Google ADK](https://cloud.google.com/agent-development-kit) - Agent orchestration
- [Marimo](https://marimo.io/) - Reactive Python notebooks

---

*Last updated: 2024*
