import Link from "next/link";
import { BotMessageSquare, FlaskConical } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardResearchReadiness } from "@/lib/dashboard/queries";

export function ResearchReadinessPanel({
  readiness,
}: {
  readiness: DashboardResearchReadiness;
}) {
  return (
    <SectionCard
      title="Pregătire Research & AI"
      description="Rezumatul datelor care pot alimenta hubul de research și fluxurile de AI local."
      icon={FlaskConical}
    >
      {!readiness.hasData ? (
        <EmptyState
          title="Hubul de research va deveni disponibil după configurarea fluxurilor clinice și a catalogului de teste."
          description="Pe măsură ce completezi tipul de serviciu și evaluările, zona aceasta va deveni utilă pentru export și analiză."
          icon={FlaskConical}
        />
      ) : (
        <>
          <div className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(248,250,252,0.45))] p-4">
            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-border/60 bg-card/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Maturitate date
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
                    {readiness.serviceTypesConfigured}/{readiness.totalClients}
                  </p>
                </div>
                <Badge variant="info">Pregătit pentru analiză</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Clienți cu service type completat, baza minimă pentru analiză și segmentare clinică.
              </p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border/60 p-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Tip de serviciu completat
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
                Consimțăminte research
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
                  Vezi pregătirea AI
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
}
