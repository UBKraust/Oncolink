"use client";

import Link from "next/link";
import { endOfDay, format, startOfDay } from "date-fns";
import { ro } from "date-fns/locale";
import {
  AlertTriangle,
  Building2,
  CalendarCheck2,
  CalendarPlus,
  ExternalLink,
  FileText,
  Home,
  Receipt,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SessionDrawer } from "@/components/appointments/SessionDrawer";
import { WeeklyCalendar } from "@/components/appointments/WeeklyCalendar";
import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppointmentWithClient } from "@/lib/appointments/queries";
import {
  APPOINTMENT_STATUSES,
  deriveLocation,
  locationLabel,
  statusLabel,
  statusVariant,
} from "@/lib/appointments/helpers";
import { cn } from "@/lib/utils";

const locationIcon = {
  PRIVAT: Home,
  POLICLINIC: Building2,
  ONLINE: Video,
  CABINET: Home,
  CLINICA: Building2,
} as const;

type AppointmentQueue =
  | "all"
  | "today"
  | "to-confirm"
  | "needs-note"
  | "needs-invoice"
  | "overdue"
  | "online";

type AppointmentsView = "calendar" | "list";

const APPOINTMENT_QUEUES: AppointmentQueue[] = [
  "all",
  "today",
  "to-confirm",
  "needs-note",
  "needs-invoice",
  "overdue",
  "online",
];

const APPOINTMENT_QUEUE_LABELS: Record<AppointmentQueue, string> = {
  all: "Tot registrul",
  today: "Azi",
  "to-confirm": "De confirmat",
  "needs-note": "Note lipsă",
  "needs-invoice": "Facturi de emis",
  overdue: "Întârziate",
  online: "Online",
};

interface AppointmentsWorkspaceProps {
  initialAppointments: AppointmentWithClient[];
  initialStatus?: string;
  initialQueue?: string;
  initialView?: string;
  initialSessionId?: string;
}

export function AppointmentsWorkspace({
  initialAppointments,
  initialStatus,
  initialQueue,
  initialView,
  initialSessionId,
}: AppointmentsWorkspaceProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(initialStatus);
  const [queueFilter, setQueueFilter] = useState<AppointmentQueue>(
    isAppointmentQueue(initialQueue) ? initialQueue : "all",
  );
  const [view, setView] = useState<AppointmentsView>(
    initialView === "list" ? "list" : "calendar",
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );

  const counts = useMemo(
    () =>
      APPOINTMENT_STATUSES.reduce(
        (acc, status) => {
          acc[status] = appointments.filter((appointment) => appointment.status === status).length;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [appointments],
  );

  const workflowStats = useMemo(() => buildWorkflowStats(appointments), [appointments]);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesStatus = !statusFilter || appointment.status === statusFilter;
        const matchesQueue = matchesAppointmentQueue(appointment, queueFilter);
        return matchesStatus && matchesQueue;
      }),
    [appointments, queueFilter, statusFilter],
  );

  const selectedAppointment =
    appointments.find((appointment) => appointment.id === selectedSessionId) ?? null;
  const selectedInvoiceId = selectedAppointment?.invoices?.[0]?.id ?? null;
  const headerDescription =
    queueFilter === "all"
      ? `${appointments.length} intrări · ${counts["CONFIRMAT"] ?? 0} confirmate · ${counts["PROGRAMAT"] ?? 0} în așteptare`
      : `${filteredAppointments.length} programări în coada „${APPOINTMENT_QUEUE_LABELS[queueFilter]}” · ${workflowStats.todayTotal} programări astăzi`;

  function updateUrl(next: {
    status?: string;
    queue?: AppointmentQueue;
    view?: AppointmentsView;
    sessionId?: string | null;
  }) {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const nextStatus = next.status !== undefined ? next.status : statusFilter;
    const nextQueue = next.queue ?? queueFilter;
    const nextView = next.view ?? view;
    const nextSessionId =
      next.sessionId !== undefined ? next.sessionId : selectedSessionId;

    if (nextStatus) url.searchParams.set("status", nextStatus);
    else url.searchParams.delete("status");

    if (nextQueue !== "all") url.searchParams.set("queue", nextQueue);
    else url.searchParams.delete("queue");

    if (nextView === "list") url.searchParams.set("view", "list");
    else url.searchParams.delete("view");

    if (nextSessionId) url.searchParams.set("session", nextSessionId);
    else url.searchParams.delete("session");

    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function handleStatusFilter(nextStatus?: string) {
    setStatusFilter(nextStatus);
    updateUrl({ status: nextStatus });
  }

  function handleQueueFilter(nextQueue: AppointmentQueue) {
    setQueueFilter(nextQueue);
    updateUrl({ queue: nextQueue });
  }

  function handleViewChange(nextView: AppointmentsView) {
    setView(nextView);
    updateUrl({ view: nextView });
  }

  function openSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    updateUrl({ sessionId });
  }

  function closeSession() {
    setSelectedSessionId(null);
    updateUrl({ sessionId: null });
  }

  function handleAppointmentUpdate(payload: {
    id: string;
    patch: Partial<AppointmentWithClient>;
    autoInvoiceId?: string;
  }) {
    setAppointments((current) =>
      current.map((appointment) => {
        if (appointment.id !== payload.id) return appointment;

        const nextInvoices =
          payload.autoInvoiceId &&
          !(appointment.invoices ?? []).some((invoice) => invoice.id === payload.autoInvoiceId)
            ? [...(appointment.invoices ?? []), { id: payload.autoInvoiceId }]
            : appointment.invoices;

        return {
          ...appointment,
          ...payload.patch,
          invoices: nextInvoices,
        };
      }),
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/60 bg-card/95 p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <CalendarCheck2 className="h-3.5 w-3.5 text-primary" />
              Flux terapeut
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Programări gândite pentru ritmul terapeutului
              </h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Confirmări înainte de ședință, agenda zilei, documentare după ședință și facturare fără restanțe, toate din același workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <WorkflowCard
                active={queueFilter === "to-confirm"}
                label="Confirmări"
                value={workflowStats.toConfirm}
                helper="programări care cer follow-up"
                icon={CalendarCheck2}
                tone="default"
                onClick={() => handleQueueFilter("to-confirm")}
              />
              <WorkflowCard
                active={queueFilter === "needs-note"}
                label="Note lipsă"
                value={workflowStats.needsNote}
                helper="ședințe finalizate fără notă"
                icon={FileText}
                tone="warning"
                onClick={() => handleQueueFilter("needs-note")}
              />
              <WorkflowCard
                active={queueFilter === "needs-invoice"}
                label="Facturi"
                value={workflowStats.needsInvoice}
                helper="ședințe gata de facturare"
                icon={Receipt}
                tone="warning"
                onClick={() => handleQueueFilter("needs-invoice")}
              />
              <WorkflowCard
                active={queueFilter === "overdue"}
                label="Întârzieri"
                value={workflowStats.overdue}
                helper="programări rămase în urmă"
                icon={AlertTriangle}
                tone="danger"
                onClick={() => handleQueueFilter("overdue")}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <WorkflowSnapshotCard
              label="Agenda de azi"
              value={workflowStats.todayTotal}
              helper={`${workflowStats.todayConfirmed} confirmate · ${workflowStats.todayOnline} online`}
              tone="default"
            />
            <WorkflowSnapshotCard
              label="Documentare"
              value={workflowStats.needsNote}
              helper={`${workflowStats.finalizedToday} finalizate azi · ${workflowStats.needsInvoice} fără factură`}
              tone="warning"
            />
            <WorkflowSnapshotCard
              label="Context extern"
              value={workflowStats.externalDutyToday}
              helper="gărzi externe în programul zilei"
              tone="default"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={!statusFilter}
          label="Toate"
          onClick={() => handleStatusFilter(undefined)}
        />
        {APPOINTMENT_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={statusFilter === status}
            label={`${statusLabel[status]} (${counts[status] ?? 0})`}
            onClick={() => handleStatusFilter(status)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {APPOINTMENT_QUEUES.map((queue) => (
          <FilterChip
            key={queue}
            active={queueFilter === queue}
            label={`${APPOINTMENT_QUEUE_LABELS[queue]} (${getQueueCount(queue, workflowStats, appointments.length)})`}
            onClick={() => handleQueueFilter(queue)}
          />
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <div className="inline-flex items-center rounded-2xl border border-border/60 bg-muted/40 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleViewChange("calendar")}
              aria-pressed={view === "calendar"}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tight transition-all",
                view === "calendar" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              aria-pressed={view === "list"}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tight transition-all",
                view === "list" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Listă
            </button>
          </div>
        </div>

        <div className="animate-in fade-in duration-300">
          {view === "calendar" ? (
            <WeeklyCalendar
              appointments={filteredAppointments}
              onSelectEvent={openSession}
              onNewEvent={(date) => {
                window.location.href = `/dashboard/appointments/new?date=${date.toISOString()}`;
              }}
            />
          ) : (
            <SectionCard
              title="Registrul programărilor"
              description={
                queueFilter === "all"
                  ? headerDescription
                  : `Filtru operațional activ: ${APPOINTMENT_QUEUE_LABELS[queueFilter]}.`
              }
            >
              <CardContent className="p-0">
                {filteredAppointments.length === 0 ? (
                  <EmptyState
                    title={
                      queueFilter === "all"
                        ? "Nu există programări pentru selecția curentă"
                        : `Nu există programări în coada „${APPOINTMENT_QUEUE_LABELS[queueFilter]}”`
                    }
                    description={
                      queueFilter === "all"
                        ? "Ajustează filtrele sau creează prima programare pentru a începe planificarea clinică."
                        : "Ajustează filtrele sau revino la registrul complet pentru a vedea restul agendei."
                    }
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
                        {filteredAppointments.map((appointment) => {
                          const location = deriveLocation(appointment);
                          const LocIcon = locationIcon[location];
                          const isPastAppt = new Date(appointment.appointment_date) < new Date();
                          const isActive = selectedSessionId === appointment.id;

                          return (
                            <TableRow
                              key={appointment.id}
                              className={cn(
                                isPastAppt && appointment.status === "PROGRAMAT" && "bg-amber-50/40 dark:bg-amber-950/10",
                                isActive && "bg-primary/5",
                              )}
                            >
                              <TableCell>
                                <p className="text-sm font-semibold tabular-nums">
                                  {format(new Date(appointment.appointment_date), "HH:mm")}
                                </p>
                                <p className="text-xs capitalize text-muted-foreground">
                                  {format(new Date(appointment.appointment_date), "EEE, d MMM yyyy", {
                                    locale: ro,
                                  })}
                                </p>
                              </TableCell>
                              <TableCell>
                                {appointment.is_external_duty ? (
                                  <span className="text-sm italic text-muted-foreground">
                                    Gardă externă
                                  </span>
                                ) : (
                                  <div>
                                    <p className="text-sm font-medium">
                                      {appointment.client?.full_name ?? "—"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {appointment.client?.email ?? ""}
                                    </p>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {appointment.duration_minutes} min
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <LocIcon className="h-3.5 w-3.5" />
                                  {locationLabel[location]}
                                </span>
                                {appointment.meet_link ? (
                                  <a
                                    href={appointment.meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline"
                                  >
                                    Deschide Meet
                                  </a>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    statusVariant[
                                      appointment.status as keyof typeof statusVariant
                                    ]
                                  }
                                >
                                  {statusLabel[
                                    appointment.status as keyof typeof statusLabel
                                  ] ?? appointment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSession(appointment.id)}
                                  >
                                    Sesiune
                                  </Button>
                                  <Button asChild variant="ghost" size="sm">
                                    <Link href={`/dashboard/appointments/${appointment.id}/edit`}>
                                      <span className="sr-only">
                                        Editează programarea pentru {appointment.client?.full_name ?? "programare"}
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
          )}
        </div>
      </div>

      {selectedAppointment ? (
        <SessionDrawer
          key={selectedAppointment.id}
          appointment={selectedAppointment}
          invoice={
            selectedInvoiceId
              ? {
                  id: selectedInvoiceId,
                  status: null,
                  amount: null,
                  smartbill_series: null,
                  smartbill_number: null,
                }
              : null
          }
          hasNote={Boolean(selectedAppointment.notes?.length)}
          closeUrl="/dashboard/appointments"
          onClose={closeSession}
          onAppointmentUpdate={handleAppointmentUpdate}
        />
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/40 hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function isAppointmentQueue(value: string | undefined): value is AppointmentQueue {
  return APPOINTMENT_QUEUES.includes((value as AppointmentQueue) ?? "all");
}

function matchesAppointmentQueue(
  appointment: AppointmentWithClient,
  queue: AppointmentQueue,
) {
  if (queue === "all") return true;

  const appointmentDate = new Date(appointment.appointment_date);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const isTodayAppointment = appointmentDate >= todayStart && appointmentDate <= todayEnd;
  const isPastAppointment = appointmentDate < new Date();
  const location = deriveLocation(appointment);

  switch (queue) {
    case "today":
      return isTodayAppointment;
    case "to-confirm":
      return appointment.status === "PROGRAMAT" && !isPastAppointment;
    case "needs-note":
      return appointment.status === "FINALIZAT" && !(appointment.notes?.length ?? 0);
    case "needs-invoice":
      return appointment.status === "FINALIZAT" && !(appointment.invoices?.length ?? 0);
    case "overdue":
      return appointment.status === "PROGRAMAT" && isPastAppointment;
    case "online":
      return location === "ONLINE";
    default:
      return true;
  }
}

function buildWorkflowStats(appointments: AppointmentWithClient[]) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const now = new Date();

  return appointments.reduce(
    (acc, appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      const isTodayAppointment = appointmentDate >= todayStart && appointmentDate <= todayEnd;
      const isPastAppointment = appointmentDate < now;
      const location = deriveLocation(appointment);
      const hasNote = Boolean(appointment.notes?.length);
      const hasInvoice = Boolean(appointment.invoices?.length);

      if (isTodayAppointment) {
        acc.todayTotal += 1;
        if (appointment.status === "CONFIRMAT") acc.todayConfirmed += 1;
        if (location === "ONLINE") acc.todayOnline += 1;
        if (appointment.is_external_duty) acc.externalDutyToday += 1;
        if (appointment.status === "FINALIZAT") acc.finalizedToday += 1;
      }

      if (appointment.status === "PROGRAMAT" && !isPastAppointment) acc.toConfirm += 1;
      if (appointment.status === "FINALIZAT" && !hasNote) acc.needsNote += 1;
      if (appointment.status === "FINALIZAT" && !hasInvoice) acc.needsInvoice += 1;
      if (appointment.status === "PROGRAMAT" && isPastAppointment) acc.overdue += 1;

      return acc;
    },
    {
      todayTotal: 0,
      todayConfirmed: 0,
      todayOnline: 0,
      externalDutyToday: 0,
      finalizedToday: 0,
      toConfirm: 0,
      needsNote: 0,
      needsInvoice: 0,
      overdue: 0,
    },
  );
}

function getQueueCount(
  queue: AppointmentQueue,
  stats: ReturnType<typeof buildWorkflowStats>,
  totalAppointments: number,
) {
  switch (queue) {
    case "all":
      return totalAppointments;
    case "today":
      return stats.todayTotal;
    case "to-confirm":
      return stats.toConfirm;
    case "needs-note":
      return stats.needsNote;
    case "needs-invoice":
      return stats.needsInvoice;
    case "overdue":
      return stats.overdue;
    case "online":
      return stats.todayOnline;
    default:
      return 0;
  }
}

function WorkflowCard({
  active,
  label,
  value,
  helper,
  icon: Icon,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  value: number;
  helper: string;
  icon: typeof CalendarCheck2;
  tone: "default" | "warning" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[1.5rem] border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
        active
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-border/60 bg-muted/20 hover:border-primary/20",
      )}
      aria-pressed={active}
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "default" && "text-primary",
            tone === "warning" && "text-amber-600",
            tone === "danger" && "text-rose-600",
          )}
        />
        {label}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>
    </button>
  );
}

function WorkflowSnapshotCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-4 shadow-sm",
        tone === "warning"
          ? "border-amber-200 bg-amber-50/75 dark:border-amber-900 dark:bg-amber-950/20"
          : "border-border/60 bg-card/90",
      )}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>
    </div>
  );
}
