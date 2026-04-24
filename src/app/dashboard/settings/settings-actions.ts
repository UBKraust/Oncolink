"use server";

import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createHash } from "crypto";

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

const MOCK_SETTINGS: TherapistSettings = {
  full_name: "Ioana Cosmina Terente",
  cif: "41185364",
  cpr_code: "123456",
  iban: "RO89INGB0000000000000000",
  practice_name: "TERENTE IOANA-COSMINA CABINET INDIVIDUAL DE PSIHOLOGIE",
  practice_address: "Str. Mihail Sebastian 23, Bloc S13, Sc. 1, Et. 6, Ap. 22, Sector 5, Bucuresti",
  practice_phone: "0760 27 95 31",
  practice_email: "ioana.terente@gmail.com",
  practice_caen: "8690 - Alte activitati de asistenta medicala",
  default_session_price: 250,
  default_session_duration_minutes: 50,
  session_types_pricing: { "Ședință Individuală": 250, "Consiliere Cuplu": 350 },
  currency: "RON",
  work_schedule: DEFAULT_SCHEDULE,
  smartbill_username: "cabinet@terente.ro",
  smartbill_cif: "42880000",
  twilio_account_sid: null,
  twilio_phone_number: null,
  cas_active: true,
  cas_contract_number: "3456/2024",
  cas_county: "B",
  has_pin: true,
};

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
  if (!isSupabaseConfigured()) return MOCK_SETTINGS;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await selectTherapistSettingsRow(supabase, user.id);

  if (error) {
    const normalizedMessage = mapTherapistSettingsSchemaError(error.message);
    if (normalizedMessage !== error.message) {
      console.warn("[Settings] Falling back to mock practice fields:", normalizedMessage);
      return MOCK_SETTINGS;
    }

    throw new Error(normalizedMessage);
  }

  if (!data) return MOCK_SETTINGS;

  return {
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
  };
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
  if (!isSupabaseConfigured()) return { success: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, data);

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };
  return { success: true };
}

export async function updatePricingSettings(data: {
  session_types_pricing: Record<string, number>;
  default_session_price: number;
  default_session_duration_minutes: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, data);

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };
  return { success: true };
}

export async function updateScheduleSettings(
  work_schedule: WorkSchedule,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, { work_schedule });

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };
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
  if (!isSupabaseConfigured()) return { success: true };

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
  return { success: true };
}

export async function updateCasSettings(data: {
  cas_active: boolean;
  cas_contract_number: string;
  cas_county: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await upsertTherapistSettingsRow(supabase, user.id, data);

  if (error) return { success: false, error: mapTherapistSettingsSchemaError(error.message) };
  return { success: true };
}

export async function updatePinSettings(
  currentPin: string,
  newPin: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

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
  return { success: true };
}
