"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";

import { getTrackClients, type TrackClient } from "@/app/dashboard/service-track-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DocumentChecklistSheet } from "@/components/clients/DocumentChecklistSheet";
import {
  isRiskLevel,
  RISK_LEVEL_BADGE_VARIANTS,
  RISK_LEVEL_LABELS,
  SERVICE_TYPE_LABELS,
  type ServiceType,
} from "@/lib/clients/service-track";
import type { DashboardServiceTrackStat } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

const LIFECYCLE_LABELS: Record<string, string> = {
  LEAD: "Lead",
  ONBOARDING: "Onboarding",
  PROGRAMAT: "Programat",
  ACTIV: "Activ",
  INACTIV: "Inactiv",
  INCHEIAT: "Încheiat",
  NECONVERSIE: "Neconversie",
  ANONIMIZAT: "Anonim",
};

const LIFECYCLE_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  LEAD: "outline",
  ONBOARDING: "secondary",
  PROGRAMAT: "secondary",
  ACTIV: "success",
  INACTIV: "warning",
  INCHEIAT: "outline",
  NECONVERSIE: "outline",
  ANONIMIZAT: "outline",
};

interface ServiceTrackSheetProps {
  track: DashboardServiceTrackStat | null;
  onClose: () => void;
}

interface DocSheetState {
  clientId: string;
  clientName: string;
  serviceType: ServiceType;
}

export function ServiceTrackSheet({ track, onClose }: ServiceTrackSheetProps) {
  const [clients, setClients] = useState<TrackClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [docSheet, setDocSheet] = useState<DocSheetState | null>(null);

  const open = track !== null;

  useEffect(() => {
    if (!track) {
      setClients([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTrackClients(track.serviceType)
      .then((data) => {
        if (!cancelled) {
          setClients(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [track]);

  const issueClients = clients.filter(
    (c) =>
      !c.gdprSigned ||
      !c.onboardingComplete ||
      !c.hasContract ||
      c.riskLevel === "HIGH" ||
      c.riskLevel === "CRISIS",
  );

  return (
    <>
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetClose />

        <SheetHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>
                {track ? SERVICE_TYPE_LABELS[track.serviceType] : ""}
              </SheetTitle>
              <SheetDescription>
                {clients.length} clienți activi
                {issueClients.length > 0
                  ? ` · ${issueClients.length} necesită atenție`
                  : ""}
              </SheetDescription>
            </div>
          </div>

          {issueClients.length > 0 && !loading ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {issueClients.length}{" "}
                {issueClients.length === 1 ? "client are" : "clienți au"} documente
                lipsă sau risc clinic ridicat.
              </p>
            </div>
          ) : null}
        </SheetHeader>

        <SheetBody className="px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-muted text-muted-foreground/40">
                <Users className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">
                Niciun client activ în acest track.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Setează tipul de serviciu pe un client pentru a-l vedea aici.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  trackServiceType={track?.serviceType ?? "UNDECIDED"}
                  onOpenDocs={(c) =>
                    setDocSheet({
                      clientId: c.id,
                      clientName: c.fullName,
                      serviceType: track?.serviceType ?? "UNDECIDED",
                    })
                  }
                />
              ))}
            </ul>
          )}
        </SheetBody>

        <SheetFooter className="flex flex-wrap gap-2">
          {track ? (
            <>
              <Button asChild size="sm" className="flex-1" onClick={onClose}>
                <Link href={track.href}>
                  <ChevronRight className="h-4 w-4" />
                  Toți clienții {SERVICE_TYPE_LABELS[track.serviceType]}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/clients/new">Client nou</Link>
              </Button>
            </>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <DocumentChecklistSheet
      open={docSheet !== null}
      onClose={() => setDocSheet(null)}
      clientId={docSheet?.clientId ?? null}
      clientName={docSheet?.clientName ?? ""}
      serviceType={docSheet?.serviceType ?? null}
    />
    </>
  );
}

function ClientRow({
  client,
  trackServiceType,
  onOpenDocs,
}: {
  client: TrackClient;
  trackServiceType: ServiceType;
  onOpenDocs: (client: TrackClient) => void;
}) {
  const isHighRisk = client.riskLevel === "HIGH" || client.riskLevel === "CRISIS";
  const hasMissingDocs = !client.gdprSigned || !client.hasContract || !client.onboardingComplete;
  const lifecycleLabel =
    LIFECYCLE_LABELS[client.lifecycleStatus ?? ""] ?? client.lifecycleStatus ?? "—";
  const lifecycleVariant =
    LIFECYCLE_VARIANTS[client.lifecycleStatus ?? ""] ?? "outline";

  return (
    <li className="flex items-stretch gap-2">
      <Link
        href={`/dashboard/clients/${client.id}`}
        className="group flex min-w-0 flex-1 items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/30"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-black text-muted-foreground">
          {client.fullName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {client.fullName}
              </p>
              {client.serviceTrackStatus ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {client.serviceTrackStatus}
                </p>
              ) : null}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={lifecycleVariant} className="h-5 px-1.5 text-[10px]">
              {lifecycleLabel}
            </Badge>
            {isHighRisk && isRiskLevel(client.riskLevel) ? (
              <Badge
                variant={RISK_LEVEL_BADGE_VARIANTS[client.riskLevel]}
                className="h-5 px-1.5 text-[10px]"
              >
                {RISK_LEVEL_LABELS[client.riskLevel]}
              </Badge>
            ) : null}
            {client.isMinor ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                Minor
              </Badge>
            ) : null}
            <StatusPill ok={client.gdprSigned} label="GDPR" />
            <StatusPill ok={client.hasContract} label="Contract" />
            <StatusPill ok={client.onboardingComplete} label="Onboarding" />
          </div>
        </div>
      </Link>

      {/* Document checklist button */}
      <button
        type="button"
        onClick={() => onOpenDocs(client)}
        title="Documente client"
        className={cn(
          "flex w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors",
          hasMissingDocs
            ? "border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
            : "border-border/60 bg-card text-muted-foreground hover:bg-muted/30 hover:text-primary",
        )}
      >
        <FileText className="h-4 w-4" />
        {hasMissingDocs ? (
          <span className="text-[9px] font-black leading-none">
            {[!client.gdprSigned, !client.hasContract, !client.onboardingComplete].filter(Boolean).length}
          </span>
        ) : null}
      </button>
    </li>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  if (ok) return null;
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      <XCircle className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

export function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[10px] font-medium",
        ok ? "text-muted-foreground/50" : "text-destructive",
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}
