import { notFound } from "next/navigation";
import { listCrisisNotes } from "@/app/dashboard/clients/crisis-notes-actions";
import { getClient } from "@/lib/clients/queries";
import { listAppointments } from "@/lib/appointments/queries";
import { ClientDashboardUI } from "@/components/clients/ClientDashboardUI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    crisisNotes
  ] = await Promise.all([
    supabase.from("client_assessments").select("*").eq("client_id", id),
    supabase.from("invoices").select("*").eq("appointment_id", id), // appointment_id or client_id? invoices table has appointment_id
    supabase.from("patient_documents").select("*").eq("client_id", id),
    supabase.from("patient_medication").select("*").eq("client_id", id),
    anonymized ? Promise.resolve([]) : listCrisisNotes(id)
  ]);

  const assessments = (assessmentsData || []) as any[];
  const payments = (paymentsData || []) as any[];
  const clientDocs = (docsData || []) as any[];
  const clientMeds = (medsData || []) as any[];
  const isMinor = (client as any).is_minor ?? false;
  const appointments = await listAppointments({ clientId: id });

  const aiClientContext = {
    name: anonymized ? null : client.full_name,
    isMinor,
    parentName: (client as any).parent_name ?? null,
    billingType: (client as any).billing_type ?? null,
    companyName: (client as any).company_name ?? null,
    sessionFrequency: (client as any).session_frequency ?? null,
    sessionPrice: (client as any).session_price ?? null,
    totalSessions: payments.length,
    totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    gdprSigned: client.gdpr_consent_signed,
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
      anonymized={anonymized}
      justAnonymized={justAnonymized === "true"}
      sectionParam={sectionParam}
      assessmentParam={assessmentParam}
      aiClientContext={aiClientContext}
    />
  );
}
