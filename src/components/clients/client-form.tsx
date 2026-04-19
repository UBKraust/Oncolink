"use client";

import Link from "next/link";
import { useActionState } from "react";

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

  return (
    <form action={formAction} className="space-y-5">
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
