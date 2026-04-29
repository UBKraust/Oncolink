// GET /api/analytics/monthly-review?year=2025&month=4
// Comprehensive monthly KPI aggregation for the therapist's executive summary

import { NextRequest, NextResponse } from "next/server";
import { isPaidInvoiceStatus } from "@/lib/invoices/status";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export interface MonthlyReview {
  year: number; month: number;

  // Clinical load
  totalSessions: number;
  cancelledSessions: number;
  noShowRate: number; // %
  uniqueClients: number;
  totalHours: number;
  avgSessionsPerClient: number;

  // Financial
  totalRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  avgRevenuePerSession: number;
  totalExpenses: number;
  netProfit: number;

  // Compliance alerts
  alerts: {
    id: string;
    severity: "CRITICAL" | "WARNING";
    message: string;
    count: number;
    clientIds: string[];
  }[];

  // Weekly distribution for chart
  weeklyBreakdown: {
    week: string; // "S1", "S2"...
    sessions: number;
    revenue: number;
  }[];

  setupRequired?: boolean;
}

type ReviewAppointmentRow = {
  client_id: string;
  appointment_date: string;
  duration_minutes: number | null;
  status: string | null;
};

type ReviewInvoiceRow = {
  amount: number | null;
  issued_at: string;
  status: string | null;
};

type ReviewClientRow = {
  id: string;
  is_minor: boolean | null;
  gdpr_consent_signed: boolean | null;
};

type ReviewExpenseRow = {
  amount: number | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Parametrii invalizi" }, { status: 400 });
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

    const [
      { data: appts, error: apptsError },
      { data: invoices, error: invoicesError },
      { data: newClients, error: newClientsError },
      { data: expenseData, error: expenseError },
    ] = await Promise.all([
      supabase
        .from("appointments")
        .select("client_id,appointment_date,duration_minutes,status")
        .gte("appointment_date", startDate)
        .lt("appointment_date", endDate)
        .eq("therapist_id", user.id),
      supabase
        .from("invoices")
        .select("amount,issued_at,status")
        .gte("issued_at", startDate)
        .lt("issued_at", endDate)
        .eq("therapist_id", user.id),
      supabase
        .from("clients")
        .select("id,is_minor,gdpr_consent_signed")
        .gte("created_at", startDate)
        .lt("created_at", endDate)
        .eq("therapist_id", user.id),
      supabase
        .from("cabinet_expenses")
        .select("amount")
        .gte("expense_date", startDate)
        .lt("expense_date", endDate)
        .eq("therapist_id", user.id),
    ]);

    const firstError =
      apptsError || invoicesError || newClientsError || expenseError;

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    return NextResponse.json(
      buildReview(
        appts ?? [],
        invoices ?? [],
        newClients ?? [],
        expenseData ?? [],
        year,
        month,
      ),
    );
  }

  return NextResponse.json({
    year,
    month,
    totalSessions: 0,
    cancelledSessions: 0,
    noShowRate: 0,
    uniqueClients: 0,
    totalHours: 0,
    avgSessionsPerClient: 0,
    totalRevenue: 0,
    collectedRevenue: 0,
    outstandingRevenue: 0,
    avgRevenuePerSession: 0,
    totalExpenses: 0,
    netProfit: 0,
    alerts: [],
    weeklyBreakdown: [],
    setupRequired: true,
  } satisfies MonthlyReview);
}

function buildReview(
  appts: ReviewAppointmentRow[],
  invoices: ReviewInvoiceRow[],
  newClients: ReviewClientRow[],
  expenses: ReviewExpenseRow[],
  year: number, month: number
): MonthlyReview {
  const done = appts.filter((appointment) => appointment.status === "FINALIZAT");
  const canceled = appts.filter(
    (appointment) =>
      appointment.status === "ANULAT" || appointment.status === "LIPSA",
  );
  const uniqueCl = [...new Set(done.map((appointment) => appointment.client_id))];
  const totalMin = done.reduce(
    (sum, appointment) => sum + (appointment.duration_minutes || 50),
    0,
  );
  const collected = invoices
    .filter((invoice) => isPaidInvoiceStatus(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const outstanding = invoices
    .filter((invoice) => !isPaidInvoiceStatus(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const total = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount ?? 0),
    0,
  );
  const totalExp = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0,
  );

  const missingGdpr = newClients.filter((client) => !client.gdpr_consent_signed);
  const minorsNoConsent = newClients.filter((client) => client.is_minor);

  const alerts = [];
  if (missingGdpr.length) alerts.push({ id:"A1", severity:"CRITICAL" as const, message:"Pacienți noi fără acord GDPR", count:missingGdpr.length, clientIds:missingGdpr.map((client)=>client.id) });
  if (minorsNoConsent.length) alerts.push({ id:"A2", severity:"CRITICAL" as const, message:"Minori noi — verificați acorduri părinți", count:minorsNoConsent.length, clientIds:minorsNoConsent.map((client)=>client.id) });

  const weeks = [1,2,3,4,5];
  const weeklyBreakdown = weeks.map(w => ({
    week: `S${w}`,
    sessions: done.filter((appointment) => {
      const day = new Date(appointment.appointment_date).getDate();
      return day >= w * 7 - 6 && day <= w * 7;
    }).length,
    revenue: invoices
      .filter((invoice) => {
        const day = new Date(invoice.issued_at).getDate();
        return day >= w * 7 - 6 && day <= w * 7;
      })
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
  }));

  return { year, month, totalSessions:done.length, cancelledSessions:canceled.length,
    noShowRate: done.length+canceled.length ? Math.round(canceled.length/(done.length+canceled.length)*100):0,
    uniqueClients:uniqueCl.length, totalHours:Math.round(totalMin/60*10)/10,
    avgSessionsPerClient:uniqueCl.length?Math.round(done.length/uniqueCl.length*10)/10:0,
    totalRevenue:total, collectedRevenue:collected, outstandingRevenue:outstanding,
    avgRevenuePerSession:done.length?Math.round(total/done.length):0,
    totalExpenses: totalExp, netProfit: collected - totalExp,
    alerts, weeklyBreakdown };
}
