"use client";

import { useState, useTransition } from "react";
import { ActivitySquare, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface DbtProgressContent {
  target_behaviors_review: string;
  emotional_patterns: string;
  triggers_and_chain_links: string;
  skills_used_effectively: string;
  crisis_or_risk_changes: string;
  therapist_observations: string;
  next_dbt_focus: string;
}

const EMPTY: DbtProgressContent = {
  target_behaviors_review: "",
  emotional_patterns: "",
  triggers_and_chain_links: "",
  skills_used_effectively: "",
  crisis_or_risk_changes: "",
  therapist_observations: "",
  next_dbt_focus: "",
};

const FIELDS: Array<{
  key: keyof DbtProgressContent;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "target_behaviors_review",
    label: "Reevaluare comportamente țintă",
    placeholder: "Cum au evoluat comportamentele țintă și ce impact au avut în perioada recentă...",
    rows: 3,
  },
  {
    key: "emotional_patterns",
    label: "Patternuri emoționale",
    placeholder: "Ce patternuri emoționale apar recurent în diary card-uri și în ședințe...",
    rows: 3,
  },
  {
    key: "triggers_and_chain_links",
    label: "Triggeri și verigi de lanț",
    placeholder: "Situații, emoții, gânduri și contexte care preced comportamentele problematice...",
    rows: 3,
  },
  {
    key: "skills_used_effectively",
    label: "Abilități DBT folosite",
    placeholder: "Mindfulness, toleranță la distres, reglare emoțională, eficiență interpersonală...",
    rows: 2,
  },
  {
    key: "crisis_or_risk_changes",
    label: "Schimbări în risc / criză",
    placeholder: "Semne de destabilizare, elemente de protecție, schimbări față de evaluarea anterioară...",
    rows: 2,
  },
  {
    key: "therapist_observations",
    label: "Observații clinice",
    placeholder: "Observațiile terapeutului despre progres, alianță, blocaje și nevoie de ajustare...",
    rows: 2,
  },
  {
    key: "next_dbt_focus",
    label: "Focus DBT următor",
    placeholder: "Ce merită consolidat în ședințele următoare sau în planul de siguranță...",
    rows: 2,
  },
];

interface DbtProgressCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function DbtProgressCard({ clientId, form }: DbtProgressCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(value: ClinicalFormRow | null): DbtProgressContent {
    if (!value) return { ...EMPTY };
    return { ...EMPTY, ...(value.content as Partial<DbtProgressContent>) };
  }

  const [savedForm, setSavedForm] = useState(form);
  const [values, setValues] = useState<DbtProgressContent>(() => parse(form));

  function set(key: keyof DbtProgressContent, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancel() {
    setValues(parse(savedForm));
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertClinicalForm({
        id: savedForm?.id,
        clientId,
        formType: "DBT_PROGRESS",
        title: "Raport progres DBT",
        content: values,
        status: Object.values(values).some((value) => value.trim()) ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSavedForm(result.form);
      setValues(parse(result.form));
      toast.success("Raportul de progres DBT a fost salvat.");
      setEditing(false);
    });
  }

  const hasData = Object.values(values).some((value) => value.trim());

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ActivitySquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Raport progres DBT</p>
            <p className="mt-0.5 text-xs text-muted-foreground">DBT</p>
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
        <div className="space-y-4 border-t border-border/40 px-6 py-4">
          {FIELDS.map(({ key, label, placeholder, rows }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </Label>
              <Textarea
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="resize-none text-sm"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
              <X className="h-4 w-4" /> Anulează
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              <Check className="h-4 w-4" /> Salvează
            </Button>
          </div>
        </div>
      ) : hasData ? (
        <div className="divide-y divide-border/30 border-t border-border/40">
          {FIELDS.filter(({ key }) => values[key].trim()).map(({ key, label }) => (
            <div key={key} className="px-6 py-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60">
                {label}
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{values[key]}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Raportul de progres DBT nu a fost completat încă.
          </p>
        </div>
      )}
    </div>
  );
}
