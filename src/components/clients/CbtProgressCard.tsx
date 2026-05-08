"use client";

import { useState, useTransition } from "react";
import { Activity, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface CbtProgressContent {
  progress_summary: string;
  progress_toward_goals: string;
  symptom_changes: string;
  interventions_used: string;
  homework_followthrough: string;
  blockers: string;
  next_focus: string;
}

const EMPTY: CbtProgressContent = {
  progress_summary: "",
  progress_toward_goals: "",
  symptom_changes: "",
  interventions_used: "",
  homework_followthrough: "",
  blockers: "",
  next_focus: "",
};

const FIELDS: Array<{
  key: keyof CbtProgressContent;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "progress_summary",
    label: "Sumar progres",
    placeholder: "Rezumat scurt al evoluției din ultimele ședințe...",
    rows: 3,
  },
  {
    key: "progress_toward_goals",
    label: "Progres față de obiective",
    placeholder: "Ce obiective avansează, ce rămâne blocat, ce s-a consolidat...",
    rows: 3,
  },
  {
    key: "symptom_changes",
    label: "Schimbări simptomatice",
    placeholder: "Evoluția anxietății, dispoziției, evitării, somnului, activării...",
    rows: 3,
  },
  {
    key: "interventions_used",
    label: "Intervenții folosite",
    placeholder: "Tehnici CBT aplicate: restructurare cognitivă, expunere, activare...",
    rows: 2,
  },
  {
    key: "homework_followthrough",
    label: "Aderență la teme",
    placeholder: "Cum s-a raportat clientul la temele pentru acasă și ce a funcționat...",
    rows: 2,
  },
  {
    key: "blockers",
    label: "Blocaje / factori de menținere",
    placeholder: "Ce continuă să mențină dificultatea sau să încetinească progresul...",
    rows: 2,
  },
  {
    key: "next_focus",
    label: "Focus ședințele următoare",
    placeholder: "Ce merită urmărit sau consolidat în etapa imediat următoare...",
    rows: 2,
  },
];

interface CbtProgressCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function CbtProgressCard({ clientId, form }: CbtProgressCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(value: ClinicalFormRow | null): CbtProgressContent {
    if (!value) return { ...EMPTY };
    return { ...EMPTY, ...(value.content as Partial<CbtProgressContent>) };
  }

  const [savedForm, setSavedForm] = useState(form);
  const [values, setValues] = useState<CbtProgressContent>(() => parse(form));

  function set(key: keyof CbtProgressContent, value: string) {
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
        formType: "CBT_PROGRESS",
        title: "Raport progres CBT",
        content: values,
        status: Object.values(values).some((value) => value.trim()) ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSavedForm(result.form);
      setValues(parse(result.form));
      toast.success("Raportul de progres CBT a fost salvat.");
      setEditing(false);
    });
  }

  const hasData = Object.values(values).some((value) => value.trim());

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Raport progres CBT</p>
            <p className="mt-0.5 text-xs text-muted-foreground">CBT</p>
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
            Raportul de progres CBT nu a fost completat încă.
          </p>
        </div>
      )}
    </div>
  );
}
