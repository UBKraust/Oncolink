import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listAppointments } from "@/lib/appointments/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardPage, PageHeader, SetupBanner } from "@/components/app/page-shell";
import { AppointmentsWorkspace } from "@/components/appointments/AppointmentsWorkspace";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    queue?: string;
    from?: string;
    to?: string;
    session?: string;
    view?: string;
  }>;
}) {
  const { status, queue, from, to, session, view } = await searchParams;
  const configured = isSupabaseConfigured();
  let appointments = [];
  let loadError: string | null = null;

  try {
    appointments = await listAppointments({ status, from, to });
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Nu am putut încărca programările din acest moment.";
  }

  return (
    <DashboardPage className="max-w-6xl">
      <PageHeader
        title="Programări"
        description="Spațiu operațional pentru confirmări, agenda zilei, documentare și facturare."
        action={
          <Button asChild>
            <Link href="/dashboard/appointments/new">
              <CalendarPlus className="h-4 w-4" />
              Programare nouă
            </Link>
          </Button>
        }
      />

      {!configured ? (
        <SetupBanner description="Calendarul clinic va afișa doar date reale. Datele demo au fost eliminate din această secțiune." />
      ) : null}

      {configured && loadError ? (
        <SetupBanner description={`Programările nu au putut fi încărcate acum. Poți reîncerca în câteva secunde. Detaliu: ${loadError}`} />
      ) : null}

      <AppointmentsWorkspace
        initialAppointments={appointments}
        initialStatus={status}
        initialQueue={queue}
        initialView={view}
        initialSessionId={session}
      />
    </DashboardPage>
  );
}
