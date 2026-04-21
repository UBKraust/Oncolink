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
    <Card className="overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Sănătate Financiară (Luna aceasta)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Banknote className="h-3 w-3" />
              Venit Brut
            </div>
            <div className="text-2xl font-bold">{gross.toLocaleString("ro-RO")} RON</div>
            <p className="text-[10px] text-muted-foreground italic">Venit facturat & încasat</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Wallet className="h-3 w-3 text-rose-500" />
              Cheltuieli
            </div>
            <div className="text-2xl font-bold text-rose-600">
              -{expenses.toLocaleString("ro-RO")} RON
            </div>
            <p className="text-[10px] text-muted-foreground italic">Chirie, utilități, cursuri</p>
          </div>

          <div className="relative flex flex-col justify-center rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-tight mb-1">
              Profit Net
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {net.toLocaleString("ro-RO")} RON
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-medium text-emerald-800/70 dark:text-emerald-400/70 uppercase">Margine Profit</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{profitMargin}%</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium italic">Raport venit vs cheltuieli</span>
            <span className={cn(
              "font-bold",
              profitMargin > 50 ? "text-emerald-600" : "text-amber-600"
            )}>
              {profitMargin > 50 ? "Eficiență Excelentă" : "Eficiență Moderată"}
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
