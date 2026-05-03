import type { ClientProfile, ClientDocument, ClientAssessment } from "@/components/clients/types";
import type { ServiceType } from "@/lib/clients/service-track";

export type DocumentPriority = "mandatory" | "recommended" | "optional";
export type DocumentCategory = "consent" | "clinical" | "contract" | "assessment" | "report" | "safety";

export type DocumentRequirement = {
  key: string;
  label: string;
  priority: DocumentPriority;
  category: DocumentCategory;
  checkPresent: (
    client: ClientProfile,
    docs: ClientDocument[],
    assessments: ClientAssessment[],
  ) => boolean;
  actionLabel: string;
  actionHref: (clientId: string) => string;
};

// Documents common to ALL service types
const COMMON_REQUIREMENTS: DocumentRequirement[] = [
  {
    key: "gdpr_consent",
    label: "Consimțământ GDPR",
    priority: "mandatory",
    category: "consent",
    checkPresent: (client) => client.gdpr_consent_signed === true,
    actionLabel: "Marchează semnat",
    actionHref: (id) => `/dashboard/clients/${id}/edit#gdpr`,
  },
  {
    key: "onboarding",
    label: "Onboarding completat",
    priority: "mandatory",
    category: "consent",
    checkPresent: (client) => client.onboarding_completed_at !== null,
    actionLabel: "Trimite link onboarding",
    actionHref: (id) => `/dashboard/clients/${id}/onboarding`,
  },
  {
    key: "contract",
    label: "Contract prestări servicii",
    priority: "mandatory",
    category: "contract",
    checkPresent: (client) =>
      client.contract_url !== null || client.terms_consent_signed_at !== null,
    actionLabel: "Generează contract",
    actionHref: (id) => `/dashboard/documents?clientId=${id}`,
  },
  {
    key: "informed_consent",
    label: "Consimțământ informat",
    priority: "recommended",
    category: "consent",
    checkPresent: (client) => client.terms_consent_signed_at !== null,
    actionLabel: "Adaugă consimțământ",
    actionHref: (id) => `/dashboard/clients/${id}/onboarding`,
  },
];

const CLINICAL_PSYCHOLOGY_REQUIREMENTS: DocumentRequirement[] = [
  {
    key: "anamnesis",
    label: "Fișă anamneză",
    priority: "mandatory",
    category: "clinical",
    checkPresent: (_client, docs) =>
      docs.some((d) => d.document_type?.toLowerCase().includes("anamnez")),
    actionLabel: "Completează fișă",
    actionHref: (id) => `/dashboard/clients/${id}`,
  },
  {
    key: "clinical_interview",
    label: "Fișă interviu clinic",
    priority: "recommended",
    category: "clinical",
    checkPresent: (_client, docs) =>
      docs.some((d) => d.document_type?.toLowerCase().includes("interviu")),
    actionLabel: "Completează fișă",
    actionHref: (id) => `/dashboard/clients/${id}`,
  },
  {
    key: "psychological_tests",
    label: "Teste psihologice administrate",
    priority: "recommended",
    category: "assessment",
    checkPresent: (_client, _docs, assessments) => assessments.length > 0,
    actionLabel: "Adaugă evaluare",
    actionHref: (id) => `/dashboard/assessments/new?clientId=${id}`,
  },
  {
    key: "psychological_report",
    label: "Raport psihologic",
    priority: "recommended",
    category: "report",
    checkPresent: (_client, docs) =>
      docs.some(
        (d) =>
          d.document_type?.toLowerCase().includes("raport") ||
          d.file_name?.toLowerCase().includes("raport"),
      ),
    actionLabel: "Crează raport",
    actionHref: (id) => `/dashboard/forms/report/new?clientId=${id}`,
  },
  {
    key: "recommendations",
    label: "Recomandări finale",
    priority: "optional",
    category: "report",
    checkPresent: (_client, docs) =>
      docs.some((d) => d.document_type?.toLowerCase().includes("recomand")),
    actionLabel: "Completează fișă",
    actionHref: (id) => `/dashboard/clients/${id}`,
  },
];

const CBT_REQUIREMENTS: DocumentRequirement[] = [
  {
    key: "treatment_goals",
    label: "Fișă obiective terapeutice",
    priority: "mandatory",
    category: "clinical",
    checkPresent: (client) =>
      Array.isArray(client.treatment_goals) && client.treatment_goals.length > 0,
    actionLabel: "Completează obiective",
    actionHref: (id) => `/dashboard/clients/${id}/edit`,
  },
  {
    key: "case_formulation",
    label: "Formulare de caz CBT",
    priority: "recommended",
    category: "clinical",
    checkPresent: (_client, docs) =>
      docs.some(
        (d) =>
          d.document_type?.toLowerCase().includes("formular") ||
          d.document_type?.toLowerCase().includes("cbt"),
      ),
    actionLabel: "Încarcă formulare",
    actionHref: (id) => `/dashboard/clients/${id}`,
  },
  {
    key: "progress_report",
    label: "Raport progres",
    priority: "recommended",
    category: "report",
    checkPresent: (_client, docs) =>
      docs.some(
        (d) =>
          d.document_type?.toLowerCase().includes("progres") ||
          d.document_type?.toLowerCase().includes("raport"),
      ),
    actionLabel: "Crează raport",
    actionHref: (id) => `/dashboard/forms/report/new?clientId=${id}`,
  },
];

const DBT_REQUIREMENTS: DocumentRequirement[] = [
  {
    key: "risk_assessment",
    label: "Fișă evaluare risc",
    priority: "mandatory",
    category: "safety",
    checkPresent: (client) => client.risk_level !== null,
    actionLabel: "Completează evaluare risc",
    actionHref: (id) => `/dashboard/clients/${id}/edit`,
  },
  {
    key: "safety_plan",
    label: "Plan de siguranță",
    priority: "mandatory",
    category: "safety",
    checkPresent: (_client, docs) =>
      docs.some(
        (d) =>
          d.document_type?.toLowerCase().includes("sigurant") ||
          d.document_type?.toLowerCase().includes("safety") ||
          d.file_name?.toLowerCase().includes("plan"),
      ),
    actionLabel: "Adaugă plan siguranță",
    actionHref: (id) => `/dashboard/clients/${id}`,
  },
  {
    key: "dbt_contract",
    label: "Angajament terapeutic DBT",
    priority: "recommended",
    category: "contract",
    checkPresent: (_client, docs) =>
      docs.some(
        (d) =>
          d.document_type?.toLowerCase().includes("angajament") ||
          d.document_type?.toLowerCase().includes("dbt"),
      ),
    actionLabel: "Adaugă angajament",
    actionHref: (id) => `/dashboard/clients/${id}`,
  },
  {
    key: "dbt_progress",
    label: "Raport progres DBT",
    priority: "recommended",
    category: "report",
    checkPresent: (_client, docs) =>
      docs.some(
        (d) =>
          d.document_type?.toLowerCase().includes("progres") ||
          d.document_type?.toLowerCase().includes("raport"),
      ),
    actionLabel: "Crează raport",
    actionHref: (id) => `/dashboard/forms/report/new?clientId=${id}`,
  },
];

const COUNSELING_REQUIREMENTS: DocumentRequirement[] = [
  {
    key: "counseling_goal",
    label: "Fișă obiectiv consiliere",
    priority: "recommended",
    category: "clinical",
    checkPresent: (client) =>
      Array.isArray(client.treatment_goals) && client.treatment_goals.length > 0,
    actionLabel: "Definește obiectivul",
    actionHref: (id) => `/dashboard/clients/${id}/edit`,
  },
  {
    key: "recommendations",
    label: "Fișă recomandări",
    priority: "recommended",
    category: "clinical",
    checkPresent: (_client, docs) =>
      docs.some((d) => d.document_type?.toLowerCase().includes("recomand")),
    actionLabel: "Completează fișă",
    actionHref: (id) => `/dashboard/clients/${id}`,
  },
  {
    key: "progress_report",
    label: "Raport scurt progres",
    priority: "optional",
    category: "report",
    checkPresent: (_client, docs) =>
      docs.some(
        (d) =>
          d.document_type?.toLowerCase().includes("progres") ||
          d.document_type?.toLowerCase().includes("raport"),
      ),
    actionLabel: "Crează raport",
    actionHref: (id) => `/dashboard/forms/report/new?clientId=${id}`,
  },
];

const SERVICE_SPECIFIC: Partial<Record<ServiceType, DocumentRequirement[]>> = {
  CLINICAL_PSYCHOLOGY: CLINICAL_PSYCHOLOGY_REQUIREMENTS,
  CBT: CBT_REQUIREMENTS,
  DBT: DBT_REQUIREMENTS,
  COUNSELING: COUNSELING_REQUIREMENTS,
};

export function getDocumentRequirements(serviceType: ServiceType): DocumentRequirement[] {
  const specific = SERVICE_SPECIFIC[serviceType] ?? [];
  return [...COMMON_REQUIREMENTS, ...specific];
}

export type DocumentCheckResult = {
  requirement: DocumentRequirement;
  present: boolean;
};

export function checkDocumentRequirements(
  serviceType: ServiceType,
  client: ClientProfile,
  docs: ClientDocument[],
  assessments: ClientAssessment[],
): DocumentCheckResult[] {
  return getDocumentRequirements(serviceType).map((req) => ({
    requirement: req,
    present: req.checkPresent(client, docs, assessments),
  }));
}

export function getDocumentCompletionStats(results: DocumentCheckResult[]) {
  const mandatory = results.filter((r) => r.requirement.priority === "mandatory");
  const recommended = results.filter((r) => r.requirement.priority === "recommended");

  return {
    mandatoryTotal: mandatory.length,
    mandatoryDone: mandatory.filter((r) => r.present).length,
    recommendedTotal: recommended.length,
    recommendedDone: recommended.filter((r) => r.present).length,
    missingMandatory: mandatory.filter((r) => !r.present),
    missingRecommended: recommended.filter((r) => !r.present),
    allMandatoryComplete: mandatory.every((r) => r.present),
  };
}
