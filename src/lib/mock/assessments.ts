export interface MockAssessment {
  id: string;
  client_id: string;
  assessment_type: "EVALUARE_INITIALA" | "SCORING_ANXIETATE" | "RAPORT_LUNAR";
  scoring_data: Record<string, unknown>;
  content_summary: string | null;
  sent_to_parent_at: string | null;
  created_at: string;
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const mockAssessments: MockAssessment[] = [
  {
    id: "a-001",
    client_id: "c-003", // Andrei (minor)
    assessment_type: "EVALUARE_INITIALA",
    scoring_data: { test_type: "BDI", score: 14, severity: "Mild" },
    content_summary: "Pacientul prezintă ușoară anxietate în contexte școlare.",
    sent_to_parent_at: daysAgo(10),
    created_at: daysAgo(12),
  },
  {
    id: "a-002",
    client_id: "c-003", // Andrei (minor)
    assessment_type: "RAPORT_LUNAR",
    scoring_data: {},
    content_summary: "Evoluție favorabilă, comunicare mai deschisă comparativ cu luna trecută.",
    sent_to_parent_at: daysAgo(2),
    created_at: daysAgo(2),
  },
  {
    id: "a-003",
    client_id: "c-001",
    assessment_type: "SCORING_ANXIETATE",
    scoring_data: { test_type: "STAI", state_anxiety: 45, trait_anxiety: 40 },
    content_summary: "Anxietate de stare moderată, influențată de stres la locul de muncă.",
    sent_to_parent_at: null,
    created_at: daysAgo(30),
  }
];
