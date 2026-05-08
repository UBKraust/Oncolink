"use client";

import { useState, useTransition } from "react";
import { Check, Compass, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface CounselingPlanContent {
  main_objective: string;
  approach: string;
  estimated_sessions: string;
  progress_indicators: string;
  notes: string;
}

const EMPTY: CounselingPlanContent = {
  main_objective: "",
  approach: "",
  estimated_sessions: "",
  progress_indicators: "",
  notes: "",
};

interface CounselingPlanCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function CounselingPlanCard({ clientId, form }: CounselingPlanCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(f: ClinicalFormRow | null): CounselingPlanContent {
    if (!f) return { ...EMPTY };
    return { ...EMPTY, ...(f.content as Partial<CounselingPlanContent>) };
  }

  const [savedForm, setSavedForm] = useState(form);
  const [values, setValues] = useState<CounselingPlanContent>(() => parse(form));

  function set(key: keyof CounselingPlanContent, value: string) {
    setValues((p) => ({ ...p, [key]: value }));
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
        formType: "COUNSELING_PLAN",
        title: "Plan de consiliere",
        content: values,
        status: values.main_objective.trim() ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) { toast.error(result.error); return; }
      setSavedForm(result.form);
      setValues(parse(result.form));
      toast.success("Planul de consiliere a fost salvat.");
      setEditing(false);
    });
  }

  const hasData = Object.values(values).some((v) => v.trim());

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Plan de consiliere</p>
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
        <div className="border-t border-border/40 px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Obiectivul principal</Label>
            <Textarea value={values.main_objective} onChange={(e) => set("main_objective", e.target.value)} placeholder="Ce urmărește clientul să obțină din consiliere..." rows={3} className="resize-none text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Abordarea terapeutică</Label>
            <Textarea value={values.approach} onChange={(e) => set("approach", e.target.value)} placeholder="Tehnici și abordări folosite (ex: centrat pe soluție, narativ, motivațional...)..." rows={2} className="resize-none text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durată estimată (nr. ședințe)</Label>
            <Input value={values.estimated_sessions} onChange={(e) => set("estimated_sessions", e.target.value)} placeholder="ex: 8–12 ședințe" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indicatori de progres</Label>
            <Textarea value={values.progress_indicators} onChange={(e) => set("progress_indicators", e.target.value)} placeholder="Cum vom ști că s-a atins obiectivul..." rows={2} className="resize-none text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note suplimentare</Label>
            <Textarea value={values.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Orice alte aspecte relevante pentru planul de consiliere..." rows={2} className="resize-none text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}><X className="h-4 w-4" /> Anulează</Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}><Check className="h-4 w-4" /> Salvează</Button>
          </div>
        </div>
      ) : hasData ? (
        <div className="border-t border-border/40 divide-y divide-border/30">
          {values.main_objective.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Obiectiv principal</p><p className="text-sm whitespace-pre-wrap">{values.main_objective}</p></div>
          )}
          {values.approach.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Abordare</p><p className="text-sm">{values.approach}</p></div>
          )}
          {values.estimated_sessions.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Durată estimată</p><p className="text-sm">{values.estimated_sessions}</p></div>
          )}
          {values.progress_indicators.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Indicatori de progres</p><p className="text-sm whitespace-pre-wrap">{values.progress_indicators}</p></div>
          )}
          {values.notes.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Note</p><p className="text-sm whitespace-pre-wrap">{values.notes}</p></div>
          )}
        </div>
      ) : (
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-sm text-muted-foreground">Planul de consiliere nu a fost completat încă.</p>
        </div>
      )}
    </div>
  );
}
