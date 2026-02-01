import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    repos: session.repos,
  });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
