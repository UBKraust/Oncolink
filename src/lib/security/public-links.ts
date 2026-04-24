import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

function getPublicAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function isActiveToken(row: {
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
}) {
  return (
    !row.used_at &&
    !row.revoked_at &&
    new Date(row.expires_at).getTime() > Date.now()
  );
}

export async function createOnboardingAccessToken(params: {
  clientId: string;
  therapistId: string;
  createdBy?: string | null;
  expiresInHours?: number;
}) {
  if (!isSupabaseServiceConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }

  const admin = createSupabaseServiceClient();
  const rawToken = randomToken();
  const tokenHash = await sha256Hex(rawToken);
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + (params.expiresInHours ?? 72) * 60 * 60 * 1000,
  ).toISOString();

  await (admin as any)
    .from("onboarding_tokens")
    .update({ revoked_at: now })
    .eq("client_id", params.clientId)
    .is("used_at", null)
    .is("revoked_at", null);

  const { error } = await (admin as any).from("onboarding_tokens").insert({
    therapist_id: params.therapistId,
    client_id: params.clientId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: params.createdBy ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    token: rawToken,
    url: `${getPublicAppUrl()}/onboarding?t=${encodeURIComponent(rawToken)}`,
  };
}

export async function getOnboardingTokenPayload(rawToken: string) {
  if (!isSupabaseServiceConfigured()) {
    return null;
  }

  const admin = createSupabaseServiceClient();
  const tokenHash = await sha256Hex(rawToken);
  const { data } = await (admin as any)
    .from("onboarding_tokens")
    .select("id, therapist_id, client_id, expires_at, used_at, revoked_at, client:clients(id, full_name, email, phone)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!data || !isActiveToken(data)) {
    return null;
  }

  return data;
}

export async function consumeOnboardingAccessToken(
  rawToken: string,
  patch: Record<string, unknown>,
) {
  const tokenData = await getOnboardingTokenPayload(rawToken);
  if (!tokenData) {
    return { success: false, error: "Linkul de onboarding este invalid sau expirat." };
  }

  const admin = createSupabaseServiceClient();
  const { error } = await (admin as any)
    .from("clients")
    .update({
      ...patch,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", tokenData.client_id)
    .eq("therapist_id", tokenData.therapist_id);

  if (error) {
    return { success: false, error: error.message };
  }

  await (admin as any)
    .from("onboarding_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenData.id)
    .is("used_at", null)
    .is("revoked_at", null);

  return { success: true, client: tokenData.client };
}

export async function createAppointmentActionAccessToken(params: {
  appointmentId: string;
  therapistId: string;
  action: "confirm" | "cancel";
  createdBy?: string | null;
  expiresInHours?: number;
}) {
  if (!isSupabaseServiceConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }

  const admin = createSupabaseServiceClient();
  const rawToken = randomToken();
  const tokenHash = await sha256Hex(rawToken);
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + (params.expiresInHours ?? 48) * 60 * 60 * 1000,
  ).toISOString();

  await (admin as any)
    .from("appointment_action_tokens")
    .update({ revoked_at: now })
    .eq("appointment_id", params.appointmentId)
    .eq("action", params.action)
    .is("used_at", null)
    .is("revoked_at", null);

  const { error } = await (admin as any).from("appointment_action_tokens").insert({
    therapist_id: params.therapistId,
    appointment_id: params.appointmentId,
    action: params.action,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: params.createdBy ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    token: rawToken,
    url: `${getPublicAppUrl()}/api/confirm?t=${encodeURIComponent(rawToken)}`,
  };
}

export async function consumeAppointmentActionAccessToken(rawToken: string) {
  if (!isSupabaseServiceConfigured()) {
    return { success: false, error: "Supabase service role is not configured." };
  }

  const admin = createSupabaseServiceClient();
  const tokenHash = await sha256Hex(rawToken);
  const { data } = await (admin as any)
    .from("appointment_action_tokens")
    .select("id, appointment_id, therapist_id, action, expires_at, used_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!data || !isActiveToken(data)) {
    return { success: false, error: "Linkul de confirmare este invalid sau expirat." };
  }

  const newStatus = data.action === "confirm" ? "CONFIRMAT" : "ANULAT";
  const { error } = await (admin as any)
    .from("appointments")
    .update({ status: newStatus })
    .eq("id", data.appointment_id)
    .eq("therapist_id", data.therapist_id)
    .in("status", ["PROGRAMAT", "CONFIRMAT"]);

  if (error) {
    return { success: false, error: error.message };
  }

  await (admin as any)
    .from("appointment_action_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id)
    .is("used_at", null)
    .is("revoked_at", null);

  return { success: true, action: data.action as "confirm" | "cancel" };
}
