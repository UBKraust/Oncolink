import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Activity } from "lucide-react";

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
import { initialsFromName } from "@/lib/clients/validation";
import { ActivityExportButton } from "@/components/activity/export-button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardPage, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const configured = isSupabaseConfigured();

  const appointments = await listAppointments({ status: "FINALIZAT", from, to });

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Registru activitate"
        description={`Export CPR · ${appointments.length} ședințe finalizate · fără PII`}
        action={<ActivityExportButton from={from} to={to} />}
      />

      {!configured && (
        <SetupBanner description="Exportul de activitate va deveni disponibil după configurarea Supabase. Datele demo au fost eliminate." />
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

      <SectionCard
        title="Ședințe finalizate"
        description="Coloanele exportate: data, inițiale client, tip serviciu, durată și locație."
        icon={Activity}
      >
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <EmptyState
              title="Nu există ședințe finalizate în intervalul selectat"
              description="Ajustează perioada sau finalizează programări pentru a genera registrul CPR."
              icon={Activity}
            />
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
      </SectionCard>
    </DashboardPage>
  );
}
