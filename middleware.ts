import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'patchpilot_session';
const SECRET_KEY = process.env.SESSION_SECRET || 'default-dev-secret-do-not-use-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  // Public paths that don't require auth
  const publicPaths = [
    '/_next',
    '/api/auth',
    '/static',
    '/favicon.ico',
    '/demo', // Demo app is public? Maybe. Or maybe we want to protect it?
             // Usually demo app is the target, so it shouldn't be behind dashboard auth.
             // But let's assume /dashboard is the protected area.
  ];

  const path = request.nextUrl.pathname;

  // Allow public paths
  if (publicPaths.some(p => path.startsWith(p)) || path === '/') {
    return NextResponse.next();
  }

  // Check if it's the dashboard or protected API
  const isProtectedPath = path.startsWith('/dashboard') || (path.startsWith('/api') && !path.startsWith('/api/auth'));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Verify session
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      // Redirect to settings/login page
      // Assuming /dashboard/settings is where they connect? 
      // Or if they are trying to access /dashboard/runs without auth, maybe send them to /?
      // For now, redirect to home page or a login page if it exists.
      // There isn't a dedicated login page, but there is "Connect GitHub".
      
      // Let's redirect to '/' if not authenticated, as that seems to be the entry point.
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  try {
    await jwtVerify(sessionToken, key, { algorithms: ['HS256'] });
    return NextResponse.next();
  } catch (error) {
    // Invalid token
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
