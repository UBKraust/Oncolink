import type { Database } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

export type InvoiceStatus = "PREGĂTITĂ" | "EMISĂ" | "PLĂTITĂ" | "RESTANTĂ" | "ANULATĂ";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "PREGĂTITĂ",
  "EMISĂ",
  "PLĂTITĂ",
  "RESTANTĂ",
  "ANULATĂ",
];

export const invoiceStatusVariant: Record<
  InvoiceStatus,
  "default" | "success" | "warning" | "destructive" | "secondary" | "info"
> = {
  PREGĂTITĂ: "info",
  EMISĂ: "secondary",
  PLĂTITĂ: "success",
  RESTANTĂ: "destructive",
  ANULATĂ: "warning",
};

export async function listInvoices(filters: {
  status?: string;
} = {}): Promise<InvoiceRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("invoices")
    .select("*, appointments(clients(full_name))")
    .order("issued_at", { ascending: false })
    .limit(200);

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  type InvoiceWithAppointmentClient = InvoiceRow & {
    appointments:
      | { clients: { full_name: string | null } | { full_name: string | null }[] | null }
      | { clients: { full_name: string | null } | { full_name: string | null }[] | null }[]
      | null;
  };

  return ((data ?? []) as InvoiceWithAppointmentClient[]).map((invoice) => {
    const appointmentRelation = Array.isArray(invoice.appointments)
      ? invoice.appointments[0]
      : invoice.appointments;
    const clientRelation = Array.isArray(appointmentRelation?.clients)
      ? appointmentRelation.clients[0]
      : appointmentRelation?.clients;

    return {
      ...invoice,
      client_name: clientRelation?.full_name || "Client Necunoscut",
    };
  });
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getInvoiceByAppointment(
  appointmentId: string,
): Promise<InvoiceRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
