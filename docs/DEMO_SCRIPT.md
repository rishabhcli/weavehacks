# QAgent Demo Script

**Duration:** 3 minutes
**Format:** Live demo with narration
**Backup:** Pre-recorded video available

---

## Pre-Demo Setup (Before Presentation)

1. Open terminal in project directory
2. Start demo app: `pnpm dev`
3. Open browser to http://localhost:3000
4. Have dashboard ready: `pnpm run dashboard`
5. Clear terminal for demo output

---

## Demo Flow

### Opening (0:00 - 0:20) | 20 seconds

**[Show: Browser with demo app cart page]**

> "This is QAgent, a self-healing QA agent. It automatically finds bugs, fixes them, and verifies the fixes - all without human intervention."

**[Click the Checkout button - nothing happens]**

> "See this checkout button? It's broken - nothing happens when you click it. Let's watch QAgent fix it automatically."

---

### Bug Detection (0:20 - 1:10) | 50 seconds

**[Switch to terminal, run the demo]**

```bash
pnpm run demo
```

> "I'm starting QAgent. It uses **Browserbase** and **Stagehand** - AI-powered browser automation in the cloud."

**[Show: Tester Agent output as it runs tests]**

> "The Tester Agent is now running our E2E tests. It simulates real user interactions..."

**[Wait for failure detection - show the output]**

> "It found the bug! The checkout button has no onClick handler. Here's the screenshot and error captured automatically."

**[Point to: Error message and file location in output]**

---

### Diagnosis and Fix (1:10 - 2:10) | 60 seconds

**[Show: Triage Agent output]**

> "Now the **Triage Agent** analyzes the failure. It's querying our **Redis** knowledge base for similar bugs we've seen before."

**[Point to: Similar issues found, if any]**

> "The diagnosis: UI_BUG - missing event handler at line 109 in cart/page.tsx."

**[Show: Fixer Agent generating patch]**

> "The **Fixer Agent** is generating a code patch using GPT-4, guided by patterns from past fixes..."

**[Show: The diff/patch output]**

> "Here's the fix - adding the onClick handler. Now deploying to **Vercel**..."

**[Show: Deployment progress]**

> "The **Verifier Agent** applies the patch and triggers an instant deploy."

---

### Verification (2:10 - 2:40) | 30 seconds

**[Show: Verifier Agent re-running test]**

> "Let's verify the fix works..."

**[Wait for test to pass]**

> "Test passed! Let me show you the live app."

**[Switch to browser, refresh, click Checkout button]**

> "Now watch - the checkout button works!"

**[Show: Order confirmation]**

**[Show: Marimo dashboard]**

> "And here's our **Marimo** dashboard showing the improvement - pass rate went from 67% to 100%."

---

### Conclusion (2:40 - 3:00) | 20 seconds

**[Show: Dashboard with all metrics]**

> "QAgent integrates six sponsor technologies today and plans Google ADK integration:
> - **Browserbase** and **Stagehand** for cloud browser testing
> - **Redis** for learning from past bugs
> - **Vercel** for instant deployments
> - **W&B Weave** for tracing every agent action
> - **Custom Orchestrator (ADK/A2A-compatible)** for multi-agent orchestration (ADK integration planned)
> - **Marimo** for real-time visualization
>
> A self-improving QA agent that gets smarter with every bug it fixes."

---

## Key Talking Points

### If asked about the technology:

- **Browserbase + Stagehand**: "We run headless Chrome in Browserbase's cloud. Stagehand lets us write tests in natural language - 'click the checkout button' - instead of fragile CSS selectors."

- **Redis**: "Every bug and fix is embedded as vectors in Redis. When we see a new bug, we query for similar past issues. This makes fixes faster over time."

- **Vercel**: "After generating a fix, we deploy instantly to Vercel. No manual git push needed - the Verifier Agent handles it."

- **W&B Weave**: "Every agent action is traced. We can see exactly what the LLM was thinking, what Redis returned, how long each step took."

- **Custom Orchestrator (ADK/A2A-compatible)**: "Our agents coordinate through a custom orchestrator today, designed to map cleanly to Google ADK/A2A in a future integration. It sequences Tester → Triage → Fixer → Verifier."

- **Marimo**: "The dashboard is a reactive Python notebook. Charts update in real-time as QAgent finds and fixes bugs."

### If asked about the approach:

> "QAgent follows the 5-step agentic patching pattern from our research:
> 1. **Test** - Run E2E tests to find failures
> 2. **Diagnose** - Analyze the error, find the root cause
> 3. **Fix** - Generate a patch using LLM + past patterns
> 4. **Verify** - Apply, deploy, re-test
> 5. **Learn** - Store the fix for future reference"

### If asked about self-improvement:

> "The system learns in two ways:
> 1. **Fix patterns** - Successful fixes are stored in Redis. Similar bugs get fixed faster.
> 2. **TraceTriage** - When an agent fails, we analyze why and improve the prompts."

---

## Timing Breakdown

| Section | Start | End | Duration |
|---------|-------|-----|----------|
| Opening - Show bug | 0:00 | 0:20 | 20s |
| Detection - Run tests | 0:20 | 1:10 | 50s |
| Diagnosis + Fix | 1:10 | 2:10 | 60s |
| Verification | 2:10 | 2:40 | 30s |
| Conclusion | 2:40 | 3:00 | 20s |
| **Total** | | | **3:00** |

---

## Fallback Scenarios

### If demo app doesn't start:
> "Let me show you a recorded demo instead..."
> [Play backup video]

### If Browserbase times out:
> "The cloud browser is spinning up - while that happens, let me show you the dashboard with previous runs..."
> [Show Marimo with mock data]

### If fix fails:
> "Sometimes the first fix doesn't work - that's when the loop continues. Let's look at the trace to see what happened..."
> [Show Weave traces]

### If running over time:
> "I'll speed through the verification - the key point is the automated loop: test, diagnose, fix, verify, learn."

---

## Visual Checklist

- [ ] QAgent banner visible at start
- [ ] Bug clearly shown (button doesn't work)
- [ ] Agent output visible and readable
- [ ] Patch diff shown
- [ ] Working button shown after fix
- [ ] Dashboard with metrics visible
- [ ] Sponsor logos mentioned

---

## Demo Commands Reference

```bash
# Start demo app
pnpm dev

# Run QAgent demo
pnpm run demo

# Dry run (for practice)
pnpm run demo:dry

# Open dashboard
pnpm run dashboard

# Run just the agent
pnpm run agent
```

---

## Environment Variables Needed

```bash
BROWSERBASE_API_KEY=<your-key>
BROWSERBASE_PROJECT_ID=<your-project>
OPENAI_API_KEY=<your-key>
REDIS_URL=<redis-url>
VERCEL_TOKEN=<your-token>
VERCEL_PROJECT_ID=<your-project>
WANDB_API_KEY=<your-key>
```
