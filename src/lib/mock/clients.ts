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
  },
  {
    id: "c-003",
    full_name: "Elena Dumitrescu",
    email: "elena.d@example.com",
    phone: "+40744777888",
    cnp_cif: "2951118223344",
    address: "Str. Traian 7, Iași",
    gdpr_consent_signed: false,
    contract_url: null,
    notes_anonymized_at: null,
    created_at: daysAgo(12),
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
  },
];
