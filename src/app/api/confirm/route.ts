export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/confirm?id=<appointmentId>&action=confirm|cancel
 *
 * Used in WhatsApp reminder links. Updates status and redirects to a
 * simple confirmation page.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");

  if (!id || (action !== "confirm" && action !== "cancel")) {
    return NextResponse.json({ error: "Parametri invalizi." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(`/confirm-result?action=${action}&demo=1`, req.url),
    );
  }

  const supabase = createSupabaseServiceClient();
  const newStatus = action === "confirm" ? "CONFIRMAT" : "ANULAT";

  await supabase
    .from("appointments")
    .update({ status: newStatus })
    .eq("id", id)
    .in("status", ["PROGRAMAT", "CONFIRMAT"]);

  return NextResponse.redirect(
    new URL(`/confirm-result?action=${action}`, req.url),
  );
}
