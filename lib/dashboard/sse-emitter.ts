import type { RunEvent } from '@/lib/types';

type SSECallback = (event: RunEvent) => void;

// Singleton SSE emitter
class SSEEmitter {
  private subscribers: Map<string, Set<SSECallback>> = new Map();

  subscribe(runId: string, callback: SSECallback): () => void {
    if (!this.subscribers.has(runId)) {
      this.subscribers.set(runId, new Set());
    }

    this.subscribers.get(runId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(runId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(runId);
        }
      }
    };
  }

  emit(event: RunEvent): void {
    const callbacks = this.subscribers.get(event.runId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }
  }

  emitToAll(event: Omit<RunEvent, 'runId'> & { runId?: string }): void {
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach((callback) => callback(event as RunEvent));
    });
  }

  hasSubscribers(runId: string): boolean {
    return (this.subscribers.get(runId)?.size || 0) > 0;
  }
}

// Export singleton instance
export const sseEmitter = new SSEEmitter();

// Helper to emit common events
export function emitRunStarted(runId: string): void {
  sseEmitter.emit({
    type: 'status',
    timestamp: new Date(),
    runId,
    data: { status: 'running' },
  });
}

export function emitAgentStarted(runId: string, agent: string): void {
  sseEmitter.emit({
    type: 'agent',
    timestamp: new Date(),
    runId,
    data: { agent, status: 'started' },
  });
}

export function emitAgentCompleted(runId: string, agent: string, result?: unknown): void {
  sseEmitter.emit({
    type: 'agent',
    timestamp: new Date(),
    runId,
    data: { agent, status: 'completed', result },
  });
}

export function emitTestResult(
  runId: string,
  testId: string,
  passed: boolean,
  screenshot?: string
): void {
  sseEmitter.emit({
    type: 'test',
    timestamp: new Date(),
    runId,
    data: { testId, passed, screenshot },
  });
}

export function emitPatchGenerated(runId: string, patch: unknown): void {
  sseEmitter.emit({
    type: 'patch',
    timestamp: new Date(),
    runId,
    data: { patch, status: 'generated' },
  });
}

export function emitPatchApplied(runId: string, patchId: string, prUrl?: string): void {
  sseEmitter.emit({
    type: 'patch',
    timestamp: new Date(),
    runId,
    data: { patchId, status: 'applied', prUrl },
  });
}

export function emitRunCompleted(runId: string, success: boolean): void {
  sseEmitter.emit({
    type: 'complete',
    timestamp: new Date(),
    runId,
    data: { success },
  });
}

export function emitRunError(runId: string, error: string): void {
  sseEmitter.emit({
    type: 'error',
    timestamp: new Date(),
    runId,
    data: { error },
  });
}
