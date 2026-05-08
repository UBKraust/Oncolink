# Ce'ai Pățit? — Master UI/UX & Structură Aplicație

Document de referință complet pentru arhitectura UI, fluxurile utilizator, componentele și convențiile de design ale aplicației ERP pentru cabinet de psihoterapie.

---

## 1. Stack Tehnic

| Layer | Tehnologie |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Turbopack) |
| Auth + DB | Supabase (PostgreSQL + Realtime) |
| Styling | Tailwind CSS v4 + tailwindcss-animate |
| Design tokens | OKLCH semantic tokens (`--primary`, `--destructive`, `--muted`, etc.) |
| UI primitivi | Custom (nu shadcn/ui) — Alert Dialog, Sheet, Tabs (radix-ui), Badge, Button |
| Forms | React `useState` + Server Actions |
| PDF | Generare server-side |
| Facturi | SmartBill API |
| AI | Ollama (local) |

---

## 2. Structura de Fișiere (src/)

```
src/
├── app/
│   ├── (public)
│   │   ├── book/                  → Programare publică (pacient)
│   │   ├── onboarding/            → Wizard onboarding pacient (token-based)
│   │   ├── login/                 → Autentificare terapeut
│   │   ├── terms/, privacy/       → Pagini legale statice
│   │   └── legal/declaration/     → Declarație practică
│   └── dashboard/
│       ├── page.tsx               → Dashboard principal
│       ├── appointments/          → Programări
│       ├── assessments/           → Evaluări psihologice
│       ├── billing/               → Financiar lunar
│       ├── calendar/              → Calendar săptămânal
│       ├── cas/                   → Modul CAS
│       ├── clients/               → Management clienți
│       ├── compliance/            → Conformitate & alerte
│       ├── documents/             → Generator documente PDF
│       ├── expenses/              → Cheltuieli cabinet
│       ├── invoices/              → Facturi SmartBill
│       ├── notes/                 → Note clinice
│       ├── review/                → Raport clinic lunar
│       ├── settings/              → Setări cabinet
│       ├── tests/                 → Catalog teste psihologice
│       ├── vault/                 → Seif documente profesionale
│       ├── activity/              → Registru activitate
│       ├── ai/                    → Asistent AI
│       └── layout.tsx             → Shell dashboard (sidebar + topbar)
├── components/
│   ├── app/
│   │   └── page-shell.tsx         → Primitive layout (DashboardPage, PageHeader, SectionCard, MetricCard, ActionCard, EmptyState, SetupBanner, PublicPageShell, PublicDocumentShell)
│   ├── dashboard/                 → Componente specifice dashboard-ului
│   ├── clients/                   → Componente fișă client
│   ├── appointments/              → Componente programări
│   ├── compliance/                → Panouri conformitate
│   ├── notes/                     → Note clinice + vault indicator
│   ├── invoices/, expenses/, billing/ → Financiar
│   ├── assessments/               → Evaluări
│   ├── calendar/                  → Calendar UI
│   ├── settings/                  → Formulare setări
│   └── ui/                        → Primitive UI reutilizabile
└── lib/
    ├── supabase/                  → Client server/client Supabase
    ├── clients/                   → Lifecycle, service-track, validare
    ├── dashboard/queries.ts       → Toate query-urile server pentru dashboard
    ├── compliance/server-engine.ts → Motor conformitate server-side
    ├── appointments/helpers.ts    → Derive location, status
    ├── invoices/status.ts         → Normalizare status facturi
    ├── mock/                      → Date mock (fallback fără Supabase)
    └── utils.ts                   → cn(), helpers
```

---

## 3. Layout Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ TOPBAR (sticky h-16)                                     │
│  [☰ mobile] [Logo Ce'ai Pățit?] [Search] [VaultInd] [👤]│
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │ PAGE CONTENT                                  │
│ w-60     │ DashboardPage (max-w-7xl, space-y-6, pb-24)  │
│ (hidden  │                                               │
│  mobile) │                                               │
└──────────┴──────────────────────────────────────────────┘
```

### Sidebar — Grupuri de navigare

| Grup | Items |
|---|---|
| Activitate zilnică | Dashboard, Programări, Calendar, Note clinice, Clienți |
| Clinic & Documente | Evaluări, Documente, Seif cabinet, Catalog teste |
| Financiar & Admin | Facturi, Cheltuieli, Financiar lunar, Raport clinic lunar, Modul CAS |
| Configurare & Legal | Registru activitate, Conformitate, Asistent AI, Setări |

### Topbar

- Mobile: hamburger → overlay panel cu navigare completă grupată
- Desktop: search bar (navigare rapidă, max 6 rezultate filtrate, submit → navighează la primul match)
- Right: `VaultIndicator` (avertisment documente expirate) + email + logout

---

## 4. Catalog Pagini Dashboard

### `/dashboard` — Dashboard principal

**Layout vertical:**
1. `PageHeader` — dată curentă (română) + greeting + description (ședințe/dosare/acțiuni) + CTAs (Sistem securizat badge, Client nou, Pacient minor, Programare)
2. `TodayCommandCenter` — panou cu 2 tab-uri: **Clinic** (next appointment card + ritm zilei + confirmări) / **Financiar** (restante + de emis + de urmărit)
3. Alertele zilei — `ClinicalAlertsPanel` + `DocumentTasksPanel` (2 coloane lg)
4. `ServiceTracksOverview` — 5 carduri (Psihologie clinică / CBT / DBT / Consiliere / Nedefinit); click → Sheet lateral lazy-loaded
5. 4 `StatCard`-uri — Ședințe Azi / Revizuiri Minori / Mix Pacienți / Locații Active
6. Grid `AppointmentsToday` (2/3) + `AssessmentTasksPanel` (1/3)
7. `DashboardSecondaryTabs` — 3 tab-uri: **Financiar** (FinancialSummary + UnpaidInvoices) / **Programări viitoare** (UpcomingAppointments) / **Cabinet** (VaultStatusWidget + CompliancePanel compact + ResearchReadinessPanel)

**Queries paralele (Promise.all):** stats, appointmentsToday, unpaidInvoices, upcomingAppointments, complianceData, settings, clinicalAlerts, documentTasks, serviceTracks, assessmentTasks, researchReadiness, todayFinance

---

### `/dashboard/clients` — Management clienți

- KPI cards: total pacienți, în onboarding, programați, activi
- Tabel cu filtrare (lifecycle status, service type)
- Fiecare rând: nume, status lifecycle badge, data ultimei ședințe, acțiuni rapide
- Link → fișă individuală

### `/dashboard/clients/[id]` — Fișă client

Secțiuni:
- Header: nume, lifecycle badge, service type badge, risc
- **Pregătire sesiune**: context clinic complet (contract, GDPR, risc, track status, next action)
- Workspace switcher local în stil dashboard:
  - `Sumar`
  - `Clinic`
  - `Programări`
  - `Lifecycle`
  - schimbarea între taburi nu face reload complet de pagină
  - `Clinic` și `Lifecycle` încarcă payload-ul complet doar când utilizatorul intră în acel workspace
- Programări istorice + viitoare
- Note clinice linkate
- Evaluări (assessments + structured assessments)
- Documente pacient
- Teme (homework items)
- DBT: diary cards + plan siguranță
- CBT: formulare de caz
- Cardurile service-specific P2/P3 sunt afișate în interiorul workspace-ului `Clinic`, nu înaintea taburilor
- Acțiuni: editare, anonimizare, onboarding

### `/dashboard/clients/new` și `/dashboard/clients/new-minor`

- Formular creare client adult / minor
- Minor: câmpuri suplimentare (reprezentant legal, acorduri parentale)

### `/dashboard/clients/[id]/onboarding`

- Flux onboarding intern — trimite link sau completează direct
- Statusuri: link trimis, completat, în așteptare

---

### `/dashboard/appointments` — Programări

- Workspace operațional local (`AppointmentsWorkspace`) cu state client-side pentru:
  - `view`: calendar / listă
  - `queue`: all / today / to-confirm / needs-note / needs-invoice / overdue / online
  - `status`: toate statusurile programărilor
  - `session`: drawer deschis din listă sau calendar
- Schimbarea între filtre, queue-uri, taburi și drawer nu face refresh complet de pagină; URL-ul este sincronizat prin `history.replaceState`
- Header operațional cu workflow cards:
  - Confirmări
  - Note lipsă
  - Facturi
  - Întârzieri
- Snapshot-uri pentru:
  - Agenda de azi
  - Documentare
  - Context extern
- Tabel/registru cu coloane: dată+oră, client, locație (PRIVAT/ONLINE/POLICLINICĂ/CLINICĂ), status badge, notă ✓/✗, factură ✓/✗
- În caz de eroare de rețea Supabase, pagina nu mai cade: afișează banner de fallback și încarcă workspace-ul cu listă goală

### `/dashboard/appointments/[id]` — Detaliu programare

- Context clinic complet (service type, risc, contract, note, factură)
- Pagina clasică de detaliu există în continuare, dar fluxul principal este mutat în `SessionDrawer`
- `SessionDrawer` este suprafața principală pentru lucru rapid din `/dashboard/appointments` și `/dashboard/calendar`
- Link spre nota clinică aferentă

### `/dashboard/appointments/new`

- Formular programare nouă: client, dată, durată, locație, link Meet

### `/dashboard/calendar`

- Calendar săptămânal
- Navigare prev/next săptămână
- Slot click → creare programare rapidă

---

### `/dashboard/notes` — Note clinice

- Listă note indexate pe programare
- Metadata: dată, durată, pacient, locație, status (draft/blocat)
- Link → editor notă complet

### `/dashboard/notes/[appointmentId]`

- Editor notă clinică structurată
- Blocare notă după finalizare (WORM)
- Context clinic în sidebar

---

### `/dashboard/assessments` — Evaluări

- Registru evaluări cu: client, tip test, scor, dată
- Include evaluări structurate (client_assessments) și evaluări libere (assessments)
- Filtrare per client

### `/dashboard/assessments/new`

- Selectare client + tip evaluare
- Pre-completare dată, client din query param `?clientId=`

### `/dashboard/tests` — Catalog teste

- 9 instrumente psihologice + 2 formulare interne
- Filtre: tip (self-report, clinician-administered, formular intern), domeniu
- Metadata completă: scop, durată, normare, populații

---

### `/dashboard/compliance` — Conformitate

4 tab-uri (`ComplianceTabs` pattern slots):
1. **Alerte** — `ClinicalAlertsPanel` cu toate alertele (limit 50); badge roșu/galben per severitate
2. **Documente** — `DocumentTasksPanel` toate task-urile (GDPR, onboarding, contract, minor legal)
3. **Evaluări** — `AssessmentTasksPanel` toate task-urile evaluări
4. **Juridic** — `CompliancePanel` per-client + cadru legal static (GDPR, Cod Etică, CNP e-facturare)

Summary bar deasupra tab-urilor: total notificări + badge severitate globală

---

### `/dashboard/documents` — Generator documente

- Generator PDF: consimțăminte, contracte terapeutice, scrisori de trimitere
- Date reale pacient + terapeut injectate în template
- Preview + download

---

### `/dashboard/invoices` — Facturi

- Registru facturi cu status local + SmartBill:
  - `PREGĂTITĂ`
  - `EMISĂ`
  - `PLĂTITĂ`
  - `RESTANTĂ`
  - `ANULATĂ`
- `PREGĂTITĂ` reprezintă coada financiară internă: factura există local, dar nu a fost trimisă încă în SmartBill
- Filtrare per status, inclusiv coada financiară
- Din detaliul unei facturi `PREGĂTITĂ`, financiarul poate declanșa `Trimite în SmartBill`

### `/dashboard/invoices/new`

- Formular factură nouă
- Selectare client + appointment asociat
- Pentru fluxul manual, factura poate merge direct către SmartBill
- Pentru fluxul lunar, facturile sunt generate mai întâi local din `/dashboard/billing` și trimise ulterior din registrul de facturi

### `/dashboard/invoices/[id]`

- Detaliu factură + acțiuni:
  - `Trimite în SmartBill` pentru facturi `PREGĂTITĂ`
  - `Marchează plătită`
  - `Anulează`

---

### `/dashboard/expenses` — Cheltuieli

- Introducere cheltuieli deductibile
- Filtrare an/lună
- Categorii: chirie, utilități, formare profesională, etc.

### `/dashboard/billing` — Financiar lunar

- Client component cu calcul lunar explicit
- Sursa de adevăr server-side este `buildMonthlyBillingSummary`
- Metrici:
  - ședințe finalizate
  - ore calculate
  - total de încasat
  - încasat
  - restant
- Secțiune `Închidere lunară`:
  - `Calculează`
  - `Trimite la financiar`
  - `Exportă raportul lunii`
  - link `Vezi coada financiară`
- `Trimite la financiar` creează facturi locale `PREGĂTITĂ` pentru ședințele finalizate fără factură
- Exportul lunar CSV folosește exact același calcul lunar ca UI-ul și include:
  - sumar calculat
  - detaliu pe clienți
  - detaliu pe ședințe finalizate

### `/dashboard/review` — Raport clinic lunar

- Generare raport complet lună curentă
- Asamblare date: programări, evaluări, note, financiar

---

### `/dashboard/vault` — Seif cabinet

- Documente profesionale terapeut (certificări, asigurare, autorizații)
- Alertă automată pentru documente care expiră în 30 zile
- `VaultIndicator` în topbar când există alerte

### `/dashboard/activity` — Registru activitate

- Log cronologic toate programările cu durată și client
- Filtrare dată
- Export

### `/dashboard/cas` — Modul CAS

- Sesiuni structurate conform cerințelor CAS
- UI dedicat pentru conformitate

### `/dashboard/settings` — Setări cabinet

- Profil terapeut: nume, CIF, cod CPR, IBAN
- Program de lucru săptămânal (zile + ore + pauze)
- Integrări externe: Supabase (config), SmartBill (chei API)
- Import date

### `/dashboard/ai` — Asistent AI

- Chat cu Ollama (local, confidențial)
- Quick prompts: notă de sesiune, interpretare scor, criterii diagnostic, scrisoare trimitere

---

## 5. Fluxuri Publice (pacient)

### `/onboarding` — Wizard onboarding pacient

```
Token URL → Verificare token valid → Formular intake
  → Date personale → Motive consultație → Istoric
  → Consimțăminte (GDPR + termeni) → Confirmare
```
- Triggerat de link trimis din dashboard
- Token unic per client, expirant

### `/book` — Programare publică

```
Selecție terapeut → Calendar disponibilitate → Confirmare
  → Date contact → Confirmare email
```

### `/onboarding/minor`

- Formular specific minor: + reprezentant legal, acorduri parentale

---

## 6. Design System

### Primitive Layout (`page-shell.tsx`)

| Componentă | Scop |
|---|---|
| `DashboardPage` | Wrapper max-w-7xl, space-y-6 |
| `PageHeader` | eyebrow + title + description + action slot |
| `SectionCard` | Card cu header (icon + title + description) + body |
| `MetricCard` | Card metric cu icon + label + value + trend |
| `ActionCard` | Card navigabil cu Link, icon, badge, footer, trailing ChevronRight |
| `EmptyState` | State gol cu icon + title + description + CTA opțional |
| `SetupBanner` | Banner avertizare setup incomplet (semantic colors) |
| `PublicPageShell` | Wrapper pagini publice cu gradient bg |
| `PublicDocumentShell` | Shell document public cu header accent + back button |

### Culori semantice (nu hardcodate)

| Token | Utilizare |
|---|---|
| `text-foreground` | Text primar |
| `text-muted-foreground` | Text secundar, labels |
| `bg-muted` / `bg-muted/30` | Fundal subtil |
| `border-border/60` | Borduri carduri |
| `text-primary` / `bg-primary/10` | Accent principal |
| `text-destructive` | Erori, alerte critice |
| `bg-card` | Suprafață card |

**Regulă:** Nu se folosesc culori hardcodate (`rose-*`, `emerald-*`, `amber-*`, `sky-*`) în componentele structurale. Excepție permisă: badge-uri semantice definite în `badge.tsx` (`success`, `warning`, `info`).

### Badge Variants

`default` · `secondary` · `destructive` · `outline` · `success` (emerald) · `warning` (amber) · `info` (sky)

### Geometrie

- Carduri mari: `rounded-[2rem]` sau `rounded-[1.75rem]`
- Carduri mici / elemente inline: `rounded-2xl` sau `rounded-xl`
- Sidebar logo: `rounded-lg`
- Badge-uri: `rounded-full`

### Tipografie

- Titluri: `font-black tracking-tight`
- Labels uppercase: `font-semibold uppercase tracking-wider text-[10px]`
- Body: `text-sm` sau `text-base`
- Valori numerice mari: `text-2xl font-black tabular-nums`

---

## 7. Componente Dashboard

| Componentă | Tip | Scop |
|---|---|---|
| `DashboardSidebar` | Client | Navigare lateral desktop |
| `DashboardTopbar` | Client | Header sticky cu search + mobile nav + user |
| `TodayCommandCenter` | Client | Panou zilei: tab Clinic / tab Financiar |
| `AppointmentsToday` | Server | Lista programărilor de azi cu context clinic |
| `AppointmentRow` | Server | Rând programare cu indicatori (notă, factură, risc, DBT diary) |
| `ClinicalAlertsPanel` | Server | Alerte clinice sortate după severitate |
| `DocumentTasksPanel` | Server | Task-uri documente (GDPR, onboarding, contract) |
| `AssessmentTasksPanel` | Server | Task-uri evaluări (rapoarte, diary card, scor lipsă) |
| `ServiceTracksOverview` | **Client** | 5 carduri track → deschide `ServiceTrackSheet` |
| `ServiceTrackSheet` | Client | Sheet lateral cu clienți din track, lazy fetch |
| `DashboardSecondaryTabs` | Client | Tabs: Financiar / Programări viitoare / Cabinet |
| `FinancialSummary` | Server | Venit brut / cheltuieli / profit cu link raport |
| `UnpaidInvoices` | Server | Facturi neachitate (max 5) |
| `UpcomingAppointments` | Server | Programări viitoare (max 10) |
| `VaultStatusWidget` | Server | Status seif + număr alerte expirare |
| `CompliancePanel` | Client | Conformitate per-client (compact sau full) |
| `ResearchReadinessPanel` | Server | Pregătire date pentru cercetare |
| `StatCard` | Server | Card metrică simplă cu tone (default/warning) |
| `VaultIndicator` | Client | Indicator topbar pentru documente care expiră |
| `RealtimeDashboard` | Client | Listener Supabase Realtime pentru refresh |

---

## 8. Primitive UI (`src/components/ui/`)

| Fișier | Export-uri principale |
|---|---|
| `alert-dialog.tsx` | AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel |
| `badge.tsx` | Badge (variants: default, secondary, destructive, outline, success, warning, info) |
| `button.tsx` | Button (variants: default, outline, ghost, destructive; sizes: default, sm, lg, icon) |
| `card.tsx` | Card, CardHeader, CardContent, CardFooter |
| `checkbox.tsx` | Checkbox |
| `input.tsx` | Input |
| `label.tsx` | Label |
| `progress.tsx` | Progress |
| `radio-group.tsx` | RadioGroup, RadioGroupItem |
| `select.tsx` | Select (nativ HTML, nu Radix) |
| `separator.tsx` | Separator |
| `sheet.tsx` | Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose |
| `table.tsx` | Table, TableHeader, TableBody, TableRow, TableHead, TableCell |
| `tabs.tsx` | Tabs, TabsList, TabsTrigger, TabsContent (via radix-ui) |
| `textarea.tsx` | Textarea |
| `toast.tsx` | Toast system |
| `interactive-state.ts` | navItemBase, navItemActive, navItemIdle (clase Tailwind reutilizabile pentru nav links) |
| `use-overlay-a11y.ts` | Hook a11y pentru overlay-uri (focus trap, Escape, scroll lock, focus restore) |

---

## 9. Patternuri Arhitecturale

### Server Components + Client Slots (Tabs)

Problemă: tab-urile sunt client components (useState), dar conținutul lor e server-rendered.

Soluție: server page pre-randează componentele server și le pasează ca `ReactNode` props la client component.

```tsx
// page.tsx (server)
<ComplianceTabs
  alertsTab={<ClinicalAlertsPanel alerts={alerts} />}
  documentsTab={<DocumentTasksPanel tasks={tasks} />}
/>

// ComplianceTabs.tsx (client)
export function ComplianceTabs({ alertsTab, documentsTab }) {
  return <Tabs><TabsContent>{alertsTab}</TabsContent>...</Tabs>
}
```

Folosit în: `ComplianceTabs` (compliance), `DashboardSecondaryTabs` (dashboard)

### Sheet Overlay cu Lazy Fetch

Pattern pentru date care se încarcă doar la click (evită overhead pe page load).

```tsx
// Client component cu state
const [selectedTrack, setSelectedTrack] = useState(null);

// La click pe card → setSelectedTrack(track)
// ServiceTrackSheet face useEffect pe track → server action

// Server action
"use server";
export async function getTrackClients(serviceType) { ... }
```

Folosit în: `ServiceTracksOverview` → `ServiceTrackSheet`

### Query Limit Pattern

Funcțiile de query primesc `limit = 5` (default pentru dashboard) sau `limit = 50` (pentru pagini dedicate).

```ts
export async function getDashboardClinicalAlerts(limit = 5) { ... }
// Dashboard: getDashboardClinicalAlerts()        → max 5
// Compliance: getDashboardClinicalAlerts(50)     → max 50
```

### Server Actions pentru Mutații

Toate mutațiile folosesc `"use server"` actions. Nu există API routes pentru operații CRUD.

```ts
// settings-actions.ts
"use server";
export async function saveTherapistSettings(data) { ... }
```

### Lifecycle Status Machine

Clienții au un `lifecycle_status` calculat automat dar suprascribil manual:

```
LEAD → ONBOARDING → PROGRAMAT → ACTIV → INACTIV → INCHEIAT
                                                  → NECONVERSIE
                                                  → ANONIMIZAT
```

Statusurile INCHEIAT / NECONVERSIE / ANONIMIZAT sunt filtrate din toate query-urile operaționale.

### Service Track System

Fiecare client are un `service_type` (CLINICAL_PSYCHOLOGY / CBT / DBT / COUNSELING / MIXED / UNDECIDED) și un `service_track_status` (etapa curentă în fluxul clinic specific).

`computeServiceTrackNextAction()` calculează acțiunea recomandată bazată pe: service type, lifecycle, track status, risc, GDPR, onboarding.

---

## 10. Fluxuri UI Principale

### Flux Client Nou (adult)

```
Dashboard → "Client nou" CTA
  → /dashboard/clients/new (formular)
    → Salvare → /dashboard/clients/[id] (fișă)
      → "Trimite onboarding" → Email cu link /onboarding/[token]
        → Pacient completează → Status onboarding_completed_at setat
```

### Flux Client Minor

```
Dashboard → "Pacient minor" CTA
  → /dashboard/clients/new-minor (formular + câmpuri reprezentant legal)
    → Salvare → /dashboard/clients/[id]
      → "Onboarding minor" → /onboarding/minor (URL cu token)
        → Acorduri parentale + reprezentant legal completate
```

### Flux Ședință Zilnică

```
Dashboard → TodayCommandCenter (tab Clinic) → next appointment
  → AppointmentsToday → click rând → /dashboard/appointments/[id]
    → Finalizare ședință → status FINALIZAT
      → Adaugă notă → /dashboard/notes/[appointmentId]
        → Emite factură → /dashboard/invoices/new?appointmentId=
```

### Flux Conformitate

```
Dashboard → ClinicalAlertsPanel / DocumentTasksPanel
  → "Vezi toate" → /dashboard/compliance
    → Tab Alerte → fix alert → link la fișă client
    → Tab Documente → task item → link la client/edit
    → Tab Evaluări → task evaluare → link la /assessments/new
    → Tab Juridic → overview legal framework
```

### Flux Track Clinic (ServiceTracksOverview)

```
Dashboard → ServiceTracksOverview → click card [CBT]
  → ServiceTrackSheet (slide-in)
    → Lista clienți CBT activi cu indicatori
      → Click client → /dashboard/clients/[id]
    → "Toți clienții CBT" → /dashboard/clients?service=CBT
    → "Client nou" → /dashboard/clients/new
```

### Flux Evaluare

```
/dashboard/assessments → "Evaluare nouă"
  → /dashboard/assessments/new?clientId=[id]
    → Selectare test din catalog → Completare → Salvare scor
      → Apare în AssessmentTasksPanel dacă scor lipsă
      → Apare în fișa clientului
```

### Flux Factură

```
/dashboard/invoices/new
  → Selectare client + programare asociată
    → Generare SmartBill → status EMISĂ
      → Client plătește → marchează PLĂTITĂ
        → Dispare din UnpaidInvoices
```

---

## 11. Alerte & Notificări Sistem

### ClinicalAlerts (severitate: critical > warning > info)

| Alert ID | Trigger | Severitate |
|---|---|---|
| `minor-legal-review` | is_minor + needs_legal_review | critical |
| `gdpr-missing` | !gdpr_consent_signed | critical (≥3) / warning |
| `dbt-risk-without-safety-plan` | DBT + HIGH/CRISIS + fără safety plan | critical |
| `onboarding-incomplete` | !onboarding_completed_at | warning |
| `dbt-diary-missing` | DBT activ + fără diary card săptămâna asta | warning |
| `report-pending` | RAPORT_LUNAR + !sent_to_parent_at | warning |
| `overdue-invoices` | facturi neachitate >21 zile | warning (≥3) / info |
| `service-type-missing` | service_type = UNDECIDED | info |
| `cbt-homework-overdue` | homework expirat + !completed_at | info |
| `vault-alerts` | documente expirante în 30 zile | info |

### DocumentTasks (prioritate: high > medium > low)

| Task type | Trigger | Prioritate |
|---|---|---|
| GDPR | !gdpr_consent_signed | high |
| ONBOARDING | !onboarding_completed_at | high |
| MINOR_LEGAL | is_minor + needs_legal_review | high |
| CONTRACT | !contract_url + !terms_consent_signed_at + !generated_contract | medium |
| REPORT | send_report_to_parent + raport nesendat | medium |

---

## 12. Convenții de Cod

### Reguli ferme

- **Nu se folosesc culori hardcodate** în componente structurale. Excepție: badge-uri definite în `badge.tsx`.
- **Nu se folosesc `alert()` / `confirm()`** — se folosește `AlertDialog`.
- **`select` nativ HTML** — nu Radix/shadcn Select.
- **Diacritice corecte în română**: `ș` `ț` `ă` `î` `â` (nu `ş` `ţ`).
- **Apostrofuri HTML**: `Ce&apos;ai` nu `Ce'ai` sau `Ce\`ai`.
- **Comentarii în cod** — doar dacă WHY nu e evident. Nu se comentează WHAT.
- **Server Actions** pentru toate mutațiile — nu API routes.
- **`"use client"`** — doar dacă componenta folosește hooks sau event handlers. Nu se adaugă preventiv.

### Nomenclatură fișiere

- Componente: `PascalCase.tsx`
- Utilitare / queries: `kebab-case.ts`
- Server actions: `*-actions.ts` cu `"use server"` la primul rând

### Structura unui SectionCard

```tsx
<SectionCard title="Titlu" description="Opțional" icon={IconComponent}>
  {/* conținut — nu mai trebuie card wrapper interior */}
</SectionCard>
```

---

## 13. Baza de Date — Tabele Principale

| Tabel | Scop |
|---|---|
| `clients` | Fișe clienți cu lifecycle_status, service_type, risc, GDPR, onboarding |
| `appointments` | Programări cu status, locație, durată, meet_link |
| `invoices` | Facturi cu status, amount, SmartBill data |
| `cabinet_expenses` | Cheltuieli deductibile |
| `assessments` | Evaluări libere (tip, scoring_data, sent_to_parent_at) |
| `client_assessments` | Evaluări structurate (test ID, calculated_score) |
| `psychological_tests` | Catalog teste (metadata completă) |
| `patient_documents` | Documente uploadate per client |
| `generated_contracts` | Contracte generate din template |
| `therapist_documents` | Documente seif (cu expiry_date) |
| `clinical_notes` | Note clinice (draft/blocat, WORM) |
| `homework_items` | Teme CBT (due_date, completed_at) |
| `dbt_diary_cards` | Diary cards DBT (week_start) |
| `safety_plans` | Planuri siguranță DBT (crisis plan) |
| `therapist_settings` | Setări cabinet (1 rând per terapeut) |

---

## 14. Migrări DB Aplicate

| Fișier | Status |
|---|---|
| `20260429223610_client_lifecycle_status.sql` | ✅ aplicat |
| `20260502110000_service_type_and_clinical_fields.sql` | ✅ aplicat |
| `20260502120000_p2_clinical_tools.sql` | ✅ aplicat |
| `20260503091500_dashboard_ui_hardening.sql` | ✅ aplicat |

---

## 15. Status Feature Matrix

| Feature | Status | Note |
|---|---|---|
| Auth (Supabase) | ✅ complet | |
| Dashboard principal | ✅ complet | |
| Fișă client | ✅ complet | |
| Onboarding public | ✅ complet | |
| Programări | ✅ complet | |
| Calendar | ✅ complet | |
| Note clinice | ✅ complet | WORM blocare |
| Evaluări + Catalog teste | ✅ complet | 9 instrumente + 2 formulare |
| Facturi (SmartBill) | ✅ complet | |
| Cheltuieli | ✅ complet | |
| Billing lunar | ✅ complet | |
| Compliance center | ✅ complet | 4 tab-uri unificat |
| Documente (generator PDF) | ✅ complet | |
| Seif cabinet | ✅ complet | alertă expirare 30 zile |
| Registru activitate | ✅ complet | |
| Modul CAS | ✅ complet | |
| Asistent AI | ✅ complet | Ollama local |
| ServiceTrack sheet overlay | ✅ complet | lazy fetch per track |
| Programare publică | ✅ complet | |
| Raport lunar | ✅ complet | |
| AI prompts contextuale | 🔲 P3 | per track, per client |
| Generare rapoarte per track | 🔲 P3 | export PDF structurat |
| Overlay contract | 🔲 P3 | rafinare flow semnătură |
