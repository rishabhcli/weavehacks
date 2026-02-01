/**
 * Weave Models for QAgent Agents
 *
 * Defines agents as Weave Models for proper versioning, comparison,
 * and evaluation tracking. Each agent's core method is a Model.predict().
 */

import { weave, isWeaveEnabled } from './core';

/**
 * Base interface for QAgent agent models
 */
export interface AgentModelConfig {
  name: string;
  version: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

/**
 * TesterAgent Model
 * Wraps test execution as a Weave Model for versioning and comparison
 */
export const TesterModel = isWeaveEnabled()
  ? weave.op(
      async function TesterModel(input: {
        testSpec: {
          id: string;
          name: string;
          url: string;
          steps: Array<{ action: string; expected?: string }>;
        };
        config?: { timeout?: number };
      }) {
        // This is a proxy - actual implementation calls TesterAgent
        return {
          modelType: 'TesterAgent',
          input,
          timestamp: new Date().toISOString(),
        };
      },
      { name: 'QAgent.TesterModel' }
    )
  : null;

/**
 * TriageAgent Model
 * Wraps failure diagnosis as a Weave Model
 */
export const TriageModel = isWeaveEnabled()
  ? weave.op(
      async function TriageModel(input: {
        failureReport: {
          testId: string;
          error: { message: string; stack: string; type: string };
          context: { url: string };
        };
        config?: { useKnowledgeBase?: boolean };
      }) {
        return {
          modelType: 'TriageAgent',
          input,
          timestamp: new Date().toISOString(),
        };
      },
      { name: 'QAgent.TriageModel' }
    )
  : null;

/**
 * FixerAgent Model
 * Wraps patch generation as a Weave Model
 */
export const FixerModel = isWeaveEnabled()
  ? weave.op(
      async function FixerModel(input: {
        diagnosis: {
          failureId: string;
          failureType: string;
          rootCause: string;
          localization: { file: string; startLine: number };
        };
        config?: { useSimilarFixes?: boolean };
      }) {
        return {
          modelType: 'FixerAgent',
          input,
          timestamp: new Date().toISOString(),
        };
      },
      { name: 'QAgent.FixerModel' }
    )
  : null;

/**
 * VerifierAgent Model
 * Wraps verification as a Weave Model
 */
export const VerifierModel = isWeaveEnabled()
  ? weave.op(
      async function VerifierModel(input: {
        patch: { id: string; file: string; diff: string };
        testSpec: { id: string; url: string };
        config?: { deployToVercel?: boolean };
      }) {
        return {
          modelType: 'VerifierAgent',
          input,
          timestamp: new Date().toISOString(),
        };
      },
      { name: 'QAgent.VerifierModel' }
    )
  : null;

/**
 * OrchestratorModel
 * Wraps full pipeline execution as a Weave Model
 */
export const OrchestratorModel = isWeaveEnabled()
  ? weave.op(
      async function OrchestratorModel(input: {
        testSpecs: Array<{ id: string; name: string; url: string }>;
        targetUrl: string;
        maxIterations: number;
      }) {
        return {
          modelType: 'Orchestrator',
          input,
          timestamp: new Date().toISOString(),
        };
      },
      { name: 'QAgent.OrchestratorModel' }
    )
  : null;

/**
 * Model metadata for tracking agent versions
 */
export const AGENT_VERSIONS: Record<string, AgentModelConfig> = {
  tester: {
    name: 'TesterAgent',
    version: '1.0.0',
    description: 'E2E test execution with Browserbase/Stagehand',
    parameters: {
      browser: 'chromium',
      llm: 'gemini-2.0-flash',
    },
  },
  triage: {
    name: 'TriageAgent',
    version: '1.0.0',
    description: 'Failure diagnosis and root cause analysis',
    parameters: {
      llm: 'gemini-2.0-flash',
      useKnowledgeBase: true,
    },
  },
  fixer: {
    name: 'FixerAgent',
    version: '1.0.0',
    description: 'Code patch generation using LLM',
    parameters: {
      llm: 'gemini-2.0-flash',
      maxRetries: 3,
    },
  },
  verifier: {
    name: 'VerifierAgent',
    version: '1.0.0',
    description: 'Patch verification and deployment',
    parameters: {
      deployer: 'vercel',
      syntaxCheck: true,
    },
  },
  orchestrator: {
    name: 'Orchestrator',
    version: '1.0.0',
    description: 'Full QAgent pipeline coordination',
    parameters: {
      maxIterations: 5,
      parallel: false,
    },
  },
};

/**
 * Get model metadata for an agent
 */
export function getAgentModelConfig(agent: string): AgentModelConfig | undefined {
  return AGENT_VERSIONS[agent.toLowerCase()];
}
