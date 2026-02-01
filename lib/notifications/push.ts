// Shared device token store (in production, use Redis/database)
export const deviceTokens = new Map<
  string,
  {
    token: string;
    platform: string;
    deviceName?: string;
    userId: number;
    registeredAt: Date;
  }
>();

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Helper function to send a notification (for use in other parts of the app)
 */
export async function sendPushNotification(
  userId: number,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    const userTokens = Array.from(deviceTokens.values())
      .filter((device) => device.userId === userId)
      .map((device) => device.token);

    if (userTokens.length === 0) {
      return false;
    }

    const messages = userTokens.map((token) => ({
      to: token,
      title,
      body,
      data: data || {},
      sound: 'default' as const,
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    return response.ok;
  } catch (error) {
    console.error('Send push notification error:', error);
    return false;
  }
}

// Notification type helpers for common scenarios
export const NotificationTypes = {
  runStarted: (runId: string, targetUrl: string) => ({
    title: '🚀 Run Started',
    body: `Testing ${targetUrl}`,
    data: { type: 'run_started', runId },
  }),

  runCompleted: (runId: string, bugsFound: number, patchesApplied: number) => ({
    title: '✅ Run Completed',
    body: `Found ${bugsFound} bugs, applied ${patchesApplied} patches`,
    data: { type: 'run_completed', runId },
  }),

  runFailed: (runId: string, error: string) => ({
    title: '❌ Run Failed',
    body: error.substring(0, 100),
    data: { type: 'run_failed', runId },
  }),

  patchGenerated: (runId: string, patchCount: number) => ({
    title: '🔧 Patches Generated',
    body: `${patchCount} patch${patchCount > 1 ? 'es' : ''} ready for review`,
    data: { type: 'patch_generated', runId },
  }),

  prCreated: (runId: string, prUrl: string) => ({
    title: '📝 PR Created',
    body: 'A pull request has been created with fixes',
    data: { type: 'pr_created', runId, prUrl },
  }),
};
