import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

import { AppointmentsToday } from "@/components/dashboard/appointments-today";
import { ClinicalAlertsPanel } from "@/components/dashboard/ClinicalAlertsPanel";
import { DocumentTasksPanel } from "@/components/dashboard/DocumentTasksPanel";
import { DashboardTodayStats } from "@/components/dashboard/DashboardTodayStats";
import { ServiceTracksOverview } from "@/components/dashboard/ServiceTracksOverview";
import { UnpaidInvoices } from "@/components/dashboard/unpaid-invoices";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
import { FinancialSummary } from "@/components/dashboard/financial-summary";
import { VaultStatusWidget } from "@/components/dashboard/vault-status-widget";
import { DashboardSecondaryTabs } from "@/components/dashboard/DashboardSecondaryTabs";
import { ResearchReadinessPanel } from "@/components/dashboard/ResearchReadinessPanel";
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
    getDashboardResearchReadiness(),
    getTodayFinanceSnapshot(),
  ]);
  const therapistName = settings?.full_name ?? settings?.practice_name ?? "Terapeut";
  const alertsCount = clinicalAlerts.length + documentTasks.length;

  return (
    <DashboardShell>
      {configured ? <RealtimeDashboard /> : null}

      <PageHeader
        eyebrow={format(today, "EEEE, d MMMM yyyy", { locale: ro })}
        title={`Bună ziua, ${therapistName}`}
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/clients/new">Client nou</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AppointmentsToday appointments={appointmentsToday} />
        <DashboardTodayStats
          appointments={appointmentsToday}
          finance={todayFinance}
          alertsCount={alertsCount}
        />
      </div>

      {alertsCount > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {clinicalAlerts.length > 0 ? (
            <ClinicalAlertsPanel alerts={clinicalAlerts} />
          ) : null}
          {documentTasks.length > 0 ? (
            <DocumentTasksPanel tasks={documentTasks} />
          ) : null}
        </div>
      ) : null}

      <ServiceTracksOverview tracks={serviceTracks} />

      <DashboardSecondaryTabs
        counts={{
          unpaidInvoices: unpaidInvoices.length,
          upcomingAppointments: upcomingAppointments.length,
          vaultAlerts: stats.vaultAlertsCount,
        }}
        upcomingTab={
          <div className="pt-4">
            <UpcomingAppointments appointments={upcomingAppointments} />
          </div>
        }
        financialTab={
          <div className="grid gap-4 pt-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FinancialSummary
                gross={stats.totalRevenue}
                expenses={stats.expensesMonth}
                net={stats.netProfitMonth}
              />
            </div>
            <UnpaidInvoices invoices={unpaidInvoices} />
          </div>
        }
        cabinetTab={
          <div className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <VaultStatusWidget
                alerts={stats.vaultAlertsCount}
                totalDocs={stats.vaultTotalDocs}
              />
              <div className="lg:col-span-2">
                <CompliancePanel compact initialData={complianceData} />
              </div>
            </div>
            <ResearchReadinessPanel readiness={researchReadiness} />
          </div>
        }
      />
    </DashboardShell>
  );
}
