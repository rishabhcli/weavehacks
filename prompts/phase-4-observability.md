# Phase 4: Logging & Dashboard

**Focus:** W&B Weave tracing and Marimo visualization

**Status:** Pending (requires Phase 3 completion)

---

## Overview

Phase 4 adds observability to PatchPilot through W&B Weave for tracing agent operations and Marimo for building an interactive analytics dashboard. This enables monitoring, debugging, and demonstrating the system's improvement over time.

---

## Skills to Load

```
.claude/skills/wandb-weave/
├── SKILL.md      # Tracing concepts, metrics
└── reference.md  # Weave decorator patterns, logging

.claude/skills/marimo-dashboards/
├── SKILL.md      # Reactive cells, charts
└── reference.md  # Complete dashboard code
```

---

## Ralph Loop Template

```
## Ralph Loop - Phase 4 - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for project context
- [ ] Check TASKS.md for Phase 4 tasks
- [ ] Load wandb-weave skill
- [ ] Load marimo-dashboards skill

### 2. ANALYZE
- Current task: [Task ID and description]
- Weave status: [Initialized/Not initialized]
- Dashboard status: [Components built/Remaining]

### 3. PLAN
Increments for this iteration:
1. [Specific task]
2. [Testing task]
3. [Validation task]

### 4. EXECUTE
[Implement one increment at a time]

### 5. VALIDATE
- [ ] Traces appear in Weave UI
- [ ] Metrics logged correctly
- [ ] Dashboard renders
- [ ] Charts show data

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit working code
- [ ] Continue to next task or end iteration
```

---

## Tasks

### P4.1: Weave SDK Integration
- [ ] Install weave SDK
- [ ] Initialize with project name
- [ ] Configure WANDB_API_KEY
- [ ] Test basic trace logging

### P4.2: Agent Tracing
- [ ] Add @weave.op() to TesterAgent.runTest
- [ ] Add @weave.op() to TriageAgent.diagnose
- [ ] Add @weave.op() to FixerAgent.generatePatch
- [ ] Add @weave.op() to VerifierAgent.verify
- [ ] Add @weave.op() to Orchestrator.run

### P4.3: Metrics Logging
- [ ] Log pass_rate after each run
- [ ] Log fix_time_seconds
- [ ] Log iterations_total
- [ ] Log bugs_found / bugs_fixed
- [ ] Log redis_hit_rate
- [ ] Log deployment_time

### P4.4: Marimo Dashboard Setup
- [ ] Install marimo
- [ ] Create dashboard/app.py
- [ ] Add header and navigation
- [ ] Configure Weave data fetching

### P4.5: Dashboard Components
- [ ] Add metrics cards (pass rate, fix time, bugs fixed)
- [ ] Add pass rate over time chart
- [ ] Add time-to-fix bar chart
- [ ] Add bug types pie chart
- [ ] Add recent fixes table

### P4.6: Dashboard Styling
- [ ] Add PatchPilot branding
- [ ] Configure color scheme (green/blue)
- [ ] Add responsive layout
- [ ] Add loading states

### P4.7: Live Updates
- [ ] Add refresh button
- [ ] Implement auto-refresh option
- [ ] Configure cache for Weave queries
- [ ] Test real-time updates

---

## Weave Integration

### Project Initialization

```typescript
import weave from 'weave';

// Initialize at app startup
weave.init('patchpilot');
```

### Agent Method Decoration

```typescript
class TesterAgent {
  @weave.op()
  async runTest(spec: TestSpec): Promise<TestResult> {
    // Method body - automatically traced
  }
}

class TriageAgent {
  @weave.op()
  async diagnose(failure: FailureReport): Promise<DiagnosisReport> {
    // Method body - automatically traced
  }
}

class FixerAgent {
  @weave.op()
  async generatePatch(diagnosis: DiagnosisReport): Promise<Patch> {
    // Method body - automatically traced
  }
}

class VerifierAgent {
  @weave.op()
  async verify(patch: Patch, testSpec: TestSpec): Promise<VerificationResult> {
    // Method body - automatically traced
  }
}
```

### Metrics Logging

```typescript
async function logRunMetrics(result: OrchestratorResult): Promise<void> {
  weave.log({
    pass_rate: result.finalTestResult.passed ? 1.0 : 0.0,
    fix_time_seconds: result.totalDuration / 1000,
    iterations_total: result.iterations,
    bugs_fixed: result.success ? 1 : 0,
    patches_generated: result.patches.length
  });
}
```

---

## Marimo Dashboard

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                     PatchPilot Dashboard                         │
│                  Self-Healing QA Agent Analytics                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Pass     │  │ Avg Fix  │  │ Bugs     │  │ Speed    │        │
│  │ Rate     │  │ Time     │  │ Fixed    │  │ Improve  │        │
│  │ 100%     │  │ 60s      │  │ 5        │  │ 67%      │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │  Pass Rate Over Time    │  │  Time to Fix            │      │
│  │  📈 Line Chart          │  │  📊 Bar Chart           │      │
│  │                         │  │                         │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │  Bug Types             │  │  Recent Fixes           │      │
│  │  🥧 Pie Chart          │  │  📋 Table               │      │
│  │                         │  │  ✓ Missing onClick     │      │
│  │                         │  │  ✓ Wrong API route     │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Metrics Cards

```python
@app.cell
def metrics(fetch_data):
    df = fetch_data
    latest = df.iloc[-1]

    pass_rate = mo.stat(
        value=f"{latest['pass_rate']*100:.0f}%",
        label="Pass Rate",
        bordered=True
    )

    fix_time = mo.stat(
        value=f"{latest['fix_time']:.0f}s",
        label="Avg Fix Time",
        bordered=True
    )

    total_bugs = mo.stat(
        value=f"{df['bugs_fixed'].sum()}",
        label="Bugs Fixed",
        bordered=True
    )

    return mo.hstack([pass_rate, fix_time, total_bugs], gap=2)
```

### Pass Rate Chart

```python
@app.cell
def pass_rate_chart(fetch_data):
    df = fetch_data

    chart = alt.Chart(df).mark_line(
        point=True,
        strokeWidth=3,
        color='#10b981'
    ).encode(
        x=alt.X('run:O', title='Run #'),
        y=alt.Y('pass_rate:Q',
                title='Pass Rate',
                scale=alt.Scale(domain=[0, 1]),
                axis=alt.Axis(format='%')),
        tooltip=['run:O', alt.Tooltip('pass_rate:Q', format='.0%')]
    ).properties(
        title='Test Pass Rate Over Time',
        width=600,
        height=300
    )

    return mo.ui.altair_chart(chart)
```

---

## Validation Checklist

### Weave Integration
- [ ] weave.init() succeeds
- [ ] API key is valid
- [ ] Project appears in Weave UI

### Agent Tracing
- [ ] TesterAgent traces appear
- [ ] TriageAgent traces appear
- [ ] FixerAgent traces appear
- [ ] VerifierAgent traces appear
- [ ] Orchestrator traces appear
- [ ] Nested calls are visible

### Metrics
- [ ] pass_rate logged correctly
- [ ] fix_time_seconds is accurate
- [ ] iterations_total matches actual
- [ ] Metrics appear in Weave UI

### Marimo Dashboard
- [ ] `marimo run dashboard/app.py` works
- [ ] Header displays correctly
- [ ] Metrics cards show data
- [ ] Charts render
- [ ] Table populates

### Data Flow
- [ ] Dashboard fetches Weave data
- [ ] Charts update with new runs
- [ ] Refresh button works
- [ ] No stale data issues

---

## Common Issues

### Weave Initialization Failed
```
Error: WANDB_API_KEY not set
```
- Set WANDB_API_KEY in .env
- Get key from wandb.ai/settings

### Traces Not Appearing
```
No traces in Weave UI
```
- Verify project name matches
- Check if flush() needed
- Ensure decorator is applied

### Marimo Import Error
```
ModuleNotFoundError: No module named 'marimo'
```
- Install marimo: `pip install marimo`
- Check Python environment

### Chart Not Rendering
```
Blank space where chart should be
```
- Ensure chart is returned (not printed)
- Wrap with `mo.ui.altair_chart()`
- Check data is not empty

---

## Exit Criteria

Phase 4 is complete when:

1. All agent methods are traced with @weave.op()
2. Key metrics are logged after each run
3. Traces are visible in Weave UI
4. Marimo dashboard runs locally
5. All dashboard charts display data
6. Dashboard shows improvement over runs
7. All code is committed

---

## Next Phase

Upon completion, proceed to **Phase 5: TraceTriage** where we implement self-improvement through trace analysis.

---

## References

- [.claude/skills/wandb-weave/SKILL.md](../.claude/skills/wandb-weave/SKILL.md)
- [.claude/skills/wandb-weave/reference.md](../.claude/skills/wandb-weave/reference.md)
- [.claude/skills/marimo-dashboards/SKILL.md](../.claude/skills/marimo-dashboards/SKILL.md)
- [.claude/skills/marimo-dashboards/reference.md](../.claude/skills/marimo-dashboards/reference.md)
- [W&B Weave Docs](https://wandb.ai/site/weave)
- [Marimo Docs](https://docs.marimo.io/)
