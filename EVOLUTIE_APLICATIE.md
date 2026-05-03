# Evolutie Aplicatie

Acest fisier este jurnalul unic pentru evolutia aplicatiei, auditul functional, auditul UI/UX, accesibilitate, stabilizare tehnica si orice lot nou de lucru relevant.

## Regula de lucru

Dupa fiecare task finalizat:

1. Actualizam acest fisier.
2. Adaugam ce s-a facut concret.
3. Notam ce urmeaza imediat dupa acel task.
4. Marcam pe scurt daca `lint` si `build` sunt verzi sau daca exista blocaje.

Aceasta regula ramane activa pe tot parcursul proiectului.

## Status Curent

- `npm run lint`: ✅ verde
- `npm run build`: ✅ verde
- Migrarea lifecycle (`20260429223610_client_lifecycle_status.sql`) — ✅ aplicată în baza reală
- Migrarea P0 service/service-track (`20260502110000_service_type_and_clinical_fields.sql`) — ✅ aplicată în baza reală
- Migrarea P2 (`20260502120000_p2_clinical_tools.sql`) — ✅ aplicată în baza reală
- Hardening dashboard / appointments UI (`20260503091500_dashboard_ui_hardening.sql`) — ✅ aplicată în baza reală
- **P1 complet** (task-uri #17–21) · **P2 complet** (task-uri #22–25) — UI și DB aliniate
- **Catalog teste complet** (task #26) — 9 instrumente + 2 formulare interne, metadata completă, pagină cu filtre
- **Dashboard & Compliance reorganizate** (task-uri #28–29) — centru unificat notificări + tabs pe compliance + tabs în dashboard secțiunea secundară
- **Audit & fix nav + dashboard shell** (task #30) — labels redenumite, AI mutat, sidebar footer eliminat, SetupBanner semantic, ActionCard trailing icon corectat
- **ServiceTracksOverview — card sheet overlay** (task #31) — click pe card deschide Sheet lateral cu clienți activi, status, indicatori lipsă, lazy fetch
- **Fluid UI — tranziții și loading states** (task #32) — NavigationProgress bar, PageTransition, loading.tsx skeletons (dashboard + clienți), animații mobile menu/search/toast
- **DocumentChecklistCard + Sheet** (task #33) — checklist documente per client/track, overlay lazily fetched, integrat în ServiceTrackSheet cu buton docs pe fiecare ClientRow
- **Pagina documente extinsă** (task #34) — 5 carduri info (STANDARD/MINOR/B2B/CAS/GDPR), selector tip contract inline în DocumentList, `defaultClientId` highlight+scroll, `loading.tsx` skeleton
- Urmează: **P3 — Fișe Clinice Editabile + Editor Rapoarte** (task #35) — migrare DB `clinical_forms` + `therapy_reports`, fișe noi per track, editor raport psihologic, pagina `/dashboard/forms`

## Ce s-a facut

### 35. P3 — Fișe Clinice Editabile + Editor Rapoarte _(PLANIFICAT)_

**Obiectiv:** Terapeutul să poată completa și edita in-app toate documentele clinice pentru fiecare tip de serviciu — nu doar să le genereze ca PDF.

---

#### A. Migrare DB — `clinical_forms` + `therapy_reports`

**`clinical_forms`** — tabelă generică pentru toate fișele structurate per client:
```sql
CREATE TABLE public.clinical_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES auth.users(id),
  form_type   text NOT NULL,  -- 'ANAMNESIS' | 'CLINICAL_INTERVIEW' | 'RISK_ASSESSMENT'
                               -- 'DBT_COMMITMENT' | 'COUNSELING_PLAN' | 'RECOMMENDATIONS'
                               -- 'CBT_PROGRESS' | 'COUNSELING_PROGRESS'
  title       text,
  content     jsonb NOT NULL DEFAULT '{}',
  status      text NOT NULL DEFAULT 'DRAFT',  -- 'DRAFT' | 'COMPLETE'
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
-- RLS: therapist_id = auth.uid()
-- Index: (client_id, form_type), (therapist_id, created_at DESC)
```

**`therapy_reports`** — rapoarte psihologice formale (export PDF):
```sql
CREATE TABLE public.therapy_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  therapist_id  uuid NOT NULL REFERENCES auth.users(id),
  report_type   text NOT NULL,  -- 'ADULT' | 'MINOR' | 'B2B_WELLBEING'
  report_number text,
  title         text,
  content       jsonb NOT NULL DEFAULT '{}',  -- secțiunile raportului
  status        text NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'FINAL'
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

---

#### B. Fișe noi per track (componente în `ClientDashboardUI`)

Pattern: același contract vizual ca `SafetyPlanCard` / `CbtCaseFormulationCard` — view mode + edit mode inline, salvare via Server Action, `useTransition` + toast + `router.refresh()`.

**CLINICAL_PSYCHOLOGY**
- **`AnamnesisCard`** (`src/components/clients/AnamnesisCard.tsx`)
  - Câmpuri: motiv prezentare, istoricul problemei, antecedente personale, antecedente familiale, istoricul medical, status mental (observații), alte observații
  - `form_type: 'ANAMNESIS'`
- **`ClinicalInterviewCard`** (`src/components/clients/ClinicalInterviewCard.tsx`)
  - Câmpuri: simptome actuale, funcționare curentă (muncă/relații/cotidian), factori precipitanți, resurse și puncte forte, obiective client
  - `form_type: 'CLINICAL_INTERVIEW'`

**DBT** (+ CLINICAL_PSYCHOLOGY când risk_level HIGH/CRISIS)
- **`RiskAssessmentCard`** (`src/components/clients/RiskAssessmentCard.tsx`)
  - Câmpuri: nivel risc (leagă `risk_level` existent), ideație suicidară (da/nu + detalii), tentative anterioare, factori de risc, factori protectivi, plan management risc
  - `form_type: 'RISK_ASSESSMENT'`
- **`DbtCommitmentCard`** (`src/components/clients/DbtCommitmentCard.tsx`)
  - Câmpuri: angajamente client (lista), obiective terapeutice DBT, comportamente țintă principale, acordul client
  - `form_type: 'DBT_COMMITMENT'`

**COUNSELING**
- **`CounselingPlanCard`** (`src/components/clients/CounselingPlanCard.tsx`)
  - Câmpuri: obiectivul principal, abordarea terapeutică, durata estimată (nr. ședințe), indicatori de progres
  - `form_type: 'COUNSELING_PLAN'`
- **`RecommendationsCard`** (`src/components/clients/RecommendationsCard.tsx`)
  - Câmpuri: recomandări principale (lista), resurse recomandate, plan de urmărire, observații
  - `form_type: 'RECOMMENDATIONS'`

**CBT** (upgrade din array simplu)
- **`TreatmentGoalsCard`** (`src/components/clients/TreatmentGoalsCard.tsx`) — înlocuiește editorul inline din `ClinicalContextCard`
  - Câmpuri: obiective SMART (lista cu descriere + target + progres %), prioritate, status per obiectiv

---

#### C. Editor Raport Psihologic

**Rută:** `/dashboard/forms/report/new?clientId=X&reportType=ADULT` și `/dashboard/forms/report/[id]`

**Structură (8 secțiuni conform `07_raport_psihologic_adult.md`):**
1. Date identificare (auto-filled din `therapist_settings` + `clients`)
2. Scopul raportului (textarea + `requester_name`)
3. Metode de evaluare (checkboxes: instrumente din `client_assessments` + evaluare clinică liberă)
4. Rezultate și interpretare (textarea per instrument selectat + interpretare generală)
5. Observații clinice (textarea structurat)
6. Concluzii (textarea)
7. Recomandări (lista)
8. Limitele raportului (textarea)

**Funcționalități:**
- Auto-save draft la blur cu debounce 2s
- Export PDF via jsPDF (pattern existent din `templates.ts`, secțiune nouă `generatePsychologicalReport`)
- Status badge: DRAFT / FINAL (FINAL blochează editarea)
- Număr raport auto-generat la finalizare (`RPT-{year}-{clientId.slice(0,6)}`)

---

#### D. Pagina `/dashboard/forms`

**Rută:** `src/app/dashboard/forms/page.tsx`

**Layout:**
```
PageHeader: "Fișe & Rapoarte Clinice"
SetupBanner (dacă Supabase neconfigurath)

SectionCard cu 3 tab-uri:
├── "Fișe Clinice"  — tabel: client | tip fișă | track | data | status | acțiuni
├── "Rapoarte"      — tabel: client | tip raport | nr. | data | status | Export PDF
└── "Prestabilite"  — template-uri fișe (global, fără client) — TODO viitor
```

**Filtre (native select):** per client, per tip serviciu (ALL/CBT/DBT/etc.), per tip fișă, per status

**CTA-uri:**
- "Raport nou" → `/dashboard/forms/report/new`
- Per rând tabel: "Editează" → pagina editor, "Export PDF" (rapoarte finalizate)

**Server Actions (`src/app/dashboard/forms/forms-actions.ts`):**
- `listClinicalForms(filters?)` — toate fișele terapeutului
- `getClinicalForm(id)` — o singură fișă
- `upsertClinicalForm(data)` — create/update
- `listTherapyReports(filters?)` — toate rapoartele
- `getTherapyReport(id)` — un raport
- `upsertTherapyReport(data)` — create/update

---

#### E. Navigație

**`src/components/dashboard/nav-groups.ts`** — adaugă în grupul "Clinic & Documente":
```
{ label: "Fișe & Rapoarte", href: "/dashboard/forms", icon: ClipboardList }
```

---

#### F. Loading states

- `src/app/dashboard/forms/loading.tsx` — skeleton: PageHeader + 3 tabs + tabel 6 rânduri
- `src/app/dashboard/forms/report/[id]/loading.tsx` — skeleton: 8 secțiuni editor

---

#### G. Integrare cu DocumentChecklistCard

- Link-urile din `document-requirements.ts` pentru "Generează raport" → `/dashboard/forms/report/new?clientId={id}&reportType=ADULT`
- Link-urile pentru fișe lipsă → `/dashboard/clients/{id}#anamnesis` sau `/dashboard/forms/new?clientId={id}&formType=ANAMNESIS`

---

#### Ordine implementare

1. Migrare DB (A)
2. Server Actions + queries (D)
3. Fișe clinice per track (B) — integrate în `ClientDashboardUI`
4. Pagina `/dashboard/forms` (D) + navigație (E) + loading (F)
5. Editor raport psihologic (C)
6. Integrare DocumentChecklist (G)
7. Update `document-requirements.ts` cu actionHref-uri noi

---

### 34. Pagina documente extinsă — toate tipurile de contract

**Feature:** Pagina `/dashboard/documents` a fost extinsă cu suport pentru toate cele 4 tipuri de contracte.

**Modificări:**
- **`src/app/dashboard/documents/page.tsx`** — 5 carduri info în grid responsive (Contract Individual, Contract Minor, Contract B2B, Consimțământ CAS, Anexă GDPR); titluri și descrieri complete per tip; fiecare card cu icon distinctiv (FileText / Baby / Building2 / Heart / ShieldCheck)
- **`src/components/documents/document-list.tsx`** — selector nativ "Tip contract" în header card (STANDARD / MINOR / B2B / CAS); icon dinamic în butonul "Contract" reflectă tipul selectat; descriere scurtă sub selector; prop `defaultClientId` cu highlight vizual (ring + bg-primary/5) și `scrollIntoView` la mount

`tsc --noEmit` ✅

Fișiere principale:
- [src/app/dashboard/documents/page.tsx](src/app/dashboard/documents/page.tsx) _(modificat)_
- [src/components/documents/document-list.tsx](src/components/documents/document-list.tsx) _(modificat)_

---

### 33. DocumentChecklistCard + Sheet overlay (card → overlay per client)

**Feature nou:** Din `ServiceTrackSheet`, fiecare `ClientRow` are un buton `FileText` (roșu dacă are documente lipsă, cu count). Click → `DocumentChecklistSheet` (al doilea Sheet) se deschide cu checklist-ul complet al documentelor pentru acel client.

**Componente noi:**
- **`src/app/dashboard/clients/document-checklist-action.ts`** — Server action `getClientDocumentChecklist(clientId, serviceType)`: face fetch paralel (client + `patient_documents` + `client_assessments`) și rulează `checkDocumentRequirements()` din `document-requirements.ts`; returnează `{ results, stats, clientName, serviceType }`
- **`src/components/clients/DocumentChecklistCard.tsx`** — Card standalone: header cu icon + "Documente {ServiceType}" + "X/Y obligatorii · X/Y recomandate" + badge "X LIPSĂ/Complet"; secțiuni CONSIMȚĂMINTE / CONTRACTE / DOCUMENTE CLINICE / RAPOARTE; fiecare item: icon status (CheckCircle2 verde / AlertCircle roșu / Circle gri) + label + badge OBLIGATORIU + CTA link
- **`src/components/clients/DocumentChecklistSheet.tsx`** — Sheet wrapper cu lazy fetch (useEffect cu cancelled flag); afișează spinner → `DocumentChecklistCard` → fallback eroare

**Modificări:**
- **`src/components/dashboard/ServiceTrackSheet.tsx`** — `ClientRow` primește `trackServiceType` + `onOpenDocs` callback; adaugă buton `FileText` (roșu cu count dacă lipsă, neutru dacă ok); stare `docSheet: { clientId, clientName, serviceType } | null`; randează `<DocumentChecklistSheet>` în parallel cu Sheet-ul track-ului

**Reutilizare:** Zero duplicare — toată logica de cerințe documente vine din `src/lib/clients/document-requirements.ts` existent (COMMON_REQUIREMENTS + CBT/DBT/CLINICAL_PSYCHOLOGY/COUNSELING specifice)

`tsc --noEmit` ✅

Fișiere principale:
- [src/app/dashboard/clients/document-checklist-action.ts](src/app/dashboard/clients/document-checklist-action.ts) _(nou)_
- [src/components/clients/DocumentChecklistCard.tsx](src/components/clients/DocumentChecklistCard.tsx) _(nou)_
- [src/components/clients/DocumentChecklistSheet.tsx](src/components/clients/DocumentChecklistSheet.tsx) _(nou)_
- [src/components/dashboard/ServiceTrackSheet.tsx](src/components/dashboard/ServiceTrackSheet.tsx) _(modificat)_

---

### 32. Fluid UI — tranziții, loading states, animații

**Problema:** La navigare între pagini — ecran gol câteva secunde, fără feedback vizual că ceva se încarcă.

**Componente noi:**
- **`src/components/ui/skeleton.tsx`** — `Skeleton`: div cu `animate-pulse rounded-xl bg-muted/70`, reutilizabil în orice loading state
- **`src/components/app/navigation-progress.tsx`** — `NavigationProgress`: bară de 2px la `top-0 fixed z-[9999]` cu culoare `primary`; pornește animat easing spre 85% la click pe orice `<a>` intern; se completează la 100% când `usePathname` se schimbă; dispare cu fade după 400ms
- **`src/components/app/page-transition.tsx`** — `PageTransition`: wrapper `key={pathname}` → forțează DOM nou la fiecare navigare → CSS animation `animate-in fade-in slide-in-from-bottom-2 duration-200` se activează garantat

**Loading skeletons:**
- **`src/app/dashboard/loading.tsx`** — skeleton complet: PageHeader, TodayCommandCenter, 2-col alerts, ServiceTracksOverview (5 sub-carduri), 4 StatCards, Appointments+Assessment, Secondary tabs
- **`src/app/dashboard/clients/loading.tsx`** — skeleton: PageHeader, 4 MetricCards, search bar, tabel cu 8 rânduri (avatar + text + badges)

**Animații overlay/toast:**
- **`src/components/dashboard/topbar.tsx`** — Mobile menu: mereu în DOM, `transition-opacity duration-200` + `translate-y` pe panel; Search dropdown: `animate-in fade-in slide-in-from-top-2 duration-150`
- **`src/components/ui/toast.tsx`** — Toast-urile marchează `exiting: true` înainte de remove → `animate-out fade-out slide-out-to-right-6 duration-300`; click pe toast → dismiss manual

**Layout:**
- **`src/app/dashboard/layout.tsx`** — include `<NavigationProgress />` + `<PageTransition>{children}</PageTransition>`

`tsc --noEmit` ✅

Fișiere principale:
- [src/components/ui/skeleton.tsx](src/components/ui/skeleton.tsx) _(nou)_
- [src/components/app/navigation-progress.tsx](src/components/app/navigation-progress.tsx) _(nou)_
- [src/components/app/page-transition.tsx](src/components/app/page-transition.tsx) _(nou)_
- [src/app/dashboard/loading.tsx](src/app/dashboard/loading.tsx) _(nou)_
- [src/app/dashboard/clients/loading.tsx](src/app/dashboard/clients/loading.tsx) _(nou)_

---

### 31. ServiceTracksOverview — card sheet overlay (lazy fetch)

**Feature nou:** Click pe oricare card de track clinic deschide un Sheet lateral cu detalii despre clienții activi din acel track.

**Componente noi:**
- **`src/components/ui/sheet.tsx`** — Sheet UI primitiv construit custom (același pattern ca `AlertDialog`): `Sheet`, `SheetContent` (slide-in-from-right, `animate-in`), `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetBody`, `SheetFooter`, `SheetClose`; accesibil prin `useOverlayA11y`
- **`src/app/dashboard/service-track-actions.ts`** — Server action `getTrackClients(serviceType)`: returnează clienții activi pentru un track (exclude INCHEIAT/NECONVERSIE/ANONIMIZAT); pentru `UNDECIDED` filtrează invers (tot ce nu e în cele 4 tipuri clasificate); câmpuri: fullName, lifecycleStatus, serviceTrackStatus, riskLevel, gdprSigned, onboardingComplete, hasContract, isMinor
- **`src/components/dashboard/ServiceTrackSheet.tsx`** — Client component care consumă server action la deschidere (lazy); afișează: header cu track name + count + alertă dacă există clienți cu probleme; lista clienților cu avatar inițiale, lifecycle badge, risc badge, indicatori lipsă (`StatusPill` — roșu compact pentru GDPR/Contract/Onboarding lipsă); footer cu CTA „Toți clienții [Track]" + „Client nou"
- **`src/components/dashboard/ServiceTracksOverview.tsx`** rescris ca client component — click pe card → `setSelectedTrack(track)` în loc de navigare; card-ul folosește `<button>` cu hover lift; `ServiceTrackSheet` randează în portal

**Pattern fetch:** useEffect pe schimbare de `track` prop → `getTrackClients()` → skeleton cu `Loader2`; cancelled flag pentru race condition

`npm run build` ✅

Fișiere principale:
- [src/components/ui/sheet.tsx](src/components/ui/sheet.tsx) _(nou)_
- [src/app/dashboard/service-track-actions.ts](src/app/dashboard/service-track-actions.ts) _(nou)_
- [src/components/dashboard/ServiceTrackSheet.tsx](src/components/dashboard/ServiceTrackSheet.tsx) _(nou)_
- [src/components/dashboard/ServiceTracksOverview.tsx](src/components/dashboard/ServiceTracksOverview.tsx)

---

### 30. Audit & fix nav + dashboard shell

**Audit identificat:**
- Labels nav ambigue: „Raportare Lună" / „Sumar Lunar" / „Registru" fără context clar
- „Asistent AI" plasat greșit în grupul „Activitate Zilnică" (nu e un tool zilnic operațional)
- Sidebar footer cu „Informații Legale" + versiune — clutter inutil în interfața clinică
- `SetupBanner` în `page-shell.tsx` cu culori amber hardcodate (`border-amber-200`, `bg-amber-50`, `text-amber-950`)
- Buton „Programare nouă" în topbar redundant față de butonul din dashboard `PageHeader`
- `ActionCard` default trailing icon = `AlertTriangle` (icon de avertizare pe card de navigare)
- Sidebar group headers prea agresive (`font-black uppercase tracking-widest`)
- Apostrof greșit în logo (`Ce\`ai` cu backtick în loc de `Ce'ai`)

**Fix-uri aplicate:**

- **`nav-groups.ts`** — labels redenumite (`Raportare Lună` → `Financiar lunar`, `Sumar Lunar` → `Raport clinic lunar`, `Registru` → `Registru activitate`, `Seif Cabinet` → `Seif cabinet`); grupuri redenumite (`Management Clienți` → `Clinic & Documente`, `Financiar & Administrativ` → `Financiar & Admin`, `Legal & Configurare` → `Configurare & Legal`); `Asistent AI` mutat din `Activitate zilnică` în `Configurare & Legal`; `Clienți` mutat în `Activitate zilnică`; `Catalog teste` adăugat în `Clinic & Documente`
- **`sidebar.tsx`** — eliminat footer cu „Informații Legale" (termeni, GDPR, versiune); calmați header-ii de grup (`font-black uppercase tracking-widest` → `font-semibold uppercase tracking-wider`); apostrof corect `Ce'ai` (HTML entity); lățime sidebar redusă `w-64` → `w-60`
- **`topbar.tsx`** — eliminat butonul „Programare nouă" (redundant cu dashboard PageHeader); apostrof corect în logo și mobile nav; search input mai compact (`max-w-sm`, `rounded-xl`, `bg-muted/30`); placeholder scurtat (`Caută în dashboard…`); header-ii din mobile nav calmaṭi; icon mobile menu mai mic (`h-9 w-9`)
- **`page-shell.tsx`** — `SetupBanner`: eliminat culori amber hardcodate (`border-amber-200`, `bg-amber-50`, `text-amber-950`), înlocuit cu `border-border/60 bg-muted/40 text-muted-foreground`; `ActionCard`: trailing icon default schimbat din `AlertTriangle` în `ChevronRight`

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:
- [src/components/dashboard/nav-groups.ts](src/components/dashboard/nav-groups.ts)
- [src/components/dashboard/sidebar.tsx](src/components/dashboard/sidebar.tsx)
- [src/components/dashboard/topbar.tsx](src/components/dashboard/topbar.tsx)
- [src/components/app/page-shell.tsx](src/components/app/page-shell.tsx)

---

### 29. Dashboard — secțiunea secundară reorganizată în tabs

- Cele 3 rânduri de la baza dashboard-ului (Financiar / Programări viitoare / Cabinet) au fost înlocuite cu un `DashboardSecondaryTabs` — componenta client cu 3 tab-uri, folosind același pattern slots ca și `ComplianceTabs` de pe pagina de conformitate
- **Tab Financiar**: `FinancialSummary` + `UnpaidInvoices` side-by-side; badge galben cu numărul de facturi restante
- **Tab Programări viitoare**: `UpcomingAppointments`; badge secondary cu numărul de programări
- **Tab Cabinet**: `VaultStatusWidget` + `CompliancePanel compact` + `ResearchReadinessPanel`; badge roșu dacă există alerte seif
- `FinancialSummary` rescris: eliminat bara de progres roșie agresivă, eliminat culorile hardcodate `emerald/rose` ca bază, adăugat link „Raport financiar complet", structură cu borduri interne în loc de carduri nested
- `VaultStatusWidget` curățat: eliminat `rose-*/emerald-*` hardcodat, trecut pe `destructive`, `muted`, `border-border/60`, convertit din `Card` custom pe `SectionCard`

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:
- [src/components/dashboard/DashboardSecondaryTabs.tsx](src/components/dashboard/DashboardSecondaryTabs.tsx)
- [src/components/dashboard/financial-summary.tsx](src/components/dashboard/financial-summary.tsx)
- [src/components/dashboard/vault-status-widget.tsx](src/components/dashboard/vault-status-widget.tsx)
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)

---

### 28. Dashboard/Compliance — centru unificat de notificări cu tabs

- `getDashboardClinicalAlerts`, `getDashboardDocumentTasks`, `getDashboardAssessmentTasks` primesc acum un parametru opțional `limit` (default 5 pentru dashboard, 50 pentru pagina de compliance)
- `ClinicalAlertsPanel` primește prop opțional `hideSeeAll` — ascunde butonul „Vezi toate → compliance" când componenta e deja pe pagina de conformitate
- `/dashboard/compliance` reconstruit ca centru unificat cu 4 tab-uri (pattern slots — `ComplianceTabs` client component, conținut server prerendat):
  - **Tab Alerte** — `ClinicalAlertsPanel` cu toate alertele (fără limita de 5), badge cu nr. critice
  - **Tab Documente** — `DocumentTasksPanel` cu toate task-urile onboarding/GDPR/contracte
  - **Tab Evaluări** — `AssessmentTasksPanel` cu toate task-urile de evaluări și rapoarte
  - **Tab Juridic** — `CompliancePanel` per-client + cadrul legal static
  - Summary bar deasupra tab-urilor cu totalul notificărilor și badge-uri globale
- Butonul „Vezi toate" din `ClinicalAlertsPanel` pe dashboard duce acum la o pagină care chiar afișează totul, fără limitele de 5

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:
- [src/lib/dashboard/queries.ts](src/lib/dashboard/queries.ts)
- [src/components/dashboard/ClinicalAlertsPanel.tsx](src/components/dashboard/ClinicalAlertsPanel.tsx)
- [src/app/dashboard/compliance/ComplianceTabs.tsx](src/app/dashboard/compliance/ComplianceTabs.tsx)
- [src/app/dashboard/compliance/page.tsx](src/app/dashboard/compliance/page.tsx)

---

### 27. Dashboard / Programări / Fișa clientului — context clinic operațional + hardening DB + audit UI

**Dashboard / programări:**
- `AppointmentsToday` și `AppointmentRow` au fost extinse cu context clinic pe programare:
  - `service_type`
  - risc clinic
  - stare contract
  - stare notă
  - stare factură
  - jurnal DBT săptămânal
- `TodayCommandCenter` include și tab financiar; denumirile noi au fost armonizate în română
- `SessionDrawer` și pagina completă a programării afișează acum un bloc compact `Context clinic`

**Fișa clientului:**
- `ClientDashboardUI` are un panou nou `Pregătire sesiune`
- panoul sintetizează:
  - următoarea ședință
  - ultima ședință finalizată
  - stare notă / factură
  - checklist pentru următoarea sesiune
  - ultima factură relevantă

**DB / hardening:**
- migrare nouă: [supabase/migrations/20260503091500_dashboard_ui_hardening.sql](supabase/migrations/20260503091500_dashboard_ui_hardening.sql)
- normalizare valori pentru `clients.service_type` și `clients.risk_level`
- constrângeri:
  - `clients_service_type_valid`
  - `clients_risk_level_valid`
- indexuri noi:
  - `clients_risk_level_idx`
  - `appointments_client_date_desc_idx`
  - `notes_appointment_idx`
  - `invoices_appointment_idx`
- `npx supabase db push` rulat cu succes și verificat remote

**Audit UI / documentație:**
- addendum nou în `docs/ui-ux-audit-readonly.md` pentru extensiile din programări și client page
- `docs/client-service-flows.md` actualizat din plan static în status de implementare incrementală
- `fluxuri/01_lifecycle_client.md` și `docs/dashboard-v2-plan.md` trebuie citite acum în cheia implementării reale, nu a planului inițial
- standardizare incrementală de overlay / quick actions:
  - `QuickActionsWheel` cu ton mai calm și layering mai sigur
  - `SectionDetailOverlay` și `ClientDetailOverlay` trecute pe `z-[60]`
  - backdrop unificat pentru mobile nav și overlay-uri laterale
  - `SectionDetailOverlay` extins cu API explicit de dimensiune (`size`)
  - `FinancialDetailOverlay` și `PersonalInfoOverlay` migrate mai aproape de design system-ul comun
  - `MedicalDetailOverlay` și `CrisisNotesDetailOverlay` aliniate pe același contract vizual
  - `ClientDetailOverlay` simplificat incremental pentru a reduce diferența față de restul familiei de overlay-uri
  - `AssessmentDetailOverlay` migrat pe `SectionDetailOverlay`
  - `SessionDrawer` aliniat vizual la același contract lateral, fără să i se schimbe comportamentul operațional

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:
- [src/components/dashboard/appointment-row.tsx](src/components/dashboard/appointment-row.tsx)
- [src/components/dashboard/TodayCommandCenter.tsx](src/components/dashboard/TodayCommandCenter.tsx)
- [src/components/appointments/SessionDrawer.tsx](src/components/appointments/SessionDrawer.tsx)
- [src/app/dashboard/appointments/[id]/page.tsx](src/app/dashboard/appointments/[id]/page.tsx)
- [src/components/clients/ClientDashboardUI.tsx](src/components/clients/ClientDashboardUI.tsx)
- [src/lib/appointments/queries.ts](src/lib/appointments/queries.ts)
- [supabase/migrations/20260503091500_dashboard_ui_hardening.sql](supabase/migrations/20260503091500_dashboard_ui_hardening.sql)

---

### 26. Catalog teste psihologice — metadata, instrumente noi, formulare interne, pagină redesenată

**`src/lib/assessments/types.ts`**:
- Tipuri noi: `ServiceTrack`, `TestCategory`, `LicenseStatus`, `RecommendedFrequency`, `TestMeta`
- `Question` extins cu `type?: "radio" | "textarea" | "scale" | "info"`, `placeholder`, `scaleLabel`
- `RawAnswers` extins la `Record<string, number | string>` (backward compatible în JSONB)
- `TestTemplate` extins cu câmpul opțional `meta?: TestMeta`

**`src/lib/assessments/scoringEngine.ts`**:
- `getAnswerScore` returnează 0 pentru întrebările `textarea` și `info`
- Guard pentru `typeof raw !== "number"` — previne erori pe răspunsuri text

**`src/lib/assessments/seededTests.ts`**:
- Adăugat `meta` (categoria, tracks, vârstă, durată, licență, frecvență) la PHQ-9, GAD-7, DASS-21
- Instrumente noi: **PSS-10** (stres perceput, itemi completi în română), **WHO-5** (wellbeing, itemi completi în română), **DERS-16** (reglare emoțională DBT, structură cu subscale, itemi placeholder), **SDQ** (screening minori 11–17 ani, itemi placeholder), **RCADS** (anxietate/depresie minori, 47 itemi, 6 subscale, placeholder)

**`src/lib/assessments/internalForms.ts`** (fișier nou):
- **Jurnal gânduri automate CBT** — formular cu întrebări textarea + scale 0–10, scoring urmărește delta intensitate emoțională
- **Fișă prevenție recădere** — 6 câmpuri textarea, pentru finalul terapiei

**`src/components/assessments/TestExecutionForm.tsx`**:
- Redare diferențiată per tip întrebare: `info` (bloc muted), `textarea` (Textarea component), `scale` (butoane numerice orizontale 0–10), `radio` (comportament existent)
- Textele din câmpurile textarea sunt incluse în `contentSummary` la salvare
- Butonul AI este ascuns pentru formulare cu `isSafetyPlan: true`

**`src/app/dashboard/tests/page.tsx`** rescris ca client component:
- Combină `seededTests` + `internalForms` într-un catalog unic (9 + 2 = 11 intrări)
- Filter pills per categorie cu numărătoare
- Card test cu: badge licență (success/warning/secondary/outline), chips durată/vârstă/frecvență, badge-uri tracks, badge-uri subscale, avertisment vizibil pentru itemi placeholder
- Legendă licență în header pagină

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:
- [src/lib/assessments/types.ts](src/lib/assessments/types.ts)
- [src/lib/assessments/scoringEngine.ts](src/lib/assessments/scoringEngine.ts)
- [src/lib/assessments/seededTests.ts](src/lib/assessments/seededTests.ts)
- [src/lib/assessments/internalForms.ts](src/lib/assessments/internalForms.ts)
- [src/components/assessments/TestExecutionForm.tsx](src/components/assessments/TestExecutionForm.tsx)
- [src/app/dashboard/tests/page.tsx](src/app/dashboard/tests/page.tsx)

---



### 22–25. P2 — Teme CBT, Formulare caz CBT, Diary cards DBT, Plan de siguranță DBT

**Migrare nouă**: `supabase/migrations/20260502120000_p2_clinical_tools.sql`
- `homework_items` — teme CBT cu `description`, `due_date`, `completed_at`, `therapist_notes`; RLS per `therapist_id`
- `cbt_case_formulations` — formulare de caz CBT (unic per client); 8 câmpuri text + `cognitive_distortions text[]`
- `dbt_diary_cards` — diary card săptămânal DBT; `unique(client_id, week_start)`; `target_behaviors jsonb`, `skills_used text[]`
- `safety_plans` — plan de siguranță (unic per client); 5 câmpuri text + `support_contacts jsonb`, `professional_contacts jsonb`

**Tipuri noi în `types.ts`**: `HomeworkItem`, `CbtCaseFormulation`, `DbtDiaryCard`, `SafetyPlan`

**Queries noi în `queries.ts`**: `getHomeworkItems`, `getCbtCaseFormulation`, `getDbtDiaryCards`, `getSafetyPlan`
- Toate au graceful fallback `isP2TableMissing()` → returnează [] / null dacă migrarea nu e aplicată

**Server Actions noi în `actions.ts`**:
- `createHomeworkItem`, `toggleHomeworkItem`, `deleteHomeworkItem`
- `upsertCbtCaseFormulation`, `upsertDbtDiaryCard`, `upsertSafetyPlan`

**4 componente noi**:
- `HomeworkCard.tsx` — CBT: listă teme + adaugă + toggle completat + șterge; secțiune "Finalizate" colapsabilă
- `CbtCaseFormulationCard.tsx` — CBT: formulare structurate cu 7 câmpuri text + distorsiuni cognitive ca tag-uri
- `DbtDiaryCardsPanel.tsx` — DBT: accordion săptămâni + editare comportamente țintă (frecvență), abilități DBT, note terapeut
- `SafetyPlanCard.tsx` — DBT + Clinică: plan de siguranță cu 5 secțiuni text + contacte suport + contacte profesionale; bordură roșie distinctivă

**`page.tsx` actualizat** — fetch P2 data condiționat per `service_type` (CBT, DBT, CLINICAL_PSYCHOLOGY); nicio interogare inutilă

**`ClientDashboardUI.tsx` actualizat** — 4 props noi + randare condiționată:
- CBT: `HomeworkCard` + `CbtCaseFormulationCard`
- DBT: `SafetyPlanCard` + `DbtDiaryCardsPanel`
- CLINICAL_PSYCHOLOGY: `SafetyPlanCard`

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:
- [supabase/migrations/20260502120000_p2_clinical_tools.sql](supabase/migrations/20260502120000_p2_clinical_tools.sql)
- [src/components/clients/HomeworkCard.tsx](src/components/clients/HomeworkCard.tsx)
- [src/components/clients/CbtCaseFormulationCard.tsx](src/components/clients/CbtCaseFormulationCard.tsx)
- [src/components/clients/DbtDiaryCardsPanel.tsx](src/components/clients/DbtDiaryCardsPanel.tsx)
- [src/components/clients/SafetyPlanCard.tsx](src/components/clients/SafetyPlanCard.tsx)
- [src/lib/clients/queries.ts](src/lib/clients/queries.ts)
- [src/app/dashboard/clients/actions.ts](src/app/dashboard/clients/actions.ts)
- [src/app/dashboard/clients/[id]/page.tsx](src/app/dashboard/clients/[id]/page.tsx)
- [src/components/clients/ClientDashboardUI.tsx](src/components/clients/ClientDashboardUI.tsx)

---

### 21. P1 — Filtru service type în lista clienți + obiective terapeutice inline + salt etapă

- **`src/components/clients/ClientsClient.tsx`**:
  - Importat `SERVICE_TYPE_LABELS`, `SERVICE_TYPE_BADGE_VARIANTS`, `isServiceType` din `service-track.ts`
  - Adăugat stare `serviceFilter` (ALL / CLINICAL_PSYCHOLOGY / CBT / DBT / COUNSELING / UNDECIDED)
  - Filtru chips cu numărătoare per tip, afișate între search bar și tabel
  - Badge service type afișat în rândul tabelului (desktop) și în cardul mobil (ascuns dacă UNDECIDED)
- **`src/components/clients/ClinicalContextCard.tsx`**:
  - `treatment_goals` a trecut din read-only cu link extern → editor inline complet
  - Stare locală `goals: string[]`, sincronizată cu `client.treatment_goals` la mount și cancel
  - Editor: lista de `<Input>` individuale cu buton ștergere + buton "Adaugă obiectiv"
  - Salvare: goals filtrate (trim + non-empty), comparate cu valorile actuale, trimise în `treatment_goals` dacă modificate
  - `hasAnyData` folosește `goals.length` (starea locală) în loc de `client.treatment_goals`
- **`src/app/dashboard/clients/actions.ts`**: `updateServiceTrack` extins cu `treatment_goals?: string[]`
- **`src/components/clients/ServiceTrackCard.tsx`**:
  - Adăugat stare `showJump` (toggle)
  - Buton `ListTree` în header card — toggle afișare selector etapă
  - Select cu toate etapele trackului curent; la selecție: `handleJumpToStage()` → `updateServiceTrack` + toast + refresh
  - Funcționează independent de butonul "Avansează" (care rămâne pentru flux secvențial)

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/components/clients/ClientsClient.tsx](src/components/clients/ClientsClient.tsx)
- [src/components/clients/ClinicalContextCard.tsx](src/components/clients/ClinicalContextCard.tsx)
- [src/components/clients/ServiceTrackCard.tsx](src/components/clients/ServiceTrackCard.tsx)
- [src/app/dashboard/clients/actions.ts](src/app/dashboard/clients/actions.ts)

---

### 18. P1 — Service Track Progression + Clinical Context Card

- **`src/lib/clients/service-track.ts`** extins:
  - `RISK_LEVELS`, `RiskLevel`, `RISK_LEVEL_LABELS`, `RISK_LEVEL_BADGE_VARIANTS`, `isRiskLevel()` — definire și clasificare vizuală risc (LOW/MEDIUM/HIGH/CRISIS)
  - `SERVICE_TRACK_STATUSES` — etapele ordonate per ServiceType (9 etape Clinică, 8 CBT, 9 DBT, 5 Consiliere)
  - `getNextTrackStatus()` — returnează etapa următoare în flux
  - `computeServiceTrackNextAction()` refăcut — folosește `service_track_status` pentru acțiuni granulare cu tabele dedicate per tip; fallback pe lifecycle; atenție specială DBT risc ridicat
- **`src/app/dashboard/clients/actions.ts`**: adăugat `updateServiceTrack()` — Server Action pentru actualizare `service_track_status`, `main_complaint`, `risk_level`, `treatment_plan`
- **`src/components/clients/ServiceTrackCard.tsx`** rescris:
  - Progress bar vizual (etape parcurse / curentă / viitoare)
  - Afișare etapă curentă + etapă următoare
  - Buton "Avansează" cu `useTransition` + toast + `router.refresh()`
  - Primește `clientId` pentru apelul Server Action
- **`src/components/clients/ClinicalContextCard.tsx`** (componentă nouă):
  - Afișată per tip de serviciu (ascunsă pentru UNDECIDED/MIXED)
  - Câmpuri afișate condiționat: `main_complaint` (toate), `risk_level` (DBT + Clinică), `treatment_plan` (CBT/DBT/Consiliere/Clinică), `treatment_goals` (read-only list)
  - Editare inline: buton creion → textarea/select → buton salvar cu X anulare
  - Risc DBT: highlight roșu când lipsește evaluarea de risc
  - Salvare prin `updateServiceTrack` Server Action
- **`ClientDashboardUI.tsx`**: adăugat `clientId` la `ServiceTrackCard`, montat `ClinicalContextCard` după `DocumentRequirementsCard`

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/lib/clients/service-track.ts](src/lib/clients/service-track.ts)
- [src/app/dashboard/clients/actions.ts](src/app/dashboard/clients/actions.ts)
- [src/components/clients/ServiceTrackCard.tsx](src/components/clients/ServiceTrackCard.tsx)
- [src/components/clients/ClinicalContextCard.tsx](src/components/clients/ClinicalContextCard.tsx)
- [src/components/clients/ClientDashboardUI.tsx](src/components/clients/ClientDashboardUI.tsx)

---

### 17. P1 — Document Requirements per Service Track

- **`src/lib/clients/document-requirements.ts`** (fișier nou): logica de mapare documente per `ServiceType`. `COMMON_REQUIREMENTS` (GDPR, onboarding, contract, consimțământ informat) + cerințe specifice per tip: `CLINICAL_PSYCHOLOGY` (anamneză, interviu clinic, teste, raport), `CBT` (obiective, formulare caz, raport progres), `DBT` (evaluare risc, plan siguranță, angajament, raport), `COUNSELING` (obiectiv, recomandări, raport scurt). Funcții: `getDocumentRequirements()`, `checkDocumentRequirements()`, `getDocumentCompletionStats()`.
- **`src/components/clients/DocumentRequirementsCard.tsx`** (componentă nouă): checklist vizual în fișa clientului — afișează documentele recomandate per `service_type` cu starea fiecăruia (✅/⚠/○), badge "Obligatoriu" pe cele lipsă cu prioritate mandatory, buton inline de acțiune per document lipsă, toggle "arată toate / ascunde complete", header cu stats `N/M obligatorii`. Ascunsă pentru `UNDECIDED`/`MIXED`.
- **`src/components/clients/ClientDashboardUI.tsx`**: montat `DocumentRequirementsCard` după `ServiceTrackCard` (ascuns pe clienți anonimizați).
- **Fix TS pre-existent** (`clients/page.tsx`): înlocuit SVG inline `AlertCircle` cu import real din lucide-react, eliminat funcție locală.
- **Fix TS pre-existent** (`types.ts`): `WidgetCardProps.icon` schimbat din `IconComponent` în `LucideIcon`; adăugate câmpurile din migrarea P0 (`clinical_focus`, `treatment_goals`, `treatment_plan`) pe `ClientProfile`.

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/lib/clients/document-requirements.ts](src/lib/clients/document-requirements.ts)
- [src/components/clients/DocumentRequirementsCard.tsx](src/components/clients/DocumentRequirementsCard.tsx)
- [src/components/clients/ClientDashboardUI.tsx](src/components/clients/ClientDashboardUI.tsx)
- [src/components/clients/types.ts](src/components/clients/types.ts)
- [src/app/dashboard/clients/page.tsx](src/app/dashboard/clients/page.tsx)

---

### 16. P0 — Service Type & Service Track Card (Client Service Flows)

- **Migrare DB** (`20260502110000_service_type_and_clinical_fields.sql`): adăugat pe `clients` — `service_type` (default `UNDECIDED`), `service_track_status`, `main_complaint`, `clinical_focus`, `treatment_goals`, `treatment_plan`, `risk_level`, `research_consent`. Index pe `(therapist_id, service_type)`.
- **`src/lib/clients/service-track.ts`** (fișier nou): tip `ServiceType`, labels, badge variants, `isServiceType()`, `computeServiceTrackNextAction()` — logică next action contextuală per tip de serviciu + status lifecycle.
- **`src/lib/supabase/types.ts`**: actualizat Row/Insert/Update pentru `clients` cu câmpurile noi.
- **`src/components/clients/types.ts`**: adăugat `service_type`, `service_track_status`, `main_complaint`, `risk_level`, `research_consent` pe `ClientProfile`.
- **`src/lib/clients/form-state.ts`**: adăugat `service_type` la `fieldErrors`.
- **`src/components/clients/client-form.tsx`**: selector nativ "Tip serviciu principal" (6 opțiuni). Poziționat înainte de secțiunea Demografice & Facturare.
- **`src/app/dashboard/clients/actions.ts`**: `parseForm` + `createClient` (upsert payload) + `updateClient` includ acum `service_type`.
- **`src/components/clients/ServiceTrackCard.tsx`** (componentă nouă): afișează tip serviciu (badge colorat), `service_track_status` opțional, next best action calculat din `computeServiceTrackNextAction`. Reutilizabilă.
- **`src/components/clients/ClientDashboardUI.tsx`**: badge service type în header (vizibil doar dacă nu e UNDECIDED), `ServiceTrackCard` randată deasupra gridului Status/Pași/Semnale.

**Document de plan**: [docs/client-service-flows.md](docs/client-service-flows.md) — arhitectura completă a 4 service tracks (Psihologie clinică, CBT, DBT, Consiliere), cu statusuri, documente, carduri UI, model de date P1–P3, și principii AI assistant.

**Urmează P1**: mapare documente recomandate per `service_type`, checklist documente lipsă în fișa clientului, carduri condiționate în fișa clientului.

### 15. Fix query vault în dashboard + audit baza de date

- Identificat bug: `getDashboardStats` interoga `patient_documents.expiry_date` — coloana nu există pe `patient_documents` (migrare `0012`). `expiry_date` există doar pe `therapist_documents` (vault profesional, migrare `0016`).
- Fixate ambele query-uri vault din `queries.ts`: `vaultTotalDocs` și `vaultAlertsCount` pointează acum corect la `therapist_documents`, cu `.then(r => r.error ? { count: 0 } : r)` pentru fallback graceful.
- Eroarea din consolă `"Error fetching vault alerts count: {}"` este rezolvată.
- Adăugat în TODO secțiunea completă **🟠 TODO Baza de date** cu 4 categorii de migrări/task-uri necesare.

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/lib/dashboard/queries.ts](src/lib/dashboard/queries.ts)

---

### 14. Revizie texte UI — mesaje de eroare contextuale

- Audit complet diacritice: **PASS** — toate formele greșite (`Inapoi`, `Sterge`, `Adauga`, etc.) fie nu există, fie sunt corect scrise cu diacritice.
- Audit CTA-uri vagi: **PASS** — niciun "Click here", "OK" izolat sau altă formulare neclară găsită.
- Fixate 6 mesaje fallback `"Eroare"` generic în `SettingsClient.tsx` cu mesaje contextuale per secțiune:
  - Profil → "Nu am putut salva setările profilului."
  - Tarife → "Nu am putut salva tarifele."
  - Program → "Nu am putut salva programul de lucru."
  - Integrări → "Nu am putut salva integrările."
  - PIN → "Nu am putut actualiza PIN-ul."
  - CAS → "Nu am putut salva setările CAS."
- Fixat fallback generic `"Eroare"` în `ClientAiAssistant.tsx` → "Nu am putut procesa răspunsul AI."

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/components/settings/SettingsClient.tsx](src/components/settings/SettingsClient.tsx)
- [src/components/clients/ClientAiAssistant.tsx](src/components/clients/ClientAiAssistant.tsx)

---

### 13. Empty states coerente pe paginile rămase

- Am înlocuit mesajul text plat din `DocumentList` (pagina `/documents`) cu `EmptyState` — icon `Users`, titlu "Niciun client activ", descriere și CTA către `/dashboard/clients/new`.
- Am înlocuit paragraful text din `PatientDocuments` (secțiunea Medical din fișa clientului) cu `EmptyState` — icon `FileScan`, titlu "Niciun document încărcat", descriere orientativă.
- Toate celelalte pagini dashboard (facturi, cheltuieli, programări, calendar, note, evaluări) aveau deja empty states coerente — confirmat prin survey complet.

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/components/documents/document-list.tsx](src/components/documents/document-list.tsx)
- [src/components/clients/PatientDocuments.tsx](src/components/clients/PatientDocuments.tsx)

---

### 12. Toast feedback pe acțiuni distructive și de status

- Am adăugat toast de confirmare și eroare la ștergerea cheltuielilor în `ExpensesClient.tsx`: după `deleteExpense`, afișăm `toast.success("Cheltuiala a fost ștearsă.")` sau `toast.error(...)` dacă acțiunea eșuează.
- Am adăugat toast la schimbarea statusului programării în `SessionDrawer.tsx` (`handleStatusChange`): fiecare status nou afișează un mesaj specific (confirmat, finalizat, anulat, absent, reactivat), plus `toast.error(...)` dacă acțiunea eșuează.

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/components/expenses/ExpensesClient.tsx](src/components/expenses/ExpensesClient.tsx)
- [src/components/appointments/SessionDrawer.tsx](src/components/appointments/SessionDrawer.tsx)

---

### 8. Flow client si lifecycle operational

- Am definit si implementat un prim model de lifecycle derivat pentru clienti, fara migrare de schema, folosind datele deja existente din onboarding, consimtamant, programari si anonimizare.
- Am adaugat o utilitara comuna care traduce datele reale in stari vizibile precum `Lead nou`, `Onboarding`, `Programat`, `Activ` si `Anonimizat`.
- Am actualizat registrul de clienti astfel incat fiecare rand si card mobil sa afiseze statusul curent si primul pas operational recomandat.
- Am refacut KPI-urile din lista de clienti pentru a reflecta funnel-ul real: onboarding, prima sedinta si clienti activi.
- Am extins fisa clientului cu un sumar de lifecycle, urmatorii pasi si semnale administrative, astfel incat terapeutul sa vada rapid ce lipseste si ce urmeaza.
- Am introdus persistenta pentru lifecycle in schema Supabase printr-o migrare dedicata, plus tabel de istoric pentru tranzitii.
- Am legat sincronizarea statusului persistent de fluxurile care schimba real relatia cu clientul: creare/editare client, onboarding adult si minor, booking public, programari si anonimizare.
- Am facut onboarding-urile adult si minor mai coerente pentru utilizatorii reali: validare pe pasi, blocare inainte de progres cand lipsesc date importante si mesaje inline in loc de `alert()`.
- Am curatat quick actions pentru dashboard astfel incat un terapeut sa porneasca din intrarile corecte de cabinet: `client nou` si `pacient minor nou`, nu linkuri publice generice care puteau crea confuzie.
- Am inceput intarirea fluxului public pentru minori: linkurile generate pentru clienti minori folosesc acum ruta securizata `/onboarding/minor?t=...`, iar pagina publica pentru minori nu mai functioneaza ca formular generic fara token.
- Am aliniat submit-ul public pentru minori la modelul per-client, astfel incat onboarding-ul minor cu token sa actualizeze fișa corecta si sa marcheze tokenul ca folosit.
- Am eliminat fallback-ul public bazat pe `therapistSlug` din onboarding-ul minor, astfel incat ruta publica functioneaza acum doar cu token securizat, iar crearea interna de pacient minor ramane separata in dashboard.
- Am expus in fișa clientului actiuni lifecycle reale pentru terapeut: `marcheaza activ`, `marcheaza inactiv`, `incheie caz`, `neconversie` si `reactiveaza`, toate legate de statusul persistent si refresh-ul imediat al UI-ului.
- Am legat onboarding-ul minor securizat direct in fișa clientului, cu CTA de copiere a linkului si banner contextual cand onboarding-ul nu este finalizat.
- Am adaugat in fișa clientului un istoric lifecycle cu ultimele tranzitii de status, astfel incat terapeutul sa vada rapid cum a evoluat relatia administrativ-clinica, chiar daca inca nu avem validarea finala pe baza reala.

### 11. Polish UI și corectare inconsistențe

- Am înlocuit numele hardcodat al terapeutului de pe pagina principală dashboard (`"Psih. Ioana Cosmina Terente PFA"`) cu un fetch dinamic din `getTherapistSettings()`. Acum salutarea afișează `full_name` sau `practice_name` din setări, cu fallback la `"Terapeut"`.
- Am corectat diacritica `"Inapoi"` → `"Înapoi"` în trei pagini publice: `/privacy`, `/terms`, `/legal/declaration` (câmpul `backLabel` al componentei `PublicDocumentShell`).
- Am înlocuit dialogul nativ `confirm()` din `ExpensesClient.tsx` și `VaultClient.tsx` cu `AlertDialog` custom — consistent cu restul aplicației, accesibil, cu focus trap și Esc-to-close.
  - `ExpensesClient`: butonul de ștergere setează `deleteTargetId`, AlertDialog confirmă înainte de a apela `deleteExpense`.
  - `VaultClient`: aceeași structură — `deleteTargetId` + `AlertDialogAction` → `handleDeleteConfirm`.

`npm run lint` ✅ | `npm run build` ✅

Fisiere principale:

- [src/app/dashboard/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/page.tsx)
- [src/app/privacy/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/privacy/page.tsx)
- [src/app/terms/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/terms/page.tsx)
- [src/app/legal/declaration/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/legal/declaration/page.tsx)
- [src/components/expenses/ExpensesClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/expenses/ExpensesClient.tsx)
- [src/components/vault/VaultClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/vault/VaultClient.tsx)

---

### 9. Istoric lifecycle transparent in fișa clientului

- Am adaugat `getClientStatusHistory(clientId)` in `queries.ts` — interogheaza ultimele 8 tranzitii din `client_status_history` ordonate descrescator dupa `changed_at`.
- Am adaugat fallback sigur in query: daca tabela `client_status_history` nu exista inca in baza de date (migrare neaplicata), functia returneaza `[]` fara a arunca eroare, astfel incat UI-ul nu cade.
- Am definit tipul `ClientStatusHistoryItem` in `src/components/clients/types.ts` cu campurile: `id`, `from_status` (nullable), `to_status`, `reason` (nullable), `changed_at`.
- Am trecut datele prin `page.tsx` in paralel cu celelalte fetch-uri (Promise.all), mapate la `ClientStatusHistoryItem[]`.
- Am extins props-ul lui `ClientDashboardUI` cu `lifecycleHistory: ClientStatusHistoryItem[]`.
- Am adaugat sectiunea "Istoric lifecycle" in `ClientDashboardUI.tsx`: fiecare intrare afiseaza tranzitia `from_status → to_status`, motivul (sau "Fara motiv explicit" ca fallback), si timestamp-ul formatat.
- Daca istoricul este gol (migrare neaplicata sau client nou), sectiunea afiseaza un empty state clar in loc sa dispara sau sa cada.
- `changed_by` nu este inca tracked — cine a facut schimbarea va fi pasul urmator.

`npm run lint` ✅ | `npm run build` ✅

### 10. Tracking changed_by in istoricul lifecycle

- Am adaugat helper-ul privat `fetchTherapistDisplayName(supabase, userId)` in `lifecycle-sync.ts`: face query la `therapist_settings.full_name` dupa `therapist_id = userId`.
- In ambele functii `syncClientLifecycleStatus` si `setClientLifecycleStatus`, dupa fiecare tranzitie reusita, apelam `supabase.auth.getUser()` si stocam numele in `metadata.changed_by_name`. Daca utilizatorul nu este autentificat (apel din sistem/public), campul lipseste din metadata si UI-ul nu afiseaza nimic.
- Am extins `ClientStatusHistoryItem` in `types.ts` cu `changed_by_name: string | null`.
- Am actualizat mappingul din `page.tsx`: extrage `changed_by_name` din `metadata` (JSONB) cu validare de tip stricta.
- Am actualizat sectiunea "Istoric lifecycle" din `ClientDashboardUI.tsx`: sub timestamp apare "de [Nume Terapeut]" cand campul este prezent.
- Nu necesita migrare — `metadata` (JSONB) exista deja in `client_status_history`.

`npm run lint` ✅ | `npm run build` ✅

Pasul urmator: aplicare migrare in baza reala si validare cap-la-cap ca butoanele lifecycle scriu corect in `client_status_history` cu `changed_by_name` in metadata.

Fisiere principale:

- [src/lib/clients/lifecycle.ts](/Users/sch_work/Documents/Oncolink/src/lib/clients/lifecycle.ts)
- [src/lib/clients/lifecycle-sync.ts](/Users/sch_work/Documents/Oncolink/src/lib/clients/lifecycle-sync.ts)
- [src/lib/clients/queries.ts](/Users/sch_work/Documents/Oncolink/src/lib/clients/queries.ts)
- [src/components/clients/types.ts](/Users/sch_work/Documents/Oncolink/src/components/clients/types.ts)
- [src/components/clients/ClientsClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientsClient.tsx)
- [src/components/clients/ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx)
- [src/app/dashboard/clients/[id]/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/clients/[id]/page.tsx)
- [supabase/migrations/20260429223610_client_lifecycle_status.sql](/Users/sch_work/Documents/Oncolink/supabase/migrations/20260429223610_client_lifecycle_status.sql)
- [src/components/onboarding/ClientOnboardingWizard.tsx](/Users/sch_work/Documents/Oncolink/src/components/onboarding/ClientOnboardingWizard.tsx)
- [src/components/onboarding/MinorOnboardingWizard.tsx](/Users/sch_work/Documents/Oncolink/src/components/onboarding/MinorOnboardingWizard.tsx)
- [src/components/dashboard/QuickActionsWheel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/QuickActionsWheel.tsx)
- [src/app/onboarding/minor/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/onboarding/minor/page.tsx)
- [src/lib/security/public-links.ts](/Users/sch_work/Documents/Oncolink/src/lib/security/public-links.ts)

### 1. Navigatie si intrare in produs

- Am adaugat navigatie mobila reala in dashboard.
- Am extras structura comuna de navigatie pentru consistenta intre sidebar si topbar.
- Am corectat CTA-urile si mesajele de pe pagina principala.
- Am reparat linkul rupt din quick actions catre onboarding.

Fisiere principale:

- [src/components/dashboard/topbar.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/topbar.tsx)
- [src/components/dashboard/nav-groups.ts](/Users/sch_work/Documents/Oncolink/src/components/dashboard/nav-groups.ts)
- [src/components/dashboard/QuickActionsWheel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/QuickActionsWheel.tsx)
- [src/app/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/page.tsx)

### 2. Clienti si folosire pe mobil

- Am refacut lista de clienti pentru mobil cu carduri mai clare.
- Am eliminat actiuni inutile sau inselatoare din toolbar.
- Am facut accesul catre fisa clientului mai explicit si mai usor de folosit.

Fisiere principale:

- [src/components/clients/ClientsClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientsClient.tsx)

### 3. Stabilizare UI si curatare tehnica

- Am eliminat erorile de lint si warning-urile relevante pentru audit.
- Am curatat texte, quotes, imports moarte si zone cu comportament inconsistent.
- Am verificat succesiv compilarea si tipurile dupa fiecare lot important de fixuri.
- Am consolidat baza pentru audituri viitoare, astfel incat noile modificari sa porneasca de la un repo curat.

Zone atinse:

- tests
- calendar
- vault
- onboarding
- documents
- login
- settings
- mail

### 4. Audit accesibilitate pe fluxuri critice

- In `appointments` am imbunatatit filtrele, empty state-ul si actiunile icon-only.
- In `billing` am adaugat etichete accesibile, empty states si siguranta mai buna pe mobil.
- In `calendar` am evitat ecranele goale fara context.
- In `documents` am clarificat lista si actiunile pentru generare/export.
- In `settings` am facut tab-urile utilizabile pe ecrane mici.

Fisiere principale:

- [src/app/dashboard/appointments/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/appointments/page.tsx)
- [src/app/dashboard/billing/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/billing/page.tsx)
- [src/app/dashboard/calendar/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/calendar/page.tsx)
- [src/components/documents/document-list.tsx](/Users/sch_work/Documents/Oncolink/src/components/documents/document-list.tsx)
- [src/components/settings/SettingsClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/settings/SettingsClient.tsx)
- [src/components/appointments/AppointmentsViewManager.tsx](/Users/sch_work/Documents/Oncolink/src/components/appointments/AppointmentsViewManager.tsx)

### 5. Formuri critice

- Am legat corect erorile, hint-urile si campurile prin `aria-describedby`.
- Am facut mesajele globale de eroare mai clare pentru screen readers.
- Am inlocuit controale fragile sau inconsistente in formularul de programari si formularul de client.

Fisiere principale:

- [src/components/appointments/appointment-form.tsx](/Users/sch_work/Documents/Oncolink/src/components/appointments/appointment-form.tsx)
- [src/components/clients/client-form.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/client-form.tsx)

### 6. Overlay-uri si dialoguri

- Am reparat semantic si functional dialogurile custom.
- Am introdus suport pentru inchidere cu `Esc`.
- Am adaugat focus initial, focus trap si focus return.
- Am uniformizat comportamentul pentru drawer, overlay si modale custom.

Fisiere principale:

- [src/components/ui/use-overlay-a11y.ts](/Users/sch_work/Documents/Oncolink/src/components/ui/use-overlay-a11y.ts)
- [src/components/ui/alert-dialog.tsx](/Users/sch_work/Documents/Oncolink/src/components/ui/alert-dialog.tsx)
- [src/components/appointments/SessionDrawer.tsx](/Users/sch_work/Documents/Oncolink/src/components/appointments/SessionDrawer.tsx)
- [src/components/clients/ClientDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDetailOverlay.tsx)
- [src/components/vault/VaultClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/vault/VaultClient.tsx)
- [src/components/clients/ContractGeneratorModal.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ContractGeneratorModal.tsx)
- [src/components/clients/SectionDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/SectionDetailOverlay.tsx)

### 7. Overlay-uri ramase si audit comportamental extins

- Am extins infrastructura comuna si pe modalele ramase din fluxurile de cheltuieli, documente, evaluari si asistare AI.
- Am adaugat suport de tastatura si inchidere coerenta pentru zone care inca aveau comportament partial.
- Am facut preview-urile si panourile laterale mai predictibile pentru utilizatorii cu tastatura si screen readers.

Fisiere principale:

- [src/components/expenses/ExpensesClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/expenses/ExpensesClient.tsx)
- [src/components/clients/PatientDocuments.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/PatientDocuments.tsx)
- [src/components/clients/AssessmentDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/AssessmentDetailOverlay.tsx)
- [src/components/clients/ClientAiAssistant.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientAiAssistant.tsx)

## Audit Curent

### Functional

- `lint`: verde
- `build`: verde
- fluxurile critice UI atinse pana acum compileaza si tipurile sunt valide
- shell-ul comun de UI este aplicat pe paginile principale si pe majoritatea suprafetelor publice
- exportul CAS si panoul de conformitate nu mai depind de mock data in fluxurile reale

### UX si accesibilitate

- navigatia mobila este functionala
- formularele mari au legaturi mai bune intre campuri, hint-uri si erori
- overlay-urile principale au acum comportament coerent la tastatura
- paginile mari si modulele principale folosesc acum aceeasi familie vizuala la nivel de shell, sectiuni si empty states
- micro-polish-ul pe densitate, spacing, tabele, badge-uri si formulare este deja aplicat pe majoritatea suprafetelor importante
- mai exista loc de verificare manuala pe focus order si interactiuni reale cap-coada

### Stabilitate

- nu exista erori active in baseline-ul curent
- repo-ul este intr-o stare buna pentru un pass final de testare manuala si polish

## Ce urmeaza — TODO

### 🔴 P3 — Fișe Clinice + Editor Rapoarte (task #35)

#### Pas 1 — Migrare DB
- [ ] Crează `supabase/migrations/20260503120000_p3_clinical_forms.sql` cu tabelele `clinical_forms` + `therapy_reports` (schema completă în task #35 de mai sus)
- [ ] RLS per `therapist_id = auth.uid()` pe ambele tabele
- [ ] Indexuri: `(client_id, form_type)`, `(therapist_id, created_at DESC)` pe `clinical_forms`; `(client_id, report_type)` pe `therapy_reports`
- [ ] `supabase db push` + `supabase gen types` → actualizare `src/lib/supabase/types.ts`

#### Pas 2 — Server Actions
- [ ] `src/app/dashboard/forms/forms-actions.ts` — `listClinicalForms`, `getClinicalForm`, `upsertClinicalForm`, `deleteClinicalForm`, `listTherapyReports`, `getTherapyReport`, `upsertTherapyReport`
- [ ] Queries în `src/lib/clients/queries.ts` — `getAnamnesisForm`, `getRiskAssessmentForm`, `getCounselingPlan` (lazy fallback dacă migrarea nu e aplicată)

#### Pas 3 — Fișe clinice noi (componente)
- [ ] `AnamnesisCard.tsx` (CLINICAL_PSYCHOLOGY) — 7 câmpuri textarea
- [ ] `ClinicalInterviewCard.tsx` (CLINICAL_PSYCHOLOGY) — 5 câmpuri textarea
- [ ] `RiskAssessmentCard.tsx` (DBT + CLINICAL_PSYCHOLOGY HIGH/CRISIS) — leagă `risk_level` existent
- [ ] `DbtCommitmentCard.tsx` (DBT) — angajamente + obiective
- [ ] `CounselingPlanCard.tsx` (COUNSELING) — obiectiv + abordare + durată
- [ ] `RecommendationsCard.tsx` (COUNSELING) — recomandări + plan urmărire
- [ ] Integrare în `ClientDashboardUI.tsx` condițional per `service_type`
- [ ] Integrare în `page.tsx` (fetch paralel condițional)

#### Pas 4 — Pagina `/dashboard/forms`
- [ ] `src/app/dashboard/forms/page.tsx` — PageHeader + 3 tabs (Fișe Clinice / Rapoarte / Prestabilite)
- [ ] `src/app/dashboard/forms/loading.tsx` — skeleton complet
- [ ] Tabel fișe: client, tip, track, dată, status, acțiuni (editează / șterge)
- [ ] Tabel rapoarte: client, tip, nr. raport, dată, status, Export PDF
- [ ] Filtre native select: client, tip serviciu, tip fișă, status
- [ ] Update `src/components/dashboard/nav-groups.ts` — adaugă "Fișe & Rapoarte" cu icon `ClipboardList`

#### Pas 5 — Editor Raport Psihologic
- [ ] `src/app/dashboard/forms/report/[id]/page.tsx` — editor cu 8 secțiuni
- [ ] `src/app/dashboard/forms/report/new/page.tsx` — `searchParams`: `clientId`, `reportType`
- [ ] `src/app/dashboard/forms/report/[id]/loading.tsx` — skeleton editor
- [ ] `generatePsychologicalReport()` în `src/lib/pdf/templates.ts` — export PDF secțional

#### Pas 6 — Integrare DocumentChecklist
- [ ] Update `document-requirements.ts` — actionHref-uri pentru "Generează raport" → `/dashboard/forms/report/new?clientId={id}`
- [ ] actionHref pentru fișe lipsă (anamneză, interviu clinic etc.) → `/dashboard/clients/{id}#anamnesis`

---

### 🔴 Blocker: Aplicare migrare in baza reala

- [ ] Rulează `supabase db push` sau aplică manual `20260429223610_client_lifecycle_status.sql` în baza remote
- [ ] Verifică că tabela `client_status_history` există și RLS-ul este activ
- [ ] Verifică backfill-ul inițial: clienții existenți trebuie să aibă cel puțin o intrare în `client_status_history` (din migrare)

### 🟠 TODO Baza de date — migrări necesare

#### A. `patient_documents` — coloana `expiry_date` lipsă
- Tabela `patient_documents` (migrarea `0012`) nu are coloana `expiry_date`.
- Coloana există doar pe `therapist_documents` (vault-ul terapeutului, migrarea `0016`).
- Dashboard-ul interoga greșit `patient_documents.expiry_date` — **bug fixat în cod**, query-ul pointează acum corect la `therapist_documents`.
- Dacă în viitor vrei să urmărești expirarea documentelor de pacient (ex: sentințe de custodie, acorduri parentale), va fi nevoie de o migrare:
  ```sql
  ALTER TABLE public.patient_documents ADD COLUMN expiry_date date DEFAULT NULL;
  CREATE INDEX patient_documents_expiry_idx ON public.patient_documents (expiry_date) WHERE expiry_date IS NOT NULL;
  ```
- [ ] Decide dacă `patient_documents` are nevoie de `expiry_date` (task separat, nu blocker)

#### B. Guardian — câmpuri plate pe `clients`, fără subtabel dedicat
- Câmpurile `parent_name`, `parent_phone`, `parent_1_name`, `parent_1_phone`, `parent_2_name`, `parent_2_phone` sunt coloane plate pe tabela `clients`.
- Nu există o tabelă `client_guardians` dedicată — dacă un minor are doi tutori cu date diferite, structura devine redundantă.
- Migrarea `20260425234603_backfill_legacy_minor_guardian_fields.sql` a sincronizat câmpurile vechi → noi, dar structura rămâne plată.
- [ ] Crează migrare `client_guardians (id, client_id, name, phone, email, relationship, is_primary)` + backfill din câmpurile existente + depreciere câmpuri plate (task separat, după stabilizare)

#### C. `therapist_documents` — RLS verificare izolare per-terapeut
- Politica actuală (`therapist full access own documents`) filtrează după `auth.uid() = therapist_id` — corect.
- Dacă se adaugă suport multi-terapeut, trebuie verificat că nu există query-uri fără filtru explicit pe `therapist_id`.
- [ ] Re-verifică RLS pe `therapist_documents` când se adaugă suport multi-terapeut (task viitor)

#### D. Indexuri lipsă pentru interogări frecvente
- `client_status_history` (din migrarea blocată) — verifică că are index pe `(client_id, changed_at DESC)` după aplicare.
- `invoices` — verifică index pe `(therapist_id, status)` pentru filtrele din pagina de facturi.
- [ ] Audit indexuri după aplicarea migrării lifecycle (post-blocker)

### 🟠 Validare cap-la-cap lifecycle (dupa migrare)

- [ ] Testeaza fiecare buton din fisa clientului si confirma ca scrie in `client_status_history`:
  - `Marchează activ` → tranzitie catre `ACTIV` cu `reason` si `changed_by_name`
  - `Marchează inactiv` → tranzitie catre `INACTIV`
  - `Încheie caz` → tranzitie catre `INCHEIAT`
  - `Neconversie` → tranzitie catre `NECONVERSIE`
  - `Reactivează` → tranzitie derivata (sync) catre `ACTIV`
- [ ] Confirma ca sectiunea "Istoric lifecycle" din fisa afiseaza tranzitiile reale cu timestamp si `changed_by_name`
- [ ] Verifica ca fluxurile automate (booking public, onboarding, anonimizare) scriu si ele in istoric (fara `changed_by_name`, ceea ce e corect)

### 🟡 QA functional cap-la-cap

- [ ] **Creare client** — formular complet adult si minor, validare inline, redirect catre fisa
- [ ] **Onboarding adult** — generare link, completare din browser incognito, confirmare status in fisa
- [ ] **Onboarding minor** — generare link minor, completare de catre tutore, confirmare date guardian in fisa
- [ ] **Booking public** — `/book` fara autentificare, confirmare programare, aparitia clientului in registru
- [ ] **Creare programare** — din fisa client si din `/appointments/new`, verificare Google Calendar sync daca e conectat
- [ ] **Marcare sedinta completa** — din SessionDrawer, confirmare tranzitie lifecycle catre `ACTIV`
- [ ] **Emitere factura** — creare + trimitere SmartBill, status `Emisa` vizibil in lista
- [ ] **Upload document** — din fisa client, verificare vizibilitate si link functional
- [ ] **Vault note clinice** — setup PIN, scriere nota, lock/unlock, decriptare corecta
- [ ] **Anonimizare client** — flux complet, confirmare PII sters, status `Anonimizat`

### 🟡 QA accesibilitate si keyboard

- [ ] Verifica focus order pe formularele mari (client, programare)
- [ ] Testeaza keyboard-only navigation in overlay-uri si drawer-uri (Esc, Tab, focus trap)
- [ ] Verifica contrast pe badge-uri de status si mesaje de eroare
- [ ] Testeaza pe mobil (iOS Safari + Android Chrome) fluxurile critice: registru clienti, fisa, programari

### 🟢 Polish si finisare

- [x] Empty states coerente pe toate paginile care pot fi goale la start ✅ (DocumentList + PatientDocuments fixate; restul confirmate complete)
- [x] Mesaje de confirmare (toast) verificate pe toate actiunile destructive si importante (ștergere cheltuieli ✅, schimbare status programare ✅)
- [ ] Separare model `guardian` — campurile plate de pe `clients` (`parent_name`, `parent_phone`, etc.) ar putea fi mutate intr-un subtabel dedicat (task separat, nu blocker)
- [x] Revizie texte UI ✅ — diacritice PASS, CTA-uri PASS, 7 mesaje de eroare generice fixate cu text contextual

### 🔵 Optional / Viitor

- [ ] Notificari email automate la tranzitii lifecycle importante (ex: client trecut in `Inactiv`)
- [ ] Export CSV din istoricul lifecycle pentru audit extern
- [ ] Dashboard cu grafic funnel: Lead → Onboarding → Activ → Incheiat
- [ ] Suport multi-terapeut (RLS deja pregatit, UI si logica de rutare lipsesc)

## Format de actualizare

La fiecare task finalizat:

```md
### N. Titlu task

- Ce s-a facut concret
- Fisiere principale atinse
- Status: `npm run lint` ✅ | `npm run build` ✅
```
### 12. Dashboard refactorizat ca clinical command center

- Am reorganizat `/dashboard` dintr-un dashboard financial-first într-un panou clinic-operațional de dimineață, fără rescriere totală și fără dependențe noi.
- Am înlocuit descrierea generică din `PageHeader` cu o formulare operațională bazată pe date reale: ședințe azi, dosare incomplete și acțiuni de rezolvat.
- Am adăugat CTA-uri vizibile în header:
  - `Client nou`
  - `Pacient minor`
  - `Programare`
- Am introdus componente noi în dashboard:
  - `TodayCommandCenter`
  - `ClinicalAlertsPanel`
  - `DocumentTasksPanel`
  - `ServiceTracksOverview`
  - `AssessmentTasksPanel`
  - `ResearchReadinessPanel`
- Am extins `src/lib/dashboard/queries.ts` cu helper-e reziliente și fallback safe:
  - `getDashboardClinicalAlerts()`
  - `getDashboardDocumentTasks()`
  - `getDashboardServiceTrackStats()`
  - `getDashboardAssessmentTasks()`
  - `getDashboardResearchReadiness()`
- Am mutat financiarul mai jos în pagină și i-am redus tonul vizual, păstrând totuși:
  - `FinancialSummary`
  - `UnpaidInvoices`
- Am păstrat componentele existente care se potriveau deja fluxului clinic:
  - `AppointmentsToday`
  - `UpcomingAppointments`
  - `CompliancePanel`
  - `VaultStatusWidget`
  - `RealtimeDashboard`
- Am adăugat mai mult spațiu de siguranță la baza shell-ului dashboard pe mobil (`pb-24`) pentru a reduce suprapunerea cu `QuickActionsWheel`.

`npm run lint` ✅ | `npm run build` ✅

Fișiere principale:

- [src/app/dashboard/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/page.tsx)
- [src/lib/dashboard/queries.ts](/Users/sch_work/Documents/Oncolink/src/lib/dashboard/queries.ts)
- [src/components/dashboard/TodayCommandCenter.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/TodayCommandCenter.tsx)
- [src/components/dashboard/ClinicalAlertsPanel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/ClinicalAlertsPanel.tsx)
- [src/components/dashboard/DocumentTasksPanel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/DocumentTasksPanel.tsx)
- [src/components/dashboard/ServiceTracksOverview.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/ServiceTracksOverview.tsx)
- [src/components/dashboard/AssessmentTasksPanel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/AssessmentTasksPanel.tsx)
- [src/components/dashboard/ResearchReadinessPanel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/ResearchReadinessPanel.tsx)
- [src/components/dashboard/financial-summary.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/financial-summary.tsx)
- [src/components/dashboard/vault-status-widget.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/vault-status-widget.tsx)
- [src/components/app/page-shell.tsx](/Users/sch_work/Documents/Oncolink/src/components/app/page-shell.tsx)

### 13. Cleanup transversal pentru culori hardcodate în UI

- Am redus hardcodările de culoare din componente vechi și am mutat baza vizuală pe tokenurile sistemului:
  - `bg-card`
  - `bg-background`
  - `bg-muted`
  - `border-border`
  - `text-foreground`
  - `text-muted-foreground`
  - `destructive` doar pentru stări critice
- Am curățat în special zonele care încă păstrau ton vizual prea puternic sau prea “legacy”:
  - `WeeklyCalendar`
  - `week-view`
  - `client-form`
  - `AssessmentDetailOverlay`
  - `SafetyPlanCard`
  - `ContractGeneratorModal`
- Am păstrat culori contextuale doar unde ajută orientarea:
  - risc / siguranță
  - tipuri de locație în calendar
  - stări de succes sau warning

`npm run lint` ✅ | `npm run build` ✅

### 14. Extindere cleanup semantic în onboarding public și raportare

- Am continuat migrarea vizuală și în zonele publice, unde onboarding-ul adult și minor foloseau încă multe accente `rose/amber/slate` ca bază structurală.
- Am mutat shell-urile și cardurile principale pe un limbaj mai calm:
  - `bg-card`
  - `border-border`
  - `bg-muted`
  - `destructive` doar pentru erori reale
- Am actualizat wizard-urile de onboarding astfel încât:
  - erorile să fie coerente semantic
  - warning-urile juridice să rămână clare, dar mai puțin agresive
  - CTA-urile finale să fie aliniate cu tonul produsului
- Am făcut și cleanup în:
  - [src/app/dashboard/billing/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/billing/page.tsx)
  - [src/app/dashboard/review/review-client.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/review/review-client.tsx)
- În aceste pagini am redus gradienturile și accentele “startup”, păstrând diferențierea semantică pentru:
  - succes
  - warning
  - danger
  - info

`npm run lint` ✅ | `npm run build` ✅

### 15. Cleanup semantic și în suprafețele publice rămase

- Am continuat uniformizarea vizuală în:
  - [src/app/legal/declaration/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/legal/declaration/page.tsx)
  - [src/app/confirm-result/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/confirm-result/page.tsx)
  - [src/app/login/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/login/page.tsx)
  - [src/components/booking/booking-widget.tsx](/Users/sch_work/Documents/Oncolink/src/components/booking/booking-widget.tsx)
  - [src/components/booking/BookingForm.tsx](/Users/sch_work/Documents/Oncolink/src/components/booking/BookingForm.tsx)
- Am redus contrastele prea dure și fundalurile legacy, păstrând:
  - warning juridic clar
  - confirmări de succes clare
  - formular de login și booking mai apropiate de același design system
- Cu acest pas, zona publică a produsului este mai bine aliniată la tonul clinic-operațional introdus în dashboard.

`npm run lint` ✅ | `npm run build` ✅
