"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockClients } from "@/lib/mock/clients";

export interface OnboardingData {
  id: string;
  cnp_cif?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  referral_source?: string;
  referred_by_name?: string;
  gdpr_consent_signed?: boolean;
  // Minor specific
  is_minor?: boolean;
  full_name?: string;
  parent_1_name?: string;
  parent_1_phone?: string;
  parent_1_email?: string;
  parent_2_name?: string;
  parent_2_phone?: string;
  parent_2_email?: string;
  parents_marital_status?: string;
  needs_legal_review?: boolean;
}

export async function submitMinorOnboarding(data: OnboardingData, files?: { custody?: File }) {

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let therapistId: string | null = user?.id || null;

  if (!therapistId) {
    const admin = createSupabaseServiceClient();
    const { data: first } = await admin
      .from("therapist_settings")
      .select("therapist_id")
      .limit(1)
      .maybeSingle();
    therapistId = first?.therapist_id || null;
  }

  if (!therapistId) {
    return { success: false, error: "Nu am găsit niciun terapeut configurat." };
  }

  // 1. Create the client record
  const { data: newClient, error: clientError } = await (supabase as any)
    .from("clients")
    .insert({
      therapist_id: therapistId,
      is_minor: true,
      full_name: data.full_name,
      parent_1_name: data.parent_1_name,
      parent_1_phone: data.parent_1_phone,
      parent_1_email: data.parent_1_email,
      parent_2_name: data.parent_2_name,
      parent_2_phone: data.parent_2_phone,
      parent_2_email: data.parent_2_email,
      parents_marital_status: data.parents_marital_status,
      cnp_cif: data.cnp_cif, // parent's CNP usually for invoicing
      address: data.address,
      referral_source: data.referral_source,
      referred_by_name: data.referred_by_name,
      emergency_contact_name: data.parent_1_name,
      emergency_contact_phone: data.parent_1_phone,
      emergency_contact_relation: "Părinte",
      gdpr_consent_signed: data.gdpr_consent_signed,
      needs_legal_review: data.parents_marital_status !== "CASATORITI",
      onboarding_completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (clientError) {
    console.error("Error creating minor client:", clientError);
    return { success: false, error: clientError.message };
  }

  const clientId = newClient.id;

  // 2. Handle file upload if present
  if (files?.custody) {
    const file = files.custody;
    const ext = file.name.split(".").pop();
    const filePath = `${clientId}/legal_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("patient-documents")
      .upload(filePath, file);

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("patient-documents")
        .getPublicUrl(filePath);

      // Create doc record
      await (supabase as any).from("patient_documents").insert({
        therapist_id: therapistId,
        client_id: clientId,
        file_name: file.name,
        storage_path: filePath,
        document_url: urlData.publicUrl,
        document_type: data.parents_marital_status === "DIVORTATI_CUSTODIE_EXCLUSIVA" ? "SENTINTA_CUSTODIE" : "ACORD_PARINTI",
        mime_type: file.type,
      });
    }
  }

  revalidatePath("/dashboard/clients");
  return { success: true, id: clientId };
}

export async function submitClientOnboarding(data: OnboardingData) {

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({
      cnp_cif: data.cnp_cif,
      address: data.address,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      emergency_contact_relation: data.emergency_contact_relation,
      referral_source: data.referral_source,
      referred_by_name: data.referred_by_name || null,
      gdpr_consent_signed: data.gdpr_consent_signed,
    })
    .eq("id", data.id);

  if (error) {
    console.error("Error submitting onboarding:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/clients/${data.id}`);
  return { success: true };
}

export async function getClientForOnboarding(id: string) {

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, email, phone")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data };
}
