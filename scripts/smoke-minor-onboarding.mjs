import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const DEV_EMAIL = "terapeut@cepaipatit.ro";
const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function computeRecommendedStatus(client, appointments = []) {
  const now = Date.now();
  const isAnonymized = Boolean(client.notes_anonymized_at);
  const hasUpcomingSession = appointments.some((appointment) => {
    if (!["PROGRAMAT", "CONFIRMAT"].includes(appointment.status)) return false;
    return new Date(appointment.appointment_date).getTime() >= now;
  });
  const hasCompletedSession = appointments.some(
    (appointment) => appointment.status === "FINALIZAT",
  );

  if (isAnonymized) return "ANONIMIZAT";
  if (hasCompletedSession) return "ACTIV";
  if (hasUpcomingSession) return "PROGRAMAT";
  if (
    client.onboarding_completed_at ||
    client.gdpr_consent_signed ||
    client.terms_consent_signed_at
  ) {
    return "ONBOARDING";
  }

  return "LEAD";
}

async function ensureDevUser() {
  const {
    data: { users },
    error,
  } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  const user = users.find((entry) => entry.email === DEV_EMAIL);
  if (!user) throw new Error(`Dev user ${DEV_EMAIL} not found`);
  return user.id;
}

async function syncLifecycleStatus(clientId, reason, metadata = {}) {
  const { data: client, error: clientError } = await serviceClient
    .from("clients")
    .select(
      "id, therapist_id, lifecycle_status, gdpr_consent_signed, is_minor, legal_liability_consent_signed_at, notes_anonymized_at, onboarding_completed_at, parent_name, parent_phone, parent_1_email, parent_1_name, parent_1_phone, scheduled_anonymization_at, terms_consent_signed_at",
    )
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) throw clientError;
  if (!client) throw new Error("Client not found");

  const { data: appointments, error: appointmentsError } = await serviceClient
    .from("appointments")
    .select("appointment_date, status")
    .eq("client_id", clientId);

  if (appointmentsError) throw appointmentsError;

  const nextStatus = computeRecommendedStatus(client, appointments ?? []);
  const currentStatus = client.lifecycle_status ?? null;

  if (currentStatus === nextStatus) return nextStatus;

  const { error: updateError } = await serviceClient
    .from("clients")
    .update({
      lifecycle_status: nextStatus,
      lifecycle_status_updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (updateError) throw updateError;

  const { error: historyError } = await serviceClient
    .from("client_status_history")
    .insert({
      client_id: clientId,
      therapist_id: client.therapist_id,
      from_status: currentStatus,
      to_status: nextStatus,
      reason,
      metadata,
    });

  if (historyError) throw historyError;
  return nextStatus;
}

async function main() {
  const therapistId = await ensureDevUser();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const { data: client, error: clientError } = await serviceClient
    .from("clients")
    .insert({
      therapist_id: therapistId,
      full_name: `Minor QA ${stamp}`,
      email: `minor.qa.${stamp}@example.com`,
      gdpr_consent_signed: false,
      is_minor: true,
      lifecycle_status: "LEAD",
      lifecycle_status_updated_at: new Date().toISOString(),
      location: "CABINET_PARTICULAR",
    })
    .select("id")
    .single();

  if (clientError) throw clientError;
  const clientId = client.id;

  try {
    const now = new Date().toISOString();
    const { error: updateError } = await serviceClient
      .from("clients")
      .update({
        is_minor: true,
        full_name: `Minor QA ${stamp}`,
        minor_cnp: "6010101223344",
        parent_1_name: "Părinte Test",
        parent_1_phone: "+40722111222",
        parent_1_email: `guardian.${stamp}@example.com`,
        parents_marital_status: "DIVORTATI_CUSTODIE_EXCLUSIVA",
        cnp_cif: "1800101223344",
        address: "Str. Test 1",
        emergency_contact_name: "Părinte Test",
        emergency_contact_phone: "+40722111222",
        emergency_contact_relation: "Părinte",
        gdpr_consent_signed: true,
        legal_liability_consent_signed_at: now,
        needs_legal_review: true,
        onboarding_completed_at: now,
      })
      .eq("id", clientId);

    if (updateError) throw updateError;

    const lifecycleStatus = await syncLifecycleStatus(
      clientId,
      "Onboarding minor finalizat",
      { source: "submitMinorOnboarding" },
    );

    const { data: updatedClient, error: fetchError } = await serviceClient
      .from("clients")
      .select("onboarding_completed_at, needs_legal_review, legal_liability_consent_signed_at, lifecycle_status")
      .eq("id", clientId)
      .single();

    if (fetchError) throw fetchError;

    const { data: history, error: historyError } = await serviceClient
      .from("client_status_history")
      .select("to_status, reason, metadata")
      .eq("client_id", clientId)
      .order("changed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (historyError) throw historyError;

    console.log(JSON.stringify({
      clientId,
      ok:
        lifecycleStatus === "ONBOARDING" &&
        updatedClient.lifecycle_status === "ONBOARDING" &&
        updatedClient.onboarding_completed_at != null &&
        updatedClient.legal_liability_consent_signed_at != null &&
        updatedClient.needs_legal_review === true &&
        history?.to_status === "ONBOARDING" &&
        history?.reason === "Onboarding minor finalizat" &&
        history?.metadata?.changed_by_name == null,
      updatedClient,
      history,
    }, null, 2));
  } finally {
    await serviceClient.from("client_status_history").delete().eq("client_id", clientId);
    await serviceClient.from("clients").delete().eq("id", clientId);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
