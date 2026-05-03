import { AlertTriangle, Scale, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

import { AssessmentTasksPanel } from "@/components/dashboard/AssessmentTasksPanel";
import { ClinicalAlertsPanel } from "@/components/dashboard/ClinicalAlertsPanel";
import { DocumentTasksPanel } from "@/components/dashboard/DocumentTasksPanel";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
import { Badge } from "@/components/ui/badge";
import {
  DashboardPage,
  EmptyState,
  PageHeader,
  SectionCard,
  SetupBanner,
} from "@/components/app/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { runServerComplianceCheck } from "@/lib/compliance/server-engine";
import {
  getDashboardClinicalAlerts,
  getDashboardDocumentTasks,
  getDashboardAssessmentTasks,
} from "@/lib/dashboard/queries";
import { ComplianceTabs } from "./ComplianceTabs";

const LEGAL_RULES = [
  { id: "R1", label: "GDPR Consent", law: "Reg. 2016/679, Legea 190/2018", sev: "CRITICAL" as const },
  { id: "R2", label: "Contract Terapeutic", law: "Legea 213/2004, Cod Deontologic CPR", sev: "WARNING" as const },
  { id: "R3", label: "Acord Ambii Părinți", law: "Legea 272/2004, Regulament CPR", sev: "CRITICAL" as const },
  { id: "R4", label: "Sentință Custodie", law: "Legea 272/2004", sev: "WARNING" as const },
  { id: "R5", label: "Retenție Facturi 10 ani", law: "Legea 82/1991 (Legea Contabilității)", sev: "CRITICAL" as const },
  { id: "R6", label: "CNP pentru e-Factura", law: "OUG 120/2021, Legea 296/2023", sev: "WARNING" as const },
];

export default async function CompliancePage() {
  const configured = isSupabaseConfigured();

  const [complianceData, clinicalAlerts, documentTasks, assessmentTasks] = await Promise.all([
    configured ? runServerComplianceCheck() : null,
    getDashboardClinicalAlerts(50),
    getDashboardDocumentTasks(50),
    getDashboardAssessmentTasks(50),
  ]);

  const criticalAlerts = clinicalAlerts.filter((a) => a.severity === "critical").length;
  const highDocTasks = documentTasks.filter((t) => t.priority === "high").length;
  const highAssessmentTasks = assessmentTasks.filter((t) => t.priority === "high").length;
  const totalIssues = clinicalAlerts.length + documentTasks.length + assessmentTasks.length;

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Conformitate & Alerte"
        description="Toate notificările active din fluxurile clinice, administrative și juridice."
      />

      {!configured ? (
        <SetupBanner description="Panoul juridic nu mai folosește date mock. Configurează Supabase pentru verificări reale pe dosarele existente." />
      ) : null}

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-5 py-4">
        {totalIssues === 0 ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Nu există notificări active în acest moment.
          </span>
        ) : (
          <>
            <span className="text-sm font-medium text-foreground">{totalIssues} notificări active</span>
            {criticalAlerts > 0 && (
              <Badge variant="destructive" className="gap-1">
                <ShieldX className="h-3 w-3" />
                {criticalAlerts} critice
              </Badge>
            )}
            {clinicalAlerts.length - criticalAlerts > 0 && (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {clinicalAlerts.length - criticalAlerts} atenționări
              </Badge>
            )}
            {highDocTasks > 0 && (
              <Badge variant="destructive" className="gap-1">
                {highDocTasks} documente urgente
              </Badge>
            )}
            {highAssessmentTasks > 0 && (
              <Badge variant="warning" className="gap-1">
                {highAssessmentTasks} evaluări prioritare
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Tabbed content */}
      <ComplianceTabs
        counts={{
          alerts: clinicalAlerts.length,
          criticalAlerts,
          documents: documentTasks.length,
          highDocuments: highDocTasks,
          assessments: assessmentTasks.length,
          highAssessments: highAssessmentTasks,
        }}
        alertsTab={<ClinicalAlertsPanel alerts={clinicalAlerts} hideSeeAll />}
        documentsTab={<DocumentTasksPanel tasks={documentTasks} />}
        assessmentsTab={<AssessmentTasksPanel tasks={assessmentTasks} />}
        legalTab={
          <div className="space-y-4">
            <SectionCard
              title="Conformitate per client"
              description="GDPR · Legea 213/2004 · Legea 272/2004 · e-Factura · Legea 82/1991"
              icon={ShieldAlert}
            >
              {configured && complianceData ? (
                <div className="p-4">
                  <CompliancePanel compact={false} initialData={complianceData} />
                </div>
              ) : (
                <EmptyState
                  title="Nu există verificări reale disponibile"
                  description="După configurarea Supabase, aplicația va analiza automat consimțământul GDPR, contractele și documentele minorilor pe fiecare client."
                  icon={ShieldCheck}
                />
              )}
            </SectionCard>

            <SectionCard
              title="Cadru legal urmărit"
              description="Regulile verificate acoperă documentele și obligațiile recurente folosite în cabinet."
              icon={Scale}
            >
              <div className="grid gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                {LEGAL_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="space-y-2 rounded-3xl border border-border/60 bg-card px-4 py-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{rule.id}</span>
                      <span className="font-medium">{rule.label}</span>
                      <Badge
                        variant={rule.sev === "CRITICAL" ? "destructive" : "warning"}
                        className="ml-auto"
                      >
                        {rule.sev}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-snug">{rule.law}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        }
      />
    </DashboardPage>
  );
}
