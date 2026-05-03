import type { ClinicalFormType } from "@/app/dashboard/forms/forms-actions";

export const FORM_TYPE_LABELS: Record<ClinicalFormType, string> = {
  ANAMNESIS: "Fișă anamneză",
  CLINICAL_INTERVIEW: "Interviu clinic",
  RISK_ASSESSMENT: "Evaluare risc",
  DBT_COMMITMENT: "Angajament terapeutic DBT",
  DBT_PROGRESS: "Raport progres DBT",
  COUNSELING_PLAN: "Plan de consiliere",
  RECOMMENDATIONS: "Fișă recomandări",
  CBT_PROGRESS: "Raport progres CBT",
  COUNSELING_PROGRESS: "Raport progres consiliere",
};
