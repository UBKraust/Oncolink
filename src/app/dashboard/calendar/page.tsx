import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listAppointments } from "@/lib/appointments/queries";
import { WeekView } from "@/components/calendar/week-view";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardPage, EmptyState, PageHeader, SetupBanner } from "@/components/app/page-shell";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const configured = isSupabaseConfigured();

  const appointments = await listAppointments({});

  return (
    <DashboardPage>
      <PageHeader
        title="Calendar"
        description={`${appointments.length} programări · vizualizare săptămânală`}
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
        <SetupBanner description="Calendarul afișează acum doar programări reale. Datele demo au fost eliminate din această vizualizare." />
      )}

      {appointments.length === 0 ? (
        <div className="rounded-[2rem] border border-border/60 bg-card shadow-sm">
          <EmptyState
            title="Nu ai încă programări în calendar"
            description="Creează prima programare pentru a începe planificarea săptămânală."
            action={{ label: "Adaugă prima programare", href: "/dashboard/appointments/new" }}
            icon={CalendarPlus}
          />
        </div>
      ) : (
      <WeekView appointments={appointments} initialDate={date} />
      )}
    </DashboardPage>
  );
}
