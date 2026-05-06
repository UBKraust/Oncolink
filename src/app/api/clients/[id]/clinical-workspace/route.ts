import { NextResponse } from "next/server";

import { listCrisisNotes } from "@/app/dashboard/clients/crisis-notes-actions";
import { getLatestClinicalForm } from "@/app/dashboard/forms/forms-actions";
import {
  getCbtCaseFormulation,
  getClient,
  getDbtDiaryCards,
  getHomeworkItems,
  getSafetyPlan,
} from "@/lib/clients/queries";
import { createSignedObjectUrl } from "@/lib/storage/private-urls";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CbtCaseFormulation,
  ClientAssessment,
  ClientDocument,
  ClientMedication,
  CrisisNoteItem,
  DbtDiaryCard,
  HomeworkItem,
  SafetyPlan,
} from "@/components/clients/types";
import type { ClinicalFormRow } from "@/app/dashboard/forms/forms-actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const anonymized = Boolean(client.notes_anonymized_at);
    const serviceType = client.service_type;
    const isCbt = serviceType === "CBT";
    const isDbt = serviceType === "DBT";
    const isClinical = serviceType === "CLINICAL_PSYCHOLOGY";
    const isCounseling = serviceType === "COUNSELING";
    const needsSafetyPlan = isDbt || isClinical;
    const null_ = Promise.resolve(null);

    const supabase = await createSupabaseServerClient();

    const [
      { data: assessmentsData, error: assessmentsError },
      { data: docsData, error: docsError },
      { data: medsData, error: medsError },
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
      supabase.from("client_assessments").select("*").eq("client_id", id),
      supabase.from("patient_documents").select("*").eq("client_id", id),
      anonymized
        ? Promise.resolve({ data: [], error: null })
        : supabase.from("patient_medication").select("*").eq("client_id", id),
      anonymized ? Promise.resolve([]) : listCrisisNotes(id),
      isCbt && !anonymized ? getHomeworkItems(id) : Promise.resolve([] as HomeworkItem[]),
      isCbt && !anonymized ? getCbtCaseFormulation(id) : Promise.resolve(null as CbtCaseFormulation | null),
      isDbt && !anonymized ? getDbtDiaryCards(id) : Promise.resolve([] as DbtDiaryCard[]),
      needsSafetyPlan && !anonymized ? getSafetyPlan(id) : Promise.resolve(null as SafetyPlan | null),
      isClinical && !anonymized ? getLatestClinicalForm(id, "ANAMNESIS") : null_,
      isClinical && !anonymized ? getLatestClinicalForm(id, "CLINICAL_INTERVIEW") : null_,
      (isClinical || isDbt) && !anonymized ? getLatestClinicalForm(id, "RISK_ASSESSMENT") : null_,
      isDbt && !anonymized ? getLatestClinicalForm(id, "DBT_COMMITMENT") : null_,
      isDbt && !anonymized ? getLatestClinicalForm(id, "DBT_PROGRESS") : null_,
      isCbt && !anonymized ? getLatestClinicalForm(id, "CBT_PROGRESS") : null_,
      isCounseling && !anonymized ? getLatestClinicalForm(id, "COUNSELING_PLAN") : null_,
      isCounseling && !anonymized ? getLatestClinicalForm(id, "RECOMMENDATIONS") : null_,
      isCounseling && !anonymized ? getLatestClinicalForm(id, "COUNSELING_PROGRESS") : null_,
    ]);

    if (assessmentsError) throw new Error(assessmentsError.message);
    if (docsError) throw new Error(docsError.message);
    if (medsError) throw new Error(medsError.message);

    const assessments = (assessmentsData || []) as ClientAssessment[];
    const clientDocs = await Promise.all(
      ((docsData || []) as ClientDocument[]).map(async (doc) => {
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
    );

    return NextResponse.json({
      assessments,
      clientDocs,
      clientMeds: ((medsData || []) as ClientMedication[]),
      crisisNotes: (crisisNotes || []) as CrisisNoteItem[],
      homeworkItems,
      cbtFormulation,
      dbtDiaryCards,
      safetyPlan,
      anamnesisForm: anamnesisForm as ClinicalFormRow | null,
      clinicalInterviewForm: clinicalInterviewForm as ClinicalFormRow | null,
      riskAssessmentForm: riskAssessmentForm as ClinicalFormRow | null,
      dbtCommitmentForm: dbtCommitmentForm as ClinicalFormRow | null,
      dbtProgressForm: dbtProgressForm as ClinicalFormRow | null,
      cbtProgressForm: cbtProgressForm as ClinicalFormRow | null,
      counselingPlanForm: counselingPlanForm as ClinicalFormRow | null,
      recommendationsForm: recommendationsForm as ClinicalFormRow | null,
      counselingProgressForm: counselingProgressForm as ClinicalFormRow | null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut încărca workspace-ul clinic.",
      },
      { status: 500 },
    );
  }
}
