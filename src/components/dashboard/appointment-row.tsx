import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Building2, Home, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AppointmentStatus,
  DashboardAppointment,
  LocationKind,
} from "@/lib/mock/dashboard";

const statusVariant: Record<AppointmentStatus, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PROGRAMAT: "secondary",
  CONFIRMAT: "success",
  FINALIZAT: "default",
  ANULAT: "destructive",
  LIPSA: "warning",
};

const statusLabel: Record<AppointmentStatus, string> = {
  PROGRAMAT: "Programat",
  CONFIRMAT: "Confirmat",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
  LIPSA: "Lipsă",
};

const locationIcon: Record<LocationKind, React.ComponentType<{ className?: string }>> = {
  PRIVAT: Home,
  POLICLINIC: Building2,
  ONLINE: Video,
};

const locationLabel: Record<LocationKind, string> = {
  PRIVAT: "Cabinet privat",
  POLICLINIC: "Policlinică",
  ONLINE: "Online",
};

interface AppointmentRowProps {
  appointment: DashboardAppointment;
  showDate?: boolean;
}

export function AppointmentRow({ appointment, showDate = false }: AppointmentRowProps) {
  const LocationIcon = locationIcon[appointment.location];
  const isDuty = appointment.isExternalDuty;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40",
        isDuty && "border-dashed bg-muted/40",
      )}
    >
      <div className="w-16 shrink-0">
        <p className="text-sm font-semibold tabular-nums">
          {format(appointment.startsAt, "HH:mm")}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {appointment.durationMinutes} min
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {isDuty ? appointment.clientName : `${appointment.clientName} · ${appointment.clientInitials}`}
          </p>
          {isDuty ? (
            <Badge variant="outline" className="text-[10px]">
              Gardă externă
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <LocationIcon className="h-3 w-3" />
            {locationLabel[appointment.location]}
          </span>
          {showDate ? (
            <span>
              {format(appointment.startsAt, "EEE, d MMM", { locale: ro })}
            </span>
          ) : null}
          {appointment.meetLink ? (
            <a
              href={appointment.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Link Meet
            </a>
          ) : null}
        </div>
      </div>

      <Badge variant={statusVariant[appointment.status]} className="shrink-0">
        {statusLabel[appointment.status]}
      </Badge>
    </div>
  );
}
