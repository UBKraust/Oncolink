import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";
import { EmptyState, SectionCard } from "@/components/app/page-shell";

export function AppointmentsToday({ appointments }: { appointments: DashboardAppointment[] }) {
  return (
    <SectionCard
      title="Programul de azi"
      description={
        appointments.length
          ? `${appointments.length} programări · include gărzi externe`
          : "Nicio programare astăzi"
      }
      icon={CalendarDays}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="text-[11px] font-medium text-muted-foreground">
            {appointments.length
              ? `${appointments.length} programări · include gărzi externe`
              : "Nicio programare astăzi"}
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" /> Adaugă
        </Link>
      </div>
      {appointments.length > 0 ? (
        <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(248,250,252,0.45))] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Confirmate
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                {appointments.filter((appointment) => appointment.status === "CONFIRMAT").length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Programări deja validate</p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-100">
                Neconfirmate
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                {appointments.filter((appointment) => appointment.status === "PROGRAMAT").length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Cer follow-up înainte de sesiune</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Gărzi externe
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                {appointments.filter((appointment) => appointment.isExternalDuty).length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Intrări care includ context extern</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2 p-4">
        {appointments.length === 0 ? (
          <EmptyState
            title="Agendă liberă"
            description="Nu există programări pentru astăzi. Poți adăuga rapid una nouă din această secțiune."
            icon={CalendarDays}
            action={{ label: "Adaugă programare", href: "/dashboard/appointments/new" }}
          />
        ) : (
          appointments.map((a) => <AppointmentRow key={a.id} appointment={a} />)
        )}
      </div>
    </SectionCard>
  );
}
