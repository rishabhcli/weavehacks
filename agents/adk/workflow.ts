/**
 * Google ADK Workflow for QAgent
 * Declarative workflow definition using ADK primitives
 */

import {
  testerADKAgent,
  triageADKAgent,
  fixerADKAgent,
  verifierADKAgent,
} from './agents';
import type { TestSpec, Patch, FailureReport, DiagnosisReport } from '@/lib/types';

interface WorkflowContext {
  testSpec: TestSpec;
  maxIterations: number;
  currentIteration: number;
  patches: Patch[];
  success: boolean;
  _failure?: FailureReport;
  _diagnosis?: DiagnosisReport;
  _patch?: Patch;
}

interface WorkflowStep {
  name: string;
  agent: string;
  input: (ctx: WorkflowContext) => unknown;
  output: (result: unknown, ctx: WorkflowContext) => Partial<WorkflowContext>;
  condition?: (ctx: WorkflowContext) => boolean;
}

const agents = {
  TesterAgent: testerADKAgent,
  TriageAgent: triageADKAgent,
  FixerAgent: fixerADKAgent,
  VerifierAgent: verifierADKAgent,
};

export const patchPilotWorkflow: WorkflowStep[] = [
  {
    name: 'run_test',
    agent: 'TesterAgent',
    input: (ctx) => ({ spec: ctx.testSpec }),
    output: (result, ctx) => {
      const r = result as { passed: boolean; failure?: FailureReport };
      return {
        success: r.passed,
        _failure: r.failure,
      };
    },
    condition: (ctx) => !ctx.success,
  },
  {
    name: 'diagnose_failure',
    agent: 'TriageAgent',
    input: (ctx) => ({ failure: ctx._failure! }),
    output: (result) => {
      const r = result as { diagnosis: DiagnosisReport };
      return { _diagnosis: r.diagnosis };
    },
    condition: (ctx) => !ctx.success && !!ctx._failure,
  },
  {
    name: 'generate_patch',
    agent: 'FixerAgent',
    input: (ctx) => ({ diagnosis: ctx._diagnosis! }),
    output: (result, ctx) => {
      const r = result as { patch?: Patch; success: boolean };
      return {
        patches: r.patch ? [...ctx.patches, r.patch] : ctx.patches,
        _patch: r.patch,
      };
    },
    condition: (ctx) => !ctx.success && !!ctx._diagnosis,
  },
  {
    name: 'verify_fix',
    agent: 'VerifierAgent',
    input: (ctx) => ({
      patch: ctx._patch!,
      spec: ctx.testSpec,
    }),
    output: (result) => {
      const r = result as { success: boolean };
      return { success: r.success };
    },
    condition: (ctx) => !ctx.success && !!ctx._patch,
  },
];

export async function executeADKWorkflow(
  testSpec: TestSpec,
  maxIterations: number = 5
): Promise<{ success: boolean; patches: Patch[]; iterations: number }> {
  let context: WorkflowContext = {
    testSpec,
    maxIterations,
    currentIteration: 0,
    patches: [],
    success: false,
  };

  while (context.currentIteration < maxIterations && !context.success) {
    for (const step of patchPilotWorkflow) {
      if (step.condition && !step.condition(context)) {
        continue;
      }

      const agent = agents[step.agent as keyof typeof agents];
      if (!agent) continue;

      const input = step.input(context);
      const result = await agent.execute(input as never);
      const updates = step.output(result, context);
      context = { ...context, ...updates };

      if (context.success) break;
    }

    if (!context.success) {
      context = { ...context, currentIteration: context.currentIteration + 1 };
    }
  }

  return {
    success: context.success,
    patches: context.patches,
    iterations: context.currentIteration,
  };
}
