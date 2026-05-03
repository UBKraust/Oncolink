import { format } from "date-fns";
import { ro } from "date-fns/locale";
import Link from "next/link";
import { Building2, FileText, Home, ShieldAlert, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, DashboardAppointment, LocationKind } from "@/lib/mock/dashboard";
import {
  RISK_LEVEL_LABELS,
  SERVICE_TYPE_LABELS,
  isRiskLevel,
  isServiceType,
} from "@/lib/clients/service-track";

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
  showClinicalContext?: boolean;
}

export function AppointmentRow({
  appointment,
  showDate = false,
  showClinicalContext = true,
}: AppointmentRowProps) {
  const LocationIcon = locationIcon[appointment.location] ?? Home;
  const isDuty = appointment.isExternalDuty;
  const serviceTypeLabel =
    appointment.serviceType && isServiceType(appointment.serviceType)
      ? SERVICE_TYPE_LABELS[appointment.serviceType]
      : null;
  const riskLabel =
    appointment.riskLevel && isRiskLevel(appointment.riskLevel)
      ? RISK_LEVEL_LABELS[appointment.riskLevel]
      : null;

  return (
    <div className={cn(
      "rounded-2xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/30",
      isDuty ? "border-dashed bg-muted/30" : "bg-card",
    )}>
      <div className="flex items-start gap-4">
        <div className="w-14 shrink-0 text-center">
          <p className="text-sm font-black tabular-nums text-foreground">
            {format(appointment.startsAt, "HH:mm")}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground">
            {appointment.durationMinutes} min
          </p>
        </div>

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
            {serviceTypeLabel && showClinicalContext ? (
              <Badge variant="outline" className="text-[10px] font-bold normal-case tracking-normal">
                {serviceTypeLabel}
              </Badge>
            ) : null}
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

          {showClinicalContext && !isDuty ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={appointment.hasContract ? "success" : "warning"} className="normal-case tracking-normal">
                {appointment.hasContract ? "Contract disponibil" : "Contract lipsă"}
              </Badge>
              <Badge variant={appointment.hasSessionNote ? "success" : "warning"} className="normal-case tracking-normal">
                {appointment.hasSessionNote ? "Notă existentă" : "Notă lipsă"}
              </Badge>
              {appointment.hasInvoice !== undefined ? (
                <Badge variant={appointment.hasInvoice ? "info" : "outline"} className="normal-case tracking-normal">
                  {appointment.hasInvoice ? "Factură emisă" : "Fără factură"}
                </Badge>
              ) : null}
              {riskLabel ? (
                <Badge
                  variant={
                    appointment.riskLevel === "HIGH" || appointment.riskLevel === "CRISIS"
                      ? "destructive"
                      : "warning"
                  }
                  className="normal-case tracking-normal"
                >
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  {riskLabel}
                </Badge>
              ) : null}
              {appointment.serviceType === "DBT" ? (
                <Badge
                  variant={appointment.hasDiaryCardThisWeek ? "success" : "warning"}
                  className="normal-case tracking-normal"
                >
                  {appointment.hasDiaryCardThisWeek ? "Jurnal DBT prezent" : "Jurnal DBT lipsă"}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {showClinicalContext && !isDuty ? (
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <Link href={`/dashboard/appointments/${appointment.id}`} className="text-primary hover:underline">
                Deschide
              </Link>
              {appointment.clientId ? (
                <Link href={`/dashboard/clients/${appointment.clientId}`} className="text-primary hover:underline">
                  Fișă client
                </Link>
              ) : null}
              {appointment.status === "FINALIZAT" && !appointment.hasSessionNote ? (
                <Link
                  href={`/dashboard/notes/${appointment.id}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Adaugă notă
                </Link>
              ) : null}
              {appointment.serviceType === "DBT" && !appointment.hasDiaryCardThisWeek && appointment.clientId ? (
                <Link href={`/dashboard/clients/${appointment.clientId}`} className="text-primary hover:underline">
                  Jurnal DBT
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <Badge variant={statusVariant[appointment.status]} className="shrink-0 rounded-xl px-2.5 py-1 text-[10px] tracking-wide">
          {statusLabel[appointment.status]}
        </Badge>
      </div>
    </div>
  );
}
