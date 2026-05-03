import Link from "next/link";
import { FileText, CheckCircle2, AlertCircle, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SERVICE_TYPE_LABELS } from "@/lib/clients/service-track";
import type { DocumentCategory } from "@/lib/clients/document-requirements";
import type { ClientDocumentChecklist } from "@/app/dashboard/clients/document-checklist-action";
import { cn } from "@/lib/utils";

// ─── Section grouping ─────────────────────────────────────────────────────────

type SectionKey = "CONSIMȚĂMINTE" | "CONTRACTE" | "DOCUMENTE CLINICE" | "SIGURANȚĂ" | "RAPOARTE";

const CATEGORY_TO_SECTION: Record<DocumentCategory, SectionKey> = {
  consent: "CONSIMȚĂMINTE",
  contract: "CONTRACTE",
  clinical: "DOCUMENTE CLINICE",
  assessment: "DOCUMENTE CLINICE",
  safety: "SIGURANȚĂ",
  report: "RAPOARTE",
};

const SECTION_ORDER: SectionKey[] = [
  "CONSIMȚĂMINTE",
  "CONTRACTE",
  "DOCUMENTE CLINICE",
  "SIGURANȚĂ",
  "RAPOARTE",
];

// ─── Item row ─────────────────────────────────────────────────────────────────

function ChecklistItem({
  present,
  label,
  required,
  ctaLabel,
  ctaHref,
}: {
  present: boolean;
  label: string;
  required: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      {/* Status icon */}
      {present ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      ) : required ? (
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />
      )}

      {/* Label + mandatory badge */}
      <span
        className={cn(
          "flex-1 text-sm",
          present ? "text-foreground" : "text-foreground",
        )}
      >
        {label}
      </span>
      {!present && required ? (
        <Badge variant="destructive" className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
          Obligatoriu
        </Badge>
      ) : null}

      {/* CTA */}
      {!present && ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="ml-2 shrink-0 text-sm font-medium text-primary hover:underline"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

// ─── Main card ─────────────────────────────────────────────────────────────────

export function DocumentChecklistCard({
  checklist,
  clientId,
  className,
}: {
  checklist: ClientDocumentChecklist;
  clientId: string;
  className?: string;
}) {
  const { results, stats, serviceType } = checklist;
  const missingMandatory = stats.mandatoryTotal - stats.mandatoryDone;
  const missingRecommended = stats.recommendedTotal - stats.recommendedDone;

  // Group results by section, preserving SECTION_ORDER
  const grouped = new Map<SectionKey, typeof results>();
  for (const section of SECTION_ORDER) {
    grouped.set(section, []);
  }
  for (const result of results) {
    const section = CATEGORY_TO_SECTION[result.requirement.category];
    grouped.get(section)?.push(result);
  }

  return (
    <div className={cn("overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-foreground">
              Documente {SERVICE_TYPE_LABELS[serviceType]}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stats.mandatoryDone}/{stats.mandatoryTotal} obligatorii
              {stats.recommendedTotal > 0
                ? ` · ${stats.recommendedDone}/${stats.recommendedTotal} recomandate`
                : ""}
            </p>
          </div>
        </div>
        {missingMandatory > 0 ? (
          <Badge variant="destructive" className="shrink-0 rounded-full text-[10px] font-black uppercase tracking-widest">
            {missingMandatory} lipsă
          </Badge>
        ) : missingRecommended > 0 ? (
          <Badge variant="warning" className="shrink-0 rounded-full text-[10px] font-black uppercase tracking-widest">
            {missingRecommended} recomandate
          </Badge>
        ) : (
          <Badge variant="success" className="shrink-0 rounded-full text-[10px] font-black uppercase tracking-widest">
            Complet
          </Badge>
        )}
      </div>

      {/* Sections */}
      <div className="divide-y divide-border/40 border-t border-border/40">
        {SECTION_ORDER.map((section) => {
          const items = grouped.get(section);
          if (!items?.length) return null;

          return (
            <div key={section} className="px-6 py-1">
              <p className="mb-1 mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/60">
                {section}
              </p>
              <div className="divide-y divide-border/30">
                {items.map(({ requirement, present }) => (
                  <ChecklistItem
                    key={requirement.key}
                    present={present}
                    label={requirement.label}
                    required={requirement.priority === "mandatory"}
                    ctaLabel={requirement.actionLabel}
                    ctaHref={requirement.actionHref(clientId)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
