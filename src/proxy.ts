import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('admin_session');
  const isAuthenticated = authCookie && authCookie.value === 'authenticated';

  // Block unauthenticated access to the main control room
  if (pathname.startsWith('/control-room') && !pathname.startsWith('/control-room/login')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/control-room/login', request.url));
    }
  }

  // Prevent authenticated users from getting stuck on the login page
  if (pathname === '/control-room/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/control-room', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/control-room/:path*'],
};
