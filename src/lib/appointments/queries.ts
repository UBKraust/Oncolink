import { startOfDay, subDays } from "date-fns";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import type { ClientRow } from "@/lib/clients/queries";

export type { AppointmentRow };

type AppointmentClientSummary = Pick<
  ClientRow,
  "id" | "full_name" | "email" | "service_type" | "risk_level" | "contract_url" | "terms_consent_signed_at"
>;

export interface AppointmentWithClient extends AppointmentRow {
  client: AppointmentClientSummary | null;
  location_tag?: string | null;
  personal_notes?: string | null;
  reminders_enabled?: boolean | null;
  reminder_minutes?: number | null;
  notes?: { id: string }[] | null;
  invoices?: { id: string }[] | null;
  hasDiaryCardThisWeek?: boolean | null;
}

export interface ListAppointmentsFilters {
  status?: string;
  clientId?: string;
  from?: string;
  to?: string;
}

export async function listAppointments(
  filters: ListAppointmentsFilters = {},
): Promise<AppointmentWithClient[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("appointments")
    .select(
      "*, notes(id), invoices(id), client:clients(id, full_name, email, service_type, risk_level, contract_url, terms_consent_signed_at)",
    )
    .order("appointment_date", { ascending: false })
    .limit(100);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.from) query = query.gte("appointment_date", filters.from);
  if (filters.to) query = query.lte("appointment_date", filters.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const appointments = (data ?? []) as unknown as AppointmentWithClient[];
  return enrichAppointmentsWithClinicalContext(supabase, appointments);
}

export async function getAppointment(
  id: string,
): Promise<AppointmentWithClient | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "*, notes(id), invoices(id), client:clients(id, full_name, email, service_type, risk_level, contract_url, terms_consent_signed_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [appointment] = await enrichAppointmentsWithClinicalContext(supabase, [
    data as unknown as AppointmentWithClient,
  ]);
  return appointment ?? null;
}

async function enrichAppointmentsWithClinicalContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  appointments: AppointmentWithClient[],
): Promise<AppointmentWithClient[]> {
  const weekStartDate = startOfDay(
    subDays(new Date(), new Date().getDay() === 0 ? 6 : new Date().getDay() - 1),
  )
    .toISOString()
    .slice(0, 10);

  const dbtClientIds = appointments
    .map((appointment) =>
      appointment.client?.service_type === "DBT" ? appointment.client?.id ?? null : null,
    )
    .filter((id): id is string => Boolean(id));

  const diaryCardsRes = dbtClientIds.length
    ? await supabase
        .from("dbt_diary_cards")
        .select("client_id")
        .in("client_id", dbtClientIds)
        .gte("week_start", weekStartDate)
    : { data: [] as Array<{ client_id: string }> };

  const diaryClientIds = new Set((diaryCardsRes.data ?? []).map((card) => card.client_id));

  return appointments.map((appointment) => ({
    ...appointment,
    hasDiaryCardThisWeek:
      appointment.client?.service_type === "DBT"
        ? diaryClientIds.has(appointment.client.id)
        : null,
  }));
}

export async function listCasAppointments() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, clients(full_name, cnp_cif)")
    .eq("is_cas_subsidized", true)
    .order("appointment_date", { ascending: false });

  if (error) throw new Error(error.message);
  type CasAppointmentRow = AppointmentRow & {
    diagnosis_code_cim10?: string | null;
    referral_number?: string | null;
    referral_date?: string | null;
    referring_doctor_code?: string | null;
    clients:
      | { full_name: string | null; cnp_cif: string | null }
      | { full_name: string | null; cnp_cif: string | null }[]
      | null;
  };

  return ((data ?? []) as CasAppointmentRow[]).map((appointment) => {
    const clientRelation = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;

    return {
      id: appointment.id,
      client_id: appointment.client_id,
      client_name: clientRelation?.full_name || "Necunoscut",
      cnp: clientRelation?.cnp_cif || "---",
      appointment_date: appointment.appointment_date,
      diagnosis_code_cim10: appointment.diagnosis_code_cim10 ?? null,
      diagnosis_label: "Diagnostic CAS",
      referral_number: appointment.referral_number ?? null,
      referral_date: appointment.referral_date ?? null,
      referring_doctor_code: appointment.referring_doctor_code ?? null,
    };
  });
}
