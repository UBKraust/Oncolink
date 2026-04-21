export const runtime = "edge";

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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard/notes"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Înapoi la note
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {appointment.client?.full_name ?? "Ședință"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(appointment.appointment_date), "EEEE, d MMMM yyyy · HH:mm", {
              locale: ro,
            })}{" "}
            · {appointment.duration_minutes} min · {locationLabel[location]}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
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
      </div>

      <NoteEditor
        appointmentId={appointment.id}
        initialCiphertext={note?.encrypted_content ?? null}
        updatedAt={note?.updated_at ?? null}
      />
    </div>
  );
}
