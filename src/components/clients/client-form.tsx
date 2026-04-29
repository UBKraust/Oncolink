"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createClientOnboardingLink } from "@/app/dashboard/clients/onboarding-actions";
import { CheckCircle2, Copy, ExternalLink, UserPlus, FileCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import type { ClientFormState } from "@/lib/clients/form-state";

type Defaults = Partial<{
  full_name: string;
  email: string;
  phone: string;
  cnp_cif: string;
  address: string;
  date_of_birth: string;
  client_id_series: string;
  client_id_number: string;
  gdpr_consent_signed: boolean;
  location: string;
  is_minor: boolean;
  minor_cnp: string;
  parent_name: string;
  parent_phone: string;
  parent_1_email: string;
  parent_cnp: string;
  parent_address: string;
  parent_id_series: string;
  parent_id_number: string;
  billing_type: string;
  company_name: string;
  company_address: string;
  company_iban: string;
  company_bank: string;
  company_representative_name: string;
  company_representative_email: string;
  company_representative_role: string;
  company_reg_com: string;
  session_price: string;
  session_frequency: string;
  report_frequency: string;
  send_report_to_parent: boolean;
}>;

interface ClientFormProps {
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaults?: Defaults;
  submitLabel: string;
  cancelHref: string;
}

const initialState: ClientFormState = { error: null, fieldErrors: {} };

export function ClientForm({ action, defaults = {}, submitLabel, cancelHref }: ClientFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [isMinor, setIsMinor] = useState(defaults.is_minor ?? false);
  const [billingType, setBillingType] = useState(defaults.billing_type ?? "INDIVIDUAL");
  const [dismissedSuccess, setDismissedSuccess] = useState(false);
  const showSuccess = Boolean(state.success && state.clientId) && !dismissedSuccess;
  const globalErrorId = state.error ? "client-form-error" : undefined;

  const copyOnboardingLink = async () => {
    if (typeof window === "undefined" || !state.clientId) return;
    const result = await createClientOnboardingLink(state.clientId);
    if (result.error || !result.data?.url) {
      toast.error(result.error ?? "Nu am putut genera linkul de onboarding.");
      return;
    }

    const url = result.data.url;
    navigator.clipboard.writeText(url);
    toast.success("Link copiat în clipboard!");
  };

  return (
    <>
      <form action={formAction} className="space-y-6">
        {state.error ? (
          <div
            id="client-form-error"
            role="alert"
            className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Nume complet"
            name="full_name"
            required
            defaultValue={defaults.full_name}
            error={state.fieldErrors.full_name}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={defaults.email}
            error={state.fieldErrors.email}
          />
          <Field
            label="Telefon"
            name="phone"
            placeholder="+40722111222"
            defaultValue={defaults.phone}
            error={state.fieldErrors.phone}
          />
          <Field
            label="CNP / CIF"
            name="cnp_cif"
            hint={isMinor ? "Pentru minor, aici se poate păstra CNP-ul reprezentantului legal / plătitorului." : "Necesar pentru e-Factura SmartBill."}
            defaultValue={defaults.cnp_cif}
            error={state.fieldErrors.cnp_cif}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Data nașterii"
            name="date_of_birth"
            type="date"
            defaultValue={defaults.date_of_birth}
            error={state.fieldErrors.date_of_birth}
          />
          <Field
            label="Serie CI"
            name="client_id_series"
            placeholder="RX"
            defaultValue={defaults.client_id_series}
            error={state.fieldErrors.client_id_series}
          />
          <Field
            label="Număr CI"
            name="client_id_number"
            placeholder="123456"
            defaultValue={defaults.client_id_number}
            error={state.fieldErrors.client_id_number}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Adresă</Label>
          <Textarea
            id="address"
            name="address"
            rows={3}
            defaultValue={defaults.address ?? ""}
          />
          {state.fieldErrors.address ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.address}</p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location">Locație</Label>
            <select
              id="location"
              name="location"
              defaultValue={defaults.location ?? "CABINET_PARTICULAR"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="CABINET_PARTICULAR">Cabinet Particular</option>
              <option value="CLINICA">Clinică</option>
            </select>
          </div>

          <Field
            label="Preț ședință (RON)"
            name="session_price"
            type="number"
            placeholder="ex. 250"
            defaultValue={defaults.session_price}
            error={state.fieldErrors.session_price}
            hint="Opțional. Poate fi definit și la programare."
          />
        </div>

        <div className="space-y-4 rounded-md border p-4 bg-muted/20">
          <h3 className="text-sm font-medium">Demografice & Facturare</h3>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  name="is_minor"
                  className="h-4 w-4 rounded border-input"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                />
                Pacientul este minor (sub 18 ani)
              </label>

              {isMinor && (
                <div className="space-y-4 rounded bg-background p-3 border">
                  <Field
                    label="Nume Părinte / Tutore"
                    name="parent_name"
                    required
                    defaultValue={defaults.parent_name}
                    error={state.fieldErrors.parent_name}
                  />
                  <Field
                    label="Telefon Părinte"
                    name="parent_phone"
                    required
                    defaultValue={defaults.parent_phone}
                    error={state.fieldErrors.parent_phone}
                  />
                  <Field
                    label="Email Părinte"
                    name="parent_1_email"
                    type="email"
                    defaultValue={defaults.parent_1_email}
                    error={state.fieldErrors.parent_1_email}
                  />
                  <Field
                    label="CNP Minor"
                    name="minor_cnp"
                    required
                    defaultValue={defaults.minor_cnp}
                    error={state.fieldErrors.minor_cnp}
                  />
                  <Field
                    label="CNP Reprezentant Legal"
                    name="parent_cnp"
                    defaultValue={defaults.parent_cnp}
                    error={state.fieldErrors.parent_cnp}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Serie CI Reprezentant"
                      name="parent_id_series"
                      placeholder="RX"
                      defaultValue={defaults.parent_id_series}
                      error={state.fieldErrors.parent_id_series}
                    />
                    <Field
                      label="Număr CI Reprezentant"
                      name="parent_id_number"
                      placeholder="123456"
                      defaultValue={defaults.parent_id_number}
                      error={state.fieldErrors.parent_id_number}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parent_address">Adresă Reprezentant Legal</Label>
                    <Textarea
                      id="parent_address"
                      name="parent_address"
                      rows={2}
                      defaultValue={defaults.parent_address ?? ""}
                      aria-invalid={state.fieldErrors.parent_address ? true : undefined}
                      aria-describedby={
                        state.fieldErrors.parent_address
                          ? "parent_address-error"
                          : globalErrorId
                      }
                    />
                    {state.fieldErrors.parent_address ? (
                      <p id="parent_address-error" className="text-xs text-rose-600">{state.fieldErrors.parent_address}</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tip Facturare</Label>
                <select
                  name="billing_type"
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="INDIVIDUAL">Individual (Persoană Fizică)</option>
                  <option value="B2B_COMPANY">B2B (Decontare pe Firmă)</option>
                </select>
              </div>

              {billingType === "B2B_COMPANY" && (
                <div className="space-y-4 rounded bg-background p-3 border">
                  <Field
                    label="Nume Companie (Plătitor)"
                    name="company_name"
                    required
                    defaultValue={defaults.company_name}
                    error={state.fieldErrors.company_name}
                    hint="Firma va achita direct ședințele sau va oferi un buget."
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="company_address">Sediu Social Companie</Label>
                    <Textarea
                      id="company_address"
                      name="company_address"
                      rows={2}
                      defaultValue={defaults.company_address ?? ""}
                      aria-invalid={state.fieldErrors.company_address ? true : undefined}
                      aria-describedby={
                        state.fieldErrors.company_address
                          ? "company_address-error"
                          : globalErrorId
                      }
                    />
                    {state.fieldErrors.company_address ? (
                      <p id="company_address-error" className="text-xs text-rose-600">{state.fieldErrors.company_address}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Nr. Reg. Comerțului"
                      name="company_reg_com"
                      placeholder="J40/1234/2024"
                      defaultValue={defaults.company_reg_com}
                      error={state.fieldErrors.company_reg_com}
                    />
                    <Field
                      label="Email Reprezentant"
                      name="company_representative_email"
                      type="email"
                      defaultValue={defaults.company_representative_email}
                      error={state.fieldErrors.company_representative_email}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Nume Reprezentant"
                      name="company_representative_name"
                      required
                      defaultValue={defaults.company_representative_name}
                      error={state.fieldErrors.company_representative_name}
                    />
                    <Field
                      label="Calitate Reprezentant"
                      name="company_representative_role"
                      required
                      defaultValue={defaults.company_representative_role}
                      error={state.fieldErrors.company_representative_role}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="IBAN Companie"
                      name="company_iban"
                      defaultValue={defaults.company_iban}
                      error={state.fieldErrors.company_iban}
                    />
                    <Field
                      label="Banca Companie"
                      name="company_bank"
                      defaultValue={defaults.company_bank}
                      error={state.fieldErrors.company_bank}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 border-t pt-5">
            <h4 className="mb-4 text-sm font-medium">Frecvență & Raportare</h4>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Frecvență Ședințe</Label>
                <select
                  name="session_frequency"
                  defaultValue={defaults.session_frequency ?? "SAPTAMANAL"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="SAPTAMANAL">Săptămânal</option>
                  <option value="BILUNAR">Bilunar (O dată la 2 săptămâni)</option>
                  <option value="LUNAR">Lunar</option>
                  <option value="OCAZIONAL">Ocazional (La cerere)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Generare Raport Evaluare</Label>
                <select
                  name="report_frequency"
                  defaultValue={defaults.report_frequency ?? "NICIODATA"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="LUNAR">Lunar</option>
                  <option value="LA_CERERE">Doar la cerere</option>
                  <option value="NICIODATA">Niciodată</option>
                </select>
              </div>
            </div>

            {isMinor && (
              <label className="mt-4 flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                <input
                  type="checkbox"
                  name="send_report_to_parent"
                  defaultChecked={defaults.send_report_to_parent ?? false}
                  className="mt-0.5 h-4 w-4 rounded border-input"
                />
                <span>
                  <span className="font-medium">Trimite Raport Lunar Părintelui</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Dacă e bifat, părintele va primi un email cu raportul și evoluția scorului, conform frecvenței de raportare alese.
                  </span>
                </span>
              </label>
            )}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          <input
            type="checkbox"
            name="gdpr_consent_signed"
            defaultChecked={defaults.gdpr_consent_signed ?? false}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            <span className="font-medium">Consimțământ GDPR semnat</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Bifează doar după ce clientul a semnat formularul. Textul PDF poate fi
              generat din fișă.
            </span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 border-t pt-5">
          <Button type="button" variant="outline" asChild>
            <Link href={cancelHref}>Anulează</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Se salvează…" : submitLabel}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <AlertDialog open={showSuccess} onOpenChange={setDismissedSuccess}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-in zoom-in-50 duration-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-black">Client salvat!</AlertDialogTitle>
            <AlertDialogDescription className="text-center mt-2">
              Fișa pacientului a fost actualizată cu succes în baza de date.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-6 pt-0 space-y-4">
            <div className="rounded-2xl border bg-slate-50 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Verificări & Status</h4>
              
              <div className="flex items-center gap-3 text-sm">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-700">Date de identificare salvate</span>
              </div>

              {!defaults.gdpr_consent_signed && (
                <div className="flex items-center gap-3 text-sm">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span className="text-slate-700">Lipsă semnătură GDPR</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 px-4 rounded-xl gap-3 border-slate-200 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={copyOnboardingLink}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Copy className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">Copiază Link Onboarding</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Trimite link-ul pentru completare date</p>
                </div>
              </Button>

              <Button 
                asChild
                className="w-full justify-start h-12 px-4 rounded-xl gap-3 bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
              >
                <Link href={`/dashboard/clients/${state.clientId}`}>
                  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs font-bold leading-none">Vezi Fișa Clientului</p>
                    <p className="text-[10px] text-white/70 mt-1">Accesează dosarul complet</p>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Link>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-center h-10 text-xs font-bold gap-2"
                onClick={() => {
                  setDismissedSuccess(true);
                  window.location.href = "/dashboard/clients/new";
                }}
              >
                <UserPlus className="h-4 w-4" />
                Adaugă un alt client
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}

function Field({ label, name, type = "text", required, defaultValue, placeholder, hint, error }: FieldProps) {
  const descriptionId = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
      />
      {error ? (
        <p id={`${name}-error`} className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
