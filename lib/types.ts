/**
 * PatchPilot Core Type Definitions
 */

// ============================================================================
// Test Types
// ============================================================================

export interface TestSpec {
  id: string;
  name: string;
  url: string;
  steps: TestStep[];
  timeout?: number;
}

export interface TestStep {
  action: string;
  expected?: string;
  timeout?: number;
}

export interface TestResult {
  passed: boolean;
  duration: number;
  failureReport?: FailureReport;
}

// ============================================================================
// Failure Types
// ============================================================================

export interface FailureReport {
  testId: string;
  timestamp: Date;
  step: number;
  error: {
    message: string;
    stack: string;
    type: string;
  };
  context: {
    url: string;
    screenshot: string;
    domSnapshot: string;
    consoleLogs: ConsoleLog[];
  };
}

export interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'uncaught';
  message: string;
  timestamp: number;
}

// ============================================================================
// Diagnosis Types
// ============================================================================

export type FailureType =
  | 'UI_BUG'
  | 'BACKEND_ERROR'
  | 'TEST_FLAKY'
  | 'DATA_ERROR'
  | 'UNKNOWN';

export interface DiagnosisReport {
  failureId: string;
  failureType: FailureType;
  rootCause: string;
  localization: {
    file: string;
    startLine: number;
    endLine: number;
    codeSnippet: string;
  };
  similarIssues: SimilarIssue[];
  suggestedFix: string;
  confidence: number;
}

export interface SimilarIssue {
  id: string;
  similarity: number;
  fix: string;
  diff?: string;
}

// ============================================================================
// Patch Types
// ============================================================================

export interface Patch {
  id: string;
  diagnosisId: string;
  file: string;
  diff: string;
  description: string;
  metadata: {
    linesAdded: number;
    linesRemoved: number;
    llmModel: string;
    promptTokens: number;
  };
}

export interface PatchResult {
  success: boolean;
  patch?: Patch;
  error?: string;
}

// ============================================================================
// Verification Types
// ============================================================================

export interface VerificationResult {
  success: boolean;
  deploymentUrl?: string;
  testResult?: TestResult;
  error?: string;
}

export interface DeploymentStatus {
  state: 'PENDING' | 'BUILDING' | 'READY' | 'ERROR';
  url?: string;
  error?: string;
}

// ============================================================================
// Orchestrator Types
// ============================================================================

export interface OrchestratorConfig {
  maxIterations: number;
  testSpecs: TestSpec[];
  targetUrl: string;
}

export interface OrchestratorResult {
  success: boolean;
  iterations: number;
  totalDuration: number;
  patches: Patch[];
  finalTestResult?: TestResult;
}

// ============================================================================
// Redis Knowledge Base Types
// ============================================================================

export interface FailureTrace {
  id: string;
  embedding: number[];
  errorMessage: string;
  stackTrace: string;
  file: string;
  line: number;
  failureType: FailureType;
  fix: {
    patchId: string;
    description: string;
    diff: string;
    success: boolean;
  };
  createdAt: Date;
}

// ============================================================================
// Agent Interfaces
// ============================================================================

export interface TesterAgent {
  runTest(spec: TestSpec): Promise<TestResult>;
}

export interface TriageAgent {
  diagnose(failure: FailureReport): Promise<DiagnosisReport>;
}

export interface FixerAgent {
  generatePatch(diagnosis: DiagnosisReport): Promise<PatchResult>;
}

export interface VerifierAgent {
  verify(patch: Patch, testSpec: TestSpec): Promise<VerificationResult>;
}

export interface Orchestrator {
  run(config: OrchestratorConfig): Promise<OrchestratorResult>;
}
