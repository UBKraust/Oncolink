// ─── Catalog Metadata ─────────────────────────────────────────────────────────

export type ServiceTrack =
  | "CLINICAL_PSYCHOLOGY"
  | "CBT"
  | "DBT"
  | "COUNSELING"
  | "MINOR"
  | "RESEARCH";

export type TestCategory =
  | "SCREENING_RAPID"
  | "DEPRESIE"
  | "ANXIETATE"
  | "STRES_WELLBEING"
  | "CBT"
  | "DBT"
  | "RISC_CRIZA"
  | "COPII_ADOLESCENTI"
  | "PERSONALITATE_CLINIC_AVANSAT"
  | "FORMULARE_INTERNE";

export type LicenseStatus =
  | "OPEN_VERIFY"    // posibil liber, verificat înainte de producție
  | "LICENSED"       // licențiat — nu se adaugă itemi fără drept
  | "INTERNAL_FORM"  // formular intern, fără risc de licență
  | "RESEARCH_ONLY"; // util pentru export anonim / doctorat

export type RecommendedFrequency = "T0" | "T1" | "T2" | "SESSION" | "AS_NEEDED";

export interface TestMeta {
  code: string;
  category: TestCategory;
  serviceTracks: ServiceTrack[];
  ageGroup: "adult" | "adolescent" | "child" | "all";
  estimatedDurationMinutes: number;
  licenseStatus: LicenseStatus;
  recommendedFrequency: RecommendedFrequency[];
  researchUse: boolean;
  /** Blochează butonul AI și afișează header special de risc */
  isSafetyPlan?: boolean;
  isInternalForm?: boolean;
}

// ─── Question & Test Definition ───────────────────────────────────────────────

export interface QuestionOption {
  label: string;   // e.g. "Niciodată", "Uneori"
  value: number;   // numeric weight, e.g. 0, 1, 2, 3
}

export interface Question {
  id: string;
  text: string;
  /** Defaults to "radio" when omitted */
  type?: "radio" | "textarea" | "scale" | "info";
  options: QuestionOption[];
  reverse_scoring?: boolean; // if true, score = max_value - chosen_value
  /** Placeholder text for textarea questions */
  placeholder?: string;
  /** Labels for scale endpoints */
  scaleLabel?: { min: string; max: string };
}

// ─── Scoring Logic ────────────────────────────────────────────────────────────

export interface ScoringSubscale {
  name: string;
  question_ids: string[]; // which question IDs belong to this subscale
}

export interface ScoringLogic {
  type: "SUM" | "SUBSCALES";
  subscales?: ScoringSubscale[];
  interpretation_bands?: InterpretationBand[];
}

export interface InterpretationBand {
  min: number;
  max: number;
  label: string;
  severity?: "minimal" | "mild" | "moderate" | "severe";
}

// Full test template (maps to `psychological_tests` table)
export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  scoring_logic: ScoringLogic;
  created_at?: string;
  meta?: TestMeta;
}

// ─── Assessment Results ────────────────────────────────────────────────────────

/** number for radio/scale answers, string for textarea answers */
export type RawAnswers = Record<string, number | string>;

export interface CalculatedScore {
  total: number;
  subscales: Record<string, number>; // { "Depresie": 12, "Anxietate": 8 }
  interpretation?: string;            // e.g. "Depresie moderată"
}

// Maps to `client_assessments` table
export interface ClientAssessment {
  id: string;
  client_id: string;
  test_id: string;
  raw_answers: RawAnswers;
  calculated_score: CalculatedScore;
  ai_interpretation?: string;
  created_at?: string;
}
