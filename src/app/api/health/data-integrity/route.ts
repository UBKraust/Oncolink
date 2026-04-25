import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

type IntegrityIssue = {
  key: string;
  severity: "info" | "warning" | "critical";
  count: number;
  sampleIds: string[];
  message: string;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { data: clients, error: clientsError },
    { data: appointments, error: appointmentsError },
    { data: invoices, error: invoicesError },
    { data: patientDocuments, error: patientDocumentsError },
    { data: referralDocuments, error: referralDocumentsError },
    { data: generatedContracts, error: generatedContractsError },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id,is_minor,full_name,minor_cnp,cnp_cif,parent_1_email,parent_1_phone,email,phone")
      .eq("therapist_id", user.id),
    supabase
      .from("appointments")
      .select("id,status,client_id")
      .eq("therapist_id", user.id),
    supabase
      .from("invoices")
      .select("id,status,appointment_id,client_id,therapist_id")
      .eq("therapist_id", user.id),
    supabase
      .from("patient_documents")
      .select("id,client_id,storage_path,document_url,drive_file_id")
      .eq("therapist_id", user.id),
    supabase
      .from("referral_documents")
      .select("id,client_id,appointment_id,storage_path,document_url,drive_file_id")
      .eq("therapist_id", user.id),
    supabase
      .from("generated_contracts")
      .select("id,patient_document_id,document_url,drive_file_id")
      .eq("therapist_id", user.id),
  ]);

  const firstError =
    clientsError ||
    appointmentsError ||
    invoicesError ||
    patientDocumentsError ||
    referralDocumentsError ||
    generatedContractsError;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const issues: IntegrityIssue[] = [];

  const clientIds = new Set((clients ?? []).map((client) => client.id));
  const appointmentIds = new Set((appointments ?? []).map((appointment) => appointment.id));
  const allowedAppointmentStatuses = new Set(["PROGRAMAT", "CONFIRMAT", "FINALIZAT", "ANULAT", "LIPSA", "REPROGRAMAT"]);
  const allowedInvoiceStatuses = new Set(["EMISĂ", "PLĂTITĂ", "RESTANTĂ", "ANULATĂ"]);

  const minorsMissingMinorCnp = (clients ?? []).filter(
    (client) => client.is_minor && !client.minor_cnp,
  );
  if (minorsMissingMinorCnp.length) {
    issues.push({
      key: "minors_missing_minor_cnp",
      severity: "warning",
      count: minorsMissingMinorCnp.length,
      sampleIds: minorsMissingMinorCnp.slice(0, 10).map((client) => client.id),
      message: "Clienți minori fără minor_cnp completat.",
    });
  }

  const appointmentsWithUnknownStatus = (appointments ?? []).filter(
    (appointment) => appointment.status && !allowedAppointmentStatuses.has(appointment.status),
  );
  if (appointmentsWithUnknownStatus.length) {
    issues.push({
      key: "appointments_unknown_status",
      severity: "critical",
      count: appointmentsWithUnknownStatus.length,
      sampleIds: appointmentsWithUnknownStatus.slice(0, 10).map((appointment) => appointment.id),
      message: "Programări cu status necunoscut față de setul folosit de aplicație.",
    });
  }

  const invoicesWithUnknownStatus = (invoices ?? []).filter(
    (invoice) => invoice.status && !allowedInvoiceStatuses.has(invoice.status),
  );
  if (invoicesWithUnknownStatus.length) {
    issues.push({
      key: "invoices_unknown_status",
      severity: "critical",
      count: invoicesWithUnknownStatus.length,
      sampleIds: invoicesWithUnknownStatus.slice(0, 10).map((invoice) => invoice.id),
      message: "Facturi cu status necunoscut față de setul folosit de aplicație.",
    });
  }

  const invoicesMissingClientLink = (invoices ?? []).filter(
    (invoice) => !invoice.client_id && invoice.appointment_id,
  );
  if (invoicesMissingClientLink.length) {
    issues.push({
      key: "invoices_missing_client_link",
      severity: "warning",
      count: invoicesMissingClientLink.length,
      sampleIds: invoicesMissingClientLink.slice(0, 10).map((invoice) => invoice.id),
      message: "Facturi cu appointment_id dar fără client_id.",
    });
  }

  const patientDocumentsWithoutBackingFile = (patientDocuments ?? []).filter(
    (document) => !document.storage_path && !document.document_url && !document.drive_file_id,
  );
  if (patientDocumentsWithoutBackingFile.length) {
    issues.push({
      key: "patient_documents_without_backing_file",
      severity: "critical",
      count: patientDocumentsWithoutBackingFile.length,
      sampleIds: patientDocumentsWithoutBackingFile.slice(0, 10).map((document) => document.id),
      message: "Documente pacient fără storage_path, document_url sau drive_file_id.",
    });
  }

  const referralDocumentsWithoutBackingFile = (referralDocuments ?? []).filter(
    (document) => !document.storage_path && !document.document_url && !document.drive_file_id,
  );
  if (referralDocumentsWithoutBackingFile.length) {
    issues.push({
      key: "referral_documents_without_backing_file",
      severity: "critical",
      count: referralDocumentsWithoutBackingFile.length,
      sampleIds: referralDocumentsWithoutBackingFile.slice(0, 10).map((document) => document.id),
      message: "Bilete de trimitere fără storage_path, document_url sau drive_file_id.",
    });
  }

  const referralDocumentsWithMissingLinks = (referralDocuments ?? []).filter(
    (document) =>
      (document.client_id && !clientIds.has(document.client_id)) ||
      (document.appointment_id && !appointmentIds.has(document.appointment_id)),
  );
  if (referralDocumentsWithMissingLinks.length) {
    issues.push({
      key: "referral_documents_missing_relations",
      severity: "critical",
      count: referralDocumentsWithMissingLinks.length,
      sampleIds: referralDocumentsWithMissingLinks.slice(0, 10).map((document) => document.id),
      message: "Bilete de trimitere cu relații lipsă spre client sau programare.",
    });
  }

  const generatedContractsWithoutDocument = (generatedContracts ?? []).filter(
    (contract) => !contract.patient_document_id && !contract.document_url && !contract.drive_file_id,
  );
  if (generatedContractsWithoutDocument.length) {
    issues.push({
      key: "generated_contracts_without_document",
      severity: "warning",
      count: generatedContractsWithoutDocument.length,
      sampleIds: generatedContractsWithoutDocument.slice(0, 10).map((contract) => contract.id),
      message: "Numere de contract generate fără document persistent atașat.",
    });
  }

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    therapistId: user.id,
    totals: {
      clients: clients?.length ?? 0,
      appointments: appointments?.length ?? 0,
      invoices: invoices?.length ?? 0,
      patientDocuments: patientDocuments?.length ?? 0,
      referralDocuments: referralDocuments?.length ?? 0,
      generatedContracts: generatedContracts?.length ?? 0,
    },
    ok: issues.length === 0,
    issues,
  });
}
