"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/clients/service-track";

interface RiskContent {
  suicidal_ideation: string;
  previous_attempts: string;
  risk_factors: string;
  protective_factors: string;
  risk_management_plan: string;
  review_date: string;
}

const EMPTY: RiskContent = {
  suicidal_ideation: "",
  previous_attempts: "",
  risk_factors: "",
  protective_factors: "",
  risk_management_plan: "",
  review_date: "",
};

const FIELDS: { key: keyof RiskContent; label: string; placeholder: string; rows: number }[] = [
  { key: "suicidal_ideation",    label: "Ideație suicidară / auto-vătămare", placeholder: "Prezentă/absentă, frecvență, intensitate, plan, intenție...", rows: 3 },
  { key: "previous_attempts",    label: "Tentative anterioare",              placeholder: "Nr., metodă, circumstanțe, intervenții anterioare...", rows: 2 },
  { key: "risk_factors",         label: "Factori de risc identificați",      placeholder: "Izolare, consum substanțe, acces la mijloace, criză acută...", rows: 3 },
  { key: "protective_factors",   label: "Factori protectivi",                placeholder: "Suport social, motive de viață, angajamente, credințe...", rows: 2 },
  { key: "risk_management_plan", label: "Plan de management al riscului",    placeholder: "Acțiuni concrete, frecvență contacte, resurse de urgență...", rows: 3 },
  { key: "review_date",          label: "Data revizuirii evaluării",         placeholder: "ex: 15.06.2026", rows: 1 },
];

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "LOW",    label: RISK_LEVEL_LABELS["LOW"] },
  { value: "MEDIUM", label: RISK_LEVEL_LABELS["MEDIUM"] },
  { value: "HIGH",   label: RISK_LEVEL_LABELS["HIGH"] },
  { value: "CRISIS", label: RISK_LEVEL_LABELS["CRISIS"] },
];

interface RiskAssessmentCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
  currentRiskLevel?: RiskLevel | null;
}

export function RiskAssessmentCard({ clientId, form, currentRiskLevel }: RiskAssessmentCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parseStoredRiskLevel(f: ClinicalFormRow | null): RiskLevel | null {
    if (!f || !f.content || typeof f.content !== "object" || Array.isArray(f.content)) return null;
    const riskLevel = (f.content as Record<string, unknown>).risk_level;
    return typeof riskLevel === "string" && riskLevel in RISK_LEVEL_LABELS
      ? (riskLevel as RiskLevel)
      : null;
  }

  function parse(f: ClinicalFormRow | null): RiskContent {
    if (!f) return { ...EMPTY };
    return { ...EMPTY, ...(f.content as Partial<RiskContent>) };
  }

  const [values, setValues] = useState<RiskContent>(() => parse(form));
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(
    parseStoredRiskLevel(form) ?? currentRiskLevel ?? "MEDIUM",
  );

  function set(key: keyof RiskContent, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancel() {
    setValues(parse(form));
    setRiskLevel(parseStoredRiskLevel(form) ?? currentRiskLevel ?? "MEDIUM");
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertClinicalForm({
        id: form?.id,
        clientId,
        formType: "RISK_ASSESSMENT",
        title: "Evaluare risc",
        content: { ...values, risk_level: riskLevel },
        status: "COMPLETE",
      });
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Evaluarea de risc a fost salvată.");
      setEditing(false);
      router.refresh();
    });
  }

  const hasData = Object.values(values).some((v) => v.trim());

  const riskColor = riskLevel === "CRISIS" || riskLevel === "HIGH"
    ? "border-destructive/40 bg-destructive/5"
    : "border-border/60 bg-card";

  return (
    <div className={`overflow-hidden rounded-[1.75rem] border shadow-sm ${riskColor}`}>
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Evaluare risc</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nivel curent: <span className="font-semibold">{RISK_LEVEL_LABELS[riskLevel]}</span>
            </p>
          </div>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            {hasData ? "Editează" : "Completează"}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="border-t border-border/40 px-6 py-4 space-y-4">
          {/* Risk level selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nivel de risc</Label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {RISK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {FIELDS.map(({ key, label, placeholder, rows }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
              <Textarea value={values[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} rows={rows} className="resize-none text-sm" />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}><X className="h-4 w-4" /> Anulează</Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}><Check className="h-4 w-4" /> Salvează</Button>
          </div>
        </div>
      ) : hasData ? (
        <div className="border-t border-border/40 divide-y divide-border/30">
          {FIELDS.filter(({ key }) => values[key].trim()).map(({ key, label }) => (
            <div key={key} className="px-6 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">{label}</p>
              <p className="text-sm whitespace-pre-wrap">{values[key]}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-sm text-muted-foreground">Evaluarea de risc nu a fost completată încă.</p>
        </div>
      )}
    </div>
  );
}
