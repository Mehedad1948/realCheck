import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/auth/session-token';

// Optimistic routing only: redirects based on the session cookie so signed-out users
// don't see a flash of the dashboard. Real authorization happens in
// `src/server/auth/dal.ts`, which every page, action and route handler calls.
// The Mini App (/app) and the API are not matched: they authenticate per request.

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isClient = session?.role === 'CLIENT';

  if (pathname.startsWith('/dashboard') && !isClient) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname + search);
    return NextResponse.redirect(login);
  }

  if ((pathname === '/login' || pathname === '/register') && isClient) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
