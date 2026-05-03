import Link from "next/link";
import { BellRing, ChevronRight, ShieldAlert, ShieldCheck } from "lucide-react";

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
      title="Clinical & Legal Alerts"
      description="Semnale care merită atenție înainte să se transforme în blocaje."
      icon={ShieldAlert}
    >
      {alerts.length === 0 ? (
        <EmptyState
          title="Nu există alerte clinice sau administrative."
          description="Totul este în regulă pentru moment."
          icon={ShieldCheck}
        />
      ) : (
        <div className="space-y-3 p-4">
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
      )}
    </SectionCard>
  );
}
