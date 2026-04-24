export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { consumeAppointmentActionAccessToken } from "@/lib/security/public-links";

/**
 * GET /api/confirm?t=<token>
 *
 * Used in WhatsApp reminder links. Updates status and redirects to a
 * simple confirmation page.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t");

  if (!token) {
    return NextResponse.json({ error: "Parametri invalizi." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL("/confirm-result?action=confirm&demo=1", req.url),
    );
  }

  const result = await consumeAppointmentActionAccessToken(token);
  if (!result.success) {
    return NextResponse.redirect(
      new URL("/confirm-result?action=cancel&error=expired", req.url),
    );
  }

  return NextResponse.redirect(
    new URL(`/confirm-result?action=${result.action}`, req.url),
  );
}
