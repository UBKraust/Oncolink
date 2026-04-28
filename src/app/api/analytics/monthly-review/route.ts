// GET /api/analytics/monthly-review?year=2025&month=4
// Comprehensive monthly KPI aggregation for the therapist's executive summary

import { NextRequest, NextResponse } from "next/server";
import { mockClients } from "@/lib/mock/clients";
import { mockPayments } from "@/lib/mock/payments";
import { mockPatientDocuments } from "@/lib/mock/patientFiles";
import { getMockExpenses } from "@/lib/mock/expenses";
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

  isDemo: boolean;
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

  // ── Demo/mock path ────────────────────────────────────────────────────────
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 1);

  const monthPayments = mockPayments.filter(p => {
    const d = new Date(p.appointment_date);
    return d >= startDate && d < endDate;
  });

  // Simulate some cancellations (20% of month sessions)
  const cancelledCount = Math.round(monthPayments.length * 0.2);

  const uniqueClientIds = [...new Set(monthPayments.map(p => p.client_id))];
  const totalMin = monthPayments.reduce((s,p) => s + p.duration_minutes, 0);
  const collected = monthPayments
    .filter((payment) => isPaidInvoiceStatus(payment.invoice_status))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = monthPayments
    .filter((payment) => !isPaidInvoiceStatus(payment.invoice_status))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const total = monthPayments.reduce((s,p) => s + p.amount, 0);

  // Compliance alerts
  const newClientsThisMonth = mockClients.filter((client) => {
    const d = new Date(client.created_at);
    return d >= startDate && d < endDate;
  });
  const missingGdpr = newClientsThisMonth.filter(
    (client) => !client.gdpr_consent_signed,
  );
  const minorsMissingConsent = newClientsThisMonth.filter((client) =>
    client.is_minor &&
    !mockPatientDocuments.some(d => d.client_id === client.id && d.document_type === "ACORD_PARINTI")
  );
  const unpaidClients = [...new Set(
    monthPayments
      .filter((payment) => !isPaidInvoiceStatus(payment.invoice_status))
      .map((payment) => payment.client_id)
  )];

  const alerts = [];
  if (missingGdpr.length) alerts.push({ id:"A1", severity:"CRITICAL" as const, message:"Pacienți fără acord GDPR semnat", count: missingGdpr.length, clientIds: missingGdpr.map(c=>c.id) });
  if (minorsMissingConsent.length) alerts.push({ id:"A2", severity:"CRITICAL" as const, message:"Minori fără acord ambii părinți", count: minorsMissingConsent.length, clientIds: minorsMissingConsent.map(c=>c.id) });
  if (unpaidClients.length) alerts.push({ id:"A3", severity:"WARNING" as const, message:"Clienți cu plăți restante luna aceasta", count: unpaidClients.length, clientIds: unpaidClients });

  // Weekly breakdown
  const weeks = [1,2,3,4,5];
  const weeklyBreakdown = weeks.map(w => {
    const wStart = w * 7 - 6;
    const wEnd   = w * 7;
    const wPayments = monthPayments.filter(p => {
      const day = new Date(p.appointment_date).getDate();
      return day >= wStart && day <= wEnd;
    });
    return {
      week: `S${w}`,
      sessions: wPayments.length,
      revenue: wPayments.reduce((s,p) => s + p.amount, 0),
    };
  }).filter(w => w.sessions > 0 || w.week === "S1");

    const monthExpenses = getMockExpenses(year, month).reduce((s, e) => s + e.amount, 0);
    const review: MonthlyReview = {
      year, month,
      totalSessions:       monthPayments.length,
      cancelledSessions:   cancelledCount,
      noShowRate:          monthPayments.length ? Math.round(cancelledCount / (monthPayments.length + cancelledCount) * 100) : 0,
      uniqueClients:       uniqueClientIds.length,
      totalHours:          Math.round(totalMin / 60 * 10) / 10,
      avgSessionsPerClient: uniqueClientIds.length ? Math.round(monthPayments.length / uniqueClientIds.length * 10) / 10 : 0,
      totalRevenue:        total,
      collectedRevenue:    collected,
      outstandingRevenue:  outstanding,
      avgRevenuePerSession: monthPayments.length ? Math.round(total / monthPayments.length) : 0,
      totalExpenses:       monthExpenses,
      netProfit:           collected - monthExpenses,
      alerts,
      weeklyBreakdown,
      isDemo: true,
    };

  return NextResponse.json(review);
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
    alerts, weeklyBreakdown, isDemo:false };
}
