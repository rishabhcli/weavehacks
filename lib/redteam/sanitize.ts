/**
 * Input Sanitization Utilities
 *
 * Functions to sanitize user input and prevent injection attacks.
 */

import { resolve, normalize, isAbsolute } from 'path';
import type { SanitizeOptions, SanitizeResult } from './types';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  maxLength: 10000,
  stripNullBytes: true,
  stripControlChars: true,
  escapeShell: true,
  maxDepth: 10,
};

// ============================================================================
// String Sanitization
// ============================================================================

/**
 * Sanitize a string input
 */
export function sanitizeString(
  input: unknown,
  options: Partial<SanitizeOptions> = {}
): SanitizeResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const changes: string[] = [];

  // Handle non-string inputs
  if (input === null || input === undefined) {
    return { value: '', sanitized: true, changes: ['Converted null/undefined to empty string'] };
  }

  if (typeof input !== 'string') {
    try {
      input = String(input);
      changes.push('Converted non-string to string');
    } catch {
      return { value: '', sanitized: true, changes: ['Failed to convert to string'] };
    }
  }

  let value = input as string;

  // Truncate to max length
  if (value.length > opts.maxLength) {
    value = value.slice(0, opts.maxLength);
    changes.push(`Truncated from ${(input as string).length} to ${opts.maxLength} chars`);
  }

  // Strip null bytes
  if (opts.stripNullBytes && value.includes('\x00')) {
    value = value.replace(/\x00/g, '');
    changes.push('Removed null bytes');
  }

  // Strip control characters (except newlines and tabs)
  if (opts.stripControlChars) {
    const before = value;
    value = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (value !== before) {
      changes.push('Removed control characters');
    }
  }

  // Escape shell metacharacters
  if (opts.escapeShell) {
    const shellChars = /[`$(){}|;&<>\\]/g;
    if (shellChars.test(value)) {
      value = value.replace(shellChars, '\\$&');
      changes.push('Escaped shell metacharacters');
    }
  }

  return {
    value,
    sanitized: changes.length > 0,
    changes,
  };
}

/**
 * Sanitize input for use in prompts (prevent prompt injection)
 */
export function sanitizeForPrompt(input: string, maxLength: number = 5000): string {
  let sanitized = input;

  // Truncate
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + '...[truncated]';
  }

  // Escape potential delimiter injections
  sanitized = sanitized
    .replace(/```/g, '` ` `')
    .replace(/<\/?message/gi, '&lt;message')
    .replace(/###/g, '# # #')
    .replace(/\[INST\]/gi, '[INS T]')
    .replace(/\[\/INST\]/gi, '[/INS T]');

  return sanitized;
}

// ============================================================================
// Path Sanitization
// ============================================================================

/**
 * Sanitize a file path to prevent traversal attacks
 */
export function sanitizePath(inputPath: string, projectRoot: string): string {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }

  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('Invalid project root');
  }

  // Normalize the project root
  const normalizedRoot = normalize(resolve(projectRoot));

  // Decode URL-encoded characters
  let decodedPath = inputPath;
  try {
    decodedPath = decodeURIComponent(inputPath);
  } catch {
    // If decoding fails, use original
  }

  // Normalize Windows-style separators
  decodedPath = decodedPath.replace(/\\/g, '/');

  // Resolve to absolute path
  let resolvedPath: string;
  if (isAbsolute(decodedPath)) {
    resolvedPath = normalize(decodedPath);
  } else {
    resolvedPath = normalize(resolve(normalizedRoot, decodedPath));
  }

  // Check if path is within project root
  if (!resolvedPath.startsWith(normalizedRoot)) {
    throw new Error(`Path traversal detected: ${inputPath} resolves outside project root`);
  }

  // Check for dangerous directories
  const dangerousPaths = [
    '/node_modules/',
    '/.git/',
    '/.env',
    '/package-lock.json',
    '/pnpm-lock.yaml',
    '/yarn.lock',
  ];

  for (const dangerous of dangerousPaths) {
    if (resolvedPath.includes(dangerous) || resolvedPath.endsWith(dangerous.slice(0, -1))) {
      throw new Error(`Access to protected path denied: ${dangerous}`);
    }
  }

  return resolvedPath;
}

/**
 * Check if a path is safe (doesn't throw, returns boolean)
 */
export function isPathSafe(inputPath: string, projectRoot: string): boolean {
  try {
    sanitizePath(inputPath, projectRoot);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// JSON Sanitization
// ============================================================================

/**
 * Sanitize JSON to prevent deeply nested structures (zip bomb prevention)
 */
export function sanitizeJson(
  input: unknown,
  maxDepth: number = 10,
  currentDepth: number = 0
): unknown {
  if (currentDepth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input, { maxLength: 10000 }).value;
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    // Limit array size
    const maxArraySize = 1000;
    const limited = input.slice(0, maxArraySize);
    return limited.map((item) => sanitizeJson(item, maxDepth, currentDepth + 1));
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    const keys = Object.keys(input as object);

    // Limit number of keys
    const maxKeys = 100;
    const limitedKeys = keys.slice(0, maxKeys);

    for (const key of limitedKeys) {
      const sanitizedKey = sanitizeString(key, { maxLength: 100 }).value as string;
      result[sanitizedKey] = sanitizeJson(
        (input as Record<string, unknown>)[key],
        maxDepth,
        currentDepth + 1
      );
    }

    return result;
  }

  return String(input);
}

// ============================================================================
// Truncation Utilities
// ============================================================================

/**
 * Truncate a value to a maximum size
 */
export function truncateValue(value: unknown, maxLength: number = 5000): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length > maxLength) {
      return value.slice(0, maxLength) + '...[truncated]';
    }
    return value;
  }

  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    if (json.length > maxLength) {
      return {
        _truncated: true,
        _originalSize: json.length,
        preview: json.slice(0, maxLength) + '...',
      };
    }
    return value;
  }

  return value;
}

/**
 * Truncate an array to a maximum number of elements
 */
export function truncateArray<T>(array: T[], maxElements: number = 100): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.slice(0, maxElements);
}

// ============================================================================
// Escape Utilities
// ============================================================================

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return input.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Escape shell metacharacters
 */
export function escapeShell(input: string): string {
  // Escape shell special characters
  return input.replace(/([`$(){}|;&<>\\!#*?[\]~])/g, '\\$1');
}

/**
 * Escape for use in regular expressions
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// Combined Sanitization
// ============================================================================

/**
 * Apply full sanitization to a failure report
 */
export function sanitizeFailureReport(
  report: Record<string, unknown>,
  projectRoot: string
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  // Sanitize error fields
  if (report.error && typeof report.error === 'object') {
    const error = report.error as Record<string, unknown>;
    sanitized.error = {
      message: sanitizeString(error.message, { maxLength: 10000 }).value,
      stack: sanitizeString(error.stack, { maxLength: 20000 }).value,
      type: sanitizeString(error.type, { maxLength: 100 }).value,
    };
  }

  // Sanitize context fields
  if (report.context && typeof report.context === 'object') {
    const context = report.context as Record<string, unknown>;
    sanitized.context = {
      url: sanitizeString(context.url, { maxLength: 2000 }).value,
      screenshot: truncateValue(context.screenshot, 100000), // 100KB limit
      domSnapshot: truncateValue(context.domSnapshot, 50000), // 50KB limit
      consoleLogs: truncateArray(context.consoleLogs as unknown[], 100),
    };
  }

  // Copy other fields with basic sanitization
  for (const [key, value] of Object.entries(report)) {
    if (key !== 'error' && key !== 'context') {
      sanitized[key] = sanitizeJson(value);
    }
  }

  return sanitized;
}
