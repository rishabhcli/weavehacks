import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getGitHubUser, getGitHubRepos } from '@/lib/auth/github';
import { createSession } from '@/lib/auth/session';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('github_oauth_state')?.value;

  // Verify state to prevent CSRF
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?error=no_code`);
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Get user info and repos
    const [user, repos] = await Promise.all([
      getGitHubUser(accessToken),
      getGitHubRepos(accessToken),
    ]);

    // Create session
    await createSession({
      accessToken,
      user,
      repos,
    });

    // Clear state cookie and redirect
    const response = NextResponse.redirect(`${APP_URL}/dashboard/settings?connected=true`);
    response.cookies.delete('github_oauth_state');

    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?error=oauth_failed`);
  }
}
