"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, startOfWeek, addDays, startOfDay, addMinutes, differenceInMinutes, isSameDay, setHours, setMinutes } from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentWithClient } from "@/lib/appointments/queries";
import { Button } from "@/components/ui/button";
import { CalendarEventTile } from "./CalendarEventTile";

interface WeeklyCalendarProps {
  appointments: AppointmentWithClient[];
  onSelectEvent: (id: string) => void;
  onNewEvent: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80; // pixels per hour

export function WeeklyCalendar({ appointments, onSelectEvent, onNewEvent }: WeeklyCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update "now" indicator every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to 08:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT - 100;
    }
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const navigateWeek = (direction: number) => {
    setCurrentWeekStart((prev) => addDays(prev, direction * 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getDayEvents = (day: Date) => {
    return appointments.filter((a) => isSameDay(new Date(a.appointment_date), day));
  };

  const handleSlotClick = (day: Date, hour: number) => {
    const date = setHours(setMinutes(startOfDay(day), 0), hour);
    onNewEvent(date);
  };

  return (
    <div className="flex flex-col h-[800px] bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {format(currentWeekStart, "MMMM yyyy", { locale: ro })}
          </h2>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[10px] font-black uppercase" onClick={goToToday}>
              Astăzi
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button onClick={() => onNewEvent(new Date())} className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Programare Nouă
        </Button>
      </div>

      {/* ── Calendar Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header (Days) */}
        <div className="flex border-b bg-slate-50/30">
          <div className="w-16 shrink-0 border-r" /> {/* Hour label gutter */}
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className="flex-1 py-4 text-center border-r last:border-r-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {format(day, "EEE", { locale: ro })}
                </p>
                <div className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black transition-all",
                  isToday ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-900"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="flex min-h-[1920px]"> {/* 24 * 80px */}
            {/* Hour Labels */}
            <div className="w-16 shrink-0 border-r bg-slate-50/20">
              {HOURS.map((h) => (
                <div key={h} className="h-20 pr-2 pt-1 text-right">
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                    {h.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            <div className="flex-1 flex relative">
              {days.map((day) => (
                <div key={`col-${day.toISOString()}`} className="flex-1 border-r last:border-r-0 relative group">
                  {/* Grid Lines */}
                  {HOURS.map((h) => (
                    <div 
                      key={`grid-${h}`} 
                      className="h-20 border-b last:border-b-0 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => handleSlotClick(day, h)}
                    />
                  ))}

                  {/* Events */}
                  {getDayEvents(day).map((appt) => (
                    <CalendarEventTile 
                      key={appt.id} 
                      appointment={appt} 
                      onClick={() => onSelectEvent(appt.id)}
                      hourHeight={HOUR_HEIGHT}
                    />
                  ))}

                  {/* Now Indicator (Only for today's column) */}
                  {isSameDay(day, now) && (
                    <div 
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${(now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60)}px` }}
                    >
                      <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-rose-500 shadow-sm" />
                      <div className="h-0.5 bg-rose-500 w-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
