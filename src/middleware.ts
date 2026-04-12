// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to protect the Control Room area.
 * SECURITY: All /control-room routes (except /login) require valid authentication.
 * Users without admin_session cookie are redirected to login page.
 * Authenticated users visiting /login are redirected to control room.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for valid admin_session cookie
  const token = request.cookies.get("admin_session");
  const isAuthenticated = token && token.value === "authenticated";

  // STEP 1: If user is on login page
  if (pathname.startsWith("/control-room/login")) {
    // If already authenticated, redirect to control room
    if (isAuthenticated) {
      const controlRoomUrl = new URL("/control-room", request.url);
      return NextResponse.redirect(controlRoomUrl);
    }
    // Not authenticated - allow access to login
    return NextResponse.next();
  }

  // STEP 2: For all other /control-room routes, require authentication
  if (!isAuthenticated) {
    const loginUrl = new URL("/control-room/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // STEP 3: Allow authenticated requests to proceed
  return NextResponse.next();
}

// Apply middleware to ALL Control Room routes (including exact /control-room)
export const config = {
  matcher: ["/control-room", "/control-room/:path*"],
};
