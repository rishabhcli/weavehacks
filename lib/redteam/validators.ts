/**
 * Output Validation Utilities
 *
 * Functions to validate outputs and prevent dangerous operations.
 */

import type { Patch, DiagnosisReport } from '@/lib/types';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';
import { sanitizePath, isPathSafe } from './sanitize';

// ============================================================================
// Dangerous Patterns
// ============================================================================

/**
 * Patterns that indicate dangerous code in patches
 */
const DANGEROUS_PATTERNS = [
  // Command execution
  { pattern: /\beval\s*\(/gi, name: 'eval', severity: 'CRITICAL' as const },
  { pattern: /\bexec\s*\(/gi, name: 'exec', severity: 'CRITICAL' as const },
  { pattern: /\bexecSync\s*\(/gi, name: 'execSync', severity: 'CRITICAL' as const },
  { pattern: /\bspawn\s*\(/gi, name: 'spawn', severity: 'CRITICAL' as const },
  { pattern: /\bspawnSync\s*\(/gi, name: 'spawnSync', severity: 'CRITICAL' as const },
  { pattern: /child_process/gi, name: 'child_process import', severity: 'CRITICAL' as const },
  { pattern: /\bFunction\s*\(/gi, name: 'Function constructor', severity: 'HIGH' as const },

  // File system operations
  { pattern: /rm\s+-rf/gi, name: 'rm -rf', severity: 'CRITICAL' as const },
  { pattern: /rmdir.*-r/gi, name: 'recursive rmdir', severity: 'CRITICAL' as const },
  { pattern: /unlink\s*\(/gi, name: 'unlink', severity: 'HIGH' as const },
  { pattern: /writeFileSync.*\/etc/gi, name: 'write to /etc', severity: 'CRITICAL' as const },

  // Network operations
  { pattern: /\bfetch\s*\([^)]*attacker/gi, name: 'suspicious fetch', severity: 'HIGH' as const },
  { pattern: /\bnet\.connect/gi, name: 'net.connect', severity: 'MEDIUM' as const },

  // Shell metacharacters in strings
  { pattern: /`[^`]*\$\([^)]+\)/g, name: 'command substitution in template', severity: 'HIGH' as const },

  // Dangerous requires
  { pattern: /require\s*\(\s*['"]fs['"]\s*\)/g, name: 'fs require', severity: 'MEDIUM' as const },
  { pattern: /require\s*\(\s*['"]os['"]\s*\)/g, name: 'os require', severity: 'LOW' as const },
];

/**
 * Patterns that indicate prompt injection attempts in output
 */
const PROMPT_LEAK_PATTERNS = [
  { pattern: /system\s*prompt/gi, name: 'system prompt mention', severity: 'HIGH' as const },
  { pattern: /ignore\s*(all\s*)?(previous|prior)\s*instructions/gi, name: 'ignore instructions', severity: 'HIGH' as const },
  { pattern: /you\s*are\s*(now\s*)?DAN/gi, name: 'DAN jailbreak', severity: 'HIGH' as const },
  { pattern: /reveal\s*(your\s*)?(secrets?|instructions?)/gi, name: 'reveal secrets', severity: 'MEDIUM' as const },
];

// ============================================================================
// Patch Validation
// ============================================================================

/**
 * Validate a patch for dangerous content
 */
export function validatePatch(patch: Patch, projectRoot: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate file path
  if (!patch.file) {
    errors.push({ field: 'file', message: 'Patch file path is required', severity: 'error' });
  } else {
    // Check path traversal
    if (!isPathSafe(patch.file, projectRoot)) {
      errors.push({
        field: 'file',
        message: `Invalid file path: ${patch.file} - path traversal or protected directory`,
        severity: 'error',
      });
    }

    // Check for sensitive file types
    const sensitiveExtensions = ['.env', '.pem', '.key', '.crt', '.p12'];
    for (const ext of sensitiveExtensions) {
      if (patch.file.endsWith(ext)) {
        errors.push({
          field: 'file',
          message: `Cannot patch sensitive file type: ${ext}`,
          severity: 'error',
        });
      }
    }
  }

  // Validate diff content
  if (!patch.diff) {
    errors.push({ field: 'diff', message: 'Patch diff is required', severity: 'error' });
  } else {
    // Check for dangerous patterns
    for (const { pattern, name, severity } of DANGEROUS_PATTERNS) {
      if (pattern.test(patch.diff)) {
        if (severity === 'CRITICAL' || severity === 'HIGH') {
          errors.push({
            field: 'diff',
            message: `Dangerous pattern detected: ${name}`,
            severity: 'error',
          });
        } else {
          warnings.push({
            field: 'diff',
            message: `Potentially dangerous pattern: ${name}`,
            severity: 'warning',
          });
        }
      }
    }

    // Check diff size
    if (patch.diff.length > 50000) {
      warnings.push({
        field: 'diff',
        message: 'Patch is unusually large (>50KB)',
        severity: 'warning',
      });
    }
  }

  // Validate metadata
  if (patch.metadata) {
    if (patch.metadata.linesAdded > 1000) {
      warnings.push({
        field: 'metadata.linesAdded',
        message: 'Adding more than 1000 lines seems excessive',
        severity: 'warning',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a patch is safe to apply
 */
export function isPatchSafe(patch: Patch, projectRoot: string): boolean {
  const result = validatePatch(patch, projectRoot);
  return result.valid;
}

// ============================================================================
// Diagnosis Validation
// ============================================================================

/**
 * Validate a diagnosis report for suspicious content
 */
export function validateDiagnosis(diagnosis: DiagnosisReport, projectRoot: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate localization
  if (diagnosis.localization) {
    const { file, startLine, endLine } = diagnosis.localization;

    // Check file path
    if (file && !isPathSafe(file, projectRoot)) {
      errors.push({
        field: 'localization.file',
        message: `Invalid file path in localization: ${file}`,
        severity: 'error',
      });
    }

    // Check line numbers
    if (startLine < 0 || endLine < 0) {
      errors.push({
        field: 'localization',
        message: 'Line numbers cannot be negative',
        severity: 'error',
      });
    }

    if (startLine > endLine) {
      warnings.push({
        field: 'localization',
        message: 'Start line is greater than end line',
        severity: 'warning',
      });
    }
  }

  // Check for prompt injection in root cause
  if (diagnosis.rootCause) {
    for (const { pattern, name, severity } of PROMPT_LEAK_PATTERNS) {
      if (pattern.test(diagnosis.rootCause)) {
        if (severity === 'HIGH') {
          errors.push({
            field: 'rootCause',
            message: `Potential prompt leak detected: ${name}`,
            severity: 'error',
          });
        } else {
          warnings.push({
            field: 'rootCause',
            message: `Suspicious pattern in root cause: ${name}`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // Check suggested fix for dangerous content
  if (diagnosis.suggestedFix) {
    for (const { pattern, name, severity } of DANGEROUS_PATTERNS) {
      if (pattern.test(diagnosis.suggestedFix)) {
        if (severity === 'CRITICAL') {
          errors.push({
            field: 'suggestedFix',
            message: `Dangerous pattern in suggested fix: ${name}`,
            severity: 'error',
          });
        } else {
          warnings.push({
            field: 'suggestedFix',
            message: `Potentially dangerous pattern in suggested fix: ${name}`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Response Validation
// ============================================================================

/**
 * Validate an LLM response for prompt injection/leak indicators
 */
export function validateLLMResponse(response: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for prompt leak patterns
  for (const { pattern, name, severity } of PROMPT_LEAK_PATTERNS) {
    if (pattern.test(response)) {
      if (severity === 'HIGH') {
        errors.push({
          field: 'response',
          message: `Potential prompt leak: ${name}`,
          severity: 'error',
        });
      } else {
        warnings.push({
          field: 'response',
          message: `Suspicious pattern: ${name}`,
          severity: 'warning',
        });
      }
    }
  }

  // Check for role confusion
  if (/\b(assistant|system|user)\s*:/i.test(response)) {
    warnings.push({
      field: 'response',
      message: 'Response contains role markers',
      severity: 'warning',
    });
  }

  // Check for instruction following indicators
  if (/as\s+(you|an?\s+AI)\s+instructed/i.test(response)) {
    warnings.push({
      field: 'response',
      message: 'Response mentions following instructions',
      severity: 'warning',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// File Path Validation
// ============================================================================

/**
 * Validate a file path for safety
 */
export function validateFilePath(path: string, projectRoot: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!path) {
    errors.push({ field: 'path', message: 'Path is required', severity: 'error' });
    return { valid: false, errors, warnings };
  }

  // Check for null bytes
  if (path.includes('\x00')) {
    errors.push({ field: 'path', message: 'Path contains null bytes', severity: 'error' });
  }

  // Check for path traversal
  if (path.includes('..')) {
    try {
      sanitizePath(path, projectRoot);
    } catch (e) {
      errors.push({ field: 'path', message: (e as Error).message, severity: 'error' });
    }
  }

  // Check for dangerous paths
  const dangerousPaths = ['/etc/', '/var/', '/usr/', '/bin/', '/root/', 'C:\\Windows\\'];
  for (const dangerous of dangerousPaths) {
    if (path.toLowerCase().includes(dangerous.toLowerCase())) {
      errors.push({
        field: 'path',
        message: `Path contains dangerous directory: ${dangerous}`,
        severity: 'error',
      });
    }
  }

  // Check for hidden files
  if (path.includes('/.') || path.startsWith('.')) {
    warnings.push({
      field: 'path',
      message: 'Path references hidden file/directory',
      severity: 'warning',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Diff Validation
// ============================================================================

/**
 * Validate a unified diff format
 */
export function validateDiff(diff: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!diff) {
    errors.push({ field: 'diff', message: 'Diff is required', severity: 'error' });
    return { valid: false, errors, warnings };
  }

  // Check for valid diff format
  const hasHeader = /^(---|\+\+\+|@@)/m.test(diff);
  if (!hasHeader) {
    warnings.push({
      field: 'diff',
      message: 'Diff does not appear to be in unified format',
      severity: 'warning',
    });
  }

  // Check for dangerous patterns
  for (const { pattern, name, severity } of DANGEROUS_PATTERNS) {
    // Only check added lines (starting with +)
    const addedLines = diff
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'));

    for (const line of addedLines) {
      if (pattern.test(line)) {
        if (severity === 'CRITICAL' || severity === 'HIGH') {
          errors.push({
            field: 'diff',
            message: `Dangerous pattern in added code: ${name}`,
            severity: 'error',
          });
        } else {
          warnings.push({
            field: 'diff',
            message: `Potentially dangerous pattern: ${name}`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // Check diff size
  if (diff.length > 100000) {
    warnings.push({
      field: 'diff',
      message: 'Diff is very large (>100KB)',
      severity: 'warning',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Combined Validation
// ============================================================================

/**
 * Run all validations on a complete fix workflow
 */
export function validateFixWorkflow(
  diagnosis: DiagnosisReport,
  patch: Patch,
  projectRoot: string
): {
  diagnosisValid: boolean;
  patchValid: boolean;
  allValid: boolean;
  diagnosisResult: ValidationResult;
  patchResult: ValidationResult;
} {
  const diagnosisResult = validateDiagnosis(diagnosis, projectRoot);
  const patchResult = validatePatch(patch, projectRoot);

  return {
    diagnosisValid: diagnosisResult.valid,
    patchValid: patchResult.valid,
    allValid: diagnosisResult.valid && patchResult.valid,
    diagnosisResult,
    patchResult,
  };
}
