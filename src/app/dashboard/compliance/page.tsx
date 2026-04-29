import { Scale, ShieldCheck } from "lucide-react";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
import {
  DashboardPage,
  EmptyState,
  PageHeader,
  SectionCard,
  SetupBanner,
} from "@/components/app/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { runServerComplianceCheck } from "@/lib/compliance/server-engine";

export default async function CompliancePage() {
  const configured = isSupabaseConfigured();
  const complianceData = configured ? await runServerComplianceCheck() : null;

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Conformitate legală"
        description="Verificare operațională pentru consimțământ, contracte, documentația minorilor și retenția administrativă."
      />

      {!configured ? (
        <SetupBanner description="Panoul juridic nu mai folosește date mock. Configurează Supabase pentru verificări reale pe dosarele existente." />
      ) : null}

      <SectionCard
        title="Cadru legal urmărit"
        description="Regulile verificate acoperă documentele și obligațiile recurente folosite în cabinet."
        icon={Scale}
      >
        <div className="grid gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          {[
            { id: "R1", label: "GDPR Consent", law: "Reg. 2016/679, Legea 190/2018", sev: "CRITICAL" },
            { id: "R2", label: "Contract Terapeutic", law: "Legea 213/2004, Cod Deontologic CPR", sev: "WARNING" },
            { id: "R3", label: "Acord Ambii Părinți", law: "Legea 272/2004, Regulament CPR", sev: "CRITICAL" },
            { id: "R4", label: "Sentință Custodie", law: "Legea 272/2004", sev: "WARNING" },
            { id: "R5", label: "Retenție Facturi 10 ani", law: "Legea 82/1991 (Legea Contabilității)", sev: "CRITICAL" },
            { id: "R6", label: "CNP pentru e-Factura", law: "OUG 120/2021, Legea 296/2023", sev: "WARNING" },
          ].map((rule) => (
            <div key={rule.id} className="rounded-2xl border bg-card px-4 py-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-primary">{rule.id}</span>
                <span className="font-medium">{rule.label}</span>
                <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  rule.sev === "CRITICAL"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                }`}>{rule.sev}</span>
              </div>
              <p className="text-muted-foreground leading-snug">{rule.law}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {configured && complianceData ? (
        <CompliancePanel compact={false} initialData={complianceData} />
      ) : (
        <SectionCard
          title="Panou juridic"
          description="Rezultatele apar aici după conectarea bazei de date și încărcarea documentelor reale."
          icon={ShieldCheck}
        >
          <EmptyState
            title="Nu există verificări reale disponibile"
            description="După configurarea Supabase, aplicația va analiza automat consimțământul GDPR, contractele și documentele minorilor pe fiecare client."
            icon={ShieldCheck}
          />
        </SectionCard>
      )}
    </DashboardPage>
  );
}
