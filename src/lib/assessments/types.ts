// ─── Question & Test Definition ───────────────────────────────────────────────

export interface QuestionOption {
  label: string;   // e.g. "Niciodată", "Uneori"
  value: number;   // numeric weight, e.g. 0, 1, 2, 3
}

export interface Question {
  id: string;             // e.g. "q1", "q2"
  text: string;
  options: QuestionOption[];
  reverse_scoring?: boolean; // if true, score = max_value - chosen_value
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
}

// ─── Assessment Results ────────────────────────────────────────────────────────

export type RawAnswers = Record<string, number>; // { "q1": 2, "q2": 0, ... }

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
