import type { TestTemplate } from "@/lib/assessments/types";

/**
 * Formulare interne construite în ERP — fără risc de licență.
 * Acestea nu copiază nici un instrument standardizat licențiat.
 * Scorul total reflectă doar întrebările numerice (scale 0–10).
 * Textul liber este salvat în contentSummary.
 */
export const internalForms: TestTemplate[] = [
  // ─── Jurnal gânduri automate CBT ──────────────────────────────────────────
  {
    id: "if-cbt-thought-journal",
    name: "Jurnal gânduri automate CBT",
    description:
      "Formular de restructurare cognitivă — captează situația, emoția, gândul automat, distorsiunea și gândul alternativ. Urmărește reducerea intensității emoționale.",
    meta: {
      code: "CBT_THOUGHT_JOURNAL",
      category: "CBT",
      serviceTracks: ["CBT"],
      ageGroup: "adult",
      estimatedDurationMinutes: 10,
      licenseStatus: "INTERNAL_FORM",
      recommendedFrequency: ["SESSION", "AS_NEEDED"],
      researchUse: false,
      isInternalForm: true,
    },
    scoring_logic: {
      type: "SUBSCALES",
      subscales: [
        { name: "Intensitate inițială",   question_ids: ["q2"] },
        { name: "Intensitate după",       question_ids: ["q6"] },
      ],
    },
    questions: [
      {
        id: "q_info",
        type: "info",
        text: "Completează acest formular imediat după o situație dificilă sau înainte de ședință, pentru a analiza împreună cu terapeutul.",
        options: [],
      },
      {
        id: "q1",
        type: "textarea",
        text: "Situația",
        placeholder: "Descrie pe scurt ce s-a întâmplat — unde, când, cu cine...",
        options: [],
      },
      {
        id: "q2",
        type: "scale",
        text: "Intensitatea emoției (0 = deloc, 10 = maximă)",
        scaleLabel: { min: "0 — Deloc", max: "10 — Maximă" },
        options: Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i })),
      },
      {
        id: "q3",
        type: "textarea",
        text: "Emoția predominantă",
        placeholder: "ex. frică, tristețe, furie, rușine, îngrijorare...",
        options: [],
      },
      {
        id: "q4",
        type: "textarea",
        text: "Gândul automat",
        placeholder: "Ce ți-a trecut prin minte în acel moment? (exact, fără cenzură)",
        options: [],
      },
      {
        id: "q5",
        type: "textarea",
        text: "Distorsiunea identificată (opțional)",
        placeholder: "ex. catastrofizare, generalizare, gândire dihotomică, filtrare negativă...",
        options: [],
      },
      {
        id: "q_info2",
        type: "info",
        text: "Acum încearcă să formulezi un gând mai echilibrat și realist.",
        options: [],
      },
      {
        id: "q_alt",
        type: "textarea",
        text: "Gândul alternativ / echilibrat",
        placeholder: "Ce ar putea fi adevărat și mai echilibrat față de situație?",
        options: [],
      },
      {
        id: "q6",
        type: "scale",
        text: "Intensitatea emoției după restructurare (0 = deloc, 10 = maximă)",
        scaleLabel: { min: "0 — Deloc", max: "10 — La fel" },
        options: Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i })),
      },
      {
        id: "q7",
        type: "textarea",
        text: "Observații pentru ședință (opțional)",
        placeholder: "Ce vrei să discuți cu terapeutul legat de acest gând?",
        options: [],
      },
    ],
  },

  // ─── Fișă prevenție recădere ──────────────────────────────────────────────
  {
    id: "if-relapse-prevention",
    name: "Fișă prevenție recădere",
    description:
      "Formular de final de terapie — identifică trigger-ii, semnele timpurii și planul de acțiune pentru prevenirea recăderilor.",
    meta: {
      code: "RELAPSE_PREVENTION",
      category: "CBT",
      serviceTracks: ["CBT", "DBT"],
      ageGroup: "adult",
      estimatedDurationMinutes: 15,
      licenseStatus: "INTERNAL_FORM",
      recommendedFrequency: ["AS_NEEDED"],
      researchUse: false,
      isInternalForm: true,
    },
    scoring_logic: { type: "SUM" },
    questions: [
      {
        id: "q_info",
        type: "info",
        text: "Completați împreună cu terapeutul la finalul terapiei sau înainte de ultima ședință.",
        options: [],
      },
      {
        id: "q1",
        type: "textarea",
        text: "Trigger-ii principali identificați în terapie",
        placeholder: "Situații, persoane, gânduri sau emoții care pot declanșa dificultăți...",
        options: [],
      },
      {
        id: "q2",
        type: "textarea",
        text: "Semne timpurii de recădere",
        placeholder: "Ce observi la tine când lucrurile încep să se înrăutățească? (comportamente, gânduri, fizic, emoții)",
        options: [],
      },
      {
        id: "q3",
        type: "textarea",
        text: "Plan de acțiune la primele semne",
        placeholder: "Ce faci concret când observi semnele? (pași specifici, tehnici din terapie)",
        options: [],
      },
      {
        id: "q4",
        type: "textarea",
        text: "Resurse de suport disponibile",
        placeholder: "Persoane, comunități, activități care te ajută să rămâi stabil...",
        options: [],
      },
      {
        id: "q5",
        type: "textarea",
        text: "Contact terapeut pentru booster session",
        placeholder: "În ce circumstanțe revii la terapie? (nu e eșec — e parte din plan)",
        options: [],
      },
      {
        id: "q6",
        type: "textarea",
        text: "Ce ai câștigat din terapie",
        placeholder: "Abilități, perspective, resurse pe care le iei cu tine...",
        options: [],
      },
    ],
  },
];
