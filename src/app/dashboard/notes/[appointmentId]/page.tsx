import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointment } from "@/lib/appointments/queries";
import {
  deriveLocation,
  locationLabel,
  statusLabel,
  statusVariant,
} from "@/lib/appointments/helpers";
import { getNoteByAppointment } from "@/lib/notes/queries";
import { NoteEditor } from "@/components/notes/note-editor";
import { DashboardPage, PageHeader, SectionCard } from "@/components/app/page-shell";

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const appointment = await getAppointment(appointmentId);
  if (!appointment) notFound();

  const note = await getNoteByAppointment(appointmentId);
  const location = deriveLocation(appointment);

  return (
    <DashboardPage className="max-w-5xl">
      <Link
        href="/dashboard/notes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la note
      </Link>

      <PageHeader
        title={appointment.client?.full_name ?? "Ședință"}
        description={`${format(new Date(appointment.appointment_date), "EEEE, d MMMM yyyy · HH:mm", {
          locale: ro,
        })} · ${appointment.duration_minutes} min · ${locationLabel[location]}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[appointment.status as keyof typeof statusVariant]}>
              {statusLabel[appointment.status as keyof typeof statusLabel] ??
                appointment.status}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/appointments/${appointment.id}`}>
                Deschide programarea
              </Link>
            </Button>
          </div>
        }
      />

      <SectionCard
        title="Notă clinică"
        description="Conținutul este criptat și rămâne atașat exclusiv acestei programări."
      >
        <div className="p-6">
          <NoteEditor
            appointmentId={appointment.id}
            initialCiphertext={note?.encrypted_content ?? null}
            updatedAt={note?.updated_at ?? null}
          />
        </div>
      </SectionCard>
    </DashboardPage>
  );
}
