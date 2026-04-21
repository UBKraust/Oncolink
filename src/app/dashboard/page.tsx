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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  mockStats,
  mockToday,
  mockUnpaidInvoices,
  mockUpcoming,
} from "@/lib/mock/dashboard";

const THERAPIST_NAME = "Psih. Ioana Cosmina Terente PFA";

export default function DashboardPage() {
  const today = new Date();
  const stats = mockStats;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary/70">
            {format(today, "EEEE, d MMMM yyyy", { locale: ro })}
          </p>
          <h1 className="text-3xl font-black tracking-tight mt-1">
            Bună ziua, {THERAPIST_NAME}
          </h1>
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30">
            <ShieldCheck className="h-3 w-3" />
            Sistem Online & Securizat
          </div>
        </div>
      </div>

      {/* Critical Legal Alerts */}
      {stats.pendingMinorReviews > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900">Validare Juridică Necesară (Minori)</p>
              <p className="text-xs text-amber-700">Există {stats.pendingMinorReviews}dosar de minor nou cu custodie comună ce necesită verificarea documentelor.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-100 font-bold group">
            <Link href="/dashboard/clients?filter=review">
              Vezi Dosare
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Top Layer: Clinical & Business Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Profit Net (Luna)"
          value={`${stats.netProfitMonth.toLocaleString("ro-RO")} RON`}
          hint={`După ${stats.expensesMonth} RON cheltuieli`}
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

      {/* Middle Layer: Specialized Business Widgets */}
      <div className="grid gap-4 lg:grid-cols-3">
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

      {/* Analytics: Patient Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Bottom Layer: Operational Data */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppointmentsToday appointments={mockToday} />
        </div>
        <UnpaidInvoices invoices={mockUnpaidInvoices} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UpcomingAppointments appointments={mockUpcoming} />
        </div>
        <div className="lg:col-span-2">
          <CompliancePanel compact />
        </div>
      </div>
    </div>
  );
}
