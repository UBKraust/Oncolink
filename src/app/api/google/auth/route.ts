export const runtime = "edge";

import { NextResponse } from "next/server";
import { buildAuthUrl, isGoogleConfigured } from "@/lib/google/client";

export async function GET(): Promise<NextResponse> {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth neconfigurat." },
      { status: 503 },
    );
  }
  return NextResponse.redirect(buildAuthUrl("dashboard"));
}
