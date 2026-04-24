import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, clients(full_name, cnp_cif)")
    .eq("is_cas_subsidized", true)
    .order("appointment_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(a => ({
    id: a.id,
    client_id: a.client_id,
    client_name: (a.clients as any)?.full_name || "Necunoscut",
    cnp: (a.clients as any)?.cnp_cif || "---",
    appointment_date: a.appointment_date,
    diagnosis_code_cim10: a.diagnosis_code_cim10,
    diagnosis_label: "Diagnostic CAS",
    referral_number: a.referral_number,
    referral_date: a.referral_date,
    referring_doctor_code: a.referring_doctor_code,
  }));
}
