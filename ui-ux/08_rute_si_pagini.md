# Rute, Pagini, Carduri și Overlay-uri

Harta completă a aplicației: fiecare rută, ce randează, ce carduri/overlay-uri/drawer-e conține și ce query params acceptă.

---

## Structura generală

```
/                          → Landing page (public)
/login                     → Autentificare terapeut
/book                      → Booking public (fără auth)
/onboarding                → Onboarding adult (token required)
/onboarding/minor          → Onboarding minor (token required)
/onboarding/[id]           → Onboarding per-client (alt entry)
/confirm-result            → Confirmare/anulare programare
/privacy                   → Politică confidențialitate
/terms                     → Termeni și condiții
/legal/declaration         → Declarații legale

/dashboard                 → Dashboard principal (auth required)
/dashboard/appointments    → Programări
/dashboard/appointments/new
/dashboard/appointments/[id]
/dashboard/appointments/[id]/edit
/dashboard/calendar        → Calendar săptămânal
/dashboard/clients         → Registru clienți
/dashboard/clients/new
/dashboard/clients/new-minor
/dashboard/clients/[id]
/dashboard/clients/[id]/edit
/dashboard/clients/[id]/onboarding
/dashboard/clients/[id]/anonymize
/dashboard/notes           → Note clinice (index)
/dashboard/notes/[appointmentId]
/dashboard/vault           → Seif criptat
/dashboard/invoices        → Facturi
/dashboard/invoices/new
/dashboard/invoices/[id]
/dashboard/expenses        → Cheltuieli
/dashboard/billing         → Raportare financiară
/dashboard/review          → Sumar lunar
/dashboard/assessments     → Evaluări psihologice
/dashboard/assessments/new
/dashboard/tests           → Teste psihologice
/dashboard/tests/new
/dashboard/documents       → Documente legale
/dashboard/ai              → Asistent clinic AI
/dashboard/cas             → Modul CAS
/dashboard/activity        → Registru activitate
/dashboard/compliance      → Conformitate GDPR
/dashboard/settings        → Setări cabinet
/dashboard/settings/import

/api/...                   → API Routes (server only)
```

---

## PAGINI PUBLICE

---

### `/` — Landing Page

**Shell:** Gradient custom, fără DashboardLayout
**Acces:** Public

```
┌─────────────────────────────────────────────────────────┐
│ HERO SECTION                                            │
│ ┌─────────────────────────────┐  ┌───────────────────┐  │
│ │ Card principal              │  │ InfoCard ×3       │  │
│ │ • Eyebrow "ERP clinic"      │  │ • Conformitate    │  │
│ │ • H1 "Ce'ai Pățit?"         │  │ • Date clinice    │  │
│ │ • Descriere platformă       │  │ • Flux zilnic     │  │
│ │ • [Dashboard] [Book demo]   │  └───────────────────┘  │
│ └─────────────────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

**Carduri:** 1 card hero (`rounded-[2rem]`) + 3 `InfoCard` (card simplu cu icon)
**Overlay-uri:** niciunul
**Query params:** —
**CTA-uri:** `→ /dashboard`, `→ /book`

---

### `/login` — Autentificare

**Shell:** Gradient public, centrat
**Acces:** Public (redirect → /dashboard dacă deja autentificat)

```
┌─────────────────────────────────────────────────────────┐
│ Centrat vertical și orizontal                           │
│                                                         │
│         ┌─────────────────────────────┐                 │
│         │ Card (rounded-[2rem])       │                 │
│         │ • Logo "Ce'ai Pățit?"       │                 │
│         │ • CardTitle + Description   │                 │
│         │ ─────────────────────────── │                 │
│         │ [SetupBanner dacă !config]  │                 │
│         │ [Error banner dacă ?error]  │                 │
│         │ • Label + Input Email       │                 │
│         │ • Label + Input Parolă      │                 │
│         │ [Autentifică-te]            │                 │
│         └─────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

**Carduri:** 1 `Card` centrat
**Overlay-uri:** niciunul
**Query params:** `?error=not_configured | missing_fields | <mesaj>`
**Action:** Server Action `signInWithPassword` → redirect `/dashboard`

---

### `/book` — Booking Public

**Shell:** `PublicPageShell` cu gradient sky
**Acces:** Public (oricine)

```
┌─────────────────────────────────────────────────────────┐
│ Grid 2 coloane (lg)                                     │
│ ┌─────────────────────┐  ┌──────────────────────────┐  │
│ │ Panel stânga        │  │ BookingWidget / BookingForm│  │
│ │ (bg-slate-950 dark) │  │                          │  │
│ │ • Logo O            │  │ • Câmpuri personale      │  │
│ │ • H1 "Rezervă..."   │  │ • Calendar disponibilitate│  │
│ │ • 3 pași explicați  │  │ • Selector oră           │  │
│ │   (mini carduri)    │  │ • [Trimite cerere]       │  │
│ │ • 3 garanții        │  └──────────────────────────┘  │
│ └─────────────────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

**Carduri:** panel stânga `rounded-[2.5rem]` dark + BookingWidget card dreapta
**Overlay-uri:** niciunul (redirect la `/confirm-result` după submit)
**Query params:** `?therapist=<slug>` (optional)

---

### `/onboarding` — Onboarding Adult

**Shell:** `PublicPageShell`
**Acces:** Public cu token (`?t=<token>`)

**Dacă token invalid:**
```
┌──────────────────────────────────┐
│ Card eroare (rounded-3xl)        │
│ • Iconiță Activity (roșu)        │
│ • H1 "Link Nevalid"              │
│ • Descriere + contact terapeut   │
└──────────────────────────────────┘
```

**Dacă token valid:**
```
┌─────────────────────────────────────────────────────────┐
│ ClientOnboardingWizard                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Progress bar (N pași)                               │ │
│ │                                                     │ │
│ │ [Pas 1] Date personale                              │ │
│ │   • Nume, dată naștere, adresă, telefon             │ │
│ │                                                     │ │
│ │ [Pas 2] Antecedente medicale                        │ │
│ │   • Istoric, medicamente, alergii                   │ │
│ │                                                     │ │
│ │ [Pas 3] Consimțământ GDPR                           │ │
│ │   • Checkbox + semnătură                            │ │
│ │                                                     │ │
│ │ [← Înapoi]  [Continuă →]  /  [Finalizează]         │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Carduri:** wizard card unic
**Overlay-uri:** niciunul
**Query params:** `?t=<token>` (obligatoriu)

---

### `/onboarding/minor` — Onboarding Minor

**Shell:** `PublicPageShell`
**Acces:** Public cu token minor (`?t=<token>`)

Identic structural cu `/onboarding`, dar wizard-ul are 4 pași:
- Pas 1: Date minor
- Pas 2: Date tutore / reprezentant legal
- Pas 3: Antecedente minor
- Pas 4: Consimțământ parental

**Query params:** `?t=<token>` (obligatoriu) — `?therapist=<slug>` ignorat (eliminat)

---

### `/confirm-result` — Confirmare Programare

**Shell:** `PublicPageShell`, centrat
**Acces:** Public

```
┌──────────────────────────────────────────┐
│ Card (rounded-[2.5rem])                  │
│ ┌──────────────────────────────────────┐ │
│ │ Header colorat                       │ │
│ │ • dacă confirmed: bg-emerald-700     │ │
│ │ • dacă anulat: bg-slate-950          │ │
│ │ • Iconiță CalendarCheck / CalendarX  │ │
│ │ • Eyebrow "Status programare"        │ │
│ │ • H1 "Programare confirmată/anulată" │ │
│ │ • Descriere                          │ │
│ ├──────────────────────────────────────┤ │
│ │ Body alb                             │ │
│ │ • Detalii programare (data, ora)     │ │
│ │ • Info cabinet                       │ │
│ │ [Înapoi la pagina principală]        │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Query params:** `?action=confirm` | `?action=cancel` | `?demo=1`

---

## DASHBOARD — PAGINI PRINCIPALE

Toate paginile dashboard folosesc `DashboardLayout` (Sidebar + Topbar + `DashboardPage`).

---

### `/dashboard` — Dashboard Principal

```
PageHeader
  Eyebrow: data curentă (format lung)
  Title: "Bună ziua, [Nume Terapeut]"
  Action: badge "Sistem online și securizat"

[Alert minori dacă pendingMinorReviews > 0]
  → banner amber cu AlertTriangle

Grid 4 StatCard-uri
  • Total clienți activi    (Users icon)
  • Programări azi          (CalendarDays icon)
  • Facturi neîncasate      (CreditCard icon)
  • Creștere lunară         (TrendingUp icon)

Grid 2 coloane:
  ┌──────────────────────┐  ┌────────────────────────┐
  │ SectionCard           │  │ SectionCard             │
  │ "Programări azi"      │  │ "Programări viitoare"  │
  │ AppointmentsToday     │  │ UpcomingAppointments    │
  │ (lista cu ore)        │  │ (lista next N)          │
  └──────────────────────┘  └────────────────────────┘

Grid 2 coloane:
  ┌──────────────────────┐  ┌────────────────────────┐
  │ FinancialSummary      │  │ CompliancePanel        │
  │ (grafic / stats)      │  │ (status GDPR)          │
  └──────────────────────┘  └────────────────────────┘

SectionCard "Facturi neîncasate"
  UnpaidInvoices (tabel compact)

VaultStatusWidget (status seif)
```

**Overlay-uri:** niciunul direct — `CompliancePanel` poate afișa detalii inline
**Query params:** —

---

### `/dashboard/appointments` — Programări

```
PageHeader
  Title: "Programări"
  Description: "N programări · filtrate după ..."
  Action: [+ Programare nouă]

[SetupBanner dacă !configured]

Filtre status (tabs/buttons):
  Toate | Programată | Confirmată | Finalizată | Anulată

SectionCard "Programări"
  AppointmentsViewManager (toggle List/Calendar)

  ── Vedere Listă ──
  Table:
    | Data & Ora | Client | Locație | Status | Notă | Factură |
    Fiecare rând → click deschide SessionDrawer

  ── Vedere Calendar ──
  WeekView (grid orar)
    Slot click → SessionDrawer

SessionDrawer [OVERLAY lateral]
  Detalii programare:
  • Client (link → fișă)
  • Data, ora, durată
  • Locație + icon
  • Status Badge
  • Notă personală
  Acțiuni:
  • [Marchează finalizată]
  • [Adaugă notă clinică] → /dashboard/notes/[id]
  • [Emite factură] → /dashboard/invoices/new?appointmentId=
  • [Editează] → /dashboard/appointments/[id]/edit
  • [Anulează]
```

**Overlay-uri:** `SessionDrawer` (lateral, slide-in dreapta)
**Query params:** `?status=` | `?from=` | `?to=` | `?session=<id>` (deschide drawer direct)

---

### `/dashboard/appointments/new` — Programare Nouă

```
← Înapoi la programări

PageHeader "Programare nouă"

SectionCard "Detalii sesiune"
  AppointmentForm:
  • Select client (dropdown cu toți clienții activi)
  • DatePicker — data și ora
  • Select tip locație (Cabinet / Online / Clinică)
  • Input link Meet (dacă Online)
  • Input durată (minute)
  • Textarea observații
  [Salvează programare]
```

**Overlay-uri:** niciunul
**Query params:** `?clientId=<id>` (pre-selectează clientul)

---

### `/dashboard/appointments/[id]` — Detaliu Programare

```
← Înapoi la programări

PageHeader "Programare — [Data]"

SectionCard "Detalii"
  • Toate câmpurile read-only
  • Badge status
  • Link client
  Acțiuni: [Editează] [Marchează finalizată] [Anulează]

SectionCard "Notă clinică"
  • Link → /dashboard/notes/[id] dacă există
  • [Adaugă notă] dacă nu există

SectionCard "Factură"
  • Status factură sau [Emite factură]
```

---

### `/dashboard/appointments/[id]/edit` — Editare Programare

Identic cu `/new` dar cu date pre-populate și action `updateAppointment`.

---

### `/dashboard/calendar` — Calendar Săptămânal

```
PageHeader "Calendar"
  Description: "N programări · vizualizare săptămânală"
  Action: [+ Programare nouă]

[SetupBanner dacă !configured]

[EmptyState dacă 0 programări]
SAU
WeekView
  Grid orar (coloane = zile, linii = ore)
  Slot cu programare → click → SessionDrawer
  [← săpt. anterioară] [Azi] [săpt. următoare →]
```

**Overlay-uri:** `SessionDrawer` la click pe slot
**Query params:** `?date=<YYYY-MM-DD>` (săptămâna afișată)

---

### `/dashboard/clients` — Registru Clienți

```
PageHeader "Clienți"
  Action: [+ Client nou] [+ Pacient minor]

Grid 4 StatCard-uri (KPI funnel):
  • Total pacienți
  • În onboarding
  • Prima ședință (programat)
  • Pacienți activi

[SetupBanner dacă !configured]

ClientsClient (client component):
  ── Filtre ──
  Search input | Filtru status dropdown

  ── Desktop: Table ──
  | Nume | Status | Contact | Programare | Acțiuni |
  Fiecare rând → click → /dashboard/clients/[id]

  ── Mobile: Card list ──
  ClientMobileCard pentru fiecare client
  • Nume + Badge status
  • Email / telefon
  • Next action recomandată
  [→ Fișă]
```

**Overlay-uri:** niciunul — navigare la fișă
**Query params:** —

---

### `/dashboard/clients/new` — Client Nou

```
← Înapoi la clienți

PageHeader "Client nou"

SectionCard "Date inițiale client"
  ClientForm (adult):
  ── Tip serviciu (poziționat înainte de Demografice) ──
  │ Select "Tip serviciu principal"      │
  │ (UNDECIDED/INDIVIDUAL/MINOR_CLIENT/  │
  │  B2B_COMPANY/TRAINING_GROUP/         │
  │  SUPERVISION)                        │
  ┌─────────────────┐  ┌─────────────────┐
  │ Nume complet *  │  │ Email *         │
  ├─────────────────┤  ├─────────────────┤
  │ Telefon         │  │ CNP / CIF       │
  ├─────────────────┤  ├─────────────────┤
  │ Dată naștere    │  │ Locație         │
  └─────────────────┘  └─────────────────┘
  │ Adresă                               │
  │ GDPR consent [checkbox]              │
  ── Secțiune Facturare ──
  │ Tip facturare: Individual / B2B      │
  │ (dacă B2B: Firma, CUI, IBAN, etc.)  │
  ── Secțiune Tarif ──
  │ Preț ședință | Frecvență             │
  [Salvează client]
```

**Overlay-uri:** niciunul
**Query params:** —

---

### `/dashboard/clients/new-minor` — Pacient Minor Nou

```
← Înapoi la clienți

PageHeader "Pacient minor nou"

SectionCard "Înregistrare pacient minor" (icon Baby)
  MinorOnboardingForm:
  • Date minor (nume, CNP, dată naștere)
  • Date tutore (nume, relație, telefon, email)
  • Documente custodie
  [Salvează fișă minor]
```

---

### `/dashboard/clients/[id]` — Fișa Clientului ⭐

Cea mai complexă pagină. Gestionată de `ClientDashboardUI`.

```
← Înapoi la clienți

[Banner "Programare confirmată" dacă ?anonymized=1]

PageHeader
  Eyebrow: "[Status lifecycle] din [Luna An]"
  Title: [Nume client] sau "[Client Anonimizat]"
  Action: [Editează] [Generează contract]

── Dacă minor și onboarding necomplet ──
Banner amber:
  "Onboarding necompletat"
  [📋 Copiază link onboarding minor]

── Service Track (deasupra gridului) ──
┌──────────────────────────────────────────────────┐
│ ServiceTrackCard                                 │
│ • Badge tip serviciu (ascuns dacă UNDECIDED)     │
│ • service_track_status (opțional)                │
│ • Next best action contextual per tip + lifecycle│
└──────────────────────────────────────────────────┘

── Sumar Lifecycle ──
┌──────────────────────────────────────────────────┐
│ SectionCard "Lifecycle & Status"                 │
│ • Badge status mare                              │
│ • Descriere stare curentă                        │
│ • Următori pași recomandați (max 3)              │
│ ── Acțiuni manuale (butoane) ──                  │
│ [Marchează activ] [Marchează inactiv]            │
│ [Încheie caz] [Neconversie] [Reactivează]        │
│ ── Semnale administrative ──                     │
│ • GDPR: ✅/⚠ | Guardian: ✅/⚠ | Prog. viitoare: ✅/⚠│
└──────────────────────────────────────────────────┘

Grid 2 coloane:
┌──────────────────────┐  ┌────────────────────────┐
│ SectionCard           │  │ SectionCard             │
│ "Informații personale"│  │ "Programări"            │
│ • Nume, email, tel    │  │ Tabel programări        │
│ • CNP, adresă         │  │ [+ Programare nouă]     │
│ • Dată naștere        │  │                        │
└──────────────────────┘  └────────────────────────┘

SectionCard "Documente clinice"
  PatientDocuments:
  • Lista documente (cu preview link)
  • [Upload document]
  • [Sincronizează Drive]

SectionCard "Evaluări psihologice"
  • Tabel teste completate
  • [+ Evaluare nouă]
  AssessmentDetailOverlay [OVERLAY] la click pe test

SectionCard "Factură & Plăți"
  • Tabel facturi client
  • [+ Factură nouă]

SectionCard "Medicamente"
  • Lista medicamente (dacă există)

SectionCard "Note de criză"
  • Lista note criză (badge destructive dacă există)

SectionCard "Asistent AI"
  ClientAiAssistant:
  • Chat pentru context clinic
  • [Interpretează note]

SectionCard "Istoric lifecycle"
  • Lista tranziții (from → to, motiv, timestamp, by)
  • EmptyState dacă gol

SectionCard "Onboarding"
  • Status onboarding
  • [Retrimite link] / [Copiază link]
  • [Generează contract]

── Zona periculoasă ──
SectionCard "Anonimizare GDPR"
  • Avertisment ireversibil
  • [Planifică anonimizare] → /dashboard/clients/[id]/anonymize
```

**Overlay-uri:**
- `AssessmentDetailOverlay` — la click pe un test
- `ClientDetailOverlay` — secțiuni expandabile
- `SectionDetailOverlay` — detalii secțiune
- `ContractGeneratorModal` — la click [Generează contract]

**Query params:**
- `?anonymized=1` — banner confirmare
- `?assessment=<id>` — deschide overlay evaluare
- `?section=<name>` — scroll la secțiune

---

### `/dashboard/clients/[id]/edit` — Editare Client

Identic structural cu `/new`, date pre-populate, action `updateClient`.

---

### `/dashboard/clients/[id]/anonymize` — Anonimizare GDPR

```
← Înapoi la fișă

PageHeader "Anonimizare date"

[Dacă deja anonimizat]
  EmptyState "Fișa este deja anonimizată"

[Dacă nu]
  SectionCard "Avertisment"
    • AlertTriangle icon roșu
    • Explicație ce se va șterge
    • Explicație ce se păstrează

  SectionCard "Confirmare"
    • Label: "Scrie ȘTERGE PII pentru a confirma"
    • Input text
    • [Anonimizează definitiv] (destructive)
```

**Overlay-uri:** niciunul (submit → redirect cu `?anonymized=1`)
**Query params:** `?error=confirmation | demo`

---

### `/dashboard/clients/[id]/onboarding` — Onboarding Per-Client

Pagina de management onboarding din perspectiva terapeutului (link-uri, status, retrimite).

---

### `/dashboard/notes` — Note Clinice (Index)

```
PageHeader "Note clinice"
  Description: "N ședințe · M note criptate local"
  Action: Badge "End-to-end · PIN local"

[SetupBanner dacă !configured]

SectionCard "Ședințe și note"
  Table:
  | Data | Client | Locație | Notă | Acțiuni |
  Fiecare rând:
  • Badge "Notă salvată" (dacă există) sau "Fără notă"
  • [→ Deschide nota] → /dashboard/notes/[appointmentId]
```

**Overlay-uri:** niciunul — navigare la pagina notei
**Query params:** —

---

### `/dashboard/notes/[appointmentId]` — Editor Notă Clinică

```
← Înapoi la note

PageHeader "Notă clinică — [Data ședinței]"

[VaultStatus: trebuie deblocat pentru editare]

SectionCard "Notă criptată"
  NoteEditor:
  • Textarea (decrypt la unlock)
  • [Salvează nota]  [Exportă PDF]

SectionCard "Note de criză" (dacă există)
  • Lista note criză asociate
```

**Overlay-uri:** `VaultUnlockOverlay` dacă vault e blocat
**Query params:** —

---

### `/dashboard/vault` — Seif Criptat

```
DashboardPage
  VaultClient (gestionează intern toate stările):

  ── Stare: needs-setup ──
  ┌──────────────────────────────────────┐
  │ Configurare PIN                      │
  │ • Input PIN (6+ cifre)               │
  │ • Confirmare PIN                     │
  │ [Configurează seiful]                │
  └──────────────────────────────────────┘

  ── Stare: locked ──
  ┌──────────────────────────────────────┐
  │ 🔒 Seif blocat                       │
  │ • Input PIN                          │
  │ [Deblochează]                        │
  └──────────────────────────────────────┘

  ── Stare: unlocked ──
  PageHeader "Seif note clinice"
    Action: [🔒 Blochează]

  SectionCard "Note criptate"
    Table note cu:
    | Client | Data | Preview | Acțiuni |
    [+ Notă nouă]

  SectionCard "Documente seif"
    Lista documente criptate
```

**Overlay-uri:** niciunul (stările sunt inline)
**Query params:** —

---

### `/dashboard/invoices` — Facturi

```
PageHeader "Facturi"
  Description: "N facturi"
  Action: [+ Factură nouă]

[SetupBanner SmartBill dacă !smartbillOk]

Filtre tabs:
  Toate | Draft | Emisă | Plătită | Scadentă

SectionCard "Facturi"
  Table:
  | Nr. | Client | Data | Suma | Status | Acțiuni |
  Acțiuni per rând:
  • [Vizualizează] → /dashboard/invoices/[id]
  • [Emite SmartBill] (dacă Draft)
  • [Marchează plătită]
```

**Overlay-uri:** niciunul direct
**Query params:** `?status=<DRAFT|EMISA|PLATITA|SCADENTA>`

---

### `/dashboard/invoices/new` — Factură Nouă

```
← Înapoi la facturi

PageHeader "Factură nouă"
  Description: "Serie [SMARTBILL_SERIES]"

[SetupBanner dacă !configured]

SectionCard "Detalii factură"
  InvoiceForm:
  • Select client
  • Select programare (ședință finalizată, optional)
  • Data emitere
  • Servicii + tarife (linii multiple)
  • Tip plată
  [Salvează draft] [Emite SmartBill]
```

**Query params:** `?appointmentId=<id>` (pre-completează ședința)

---

### `/dashboard/invoices/[id]` — Detaliu Factură

Factură read-only + acțiuni (emite, marchează plătită, stornează).

---

### `/dashboard/expenses` — Cheltuieli

```
PageHeader "Cheltuieli cabinet"

[SetupBanner dacă !configured]

ExpensesClient:
  Filtre lună

  Table:
  | Data | Descriere | Categorie | Suma | Acțiuni |

  [+ Cheltuială nouă] → modal/dialog inline
```

**Overlay-uri:** `AddExpenseDialog` sau inline form
**Query params:** `?month=<YYYY-MM>`

---

### `/dashboard/billing` — Raportare Financiară

```
PageHeader "Raportare lunară și facturare"
  Action: [Export CSV]

[SetupBanner dacă !configured]

Grid 4 StatCard-uri:
  • Ședințe    • Ore lucrate
  • De încasat • Rata încasare

Grid 2 coloane:
  Card "Prognoza lunii" (revenue forecast)
  Card "Cheltuieli"     (defalcat pe categorii)

Card "Sumar financial complet"
  Tabel detaliat pe luni
```

**Query params:** `?month=<YYYY-MM>`

---

### `/dashboard/review` — Sumar Lunar

```
PageHeader "Sumar lunar cabinet"

[SetupBanner dacă !configured]

Grid 5 KpiCard-uri:
  • Ore lucrate  • Clienți unici
  • Rată anulări • Venit mediu/ședință
  • Profit net

Card "Distribuție status clienți"
  (grafic sau tabel)

Card "Top clienți lunii"
  Lista cu nr. ședințe

[Export PDF raport]
```

---

### `/dashboard/assessments` — Evaluări Psihologice

```
PageHeader "Evaluări psihologice"
  Action: [+ Evaluare nouă]

[SetupBanner dacă !configured]

SectionCard "Istoric evaluări"
  Table:
  | Client | Test | Data | Scor | Acțiuni |
  Click rând → AssessmentDetailOverlay [OVERLAY]
```

**Overlay-uri:** `AssessmentDetailOverlay`

---

### `/dashboard/assessments/new` — Evaluare Nouă

```
PageHeader "Evaluare nouă"

SectionCard "Configurare test"
  TestBuilderForm:
  • Select client
  • Select tip test (din lista seed)
  • Date administrare
  [Lansează test]
```

---

### `/dashboard/tests` — Teste Psihologice

```
PageHeader "Teste psihologice"
  Action: [+ Test nou]

SectionCard "Teste disponibile"
  Table teste cu scoring:
  | Nume test | Categorie | Nr. întrebări | Acțiuni |
  [Execută] → TestExecutionForm overlay/pagină
```

---

### `/dashboard/tests/new` — Test Nou

Form de creare test custom cu întrebări și scale de scor.

---

### `/dashboard/documents` — Documente Legale

```
PageHeader "Documente legale"
  Description: "Template-uri contracte și acte"

[SetupBanner dacă !configured]

Grid carduri template:
  Card "Contract adult" (standard)
  Card "Contract minor"
  Card "Contract B2B"
  Card "Consimțământ GDPR"
  Card "Consimțământ CAS"
  Card "Raport psihologic adult"
  Card "Raport psihologic minor"
  ...
  Fiecare → [Generează PDF]

SectionCard "Documente generate"
  Lista PDF-uri generate cu link download
  [Sincronizează Drive]
```

**Overlay-uri:** `ContractGeneratorModal` la generare

---

### `/dashboard/ai` — Asistent Clinic AI

```
PageHeader "Asistent clinic AI"

[SetupBanner dacă Ollama offline]

SectionCard "Conversație clinică"
  ClientAiAssistant:
  • Selector client (pentru context)
  • Chat interface (mesaje user/assistant)
  • [Șterge conversația]
  Input mesaj + [Trimite]

SectionCard "Interpretare note"
  • Select notă criptată
  • [Interpretează] → trimite la /api/ai/interpret
  • Răspuns AI afișat
```

**Overlay-uri:** niciunul
**Query params:** —

---

### `/dashboard/cas` — Modul CAS

```
PageHeader "Export CAS"

CasModuleUI:
  SectionCard "Export date CAS"
    • Selector perioadă (de la / până la)
    • Tip date
    • [Exportă JSON] [Exportă CSV]

  SectionCard "Referințe medicale"
    ReferralUploader:
    • Upload referință (PDF)
    • Lista referințe uploadate
    • Nr. referință, medic, dată
```

**Query params:** —

---

### `/dashboard/activity` — Registru Activitate

```
PageHeader "Registru activitate"
  Action: [Export CSV]

[SetupBanner dacă !configured]

SectionCard "Ședințe finalizate"
  Table:
  | Data | Client | Tip | Durată | Note |

  [EmptyState dacă gol]
```

**Query params:** `?from=` | `?to=` | `?type=`

---

### `/dashboard/compliance` — Conformitate GDPR

```
PageHeader "Conformitate legală"

[SetupBanner dacă !configured]

SectionCard "Cadru legal urmărit"
  Lista legi aplicabile (GDPR, Legea 272, etc.)

SectionCard "Panou juridic" (dacă configured)
  CompliancePanel:
  • Nr. clienți cu GDPR semnat / fără
  • Clienți cu date expirate
  • Anonimizări planificate
  • [Export raport conformitate]
  [EmptyState dacă !configured]
```

---

### `/dashboard/settings` — Setări Cabinet

```
PageHeader "Setări cabinet"

[SetupBanner dacă !configured]

SettingsClient (Tabs):
  ── Tab: Profil ──
  • Nume terapeut, email, telefon
  • Adresă cabinet, CUI
  • [Salvează profil]

  ── Tab: Integrări ──
  • Google Calendar [Conectează / Deconectează]
  • SmartBill [API key, serie]
  • Twilio (SMS) [optional]
  • Ollama AI [URL local]

  ── Tab: Programări ──
  • Program lucru (zile + ore)
  • Durată default ședință
  • Preț default ședință
  • [Activează booking public]

  ── Tab: CAS ──
  • Nr. contract CAS
  • Județ, cod CPR
  • [Salvează]

  ── Tab: Securitate ──
  • Schimbare PIN vault
  • Auto-lock timeout
```

---

### `/dashboard/settings/import` — Import Date

```
PageHeader "Import date"

ImportDashboard:
  SectionCard "Import facturi SmartBill"
    • [Importă din SmartBill]
    • Progress + rezultat

  SectionCard "Import cheltuieli"
    • Upload CSV
    • Preview + confirmare
    • [Importează]
```

---

## API ROUTES (server only — fără UI)

| Metodă | Rută | Scop |
|--------|------|------|
| POST | `/api/bookings/create` | Creare programare publică |
| GET/POST | `/api/book` | Preflight booking |
| POST | `/api/confirm` | Confirmare/anulare programare |
| POST | `/api/ai/chat` | Chat asistent AI |
| POST | `/api/ai/interpret` | Interpretare note clinice |
| GET | `/api/analytics/monthly-review` | Date analytics lunare |
| GET | `/api/billing/monthly-summary` | Sumar financial lunar |
| GET | `/api/billing/revenue-forecast` | Prognoză venituri |
| GET | `/api/exports/cas` | Export CAS fără PII |
| GET | `/api/google/auth` | Inițiere OAuth Google |
| GET | `/api/google/callback` | Callback OAuth Google |
| POST | `/api/google/webhook` | Sync bidirecțional Calendar |
| GET | `/api/health` | Health check aplicație |
| GET | `/api/health/data-integrity` | Verificare integritate date |
| POST | `/api/import/invoices` | Import facturi SmartBill |
| POST | `/api/import/expenses` | Import cheltuieli CSV |
| POST | `/api/uploads/document` | Upload document client |
| POST | `/api/uploads/referral` | Upload referință medicală |
| POST | `/api/webhooks/smartbill` | Webhook status SmartBill |
| GET | `/api/cron/reminders` | Remindere programări (cron extern) |
| GET | `/api/contracts/generated` | Registry contracte generate |
| GET | `/api/activity/export` | Export CSV activitate |

---

## OVERLAY-URI ȘI DRAWER-E — INDEX

| Componentă | Tip | Apare pe pagina |
|------------|-----|----------------|
| `SessionDrawer` | Drawer lateral | `/dashboard/appointments`, `/dashboard/calendar` |
| `AssessmentDetailOverlay` | Overlay centrat | `/dashboard/assessments`, `/dashboard/clients/[id]` |
| `ClientDetailOverlay` | Overlay lateral | `/dashboard/clients` (preview rapid) |
| `SectionDetailOverlay` | Overlay centrat | `/dashboard/clients/[id]` (secțiuni expandabile) |
| `ContractGeneratorModal` | Modal centrat | `/dashboard/clients/[id]`, `/dashboard/documents` |
| `AlertDialog` | Modal confirmare | Orice acțiune distructivă |
| `VaultUnlockOverlay` | Overlay centrat | `/dashboard/notes/[id]` (vault blocat) |
| Mobile Menu Panel | Overlay topbar | Toate paginile dashboard (mobile) |
| Search Dropdown | Dropdown topbar | Toate paginile dashboard (desktop) |

---

## PAGINI STATICE

| Rută | Conținut |
|------|----------|
| `/privacy` | Politică de confidențialitate (text lung) |
| `/terms` | Termeni și condiții (text lung) |
| `/legal/declaration` | Declarații legale cabinet (shell document) |
