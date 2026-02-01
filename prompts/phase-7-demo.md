# Phase 7: Demo Preparation

**Focus:** End-to-end validation and presentation

**Status:** Pending (requires Phase 6 completion)

---

## Overview

Phase 7 is the final phase before the hackathon presentation. The focus is on ensuring everything works flawlessly end-to-end, creating compelling demo materials, and preparing backup plans. By the end of this phase, QAgent should be ready for a polished 3-minute demo.

---

## Skills to Load

All skills for reference:
```
.claude/skills/
├── browserbase-stagehand/   # Testing infrastructure
├── redis-vectorstore/       # Knowledge base
├── vercel-deployment/       # Deployment
├── wandb-weave/            # Observability
├── google-adk/             # Orchestration
├── marimo-dashboards/      # Visualization
└── qagent-agents/      # Core agents
```

---

## Ralph Loop Template

```
## Ralph Loop - Phase 7 - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for final context
- [ ] Review all phase completions in TASKS.md
- [ ] Check all integrations are working
- [ ] Review demo requirements

### 2. ANALYZE
- E2E status: [Working/Issues]
- Demo materials: [Complete/Incomplete]
- Backup plan: [Ready/Not ready]

### 3. PLAN
Increments for this iteration:
1. [Validation task]
2. [Demo material task]
3. [Backup preparation]

### 4. EXECUTE
[Complete one increment at a time]

### 5. VALIDATE
- [ ] Full E2E flow works
- [ ] Demo timing is correct
- [ ] Backup demo is ready
- [ ] All materials prepared

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit all changes
- [ ] Final review
```

---

## Tasks

### P7.1: End-to-End Validation
- [ ] Run full QAgent loop on all 3 bugs
- [ ] Verify each agent performs correctly
- [ ] Confirm Redis learning works
- [ ] Check Weave traces are complete
- [ ] Validate dashboard shows data

### P7.2: Demo Script Finalization
- [ ] Write exact script for 3-minute demo
- [ ] Time each section
- [ ] Practice transitions
- [ ] Prepare talking points

### P7.3: Demo Recording
- [ ] Record backup video of working demo
- [ ] Edit for timing and clarity
- [ ] Add captions if needed
- [ ] Test playback quality

### P7.4: Live Demo Preparation
- [ ] Pre-configure all environment variables
- [ ] Pre-start services (Redis, etc.)
- [ ] Pre-warm Browserbase session
- [ ] Pre-deploy demo app with bugs

### P7.5: Presentation Materials
- [ ] Create slide deck (optional)
- [ ] Prepare architecture diagram
- [ ] Document sponsor integrations
- [ ] List key metrics/achievements

### P7.6: Backup Plans
- [ ] Prepare recorded demo as backup
- [ ] Create static screenshots of key moments
- [ ] Document manual steps if automation fails
- [ ] Test backup plan works

### P7.7: Final Review
- [ ] Code review all changes
- [ ] Run all tests one final time
- [ ] Check no secrets in repo
- [ ] Verify README is updated

---

## 3-Minute Demo Script

### Opening (0:00-0:20)

**Action:** Show buggy app
**Say:**
> "This is QAgent, a self-healing QA agent. Watch as it automatically finds a bug, fixes it, and verifies the fix."

**Show:**
- Demo app with checkout button
- Click checkout - nothing happens
- "This button is broken - no click handler"

---

### Bug Detection (0:20-1:10)

**Action:** Start QAgent
**Say:**
> "QAgent is now running E2E tests using Browserbase and Stagehand - AI-powered browser automation in the cloud."

**Show:**
- Terminal running Tester Agent
- Browser automation happening
- Failure report with screenshot

**Say:**
> "It found the bug - the checkout button has no onClick handler. Here's the screenshot and error captured automatically."

---

### Diagnosis and Fix (1:10-2:10)

**Action:** Show Triage and Fixer
**Say:**
> "The Triage Agent diagnosed the issue as a UI bug and queried our Redis knowledge base for similar past fixes."

**Show:**
- Triage Agent output
- Redis query (if visible)

**Say:**
> "Now the Fixer Agent is generating a patch using GPT-4..."

**Show:**
- Patch diff
- Vercel deployment starting

**Say:**
> "Deploying to Vercel automatically..."

**Show:**
- Deployment progress
- Deployment complete

---

### Verification (2:10-2:40)

**Action:** Show Verifier and result
**Say:**
> "The fix is deployed. Let's verify..."

**Show:**
- Verifier Agent re-running test
- Test passing
- Live app with working button

**Click checkout button - it works!**

**Say:**
> "All tests passing. The Marimo dashboard shows our improvement."

**Show:**
- Dashboard with pass rate going from 67% to 100%
- Time-to-fix metrics
- Recent fixes table

---

### Conclusion (2:40-3:00)

**Action:** Show integrations
**Say:**
> "QAgent used:
> - **Browserbase + Stagehand** for cloud browser testing
> - **Redis** for learning from past bugs
> - **Vercel** for instant deployment
> - **W&B Weave** for tracing
> - **Custom Orchestrator (ADK/A2A-compatible)** for agent orchestration (ADK planned)
> - **Marimo** for visualization
>
> A self-improving agent that gets smarter with every bug it fixes."

---

## Demo Timing Breakdown

| Section | Duration | Cumulative |
|---------|----------|------------|
| Opening / Show bug | 20 sec | 0:20 |
| Bug Detection | 50 sec | 1:10 |
| Triage + Fixer | 35 sec | 1:45 |
| Deployment | 25 sec | 2:10 |
| Verification | 30 sec | 2:40 |
| Conclusion | 20 sec | 3:00 |

---

## Pre-Demo Checklist

### Environment
- [ ] All API keys are set and valid
- [ ] BROWSERBASE_API_KEY
- [ ] OPENAI_API_KEY
- [ ] REDIS_URL
- [ ] VERCEL_TOKEN
- [ ] WANDB_API_KEY

### Services
- [ ] Redis is running and accessible
- [ ] Browserbase account is active
- [ ] Vercel project is configured
- [ ] W&B project exists

### Demo App
- [ ] Demo app is deployed with bugs
- [ ] URL is accessible
- [ ] All 3 bugs are present
- [ ] No other issues interfere

### QAgent
- [ ] All agents are working
- [ ] Orchestrator completes successfully
- [ ] Dashboard shows data
- [ ] Timing is within 3 minutes

### Backup
- [ ] Recorded video is ready
- [ ] Video plays correctly
- [ ] Screenshots are prepared
- [ ] Manual fallback documented

---

## Sponsor Integration Summary

| Sponsor | Integration | How It's Used |
|---------|-------------|---------------|
| **Browserbase** | Cloud browser sessions | Runs headless Chrome in the cloud for E2E tests |
| **Stagehand** | AI browser automation | Executes natural language test actions |
| **Redis** | Vector knowledge base | Stores failure patterns, enables semantic search |
| **Vercel** | Deployment platform | Auto-deploys fixes, provides preview URLs |
| **W&B Weave** | Observability | Traces all agent operations, logs metrics |
| **Custom Orchestrator (ADK/A2A-compatible)** | Agent orchestration | Coordinates multi-agent workflow (ADK planned) |
| **Marimo** | Dashboard | Visualizes pass rates, fix times, improvements |

---

## Validation Checklist

### End-to-End
- [ ] Bug 1 (onClick) is fixed automatically
- [ ] Bug 2 (API route) is fixed automatically
- [ ] Bug 3 (null ref) is fixed automatically
- [ ] All 3 bugs fixed in <5 total iterations

### Demo Flow
- [ ] Demo completes within 3 minutes
- [ ] All transitions are smooth
- [ ] No awkward pauses
- [ ] Key points are clear

### Visuals
- [ ] Terminal output is readable
- [ ] Dashboard is visible
- [ ] Diagrams are clear
- [ ] No sensitive data visible

### Backup
- [ ] Video backup works
- [ ] Screenshots tell the story
- [ ] Manual demo is documented

---

## Common Issues

### Browser Session Fails
```
Error: Session creation timeout
```
**Fix:** Pre-create session, use warm pool

### Deployment Slow
```
Warning: Deployment taking >2 minutes
```
**Fix:** Pre-warm Vercel, smaller changes

### Dashboard Empty
```
Warning: No data in charts
```
**Fix:** Run test cycles beforehand, seed data

### Timing Off
```
Warning: Demo running long
```
**Fix:** Practice more, cut verbose sections

---

## Exit Criteria

Phase 7 is complete when:

1. Full E2E validation passes
2. Demo script is finalized and timed
3. Demo recording is ready as backup
4. All materials are prepared
5. Live demo runs successfully
6. Backup plan is tested
7. Ready for presentation

---

## Final Deliverables

- [ ] Working QAgent system
- [ ] 3-minute demo (live or recorded)
- [ ] Dashboard showing improvement metrics
- [ ] Documentation of all sponsor integrations
- [ ] README with setup instructions
- [ ] Clean, committed codebase

---

## References

- [CLAUDE.md](../CLAUDE.md) - Project overview
- [TASKS.md](../TASKS.md) - All completed tasks
- [docs/PRD.md](../docs/PRD.md) - Requirements
- [docs/DESIGN.md](../docs/DESIGN.md) - System design
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Architecture decisions
