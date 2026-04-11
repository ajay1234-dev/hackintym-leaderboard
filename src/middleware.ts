// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect the Control Room area.
 * If the user does not have a valid authentication cookie (e.g., `auth_token`),
 * they are redirected to the login page located at `/control-room/login`.
 * The login page itself is excluded from this check to avoid a redirect loop.
 * Adjust the cookie name according to your authentication implementation.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page (and any sub-routes under it) without authentication.
  if (pathname.startsWith('/control-room/login')) {
    return NextResponse.next();
  }

  // Example: check for a cookie named 'admin_session'. Replace with your actual auth cookie.
  const token = request.cookies.get('admin_session');

  // If no token is present, redirect to the login page.
  if (!token) {
    const loginUrl = new URL('/control-room/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to continue.
  return NextResponse.next();
}

// Apply middleware only to Control Room routes.
export const config = {
  matcher: ['/control-room/:path*'],
};
