/**
 * Test Specifications for PatchPilot Demo App
 *
 * These tests are designed to detect the 3 intentional bugs:
 * - Bug 1: Missing onClick handler on checkout button (cart page)
 * - Bug 2: Wrong API route - /api/payments doesn't exist (checkout API)
 * - Bug 3: Null reference error in signup (userData.preferences.newsletter)
 */

import type { TestSpec } from '@/lib/types';

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';

/**
 * Test 1: Checkout Flow
 * Expected to fail on Bug 1 - checkout button has no onClick handler
 */
export const checkoutFlowTest: TestSpec = {
  id: 'test-checkout-001',
  name: 'Checkout Flow',
  url: `${BASE_URL}/demo/cart`,
  steps: [
    {
      action: 'Click the Checkout button',
      expected: 'I see a checkout confirmation or processing message',
    },
  ],
  timeout: 30000,
};

/**
 * Test 2: Complete Checkout with Payment
 * Expected to fail on Bug 2 - API calls non-existent /api/payments
 */
export const checkoutWithPaymentTest: TestSpec = {
  id: 'test-checkout-002',
  name: 'Complete Checkout with Payment',
  url: `${BASE_URL}/demo/cart`,
  steps: [
    {
      action: 'Click the Checkout button to start checkout process',
      expected: 'I see order confirmed or success message',
    },
  ],
  timeout: 45000,
};

/**
 * Test 3: User Signup Flow
 * Expected to fail on Bug 3 - null reference on preferences.newsletter
 */
export const signupFlowTest: TestSpec = {
  id: 'test-signup-001',
  name: 'User Signup Flow',
  url: `${BASE_URL}/demo/signup`,
  steps: [
    {
      action: 'Fill in name field with "Test User"',
    },
    {
      action: 'Fill in email field with "test@example.com"',
    },
    {
      action: 'Fill in password field with "password123"',
    },
    {
      action: 'Fill in confirm password field with "password123"',
    },
    {
      action: 'Click the Create Account or Submit button',
      expected: 'I see a success or welcome message',
    },
  ],
  timeout: 30000,
};

/**
 * All test specifications
 */
export const allTestSpecs: TestSpec[] = [
  checkoutFlowTest,
  checkoutWithPaymentTest,
  signupFlowTest,
];

export default allTestSpecs;
