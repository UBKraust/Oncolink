"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  TrendingUp, Clock, Users, Wallet, AlertCircle,
  CheckCircle2, FileCheck2, RotateCcw, Loader2,
  Download, BrainCircuit, BarChart3
} from "lucide-react";
import { CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { queueMonthlyInvoices } from "@/app/dashboard/invoices/actions";
import { toast } from "@/components/ui/toast";
import {
  DashboardPage,
  EmptyState,
  MetricCard,
  PageHeader,
  SectionCard,
  SetupBanner,
} from "@/components/app/page-shell";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientRow {
  clientId: string;
  clientName: string;
  sessions: number;
  totalMinutes: number;
  totalAmount: number;
  collectedAmount: number;
  invoiceStatus: "ACHITAT" | "PARTIAL" | "NEEMIS" | "PREGĂTITĂ";
}

interface MonthlySummary {
  year: number; month: number;
  totalSessions: number; totalHours: number;
  totalAmount: number; collectedAmount: number; uncollectedAmount: number;
  invoiceCandidatesCount: number;
  preparedInvoicesCount: number;
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
  ACHITAT: { label: "Achitat", variant: "success" as const },
  PARTIAL: { label: "Parțial", variant: "warning" as const },
  PREGĂTITĂ: { label: "În coadă financiară", variant: "info" as const },
  NEEMIS:  { label: "De facturat", variant: "info" as const },
};

const EMPTY_SUMMARY: MonthlySummary = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  totalSessions: 0,
  totalHours: 0,
  totalAmount: 0,
  collectedAmount: 0,
  uncollectedAmount: 0,
  invoiceCandidatesCount: 0,
  preparedInvoicesCount: 0,
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
    invoiceCandidatesCount: asNumber(source.invoiceCandidatesCount),
    preparedInvoicesCount: asNumber(source.preparedInvoicesCount),
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
  const [queuePending, startQueueTransition] = useTransition();
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

  function handleMonthlyExport() {
    if (!data) return;
    window.location.assign(
      `/api/billing/monthly-export?year=${data.year}&month=${data.month}`,
    );
  }

  function handleSendToFinancial() {
    if (!data) return;

    startQueueTransition(async () => {
      const result = await queueMonthlyInvoices(data.year, data.month);
      if (!result.ok) {
        toast.error(result.error ?? "Nu am putut trimite luna către financiar.");
        return;
      }

      toast.success(
        result.createdCount
          ? `${result.createdCount} facturi au fost pregătite pentru financiar.`
          : "Nu au fost găsite programări noi de trimis către financiar.",
      );
      await loadSummary();
    });
  }

  const clients = data?.clients ?? [];
  const unpaidClients = clients.filter(c => c.invoiceStatus !== "ACHITAT");
  const collectionRate = data ? Math.round((data.collectedAmount / (data.totalAmount || 1)) * 100) : 0;
  const setupRequired = Boolean(data?.setupRequired || forecast?.setupRequired);
  const canExportMonthly = Boolean(data && data.totalHours > 0 && !setupRequired);
  const canSendToFinancial = Boolean(
    data && data.totalHours > 0 && data.invoiceCandidatesCount > 0 && !setupRequired,
  );

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
          <Button
            variant="outline"
            onClick={handleMonthlyExport}
            disabled={!canExportMonthly}
            className="gap-1.5"
            title="Exportul lunar devine disponibil după calculul orelor lunii selectate"
          >
            <Download className="h-4 w-4" />
            Export lunar
          </Button>
        </div>}
      />

      {setupRequired && (
        <SetupBanner description="Raportarea financiară folosește acum doar date reale. Configurează Supabase pentru a încărca încasările și prognoza." />
      )}

      {/* Summary cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Ședințe" value={String(data.totalSessions)} icon={Users} accent="info" />
            <StatCard label="Ore lucrate" value={`${data.totalHours}h`} icon={Clock} accent="neutral" />
            <StatCard label="Total de încasat" value={fmt(data.totalAmount)} icon={Wallet} accent="success" />
            <StatCard
              label="Rata încasare"
              value={`${collectionRate}%`}
              icon={TrendingUp}
              accent={collectionRate >= 75 ? "success" : collectionRate >= 40 ? "warning" : "danger"}
            />
          </div>

          <SectionCard
            title="Închidere lunară"
            description="După ce orele lunii au fost calculate, poți exporta același set de date într-un raport lunar CSV."
            icon={Download}
          >
            <div className="flex flex-wrap items-center gap-3 px-6 py-5">
              <Badge variant={canExportMonthly ? "success" : "outline"}>
                {data.totalHours} ore calculate
              </Badge>
              <span className="flex-1 text-sm text-muted-foreground">
                Raportul include sumarul lunii, detaliul pe clienți și lista ședințelor finalizate pentru {MONTHS_RO[month - 1]} {year}. {data.invoiceCandidatesCount} ședințe sunt încă fără factură, iar {data.preparedInvoicesCount} sunt deja în coada financiară.
              </span>
              <Button
                variant="outline"
                onClick={handleSendToFinancial}
                disabled={!canSendToFinancial || queuePending}
                className="gap-1.5"
              >
                {queuePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                Trimite la financiar
              </Button>
              <Button onClick={handleMonthlyExport} disabled={!canExportMonthly} className="gap-1.5">
                <Download className="h-4 w-4" />
                Exportă raportul lunii
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/invoices?status=PREGĂTITĂ">Vezi coada financiară</Link>
              </Button>
            </div>
          </SectionCard>

          {/* Revenue progress */}
          <SectionCard
            title="Progres încasare lunară"
            description="Comparație între sumele deja încasate și totalul procesat pentru luna selectată."
            icon={TrendingUp}
          >
            <CardContent className="p-6 pt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Stare încasare</span>
                <span className="text-muted-foreground">
                  {fmt(data.collectedAmount)} / {fmt(data.totalAmount)} RON
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span className="font-medium text-foreground">
                  {fmt(data.collectedAmount)} încasat
                </span>
                <span className="font-medium text-muted-foreground">
                  {fmt(data.uncollectedAmount)} restant
                </span>
              </div>
            </CardContent>
          </SectionCard>

          {/* Bulk actions */}
          {unpaidClients.length > 0 && (
            <SectionCard
              title="Facturare în masă"
              description="Lucrează pe clienții cu sold deschis fără să concurezi cu tabelul principal."
              icon={AlertCircle}
            >
              <div className="flex flex-wrap items-center gap-3 px-6 py-5">
                <Badge variant="warning">{unpaidClients.length} solduri deschise</Badge>
                <span className="flex-1 text-sm text-muted-foreground">
                  {unpaidClients.length} client{unpaidClients.length !== 1 ? "ți" : ""} cu sume nefacturate sau parțial încasate.
                </span>
                <Button variant="outline" size="sm" onClick={selectAllUnpaid}>
                  Selectează toți
                </Button>
                {selected.size > 0 && (
                  <Button size="sm" onClick={handleBulkInvoice} className="gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Emite {selected.size} Factur{selected.size === 1 ? "ă" : "i"} SmartBill
                  </Button>
                )}
              </div>
            </SectionCard>
          )}

          {/* Client table */}
          <SectionCard
            title={`Detaliu pe clienți — ${MONTHS_RO[month-1]} ${year}`}
            description="Bifați clienții pentru facturare în masă și urmăriți starea sumelor procesate."
            icon={Wallet}
          >
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
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {fmt(c.collectedAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
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
                    <td className="px-4 py-3 text-right text-foreground">
                      {fmt(data.collectedAmount)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              </div>
              )}
            </CardContent>
          </SectionCard>
        </>
      )}

      {/* Revenue Forecast */}
      {forecast && (
        <SectionCard
          title="Predicție venituri — lunile următoare"
          description="Calculată pe baza frecvenței actuale a fiecărui client. Condiție: toate ședințele se confirmă."
          icon={BrainCircuit}
        >
          <CardContent className="pt-0">
            <CardDescription>
              Calculat pe baza frecvenței actuale a fiecărui client. Condiție: toate ședințele se confirmă.
            </CardDescription>
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
        </SectionCard>
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
  label: string; value: string; icon: typeof Users;
  accent: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  const accents = {
    neutral: "bg-muted text-foreground",
    info: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
    danger: "bg-destructive/15 text-destructive",
  };
  return (
    <MetricCard
      icon={icon}
      label={label}
      value={value}
      iconClassName={accents[accent]}
    />
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
              ? "bg-primary"
              : "bg-muted-foreground/50 opacity-70"
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
