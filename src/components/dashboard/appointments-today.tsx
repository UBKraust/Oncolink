import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";
import { EmptyState, SectionCard } from "@/components/app/page-shell";

export function AppointmentsToday({ appointments }: { appointments: DashboardAppointment[] }) {
  return (
    <SectionCard
      title="Programul de azi"
      description={
        appointments.length
          ? `${appointments.length} programări · include gărzi externe`
          : "Nicio programare astăzi"
      }
      icon={CalendarDays}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="text-[11px] font-medium text-muted-foreground">
            {appointments.length
              ? `${appointments.length} programări · include gărzi externe`
              : "Nicio programare astăzi"}
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" /> Adaugă
        </Link>
      </div>
      <div className="space-y-2 p-4">
        {appointments.length === 0 ? (
          <EmptyState
            title="Agendă liberă"
            description="Nu există programări pentru astăzi. Poți adăuga rapid una nouă din această secțiune."
            icon={CalendarDays}
            action={{ label: "Adaugă programare", href: "/dashboard/appointments/new" }}
          />
        ) : (
          appointments.map((a) => <AppointmentRow key={a.id} appointment={a} />)
        )}
      </div>
    </SectionCard>
  );
}
