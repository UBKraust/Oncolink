"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google/sync";
import { provisionClientDriveFolder, uploadFileToDriveFolder } from "@/lib/google/drive";
import {
  isValidEmail,
  isValidRomanianPhone,
  validateCnpCif,
} from "@/lib/clients/validation";
import { shareFile } from "@/lib/google/drive";
import { sendMessage, onboardingLinkMsg } from "@/lib/twilio/client";
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
    company_representative_name: billing_type === "B2B_COMPANY" ? String(formData.get("company_representative_name") ?? "").trim() : null,
    company_representative_role: billing_type === "B2B_COMPANY" ? String(formData.get("company_representative_role") ?? "").trim() : null,
    company_reg_com: billing_type === "B2B_COMPANY" ? String(formData.get("company_reg_com") ?? "").trim() : null,
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

  if (payload.billing_type === "B2B_COMPANY") {
    if (!payload.company_name) fieldErrors.company_name = "Numele firmei este obligatoriu.";
    if (!payload.company_representative_name) fieldErrors.company_representative_name = "Numele reprezentantului este obligatoriu.";
    if (!payload.company_representative_role) fieldErrors.company_representative_role = "Calitatea reprezentantului este obligatorie.";
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


  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { error: "Sesiune neautorizată. Te rugăm să te autentifici din nou.", fieldErrors: {} };
  }

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
      company_representative_name: payload.company_representative_name,
      company_representative_role: payload.company_representative_role,
      company_reg_com: payload.company_reg_com,
      therapist_id: user.id, // Explicitly set to pass RLS
    })
    .select("id")
    .single();

  if (error) return { error: error.message, fieldErrors: {} };

  // ── Provision Google Drive folder (fire-and-forget) ──────────────────────
  // Runs async — client creation never blocks on Drive availability.
  void (async () => {
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken && payload.full_name) {
        const { folderUrl } = await provisionClientDriveFolder(
          accessToken,
          payload.full_name,
          data.id
        );
        // Save folder URL as contract_url for easy reference
        await supabase
          .from("clients")
          .update({ contract_url: folderUrl })
          .eq("id", data.id);
      }
    } catch (driveErr) {
      console.warn("[Drive] Could not provision client folder:", driveErr);
    }
  })();

  revalidatePath("/dashboard/clients");
  return { success: true, clientId: data.id, error: null, fieldErrors: {} };
}

export async function updateClient(
  id: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const payload = parseForm(formData);
  const validation = validate(payload);
  if (validation.error) return validation;

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { error: "Sesiune neautorizată. Te rugăm să te autentifici din nou.", fieldErrors: {} };
  }

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
      company_representative_name: payload.company_representative_name,
      company_representative_role: payload.company_representative_role,
      company_reg_com: payload.company_reg_com,
    })
    .eq("id", id);

  if (error) return { error: error.message, fieldErrors: {} };

  revalidatePath(`/dashboard/clients/${id}`);
  revalidatePath("/dashboard/clients");
  return { success: true, clientId: id, error: null, fieldErrors: {} };
}

export async function scheduleAnonymization(id: string) {

  const supabase = await createSupabaseServerClient();
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 15);

  const { error } = await supabase
    .from("clients")
    .update({
      scheduled_anonymization_at: scheduledDate.toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error scheduling anonymization:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { success: true };
}

export async function cancelAnonymization(id: string) {

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({
      scheduled_anonymization_at: null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error cancelling anonymization:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { success: true };
}

export async function anonymizeClient(id: string, formData: FormData) {
  // Existing function kept for "Hard Delete" logic if needed, 
  // but we transition to scheduled logic in UI.
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "ȘTERGE PII") {
    redirect(`/dashboard/clients/${id}/anonymize?error=confirmation`);
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

export async function uploadClientDocument(clientId: string, folderId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "Niciun fișier selectat." };

  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) throw new Error("Nu s-a putut obține token-ul Google.");

    const res = await uploadFileToDriveFolder(
      accessToken,
      file,
      file.name,
      folderId
    );

    const supabase = await createSupabaseServerClient();
    // Logic to log this upload if needed or update client metadata
    
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true, webViewLink: res.webViewLink };
  } catch (err) {
    console.error("[Drive Upload Error]", err);
    return { error: err instanceof Error ? err.message : "Eroare la încărcare." };
  }
}

export async function sendOnboardingNotification(clientId: string, clientName: string, phone: string) {
  if (!phone) return { error: "Clientul nu are număr de telefon setat." };

  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Fetch latest client data for email and contract_url
    const { data: client } = await supabase
      .from("clients")
      .select("email, contract_url")
      .eq("id", clientId)
      .single();

    // 2. Share Drive folder if email exists
    if (client?.email && client?.contract_url?.includes("folders/")) {
      try {
        const folderId = client.contract_url.split("folders/")[1]?.split("?")[0];
        if (folderId) {
          const accessToken = await getValidAccessToken();
          if (accessToken) {
            await shareFile(accessToken, folderId, client.email, "writer");
          }
        }
      } catch (shareErr) {
        console.warn("[Onboarding] Folder sharing failed:", shareErr);
        // We continue even if sharing fails, as the link notification is primary
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://oncolink.cepaipatit.ro";
    const onboardingLink = `${baseUrl}/onboarding/${clientId}`;
    
    const message = onboardingLinkMsg(clientName, onboardingLink);
    
    await sendMessage({
      to: phone,
      body: message,
      channel: "whatsapp"
    });

    return { success: true };
  } catch (err) {
    console.error("[Onboarding Notification Error]", err);
    return { error: err instanceof Error ? err.message : "Eroare la trimiterea notificării." };
  }
}
