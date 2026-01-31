# Phase 1: Test Environment

**Focus:** Browserbase + Stagehand integration and Tester Agent implementation

**Status:** Pending (requires Phase 0 completion)

---

## Overview

Phase 1 establishes the testing infrastructure using Browserbase for cloud browser sessions and Stagehand for AI-powered browser automation. The primary deliverable is a fully functional Tester Agent that can run E2E tests and capture detailed failure reports.

---

## Skills to Load

```
.claude/skills/browserbase-stagehand/
├── SKILL.md      # Concepts, when to use, best practices
└── reference.md  # Copy-paste code patterns
```

---

## Ralph Loop Template

```
## Ralph Loop - Phase 1 - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for project context
- [ ] Check TASKS.md for Phase 1 tasks
- [ ] Load browserbase-stagehand skill
- [ ] Review TesterAgent interface in DESIGN.md

### 2. ANALYZE
- Current task: [Task ID and description]
- Browserbase status: [Connected/Not configured]
- Test specs needed: [List of flows to test]

### 3. PLAN
Increments for this iteration:
1. [Specific deliverable 1]
2. [Specific deliverable 2]
3. [Specific deliverable 3]

### 4. EXECUTE
[Implement one increment at a time]

### 5. VALIDATE
- [ ] Browserbase session creates successfully
- [ ] Stagehand executes actions
- [ ] Tests detect planted bugs
- [ ] Failure reports are complete

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit working code
- [ ] Log to Weave (if available)
- [ ] Continue to next task or end iteration
```

---

## Tasks

### P1.1: Browserbase SDK Setup
- [ ] Install @browserbase/sdk
- [ ] Configure API key and project ID
- [ ] Test session creation
- [ ] Verify session cleanup on close

### P1.2: Stagehand Integration
- [ ] Install stagehand package
- [ ] Configure with Browserbase
- [ ] Test basic navigation
- [ ] Test click and type actions
- [ ] Test assertions

### P1.3: Test Specifications
Create test specs for each flow:

**Signup Flow Test:**
```typescript
const signupTest: TestSpec = {
  id: 'signup-001',
  name: 'User Signup Flow',
  url: '${APP_URL}/signup',
  steps: [
    { action: 'Type email into the email field', expected: 'Email field is filled' },
    { action: 'Type password into the password field' },
    { action: 'Click the signup button' },
    { action: 'Wait for navigation', expected: 'User is on the dashboard' }
  ]
};
```

**Checkout Flow Test:**
```typescript
const checkoutTest: TestSpec = {
  id: 'checkout-001',
  name: 'Checkout Flow',
  url: '${APP_URL}/products',
  steps: [
    { action: 'Click Add to Cart on the first product' },
    { action: 'Navigate to the cart page' },
    { action: 'Click the Checkout button', expected: 'Checkout modal appears' },
    { action: 'Fill in payment details' },
    { action: 'Click Pay Now', expected: 'Order confirmation is shown' }
  ]
};
```

### P1.4: Tester Agent Implementation
- [ ] Create TesterAgent class
- [ ] Implement runTest(spec) method
- [ ] Add failure capture logic
- [ ] Build structured FailureReport
- [ ] Add Weave tracing decorator

### P1.5: Failure Capture System
On test failure, capture:
- [ ] Screenshot (full page, base64)
- [ ] DOM snapshot (page.content())
- [ ] Console logs (if available)
- [ ] Network requests (if relevant)
- [ ] Current URL
- [ ] Step number that failed
- [ ] Error message and stack trace

### P1.6: Verify Bug Detection
Run tests against demo app and verify:
- [ ] Test detects Bug 1 (missing onClick)
- [ ] Test detects Bug 2 (wrong API route)
- [ ] Test detects Bug 3 (null reference)
- [ ] Failure reports have actionable info

---

## Tester Agent Interface

```typescript
interface TesterAgent {
  runTest(spec: TestSpec): Promise<TestResult>;
}

interface TestSpec {
  id: string;
  name: string;
  url: string;
  steps: TestStep[];
}

interface TestStep {
  action: string;        // Natural language action
  expected?: string;     // Optional assertion
  timeout?: number;      // Step timeout in ms
}

interface TestResult {
  passed: boolean;
  duration: number;
  failureReport?: FailureReport;
}

interface FailureReport {
  testId: string;
  timestamp: Date;
  step: number;
  error: {
    message: string;
    stack: string;
    type: string;
  };
  context: {
    url: string;
    screenshot: string;      // Base64
    domSnapshot: string;     // HTML
    consoleLogs: string[];
  };
}
```

---

## Validation Checklist

### Browserbase
- [ ] Session creates with valid credentials
- [ ] Browser is accessible via CDP
- [ ] Session closes cleanly
- [ ] No zombie sessions left

### Stagehand
- [ ] `stagehand.act()` executes actions
- [ ] `stagehand.assert()` checks conditions
- [ ] Natural language actions work reliably
- [ ] Timeouts are configurable

### Tester Agent
- [ ] Executes all steps in sequence
- [ ] Captures failure at correct step
- [ ] Screenshot is valid image data
- [ ] DOM snapshot is complete HTML
- [ ] Error info is structured

### Bug Detection
- [ ] Checkout test fails on Bug 1
- [ ] Payment test fails on Bug 2
- [ ] Cart test fails on Bug 3
- [ ] All failure reports are actionable

---

## Common Issues

### Session Creation Fails
```
Error: Browserbase API key invalid
```
- Check BROWSERBASE_API_KEY in .env
- Verify project ID is correct
- Check API quota

### Stagehand Action Fails
```
Error: Could not find element for action
```
- Make action description more specific
- Add explicit wait before action
- Check if page fully loaded

### Screenshot Capture Fails
```
Error: Protocol error (Page.captureScreenshot)
```
- Page may have navigated away
- Add try/catch with fallback
- Capture before any navigation

---

## Exit Criteria

Phase 1 is complete when:

1. Browserbase integration works reliably
2. Stagehand executes natural language actions
3. TesterAgent class is implemented
4. All 3 test specs are written
5. Tests correctly detect all 3 planted bugs
6. Failure reports contain actionable information
7. All code is committed and tested

---

## Next Phase

Upon completion, proceed to **Phase 2: Core PatchPilot Loop** where we implement the Triage, Fixer, and Verifier agents.

---

## References

- [.claude/skills/browserbase-stagehand/SKILL.md](../.claude/skills/browserbase-stagehand/SKILL.md)
- [.claude/skills/browserbase-stagehand/reference.md](../.claude/skills/browserbase-stagehand/reference.md)
- [docs/DESIGN.md](../docs/DESIGN.md) - TesterAgent specification
- [Browserbase Docs](https://docs.browserbase.com/)
- [Stagehand Docs](https://www.stagehand.dev/)
