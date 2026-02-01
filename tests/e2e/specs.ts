/**
 * Test Specifications for PatchPilot
 *
 * Define your E2E test specs here.
 * Each spec represents a user flow to be tested by the Tester Agent.
 */

import type { TestSpec } from '@/lib/types';

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';

/**
 * Example test spec - Replace with your actual tests
 */
export const exampleTest: TestSpec = {
  id: 'test-example-001',
  name: 'Example Test Flow',
  url: `${BASE_URL}/`,
  steps: [
    {
      action: 'Verify the page loads',
      expected: 'I see the PatchPilot landing page',
    },
  ],
  timeout: 30000,
};

/**
 * All test specifications
 */
export const allTestSpecs: TestSpec[] = [
  exampleTest,
];

export default allTestSpecs;
