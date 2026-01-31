/**
 * Browserbase Client Wrapper
 * Provides a configured Browserbase client for browser automation
 */

import Browserbase from '@browserbasehq/sdk';

let browserbaseClient: Browserbase | null = null;

export function getBrowserbaseClient(): Browserbase {
  if (!browserbaseClient) {
    const apiKey = process.env.BROWSERBASE_API_KEY;

    if (!apiKey) {
      throw new Error('BROWSERBASE_API_KEY environment variable is required');
    }

    browserbaseClient = new Browserbase({
      apiKey,
    });
  }

  return browserbaseClient;
}

export function getProjectId(): string {
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error('BROWSERBASE_PROJECT_ID environment variable is required');
  }

  return projectId;
}

export { Browserbase };
