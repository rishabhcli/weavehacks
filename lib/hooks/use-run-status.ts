'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { RunEvent, RunStatus, AgentType } from '@/lib/types';

interface RunState {
  status: RunStatus;
  currentAgent: AgentType | null;
  iteration: number;
  events: RunEvent[];
}

export function useRunStatus(runId: string | null) {
  const [state, setState] = useState<RunState>({
    status: 'pending',
    currentAgent: null,
    iteration: 0,
    events: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!runId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/runs/${runId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: RunEvent = JSON.parse(event.data);

        setState((prev) => {
          const newState = { ...prev };

          // Update state based on event type
          switch (data.type) {
            case 'status': {
              const statusData = data.data as { status?: RunStatus; currentAgent?: AgentType | null; iteration?: number };
              if (statusData.status) newState.status = statusData.status;
              if (statusData.currentAgent !== undefined) newState.currentAgent = statusData.currentAgent;
              if (statusData.iteration !== undefined) newState.iteration = statusData.iteration;
              break;
            }
            case 'agent': {
              const agentData = data.data as { agent: string; status: string };
              if (agentData.status === 'started') {
                newState.currentAgent = agentData.agent as AgentType;
              } else if (agentData.status === 'completed') {
                newState.currentAgent = null;
              }
              break;
            }
            case 'complete': {
              const completeData = data.data as { success: boolean };
              newState.status = completeData.success ? 'completed' : 'failed';
              newState.currentAgent = null;
              break;
            }
            case 'error':
              newState.status = 'failed';
              newState.currentAgent = null;
              break;
          }

          // Add event to history
          newState.events = [...prev.events, data].slice(-50); // Keep last 50 events

          return newState;
        });
      } catch {
        // Ignore parsing errors (e.g., for ping comments)
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Retry connection after 5 seconds
      setTimeout(connect, 5000);
    };
  }, [runId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    ...state,
    isConnected,
    connect,
    disconnect,
  };
}
