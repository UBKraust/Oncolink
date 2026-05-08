"use client";

import { useState, useTransition } from "react";
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
const SHOW_FOCUS_TYPES: ServiceType[] = ["CBT", "DBT", "COUNSELING", "CLINICAL_PSYCHOLOGY"];

const CLINICAL_FOCUS_SUGGESTIONS: Record<ServiceType, string[]> = {
  CLINICAL_PSYCHOLOGY: [
    "Clarificare diagnostică",
    "Simptomatologie anxioasă",
    "Simptomatologie depresivă",
    "Funcționare socio-profesională",
    "Istoric traumatic",
    "Recomandare psihiatrică",
  ],
  CBT: [
    "Gânduri automate",
    "Distorsiuni cognitive",
    "Evitare comportamentală",
    "Expunere graduală",
    "Activare comportamentală",
    "Prevenție recădere",
  ],
  DBT: [
    "Reglare emoțională",
    "Toleranță la distres",
    "Comportamente țintă",
    "Self-harm / risc",
    "Mindfulness",
    "Eficiență interpersonală",
  ],
  COUNSELING: [
    "Clarificare problemă",
    "Decizie personală",
    "Stress ocupațional",
    "Relații",
    "Resurse și coping",
    "Plan pași practici",
  ],
  MIXED: [],
  UNDECIDED: [],
};

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
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [savedMainComplaint, setSavedMainComplaint] = useState(client.main_complaint ?? "");
  const [savedClinicalFocus, setSavedClinicalFocus] = useState<string[]>(
    Array.isArray(client.clinical_focus) ? (client.clinical_focus as string[]) : [],
  );
  const [savedRiskLevel, setSavedRiskLevel] = useState(client.risk_level ?? "");
  const [savedTreatmentPlan, setSavedTreatmentPlan] = useState(client.treatment_plan ?? "");
  const [savedGoals, setSavedGoals] = useState<string[]>(
    Array.isArray(client.treatment_goals) ? (client.treatment_goals as string[]) : [],
  );
  const [mainComplaint, setMainComplaint] = useState(savedMainComplaint);
  const [clinicalFocus, setClinicalFocus] = useState<string[]>(savedClinicalFocus);
  const [riskLevel, setRiskLevel] = useState(savedRiskLevel);
  const [treatmentPlan, setTreatmentPlan] = useState(savedTreatmentPlan);
  const [goals, setGoals] = useState<string[]>(savedGoals);

  const serviceType: ServiceType = isServiceType(client.service_type) ? client.service_type : "UNDECIDED";

  if (serviceType === "UNDECIDED" || serviceType === "MIXED") return null;

  const showRisk = SHOW_RISK_TYPES.includes(serviceType);
  const showFocus = SHOW_FOCUS_TYPES.includes(serviceType);
  const showGoals = SHOW_GOALS_TYPES.includes(serviceType);
  const showPlan = SHOW_PLAN_TYPES.includes(serviceType);
  const focusSuggestions = CLINICAL_FOCUS_SUGGESTIONS[serviceType];

  const hasAnyData =
    savedMainComplaint ||
    (showFocus && savedClinicalFocus.length > 0) ||
    (showRisk && savedRiskLevel) ||
    (showPlan && savedTreatmentPlan) ||
    (showGoals && savedGoals.length > 0);

  function handleCancel() {
    setMainComplaint(savedMainComplaint);
    setClinicalFocus(savedClinicalFocus);
    setRiskLevel(savedRiskLevel);
    setTreatmentPlan(savedTreatmentPlan);
    setGoals(savedGoals);
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const payload: Parameters<typeof updateServiceTrack>[1] = {};
      if (mainComplaint !== savedMainComplaint) payload.main_complaint = mainComplaint;
      if (showFocus) {
        const filteredFocus = clinicalFocus.map((item) => item.trim()).filter(Boolean);
        const changed =
          filteredFocus.length !== savedClinicalFocus.length ||
          filteredFocus.some((item, i) => item !== savedClinicalFocus[i]);
        if (changed) payload.clinical_focus = filteredFocus;
      }
      if (showRisk && riskLevel !== savedRiskLevel) {
        payload.risk_level = riskLevel || null;
      }
      if (showPlan && treatmentPlan !== savedTreatmentPlan) {
        payload.treatment_plan = treatmentPlan;
      }
      if (showGoals) {
        const filteredGoals = goals.map((g) => g.trim()).filter(Boolean);
        const changed =
          filteredGoals.length !== savedGoals.length ||
          filteredGoals.some((g, i) => g !== savedGoals[i]);
        if (changed) payload.treatment_goals = filteredGoals;
      }

      if (!Object.keys(payload).length) {
        setEditing(false);
        return;
      }

      const result = await updateServiceTrack(client.id, payload);
      if (result.success) {
        const nextFocus = showFocus ? clinicalFocus.map((item) => item.trim()).filter(Boolean) : savedClinicalFocus;
        const nextGoals = showGoals ? goals.map((goal) => goal.trim()).filter(Boolean) : savedGoals;
        setSavedMainComplaint(mainComplaint);
        setSavedClinicalFocus(nextFocus);
        setSavedRiskLevel(riskLevel);
        setSavedTreatmentPlan(treatmentPlan);
        setSavedGoals(nextGoals);
        setClinicalFocus(nextFocus);
        setGoals(nextGoals);
        toast.success("Context clinic actualizat.");
        setEditing(false);
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
          {showRisk && savedRiskLevel && !editing && (
            <RiskBadge level={savedRiskLevel} />
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
            <p className="text-sm text-foreground">{savedMainComplaint}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Necompletat</p>
          )}
        </div>

        {showFocus && (
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Focus clinic curent
            </Label>
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {focusSuggestions.map((item) => {
                    const active = clinicalFocus.includes(item);
                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setClinicalFocus((prev) =>
                            prev.includes(item)
                              ? prev.filter((entry) => entry !== item)
                              : [...prev, item],
                          )
                        }
                        className="h-8 rounded-full px-3 text-xs"
                      >
                        {item}
                      </Button>
                    );
                  })}
                </div>
                {clinicalFocus.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {clinicalFocus.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-1 rounded-full px-3 py-1">
                        {item}
                        <button
                          type="button"
                          onClick={() =>
                            setClinicalFocus((prev) => prev.filter((entry) => entry !== item))
                          }
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`Elimină ${item}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Selectează temele dominante pentru cazul curent.
                  </p>
                )}
              </div>
            ) : clinicalFocus.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {clinicalFocus.map((item) => (
                  <Badge key={item} variant="outline" className="rounded-full px-3 py-1 normal-case">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Necompletat</p>
            )}
          </div>
        )}

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
            ) : savedRiskLevel ? (
              <RiskBadge level={savedRiskLevel} />
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
            ) : savedTreatmentPlan ? (
              <p className="text-sm text-foreground whitespace-pre-line">{savedTreatmentPlan}</p>
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
            ) : savedGoals.length > 0 ? (
              <ul className="space-y-1">
                {savedGoals.map((goal, i) => (
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
