// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * App Mode Router Middleware
 * Handles restricting routes based on NEXT_PUBLIC_APP_MODE
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appMode = process.env.NEXT_PUBLIC_APP_MODE; // "admin" or "arena"

  if (appMode === "arena") {
    // If mode is "arena", block all non-arena routes
    // Allow /arena, /api, and asset folders usually ignored by matcher, just in case
    if (
      !pathname.startsWith("/arena") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/sounds") &&
      !pathname.startsWith("/favicon")
    ) {
      const arenaUrl = new URL("/arena", request.url);
      return NextResponse.redirect(arenaUrl);
    }
  }

  // Admin deployment allows everything
  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sounds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
