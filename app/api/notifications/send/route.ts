import { NextRequest, NextResponse } from 'next/server';

// Import device tokens from register endpoint
// In production, this would be a database query
const deviceTokens = new Map<string, {
  token: string;
  platform: string;
  deviceName?: string;
  userId: number;
  registeredAt: Date;
}>();

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationPayload {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

/**
 * Send push notifications to a user's devices
 * 
 * This endpoint is called internally by agents to notify users
 * about run status changes, patch generation, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Check for internal API key or session
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY;
    
    // Allow internal calls or authenticated users
    if (authHeader !== `Bearer ${internalKey}` && !authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: PushNotificationPayload = await request.json();

    if (!payload.userId || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Find all device tokens for this user
    const userTokens = Array.from(deviceTokens.values())
      .filter(device => device.userId === payload.userId)
      .map(device => device.token);

    if (userTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No devices registered for this user',
        sent: 0,
      });
    }

    // Build Expo push messages
    const messages = userTokens.map(token => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      sound: payload.sound || 'default',
      badge: payload.badge,
      channelId: payload.channelId || 'default',
    }));

    // Send to Expo Push Service
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Expo push error:', error);
      return NextResponse.json(
        { error: 'Failed to send push notifications' },
        { status: 500 }
      );
    }

    const result = await response.json();
    
    console.log(`Sent ${messages.length} push notifications to user ${payload.userId}`);

    return NextResponse.json({
      success: true,
      sent: messages.length,
      tickets: result.data,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

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
      .filter(device => device.userId === userId)
      .map(device => device.token);

    if (userTokens.length === 0) {
      return false;
    }

    const messages = userTokens.map(token => ({
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
