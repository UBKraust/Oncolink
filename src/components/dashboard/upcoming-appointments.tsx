import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";

export function UpcomingAppointments({
  appointments,
}: {
  appointments: DashboardAppointment[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Săptămâna următoare</CardTitle>
        <CardDescription>Următoarele programări confirmate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {appointments.map((a) => (
          <AppointmentRow key={a.id} appointment={a} showDate />
        ))}
      </CardContent>
    </Card>
  );
}
