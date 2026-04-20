export interface TestQuestion {
  id: string;
  text: string;
  options: { label: string; value: number }[];
  reverse_scoring?: boolean;
}

export interface PsychologicalTest {
  id: string;
  name: string;
  description: string;
  questions: TestQuestion[];
  scoring_logic: {
    type: "SUM" | "AVERAGE" | "SUBSCALES";
    subscales?: Record<string, string[]>; // e.g. { "Depression": ["q1", "q4"], "Anxiety": ["q2", "q3"] }
    interpretation_bands?: { min: number; max: number; label: string }[];
  };
}

export const mockPsychologicalTests: PsychologicalTest[] = [
  {
    id: "t-dass-21",
    name: "DASS-21 (Depression, Anxiety and Stress Scale - 21 items)",
    description: "Evaluează severitatea simptomelor de depresie, anxietate și stres în ultima săptămână.",
    scoring_logic: {
      type: "SUBSCALES",
      subscales: {
        "Depresie": ["q3", "q5", "q10", "q13", "q16", "q17", "q21"],
        "Anxietate": ["q2", "q4", "q7", "q9", "q15", "q19", "q20"],
        "Stres": ["q1", "q6", "q8", "q11", "q12", "q14", "q18"]
      }
    },
    questions: [
      { id: "q1", text: "Mi-a fost greu să mă liniștesc", options: [{ label: "Deloc", value: 0 }, { label: "Uneori", value: 1 }, { label: "Deseori", value: 2 }, { label: "Aproape mereu", value: 3 }] },
      { id: "q2", text: "Am simțit că îmi usucă gura", options: [{ label: "Deloc", value: 0 }, { label: "Uneori", value: 1 }, { label: "Deseori", value: 2 }, { label: "Aproape mereu", value: 3 }] },
      { id: "q3", text: "Nu am putut simți nicio emoție pozitivă", options: [{ label: "Deloc", value: 0 }, { label: "Uneori", value: 1 }, { label: "Deseori", value: 2 }, { label: "Aproape mereu", value: 3 }] }
      // ... În realitate ar fi 21, dar punem doar 3 pentru mock UI simplu.
    ]
  },
  {
    id: "t-phq-9",
    name: "PHQ-9 (Patient Health Questionnaire)",
    description: "Instrument de screening și evaluare a severității depresiei.",
    scoring_logic: {
      type: "SUM",
      interpretation_bands: [
        { min: 0, max: 4, label: "Depresie minimă" },
        { min: 5, max: 9, label: "Depresie ușoară" },
        { min: 10, max: 14, label: "Depresie moderată" },
        { min: 15, max: 19, label: "Depresie moderat-severă" },
        { min: 20, max: 27, label: "Depresie severă" }
      ]
    },
    questions: [
      { id: "q1", text: "Puțin interes sau plăcere în a face lucruri", options: [{ label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 }, { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 }] },
      { id: "q2", text: "Te simți trist, deprimat sau fără speranță", options: [{ label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 }, { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 }] }
    ]
  }
];
