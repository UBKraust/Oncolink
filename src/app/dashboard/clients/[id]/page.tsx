import { notFound } from "next/navigation";
import { mockAssessments } from "@/lib/mock/assessments";
import { mockPayments } from "@/lib/mock/payments";
import { mockPatientDocuments, mockMedication } from "@/lib/mock/patientFiles";
import { listCrisisNotes } from "@/app/dashboard/clients/crisis-notes-actions";
import { getClient } from "@/lib/clients/queries";
import { ClientDashboardUI } from "@/components/clients/ClientDashboardUI";

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
    section: sectionParam
  } = await searchParams;
  
  const client = await getClient(id);
  if (!client) notFound();

  const anonymized = Boolean(client.notes_anonymized_at);
  const assessments = mockAssessments.filter(a => a.client_id === id);
  const payments = mockPayments.filter(p => p.client_id === id);
  const clientDocs = mockPatientDocuments.filter(d => d.client_id === id);
  const clientMeds = mockMedication.filter(m => m.client_id === id);
  const isMinor = (client as any).is_minor ?? false;
  const crisisNotes = anonymized ? [] : await listCrisisNotes(id);

  // Build AI context
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
    lastAssessments: assessments.slice(0, 3).map(a => ({
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
      anonymized={anonymized}
      justAnonymized={justAnonymized === "true"}
      sectionParam={sectionParam}
      assessmentParam={assessmentParam}
      aiClientContext={aiClientContext}
    />
  );
}
