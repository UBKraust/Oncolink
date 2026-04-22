export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { format, addHours } from "date-fns";
import { ro } from "date-fns/locale";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isTwilioConfigured,
  sendMessage,
  reminderMsg,
  unpaidInvoiceMsg,
  travelReminderMsg,
} from "@/lib/twilio/client";
import { deriveLocation } from "@/lib/appointments/helpers";

/**
 * Cron endpoint — invoke every hour via Cloudflare Cron Triggers.
 * Verifies CRON_SECRET header before executing.
 *
 * Jobs run:
 * 1. 24h reminder: appointments tomorrow → send WhatsApp confirm/cancel link
 * 2. Unpaid invoices: invoices with status RESTANTĂ → send payment link
 * 3. Travel reminder: POLICLINIC appointments starting in ~35 min → notify therapist
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth.replace(/^Bearer\s+/i, "").trim() !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured() || !isTwilioConfigured()) {
    return NextResponse.json({ ok: true, skipped: "not configured" });
  }

  const results = { reminders: 0, unpaid: 0, travel: 0, errors: [] as string[] };
  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://oncolink.app";

  // ─── Job 1: 24h appointment reminders ──────────────────────────────────────
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 3_600_000);
    const windowEnd = new Date(now.getTime() + 25 * 3_600_000);

    const { data: upcoming } = await supabase
      .from("appointments")
      .select("id, appointment_date, client:clients(full_name, phone)")
      .in("status", ["PROGRAMAT", "CONFIRMAT"])
      .gte("appointment_date", windowStart.toISOString())
      .lte("appointment_date", windowEnd.toISOString())
      .eq("is_external_duty", false);

    for (const a of upcoming ?? []) {
      const client = a.client as { full_name: string | null; phone: string | null } | null;
      if (!client?.phone) continue;

      const dt = new Date(a.appointment_date);
      const dateRo = format(dt, "EEEE, d MMMM", { locale: ro });
      const timeRo = format(dt, "HH:mm");
      const confirmLink = `${appUrl}/api/confirm?id=${a.id}&action=confirm`;
      const cancelLink = `${appUrl}/api/confirm?id=${a.id}&action=cancel`;

      try {
        await sendMessage({
          to: client.phone,
          body: reminderMsg(
            client.full_name ?? "Client",
            dateRo,
            timeRo,
            confirmLink,
            cancelLink,
          ),
        });
        results.reminders++;
      } catch (e) {
        results.errors.push(`reminder ${a.id}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    results.errors.push(`reminders job: ${(e as Error).message}`);
  }

  // ─── Job 2: Unpaid invoice alerts ──────────────────────────────────────────
  try {
    const overdueCutoff = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const { data: unpaid } = await supabase
      .from("invoices")
      .select("id, smartbill_series, smartbill_number, amount, payment_link, appointment_id")
      .eq("status", "EMISĂ")
      .lte("issued_at", overdueCutoff);

    for (const inv of unpaid ?? []) {
      // Fetch client separately to avoid complex join typing
      let client: { full_name: string | null; phone: string | null } | null = null;
      if (inv.appointment_id) {
        const { data: apptData } = await supabase
          .from("appointments")
          .select("client:clients(full_name, phone)")
          .eq("id", inv.appointment_id)
          .maybeSingle();
        client = (apptData?.client as { full_name: string | null; phone: string | null } | null) ?? null;
      }
      if (!client?.phone || !inv.payment_link) continue;

      const ref = `${inv.smartbill_series ?? ""}/${inv.smartbill_number ?? ""}`;
      try {
        await sendMessage({
          to: client.phone,
          body: unpaidInvoiceMsg(
            client.full_name ?? "Client",
            ref,
            inv.amount ?? 0,
            inv.payment_link,
          ),
        });
        // Mark as RESTANTĂ
        await supabase.from("invoices").update({ status: "RESTANTĂ" }).eq("id", inv.id);
        results.unpaid++;
      } catch (e) {
        results.errors.push(`unpaid ${inv.id}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    results.errors.push(`unpaid job: ${(e as Error).message}`);
  }

  // ─── Job 3: Travel reminders for therapist ─────────────────────────────────
  try {
    const therapistPhone = process.env.THERAPIST_PHONE;
    if (therapistPhone) {
      const travelStart = new Date(Date.now() + 30 * 60_000);
      const travelEnd = new Date(Date.now() + 40 * 60_000);

      const { data: policlinic } = await supabase
        .from("appointments")
        .select("appointment_date, is_external_duty, meet_link")
        .in("status", ["PROGRAMAT", "CONFIRMAT"])
        .gte("appointment_date", travelStart.toISOString())
        .lte("appointment_date", travelEnd.toISOString());

      for (const a of policlinic ?? []) {
        const loc = deriveLocation(a);
        if (loc !== "POLICLINIC") continue;
        try {
          await sendMessage({
            to: therapistPhone,
            body: travelReminderMsg(
              format(new Date(a.appointment_date), "HH:mm"),
              "Policlinică",
            ),
          });
          results.travel++;
        } catch (e) {
          results.errors.push(`travel: ${(e as Error).message}`);
        }
      }
    }
  } catch (e) {
    results.errors.push(`travel job: ${(e as Error).message}`);
  }

  // ─── Job 4: GDPR Anonymization ─────────────────────────────────────────────
  try {
    const { data: toAnonymize } = await supabase
      .from("clients")
      .select("id")
      .lte("scheduled_anonymization_at", new Date().toISOString());

    for (const c of toAnonymize ?? []) {
      try {
        const { error } = await supabase
          .from("clients")
          .update({
            full_name: "PACIENT ANONIMIZAT",
            email: null,
            phone: null,
            cnp_cif: null,
            address: null,
            parent_name: null,
            parent_phone: null,
            notes_anonymized_at: new Date().toISOString(),
            scheduled_anonymization_at: null,
          })
          .eq("id", c.id);

        if (error) throw error;
        results.errors.push(`anonymized client ${c.id}`); // Using errors array to track successes for now in results
      } catch (e) {
        results.errors.push(`anonymize ${c.id}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    results.errors.push(`anonymization job: ${(e as Error).message}`);
  }

  return NextResponse.json(results);
}
