"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Banknote, CreditCard, ArrowLeftRight, FileCheck2,
  Clock, TrendingUp, AlertCircle, CheckCircle2,
  XCircle, Receipt, Plus, X, Download, StickyNote,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MockSessionPayment } from "@/lib/mock/payments";

// ── Icon helpers ──────────────────────────────────────────────────────────────

const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  CASH:        { label: "Cash",         icon: <Banknote className="h-3.5 w-3.5" />,      class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  CARD:        { label: "Card",         icon: <CreditCard className="h-3.5 w-3.5" />,    class: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  TRANSFER:    { label: "Transfer",     icon: <ArrowLeftRight className="h-3.5 w-3.5" />,class: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  B2B_FACTURA: { label: "Factură B2B",  icon: <FileCheck2 className="h-3.5 w-3.5" />,   class: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
};

const INVOICE_CONFIG: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  ACHITATĂ: { label: "Achitată",   icon: <CheckCircle2 className="h-3 w-3" />,  class: "text-emerald-600 dark:text-emerald-400" },
  EMISĂ:    { label: "Emisă",      icon: <Receipt className="h-3 w-3" />,        class: "text-amber-600 dark:text-amber-400" },
  ANULATĂ:  { label: "Anulată",    icon: <XCircle className="h-3 w-3" />,        class: "text-rose-600 dark:text-rose-400" },
  NEEMISĂ:  { label: "Neemisă",   icon: <AlertCircle className="h-3 w-3" />,    class: "text-muted-foreground" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientFinancialHistory({
  payments,
  clientName,
}: {
  payments: MockSessionPayment[];
  clientName: string;
}) {
  const [filter, setFilter] = useState<"ALL" | "CASH" | "CARD" | "TRANSFER" | "B2B_FACTURA">("ALL");
  const [selected, setSelected] = useState<MockSessionPayment | null>(null);

  const sorted = useMemo(
    () => [...payments].sort((a, b) =>
      new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    ),
    [payments]
  );

  const filtered = filter === "ALL" ? sorted : sorted.filter(p => p.payment_method === filter);

  // Summary stats
  const totalAmount   = payments.reduce((s, p) => s + p.amount, 0);
  const totalSessions = payments.length;
  const totalMinutes  = payments.reduce((s, p) => s + p.duration_minutes, 0);
  const unpaidCount   = payments.filter(p => p.invoice_status === "EMISĂ").length;
  const cashCount     = payments.filter(p => p.payment_method === "CASH").length;

  if (payments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Istoric Financiar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-sm text-muted-foreground">
          Nicio plată înregistrată pentru acest client.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Istoric Financiar & Plăți</h2>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Înregistrează Plată
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Încasat" value={`${totalAmount.toLocaleString("ro-RO")} RON`} icon={<TrendingUp className="h-4 w-4" />} accent="emerald" />
        <SummaryCard label="Ședințe" value={`${totalSessions}`} icon={<Clock className="h-4 w-4" />} accent="blue" />
        <SummaryCard label="Ore terapie" value={`${Math.round(totalMinutes / 60 * 10) / 10}h`} icon={<Clock className="h-4 w-4" />} accent="violet" />
        <SummaryCard label="Facturi neachitate" value={`${unpaidCount}`} icon={<Receipt className="h-4 w-4" />} accent={unpaidCount > 0 ? "amber" : "emerald"} />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "CASH", "CARD", "TRANSFER", "B2B_FACTURA"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              filter === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:border-border hover:bg-muted/30"
            }`}
          >
            {m === "ALL" ? "Toate" : METHOD_CONFIG[m]?.label ?? m}
            <span className="ml-1.5 opacity-60">
              {m === "ALL" ? payments.length : payments.filter(p => p.payment_method === m).length}
            </span>
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <Card className="rounded-[2rem] border-border/60 bg-card shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((p) => {
              const method = METHOD_CONFIG[p.payment_method];
              const invoice = INVOICE_CONFIG[p.invoice_status];

              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors text-left group"
                >
                  {/* Date */}
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-medium">
                      {format(new Date(p.appointment_date), "d MMM yyyy", { locale: ro })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(p.appointment_date), "HH:mm")} · {p.duration_minutes}min
                    </p>
                  </div>

                  {/* Method badge */}
                  <div className="w-32 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${method.class}`}>
                      {method.icon}
                      {method.label}
                    </span>
                  </div>

                  {/* Invoice status */}
                  <div className="w-32 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${invoice.class}`}>
                      {invoice.icon}
                      {p.invoice_number ?? invoice.label}
                    </span>
                  </div>

                  {/* Notes */}
                  <div className="flex-1 min-w-0">
                    {p.notes && (
                      <p className="text-xs text-muted-foreground truncate">{p.notes}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {p.amount.toLocaleString("ro-RO")} <span className="text-xs font-normal text-muted-foreground">RON</span>
                    </p>
                    <p className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Detalii →
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {cashCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Banknote className="h-3.5 w-3.5" />
          {cashCount} plăți în numerar (cash) — neincluse automat în facturare digitală.
        </p>
      )}

      {/* Payment detail overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setSelected(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/60 bg-muted/20 px-5 py-4">
              <div className="space-y-1">
                <p className="font-semibold">Detalii Plată</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selected.appointment_date), "d MMMM yyyy, HH:mm", { locale: ro })}
                </p>
                <p className="text-xs text-muted-foreground">{clientName}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Amount hero */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                <p className="text-3xl font-bold tabular-nums">
                  {selected.amount.toLocaleString("ro-RO")}
                  <span className="text-base font-normal text-muted-foreground ml-1">RON</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{selected.duration_minutes} minute</p>
              </div>

              {/* Details grid */}
              <div className="divide-y rounded-xl border border-border/60 bg-card">
                <DetailRow label="Metodă plată">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${METHOD_CONFIG[selected.payment_method]?.class}`}>
                    {METHOD_CONFIG[selected.payment_method]?.icon}
                    {METHOD_CONFIG[selected.payment_method]?.label}
                  </span>
                </DetailRow>
                <DetailRow label="Status factură">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${INVOICE_CONFIG[selected.invoice_status]?.class}`}>
                    {INVOICE_CONFIG[selected.invoice_status]?.icon}
                    {INVOICE_CONFIG[selected.invoice_status]?.label}
                  </span>
                </DetailRow>
                {selected.invoice_number && (
                  <DetailRow label="Număr factură">
                    <span className="text-sm font-mono">{selected.invoice_number}</span>
                  </DetailRow>
                )}
                <DetailRow label="Dată & oră">
                  <span className="text-sm">
                    {format(new Date(selected.appointment_date), "d MMM yyyy, HH:mm", { locale: ro })}
                  </span>
                </DetailRow>
                <DetailRow label="Durată ședință">
                  <span className="text-sm">{selected.duration_minutes} min</span>
                </DetailRow>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5" />
                    Observații
                  </p>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-sm leading-relaxed">{selected.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {selected.invoice_number && (
              <div className="border-t px-5 py-4">
                <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  <Download className="h-4 w-4" />
                  Descarcă factură {selected.invoice_number}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "emerald" | "blue" | "violet" | "amber";
}) {
  const accentMap = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950",
    blue:    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
    violet:  "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950",
    amber:   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
  };

  return (
    <Card className="rounded-[1.75rem] border-border/60 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className={`inline-flex items-center justify-center rounded-md p-1.5 mb-2 ${accentMap[accent]}`}>
          {icon}
        </div>
        <p className="text-xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
