import type { Patch, FailureType } from '@/lib/types';

// Extended patch type for API responses
export interface PatchWithDetails extends Patch {
  status: 'pending' | 'applied' | 'rejected';
  runId: string;
  createdAt: Date;
  prUrl?: string;
  diagnosis: {
    type: FailureType;
    confidence: number;
    rootCause: string;
  };
}

// In-memory patches store (replace with Redis in production)
const patches = new Map<string, PatchWithDetails>();

// No seed data - start with an empty store
// Patches will be added by the orchestrator during runs

export function getAllPatches(): PatchWithDetails[] {
  return Array.from(patches.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPatch(id: string): PatchWithDetails | undefined {
  return patches.get(id);
}

export function addPatch(patch: PatchWithDetails): void {
  patches.set(patch.id, patch);
}

export function updatePatchStatus(
  id: string,
  status: 'pending' | 'applied' | 'rejected',
  prUrl?: string
): boolean {
  const patch = patches.get(id);
  if (patch) {
    patch.status = status;
    if (prUrl) {
      patch.prUrl = prUrl;
    }
    return true;
  }
  return false;
}
