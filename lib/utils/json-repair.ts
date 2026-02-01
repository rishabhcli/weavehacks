/**
 * JSON Repair Utility
 *
 * Handles malformed JSON output from LLMs (especially Gemini) which often
 * produces truncated strings, missing brackets, or markdown-wrapped responses.
 */

export interface ExtractJSONOptions {
  /** Required fields that must be present in the result */
  requiredFields?: string[];
  /** Whether to be lenient with missing fields */
  lenient?: boolean;
}

/**
 * Extract and repair JSON from potentially malformed LLM output
 */
export function extractJSON<T = Record<string, unknown>>(
  text: string,
  options: ExtractJSONOptions = {}
): T | null {
  const { requiredFields = [], lenient = false } = options;

  // 1. Try direct parse first
  try {
    const result = JSON.parse(text);
    if (validateResult(result, requiredFields, lenient)) {
      return result as T;
    }
  } catch {
    // Continue to repair attempts
  }

  // 2. Strip markdown code blocks
  let cleaned = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1];
  }

  // Try parsing cleaned version
  try {
    const result = JSON.parse(cleaned.trim());
    if (validateResult(result, requiredFields, lenient)) {
      return result as T;
    }
  } catch {
    // Continue to repair attempts
  }

  // 3. Find JSON object boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart === -1) {
    return null;
  }

  let jsonStr = cleaned.slice(jsonStart, jsonEnd !== -1 ? jsonEnd + 1 : undefined);

  // 4. Repair common issues
  jsonStr = repairJSON(jsonStr);

  // 5. Try parsing repaired JSON
  try {
    const result = JSON.parse(jsonStr);
    if (validateResult(result, requiredFields, lenient)) {
      return result as T;
    }
  } catch {
    // Final fallback: try more aggressive repair
  }

  // 6. Aggressive repair for severely truncated JSON
  try {
    const aggressivelyRepaired = aggressiveRepair(jsonStr);
    const result = JSON.parse(aggressivelyRepaired);
    if (validateResult(result, requiredFields, lenient)) {
      return result as T;
    }
  } catch {
    // Could not parse
  }

  return null;
}

/**
 * Basic JSON repair for common issues
 */
function repairJSON(json: string): string {
  let repaired = json;

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix unterminated strings at the end
  const openQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
  if (openQuotes % 2 === 1) {
    // Odd number of quotes - find and close the last unterminated string
    repaired = closeUnterminatedString(repaired);
  }

  // Ensure closing braces/brackets
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }

  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}';
  }

  return repaired;
}

/**
 * Close an unterminated string
 */
function closeUnterminatedString(json: string): string {
  // Find the last quote that opens a string
  let inString = false;
  let lastOpenQuote = -1;

  for (let i = 0; i < json.length; i++) {
    if (json[i] === '"' && (i === 0 || json[i - 1] !== '\\')) {
      if (!inString) {
        lastOpenQuote = i;
        inString = true;
      } else {
        inString = false;
        lastOpenQuote = -1;
      }
    }
  }

  if (lastOpenQuote !== -1 && inString) {
    // We have an unterminated string
    // Find where the string value should end
    const afterQuote = json.slice(lastOpenQuote + 1);

    // Look for a reasonable end point
    const newlinePos = afterQuote.indexOf('\n');
    if (newlinePos !== -1) {
      // Truncate at newline and close string
      return json.slice(0, lastOpenQuote + 1 + newlinePos) + '"';
    }

    // Just append a closing quote
    return json + '"';
  }

  return json;
}

/**
 * Aggressive repair for severely malformed JSON
 */
function aggressiveRepair(json: string): string {
  let repaired = json;

  // Remove any text after an obviously complete JSON object
  const lastBrace = repaired.lastIndexOf('}');
  if (lastBrace !== -1) {
    // Check if there's garbage after the last brace
    const afterBrace = repaired.slice(lastBrace + 1).trim();
    if (afterBrace && !afterBrace.startsWith(',') && !afterBrace.startsWith(']')) {
      repaired = repaired.slice(0, lastBrace + 1);
    }
  }

  // Handle truncated values
  // Pattern: "key": <truncated>
  repaired = repaired.replace(/":\s*$/g, '": ""');

  // Pattern: "key": value (missing comma)
  // Already handled by basic repair

  // Remove incomplete key-value pairs at the end
  repaired = repaired.replace(/,\s*"[^"]*":\s*$/g, '');
  repaired = repaired.replace(/,\s*"[^"]*"\s*$/g, '');

  // Run basic repair again after aggressive fixes
  return repairJSON(repaired);
}

/**
 * Validate that result has required fields
 */
function validateResult(result: unknown, requiredFields: string[], lenient: boolean): boolean {
  if (typeof result !== 'object' || result === null) {
    return false;
  }

  if (requiredFields.length === 0 || lenient) {
    return true;
  }

  const obj = result as Record<string, unknown>;
  return requiredFields.every((field) => field in obj);
}

/**
 * Extract JSON with retry using a modified prompt
 * For use with LLM calls that need retrying
 */
export async function extractJSONWithRetry<T = Record<string, unknown>>(
  llmCall: (modifiedPrompt?: string) => Promise<string>,
  options: ExtractJSONOptions & { maxRetries?: number } = {}
): Promise<T | null> {
  const { maxRetries = 3, ...extractOptions } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const prompt = attempt === 0 ? undefined : getRetryPrompt(attempt);
    const response = await llmCall(prompt);
    const result = extractJSON<T>(response, extractOptions);

    if (result !== null) {
      return result;
    }

    if (attempt < maxRetries - 1) {
      console.log(`JSON parse failed (attempt ${attempt + 1}/${maxRetries}), retrying...`);
    }
  }

  return null;
}

/**
 * Get a modified prompt suffix for retries
 */
function getRetryPrompt(attempt: number): string {
  const prompts = [
    '\n\nIMPORTANT: Return ONLY valid JSON, no markdown formatting or extra text.',
    '\n\nCRITICAL: Your response must be a single valid JSON object. Start with { and end with }. No markdown code blocks.',
    '\n\nRESPOND WITH PURE JSON ONLY. Example format: {"key": "value"}',
  ];
  return prompts[Math.min(attempt, prompts.length - 1)];
}

/**
 * Safely stringify an object for error messages
 */
export function safeStringify(obj: unknown, maxLength: number = 200): string {
  try {
    const str = JSON.stringify(obj);
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + '...';
    }
    return str;
  } catch {
    return '[Unable to stringify]';
  }
}
