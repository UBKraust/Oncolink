import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";

export function AppointmentsToday({
  appointments,
}: {
  appointments: DashboardAppointment[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Programul de azi</CardTitle>
          <CardDescription>
            {appointments.length
              ? `${appointments.length} programări · include gărzi externe`
              : "Nicio programare astăzi"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Agendă liberă.</p>
        ) : (
          appointments.map((a) => <AppointmentRow key={a.id} appointment={a} />)
        )}
      </CardContent>
    </Card>
  );
}
