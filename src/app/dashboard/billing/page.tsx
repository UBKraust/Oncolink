"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TrendingUp, Clock, Users, Wallet, AlertCircle,
  CheckCircle2, FileCheck2, RotateCcw, Loader2,
  Download, BrainCircuit, BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardPage, EmptyState, PageHeader, SetupBanner } from "@/components/app/page-shell";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientRow {
  clientId: string;
  clientName: string;
  sessions: number;
  totalMinutes: number;
  totalAmount: number;
  collectedAmount: number;
  invoiceStatus: "ACHITAT" | "PARTIAL" | "NEEMIS";
}

interface MonthlySummary {
  year: number; month: number;
  totalSessions: number; totalHours: number;
  totalAmount: number; collectedAmount: number; uncollectedAmount: number;
  clients: ClientRow[];
  setupRequired?: boolean;
}

interface ForecastMonth { label: string; projected: number; sessions: number; }
interface HistoryMonth  { label: string; actual: number;    sessions: number; }

interface Forecast { history: HistoryMonth[]; forecast: ForecastMonth[]; }
interface ForecastPayload extends Forecast { setupRequired?: boolean; }

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_RO = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"
];

const STATUS_CONFIG = {
  ACHITAT: { label: "Achitat",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  PARTIAL: { label: "Parțial",     cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  NEEMIS:  { label: "De facturat", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" },
};

const EMPTY_SUMMARY: MonthlySummary = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  totalSessions: 0,
  totalHours: 0,
  totalAmount: 0,
  collectedAmount: 0,
  uncollectedAmount: 0,
  clients: [],
};

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isInvoiceStatus(value: unknown): value is ClientRow["invoiceStatus"] {
  return value === "ACHITAT" || value === "PARTIAL" || value === "NEEMIS";
}

function normalizeMonthlySummary(payload: unknown, fallbackYear: number, fallbackMonth: number): MonthlySummary {
  if (!payload || typeof payload !== "object") {
    return { ...EMPTY_SUMMARY, year: fallbackYear, month: fallbackMonth };
  }

  const source = payload as Partial<MonthlySummary>;
  const clients = Array.isArray(source.clients)
    ? source.clients.map((client, index) => {
        const row = client as Partial<ClientRow>;
        return {
          clientId: typeof row.clientId === "string" ? row.clientId : `client-${index}`,
          clientName: typeof row.clientName === "string" ? row.clientName : "Client",
          sessions: asNumber(row.sessions),
          totalMinutes: asNumber(row.totalMinutes),
          totalAmount: asNumber(row.totalAmount),
          collectedAmount: asNumber(row.collectedAmount),
          invoiceStatus: isInvoiceStatus(row.invoiceStatus) ? row.invoiceStatus : "NEEMIS",
        };
      })
    : [];

  return {
    year: asNumber(source.year) || fallbackYear,
    month: asNumber(source.month) || fallbackMonth,
    totalSessions: asNumber(source.totalSessions),
    totalHours: asNumber(source.totalHours),
    totalAmount: asNumber(source.totalAmount),
    collectedAmount: asNumber(source.collectedAmount),
    uncollectedAmount: asNumber(source.uncollectedAmount),
    clients,
    setupRequired: Boolean(source.setupRequired),
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<MonthlySummary | null>(null);
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await fetch(`/api/billing/monthly-summary?year=${year}&month=${month}`);
      const payload = await res.json();
      setData(normalizeMonthlySummary(payload, year, month));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const loadForecast = useCallback(async () => {
    const res = await fetch("/api/billing/revenue-forecast?months=2");
    setForecast(await res.json() as ForecastPayload);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSummary();
      void loadForecast();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSummary, loadForecast]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllUnpaid() {
    const unpaid = (data?.clients ?? []).filter(c => c.invoiceStatus !== "ACHITAT").map(c => c.clientId);
    setSelected(new Set(unpaid));
  }

  function handleBulkInvoice() {
    const names = (data?.clients ?? [])
      .filter(c => selected.has(c.clientId))
      .map(c => c.clientName)
      .join(", ");
    alert(`[SmartBill] Se vor emite facturi pentru:\n${names}\n\nIntegrarea SmartBill va procesa secvențial.`);
  }

  function exportCsv() {
    if (!data) return;
    const header = ["Client","Ședinte","Ore","De încasat (RON)","Încasat (RON)","Status"];
    const rows = (data.clients ?? []).map(c => [
      c.clientName, c.sessions,
      (c.totalMinutes / 60).toFixed(1),
      c.totalAmount, c.collectedAmount,
      STATUS_CONFIG[c.invoiceStatus].label,
    ]);
    const csv = "\uFEFF" + [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `raport_lunar_${year}_${String(month).padStart(2,"0")}.csv`;
    a.click();
  }

  const clients = data?.clients ?? [];
  const unpaidClients = clients.filter(c => c.invoiceStatus !== "ACHITAT");
  const collectionRate = data ? Math.round((data.collectedAmount / (data.totalAmount || 1)) * 100) : 0;
  const setupRequired = Boolean(data?.setupRequired || forecast?.setupRequired);

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Raportare lunară și facturare"
        description="Sumar de activitate, venituri reale și prognoze pentru luna selectată."
        action={<div className="flex flex-wrap gap-2 items-center">
          {/* Month picker */}
          <label htmlFor="billing-month" className="sr-only">Selectează luna raportului</label>
          <select id="billing-month" value={month} onChange={e => setMonth(+e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm">
            {MONTHS_RO.map((lbl, i) => <option key={i+1} value={i+1}>{lbl}</option>)}
          </select>
          <label htmlFor="billing-year" className="sr-only">Selectează anul raportului</label>
          <select id="billing-year" value={year} onChange={e => setYear(+e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm">
            {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <Button onClick={loadSummary} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Calculează
          </Button>
          {data && (
            <Button variant="outline" size="icon" onClick={exportCsv} title="Export CSV" aria-label="Exportă raportul în format CSV">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>}
      />

      {setupRequired && (
        <SetupBanner description="Raportarea financiară folosește acum doar date reale. Configurează Supabase pentru a încărca încasările și prognoza." />
      )}

      {/* Summary cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Ședințe" value={String(data.totalSessions)} icon={<Users className="h-4 w-4" />} accent="blue" />
            <StatCard label="Ore lucrate" value={`${data.totalHours}h`} icon={<Clock className="h-4 w-4" />} accent="violet" />
            <StatCard label="Total de încasat" value={fmt(data.totalAmount)} icon={<Wallet className="h-4 w-4" />} accent="emerald" />
            <StatCard label="Rata încasare" value={`${collectionRate}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              accent={collectionRate >= 75 ? "emerald" : collectionRate >= 40 ? "amber" : "rose"} />
          </div>

          {/* Revenue progress */}
          <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Progres Încasare Lunară</span>
                <span className="text-muted-foreground">
                  {fmt(data.collectedAmount)} / {fmt(data.totalAmount)} RON
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {fmt(data.collectedAmount)} încasat
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {fmt(data.uncollectedAmount)} restant
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bulk actions */}
          {unpaidClients.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-400 flex-1">
                {unpaidClients.length} client{unpaidClients.length !== 1 ? "ți" : ""} cu sume nefacturate.
              </span>
              <Button variant="outline" size="sm" onClick={selectAllUnpaid} className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Selectează toți
              </Button>
              {selected.size > 0 && (
                <Button size="sm" onClick={handleBulkInvoice} className="gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Emite {selected.size} Factur{selected.size === 1 ? "ă" : "i"} SmartBill
                </Button>
              )}
            </div>
          )}

          {/* Client table */}
          <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black tracking-tight">Detaliu pe clienți — {MONTHS_RO[month-1]} {year}</CardTitle>
              <CardDescription>Bifați clienții pentru facturare în masă.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {clients.length === 0 ? (
                <EmptyState
                  title="Nu există date de facturare"
                  description="Pentru perioada selectată nu au fost găsite ședințe sau sume de procesat."
                  icon={Wallet}
                />
              ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 w-8" />
                    <th className="text-left px-4 py-2.5 font-medium">Client</th>
                    <th className="text-center px-3 py-2.5 font-medium">Ședințe</th>
                    <th className="text-center px-3 py-2.5 font-medium">Ore</th>
                    <th className="text-right px-4 py-2.5 font-medium">De incasat</th>
                    <th className="text-right px-4 py-2.5 font-medium">Încasat</th>
                    <th className="text-center px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map(c => {
                    const cfg = STATUS_CONFIG[c.invoiceStatus];
                    const isChecked = selected.has(c.clientId);
                    return (
                      <tr key={c.clientId}
                        className={cn("hover:bg-muted/30 transition-colors", isChecked && "bg-primary/5")}>
                        <td className="px-4 py-3 text-center">
                          {c.invoiceStatus !== "ACHITAT" && (
                            <input type="checkbox" checked={isChecked}
                              onChange={() => toggleSelect(c.clientId)}
                              aria-label={`Selectează clientul ${c.clientName} pentru facturare`}
                              className="rounded accent-primary h-4 w-4 cursor-pointer" />
                          )}
                          {c.invoiceStatus === "ACHITAT" && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{c.clientName}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{c.sessions}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">
                          {(c.totalMinutes / 60).toFixed(1)}h
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{fmt(c.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                          {fmt(c.collectedAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={cn(cfg.cls)}>{cfg.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t bg-muted/20">
                  <tr className="font-semibold text-sm">
                    <td colSpan={2} className="px-4 py-3">TOTAL</td>
                    <td className="px-3 py-3 text-center">{data.totalSessions}</td>
                    <td className="px-3 py-3 text-center">{data.totalHours}h</td>
                    <td className="px-4 py-3 text-right">{fmt(data.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                      {fmt(data.collectedAmount)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Revenue Forecast */}
      {forecast && (
          <Card className="rounded-[1.75rem] border-violet-200 shadow-sm dark:border-violet-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-violet-500" />
              Predicție Venituri — Lunile Următoare
            </CardTitle>
            <CardDescription>
              Calculat pe baza frecvenței actuale a fiecărui client. Condiție: toate ședințele se confirmă.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* History */}
              {forecast.history.map((h, i) => (
                <ForecastBar key={i} label={h.label} amount={h.actual} sessions={h.sessions}
                  maxAmount={Math.max(...forecast.history.map(x=>x.actual), ...forecast.forecast.map(x=>x.projected))}
                  type="actual" />
              ))}
              <div className="border-t border-dashed my-2 relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-background px-2 text-muted-foreground">AZI</span>
              </div>
              {/* Forecast */}
              {forecast.forecast.map((f, i) => (
                <ForecastBar key={i} label={f.label} amount={f.projected} sessions={f.sessions}
                  maxAmount={Math.max(...forecast.history.map(x=>x.actual), ...forecast.forecast.map(x=>x.projected))}
                  type="forecast" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Predicția nu include clienți noi sau ședințe anulate. Actualizată la fiecare load.
            </p>
          </CardContent>
        </Card>
      )}

      {!data && !loading ? (
        <EmptyState
          title="Raportul nu a fost generat"
          description="Alege luna și anul, apoi apasă «Calculează» pentru a încărca situația financiară."
          icon={BarChart3}
        />
      ) : null}
    </DashboardPage>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode;
  accent: "blue" | "violet" | "emerald" | "amber" | "rose";
}) {
  const accents = {
    blue:    "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
    violet:  "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950",
    emerald: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
    amber:   "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
    rose:    "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950",
  };
  return (
    <Card className="rounded-[1.5rem] border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className={cn("mb-3 inline-flex items-center justify-center rounded-2xl p-2", accents[accent])}>
          {icon}
        </div>
        <p className="text-xl font-black tracking-tight">{value}</p>
        <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ForecastBar({ label, amount, sessions, maxAmount, type }: {
  label: string; amount: number; sessions: number; maxAmount: number;
  type: "actual" | "forecast";
}) {
  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-muted-foreground capitalize shrink-0 text-right leading-tight">{label}</div>
      <div className="flex-1 h-6 bg-muted/50 rounded overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded transition-all duration-700",
            type === "actual"
              ? "bg-gradient-to-r from-teal-500 to-emerald-400"
              : "bg-gradient-to-r from-violet-400 to-purple-400 opacity-70"
          )}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium mix-blend-multiply dark:mix-blend-screen">
          {fmt(amount)} RON · {sessions} șed.
        </span>
      </div>
      <div className="text-xs text-muted-foreground w-12 shrink-0">
        {type === "forecast" ? "~prognozat" : "real"}
      </div>
    </div>
  );
}

function fmt(n?: number | null): string {
  const value = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return value.toLocaleString("ro-RO", { maximumFractionDigits: 0 });
}
