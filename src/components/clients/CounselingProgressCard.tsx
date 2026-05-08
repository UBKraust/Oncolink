"use client";

import { useState, useTransition } from "react";
import { Compass, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface CounselingProgressContent {
  current_focus: string;
  perceived_progress: string;
  strategies_used: string;
  resources_identified: string;
  recommendations_for_client: string;
  next_steps: string;
  referral_or_closure: string;
}

const EMPTY: CounselingProgressContent = {
  current_focus: "",
  perceived_progress: "",
  strategies_used: "",
  resources_identified: "",
  recommendations_for_client: "",
  next_steps: "",
  referral_or_closure: "",
};

const FIELDS: Array<{
  key: keyof CounselingProgressContent;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "current_focus",
    label: "Focus actual",
    placeholder: "Tema dominantă a etapelor recente de consiliere...",
    rows: 2,
  },
  {
    key: "perceived_progress",
    label: "Progres perceput",
    placeholder: "Cum se vede progresul clientului în raport cu obiectivul de consiliere...",
    rows: 3,
  },
  {
    key: "strategies_used",
    label: "Strategii / abordări folosite",
    placeholder: "Clarificare, reflecție, reframing, decizie, psihoeducație...",
    rows: 2,
  },
  {
    key: "resources_identified",
    label: "Resurse identificate",
    placeholder: "Resurse personale, relaționale sau contextuale activate în proces...",
    rows: 2,
  },
  {
    key: "recommendations_for_client",
    label: "Recomandări practice",
    placeholder: "Pași practicabili recomandați clientului între ședințe...",
    rows: 3,
  },
  {
    key: "next_steps",
    label: "Pașii următori",
    placeholder: "Ce urmează în procesul de consiliere sau la reevaluare...",
    rows: 2,
  },
  {
    key: "referral_or_closure",
    label: "Decizie de continuare / trimitere / închidere",
    placeholder: "Continuă, se închide, se recomandă psihoterapie sau altă direcție...",
    rows: 2,
  },
];

interface CounselingProgressCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function CounselingProgressCard({
  clientId,
  form,
}: CounselingProgressCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(value: ClinicalFormRow | null): CounselingProgressContent {
    if (!value) return { ...EMPTY };
    return { ...EMPTY, ...(value.content as Partial<CounselingProgressContent>) };
  }

  const [savedForm, setSavedForm] = useState(form);
  const [values, setValues] = useState<CounselingProgressContent>(() => parse(form));

  function set(key: keyof CounselingProgressContent, value: string) {
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
        formType: "COUNSELING_PROGRESS",
        title: "Raport progres consiliere",
        content: values,
        status: Object.values(values).some((value) => value.trim()) ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSavedForm(result.form);
      setValues(parse(result.form));
      toast.success("Raportul de progres pentru consiliere a fost salvat.");
      setEditing(false);
    });
  }

  const hasData = Object.values(values).some((value) => value.trim());

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Raport progres consiliere</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Consiliere</p>
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
            Raportul scurt de progres nu a fost completat încă.
          </p>
        </div>
      )}
    </div>
  );
}
