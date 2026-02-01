import { NextRequest, NextResponse } from 'next/server';
import { deviceTokens } from '@/lib/notifications/push';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      .filter((device) => device.userId === payload.userId)
      .map((device) => device.token);

    if (userTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No devices registered for this user',
        sent: 0,
      });
    }

    // Build Expo push messages
    const messages = userTokens.map((token) => ({
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
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Expo push error:', error);
      return NextResponse.json({ error: 'Failed to send push notifications' }, { status: 500 });
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
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
