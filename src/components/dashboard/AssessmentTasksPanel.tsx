import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardAssessmentTask } from "@/lib/dashboard/queries";

const priorityVariant = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
} as const;

export function AssessmentTasksPanel({
  tasks,
}: {
  tasks: DashboardAssessmentTask[];
}) {
  return (
    <SectionCard
      title="Evaluări & Rapoarte"
      description="Semnale pentru evaluări, summary-uri și rapoarte restante."
      icon={ClipboardList}
    >
      <div className="border-b border-border/60 px-6 py-4">
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/dashboard/assessments/new">Evaluare nouă</Link>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Nu există evaluări sau rapoarte restante."
          description="Catalogul de teste va putea alimenta această zonă după configurare."
          icon={ClipboardList}
        />
      ) : (
        <div className="space-y-3 p-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-foreground">{task.title}</p>
                <Badge variant={priorityVariant[task.priority]}>Prioritar</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
              {task.href && task.ctaLabel ? (
                <Button asChild variant="ghost" size="sm" className="mt-3 h-auto px-0 text-primary">
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
