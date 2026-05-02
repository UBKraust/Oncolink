# Dashboard v2 — Clinical Command Center

**Repository:** `UBKraust/Oncolink`  
**Branch:** `Ceai-Patit`  
**Data:** 2026-05-02  
**Mod:** plan, audit și status de implementare incrementală

---

## 0. Status actual

Refactorul principal pentru `/dashboard` a fost implementat incremental în aceeași zi, fără rescriere totală și fără dependințe noi.

### Implementat acum

- header operațional cu descriere dinamică și CTA-uri vizibile:
  - `Client nou`
  - `Pacient minor`
  - `Programare`
- `TodayCommandCenter`
- `ClinicalAlertsPanel`
- `DocumentTasksPanel`
- `ServiceTracksOverview`
- `AssessmentTasksPanel`
- `ResearchReadinessPanel`
- mutarea financiarului mai jos, în zonă compactă
- păstrarea widget-urilor existente:
  - `AppointmentsToday`
  - `UpcomingAppointments`
  - `UnpaidInvoices`
  - `CompliancePanel`
  - `VaultStatusWidget`
  - `RealtimeDashboard`
- helper-e reziliente noi în `src/lib/dashboard/queries.ts`

### Implementat cu fallback safe

- `ServiceTracksOverview` folosește `clients.service_type` când există și degradează la gol / fallback calm dacă nu există date utile
- `AssessmentTasksPanel` folosește tabela `assessments` existentă, fără scoring complex și fără dependență de `client_assessments`
- `ResearchReadinessPanel` nu face integrare nouă cu Ollama și nu încearcă să implementeze Research Hub

### Rămas pentru fazele următoare

- `TodayCommandCenter` cu note clinice lipsă reale și context de sesiune mai bogat
- alerte DBT / CBT bazate pe tabelele P2 (`dbt_diary_cards`, `safety_plans`, `homework_items`)
- task-uri T0 / T1 / T2 bazate pe `client_assessments`
- research readiness cu coverage real și status local Ollama

---

## 1. Audit stare curentă

### Ce afișează dashboard-ul acum

Structura curentă în [`src/app/dashboard/page.tsx`](../src/app/dashboard/page.tsx):

```
1. Header dinamic — "Azi ai X ședințe, Y dosare incomplete și Z acțiuni de rezolvat."
2. Today Command Center
3. Clinical & Legal Alerts + Documente & Onboarding
4. Service Tracks Overview
5. AppointmentsToday + AssessmentTasksPanel
6. Financiar compact — FinancialSummary + UnpaidInvoices
7. UpcomingAppointments + CompliancePanel
8. VaultStatusWidget + ResearchReadinessPanel
```

### Date deja disponibile în queries.ts

Din [`src/lib/dashboard/queries.ts`](../src/lib/dashboard/queries.ts):

| Date | Sursă | Status |
|---|---|---|
| `totalRevenue`, `expensesMonth`, `netProfitMonth` | `invoices`, `cabinet_expenses` | ✅ |
| `appointmentsToday`, `totalHours` | `appointments` | ✅ |
| `pendingMinorReviews` | `clients.needs_legal_review` | ✅ |
| `privatePatients`, `clinicPatients` | `clients.location` | ✅ |
| `minorPatients`, `adultPatients` | `clients.is_minor` | ✅ |
| `b2bPatients` | `clients.billing_type` | ✅ |
| `vaultAlertsCount`, `vaultTotalDocs` | `therapist_documents` | ✅ |
| `getAppointmentsToday()` — cu client, oră, status, locație | `appointments + clients` | ✅ |
| `getUpcomingAppointments()` — next 10 | `appointments + clients` | ✅ |
| `getUnpaidInvoices()` — max 5 | `invoices + appointments + clients` | ✅ |
| Compliance check | `runServerComplianceCheck()` | ✅ |
| `getDashboardClinicalAlerts()` | `clients + assessments + invoices + vault` | ✅ |
| `getDashboardDocumentTasks()` | `clients + generated_contracts + assessments` | ✅ |
| `getDashboardServiceTrackStats()` | `clients.service_type` | ✅ |
| `getDashboardAssessmentTasks()` | `assessments + clients` | ✅ |
| `getDashboardResearchReadiness()` | `clients + assessments` | ✅ |

### Componente care pot fi păstrate

| Componentă | Rol curent | Destinație v2 |
|---|---|---|
| [`AppointmentsToday`](../src/components/dashboard/appointments-today.tsx) | Ședințe azi cu status | Secțiunea 5 — Programări azi |
| [`UpcomingAppointments`](../src/components/dashboard/upcoming-appointments.tsx) | Viitoarele programări | Secțiunea 5 |
| [`UnpaidInvoices`](../src/components/dashboard/unpaid-invoices.tsx) | Facturi neîncasate | Secțiunea 8 — Financiar compact |
| [`CompliancePanel`](../src/components/compliance/CompliancePanel.tsx) | Audit GDPR/legal | Secțiunea 3 sau separat |
| [`FinancialSummary`](../src/components/dashboard/financial-summary.tsx) | Gross/expenses/net | Secțiunea 8 — Financiar compact |
| [`VaultStatusWidget`](../src/components/dashboard/vault-status-widget.tsx) | Docs vault | Secțiunea 8 sau eliminat din prima linie |
| [`StatCard`](../src/components/dashboard/stat-card.tsx) | KPI cards | Reutilizat în secțiunile noi |
| [`RealtimeDashboard`](../src/components/dashboard/realtime-dashboard.tsx) | Subscripție Supabase realtime | Păstrat, montat în layout |

### Ce încă lipsește după update-ul actual

| Lipsă | De ce e necesar |
|---|---|
| Note clinice lipsă reale în `TodayCommandCenter` | Terapeutul nu vede încă gap-ul post-sesiune |
| Alerte DBT / CBT pe tabele dedicate | Contextul clinic avansat lipsește fără P2 |
| Tasks legate de T0/T1/T2 pe `client_assessments` | Catalogul de teste nu alimentează încă dashboard-ul |
| Research readiness real pentru export / doctorat | Momentan este doar readiness discret |
| Ollama status în dashboard | AI local nu trebuie încă dominant, dar poate apărea mai târziu |

### Problemele principale ale dashboard-ului v1

1. **Financial-first**: primele 4 carduri sunt Profit Net, Încasări, Ore, Ședințe — terapeutul vede profit înainte de ședințe
2. **Fără context clinic**: nu se vede service type, note lipsă, riscuri, diary card, safety plan
3. **Alert minori izolat**: un singur tip de alertă, restul sunt pierdute în CompliancePanel
4. **Financiarul ocupă 2/3 din a doua secțiune** înainte de orice altceva clinic
5. **Patient analytics cu locație/B2B/demografic** nu spune nimic util dimineața
6. **CompliancePanel** e bun dar e comprimat și pus la final

### Probleme rezolvate în implementarea actuală

1. dashboard-ul nu mai începe cu profit / încasări
2. prima zonă operațională după header este `TodayCommandCenter`
3. există panou separat pentru `Clinical & Legal Alerts`
4. există panou separat pentru `Documente & Onboarding`
5. există `ServiceTracksOverview` cu fallback sigur
6. există `AssessmentTasksPanel` cu fallback sigur
7. financiarul este prezent, dar mai jos și mai calm

---

## 2. Noua direcție — Clinical Command Center

Dashboard-ul trebuie să răspundă la 5 întrebări:

```
1. Ce am de făcut azi?
2. Ce e urgent / sensibil / risc?
3. Ce clienți sunt blocați în flow?
4. Ce documente, teste, rapoarte lipsesc?
5. Cum stă cabinetul financiar — compact, nu dominant?
```

**Principiu director:** terapeutul deschide dashboard-ul dimineața și vede clar cine vine, ce e riscant, ce lipsește, ce e de făcut — nu contabilitate.

---

## 3. Structura propusă

```
/dashboard

1. Header dinamic
2. Today Command Center
3. Atenție clinică & legală
4. Service Tracks Overview
5. Programări azi
6. Documente, contracte și onboarding
7. Teste, evaluări și rapoarte
8. Financiar compact
9. Research / AI readiness
```

---

## 4. Detalii per secțiune

---

### 4.1 Header dinamic

**Scop:** context imediat — nu generic.

**Actual:**
```
Bună ziua, [Terapeut]
Panoul tău operațional pentru activitatea clinică, administrativă și juridică.
```

**Propus:**
```
Bună ziua, Ioana
Azi ai 6 ședințe, 2 dosare incomplete și 1 raport în lucru.
[+ Client nou]  [+ Programare]  [+ Pacient minor]
```

**Date necesare:**
- `appointmentsToday` — există în `getDashboardStats()`
- `incompleteFiles` — clienți fără onboarding complet sau contract → query nou sau din `getDashboardDocumentTasks()`
- `reportsInProgress` — rapoarte psihologice in lucru → query nou sau din `getDashboardAssessmentTasks()`

**UI recomandat:**
- `eyebrow` = ziua și data (existent)
- `title` = "Bună ziua, [terapeut]"
- `description` = frază dinamică generată din date reale
- `action` = 3 butoane CTA vizibile (nu ascunse în QuickActions)

**CTA-uri:**
```
[+ Client nou]         → /dashboard/clients/new
[+ Programare]         → /dashboard/appointments/new
[+ Pacient minor]      → /dashboard/clients/new-minor
```

**Prioritate:** P0

---

### 4.2 Today Command Center

**Scop:** prima zonă sub header — inima dashboard-ului operațional.

**UI recomandat:**

```
┌──────────────────────────────────────────────────┐
│  Azi — 6 ședințe                                  │
│  4 confirmate · 1 online · 1 lipsă notă clinică   │
│                                                    │
│  Următoarea: 14:00 — Maria I. (CBT · Cabinet)     │
│  [Deschide sesiunea]  [Adaugă notă]               │
└──────────────────────────────────────────────────┘
```

**4 carduri rapide:**

| Card | Valoare | CTA |
|---|---|---|
| Ședințe azi | N programate | `/dashboard/appointments` |
| Note lipsă | N ședințe finalizate fără notă | `/dashboard/notes` |
| Contracte lipsă | N clienți activi fără contract | `/dashboard/clients?filter=no-contract` |
| Rapoarte de finalizat | N rapoarte în lucru sau overdue | `/dashboard/assessments` |

**Date necesare:**

```typescript
interface TodayCommandData {
  appointmentsToday: number;
  confirmedToday: number;
  onlineToday: number;
  missingNotesCount: number;     // ședințe FINALIZAT fără session_notes
  nextAppointment: {
    startsAt: Date;
    clientName: string;
    serviceType: string | null;
    location: string;
    id: string;
  } | null;
  missingContractsCount: number; // clienți activi fără contract_url
  reportsInProgressCount: number;
}
```

**Query nou:** `getTodayCommandData()` în `queries.ts`

```sql
-- missing notes: appointments FINALIZAT azi fără session_note
SELECT count(*) FROM appointments a
LEFT JOIN session_notes sn ON sn.appointment_id = a.id
WHERE a.status = 'FINALIZAT'
  AND DATE(a.appointment_date) = CURRENT_DATE
  AND sn.id IS NULL

-- missing contracts: clienți activi fără contract_url
SELECT count(*) FROM clients
WHERE lifecycle_status NOT IN ('INACTIV', 'ARHIVAT', 'ANONIM')
  AND (contract_url IS NULL OR contract_url = '')
  AND is_anonymized = false
```

**Prioritate:** P0

---

### 4.3 Atenție clinică & legală

**Scop:** toate semnalele care pot produce probleme clinice, legale sau administrative — centralizate și actionabile.

**UI recomandat:**

```
┌─────────────────────────────────────────────────┐
│  ⚠ Atenție necesară                             │
│                                                  │
│  🔴 1 client DBT fără plan de siguranță  [Deschide fișa] │
│  🟡 3 clienți fără GDPR semnat           [Trimite link]  │
│  🟡 2 dosare de minor — verificare juridică [Vezi]       │
│  🟡 4 contracte neemise                  [Generează]     │
│  🔵 1 raport psihologic nefinalizat (12 zile) [Continuă] │
│  🔵 2 diary card-uri DBT lipsă                  [Adaugă] │
└─────────────────────────────────────────────────┘
```

**Tipuri de alerte:**

| Severitate | Tip alertă | Sursă |
|---|---|---|
| 🔴 CRITIC | DBT client cu risc ridicat fără safety plan | `clients.risk_level = HIGH` + `safety_plans IS NULL` |
| 🔴 CRITIC | Minor cu custodie legală nerezolvată | `clients.needs_legal_review = true` |
| 🟡 ATENȚIE | Clienți fără GDPR semnat | `clients.gdpr_signed_at IS NULL AND lifecycle_status != INACTIV` |
| 🟡 ATENȚIE | Contracte neemise sau draft | `clients.contract_url IS NULL` sau `contract_status = 'DRAFT'` |
| 🟡 ATENȚIE | Onboarding incomplet | `clients.onboarding_completed_at IS NULL` |
| 🟡 ATENȚIE | Clienți fără `service_type` setat | `clients.service_type IS NULL` |
| 🔵 INFO | Raport psihologic în lucru >7 zile | `assessments WHERE type=RAPORT AND status=IN_PROGRESS AND updated >7d` |
| 🔵 INFO | DBT diary card lipsă săptămâna asta | `dbt_diary_cards WHERE week_start = current_week IS NULL` |
| 🔵 INFO | CBT teme restante | `homework_items WHERE due_date < NOW() AND completed_at IS NULL` |
| 🔵 INFO | Note clinice lipsă după ședințe finalizate | `appointments FINALIZAT fără session_note (non-azi)` |

**Fiecare alertă are:**
- icon de severitate
- text descriptiv cu număr
- CTA specific (`[Rezolvă]`, `[Deschide fișa]`, `[Generează contract]`, `[Trimite onboarding]`)

**Date necesare:**

```typescript
interface ClinicalAlert {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  count: number;
  cta: { label: string; href: string };
}

interface DashboardClinicalAlerts {
  alerts: ClinicalAlert[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}
```

**Query nou:** `getDashboardClinicalAlerts()` — agregat, un singur round-trip

**Relație cu CompliancePanel:** CompliancePanel face deja un audit GDPR detaliat per client. `ClinicalAlertsPanel` face un rezumat agregat actionable. Pot coexista — unul pe dashboard, celălalt pe `/dashboard/compliance`.

**Prioritate:** P0 (fără alerte de service_type/diary card) → P1 (complet cu service_type)

---

### 4.4 Service Tracks Overview

**Scop:** terapeutul vede în câteva secunde distribuția reală a muncii clinice.

**UI recomandat — 5 carduri orizontale:**

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Clinică       │ │ CBT          │ │ DBT          │ │ Consiliere   │ │ Nedefinit    │
│ 8 cazuri     │ │ 14 cazuri    │ │ 4 cazuri     │ │ 9 cazuri     │ │ 2 cazuri     │
│ 3 rapoarte   │ │ 5 teme active│ │ 1 risc ridicat│ │ 3 reevaluări │ │ clasificare  │
│ în lucru     │ │              │ │ 2 diary lipsă│ │ necesare     │ │ necesară     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Date necesare per track:**

| Track | Date |
|---|---|
| `CLINICAL_PSYCHOLOGY` | count activi, rapoarte în lucru, feedback-uri de programat |
| `CBT` | count activi, teme active, clienți fără obiective definite, T1 due |
| `DBT` | count activi, clienți cu risc ridicat, diary cards lipsă această săptămână |
| `COUNSELING` | count activi, reevaluări după 3–5 ședințe necesare |
| `UNDECIDED/NULL` | count, necesită clasificare |

**Query nou:** `getDashboardServiceTrackStats()`

```typescript
interface ServiceTrackStat {
  track: "CLINICAL_PSYCHOLOGY" | "CBT" | "DBT" | "COUNSELING" | "UNDECIDED";
  activeCount: number;
  alerts: string[];         // max 2 mesaje scurte
  ctaLabel: string;
  ctaHref: string;
}
```

```sql
SELECT service_type, COUNT(*) as count
FROM clients
WHERE lifecycle_status NOT IN ('INACTIV', 'ARHIVAT', 'ANONIM')
  AND is_anonymized = false
GROUP BY service_type
```

**Blocaje:** necesită `service_type` pe `clients` — coloana există prin migrarea P0 (`20260502110000_service_type_and_clinical_fields.sql`), dar migrarea nu e aplicată în baza reală.

**Prioritate:** P1 (după aplicarea migrărilor P0)

---

### 4.5 Programări azi

**Scop:** lista ședințelor de azi cu context clinic complet per programare.

**Păstrăm:** `AppointmentsToday` existent — dar îl îmbogățim cu date clinice.

**UI recomandat per programare:**

```
┌──────────────────────────────────────────────────────────┐
│ 14:00  Andrei M.           CBT · Cabinet · Confirmat     │
│        Notă anterioară: ✗ lipsă    Contract: ✓ emis      │
│        [Deschide]  [Adaugă notă]  [Fișă client]          │
├──────────────────────────────────────────────────────────┤
│ 16:00  Client DBT          DBT · Online · Confirmat      │
│        Diary card: ✗ lipsă    Risk: 🟡 mediu             │
│        [Deschide]  [Diary Card]  [Plan siguranță]         │
└──────────────────────────────────────────────────────────┘
```

**Date extra față de ce există:**
- `service_type` — din `clients.service_type` (necesită join)
- `has_session_note` — dacă ultima ședință are notă sau nu
- `has_contract` — `clients.contract_url IS NOT NULL`
- `dbt_diary_card_this_week` — `dbt_diary_cards WHERE client_id AND week_start = start_of_week`
- `risk_level` — `clients.risk_level`

**Query extins:** `getAppointmentsToday()` extins cu JOIN pe `clients` pentru `service_type`, `risk_level`, `contract_url`

**Prioritate:** P0 (contract + notă) → P1 (service_type + diary card)

---

### 4.6 Documente, contracte și onboarding

**Scop:** tot ce ține de documentele administrative — vizibil și actionabil.

**UI recomandat:**

```
┌─────────────────────────────────────────────────┐
│ Documente & onboarding                           │
│                                                  │
│ Contracte neemise: 4                            │
│ Onboarding incomplet: 5                         │
│ GDPR lipsă: 3                                   │
│ Minori de verificat: 2                          │
│                                                  │
│ Maria I. — contract lipsă [Generează contract]  │
│ Andrei P. — onboarding minor incomplet [Trimite]│
└─────────────────────────────────────────────────┘
```

**Date necesare:**

```typescript
interface DocumentTask {
  clientId: string;
  clientName: string;
  taskType: "CONTRACT_MISSING" | "ONBOARDING_INCOMPLETE" | "GDPR_MISSING" | "MINOR_REVIEW";
  cta: { label: string; href: string };
}

interface DashboardDocumentTasks {
  missingContracts: number;
  incompleteOnboarding: number;
  missingGdpr: number;
  pendingMinorReviews: number;
  topTasks: DocumentTask[];  // max 5, prioritizate CRITICAL first
}
```

**Query nou:** `getDashboardDocumentTasks()`

```sql
-- missing contracts
SELECT id, full_name FROM clients
WHERE lifecycle_status NOT IN ('INACTIV', 'ARHIVAT', 'ANONIM')
  AND (contract_url IS NULL OR contract_url = '')
  AND is_anonymized = false
LIMIT 5

-- incomplete onboarding
SELECT id, full_name FROM clients
WHERE onboarding_completed_at IS NULL
  AND lifecycle_status NOT IN ('INACTIV')
LIMIT 5

-- missing GDPR
SELECT id, full_name FROM clients
WHERE gdpr_signed_at IS NULL
  AND lifecycle_status NOT IN ('INACTIV', 'ARHIVAT', 'ANONIM')
```

**Prioritate:** P0

---

### 4.7 Teste, evaluări și rapoarte

**Scop:** centralizează tot ce ține de catalogul de teste și rapoarte clinice.

**UI recomandat:**

```
┌─────────────────────────────────────────────────┐
│ Evaluări & rapoarte                              │
│                                                  │
│ Clienți CBT fără scor T0: 5                     │
│ T1 due (4+ ședințe, fără reevaluare): 3          │
│ Diary card DBT lipsă săptămâna asta: 2           │
│ Rapoarte psihologice în lucru: 1                 │
│                                                  │
│ Andrei M. — T1 due (CBT, 6 ședințe) [Evaluează] │
│ Client DBT — diary card lipsă   [Completează]    │
└─────────────────────────────────────────────────┘
```

**Date necesare:**

```typescript
interface AssessmentTask {
  clientId: string;
  clientName: string;
  taskType:
    | "T0_MISSING"
    | "T1_DUE"
    | "T2_DUE"
    | "DIARY_CARD_MISSING"
    | "REPORT_IN_PROGRESS"
    | "REPORT_OVERDUE";
  serviceTrack: string;
  detail: string;
  cta: { label: string; href: string };
}

interface DashboardAssessmentTasks {
  missingT0Count: number;
  t1DueCount: number;
  diaryCardMissingCount: number;
  reportsInProgressCount: number;
  topTasks: AssessmentTask[];
}
```

**Query nou:** `getDashboardAssessmentTasks()`

```sql
-- T0 missing: clienți CBT/Clinică fără nici un assessment
SELECT c.id, c.full_name, c.service_type
FROM clients c
LEFT JOIN client_assessments ca ON ca.client_id = c.id
WHERE c.service_type IN ('CBT', 'CLINICAL_PSYCHOLOGY')
  AND c.lifecycle_status NOT IN ('INACTIV', 'ARHIVAT')
  AND ca.id IS NULL

-- T1 due: clienți cu 4+ ședințe și ultimul assessment > 4 ședințe în urmă
SELECT c.id, c.full_name, COUNT(a.id) as session_count
FROM clients c
JOIN appointments a ON a.client_id = c.id AND a.status = 'FINALIZAT'
LEFT JOIN client_assessments ca ON ca.client_id = c.id
  AND ca.created_at > (NOW() - INTERVAL '60 days')
WHERE ca.id IS NULL
GROUP BY c.id, c.full_name
HAVING COUNT(a.id) >= 4

-- diary card missing this week (DBT)
SELECT c.id, c.full_name
FROM clients c
LEFT JOIN dbt_diary_cards d ON d.client_id = c.id
  AND d.week_start = DATE_TRUNC('week', CURRENT_DATE)
WHERE c.service_type = 'DBT'
  AND c.lifecycle_status = 'ACTIV'
  AND d.id IS NULL
```

**Blocaje:** `client_assessments` și `dbt_diary_cards` necesită migrările P0/P2 aplicate.

**Prioritate:** P2 (după catalog teste și migrări aplicate)

---

### 4.8 Financiar compact

**Scop:** financiarul rămâne vizibil, dar nu dominant. Mutat din prima linie în zona 8.

**UI recomandat:**

```
┌─────────────────────────────────────────┐
│ Financiar lunar                          │
│                                          │
│ Încasări:  4.200 RON                    │
│ Cheltuieli: 850 RON                     │
│ Profit:    3.350 RON                    │
│                                          │
│ Facturi neîncasate: 3 (1.200 RON)       │
│ [Vezi toate] [Adaugă cheltuială]         │
└─────────────────────────────────────────┘
```

**Ce păstrăm:**
- `FinancialSummary` — mutată mai jos
- `UnpaidInvoices` — compact, doar nr. și sumă
- `VaultStatusWidget` — opțional, sau mutat în sidebar

**Ce eliminăm din prima linie:**
- `StatCard` Profit Net (prima poziție)
- `StatCard` Încasări Lună (a doua poziție)
- Patient Analytics cards (Mix locație / Demografic / B2B) — irelevante dimineața

**Prioritate:** P0 — doar reordonare, fără logică nouă

---

### 4.9 Research / AI readiness

**Scop:** pregătire pentru viitoarea funcționalitate de cercetare și AI — subtil, nu dominant.

**UI recomandat:**

```
┌────────────────────────────────────────────────────┐
│ Research & AI                                       │
│                                                     │
│ Clienți cu service type setat:  32 / 40            │
│ Clienți cu scor T0:             18                 │
│ Clienți cu scor T1:              7                 │
│ Cazuri anonimizabile:           12                 │
│                                                     │
│ AI local (Ollama): ● Offline                       │
│ Note eligibile pentru sumarizare: 6                │
└────────────────────────────────────────────────────┘
```

**Date necesare:**

```typescript
interface ResearchReadiness {
  clientsWithServiceType: number;
  totalActiveClients: number;
  clientsWithT0Score: number;
  clientsWithT1Score: number;
  anonymizableCount: number;
  ollamaStatus: "ONLINE" | "OFFLINE" | "UNKNOWN";
  notesEligibleForSummary: number;
}
```

**Query nou:** `getDashboardResearchReadiness()`

**Ollama status:** client-side check via `fetch("http://localhost:11434/api/tags")` cu timeout scurt — dacă răspunde, ONLINE, altfel OFFLINE.

**Prioritate:** P3

---

## 5. Query-uri noi recomandate

Toate în [`src/lib/dashboard/queries.ts`](../src/lib/dashboard/queries.ts):

### `getTodayCommandData()`

```typescript
export async function getTodayCommandData(): Promise<TodayCommandData>
```

- Appointments azi cu count per status
- Next appointment (cel mai apropiat în viitor azi)
- Missing notes count (FINALIZAT azi fără notă)
- Missing contracts count
- Reports in progress

### `getDashboardClinicalAlerts()`

```typescript
export async function getDashboardClinicalAlerts(): Promise<DashboardClinicalAlerts>
```

- DBT high risk fără safety plan (CRITICAL)
- Minori cu legal review (CRITICAL)
- GDPR lipsă (WARNING)
- Contracte lipsă (WARNING)
- Onboarding incomplet (WARNING)
- Clienți fără service_type (INFO)
- Rapoarte overdue (INFO)
- Diary cards lipsă (INFO)
- Teme CBT restante (INFO)

Returnează lista de `ClinicalAlert[]` sortată CRITICAL → WARNING → INFO, max 8.

### `getDashboardServiceTrackStats()`

```typescript
export async function getDashboardServiceTrackStats(): Promise<ServiceTrackStat[]>
```

- Count per service_type
- Alerte specifice per track
- Necesită migrarea P0 aplicată

### `getDashboardDocumentTasks()`

```typescript
export async function getDashboardDocumentTasks(): Promise<DashboardDocumentTasks>
```

- Contracte lipsă
- Onboarding incomplet
- GDPR lipsă
- Minori de verificat
- Top 5 task-uri per prioritate

### `getDashboardAssessmentTasks()`

```typescript
export async function getDashboardAssessmentTasks(): Promise<DashboardAssessmentTasks>
```

- T0 missing per service track
- T1 due (4+ ședințe fără reevaluare)
- Diary cards lipsă (DBT)
- Rapoarte în lucru
- Top 5 task-uri

### `getDashboardResearchReadiness()`

```typescript
export async function getDashboardResearchReadiness(): Promise<ResearchReadiness>
```

- Service type coverage
- Assessment coverage (T0/T1/T2)
- Anonymizable cases

---

## 6. Componente noi recomandate

Toate în [`src/components/dashboard/`](../src/components/dashboard/):

### `TodayCommandCenter.tsx`

```
Props: TodayCommandData
Afișează: card principal azi + 4 mini-carduri (ședințe/note/contracte/rapoarte)
Next appointment cu CTA-uri directe
```

### `ClinicalAlertsPanel.tsx`

```
Props: DashboardClinicalAlerts
Afișează: lista de alerte sortată pe severitate
Fiecare alertă: icon severitate + text + count + CTA buton
Colapsibil dacă > 5 alerte
```

### `ServiceTracksOverview.tsx`

```
Props: ServiceTrackStat[]
Afișează: 5 carduri orizontale (sau scroll pe mobile)
Fiecare card: track name + count + max 2 alerte + CTA
```

### `DocumentTasksPanel.tsx`

```
Props: DashboardDocumentTasks
Afișează: stats aggregate + lista top tasks
Fiecare task: client name + tip + CTA specific (Generează/Trimite/Verifică)
```

### `AssessmentTasksPanel.tsx`

```
Props: DashboardAssessmentTasks
Afișează: stats + top tasks
Specific per track: T0/T1 pentru CBT/Clinică, diary card pentru DBT
```

### `ResearchReadinessPanel.tsx`

```
Props: ResearchReadiness
Afișează: coverage stats + Ollama status
Compact, subtil — nu dominant
```

---

## 7. Layout propus vizual

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
│ "Bună ziua, Ioana — Azi ai 6 ședințe, 2 dosare incomplete."    │
│ [+ Client]   [+ Programare]   [+ Minor]                         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐ ┌──────────────────────────────┐
│  TODAY COMMAND CENTER         │ │  ATENȚIE CLINICĂ & LEGALĂ     │
│  Azi / Urmează / Note / Docs  │ │  CRITICAL → WARNING → INFO    │
│  [grid 4 mini-carduri]        │ │  max 8 alerte actionabile     │
└──────────────────────────────┘ └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  SERVICE TRACKS OVERVIEW  (P1)                                   │
│  Clinică (8) │ CBT (14) │ DBT (4) │ Consiliere (9) │ Nedefinit (2)│
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐ ┌──────────────────────────────┐
│  PROGRAMĂRI AZI               │ │  DOCUMENTE & ONBOARDING       │
│  + service type, note, risc   │ │  contracte / GDPR / minori    │
└──────────────────────────────┘ └──────────────────────────────┘

┌──────────────────────────────┐ ┌──────────────────────────────┐
│  TESTE & RAPOARTE  (P2)       │ │  FINANCIAR COMPACT            │
│  T0/T1, diary, rapoarte       │ │  venit / cheltuieli / facturi │
└──────────────────────────────┘ └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  RESEARCH / AI READINESS  (P3)                                   │
│  T0/T1/T2 coverage · anonimizare · Ollama status                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Ce mutăm mai jos (și de ce)

| Component | Poziție curentă | Poziție v2 | Motivație |
|---|---|---|---|
| `StatCard` Profit Net | Prima linie | Secțiunea 8 | Nu e relevant dimineața |
| `StatCard` Încasări Lună | Prima linie | Secțiunea 8 | Idem |
| `StatCard` Ore Prestate | Prima linie | Eliminat sau în secțiunea 8 | Prea granular |
| `FinancialSummary` | A doua secțiune | Secțiunea 8 | Financiarul nu trebuie să domine |
| `VaultStatusWidget` | Lângă FinancialSummary | Secțiunea 8 sau sidebar | Relevant pentru operații administrative, nu zilnic |
| Patient Analytics (3 carduri) | A treia secțiune | Eliminat din dashboard | Nu e util dimineața — mutat în `/dashboard/review` sau `/dashboard/clients` |
| `CompliancePanel` | La final | Rămâne compact sau mutat în `ClinicalAlertsPanel` | Info relevantă, dar nu ca panou separat la baza paginii |

---

## 9. Ce păstrăm complet

| Component | Justificare |
|---|---|
| `AppointmentsToday` | Core — îmbogățit cu date clinice |
| `UpcomingAppointments` | Util — rămâne sub AppointmentsToday |
| `UnpaidInvoices` | Mutat în secțiunea 8, mai compact |
| `CompliancePanel` | Date utile, posibil integrat în ClinicalAlertsPanel |
| `StatCard` Ședințe Azi | Mutat în TodayCommandCenter |
| `RealtimeDashboard` | Subscripție Supabase — rămâne în layout |

---

## 10. Faze de implementare

### P0 — Reorganizare fără migrări noi

**Status:** implementat ✅

**Obiectiv:** dashboard-ul operațional din prima zi, fără să depindă de migrările neaplicate.

**Ce facem:**
1. Rescris `page.tsx` cu noua ordine de secțiuni
2. Header cu frază dinamică (ședințe azi + note lipsă)
3. Header cu CTA-uri vizibile `[+ Client] [+ Programare] [+ Minor]`
4. `TodayCommandCenter` pe baza `getAppointmentsToday()` existent
5. `ClinicalAlertsPanel` — subset din alerte: GDPR lipsă, contracte lipsă, minori, facturi overdue (toate din date existente)
6. `DocumentTasksPanel` — pe baza `clients.gdpr_signed_at`, `contract_url`, `onboarding_completed_at` (existente)
7. Financiar mutat în secțiunea 8
8. Eliminare Patient Analytics din prima linie

**Dependințe:** zero migrări noi — totul bazat pe coloanele existente

**Componente noi:** `TodayCommandCenter`, `ClinicalAlertsPanel`, `DocumentTasksPanel`, `AssessmentTasksPanel`, `ResearchReadinessPanel`  
**Queries noi:** `getDashboardClinicalAlerts()`, `getDashboardDocumentTasks()`, `getDashboardAssessmentTasks()`, `getDashboardResearchReadiness()`

---

### P1 — Service Tracks + Clinical Context

**Obiectiv:** dashboard-ul reflectă tipul real de muncă al terapeutului.

**Status:** parțial implementat 🟡

**Ce facem:**
1. `ServiceTracksOverview` — implementat cu `clients.service_type` și fallback sigur
2. `ClinicalAlertsPanel` extins cu alerte per service type (diary card DBT lipsă, teme CBT restante, risc ridicat)
3. `AppointmentsToday` extins cu `service_type`, `risk_level` din clients
4. Next best action per service track în fișa clientului

**Dependințe rămase:** date P2 și, unde e cazul, migrarea `20260502110000_service_type_and_clinical_fields.sql` aplicată în toate mediile

**Componente noi:** `ServiceTracksOverview`  
**Queries noi:** `getDashboardServiceTrackStats()`

---

### P2 — Assessment & Report Tasks

**Obiectiv:** catalogul de teste se conectează cu dashboard-ul.

**Status:** parțial implementat 🟡

**Ce facem:**
1. `AssessmentTasksPanel` — implementat momentan pe `assessments` legacy pentru rapoarte și summary-uri lipsă
2. Conexiune cu `client_assessments` și `dbt_diary_cards`

**Dependințe:** migrările P0 și P2 aplicate, catalog teste implementat

**Componente noi:** `AssessmentTasksPanel`  
**Queries noi:** `getDashboardAssessmentTasks()`

---

### P3 — Research / AI Readiness

**Obiectiv:** pregătire pentru research hub și AI local.

**Status:** placeholder implementat 🟡

**Ce facem:**
1. `ResearchReadinessPanel` — implementat cu coverage de bază
2. Ollama status check client-side
3. Export readiness (% clienți anonimizabili)

**Dependințe:** Research Hub implementat, catalog teste cu T0/T1/T2 tracking

**Componente noi:** `ResearchReadinessPanel`  
**Queries noi:** `getDashboardResearchReadiness()`

---

## 11. Observații tehnice

### Graceful degradation

Toate query-urile noi trebuie să aibă fallback similar cu `isP2TableMissing()` din `src/lib/clients/queries.ts`. Dacă o tabelă lipsă sau migrarea nu e aplicată, returnează date goale fără eroare. Terapeutul vede secțiunea cu `0` sau cu un mesaj neutru.

### Server component vs client component

`page.tsx` rămâne Server Component — toate query-urile se fac pe server. Secțiunile cu interactivitate (filtre, expand/collapse) sunt extrase ca Client Components separate.

### Promise.all()

Toate query-urile P0 se execută în `Promise.all()` în `page.tsx` pentru a nu bloca secvențial — similar cu cum se face acum.

### Tipuri noi în `queries.ts`

Tipurile `TodayCommandData`, `DashboardClinicalAlerts`, `DashboardDocumentTasks` se adaugă ca interfaces exportate în `queries.ts` sau într-un fișier nou `src/lib/dashboard/types.ts`.

---

## 12. Concluzie

Dashboard-ul v2 nu înseamnă să arunci ce e acum. Înseamnă să schimbi ordinea priorităților.

**Ordinea actuală:** profit → venituri → ore → ședințe → demographics → programări → compliance  
**Ordinea propusă:** azi → risc/urgențe → service tracks → programări → documente → teste → financiar → research

Terapeutul nu e contabil. Dimineața vrea să știe: **cine vine, ce e urgent, ce lipsește, ce e de făcut**.

Financiarul e important la final de lună, la raportare, la bilanț. Nu dimineața la 9:00.
