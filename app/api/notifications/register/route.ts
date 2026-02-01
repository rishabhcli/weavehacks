import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { deviceTokens } from '@/lib/notifications/push';

/**
 * Register a device for push notifications
 *
 * Called by the mobile app to register its Expo push token
 * with the backend so we can send notifications.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, platform, deviceName } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing push token' }, { status: 400 });
    }

    // Store the device token
    deviceTokens.set(token, {
      token,
      platform: platform || 'unknown',
      deviceName,
      userId: session.user.id,
      registeredAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Device registered for push notifications',
    });
  } catch (error) {
    console.error('Push notification registration error:', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}

/**
 * Get registered devices for the current user
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const userDevices = Array.from(deviceTokens.values())
      .filter((device) => device.userId === user.id)
      .map((device) => ({
        platform: device.platform,
        deviceName: device.deviceName,
        registeredAt: device.registeredAt,
      }));

    return NextResponse.json({
      devices: userDevices,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json({ error: 'Failed to get devices' }, { status: 500 });
  }
}
