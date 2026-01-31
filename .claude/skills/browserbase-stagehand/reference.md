# Reference: Browserbase + Stagehand

Copy-paste code patterns for browser automation.

---

## Quick Start

```typescript
import { Browserbase } from '@browserbase/sdk';
import { Stagehand } from 'stagehand';

// Initialize
const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID
});

const stagehand = new Stagehand({
  browserbase,
  model: 'gpt-4'
});

await stagehand.init();

// Run test
await stagehand.act("Go to https://example.com");
await stagehand.assert("I see the homepage");

// Cleanup
await stagehand.close();
```

---

## Code Patterns

### Pattern 1: Basic Test Runner

**Use when:** Implementing the Tester Agent core loop

```typescript
import { Browserbase } from '@browserbase/sdk';
import { Stagehand } from 'stagehand';

interface TestSpec {
  id: string;
  name: string;
  steps: { action: string; expected?: string }[];
  url: string;
}

interface TestResult {
  passed: boolean;
  failedStep?: number;
  error?: string;
  screenshot?: string;
  duration: number;
}

async function runTest(spec: TestSpec): Promise<TestResult> {
  const startTime = Date.now();
  const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!
  });

  const stagehand = new Stagehand({ browserbase, model: 'gpt-4' });

  try {
    await stagehand.init();
    await stagehand.act(`Go to ${spec.url}`);

    for (let i = 0; i < spec.steps.length; i++) {
      const step = spec.steps[i];

      try {
        await stagehand.act(step.action);

        if (step.expected) {
          const passed = await stagehand.assert(step.expected);
          if (!passed) {
            const screenshot = await captureScreenshot(stagehand);
            return {
              passed: false,
              failedStep: i,
              error: `Assertion failed: ${step.expected}`,
              screenshot,
              duration: Date.now() - startTime
            };
          }
        }
      } catch (error) {
        const screenshot = await captureScreenshot(stagehand);
        return {
          passed: false,
          failedStep: i,
          error: error instanceof Error ? error.message : String(error),
          screenshot,
          duration: Date.now() - startTime
        };
      }
    }

    return {
      passed: true,
      duration: Date.now() - startTime
    };
  } finally {
    await stagehand.close();
  }
}

async function captureScreenshot(stagehand: Stagehand): Promise<string> {
  return await stagehand.page.screenshot({
    fullPage: true,
    encoding: 'base64'
  });
}
```

### Pattern 2: Failure Report Builder

**Use when:** Capturing detailed failure evidence

```typescript
interface FailureReport {
  testId: string;
  timestamp: Date;
  step: number;
  error: {
    message: string;
    stack?: string;
    type: string;
  };
  context: {
    url: string;
    screenshot: string;
    domSnapshot: string;
    consoleLogs: string[];
  };
}

async function buildFailureReport(
  stagehand: Stagehand,
  testId: string,
  step: number,
  error: Error
): Promise<FailureReport> {
  const page = stagehand.page;

  // Capture screenshot
  const screenshot = await page.screenshot({
    fullPage: true,
    encoding: 'base64'
  });

  // Capture DOM
  const domSnapshot = await page.content();

  // Get console logs (requires prior setup)
  const consoleLogs = await page.evaluate(() => {
    return (window as any).__consoleLogs || [];
  });

  return {
    testId,
    timestamp: new Date(),
    step,
    error: {
      message: error.message,
      stack: error.stack,
      type: error.name
    },
    context: {
      url: page.url(),
      screenshot,
      domSnapshot,
      consoleLogs
    }
  };
}
```

### Pattern 3: Console Log Capture Setup

**Use when:** Need to capture JavaScript console errors

```typescript
async function setupConsoleCapture(stagehand: Stagehand) {
  await stagehand.page.evaluate(() => {
    (window as any).__consoleLogs = [];
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };

    console.log = (...args) => {
      (window as any).__consoleLogs.push({
        type: 'log',
        message: args.map(String).join(' '),
        timestamp: Date.now()
      });
      originalConsole.log.apply(console, args);
    };

    console.error = (...args) => {
      (window as any).__consoleLogs.push({
        type: 'error',
        message: args.map(String).join(' '),
        timestamp: Date.now()
      });
      originalConsole.error.apply(console, args);
    };

    console.warn = (...args) => {
      (window as any).__consoleLogs.push({
        type: 'warn',
        message: args.map(String).join(' '),
        timestamp: Date.now()
      });
      originalConsole.warn.apply(console, args);
    };

    // Capture unhandled errors
    window.onerror = (msg, url, line, col, error) => {
      (window as any).__consoleLogs.push({
        type: 'uncaught',
        message: `${msg} at ${url}:${line}:${col}`,
        timestamp: Date.now()
      });
    };
  });
}
```

### Pattern 4: Test Spec Format

**Use when:** Defining test specifications

```typescript
const signupTestSpec: TestSpec = {
  id: 'test-signup-001',
  name: 'User Signup Flow',
  url: 'http://localhost:3000',
  steps: [
    { action: 'Click the Sign Up link' },
    { action: 'Type "test@example.com" into the email field' },
    { action: 'Type "password123" into the password field' },
    { action: 'Type "password123" into the confirm password field' },
    { action: 'Click the Create Account button' },
    { action: 'Wait for the page to load', expected: 'I see "Welcome" on the page' }
  ]
};

const checkoutTestSpec: TestSpec = {
  id: 'test-checkout-001',
  name: 'Checkout Flow',
  url: 'http://localhost:3000/cart',
  steps: [
    { action: 'Click the Checkout button' },
    { expected: 'I see the payment form' },
    { action: 'Type "4242424242424242" into the card number field' },
    { action: 'Click Pay Now' },
    { expected: 'I see "Order confirmed"' }
  ]
};
```

---

## Configuration Examples

### Basic Configuration

```typescript
const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!
});

const stagehand = new Stagehand({
  browserbase,
  model: 'gpt-4'
});
```

### Advanced Configuration

```typescript
const stagehand = new Stagehand({
  browserbase,
  model: 'gpt-4',
  verbose: true,  // Enable debug logging
  timeout: 30000, // 30 second timeout per action
});

// Custom viewport
await stagehand.init();
await stagehand.page.setViewportSize({
  width: 1280,
  height: 720
});
```

---

## Common Commands

```bash
# Install dependencies
pnpm add @browserbase/sdk stagehand

# Check types
pnpm tsc --noEmit

# Run specific test
pnpm run test:e2e -- --grep "checkout"
```

---

## Troubleshooting

### Issue: Session timeout

**Symptom:** Test fails with "Session closed" error

**Solution:**
```typescript
// Increase timeout in stagehand config
const stagehand = new Stagehand({
  browserbase,
  model: 'gpt-4',
  timeout: 60000  // 60 seconds
});
```

### Issue: Element not found

**Symptom:** "Could not find element" error

**Solution:**
```typescript
// Be more specific in the action description
// Bad:
await stagehand.act("Click button");
// Good:
await stagehand.act("Click the blue Submit button at the bottom of the form");
```

### Issue: Flaky assertions

**Symptom:** Assertion sometimes passes, sometimes fails

**Solution:**
```typescript
// Add explicit wait before assertion
await stagehand.act("Wait for the page to finish loading");
await stagehand.assert("I see the welcome message");
```

---

## Cheat Sheet

| Task | Code |
|------|------|
| Initialize | `await stagehand.init()` |
| Navigate | `await stagehand.act("Go to URL")` |
| Click | `await stagehand.act("Click the button")` |
| Type | `await stagehand.act("Type 'text' into field")` |
| Assert | `await stagehand.assert("I see text")` |
| Screenshot | `await stagehand.page.screenshot()` |
| Get DOM | `await stagehand.page.content()` |
| Close | `await stagehand.close()` |
