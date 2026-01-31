/**
 * Fixer Agent
 *
 * Generates code patches to fix bugs based on diagnosis reports.
 * Uses LLM to generate minimal, targeted fixes.
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  DiagnosisReport,
  Patch,
  PatchResult,
  FixerAgent as IFixerAgent,
} from '@/lib/types';

interface LLMPatchResponse {
  file: string;
  startLine: number;
  endLine: number;
  newCode: string;
  description: string;
}

export class FixerAgent implements IFixerAgent {
  private openai: OpenAI;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey });
    this.projectRoot = projectRoot;
  }

  /**
   * Generate a patch to fix the diagnosed bug
   */
  async generatePatch(diagnosis: DiagnosisReport): Promise<PatchResult> {
    try {
      // 1. Read the source file
      const sourceCode = await this.readSourceFile(diagnosis.localization.file);
      if (!sourceCode) {
        return {
          success: false,
          error: `Could not read source file: ${diagnosis.localization.file}`,
        };
      }

      // 2. Get similar fixes from knowledge base (placeholder)
      const similarFixes = await this.getSimilarFixes(diagnosis);

      // 3. Generate patch with LLM
      const llmPatch = await this.generateLLMPatch(diagnosis, sourceCode, similarFixes);
      if (!llmPatch) {
        return {
          success: false,
          error: 'LLM failed to generate a valid patch',
        };
      }

      // 4. Validate the patch
      const validationResult = await this.validatePatch(llmPatch, sourceCode);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Patch validation failed: ${validationResult.error}`,
        };
      }

      // 5. Generate diff
      const diff = this.generateDiff(
        diagnosis.localization.file,
        sourceCode,
        llmPatch
      );

      // 6. Build patch object
      const patch: Patch = {
        id: `patch-${uuidv4()}`,
        diagnosisId: diagnosis.failureId,
        file: diagnosis.localization.file,
        diff,
        description: llmPatch.description,
        metadata: {
          linesAdded: llmPatch.newCode.split('\n').length,
          linesRemoved: llmPatch.endLine - llmPatch.startLine + 1,
          llmModel: 'gpt-4o',
          promptTokens: 0, // Would track from API response
        },
      };

      return {
        success: true,
        patch,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating patch',
      };
    }
  }

  /**
   * Read source file contents
   */
  private async readSourceFile(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Get similar fixes from knowledge base (placeholder)
   */
  private async getSimilarFixes(_diagnosis: DiagnosisReport): Promise<string> {
    // TODO: Integrate with Redis in Phase 3
    // For now, return empty string
    return '';
  }

  /**
   * Generate patch using LLM
   */
  private async generateLLMPatch(
    diagnosis: DiagnosisReport,
    sourceCode: string,
    similarFixes: string
  ): Promise<LLMPatchResponse | null> {
    const language = diagnosis.localization.file.endsWith('.tsx')
      ? 'typescript'
      : diagnosis.localization.file.endsWith('.ts')
        ? 'typescript'
        : 'javascript';

    const prompt = `You are a senior developer fixing a bug in a Next.js application.

## Bug Diagnosis
- Failure Type: ${diagnosis.failureType}
- Root Cause: ${diagnosis.rootCause}
- Suggested Fix: ${diagnosis.suggestedFix}
- Confidence: ${diagnosis.confidence}

## Current Code (${diagnosis.localization.file})
\`\`\`${language}
${sourceCode}
\`\`\`

## Bug Location
- File: ${diagnosis.localization.file}
- Lines: ${diagnosis.localization.startLine} - ${diagnosis.localization.endLine}
- Code Snippet:
\`\`\`
${diagnosis.localization.codeSnippet}
\`\`\`

${similarFixes ? `## Similar Past Fixes\n${similarFixes}\n` : ''}

## Instructions
1. Identify the exact location of the bug in the code
2. Generate a minimal fix that addresses the root cause
3. Keep the same coding style as the existing code
4. Do NOT add unnecessary changes or refactoring
5. Return ONLY what's needed to fix this specific bug

## Output Format
Return a JSON object with:
{
  "file": "${diagnosis.localization.file}",
  "startLine": <line number where fix starts>,
  "endLine": <line number where fix ends>,
  "newCode": "<the fixed code that should replace lines startLine to endLine>",
  "description": "<brief description of what the fix does>"
}

Important: The newCode should be the complete replacement for lines startLine through endLine, properly indented to match the surrounding code.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      if (!result.file || !result.startLine || !result.endLine || !result.newCode) {
        return null;
      }

      return {
        file: result.file,
        startLine: result.startLine,
        endLine: result.endLine,
        newCode: result.newCode,
        description: result.description || 'Bug fix',
      };
    } catch (error) {
      console.error('LLM patch generation failed:', error);
      return null;
    }
  }

  /**
   * Validate the generated patch
   */
  private async validatePatch(
    patch: LLMPatchResponse,
    sourceCode: string
  ): Promise<{ valid: boolean; error?: string }> {
    const lines = sourceCode.split('\n');

    // Check line numbers are valid
    if (patch.startLine < 1 || patch.endLine > lines.length) {
      return {
        valid: false,
        error: `Invalid line range: ${patch.startLine}-${patch.endLine} (file has ${lines.length} lines)`,
      };
    }

    if (patch.startLine > patch.endLine) {
      return {
        valid: false,
        error: `Start line (${patch.startLine}) is after end line (${patch.endLine})`,
      };
    }

    // Check new code is not empty
    if (!patch.newCode.trim()) {
      return {
        valid: false,
        error: 'New code is empty',
      };
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf/,
      /eval\s*\(/,
      /exec\s*\(/,
      /child_process/,
      /require\s*\(\s*['"]fs['"]\s*\)/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(patch.newCode)) {
        return {
          valid: false,
          error: 'Patch contains potentially dangerous code',
        };
      }
    }

    // Basic syntax check - try to detect obvious issues
    const openBraces = (patch.newCode.match(/\{/g) || []).length;
    const closeBraces = (patch.newCode.match(/\}/g) || []).length;
    const openParens = (patch.newCode.match(/\(/g) || []).length;
    const closeParens = (patch.newCode.match(/\)/g) || []).length;

    if (Math.abs(openBraces - closeBraces) > 2 || Math.abs(openParens - closeParens) > 2) {
      return {
        valid: false,
        error: 'Patch has unbalanced braces or parentheses',
      };
    }

    return { valid: true };
  }

  /**
   * Generate a unified diff format
   */
  private generateDiff(
    filePath: string,
    originalCode: string,
    patch: LLMPatchResponse
  ): string {
    const lines = originalCode.split('\n');
    const removedLines = lines.slice(patch.startLine - 1, patch.endLine);
    const addedLines = patch.newCode.split('\n');

    let diff = `--- a/${filePath}\n`;
    diff += `+++ b/${filePath}\n`;
    diff += `@@ -${patch.startLine},${removedLines.length} +${patch.startLine},${addedLines.length} @@\n`;

    for (const line of removedLines) {
      diff += `-${line}\n`;
    }

    for (const line of addedLines) {
      diff += `+${line}\n`;
    }

    return diff;
  }

  /**
   * Apply a patch to the filesystem (for Verifier to use)
   */
  async applyPatch(patch: Patch): Promise<boolean> {
    try {
      const fullPath = path.join(this.projectRoot, patch.file);
      const sourceCode = fs.readFileSync(fullPath, 'utf-8');

      // Parse the diff to get the new code
      const diffLines = patch.diff.split('\n');
      const addedLines: string[] = [];
      let startLine = 0;
      let removeCount = 0;

      for (const line of diffLines) {
        if (line.startsWith('@@')) {
          const match = line.match(/@@ -(\d+),(\d+)/);
          if (match) {
            startLine = parseInt(match[1], 10);
            removeCount = parseInt(match[2], 10);
          }
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
          addedLines.push(line.slice(1));
        }
      }

      if (startLine === 0) {
        return false;
      }

      // Apply the patch
      const lines = sourceCode.split('\n');
      const beforeLines = lines.slice(0, startLine - 1);
      const afterLines = lines.slice(startLine - 1 + removeCount);

      const newContent = [...beforeLines, ...addedLines, ...afterLines].join('\n');
      fs.writeFileSync(fullPath, newContent, 'utf-8');

      return true;
    } catch (error) {
      console.error('Failed to apply patch:', error);
      return false;
    }
  }
}

export default FixerAgent;
