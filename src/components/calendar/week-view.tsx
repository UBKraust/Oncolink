"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { format, addDays, startOfWeek, isToday } from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentWithClient } from "@/lib/appointments/queries";
import { deriveLocation, statusLabel } from "@/lib/appointments/helpers";

interface WeekViewProps {
  appointments: AppointmentWithClient[];
  initialDate?: string; // ISO — defaults to today
}

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT_PX = 64; // px per hour

const LOCATION_COLOR: Record<string, string> = {
  PRIVAT: "bg-blue-100 border-blue-400 text-blue-900 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-100",
  POLICLINIC: "bg-violet-100 border-violet-400 text-violet-900 dark:bg-violet-950 dark:border-violet-700 dark:text-violet-100",
  ONLINE: "bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100",
};

export function WeekView({ appointments, initialDate }: WeekViewProps) {
  const [anchorDate, setAnchorDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date(),
  );

  const weekStart = useMemo(
    () => startOfWeek(anchorDate, { weekStartsOn: 1 }),
    [anchorDate],
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const go = useCallback(
    (delta: number) => setAnchorDate((d) => addDays(d, delta * 7)),
    [],
  );

  const apptsByDay = useMemo(() => {
    const map = new Map<string, AppointmentWithClient[]>();
    for (const a of appointments) {
      const key = format(new Date(a.appointment_date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [appointments]);

  const hours = Array.from(
    { length: TOTAL_HOURS + 1 },
    (_, i) => HOUR_START + i,
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setAnchorDate(new Date())}>
          Azi
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => go(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium">
            {format(weekStart, "d MMM", { locale: ro })} –{" "}
            {format(addDays(weekStart, 6), "d MMM yyyy", { locale: ro })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => go(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <Dot className="bg-blue-400" label="Cabinet" />
          <Dot className="bg-violet-400" label="Policlinică" />
          <Dot className="bg-emerald-400" label="Online" />
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-auto rounded-lg border bg-card">
        <div className="flex min-w-[700px]">
          {/* Time gutter */}
          <div className="w-14 shrink-0 border-r">
            {/* Header spacer */}
            <div className="h-10 border-b" />
            {hours.map((h) => (
              <div
                key={h}
                className="relative border-b text-right pr-2"
                style={{ height: SLOT_HEIGHT_PX }}
              >
                <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground tabular-nums">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayAppts = apptsByDay.get(key) ?? [];
            const today = isToday(day);

            return (
              <div key={key} className="flex-1 border-r last:border-r-0">
                {/* Day header */}
                <div
                  className={cn(
                    "flex h-10 items-center justify-center gap-1 border-b text-xs font-medium",
                    today && "bg-primary/5",
                  )}
                >
                  <span className="capitalize text-muted-foreground">
                    {format(day, "EEE", { locale: ro })}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold",
                      today
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Hour cells + appointments */}
                <div
                  className="relative"
                  style={{ height: SLOT_HEIGHT_PX * TOTAL_HOURS }}
                >
                  {/* Hour grid lines */}
                  {hours.slice(0, TOTAL_HOURS).map((h) => (
                    <div
                      key={h}
                      className="border-b"
                      style={{ height: SLOT_HEIGHT_PX }}
                    />
                  ))}

                  {/* Appointment blocks */}
                  {dayAppts.map((a) => {
                    const start = new Date(a.appointment_date);
                    const startHour = start.getHours() + start.getMinutes() / 60;
                    const offsetPx = (startHour - HOUR_START) * SLOT_HEIGHT_PX;
                    const heightPx = (a.duration_minutes / 60) * SLOT_HEIGHT_PX;
                    const loc = deriveLocation(a);
                    const colorClass = LOCATION_COLOR[loc];
                    const isExternal = a.is_external_duty;

                    if (offsetPx < 0 || offsetPx >= SLOT_HEIGHT_PX * TOTAL_HOURS)
                      return null;

                    return (
                      <Link
                        key={a.id}
                        href={`/dashboard/appointments/${a.id}`}
                        className={cn(
                          "absolute inset-x-0.5 overflow-hidden rounded border-l-2 px-1 py-0.5 text-[11px] leading-tight hover:opacity-90 transition-opacity",
                          colorClass,
                        )}
                        style={{
                          top: offsetPx + 1,
                          height: Math.max(heightPx - 2, 20),
                        }}
                        title={
                          isExternal
                            ? `Gardă externă · ${a.duration_minutes} min`
                            : `${a.client?.full_name ?? "—"} · ${a.duration_minutes} min`
                        }
                      >
                        <p className="font-semibold truncate">
                          {format(start, "HH:mm")}{" "}
                          {isExternal
                            ? "Gardă"
                            : (a.client?.full_name ?? "—")}
                        </p>
                        {heightPx > 36 && (
                          <p className="truncate opacity-70">
                            {a.duration_minutes} min ·{" "}
                            {statusLabel[a.status as keyof typeof statusLabel] ?? a.status}
                          </p>
                        )}
                      </Link>
                    );
                  })}

                  {/* Current time indicator */}
                  {today && <CurrentTimeBar />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeBar() {
  const now = new Date();
  const minutes = (now.getHours() - HOUR_START) * 60 + now.getMinutes();
  if (minutes < 0 || minutes > TOTAL_HOURS * 60) return null;
  const top = (minutes / 60) * SLOT_HEIGHT_PX;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500" />
      <div className="h-px flex-1 bg-red-400" />
    </div>
  );
}

function Dot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("inline-block h-2.5 w-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
