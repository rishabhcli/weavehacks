import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getGitHubUser } from '@/lib/auth/github';
import { encrypt } from '@/lib/auth/session';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SESSION_COOKIE = 'patchpilot_session';

export async function GET(request: NextRequest) {
  console.log('=== GitHub OAuth Callback ===');

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('github_oauth_state')?.value;

  console.log('Code:', code ? 'present' : 'missing');
  console.log('State from URL:', state);
  console.log('State from cookie:', storedState);

  // Verify state to prevent CSRF
  if (!state || state !== storedState) {
    console.log('STATE MISMATCH - redirecting to home');
    return NextResponse.redirect(`${APP_URL}/?error=invalid_state`);
  }

  if (!code) {
    console.log('NO CODE - redirecting to home');
    return NextResponse.redirect(`${APP_URL}/?error=no_code`);
  }

  try {
    console.log('Exchanging code for token...');
    const accessToken = await exchangeCodeForToken(code);
    console.log('Got access token:', accessToken ? 'yes' : 'no');

    console.log('Fetching user...');
    const user = await getGitHubUser(accessToken);
    console.log('User:', user?.login);

    // Create session token - ONLY store user and accessToken, NOT repos
    // This keeps the cookie small (under 4KB limit)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionToken = await encrypt({ accessToken, user, expiresAt });
    console.log('Session token created, length:', sessionToken.length);

    const redirectUrl = new URL('/dashboard?connected=true', APP_URL);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    response.cookies.set('github_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    console.log('SUCCESS - redirecting with session cookie set');
    return response;
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(`${APP_URL}/?error=oauth_failed`);
  }
}
