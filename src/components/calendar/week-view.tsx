"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { ro } from "date-fns/locale";
import { Activity, Bell, CalendarDays, ChevronLeft, ChevronRight, FileText, MapPin, MoreVertical, Notebook, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppointmentWithClient } from "@/lib/appointments/queries";
import {
  deriveLocation,
  statusVariant,
  statusLabel,
  locationLabel,
} from "@/lib/appointments/helpers";

interface WeekViewProps {
  appointments: AppointmentWithClient[];
  initialDate?: string; // ISO — defaults to today
}

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT_PX = 64; // px per hour

const LOCATION_COLOR: Record<string, string> = {
  CABINET: "bg-blue-50/80 border-blue-200 text-blue-900 border-l-blue-600 shadow-sm backdrop-blur-[2px]",
  CLINICA: "bg-indigo-50/80 border-indigo-200 text-indigo-900 border-l-indigo-600 shadow-sm backdrop-blur-[2px]",
  PRIVAT: "bg-slate-50/80 border-slate-200 text-slate-900 border-l-slate-500 shadow-sm opacity-80",
  POLICLINIC: "bg-violet-50/80 border-violet-200 text-violet-900 border-l-violet-600 shadow-sm",
  ONLINE: "bg-emerald-50/80 border-emerald-200 text-emerald-900 border-l-emerald-600 shadow-sm backdrop-blur-[2px]",
};

export function WeekView({ appointments, initialDate }: WeekViewProps) {
  const [anchorDate, setAnchorDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date(),
  );
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithClient | null>(null);

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
                      <div
                        key={a.id}
                        className={cn(
                          "absolute inset-x-0.5 overflow-hidden rounded-lg border-l-[3px] px-2 py-1.5 text-[11px] leading-tight hover:opacity-95 transition-all cursor-pointer group hover:z-20",
                          colorClass,
                        )}
                        style={{
                          top: offsetPx + 1,
                          height: Math.max(heightPx - 2, 32),
                        }}
                        onClick={() => setSelectedAppt(a)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold truncate text-[12px]">
                            {format(start, "HH:mm")}{" "}
                            {isExternal ? "Gardă" : (a.client?.full_name ?? "—")}
                          </p>
                          {(a.personal_notes || a.location_tag) && (
                            <div className="flex gap-0.5 shrink-0">
                              {a.personal_notes && (
                                <Notebook className="h-3 w-3 text-current/60" />
                              )}
                              {a.location_tag && (
                                <span className="text-[9px] font-black opacity-60">#</span>
                              )}
                            </div>
                          )}
                        </div>
                        {heightPx > 45 && (
                          <div className="mt-1 flex flex-wrap gap-1 items-center opacity-80">
                            <span className="font-medium">
                              {a.duration_minutes} min
                            </span>
                            <span className="opacity-50">•</span>
                            <span className="capitalize">
                              {statusLabel[a.status as keyof typeof statusLabel] ?? a.status}
                            </span>
                          </div>
                        )}
                      </div>
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

      {/* Appointment Detail Modal/Popover */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] p-4" onClick={() => setSelectedAppt(null)}>
          <Card 
            className="w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-black tracking-tight">
                Detalii Programare
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAppt(null)}>
                <ChevronRight className="h-4 w-4 rotate-45" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold truncate">
                    {selectedAppt.client?.full_name ?? "Client Extern / Gardă"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedAppt.client?.email ?? "Fără email înregistrat"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <CalendarDays className="h-3 w-3" />
                    Data & Ora
                  </div>
                  <p className="text-sm font-semibold italic">
                    {format(new Date(selectedAppt.appointment_date), "d MMM, HH:mm", { locale: ro })}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <MapPin className="h-3 w-3" />
                    Locație
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-black uppercase">
                      {locationLabel[deriveLocation(selectedAppt)]}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedAppt.personal_notes && (
                <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-900/60">
                    <Notebook className="h-3 w-3" />
                    Note Personale (Private)
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed italic">
                    "{selectedAppt.personal_notes}"
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" asChild>
                  <Link href={`/dashboard/appointments/${selectedAppt.id}`}>
                    <Activity className="h-3.5 w-3.5" />
                    Vezi Fișă
                  </Link>
                </Button>
                <Button size="sm" className="flex-1 text-xs gap-1.5" asChild>
                  <Link href={`/dashboard/appointments/${selectedAppt.id}/edit`}>
                    Editează
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
