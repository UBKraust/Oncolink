import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPage } from "@/components/app/page-shell";

export default function ClientDetailLoading() {
  return (
    <DashboardPage className="max-w-6xl">
      <div className="space-y-8 pb-20">
        <Skeleton className="h-5 w-36 rounded-lg" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-4 w-[32rem] max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32 rounded-2xl" />
            <Skeleton className="h-11 w-28 rounded-2xl" />
            <Skeleton className="h-11 w-36 rounded-2xl" />
            <Skeleton className="h-11 w-11 rounded-2xl" />
          </div>
        </div>

        <Skeleton className="h-36 rounded-[2rem]" />
        <Skeleton className="h-36 rounded-[1.75rem]" />
        <Skeleton className="h-32 rounded-[1.75rem]" />

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
          <Skeleton className="h-72 rounded-[1.75rem]" />
          <Skeleton className="h-72 rounded-[1.75rem]" />
          <Skeleton className="h-72 rounded-[1.75rem]" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-[1.75rem]" />
          ))}
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
          <div className="grid gap-4 p-4 xl:grid-cols-[1.2fr_0.9fr]">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-80 max-w-full" />
              <Skeleton className="h-4 w-[32rem] max-w-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Skeleton className="h-24 rounded-[1.5rem]" />
              <Skeleton className="h-24 rounded-[1.5rem]" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <Skeleton className="h-12 w-full rounded-[1.25rem]" />
            <Skeleton className="mt-3 h-1 w-full rounded-full" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[1.75rem]" />
          ))}
        </div>
      </div>
    </DashboardPage>
  );
}
