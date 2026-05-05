import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, FolderKanban, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { DashboardPage as DashboardShell, PageHeader } from "@/components/app/page-shell";
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

const DASHBOARD_WORKSPACES: Array<{
  id: DashboardWorkspace;
  label: string;
  title: string;
  description: string;
  icon: typeof CalendarDays;
}> = [
  {
    id: "focus",
    label: "Azi",
    title: "Focusul zilei",
    description: "Următoarea programare și blocajele care cer triere imediată.",
    icon: CalendarDays,
  },
  {
    id: "flow",
    label: "Flux clinic",
    title: "Rezolvare pe flux",
    description: "Service tracks, programări și evaluări în context clinic.",
    icon: FolderKanban,
  },
  {
    id: "ops",
    label: "Operațional",
    title: "Cabinet și batch work",
    description: "Financiar, conformitate, seif și mentenanță de cabinet.",
    icon: Wallet,
  },
];

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
    getDashboardStats(),
    getAppointmentsToday(),
    getUnpaidInvoices(),
    getUpcomingAppointments(),
    runServerComplianceCheck(),
    getTherapistSettings().catch(() => null),
    getDashboardClinicalAlerts(),
    getDashboardDocumentTasks(),
    getDashboardServiceTrackStats(),
    getDashboardAssessmentTasks(),
    getDashboardResearchReadiness(),
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

      <section className="rounded-[2rem] border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-3">
            <div className="inline-flex rounded-[1.25rem] border border-border/60 bg-muted/40 p-1">
              {DASHBOARD_WORKSPACES.map((workspace) => {
                const Icon = workspace.icon;
                const isActive = activeWorkspace === workspace.id;
                return (
                  <Link
                    key={workspace.id}
                    href={workspace.id === "focus" ? "/dashboard" : `/dashboard?workspace=${workspace.id}`}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-bold transition-all",
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {workspace.label}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Workspace activ
              </p>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {DASHBOARD_WORKSPACES.find((workspace) => workspace.id === activeWorkspace)?.title}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {DASHBOARD_WORKSPACES.find((workspace) => workspace.id === activeWorkspace)?.description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <WorkspaceSummaryCard
              title="Blocaje & risc"
              value={actionsToResolve}
              subtitle="semnale care cer triere"
              href="/dashboard?workspace=focus"
              icon={ShieldAlert}
              active={activeWorkspace === "focus"}
              tone="warning"
            />
            <WorkspaceSummaryCard
              title="Flux clinic"
              value={appointmentsToday.length + serviceTracks.length}
              subtitle="agenda de azi și service tracks"
              href="/dashboard?workspace=flow"
              icon={FolderKanban}
              active={activeWorkspace === "flow"}
              tone="default"
            />
            <WorkspaceSummaryCard
              title="Batch work"
              value={batchTasksCount}
              subtitle="financiar și operațional"
              href="/dashboard?workspace=ops"
              icon={Wallet}
              active={activeWorkspace === "ops"}
              tone="success"
            />
          </div>
        </div>
      </section>

      {activeWorkspace === "focus" ? (
        <section className="space-y-4">
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
      ) : null}

      {activeWorkspace === "flow" ? (
        <section className="space-y-4">
          <ServiceTracksOverview tracks={serviceTracks} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AppointmentsToday appointments={appointmentsToday} />
            </div>
            <AssessmentTasksPanel tasks={assessmentTasks} />
          </div>
        </section>
      ) : null}

      {activeWorkspace === "ops" ? (
        <section className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <FinancialSummary
                gross={stats.totalRevenue}
                expenses={stats.expensesMonth}
                net={stats.netProfitMonth}
              />
            </div>
            <UnpaidInvoices invoices={unpaidInvoices} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <UpcomingAppointments appointments={upcomingAppointments} />
            </div>
            <VaultStatusWidget
              alerts={stats.vaultAlertsCount}
              totalDocs={stats.vaultTotalDocs}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <CompliancePanel compact initialData={complianceData} />
            </div>
            <ResearchReadinessPanel readiness={researchReadiness} />
          </div>
        </section>
      ) : null}
    </DashboardShell>
  );
}

function WorkspaceSummaryCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  active,
  tone,
}: {
  title: string;
  value: number;
  subtitle: string;
  href: string;
  icon: typeof ShieldAlert;
  active: boolean;
  tone: "default" | "warning" | "success";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-[1.5rem] border px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-sm",
        active
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-border/60 bg-muted/20 hover:border-primary/20",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "warning" && "text-amber-600",
            tone === "success" && "text-emerald-600",
            tone === "default" && "text-primary",
          )}
        />
        {title}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </Link>
  );
}
