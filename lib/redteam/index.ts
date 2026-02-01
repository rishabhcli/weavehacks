/**
 * RedTeam - Adversarial Testing Suite
 *
 * Provides security testing and hardening for QAgent.
 * Includes input sanitization, output validation, and adversarial test cases.
 *
 * Main exports:
 * - RedTeamRunner: Execute adversarial tests
 * - Sanitization utilities: sanitizeString, sanitizePath, sanitizeJson
 * - Validation utilities: validatePatch, validateDiagnosis
 * - RateLimiter: Prevent abuse
 */

// Re-export types
export * from './types';

// Export fixtures
export {
  allAdversarialTests,
  emptyInputTests,
  largeInputTests,
  pathTraversalTests,
  commandInjectionTests,
  promptInjectionTests,
  specialCharTests,
  dangerousPatchTests,
  getTestsByCategory,
  getTestsBySeverity,
  getCriticalTests,
} from './fixtures';

// Export sanitization utilities
export {
  sanitizeString,
  sanitizeForPrompt,
  sanitizePath,
  isPathSafe,
  sanitizeJson,
  truncateValue,
  truncateArray,
  escapeHtml,
  escapeShell,
  escapeRegex,
  sanitizeFailureReport,
} from './sanitize';

// Export validation utilities
export {
  validatePatch,
  isPatchSafe,
  validateDiagnosis,
  validateLLMResponse,
  validateFilePath,
  validateDiff,
  validateFixWorkflow,
} from './validators';

// Export rate limiter
export {
  RateLimiter,
  RateLimitError,
  withTimeout,
  withRetry,
  createRateLimiter,
  getGlobalRateLimiter,
  setGlobalRateLimiter,
} from './rate-limiter';

// Export runner
export { RedTeamRunner } from './runner';

// ============================================================================
// Convenience Functions
// ============================================================================

import { RedTeamRunner } from './runner';
import type { RedTeamReport, RedTeamRunnerConfig } from './types';

/**
 * Run all adversarial tests with default configuration
 */
export async function runRedTeam(
  config?: Partial<RedTeamRunnerConfig>
): Promise<RedTeamReport> {
  const runner = new RedTeamRunner(config);
  return runner.runAll();
}

/**
 * Run critical adversarial tests only
 */
export async function runCriticalTests(
  config?: Partial<RedTeamRunnerConfig>
): Promise<RedTeamReport> {
  const runner = new RedTeamRunner(config);
  return runner.runCritical();
}

/**
 * Quick security check - returns true if all critical tests pass
 */
export async function isSecure(projectRoot: string = process.cwd()): Promise<boolean> {
  const runner = new RedTeamRunner({
    projectRoot,
    minSeverity: 'HIGH',
  });
  const report = await runner.runCritical();
  return report.passRate >= 0.95;
}
