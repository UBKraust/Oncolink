import type { TestTemplate } from "@/lib/assessments/types";

/** Open-source tests pre-seeded for the app. */
export const seededTests: TestTemplate[] = [
  {
    id: "t-phq-9",
    name: "PHQ-9 (Patient Health Questionnaire — Depresie)",
    description:
      "Instrument de screening și măsurare a severității depresiei. Domeniu public (Pfizer Inc.).",
    scoring_logic: {
      type: "SUM",
      interpretation_bands: [
        { min: 0, max: 4, label: "Simptome minime", severity: "minimal" },
        { min: 5, max: 9, label: "Depresie ușoară", severity: "mild" },
        { min: 10, max: 14, label: "Depresie moderată", severity: "moderate" },
        { min: 15, max: 19, label: "Depresie moderat-severă", severity: "moderate" },
        { min: 20, max: 27, label: "Depresie severă", severity: "severe" },
      ],
    },
    questions: [
      {
        id: "q1",
        text: "Puțin interes sau plăcere în a face lucruri",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q2",
        text: "Te simți trist, deprimat sau fără speranță",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q3",
        text: "Probleme cu adormitul, menținerea somnului sau dormit prea mult",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q4",
        text: "Te simți obosit sau ai puțină energie",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q5",
        text: "Apetit scăzut sau mâncat excesiv",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q6",
        text: "Te simți rău față de tine însuți sau că ești un eșec",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q7",
        text: "Dificultăți în a te concentra la lucruri precum cititul sau televizorul",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q8",
        text: "Mișcări sau vorbire atât de lentă încât alții au observat, sau agitație",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q9",
        text: "Gânduri că ar fi mai bine să fii mort sau că te rănești",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
    ],
  },
  {
    id: "t-gad-7",
    name: "GAD-7 (Generalized Anxiety Disorder — Anxietate)",
    description:
      "Instrument de screening și evaluare a tulburării de anxietate generalizată. Domeniu public.",
    scoring_logic: {
      type: "SUM",
      interpretation_bands: [
        { min: 0, max: 4, label: "Anxietate minimă", severity: "minimal" },
        { min: 5, max: 9, label: "Anxietate ușoară", severity: "mild" },
        { min: 10, max: 14, label: "Anxietate moderată", severity: "moderate" },
        { min: 15, max: 21, label: "Anxietate severă", severity: "severe" },
      ],
    },
    questions: [
      {
        id: "q1",
        text: "Te simți nervos, anxios sau la limită",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q2",
        text: "Nu poți opri sau controla îngrijorarea",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q3",
        text: "Te îngrijorezi prea mult în legătură cu lucruri diferite",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q4",
        text: "Ai dificultăți în a te relaxa",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q5",
        text: "Ești atât de agitat încât nu poți sta liniștit",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q6",
        text: "Te enervezi sau te iritezi ușor",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q7",
        text: "Te temi că ceva rău se va întâmpla",
        options: [
          { label: "Deloc", value: 0 },
          { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 },
          { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
    ],
  },
  {
    id: "t-dass-21",
    name: "DASS-21 (Depression, Anxiety and Stress Scale)",
    description:
      "Evaluează 3 dimensiuni: Depresie, Anxietate, Stres. Scorul se multiplică x2. Licență de uz clinic liber.",
    scoring_logic: {
      type: "SUBSCALES",
      subscales: [
        {
          name: "Depresie",
          question_ids: ["q3", "q5", "q10", "q13", "q16", "q17", "q21"],
        },
        {
          name: "Anxietate",
          question_ids: ["q2", "q4", "q7", "q9", "q15", "q19", "q20"],
        },
        {
          name: "Stres",
          question_ids: ["q1", "q6", "q8", "q11", "q12", "q14", "q18"],
        },
      ],
    },
    questions: Array.from({ length: 21 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `Întrebarea ${i + 1} DASS-21 (de completat cu textul din chestionarul licențiat)`,
      options: [
        { label: "Nu mi s-a aplicat deloc", value: 0 },
        { label: "Mi s-a aplicat puțin sau câteodată", value: 1 },
        { label: "Mi s-a aplicat mult sau deseori", value: 2 },
        { label: "Mi s-a aplicat foarte mult sau tot timpul", value: 3 },
      ],
    })),
  },
];
