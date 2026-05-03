"use client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Brain,
  CheckCircle2,
  FileText,
  Mail,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClientAssessment } from "./types";
import { SectionDetailOverlay } from "./SectionDetailOverlay";

const SEVERITY_CONFIG = {
  minimal: { label: "Minimal", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50/70 dark:bg-emerald-950/20", border: "border-emerald-200/70 dark:border-emerald-900/40" },
  mild: { label: "Ușor", bar: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50/70 dark:bg-amber-950/20", border: "border-amber-200/70 dark:border-amber-900/40" },
  moderate: { label: "Moderat", bar: "bg-amber-500", text: "text-amber-800 dark:text-amber-200", bg: "bg-amber-50/90 dark:bg-amber-950/20", border: "border-amber-300/70 dark:border-amber-900/40" },
  severe: { label: "Sever", bar: "bg-destructive", text: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20" },
};

const TYPE_LABEL: Record<string, string> = {
  EVALUARE_INITIALA: "Evaluare Inițială",
  SCORING_ANXIETATE: "Scoring Anxietate",
  RAPORT_LUNAR: "Raport Lunar",
};

interface Props {
  assessment: ClientAssessment;
  clientName: string;
  isMinor: boolean;
  sendReportToParent: boolean;
  closeUrl: string;
}

export function AssessmentDetailOverlay({
  assessment,
  clientName,
  isMinor,
  sendReportToParent,
  closeUrl,
}: Props) {
  const router = useRouter();
  const scoring = assessment.scoring_data;
  const severityRaw =
    typeof scoring.severity === "string" ? scoring.severity.toLowerCase() : undefined;
  const severity = severityRaw as keyof typeof SEVERITY_CONFIG | undefined;
  const severityCfg = severity ? SEVERITY_CONFIG[severity] : null;
  const scoreValue = typeof scoring.score === "number" ? scoring.score : null;
  const stateAnxiety =
    typeof scoring.state_anxiety === "number" ? scoring.state_anxiety : null;
  const traitAnxiety =
    typeof scoring.trait_anxiety === "number" ? scoring.trait_anxiety : null;
  const testType =
    typeof scoring.test_type === "string" ? scoring.test_type : null;

  const hasNumericScore =
    scoreValue !== null || stateAnxiety !== null || traitAnxiety !== null;

  const scoreEntries = Object.entries(scoring).filter(
    ([k]) => k !== "test_type" && k !== "severity"
  );

  function handleClose() {
    router.push(closeUrl);
  }

  return (
    <SectionDetailOverlay
      isOpen
      onClose={handleClose}
      title="Detalii evaluare"
      subtitle={`${clientName} · ${format(new Date(assessment.created_at), "d MMMM yyyy, HH:mm", { locale: ro })}`}
      icon={Brain}
      size="sm"
      footer={
        assessment.sent_to_parent_at ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Trimis părintelui pe{" "}
            {format(new Date(assessment.sent_to_parent_at), "d MMM yyyy", { locale: ro })}
          </div>
        ) : isMinor && sendReportToParent ? (
          <Button variant="outline" className="w-full justify-start rounded-xl border-border/70 bg-muted/30 text-foreground hover:bg-muted">
            <Mail className="h-4 w-4" />
            Generează email pentru părinte
          </Button>
        ) : (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Document intern — nu se trimite
          </span>
        )
      }
    >
      <div className="space-y-5">
          <div className="space-y-1">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {TYPE_LABEL[assessment.assessment_type] ?? assessment.assessment_type.replace(/_/g, " ")}
            </Badge>
          </div>

          {/* Test type badge */}
          {testType && (
            <div className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-primary" />
              <span className="font-medium">{testType}</span>
            </div>
          )}

          {/* Severity card */}
          {severityCfg && (
            <div className={`rounded-xl border p-4 ${severityCfg.bg} ${severityCfg.border}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-sm font-semibold ${severityCfg.text}`}>
                  {severityCfg.label}
                </span>
                {scoreValue !== null && (
                  <span className={`text-2xl font-bold ${severityCfg.text}`}>
                    {scoreValue}
                  </span>
                )}
              </div>
              {scoreValue !== null && (
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full transition-all ${severityCfg.bar}`}
                    style={{ width: `${Math.min((scoreValue / 27) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Score entries */}
          {hasNumericScore && scoreEntries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Scoruri detaliate
                </p>
              <div className="divide-y rounded-xl border border-border/60 bg-card">
                {scoreEntries.map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscale visualization for multi-dimension scores */}
          {stateAnxiety !== null && traitAnxiety !== null && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Componente
              </p>
              {[
                { label: "Anxietate de stare", value: stateAnxiety, max: 80 },
                { label: "Anxietate de trăsătură", value: traitAnxiety, max: 80 },
              ].map(({ label, value, max }) => {
                const pct = Math.min((value / max) * 100, 100);
                const barColor = value < 40 ? "bg-emerald-500" : value < 55 ? "bg-amber-400" : "bg-destructive";
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium tabular-nums">{value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Content summary */}
          {assessment.content_summary && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Concluzie / Sumar Clinic
              </p>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-sm leading-relaxed">{assessment.content_summary}</p>
              </div>
            </div>
          )}
      </div>
    </SectionDetailOverlay>
  );
}
