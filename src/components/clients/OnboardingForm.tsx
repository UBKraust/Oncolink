"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, CheckCircle2, ChevronRight, Phone, MapPin,
  UserCheck, Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { submitClientOnboarding } from "@/app/dashboard/clients/onboarding-actions";

const REFERRAL_OPTIONS = [
  { value: "MEDIC", label: "Trimitere medic" },
  { value: "FOST_PACIENT", label: "Recomandare fost pacient" },
  { value: "INTERNET", label: "Internet / Google" },
  { value: "SOCIAL_MEDIA", label: "Social media" },
  { value: "ALTUL", label: "Altul" },
];

interface Props {
  clientId: string;
  clientName: string;
  defaults?: {
    cnp_cif?: string | null;
    address?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
    referral_source?: string | null;
    referred_by_name?: string | null;
    gdpr_consent_signed?: boolean;
  };
}

export function OnboardingForm({ clientId, clientName, defaults = {} }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    cnp_cif: defaults.cnp_cif ?? "",
    address: defaults.address ?? "",
    emergency_contact_name: defaults.emergency_contact_name ?? "",
    emergency_contact_phone: defaults.emergency_contact_phone ?? "",
    emergency_contact_relation: defaults.emergency_contact_relation ?? "",
    referral_source: defaults.referral_source ?? "",
    referred_by_name: defaults.referred_by_name ?? "",
    gdpr_consent_signed: defaults.gdpr_consent_signed ?? false,
  });

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.gdpr_consent_signed) {
      setError("Consimțământul GDPR este obligatoriu.");
      return;
    }

    startTransition(async () => {
      const res = await submitClientOnboarding({
        id: clientId,
        cnp_cif: form.cnp_cif || undefined,
        address: form.address || undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_contact_phone: form.emergency_contact_phone || undefined,
        emergency_contact_relation: form.emergency_contact_relation || undefined,
        referral_source: form.referral_source || undefined,
        referred_by_name: form.referred_by_name || undefined,
        gdpr_consent_signed: form.gdpr_consent_signed,
      });

      if (!res.success) {
        setError(res.error ?? "Eroare necunoscută.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/clients/${clientId}`), 1200);
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="font-semibold text-lg">Onboarding completat!</p>
        <p className="text-sm text-muted-foreground">Redirecționare către fișa clientului…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Section: Date administrative */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Date administrative</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cnp_cif">CNP / CIF</Label>
            <Input
              id="cnp_cif"
              value={form.cnp_cif}
              onChange={(e) => set("cnp_cif", e.target.value)}
              placeholder="ex: 1900512123456"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Adresă domiciliu</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Str. Exemplu nr. 1, Oraș, Județ"
            />
          </div>
        </div>
      </section>

      {/* Section: Contact urgență */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact de urgență</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="emergency_name">Nume contact</Label>
            <Input
              id="emergency_name"
              value={form.emergency_contact_name}
              onChange={(e) => set("emergency_contact_name", e.target.value)}
              placeholder="ex: Maria Popescu"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency_phone">Telefon contact</Label>
            <Input
              id="emergency_phone"
              type="tel"
              value={form.emergency_contact_phone}
              onChange={(e) => set("emergency_contact_phone", e.target.value)}
              placeholder="+40712345678"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency_relation">Relație</Label>
            <select
              id="emergency_relation"
              value={form.emergency_contact_relation}
              onChange={(e) => set("emergency_contact_relation", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Selectează relație…</option>
              <option value="Soț/Soție">Soț / Soție</option>
              <option value="Părinte">Părinte</option>
              <option value="Frate/Soră">Frate / Soră</option>
              <option value="Prieten apropriat">Prieten apropiat</option>
              <option value="Alt">Alt</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section: Sursă trimitere */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sursă trimitere</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="referral_source">Cum a ajuns la cabinet?</Label>
            <select
              id="referral_source"
              value={form.referral_source}
              onChange={(e) => set("referral_source", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Selectează sursă…</option>
              {REFERRAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {(form.referral_source === "MEDIC" || form.referral_source === "FOST_PACIENT") && (
            <div className="space-y-1.5">
              <Label htmlFor="referred_by">
                {form.referral_source === "MEDIC" ? "Numele medicului" : "Numele recomandatorului"}
              </Label>
              <Input
                id="referred_by"
                value={form.referred_by_name}
                onChange={(e) => set("referred_by_name", e.target.value)}
                placeholder="ex: Dr. Andrei Ionescu"
              />
            </div>
          )}
        </div>
      </section>

      {/* Section: Consimțământ GDPR */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Consimțământ GDPR</h3>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors">
          <input
            type="checkbox"
            checked={form.gdpr_consent_signed}
            onChange={(e) => set("gdpr_consent_signed", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {clientName} a semnat formularul de consimțământ GDPR
            </p>
            <p className="text-xs text-muted-foreground">
              Confirm că am primit consimțământul informat al clientului pentru prelucrarea datelor cu caracter personal
              conform Regulamentului GDPR (UE) 2016/679.
            </p>
          </div>
          {form.gdpr_consent_signed && (
            <Badge variant="success" className="shrink-0 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Semnat
            </Badge>
          )}
        </label>
      </section>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/clients/${clientId}`)}
        >
          Anulează
        </Button>
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending ? "Se salvează…" : (
            <>
              Finalizează onboarding
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
