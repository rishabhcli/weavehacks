/**
 * PromptImprover
 *
 * Analyzes failure patterns and generates improved prompts
 * for QAgent agents to reduce errors.
 */

import { isWeaveEnabled, op } from '@/lib/weave';
import type {
  FailureAnalysis,
  PromptConfig,
  AgentName,
} from './types';

/**
 * Prompt templates for each agent
 */
export const DEFAULT_PROMPTS: Record<AgentName, string> = {
  Tester: `You are a QA testing agent. Execute the test steps and report results.`,
  Triage: `You are a bug diagnosis agent. Analyze the failure and identify the root cause.
Output a JSON object with:
- failureType: UI_BUG | BACKEND_ERROR | DATA_ERROR | TEST_FLAKY
- rootCause: Description of what went wrong
- localization: { file, startLine, endLine, codeSnippet }
- suggestedFix: How to fix this issue`,
  Fixer: `You are a code repair agent. Generate a patch to fix the identified bug.
Output a unified diff format patch that can be applied with git apply.
Be conservative - only change what's necessary to fix the issue.`,
  Verifier: `You are a verification agent. Apply the patch and verify the fix works.`,
  Orchestrator: `You are an orchestration agent. Coordinate the test-fix-verify loop.`,
};

/**
 * Result of a prompt improvement suggestion
 */
export interface PromptImprovement {
  agent: AgentName;
  originalPrompt: string;
  improvedPrompt: string;
  changes: string[];
  expectedImpact: string;
  confidence: number;
}

/**
 * Generates improved prompts based on failure analysis
 */
export class PromptImprover {
  private promptVersions: Map<AgentName, PromptConfig[]> = new Map();
  private currentPrompts: Map<AgentName, string> = new Map();

  constructor() {
    // Initialize with default prompts
    for (const [agent, prompt] of Object.entries(DEFAULT_PROMPTS)) {
      this.currentPrompts.set(agent as AgentName, prompt);
      this.promptVersions.set(agent as AgentName, [
        {
          id: `${agent}-v1`,
          name: `${agent} Default`,
          version: 'v1',
          prompt,
          parameters: {},
        },
      ]);
    }
  }

  /**
   * Generate improved prompt based on failures
   * Traced by Weave for observability
   */
  improvePrompt = isWeaveEnabled()
    ? op(this._improvePrompt.bind(this), { name: 'PromptImprover.improvePrompt' })
    : this._improvePrompt.bind(this);

  private async _improvePrompt(
    agent: AgentName,
    failures: FailureAnalysis[]
  ): Promise<PromptImprovement> {
    const currentPrompt = this.currentPrompts.get(agent) || DEFAULT_PROMPTS[agent];
    const relevantFailures = failures.filter((f) => f.agent === agent);

    if (relevantFailures.length === 0) {
      return {
        agent,
        originalPrompt: currentPrompt,
        improvedPrompt: currentPrompt,
        changes: [],
        expectedImpact: 'No changes needed - no relevant failures',
        confidence: 1.0,
      };
    }

    // Analyze failure patterns
    const patterns = this.analyzeFailurePatterns(relevantFailures);
    const improvements = this.generateImprovements(currentPrompt, patterns);

    // Build improved prompt
    const improvedPrompt = this.applyImprovements(currentPrompt, improvements);

    // Store new version
    const version = this.getNextVersion(agent);
    this.promptVersions.get(agent)?.push({
      id: `${agent}-${version}`,
      name: `${agent} Improved`,
      version,
      prompt: improvedPrompt,
      parameters: {},
    });

    return {
      agent,
      originalPrompt: currentPrompt,
      improvedPrompt,
      changes: improvements.map((i) => i.description),
      expectedImpact: this.estimateImpact(patterns, improvements),
      confidence: this.calculateConfidence(patterns, improvements),
    };
  }

  /**
   * Analyze failure patterns to identify prompt issues
   */
  private analyzeFailurePatterns(
    failures: FailureAnalysis[]
  ): Array<{ issue: string; frequency: number; severity: 'high' | 'medium' | 'low' }> {
    const patterns: Array<{ issue: string; frequency: number; severity: 'high' | 'medium' | 'low' }> = [];

    // Count failure causes
    const causeCounts: Record<string, number> = {};
    for (const failure of failures) {
      causeCounts[failure.failureCause] = (causeCounts[failure.failureCause] || 0) + failure.frequency;
    }

    // Identify high-frequency issues
    for (const [cause, count] of Object.entries(causeCounts)) {
      if (count >= 3) {
        patterns.push({
          issue: this.describeIssue(cause),
          frequency: count,
          severity: count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low',
        });
      }
    }

    // Check for output format issues
    const formatErrors = failures.filter(
      (f) => f.failureCause === 'PARSE_ERROR' || f.failureCause === 'PROMPT_DRIFT'
    );
    if (formatErrors.length > 0) {
      patterns.push({
        issue: 'Output format not consistently followed',
        frequency: formatErrors.reduce((sum, f) => sum + f.frequency, 0),
        severity: 'high',
      });
    }

    return patterns;
  }

  /**
   * Describe an issue based on failure cause
   */
  private describeIssue(cause: string): string {
    const descriptions: Record<string, string> = {
      TOOL_ERROR: 'External tool calls failing - need better error handling',
      RETRIEVAL_ERROR: 'Knowledge base queries returning poor results',
      PROMPT_DRIFT: 'LLM not following instructions precisely',
      PARSE_ERROR: 'Output format not being followed correctly',
      TIMEOUT: 'Operations taking too long',
      RATE_LIMIT: 'API rate limits being hit',
      UNKNOWN: 'Unclassified errors occurring',
    };
    return descriptions[cause] || `Issue: ${cause}`;
  }

  /**
   * Generate specific improvements for identified patterns
   */
  private generateImprovements(
    currentPrompt: string,
    patterns: Array<{ issue: string; frequency: number; severity: 'high' | 'medium' | 'low' }>
  ): Array<{ type: string; description: string; addition: string }> {
    const improvements: Array<{ type: string; description: string; addition: string }> = [];

    for (const pattern of patterns) {
      if (pattern.issue.includes('format')) {
        improvements.push({
          type: 'format_enforcement',
          description: 'Add explicit format requirements',
          addition: `\n\nIMPORTANT: You MUST output valid JSON. Do not include any text before or after the JSON object.`,
        });
      }

      if (pattern.issue.includes('instructions')) {
        improvements.push({
          type: 'instruction_clarity',
          description: 'Add step-by-step instructions',
          addition: `\n\nFollow these steps exactly:\n1. Analyze the input carefully\n2. Plan your response\n3. Output in the required format`,
        });
      }

      if (pattern.issue.includes('error handling')) {
        improvements.push({
          type: 'error_handling',
          description: 'Add error handling guidance',
          addition: `\n\nIf you encounter an error or cannot complete the task, explain the issue clearly in your response.`,
        });
      }

      if (pattern.issue.includes('Knowledge base')) {
        improvements.push({
          type: 'fallback_guidance',
          description: 'Add fallback instructions',
          addition: `\n\nIf no similar issues are found in the knowledge base, use your best judgment based on the error message and code context.`,
        });
      }
    }

    // Add general improvements for any high severity patterns
    if (patterns.some((p) => p.severity === 'high')) {
      if (!improvements.some((i) => i.type === 'format_enforcement')) {
        improvements.push({
          type: 'output_validation',
          description: 'Add output validation reminder',
          addition: `\n\nBefore outputting, verify that your response matches the expected format exactly.`,
        });
      }
    }

    return improvements;
  }

  /**
   * Apply improvements to the prompt
   */
  private applyImprovements(
    prompt: string,
    improvements: Array<{ type: string; description: string; addition: string }>
  ): string {
    let improved = prompt;

    for (const improvement of improvements) {
      // Only add if not already present
      if (!improved.includes(improvement.addition.trim())) {
        improved += improvement.addition;
      }
    }

    return improved;
  }

  /**
   * Estimate the impact of improvements
   */
  private estimateImpact(
    patterns: Array<{ issue: string; frequency: number; severity: 'high' | 'medium' | 'low' }>,
    improvements: Array<{ type: string; description: string; addition: string }>
  ): string {
    const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
    const addressedPatterns = patterns.filter((p) =>
      improvements.some((i) => p.issue.toLowerCase().includes(i.type.replace('_', ' ')))
    );
    const addressedFrequency = addressedPatterns.reduce((sum, p) => sum + p.frequency, 0);

    const coveragePercent = totalFrequency > 0 ? Math.round((addressedFrequency / totalFrequency) * 100) : 0;

    return `Expected to address ${coveragePercent}% of identified issues (${addressedPatterns.length}/${patterns.length} patterns)`;
  }

  /**
   * Calculate confidence in the improvement
   */
  private calculateConfidence(
    patterns: Array<{ issue: string; frequency: number; severity: 'high' | 'medium' | 'low' }>,
    improvements: Array<{ type: string; description: string; addition: string }>
  ): number {
    if (patterns.length === 0) return 1.0;
    if (improvements.length === 0) return 0.3;

    // Base confidence
    let confidence = 0.5;

    // Higher confidence if we have many data points
    const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
    if (totalFrequency >= 10) confidence += 0.2;
    else if (totalFrequency >= 5) confidence += 0.1;

    // Higher confidence if improvements match patterns
    const matchRatio = improvements.length / patterns.length;
    confidence += Math.min(0.3, matchRatio * 0.3);

    return Math.min(1.0, confidence);
  }

  /**
   * Get the next version number for an agent
   */
  private getNextVersion(agent: AgentName): string {
    const versions = this.promptVersions.get(agent) || [];
    return `v${versions.length + 1}`;
  }

  /**
   * Get current prompt for an agent
   */
  getPrompt(agent: AgentName): string {
    return this.currentPrompts.get(agent) || DEFAULT_PROMPTS[agent];
  }

  /**
   * Set a new prompt for an agent
   */
  setPrompt(agent: AgentName, prompt: string): void {
    this.currentPrompts.set(agent, prompt);
  }

  /**
   * Get all prompt versions for an agent
   */
  getVersions(agent: AgentName): PromptConfig[] {
    return this.promptVersions.get(agent) || [];
  }

  /**
   * Get a specific prompt config
   */
  getPromptConfig(agent: AgentName, version: string): PromptConfig | undefined {
    const versions = this.promptVersions.get(agent) || [];
    return versions.find((v) => v.version === version);
  }

  /**
   * Create a prompt config for A/B testing
   */
  createConfig(
    agent: AgentName,
    name: string,
    prompt: string,
    parameters: Record<string, unknown> = {}
  ): PromptConfig {
    const version = this.getNextVersion(agent);
    const config: PromptConfig = {
      id: `${agent}-${version}`,
      name,
      version,
      prompt,
      parameters,
    };

    this.promptVersions.get(agent)?.push(config);
    return config;
  }
}

export default PromptImprover;
