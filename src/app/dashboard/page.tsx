export const runtime = "edge";

import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarDays, CreditCard, Receipt, Users } from "lucide-react";

import { AppointmentsToday } from "@/components/dashboard/appointments-today";
import { StatCard } from "@/components/dashboard/stat-card";
import { UnpaidInvoices } from "@/components/dashboard/unpaid-invoices";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import {
  mockStats,
  mockToday,
  mockUnpaidInvoices,
  mockUpcoming,
} from "@/lib/mock/dashboard";

const THERAPIST_NAME = "Dr. Ana Munteanu";

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
          label="Programări azi"
          value={String(stats.appointmentsToday)}
          hint="sesiuni active (fără gărzi)"
          icon={CalendarDays}
          tone="default"
        />
        <StatCard
          label="Clienți activi"
          value={String(stats.activeClients)}
          hint="cu sesiune în ultimele 60 zile"
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Facturi neachitate"
          value={String(stats.unpaidInvoicesCount)}
          hint={`${stats.unpaidInvoicesTotal.toFixed(2)} RON de încasat`}
          icon={Receipt}
          tone="warning"
        />
        <StatCard
          label="Încasări luna curentă"
          value={`${stats.revenueMonth.toLocaleString("ro-RO")} RON`}
          hint="achitate prin SmartBill"
          icon={CreditCard}
          tone="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppointmentsToday appointments={mockToday} />
        </div>
        <UnpaidInvoices invoices={mockUnpaidInvoices} />
      </div>

      <UpcomingAppointments appointments={mockUpcoming} />
    </div>
  );
}
