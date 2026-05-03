"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, HandshakeIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { upsertClinicalForm } from "@/app/dashboard/forms/forms-actions";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

interface CommitmentContent {
  client_commitments: string[];
  therapy_goals: string[];
  primary_target_behaviors: string;
  client_agreement: string;
}

const EMPTY: CommitmentContent = {
  client_commitments: [],
  therapy_goals: [],
  primary_target_behaviors: "",
  client_agreement: "",
};

interface DbtCommitmentCardProps {
  clientId: string;
  form: ClinicalFormRow | null;
}

export function DbtCommitmentCard({ clientId, form }: DbtCommitmentCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!form);

  function parse(f: ClinicalFormRow | null): CommitmentContent {
    if (!f) return { ...EMPTY };
    const c = f.content as Partial<CommitmentContent>;
    return {
      client_commitments: c.client_commitments ?? [],
      therapy_goals: c.therapy_goals ?? [],
      primary_target_behaviors: c.primary_target_behaviors ?? "",
      client_agreement: c.client_agreement ?? "",
    };
  }

  const [values, setValues] = useState<CommitmentContent>(() => parse(form));
  const [newCommitment, setNewCommitment] = useState("");
  const [newGoal, setNewGoal] = useState("");

  function handleCancel() {
    setValues(parse(form));
    setNewCommitment("");
    setNewGoal("");
    setEditing(false);
  }

  function addCommitment() {
    if (!newCommitment.trim()) return;
    setValues((p) => ({ ...p, client_commitments: [...p.client_commitments, newCommitment.trim()] }));
    setNewCommitment("");
  }

  function removeCommitment(i: number) {
    setValues((p) => ({ ...p, client_commitments: p.client_commitments.filter((_, idx) => idx !== i) }));
  }

  function addGoal() {
    if (!newGoal.trim()) return;
    setValues((p) => ({ ...p, therapy_goals: [...p.therapy_goals, newGoal.trim()] }));
    setNewGoal("");
  }

  function removeGoal(i: number) {
    setValues((p) => ({ ...p, therapy_goals: p.therapy_goals.filter((_, idx) => idx !== i) }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertClinicalForm({
        id: form?.id,
        clientId,
        formType: "DBT_COMMITMENT",
        title: "Angajament terapeutic DBT",
        content: values,
        status: values.client_commitments.length > 0 || values.therapy_goals.length > 0 ? "COMPLETE" : "DRAFT",
      });
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Angajamentul terapeutic a fost salvat.");
      setEditing(false);
      router.refresh();
    });
  }

  const hasData = values.client_commitments.length > 0 || values.therapy_goals.length > 0 || values.primary_target_behaviors.trim();

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HandshakeIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Angajament terapeutic DBT</p>
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
        <div className="border-t border-border/40 px-6 py-4 space-y-5">
          {/* Commitments */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Angajamentele clientului</Label>
            {values.client_commitments.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-foreground">• {c}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeCommitment(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newCommitment} onChange={(e) => setNewCommitment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCommitment())} placeholder="Adaugă un angajament..." className="text-sm" />
              <Button variant="outline" size="sm" onClick={addCommitment}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Therapy goals */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Obiective terapeutice DBT</Label>
            {values.therapy_goals.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-foreground">• {g}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeGoal(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())} placeholder="Adaugă un obiectiv..." className="text-sm" />
              <Button variant="outline" size="sm" onClick={addGoal}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Target behaviors */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comportamente țintă principale</Label>
            <Textarea value={values.primary_target_behaviors} onChange={(e) => setValues((p) => ({ ...p, primary_target_behaviors: e.target.value }))} placeholder="Comportamentele prioritare de lucrat în terapie..." rows={2} className="resize-none text-sm" />
          </div>

          {/* Agreement */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acordul clientului</Label>
            <Textarea value={values.client_agreement} onChange={(e) => setValues((p) => ({ ...p, client_agreement: e.target.value }))} placeholder="Formularea acordului verbal sau scris al clientului..." rows={2} className="resize-none text-sm" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}><X className="h-4 w-4" /> Anulează</Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}><Check className="h-4 w-4" /> Salvează</Button>
          </div>
        </div>
      ) : hasData ? (
        <div className="border-t border-border/40 divide-y divide-border/30">
          {values.client_commitments.length > 0 && (
            <div className="px-6 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-2">Angajamentele clientului</p>
              <ul className="space-y-1">{values.client_commitments.map((c, i) => <li key={i} className="text-sm">• {c}</li>)}</ul>
            </div>
          )}
          {values.therapy_goals.length > 0 && (
            <div className="px-6 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-2">Obiective terapeutice DBT</p>
              <ul className="space-y-1">{values.therapy_goals.map((g, i) => <li key={i} className="text-sm">• {g}</li>)}</ul>
            </div>
          )}
          {values.primary_target_behaviors.trim() && (
            <div className="px-6 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">Comportamente țintă</p>
              <p className="text-sm whitespace-pre-wrap">{values.primary_target_behaviors}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-sm text-muted-foreground">Angajamentul terapeutic nu a fost completat încă.</p>
        </div>
      )}
    </div>
  );
}
