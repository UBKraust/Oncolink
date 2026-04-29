import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarCheck, FileLock2, Lock, NotebookPen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
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
import { DashboardPage, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";

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
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Note clinice"
        description={`${sessions.length} ședințe · ${notes.length} note criptate local`}
        action={
          <Badge variant="secondary" className="gap-1 self-start">
            <Lock className="h-3 w-3" />
            End-to-end · PIN local
          </Badge>
        }
      />

      {!configured && (
        <SetupBanner description="Editorul de note clinice folosește acum doar note reale. După configurarea Supabase poți crea și cripta notele cabinetului." />
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

      <SectionCard
        title="Ședințe"
        description="Alege o ședință pentru a deschide editorul criptat."
      >
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <EmptyState
              title="Nu există ședințe disponibile"
              description="Notele apar după ce ai programări reale și acces la baza de date configurată."
              icon={NotebookPen}
            />
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
      </SectionCard>
    </DashboardPage>
  );
}
