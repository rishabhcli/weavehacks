import type { TestSpec } from '@/lib/types';

// In-memory test specs store (replace with Redis in production)
const testSpecs = new Map<string, TestSpec>();

// No seed data - start with an empty store
// Tests will be added via the API

export function getAllTestSpecs(): TestSpec[] {
  return Array.from(testSpecs.values());
}

export function getTestSpec(id: string): TestSpec | undefined {
  return testSpecs.get(id);
}

export function addTestSpec(spec: TestSpec): void {
  testSpecs.set(spec.id, spec);
}

export function updateTestSpec(id: string, updates: Partial<TestSpec>): boolean {
  const spec = testSpecs.get(id);
  if (spec) {
    Object.assign(spec, updates);
    return true;
  }
  return false;
}

export function deleteTestSpec(id: string): boolean {
  return testSpecs.delete(id);
}
