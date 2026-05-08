import { notFound } from "next/navigation";
import { listCrisisNotes } from "@/app/dashboard/clients/crisis-notes-actions";
import {
  getClient,
  getClientAccessHistory,
  getClientStatusHistory,
  getHomeworkItems,
  getCbtCaseFormulation,
  getDbtDiaryCards,
  getSafetyPlan,
} from "@/lib/clients/queries";
import { getLatestClinicalForm } from "@/app/dashboard/forms/forms-actions";
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
  HomeworkItem,
  CbtCaseFormulation,
  DbtDiaryCard,
  SafetyPlan,
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
    view?: string;
  }>;
}) {
  const { id } = await params;
  const {
    anonymized: justAnonymized,
    assessment: assessmentParam,
    section: sectionParam,
    view: viewParam,
  } = await searchParams;
  const shouldPreloadLifecycle = viewParam === "lifecycle";
  const shouldPreloadClinic = viewParam === "clinic" || Boolean(assessmentParam);

  const clientPromise = getClient(id);
  const supabasePromise = createSupabaseServerClient();
  const appointmentsPromise = listAppointments({ clientId: id });
  const statusHistoryPromise = shouldPreloadLifecycle
    ? getClientStatusHistory(id)
    : Promise.resolve([]);
  const accessHistoryPromise = shouldPreloadLifecycle
    ? getClientAccessHistory(id)
    : Promise.resolve([]);

  const client = await clientPromise;
  if (!client) notFound();

  const supabase = await supabasePromise;
  const anonymized = Boolean(client.notes_anonymized_at);
  const serviceType = (client as Record<string, unknown>).service_type as string | null;

  // Fetch core data in parallel
  const [
    { data: assessmentsData },
    { data: docsData },
    { count: medicationCount },
    { count: crisisNotesCount },
    statusHistory,
    accessHistory,
    appointments,
  ] = await Promise.all([
    shouldPreloadClinic
      ? supabase.from("client_assessments").select("*").eq("client_id", id)
      : supabase
          .from("client_assessments")
          .select("id, assessment_type, created_at, content_summary, scoring_data, sent_to_parent_at")
          .eq("client_id", id)
          .order("created_at", { ascending: false })
          .limit(3),
    supabase
      .from("patient_documents")
      .select("id, file_name, document_type, storage_path, document_url, drive_link, created_at, uploaded_at")
      .eq("client_id", id),
    anonymized
      ? Promise.resolve({ count: 0 })
      : supabase.from("patient_medication").select("id", { count: "exact", head: true }).eq("client_id", id),
    anonymized
      ? Promise.resolve({ count: 0 })
      : supabase.from("client_crisis_notes").select("id", { count: "exact", head: true }).eq("client_id", id),
    statusHistoryPromise,
    accessHistoryPromise,
    appointmentsPromise,
  ]);

  const appointmentIds = appointments.map((appointment) => appointment.id);
  const paymentsData =
    appointmentIds.length > 0
      ? await supabase
          .from("invoices")
          .select("*, appointments(appointment_date, duration_minutes)")
          .in("appointment_id", appointmentIds)
          .order("issued_at", { ascending: false })
      : { data: [] as Array<ClientPayment & { appointments?: { appointment_date: string | null; duration_minutes: number | null } | { appointment_date: string | null; duration_minutes: number | null }[] | null }> };

  // Fetch P2 clinical tools conditionally per service_type
  const isCbt = serviceType === "CBT";
  const isDbt = serviceType === "DBT";
  const needsSafetyPlan = isDbt || serviceType === "CLINICAL_PSYCHOLOGY";

  const isClinical = serviceType === "CLINICAL_PSYCHOLOGY";
  const isCounseling = serviceType === "COUNSELING";
  const null_ = Promise.resolve(null);

  const [
    clinicAssessments,
    clinicDocs,
    clinicMeds,
    crisisNotes,
    homeworkItems,
    cbtFormulation,
    dbtDiaryCards,
    safetyPlan,
    anamnesisForm,
    clinicalInterviewForm,
    riskAssessmentForm,
    dbtCommitmentForm,
    dbtProgressForm,
    cbtProgressForm,
    counselingPlanForm,
    recommendationsForm,
    counselingProgressForm,
  ] = await Promise.all([
    Promise.resolve((assessmentsData || []) as ClientAssessment[]),
    Promise.all(
      ((docsData || []) as ClientDocument[]).map(async (doc) => {
        if (!shouldPreloadClinic) {
          return {
            ...doc,
            file_name: doc.file_name ?? "Document",
            document_type: doc.document_type ?? "Fișier",
            created_at: doc.created_at ?? doc.uploaded_at ?? new Date().toISOString(),
          };
        }

        const signedUrl =
          (await createSignedObjectUrl(
            supabase,
            "patient-documents",
            typeof doc.storage_path === "string" ? doc.storage_path : null,
          )) ??
          (typeof doc.document_url === "string" ? doc.document_url : null);

        return {
          ...doc,
          file_name: doc.file_name ?? "Document",
          document_type: doc.document_type ?? "Fișier",
          created_at: doc.created_at ?? doc.uploaded_at ?? new Date().toISOString(),
          download_url: `/api/documents/patient/${doc.id}/download`,
          drive_link: doc.drive_link ?? signedUrl ?? "",
          document_url: signedUrl,
        };
      }),
    ),
    shouldPreloadClinic && !anonymized
      ? supabase.from("patient_medication").select("*").eq("client_id", id).then(({ data }) => (data || []) as ClientMedication[])
      : Promise.resolve([] as ClientMedication[]),
    shouldPreloadClinic && !anonymized ? listCrisisNotes(id) : Promise.resolve([]),
    shouldPreloadClinic && isCbt && !anonymized ? getHomeworkItems(id) : Promise.resolve([] as HomeworkItem[]),
    shouldPreloadClinic && isCbt && !anonymized ? getCbtCaseFormulation(id) : Promise.resolve(null as CbtCaseFormulation | null),
    shouldPreloadClinic && isDbt && !anonymized ? getDbtDiaryCards(id) : Promise.resolve([] as DbtDiaryCard[]),
    shouldPreloadClinic && needsSafetyPlan && !anonymized ? getSafetyPlan(id) : Promise.resolve(null as SafetyPlan | null),
    shouldPreloadClinic && isClinical && !anonymized ? getLatestClinicalForm(id, "ANAMNESIS") : null_,
    shouldPreloadClinic && isClinical && !anonymized ? getLatestClinicalForm(id, "CLINICAL_INTERVIEW") : null_,
    shouldPreloadClinic && (isClinical || isDbt) && !anonymized ? getLatestClinicalForm(id, "RISK_ASSESSMENT") : null_,
    shouldPreloadClinic && isDbt && !anonymized ? getLatestClinicalForm(id, "DBT_COMMITMENT") : null_,
    shouldPreloadClinic && isDbt && !anonymized ? getLatestClinicalForm(id, "DBT_PROGRESS") : null_,
    shouldPreloadClinic && isCbt && !anonymized ? getLatestClinicalForm(id, "CBT_PROGRESS") : null_,
    shouldPreloadClinic && isCounseling && !anonymized ? getLatestClinicalForm(id, "COUNSELING_PLAN") : null_,
    shouldPreloadClinic && isCounseling && !anonymized ? getLatestClinicalForm(id, "RECOMMENDATIONS") : null_,
    shouldPreloadClinic && isCounseling && !anonymized ? getLatestClinicalForm(id, "COUNSELING_PROGRESS") : null_,
  ]);

  const assessments = clinicAssessments;
  const payments = ((paymentsData.data || []) as Array<
    { amount: number | null } & ClientPayment & {
      appointments?:
        | { appointment_date: string | null; duration_minutes: number | null }
        | { appointment_date: string | null; duration_minutes: number | null }[]
        | null;
    }
  >).map((payment) => {
    const appointmentRelation = Array.isArray(payment.appointments)
      ? payment.appointments[0]
      : payment.appointments;

    return {
      ...payment,
      amount: Number(payment.amount ?? 0),
      appointment_date: appointmentRelation?.appointment_date ?? null,
      duration_minutes: appointmentRelation?.duration_minutes ?? null,
    };
  });
  const clientDocs = clinicDocs;
  const clientMeds = clinicMeds;
  const isMinor = client.is_minor ?? false;
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
      medicationCount={medicationCount ?? 0}
      crisisNotesCount={crisisNotesCount ?? 0}
      clinicDataPreloaded={shouldPreloadClinic}
      appointments={appointments}
      lifecycleHistory={lifecycleHistory}
      accessHistory={accessHistory}
      lifecycleDataPreloaded={shouldPreloadLifecycle}
      anonymized={anonymized}
      justAnonymized={justAnonymized === "true"}
      viewParam={viewParam}
      sectionParam={sectionParam}
      assessmentParam={assessmentParam}
      aiClientContext={aiClientContext}
      homeworkItems={homeworkItems}
      cbtFormulation={cbtFormulation}
      dbtDiaryCards={dbtDiaryCards}
      safetyPlan={safetyPlan}
      anamnesisForm={anamnesisForm}
      clinicalInterviewForm={clinicalInterviewForm}
      riskAssessmentForm={riskAssessmentForm}
      dbtCommitmentForm={dbtCommitmentForm}
      dbtProgressForm={dbtProgressForm}
      cbtProgressForm={cbtProgressForm}
      counselingPlanForm={counselingPlanForm}
      recommendationsForm={recommendationsForm}
      counselingProgressForm={counselingProgressForm}
    />
  );
}
