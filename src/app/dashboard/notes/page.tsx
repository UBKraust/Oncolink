export const runtime = "edge";

import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarCheck, FileLock2, Lock, NotebookPen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAppointments } from "@/lib/appointments/queries";
import { deriveLocation, locationLabel } from "@/lib/appointments/helpers";
import { listNotesMetadata } from "@/lib/notes/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function NotesIndexPage() {
  const configured = isSupabaseConfigured();
  const [appointments, notes] = await Promise.all([
    listAppointments({}),
    listNotesMetadata(),
  ]);

  const byAppointment = new Map(notes.map((n) => [n.appointment_id, n]));

  const sessions = appointments
    .filter((a) => !a.is_external_duty)
    .sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime(),
    );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Note clinice</h1>
          <p className="text-sm text-muted-foreground">
            {sessions.length} ședințe · {notes.length} note criptate local
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 self-start">
          <Lock className="h-3 w-3" />
          End-to-end · PIN local
        </Badge>
      </div>

      {!configured && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo — ciphertext-urile de exemplu nu se pot decripta cu PIN-ul
          tău. Setează Supabase pentru a scrie note reale.
        </div>
      )}

      <div className="rounded-md border bg-muted/40 p-4 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <FileLock2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Notele se criptează în browser (AES-GCM 256) înainte să plece spre
            bază. Serverul nu vede niciodată textul clar. AI-ul local
            (Ollama / Gemma 2) rulează doar pe mașina ta — nu e apelat niciun
            furnizor cloud.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ședințe</CardTitle>
          <CardDescription>
            Alege o ședință pentru a deschide editorul criptat.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nicio ședință.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dată</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Locație</TableHead>
                  <TableHead>Notă</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((a) => {
                  const location = deriveLocation(a);
                  const note = byAppointment.get(a.id);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="text-sm font-semibold tabular-nums">
                          {format(new Date(a.appointment_date), "HH:mm")}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {format(
                            new Date(a.appointment_date),
                            "EEE, d MMM yyyy",
                            { locale: ro },
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {a.client?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.client?.email ?? ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {locationLabel[location]}
                      </TableCell>
                      <TableCell>
                        {note ? (
                          <Badge variant="success" className="gap-1">
                            <NotebookPen className="h-3 w-3" />
                            actualizată{" "}
                            {format(new Date(note.updated_at), "d MMM", {
                              locale: ro,
                            })}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <CalendarCheck className="h-3 w-3" />
                            fără notă
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/notes/${a.id}`}>
                            {note ? "Deschide" : "Scrie notă"}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
