"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle, Circle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  checkDocumentRequirements,
  getDocumentCompletionStats,
  type DocumentCheckResult,
} from "@/lib/clients/document-requirements";
import { isServiceType, SERVICE_TYPE_LABELS } from "@/lib/clients/service-track";
import type { ClientProfile, ClientDocument, ClientAssessment } from "@/components/clients/types";

interface DocumentRequirementsCardProps {
  client: ClientProfile;
  docs: ClientDocument[];
  assessments: ClientAssessment[];
}

const CATEGORY_LABELS: Record<string, string> = {
  consent: "Consimțăminte",
  contract: "Contracte",
  clinical: "Documente clinice",
  assessment: "Evaluări",
  report: "Rapoarte",
  safety: "Siguranță",
};

const PRIORITY_LABELS: Record<string, string> = {
  mandatory: "Obligatoriu",
  recommended: "Recomandat",
  optional: "Opțional",
};

function DocumentRow({ result, clientId }: { result: DocumentCheckResult; clientId: string }) {
  const { requirement, present } = result;

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2.5 min-w-0">
        {present ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : requirement.priority === "mandatory" ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
        ) : (
          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        )}
        <span
          className={cn(
            "text-sm truncate",
            present ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {requirement.label}
        </span>
        {requirement.priority === "mandatory" && !present && (
          <Badge variant="destructive" className="shrink-0 text-[9px] h-4 px-1.5">
            {PRIORITY_LABELS[requirement.priority]}
          </Badge>
        )}
      </div>

      {!present && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
        >
          <Link href={requirement.actionHref(clientId)}>
            {requirement.actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}

export function DocumentRequirementsCard({
  client,
  docs,
  assessments,
}: DocumentRequirementsCardProps) {
  const [showAll, setShowAll] = useState(false);
  const serviceType = isServiceType(client.service_type) ? client.service_type : "UNDECIDED";

  if (serviceType === "UNDECIDED" || serviceType === "MIXED") return null;

  const results = checkDocumentRequirements(serviceType, client, docs, assessments);
  const stats = getDocumentCompletionStats(results);

  const grouped = results.reduce<Record<string, DocumentCheckResult[]>>((acc, r) => {
    const cat = r.requirement.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  const visibleResults = showAll ? results : results.filter((r) => !r.present || r.requirement.priority === "mandatory");
  const hasHidden = results.length !== visibleResults.length;

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Documente {SERVICE_TYPE_LABELS[serviceType]}</p>
            <p className="text-[11px] text-muted-foreground">
              {stats.mandatoryDone}/{stats.mandatoryTotal} obligatorii
              {stats.recommendedTotal > 0
                ? ` · ${stats.recommendedDone}/${stats.recommendedTotal} recomandate`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stats.allMandatoryComplete ? (
            <Badge variant="success" className="text-[10px]">Complet</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">
              {stats.missingMandatory.length} lipsă
            </Badge>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/30 px-5">
        {Object.entries(grouped).map(([category, items]) => {
          const visibleItems = showAll
            ? items
            : items.filter((r) => !r.present || r.requirement.priority === "mandatory");
          if (visibleItems.length === 0) return null;

          return (
            <div key={category} className="py-1">
              <p className="pt-2 pb-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              {visibleItems.map((result) => (
                <DocumentRow key={result.requirement.key} result={result} clientId={client.id} />
              ))}
            </div>
          );
        })}
      </div>

      {hasHidden || showAll ? (
        <div className="px-5 pb-4 pt-2">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Ascunde documentele complete
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Arată toate documentele ({results.filter((r) => r.present).length} complete)
              </>
            )}
          </button>
        </div>
      ) : null}
    </section>
  );
}
