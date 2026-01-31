/**
 * Unit tests for Fixer Agent
 * Tests patch validation logic without requiring API calls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFileContent = `'use client';
import { useState } from 'react';

export default function CartPage() {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    // checkout logic
  };

  return (
    <button
      id="checkout-button"
      disabled={isCheckingOut}
    >
      Checkout
    </button>
  );
}`;

const mockCreateCompletions = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: JSON.stringify({
          file: 'app/cart/page.tsx',
          startLine: 12,
          endLine: 16,
          newCode: '    <button\n      id="checkout-button"\n      disabled={isCheckingOut}\n      onClick={() => handleCheckout()}\n    >',
          description: 'Add onClick handler to checkout button',
        }),
      },
    },
  ],
});

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateCompletions,
        },
      },
    })),
  };
});

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockImplementation(() => mockFileContent),
  writeFileSync: vi.fn(),
  copyFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { FixerAgent } from '@/agents/fixer';
import type { DiagnosisReport } from '@/lib/types';

describe('FixerAgent', () => {
  let fixerAgent: FixerAgent;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    // Disable Redis for unit tests (second param = useRedis)
    fixerAgent = new FixerAgent('/test/project', false);
    vi.clearAllMocks();
  });

  describe('Patch Generation', () => {
    const mockDiagnosis: DiagnosisReport = {
      failureId: 'test-001',
      failureType: 'UI_BUG',
      rootCause: 'Checkout button missing onClick handler',
      localization: {
        file: 'app/cart/page.tsx',
        startLine: 90,
        endLine: 95,
        codeSnippet: '<button id="checkout-button">Checkout</button>',
      },
      similarIssues: [],
      suggestedFix: 'Add onClick={() => handleCheckout()} to the button',
      confidence: 0.9,
    };

    it('should generate patch for valid diagnosis', async () => {
      const result = await fixerAgent.generatePatch(mockDiagnosis);

      expect(result.success).toBe(true);
      expect(result.patch).toBeDefined();
      expect(result.patch?.file).toBe('app/cart/page.tsx');
      expect(result.patch?.description).toBe('Add onClick handler to checkout button');
    });

    it('should include diff in patch', async () => {
      const result = await fixerAgent.generatePatch(mockDiagnosis);

      expect(result.patch?.diff).toContain('--- a/app/cart/page.tsx');
      expect(result.patch?.diff).toContain('+++ b/app/cart/page.tsx');
      expect(result.patch?.diff).toContain('@@');
    });

    it('should generate unique patch IDs', async () => {
      const result1 = await fixerAgent.generatePatch(mockDiagnosis);
      const result2 = await fixerAgent.generatePatch(mockDiagnosis);

      expect(result1.patch?.id).not.toBe(result2.patch?.id);
    });
  });

  describe('Patch Validation', () => {
    it('should reject patches with dangerous patterns - rm -rf', async () => {
      const diagnosis: DiagnosisReport = {
        failureId: 'test-001',
        failureType: 'UI_BUG',
        rootCause: 'Test',
        localization: {
          file: 'test.ts',
          startLine: 1,
          endLine: 1,
          codeSnippet: 'const x = 1;',
        },
        similarIssues: [],
        suggestedFix: 'Fix it',
        confidence: 0.5,
      };

      // Mock a dangerous response for this test
      mockCreateCompletions.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                file: 'test.ts',
                startLine: 1,
                endLine: 1,
                newCode: 'exec("rm -rf /")',
                description: 'Malicious patch',
              }),
            },
          },
        ],
      });

      const agent = new FixerAgent('/test', false);
      const result = await agent.generatePatch(diagnosis);

      // Should be rejected by validation
      expect(result.success).toBe(false);
      expect(result.error).toContain('dangerous');
    });
  });

  describe('Diff Generation', () => {
    it('should generate valid unified diff format', async () => {
      const mockDiagnosis: DiagnosisReport = {
        failureId: 'test-001',
        failureType: 'UI_BUG',
        rootCause: 'Missing handler',
        localization: {
          file: 'app/test.tsx',
          startLine: 5,
          endLine: 5,
          codeSnippet: '<button>Click</button>',
        },
        similarIssues: [],
        suggestedFix: 'Add handler',
        confidence: 0.8,
      };

      const result = await fixerAgent.generatePatch(mockDiagnosis);

      if (result.patch?.diff) {
        // Check diff header format
        expect(result.patch.diff).toMatch(/^--- a\//m);
        expect(result.patch.diff).toMatch(/^\+\+\+ b\//m);
        expect(result.patch.diff).toMatch(/^@@ -\d+,\d+ \+\d+,\d+ @@/m);
      }
    });
  });
});
