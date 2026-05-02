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

const MANUAL_STATUSES = new Set(["INACTIV", "INCHEIAT", "NECONVERSIE"]);

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

async function syncLifecycleStatus(clientId, { force = false, reason, metadata = {} }) {
  const { data: client, error: clientError } = await serviceClient
    .from("clients")
    .select(
      "id, therapist_id, lifecycle_status, gdpr_consent_signed, is_minor, legal_liability_consent_signed_at, notes_anonymized_at, onboarding_completed_at, parent_name, parent_phone, parent_1_email, parent_1_name, parent_1_phone, scheduled_anonymization_at, terms_consent_signed_at",
    )
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) throw clientError;
  if (!client) throw new Error("Client not found");

  if (!force && client.lifecycle_status && MANUAL_STATUSES.has(client.lifecycle_status)) {
    return client.lifecycle_status;
  }

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

async function latestHistory(clientId) {
  const { data, error } = await serviceClient
    .from("client_status_history")
    .select("to_status, reason, metadata, changed_at")
    .eq("client_id", clientId)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function main() {
  const therapistId = await ensureDevUser();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const clientEmail = `qa.auto.${stamp}@example.com`;

  const { data: client, error: clientError } = await serviceClient
    .from("clients")
    .insert({
      therapist_id: therapistId,
      full_name: `QA Automation ${stamp}`,
      email: clientEmail,
      gdpr_consent_signed: false,
      is_minor: false,
      lifecycle_status: "LEAD",
      lifecycle_status_updated_at: new Date().toISOString(),
      location: "CABINET_PARTICULAR",
    })
    .select("id")
    .single();

  if (clientError) throw clientError;
  const clientId = client.id;
  const results = [];

  try {
    const upcoming = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { error: apptError } = await serviceClient.from("appointments").insert({
      therapist_id: therapistId,
      client_id: clientId,
      appointment_date: upcoming,
      duration_minutes: 50,
      status: "PROGRAMAT",
      is_external_duty: false,
    });
    if (apptError) throw apptError;

    const bookingStatus = await syncLifecycleStatus(clientId, {
      reason: "Programare publică creată",
      metadata: { source: "createPublicBooking" },
    });
    const bookingHistory = await latestHistory(clientId);
    results.push({
      step: "PUBLIC_BOOKING",
      ok:
        bookingStatus === "PROGRAMAT" &&
        bookingHistory?.to_status === "PROGRAMAT" &&
        bookingHistory?.reason === "Programare publică creată" &&
        bookingHistory?.metadata?.changed_by_name == null,
      latest: bookingHistory,
    });

    const now = new Date().toISOString();
    const { error: onboardingError } = await serviceClient
      .from("clients")
      .update({
        gdpr_consent_signed: true,
        terms_consent_signed_at: now,
        onboarding_completed_at: now,
      })
      .eq("id", clientId);
    if (onboardingError) throw onboardingError;

    const { error: deleteUpcomingError } = await serviceClient
      .from("appointments")
      .delete()
      .eq("client_id", clientId)
      .eq("status", "PROGRAMAT");
    if (deleteUpcomingError) throw deleteUpcomingError;

    const onboardingStatus = await syncLifecycleStatus(clientId, {
      reason: "Onboarding client finalizat",
      metadata: { source: "submitClientOnboarding" },
    });
    const onboardingHistory = await latestHistory(clientId);
    results.push({
      step: "ADULT_ONBOARDING",
      ok:
        onboardingStatus === "ONBOARDING" &&
        onboardingHistory?.to_status === "ONBOARDING" &&
        onboardingHistory?.reason === "Onboarding client finalizat" &&
        onboardingHistory?.metadata?.changed_by_name == null,
      latest: onboardingHistory,
    });

    const { error: finalApptError } = await serviceClient.from("appointments").insert({
      therapist_id: therapistId,
      client_id: clientId,
      appointment_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 50,
      status: "FINALIZAT",
      is_external_duty: false,
    });
    if (finalApptError) throw finalApptError;

    const finalStatus = await syncLifecycleStatus(clientId, {
      reason: "Status programare schimbat în FINALIZAT",
      metadata: { source: "updateAppointmentStatus", status: "FINALIZAT" },
    });
    const finalHistory = await latestHistory(clientId);
    results.push({
      step: "SESSION_COMPLETED",
      ok:
        finalStatus === "ACTIV" &&
        finalHistory?.to_status === "ACTIV" &&
        finalHistory?.reason === "Status programare schimbat în FINALIZAT" &&
        finalHistory?.metadata?.changed_by_name == null,
      latest: finalHistory,
    });

    const { error: anonymizeError } = await serviceClient
      .from("clients")
      .update({ notes_anonymized_at: new Date().toISOString() })
      .eq("id", clientId);
    if (anonymizeError) throw anonymizeError;

    const anonymizedStatus = await syncLifecycleStatus(clientId, {
      force: true,
      reason: "Client anonimizat",
      metadata: { source: "anonymizeClient" },
    });
    const anonymizedHistory = await latestHistory(clientId);
    results.push({
      step: "ANONYMIZE",
      ok:
        anonymizedStatus === "ANONIMIZAT" &&
        anonymizedHistory?.to_status === "ANONIMIZAT" &&
        anonymizedHistory?.reason === "Client anonimizat" &&
        anonymizedHistory?.metadata?.changed_by_name == null,
      latest: anonymizedHistory,
    });

    console.log(JSON.stringify({ clientId, results }, null, 2));
  } finally {
    await serviceClient.from("appointments").delete().eq("client_id", clientId);
    await serviceClient.from("client_status_history").delete().eq("client_id", clientId);
    await serviceClient.from("clients").delete().eq("id", clientId);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
