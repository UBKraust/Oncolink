import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, ShieldCheck, Users, Wallet } from "lucide-react";

import { AppointmentsToday } from "@/components/dashboard/appointments-today";
import { AssessmentTasksPanel } from "@/components/dashboard/AssessmentTasksPanel";
import { ClinicalAlertsPanel } from "@/components/dashboard/ClinicalAlertsPanel";
import { DocumentTasksPanel } from "@/components/dashboard/DocumentTasksPanel";
import { StatCard } from "@/components/dashboard/stat-card";
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
  getTodayFinanceSnapshot,
} from "@/lib/dashboard/queries";
import { runServerComplianceCheck } from "@/lib/compliance/server-engine";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTherapistSettings } from "@/app/dashboard/settings/settings-actions";

export default async function DashboardPage() {
  const today = new Date();
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
    todayFinance,
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
    getTodayFinanceSnapshot(),
  ]);
  const therapistName = settings?.full_name ?? settings?.practice_name ?? "Terapeut";
  const incompleteFiles = documentTasks.filter((task) =>
    ["GDPR", "ONBOARDING", "MINOR_LEGAL"].includes(task.type),
  ).length;
  const actionsToResolve = clinicalAlerts.length + documentTasks.length;

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
              <Link href="/dashboard/clients/new-minor">Pacient minor</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/appointments/new">Programare</Link>
            </Button>
          </div>
        }
      />

      <TodayCommandCenter
        appointmentsToday={appointmentsToday}
        stats={stats}
        finance={todayFinance}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ClinicalAlertsPanel alerts={clinicalAlerts} />
        <DocumentTasksPanel tasks={documentTasks} />
      </div>

      <ServiceTracksOverview tracks={serviceTracks} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ședințe Azi"
          value={String(stats.appointmentsToday)}
          hint="focusul principal al zilei"
          icon={CalendarDays}
          tone="default"
        />
        <StatCard
          label="Revizuiri Minori"
          value={String(stats.pendingMinorReviews)}
          hint="dosare sensibile în așteptare"
          icon={Users}
          tone={stats.pendingMinorReviews > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Mix Pacienți"
          value={`${stats.minorPatients} Minori / ${stats.adultPatients} Adulți`}
          hint="perspectivă demografică"
          icon={Users}
          tone="default"
        />
        <StatCard
          label="Locații Active"
          value={`${stats.privatePatients} Cabinet / ${stats.clinicPatients} Clinică`}
          hint={`${stats.b2bPatients} cazuri B2B active`}
          icon={Wallet}
          tone="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppointmentsToday appointments={appointmentsToday} />
        </div>
        <AssessmentTasksPanel tasks={assessmentTasks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FinancialSummary
            gross={stats.totalRevenue}
            expenses={stats.expensesMonth}
            net={stats.netProfitMonth}
          />
        </div>
        <UnpaidInvoices invoices={unpaidInvoices} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UpcomingAppointments appointments={upcomingAppointments} />
        </div>
        <div className="lg:col-span-2">
          <CompliancePanel compact initialData={complianceData} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <VaultStatusWidget
          alerts={stats.vaultAlertsCount}
          totalDocs={stats.vaultTotalDocs}
        />
        <div className="lg:col-span-2">
          <ResearchReadinessPanel readiness={researchReadiness} />
        </div>
      </div>

    </DashboardShell>
  );
}
