import type { Database } from "@/lib/supabase/types";

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
