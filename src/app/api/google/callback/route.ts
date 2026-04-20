export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/google/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?google=error", req.url),
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const supabase = await createSupabaseServerClient();
    await supabase.from("therapist_settings" as never).upsert(
      {
        id: 1,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token ?? null,
        google_token_expires_at: expiresAt.toISOString(),
      } as never,
      { onConflict: "id" },
    );
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?google=error", req.url),
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/settings?google=connected", req.url),
  );
}
