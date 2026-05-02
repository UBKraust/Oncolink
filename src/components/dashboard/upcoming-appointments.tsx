import { CalendarRange } from "lucide-react";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";
import { EmptyState, SectionCard } from "@/components/app/page-shell";

export function UpcomingAppointments({ appointments }: { appointments: DashboardAppointment[] }) {
  return (
    <SectionCard
      title="Săptămâna următoare"
      description="Următoarele programări confirmate."
      icon={CalendarRange}
    >
      <div className="space-y-2 p-4">
        {appointments.length === 0 ? (
          <EmptyState
            title="Nicio programare în vedere"
            description="După confirmarea următoarelor sesiuni, ele vor apărea aici în ordinea apropiată."
            icon={CalendarRange}
          />
        ) : (
          appointments.map((a) => <AppointmentRow key={a.id} appointment={a} showDate showClinicalContext={false} />)
        )}
      </div>
    </SectionCard>
  );
}
