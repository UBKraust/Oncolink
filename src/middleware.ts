import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // updateSession redirects unauthenticated users to /auth/login.
  // For API routes a redirect is wrong — return 401 instead.
  if (
    response.status === 307 &&
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: [
    // Dashboard pages
    "/dashboard/:path*",
    // Sensitive API routes — excludes public endpoints:
    //   /api/book, /api/bookings/create, /api/confirm, /api/health,
    //   /api/cron/*, /api/webhooks/*, /api/google/*, /onboarding/*
    "/api/ai/:path*",
    "/api/clients/:path*",
    "/api/billing/:path*",
    "/api/analytics/:path*",
    "/api/exports/:path*",
    "/api/import/:path*",
    "/api/documents/:path*",
    "/api/activity/:path*",
    "/api/uploads/:path*",
    "/api/contracts/:path*",
  ],
};
