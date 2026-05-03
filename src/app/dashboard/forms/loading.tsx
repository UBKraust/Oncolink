import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPage } from "@/components/app/page-shell";

export default function FormsLoading() {
  return (
    <DashboardPage className="max-w-5xl">
      {/* PageHeader */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Clinical forms card */}
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-6 py-5 flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Reports card */}
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-6 py-5 flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </DashboardPage>
  );
}
