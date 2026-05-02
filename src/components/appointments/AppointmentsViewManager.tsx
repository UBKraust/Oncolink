"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyCalendar } from "./WeeklyCalendar";
import type { AppointmentWithClient } from "@/lib/appointments/queries";

interface AppointmentsViewManagerProps {
  appointments: AppointmentWithClient[];
  children: React.ReactNode; // This will be the table view
}

export function AppointmentsViewManager({ appointments, children }: AppointmentsViewManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const handleSelectEvent = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("session", id);
    router.push(`/dashboard/appointments?${params.toString()}`);
  };

  const handleNewEvent = (date: Date) => {
    router.push(`/dashboard/appointments/new?date=${date.toISOString()}`);
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center rounded-2xl border border-border/60 bg-muted/40 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setView("calendar")}
            aria-pressed={view === "calendar"}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all",
              view === "calendar" 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" /> Calendar
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all",
              view === "list" 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" /> Listă
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="animate-in fade-in duration-500">
        {view === "calendar" ? (
          <WeeklyCalendar 
            appointments={appointments} 
            onSelectEvent={handleSelectEvent}
            onNewEvent={handleNewEvent}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
