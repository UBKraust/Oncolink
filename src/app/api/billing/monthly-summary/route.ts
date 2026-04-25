// GET /api/billing/monthly-summary?year=2025&month=4
// Aggregates sessions, hours, revenue and per-client breakdown for a given month

import { NextRequest, NextResponse } from "next/server";
import { mockPayments } from "@/lib/mock/payments";
import { mockClients } from "@/lib/mock/clients";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    try {
      const supabase = await createSupabaseServerClient();

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate   = new Date(year, month, 1).toISOString().slice(0, 10); // first day next month

      // Appointments for the month
      const { data: appts, error: apptErr } = await supabase
        .from("appointments")
        .select("id, client_id, appointment_date, duration_minutes, status")
        .gte("appointment_date", startDate)
        .lt("appointment_date",  endDate)
        .eq("status", "FINALIZAT");

      if (apptErr) return NextResponse.json({ error: apptErr.message }, { status: 500 });

      // Invoices for same period (paid)
      const apptIds = (appts ?? []).map(a => a.id);
      const { data: invoices } = await supabase
        .from("invoices")
        .select("appointment_id, amount, status")
        .in("appointment_id", apptIds.length ? apptIds : ["__none__"]);

      const paidInvoices = (invoices ?? []).filter(i => i.status === "ACHITATĂ");

      // Client lookup
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name, session_price");

      return NextResponse.json(buildSummary(appts ?? [], paidInvoices, clients ?? [], year, month));
    } catch (err) {
      console.error("[billing/monthly-summary] Supabase error:", err);
      // fall through to mock
    }
  }

  // ── Demo / mock path ──────────────────────────────────────────────────────
  const filtered = mockPayments.filter(p => {
    const d = new Date(p.appointment_date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const clientMap = Object.fromEntries(mockClients.map(c => [c.id, c]));

  const perClient: Record<string, {
    clientId: string; clientName: string;
    sessions: number; totalMinutes: number;
    totalAmount: number; collectedAmount: number;
    invoiceStatus: "ACHITAT" | "PARTIAL" | "NEEMIS";
  }> = {};

  for (const p of filtered) {
    if (!perClient[p.client_id]) {
      perClient[p.client_id] = {
        clientId: p.client_id,
        clientName: clientMap[p.client_id]?.full_name ?? "Client necunoscut",
        sessions: 0, totalMinutes: 0,
        totalAmount: 0, collectedAmount: 0,
        invoiceStatus: "NEEMIS",
      };
    }
    const row = perClient[p.client_id];
    row.sessions++;
    row.totalMinutes += p.duration_minutes;
    row.totalAmount  += p.amount;
    if (p.invoice_status === "ACHITATĂ") row.collectedAmount += p.amount;
  }

  // Determine per-client invoice status
  for (const row of Object.values(perClient)) {
    if (row.collectedAmount >= row.totalAmount) row.invoiceStatus = "ACHITAT";
    else if (row.collectedAmount > 0)           row.invoiceStatus = "PARTIAL";
    else                                         row.invoiceStatus = "NEEMIS";
  }

  const clients = Object.values(perClient);
  const totalSessions  = clients.reduce((s, c) => s + c.sessions, 0);
  const totalMinutes   = clients.reduce((s, c) => s + c.totalMinutes, 0);
  const totalAmount    = clients.reduce((s, c) => s + c.totalAmount, 0);
  const collectedAmount = clients.reduce((s, c) => s + c.collectedAmount, 0);

  return NextResponse.json({
    year, month,
    totalSessions,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    totalAmount,
    collectedAmount,
    uncollectedAmount: totalAmount - collectedAmount,
    clients,
    isDemo: true,
  });
}

function buildSummary(
  appts: { id: string; client_id: string; duration_minutes: number }[],
  paidInvoices: { appointment_id: string; amount: number }[],
  clients: { id: string; full_name: string | null; session_price: number | null }[],
  year: number, month: number
) {
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const paidMap   = Object.fromEntries(paidInvoices.map(i => [i.appointment_id, i.amount]));

  const perClient: Record<string, {
    clientId: string; clientName: string;
    sessions: number; totalMinutes: number;
    totalAmount: number; collectedAmount: number;
    invoiceStatus: "ACHITAT" | "PARTIAL" | "NEEMIS";
  }> = {};

  for (const a of appts) {
    const cl = clientMap[a.client_id];
    if (!perClient[a.client_id]) {
      perClient[a.client_id] = {
        clientId: a.client_id,
        clientName: cl?.full_name ?? "Client necunoscut",
        sessions: 0, totalMinutes: 0,
        totalAmount: 0, collectedAmount: 0,
        invoiceStatus: "NEEMIS",
      };
    }
    const row = perClient[a.client_id];
    row.sessions++;
    row.totalMinutes += a.duration_minutes;
    const price = cl?.session_price ?? 0;
    row.totalAmount  += price;
    row.collectedAmount += paidMap[a.id] ?? 0;
  }

  for (const row of Object.values(perClient)) {
    if (row.collectedAmount >= row.totalAmount) row.invoiceStatus = "ACHITAT";
    else if (row.collectedAmount > 0)           row.invoiceStatus = "PARTIAL";
    else                                         row.invoiceStatus = "NEEMIS";
  }

  const clientList = Object.values(perClient);
  return {
    year, month,
    totalSessions:   clientList.reduce((s, c) => s + c.sessions, 0),
    totalHours:      Math.round(clientList.reduce((s, c) => s + c.totalMinutes, 0) / 60 * 10) / 10,
    totalAmount:     clientList.reduce((s, c) => s + c.totalAmount, 0),
    collectedAmount: clientList.reduce((s, c) => s + c.collectedAmount, 0),
    uncollectedAmount: clientList.reduce((s, c) => s + (c.totalAmount - c.collectedAmount), 0),
    clients: clientList,
  };
}
