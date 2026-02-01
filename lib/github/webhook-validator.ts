/**
 * GitHub Webhook Signature Validator
 *
 * Verifies webhook payloads using HMAC-SHA256.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify a GitHub webhook signature
 * @param payload - The raw request body as a string
 * @param signature - The X-Hub-Signature-256 header value
 * @param secret - The webhook secret
 * @returns true if the signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    console.warn('Missing webhook signature');
    return false;
  }

  if (!secret) {
    console.warn('Webhook secret not configured');
    return false;
  }

  // GitHub sends signature as "sha256=<hash>"
  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    console.warn('Invalid signature format');
    return false;
  }

  const receivedSignature = parts[1];

  // Calculate expected signature
  const hmac = createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const expectedSignature = hmac.digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Extract event type from GitHub webhook headers
 */
export function getWebhookEventType(headers: Headers): string | null {
  return headers.get('x-github-event');
}

/**
 * Extract delivery ID from GitHub webhook headers
 */
export function getWebhookDeliveryId(headers: Headers): string | null {
  return headers.get('x-github-delivery');
}

/**
 * Webhook event types that trigger runs
 */
export const TRIGGERING_EVENTS = ['push', 'pull_request'] as const;
export type TriggeringEvent = (typeof TRIGGERING_EVENTS)[number];

/**
 * Check if an event type should trigger a run
 */
export function isTriggeringEvent(eventType: string | null): eventType is TriggeringEvent {
  return TRIGGERING_EVENTS.includes(eventType as TriggeringEvent);
}

/**
 * Pull request actions that should trigger a run
 */
export const TRIGGERING_PR_ACTIONS = ['opened', 'synchronize', 'reopened'] as const;

/**
 * Check if a PR action should trigger a run
 */
export function isTriggeringPRAction(action: string): boolean {
  return TRIGGERING_PR_ACTIONS.includes(action as (typeof TRIGGERING_PR_ACTIONS)[number]);
}

/**
 * Generate a webhook secret
 */
export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
