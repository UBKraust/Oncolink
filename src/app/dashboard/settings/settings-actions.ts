"use server";

import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createHash } from "crypto";
import { logAuditEvent } from "@/lib/audit/log";
import { EMPTY_REMOTE_SETTINGS } from "./settings-defaults";

export interface WorkDaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  break_start: string | null;
  break_end: string | null;
}

export interface WorkSchedule {
  monday: WorkDaySchedule;
  tuesday: WorkDaySchedule;
  wednesday: WorkDaySchedule;
  thursday: WorkDaySchedule;
  friday: WorkDaySchedule;
  saturday: WorkDaySchedule;
  sunday: WorkDaySchedule;
}

export interface TherapistSettings {
  full_name: string | null;
  cif: string | null;
  cpr_code: string | null;
  iban: string | null;
  practice_name: string | null;
  practice_address: string | null;
  practice_phone: string | null;
  practice_email: string | null;
  practice_caen: string | null;
  default_session_price: number;
  default_session_duration_minutes: number;
  session_types_pricing: Record<string, number>;
  currency: string;
  work_schedule: WorkSchedule | null;
  smartbill_username: string | null;
  smartbill_cif: string | null;
  twilio_account_sid: string | null;
  twilio_phone_number: string | null;
  cas_active: boolean;
  cas_contract_number: string | null;
  cas_county: string | null;
  has_pin: boolean;
}

const DEFAULT_SCHEDULE: WorkSchedule = {
  monday:    { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
  tuesday:   { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
  wednesday: { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
  thursday:  { enabled: true,  start: "09:00", end: "18:00", break_start: "13:00", break_end: "14:00" },
  friday:    { enabled: true,  start: "09:00", end: "17:00", break_start: "13:00", break_end: "14:00" },
  saturday:  { enabled: false, start: "10:00", end: "14:00", break_start: null,    break_end: null    },
  sunday:    { enabled: false, start: "10:00", end: "14:00", break_start: null,    break_end: null    },
};

function mergeWithDefaultSettings(
  partial?: Partial<TherapistSettings> | null,
  base: TherapistSettings = EMPTY_REMOTE_SETTINGS,
): TherapistSettings {
  return {
    ...base,
    ...partial,
    full_name: partial?.full_name ?? base.full_name,
    cif: partial?.cif ?? base.cif,
    cpr_code: partial?.cpr_code ?? base.cpr_code,
    iban: partial?.iban ?? base.iban,
    practice_name: partial?.practice_name ?? base.practice_name,
    practice_address: partial?.practice_address ?? base.practice_address,
    practice_phone: partial?.practice_phone ?? base.practice_phone,
    practice_email: partial?.practice_email ?? base.practice_email,
    practice_caen: partial?.practice_caen ?? base.practice_caen,
    default_session_price: partial?.default_session_price ?? base.default_session_price,
    default_session_duration_minutes:
      partial?.default_session_duration_minutes ?? base.default_session_duration_minutes,
    session_types_pricing: partial?.session_types_pricing ?? base.session_types_pricing,
    currency: partial?.currency ?? base.currency,
    work_schedule: partial?.work_schedule ?? base.work_schedule,
    smartbill_username: partial?.smartbill_username ?? base.smartbill_username,
    smartbill_cif: partial?.smartbill_cif ?? base.smartbill_cif,
    twilio_account_sid: partial?.twilio_account_sid ?? base.twilio_account_sid,
    twilio_phone_number: partial?.twilio_phone_number ?? base.twilio_phone_number,
    cas_active: partial?.cas_active ?? base.cas_active,
    cas_contract_number: partial?.cas_contract_number ?? base.cas_contract_number,
    cas_county: partial?.cas_county ?? base.cas_county,
    has_pin: partial?.has_pin ?? base.has_pin,
  };
}

function isLegacyTherapistSettingsSchemaError(message: string): boolean {
  return message.includes("therapist_settings.therapist_id");
}

function mapTherapistSettingsSchemaError(message: string): string {
  if (message.includes("schema cache") && message.includes("practice_")) {
    return "Baza de date nu are inca noile campuri pentru contracte. Aplica migrarea 0034_therapist_profile_contract_fields.sql, apoi reincarca pagina.";
  }

  return message;
}

async function selectTherapistSettingsRow(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const primary = await supabase
    .from("therapist_settings")
    .select("*")
    .eq("therapist_id", userId)
    .maybeSingle();

  if (!primary.error || !isLegacyTherapistSettingsSchemaError(primary.error.message)) {
    return primary;
  }

  return supabase
    .from("therapist_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
}

async function upsertTherapistSettingsRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  payload: Record<string, unknown>,
) {
  const primary = await supabase
    .from("therapist_settings")
    .upsert({ therapist_id: userId, ...payload, updated_at: new Date().toISOString() });

  if (!primary.error || !isLegacyTherapistSettingsSchemaError(primary.error.message)) {
    return primary;
  }

  const legacyPayload = { ...payload, id: 1, updated_at: new Date().toISOString() };
  return supabase
    .from("therapist_settings")
    .upsert(legacyPayload);
}

export async function getTherapistSettings(): Promise<TherapistSettings> {
  if (!isSupabaseConfigured()) return EMPTY_REMOTE_SETTINGS;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await selectTherapistSettingsRow(supabase, user.id);

  if (error) {
    throw new Error(mapTherapistSettingsSchemaError(error.message));
  }

  if (!data) return EMPTY_REMOTE_SETTINGS;

  return mergeWithDefaultSettings({
    full_name: data.full_name ?? null,
    cif: data.cif ?? null,
    cpr_code: data.cpr_code ?? null,
    iban: data.iban ?? null,
    practice_name: data.practice_name ?? null,
    practice_address: data.practice_address ?? null,
    practice_phone: data.practice_phone ?? null,
    practice_email: data.practice_email ?? null,
    practice_caen: data.practice_caen ?? null,
    default_session_price: data.default_session_price ?? 250,
    default_session_duration_minutes: data.default_session_duration_minutes ?? 50,
    session_types_pricing: data.session_types_pricing ?? { "Ședință Individuală": 250 },
    currency: data.currency ?? "RON",
    work_schedule: data.work_schedule ?? DEFAULT_SCHEDULE,
    smartbill_username: data.smartbill_username ?? null,
    smartbill_cif: data.smartbill_cif ?? null,
    twilio_account_sid: data.twilio_account_sid ?? null,
    twilio_phone_number: data.twilio_phone_number ?? null,
    cas_active: data.cas_active ?? false,
    cas_contract_number: data.cas_contract_number ?? null,
    cas_county: data.cas_county ?? null,
    has_pin: Boolean(data.clinical_notes_pin_hash),
  }, EMPTY_REMOTE_SETTINGS);
}

export async function updateProfileSettings(data: {
  full_name: string;
  cif: string;
  cpr_code: string;
  iban: string;
  practice_name: string;
  practice_address: string;
  practice_phone: string;
  practice_email: string;
  practice_caen: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase nu este configurat. Setările nu pot fi salvate încă." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, data);

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };

  void logAuditEvent({
    action: 'BILLING_SETTINGS_UPDATED',
    category: 'SETTINGS',
    severity: 'CRITICAL',
    metadata: {
      section: 'profile',
      fields: ['full_name', 'cif', 'iban', 'practice_name', 'practice_address'],
    },
  })

  return { success: true };
}

export async function updatePricingSettings(data: {
  session_types_pricing: Record<string, number>;
  default_session_price: number;
  default_session_duration_minutes: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase nu este configurat. Tarifele nu pot fi salvate încă." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, data);

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };

  void logAuditEvent({
    action: 'SETTINGS_UPDATED',
    category: 'SETTINGS',
    severity: 'INFO',
    metadata: { section: 'pricing' },
  })

  return { success: true };
}

export async function updateScheduleSettings(
  work_schedule: WorkSchedule,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase nu este configurat. Programul nu poate fi salvat încă." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, { work_schedule });

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };

  void logAuditEvent({
    action: 'SETTINGS_UPDATED',
    category: 'SETTINGS',
    severity: 'INFO',
    metadata: { section: 'schedule' },
  })

  return { success: true };
}

export async function updateIntegrationsSettings(data: {
  smartbill_username?: string;
  smartbill_token?: string;
  smartbill_cif?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase nu este configurat. Integrările nu pot fi salvate încă." };
  }

  const supabase = await createClient();
  const patch: Record<string, string> = { updated_at: new Date().toISOString() };
  if (data.smartbill_username !== undefined) patch.smartbill_username = data.smartbill_username;
  if (data.smartbill_token !== undefined) patch.smartbill_token = data.smartbill_token;
  if (data.smartbill_cif !== undefined) patch.smartbill_cif = data.smartbill_cif;
  if (data.twilio_account_sid !== undefined) patch.twilio_account_sid = data.twilio_account_sid;
  if (data.twilio_auth_token !== undefined) patch.twilio_auth_token = data.twilio_auth_token;
  if (data.twilio_phone_number !== undefined) patch.twilio_phone_number = data.twilio_phone_number;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, patch);

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };

  void logAuditEvent({
    action: 'BILLING_SETTINGS_UPDATED',
    category: 'SETTINGS',
    severity: 'CRITICAL',
    metadata: {
      section: 'integrations',
      fields_updated: Object.keys(patch).filter((k) => k !== 'updated_at'),
    },
  })

  return { success: true };
}

export async function updateCasSettings(data: {
  cas_active: boolean;
  cas_contract_number: string;
  cas_county: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase nu este configurat. Setările CAS nu pot fi salvate încă." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, data);

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };

  void logAuditEvent({
    action: 'SETTINGS_UPDATED',
    category: 'SETTINGS',
    severity: 'WARNING',
    metadata: { section: 'cas' },
  })

  return { success: true };
}

export async function updatePinSettings(
  currentPin: string,
  newPin: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase nu este configurat. PIN-ul nu poate fi salvat încă." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: row, error: rowError } = await (async () => {
    const primary = await supabase
      .from("therapist_settings")
      .select("clinical_notes_pin_hash")
      .eq("therapist_id", user.id)
      .maybeSingle();

    if (!primary.error || !isLegacyTherapistSettingsSchemaError(primary.error.message)) {
      return primary;
    }

    return supabase
      .from("therapist_settings")
      .select("clinical_notes_pin_hash")
      .eq("id", 1)
      .maybeSingle();
  })();

  if (rowError) {
    return { success: false, error: mapTherapistSettingsSchemaError(rowError.message) };
  }

  const currentHash = createHash("sha256").update(currentPin).digest("hex");
  if (row?.clinical_notes_pin_hash && row.clinical_notes_pin_hash !== currentHash) {
    return { success: false, error: "PIN curent incorect." };
  }

  const newHash = createHash("sha256").update(newPin).digest("hex");
  const { error } = await upsertTherapistSettingsRow(supabase, user.id, {
    clinical_notes_pin_hash: newHash,
  });

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };

  void logAuditEvent({
    action: 'PASSWORD_CHANGED',
    category: 'SECURITY',
    severity: 'CRITICAL',
    metadata: { section: 'clinical_notes_pin' },
  })

  return { success: true };
}
