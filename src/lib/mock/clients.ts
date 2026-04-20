export interface MockClient {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  cnp_cif: string | null;
  address: string | null;
  gdpr_consent_signed: boolean;
  contract_url: string | null;
  notes_anonymized_at: string | null;
  created_at: string;
  location: "CABINET_PARTICULAR" | "CLINICA" | null;
  is_minor: boolean;
  parent_name: string | null;
  parent_phone: string | null;
  billing_type: "INDIVIDUAL" | "B2B_COMPANY" | null;
  company_name: string | null;
  session_price: string | null;
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
export const mockClients: MockClient[] = [
  {
    id: "c-001",
    full_name: "Ana Popescu",
    email: "ana.popescu@example.com",
    phone: "+40723111222",
    cnp_cif: "2920512123456",
    address: "Str. Mihai Eminescu 12, București",
    gdpr_consent_signed: true,
    contract_url: "https://example.supabase.co/storage/v1/object/public/contracts/c-001.pdf",
    notes_anonymized_at: null,
    created_at: daysAgo(120),
    location: "CABINET_PARTICULAR",
    is_minor: false,
    parent_name: null,
    parent_phone: null,
    billing_type: "INDIVIDUAL",
    company_name: null,
    session_price: "250.00",
  },
  {
    id: "c-002",
    full_name: "Mihai Ionescu",
    email: "mihai.ionescu@example.com",
    phone: "+40733444555",
    cnp_cif: "1870304556677",
    address: "Bd. Carol I 45, Cluj-Napoca",
    gdpr_consent_signed: true,
    contract_url: null,
    notes_anonymized_at: null,
    created_at: daysAgo(64),
    location: "CABINET_PARTICULAR",
    is_minor: false,
    parent_name: null,
    parent_phone: null,
    billing_type: "B2B_COMPANY",
    company_name: "Tech Solutions SRL",
    session_price: "300.00",
  },
  {
    id: "c-003",
    full_name: "Andrei Dumitrescu",
    email: "andrei.d@example.com",
    phone: null,
    cnp_cif: "5151118223344",
    address: "Str. Traian 7, Iași",
    gdpr_consent_signed: false,
    contract_url: null,
    notes_anonymized_at: null,
    created_at: daysAgo(12),
    location: "CLINICA",
    is_minor: true,
    parent_name: "Elena Dumitrescu",
    parent_phone: "+40744777888",
    billing_type: "INDIVIDUAL",
    company_name: null,
    session_price: "200.00",
  },
  {
    id: "c-004",
    full_name: "Radu Stoica",
    email: "radu.stoica@example.com",
    phone: "+40755000111",
    cnp_cif: "1790225445566",
    address: "Str. 9 Mai 22, Timișoara",
    gdpr_consent_signed: true,
    contract_url: null,
    notes_anonymized_at: null,
    created_at: daysAgo(180),
    location: "CLINICA",
    is_minor: false,
    parent_name: null,
    parent_phone: null,
    billing_type: "INDIVIDUAL",
    company_name: null,
    session_price: null, // Poate fi negociat per programare
  },
  {
    id: "c-005",
    full_name: "Ioana Marin",
    email: "ioana.marin@example.com",
    phone: "+40766333444",
    cnp_cif: "2880917334455",
    address: "Calea Victoriei 3, București",
    gdpr_consent_signed: true,
    contract_url: null,
    notes_anonymized_at: null,
    created_at: daysAgo(30),
    location: "CABINET_PARTICULAR",
    is_minor: false,
    parent_name: null,
    parent_phone: null,
    billing_type: "B2B_COMPANY",
    company_name: "Creative Agency SA",
    session_price: "350.00",
  },
  {
    id: "c-006",
    full_name: "[Client anonimizat]",
    email: null,
    phone: null,
    cnp_cif: null,
    address: null,
    gdpr_consent_signed: true,
    contract_url: null,
    notes_anonymized_at: daysAgo(7),
    created_at: daysAgo(400),
    location: "CABINET_PARTICULAR",
    is_minor: false,
    parent_name: null,
    parent_phone: null,
    billing_type: "INDIVIDUAL",
    company_name: null,
    session_price: null,
  },
];
