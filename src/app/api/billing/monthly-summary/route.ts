// GET /api/billing/monthly-summary?year=2025&month=4
// Aggregates sessions, hours, revenue and per-client breakdown for a given month

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildMonthlyBillingSummary } from "@/lib/billing/monthly-summary";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Parametrii year/month invalizi." }, { status: 400 });
  }

  // ── Supabase path ─────────────────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 1).toISOString().slice(0, 10);

    const { data: appts, error: apptErr } = await supabase
      .from("appointments")
      .select("id, client_id, appointment_date, duration_minutes, clients(full_name)")
      .gte("appointment_date", startDate)
      .lt("appointment_date", endDate)
      .eq("status", "FINALIZAT")
      .eq("therapist_id", user.id);

    if (apptErr) {
      return NextResponse.json({ error: apptErr.message }, { status: 500 });
    }

    const apptIds = (appts ?? []).map((appointment) => appointment.id);
    const { data: invoices, error: invoiceErr } = await supabase
      .from("invoices")
      .select("appointment_id, amount, status")
      .in("appointment_id", apptIds.length ? apptIds : ["__none__"])
      .eq("therapist_id", user.id);

    if (invoiceErr) {
      return NextResponse.json({ error: invoiceErr.message }, { status: 500 });
    }

    const summary = buildMonthlyBillingSummary(appts ?? [], invoices ?? [], year, month);
    return NextResponse.json({
      year: summary.year,
      month: summary.month,
      totalSessions: summary.totalSessions,
      totalHours: summary.totalHours,
      totalAmount: summary.totalAmount,
      collectedAmount: summary.collectedAmount,
      uncollectedAmount: summary.uncollectedAmount,
      invoiceCandidatesCount: summary.invoiceCandidatesCount,
      preparedInvoicesCount: summary.preparedInvoicesCount,
      clients: summary.clients,
    });
  }

  return NextResponse.json({
    year, month,
    totalSessions: 0,
    totalHours: 0,
    totalAmount: 0,
    collectedAmount: 0,
    uncollectedAmount: 0,
    invoiceCandidatesCount: 0,
    preparedInvoicesCount: 0,
    clients: [],
    setupRequired: true,
  });
}
