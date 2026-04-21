"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Baby, CheckCircle2, ChevronRight, FileScan,
  Phone, Upload, UserCheck, Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { submitMinorOnboarding } from "@/app/dashboard/clients/onboarding-actions";

const MARITAL_OPTIONS = [
  { value: "CASATORITI", label: "Căsătoriți" },
  { value: "DIVORTATI_CUSTODIE_COMUNA", label: "Divorțați — custodie comună" },
  { value: "DIVORTATI_CUSTODIE_EXCLUSIVA", label: "Divorțați — custodie exclusivă" },
  { value: "ALTUL", label: "Alt statut" },
];

const REFERRAL_OPTIONS = [
  { value: "MEDIC", label: "Trimitere medic" },
  { value: "FOST_PACIENT", label: "Recomandare fost pacient" },
  { value: "INTERNET", label: "Internet / Google" },
  { value: "SOCIAL_MEDIA", label: "Social media" },
  { value: "ALTUL", label: "Altul" },
];

export function MinorOnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const custodyFileRef = useRef<HTMLInputElement>(null);
  const [custodyFile, setCustodyFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    cnp_cif: "",
    address: "",
    // Parent 1
    parent_1_name: "",
    parent_1_phone: "",
    parent_1_email: "",
    // Parent 2
    parent_2_name: "",
    parent_2_phone: "",
    parent_2_email: "",
    // Legal
    parents_marital_status: "CASATORITI",
    // Referral
    referral_source: "",
    referred_by_name: "",
    // GDPR
    gdpr_consent_signed: false,
  });

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const needsCustody =
    form.parents_marital_status === "DIVORTATI_CUSTODIE_COMUNI" ||
    form.parents_marital_status === "DIVORTATI_CUSTODIE_EXCLUSIVA";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim()) {
      setError("Numele minorului este obligatoriu.");
      return;
    }
    if (!form.parent_1_name.trim()) {
      setError("Numele părintelui / tutorelui este obligatoriu.");
      return;
    }
    if (!form.gdpr_consent_signed) {
      setError("Consimțământul GDPR este obligatoriu.");
      return;
    }

    startTransition(async () => {
      const res = await submitMinorOnboarding(
        {
          id: "",
          full_name: form.full_name,
          cnp_cif: form.cnp_cif || undefined,
          address: form.address || undefined,
          parent_1_name: form.parent_1_name,
          parent_1_phone: form.parent_1_phone || undefined,
          parent_1_email: form.parent_1_email || undefined,
          parent_2_name: form.parent_2_name || undefined,
          parent_2_phone: form.parent_2_phone || undefined,
          parent_2_email: form.parent_2_email || undefined,
          parents_marital_status: form.parents_marital_status,
          referral_source: form.referral_source || undefined,
          referred_by_name: form.referred_by_name || undefined,
          gdpr_consent_signed: form.gdpr_consent_signed,
          is_minor: true,
        },
        custodyFile ? { custody: custodyFile } : undefined,
      );

      if (!res.success) {
        setError(res.error ?? "Eroare necunoscută.");
        return;
      }

      setSuccess(true);
      setTimeout(
        () => router.push(res.id ? `/dashboard/clients/${res.id}` : "/dashboard/clients"),
        1200,
      );
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="font-semibold text-lg">Pacient minor înregistrat!</p>
        <p className="text-sm text-muted-foreground">Redirecționare…</p>
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

      {/* Date minor */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Baby className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Date pacient minor</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="full_name">Nume complet minor <span className="text-rose-500">*</span></Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="ex: Andrei Popescu"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnp_cif">CNP minor</Label>
            <Input
              id="cnp_cif"
              value={form.cnp_cif}
              onChange={(e) => set("cnp_cif", e.target.value)}
              placeholder="ex: 5120301123456"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Adresă</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Str. Exemplu nr. 1, Oraș"
            />
          </div>
        </div>
      </section>

      {/* Părinte 1 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Părinte / Tutore 1</h3>
          <Badge variant="secondary" className="text-[10px]">Principal</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p1_name">Nume complet <span className="text-rose-500">*</span></Label>
            <Input
              id="p1_name"
              value={form.parent_1_name}
              onChange={(e) => set("parent_1_name", e.target.value)}
              placeholder="ex: Maria Popescu"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p1_phone">Telefon</Label>
            <Input
              id="p1_phone"
              type="tel"
              value={form.parent_1_phone}
              onChange={(e) => set("parent_1_phone", e.target.value)}
              placeholder="+40712345678"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p1_email">Email</Label>
            <Input
              id="p1_email"
              type="email"
              value={form.parent_1_email}
              onChange={(e) => set("parent_1_email", e.target.value)}
              placeholder="mama@email.com"
            />
          </div>
        </div>
      </section>

      {/* Părinte 2 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Părinte / Tutore 2</h3>
          <span className="text-xs text-muted-foreground">(opțional)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p2_name">Nume complet</Label>
            <Input
              id="p2_name"
              value={form.parent_2_name}
              onChange={(e) => set("parent_2_name", e.target.value)}
              placeholder="ex: Ion Popescu"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p2_phone">Telefon</Label>
            <Input
              id="p2_phone"
              type="tel"
              value={form.parent_2_phone}
              onChange={(e) => set("parent_2_phone", e.target.value)}
              placeholder="+40712345678"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p2_email">Email</Label>
            <Input
              id="p2_email"
              type="email"
              value={form.parent_2_email}
              onChange={(e) => set("parent_2_email", e.target.value)}
              placeholder="tata@email.com"
            />
          </div>
        </div>
      </section>

      {/* Status familial & documente legale */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status familial & acte legale</h3>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marital_status">Status marital părinți</Label>
          <select
            id="marital_status"
            value={form.parents_marital_status}
            onChange={(e) => set("parents_marital_status", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {MARITAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {needsCustody && (
          <div className="space-y-2">
            <Label>Document custodie / acord părinți</Label>
            <div
              onClick={() => custodyFileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
                custodyFile
                  ? "border-emerald-400 bg-emerald-50/40 dark:border-emerald-700"
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
              }`}
            >
              <input
                ref={custodyFileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => setCustodyFile(e.target.files?.[0] ?? null)}
              />
              {custodyFile ? (
                <>
                  <FileScan className="h-6 w-6 text-emerald-500 mb-1" />
                  <p className="text-sm font-medium truncate max-w-xs">{custodyFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(custodyFile.size / 1024).toFixed(0)} KB</p>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-sm">Sentință custodie / acord</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Sursă trimitere */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sursă trimitere</h3>
          <span className="text-xs text-muted-foreground">(opțional)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="referral_source_m">Cum a ajuns la cabinet?</Label>
            <select
              id="referral_source_m"
              value={form.referral_source}
              onChange={(e) => set("referral_source", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Selectează…</option>
              {REFERRAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {(form.referral_source === "MEDIC" || form.referral_source === "FOST_PACIENT") && (
            <div className="space-y-1.5">
              <Label htmlFor="referred_by_m">
                {form.referral_source === "MEDIC" ? "Numele medicului" : "Numele recomandatorului"}
              </Label>
              <Input
                id="referred_by_m"
                value={form.referred_by_name}
                onChange={(e) => set("referred_by_name", e.target.value)}
                placeholder="ex: Dr. Andrei Ionescu"
              />
            </div>
          )}
        </div>
      </section>

      {/* GDPR */}
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
            <p className="text-sm font-medium">Părintele / tutorele a semnat consimțământul GDPR</p>
            <p className="text-xs text-muted-foreground">
              Confirm că am primit consimțământul informat al reprezentantului legal pentru prelucrarea
              datelor cu caracter personal ale minorului, conform GDPR (UE) 2016/679.
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
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/clients")}>
          Anulează
        </Button>
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending ? "Se salvează…" : (
            <>
              Înregistrează pacient minor
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
