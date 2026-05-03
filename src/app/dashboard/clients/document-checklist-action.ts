"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  checkDocumentRequirements,
  getDocumentCompletionStats,
  type DocumentCheckResult,
} from "@/lib/clients/document-requirements";
import type { ServiceType } from "@/lib/clients/service-track";

export interface ClientDocumentChecklist {
  clientName: string;
  serviceType: ServiceType;
  results: DocumentCheckResult[];
  stats: ReturnType<typeof getDocumentCompletionStats>;
}

export async function getClientDocumentChecklist(
  clientId: string,
  serviceType: ServiceType,
): Promise<ClientDocumentChecklist | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createSupabaseServerClient();

    const [{ data: client }, { data: docs }, { data: assessments }] = await Promise.all([
      supabase
        .from("clients")
        .select(
          "full_name, gdpr_consent_signed, onboarding_completed_at, contract_url, terms_consent_signed_at, treatment_goals, risk_level, is_minor",
        )
        .eq("id", clientId)
        .single(),
      supabase
        .from("patient_documents")
        .select("id, document_type, file_name, uploaded_at")
        .eq("client_id", clientId),
      supabase.from("client_assessments").select("id").eq("client_id", clientId),
    ]);

    if (!client) return null;

    // checkDocumentRequirements expects ClientProfile shape — map the raw row
    const profile = {
      ...client,
      id: clientId,
      treatment_goals: Array.isArray(client.treatment_goals) ? client.treatment_goals : [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = checkDocumentRequirements(serviceType, profile as any, (docs ?? []) as any, (assessments ?? []) as any);

    return {
      clientName: client.full_name?.trim() || "Client",
      serviceType,
      results,
      stats: getDocumentCompletionStats(results),
    };
  } catch {
    return null;
  }
}
