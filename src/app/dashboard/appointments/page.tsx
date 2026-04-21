export const runtime = "edge";

import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Building2,
  CalendarPlus,
  Home,
  Video,
} from "lucide-react";

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
import {
  APPOINTMENT_STATUSES,
  deriveLocation,
  locationLabel,
  statusLabel,
  statusVariant,
} from "@/lib/appointments/helpers";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const locationIcon = {
  PRIVAT: Home,
  POLICLINIC: Building2,
  ONLINE: Video,
} as const;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const { status, from, to } = await searchParams;
  const configured = isSupabaseConfigured();

  const appointments = await listAppointments({ status, from, to });

  const counts = APPOINTMENT_STATUSES.reduce(
    (acc, s) => {
      acc[s] = appointments.filter((a) => a.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Programări</h1>
          <p className="text-sm text-muted-foreground">
            {appointments.length} intrări ·{" "}
            {counts["CONFIRMAT"] ?? 0} confirmate ·{" "}
            {counts["PROGRAMAT"] ?? 0} în așteptare
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/appointments/new">
            <CalendarPlus className="h-4 w-4" />
            Programare nouă
          </Link>
        </Button>
      </div>

      {!configured && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo — afișez date de mostră.
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterLink href="/dashboard/appointments" active={!status} label="Toate" />
        {APPOINTMENT_STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`/dashboard/appointments?status=${s}`}
            active={status === s}
            label={`${statusLabel[s]} (${counts[s] ?? 0})`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista programărilor</CardTitle>
          <CardDescription>
            Sortate descrescător după dată.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nicio programare găsită.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dată &amp; Oră</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Durată</TableHead>
                  <TableHead>Locație</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => {
                  const location = deriveLocation(a);
                  const LocIcon = locationIcon[location];
                  const isPast = new Date(a.appointment_date) < new Date();

                  return (
                    <TableRow key={a.id} className={isPast && a.status === "PROGRAMAT" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}>
                      <TableCell>
                        <p className="text-sm font-semibold tabular-nums">
                          {format(new Date(a.appointment_date), "HH:mm")}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {format(new Date(a.appointment_date), "EEE, d MMM yyyy", { locale: ro })}
                        </p>
                      </TableCell>
                      <TableCell>
                        {a.is_external_duty ? (
                          <span className="text-sm italic text-muted-foreground">
                            Gardă externă
                          </span>
                        ) : (
                          <div>
                            <p className="text-sm font-medium">
                              {a.client?.full_name ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.client?.email ?? ""}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.duration_minutes} min
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <LocIcon className="h-3.5 w-3.5" />
                          {locationLabel[location]}
                        </span>
                        {a.meet_link && (
                          <a
                            href={a.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Deschide Meet
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[a.status as keyof typeof statusVariant]}>
                          {statusLabel[a.status as keyof typeof statusLabel] ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/appointments/${a.id}`}>
                            Deschide
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

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
