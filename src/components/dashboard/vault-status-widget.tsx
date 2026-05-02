"use client";

import Link from "next/link";
import { AlertTriangle, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VaultStatusWidgetProps {
  alerts: number;
  totalDocs: number;
}

export function VaultStatusWidget({ alerts, totalDocs }: VaultStatusWidgetProps) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      alerts > 0 ? "border-rose-200 dark:border-rose-900" : "border-emerald-200 dark:border-emerald-900"
    )}>
      <CardHeader className={cn(
        "pb-2",
        alerts > 0 ? "bg-rose-50/50 dark:bg-rose-950/20" : "bg-emerald-50/50 dark:bg-emerald-950/20"
      )}>
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className={cn("h-4 w-4", alerts > 0 ? "text-rose-600" : "text-emerald-600")} />
            Seif Digital Cabinet
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            Audit Ready
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-0.5">
            <p className="text-2xl font-bold">{totalDocs}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Documente salvate</p>
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            alerts > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          )}>
            {alerts > 0 ? <AlertTriangle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
        </div>

        {alerts > 0 ? (
          <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 mb-4">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {alerts} documente expiră în curând!
            </p>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1">
              Verifică Certificarea CPR sau Asigurarea.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 mb-4">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Toate documentele sunt valide.
            </p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Auditul CPR/DSP este în conformitate.
            </p>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full text-xs gap-2">
          <Link href="/dashboard/vault">
            Accesează Seiful
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
