import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, CreditCard, Users, TrendingUp, ShieldCheck, AlertTriangle, ChevronRight } from "lucide-react";

import { AppointmentsToday } from "@/components/dashboard/appointments-today";
import { StatCard } from "@/components/dashboard/stat-card";
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
} from "@/lib/dashboard/queries";
import { runServerComplianceCheck } from "@/lib/compliance/server-engine";

const THERAPIST_NAME = "Psih. Ioana Cosmina Terente PFA";

function getDayGreeting(hour: number) {
  if (hour < 12) return "Bună dimineața";
  if (hour < 18) return "Bună ziua";
  return "Bună seara";
}

export default async function DashboardPage() {
  const today = new Date();
  const greeting = getDayGreeting(today.getHours());
  const [stats, appointmentsToday, unpaidInvoices, upcomingAppointments, complianceData] = await Promise.all([
    getDashboardStats(),
    getAppointmentsToday(),
    getUnpaidInvoices(),
    getUpcomingAppointments(),
    runServerComplianceCheck(),
  ]);

  return (
    <DashboardShell>
      <RealtimeDashboard />

      <PageHeader
        eyebrow={format(today, "EEEE, d MMMM yyyy", { locale: ro })}
        title={`${greeting}, ${THERAPIST_NAME}`}
        description="Panoul tău operațional compact pentru activitatea clinică, administrativă și juridică."
        action={
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sistem online și securizat
          </div>
        }
      />

      {/* ── Alert minori ─────────────────────────────────────────────────── */}
      {stats.pendingMinorReviews > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900">Validare juridică necesară</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Există {stats.pendingMinorReviews} dosar de minor nou cu custodie comună ce necesită verificarea documentelor.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100 font-bold shrink-0 gap-1">
            <Link href="/dashboard/clients?filter=review">
              Vezi Dosare
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-body-sm">
        <p className="font-semibold text-foreground">Personalizare azi</p>
        <p className="mt-1 text-muted-foreground">Ai {stats.appointmentsToday} ședințe programate și {stats.pendingMinorReviews} dosare care au nevoie de atenție prioritară.</p>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Profit Net (Lunar)"
          value={`${stats.netProfitMonth.toLocaleString("ro-RO")} RON`}
          hint={`După ${stats.expensesMonth.toLocaleString("ro-RO")} RON cheltuieli`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Încasări Lună"
          value={`${stats.totalRevenue.toLocaleString("ro-RO")} RON`}
          hint="Venit Brut Facturat"
          icon={CreditCard}
          tone="default"
        />
        <StatCard
          label="Ședințe Azi"
          value={String(stats.appointmentsToday)}
          hint="din totalul programat"
          icon={CalendarDays}
          tone="default"
        />
        <StatCard
          label="Ore Prestate"
          value={`${stats.totalHours}h`}
          hint="volum clinic lunar"
          icon={Users}
          tone="default"
        />
      </div>

      {/* ── Financial + Vault ────────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FinancialSummary
            gross={stats.totalRevenue}
            expenses={stats.expensesMonth}
            net={stats.netProfitMonth}
          />
        </div>
        <VaultStatusWidget
          alerts={stats.vaultAlertsCount}
          totalDocs={stats.vaultTotalDocs}
        />
      </div>

      {/* ── Patient Analytics ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Mix Pacienți"
          value={`${stats.privatePatients} Cabinet / ${stats.clinicPatients} Clinică`}
          hint="Distribuție locație de lucru"
          icon={Users}
          tone="default"
        />
        <StatCard
          label="Demografic Pacienți"
          value={`${stats.minorPatients} Minori / ${stats.adultPatients} Adulți`}
          hint="Monitorizare vârstă"
          icon={Users}
          tone="warning"
        />
        <StatCard
          label="Sesiuni Decontate / B2B"
          value={`${stats.b2bPatients} Pacienți active`}
          hint="Contracte speciale / Companii"
          icon={CreditCard}
          tone="default"
        />
      </div>

      {/* ── Appointments + Invoices ──────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppointmentsToday appointments={appointmentsToday} />
        </div>
        <UnpaidInvoices invoices={unpaidInvoices} />
      </div>

      {/* ── Upcoming + Compliance ────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UpcomingAppointments appointments={upcomingAppointments} />
        </div>
        <div className="lg:col-span-2">
          <CompliancePanel compact initialData={complianceData} />
        </div>
      </div>

    </DashboardShell>
  );
}
