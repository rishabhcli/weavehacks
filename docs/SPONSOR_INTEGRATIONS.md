# Sponsor Integrations

QAgent integrates six sponsor technologies today and plans Google ADK integration. This document details current usage and planned alignment.

---

## Overview

| Sponsor | Integration | Primary Use |
|---------|-------------|-------------|
| Browserbase | Cloud browser sessions | Running E2E tests |
| Stagehand | AI browser automation | Natural language test actions |
| Redis | Vector database | Knowledge base for patterns |
| Vercel | Deployment platform | Auto-deploy after fixes |
| W&B Weave | Observability | Tracing all agent actions |
| Google ADK (planned) | Agent framework | Multi-agent orchestration |
| Marimo | Dashboard framework | Real-time analytics |

---

## 1. Browserbase + Stagehand

### Overview
Browserbase provides cloud-hosted browser sessions. Stagehand adds AI-powered automation using natural language commands.

### Integration Points

**File:** `lib/browserbase/client.ts`
```typescript
import Browserbase from '@browserbasehq/sdk';

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

export async function createSession() {
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      viewport: { width: 1280, height: 720 },
    },
  });
  return session;
}
```

**File:** `agents/tester/index.ts`
```typescript
import { Stagehand } from '@browserbasehq/stagehand';

export class TesterAgent {
  private stagehand: Stagehand;

  async init() {
    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      enableCaching: true,
      modelName: 'gpt-4o',
    });
    await this.stagehand.init();
  }

  async runTest(spec: TestSpec) {
    await this.stagehand.page.goto(spec.url);

    for (const step of spec.steps) {
      // Natural language actions
      await this.stagehand.act(step.action);

      if (step.expected) {
        const result = await this.stagehand.observe(step.expected);
        if (!result) {
          return this.captureFailure(step);
        }
      }
    }
  }
}
```

### Key Features Used
- **Session Management**: Create isolated browser sessions for each test
- **AI Actions**: Execute tests using natural language ("click the checkout button")
- **Observation**: Verify page state matches expectations
- **Screenshot Capture**: Take screenshots on failure for debugging

### Why This Matters
- No fragile CSS selectors - tests are written in plain English
- Cloud execution - no local browser dependencies
- AI understands page context - handles dynamic content naturally

---

## 2. Redis

### Overview
Redis with vector search capabilities stores failure patterns and successful fixes. This enables semantic search for similar past issues.

### Integration Points

**File:** `lib/redis/client.ts`
```typescript
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
});

export async function createIndex() {
  await client.ft.create('idx:failures', {
    '$.embedding': {
      type: 'VECTOR',
      ALGORITHM: 'HNSW',
      TYPE: 'FLOAT32',
      DIM: 1536,
      DISTANCE_METRIC: 'COSINE',
    },
    '$.errorMessage': { type: 'TEXT' },
    '$.file': { type: 'TAG' },
  }, { ON: 'JSON', PREFIX: 'failure:' });
}
```

**File:** `lib/redis/embeddings.ts`
```typescript
import OpenAI from 'openai';

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function findSimilarIssues(errorMessage: string, k = 5) {
  const embedding = await generateEmbedding(errorMessage);

  const results = await client.ft.search('idx:failures', `*=>[KNN ${k} @embedding $BLOB]`, {
    PARAMS: { BLOB: Buffer.from(new Float32Array(embedding).buffer) },
    RETURN: ['errorMessage', 'file', 'fix'],
    DIALECT: 2,
  });

  return results.documents;
}
```

### Key Features Used
- **Vector Search (HNSW)**: Fast approximate nearest neighbor search
- **JSON Documents**: Store structured failure data with metadata
- **Semantic Similarity**: Find similar bugs even with different wording

### Why This Matters
- Learning from experience - similar bugs get fixed faster
- Pattern recognition - common fix patterns are reused
- Continuous improvement - knowledge base grows over time

---

## 3. Vercel

### Overview
Vercel provides instant deployments after QAgent applies fixes. The Verifier Agent triggers deployments programmatically.

### Integration Points

**File:** `agents/verifier/index.ts`
```typescript
export class VerifierAgent {
  async deployToVercel(projectRoot: string): Promise<DeploymentResult> {
    const response = await fetch(
      `https://api.vercel.com/v13/deployments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: process.env.VERCEL_PROJECT_ID,
          gitSource: {
            type: 'github',
            repoId: process.env.GITHUB_REPO_ID,
            ref: 'main',
          },
        }),
      }
    );

    return response.json();
  }

  async waitForDeployment(deploymentId: string): Promise<string> {
    // Poll until deployment is ready
    while (true) {
      const status = await this.getDeploymentStatus(deploymentId);
      if (status.readyState === 'READY') {
        return status.url;
      }
      await sleep(5000);
    }
  }
}
```

### Key Features Used
- **API Deployments**: Trigger deploys programmatically after fixes
- **Preview URLs**: Get unique URLs for each deployment
- **Git Integration**: Deployments linked to commits

### Why This Matters
- Instant verification - test fixes on real infrastructure
- No manual deploy steps - fully automated pipeline
- Rollback capability - easy to revert bad fixes

---

## 4. W&B Weave

### Overview
Weave provides observability for the entire agent pipeline. Every action is traced and logged for debugging and improvement.

### Integration Points

**File:** `lib/weave/index.ts`
```typescript
import * as weave from 'weave';

let weaveClient: weave.WeaveClient | null = null;

export async function initWeave(projectName: string) {
  if (process.env.WANDB_API_KEY) {
    weaveClient = await weave.init(projectName);
    console.log(`Weave initialized: ${projectName}`);
  }
}

export function op<T extends (...args: any[]) => any>(
  fn: T,
  options: { name: string }
): T {
  if (!weaveClient) return fn;
  return weave.op(fn, options);
}
```

**File:** `lib/weave/tracing.ts`
```typescript
export function traceAgent(agentName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const span = weave.startSpan(`${agentName}.${propertyKey}`);
      try {
        const result = await original.apply(this, args);
        span.setAttribute('success', true);
        return result;
      } catch (error) {
        span.setAttribute('error', error.message);
        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
}
```

**File:** `lib/weave/metrics.ts`
```typescript
export interface RunMetrics {
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
  bugsFound: number;
  bugsFixed: number;
  iterationsTotal: number;
  durationMs: number;
  success: boolean;
}

export function logRunMetrics(metrics: RunMetrics) {
  if (weaveClient) {
    weave.log({
      type: 'run_metrics',
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Key Features Used
- **Function Tracing**: Automatic spans for all agent operations
- **Metrics Logging**: Track pass rates, fix times, iterations
- **LLM Logging**: See what prompts were sent, what responses received

### Why This Matters
- Debug failures - see exactly where and why agents failed
- Track improvement - measure how system gets better over time
- Optimize prompts - analyze LLM responses to improve

---

## 5. Google ADK (Planned)

### Overview
Google Agent Development Kit integration is planned. The current Orchestrator is custom but follows ADK-style sequencing to keep interfaces compatible for a future ADK/A2A migration.

### Current Implementation (ADK-compatible Pattern)

**File:** `agents/orchestrator/index.ts`
```typescript
// Custom orchestrator with ADK-compatible sequencing
export class Orchestrator {
  private agents: Map<string, Agent> = new Map();

  constructor() {
    // Register agents in execution order
    this.agents.set('tester', new TesterAgent());
    this.agents.set('triage', new TriageAgent());
    this.agents.set('fixer', new FixerAgent());
    this.agents.set('verifier', new VerifierAgent());
  }

  async runPipeline(config: OrchestratorConfig) {
    // Sequential execution with context passing (ADK-compatible pattern)
    let context = { testSpecs: config.testSpecs };

    for (const [name, agent] of this.agents) {
      console.log(`Running agent: ${name}`);
      context = await agent.execute(context);

      if (context.complete) break;
    }

    return context.result;
  }
}
```

### Design Principles Used
- **Agent Registry**: Central management of agent instances
- **Context Passing**: Share state between agents
- **Pipeline Execution**: Sequential agent coordination

### Why This Matters
- Modular architecture - add/remove agents easily
- Clear data flow - each agent knows its inputs/outputs
- Future ADK/A2A adoption without rewrites

---

## 6. Marimo

### Overview
Marimo provides the interactive analytics dashboard. It's a reactive Python notebook that displays real-time metrics.

### Integration Points

**File:** `dashboard/app.py`
```python
import marimo
import pandas as pd
import altair as alt

app = marimo.App(width="full")

@app.cell
def fetch_data(use_mock):
    """Fetch data from W&B Weave or use mock data"""
    if use_mock.value:
        return pd.DataFrame([
            {'run': 1, 'pass_rate': 0.33, 'fix_time': 180},
            {'run': 2, 'pass_rate': 0.67, 'fix_time': 120},
            {'run': 3, 'pass_rate': 1.00, 'fix_time': 60},
        ])
    else:
        import weave
        client = weave.init('qagent')
        return fetch_from_weave(client)

@app.cell
def pass_rate_chart(mo, df):
    """Line chart showing pass rate over time"""
    chart = alt.Chart(df).mark_line(
        point=True,
        strokeWidth=3,
        color='#10b981'
    ).encode(
        x='run:O',
        y=alt.Y('pass_rate:Q', scale=alt.Scale(domain=[0, 1])),
    ).properties(title='Test Pass Rate')

    return mo.ui.altair_chart(chart)

@app.cell
def recent_fixes(mo, pd):
    """Table showing recent fixes"""
    fixes = pd.DataFrame([
        {'bug': 'Missing onClick', 'file': 'cart/page.tsx', 'status': '✓'},
        {'bug': 'Wrong API route', 'file': 'checkout/route.ts', 'status': '✓'},
    ])
    return mo.ui.table(fixes)
```

### Key Features Used
- **Reactive Cells**: Charts update automatically when data changes
- **Altair Charts**: Beautiful, interactive visualizations
- **Data Tables**: Display recent fixes and detailed metrics

### Why This Matters
- Real-time visibility - see improvements as they happen
- Interactive exploration - drill into specific runs
- Demo-ready - polished visuals for presentations

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        QAgent System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │          Custom Orchestrator (ADK-compatible)            │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│   │  │  Tester  │→ │  Triage  │→ │  Fixer   │→ │ Verifier │ │  │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│   └───────┼─────────────┼─────────────┼─────────────┼────────┘  │
│           │             │             │             │           │
│   ┌───────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐    │
│   │ Browserbase │ │   Redis   │ │  OpenAI   │ │  Vercel   │    │
│   │ + Stagehand │ │  (Vector) │ │   (LLM)   │ │ (Deploy)  │    │
│   └─────────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   W&B Weave (Tracing)                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 Marimo (Dashboard)                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Reference

### Environment Variables

| Variable | Sponsor | Purpose |
|----------|---------|---------|
| `BROWSERBASE_API_KEY` | Browserbase | Authentication |
| `BROWSERBASE_PROJECT_ID` | Browserbase | Project identifier |
| `OPENAI_API_KEY` | - | LLM for Stagehand & Fixer |
| `REDIS_URL` | Redis | Vector database connection |
| `VERCEL_TOKEN` | Vercel | Deployment API access |
| `VERCEL_PROJECT_ID` | Vercel | Project identifier |
| `WANDB_API_KEY` | W&B Weave | Observability API access |
| `GOOGLE_CLOUD_PROJECT` | Google ADK (planned) | Cloud project identifier |

### Required Dependencies

```json
{
  "dependencies": {
    "@browserbasehq/sdk": "^2.6.0",
    "@browserbasehq/stagehand": "^3.0.8",
    "redis": "^5.10.0",
    "weave": "^0.11.0",
    "openai": "^6.17.0"
  }
}
```

```python
# requirements.txt for dashboard
marimo>=0.10.0
pandas>=2.0.0
altair>=5.0.0
weave>=0.11.0
```

---

## Environment Variables (WeaveHacks Additions)

Add these to `.env.local` for full WeaveHacks demo:

```bash
# Weave project (explicit)
WEAVE_PROJECT=qagent

# Daily/Pipecat Voice Integration
DAILY_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
```

---

## Sponsor Credits

Built with:
- **[Browserbase](https://browserbase.com)** - Cloud browser infrastructure
- **[Stagehand](https://stagehand.dev)** - AI-powered browser automation
- **[Redis](https://redis.io)** - Vector database with semantic search
- **[Vercel](https://vercel.com)** - Instant deployments
- **[W&B Weave](https://wandb.ai/site/weave)** - LLM observability
- **[Google ADK](https://cloud.google.com/agent-development-kit)** - Planned orchestration framework
- **[Marimo](https://marimo.io)** - Reactive Python notebooks
