export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SmartBillWebhookPayload } from "@/lib/smartbill/client";

/**
 * SmartBill sends a POST when an invoice event occurs (e.g. payment confirmed).
 * Verify the shared secret from Authorization header before mutating DB.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.SMARTBILL_WEBHOOK_SECRET;

  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: SmartBillWebhookPayload;
  try {
    payload = (await req.json()) as SmartBillWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.eventType !== "invoice.paid") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({ status: "PLĂTITĂ" })
    .eq("smartbill_series", payload.seriesName)
    .eq("smartbill_number", payload.number);

  if (error) {
    console.error("[smartbill-webhook] DB error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
