// Mock patient documents and medication data

export type DocumentType =
  | "SCRISOARE_MEDICALA"
  | "RETETA"
  | "ANALIZA"
  | "SENTINTA_CUSTODIE"
  | "ACORD_PARINTI"
  | "CONTRACT"
  | "CI"
  | "ALTELE";

export interface MockPatientDocument {
  id: string;
  client_id: string;
  file_name: string;
  file_size_kb: number;
  mime_type: "application/pdf" | "image/jpeg" | "image/png";
  document_url: string | null;
  document_type: DocumentType;
  notes: string | null;
  uploaded_at: string;
}

export interface MockMedication {
  id: string;
  client_id: string;
  medication_name: string;
  dosage: string;
  start_date: string;
  end_date: string | null; // null = active
  prescribing_doctor: string;
  side_effect_notes: string | null;
}

const d = (daysAgo: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString();
};

const dateStr = (daysAgo: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().slice(0, 10);
};

// ── Documents ────────────────────────────────────────────────────────────────

export const mockPatientDocuments: MockPatientDocument[] = [
  // Ana Popescu (c-001)
  {
    id: "doc-001", client_id: "c-001",
    file_name: "Scrisoare_psihiatru_Dr_Ionescu_Apr2025.pdf",
    file_size_kb: 184, mime_type: "application/pdf",
    document_url: null,
    document_type: "SCRISOARE_MEDICALA",
    notes: "Recomandare inițierea psihoterapiei CBT, diagnostic F41.1",
    uploaded_at: d(14),
  },
  {
    id: "doc-002", client_id: "c-001",
    file_name: "Reteta_Sertralin_50mg_Mar2025.jpg",
    file_size_kb: 420, mime_type: "image/jpeg",
    document_url: null,
    document_type: "RETETA",
    notes: "Sertralină 50mg/zi, prescrisă de Dr. Ionescu",
    uploaded_at: d(28),
  },
  {
    id: "doc-003", client_id: "c-001",
    file_name: "Analize_TSH_T4_Feb2025.pdf",
    file_size_kb: 230, mime_type: "application/pdf",
    document_url: null,
    document_type: "ANALIZA",
    notes: "TSH ușor crescut, monitorizat de endocrinolog",
    uploaded_at: d(60),
  },

  // Andrei Dumitrescu — minor (c-003)
  {
    id: "doc-010", client_id: "c-003",
    file_name: "Sentinta_Custodie_Dumitrescu_2024.pdf",
    file_size_kb: 390, mime_type: "application/pdf",
    document_url: null,
    document_type: "SENTINTA_CUSTODIE",
    notes: "Custodie partajată, ambii părinți semnează acordul terapeutic",
    uploaded_at: d(10),
  },
  {
    id: "doc-011", client_id: "c-003",
    file_name: "Acord_Parinti_Terapie_Semnat.pdf",
    file_size_kb: 95, mime_type: "application/pdf",
    document_url: null,
    document_type: "ACORD_PARINTI",
    notes: "Semnat de ambii părinți pe 12.04.2025",
    uploaded_at: d(9),
  },
  {
    id: "doc-012", client_id: "c-003",
    file_name: "Scrisoare_neurolog_Dr_Constantin.pdf",
    file_size_kb: 145, mime_type: "application/pdf",
    document_url: null,
    document_type: "SCRISOARE_MEDICALA",
    notes: "Diagnostic ADHD confirmat, recomandă terapie comportamentală",
    uploaded_at: d(5),
  },

  // Mihai Ionescu (c-002)
  {
    id: "doc-020", client_id: "c-002",
    file_name: "Reteta_Alprazolam_0.5mg.pdf",
    file_size_kb: 110, mime_type: "application/pdf",
    document_url: null,
    document_type: "RETETA",
    notes: "La nevoie, max 1cp/zi. Monitorizare dependență.",
    uploaded_at: d(20),
  },
];

// ── Medication ────────────────────────────────────────────────────────────────

export const mockMedication: MockMedication[] = [
  // Ana Popescu (c-001)
  {
    id: "med-001", client_id: "c-001",
    medication_name: "Sertralină",
    dosage: "50mg/zi (dimineața)",
    start_date: dateStr(90),
    end_date: null, // ACTIVE
    prescribing_doctor: "Dr. Andrei Ionescu — Psihiatrie",
    side_effect_notes: "Primele 2 săptămâni: greață ușoară, acum toleranță bună. Raportează somn mai agitat.",
  },
  {
    id: "med-002", client_id: "c-001",
    medication_name: "Melatonin",
    dosage: "3mg (înainte de somn)",
    start_date: dateStr(60),
    end_date: null, // ACTIVE
    prescribing_doctor: "Autoinitiată (recomandată de terapeut)",
    side_effect_notes: null,
  },
  {
    id: "med-003", client_id: "c-001",
    medication_name: "Escitalopram",
    dosage: "10mg/zi",
    start_date: dateStr(300),
    end_date: dateStr(100), // STOPPED
    prescribing_doctor: "Dr. Andrei Ionescu — Psihiatrie",
    side_effect_notes: "Înlocuit cu Sertralină din cauza apetitului scăzut persistent.",
  },

  // Andrei Dumitrescu (c-003)
  {
    id: "med-010", client_id: "c-003",
    medication_name: "Metilfenidat (Ritalin)",
    dosage: "10mg × 2/zi",
    start_date: dateStr(45),
    end_date: null, // ACTIVE
    prescribing_doctor: "Dr. Maria Constantin — Neurologie Pediatrică",
    side_effect_notes: "Scădere apetit la prânz, mama raportează iritabilitate seara la dispariția efectului.",
  },

  // Mihai Ionescu (c-002)
  {
    id: "med-020", client_id: "c-002",
    medication_name: "Alprazolam",
    dosage: "0.5mg la nevoie (max 1/zi)",
    start_date: dateStr(20),
    end_date: null, // ACTIVE
    prescribing_doctor: "Dr. Elena Popa — Psihiatrie",
    side_effect_notes: "Monitorizare risc dependență. Clientul raportează utilizare 2-3x/săptămână.",
  },
];

// ── Document type config ──────────────────────────────────────────────────────

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, { label: string; color: string; description: string }> = {
  SCRISOARE_MEDICALA: { label: "Scrisoare Medicală", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300", description: "Scrisori de la psihiatri, neurologi sau alți specialiști" },
  RETETA:             { label: "Rețetă",             color: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300", description: "Rețete prescrise" },
  ANALIZA:            { label: "Analiză",             color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300", description: "Rezultate analize de laborator" },
  SENTINTA_CUSTODIE:  { label: "Sentință Custodie",   color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300", description: "Obligatoriu pentru minori din familii divorțate" },
  ACORD_PARINTI:      { label: "Acord Părinți",       color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300", description: "Acord semnat de ambii părinți pentru terapia copilului" },
  CONTRACT:           { label: "Contract",            color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300", description: "Contracte terapeutice" },
  CI:                 { label: "Act Identitate",      color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300", description: "Copii C.I. pentru dosare" },
  ALTELE:             { label: "Altele",              color: "bg-muted text-muted-foreground", description: "Alte documente relevante" },
};
