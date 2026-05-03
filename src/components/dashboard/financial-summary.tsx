"use client";

import Link from "next/link";
import { Banknote, ChevronRight, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/page-shell";

interface FinancialSummaryProps {
  gross: number;
  expenses: number;
  net: number;
}

export function FinancialSummary({ gross, expenses, net }: FinancialSummaryProps) {
  const profitMargin = Math.round((net / (gross || 1)) * 100);

  return (
    <SectionCard
      title="Financiar lunar"
      description="Venituri, cheltuieli și profit estimat pentru luna curentă."
      icon={TrendingUp}
    >
      <div className="grid gap-px border-t border-border/60 sm:grid-cols-3">
        <div className="space-y-1 p-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Banknote className="h-3.5 w-3.5" />
            Venit brut
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {gross.toLocaleString("ro-RO")} RON
          </div>
          <p className="text-[11px] text-muted-foreground">Încasări și facturare din luna curentă</p>
        </div>

        <div className="space-y-1 border-t border-border/60 p-5 sm:border-t-0 sm:border-l">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            Cheltuieli
          </div>
          <div className="text-2xl font-black tracking-tight text-destructive">
            -{expenses.toLocaleString("ro-RO")} RON
          </div>
          <p className="text-[11px] text-muted-foreground">Cheltuieli operaționale estimate</p>
        </div>

        <div className="space-y-1 border-t border-border/60 p-5 sm:border-t-0 sm:border-l">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Profit estimat</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {profitMargin}% marjă
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {net.toLocaleString("ro-RO")} RON
          </div>
          <p className="text-[11px] text-muted-foreground">
            {profitMargin >= 50 ? "Ritm stabil" : "De urmărit"}
          </p>
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
