"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppointment } from "@/lib/appointments/queries";
import {
  createSmartBillInvoice,
  isSmartBillConfigured,
} from "@/lib/smartbill/client";
import type { InvoiceFormState } from "@/lib/invoices/form-state";

/**
 * Creates an invoice via SmartBill for the given appointment.
 * Requires client to have CNP/CIF and address set.
 */
export async function createInvoice(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo: configurează Supabase pentru facturare." };
  }

  const appointmentId = formData.get("appointment_id") as string;
  const amountStr = formData.get("amount") as string;
  const sessionLabel = (formData.get("session_label") as string) || undefined;
  const isDraft = formData.get("is_draft") === "true";

  if (!appointmentId || !amountStr) {
    return { ok: false, error: "Câmpuri obligatorii lipsă." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { ok: false, error: "Suma trebuie să fie un număr pozitiv." };
  }

  const appointment = await getAppointment(appointmentId);
  if (!appointment) return { ok: false, error: "Programarea nu există." };
  if (!appointment.client) return { ok: false, error: "Programarea nu are client asociat." };

  const client = appointment.client as {
    id: string;
    full_name: string | null;
    email: string | null;
    cnp_cif?: string | null;
    address?: string | null;
  };

  if (!client.full_name) return { ok: false, error: "Clientul nu are nume." };

  const supabase = await createSupabaseServerClient();
  const { data: fullClient } = await supabase
    .from("clients")
    .select("cnp_cif, address")
    .eq("id", client.id)
    .maybeSingle();

  if (!fullClient?.cnp_cif) {
    return { ok: false, error: "Clientul nu are CNP/CIF configurat. Editează clientul înainte de facturare." };
  }
  if (!fullClient.address) {
    return { ok: false, error: "Clientul nu are adresă configurată. Editează clientul înainte de facturare." };
  }

  const now = new Date();
  const issueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let series: string | null = null;
  let number: string | null = null;
  let paymentLink: string | null = null;
  let pdfUrl: string | null = null;
  let smartbillId: string | null = null;

  if (isSmartBillConfigured()) {
    try {
      const result = await createSmartBillInvoice({
        client: {
          name: client.full_name,
          vatCode: fullClient.cnp_cif,
          address: fullClient.address,
          isTaxPayer: fullClient.cnp_cif.startsWith("RO"),
        },
        issueDate,
        amountRON: amount,
        sessionLabel,
        isDraft,
      });
      series = result.series;
      number = result.number;
      paymentLink = result.paymentLink || null;
      pdfUrl = result.url;
      smartbillId = `${result.series}-${result.number}`;
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  } else {
    series = process.env.SMARTBILL_SERIES ?? "PSIH";
    number = String(Date.now()).slice(-6);
    smartbillId = `${series}-${number}`;
  }

  const { data: inserted, error: dbError } = await supabase
    .from("invoices")
    .insert({
      appointment_id: appointmentId,
      client_name: client.full_name,
      smartbill_series: series,
      smartbill_number: number,
      amount,
      status: isDraft ? "EMISĂ" : "EMISĂ",
      smartbill_id: smartbillId,
      payment_link: paymentLink,
      pdf_url: pdfUrl,
      issued_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (dbError) return { ok: false, error: dbError.message };

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  return { ok: true, error: null, invoiceId: inserted.id };
}

export async function markInvoicePaid(invoiceId: string): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "PLĂTITĂ" })
    .eq("id", invoiceId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/invoices");
  return { ok: true, error: null };
}

export async function cancelInvoice(invoiceId: string): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "ANULATĂ" })
    .eq("id", invoiceId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/invoices");
  return { ok: true, error: null };
}
