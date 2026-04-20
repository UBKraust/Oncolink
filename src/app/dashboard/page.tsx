import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, CreditCard, Receipt, Users } from "lucide-react";

import { AppointmentsToday } from "@/components/dashboard/appointments-today";
import { StatCard } from "@/components/dashboard/stat-card";
import { UnpaidInvoices } from "@/components/dashboard/unpaid-invoices";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm capitalize text-muted-foreground">
          {format(today, "EEEE, d MMMM yyyy", { locale: ro })}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bună ziua, {THERAPIST_NAME}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Ședințe Lună"
          value={String(stats.totalSessions)}
          hint="finalizate & programate"
          icon={CalendarDays}
          tone="default"
        />
        <StatCard
          label="Total Ore Prestate"
          value={`${stats.totalHours} ore`}
          hint="din durata ședințelor"
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Total Încasări Lunate"
          value={`${stats.totalRevenue.toLocaleString("ro-RO")} RON`}
          hint="din preț variabil/client"
          icon={CreditCard}
          tone="default"
        />
        <StatCard
          label="Programări azi"
          value={String(stats.appointmentsToday)}
          hint="sesiuni active (fără gărzi)"
          icon={CalendarDays}
          tone="default"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Distribuție Pacienți (Locație)"
          value={`${stats.totalPatients} Total`}
          hint={`${stats.privatePatients} la Cabinet | ${stats.clinicPatients} la Clinică`}
          icon={Users}
          tone="default"
        />
        <StatCard
          label="Demografic: Minori vs Adulți"
          value={`${stats.minorPatients} Copii / ${stats.adultPatients} Adulți`}
          hint="*Fișa de părinte este activă la copii"
          icon={Users}
          tone="warning"
        />
        <StatCard
          label="Sesiuni B2B / Decontate"
          value={`${stats.b2bPatients} Pacienți`}
          hint="dezvoltare personală prin firmă"
          icon={CreditCard}
          tone="success"
        />
      </div>

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
