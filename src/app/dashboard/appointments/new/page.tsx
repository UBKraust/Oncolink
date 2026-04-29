import Link from "next/link";
import { CalendarPlus, ChevronLeft } from "lucide-react";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import {
  CardContent,
} from "@/components/ui/card";
import { listClients } from "@/lib/clients/queries";
import { createAppointment } from "@/app/dashboard/appointments/actions";
import { DashboardPage, PageHeader, SectionCard } from "@/components/app/page-shell";

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
    <DashboardPage className="max-w-4xl">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la programări
      </Link>

      <PageHeader
        title="Programare nouă"
        description="Alege clientul, data, locația și durata. Sesiunile online au nevoie de un link Google Meet valid."
      />

      <SectionCard
        title="Detalii sesiune"
        description="Completează toate datele administrative înainte de salvare."
        icon={CalendarPlus}
      >
        <CardContent className="p-6">
          <AppointmentForm
            action={createAppointment}
            clients={activeClients}
            defaults={{ client_id: clientId }}
            submitLabel="Salvează programarea"
            cancelHref="/dashboard/appointments"
            showRecurring
          />
        </CardContent>
      </SectionCard>
    </DashboardPage>
  );
}
