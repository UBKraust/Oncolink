"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface AnamnesisContent {
  chief_complaint: string;
  history_of_problem: string;
  personal_history: string;
  family_history: string;
  medical_history: string;
  mental_status: string;
  observations: string;
}

const EMPTY: AnamnesisContent = {
  chief_complaint: "",
  history_of_problem: "",
  personal_history: "",
  family_history: "",
  medical_history: "",
  mental_status: "",
  observations: "",
};

const FIELDS: { key: keyof AnamnesisContent; label: string; placeholder: string; rows: number }[] = [
  { key: "chief_complaint",    label: "Motiv de prezentare",        placeholder: "Simptome principale, cum le descrie clientul...", rows: 3 },
  { key: "history_of_problem", label: "Istoricul problemei",         placeholder: "Debut, evoluție, episoade anterioare, tratamente...", rows: 4 },
  { key: "personal_history",   label: "Antecedente personale",       placeholder: "Dezvoltare, educație, relații, Evenimente de viață semnificative...", rows: 3 },
  { key: "family_history",     label: "Antecedente familiale",       placeholder: "Structura familiei, relații, afecțiuni relevante în familie...", rows: 3 },
  { key: "medical_history",    label: "Istoric medical",             placeholder: "Boli cronice, medicamente, internări, alergii...", rows: 2 },
  { key: "mental_status",      label: "Status mental (observații)",  placeholder: "Aspect, comportament, vorbire, dispoziție, gândire, orientare...", rows: 3 },
  { key: "observations",       label: "Alte observații",             placeholder: "Orice alte aspecte relevante...", rows: 2 },
];

interface AnamnesisCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function AnamnesisCard({ clientId, form }: AnamnesisCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(f: ClinicalFormRow | null): AnamnesisContent {
    if (!f) return { ...EMPTY };
    const c = f.content as Partial<AnamnesisContent>;
    return { ...EMPTY, ...c };
  }

  const [values, setValues] = useState<AnamnesisContent>(() => parse(form));

  function handleCancel() {
    setValues(parse(form));
    setEditing(false);
  }

  function set(key: keyof AnamnesisContent, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertClinicalForm({
        id: form?.id,
        clientId,
        formType: "ANAMNESIS",
        title: "Fișă anamneză",
        content: values,
        status: Object.values(values).some((v) => v.trim()) ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Fișa de anamneză a fost salvată.");
      setEditing(false);
      router.refresh();
    });
  }

  const hasData = Object.values(values).some((v) => v.trim());

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-foreground">Fișă anamneză</p>
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
          <p className="text-sm text-muted-foreground">Fișa de anamneză nu a fost completată încă.</p>
        </div>
      )}
    </div>
  );
}
