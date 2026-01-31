/**
 * Triage Agent
 *
 * Diagnoses failures and identifies root causes.
 * Classifies failure types, localizes bugs in the codebase,
 * and queries the knowledge base for similar issues.
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import type {
  FailureReport,
  DiagnosisReport,
  FailureType,
  SimilarIssue,
  TriageAgent as ITriageAgent,
} from '@/lib/types';
import { getKnowledgeBase, isRedisAvailable } from '@/lib/redis';

export class TriageAgent implements ITriageAgent {
  private openai: OpenAI;
  private projectRoot: string;
  private useRedis: boolean = true;

  constructor(projectRoot: string = process.cwd(), useRedis: boolean = true) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey });
    this.projectRoot = projectRoot;
    this.useRedis = useRedis;
  }

  /**
   * Diagnose a failure and generate a diagnosis report
   */
  async diagnose(failure: FailureReport): Promise<DiagnosisReport> {
    // 1. Classify the failure type
    const failureType = this.classifyFailure(failure);

    // 2. Localize the bug in the codebase
    const localization = await this.localizeBug(failure, failureType);

    // 3. Query for similar issues (placeholder - will integrate with Redis)
    const similarIssues = await this.findSimilarIssues(failure);

    // 4. Generate root cause analysis with LLM
    const analysis = await this.analyzeRootCause(failure, failureType, localization);

    return {
      failureId: failure.testId,
      failureType,
      rootCause: analysis.rootCause,
      localization: {
        file: localization.file,
        startLine: localization.line,
        endLine: localization.line + 5, // Estimate
        codeSnippet: localization.snippet,
      },
      similarIssues,
      suggestedFix: analysis.suggestedFix,
      confidence: analysis.confidence,
    };
  }

  /**
   * Classify the type of failure based on error message and context
   */
  private classifyFailure(failure: FailureReport): FailureType {
    const errorMsg = failure.error.message.toLowerCase();
    const errorType = failure.error.type.toLowerCase();

    // Check for UI bugs (missing handlers, elements)
    if (
      errorMsg.includes('onclick') ||
      errorMsg.includes('handler') ||
      errorMsg.includes('click') ||
      errorMsg.includes('element not found') ||
      errorMsg.includes('could not find')
    ) {
      return 'UI_BUG';
    }

    // Check for backend errors (API issues)
    if (
      errorMsg.includes('404') ||
      errorMsg.includes('500') ||
      errorMsg.includes('api') ||
      errorMsg.includes('fetch') ||
      errorMsg.includes('network') ||
      errorMsg.includes('endpoint')
    ) {
      return 'BACKEND_ERROR';
    }

    // Check for data errors (null references, undefined)
    if (
      errorMsg.includes('null') ||
      errorMsg.includes('undefined') ||
      errorMsg.includes('cannot read property') ||
      errorMsg.includes('cannot read properties') ||
      errorType.includes('typeerror')
    ) {
      return 'DATA_ERROR';
    }

    // Check for flaky test issues
    if (
      errorMsg.includes('timeout') ||
      errorMsg.includes('race') ||
      errorMsg.includes('flaky') ||
      errorMsg.includes('intermittent')
    ) {
      return 'TEST_FLAKY';
    }

    return 'UNKNOWN';
  }

  /**
   * Localize the bug to a specific file and line
   */
  private async localizeBug(
    failure: FailureReport,
    failureType: FailureType
  ): Promise<{ file: string; line: number; snippet: string }> {
    // Try to extract file/line from stack trace
    const stackMatch = failure.error.stack.match(/at\s+.*?\s+\(?(.*?):(\d+):(\d+)\)?/);

    if (stackMatch) {
      const [, filePath, line] = stackMatch;
      // Clean up the file path
      const cleanPath = filePath.replace(this.projectRoot, '').replace(/^\//, '');

      // Try to read the file snippet
      const snippet = await this.readCodeSnippet(cleanPath, parseInt(line, 10));

      return {
        file: cleanPath,
        line: parseInt(line, 10),
        snippet,
      };
    }

    // If no stack trace, try to infer from failure type and context
    const inferredLocation = await this.inferLocation(failure, failureType);
    return inferredLocation;
  }

  /**
   * Infer bug location from failure context when stack trace is unavailable
   */
  private async inferLocation(
    failure: FailureReport,
    failureType: FailureType
  ): Promise<{ file: string; line: number; snippet: string }> {
    const url = failure.context.url;
    const dom = failure.context.domSnapshot;

    // Infer based on URL path
    let inferredFile = '';
    if (url.includes('/cart')) {
      inferredFile = 'app/cart/page.tsx';
    } else if (url.includes('/signup')) {
      inferredFile = 'app/signup/page.tsx';
    } else if (url.includes('/api/checkout')) {
      inferredFile = 'app/api/checkout/route.ts';
    } else {
      inferredFile = 'app/page.tsx';
    }

    // Try to find relevant code using LLM
    const prompt = `Given this error in a Next.js application:
Error: ${failure.error.message}
URL: ${url}
Failure Type: ${failureType}

The likely file is: ${inferredFile}

What line number would this error most likely occur at? Just respond with a number.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
      });

      const lineGuess = parseInt(response.choices[0].message.content?.trim() || '1', 10);
      const snippet = await this.readCodeSnippet(inferredFile, lineGuess);

      return {
        file: inferredFile,
        line: isNaN(lineGuess) ? 1 : lineGuess,
        snippet,
      };
    } catch {
      return {
        file: inferredFile,
        line: 1,
        snippet: '',
      };
    }
  }

  /**
   * Read a code snippet from a file
   */
  private async readCodeSnippet(
    filePath: string,
    line: number,
    context: number = 5
  ): Promise<string> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      const start = Math.max(0, line - context - 1);
      const end = Math.min(lines.length, line + context);

      return lines
        .slice(start, end)
        .map((l, i) => `${start + i + 1}: ${l}`)
        .join('\n');
    } catch {
      return '';
    }
  }

  /**
   * Find similar issues from the Redis knowledge base
   */
  private async findSimilarIssues(failure: FailureReport): Promise<SimilarIssue[]> {
    // Check if Redis integration is enabled
    if (!this.useRedis) {
      return [];
    }

    try {
      // Check if Redis is available
      const available = await isRedisAvailable();
      if (!available) {
        console.log('Redis not available, skipping similar issues lookup');
        return [];
      }

      // Query the knowledge base for similar failures
      const kb = getKnowledgeBase();
      await kb.init();

      const similarIssues = await kb.findSimilar(
        failure.error.message,
        failure.error.stack,
        3, // Top 3 similar issues
        0.7 // Minimum similarity threshold
      );

      if (similarIssues.length > 0) {
        console.log(`Found ${similarIssues.length} similar issues in knowledge base`);
      }

      return similarIssues;
    } catch (error) {
      console.error('Error finding similar issues:', error);
      return [];
    }
  }

  /**
   * Analyze root cause using LLM
   */
  private async analyzeRootCause(
    failure: FailureReport,
    failureType: FailureType,
    localization: { file: string; line: number; snippet: string }
  ): Promise<{ rootCause: string; suggestedFix: string; confidence: number }> {
    const prompt = `You are a senior developer debugging a web application failure.

## Failure Information
- Test ID: ${failure.testId}
- Step: ${failure.step}
- Error Type: ${failure.error.type}
- Error Message: ${failure.error.message}
- URL: ${failure.context.url}
- Classification: ${failureType}

## Suspected Location
- File: ${localization.file}
- Line: ${localization.line}

## Code Snippet
\`\`\`
${localization.snippet}
\`\`\`

## Console Logs
${failure.context.consoleLogs.slice(-5).map((l) => `[${l.type}] ${l.message}`).join('\n')}

## Instructions
Analyze this failure and provide:
1. Root cause - A clear explanation of what's wrong
2. Suggested fix - A specific code change to fix the issue
3. Confidence - How confident you are (0.0 to 1.0)

Respond in JSON format:
{
  "rootCause": "explanation here",
  "suggestedFix": "code change description here",
  "confidence": 0.85
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        rootCause: result.rootCause || 'Unable to determine root cause',
        suggestedFix: result.suggestedFix || 'Manual investigation required',
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      };
    } catch (error) {
      console.error('LLM analysis failed:', error);
      return {
        rootCause: `${failureType} detected: ${failure.error.message}`,
        suggestedFix: 'Manual investigation required',
        confidence: 0.3,
      };
    }
  }
}

export default TriageAgent;
