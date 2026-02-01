import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'patchpilot_session';
const SECRET_KEY = process.env.SESSION_SECRET || 'default-dev-secret-do-not-use-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require auth
  const publicPaths = [
    '/_next',
    '/api/auth',
    '/static',
    '/favicon.ico',
    '/demo',
  ];

  // Allow public paths
  if (publicPaths.some(p => path.startsWith(p)) || path === '/') {
    return NextResponse.next();
  }

  // Check if it's the dashboard or protected API
  const isProtectedPath = path.startsWith('/dashboard') || (path.startsWith('/api') && !path.startsWith('/api/auth'));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  console.log('=== Middleware ===');
  console.log('Path:', path);
  console.log('All cookies:', request.cookies.getAll().map(c => c.name));

  // Verify session
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  console.log('Session token present:', !!sessionToken);
  console.log('Session token length:', sessionToken?.length);

  if (!sessionToken) {
    console.log('NO SESSION TOKEN - redirecting to /');
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  try {
    const verified = await jwtVerify(sessionToken, key, { algorithms: ['HS256'] });
    console.log('JWT VERIFIED - user:', (verified.payload as any)?.user?.login);
    return NextResponse.next();
  } catch (error) {
    console.log('JWT VERIFICATION FAILED:', error);
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
