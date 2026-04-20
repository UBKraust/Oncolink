"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp,
  AlertTriangle, Info, CheckCircle2, RefreshCw, Scale
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runComplianceCheck, ClientComplianceResult, ComplianceSummary } from "@/lib/compliance/engine";
import { cn } from "@/lib/utils";

// ── Icons & colors ────────────────────────────────────────────────────────────

const STATUS_ICON = {
  COMPLIANT: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  WARNING:   <ShieldAlert className="h-4 w-4 text-amber-500" />,
  CRITICAL:  <ShieldX className="h-4 w-4 text-rose-500" />,
};

const STATUS_BADGE = {
  COMPLIANT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  WARNING:   "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  CRITICAL:  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
};

const SEVERITY_ICON = {
  CRITICAL: <ShieldX className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />,
  WARNING:  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
  INFO:     <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />,
};

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="72" height="72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} stroke="#e5e7eb" strokeWidth="6" fill="none" className="dark:stroke-zinc-700" />
      <circle cx="36" cy="36" r={r} stroke={color} strokeWidth="6" fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x="36" y="36" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" fill={color}
        style={{ transform: "rotate(90deg)", transformOrigin: "36px 36px", fontSize: "14px", fontWeight: 700 }}>
        {score}
      </text>
    </svg>
  );
}

// ── Client row ────────────────────────────────────────────────────────────────

function ClientRow({ result }: { result: ClientComplianceResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-colors",
      result.status === "CRITICAL" && "border-rose-200 dark:border-rose-900",
      result.status === "WARNING"  && "border-amber-200 dark:border-amber-900",
      result.status === "COMPLIANT" && "border-emerald-100 dark:border-emerald-900/40"
    )}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        {STATUS_ICON[result.status]}
        <span className="flex-1 font-medium text-sm">
          {result.clientName}
          {result.isMinor && <Badge className="ml-2 text-[10px] py-0 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">Minor</Badge>}
          {result.isAnonymized && <Badge className="ml-2 text-[10px] py-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-800">Anonimizat</Badge>}
        </span>
        <Badge className={cn("text-xs font-medium shrink-0", STATUS_BADGE[result.status])}>
          {result.status === "COMPLIANT" ? "Conform" : result.status === "WARNING" ? "Atenție" : "Critic"}
        </Badge>
        <span className="text-xs text-muted-foreground w-8 text-right">{result.score}%</span>
        {result.issues.length > 0 && (
          expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                   : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && result.issues.length > 0 && (
        <div className="border-t bg-muted/20 divide-y">
          {result.issues.map(issue => (
            <div key={issue.ruleId} className="px-4 py-3 space-y-1">
              <div className="flex items-start gap-2">
                {SEVERITY_ICON[issue.severity]}
                <div className="flex-1">
                  <p className="text-xs font-semibold">[{issue.ruleId}] {issue.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">📜 {issue.law}</p>
                  <p className="text-[11px] text-primary mt-1">→ {issue.action}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="px-4 py-2 flex justify-end">
            <Button asChild size="sm" variant="ghost" className="text-xs h-7">
              <Link href={`/dashboard/clients/${result.clientId}`}>Deschide fișă →</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /** If compact=true, renders a mini-panel for dashboard; otherwise full page */
  compact?: boolean;
}

export function CompliancePanel({ compact = false }: Props) {
  const [data, setData] = useState<ComplianceSummary>(() => runComplianceCheck());
  const [showAll, setShowAll] = useState(false);

  function refresh() {
    setData(runComplianceCheck());
  }

  const visible = useMemo(() => {
    if (compact && !showAll) {
      // In compact mode show only non-compliant clients
      return data.results.filter(r => r.status !== "COMPLIANT").slice(0, 5);
    }
    return data.results;
  }, [data, compact, showAll]);

  const checkedAt = new Date(data.lastChecked).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  return (
    <Card className={cn(
      data.criticalCount > 0
        ? "border-rose-200 dark:border-rose-900"
        : data.warningCount > 0
        ? "border-amber-200 dark:border-amber-900"
        : "border-emerald-200 dark:border-emerald-900"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ScoreRing score={data.overallScore} />
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Panou Conformitate Legală
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-relaxed">
                GDPR · Legea 213/2004 · Legea 272/2004 · e-Factura · Legea 82/1991
              </CardDescription>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px]">
                  ✓ {data.compliantCount} conformi
                </Badge>
                {data.warningCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-[10px]">
                    ⚠ {data.warningCount} atenționări
                  </Badge>
                )}
                {data.criticalCount > 0 && (
                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 text-[10px]">
                    ✗ {data.criticalCount} critice
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={refresh} title="Reîncarcă">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {visible.length === 0 && (
          <div className="flex items-center gap-2 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Toți pacienții sunt în conformitate juridică. ✓
          </div>
        )}

        {visible.map(r => <ClientRow key={r.clientId} result={r} />)}

        {compact && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted-foreground">Verificat la {checkedAt}</p>
            <button
              onClick={() => setShowAll(s => !s)}
              className="text-xs text-primary hover:underline"
            >
              {showAll ? "Arată doar problemele" : `Toți ${data.totalClients} clienții →`}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
