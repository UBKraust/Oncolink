import Link from "next/link";
import { CalendarRange, ArrowRight } from "lucide-react";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";
import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";

export function UpcomingAppointments({ appointments }: { appointments: DashboardAppointment[] }) {
  return (
    <SectionCard
      title="Săptămâna următoare"
      description="Următoarele programări confirmate."
      icon={CalendarRange}
    >
      {appointments.length > 0 ? (
        <div className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(248,250,252,0.45))] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Programări viitoare
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{appointments.length}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Intrări deja confirmate pentru perioada apropiată</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/60 bg-card/90 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Primul slot
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
                {appointments[0]?.startsAt.toLocaleTimeString("ro-RO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Următoarea sesiune deja programată</p>
            </div>
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-4 shadow-sm dark:border-sky-900 dark:bg-sky-950/20">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-800 dark:text-sky-100">
                Acțiune recomandată
              </p>
              <p className="mt-3 text-lg font-black tracking-tight text-foreground">
                Verifică ritmul și pregătește follow-up-ul
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Agenda apropiată rămâne ușor de scanat dintr-un singur loc</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2 border-t border-border/60 p-4">
        {appointments.length === 0 ? (
          <EmptyState
            title="Nicio programare în vedere"
            description="După confirmarea următoarelor sesiuni, ele vor apărea aici în ordinea apropiată."
            icon={CalendarRange}
          />
        ) : (
          <>
            {appointments.map((a) => <AppointmentRow key={a.id} appointment={a} showDate showClinicalContext={false} />)}
            <Button asChild variant="outline" className="mt-2 w-full rounded-[1.5rem]">
              <Link href="/dashboard/appointments">
                Vezi agenda completă
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
