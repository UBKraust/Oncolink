"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain, Pencil, X, Check, ShieldAlert, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  isServiceType,
  isRiskLevel,
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_BADGE_VARIANTS,
  SERVICE_TYPE_LABELS,
  type ServiceType,
} from "@/lib/clients/service-track";
import { updateServiceTrack } from "@/app/dashboard/clients/actions";
import type { ClientProfile } from "@/components/clients/types";

interface ClinicalContextCardProps {
  client: ClientProfile;
}

const SHOW_RISK_TYPES: ServiceType[] = ["DBT", "CLINICAL_PSYCHOLOGY"];
const SHOW_GOALS_TYPES: ServiceType[] = ["CBT", "DBT", "COUNSELING", "CLINICAL_PSYCHOLOGY"];
const SHOW_PLAN_TYPES: ServiceType[] = ["CBT", "DBT", "COUNSELING", "CLINICAL_PSYCHOLOGY"];

function RiskBadge({ level }: { level: string }) {
  if (!isRiskLevel(level)) return null;
  return (
    <Badge variant={RISK_LEVEL_BADGE_VARIANTS[level]} className="gap-1">
      <ShieldAlert className="h-3 w-3" />
      {RISK_LEVEL_LABELS[level]}
    </Badge>
  );
}

export function ClinicalContextCard({ client }: ClinicalContextCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const [mainComplaint, setMainComplaint] = useState(client.main_complaint ?? "");
  const [riskLevel, setRiskLevel] = useState(client.risk_level ?? "");
  const [treatmentPlan, setTreatmentPlan] = useState(client.treatment_plan ?? "");
  const [goals, setGoals] = useState<string[]>(
    Array.isArray(client.treatment_goals) ? (client.treatment_goals as string[]) : []
  );

  const serviceType: ServiceType = isServiceType(client.service_type) ? client.service_type : "UNDECIDED";

  if (serviceType === "UNDECIDED" || serviceType === "MIXED") return null;

  const showRisk = SHOW_RISK_TYPES.includes(serviceType);
  const showGoals = SHOW_GOALS_TYPES.includes(serviceType);
  const showPlan = SHOW_PLAN_TYPES.includes(serviceType);

  const hasAnyData =
    client.main_complaint ||
    (showRisk && client.risk_level) ||
    (showPlan && client.treatment_plan) ||
    (showGoals && goals.length > 0);

  function handleCancel() {
    setMainComplaint(client.main_complaint ?? "");
    setRiskLevel(client.risk_level ?? "");
    setTreatmentPlan(client.treatment_plan ?? "");
    setGoals(Array.isArray(client.treatment_goals) ? (client.treatment_goals as string[]) : []);
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const payload: Parameters<typeof updateServiceTrack>[1] = {};
      if (mainComplaint !== (client.main_complaint ?? "")) payload.main_complaint = mainComplaint;
      if (showRisk && riskLevel !== (client.risk_level ?? "")) {
        payload.risk_level = riskLevel || null;
      }
      if (showPlan && treatmentPlan !== (client.treatment_plan ?? "")) {
        payload.treatment_plan = treatmentPlan;
      }
      if (showGoals) {
        const currentGoals = Array.isArray(client.treatment_goals) ? (client.treatment_goals as string[]) : [];
        const filteredGoals = goals.map((g) => g.trim()).filter(Boolean);
        const changed =
          filteredGoals.length !== currentGoals.length ||
          filteredGoals.some((g, i) => g !== currentGoals[i]);
        if (changed) payload.treatment_goals = filteredGoals;
      }

      if (!Object.keys(payload).length) {
        setEditing(false);
        return;
      }

      const result = await updateServiceTrack(client.id, payload);
      if (result.success) {
        toast.success("Context clinic actualizat.");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nu am putut salva contextul clinic.");
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Context clinic</p>
            <p className="text-[11px] text-muted-foreground">{SERVICE_TYPE_LABELS[serviceType]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showRisk && client.risk_level && !editing && (
            <RiskBadge level={client.risk_level} />
          )}
          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-8 w-8 p-0 rounded-xl"
              aria-label="Editează context clinic"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
                className="h-8 w-8 p-0 rounded-xl text-muted-foreground"
                aria-label="Anulează"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending}
                className="h-8 w-8 p-0 rounded-xl"
                aria-label="Salvează"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/30 px-5">
        {/* Plângere principală — toate tipurile */}
        <div className="py-4 space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Plângere principală / motiv prezentare
          </Label>
          {editing ? (
            <Textarea
              value={mainComplaint}
              onChange={(e) => setMainComplaint(e.target.value)}
              placeholder="Descrie motivul pentru care clientul a solicitat serviciile..."
              rows={3}
              className="text-sm"
            />
          ) : client.main_complaint ? (
            <p className="text-sm text-foreground">{client.main_complaint}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Necompletat</p>
          )}
        </div>

        {/* Nivel de risc — DBT și Psihologie clinică */}
        {showRisk && (
          <div className="py-4 space-y-1.5">
            <Label
              htmlFor="risk_level_select"
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.18em]",
                serviceType === "DBT" ? "text-rose-600" : "text-muted-foreground",
              )}
            >
              Nivel de risc
              {serviceType === "DBT" && (
                <span className="ml-1 normal-case font-normal text-rose-500">(obligatoriu DBT)</span>
              )}
            </Label>
            {editing ? (
              <div className="relative">
                <Select
                  id="risk_level_select"
                  name="risk_level"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                >
                  <option value="">— Selectează —</option>
                  {RISK_LEVELS.map((r) => (
                    <option key={r} value={r}>{RISK_LEVEL_LABELS[r]}</option>
                  ))}
                </Select>
              </div>
            ) : client.risk_level ? (
              <RiskBadge level={client.risk_level} />
            ) : (
              <p className={cn(
                "text-sm italic",
                serviceType === "DBT" ? "text-rose-500" : "text-muted-foreground",
              )}>
                {serviceType === "DBT" ? "⚠ Evaluare de risc lipsă" : "Necompletat"}
              </p>
            )}
          </div>
        )}

        {/* Plan de lucru — CBT, DBT, Consiliere, Clinică */}
        {showPlan && (
          <div className="py-4 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {serviceType === "COUNSELING" ? "Plan scurt de lucru" : "Plan terapeutic"}
            </Label>
            {editing ? (
              <Textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder={
                  serviceType === "CBT"
                    ? "Descrie planul de intervenție CBT, tehnicile alese și ordinea lor..."
                    : serviceType === "DBT"
                      ? "Descrie planul DBT: module, comportamente țintă, ordinea intervențiilor..."
                      : serviceType === "COUNSELING"
                        ? "Descrie obiectivul și abordarea pe termen scurt..."
                        : "Descrie planul de evaluare și recomandările preconizate..."
                }
                rows={4}
                className="text-sm"
              />
            ) : client.treatment_plan ? (
              <p className="text-sm text-foreground whitespace-pre-line">{client.treatment_plan}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Necompletat</p>
            )}
          </div>
        )}

        {/* Obiective terapeutice — CBT, DBT, Consiliere, Clinică */}
        {showGoals && (
          <div className="py-4 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Obiective terapeutice
            </Label>
            {editing ? (
              <div className="space-y-2">
                {goals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={goal}
                      onChange={(e) => {
                        const next = [...goals];
                        next[i] = e.target.value;
                        setGoals(next);
                      }}
                      placeholder={`Obiectiv ${i + 1}...`}
                      className="text-sm h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                      className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Șterge obiectiv"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setGoals([...goals, ""])}
                  className="h-8 gap-1.5 text-xs text-primary hover:text-primary px-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adaugă obiectiv
                </Button>
              </div>
            ) : goals.length > 0 ? (
              <ul className="space-y-1">
                {goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Necompletat</p>
            )}
          </div>
        )}

        {!hasAnyData && !editing && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nu există context clinic completat.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="mt-2 text-primary hover:text-primary"
            >
              Adaugă context clinic
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
