/**
 * RedTeam Type Definitions
 *
 * Types for adversarial testing and security hardening.
 */

// ============================================================================
// Test Categories
// ============================================================================

/**
 * Categories of adversarial tests
 */
export type TestCategory =
  | 'INPUT_VALIDATION'
  | 'INJECTION'
  | 'RESOURCE_EXHAUSTION'
  | 'PROMPT_SECURITY'
  | 'PATH_TRAVERSAL';

/**
 * Severity levels for security issues
 */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/**
 * Result of a security test
 */
export type TestStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';

// ============================================================================
// Test Types
// ============================================================================

/**
 * An adversarial test case
 */
export interface AdversarialTest {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  severity: Severity;
  input: AdversarialInput;
  expectedBehavior: string;
}

/**
 * Input for an adversarial test
 */
export interface AdversarialInput {
  /** The malicious or edge-case content */
  payload: unknown;
  /** Which agent to test */
  targetAgent: 'Tester' | 'Triage' | 'Fixer' | 'Verifier' | 'Orchestrator';
  /** Additional context for the test */
  context?: Record<string, unknown>;
}

/**
 * Result of running an adversarial test
 */
export interface AdversarialTestResult {
  testId: string;
  status: TestStatus;
  passed: boolean;
  durationMs: number;
  details: string;
  securityIssues: SecurityIssue[];
}

/**
 * A detected security issue
 */
export interface SecurityIssue {
  type: string;
  severity: Severity;
  description: string;
  evidence?: string;
  remediation?: string;
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Complete RedTeam test report
 */
export interface RedTeamReport {
  runId: string;
  startTime: Date;
  endTime: Date;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  passRate: number;
  results: AdversarialTestResult[];
  summary: ReportSummary;
  recommendations: string[];
}

/**
 * Summary statistics for a RedTeam run
 */
export interface ReportSummary {
  byCategory: Record<TestCategory, CategorySummary>;
  bySeverity: Record<Severity, number>;
  criticalIssues: SecurityIssue[];
  topVulnerabilities: string[];
}

/**
 * Summary for a test category
 */
export interface CategorySummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

// ============================================================================
// Sanitization Types
// ============================================================================

/**
 * Options for input sanitization
 */
export interface SanitizeOptions {
  /** Maximum string length */
  maxLength?: number;
  /** Whether to strip null bytes */
  stripNullBytes?: boolean;
  /** Whether to strip control characters */
  stripControlChars?: boolean;
  /** Whether to escape shell metacharacters */
  escapeShell?: boolean;
  /** Maximum JSON nesting depth */
  maxDepth?: number;
}

/**
 * Result of sanitization
 */
export interface SanitizeResult {
  value: unknown;
  sanitized: boolean;
  changes: string[];
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * A validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

/**
 * A validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

// ============================================================================
// Rate Limiter Types
// ============================================================================

/**
 * Configuration for rate limiting
 */
export interface RateLimiterConfig {
  /** Maximum requests per window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Whether to throw on limit exceeded */
  throwOnLimit?: boolean;
}

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

// ============================================================================
// Runner Types
// ============================================================================

/**
 * Configuration for RedTeam runner
 */
export interface RedTeamRunnerConfig {
  /** Test categories to run */
  categories?: TestCategory[];
  /** Minimum severity to test */
  minSeverity?: Severity;
  /** Whether to stop on first failure */
  stopOnFailure?: boolean;
  /** Timeout per test in ms */
  testTimeoutMs?: number;
  /** Project root for path validation */
  projectRoot: string;
}
