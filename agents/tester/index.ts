/**
 * Tester Agent
 *
 * Executes E2E tests using Browserbase and Stagehand.
 * Captures detailed failure reports including screenshots, DOM state, and console logs.
 *
 * Instrumented with W&B Weave for observability.
 */

import { Stagehand, type Page } from '@browserbasehq/stagehand';
import type { TestSpec, TestResult, FailureReport, ConsoleLog } from '@/lib/types';
import { op, isWeaveEnabled } from '@/lib/weave';

export class TesterAgent {
  private stagehand: Stagehand | null = null;
  private consoleLogs: ConsoleLog[] = [];
  private sessionId: string | null = null;

  /**
   * Initialize Stagehand with Browserbase
   */
  async init(): Promise<void> {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    const projectId = process.env.BROWSERBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
      throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required');
    }

    // Use Gemini if GOOGLE_API_KEY is set, otherwise fall back to OpenAI
    const useGemini = !!process.env.GOOGLE_API_KEY;

    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey,
      projectId,
      model: useGemini
        ? {
            modelName: 'gemini-2.0-flash',
            apiKey: process.env.GOOGLE_API_KEY,
          }
        : {
            modelName: 'gpt-4o',
            apiKey: process.env.OPENAI_API_KEY,
          },
      verbose: process.env.DEBUG === 'true' ? 1 : 0,
    });

    await this.stagehand.init();

    // Capture the Browserbase session ID for live viewing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.sessionId = (this.stagehand as any).browserbaseSessionID || null;
  }

  /**
   * Get the current Browserbase session ID for live debugging
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get the current page from stagehand context
   */
  private getPage(): Page {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }
    const pages = this.stagehand.context.pages();
    return pages[0];
  }

  /**
   * Run a test specification
   * Traced by W&B Weave for observability
   */
  runTest = isWeaveEnabled()
    ? op(this._runTest.bind(this), { name: 'TesterAgent.runTest' })
    : this._runTest.bind(this);

  private async _runTest(spec: TestSpec): Promise<TestResult> {
    if (!this.stagehand) {
      await this.init();
    }

    const startTime = Date.now();
    this.consoleLogs = [];

    try {
      const page = this.getPage();

      // Navigate to the test URL
      await page.goto(spec.url, {
        waitUntil: 'networkidle',
        timeoutMs: spec.timeout || 30000,
      });

      // Execute each test step
      for (let stepIndex = 0; stepIndex < spec.steps.length; stepIndex++) {
        const step = spec.steps[stepIndex];

        try {
          // Execute the action using Stagehand's act method
          await this.stagehand!.act(step.action, {
            timeout: step.timeout || 10000,
          });

          // Check assertion if present
          if (step.expected) {
            // Use observe to check if the expected state is visible
            const observations = await this.stagehand!.observe(step.expected);

            // If observe returns empty or no relevant observations, check page content
            if (!observations || observations.length === 0) {
              // Try a more explicit check by looking at page content
              const pageContent = await page.evaluate(() => document.body.innerText);
              const expectedText = step.expected
                .toLowerCase()
                .replace(/i see /i, '')
                .replace(/"/g, '')
                .trim();

              const passed = pageContent.toLowerCase().includes(expectedText);

              if (!passed) {
                const failureReport = await this.buildFailureReport(
                  spec.id,
                  stepIndex,
                  new Error(`Assertion failed: ${step.expected}`)
                );

                return {
                  passed: false,
                  duration: Date.now() - startTime,
                  failureReport,
                };
              }
            }
          }
        } catch (stepError) {
          const failureReport = await this.buildFailureReport(
            spec.id,
            stepIndex,
            stepError instanceof Error ? stepError : new Error(String(stepError))
          );

          return {
            passed: false,
            duration: Date.now() - startTime,
            failureReport,
          };
        }
      }

      // All steps passed
      return {
        passed: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const failureReport = await this.buildFailureReport(
        spec.id,
        -1, // General error, not specific to a step
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        passed: false,
        duration: Date.now() - startTime,
        failureReport,
      };
    }
  }

  /**
   * Build a detailed failure report
   */
  private async buildFailureReport(
    testId: string,
    step: number,
    error: Error
  ): Promise<FailureReport> {
    let screenshot = '';
    let domSnapshot = '';
    let url = '';

    try {
      if (this.stagehand) {
        const page = this.getPage();

        // Capture screenshot using Stagehand's CDP-based page
        const buffer = await page.screenshot({
          fullPage: true,
          type: 'png',
        });
        screenshot = buffer.toString('base64');

        // Capture DOM
        domSnapshot = await page.evaluate(() => document.documentElement.outerHTML);

        // Get current URL
        url = await page.evaluate(() => window.location.href);
      }
    } catch (captureError) {
      // Continue even if capture fails
      console.error('Failed to capture failure evidence:', captureError);
    }

    return {
      testId,
      timestamp: new Date(),
      step,
      error: {
        message: error.message,
        stack: error.stack || '',
        type: error.name,
      },
      context: {
        url,
        screenshot,
        domSnapshot,
        consoleLogs: [...this.consoleLogs],
      },
    };
  }

  /**
   * Close the browser session
   */
  async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      this.stagehand = null;
    }
  }
}

export default TesterAgent;
