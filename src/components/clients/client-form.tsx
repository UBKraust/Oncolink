"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientFormState } from "@/lib/clients/form-state";

type Defaults = Partial<{
  full_name: string;
  email: string;
  phone: string;
  cnp_cif: string;
  address: string;
  gdpr_consent_signed: boolean;
  location: string;
  is_minor: boolean;
  parent_name: string;
  parent_phone: string;
  billing_type: string;
  company_name: string;
  session_price: string;
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

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
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
          hint="Necesar pentru e-Factura SmartBill."
          defaultValue={defaults.cnp_cif}
          error={state.fieldErrors.cnp_cif}
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
          {/* Minor Status */}
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
              </div>
            )}
          </div>

          {/* Billing Type */}
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
              </div>
            )}
          </div>
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
      />
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
