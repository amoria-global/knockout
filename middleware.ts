import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Home app middleware for route protection.
 * Checks for authToken cookie and redirects unauthenticated users
 * to login immediately — before any page content loads.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get('authToken')?.value;
  const hasToken = !!authToken;

  // Protected routes that require authentication (allowlist approach)
  const protectedPrefixes = [
    '/user/photographers/book-now',
  ];

  const isProtectedRoute = protectedPrefixes.some(prefix =>
    pathname.startsWith(prefix)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // No token on a protected route → redirect to login with return URL
  if (!hasToken) {
    const loginUrl = new URL('/user/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
