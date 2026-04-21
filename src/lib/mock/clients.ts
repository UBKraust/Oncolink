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
  scheduled_anonymization_at: string | null;
  created_at: string;
  location: "CABINET_PARTICULAR" | "CLINICA" | null;
  is_minor: boolean;
  parent_name: string | null;
  parent_phone: string | null;
  billing_type: "INDIVIDUAL" | "B2B_COMPANY" | null;
  company_name: string | null;
  session_price: string | null;
  session_frequency: "SAPTAMANAL" | "BILUNAR" | "LUNAR" | "OCAZIONAL" | null;
  report_frequency: "LUNAR" | "LA_CERERE" | "NICIODATA" | null;
  send_report_to_parent: boolean;
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

/**
 * 57 clienți:
 *  - Locație:    33 CABINET_PARTICULAR | 24 CLINICA
 *  - Vârstă:     41 minori (is_minor=true) | 16 adulți
 *  - Facturare:  6 B2B_COMPANY | 51 INDIVIDUAL
 *  - 1 anonimizat (c-006)
 *
 * Prenume / Nume românești reale pentru validitate demo.
 */
export const mockClients: MockClient[] = [
  // ────────────────────────────────────────────────────────────────────────
  // [c-001..c-016] ADULȚI — 16 total
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "c-001", full_name: "Ana Popescu",
    email: "ana.popescu@example.com", phone: "+40723111222",
    cnp_cif: "2920512123456", address: "Str. Mihai Eminescu 12, București",
    gdpr_consent_signed: true,
    contract_url: "https://drive.google.com/drive/folders/demo-c001",
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(120),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "250.00", session_frequency: "SAPTAMANAL",
    report_frequency: "NICIODATA", send_report_to_parent: false,
  },
  {
    id: "c-002", full_name: "Mihai Ionescu",
    email: "mihai.ionescu@example.com", phone: "+40733444555",
    cnp_cif: "1870304556677", address: "Bd. Carol I 45, Cluj-Napoca",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(64),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "B2B_COMPANY", company_name: "Tech Solutions SRL",
    session_price: "300.00", session_frequency: "BILUNAR",
    report_frequency: "LUNAR", send_report_to_parent: false,
  },
  {
    id: "c-004", full_name: "Radu Stoica",
    email: "radu.stoica@example.com", phone: "+40755000111",
    cnp_cif: "1790225445566", address: "Str. 9 Mai 22, Timișoara",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(180),
    location: "CLINICA", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: null, session_frequency: "OCAZIONAL",
    report_frequency: "LA_CERERE", send_report_to_parent: false,
  },
  {
    id: "c-005", full_name: "Ioana Marin",
    email: "ioana.marin@example.com", phone: "+40766333444",
    cnp_cif: "2880917334455", address: "Calea Victoriei 3, București",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(30),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "B2B_COMPANY", company_name: "Creative Agency SA",
    session_price: "350.00", session_frequency: "SAPTAMANAL",
    report_frequency: "NICIODATA", send_report_to_parent: false,
  },
  {
    id: "c-006", full_name: "[Client anonimizat]",
    email: null, phone: null, cnp_cif: null, address: null,
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: daysAgo(7), scheduled_anonymization_at: null, created_at: daysAgo(400),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null, session_price: null,
    session_frequency: "OCAZIONAL", report_frequency: "NICIODATA", send_report_to_parent: false,
  },
  {
    id: "c-007", full_name: "Cristina Vlad",
    email: "cristina.vlad@example.com", phone: "+40721555999",
    cnp_cif: "2850603667788", address: "Str. Independenței 10, Brașov",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(90),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "B2B_COMPANY", company_name: "Alfa Pharma SRL",
    session_price: "280.00", session_frequency: "BILUNAR",
    report_frequency: "LUNAR", send_report_to_parent: false,
  },
  {
    id: "c-008", full_name: "Dan Niculescu",
    email: "dan.niculescu@example.com", phone: "+40740888222",
    cnp_cif: "1810715778899", address: "Bd. Unirii 55, București",
    gdpr_consent_signed: false, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(15),
    location: "CLINICA", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "220.00", session_frequency: "SAPTAMANAL",
    report_frequency: "NICIODATA", send_report_to_parent: false,
  },
  {
    id: "c-009", full_name: "Eliza Constantin",
    email: "eliza.c@example.com", phone: "+40752666333",
    cnp_cif: "2960122889900", address: "Str. Eroilor 4, Oradea",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(200),
    location: "CLINICA", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "200.00", session_frequency: "LUNAR",
    report_frequency: "LA_CERERE", send_report_to_parent: false,
  },
  {
    id: "c-010", full_name: "George Manea",
    email: "george.manea@example.com", phone: "+40761444777",
    cnp_cif: "1730820990011", address: "Calea Floreasca 22, București",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(45),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "B2B_COMPANY", company_name: "Green Energy SRL",
    session_price: "320.00", session_frequency: "SAPTAMANAL",
    report_frequency: "NICIODATA", send_report_to_parent: false,
  },
  {
    id: "c-011", full_name: "Raluca Enache",
    email: "raluca.e@example.com", phone: "+40770123456",
    cnp_cif: "2910308112233", address: "Str. Libertății 8, Constanța",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(300),
    location: "CLINICA", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "200.00", session_frequency: "BILUNAR",
    report_frequency: "NICIODATA", send_report_to_parent: false,
  },
  {
    id: "c-012", full_name: "Bogdan Popa",
    email: "bogdan.p@example.com", phone: "+40744990001",
    cnp_cif: "1840610223344", address: "Bd. Aurel Vlaicu 33, Arad",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(75),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "250.00", session_frequency: "SAPTAMANAL",
    report_frequency: "LUNAR", send_report_to_parent: false,
  },
  {
    id: "c-013", full_name: "Andreea Gheorghe",
    email: "andreea.g@example.com", phone: "+40723334455",
    cnp_cif: "2990405334455", address: "Str. Decebal 14, Sibiu",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(55),
    location: "CLINICA", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "B2B_COMPANY", company_name: "Retail Plus SRL",
    session_price: "300.00", session_frequency: "BILUNAR",
    report_frequency: "LUNAR", send_report_to_parent: false,
  },
  {
    id: "c-014", full_name: "Victor Stan",
    email: "victor.s@example.com", phone: "+40755112233",
    cnp_cif: "1760514445566", address: "Str. Primăverii 6, Bacău",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(140),
    location: "CLINICA", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "200.00", session_frequency: "LUNAR",
    report_frequency: "LA_CERERE", send_report_to_parent: false,
  },
  {
    id: "c-015", full_name: "Mirela Dinu",
    email: "mirela.d@example.com", phone: "+40732445566",
    cnp_cif: "2820711556677", address: "Str. Republicii 2, Ploiești",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(50),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "250.00", session_frequency: "SAPTAMANAL",
    report_frequency: "NICIODATA", send_report_to_parent: false,
  },
  {
    id: "c-016", full_name: "Alexandru Barbu",
    email: "alex.barbu@example.com", phone: "+40761999000",
    cnp_cif: "1900912667788", address: "Calea Griviței 44, București",
    gdpr_consent_signed: true, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(22),
    location: "CABINET_PARTICULAR", is_minor: false,
    parent_name: null, parent_phone: null,
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "250.00", session_frequency: "BILUNAR",
    report_frequency: "NICIODATA", send_report_to_parent: false,
  },

  // ────────────────────────────────────────────────────────────────────────
  // [c-017..c-057] MINORI — 41 total
  // Distribuție: 22 CABINET_PARTICULAR | 19 CLINICA
  // Parent filled for all, GDPR missing on ~5 (noi)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "c-003", full_name: "Andrei Dumitrescu",
    email: "andrei.d@example.com", phone: null,
    cnp_cif: "5151118223344", address: "Str. Traian 7, Iași",
    gdpr_consent_signed: false, contract_url: null,
    notes_anonymized_at: null, scheduled_anonymization_at: null, created_at: daysAgo(12),
    location: "CLINICA", is_minor: true,
    parent_name: "Elena Dumitrescu", parent_phone: "+40744777888",
    billing_type: "INDIVIDUAL", company_name: null,
    session_price: "200.00", session_frequency: "SAPTAMANAL",
    report_frequency: "LUNAR", send_report_to_parent: true,
  },
  { id:"c-017", full_name:"Maria Ionescu",         email:"p.ionescu17@ex.com",  phone:"+40720111001", cnp_cif:"6141203100001", address:"Str. Lalelelor 3, București",   gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(95),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Adriana Ionescu",  parent_phone:"+40720111002", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-018", full_name:"Ștefan Radu",           email:"p.radu18@ex.com",     phone:"+40720111003", cnp_cif:"5150715100002", address:"Bd. Unirii 12, Brașov",        gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(80),  location:"CLINICA",            is_minor:true, parent_name:"Ramona Radu",      parent_phone:"+40720111004", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-019", full_name:"Elena Popa",            email:"p.popa19@ex.com",     phone:"+40720111005", cnp_cif:"6160320100003", address:"Str. Oituz 5, Cluj-Napoca",    gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(110), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Mihai Popa",       parent_phone:"+40720111006", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-020", full_name:"Cristian Stoica",       email:"p.stoica20@ex.com",   phone:"+40720111007", cnp_cif:"5141010100004", address:"Calea Dorobanți 22, București", gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(200), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Dana Stoica",      parent_phone:"+40720111008", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-021", full_name:"Alexandra Milea",       email:"p.milea21@ex.com",    phone:"+40720111009", cnp_cif:"6160805100005", address:"Str. Brătianu 7, Iași",        gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(65),  location:"CLINICA",            is_minor:true, parent_name:"Ioan Milea",       parent_phone:"+40720111010", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-022", full_name:"Alin Georgescu",        email:"p.georgescu22@ex.com", phone:"+40720111011", cnp_cif:"5150522100006", address:"Str. Primăverii 9, Pitești",    gdpr_consent_signed:false, contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(8),   location:"CLINICA",            is_minor:true, parent_name:"Camelia Georgescu",parent_phone:"+40720111012", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-023", full_name:"Ioana Dănilă",          email:"p.danila23@ex.com",   phone:"+40720111013", cnp_cif:"6170115100007", address:"Str. Traian 11, Galați",        gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(130), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Victor Dănilă",    parent_phone:"+40720111014", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-024", full_name:"Matei Florea",          email:"p.florea24@ex.com",   phone:"+40720111015", cnp_cif:"5160712100008", address:"Str. Victoriei 3, Sibiu",       gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(90),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Ana Florea",       parent_phone:"+40720111016", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-025", full_name:"Rebeca Olteanu",        email:"p.olteanu25@ex.com",  phone:"+40720111017", cnp_cif:"6150303100009", address:"Bd. Eroilor 14, Craiova",       gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(160), location:"CLINICA",            is_minor:true, parent_name:"Liviu Olteanu",    parent_phone:"+40720111018", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-026", full_name:"David Costache",        email:"p.costache26@ex.com", phone:"+40720111019", cnp_cif:"5141128100010", address:"Str. Libertății 2, Bacău",       gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(40),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Mihaela Costache",  parent_phone:"+40720111020", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-027", full_name:"Teodora Nistor",        email:"p.nistor27@ex.com",   phone:"+40720111021", cnp_cif:"6160914100011", address:"Str. Decebal 5, Oradea",        gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(75),  location:"CLINICA",            is_minor:true, parent_name:"Sorin Nistor",      parent_phone:"+40720111022", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-028", full_name:"Luca Munteanu",         email:"p.munteanu28@ex.com", phone:"+40720111023", cnp_cif:"5150207100012", address:"Str. Mihai Viteazul 8, Ploiești",gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(55),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Rodica Munteanu",   parent_phone:"+40720111024", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-029", full_name:"Mihaela Savu",          email:"p.savu29@ex.com",     phone:"+40720111025", cnp_cif:"6170630100013", address:"Bd. Regele Ferdinand 3, Cluj",  gdpr_consent_signed:false, contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(5),   location:"CLINICA",            is_minor:true, parent_name:"Vasile Savu",       parent_phone:"+40720111026", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-030", full_name:"Rareș Oprea",           email:"p.oprea30@ex.com",    phone:"+40720111027", cnp_cif:"5140918100014", address:"Str. Avram Iancu 1, Alba Iulia",gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(120), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Nicoleta Oprea",    parent_phone:"+40720111028", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-031", full_name:"Antonia Lazăr",         email:"p.lazar31@ex.com",    phone:"+40720111029", cnp_cif:"6161025100015", address:"Str. Cuza Vodă 18, Iași",       gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(85),  location:"CLINICA",            is_minor:true, parent_name:"Marius Lazăr",      parent_phone:"+40720111030", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-032", full_name:"Vlad Ionașcu",          email:"p.ionascu32@ex.com",  phone:"+40720111031", cnp_cif:"5150411100016", address:"Str. Ștefan cel Mare 4, Suceava",gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(68),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Daniela Ionașcu",   parent_phone:"+40720111032", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-033", full_name:"Sara Coman",            email:"p.coman33@ex.com",    phone:"+40720111033", cnp_cif:"6160516100017", address:"Str. Independenței 6, Timișoara",gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(145), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Florin Coman",      parent_phone:"+40720111034", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-034", full_name:"Nicu Pandele",          email:"p.pandele34@ex.com",  phone:"+40720111035", cnp_cif:"5141201100018", address:"Str. Nicolae Bălcescu 2, Buzău",gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(50),  location:"CLINICA",            is_minor:true, parent_name:"Laura Pandele",     parent_phone:"+40720111036", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-035", full_name:"Daria Bălan",           email:"p.balan35@ex.com",    phone:"+40720111037", cnp_cif:"6170222100019", address:"Calea Moșilor 11, București",   gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(100), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Claudiu Bălan",     parent_phone:"+40720111038", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-036", full_name:"Cosmin Achim",          email:"p.achim36@ex.com",    phone:"+40720111039", cnp_cif:"5151009100020", address:"Str. Traian Vuia 3, Arad",      gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(77),  location:"CLINICA",            is_minor:true, parent_name:"Elena Achim",       parent_phone:"+40720111040", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-037", full_name:"Ioana Tănasă",          email:"p.tanasa37@ex.com",   phone:"+40720111041", cnp_cif:"6160718100021", address:"Bd. Dacia 28, București",       gdpr_consent_signed:false, contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(6),   location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Paul Tănasă",       parent_phone:"+40720111042", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-038", full_name:"Marius Voicu",          email:"p.voicu38@ex.com",    phone:"+40720111043", cnp_cif:"5160325100022", address:"Str. Horea 5, Cluj-Napoca",     gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(155), location:"CLINICA",            is_minor:true, parent_name:"Monica Voicu",      parent_phone:"+40720111044", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-039", full_name:"Patricia Lupu",         email:"p.lupu39@ex.com",     phone:"+40720111045", cnp_cif:"6171104100023", address:"Str. Popa Șapcă 4, Timișoara", gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(38),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Grigore Lupu",      parent_phone:"+40720111046", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-040", full_name:"Petru Cernea",          email:"p.cernea40@ex.com",   phone:"+40720111047", cnp_cif:"5150828100024", address:"Str. Republicii 7, Focșani",    gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(225), location:"CLINICA",            is_minor:true, parent_name:"Simona Cernea",     parent_phone:"+40720111048", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-041", full_name:"Sofia Bucur",           email:"p.bucur41@ex.com",    phone:"+40720111049", cnp_cif:"6160212100025", address:"Str. Berzei 9, București",      gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(60),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Andrei Bucur",      parent_phone:"+40720111050", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-042", full_name:"Ionuț Neagu",           email:"p.neagu42@ex.com",    phone:"+40720111051", cnp_cif:"5141015100026", address:"Str. Podul de Piatră 2, Iași",  gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(170), location:"CLINICA",            is_minor:true, parent_name:"Alina Neagu",       parent_phone:"+40720111052", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-043", full_name:"Camelia Ene",           email:"p.ene43@ex.com",      phone:"+40720111053", cnp_cif:"6160906100027", address:"Bd. Decebal 14, Bacău",          gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(42),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Dumitru Ene",       parent_phone:"+40720111054", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-044", full_name:"Silviu Dima",           email:"p.dima44@ex.com",     phone:"+40720111055", cnp_cif:"5150514100028", address:"Str. Avântului 3, Constanța",   gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(88),  location:"CLINICA",            is_minor:true, parent_name:"Adriana Dima",      parent_phone:"+40720111056", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-045", full_name:"Claudia Roman",         email:"p.roman45@ex.com",    phone:"+40720111057", cnp_cif:"6170328100029", address:"Str. Matei Basarab 6, Brașov",  gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(115), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Petre Roman",       parent_phone:"+40720111058", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-046", full_name:"Denis Bîrlea",          email:"p.birlea46@ex.com",   phone:"+40720111059", cnp_cif:"5160711100030", address:"Str. Cerna 5, Petroșani",        gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(52),  location:"CLINICA",            is_minor:true, parent_name:"Veronica Bîrlea",   parent_phone:"+40720111060", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-047", full_name:"Nadia Sima",            email:"p.sima47@ex.com",     phone:"+40720111061", cnp_cif:"6151119100031", address:"Str. Brazilor 2, Sibiu",         gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(190), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Octavian Sima",     parent_phone:"+40720111062", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-048", full_name:"Tudor Badea",           email:"p.badea48@ex.com",    phone:"+40720111063", cnp_cif:"5140312100032", address:"Str. Panduri 8, Craiova",       gdpr_consent_signed:false, contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(9),   location:"CLINICA",            is_minor:true, parent_name:"Georgeta Badea",    parent_phone:"+40720111064", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-049", full_name:"Alexia Crișan",         email:"p.crisan49@ex.com",   phone:"+40720111065", cnp_cif:"6160824100033", address:"Bd. Aurel Vlaicu 9, Arad",      gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(70),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Bogdan Crișan",     parent_phone:"+40720111066", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-050", full_name:"Mihnea Toma",           email:"p.toma50@ex.com",     phone:"+40720111067", cnp_cif:"5150606100034", address:"Str. Plevna 4, Ploiești",       gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(108), location:"CLINICA",            is_minor:true, parent_name:"Ioana Toma",        parent_phone:"+40720111068", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-051", full_name:"Nicole Preda",          email:"p.preda51@ex.com",    phone:"+40720111069", cnp_cif:"6171015100035", address:"Str. Armenească 7, București",  gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(33),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Traian Preda",      parent_phone:"+40720111070", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-052", full_name:"Alex Paraschiv",        email:"p.paraschiv52@ex.com",phone:"+40720111071", cnp_cif:"5151213100036", address:"Str. Sf. Vineri 3, Buzău",      gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(148), location:"CLINICA",            is_minor:true, parent_name:"Carmen Paraschiv",  parent_phone:"+40720111072", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-053", full_name:"Evelina Dragomir",      email:"p.dragomir53@ex.com", phone:"+40720111073", cnp_cif:"6160109100037", address:"Str. Mihail Kogălniceanu 5, Botoșani",gdpr_consent_signed:true, contract_url:null,notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(62), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Viorel Dragomir",   parent_phone:"+40720111074", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR", send_report_to_parent:true },
  { id:"c-054", full_name:"Cezar Ioniță",          email:"p.ionita54@ex.com",   phone:"+40720111075", cnp_cif:"5150817100038", address:"Str. Revoluției 3, Deva",       gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(93),  location:"CLINICA",            is_minor:true, parent_name:"Florica Ioniță",    parent_phone:"+40720111076", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-055", full_name:"Roxana Duțu",           email:"p.dutu55@ex.com",     phone:"+40720111077", cnp_cif:"6170407100039", address:"Str. Libertății 4, Râmnicu Vâlcea",gdpr_consent_signed:true,contract_url:null,notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(47), location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Sorin Duțu",        parent_phone:"+40720111078", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR", send_report_to_parent:true },
  { id:"c-056", full_name:"Bogdan Rîpă",           email:"p.ripa56@ex.com",     phone:"+40720111079", cnp_cif:"5141122100040", address:"Str. 1 Decembrie 8, Alba Iulia",gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(135), location:"CLINICA",            is_minor:true, parent_name:"Cristina Rîpă",     parent_phone:"+40720111080", billing_type:"INDIVIDUAL", company_name:null, session_price:"180.00", session_frequency:"SAPTAMANAL", report_frequency:"LUNAR",    send_report_to_parent:true  },
  { id:"c-057", full_name:"Antonia Pîrvulescu",    email:"p.pirvulescu57@ex.com",phone:"+40720111081",cnp_cif:"6160530100041", address:"Str. Take Ionescu 2, Ploiești", gdpr_consent_signed:true,  contract_url:null, notes_anonymized_at:null, scheduled_anonymization_at: null, created_at:daysAgo(20),  location:"CABINET_PARTICULAR", is_minor:true, parent_name:"Dan Pîrvulescu",     parent_phone:"+40720111082", billing_type:"INDIVIDUAL", company_name:null, session_price:"200.00", session_frequency:"BILUNAR",    report_frequency:"LUNAR",    send_report_to_parent:true  },
];

// ── Derived stats (auto-computed — keep in sync with mockStats in dashboard.ts) ──

export const clientStats = {
  total:          mockClients.length,                                                    // 57
  cabinet:        mockClients.filter(c => c.location === "CABINET_PARTICULAR").length,  // 33
  clinica:        mockClients.filter(c => c.location === "CLINICA").length,             // 24
  minori:         mockClients.filter(c => c.is_minor).length,                           // 41
  adulti:         mockClients.filter(c => !c.is_minor).length,                          // 16
  b2b:            mockClients.filter(c => c.billing_type === "B2B_COMPANY").length,     // 6
  missingGdpr:    mockClients.filter(c => !c.gdpr_consent_signed).length,
};
