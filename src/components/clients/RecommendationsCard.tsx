"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface RecommendationsContent {
  recommendations: string[];
  resources: string;
  follow_up_plan: string;
  observations: string;
}

const EMPTY: RecommendationsContent = {
  recommendations: [],
  resources: "",
  follow_up_plan: "",
  observations: "",
};

interface RecommendationsCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function RecommendationsCard({ clientId, form }: RecommendationsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(f: ClinicalFormRow | null): RecommendationsContent {
    if (!f) return { ...EMPTY };
    const c = f.content as Partial<RecommendationsContent>;
    return { recommendations: c.recommendations ?? [], resources: c.resources ?? "", follow_up_plan: c.follow_up_plan ?? "", observations: c.observations ?? "" };
  }

  const [values, setValues] = useState<RecommendationsContent>(() => parse(form));
  const [newRec, setNewRec] = useState("");

  function handleCancel() {
    setValues(parse(form));
    setNewRec("");
    setEditing(false);
  }

  function addRec() {
    if (!newRec.trim()) return;
    setValues((p) => ({ ...p, recommendations: [...p.recommendations, newRec.trim()] }));
    setNewRec("");
  }

  function removeRec(i: number) {
    setValues((p) => ({ ...p, recommendations: p.recommendations.filter((_, idx) => idx !== i) }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertClinicalForm({
        id: form?.id,
        clientId,
        formType: "RECOMMENDATIONS",
        title: "Fișă recomandări",
        content: values,
        status: values.recommendations.length > 0 ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Fișa de recomandări a fost salvată.");
      setEditing(false);
      router.refresh();
    });
  }

  const hasData = values.recommendations.length > 0 || values.resources.trim() || values.follow_up_plan.trim();

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Fișă recomandări</p>
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
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recomandări principale</Label>
            {values.recommendations.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm">• {r}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeRec(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newRec} onChange={(e) => setNewRec(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRec())} placeholder="Adaugă o recomandare..." className="text-sm" />
              <Button variant="outline" size="sm" onClick={addRec}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resurse recomandate</Label>
            <Textarea value={values.resources} onChange={(e) => setValues((p) => ({ ...p, resources: e.target.value }))} placeholder="Cărți, aplicații, grupuri de suport, alte resurse..." rows={2} className="resize-none text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan de urmărire</Label>
            <Textarea value={values.follow_up_plan} onChange={(e) => setValues((p) => ({ ...p, follow_up_plan: e.target.value }))} placeholder="Frecvență follow-up, condiții de recontactare, resurse de urgență..." rows={2} className="resize-none text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observații finale</Label>
            <Textarea value={values.observations} onChange={(e) => setValues((p) => ({ ...p, observations: e.target.value }))} placeholder="Orice observații relevante la finalul procesului de consiliere..." rows={2} className="resize-none text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}><X className="h-4 w-4" /> Anulează</Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}><Check className="h-4 w-4" /> Salvează</Button>
          </div>
        </div>
      ) : hasData ? (
        <div className="border-t border-border/40 divide-y divide-border/30">
          {values.recommendations.length > 0 && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-2">Recomandări</p><ul className="space-y-1">{values.recommendations.map((r, i) => <li key={i} className="text-sm">• {r}</li>)}</ul></div>
          )}
          {values.resources.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Resurse</p><p className="text-sm whitespace-pre-wrap">{values.resources}</p></div>
          )}
          {values.follow_up_plan.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Plan urmărire</p><p className="text-sm whitespace-pre-wrap">{values.follow_up_plan}</p></div>
          )}
          {values.observations.trim() && (
            <div className="px-6 py-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Observații</p><p className="text-sm whitespace-pre-wrap">{values.observations}</p></div>
          )}
        </div>
      ) : (
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-sm text-muted-foreground">Fișa de recomandări nu a fost completată încă.</p>
        </div>
      )}
    </div>
  );
}
