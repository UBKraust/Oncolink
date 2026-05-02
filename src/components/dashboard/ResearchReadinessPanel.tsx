import Link from "next/link";
import { BotMessageSquare, FlaskConical } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import type { DashboardResearchReadiness } from "@/lib/dashboard/queries";

export function ResearchReadinessPanel({
  readiness,
}: {
  readiness: DashboardResearchReadiness;
}) {
  return (
    <SectionCard
      title="Research / AI Readiness"
      description="Un rezumat discret al datelor care pot alimenta viitorul Research Hub și AI local."
      icon={FlaskConical}
    >
      {!readiness.hasData ? (
        <EmptyState
          title="Research Hub va deveni disponibil după configurarea service tracks și catalogului de teste."
          description="Pe măsură ce completezi tipul de serviciu și evaluările, zona aceasta va deveni utilă pentru export și analiză."
          icon={FlaskConical}
        />
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Service type completat
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
              {readiness.serviceTypesConfigured}/{readiness.totalClients}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Evaluări existente
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
              {readiness.assessmentsCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Clienți cu scoruri
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
              {readiness.clientsWithScores}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Research consent
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
              {readiness.researchConsents}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              AI local
            </p>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Placeholder pregătit pentru fluxurile din `/dashboard/ai`.
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-3 h-auto px-0 text-primary">
              <Link href="/dashboard/ai">
                <BotMessageSquare className="h-4 w-4" />
                Vezi AI readiness
              </Link>
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
