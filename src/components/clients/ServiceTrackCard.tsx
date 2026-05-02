"use client";

import { ArrowRight, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_BADGE_VARIANTS,
  computeServiceTrackNextAction,
  isServiceType,
  type ServiceType,
} from "@/lib/clients/service-track";

interface ServiceTrackCardProps {
  serviceType: string | null;
  serviceTrackStatus: string | null;
  lifecycleStatus: string | null;
  gdprSigned: boolean | null;
  onboardingComplete: boolean;
  hasAppointments: boolean;
  riskLevel: string | null;
}

export function ServiceTrackCard({
  serviceType,
  serviceTrackStatus,
  lifecycleStatus,
  gdprSigned,
  onboardingComplete,
  hasAppointments,
  riskLevel,
}: ServiceTrackCardProps) {
  const resolved: ServiceType = isServiceType(serviceType) ? serviceType : "UNDECIDED";
  const label = SERVICE_TYPE_LABELS[resolved];
  const badgeVariant = SERVICE_TYPE_BADGE_VARIANTS[resolved];

  const nextAction = computeServiceTrackNextAction({
    serviceType: resolved,
    lifecycleStatus,
    gdprSigned,
    onboardingComplete,
    hasAppointments,
    riskLevel,
  });

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
          Service Track
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={badgeVariant}>{label}</Badge>
        {serviceTrackStatus ? (
          <span className="text-xs font-medium text-muted-foreground">{serviceTrackStatus}</span>
        ) : null}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-muted/50 px-3 py-2.5">
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm font-medium text-foreground">{nextAction}</p>
      </div>
    </section>
  );
}
