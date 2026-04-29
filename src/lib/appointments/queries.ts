import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import type { ClientRow } from "@/lib/clients/queries";

export type { AppointmentRow };

export interface AppointmentWithClient extends AppointmentRow {
  client: Pick<ClientRow, "id" | "full_name" | "email"> | null;
  location_tag?: string | null;
  personal_notes?: string | null;
  reminders_enabled?: boolean | null;
  reminder_minutes?: number | null;
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
    .select("*, client:clients(id, full_name, email)")
    .order("appointment_date", { ascending: false })
    .limit(100);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.from) query = query.gte("appointment_date", filters.from);
  if (filters.to) query = query.lte("appointment_date", filters.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AppointmentWithClient[];
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
    .select("*, client:clients(id, full_name, email)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as AppointmentWithClient | null;
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
