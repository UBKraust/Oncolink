"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Pencil, X, Check, Plus, Trash2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { upsertSafetyPlan } from "@/app/dashboard/clients/actions";
import type { SafetyPlan } from "@/components/clients/types";

interface SafetyPlanCardProps {
  clientId: string;
  plan: SafetyPlan | null;
}

type SupportContact = { name: string; phone: string; relation?: string };
type ProfContact = { name: string; phone: string };

export function SafetyPlanCard({ clientId, plan }: SafetyPlanCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!plan);

  const [warningSigns, setWarningSigns] = useState(plan?.warning_signs ?? "");
  const [internalCoping, setInternalCoping] = useState(plan?.internal_coping ?? "");
  const [socialDistractions, setSocialDistractions] = useState(plan?.social_distractions ?? "");
  const [reasonsForLiving, setReasonsForLiving] = useState(plan?.reasons_for_living ?? "");
  const [safeEnvironment, setSafeEnvironment] = useState(plan?.safe_environment ?? "");
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>(
    plan?.support_contacts ?? [],
  );
  const [profContacts, setProfContacts] = useState<ProfContact[]>(
    plan?.professional_contacts ?? [],
  );

  function handleCancel() {
    setWarningSigns(plan?.warning_signs ?? "");
    setInternalCoping(plan?.internal_coping ?? "");
    setSocialDistractions(plan?.social_distractions ?? "");
    setReasonsForLiving(plan?.reasons_for_living ?? "");
    setSafeEnvironment(plan?.safe_environment ?? "");
    setSupportContacts(plan?.support_contacts ?? []);
    setProfContacts(plan?.professional_contacts ?? []);
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertSafetyPlan(clientId, {
        warning_signs: warningSigns || undefined,
        internal_coping: internalCoping || undefined,
        social_distractions: socialDistractions || undefined,
        reasons_for_living: reasonsForLiving || undefined,
        safe_environment: safeEnvironment || undefined,
        support_contacts: supportContacts.filter((c) => c.name || c.phone),
        professional_contacts: profContacts.filter((c) => c.name || c.phone),
      });
      if (result.success) {
        toast.success("Plan de siguranță salvat.");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nu am putut salva.");
      }
    });
  }

  const hasData =
    plan?.warning_signs ||
    plan?.internal_coping ||
    plan?.social_distractions ||
    plan?.reasons_for_living ||
    plan?.safe_environment ||
    (plan?.support_contacts?.length ?? 0) > 0 ||
    (plan?.professional_contacts?.length ?? 0) > 0;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-5 pb-4 pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-destructive/10 text-destructive">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">
              Plan de siguranță
            </p>
            <p className="text-[11px] text-muted-foreground">
              {hasData ? "Completat · verifică periodic" : "Necompletat — obligatoriu DBT"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Editează plan de siguranță"
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
                className="h-8 w-8 rounded-xl bg-primary p-0 text-primary-foreground hover:bg-primary/90"
                aria-label="Salvează"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/70 px-5">
        <PlanSection
          label="Semne de avertizare"
          value={warningSigns}
          editing={editing}
          onChange={setWarningSigns}
          placeholder="Gânduri, emoții, comportamente sau situații care preced o criză..."
        />
        <PlanSection
          label="Strategii interne de coping"
          value={internalCoping}
          editing={editing}
          onChange={setInternalCoping}
          placeholder="Ce pot face singur pentru a mă calma (exerciții de respirație, distragere etc.)..."
        />
        <PlanSection
          label="Distragere socială"
          value={socialDistractions}
          editing={editing}
          onChange={setSocialDistractions}
          placeholder="Locuri, activități sau persoane care pot distrage atenția de la criză..."
        />
        <PlanSection
          label="Motive pentru a trăi"
          value={reasonsForLiving}
          editing={editing}
          onChange={setReasonsForLiving}
          placeholder="Valori, persoane iubite, scopuri care merită..."
        />
        <PlanSection
          label="Siguranța mediului"
          value={safeEnvironment}
          editing={editing}
          onChange={setSafeEnvironment}
          placeholder="Obiecte periculoase de îndepărtat, persoane de contactat pentru securizarea mediului..."
        />

        {/* Contacte de suport */}
        <div className="py-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Contacte de suport (persoane de încredere)
          </Label>
          {editing ? (
            <div className="space-y-2">
              {supportContacts.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={c.name}
                    onChange={(e) => {
                      const next = [...supportContacts];
                      next[i] = { ...c, name: e.target.value };
                      setSupportContacts(next);
                    }}
                    placeholder="Nume"
                    className="text-sm flex-1"
                  />
                  <Input
                    value={c.phone}
                    onChange={(e) => {
                      const next = [...supportContacts];
                      next[i] = { ...c, phone: e.target.value };
                      setSupportContacts(next);
                    }}
                    placeholder="Telefon"
                    className="text-sm flex-1"
                  />
                  <Input
                    value={c.relation ?? ""}
                    onChange={(e) => {
                      const next = [...supportContacts];
                      next[i] = { ...c, relation: e.target.value };
                      setSupportContacts(next);
                    }}
                    placeholder="Relație"
                    className="text-sm w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSupportContacts(supportContacts.filter((_, j) => j !== i))}
                    className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSupportContacts([...supportContacts, { name: "", phone: "" }])}
                className="h-8 gap-1.5 px-2 text-xs text-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Adaugă contact
              </Button>
            </div>
          ) : supportContacts.length > 0 ? (
            <ul className="space-y-1.5">
              {supportContacts.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{c.name}</span>
                  {c.relation && <span className="text-muted-foreground text-xs">({c.relation})</span>}
                  <span className="text-muted-foreground ml-auto">{c.phone}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Niciun contact adăugat</p>
          )}
        </div>

        {/* Contacte profesionale */}
        <div className="py-4 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Contacte profesionale (terapeut, linie de criză)
          </Label>
          {editing ? (
            <div className="space-y-2">
              {profContacts.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={c.name}
                    onChange={(e) => {
                      const next = [...profContacts];
                      next[i] = { ...c, name: e.target.value };
                      setProfContacts(next);
                    }}
                    placeholder="Nume / serviciu"
                    className="text-sm flex-1"
                  />
                  <Input
                    value={c.phone}
                    onChange={(e) => {
                      const next = [...profContacts];
                      next[i] = { ...c, phone: e.target.value };
                      setProfContacts(next);
                    }}
                    placeholder="Telefon"
                    className="text-sm flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setProfContacts(profContacts.filter((_, j) => j !== i))}
                    className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setProfContacts([...profContacts, { name: "", phone: "" }])}
                className="h-8 gap-1.5 px-2 text-xs text-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Adaugă contact profesional
              </Button>
            </div>
          ) : profContacts.length > 0 ? (
            <ul className="space-y-1.5">
              {profContacts.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground ml-auto">{c.phone}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Niciun contact adăugat</p>
          )}
        </div>

        {!hasData && !editing && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Planul de siguranță nu a fost completat.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="mt-2 text-primary hover:text-primary"
            >
              Completează acum
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function PlanSection({
  label,
  value,
  editing,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="py-4 space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </Label>
      {editing ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="text-sm"
        />
      ) : value ? (
        <p className="text-sm text-foreground whitespace-pre-line">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Necompletat</p>
      )}
    </div>
  );
}
