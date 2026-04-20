// Mock CAS data for demonstration — realistic Romanian referral numbers & ICD-10 codes

export interface MockCasAppointment {
  id: string;
  client_id: string;
  client_name: string;
  cnp: string;
  appointment_date: string;
  duration_minutes: number;
  is_cas_subsidized: true;
  referral_number: string;
  referral_date: string;
  referring_doctor_code: string; // Parafă medic trimițător
  diagnosis_code_cim10: string;
  diagnosis_label: string;
}

const d = (daysAgo: number, hour = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
};

const rd = (daysAgo: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().slice(0, 10);
};

export const mockCasAppointments: MockCasAppointment[] = [
  {
    id: "cas-001",
    client_id: "c-001",
    client_name: "Ana Popescu",
    cnp: "2920512123456",
    appointment_date: d(5),
    duration_minutes: 50,
    is_cas_subsidized: true,
    referral_number: "BT-2025-001234",
    referral_date: rd(30),
    referring_doctor_code: "PSH-B-00456",
    diagnosis_code_cim10: "F41.1",
    diagnosis_label: "Tulburare de anxietate generalizată",
  },
  {
    id: "cas-002",
    client_id: "c-001",
    client_name: "Ana Popescu",
    cnp: "2920512123456",
    appointment_date: d(12),
    duration_minutes: 50,
    is_cas_subsidized: true,
    referral_number: "BT-2025-001234",
    referral_date: rd(30),
    referring_doctor_code: "PSH-B-00456",
    diagnosis_code_cim10: "F41.1",
    diagnosis_label: "Tulburare de anxietate generalizată",
  },
  {
    id: "cas-003",
    client_id: "c-003",
    client_name: "Andrei Dumitrescu",
    cnp: "5151118223344",
    appointment_date: d(8),
    duration_minutes: 50,
    is_cas_subsidized: true,
    referral_number: "IS-2025-005678",
    referral_date: rd(14),
    referring_doctor_code: "NEU-IS-00123",
    diagnosis_code_cim10: "F90.0",
    diagnosis_label: "Tulburare hipercinesică (ADHD)",
  },
  {
    id: "cas-004",
    client_id: "c-003",
    client_name: "Andrei Dumitrescu",
    cnp: "5151118223344",
    appointment_date: d(15),
    duration_minutes: 50,
    is_cas_subsidized: true,
    referral_number: "IS-2025-005678",
    referral_date: rd(14),
    referring_doctor_code: "NEU-IS-00123",
    diagnosis_code_cim10: "F90.0",
    diagnosis_label: "Tulburare hipercinesică (ADHD)",
  },
  {
    id: "cas-005",
    client_id: "c-004",
    client_name: "Radu Stoica",
    cnp: "1790225445566",
    appointment_date: d(3),
    duration_minutes: 50,
    is_cas_subsidized: true,
    referral_number: "TM-2025-009012",
    referral_date: rd(7),
    referring_doctor_code: "ONC-TM-00789",
    diagnosis_code_cim10: "F43.2",
    diagnosis_label: "Tulburare de adaptare",
  },
];

// ICD-10 quick picker for common psych codes
export const CIM10_COMMON = [
  { code: "F32.0", label: "Episod depresiv ușor" },
  { code: "F32.1", label: "Episod depresiv moderat" },
  { code: "F32.2", label: "Episod depresiv sever fără simptome psihotice" },
  { code: "F33.0", label: "Tulburare depresivă recurentă, episod ușor" },
  { code: "F33.1", label: "Tulburare depresivă recurentă, episod moderat" },
  { code: "F40.1", label: "Fobie socială" },
  { code: "F41.0", label: "Tulburare de panică" },
  { code: "F41.1", label: "Tulburare de anxietate generalizată" },
  { code: "F41.2", label: "Tulburare mixtă anxios-depresivă" },
  { code: "F42",   label: "Tulburare obsesional-compulsivă" },
  { code: "F43.1", label: "Stres posttraumatic (PTSD)" },
  { code: "F43.2", label: "Tulburare de adaptare" },
  { code: "F60.3", label: "Tulburare de personalitate borderline" },
  { code: "F84.0", label: "Autism infantil" },
  { code: "F90.0", label: "Tulburare hipercinesică (ADHD)" },
  { code: "F91.3", label: "Tulburare sfidătoare cu opoziție" },
  { code: "Z03.2", label: "Observație pentru tulburare de comportament" },
];
