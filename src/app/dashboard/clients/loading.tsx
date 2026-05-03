import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPage } from "@/components/app/page-shell";

export default function ClientsLoading() {
  return (
    <DashboardPage>
      {/* PageHeader */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* 4 metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[1.75rem]" />
        ))}
      </div>

      {/* Search + filters */}
      <Skeleton className="h-11 rounded-xl" />

      {/* Client list */}
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 rounded" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border/40 px-4 py-3.5 last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </DashboardPage>
  );
}
