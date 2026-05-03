"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { ServiceTrackSheet } from "@/components/dashboard/ServiceTrackSheet";
import type { DashboardServiceTrackStat } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

export function ServiceTracksOverview({
  tracks,
}: {
  tracks: DashboardServiceTrackStat[];
}) {
  const [selectedTrack, setSelectedTrack] = useState<DashboardServiceTrackStat | null>(null);

  return (
    <>
      <SectionCard
        title="Distribuție clinică"
        description="Cazurile active pe tipuri de serviciu. Apasă pe un track pentru detalii."
        icon={Activity}
      >
        {tracks.length === 0 ? (
          <EmptyState
            title="Service tracks nu sunt configurate încă."
            description="După setarea tipului de serviciu pe client, aici vei vedea distribuția clinică."
            icon={Activity}
            action={{ label: "Vezi clienți", href: "/dashboard/clients" }}
          />
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
            {tracks.map((track) => (
              <TrackCard
                key={track.serviceType}
                track={track}
                onClick={() => setSelectedTrack(track)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <ServiceTrackSheet
        track={selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />
    </>
  );
}

function TrackCard({
  track,
  onClick,
}: {
  track: DashboardServiceTrackStat;
  onClick: () => void;
}) {
  const hasActions = track.nextActionCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col rounded-[1.75rem] border border-border/60 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md",
        hasActions && "border-warning/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-black tracking-tight text-foreground">
          {track.label}
        </p>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/60 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <p className="mt-4 text-3xl font-black tracking-tight text-foreground">
        {track.activeClients}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">cazuri active</p>

      {track.secondaryLabel ? (
        <p className="mt-2 min-h-8 text-xs text-muted-foreground">
          {track.secondaryLabel}
        </p>
      ) : (
        <div className="mt-2 min-h-8" />
      )}

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {track.nextActionLabel}
        </span>
        <Badge variant={hasActions ? "warning" : "outline"} className="h-5 min-w-5 px-1.5 text-[10px]">
          {track.nextActionCount}
        </Badge>
      </div>
    </button>
  );
}
