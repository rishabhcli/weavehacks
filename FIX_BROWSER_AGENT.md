# Fix Tester Agent — Browserbase + Stagehand Integration

## Problem

The Tester Agent currently creates a Browserbase session and navigates to the target app URL, but then **performs zero interactions**. No clicks, no form fills, no assertions, no test execution. The browser session is being created and immediately wasted.

## Objective

Fix the Tester Agent (`agents/tester/`) and the Browserbase integration layer (`lib/browserbase/`) so that the agent **actively executes E2E user-flow tests** against the demo app using Stagehand actions inside a live Browserbase session.

## Required Documentation (Pull Before Coding)

Read and reference the following before making any changes:

- **Stagehand SDK docs** — `act()`, `extract()`, `observe()` API methods. Understand how to chain AI-powered browser actions (clicks, fills, navigations) using natural-language selectors.
- **Browserbase session lifecycle** — Session creation, `connectUrl`, context reuse, keep-alive, session completion/teardown. Ensure the session stays alive through the full test run.
- **Browserbase + Stagehand quickstart** — The canonical pattern for initializing a `Stagehand` instance with a Browserbase `browserWSEndpoint` so actions execute in the cloud browser, not locally.
- **Project skill: `.claude/skills/browserbase-stagehand/`** — Project-specific patterns, helpers, and conventions already established for this codebase.
- **Project skill: `.claude/skills/qagent-agents/`** — How agents are structured, how they return results to the orchestrator, and how failures propagate.

## Root Cause Investigation

Inspect the following and identify why the agent idles after navigation:

1. **`agents/tester/`** — Is `stagehand.act()` / `stagehand.observe()` / `stagehand.extract()` actually being called after page load? Or does the test flow end after `page.goto()`?
2. **`lib/browserbase/`** — Is `connectUrl` being passed correctly to Stagehand's `browserWSEndpoint`? Is the Browserbase session actually connected, or is Stagehand falling back to a local/headless instance that silently fails?
3. **Session timeout** — Is the Browserbase session being closed or timing out before Stagehand actions can execute? Check for premature `session.close()` or missing `keepAlive` config.
4. **Await / async flow** — Are Stagehand action calls properly `await`ed? A missing `await` on `act()` or `observe()` would cause the agent to skip past all interactions and exit.
5. **Environment variables** — Confirm `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are loaded and passed to the session constructor. A silent auth failure could produce a connected-but-inert session.
6. **Error swallowing** — Check for `try/catch` blocks that silently catch Stagehand action errors and return success instead of propagating failures.

## Implementation Requirements

1. **Stagehand must execute real actions** — After navigating to the target URL, the agent must call `stagehand.act()` with natural-language instructions (e.g., `"click the sign-up button"`, `"fill in the email field with test@example.com"`) to simulate actual user flows.
2. **`observe()` before `act()`** — Use `stagehand.observe()` to identify available interactive elements on the page before issuing actions. This prevents blind clicks and gives the agent context about the current page state.
3. **`extract()` for assertions** — After performing actions, use `stagehand.extract()` to pull page content and validate expected outcomes (e.g., success messages, redirected URLs, rendered data).
4. **Failure detection must be real** — A test "passes" only if `extract()` confirms the expected outcome. A test "fails" if the outcome doesn't match or if any Stagehand action throws. Do not silently swallow errors.
5. **Session cleanup** — Always close the Browserbase session in a `finally` block, whether tests pass or fail.
6. **Structured results** — The Tester Agent must return structured test results (pass/fail, failure screenshots, reproduction steps, error messages) to the orchestrator so the Triage Agent can consume them.
7. **Weave logging** — All Stagehand actions (`act`, `observe`, `extract`) and their results must be logged to W&B Weave per project conventions.

## Test Flows to Verify Fix

After fixing, the agent should be able to execute at minimum:

- **Navigation flow** — Load homepage → verify key elements render
- **Form submission flow** — Fill form → submit → verify success/error state
- **Click-through flow** — Click CTA → verify navigation to expected page

## Acceptance Criteria

- [ ] Browserbase session connects and Stagehand actions execute inside it (not locally)
- [ ] Agent performs at least 3 distinct `act()` calls per test run
- [ ] Agent uses `observe()` to read page state before acting
- [ ] Agent uses `extract()` to assert outcomes after acting
- [ ] Failures are detected, captured with context, and returned to orchestrator
- [ ] Sessions are properly torn down after completion
- [ ] All actions are logged to Weave
