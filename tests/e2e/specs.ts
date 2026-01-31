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
  url: `${BASE_URL}/cart`,
  steps: [
    {
      action: 'Wait for the page to load completely',
      expected: 'I see a shopping cart with items',
    },
    {
      action: 'Look for the checkout button and click it',
      expected: 'I see a checkout confirmation or payment form',
    },
    {
      action: 'Verify the checkout process started',
      expected: 'I see "Order Confirmed" or "Processing" message',
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
  url: `${BASE_URL}`,
  steps: [
    {
      action: 'Click on "Add to Cart" button for the first product',
      expected: 'I see a success message about adding to cart',
    },
    {
      action: 'Click on the "View Cart" button or navigate to cart',
    },
    {
      action: 'Wait for cart page to load',
      expected: 'I see the shopping cart with the item I added',
    },
    {
      action: 'Click the Checkout button',
      expected: 'I see the order is being processed or confirmed',
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
  url: `${BASE_URL}/signup`,
  steps: [
    {
      action: 'Wait for the signup form to load',
      expected: 'I see a signup form with name, email, and password fields',
    },
    {
      action: 'Type "Test User" into the name input field',
    },
    {
      action: 'Type "test@example.com" into the email input field',
    },
    {
      action: 'Type "password123" into the password input field',
    },
    {
      action: 'Type "password123" into the confirm password input field',
    },
    {
      action: 'Click the "Create Account" button to submit the form',
      expected: 'I see a welcome message or account created confirmation',
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
