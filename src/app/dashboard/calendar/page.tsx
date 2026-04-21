export const runtime = "edge";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listAppointments } from "@/lib/appointments/queries";
import { WeekView } from "@/components/calendar/week-view";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const configured = isSupabaseConfigured();

  const appointments = await listAppointments({});

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            {appointments.length} programări · vizualizare săptămânală
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

      <WeekView appointments={appointments} initialDate={date} />
    </div>
  );
}
