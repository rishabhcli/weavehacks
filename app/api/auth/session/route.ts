import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth/session';
import { getGitHubRepos } from '@/lib/auth/github';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  // Fetch repos dynamically if we have an access token
  // (repos are not stored in session to keep cookie small)
  let repos = session.repos || [];
  if (session.accessToken && repos.length === 0) {
    try {
      repos = await getGitHubRepos(session.accessToken);
    } catch (error) {
      console.error('Failed to fetch repos:', error);
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    repos,
  });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
