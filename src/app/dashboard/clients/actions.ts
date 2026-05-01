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
import { sendEmail, onboardingEmailTemplate } from "@/lib/mail/client";
import type { ClientFormState } from "@/lib/clients/form-state";
import { createOnboardingAccessToken } from "@/lib/security/public-links";
import {
  setClientLifecycleStatus,
  syncClientLifecycleStatus,
} from "@/lib/clients/lifecycle-sync";
import type { ClientLifecycleStatus } from "@/lib/clients/lifecycle";
import { upsertClientByIdentifiers } from "@/lib/clients/upsert";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";

type ClientUpsertDb = Parameters<typeof upsertClientByIdentifiers>[0];

function getManualLifecycleReason(status: ClientLifecycleStatus) {
  switch (status) {
    case "ACTIV":
      return "Marcat activ din fișa clientului";
    case "INACTIV":
      return "Marcat inactiv din fișa clientului";
    case "INCHEIAT":
      return "Caz încheiat din fișa clientului";
    case "NECONVERSIE":
      return "Lead marcat ca neconversie din fișa clientului";
    default:
      return "Status actualizat manual";
  }
}

function parseForm(formData: FormData) {
  const is_minor = formData.get("is_minor") === "on";
  const billing_type = formData.get("billing_type") as "INDIVIDUAL" | "B2B_COMPANY" | null;
  
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    cnp_cif: String(formData.get("cnp_cif") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    date_of_birth: String(formData.get("date_of_birth") ?? "").trim() || null,
    client_id_series: String(formData.get("client_id_series") ?? "").trim() || null,
    client_id_number: String(formData.get("client_id_number") ?? "").trim() || null,
    gdpr_consent_signed: formData.get("gdpr_consent_signed") === "on",
    location: formData.get("location") as "CABINET_PARTICULAR" | "CLINICA" | null,
    is_minor,
    minor_cnp: is_minor ? String(formData.get("minor_cnp") ?? "").trim() || null : null,
    parent_name: is_minor ? String(formData.get("parent_name") ?? "").trim() : null,
    parent_phone: is_minor ? String(formData.get("parent_phone") ?? "").trim() : null,
    parent_1_email: is_minor ? String(formData.get("parent_1_email") ?? "").trim() || null : null,
    parent_cnp: is_minor ? String(formData.get("parent_cnp") ?? "").trim() || null : null,
    parent_address: is_minor ? String(formData.get("parent_address") ?? "").trim() || null : null,
    parent_id_series: is_minor ? String(formData.get("parent_id_series") ?? "").trim() || null : null,
    parent_id_number: is_minor ? String(formData.get("parent_id_number") ?? "").trim() || null : null,
    billing_type: billing_type || "INDIVIDUAL",
    company_name: billing_type === "B2B_COMPANY" ? String(formData.get("company_name") ?? "").trim() : null,
    company_address: billing_type === "B2B_COMPANY" ? String(formData.get("company_address") ?? "").trim() || null : null,
    company_iban: billing_type === "B2B_COMPANY" ? String(formData.get("company_iban") ?? "").trim() || null : null,
    company_bank: billing_type === "B2B_COMPANY" ? String(formData.get("company_bank") ?? "").trim() || null : null,
    session_price: String(formData.get("session_price") ?? "").trim() || null,
    session_frequency: String(formData.get("session_frequency") ?? "SAPTAMANAL"),
    report_frequency: String(formData.get("report_frequency") ?? "NICIODATA"),
    send_report_to_parent: formData.get("send_report_to_parent") === "on",
    company_representative_name: billing_type === "B2B_COMPANY" ? String(formData.get("company_representative_name") ?? "").trim() : null,
    company_representative_email: billing_type === "B2B_COMPANY" ? String(formData.get("company_representative_email") ?? "").trim() || null : null,
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
  if (payload.parent_1_email && !isValidEmail(payload.parent_1_email)) {
    fieldErrors.parent_1_email = "Email invalid.";
  }
  if (payload.company_representative_email && !isValidEmail(payload.company_representative_email)) {
    fieldErrors.company_representative_email = "Email invalid.";
  }
  
  if (payload.is_minor) {
    if (!payload.parent_name) fieldErrors.parent_name = "Numele părintelui/tutorelui este obligatoriu pentru minori.";
    if (!payload.parent_phone) fieldErrors.parent_phone = "Telefonul părintelui este obligatoriu.";
    else if (!isValidRomanianPhone(payload.parent_phone)) fieldErrors.parent_phone = "Telefon RO invalid.";
    if (!payload.minor_cnp) fieldErrors.minor_cnp = "CNP-ul minorului este obligatoriu pentru contract.";
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

  let clientResult: { id: string; created: boolean };
  try {
    clientResult = await upsertClientByIdentifiers(supabase as unknown as ClientUpsertDb, user.id, {
      email: payload.email,
      phone: payload.phone || null,
      cnp_cif: payload.cnp_cif || null,
      minor_cnp: payload.minor_cnp,
      full_name: payload.full_name,
      parent_1_email: payload.parent_1_email,
      parent_1_phone: payload.parent_phone,
    }, {
      therapist_id: user.id,
      full_name: payload.full_name,
      email: payload.email.toLowerCase(),
      phone: payload.phone || null,
      cnp_cif: payload.cnp_cif || null,
      address: payload.address || null,
      date_of_birth: payload.date_of_birth,
      client_id_series: payload.client_id_series,
      client_id_number: payload.client_id_number,
      gdpr_consent_signed: payload.gdpr_consent_signed,
      location: payload.location,
      is_minor: payload.is_minor,
      minor_cnp: payload.minor_cnp,
      parent_name: payload.parent_name,
      parent_phone: payload.parent_phone,
      parent_1_name: payload.parent_name,
      parent_1_phone: payload.parent_phone,
      parent_1_email: payload.parent_1_email,
      parent_cnp: payload.parent_cnp,
      parent_address: payload.parent_address,
      parent_id_series: payload.parent_id_series,
      parent_id_number: payload.parent_id_number,
      billing_type: payload.billing_type,
      company_name: payload.company_name,
      company_address: payload.company_address,
      company_iban: payload.company_iban,
      company_bank: payload.company_bank,
      session_price: payload.session_price ? Number(payload.session_price) : null,
      session_frequency: payload.session_frequency,
      report_frequency: payload.report_frequency,
      send_report_to_parent: payload.send_report_to_parent,
      company_representative_name: payload.company_representative_name,
      company_representative_email: payload.company_representative_email,
      company_representative_role: payload.company_representative_role,
      company_reg_com: payload.company_reg_com,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nu am putut salva clientul.",
      fieldErrors: {},
    };
  }

  await syncClientLifecycleStatus(supabase, clientResult.id, {
    metadata: { source: "createClient", wasCreated: clientResult.created },
    reason: clientResult.created
      ? "Client creat"
      : "Client actualizat prin deduplicare",
  });

  // ── Provision Google Drive folder (fire-and-forget) ──────────────────────
  // Runs async — client creation never blocks on Drive availability.
  void (async () => {
    try {
      const accessToken = await getValidAccessToken();
      if (accessToken && payload.full_name) {
        const { folderUrl } = await provisionClientDriveFolder(
          accessToken,
          payload.full_name,
          clientResult.id
        );
        // Save folder URL as contract_url for easy reference
        await supabase
          .from("clients")
          .update({ contract_url: folderUrl })
          .eq("id", clientResult.id);
      }
    } catch (driveErr) {
      console.warn("[Drive] Could not provision client folder:", driveErr);
    }
  })();

  revalidatePath("/dashboard/clients");
  return { success: true, clientId: clientResult.id, error: null, fieldErrors: {} };
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
      email: payload.email.toLowerCase(),
      phone: payload.phone || null,
      cnp_cif: payload.cnp_cif || null,
      address: payload.address || null,
      date_of_birth: payload.date_of_birth,
      client_id_series: payload.client_id_series,
      client_id_number: payload.client_id_number,
      gdpr_consent_signed: payload.gdpr_consent_signed,
      location: payload.location,
      is_minor: payload.is_minor,
      minor_cnp: payload.minor_cnp,
      parent_name: payload.parent_name,
      parent_phone: payload.parent_phone,
      parent_1_name: payload.parent_name,
      parent_1_phone: payload.parent_phone,
      parent_1_email: payload.parent_1_email,
      parent_cnp: payload.parent_cnp,
      parent_address: payload.parent_address,
      parent_id_series: payload.parent_id_series,
      parent_id_number: payload.parent_id_number,
      billing_type: payload.billing_type,
      company_name: payload.company_name,
      company_address: payload.company_address,
      company_iban: payload.company_iban,
      company_bank: payload.company_bank,
      session_price: payload.session_price ? Number(payload.session_price) : null,
      session_frequency: payload.session_frequency,
      report_frequency: payload.report_frequency,
      send_report_to_parent: payload.send_report_to_parent,
      company_representative_name: payload.company_representative_name,
      company_representative_email: payload.company_representative_email,
      company_representative_role: payload.company_representative_role,
      company_reg_com: payload.company_reg_com,
    })
    .eq("id", id);

  if (error) return { error: error.message, fieldErrors: {} };

  await syncClientLifecycleStatus(supabase, id, {
    metadata: { source: "updateClient" },
    reason: "Profil client actualizat",
  });

  revalidatePath(`/dashboard/clients/${id}`);
  revalidatePath("/dashboard/clients");
  return { success: true, clientId: id, error: null, fieldErrors: {} };
}

export async function transitionClientLifecycle(
  id: string,
  status: ClientLifecycleStatus,
  reason = getManualLifecycleReason(status),
) {
  const supabase = await createSupabaseServerClient();
  await setClientLifecycleStatus(supabase, {
    clientId: id,
    reason,
    status,
    metadata: { source: "manual-transition" },
  });

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
}

export async function reactivateClientLifecycle(id: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const status = await syncClientLifecycleStatus(supabase, id, {
      force: true,
      metadata: { source: "reactivate-client" },
      reason: "Client reactivat din fișa clientului",
    });

    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${id}`);
    return { success: true, status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nu am putut reactiva clientul.",
    };
  }
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

  await syncClientLifecycleStatus(supabase, id, {
    force: true,
    metadata: { source: "anonymizeClient" },
    reason: "Client anonimizat",
  });

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  redirect(`/dashboard/clients/${id}?anonymized=1`);
}

export async function uploadClientDocument(clientId: string, folderId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "Niciun fișier selectat." };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return { error: "Sesiune neautorizată." };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${clientId}/${Date.now()}_${safeName}`;

    const { error: storageError } = await supabase.storage
      .from("patient-documents")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (storageError) {
      return { error: storageError.message };
    }

    const signedStorageUrl = await createSignedObjectUrl(supabase, "patient-documents", storagePath);

    let driveFileId: string | null = null;
    let webViewLink: string | null = null;
    const accessToken = await getValidAccessToken();
    if (accessToken && folderId) {
      const res = await uploadFileToDriveFolder(
        accessToken,
        file,
        file.name,
        folderId
      );
      driveFileId = res.id;
      webViewLink = res.webViewLink;
    }

    const { error: docError } = await supabase
      .from("patient_documents")
      .insert({
        therapist_id: authData.user.id,
        client_id: clientId,
        file_name: file.name,
        file_size_kb: Math.round(file.size / 1024),
        mime_type: file.type || "application/octet-stream",
        storage_path: storagePath,
        drive_file_id: driveFileId,
        document_url: webViewLink ?? signedStorageUrl,
        document_type: "ALTELE",
      });

    if (docError) {
      return { error: docError.message };
    }
    
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true, webViewLink: webViewLink ?? signedStorageUrl };
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Terapeut neautentificat." };
    }

    const { url: onboardingLink } = await createOnboardingAccessToken({
      clientId,
      therapistId: user.id,
      createdBy: user.id,
    });
    
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

export async function sendOnboardingEmail(clientId: string, clientName: string, email: string) {
  if (!email) return { error: "Clientul nu are o adresă de email setată." };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Terapeut neautentificat." };
    }

    const { url: onboardingLink } = await createOnboardingAccessToken({
      clientId,
      therapistId: user.id,
      createdBy: user.id,
    });
    
    const html = onboardingEmailTemplate(clientName, onboardingLink);
    
    const res = await sendEmail({
      to: email,
      subject: "Formular Înrolare Pacient — Ce`ai Pățit?",
      html,
    });

    if ("error" in res) {
      return { error: res.error };
    }

    return { success: true };
  } catch (err) {
    console.error("[Onboarding Email Error]", err);
    return { error: err instanceof Error ? err.message : "Eroare la trimiterea email-ului." };
  }
}

export async function getClientOverview(clientId: string) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Fetch total COMPLETED sessions
  const { count: totalSessions } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("status", "FINALIZAT");

  // 2. Fetch last appointment (past)
  const { data: lastAppointment } = await supabase
    .from("appointments")
    .select("appointment_date")
    .eq("client_id", clientId)
    .lt("appointment_date", new Date().toISOString())
    .order("appointment_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Fetch next appointment (future)
  const { data: nextAppointment } = await supabase
    .from("appointments")
    .select("appointment_date, status")
    .eq("client_id", clientId)
    .gte("appointment_date", new Date().toISOString())
    .order("appointment_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  // 4. Fetch recent 3 past appointments for the log
  const { data: recentInteractions } = await supabase
    .from("appointments")
    .select("id, appointment_date, status, personal_notes")
    .eq("client_id", clientId)
    .lt("appointment_date", new Date().toISOString())
    .order("appointment_date", { ascending: false })
    .limit(3);

  return {
    totalSessions: totalSessions || 0,
    lastAppointmentDate: lastAppointment?.appointment_date || null,
    nextAppointment: nextAppointment ? {
      date: nextAppointment.appointment_date,
      status: nextAppointment.status
    } : null,
    recentInteractions: (recentInteractions || []).map(a => ({
      id: a.id,
      date: a.appointment_date,
      status: a.status,
      summary: a.personal_notes || "Niciun rezumat disponibil."
    }))
  };
}

export async function getLatestReferralDocument(clientId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("referral_documents")
    .select("id, referral_number, referral_date, referring_doctor_code, uploaded_at")
    .eq("client_id", clientId)
    .order("referral_date", { ascending: false, nullsFirst: false })
    .order("uploaded_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Referral] Could not load latest referral document:", error);
    return null;
  }

  return data;
}

export async function issueGeneratedContractNumber(
  clientId: string,
  templateType: "STANDARD" | "MINOR" | "B2B" | "CAS",
) {
  if (!isSupabaseConfigured()) {
    const year = new Date().getFullYear();
    return {
      id: `demo-contract-${Date.now()}`,
      contract_number: `CTR-${year}-DEMO`,
      contract_year: year,
      sequence_number: 0,
      template_type: templateType,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { error: "Sesiune neautorizată. Te rugăm să te autentifici din nou." };
  }

  const { data, error } = await supabase.rpc("issue_generated_contract_number", {
    p_client_id: clientId,
    p_template_type: templateType,
  });

  if (error || !data) {
    return { error: error?.message || "Nu am putut emite numărul contractului." };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);

  return {
    id: data.id,
    contract_number: data.contract_number,
    contract_year: data.contract_year,
    sequence_number: data.sequence_number,
    template_type: data.template_type,
  };
}
