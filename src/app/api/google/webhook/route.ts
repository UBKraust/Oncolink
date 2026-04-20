export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { reconcileFromGoogle } from "@/lib/google/sync";

/**
 * Google Calendar push notification endpoint.
 * Google sends POST with X-Goog-Channel-Token matching GOOGLE_CALENDAR_WEBHOOK_TOKEN.
 * We pull changed events from the past 5 minutes and sync meet_link back.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const expectedToken = process.env.GOOGLE_CALENDAR_WEBHOOK_TOKEN;
  if (expectedToken) {
    const token = req.headers.get("x-goog-channel-token") ?? "";
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const resourceState = req.headers.get("x-goog-resource-state");
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true, skipped: "sync" });
  }

  const updatedMin = new Date(Date.now() - 5 * 60_000).toISOString();
  try {
    await reconcileFromGoogle(updatedMin);
  } catch (e) {
    console.error("[google-webhook] reconcile error:", (e as Error).message);
    return NextResponse.json({ error: "reconcile failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
