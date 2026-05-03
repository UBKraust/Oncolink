"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ServiceType } from "@/lib/clients/service-track";

export interface TrackClient {
  id: string;
  fullName: string;
  lifecycleStatus: string | null;
  serviceTrackStatus: string | null;
  riskLevel: string | null;
  gdprSigned: boolean;
  onboardingComplete: boolean;
  hasContract: boolean;
  isMinor: boolean;
}

const CLOSED_STATUSES = new Set(["INCHEIAT", "NECONVERSIE", "ANONIMIZAT"]);
const CLASSIFIED_TYPES = ["CLINICAL_PSYCHOLOGY", "CBT", "DBT", "COUNSELING"];

export async function getTrackClients(serviceType: ServiceType): Promise<TrackClient[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createSupabaseServerClient();

    let queryBuilder = supabase
      .from("clients")
      .select(
        "id, full_name, lifecycle_status, service_track_status, risk_level, gdpr_consent_signed, onboarding_completed_at, contract_url, terms_consent_signed_at, is_minor",
      )
      .order("full_name", { ascending: true })
      .limit(100);

    if (serviceType === "UNDECIDED") {
      queryBuilder = queryBuilder.not(
        "service_type",
        "in",
        `(${CLASSIFIED_TYPES.join(",")})`,
      );
    } else {
      queryBuilder = queryBuilder.eq("service_type", serviceType);
    }

    const { data } = await queryBuilder;

    return (data ?? [])
      .filter((c) => !CLOSED_STATUSES.has(c.lifecycle_status ?? ""))
      .map((c) => ({
        id: c.id,
        fullName: c.full_name?.trim() || "Client",
        lifecycleStatus: c.lifecycle_status,
        serviceTrackStatus: c.service_track_status,
        riskLevel: c.risk_level,
        gdprSigned: Boolean(c.gdpr_consent_signed),
        onboardingComplete: Boolean(c.onboarding_completed_at),
        hasContract: Boolean(c.contract_url || c.terms_consent_signed_at),
        isMinor: Boolean(c.is_minor),
      }));
  } catch {
    return [];
  }
}
