import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPage } from "@/components/app/page-shell";

export default function DashboardLoading() {
  return (
    <DashboardPage>
      {/* PageHeader */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* TodayCommandCenter */}
      <Skeleton className="h-56 rounded-[2rem]" />

      {/* 2-col alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-[2rem]" />
        <Skeleton className="h-44 rounded-[2rem]" />
      </div>

      {/* ServiceTracksOverview */}
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-6 py-5 flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-60" />
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-[1.75rem]" />
          ))}
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[1.75rem]" />
        ))}
      </div>

      {/* Appointments + Assessment */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-[2rem] lg:col-span-2" />
        <Skeleton className="h-72 rounded-[2rem]" />
      </div>

      {/* Secondary tabs */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-80 max-w-full rounded-xl" />
        <Skeleton className="h-52 rounded-[2rem]" />
      </div>
    </DashboardPage>
  );
}
