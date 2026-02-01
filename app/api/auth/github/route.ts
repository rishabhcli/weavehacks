import { NextResponse } from 'next/server';
import { getGitHubAuthUrl } from '@/lib/auth/github';

export async function GET() {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in a cookie for verification in callback
  const response = NextResponse.redirect(getGitHubAuthUrl(state));
  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}
