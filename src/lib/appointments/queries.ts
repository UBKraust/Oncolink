import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockAppointments } from "@/lib/mock/appointments";
import { mockClients } from "@/lib/mock/clients";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import type { ClientRow } from "@/lib/clients/queries";

export type { AppointmentRow };

export interface AppointmentWithClient extends AppointmentRow {
  client: Pick<ClientRow, "id" | "full_name" | "email"> | null;
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
    let rows = [...mockAppointments].sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime(),
    );

    if (filters.status) rows = rows.filter((r) => r.status === filters.status);
    if (filters.clientId)
      rows = rows.filter((r) => r.client_id === filters.clientId);
    if (filters.from)
      rows = rows.filter(
        (r) => new Date(r.appointment_date) >= new Date(filters.from!),
      );
    if (filters.to)
      rows = rows.filter(
        (r) => new Date(r.appointment_date) <= new Date(filters.to!),
      );

    return rows.map((r) => ({
      ...r,
      client:
        mockClients.find((c) => c.id === r.client_id) ?? null,
    })) as AppointmentWithClient[];
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
    const row = mockAppointments.find((a) => a.id === id);
    if (!row) return null;
    return {
      ...row,
      client:
        mockClients.find((c) => c.id === row.client_id) ?? null,
    } as AppointmentWithClient;
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
