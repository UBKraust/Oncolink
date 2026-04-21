export const runtime = "edge";

import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Activity } from "lucide-react";

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
import { initialsFromName } from "@/lib/clients/validation";
import { ActivityExportButton } from "@/components/activity/export-button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const configured = isSupabaseConfigured();

  const appointments = await listAppointments({ status: "FINALIZAT", from, to });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Registru activitate
          </h1>
          <p className="text-sm text-muted-foreground">
            Export CPR · {appointments.length} ședințe finalizate · fără PII
          </p>
        </div>
        <ActivityExportButton from={from} to={to} />
      </div>

      {!configured && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo — date de mostră.
        </div>
      )}

      {/* Date range filter */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">De la</label>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Până la</label>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Aplică filtru
        </button>
        {(from || to) && (
          <a
            href="/dashboard/activity"
            className="h-9 rounded-md px-4 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center"
          >
            Resetează
          </a>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ședințe finalizate
          </CardTitle>
          <CardDescription>
            Coloanele exportate: Data, Inițiale client, Tip serviciu, Durată,
            Locație — fără date personale identificabile.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nicio ședință finalizată în intervalul selectat.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Inițiale</TableHead>
                  <TableHead>Tip serviciu</TableHead>
                  <TableHead>Durată</TableHead>
                  <TableHead>Locație</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => {
                  const initials = a.client?.full_name
                    ? initialsFromName(a.client.full_name)
                    : "—";
                  const location = a.meet_link
                    ? "Online"
                    : a.is_external_duty
                      ? "Policlinică"
                      : "Cabinet privat";
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm tabular-nums">
                        {format(new Date(a.appointment_date), "d MMM yyyy · HH:mm", {
                          locale: ro,
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">
                        {initials}
                      </TableCell>
                      <TableCell className="text-sm">
                        Psihoterapie individuală
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.duration_minutes} min
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {location}
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
