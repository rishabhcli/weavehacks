/**
 * Google ADK Agent Definitions
 * Wraps existing agents in ADK-compatible interfaces
 */

import { TesterAgent } from '../tester';
import { TriageAgent } from '../triage';
import { FixerAgent } from '../fixer';
import { VerifierAgent } from '../verifier';
import type {
  TestSpec,
  FailureReport,
  DiagnosisReport,
  Patch,
} from '@/lib/types';

interface ADKAgent<TInput, TOutput> {
  name: string;
  description: string;
  execute: (input: TInput) => Promise<TOutput>;
}

export const testerADKAgent: ADKAgent<
  { spec: TestSpec },
  { passed: boolean; failure?: FailureReport }
> = {
  name: 'TesterAgent',
  description: 'Runs E2E tests using Browserbase and Stagehand',
  execute: async (input) => {
    const agent = new TesterAgent();
    await agent.init();
    const result = await agent.runTest(input.spec);
    return {
      passed: result.passed,
      failure: result.failureReport,
    };
  },
};

export const triageADKAgent: ADKAgent<
  { failure: FailureReport },
  { diagnosis: DiagnosisReport }
> = {
  name: 'TriageAgent',
  description: 'Diagnoses test failures and identifies root cause',
  execute: async (input) => {
    const agent = new TriageAgent();
    const diagnosis = await agent.diagnose(input.failure);
    return { diagnosis };
  },
};

export const fixerADKAgent: ADKAgent<
  { diagnosis: DiagnosisReport },
  { patch?: Patch; success: boolean }
> = {
  name: 'FixerAgent',
  description: 'Generates code patches using LLM and knowledge base',
  execute: async (input) => {
    const agent = new FixerAgent();
    const result = await agent.generatePatch(input.diagnosis);
    return {
      patch: result.patch,
      success: result.success,
    };
  },
};

export const verifierADKAgent: ADKAgent<
  { patch: Patch; spec: TestSpec },
  { success: boolean; deploymentUrl?: string }
> = {
  name: 'VerifierAgent',
  description: 'Applies patches, deploys to Vercel, and re-runs tests',
  execute: async (input) => {
    const agent = new VerifierAgent();
    const result = await agent.verify(input.patch, input.spec);
    return {
      success: result.success,
      deploymentUrl: result.deploymentUrl,
    };
  },
};
