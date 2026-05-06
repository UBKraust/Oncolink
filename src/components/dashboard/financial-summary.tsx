"use client";

import Link from "next/link";
import { ArrowUpRight, Banknote, ChevronRight, Landmark, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/page-shell";
import { cn } from "@/lib/utils";

interface FinancialSummaryProps {
  gross: number;
  expenses: number;
  net: number;
}

export function FinancialSummary({ gross, expenses, net }: FinancialSummaryProps) {
  const profitMargin = Math.round((net / (gross || 1)) * 100);
  const healthTone =
    profitMargin >= 55 ? "success" : profitMargin >= 35 ? "warning" : "destructive";
  const healthLabel =
    profitMargin >= 55 ? "Marja lunii arată bine" : profitMargin >= 35 ? "Marja trebuie urmărită" : "Marja este sub presiune";

  return (
    <SectionCard
      title="Financiar lunar"
      description="Hubul financiar pentru încasări, costuri și sănătatea lunii în curs."
      icon={TrendingUp}
    >
      <div className="border-t border-border/60 bg-[linear-gradient(135deg,rgba(14,116,144,0.08),transparent_55%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(248,250,252,0.45))] px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge
              variant={healthTone === "success" ? "success" : healthTone === "warning" ? "warning" : "destructive"}
              className="w-fit"
            >
              {healthLabel}
            </Badge>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Profit estimat
              </p>
              <p className="mt-2 text-4xl font-black tracking-tight text-foreground">
                {net.toLocaleString("ro-RO")} RON
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
            <MetricChip
              icon={Banknote}
              label="Venit brut"
              value={`${gross.toLocaleString("ro-RO")} RON`}
              hint="încasări și facturi"
            />
            <MetricChip
              icon={TrendingDown}
              label="Cheltuieli"
              value={`-${expenses.toLocaleString("ro-RO")} RON`}
              hint="costuri operaționale"
              tone="danger"
            />
            <MetricChip
              icon={Landmark}
              label="Marjă"
              value={`${profitMargin}%`}
              hint={profitMargin >= 50 ? "ritm stabil" : "de urmărit"}
              tone={profitMargin >= 50 ? "success" : "warning"}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-border/60 bg-muted/10 sm:grid-cols-3">
        <div className="space-y-1 p-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Dinamica lunii
          </div>
          <div className="text-lg font-black tracking-tight text-foreground">
            {gross > expenses ? "Încasările acoperă costurile" : "Costurile depășesc încasările"}
          </div>
          <p className="text-[11px] text-muted-foreground">Semnal rapid pentru trierea financiară din dashboard</p>
        </div>

        <div className="space-y-1 border-t border-border/60 p-5 sm:border-t-0 sm:border-l">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            Ce urmărești
          </div>
          <div className="text-lg font-black tracking-tight text-foreground">
            Restanțe, marjă și costuri recurente
          </div>
          <p className="text-[11px] text-muted-foreground">Panou unic pentru decizii financiare, fără suprafețe paralele</p>
        </div>

        <div className="space-y-1 border-t border-border/60 p-5 sm:border-t-0 sm:border-l">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Acțiune recomandată</span>
            <Badge variant="outline" className="px-2 py-1">
              lunar
            </Badge>
          </div>
          <div className="text-lg font-black tracking-tight text-foreground">
            Intră în raportul complet și curăță restanțele
          </div>
          <p className="text-[11px] text-muted-foreground">Continuarea firească a fluxului financiar începe din acest card</p>
        </div>
      </div>

      <div className="border-t border-border/60 px-5 py-3">
        <Button asChild variant="ghost" size="sm" className="h-auto px-0 text-xs text-muted-foreground">
          <Link href="/dashboard/billing">
            Raport financiar complet
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.4rem] border px-4 py-3 shadow-sm",
        tone === "default" && "border-border/60 bg-card/90",
        tone === "success" && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/20",
        tone === "warning" && "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20",
        tone === "danger" && "border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/20",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 text-lg font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
