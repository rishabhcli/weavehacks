import { NextRequest, NextResponse } from 'next/server';
import { getGitHubAuthUrl } from '@/lib/auth/github';

const MOBILE_REDIRECT_COOKIE = 'github_oauth_redirect';

export async function GET(request: NextRequest) {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();
  const redirectParam = request.nextUrl.searchParams.get('redirect');

  // Store state in a cookie for verification in callback
  const response = NextResponse.redirect(getGitHubAuthUrl(state));
  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  if (redirectParam) {
    try {
      const redirectUrl = new URL(redirectParam);
      if (redirectUrl.protocol === 'patchpilot:') {
        response.cookies.set(MOBILE_REDIRECT_COOKIE, redirectParam, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600, // 10 minutes
        });
      }
    } catch {
      // Ignore invalid redirect URLs
    }
  }

  return response;
}
