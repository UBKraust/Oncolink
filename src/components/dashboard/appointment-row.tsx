import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Building2, Home, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, DashboardAppointment, LocationKind } from "@/lib/mock/dashboard";

const statusVariant: Record<AppointmentStatus, "secondary" | "success" | "info" | "destructive" | "warning"> = {
  PROGRAMAT:   "secondary",
  CONFIRMAT:   "success",
  FINALIZAT:   "info",
  ANULAT:      "destructive",
  LIPSA:       "warning",
};

const statusLabel: Record<AppointmentStatus, string> = {
  PROGRAMAT:  "Programat",
  CONFIRMAT:  "Confirmat",
  FINALIZAT:  "Finalizat",
  ANULAT:     "Anulat",
  LIPSA:      "Lipsă",
};

const locationIcon: Record<LocationKind, React.ComponentType<{ className?: string }>> = {
  PRIVAT:    Home,
  CABINET:   Home,
  POLICLINIC: Building2,
  CLINICA:   Building2,
  ONLINE:    Video,
};

const locationLabel: Record<LocationKind, string> = {
  PRIVAT:    "Cabinet privat",
  CABINET:   "Cabinet",
  POLICLINIC: "Policlinică",
  CLINICA:   "Clinică",
  ONLINE:    "Online",
};

interface AppointmentRowProps {
  appointment: DashboardAppointment;
  showDate?: boolean;
}

export function AppointmentRow({ appointment, showDate = false }: AppointmentRowProps) {
  const LocationIcon = locationIcon[appointment.location] ?? Home;
  const isDuty = appointment.isExternalDuty;

  return (
    <div className={cn(
      "flex items-center gap-4 rounded-2xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/30",
      isDuty ? "border-dashed bg-muted/30" : "bg-card",
    )}>
      {/* Time block */}
      <div className="w-14 shrink-0 text-center">
        <p className="text-sm font-black tabular-nums text-foreground">
          {format(appointment.startsAt, "HH:mm")}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground">
          {appointment.durationMinutes} min
        </p>
      </div>

      {/* Name + location */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="truncate text-sm font-bold text-foreground">
            {isDuty ? appointment.clientName : `${appointment.clientName} · ${appointment.clientInitials}`}
          </p>
          {isDuty && (
            <Badge variant="outline" className="text-[10px] font-bold">
              Gardă externă
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] font-medium text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <LocationIcon className="h-3 w-3" />
            {locationLabel[appointment.location]}
          </span>
          {showDate && (
            <span>{format(appointment.startsAt, "EEE, d MMM", { locale: ro })}</span>
          )}
          {appointment.meetLink && (
            <a
              href={appointment.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              Link Meet
            </a>
          )}
        </div>
      </div>

      {/* Status badge */}
      <Badge variant={statusVariant[appointment.status]} className="shrink-0 rounded-xl px-2.5 py-1 text-[10px] tracking-wide">
        {statusLabel[appointment.status]}
      </Badge>
    </div>
  );
}
