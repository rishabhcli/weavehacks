/**
 * Unit tests for Triage Agent
 * Tests failure classification logic without requiring API calls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI before importing TriageAgent
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    rootCause: 'Mock root cause',
                    suggestedFix: 'Mock suggested fix',
                    confidence: 0.85,
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

// Import after mocking
import { TriageAgent } from '@/agents/triage';
import type { FailureReport, FailureType } from '@/lib/types';

describe('TriageAgent', () => {
  let triageAgent: TriageAgent;

  beforeEach(() => {
    // Set required env var
    process.env.OPENAI_API_KEY = 'test-key';
    // Disable Redis for unit tests (second param = useRedis)
    triageAgent = new TriageAgent('/test/project', false);
  });

  describe('Failure Classification', () => {
    const createFailureReport = (
      errorMessage: string,
      errorType: string = 'Error'
    ): FailureReport => ({
      testId: 'test-001',
      timestamp: new Date(),
      step: 1,
      error: {
        message: errorMessage,
        stack: '',
        type: errorType,
      },
      context: {
        url: 'http://localhost:3000',
        screenshot: '',
        domSnapshot: '',
        consoleLogs: [],
      },
    });

    it('should classify missing onClick as UI_BUG', async () => {
      const failure = createFailureReport('Button has no onClick handler');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('UI_BUG');
    });

    it('should classify element not found as UI_BUG', async () => {
      const failure = createFailureReport('Could not find element for action');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('UI_BUG');
    });

    it('should classify 404 errors as BACKEND_ERROR', async () => {
      const failure = createFailureReport('API returned 404 Not Found');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('BACKEND_ERROR');
    });

    it('should classify 500 errors as BACKEND_ERROR', async () => {
      const failure = createFailureReport('Internal server error 500');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('BACKEND_ERROR');
    });

    it('should classify fetch errors as BACKEND_ERROR', async () => {
      const failure = createFailureReport('fetch failed: network error');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('BACKEND_ERROR');
    });

    it('should classify null reference as DATA_ERROR', async () => {
      const failure = createFailureReport(
        "Cannot read properties of undefined (reading 'newsletter')",
        'TypeError'
      );
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('DATA_ERROR');
    });

    it('should classify undefined access as DATA_ERROR', async () => {
      const failure = createFailureReport('undefined is not an object');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('DATA_ERROR');
    });

    it('should classify timeout as TEST_FLAKY', async () => {
      const failure = createFailureReport('Timeout waiting for element');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('TEST_FLAKY');
    });

    it('should classify unknown errors as UNKNOWN', async () => {
      const failure = createFailureReport('Some random error message');
      const diagnosis = await triageAgent.diagnose(failure);
      expect(diagnosis.failureType).toBe('UNKNOWN');
    });
  });

  describe('Diagnosis Report Structure', () => {
    it('should return complete diagnosis report', async () => {
      const failure: FailureReport = {
        testId: 'test-checkout-001',
        timestamp: new Date(),
        step: 2,
        error: {
          message: 'Button click did nothing',
          stack: 'Error: Button click did nothing\n    at /app/cart/page.tsx:45:10',
          type: 'Error',
        },
        context: {
          url: 'http://localhost:3000/cart',
          screenshot: 'base64...',
          domSnapshot: '<html>...</html>',
          consoleLogs: [{ type: 'error', message: 'No handler', timestamp: Date.now() }],
        },
      };

      const diagnosis = await triageAgent.diagnose(failure);

      expect(diagnosis).toHaveProperty('failureId');
      expect(diagnosis).toHaveProperty('failureType');
      expect(diagnosis).toHaveProperty('rootCause');
      expect(diagnosis).toHaveProperty('localization');
      expect(diagnosis).toHaveProperty('similarIssues');
      expect(diagnosis).toHaveProperty('suggestedFix');
      expect(diagnosis).toHaveProperty('confidence');

      expect(diagnosis.localization).toHaveProperty('file');
      expect(diagnosis.localization).toHaveProperty('startLine');
      expect(diagnosis.localization).toHaveProperty('endLine');
      expect(diagnosis.localization).toHaveProperty('codeSnippet');
    });

    it('should infer file from URL path', async () => {
      const cartFailure: FailureReport = {
        testId: 'test-001',
        timestamp: new Date(),
        step: 1,
        error: { message: 'Error', stack: '', type: 'Error' },
        context: {
          url: 'http://localhost:3000/cart',
          screenshot: '',
          domSnapshot: '',
          consoleLogs: [],
        },
      };

      const diagnosis = await triageAgent.diagnose(cartFailure);
      expect(diagnosis.localization.file).toContain('cart');
    });
  });
});
