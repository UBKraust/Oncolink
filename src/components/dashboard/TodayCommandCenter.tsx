"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionCard } from "@/components/app/page-shell";
import type {
  DashboardStats,
  TodayFinanceSnapshot,
} from "@/lib/dashboard/queries";
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

const financeTone = {
  default: "outline",
  warning: "warning",
  danger: "destructive",
} as const;

interface TodayCommandCenterProps {
  appointmentsToday: DashboardAppointment[];
  stats: DashboardStats;
  finance: TodayFinanceSnapshot;
}

type CommandTab = "clinic" | "financial";

export function TodayCommandCenter({
  appointmentsToday,
  stats,
  finance,
}: TodayCommandCenterProps) {
  const [tab, setTab] = useState<CommandTab>("clinic");

  return (
    <SectionCard
      title="Panoul Zilei"
      description="Un rezumat clinic și operațional pentru începutul zilei."
      icon={CalendarDays}
    >
      <div className="border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="inline-flex rounded-2xl border border-border/60 bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setTab("clinic")}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition-colors ${
              tab === "clinic"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Clinic
          </button>
          <button
            type="button"
            onClick={() => setTab("financial")}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition-colors ${
              tab === "financial"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Financiar
          </button>
        </div>
      </div>

      {tab === "clinic" ? (
        <TodayClinicalView appointmentsToday={appointmentsToday} stats={stats} />
      ) : (
        <TodayFinancialView finance={finance} />
      )}
    </SectionCard>
  );
}

function TodayClinicalView({
  appointmentsToday,
  stats,
}: {
  appointmentsToday: DashboardAppointment[];
  stats: DashboardStats;
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
              <Link href="/dashboard/appointments">Vezi programările</Link>
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
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Acțiune rapidă
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">
            Păstrează focusul pe ședințe, confirmări și dosarele care au rămas incomplete.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link href="/dashboard/appointments/new">
              <Plus className="h-3.5 w-3.5" />
              Adaugă programare
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function TodayFinancialView({
  finance,
}: {
  finance: TodayFinanceSnapshot;
}) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-[1.75rem] border border-border/60 bg-muted/20 p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          Financiar de azi
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Restante
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
              {finance.outstandingCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {finance.outstandingTotal.toFixed(2)} RON de recuperat
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Receipt className="h-3.5 w-3.5 text-amber-600" />
              De emis
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
              {finance.invoicesToIssueCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ședințe finalizate fără factură
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5 text-sky-600" />
              De urmărit
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
              {finance.invoicesToFollowUpCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              facturi emise recent, încă deschise
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/invoices">Vezi facturile</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/invoices/new">Factură nouă</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-border/60 bg-card p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          Notificări plăți & facturi
        </p>

        {finance.notifications.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Nu există notificări financiare urgente."
              description="Nu ai plăți restante sau facturi care cer urmărire în acest moment."
              icon={Wallet}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {finance.notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={financeTone[notification.tone]}>Notificare</Badge>
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.description}
                </p>
                <Button asChild variant="ghost" size="sm" className="mt-3 h-auto px-0 text-primary">
                  <Link href={notification.href}>{notification.ctaLabel}</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
