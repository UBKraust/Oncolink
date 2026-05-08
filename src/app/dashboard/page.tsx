import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, ClipboardList, FolderKanban, Receipt, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";

import { AppointmentsToday } from "@/components/dashboard/appointments-today";
import { AssessmentTasksPanel } from "@/components/dashboard/AssessmentTasksPanel";
import { ClinicalAlertsPanel } from "@/components/dashboard/ClinicalAlertsPanel";
import { DocumentTasksPanel } from "@/components/dashboard/DocumentTasksPanel";
import { ResearchReadinessPanel } from "@/components/dashboard/ResearchReadinessPanel";
import { ServiceTracksOverview } from "@/components/dashboard/ServiceTracksOverview";
import { TodayCommandCenter } from "@/components/dashboard/TodayCommandCenter";
import { UnpaidInvoices } from "@/components/dashboard/unpaid-invoices";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
import { FinancialSummary } from "@/components/dashboard/financial-summary";
import { VaultStatusWidget } from "@/components/dashboard/vault-status-widget";
import { RealtimeDashboard } from "@/components/dashboard/realtime-dashboard";
import {
  DashboardWorkspaceTabs,
} from "@/components/dashboard/DashboardWorkspaceTabs";
import { Button } from "@/components/ui/button";
import { DashboardPage as DashboardShell, PageHeader, StatusBanner } from "@/components/app/page-shell";
import {
  getDashboardStats,
  getAppointmentsToday,
  getUnpaidInvoices,
  getUpcomingAppointments,
  getDashboardClinicalAlerts,
  getDashboardDocumentTasks,
  getDashboardServiceTrackStats,
  getDashboardAssessmentTasks,
  getDashboardResearchReadiness,
} from "@/lib/dashboard/queries";
import { runServerComplianceCheck } from "@/lib/compliance/server-engine";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTherapistSettings } from "@/app/dashboard/settings/settings-actions";
import { cn } from "@/lib/utils";

type DashboardWorkspace = "focus" | "flow" | "ops";

const EMPTY_COMPLIANCE_DATA = {
  totalClients: 0,
  compliantCount: 0,
  warningCount: 0,
  criticalCount: 0,
  overallScore: 100,
  results: [],
  lastChecked: new Date(0).toISOString(),
};

function isDashboardWorkspace(value: string | undefined): value is DashboardWorkspace {
  return value === "focus" || value === "flow" || value === "ops";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const today = new Date();
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const loadWarnings: string[] = [];
  const safeLoad = async <T,>(label: string, fallback: T, loader: () => Promise<T>) => {
    try {
      return await loader();
    } catch (error) {
      const message = error instanceof Error ? error.message : "eroare necunoscută";
      loadWarnings.push(`${label}: ${message}`);
      return fallback;
    }
  };
  const [
    stats,
    appointmentsToday,
    unpaidInvoices,
    upcomingAppointments,
    complianceData,
    settings,
    clinicalAlerts,
    documentTasks,
    serviceTracks,
    assessmentTasks,
    researchReadiness,
  ] = await Promise.all([
    safeLoad("Statistici dashboard", {
      totalRevenue: 0,
      expensesMonth: 0,
      netProfitMonth: 0,
      appointmentsToday: 0,
      totalHours: 0,
      pendingMinorReviews: 0,
      privatePatients: 0,
      clinicPatients: 0,
      minorPatients: 0,
      adultPatients: 0,
      b2bPatients: 0,
      vaultAlertsCount: 0,
      vaultTotalDocs: 0,
    }, getDashboardStats),
    safeLoad("Programări de azi", [], getAppointmentsToday),
    safeLoad("Facturi restante", [], getUnpaidInvoices),
    safeLoad("Programări următoare", [], getUpcomingAppointments),
    safeLoad("Conformitate", EMPTY_COMPLIANCE_DATA, runServerComplianceCheck),
    safeLoad("Setări terapeut", null, getTherapistSettings),
    safeLoad("Alerte clinice", [], getDashboardClinicalAlerts),
    safeLoad("Taskuri documente", [], getDashboardDocumentTasks),
    safeLoad("Piste clinice", [], getDashboardServiceTrackStats),
    safeLoad("Taskuri evaluare", [], getDashboardAssessmentTasks),
    safeLoad("Research readiness", {
      serviceTypesConfigured: 0,
      totalClients: 0,
      assessmentsCount: 0,
      clientsWithScores: 0,
      researchConsents: 0,
      hasData: false,
    }, getDashboardResearchReadiness),
  ]);
  const therapistName = settings?.full_name ?? settings?.practice_name ?? "Terapeut";
  const incompleteFiles = documentTasks.filter((task) =>
    ["GDPR", "ONBOARDING", "MINOR_LEGAL"].includes(task.type),
  ).length;
  const actionsToResolve = clinicalAlerts.length + documentTasks.length;
  const batchTasksCount =
    unpaidInvoices.length + upcomingAppointments.length + assessmentTasks.length;
  const activeWorkspace: DashboardWorkspace = isDashboardWorkspace(params.workspace)
    ? params.workspace
    : "focus";

  return (
    <DashboardShell>
      {configured ? <RealtimeDashboard /> : null}

      {configured && loadWarnings.length > 0 ? (
        <StatusBanner
          title="Unele widget-uri nu au putut fi încărcate"
          description={`Dashboardul rămâne utilizabil, dar unele panouri afișează momentan valori goale. Detalii: ${loadWarnings.join(" · ")}`}
          tone="warning"
        />
      ) : null}

      <PageHeader
        eyebrow={format(today, "EEEE, d MMMM yyyy", { locale: ro })}
        title={`Bună ziua, ${therapistName}`}
        description={`Azi ai ${stats.appointmentsToday} ședințe, ${incompleteFiles} dosare incomplete și ${actionsToResolve} acțiuni de rezolvat.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sistem online și securizat
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/clients/new">Client nou</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/appointments/new">Programare</Link>
            </Button>
          </div>
        }
      />

      <DashboardWorkspaceTabs
        initialWorkspace={activeWorkspace}
        actionsToResolve={actionsToResolve}
        flowCount={appointmentsToday.length + serviceTracks.length}
        batchTasksCount={batchTasksCount}
        focusContent={
          <section className="space-y-4">
          <section className="rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(14,116,144,0.08),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  Focusul zilei
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    Ce urmează acum și ce poate bloca ziua de lucru
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Workspace-ul de focus concentrează următoarea ședință, confirmările și blocajele care trebuie triere imediată.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <WorkspaceSnapshotCard
                  label="Ședințe azi"
                  value={stats.appointmentsToday}
                  helper={`${appointmentsToday.filter((appointment) => appointment.status === "CONFIRMAT").length} confirmate · ${appointmentsToday.filter((appointment) => appointment.status === "PROGRAMAT").length} neconfirmate`}
                  icon={CalendarDays}
                />
                <WorkspaceSnapshotCard
                  label="Blocaje active"
                  value={actionsToResolve}
                  helper={`${incompleteFiles} dosare incomplete · ${clinicalAlerts.length} alerte clinice`}
                  icon={ShieldAlert}
                  tone="warning"
                />
              </div>
            </div>
          </section>

          <TodayCommandCenter
            appointmentsToday={appointmentsToday}
            stats={stats}
            incompleteFiles={incompleteFiles}
            actionsToResolve={actionsToResolve}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ClinicalAlertsPanel alerts={clinicalAlerts} hideSeeAll />
            <DocumentTasksPanel tasks={documentTasks} />
          </div>
          </section>
        }
        flowContent={
          <section className="space-y-4">
          <section className="rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(14,116,144,0.08),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <FolderKanban className="h-3.5 w-3.5 text-primary" />
                  Flux clinic
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    Programări, fluxuri clinice și evaluări în același ritm de lucru
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Workspace-ul clinic leagă agenda zilnică de tipul de caz și de următoarele acțiuni necesare în evaluare.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <WorkspaceSnapshotCard
                  label="Cazuri active"
                  value={serviceTracks.reduce((sum, track) => sum + track.activeClients, 0)}
                  helper={`${serviceTracks.length} piste clinice urmărite`}
                  icon={FolderKanban}
                />
                <WorkspaceSnapshotCard
                  label="Evaluări restante"
                  value={assessmentTasks.length}
                  helper={`${appointmentsToday.length} programări astăzi · ${assessmentTasks.filter((task) => task.priority === "high").length} prioritare`}
                  icon={ClipboardList}
                  tone="warning"
                />
              </div>
            </div>
          </section>

          <ServiceTracksOverview tracks={serviceTracks} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AppointmentsToday appointments={appointmentsToday} />
            </div>
            <AssessmentTasksPanel tasks={assessmentTasks} />
          </div>
          </section>
        }
        opsContent={
          <section className="space-y-4">
          <section className="rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(14,116,144,0.08),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  Hub operațional
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    Facturi, cabinet și mentenanță administrativă într-un singur flux
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Zona operațională este grupată clar între recuperarea financiară și menținerea validă a cabinetului, în linie cu auditul dashboardului.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <WorkspaceSnapshotCard
                  label="Restanțe active"
                  value={unpaidInvoices.length}
                  helper={`${unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0).toFixed(2)} RON de recuperat`}
                  icon={Receipt}
                />
                <WorkspaceSnapshotCard
                  label="Cabinet & conformitate"
                  value={stats.vaultAlertsCount + clinicalAlerts.length}
                  helper={`${stats.vaultAlertsCount} alerte seif · ${clinicalAlerts.length} semnale legale`}
                  icon={ShieldAlert}
                  tone="warning"
                />
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="space-y-4">
              <FinancialSummary
                gross={stats.totalRevenue}
                expenses={stats.expensesMonth}
                net={stats.netProfitMonth}
              />
              <UpcomingAppointments appointments={upcomingAppointments} />
            </div>
            <UnpaidInvoices invoices={unpaidInvoices} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="space-y-4">
              <VaultStatusWidget
                alerts={stats.vaultAlertsCount}
                totalDocs={stats.vaultTotalDocs}
              />
              <CompliancePanel compact initialData={complianceData} />
            </div>
            <ResearchReadinessPanel readiness={researchReadiness} />
          </div>
          </section>
        }
      />
    </DashboardShell>
  );
}

function WorkspaceSnapshotCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof ShieldAlert;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-4 shadow-sm",
        tone === "warning"
          ? "border-amber-200 bg-amber-50/75 dark:border-amber-900 dark:bg-amber-950/20"
          : "border-border/60 bg-card/90",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", tone === "warning" ? "text-amber-600" : "text-primary")} />
        {label}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>
    </div>
  );
}
