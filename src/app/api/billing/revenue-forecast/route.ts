// GET /api/billing/revenue-forecast?months=3
// Predicts next N months revenue from confirmed future appointments

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ahead = Math.min(parseInt(searchParams.get("months") ?? "2"), 4);

  const now  = new Date();
  const emptyHistory: { label: string; actual: number; sessions: number }[] = [];
  const emptyForecast: { label: string; projected: number; sessions: number }[] = [];

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ history: emptyHistory, forecast: emptyForecast, setupRequired: true });
  }

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

  const startHistory = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const endForecast = new Date(now.getFullYear(), now.getMonth() + ahead + 1, 1).toISOString();

  const [{ data: appointments, error: appointmentError }, { data: invoices, error: invoiceError }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("appointment_date,status")
        .eq("therapist_id", user.id)
        .gte("appointment_date", startHistory)
        .lt("appointment_date", endForecast),
      supabase
        .from("invoices")
        .select("issued_at,amount")
        .eq("therapist_id", user.id)
        .gte("issued_at", startHistory)
        .lt("issued_at", endForecast),
    ]);

  if (appointmentError || invoiceError) {
    return NextResponse.json(
      { error: appointmentError?.message ?? invoiceError?.message ?? "Nu am putut calcula prognoza." },
      { status: 500 },
    );
  }

  const history: { label: string; actual: number; sessions: number }[] = [];
  for (let i = 3; i >= 1; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = dt.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
    const monthInvoices = (invoices ?? []).filter((invoice) => {
      const issuedAt = new Date(invoice.issued_at);
      return issuedAt >= dt && issuedAt < next;
    });
    const monthAppointments = (appointments ?? []).filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointmentDate >= dt && appointmentDate < next && appointment.status === "FINALIZAT";
    });
    history.push({
      label,
      actual: monthInvoices.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
      sessions: monthAppointments.length,
    });
  }

  const forecast: { label: string; projected: number; sessions: number }[] = [];
  for (let i = 1; i <= ahead; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const label = dt.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
    const monthAppointments = (appointments ?? []).filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointmentDate >= dt && appointmentDate < next && appointment.status !== "ANULAT";
    });
    const referenceRevenue = history.at(-1)?.actual ?? 0;
    const projected =
      i === 1
        ? referenceRevenue
        : Math.round((referenceRevenue / Math.max(history.at(-1)?.sessions ?? 1, 1)) * monthAppointments.length);

    forecast.push({
      label,
      projected,
      sessions: monthAppointments.length,
    });
  }

  return NextResponse.json({ history, forecast });
}
