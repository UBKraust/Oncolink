"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileWarning,
  ListChecks,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionCard } from "@/components/app/page-shell";
import type { DashboardStats } from "@/lib/dashboard/queries";
import type { DashboardAppointment } from "@/lib/mock/dashboard";

const statusLabel = {
  PROGRAMAT: "Programat",
  CONFIRMAT: "Confirmat",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  LIPSA: "Lipsă",
} as const;

const statusVariant = {
  PROGRAMAT: "secondary",
  CONFIRMAT: "success",
  FINALIZAT: "info",
  ANULAT: "destructive",
  LIPSA: "warning",
} as const;

const locationLabel = {
  PRIVAT: "Cabinet privat",
  CABINET: "Cabinet",
  POLICLINIC: "Policlinică",
  CLINICA: "Clinică",
  ONLINE: "Online",
} as const;

interface TodayCommandCenterProps {
  appointmentsToday: DashboardAppointment[];
  stats: DashboardStats;
  incompleteFiles: number;
  actionsToResolve: number;
}

export function TodayCommandCenter({
  appointmentsToday,
  stats,
  incompleteFiles,
  actionsToResolve,
}: TodayCommandCenterProps) {
  return (
    <SectionCard
      title="Ce Urmează Acum"
      description="Focusul imediat al zilei: următoarea ședință și blocajele care cer atenție."
      icon={CalendarDays}
    >
      <TodayClinicalView
        appointmentsToday={appointmentsToday}
        stats={stats}
        incompleteFiles={incompleteFiles}
        actionsToResolve={actionsToResolve}
      />
    </SectionCard>
  );
}

function TodayClinicalView({
  appointmentsToday,
  stats,
  incompleteFiles,
  actionsToResolve,
}: {
  appointmentsToday: DashboardAppointment[];
  stats: DashboardStats;
  incompleteFiles: number;
  actionsToResolve: number;
}) {
  const now = new Date();
  const nextAppointment =
    appointmentsToday.find((appointment) => appointment.startsAt >= now) ??
    appointmentsToday[0] ??
    null;
  const confirmedCount = appointmentsToday.filter(
    (appointment) => appointment.status === "CONFIRMAT",
  ).length;
  const unconfirmedCount = appointmentsToday.filter(
    (appointment) => appointment.status === "PROGRAMAT",
  ).length;
  const completedCount = appointmentsToday.filter(
    (appointment) => appointment.status === "FINALIZAT",
  ).length;

  if (appointmentsToday.length === 0) {
    return (
      <EmptyState
        title="Nu ai ședințe programate astăzi."
        description="Ziua este liberă în acest moment. Poți adăuga rapid o programare nouă sau poți folosi timpul pentru documente și follow-up."
        icon={CalendarDays}
        action={{ label: "Adaugă programare", href: "/dashboard/appointments/new" }}
      />
    );
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-[1.75rem] border border-border/60 bg-muted/20 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Următoarea ședință
            </p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">
              {nextAppointment?.clientName ?? "Fără programare"}
            </h3>
            {nextAppointment ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {nextAppointment.startsAt.toLocaleTimeString("ro-RO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {locationLabel[nextAppointment.location]} ·{" "}
                {nextAppointment.durationMinutes} min
              </p>
            ) : null}
          </div>
          {nextAppointment ? (
            <Badge variant={statusVariant[nextAppointment.status]}>
              {statusLabel[nextAppointment.status]}
            </Badge>
          ) : null}
        </div>

        {nextAppointment ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={`/dashboard/appointments/${nextAppointment.id}`}>
                Deschide programarea
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/appointments">Vezi toate programările</Link>
            </Button>
            {nextAppointment.meetLink ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={nextAppointment.meetLink}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Intră în sesiune
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            Ritmul zilei
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
            {stats.appointmentsToday}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ședințe programate astăzi
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Confirmări
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {confirmedCount}
            <span className="ml-2 text-base text-muted-foreground">
              confirmate
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {unconfirmedCount} neconfirmate, {completedCount} finalizate
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            <FileWarning className="h-3.5 w-3.5 text-amber-600" />
            Blocaje active
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {actionsToResolve}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {incompleteFiles} dosare incomplete și semnale care cer triere
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link href="/dashboard/clients">
              <ListChecks className="h-3.5 w-3.5" />
              Deschide registrul
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
