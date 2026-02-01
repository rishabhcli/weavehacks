/**
 * Unit tests for Browserbase Client
 * Tests singleton pattern and environment variable validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Browserbase SDK
const MockBrowserbase = vi.fn().mockImplementation(() => ({
  sessions: {
    create: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('@browserbasehq/sdk', () => ({
  default: MockBrowserbase,
}));

describe('Browserbase Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset module cache to test singleton behavior
    vi.resetModules();
    vi.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.BROWSERBASE_API_KEY;
    delete process.env.BROWSERBASE_PROJECT_ID;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getBrowserbaseClient()', () => {
    it('should throw when BROWSERBASE_API_KEY not set', async () => {
      delete process.env.BROWSERBASE_API_KEY;

      const { getBrowserbaseClient } = await import('@/lib/browserbase/client');

      expect(() => getBrowserbaseClient()).toThrow('BROWSERBASE_API_KEY environment variable is required');
    });

    it('should create client with API key', async () => {
      process.env.BROWSERBASE_API_KEY = 'test-api-key';

      const { getBrowserbaseClient } = await import('@/lib/browserbase/client');
      const client = getBrowserbaseClient();

      expect(client).toBeDefined();
      expect(MockBrowserbase).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should return singleton instance', async () => {
      process.env.BROWSERBASE_API_KEY = 'test-api-key';

      const { getBrowserbaseClient } = await import('@/lib/browserbase/client');

      const client1 = getBrowserbaseClient();
      const client2 = getBrowserbaseClient();

      expect(client1).toBe(client2);
      // Should only create once
      expect(MockBrowserbase).toHaveBeenCalledTimes(1);
    });

    it('should reuse cached client on subsequent calls', async () => {
      process.env.BROWSERBASE_API_KEY = 'test-api-key';

      const { getBrowserbaseClient } = await import('@/lib/browserbase/client');

      getBrowserbaseClient();
      getBrowserbaseClient();
      getBrowserbaseClient();

      // Should only instantiate once
      expect(MockBrowserbase).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProjectId()', () => {
    it('should throw when BROWSERBASE_PROJECT_ID not set', async () => {
      delete process.env.BROWSERBASE_PROJECT_ID;

      const { getProjectId } = await import('@/lib/browserbase/client');

      expect(() => getProjectId()).toThrow('BROWSERBASE_PROJECT_ID environment variable is required');
    });

    it('should return project ID when set', async () => {
      process.env.BROWSERBASE_PROJECT_ID = 'test-project-id';

      const { getProjectId } = await import('@/lib/browserbase/client');
      const projectId = getProjectId();

      expect(projectId).toBe('test-project-id');
    });

    it('should return same value on multiple calls', async () => {
      process.env.BROWSERBASE_PROJECT_ID = 'consistent-id';

      const { getProjectId } = await import('@/lib/browserbase/client');

      const id1 = getProjectId();
      const id2 = getProjectId();

      expect(id1).toBe(id2);
      expect(id1).toBe('consistent-id');
    });

    it('should handle empty string as missing', async () => {
      process.env.BROWSERBASE_PROJECT_ID = '';

      const { getProjectId } = await import('@/lib/browserbase/client');

      expect(() => getProjectId()).toThrow('BROWSERBASE_PROJECT_ID environment variable is required');
    });
  });

  describe('Exports', () => {
    it('should export Browserbase class', async () => {
      const browserbaseModule = await import('@/lib/browserbase');

      expect(browserbaseModule.Browserbase).toBeDefined();
    });

    it('should export getBrowserbaseClient function', async () => {
      const browserbaseModule = await import('@/lib/browserbase');

      expect(typeof browserbaseModule.getBrowserbaseClient).toBe('function');
    });

    it('should export getProjectId function', async () => {
      const browserbaseModule = await import('@/lib/browserbase');

      expect(typeof browserbaseModule.getProjectId).toBe('function');
    });
  });
});
