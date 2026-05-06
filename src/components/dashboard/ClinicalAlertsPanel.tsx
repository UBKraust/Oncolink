import Link from "next/link";
import { AlertTriangle, BellRing, ChevronRight, ShieldAlert, ShieldCheck } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardAlert } from "@/lib/dashboard/queries";

const severityVariant = {
  info: "info",
  warning: "warning",
  critical: "destructive",
} as const;

const severityLabel = {
  info: "Info",
  warning: "Atenție",
  critical: "Critic",
} as const;

const typeLabel = {
  LEGAL: "Legal",
  CLINICAL: "Clinic",
  DOCUMENT: "Documente",
  FINANCIAL: "Financiar",
  SYSTEM: "Sistem",
} as const;

export function ClinicalAlertsPanel({
  alerts,
  hideSeeAll = false,
}: {
  alerts: DashboardAlert[];
  hideSeeAll?: boolean;
}) {
  return (
    <SectionCard
      title="Alerte clinice și legale"
      description="Semnalele care merită atenție înainte să se transforme în blocaje operaționale."
      icon={ShieldAlert}
    >
      {alerts.length === 0 ? (
        <EmptyState
          title="Nu există alerte clinice sau administrative."
          description="Totul este în regulă pentru moment."
          icon={ShieldCheck}
        />
      ) : (
        <div className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(248,250,252,0.45))] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Total alerte
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{alerts.length}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Semnale active în acest moment</p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-100">
                <AlertTriangle className="h-3.5 w-3.5" />
                Prioritate mare
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                {alerts.filter((alert) => alert.severity === "critical").length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Alerte critice care cer intervenție rapidă</p>
            </div>
          </div>
        </div>
      )}

      {alerts.length > 0 ? (
        <div className="space-y-3 border-t border-border/60 p-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={severityVariant[alert.severity]}>
                  {severityLabel[alert.severity]}
                </Badge>
                <Badge variant="outline">{typeLabel[alert.type]}</Badge>
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{alert.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
              {alert.href && alert.ctaLabel ? (
                <Button asChild variant="ghost" size="sm" className="mt-3 h-auto px-0 text-primary">
                  <Link href={alert.href}>
                    {alert.ctaLabel}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ))}

          {!hideSeeAll && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/compliance">
                <BellRing className="h-4 w-4" />
                Vezi toate
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </SectionCard>
  );
}
