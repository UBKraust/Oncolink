import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Building2, CalendarPlus, ExternalLink, Home, Video } from "lucide-react";

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
import {
  APPOINTMENT_STATUSES,
  deriveLocation,
  locationLabel,
  statusLabel,
  statusVariant,
} from "@/lib/appointments/helpers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getInvoiceByAppointment } from "@/lib/invoices/queries";
import { getNoteByAppointment } from "@/lib/notes/queries";
import { SessionDrawer } from "@/components/appointments/SessionDrawer";
import { AppointmentsViewManager } from "@/components/appointments/AppointmentsViewManager";
import { cn } from "@/lib/utils";
import { DashboardPage, EmptyState, PageHeader, SectionCard, SetupBanner } from "@/components/app/page-shell";

const locationIcon = {
  PRIVAT: Home,
  POLICLINIC: Building2,
  ONLINE: Video,
  CABINET: Home,
  CLINICA: Building2,
} as const;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
    session?: string;
  }>;
}) {
  const { status, from, to, session } = await searchParams;
  const configured = isSupabaseConfigured();
  const baseParams = new URLSearchParams();
  if (from) baseParams.set("from", from);
  if (to) baseParams.set("to", to);

  const appointments = await listAppointments({ status, from, to });

  const counts = APPOINTMENT_STATUSES.reduce(
    (acc, s) => {
      acc[s] = appointments.filter((a) => a.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Fetch session drawer data when ?session= param is present
  let sessionAppointment = session
    ? appointments.find((a) => a.id === session) ?? null
    : null;

  // If not in current filtered list, fetch directly
  if (session && !sessionAppointment) {
    const { listAppointments: list } = await import(
      "@/lib/appointments/queries"
    );
    const all = await list({});
    sessionAppointment = all.find((a) => a.id === session) ?? null;
  }

  const [sessionInvoice, sessionNote] = sessionAppointment
    ? await Promise.all([
        getInvoiceByAppointment(sessionAppointment.id),
        getNoteByAppointment(sessionAppointment.id),
      ])
    : [null, null];

  // Build URL to close the drawer (preserves current filters)
  const closeParams = new URLSearchParams();
  if (status) closeParams.set("status", status);
  if (from) closeParams.set("from", from);
  if (to) closeParams.set("to", to);
  const closeUrl = `/dashboard/appointments${closeParams.size ? `?${closeParams}` : ""}`;

  return (
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Programări"
        description={`${appointments.length} intrări · ${counts["CONFIRMAT"] ?? 0} confirmate · ${counts["PROGRAMAT"] ?? 0} în așteptare`}
        action={
          <Button asChild>
            <Link href="/dashboard/appointments/new">
              <CalendarPlus className="h-4 w-4" />
              Programare nouă
            </Link>
          </Button>
        }
      />

      {!configured && (
        <SetupBanner description="Calendarul clinic va afișa doar date reale. Datele demo au fost eliminate din această secțiune." />
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterLink
          href={`/dashboard/appointments${baseParams.size ? `?${baseParams.toString()}` : ""}`}
          active={!status}
          label="Toate"
        />
        {APPOINTMENT_STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`/dashboard/appointments?${new URLSearchParams({
              ...Object.fromEntries(baseParams.entries()),
              status: s,
            }).toString()}`}
            active={status === s}
            label={`${statusLabel[s]} (${counts[s] ?? 0})`}
          />
        ))}
      </div>

      {/* View Manager (Calendar/List toggle) */}
      <AppointmentsViewManager appointments={appointments}>
        <SectionCard
          title="Lista programărilor"
          description="Deschide rapid o programare sau schimbă vizualizarea în calendar."
        >
          <CardContent className="p-0">
            {appointments.length === 0 ? (
              <EmptyState
                title="Nu există programări pentru selecția curentă"
                description="Ajustează filtrele sau creează prima programare pentru a începe planificarea clinică."
                action={{ label: "Creează o programare", href: "/dashboard/appointments/new" }}
                icon={CalendarPlus}
              />
            ) : (
              <div className="overflow-x-auto">
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
                    const isPastAppt =
                      new Date(a.appointment_date) < new Date();
                    const isActive = session === a.id;

                    // Build URL for opening this session in the drawer
                    const sessionParams = new URLSearchParams();
                    if (status) sessionParams.set("status", status);
                    if (from) sessionParams.set("from", from);
                    if (to) sessionParams.set("to", to);
                    sessionParams.set("session", a.id);
                    const sessionUrl = `/dashboard/appointments?${sessionParams}`;

                    return (
                      <TableRow
                        key={a.id}
                        className={cn(
                          isPastAppt && a.status === "PROGRAMAT" && "bg-amber-50/40 dark:bg-amber-950/10",
                          isActive && "bg-primary/5"
                        )}
                      >
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
                          <Badge
                            variant={
                              statusVariant[
                                a.status as keyof typeof statusVariant
                              ]
                            }
                          >
                            {statusLabel[
                              a.status as keyof typeof statusLabel
                            ] ?? a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Open drawer */}
                            <Button asChild variant="ghost" size="sm">
                              <Link href={sessionUrl}>Sesiune</Link>
                            </Button>
                            {/* Full detail page */}
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/dashboard/appointments/${a.id}`}>
                                <span className="sr-only">
                                  Deschide pagina programării pentru {a.client?.full_name ?? "programare"}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </SectionCard>
      </AppointmentsViewManager>


      {/* Session Drawer — rendered server-side with pre-fetched data */}
      {sessionAppointment && (
        <SessionDrawer
          appointment={sessionAppointment}
          invoice={sessionInvoice}
          hasNote={!!sessionNote}
          closeUrl={closeUrl}
        />
      )}
    </DashboardPage>
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
      aria-current={active ? "page" : undefined}
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
