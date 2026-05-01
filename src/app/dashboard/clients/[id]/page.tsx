import { notFound } from "next/navigation";
import { listCrisisNotes } from "@/app/dashboard/clients/crisis-notes-actions";
import { getClient, getClientStatusHistory } from "@/lib/clients/queries";
import { listAppointments } from "@/lib/appointments/queries";
import { ClientDashboardUI } from "@/components/clients/ClientDashboardUI";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";
import type {
  ClientAiContext,
  ClientAssessment,
  ClientDocument,
  ClientMedication,
  ClientPayment,
  ClientStatusHistoryItem,
} from "@/components/clients/types";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    anonymized?: string;
    assessment?: string;
    section?: string;
  }>;
}) {
  const { id } = await params;
  const {
    anonymized: justAnonymized,
    assessment: assessmentParam,
    section: sectionParam,
  } = await searchParams;

  const client = await getClient(id);
  if (!client) notFound();

  const supabase = await createSupabaseServerClient();
  const anonymized = Boolean(client.notes_anonymized_at);

  // Fetch real data from Supabase
  const [
    { data: assessmentsData },
    { data: paymentsData },
    { data: docsData },
    { data: medsData },
    crisisNotes,
    statusHistory,
  ] = await Promise.all([
    supabase.from("client_assessments").select("*").eq("client_id", id),
    supabase.from("invoices").select("*").eq("client_id", id),
    supabase.from("patient_documents").select("*").eq("client_id", id),
    supabase.from("patient_medication").select("*").eq("client_id", id),
    anonymized ? Promise.resolve([]) : listCrisisNotes(id),
    getClientStatusHistory(id),
  ]);

  const assessments = (assessmentsData || []) as ClientAssessment[];
  const payments = ((paymentsData || []) as Array<{ amount: number | null } & ClientPayment>).map((payment) => ({
    ...payment,
    amount: Number(payment.amount ?? 0),
  }));
  const clientDocs = await Promise.all(
    ((docsData || []) as ClientDocument[]).map(async (doc) => ({
      ...doc,
      file_name: doc.file_name ?? "Document",
      document_type: doc.document_type ?? "Fișier",
      created_at: doc.created_at ?? doc.uploaded_at ?? new Date().toISOString(),
      drive_link:
        doc.drive_link ??
        (await createSignedObjectUrl(
          supabase,
          "patient-documents",
          typeof doc.storage_path === "string" ? doc.storage_path : null,
        )) ??
        (typeof doc.document_url === "string" ? doc.document_url : null) ??
        "",
      document_url:
        (await createSignedObjectUrl(
          supabase,
          "patient-documents",
          typeof doc.storage_path === "string" ? doc.storage_path : null,
        )) ??
        (typeof doc.document_url === "string" ? doc.document_url : null),
    })),
  );
  const clientMeds = (medsData || []) as ClientMedication[];
  const isMinor = client.is_minor ?? false;
  const appointments = await listAppointments({ clientId: id });
  const lifecycleHistory = (statusHistory || []).map((item) => {
    const meta =
      item.metadata != null && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : {};
    return {
      id: item.id,
      from_status: item.from_status,
      to_status: item.to_status,
      reason: item.reason,
      changed_at: item.changed_at,
      changed_by_name: typeof meta.changed_by_name === "string" ? meta.changed_by_name : null,
    };
  }) as ClientStatusHistoryItem[];

  const aiClientContext: ClientAiContext = {
    name: anonymized ? null : client.full_name,
    isMinor,
    parentName: client.parent_name ?? null,
    billingType: client.billing_type ?? null,
    companyName: client.company_name ?? null,
    sessionFrequency: client.session_frequency ?? null,
    sessionPrice: client.session_price != null ? String(client.session_price) : null,
    totalSessions: payments.length,
    totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    gdprSigned: Boolean(client.gdpr_consent_signed),
    lastAssessments: assessments.slice(0, 3).map((a) => ({
      type: a.assessment_type,
      date: new Date(a.created_at).toLocaleDateString("ro-RO"),
      scores: a.scoring_data,
    })),
  };

  return (
    <ClientDashboardUI
      client={client}
      assessments={assessments}
      payments={payments}
      clientDocs={clientDocs}
      clientMeds={clientMeds}
      crisisNotes={crisisNotes}
      appointments={appointments}
      lifecycleHistory={lifecycleHistory}
      anonymized={anonymized}
      justAnonymized={justAnonymized === "true"}
      sectionParam={sectionParam}
      assessmentParam={assessmentParam}
      aiClientContext={aiClientContext}
    />
  );
}
