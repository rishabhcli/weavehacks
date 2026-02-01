import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export async function POST(_request: NextRequest) {
  if (!DAILY_API_KEY) {
    return NextResponse.json(
      { error: 'Daily API key not configured' },
      { status: 500 }
    );
  }

  try {
    const roomResponse = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `patchpilot-${Date.now()}`,
        properties: {
          enable_chat: false,
          enable_screenshare: false,
          max_participants: 2,
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    });

    const room = await roomResponse.json();

    if (room.error) {
      return NextResponse.json(
        { error: room.error.message ?? 'Failed to create room' },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: room.name,
          is_owner: true,
        },
      }),
    });

    const token = await tokenResponse.json();

    if (token.error) {
      return NextResponse.json(
        { error: token.error.message ?? 'Failed to create token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      roomUrl: room.url,
      token: token.token,
      roomName: room.name,
    });
  } catch (error) {
    console.error('Error creating voice session:', error);
    return NextResponse.json(
      { error: 'Failed to create voice session' },
      { status: 500 }
    );
  }
}
