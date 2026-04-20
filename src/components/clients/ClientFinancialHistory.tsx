"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Banknote, CreditCard, ArrowLeftRight, FileCheck2,
  Clock, TrendingUp, AlertCircle, CheckCircle2,
  XCircle, Receipt, Plus
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:border-foreground"
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
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((p) => {
              const method = METHOD_CONFIG[p.payment_method];
              const invoice = INVOICE_CONFIG[p.invoice_status];

              return (
                <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                  {/* Date */}
                  <div className="w-24 shrink-0 text-left">
                    <p className="text-xs font-medium">
                      {format(new Date(p.appointment_date), "d MMM yyyy", { locale: ro })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(p.appointment_date), "HH:mm")} · {p.duration_minutes}min
                    </p>
                  </div>

                  {/* Method badge */}
                  <div className="w-32 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${method.class}`}>
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
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {cashCount > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Banknote className="h-3.5 w-3.5" />
          {cashCount} plăți în numerar (cash) — neincluse automat în facturare digitală.
        </p>
      )}
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
    <Card>
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
