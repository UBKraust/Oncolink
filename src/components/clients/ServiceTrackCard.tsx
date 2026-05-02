"use client";

import { ArrowRight, ChevronRight, Stethoscope, ListTree } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_BADGE_VARIANTS,
  SERVICE_TRACK_STATUSES,
  computeServiceTrackNextAction,
  getNextTrackStatus,
  isServiceType,
  type ServiceType,
} from "@/lib/clients/service-track";
import { updateServiceTrack } from "@/app/dashboard/clients/actions";

interface ServiceTrackCardProps {
  clientId: string;
  serviceType: string | null;
  serviceTrackStatus: string | null;
  lifecycleStatus: string | null;
  gdprSigned: boolean | null;
  onboardingComplete: boolean;
  hasAppointments: boolean;
  riskLevel: string | null;
}

export function ServiceTrackCard({
  clientId,
  serviceType,
  serviceTrackStatus,
  lifecycleStatus,
  gdprSigned,
  onboardingComplete,
  hasAppointments,
  riskLevel,
}: ServiceTrackCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showJump, setShowJump] = useState(false);

  const resolved: ServiceType = isServiceType(serviceType) ? serviceType : "UNDECIDED";
  const label = SERVICE_TYPE_LABELS[resolved];
  const badgeVariant = SERVICE_TYPE_BADGE_VARIANTS[resolved];
  const statuses = SERVICE_TRACK_STATUSES[resolved];
  const nextStatus = getNextTrackStatus(resolved, serviceTrackStatus);

  const nextAction = computeServiceTrackNextAction({
    serviceType: resolved,
    lifecycleStatus,
    serviceTrackStatus,
    gdprSigned,
    onboardingComplete,
    hasAppointments,
    riskLevel,
  });

  const currentIdx = serviceTrackStatus ? statuses.indexOf(serviceTrackStatus) : -1;

  function handleAdvanceTrack() {
    if (!nextStatus) return;
    startTransition(async () => {
      const result = await updateServiceTrack(clientId, { service_track_status: nextStatus });
      if (result.success) {
        toast.success(`Etapă avansată: ${nextStatus}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nu am putut actualiza etapa.");
      }
    });
  }

  function handleJumpToStage(stage: string) {
    if (!stage || stage === serviceTrackStatus) {
      setShowJump(false);
      return;
    }
    startTransition(async () => {
      const result = await updateServiceTrack(clientId, { service_track_status: stage });
      if (result.success) {
        toast.success(`Etapă setată: ${stage}`);
        setShowJump(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nu am putut actualiza etapa.");
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Service Track
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statuses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJump((v) => !v)}
              disabled={isPending}
              className={cn(
                "h-7 w-7 p-0 rounded-xl",
                showJump ? "text-primary bg-primary/10" : "text-muted-foreground",
              )}
              aria-label="Sari la etapă"
              title="Sari direct la orice etapă"
            >
              <ListTree className="h-3.5 w-3.5" />
            </Button>
          )}
          <Badge variant={badgeVariant}>{label}</Badge>
        </div>
      </div>

      {statuses.length > 0 ? (
        <div className="px-5 pb-4">
          {/* Stage jump select */}
          {showJump && (
            <div className="mb-3">
              <Select
                value={serviceTrackStatus ?? ""}
                onChange={(e) => handleJumpToStage(e.target.value)}
                disabled={isPending}
                aria-label="Sari direct la etapă"
              >
                <option value="">— Selectează etapă —</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex gap-1 mb-3">
            {statuses.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < currentIdx
                    ? "bg-primary/40"
                    : i === currentIdx
                      ? "bg-primary"
                      : "bg-muted",
                )}
              />
            ))}
          </div>

          {/* Current stage */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {serviceTrackStatus ? (
                <p className="text-sm font-semibold text-foreground truncate">
                  {serviceTrackStatus}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Etapă nesetată</p>
              )}
              {nextStatus && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Urmează: {nextStatus}
                </p>
              )}
            </div>
            {nextStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdvanceTrack}
                disabled={isPending}
                className="shrink-0 h-8 rounded-xl gap-1.5 text-xs font-bold"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                {isPending ? "Se avansează..." : "Avansează"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {/* Next action */}
      <div className="border-t border-border/40 px-5 py-3 flex items-start gap-2 bg-muted/30">
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm font-medium text-foreground">{nextAction}</p>
      </div>
    </section>
  );
}
