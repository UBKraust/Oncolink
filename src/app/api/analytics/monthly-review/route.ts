// GET /api/analytics/monthly-review?year=2025&month=4
// Comprehensive monthly KPI aggregation for the therapist's executive summary

import { NextRequest, NextResponse } from "next/server";
import { mockClients } from "@/lib/mock/clients";
import { mockPayments } from "@/lib/mock/payments";
import { mockPatientDocuments } from "@/lib/mock/patientFiles";
import { getMockExpenses } from "@/lib/mock/expenses";
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Parametrii invalizi" }, { status: 400 });
  }

  // ── Supabase path ─────────────────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
      const endDate   = new Date(year, month, 1).toISOString().slice(0,10);

      const [{ data: appts }, { data: invoices }, { data: newClients }, { data: expenseData }] = await Promise.all([
        supabase.from("appointments")
          .select("id,client_id,appointment_date,duration_minutes,status")
          .gte("appointment_date", startDate)
          .lt("appointment_date", endDate),
        supabase.from("invoices")
          .select("appointment_id,amount,status")
          .gte("created_at", startDate)
          .lt("created_at", endDate),
        supabase.from("clients")
          .select("id,is_minor,gdpr_consent_signed")
          .gte("created_at", startDate)
          .lt("created_at", endDate),
        supabase.from("cabinet_expenses")
          .select("amount")
          .gte("expense_date", startDate)
          .lt("expense_date", endDate),
      ]);

      return NextResponse.json(buildReview(appts ?? [], invoices ?? [], newClients ?? [], expenseData ?? [], year, month));
    } catch { /* fall to mock */ }
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
  const collected = monthPayments.filter(p => p.invoice_status === "ACHITATĂ").reduce((s,p) => s + p.amount, 0);
  const outstanding = monthPayments.filter(p => p.invoice_status !== "ACHITATĂ").reduce((s,p) => s + p.amount, 0);
  const total = monthPayments.reduce((s,p) => s + p.amount, 0);

  // Compliance alerts
  const newClientsThisMonth = mockClients.filter(c => {
    const d = new Date((c as any).created_at ?? Date.now() - 999999999);
    return d >= startDate && d < endDate;
  });
  const missingGdpr = mockClients.filter(c => !c.gdpr_consent_signed);
  const minorsMissingConsent = mockClients.filter(c =>
    (c as any).is_minor &&
    !mockPatientDocuments.some(d => d.client_id === c.id && d.document_type === "ACORD_PARINTI")
  );
  const unpaidClients = [...new Set(
    monthPayments.filter(p => p.invoice_status !== "ACHITATĂ").map(p => p.client_id)
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
  appts: any[], invoices: any[], newClients: any[], expenses: any[],
  year: number, month: number
): MonthlyReview {
  const done     = appts.filter(a => a.status === "FINALIZATĂ");
  const canceled = appts.filter(a => a.status === "ANULAT" || a.status === "NEPREZENT");
  const uniqueCl  = [...new Set(done.map((a:any) => a.client_id))];
  const totalMin  = done.reduce((s:number,a:any) => s + (a.duration_minutes||50), 0);
  const collected = invoices.filter((i:any) => i.status==="ACHITATĂ").reduce((s:number,i:any)=>s+i.amount,0);
  const outstanding = invoices.filter((i:any) => i.status!=="ACHITATĂ").reduce((s:number,i:any)=>s+i.amount,0);
  const total     = invoices.reduce((s:number,i:any)=>s+i.amount,0);
  const totalExp  = expenses.reduce((s:number, e:any) => s + Number(e.amount), 0);

  const missingGdpr = newClients.filter((c:any)=>!c.gdpr_consent_signed);
  const minorsNoConsent = newClients.filter((c:any)=>c.is_minor);

  const alerts = [];
  if (missingGdpr.length) alerts.push({ id:"A1", severity:"CRITICAL" as const, message:"Pacienți noi fără acord GDPR", count:missingGdpr.length, clientIds:missingGdpr.map((c:any)=>c.id) });
  if (minorsNoConsent.length) alerts.push({ id:"A2", severity:"CRITICAL" as const, message:"Minori noi — verificați acorduri părinți", count:minorsNoConsent.length, clientIds:minorsNoConsent.map((c:any)=>c.id) });

  const weeks = [1,2,3,4,5];
  const weeklyBreakdown = weeks.map(w => ({
    week: `S${w}`,
    sessions: done.filter((a:any) => { const d = new Date(a.appointment_date).getDate(); return d >= w*7-6 && d <= w*7; }).length,
    revenue: invoices.filter((_:any,i:number) => i % 5 === w-1).reduce((s:number,x:any)=>s+x.amount,0),
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
