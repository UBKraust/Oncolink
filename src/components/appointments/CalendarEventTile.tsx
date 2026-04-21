"use client";

import React from "react";
import { format, differenceInMinutes, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { AppointmentWithClient } from "@/lib/appointments/queries";
import { deriveLocation } from "@/lib/appointments/helpers";
import { Video, Home, Building2, MapPin } from "lucide-react";

interface CalendarEventTileProps {
  appointment: AppointmentWithClient;
  onClick: () => void;
  hourHeight: number;
}

const LOCATION_STYLES = {
  ONLINE: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  CABINET: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  CLINICA: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
  PRIVAT: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
  POLICLINIC: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
};

const LOCATION_ICONS = {
  ONLINE: Video,
  CABINET: Home,
  CLINICA: Building2,
  PRIVAT: MapPin,
  POLICLINIC: Building2,
};

export function CalendarEventTile({ appointment, onClick, hourHeight }: CalendarEventTileProps) {
  const date = new Date(appointment.appointment_date);
  const duration = appointment.duration_minutes || 50;
  
  // Calculate top position
  const minutesSinceStartOfDay = differenceInMinutes(date, startOfDay(date));
  const top = (minutesSinceStartOfDay * hourHeight) / 60;
  
  // Calculate height
  const height = (duration * hourHeight) / 60;
  
  const location = deriveLocation(appointment);
  const style = LOCATION_STYLES[location] || LOCATION_STYLES.PRIVAT;
  const Icon = LOCATION_ICONS[location] || LOCATION_ICONS.PRIVAT;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute left-1 right-1 z-10 flex flex-col p-2 rounded-xl border-t-4 shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md animate-in fade-in slide-in-from-top-2 duration-300",
        style
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
    >
      <div className="flex items-start justify-between gap-1 overflow-hidden">
        <p className="text-[11px] font-black leading-tight truncate">
          {appointment.client?.full_name || "Gardă externă"}
        </p>
        <Icon className="h-3 w-3 shrink-0 opacity-60" />
      </div>
      
      <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
        <span className="text-[9px] font-bold opacity-70 whitespace-nowrap">
          {format(date, "HH:mm")} - {format(new Date(date.getTime() + duration * 60000), "HH:mm")}
        </span>
      </div>
      
      {appointment.location_tag && (
        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60 truncate">
          {appointment.location_tag}
        </span>
      )}

      {appointment.status === "CONFIRMAT" && (
        <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
      )}
    </div>
  );
}
