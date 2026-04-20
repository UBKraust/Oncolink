import type { Database } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockInvoices } from "@/lib/mock/invoices";

export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

export type InvoiceStatus = "EMISĂ" | "PLĂTITĂ" | "RESTANTĂ" | "ANULATĂ";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "EMISĂ",
  "PLĂTITĂ",
  "RESTANTĂ",
  "ANULATĂ",
];

export const invoiceStatusVariant: Record<
  InvoiceStatus,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  EMISĂ: "secondary",
  PLĂTITĂ: "success",
  RESTANTĂ: "destructive",
  ANULATĂ: "warning",
};

export async function listInvoices(filters: {
  status?: string;
} = {}): Promise<InvoiceRow[]> {
  if (!isSupabaseConfigured()) {
    let rows = [...mockInvoices].sort(
      (a, b) =>
        new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime(),
    );
    if (filters.status) rows = rows.filter((r) => r.status === filters.status);
    return rows;
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("invoices")
    .select("*")
    .order("issued_at", { ascending: false })
    .limit(200);

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  if (!isSupabaseConfigured()) {
    return mockInvoices.find((i) => i.id === id) ?? null;
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
    return (
      mockInvoices.find((i) => i.appointment_id === appointmentId) ?? null
    );
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
