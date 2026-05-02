import type { TestTemplate } from "@/lib/assessments/types";

/** Standardized tests pre-seeded for the app. */
export const seededTests: TestTemplate[] = [
  // ─── PHQ-9 ─────────────────────────────────────────────────────────────────
  {
    id: "t-phq-9",
    name: "PHQ-9",
    description:
      "Patient Health Questionnaire — instrument de screening și măsurare a severității depresiei. Domeniu public (Pfizer Inc.).",
    meta: {
      code: "PHQ9",
      category: "DEPRESIE",
      serviceTracks: ["CLINICAL_PSYCHOLOGY", "CBT", "COUNSELING", "RESEARCH"],
      ageGroup: "adult",
      estimatedDurationMinutes: 3,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUM",
      interpretation_bands: [
        { min: 0,  max: 4,  label: "Simptome minime",       severity: "minimal"  },
        { min: 5,  max: 9,  label: "Depresie ușoară",       severity: "mild"     },
        { min: 10, max: 14, label: "Depresie moderată",     severity: "moderate" },
        { min: 15, max: 19, label: "Depresie moderat-severă", severity: "moderate" },
        { min: 20, max: 27, label: "Depresie severă",       severity: "severe"   },
      ],
    },
    questions: [
      {
        id: "q1", text: "Puțin interes sau plăcere în a face lucruri",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q2", text: "Te simți trist, deprimat sau fără speranță",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q3", text: "Probleme cu adormitul, menținerea somnului sau dormit prea mult",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q4", text: "Te simți obosit sau ai puțină energie",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q5", text: "Apetit scăzut sau mâncat excesiv",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q6", text: "Te simți rău față de tine însuți sau că ești un eșec",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q7", text: "Dificultăți în a te concentra la lucruri precum cititul sau televizorul",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q8", text: "Mișcări sau vorbire atât de lentă încât alții au observat, sau agitație și nelinște",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q9", text: "Gânduri că ar fi mai bine să fii mort sau că te rănești în vreun fel",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
    ],
  },

  // ─── GAD-7 ─────────────────────────────────────────────────────────────────
  {
    id: "t-gad-7",
    name: "GAD-7",
    description:
      "Generalized Anxiety Disorder Scale — instrument de screening și evaluare a tulburării de anxietate generalizată. Domeniu public.",
    meta: {
      code: "GAD7",
      category: "ANXIETATE",
      serviceTracks: ["CLINICAL_PSYCHOLOGY", "CBT", "COUNSELING", "RESEARCH"],
      ageGroup: "adult",
      estimatedDurationMinutes: 3,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUM",
      interpretation_bands: [
        { min: 0,  max: 4,  label: "Anxietate minimă",    severity: "minimal"  },
        { min: 5,  max: 9,  label: "Anxietate ușoară",    severity: "mild"     },
        { min: 10, max: 14, label: "Anxietate moderată",  severity: "moderate" },
        { min: 15, max: 21, label: "Anxietate severă",    severity: "severe"   },
      ],
    },
    questions: [
      {
        id: "q1", text: "Te simți nervos, anxios sau la limită",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q2", text: "Nu poți opri sau controla îngrijorarea",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q3", text: "Te îngrijorezi prea mult în legătură cu lucruri diferite",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q4", text: "Ai dificultăți în a te relaxa",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q5", text: "Ești atât de agitat încât nu poți sta liniștit",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q6", text: "Te enervezi sau te iritezi ușor",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
      {
        id: "q7", text: "Te temi că ceva rău se va întâmpla",
        options: [
          { label: "Deloc", value: 0 }, { label: "Câteva zile", value: 1 },
          { label: "Mai mult de jumătate din zile", value: 2 }, { label: "Aproape în fiecare zi", value: 3 },
        ],
      },
    ],
  },

  // ─── DASS-21 ───────────────────────────────────────────────────────────────
  {
    id: "t-dass-21",
    name: "DASS-21",
    description:
      "Depression Anxiety and Stress Scales — evaluează 3 dimensiuni: Depresie, Anxietate, Stres. Scorul per subscală se multiplică ×2. Licență de uz clinic liber.",
    meta: {
      code: "DASS21",
      category: "STRES_WELLBEING",
      serviceTracks: ["CLINICAL_PSYCHOLOGY", "CBT", "DBT", "COUNSELING", "RESEARCH"],
      ageGroup: "adult",
      estimatedDurationMinutes: 7,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUBSCALES",
      subscales: [
        { name: "Depresie",  question_ids: ["q3","q5","q10","q13","q16","q17","q21"] },
        { name: "Anxietate", question_ids: ["q2","q4","q7","q9","q15","q19","q20"]  },
        { name: "Stres",     question_ids: ["q1","q6","q8","q11","q12","q14","q18"] },
      ],
    },
    questions: Array.from({ length: 21 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `Întrebarea ${i + 1} DASS-21 (de completat cu textul din chestionarul licențiat)`,
      options: [
        { label: "Nu mi s-a aplicat deloc",                    value: 0 },
        { label: "Mi s-a aplicat puțin sau câteodată",         value: 1 },
        { label: "Mi s-a aplicat mult sau deseori",            value: 2 },
        { label: "Mi s-a aplicat foarte mult sau tot timpul",  value: 3 },
      ],
    })),
  },

  // ─── PSS-10 ────────────────────────────────────────────────────────────────
  {
    id: "t-pss-10",
    name: "PSS-10",
    description:
      "Perceived Stress Scale — măsoară gradul de stres perceput în ultima lună. Domeniu public (Cohen, 1983).",
    meta: {
      code: "PSS10",
      category: "STRES_WELLBEING",
      serviceTracks: ["CBT", "COUNSELING", "RESEARCH"],
      ageGroup: "adult",
      estimatedDurationMinutes: 4,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUM",
      interpretation_bands: [
        { min: 0,  max: 13, label: "Stres scăzut",   severity: "minimal"  },
        { min: 14, max: 26, label: "Stres moderat",   severity: "mild"     },
        { min: 27, max: 40, label: "Stres ridicat",   severity: "severe"   },
      ],
    },
    questions: [
      {
        id: "q1",
        text: "În ultima lună, cât de des te-ai simțit deranjat din cauza unui lucru care s-a întâmplat pe neașteptate?",
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q2",
        text: "În ultima lună, cât de des ai simțit că nu poți controla lucrurile importante din viața ta?",
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q3",
        text: "În ultima lună, cât de des te-ai simțit nervos și stresat?",
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q4",
        text: "În ultima lună, cât de des te-ai simțit sigur pe capacitatea ta de a rezolva problemele personale?",
        reverse_scoring: true,
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q5",
        text: "În ultima lună, cât de des ai simțit că lucrurile merg în direcția dorită?",
        reverse_scoring: true,
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q6",
        text: "În ultima lună, cât de des ai simțit că nu poți face față tuturor lucrurilor pe care trebuia să le rezolvi?",
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q7",
        text: "În ultima lună, cât de des ai reușit să controlezi iritările din viața ta?",
        reverse_scoring: true,
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q8",
        text: "În ultima lună, cât de des ai simțit că stăpânești lucrurile?",
        reverse_scoring: true,
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q9",
        text: "În ultima lună, cât de des te-ai enervat din cauza unor lucruri care nu țineau de tine?",
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
      {
        id: "q10",
        text: "În ultima lună, cât de des ai simțit că dificultățile s-au acumulat atât de mult încât nu le puteai depăși?",
        options: [
          { label: "Niciodată", value: 0 }, { label: "Aproape niciodată", value: 1 },
          { label: "Uneori", value: 2 }, { label: "Destul de des", value: 3 }, { label: "Foarte des", value: 4 },
        ],
      },
    ],
  },

  // ─── WHO-5 ─────────────────────────────────────────────────────────────────
  {
    id: "t-who-5",
    name: "WHO-5",
    description:
      "WHO Well-Being Index — 5 itemi care măsoară bunăstarea subiectivă în ultimele 2 săptămâni. Scor 0–25 (≤13 sugerează posibilă depresie). WHO, uz clinic liber.",
    meta: {
      code: "WHO5",
      category: "STRES_WELLBEING",
      serviceTracks: ["CBT", "DBT", "COUNSELING", "RESEARCH"],
      ageGroup: "adult",
      estimatedDurationMinutes: 2,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2", "SESSION"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUM",
      interpretation_bands: [
        { min: 0,  max: 13, label: "Posibilă depresie — recomandată evaluare suplimentară", severity: "severe"   },
        { min: 14, max: 20, label: "Bunăstare moderată",                                   severity: "mild"     },
        { min: 21, max: 25, label: "Bunăstare bună",                                       severity: "minimal"  },
      ],
    },
    questions: [
      {
        id: "q1",
        text: "M-am simțit bine dispus și vesel",
        options: [
          { label: "Tot timpul", value: 5 }, { label: "De cele mai multe ori", value: 4 },
          { label: "Mai mult de jumătate din timp", value: 3 }, { label: "Mai puțin de jumătate din timp", value: 2 },
          { label: "Uneori", value: 1 }, { label: "Niciodată", value: 0 },
        ],
      },
      {
        id: "q2",
        text: "M-am simțit calm și relaxat",
        options: [
          { label: "Tot timpul", value: 5 }, { label: "De cele mai multe ori", value: 4 },
          { label: "Mai mult de jumătate din timp", value: 3 }, { label: "Mai puțin de jumătate din timp", value: 2 },
          { label: "Uneori", value: 1 }, { label: "Niciodată", value: 0 },
        ],
      },
      {
        id: "q3",
        text: "M-am simțit activ și plin de energie",
        options: [
          { label: "Tot timpul", value: 5 }, { label: "De cele mai multe ori", value: 4 },
          { label: "Mai mult de jumătate din timp", value: 3 }, { label: "Mai puțin de jumătate din timp", value: 2 },
          { label: "Uneori", value: 1 }, { label: "Niciodată", value: 0 },
        ],
      },
      {
        id: "q4",
        text: "M-am trezit proaspăt și odihnit",
        options: [
          { label: "Tot timpul", value: 5 }, { label: "De cele mai multe ori", value: 4 },
          { label: "Mai mult de jumătate din timp", value: 3 }, { label: "Mai puțin de jumătate din timp", value: 2 },
          { label: "Uneori", value: 1 }, { label: "Niciodată", value: 0 },
        ],
      },
      {
        id: "q5",
        text: "Viața mea de zi cu zi a fost plină de lucruri care mă interesează",
        options: [
          { label: "Tot timpul", value: 5 }, { label: "De cele mai multe ori", value: 4 },
          { label: "Mai mult de jumătate din timp", value: 3 }, { label: "Mai puțin de jumătate din timp", value: 2 },
          { label: "Uneori", value: 1 }, { label: "Niciodată", value: 0 },
        ],
      },
    ],
  },

  // ─── DERS-16 ───────────────────────────────────────────────────────────────
  {
    id: "t-ders-16",
    name: "DERS-16",
    description:
      "Difficulties in Emotion Regulation Scale (versiunea scurtă, 16 itemi) — evaluează dificultățile de reglare emoțională pe 6 subscale. Itemi placeholder — verifică versiunea românească validată.",
    meta: {
      code: "DERS16",
      category: "DBT",
      serviceTracks: ["DBT", "CBT", "RESEARCH"],
      ageGroup: "adult",
      estimatedDurationMinutes: 8,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUBSCALES",
      subscales: [
        { name: "Conștiință",   question_ids: ["q1", "q2"]          },
        { name: "Claritate",    question_ids: ["q3", "q4", "q5"]    },
        { name: "Non-acceptare", question_ids: ["q6", "q7", "q8"]   },
        { name: "Impulsivitate", question_ids: ["q9", "q10"]        },
        { name: "Strategii",    question_ids: ["q11","q12","q13"]   },
        { name: "Obiective",    question_ids: ["q14","q15","q16"]   },
      ],
    },
    questions: Array.from({ length: 16 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `Întrebarea ${i + 1} DERS-16 (de completat cu textul din versiunea românească validată)`,
      reverse_scoring: i === 0 || i === 1, // Conștiință subscale is reverse-scored
      options: [
        { label: "Aproape niciodată (1–10%)", value: 0 },
        { label: "Uneori (11–35%)",           value: 1 },
        { label: "Câteodată (36–65%)",        value: 2 },
        { label: "De cele mai multe ori (66–90%)", value: 3 },
        { label: "Aproape întotdeauna (91–100%)",  value: 4 },
      ],
    })),
  },

  // ─── SDQ (minori) ──────────────────────────────────────────────────────────
  {
    id: "t-sdq-youth",
    name: "SDQ (Adolescenți)",
    description:
      "Strengths and Difficulties Questionnaire — screening general pentru copii și adolescenți (11–17 ani), varianta auto-raport. Itemi placeholder — folosește versiunea românească oficială de pe sdqinfo.org.",
    meta: {
      code: "SDQ",
      category: "COPII_ADOLESCENTI",
      serviceTracks: ["CLINICAL_PSYCHOLOGY", "COUNSELING", "CBT", "MINOR", "RESEARCH"],
      ageGroup: "adolescent",
      estimatedDurationMinutes: 5,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUBSCALES",
      subscales: [
        { name: "Probleme emoționale",    question_ids: ["q1","q6","q11","q16","q21"]  },
        { name: "Probleme comportament",  question_ids: ["q2","q7","q12","q17","q22"]  },
        { name: "Hiperactivitate",        question_ids: ["q3","q8","q13","q18","q23"]  },
        { name: "Probleme cu semenii",    question_ids: ["q4","q9","q14","q19","q24"]  },
        { name: "Comportament prosocial", question_ids: ["q5","q10","q15","q20","q25"] },
      ],
      interpretation_bands: [
        { min: 0,  max: 15, label: "Normal",         severity: "minimal"  },
        { min: 16, max: 19, label: "Borderline",      severity: "mild"     },
        { min: 20, max: 40, label: "Anormal / Clinic", severity: "severe"  },
      ],
    },
    questions: Array.from({ length: 25 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `Întrebarea ${i + 1} SDQ (de completat cu textul din versiunea românească sdqinfo.org)`,
      options: [
        { label: "Nu este adevărat",      value: 0 },
        { label: "Oarecum adevărat",      value: 1 },
        { label: "Cu siguranță adevărat", value: 2 },
      ],
    })),
  },

  // ─── RCADS (minori) ────────────────────────────────────────────────────────
  {
    id: "t-rcads-youth",
    name: "RCADS (Copii/Adolescenți)",
    description:
      "Revised Children's Anxiety and Depression Scale — evaluează anxietate și depresie la copii și adolescenți (6–18 ani). 47 itemi, varianta auto-raport. Itemi placeholder — verifică versiunea românească validată.",
    meta: {
      code: "RCADS",
      category: "COPII_ADOLESCENTI",
      serviceTracks: ["CLINICAL_PSYCHOLOGY", "CBT", "MINOR", "RESEARCH"],
      ageGroup: "adolescent",
      estimatedDurationMinutes: 15,
      licenseStatus: "OPEN_VERIFY",
      recommendedFrequency: ["T0", "T1", "T2"],
      researchUse: true,
    },
    scoring_logic: {
      type: "SUBSCALES",
      subscales: [
        { name: "Tulb. anxietate separare", question_ids: ["q4","q8","q13","q16","q20","q25","q29"] },
        { name: "Fobii sociale",            question_ids: ["q6","q10","q14","q18","q22","q26","q30"] },
        { name: "Tulb. obsesiv-compulsivă", question_ids: ["q2","q11","q17","q24","q27","q31","q36"] },
        { name: "Anxietate generalizată",   question_ids: ["q1","q9","q15","q23","q32","q39","q44"] },
        { name: "Tulb. panică",             question_ids: ["q3","q7","q12","q19","q21","q28","q33","q35","q37","q43"] },
        { name: "Depresie majoră",          question_ids: ["q5","q34","q38","q40","q41","q42","q45","q46","q47"] },
      ],
    },
    questions: Array.from({ length: 47 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `Întrebarea ${i + 1} RCADS (de completat cu textul din versiunea românească validată)`,
      options: [
        { label: "Niciodată",  value: 0 },
        { label: "Uneori",     value: 1 },
        { label: "Deseori",    value: 2 },
        { label: "Întotdeauna", value: 3 },
      ],
    })),
  },
];
