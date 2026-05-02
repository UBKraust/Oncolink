import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type ClientLifecycleStatus,
  computeRecommendedClientLifecycleStatus,
} from "@/lib/clients/lifecycle";

export type SupabaseServerDb = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function fetchTherapistDisplayName(
  supabase: SupabaseServerDb,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("therapist_settings")
    .select("full_name, practice_name")
    .eq("therapist_id", userId)
    .maybeSingle();
  return data?.full_name ?? data?.practice_name ?? null;
}

const MANUAL_STATUSES = new Set<ClientLifecycleStatus>([
  "INACTIV",
  "INCHEIAT",
  "NECONVERSIE",
]);

type SyncOptions = {
  force?: boolean;
  metadata?: Record<string, unknown>;
  reason?: string;
};

function isLifecycleSchemaMissing(message: string) {
  return (
    message.includes("clients.lifecycle_status") ||
    message.includes("lifecycle_status_updated_at") ||
    message.includes("client_status_history")
  );
}

export async function syncClientLifecycleStatus(
  supabase: SupabaseServerDb,
  clientId: string,
  options: SyncOptions = {},
) {
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(
      "id, therapist_id, lifecycle_status, gdpr_consent_signed, is_minor, legal_liability_consent_signed_at, notes_anonymized_at, onboarding_completed_at, parent_name, parent_phone, parent_1_email, parent_1_name, parent_1_phone, scheduled_anonymization_at, terms_consent_signed_at",
    )
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    if (isLifecycleSchemaMissing(clientError.message)) return null;
    throw new Error(clientError.message);
  }
  if (!client) return null;

  if (
    !options.force &&
    client.lifecycle_status &&
    MANUAL_STATUSES.has(client.lifecycle_status as ClientLifecycleStatus)
  ) {
    return client.lifecycle_status as ClientLifecycleStatus;
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("appointment_date, status")
    .eq("client_id", clientId);

  if (appointmentsError) throw new Error(appointmentsError.message);

  const nextStatus = computeRecommendedClientLifecycleStatus(
    client,
    appointments ?? [],
  );
  const currentStatus =
    (client.lifecycle_status as ClientLifecycleStatus | null) ?? null;

  if (currentStatus === nextStatus) {
    return nextStatus;
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      lifecycle_status: nextStatus,
      lifecycle_status_updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (updateError) {
    if (isLifecycleSchemaMissing(updateError.message)) return nextStatus;
    throw new Error(updateError.message);
  }

  const { data: authData } = await supabase.auth.getUser();
  const changedByName = authData.user
    ? await fetchTherapistDisplayName(supabase, authData.user.id)
    : null;

  const { error: historyError } = await supabase
    .from("client_status_history")
    .insert({
      client_id: clientId,
      therapist_id: client.therapist_id,
      from_status: currentStatus,
      to_status: nextStatus,
      reason: options.reason ?? "Lifecycle sync",
      metadata: {
        ...(options.metadata ?? {}),
        ...(changedByName ? { changed_by_name: changedByName } : {}),
      },
    });

  if (historyError) {
    if (isLifecycleSchemaMissing(historyError.message)) return nextStatus;
    throw new Error(historyError.message);
  }

  return nextStatus;
}

export async function setClientLifecycleStatus(
  supabase: SupabaseServerDb,
  params: {
    clientId: string;
    metadata?: Record<string, unknown>;
    reason: string;
    status: ClientLifecycleStatus;
  },
) {
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, therapist_id, lifecycle_status")
    .eq("id", params.clientId)
    .maybeSingle();

  if (clientError) {
    if (isLifecycleSchemaMissing(clientError.message)) return null;
    throw new Error(clientError.message);
  }
  if (!client) return null;

  const currentStatus =
    (client.lifecycle_status as ClientLifecycleStatus | null) ?? null;

  if (currentStatus === params.status) {
    return params.status;
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      lifecycle_status: params.status,
      lifecycle_status_updated_at: new Date().toISOString(),
    })
    .eq("id", params.clientId);

  if (updateError) {
    if (isLifecycleSchemaMissing(updateError.message)) return params.status;
    throw new Error(updateError.message);
  }

  const { data: authData } = await supabase.auth.getUser();
  const changedByName = authData.user
    ? await fetchTherapistDisplayName(supabase, authData.user.id)
    : null;

  const { error: historyError } = await supabase
    .from("client_status_history")
    .insert({
      client_id: params.clientId,
      therapist_id: client.therapist_id,
      from_status: currentStatus,
      to_status: params.status,
      reason: params.reason,
      metadata: {
        ...(params.metadata ?? {}),
        ...(changedByName ? { changed_by_name: changedByName } : {}),
      },
    });

  if (historyError) {
    if (isLifecycleSchemaMissing(historyError.message)) return params.status;
    throw new Error(historyError.message);
  }

  return params.status;
}
