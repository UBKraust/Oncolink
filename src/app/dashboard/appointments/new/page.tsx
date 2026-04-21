import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listClients } from "@/lib/clients/queries";
import { createAppointment } from "@/app/dashboard/appointments/actions";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const clients = await listClients();
  const activeClients = clients
    .filter((c) => !c.notes_anonymized_at)
    .map((c) => ({ id: c.id, full_name: c.full_name, email: c.email }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la programări
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Programare nouă</CardTitle>
          <CardDescription>
            Alege clientul, data, locația și durata. Sesiunile Online necesită un link
            Google Meet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentForm
            action={createAppointment}
            clients={activeClients}
            defaults={{ client_id: clientId }}
            submitLabel="Salvează programarea"
            cancelHref="/dashboard/appointments"
            showRecurring
          />
        </CardContent>
      </Card>
    </div>
  );
}
