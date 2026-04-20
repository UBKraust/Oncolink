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
  const is_minor = formData.get("is_minor") === "on";
  const billing_type = formData.get("billing_type") as "INDIVIDUAL" | "B2B_COMPANY" | null;
  
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    cnp_cif: String(formData.get("cnp_cif") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    gdpr_consent_signed: formData.get("gdpr_consent_signed") === "on",
    location: formData.get("location") as "CABINET_PARTICULAR" | "CLINICA" | null,
    is_minor,
    parent_name: is_minor ? String(formData.get("parent_name") ?? "").trim() : null,
    parent_phone: is_minor ? String(formData.get("parent_phone") ?? "").trim() : null,
    billing_type: billing_type || "INDIVIDUAL",
    company_name: billing_type === "B2B_COMPANY" ? String(formData.get("company_name") ?? "").trim() : null,
    session_price: String(formData.get("session_price") ?? "").trim() || null,
    session_frequency: String(formData.get("session_frequency") ?? "SAPTAMANAL"),
    report_frequency: String(formData.get("report_frequency") ?? "NICIODATA"),
    send_report_to_parent: formData.get("send_report_to_parent") === "on",
  };
}

function validate(payload: ReturnType<typeof parseForm>): ClientFormState {
  const fieldErrors: ClientFormState["fieldErrors"] = {};

  if (!payload.full_name) fieldErrors.full_name = "Nume complet este obligatoriu.";
  if (!payload.email) fieldErrors.email = "Email este obligatoriu.";
  else if (!isValidEmail(payload.email)) fieldErrors.email = "Email invalid.";
  if (payload.phone && !isValidRomanianPhone(payload.phone))
    fieldErrors.phone = "Telefon RO invalid (ex: +40722111222).";
  if (payload.cnp_cif) {
    const v = validateCnpCif(payload.cnp_cif);
    if (!v.ok) fieldErrors.cnp_cif = v.reason;
  }
  
  if (payload.is_minor) {
    if (!payload.parent_name) fieldErrors.parent_name = "Numele părintelui/tutorelui este obligatoriu pentru minori.";
    if (!payload.parent_phone) fieldErrors.parent_phone = "Telefonul părintelui este obligatoriu.";
    else if (!isValidRomanianPhone(payload.parent_phone)) fieldErrors.parent_phone = "Telefon RO invalid.";
  }

  if (payload.billing_type === "B2B_COMPANY" && !payload.company_name) {
    fieldErrors.company_name = "Numele firmei este obligatoriu pentru abonamente B2B.";
  }

  if (payload.session_price && isNaN(Number(payload.session_price))) {
    fieldErrors.session_price = "Prețul trebuie să fie un număr valid.";
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
      location: payload.location,
      is_minor: payload.is_minor,
      parent_name: payload.parent_name,
      parent_phone: payload.parent_phone,
      billing_type: payload.billing_type,
      company_name: payload.company_name,
      session_price: payload.session_price ? Number(payload.session_price) : null,
      session_frequency: payload.session_frequency,
      report_frequency: payload.report_frequency,
      send_report_to_parent: payload.send_report_to_parent,
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
      location: payload.location,
      is_minor: payload.is_minor,
      parent_name: payload.parent_name,
      parent_phone: payload.parent_phone,
      billing_type: payload.billing_type,
      company_name: payload.company_name,
      session_price: payload.session_price ? Number(payload.session_price) : null,
      session_frequency: payload.session_frequency,
      report_frequency: payload.report_frequency,
      send_report_to_parent: payload.send_report_to_parent,
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
