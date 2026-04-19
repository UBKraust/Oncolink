"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isValidEmail,
  isValidRomanianPhone,
  validateCnpCif,
} from "@/lib/clients/validation";
import type { ClientFormState } from "@/lib/clients/form-state";

function parseForm(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    cnp_cif: String(formData.get("cnp_cif") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    gdpr_consent_signed: formData.get("gdpr_consent_signed") === "on",
  };
}

function validate(payload: ReturnType<typeof parseForm>): ClientFormState {
  const fieldErrors: ClientFormState["fieldErrors"] = {};

  if (!payload.full_name) fieldErrors.full_name = "Nume complet este obligatoriu.";
  if (!payload.email) fieldErrors.email = "Email este obligatoriu.";
  else if (!isValidEmail(payload.email)) fieldErrors.email = "Email invalid.";
  if (payload.phone && !isValidRomanianPhone(payload.phone))
    fieldErrors.phone = "Telefon RO invalid (ex: +40722111222 sau 0722111222).";
  if (payload.cnp_cif) {
    const v = validateCnpCif(payload.cnp_cif);
    if (!v.ok) fieldErrors.cnp_cif = v.reason;
  }

  return {
    error: Object.keys(fieldErrors).length ? "Verifică câmpurile marcate." : null,
    fieldErrors,
  };
}

export async function createClient(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const payload = parseForm(formData);
  const validation = validate(payload);
  if (validation.error) return validation;

  if (!isSupabaseConfigured()) {
    return {
      error: "Mod demo: configurează Supabase pentru a salva clienții.",
      fieldErrors: {},
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone || null,
      cnp_cif: payload.cnp_cif || null,
      address: payload.address || null,
      gdpr_consent_signed: payload.gdpr_consent_signed,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, fieldErrors: {} };

  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${data.id}`);
}

export async function updateClient(
  id: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const payload = parseForm(formData);
  const validation = validate(payload);
  if (validation.error) return validation;

  if (!isSupabaseConfigured()) {
    return {
      error: "Mod demo: configurează Supabase pentru a salva modificările.",
      fieldErrors: {},
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone || null,
      cnp_cif: payload.cnp_cif || null,
      address: payload.address || null,
      gdpr_consent_signed: payload.gdpr_consent_signed,
    })
    .eq("id", id);

  if (error) return { error: error.message, fieldErrors: {} };

  revalidatePath(`/dashboard/clients/${id}`);
  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${id}`);
}

export async function anonymizeClient(id: string, formData: FormData) {
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "ȘTERGE PII") {
    redirect(`/dashboard/clients/${id}/anonymize?error=confirmation`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`/dashboard/clients/${id}/anonymize?error=demo`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({
      full_name: "[Client anonimizat]",
      email: null,
      phone: null,
      cnp_cif: null,
      address: null,
      contract_url: null,
      notes_anonymized_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) redirect(`/dashboard/clients/${id}/anonymize?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  redirect(`/dashboard/clients/${id}?anonymized=1`);
}
