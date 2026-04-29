import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import {
  CardContent,
} from "@/components/ui/card";
import { getAppointment } from "@/lib/appointments/queries";
import { listClients } from "@/lib/clients/queries";
import { deriveLocation } from "@/lib/appointments/helpers";
import { updateAppointment } from "@/app/dashboard/appointments/actions";
import { DashboardPage, PageHeader, SectionCard } from "@/components/app/page-shell";

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [appointment, clients] = await Promise.all([
    getAppointment(id),
    listClients(),
  ]);
  if (!appointment) notFound();

  const activeClients = clients
    .filter((c) => !c.notes_anonymized_at)
    .map((c) => ({ id: c.id, full_name: c.full_name, email: c.email }));

  const boundUpdate = updateAppointment.bind(null, id);

  return (
    <DashboardPage className="max-w-3xl">
      <Link
        href={`/dashboard/appointments/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la programare
      </Link>

      <PageHeader
        title="Editează programarea"
        description="Modificările sunt reflectate imediat în calendar, fișa clientului și notificările aferente."
      />

      <SectionCard
        title="Date programare"
        description="Actualizează intervalul, locația și statusul ședinței."
      >
        <CardContent>
          <AppointmentForm
            action={boundUpdate}
            clients={activeClients}
            defaults={{
              client_id: appointment.client_id,
              appointment_date: appointment.appointment_date,
              duration_minutes: appointment.duration_minutes,
              status: appointment.status,
              location: deriveLocation(appointment),
              meet_link: appointment.meet_link ?? "",
            }}
            submitLabel="Salvează modificările"
            cancelHref={`/dashboard/appointments/${id}`}
          />
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
