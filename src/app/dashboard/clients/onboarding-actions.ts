"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockClients } from "@/lib/mock/clients";
import {
  consumeOnboardingAccessToken,
  createOnboardingAccessToken,
  getOnboardingTokenPayload,
} from "@/lib/security/public-links";
import { resolvePublicBookingTherapistId } from "@/lib/security/public-booking";
import {
  enforceRateLimit,
  getClientIp,
  isHoneypotTriggered,
} from "@/lib/security/public-rate-limit";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";
import { upsertClientByIdentifiers } from "@/lib/clients/upsert";

export interface OnboardingData {
  id?: string;
  token?: string;
  website?: string;
  therapist_slug?: string;
  cnp_cif?: string;
  minor_cnp?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  referral_source?: string;
  referred_by_name?: string;
  gdpr_consent_signed?: boolean;
  terms_consent_signed?: boolean;
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
  legal_liability_consent_signed?: boolean;
}

export async function submitMinorOnboarding(data: OnboardingData, files?: { custody?: File }) {
  if (isHoneypotTriggered(data.website)) {
    return { success: true };
  }

  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const rateLimit = await enforceRateLimit({
    action: "public_minor_onboarding_submit",
    identifier: `${ip}:${data.parent_1_email ?? "unknown"}`,
    limit: 4,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return {
      success: false,
      error: `Prea multe încercări. Reîncearcă peste ${rateLimit.retryAfterSec} secunde.`,
    };
  }

  const now = new Date().toISOString();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseServiceClient();
  let therapistId: string | null = user?.id || null;

  if (!therapistId) {
    therapistId = await resolvePublicBookingTherapistId(data.therapist_slug);
  }

  if (!therapistId) {
    return { success: false, error: "Nu am găsit niciun terapeut configurat." };
  }

  const db = user ? supabase : admin;
  const storageClient = user ? supabase : admin;

  let clientId: string;
  try {
    const result = await upsertClientByIdentifiers(db as any, therapistId, {
      id: data.id,
      minor_cnp: data.minor_cnp,
      cnp_cif: data.cnp_cif,
      full_name: data.full_name,
      parent_1_email: data.parent_1_email,
      parent_1_phone: data.parent_1_phone,
    }, {
      therapist_id: therapistId,
      is_minor: true,
      full_name: data.full_name,
      minor_cnp: data.minor_cnp,
      parent_1_name: data.parent_1_name,
      parent_1_phone: data.parent_1_phone,
      parent_1_email: data.parent_1_email,
      parent_2_name: data.parent_2_name,
      parent_2_phone: data.parent_2_phone,
      parent_2_email: data.parent_2_email,
      parents_marital_status: data.parents_marital_status,
      cnp_cif: data.cnp_cif,
      address: data.address,
      referral_source: data.referral_source,
      referred_by_name: data.referred_by_name,
      emergency_contact_name: data.parent_1_name,
      emergency_contact_phone: data.parent_1_phone,
      emergency_contact_relation: "Părinte",
      gdpr_consent_signed: data.gdpr_consent_signed,
      legal_liability_consent_signed_at: data.legal_liability_consent_signed ? now : null,
      needs_legal_review: data.parents_marital_status !== "CASATORITI",
      onboarding_completed_at: now,
    });
    clientId = result.id;
  } catch (clientError) {
    console.error("Error upserting minor client:", clientError);
    return {
      success: false,
      error: clientError instanceof Error ? clientError.message : "Nu am putut salva clientul minor.",
    };
  }

  // 2. Handle file upload if present
  if (files?.custody) {
    const file = files.custody;
    const ext = file.name.split(".").pop();
    const filePath = `${clientId}/legal_${Date.now()}.${ext}`;

    const { error: uploadError } = await storageClient.storage
      .from("patient-documents")
      .upload(filePath, file);

    if (!uploadError) {
      // Create doc record
      await db.from("patient_documents").insert({
        therapist_id: therapistId,
        client_id: clientId,
        file_name: file.name,
        storage_path: filePath,
        document_url:
          user
            ? await createSignedObjectUrl(
                supabase,
                "patient-documents",
                filePath,
              )
            : null,
        document_type: data.parents_marital_status === "DIVORTATI_CUSTODIE_EXCLUSIVA" ? "SENTINTA_CUSTODIE" : "ACORD_PARINTI",
        mime_type: file.type,
      });
    }
  }

  revalidatePath("/dashboard/clients");
  return { success: true, id: clientId };
}

export async function submitClientOnboarding(data: OnboardingData) {
  if (!data.id && !data.token) {
    return { success: false, error: "Client lipsă pentru onboarding." };
  }

  if (isHoneypotTriggered(data.website)) {
    return { success: true };
  }

  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const rateLimit = await enforceRateLimit({
    action: "public_onboarding_submit",
    identifier: data.token ? `${ip}:${data.token}` : ip,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return {
      success: false,
      error: `Prea multe încercări. Reîncearcă peste ${rateLimit.retryAfterSec} secunde.`,
    };
  }

  const now = new Date().toISOString();

  if (data.token) {
    const result = await consumeOnboardingAccessToken(data.token, {
      cnp_cif: data.cnp_cif || null,
      address: data.address,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      emergency_contact_relation: data.emergency_contact_relation,
      referral_source: data.referral_source,
      referred_by_name: data.referred_by_name || null,
      gdpr_consent_signed: data.gdpr_consent_signed,
      terms_consent_signed_at: data.terms_consent_signed ? now : null,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    if ((result as { client?: { id?: string } }).client?.id) {
      revalidatePath(`/dashboard/clients/${(result as { client: { id: string } }).client.id}`);
    }
    return { success: true };
  }

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
      terms_consent_signed_at: data.terms_consent_signed ? now : null,
      onboarding_completed_at: now,
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

export async function getClientForOnboardingToken(token: string) {
  const payload = await getOnboardingTokenPayload(token);
  if (!payload?.client) {
    return { error: "Link invalid sau expirat." };
  }

  return { data: payload.client };
}

export async function createClientOnboardingLink(clientId: string) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase nu este configurat." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const { url } = await createOnboardingAccessToken({
      clientId,
      therapistId: user.id,
      createdBy: user.id,
    });
    return { data: { url } };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Nu am putut genera linkul de onboarding.",
    };
  }
}
