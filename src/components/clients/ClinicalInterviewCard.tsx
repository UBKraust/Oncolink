"use client";

import { useState, useTransition } from "react";
import { Check, ClipboardList, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface InterviewContent {
  current_symptoms: string;
  functioning: string;
  precipitating_factors: string;
  maintaining_factors: string;
  client_strengths: string;
  client_goals: string;
}

const EMPTY: InterviewContent = {
  current_symptoms: "",
  functioning: "",
  precipitating_factors: "",
  maintaining_factors: "",
  client_strengths: "",
  client_goals: "",
};

const FIELDS: { key: keyof InterviewContent; label: string; placeholder: string; rows: number }[] = [
  { key: "current_symptoms",      label: "Simptome actuale",            placeholder: "Simptome principale, frecvență, intensitate, impact...", rows: 3 },
  { key: "functioning",           label: "Funcționare curentă",         placeholder: "Muncă/școală, relații, activități zilnice, somn, alimentație...", rows: 3 },
  { key: "precipitating_factors", label: "Factori precipitanți",        placeholder: "Ce a declanșat sau agravat situația actuală...", rows: 2 },
  { key: "maintaining_factors",   label: "Factori de menținere",        placeholder: "Ce menține sau întărește problema...", rows: 2 },
  { key: "client_strengths",      label: "Resurse și puncte forte",     placeholder: "Abilități, suport social, resurse interne și externe...", rows: 2 },
  { key: "client_goals",          label: "Obiectivele clientului",      placeholder: "Ce dorește să obțină din procesul terapeutic...", rows: 2 },
];

interface ClinicalInterviewCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function ClinicalInterviewCard({ clientId, form }: ClinicalInterviewCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(f: ClinicalFormRow | null): InterviewContent {
    if (!f) return { ...EMPTY };
    return { ...EMPTY, ...(f.content as Partial<InterviewContent>) };
  }

  const [savedForm, setSavedForm] = useState(form);
  const [values, setValues] = useState<InterviewContent>(() => parse(form));

  function set(key: keyof InterviewContent, value: string) {
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
        formType: "CLINICAL_INTERVIEW",
        title: "Interviu clinic",
        content: values,
        status: Object.values(values).some((v) => v.trim()) ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) { toast.error(result.error); return; }
      setSavedForm(result.form);
      setValues(parse(result.form));
      toast.success("Interviul clinic a fost salvat.");
      setEditing(false);
    });
  }

  const hasData = Object.values(values).some((v) => v.trim());

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Interviu clinic</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Psihologie clinică</p>
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
              <p className="text-sm text-foreground whitespace-pre-wrap">{values[key]}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-sm text-muted-foreground">Interviul clinic nu a fost completat încă.</p>
        </div>
      )}
    </div>
  );
}
