import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const DEV_EMAIL = "terapeut@cepaipatit.ro";
const DEV_PASSWORD = "parola1234";

const userClient = createClient(supabaseUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MANUAL_STATUSES = new Set(["INACTIV", "INCHEIAT", "NECONVERSIE"]);

function computeRecommendedStatus(client, appointments = []) {
  const now = Date.now();
  const isMinor = Boolean(client.is_minor);
  const isAnonymized = Boolean(client.notes_anonymized_at);
  const hasUpcomingSession = appointments.some((appointment) => {
    if (!["PROGRAMAT", "CONFIRMAT"].includes(appointment.status)) return false;
    return new Date(appointment.appointment_date).getTime() >= now;
  });
  const hasCompletedSession = appointments.some(
    (appointment) => appointment.status === "FINALIZAT",
  );
  const isOnboardingComplete = Boolean(client.onboarding_completed_at);

  if (isAnonymized) return "ANONIMIZAT";
  if (hasCompletedSession) return "ACTIV";
  if (hasUpcomingSession) return "PROGRAMAT";
  if (
    isOnboardingComplete ||
    client.gdpr_consent_signed ||
    client.terms_consent_signed_at
  ) {
    return "ONBOARDING";
  }

  if (isMinor) return "LEAD";
  return "LEAD";
}

async function fetchTherapistDisplayName(userId) {
  const { data, error } = await userClient
    .from("therapist_settings")
    .select("full_name, practice_name")
    .eq("therapist_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.full_name ?? data?.practice_name ?? null;
}

async function ensureDevUser() {
  const {
    data: { users },
    error: listError,
  } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listError) throw listError;

  const existing = users.find((user) => user.email === DEV_EMAIL);
  if (existing) {
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      existing.id,
      {
        password: DEV_PASSWORD,
        email_confirm: true,
      },
    );

    if (updateError) throw updateError;
    return existing.id;
  }

  const { data, error } = await serviceClient.auth.admin.createUser({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
    email_confirm: true,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Failed to create dev user");
  return data.user.id;
}

async function ensureTherapistDisplayName(userId) {
  const { data: existing, error } = await serviceClient
    .from("therapist_settings")
    .select("full_name, practice_name")
    .eq("therapist_id", userId)
    .maybeSingle();

  if (error) throw error;

  const currentDisplayName = existing?.full_name ?? existing?.practice_name ?? null;
  if (currentDisplayName) {
    return {
      expectedChangedBy: currentDisplayName,
      restore: async () => {},
    };
  }

  const fallbackName = "QA Lifecycle Therapist";

  if (existing) {
    const originalFullName = existing.full_name;
    const originalPracticeName = existing.practice_name;
    const { error: updateError } = await serviceClient
      .from("therapist_settings")
      .update({ full_name: fallbackName })
      .eq("therapist_id", userId);

    if (updateError) throw updateError;

    return {
      expectedChangedBy: fallbackName,
      restore: async () => {
        await serviceClient
          .from("therapist_settings")
          .update({
            full_name: originalFullName,
            practice_name: originalPracticeName,
          })
          .eq("therapist_id", userId);
      },
    };
  }

  const { error: insertError } = await serviceClient
    .from("therapist_settings")
    .insert({
      therapist_id: userId,
      full_name: fallbackName,
    });

  if (insertError) throw insertError;

  return {
    expectedChangedBy: fallbackName,
    restore: async () => {
      await serviceClient
        .from("therapist_settings")
        .delete()
        .eq("therapist_id", userId)
        .eq("full_name", fallbackName);
    },
  };
}

async function setLifecycleStatus(clientId, therapistId, status, reason, metadata = {}) {
  const { data: currentClient, error: currentError } = await userClient
    .from("clients")
    .select("lifecycle_status")
    .eq("id", clientId)
    .maybeSingle();

  if (currentError) throw currentError;

  const currentStatus = currentClient?.lifecycle_status ?? null;
  const changedByName = await fetchTherapistDisplayName(therapistId);

  const { error: updateError } = await userClient
    .from("clients")
    .update({
      lifecycle_status: status,
      lifecycle_status_updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (updateError) throw updateError;

  const { error: historyError } = await userClient
    .from("client_status_history")
    .insert({
      client_id: clientId,
      therapist_id: therapistId,
      from_status: currentStatus,
      to_status: status,
      reason,
      metadata: {
        ...metadata,
        ...(changedByName ? { changed_by_name: changedByName } : {}),
      },
    });

  if (historyError) throw historyError;
}

async function syncLifecycleStatus(clientId, force = false, reason = "Lifecycle sync", metadata = {}) {
  const { data: client, error: clientError } = await userClient
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

  const { data: appointments, error: appointmentsError } = await userClient
    .from("appointments")
    .select("appointment_date, status")
    .eq("client_id", clientId);

  if (appointmentsError) throw appointmentsError;

  const nextStatus = computeRecommendedStatus(client, appointments ?? []);
  const currentStatus = client.lifecycle_status ?? null;
  if (currentStatus === nextStatus) return nextStatus;

  const changedByName = client.therapist_id
    ? await fetchTherapistDisplayName(client.therapist_id)
    : null;

  const { error: updateError } = await userClient
    .from("clients")
    .update({
      lifecycle_status: nextStatus,
      lifecycle_status_updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (updateError) throw updateError;

  const { error: historyError } = await userClient
    .from("client_status_history")
    .insert({
      client_id: clientId,
      therapist_id: client.therapist_id,
      from_status: currentStatus,
      to_status: nextStatus,
      reason,
      metadata: {
        ...metadata,
        ...(changedByName ? { changed_by_name: changedByName } : {}),
      },
    });

  if (historyError) throw historyError;

  return nextStatus;
}

async function latestHistoryForClient(clientId) {
  const { data, error } = await serviceClient
    .from("client_status_history")
    .select("id, from_status, to_status, reason, changed_at, metadata")
    .eq("client_id", clientId)
    .order("changed_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function main() {
  const ensuredUserId = await ensureDevUser();
  const displayNameState = await ensureTherapistDisplayName(ensuredUserId);

  const auth = await userClient.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  });

  if (auth.error) {
    throw new Error(`Login failed for dev user: ${auth.error.message}`);
  }

  const user = auth.data.user;
  if (!user) throw new Error("Dev user missing after sign-in.");

  const expectedChangedBy = displayNameState.expectedChangedBy;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const qaEmail = `qa.lifecycle.${stamp}@example.com`;

  const { data: clientRow, error: clientError } = await serviceClient
    .from("clients")
    .insert({
      therapist_id: user.id,
      full_name: `QA Lifecycle ${stamp}`,
      email: qaEmail,
      gdpr_consent_signed: false,
      is_minor: false,
      lifecycle_status: "LEAD",
      lifecycle_status_updated_at: new Date().toISOString(),
      location: "CABINET_PARTICULAR",
    })
    .select("id, therapist_id, lifecycle_status")
    .single();

  if (clientError) throw clientError;

  const clientId = clientRow.id;
  const results = [];

  try {
    const manualTransitions = [
      { status: "ACTIV", reason: "Marcat activ din fișa clientului" },
      { status: "INACTIV", reason: "Marcat inactiv din fișa clientului" },
      { status: "INCHEIAT", reason: "Caz încheiat din fișa clientului" },
      { status: "NECONVERSIE", reason: "Lead marcat ca neconversie din fișa clientului" },
    ];

    for (const transition of manualTransitions) {
      await setLifecycleStatus(
        clientId,
        user.id,
        transition.status,
        transition.reason,
        { source: "manual-transition" },
      );
      const history = await latestHistoryForClient(clientId);
      const latest = history[0];
      results.push({
        step: transition.status,
        ok:
          latest?.to_status === transition.status &&
          latest?.reason === transition.reason &&
          (latest?.metadata?.changed_by_name ?? null) === expectedChangedBy,
        latest,
      });
    }

    const { error: appointmentError } = await serviceClient
      .from("appointments")
      .insert({
        client_id: clientId,
        therapist_id: user.id,
        appointment_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 50,
        status: "FINALIZAT",
        is_external_duty: false,
      });

    if (appointmentError) throw appointmentError;

    const reactivatedStatus = await syncLifecycleStatus(
      clientId,
      true,
      "Client reactivat din fișa clientului",
      { source: "reactivate-client" },
    );
    const history = await latestHistoryForClient(clientId);
    const latest = history[0];
    results.push({
      step: "REACTIVATE",
      ok:
        reactivatedStatus === "ACTIV" &&
        latest?.to_status === "ACTIV" &&
        latest?.reason === "Client reactivat din fișa clientului" &&
        (latest?.metadata?.changed_by_name ?? null) === expectedChangedBy,
      latest,
    });

    console.log(JSON.stringify({
      clientId,
      expectedChangedBy,
      results,
    }, null, 2));
  } finally {
    await serviceClient.from("appointments").delete().eq("client_id", clientId);
    await serviceClient.from("client_status_history").delete().eq("client_id", clientId);
    await serviceClient.from("clients").delete().eq("id", clientId);
    await userClient.auth.signOut();
    await displayNameState.restore();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
