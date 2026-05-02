import Link from "next/link";
import { ChevronRight, FileCheck2 } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardTask } from "@/lib/dashboard/queries";

const priorityVariant = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
} as const;

const priorityLabel = {
  low: "Scăzut",
  medium: "Mediu",
  high: "Ridicat",
} as const;

export function DocumentTasksPanel({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <SectionCard
      title="Documente & Onboarding"
      description="Lucrurile administrative care blochează sau încetinesc dosarele."
      icon={FileCheck2}
    >
      {tasks.length === 0 ? (
        <EmptyState
          title="Toate documentele critice par în regulă."
          description="Nu există restanțe administrative majore în acest moment."
          icon={FileCheck2}
        />
      ) : (
        <div className="space-y-3 p-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-muted/20 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-foreground">{task.title}</p>
                  <Badge variant={priorityVariant[task.priority]}>
                    {priorityLabel[task.priority]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
              </div>
              {task.href && task.ctaLabel ? (
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link href={task.href}>
                    {task.ctaLabel}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
