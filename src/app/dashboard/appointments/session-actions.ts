"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/appointments/helpers";
import {
  createSmartBillInvoice,
  isSmartBillConfigured,
} from "@/lib/smartbill/client";

export interface StatusUpdateResult {
  ok: boolean;
  error: string | null;
  autoInvoiceId?: string;
  autoInvoiceError?: string;
}

export async function updateStatusInline(
  id: string,
  status: AppointmentStatus,
): Promise<StatusUpdateResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);

  if (status !== "FINALIZAT") {
    return { ok: true, error: null };
  }

  // Check for existing invoice before auto-creating
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("appointment_id", id)
    .maybeSingle();

  if (existing) return { ok: true, error: null };

  const inv = await tryAutoInvoice(id);
  return {
    ok: true,
    error: null,
    autoInvoiceId: inv.invoiceId,
    autoInvoiceError: inv.error,
  };
}

async function tryAutoInvoice(appointmentId: string): Promise<{
  invoiceId?: string;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("*, client:clients(id, full_name, cnp_cif, address, session_price)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appt?.client) return { error: "Client lipsă." };

  const client = appt.client as {
    id: string;
    full_name: string | null;
    cnp_cif: string | null;
    address: string | null;
    session_price: number | null;
  };

  if (!client.cnp_cif || !client.address || !client.full_name) {
    return {
      error:
        "Client incomplet (CNP/CIF sau adresă lipsă) — adaugă datele și emite manual.",
    };
  }

  const amount = client.session_price ?? 250;
  const now = new Date();
  const issueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let series = process.env.SMARTBILL_SERIES ?? "PSIH";
  let number = String(Date.now()).slice(-6);
  let paymentLink: string | null = null;
  let pdfUrl: string | null = null;
  let smartbillId = `${series}-${number}`;

  if (isSmartBillConfigured()) {
    try {
      const result = await createSmartBillInvoice({
        client: {
          name: client.full_name,
          vatCode: client.cnp_cif,
          address: client.address,
          isTaxPayer: client.cnp_cif.startsWith("RO"),
        },
        issueDate,
        amountRON: amount,
        sessionLabel: "Ședință psihoterapie",
        isDraft: false,
      });
      series = result.series;
      number = result.number;
      paymentLink = result.paymentLink || null;
      pdfUrl = result.url;
      smartbillId = `${result.series}-${result.number}`;
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  const { data: inserted, error: dbError } = await supabase
    .from("invoices")
    .insert({
      appointment_id: appointmentId,
      client_name: client.full_name,
      smartbill_series: series,
      smartbill_number: number,
      amount,
      status: "EMISĂ",
      smartbill_id: smartbillId,
      payment_link: paymentLink,
      pdf_url: pdfUrl,
      issued_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/appointments/${appointmentId}`);

  return { invoiceId: inserted.id };
}
export async function updateAppointmentFields(
  id: string,
  data: {
    location_tag?: string | null;
    personal_notes?: string | null;
    reminder_minutes?: number | null;
    reminders_enabled?: boolean;
  }
) {
  if (!isSupabaseConfigured()) {
    // In demo mode, we just return success
    return { ok: true, error: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("appointments")
    .update(data)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${id}`);

  return { ok: true, error: null };
}
