"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Pencil, X, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { upsertCbtCaseFormulation } from "@/app/dashboard/clients/actions";
import type { CbtCaseFormulation } from "@/components/clients/types";

interface CbtCaseFormulationCardProps {
  clientId: string;
  formulation: CbtCaseFormulation | null;
}

const TEXT_FIELDS: Array<{
  key: keyof Pick<
    CbtCaseFormulation,
    | "presenting_problem"
    | "automatic_thoughts"
    | "core_beliefs"
    | "behavioral_patterns"
    | "triggering_situations"
    | "maintenance_factors"
    | "strengths"
  >;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "presenting_problem",
    label: "Problemă principală",
    placeholder: "Descriere prezentare inițială, simptome, impact funcțional...",
    rows: 3,
  },
  {
    key: "triggering_situations",
    label: "Situații declanșatoare",
    placeholder: "Contexte, persoane, locuri sau evenimente care precipită dificultăți...",
    rows: 2,
  },
  {
    key: "automatic_thoughts",
    label: "Gânduri automate",
    placeholder: "Gânduri automate recurente identificate (ex: 'Nu sunt suficient de bun')...",
    rows: 3,
  },
  {
    key: "core_beliefs",
    label: "Credințe centrale",
    placeholder: "Credințele adânci despre sine, ceilalți și lume...",
    rows: 2,
  },
  {
    key: "behavioral_patterns",
    label: "Tipare comportamentale",
    placeholder: "Comportamente de evitare, compensare, supracompensare...",
    rows: 2,
  },
  {
    key: "maintenance_factors",
    label: "Factori de menținere",
    placeholder: "Ce menține problema activă (ciclu cognitiv-emoțional-comportamental)...",
    rows: 2,
  },
  {
    key: "strengths",
    label: "Resurse și puncte forte",
    placeholder: "Abilități existente, suport social, motivație...",
    rows: 2,
  },
];

export function CbtCaseFormulationCard({
  clientId,
  formulation,
}: CbtCaseFormulationCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!formulation);

  const [fields, setFields] = useState<Record<string, string>>({
    presenting_problem: formulation?.presenting_problem ?? "",
    automatic_thoughts: formulation?.automatic_thoughts ?? "",
    core_beliefs: formulation?.core_beliefs ?? "",
    behavioral_patterns: formulation?.behavioral_patterns ?? "",
    triggering_situations: formulation?.triggering_situations ?? "",
    maintenance_factors: formulation?.maintenance_factors ?? "",
    strengths: formulation?.strengths ?? "",
  });
  const [distortions, setDistortions] = useState<string[]>(
    formulation?.cognitive_distortions ?? [],
  );
  const [newDistortion, setNewDistortion] = useState("");

  function handleCancel() {
    setFields({
      presenting_problem: formulation?.presenting_problem ?? "",
      automatic_thoughts: formulation?.automatic_thoughts ?? "",
      core_beliefs: formulation?.core_beliefs ?? "",
      behavioral_patterns: formulation?.behavioral_patterns ?? "",
      triggering_situations: formulation?.triggering_situations ?? "",
      maintenance_factors: formulation?.maintenance_factors ?? "",
      strengths: formulation?.strengths ?? "",
    });
    setDistortions(formulation?.cognitive_distortions ?? []);
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertCbtCaseFormulation(clientId, {
        ...Object.fromEntries(
          Object.entries(fields).map(([k, v]) => [k, v || undefined]),
        ),
        cognitive_distortions: distortions.filter(Boolean),
      });
      if (result.success) {
        toast.success("Formulare de caz salvat.");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nu am putut salva.");
      }
    });
  }

  const hasData = Object.values(fields).some(Boolean) || distortions.length > 0;

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-primary/10">
            <FlaskConical className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Formulare de caz CBT</p>
            <p className="text-[11px] text-muted-foreground">
              {hasData ? "Completat" : "Necompletat"}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground"
              aria-label="Editează formulare"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/30 px-5">
        {TEXT_FIELDS.map((f) => (
          <div key={f.key} className="py-4 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {f.label}
            </Label>
            {editing ? (
              <Textarea
                value={fields[f.key]}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={f.rows}
                className="text-sm"
              />
            ) : fields[f.key] ? (
              <p className="text-sm text-foreground whitespace-pre-line">{fields[f.key]}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Necompletat</p>
            )}
          </div>
        ))}

        {/* Distorsiuni cognitive */}
        <div className="py-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Distorsiuni cognitive identificate
          </Label>
          {editing ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {distortions.map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => setDistortions(distortions.filter((_, j) => j !== i))}
                      className="ml-0.5 hover:text-destructive"
                      aria-label={`Șterge ${d}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newDistortion}
                  onChange={(e) => setNewDistortion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newDistortion.trim()) {
                      setDistortions([...distortions, newDistortion.trim()]);
                      setNewDistortion("");
                    }
                  }}
                  placeholder="Ex: Gândire dihotomică, Catastrofizare..."
                  className="text-sm h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newDistortion.trim()) {
                      setDistortions([...distortions, newDistortion.trim()]);
                      setNewDistortion("");
                    }
                  }}
                  disabled={!newDistortion.trim()}
                  className="h-9 rounded-xl gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adaugă
                </Button>
              </div>
            </div>
          ) : distortions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {distortions.map((d, i) => (
                <span
                  key={i}
                  className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {d}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nicio distorsiune identificată</p>
          )}
        </div>

        {!hasData && !editing && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Formularul de caz CBT nu a fost completat.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="mt-2 text-primary hover:text-primary"
            >
              Completează formularul
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
