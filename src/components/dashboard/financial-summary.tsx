"use client";

import { Banknote, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinancialSummaryProps {
  gross: number;
  expenses: number;
  net: number;
}

export function FinancialSummary({ gross, expenses, net }: FinancialSummaryProps) {
  const profitMargin = Math.round((net / (gross || 1)) * 100);

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-black tracking-tight">
          <TrendingUp className="h-4 w-4 text-primary" />
          Financiar lunar
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Banknote className="h-3 w-3" />
              Venit Brut
            </div>
            <div className="text-2xl font-black tracking-tight">{gross.toLocaleString("ro-RO")} RON</div>
            <p className="text-[11px] text-muted-foreground">Încasări și facturare din luna curentă</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Wallet className="h-3 w-3 text-rose-500" />
              Cheltuieli
            </div>
            <div className="text-2xl font-black tracking-tight text-rose-600">
              -{expenses.toLocaleString("ro-RO")} RON
            </div>
            <p className="text-[11px] text-muted-foreground">Cheltuieli operaționale estimate</p>
          </div>

          <div className="relative flex flex-col justify-center rounded-[1.5rem] bg-muted/30 p-4">
            <div className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-400">
              Profit estimat
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {net.toLocaleString("ro-RO")} RON
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800/70 dark:text-emerald-400/70">Margine</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{profitMargin}%</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Raport venit vs cheltuieli</span>
            <span className={cn(
              "font-bold",
              profitMargin > 50 ? "text-emerald-600" : "text-amber-600"
            )}>
              {profitMargin > 50 ? "Stabil" : "De urmărit"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted flex">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${profitMargin}%` }} 
            />
            <div 
              className="h-full bg-rose-400 transition-all duration-1000" 
              style={{ width: `${100 - profitMargin}%` }} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
