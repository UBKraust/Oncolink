import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import type { DashboardServiceTrackStat } from "@/lib/dashboard/queries";

export function ServiceTracksOverview({
  tracks,
}: {
  tracks: DashboardServiceTrackStat[];
}) {
  return (
    <SectionCard
      title="Service Tracks Overview"
      description="Distribuția cazurilor active pe tipuri de serviciu și punctele lor de atenție."
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
            <Link
              key={track.serviceType}
              href={track.href}
              className="group rounded-[1.75rem] border border-border/60 bg-card p-5 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black tracking-tight text-foreground">
                  {track.label}
                </p>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight text-foreground">
                {track.activeClients}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">cazuri active</p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {track.nextActionLabel}
                </span>
                <Badge variant={track.nextActionCount > 0 ? "warning" : "outline"}>
                  {track.nextActionCount}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
