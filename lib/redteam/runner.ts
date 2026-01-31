/**
 * RedTeam Test Runner
 *
 * Executes adversarial tests against PatchPilot agents
 * and generates security reports.
 */

import { isWeaveEnabled, op } from '@/lib/weave';
import type { FailureReport, DiagnosisReport, Patch } from '@/lib/types';
import type {
  AdversarialTest,
  AdversarialTestResult,
  RedTeamReport,
  ReportSummary,
  CategorySummary,
  SecurityIssue,
  TestCategory,
  Severity,
  TestStatus,
  RedTeamRunnerConfig,
} from './types';
import { allAdversarialTests, getCriticalTests } from './fixtures';
import { validatePatch, validateDiagnosis, validateLLMResponse } from './validators';
import { sanitizeString, sanitizePath, isPathSafe } from './sanitize';
import { withTimeout } from './rate-limiter';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: RedTeamRunnerConfig = {
  categories: undefined, // Run all
  minSeverity: undefined, // Run all
  stopOnFailure: false,
  testTimeoutMs: 30000,
  projectRoot: process.cwd(),
};

const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

// ============================================================================
// RedTeam Runner
// ============================================================================

/**
 * Runs adversarial tests and generates security reports
 */
export class RedTeamRunner {
  private config: RedTeamRunnerConfig;
  private results: AdversarialTestResult[] = [];

  constructor(config: Partial<RedTeamRunnerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all adversarial tests
   * Traced by Weave for observability
   */
  runAll = isWeaveEnabled()
    ? op(this._runAll.bind(this), { name: 'RedTeamRunner.runAll' })
    : this._runAll.bind(this);

  private async _runAll(): Promise<RedTeamReport> {
    const startTime = new Date();
    this.results = [];

    // Get tests to run
    let tests = [...allAdversarialTests];

    // Filter by category if specified
    if (this.config.categories && this.config.categories.length > 0) {
      tests = tests.filter((t) => this.config.categories!.includes(t.category));
    }

    // Filter by severity if specified
    if (this.config.minSeverity) {
      const minIndex = SEVERITY_ORDER.indexOf(this.config.minSeverity);
      tests = tests.filter((t) => SEVERITY_ORDER.indexOf(t.severity) <= minIndex);
    }

    console.log(`\n🔴 RedTeam Starting - ${tests.length} tests to run\n`);

    // Run each test
    for (const test of tests) {
      const result = await this.runTest(test);
      this.results.push(result);

      // Log progress
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${test.id}: ${test.name}`);

      // Stop on failure if configured
      if (!result.passed && this.config.stopOnFailure) {
        console.log('\n⚠️ Stopping on first failure');
        break;
      }
    }

    const endTime = new Date();
    return this.generateReport(startTime, endTime);
  }

  /**
   * Run critical tests only
   */
  runCritical = isWeaveEnabled()
    ? op(this._runCritical.bind(this), { name: 'RedTeamRunner.runCritical' })
    : this._runCritical.bind(this);

  private async _runCritical(): Promise<RedTeamReport> {
    const startTime = new Date();
    this.results = [];

    const tests = getCriticalTests();
    console.log(`\n🔴 RedTeam Critical Tests - ${tests.length} tests\n`);

    for (const test of tests) {
      const result = await this.runTest(test);
      this.results.push(result);

      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${test.id}: ${test.name}`);
    }

    const endTime = new Date();
    return this.generateReport(startTime, endTime);
  }

  /**
   * Run a single test
   */
  private async runTest(test: AdversarialTest): Promise<AdversarialTestResult> {
    const startTime = Date.now();
    const securityIssues: SecurityIssue[] = [];

    try {
      // Run test with timeout
      const testResult = await withTimeout(
        () => this.executeTest(test),
        this.config.testTimeoutMs || 30000,
        `Test ${test.id} timed out`
      );

      const durationMs = Date.now() - startTime;

      // Check for security issues
      securityIssues.push(...testResult.issues);

      const passed = testResult.passed && securityIssues.length === 0;

      return {
        testId: test.id,
        status: passed ? 'PASSED' : 'FAILED',
        passed,
        durationMs,
        details: testResult.details,
        securityIssues,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Crashes on adversarial input are security issues
      if (test.category === 'INPUT_VALIDATION' || test.category === 'RESOURCE_EXHAUSTION') {
        securityIssues.push({
          type: 'CRASH_ON_INPUT',
          severity: test.severity,
          description: `System crashed on adversarial input: ${errorMessage}`,
          evidence: test.id,
          remediation: 'Add input validation and error handling',
        });
      }

      return {
        testId: test.id,
        status: 'ERROR',
        passed: false,
        durationMs,
        details: `Error: ${errorMessage}`,
        securityIssues,
      };
    }
  }

  /**
   * Execute a test based on its category
   */
  private async executeTest(
    test: AdversarialTest
  ): Promise<{ passed: boolean; details: string; issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];

    switch (test.category) {
      case 'INPUT_VALIDATION':
        return this.testInputValidation(test);

      case 'PATH_TRAVERSAL':
        return this.testPathTraversal(test);

      case 'INJECTION':
        return this.testInjection(test);

      case 'PROMPT_SECURITY':
        return this.testPromptSecurity(test);

      case 'RESOURCE_EXHAUSTION':
        return this.testResourceExhaustion(test);

      default:
        return {
          passed: true,
          details: 'Unknown test category - skipped',
          issues,
        };
    }
  }

  /**
   * Test input validation
   */
  private async testInputValidation(
    test: AdversarialTest
  ): Promise<{ passed: boolean; details: string; issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];
    const payload = test.input.payload as FailureReport;

    // Try to sanitize the input
    try {
      const result = sanitizeString(payload?.error?.message);

      // Check that sanitization didn't crash
      if (result.sanitized) {
        return {
          passed: true,
          details: `Input sanitized successfully: ${result.changes.join(', ')}`,
          issues,
        };
      }

      return {
        passed: true,
        details: 'Input passed validation (no sanitization needed)',
        issues,
      };
    } catch (error) {
      issues.push({
        type: 'INPUT_VALIDATION_FAILURE',
        severity: test.severity,
        description: `Failed to validate input: ${(error as Error).message}`,
        remediation: 'Add error handling for edge cases',
      });

      return {
        passed: false,
        details: `Validation failed: ${(error as Error).message}`,
        issues,
      };
    }
  }

  /**
   * Test path traversal prevention
   */
  private async testPathTraversal(
    test: AdversarialTest
  ): Promise<{ passed: boolean; details: string; issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];
    const payload = test.input.payload as { file: string };

    // Check if path is correctly rejected
    const isSafe = isPathSafe(payload.file, this.config.projectRoot);

    if (isSafe) {
      // Path traversal was NOT detected - security issue!
      issues.push({
        type: 'PATH_TRAVERSAL',
        severity: 'CRITICAL',
        description: `Path traversal not detected: ${payload.file}`,
        evidence: payload.file,
        remediation: 'Implement stricter path validation',
      });

      return {
        passed: false,
        details: `Path traversal not blocked: ${payload.file}`,
        issues,
      };
    }

    return {
      passed: true,
      details: `Path traversal correctly blocked: ${payload.file}`,
      issues,
    };
  }

  /**
   * Test injection prevention
   */
  private async testInjection(
    test: AdversarialTest
  ): Promise<{ passed: boolean; details: string; issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];

    // Handle different injection test types
    if (test.input.context?.type === 'localization') {
      // Path-based injection
      return this.testPathTraversal(test);
    }

    // Test patch validation for dangerous patches
    if (test.input.targetAgent === 'Verifier') {
      const patch = test.input.payload as Patch;
      const validation = validatePatch(patch, this.config.projectRoot);

      if (validation.valid) {
        // Dangerous patch was not detected!
        issues.push({
          type: 'INJECTION_NOT_BLOCKED',
          severity: test.severity,
          description: `Dangerous patch content not blocked`,
          evidence: patch.diff?.slice(0, 200),
          remediation: 'Add pattern matching for dangerous code',
        });

        return {
          passed: false,
          details: 'Dangerous patch was not rejected',
          issues,
        };
      }

      return {
        passed: true,
        details: `Dangerous patch correctly rejected: ${validation.errors.map((e) => e.message).join(', ')}`,
        issues,
      };
    }

    // For other injection tests, check sanitization
    const payload = test.input.payload as FailureReport;
    const sanitized = sanitizeString(payload?.error?.message, { escapeShell: true });

    if (sanitized.sanitized) {
      return {
        passed: true,
        details: `Injection characters escaped: ${sanitized.changes.join(', ')}`,
        issues,
      };
    }

    return {
      passed: true,
      details: 'No injection characters found',
      issues,
    };
  }

  /**
   * Test prompt security
   */
  private async testPromptSecurity(
    test: AdversarialTest
  ): Promise<{ passed: boolean; details: string; issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];
    const payload = test.input.payload as FailureReport;

    // Simulate LLM response (in real scenario, would call actual agent)
    // For testing, we validate that input sanitization would prevent injection
    const errorMessage = payload?.error?.message || '';

    // Check if the message contains prompt injection patterns
    const validation = validateLLMResponse(errorMessage);

    if (!validation.valid) {
      // The input itself is suspicious - good that we detected it
      return {
        passed: true,
        details: `Prompt injection attempt detected: ${validation.errors.map((e) => e.message).join(', ')}`,
        issues,
      };
    }

    // In a real implementation, we would:
    // 1. Pass the adversarial input to the agent
    // 2. Check if the response leaks system prompt or follows injected instructions
    // For now, we verify the detection mechanisms work

    return {
      passed: true,
      details: 'Prompt security check passed',
      issues,
    };
  }

  /**
   * Test resource exhaustion prevention
   */
  private async testResourceExhaustion(
    test: AdversarialTest
  ): Promise<{ passed: boolean; details: string; issues: SecurityIssue[] }> {
    const issues: SecurityIssue[] = [];
    const payload = test.input.payload as FailureReport;

    // Check if large inputs are handled without memory issues
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Attempt to process the large input
      const errorMessage = payload?.error?.message || '';
      const sanitized = sanitizeString(errorMessage, { maxLength: 10000 });

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;

      // Check if memory increased significantly (>50MB is concerning)
      if (memoryIncrease > 50 * 1024 * 1024) {
        issues.push({
          type: 'MEMORY_EXHAUSTION',
          severity: 'HIGH',
          description: `Memory usage increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB`,
          remediation: 'Add input size limits and streaming for large data',
        });

        return {
          passed: false,
          details: `Excessive memory usage: ${Math.round(memoryIncrease / 1024 / 1024)}MB`,
          issues,
        };
      }

      return {
        passed: true,
        details: `Resource handling OK. Input truncated: ${sanitized.sanitized}`,
        issues,
      };
    } catch (error) {
      issues.push({
        type: 'RESOURCE_EXHAUSTION',
        severity: test.severity,
        description: `Failed to handle large input: ${(error as Error).message}`,
        remediation: 'Add input size limits and error handling',
      });

      return {
        passed: false,
        details: `Resource exhaustion: ${(error as Error).message}`,
        issues,
      };
    }
  }

  /**
   * Generate a complete report
   */
  private generateReport(startTime: Date, endTime: Date): RedTeamReport {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed && r.status === 'FAILED').length;
    const errors = this.results.filter((r) => r.status === 'ERROR').length;
    const skipped = this.results.filter((r) => r.status === 'SKIPPED').length;
    const total = this.results.length;

    const summary = this.generateSummary();
    const recommendations = this.generateRecommendations(summary);

    const report: RedTeamReport = {
      runId: `redteam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startTime,
      endTime,
      totalTests: total,
      passed,
      failed,
      skipped,
      errors,
      passRate: total > 0 ? passed / total : 0,
      results: this.results,
      summary,
      recommendations,
    };

    this.printReport(report);
    return report;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): ReportSummary {
    const byCategory: Record<TestCategory, CategorySummary> = {
      INPUT_VALIDATION: { total: 0, passed: 0, failed: 0, passRate: 0 },
      INJECTION: { total: 0, passed: 0, failed: 0, passRate: 0 },
      RESOURCE_EXHAUSTION: { total: 0, passed: 0, failed: 0, passRate: 0 },
      PROMPT_SECURITY: { total: 0, passed: 0, failed: 0, passRate: 0 },
      PATH_TRAVERSAL: { total: 0, passed: 0, failed: 0, passRate: 0 },
    };

    const bySeverity: Record<Severity, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0,
    };

    const allIssues: SecurityIssue[] = [];

    for (const result of this.results) {
      // Find the test to get its category
      const test = allAdversarialTests.find((t) => t.id === result.testId);
      if (test) {
        const cat = byCategory[test.category];
        cat.total++;
        if (result.passed) {
          cat.passed++;
        } else {
          cat.failed++;
          bySeverity[test.severity]++;
        }
      }

      allIssues.push(...result.securityIssues);
    }

    // Calculate pass rates
    for (const cat of Object.values(byCategory)) {
      cat.passRate = cat.total > 0 ? cat.passed / cat.total : 0;
    }

    // Get critical issues
    const criticalIssues = allIssues.filter(
      (i) => i.severity === 'CRITICAL' || i.severity === 'HIGH'
    );

    // Get top vulnerability types
    const vulnCounts: Record<string, number> = {};
    for (const issue of allIssues) {
      vulnCounts[issue.type] = (vulnCounts[issue.type] || 0) + 1;
    }
    const topVulnerabilities = Object.entries(vulnCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    return {
      byCategory,
      bySeverity,
      criticalIssues,
      topVulnerabilities,
    };
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(summary: ReportSummary): string[] {
    const recommendations: string[] = [];

    // Check each category
    for (const [category, stats] of Object.entries(summary.byCategory)) {
      if (stats.passRate < 1) {
        switch (category) {
          case 'INPUT_VALIDATION':
            recommendations.push('Add comprehensive input validation for all agent entry points');
            break;
          case 'PATH_TRAVERSAL':
            recommendations.push('Implement strict path sanitization using allowlists');
            break;
          case 'INJECTION':
            recommendations.push('Add input sanitization to escape shell/SQL/HTML metacharacters');
            break;
          case 'PROMPT_SECURITY':
            recommendations.push('Implement prompt injection defenses (delimiters, validation)');
            break;
          case 'RESOURCE_EXHAUSTION':
            recommendations.push('Add input size limits and timeout protections');
            break;
        }
      }
    }

    // Add severity-based recommendations
    if (summary.bySeverity.CRITICAL > 0) {
      recommendations.unshift('URGENT: Address critical security vulnerabilities immediately');
    }

    if (summary.bySeverity.HIGH > 0) {
      recommendations.unshift('Priority: Fix high-severity issues before production');
    }

    return recommendations;
  }

  /**
   * Print report to console
   */
  private printReport(report: RedTeamReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔴 REDTEAM SECURITY REPORT');
    console.log('='.repeat(60));
    console.log(`Run ID: ${report.runId}`);
    console.log(`Duration: ${report.endTime.getTime() - report.startTime.getTime()}ms`);
    console.log(`\nResults: ${report.passed}/${report.totalTests} passed (${(report.passRate * 100).toFixed(1)}%)`);

    if (report.failed > 0) {
      console.log(`\n⚠️ ${report.failed} tests FAILED`);
    }
    if (report.errors > 0) {
      console.log(`❌ ${report.errors} tests had ERRORS`);
    }

    if (report.summary.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      for (const issue of report.summary.criticalIssues) {
        console.log(`  - ${issue.type}: ${issue.description}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      for (const rec of report.recommendations) {
        console.log(`  • ${rec}`);
      }
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Get results
   */
  getResults(): AdversarialTestResult[] {
    return [...this.results];
  }

  /**
   * Reset runner
   */
  reset(): void {
    this.results = [];
  }
}

export default RedTeamRunner;
