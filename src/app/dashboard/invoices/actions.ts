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
import { logAuditEvent } from "@/lib/audit/log";

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

  void logAuditEvent({
    action: 'INVOICE_CREATED',
    category: 'INVOICE',
    entityType: 'invoice',
    entityId: inserted.id,
    clientId: client.id,
    severity: 'INFO',
    metadata: {
      smartbill_id: smartbillId,
      amount,
      appointment_id: appointmentId,
      is_draft: isDraft,
    },
  })

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  return { ok: true, error: null, invoiceId: inserted.id };
}

export async function queueMonthlyInvoices(
  year: number,
  month: number,
): Promise<{ ok: boolean; error: string | null; createdCount?: number; skippedCount?: number }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo: configurează Supabase pentru coada financiară." };
  }

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, error: "Luna selectată este invalidă." };
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 1).toISOString().slice(0, 10);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, error: userError.message };
  }

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, appointment_date, client_id, client:clients(full_name, session_price), invoices(id)")
    .gte("appointment_date", startDate)
    .lt("appointment_date", endDate)
    .eq("status", "FINALIZAT")
    .eq("therapist_id", user.id);

  if (appointmentsError) {
    return { ok: false, error: appointmentsError.message };
  }

  const invoiceRows = (appointments ?? [])
    .filter((appointment) => {
      const relation = Array.isArray(appointment.invoices)
        ? appointment.invoices[0]
        : appointment.invoices;
      return !relation?.id;
    })
    .map((appointment) => {
      const clientRelation = Array.isArray(appointment.client)
        ? appointment.client[0]
        : appointment.client;

      return {
        appointment_id: appointment.id,
        client_name: clientRelation?.full_name ?? "Client necunoscut",
        amount: Number(clientRelation?.session_price ?? 250),
        status: "PREGĂTITĂ",
        issued_at: new Date().toISOString(),
        therapist_id: user.id,
      };
    });

  if (invoiceRows.length === 0) {
    return { ok: true, error: null, createdCount: 0, skippedCount: (appointments ?? []).length };
  }

  const { error: insertError } = await supabase.from("invoices").insert(invoiceRows);

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  void logAuditEvent({
    action: "INVOICE_CREATED",
    category: "INVOICE",
    severity: "INFO",
    metadata: {
      source: "monthly-financial-queue",
      year,
      month,
      created_count: invoiceRows.length,
    },
  });

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/appointments");

  return {
    ok: true,
    error: null,
    createdCount: invoiceRows.length,
    skippedCount: (appointments ?? []).length - invoiceRows.length,
  };
}

export async function sendPreparedInvoiceToSmartBill(
  invoiceId: string,
): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Mod demo." };
  }

  if (!isSmartBillConfigured()) {
    return { ok: false, error: "SmartBill nu este configurat." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError) return { ok: false, error: invoiceError.message };
  if (!invoice) return { ok: false, error: "Factura nu există." };
  if (invoice.status !== "PREGĂTITĂ") {
    return { ok: false, error: "Doar facturile pregătite pot fi trimise în SmartBill." };
  }
  if (!invoice.appointment_id) {
    return { ok: false, error: "Factura pregătită nu are programare asociată." };
  }

  const appointment = await getAppointment(invoice.appointment_id);
  if (!appointment?.client) {
    return { ok: false, error: "Nu am găsit clientul asociat acestei facturi." };
  }

  const { data: fullClient, error: clientError } = await supabase
    .from("clients")
    .select("cnp_cif, address")
    .eq("id", appointment.client.id)
    .maybeSingle();

  if (clientError) return { ok: false, error: clientError.message };
  if (!fullClient?.cnp_cif) {
    return { ok: false, error: "Clientul nu are CNP/CIF configurat." };
  }
  if (!fullClient.address) {
    return { ok: false, error: "Clientul nu are adresă configurată." };
  }

  const now = new Date();
  const issueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  try {
    const result = await createSmartBillInvoice({
      client: {
        name: appointment.client.full_name ?? invoice.client_name ?? "Client necunoscut",
        vatCode: fullClient.cnp_cif,
        address: fullClient.address,
        isTaxPayer: fullClient.cnp_cif.startsWith("RO"),
      },
      issueDate,
      amountRON: Number(invoice.amount ?? 0),
      sessionLabel: "Ședință psihoterapie",
      isDraft: false,
    });

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "EMISĂ",
        smartbill_series: result.series,
        smartbill_number: result.number,
        smartbill_id: `${result.series}-${result.number}`,
        payment_link: result.paymentLink || null,
        pdf_url: result.url,
        issued_at: now.toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) return { ok: false, error: updateError.message };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  return { ok: true, error: null };
}

export async function sendPreparedMonthlyInvoicesToSmartBill(
  year: number,
  month: number,
  clientIds: string[],
): Promise<{
  ok: boolean;
  error: string | null;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Mod demo: configurează Supabase pentru emiterea facturilor.",
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  if (!isSmartBillConfigured()) {
    return {
      ok: false,
      error: "SmartBill nu este configurat.",
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return {
      ok: false,
      error: "Luna selectată este invalidă.",
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const normalizedClientIds = [...new Set(clientIds.filter(Boolean))];
  if (normalizedClientIds.length === 0) {
    return {
      ok: false,
      error: "Selectează cel puțin un client din coada financiară.",
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 1).toISOString().slice(0, 10);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      ok: false,
      error: userError.message,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  if (!user) {
    return {
      ok: false,
      error: "Unauthorized",
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, client_id")
    .gte("appointment_date", startDate)
    .lt("appointment_date", endDate)
    .eq("therapist_id", user.id)
    .in("client_id", normalizedClientIds);

  if (appointmentsError) {
    return {
      ok: false,
      error: appointmentsError.message,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const appointmentIds = (appointments ?? []).map((appointment) => appointment.id);
  if (appointmentIds.length === 0) {
    return {
      ok: true,
      error: null,
      sentCount: 0,
      skippedCount: normalizedClientIds.length,
      failedCount: 0,
    };
  }

  const { data: preparedInvoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id")
    .eq("therapist_id", user.id)
    .eq("status", "PREGĂTITĂ")
    .in("appointment_id", appointmentIds);

  if (invoicesError) {
    return {
      ok: false,
      error: invoicesError.message,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };
  }

  const invoicesToSend = preparedInvoices ?? [];
  if (invoicesToSend.length === 0) {
    return {
      ok: true,
      error: null,
      sentCount: 0,
      skippedCount: normalizedClientIds.length,
      failedCount: 0,
    };
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const invoice of invoicesToSend) {
    const result = await sendPreparedInvoiceToSmartBill(invoice.id);
    if (result.ok) {
      sentCount += 1;
    } else {
      failedCount += 1;
    }
  }

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/invoices");

  return {
    ok: failedCount === 0,
    error:
      failedCount > 0
        ? `${failedCount} facturi nu au putut fi trimise în SmartBill.`
        : null,
    sentCount,
    skippedCount: normalizedClientIds.length - sentCount - failedCount < 0
      ? 0
      : normalizedClientIds.length - sentCount - failedCount,
    failedCount,
  };
}

export async function sendPreparedInvoicesBatch(
  invoiceIds: string[],
): Promise<{
  ok: boolean;
  error: string | null;
  sentCount: number;
  failedCount: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Mod demo: configurează Supabase pentru emiterea facturilor.",
      sentCount: 0,
      failedCount: 0,
    };
  }

  if (!isSmartBillConfigured()) {
    return {
      ok: false,
      error: "SmartBill nu este configurat.",
      sentCount: 0,
      failedCount: 0,
    };
  }

  const normalizedInvoiceIds = [...new Set(invoiceIds.filter(Boolean))];
  if (normalizedInvoiceIds.length === 0) {
    return {
      ok: false,
      error: "Selectează cel puțin o factură pregătită.",
      sentCount: 0,
      failedCount: 0,
    };
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const invoiceId of normalizedInvoiceIds) {
    const result = await sendPreparedInvoiceToSmartBill(invoiceId);
    if (result.ok) {
      sentCount += 1;
    } else {
      failedCount += 1;
    }
  }

  revalidatePath("/dashboard/invoices");

  return {
    ok: failedCount === 0,
    error:
      failedCount > 0
        ? `${failedCount} facturi nu au putut fi trimise în SmartBill.`
        : null,
    sentCount,
    failedCount,
  };
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
