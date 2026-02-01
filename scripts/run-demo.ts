#!/usr/bin/env tsx
/**
 * PatchPilot Demo Script
 *
 * Runs the complete PatchPilot demonstration:
 * 1. Shows the 3 known bugs in the demo app
 * 2. Runs the self-healing loop to fix them
 * 3. Displays progress and results
 *
 * Usage:
 *   pnpm run demo           # Full demo
 *   pnpm run demo --dry-run # Show what would happen without running
 *   pnpm run demo --quick   # Run with fewer iterations
 */

// Load environment variables from .env.local
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

import { Orchestrator } from '@/agents/orchestrator';
import { allTestSpecs } from '@/tests/e2e/specs';
import { initWeave } from '@/lib/weave';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
};

function printBanner() {
  console.log(`
${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██████╗  █████╗ ████████╗ ██████╗██╗  ██╗██████╗ ██╗██╗      ██████╗ ████████╗ ║
║   ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝ ║
║   ██████╔╝███████║   ██║   ██║     ███████║██████╔╝██║██║     ██║   ██║   ██║    ║
║   ██╔═══╝ ██╔══██║   ██║   ██║     ██╔══██║██╔═══╝ ██║██║     ██║   ██║   ██║    ║
║   ██║     ██║  ██║   ██║   ╚██████╗██║  ██║██║     ██║███████╗╚██████╔╝   ██║    ║
║   ╚═╝     ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝    ║
║                                                                           ║
║                   🤖 Self-Healing QA Agent Demo 🔧                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
${colors.reset}
`);
}

function printBugs() {
  console.log(`${colors.yellow}${colors.bright}
═══════════════════════════════════════════════════════════════════════════
                          📋 KNOWN BUGS IN DEMO APP
═══════════════════════════════════════════════════════════════════════════${colors.reset}

${colors.red}Bug 1: Missing onClick Handler${colors.reset}
   📁 File: app/cart/page.tsx:109
   📝 The checkout button is missing its onClick={handleCheckout} handler
   ⚡ Effect: Clicking checkout does nothing

${colors.red}Bug 2: Non-Existent API Route${colors.reset}
   📁 File: app/api/checkout/route.ts:23
   📝 Calls /api/payments which doesn't exist
   ⚡ Effect: Checkout fails with "Payment processing failed"

${colors.red}Bug 3: Null Reference Error${colors.reset}
   📁 File: app/signup/page.tsx:64
   📝 Accesses userData.preferences.newsletter when preferences is undefined
   ⚡ Effect: Signup crashes with TypeError

`);
}

function printTechStack() {
  console.log(`${colors.magenta}${colors.bright}
═══════════════════════════════════════════════════════════════════════════
                          🛠️  TECHNOLOGY STACK
═══════════════════════════════════════════════════════════════════════════${colors.reset}

   ${colors.blue}Browserbase + Stagehand${colors.reset}  →  AI-powered browser testing in the cloud
   ${colors.blue}Redis${colors.reset}                    →  Vector knowledge base for learning patterns
   ${colors.blue}Vercel${colors.reset}                   →  Instant deployment after fixes
   ${colors.blue}W&B Weave${colors.reset}                →  Tracing and observability
   ${colors.blue}Google ADK${colors.reset}               →  Multi-agent orchestration
   ${colors.blue}Marimo${colors.reset}                   →  Interactive analytics dashboard

`);
}

function printPhases() {
  console.log(`${colors.cyan}${colors.bright}
═══════════════════════════════════════════════════════════════════════════
                          📊 THE PATCHPILOT LOOP
═══════════════════════════════════════════════════════════════════════════${colors.reset}

   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  TESTER  │───▶│  TRIAGE  │───▶│  FIXER   │───▶│ VERIFIER │
   │  Agent   │    │  Agent   │    │  Agent   │    │  Agent   │
   └──────────┘    └──────────┘    └──────────┘    └──────────┘
        │                                               │
        │              ┌──────────────┐                 │
        │              │    Redis     │◀────────────────┘
        │              │ (Learning)   │
        │              └──────────────┘
        │                    │
        ▼                    ▼
   ┌─────────────────────────────────────────────────────────┐
   │                   W&B Weave (Logging)                   │
   └─────────────────────────────────────────────────────────┘

   ${colors.green}1. TEST${colors.reset}    - Run E2E tests with Browserbase/Stagehand
   ${colors.yellow}2. DETECT${colors.reset}  - Capture failures with screenshots & DOM state
   ${colors.blue}3. TRIAGE${colors.reset}  - Diagnose failure, query Redis for similar bugs
   ${colors.magenta}4. FIX${colors.reset}     - Generate patch with LLM + past patterns
   ${colors.cyan}5. VERIFY${colors.reset}  - Apply patch, deploy to Vercel, re-test
   ${colors.green}6. LEARN${colors.reset}   - Store successful fix in Redis

`);
}

async function runDemo(options: { dryRun: boolean; quick: boolean }) {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
  const maxIterations = options.quick ? 2 : 5;

  printBanner();

  console.log(`${colors.white}${colors.bright}
Demo Configuration:
   Target URL:      ${targetUrl}
   Max Iterations:  ${maxIterations}
   Mode:            ${options.dryRun ? 'DRY RUN (no actual changes)' : 'LIVE'}
   Tests:           ${allTestSpecs.length}
${colors.reset}`);

  printBugs();
  printTechStack();
  printPhases();

  if (options.dryRun) {
    console.log(`${colors.yellow}${colors.bright}
═══════════════════════════════════════════════════════════════════════════
                          🔍 DRY RUN MODE
═══════════════════════════════════════════════════════════════════════════

This is a dry run. In a live demo, PatchPilot would:

1. Start Browserbase session and run tests
2. Detect the 3 failing tests
3. For each failure:
   - Capture screenshot and error details
   - Analyze with Triage Agent
   - Query Redis for similar past bugs
   - Generate fix with Fixer Agent
   - Apply patch and deploy to Vercel
   - Re-run test to verify fix
4. Store successful fixes in Redis
5. Display results in Marimo dashboard

Expected outcome: All 3 bugs fixed in ~5 iterations total

${colors.green}Demo script ready! Run without --dry-run to execute live.${colors.reset}
`);
    process.exit(0);
  }

  // Initialize Weave for tracing
  console.log(`${colors.blue}Initializing W&B Weave for observability...${colors.reset}`);
  await initWeave('patchpilot-demo');

  console.log(`${colors.green}${colors.bright}
═══════════════════════════════════════════════════════════════════════════
                          🚀 STARTING PATCHPILOT
═══════════════════════════════════════════════════════════════════════════
${colors.reset}`);

  const orchestrator = new Orchestrator();

  const startTime = Date.now();
  const result = await orchestrator.run({
    maxIterations,
    testSpecs: allTestSpecs,
    targetUrl,
  });
  const duration = (Date.now() - startTime) / 1000;

  // Print final results
  console.log(`${colors.bright}
═══════════════════════════════════════════════════════════════════════════
                          📊 DEMO RESULTS
═══════════════════════════════════════════════════════════════════════════
${colors.reset}`);

  if (result.success) {
    console.log(`${colors.bgGreen}${colors.white}${colors.bright}
   ✅ ALL BUGS FIXED SUCCESSFULLY!
${colors.reset}`);
  } else {
    console.log(`${colors.bgRed}${colors.white}${colors.bright}
   ⚠️  SOME BUGS REMAIN UNFIXED
${colors.reset}`);
  }

  console.log(`
   Tests:       ${allTestSpecs.length}
   Iterations:  ${result.iterations}
   Patches:     ${result.patches.length}
   Duration:    ${duration.toFixed(1)}s
`);

  if (result.patches.length > 0) {
    console.log(`${colors.cyan}Patches Applied:${colors.reset}`);
    for (const patch of result.patches) {
      console.log(`   📝 ${patch.file}: ${patch.description}`);
    }
  }

  console.log(`
${colors.magenta}Next Steps:${colors.reset}
   • View traces in W&B Weave: https://wandb.ai/weave/patchpilot-demo
   • Open Marimo dashboard:    pnpm run dashboard
   • View the fixed app:       ${targetUrl}
`);

  return result;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run') || args.includes('-d'),
  quick: args.includes('--quick') || args.includes('-q'),
};

// Run the demo
runDemo(options)
  .then((result) => {
    if (result && !result.success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(`${colors.red}Demo failed:${colors.reset}`, error);
    process.exit(1);
  });
