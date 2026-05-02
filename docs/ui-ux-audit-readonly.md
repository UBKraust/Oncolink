# UI/UX Audit — Ce'ai Pățit? ERP

**Repository:** `UBKraust/Oncolink`  
**Branch:** `Ceai-Patit`  
**Data audit:** 2026-05-02  
**Mod:** read-only, fără modificări de implementare  
**Auditor:** analiză statică completă pe fișierele UI principale

---

## 0. Addendum — după refactorul dashboard-ului din 2026-05-02

Între momentul auditului inițial și starea actuală a branch-ului a fost implementat un refactor important al `/dashboard` către un clinical command center.

### Îmbunătățiri deja vizibile

- dashboard-ul nu mai este financial-first
- `PageHeader` este mai operațional și include CTA-uri directe utile
- există `TodayCommandCenter` ca primă suprafață de lucru
- secțiunile administrative și clinice sunt separate mai clar:
  - `ClinicalAlertsPanel`
  - `DocumentTasksPanel`
  - `ServiceTracksOverview`
  - `AssessmentTasksPanel`
- financiarul a fost mutat mai jos și vizual domolit
- `DashboardPage` are acum mai mult spațiu bottom pe mobil, astfel încât `QuickActionsWheel` să acopere mai greu CTA-uri importante

### Ce rămâne valid din audit

- `QuickActionsWheel` încă are o personalitate prea consumer pentru context clinic
- layeringul / overlay contractul încă merită standardizat
- există în continuare hardcodări de culoare în mai multe zone ale produsului
- fișa clientului rămâne mai încărcată și mai zgomotoasă decât dashboard-ul nou

Acest document rămâne util ca audit structural, dar observațiile despre dashboard trebuie citite acum în cheia: **parțial rezolvate în `/dashboard`, încă deschise în alte suprafețe**.

---

## 1. Executive Summary

Aplicația are o fundație UI/UX solidă: există design system documentat cu tokens OKLCH, layout de dashboard coerent (sidebar + topbar + content), componente shell reutilizabile (`DashboardPage`, `PageHeader`, `SectionCard`, `EmptyState`) și un sistem de accesibilitate funcțional pentru overlay-uri (`useOverlayA11y`). Aceasta nu e o aplicație improvizată.

Problema principală nu este lipsa de structură — ci **pierderea disciplinei de sistem** în zonele care au crescut mai repede decât baza comună. Coexistă actualmente mai multe limbaje vizuale în același produs:

- un dashboard ERP sobru și utilitar (shell, sidebar, session drawer);
- pagini publice mai premium și prietenoase (onboarding, booking);
- overlays simple și funcționale (`SectionDetailOverlay`);
- overlays dramatice, aproape consumer (`ClientDetailOverlay` cu hero dark, glow, gradient);
- un quick actions prea energic pentru contextul clinic (`QuickActionsWheel` cu `Zap`, pulse, `z-[100]`).

**Concluzia generală:** nu este nevoie de redesign total. Este nevoie de unificare, ierarhie mai clară și eliminarea variațiilor vizuale care concurează cu claritatea operațională.

Direcția vizuală recomandată:

> **calm · clinic · administrativ · clar · uman · fără anxietate vizuală**

---

## 2. What Works Well

### Design system real, nu improvizație

Fișierul [`src/app/globals.css`](../src/app/globals.css) conține tokens OKLCH pentru light/dark mode, tipografie, spacing, border-radius, shadows și utilitare globale pentru focus, nav states, scrollbar și animații. Acesta este un fundament excepțional față de media proiectelor similare.

- OKLCH semantic cu `.dark` complet;
- clase utilitare pentru `nav-item-idle`, `nav-item-active`, `focus-ring`;
- scrollbar stilizat consistent;
- animații Tailwind standardizate.

### Shell principal logic și robust

[`src/app/dashboard/layout.tsx`](../src/app/dashboard/layout.tsx) folosește un layout clar: `flex min-h-svh`, sidebar fix, wrapper cu `flex-1 flex-col`, `overflow-auto p-4 md:p-6`. Componentele din [`src/components/app/page-shell.tsx`](../src/components/app/page-shell.tsx) — `DashboardPage`, `PageHeader`, `SectionCard`, `MetricCard`, `ActionCard`, `EmptyState` — oferă o bază bună pentru consistență între pagini.

### Navigație bine grupată

[`src/components/dashboard/nav-groups.ts`](../src/components/dashboard/nav-groups.ts) grupează destinațiile în 4 categorii logice: activitate zilnică, management clienți, financiar/administrativ, legal/configurare. Structura reflectă fluxul real de muncă al unui cabinet.

### Accesibilitate de bază pentru overlay-uri

[`src/components/ui/use-overlay-a11y.ts`](../src/components/ui/use-overlay-a11y.ts) implementează focus trap, Escape close, body scroll lock și focus return la elementul anterior. Este un contract solid și reutilizabil care depășește media aplicațiilor interne.

### Ambiție de produs valoroasă în fișa clientului

[`src/components/clients/ClientDashboardUI.tsx`](../src/components/clients/ClientDashboardUI.tsx) centralizează clinic, administrativ, programări, evaluări, documente, lifecycle și AI într-o singură suprafață. Ca direcție de produs, asta are sens: terapeutul are un singur „cockpit" al relației terapeutice.

### Clients registry cu suport keyboard

[`src/components/clients/ClientsClient.tsx`](../src/components/clients/ClientsClient.tsx) implementează `role="button"`, `tabIndex={0}`, handler pentru Enter/Space pe rânduri. Asta e o decizie bună de accesibilitate care merge dincolo de click-only.

---

## 3. Main UX Risks

### R1 — Supraîncărcare vizuală în fișa clientului

[`ClientDashboardUI.tsx`](../src/components/clients/ClientDashboardUI.tsx) afișează simultan: header cu 3–4 acțiuni primare, status card, next steps, administrative signals, 4 widget cards, lifecycle history, programări, chart, documente, evaluări și AI persistent. Toate par să aibă prioritate egală, utilizatorul nu știe unde să privească prima dată.

**Efect:** pagina pare „control room", nu dosar clinic. Pe mobile devine obositor.

### R2 — Overlay-uri din produse diferite

Cele trei overlays principale transmit tonuri vizuale complet diferite:

- [`SectionDetailOverlay`](../src/components/clients/SectionDetailOverlay.tsx) — sobru, minimalist, alb, header simplu;
- [`SessionDrawer`](../src/components/appointments/SessionDrawer.tsx) — utilitar, compact, tab-uri funcționale;
- [`ClientDetailOverlay`](../src/components/clients/ClientDetailOverlay.tsx) — hero dark gradient, pattern abstract, glow, alert blocks dramatice, footer sticky cu `z-[110]`.

Aceasta creează impresia că sunt din trei produse diferite.

### R3 — QuickActionsWheel prea „consumer" pentru context clinic

Montat global în shell via [`layout.tsx`](../src/app/dashboard/layout.tsx), componenta folosește icon `Zap`, animație pulse, culori puternice și `z-[100]`. Transmite „speed app/gamified", nu calm operațional. Pe pagini cu CTA-uri primare deja existente, creează competiție vizuală.

### R4 — Drift față de design system (culori hardcodate)

Deși tokenurile sunt bune, implementarea recurge frecvent la `bg-slate-50`, `bg-slate-100`, `text-slate-400`, `bg-rose-50`, `bg-blue-50`, `bg-emerald-50/100`, `text-emerald-700`, `bg-amber-50` direct în componente. Asta degradează coerența dark mode și portabilitatea sistemului.

### R5 — Z-index nestandarizat

Layeringul actual este conflict-prone:

- mobile nav: `z-50`
- drawer: `z-50`
- quick actions: `z-[100]`
- overlays client: `z-[110]`

Nu există un contract explicit și overlaps sunt posibile.

---

## 4. Page / Shell Audit

### Ce funcționează

- Layout principal stabil: `flex min-h-svh bg-muted/30` în [`layout.tsx`](../src/app/dashboard/layout.tsx:13);
- `DashboardPage` normalizează `max-w-7xl` și spacing pentru toate paginile — [`page-shell.tsx:5`](../src/components/app/page-shell.tsx);
- `PageHeader` este reutilizabil și bine proporționat — [`page-shell.tsx:18`](../src/components/app/page-shell.tsx);
- shell public separat (`PublicPageShell`, `PublicDocumentShell`) cu ton diferit, corect.

### Probleme

| Problemă | Locație |
|---|---|
| Topbar nu este sticky în implementare (doar `<header>` simplu) | [`topbar.tsx:93`](../src/components/dashboard/topbar.tsx) |
| `QuickActionsWheel` montat global, fără condiții de pagină | [`layout.tsx:35`](../src/app/dashboard/layout.tsx) |
| `demo mode` și `production mode` pot crea experiențe divergente | [`layout.tsx:20`](../src/app/dashboard/layout.tsx) |

### Recomandare

- Decide explicit: topbar sticky (`sticky top-0 z-40`) sau non-sticky documentat;
- Condiționează `QuickActionsWheel` pe rute fără CTA primar major;
- Un singur contract vizual de shell pentru toate paginile dashboard.

---

## 5. Navigation Audit

### Ce funcționează

- 4 grupuri logice bine separate în [`nav-groups.ts`](../src/components/dashboard/nav-groups.ts);
- active/idle states curate în [`sidebar.tsx`](../src/components/dashboard/sidebar.tsx);
- search rapid în topbar cu navigare directă la destinații — [`topbar.tsx:180`](../src/components/dashboard/topbar.tsx).

### Probleme

- Prea multe module cu greutate vizuală egală — modulele de administrare și modulele avansate sunt amestecate;
- Label-uri ambigue sau suprapuse mental:
  - `Registru` — ce registru?
  - `Raportare Lună` vs `Sumar Lunar` — care e diferența?
- `AI`, `Evaluări`, `Documente`, `Vault`, `CAS` concurează cu modulele zilnice.

### Recomandare — 3 straturi mentale

| Strat | Conținut |
|---|---|
| „Ce fac azi?" | Dashboard, Programări, Calendar, Clienți, Note |
| „Administrare" | Facturi, Cheltuieli, Billing, CAS, Compliance, Settings |
| „Avansat/Suport" | AI, Evaluări, Documente, Vault, Research |

Label-uri propuse:
- `Registru` → `Registru activitate`
- `Raportare Lună` → `Financiar lunar`
- `Sumar Lunar` → `Raport clinic lunar`

---

## 6. Card System Audit

### Ce funcționează

- Cardul este unitatea de informație dominantă și corectă;
- `SectionCard` este un pattern bun — [`page-shell.tsx:63`](../src/components/app/page-shell.tsx);
- `MetricCard` și `ActionCard` există în `page-shell.tsx` ca primitive.

### Probleme

Există prea multe variații necontrolate:

| Variație | Impact |
|---|---|
| `rounded-2xl`, `rounded-3xl`, `rounded-[1.75rem]`, `rounded-[2rem]`, `rounded-[2.5rem]` | Zgomot de sistem, lipsă ritm vizual |
| `shadow-sm`, `shadow-xl`, `shadow-2xl`, fără shadow | Ierarhie de suprafețe necoerentă |
| Carduri custom în fiecare componentă mare | Nu derivă dintr-o taxonomie comună |

Locații cu cel mai mare grad de divergență: [`ClientsClient.tsx:208`](../src/components/clients/ClientsClient.tsx), [`ClientDashboardUI.tsx:342`](../src/components/clients/ClientDashboardUI.tsx), [`ClientDetailOverlay.tsx:333`](../src/components/clients/ClientDetailOverlay.tsx).

### Recomandare — 4 tipuri oficiale

| Tip | Folosire |
|---|---|
| `SectionCard` | Secțiuni mari de pagină |
| `MetricCard` | KPI, status, cifre |
| `ActionCard` | Elemente clickabile / navigabile |
| `DataCard` | Liste compacte, informații secundare |

Default radius: `rounded-2xl`. Default shadow: `shadow-sm`. Excepții decorative: doar în public shell.

---

## 7. Overlay / Drawer / Modal Audit

### Ce funcționează

- `useOverlayA11y` este corect, reutilizabil și acoperă contractul complet — [`use-overlay-a11y.ts`](../src/components/ui/use-overlay-a11y.ts);
- `SessionDrawer` este un drawer operațional eficient cu taburi bune — [`SessionDrawer.tsx:125`](../src/components/appointments/SessionDrawer.tsx);
- `SectionDetailOverlay` este o variantă laterală sobră, exemplu de urmat — [`SectionDetailOverlay.tsx:41`](../src/components/clients/SectionDetailOverlay.tsx).

### Probleme

| Problemă | Locație |
|---|---|
| `ClientDetailOverlay` cu hero dark gradient, glow, pattern decorativ | [`ClientDetailOverlay.tsx:229`](../src/components/clients/ClientDetailOverlay.tsx) |
| Z-index conflict: mobile nav `z-50`, drawer `z-50`, quick actions `z-[100]`, overlay client `z-[110]` | multiple |
| Close flow inconsistent: unele cu `router.push`, altele cu `window.location.href` | [`SessionDrawer.tsx:88`](../src/components/appointments/SessionDrawer.tsx), [`ClientDashboardUI.tsx:677`](../src/components/clients/ClientDashboardUI.tsx) |
| Mobile menu din topbar nu reutilizează `useOverlayA11y` | [`topbar.tsx:106`](../src/components/dashboard/topbar.tsx) |

### Recomandare — Contract standard overlay

**API minim:**
```typescript
isOpen: boolean
onClose: () => void
title: string
subtitle?: string
size?: 'sm' | 'md' | 'lg' | 'full'
footer?: React.ReactNode
```

**Layering standard:**

| Nivel | Z-index | Utilizare |
|---|---|---|
| Topbar / dropdown | 40 | Navigare, search |
| Drawer | 50 | Detalii laterale |
| Modal | 60 | Generare, confirmări |
| Dialog critic | 70 | Acțiuni distructive |
| Quick actions | 45 | Sub modal, deasupra content |

**Tipuri de overlay:**
- `DrawerOverlay` — detalii laterale
- `ModalOverlay` — acțiuni, generare, confirmare
- `DangerDialog` — operații critice

---

## 8. Client Dashboard Audit

### Ce funcționează

- Ambiția de a centraliza relația cu clientul este valoroasă ca produs;
- Triada `Status Curent` + `Următorii Pași` + `Semnale Administrative` este o idee bună — [`ClientDashboardUI.tsx:341`](../src/components/clients/ClientDashboardUI.tsx);
- Integrarea programări + documente + evaluări are sens clinic.

### Probleme

Pagina afișează simultan, fără ierarhie clară:

1. Header cu status badges + 3–4 acțiuni
2. Status card + lifecycle badge
3. Next steps actionable
4. Administrative signals
5. 4 widget cards (ședințe, documente, evaluări, AI)
6. Lifecycle history timeline
7. Programări viitoare
8. Chart distribuție
9. Documente
10. Evaluări
11. AI persistent

Toate par să ceară atenție în același timp. AI-ul este permanent vizibil fără să fie clar dacă e workflow primar sau layer asistiv secundar — [`ClientDashboardUI.tsx:673`](../src/components/clients/ClientDashboardUI.tsx).

### Recomandare — Structură progresivă

**Nivel 1 (mereu vizibil):** status client, next best action, semnale critice

**Nivel 2 (tabs mari):**

| Tab | Conținut |
|---|---|
| Overview | KPI rapide, widget summary |
| Clinic | Note, evaluări, acces dosar |
| Programări | Calendar, ședințe viitoare, creare |
| Documente | Contracte, consimțăminte, drive |
| Financiar | Facturi, plăți, istoric |
| Lifecycle | Timeline status, onboarding, compliance |

**Nivel 3 (secundar/collapsible):** AI asistent, crize, detalii risc

---

## 9. Mobile / Responsive Audit

### Ce funcționează

- Sidebar ascuns pe mobile, mobile menu în topbar;
- Clients registry cu fallback pe carduri mobile — [`ClientsClient.tsx:108`](../src/components/clients/ClientsClient.tsx);
- Paginile publice cu grid-uri responsive.

### Riscuri

| Risc | Locație |
|---|---|
| `QuickActionsWheel` poate acoperi conținut și interfiera cu alte overlay-uri | [`QuickActionsWheel.tsx:72`](../src/components/dashboard/QuickActionsWheel.tsx) |
| Fișa clientului este lungă și densă pe mobile, cu header aglomerat | [`ClientDashboardUI.tsx`](../src/components/clients/ClientDashboardUI.tsx) |
| Multiple CTA-uri mari concurează în header pe ecrane mici | [`ClientDashboardUI.tsx:272`](../src/components/clients/ClientDashboardUI.tsx) |

### Recomandare

Pe mobile, fișa clientului trebuie să reducă la:
- status + next action + 1 CTA primar
- restul în secțiuni collapsible sau tabs scroll-abile

`QuickActionsWheel` trebuie ascuns sau repositionat când există un overlay activ.

---

## 10. Accessibility Audit

### Ce funcționează

- Focus trap, focus return, Escape close, scroll lock în `useOverlayA11y` — [`use-overlay-a11y.ts`](../src/components/ui/use-overlay-a11y.ts);
- Keyboard support pe rows în clients registry (Enter/Space) — [`ClientsClient.tsx:73`](../src/components/clients/ClientsClient.tsx);
- `aria-label` pe icon buttons în mai multe locuri.

### Riscuri

| Risc | Locație |
|---|---|
| Mobile menu din topbar nu reutilizează contractul `useOverlayA11y` | [`topbar.tsx:106`](../src/components/dashboard/topbar.tsx) |
| Row-click cu nested action buttons poate crea ambiguitate de focus și click | [`ClientsClient.tsx`](../src/components/clients/ClientsClient.tsx) |
| Animații pulse și culori intense pot produce stres pentru aplicație clinică | [`QuickActionsWheel.tsx`](../src/components/dashboard/QuickActionsWheel.tsx) |

### Concluzie

Accesibilitatea structurală este peste medie. Riscul este că bune practici există în unele overlay-uri și nu în altele — trebuie standardizate, nu duplicat contractul local în fiecare componentă specială.

---

## 11. Dark Mode / Token Audit

### Ce funcționează

- Tokens OKLCH complet pentru light și dark în [`globals.css:6`](../src/app/globals.css);
- Utilitare globale curate pentru focus și nav states — [`globals.css:91`](../src/app/globals.css);
- `bg-background`, `text-foreground`, `bg-muted`, `border` folosite corect în shell.

### Probleme

| Pattern problematic | Exemple de locații |
|---|---|
| `bg-slate-50/100`, `text-slate-400/600` hardcodat | [`ClientsClient.tsx:86`](../src/components/clients/ClientsClient.tsx), [`ClientDashboardUI.tsx:294`](../src/components/clients/ClientDashboardUI.tsx) |
| `bg-rose-50`, `text-rose-700`, `bg-rose-100` | [`ClientDetailOverlay.tsx:310`](../src/components/clients/ClientDetailOverlay.tsx) |
| `bg-emerald-50/100`, `text-emerald-700` | [`ClientDashboardUI.tsx:727`](../src/components/clients/ClientDashboardUI.tsx) |
| `bg-blue-50`, `text-blue-700` | [`SessionDrawer.tsx:412`](../src/components/appointments/SessionDrawer.tsx) |
| `bg-amber-50`, `text-amber-700` | multiple |

Aceste valori nu urmăresc dark mode automat și produc inconsistențe când tema se schimbă.

### Recomandare — Semantic color variants

```
success    → bg/text/border pentru stări pozitive
warning    → bg/text/border pentru atenționări
danger     → bg/text/border pentru erori și critice
info       → bg/text/border pentru informații neutre
neutral    → bg/text/border pentru stări secundare
clinical   → ton clinic specific (diferit de admin)
admin      → ton administrativ/financiar
```

Migrarea nu trebuie să fie totală dintr-o dată — important e că direcția e clară și nu se mai adaugă culori hardcodate.

---

## 12. Prioritized Recommendations

### P0 — Must Fix

1. **Standardizează overlay-urile** — un singur contract vizual și tehnic pentru `DrawerOverlay`, `ModalOverlay`, `DangerDialog`; același header, spacing, close button, footer, z-index.
2. **Calmează sau condiționează `QuickActionsWheel`** — icon `Plus` în loc de `Zap`, fără pulse, culori neutre, ascuns pe pagini cu CTA primar.
3. **Standardizează z-index layering** — un singur fișier de constante; elimină conflictele între mobile nav, drawer și overlay client.
4. **Uniformizează close behavior** — toate overlay-urile și drawer-ele folosesc `router.push` sau callback `onClose`; zero `window.location.href` în componente UI.
5. **Reorganizează fișa clientului** — 3 niveluri: (1) status + next action, (2) tabs mari, (3) AI/secondary.

### P1 — Should Improve

1. Reierarhizează navigația vizual pe cele 3 straturi mentale (zilnic / admin / avansat).
2. Clarifică label-urile ambigue din sidebar.
3. Mută acțiunile secundare din clients registry în meniu `...`.
4. Definește explicit rolul AI în fișa clientului: persistent, contextual sau on-demand.
5. Decide și documentează topbar sticky vs. non-sticky și aplică uniform.
6. Adaugă filtre reale în clients list (status, minor/adult, GDPR lipsă, onboarding incomplet).

### P2 — Polish

1. Reutilizează `useOverlayA11y` și pentru mobile menu din topbar.
2. Auditează touch targets și overlap-uri `QuickActionsWheel` + overlay pe mobile.
3. Uniformizează shadow/radius defaults: `rounded-2xl` și `shadow-sm` ca default, excepții justificate explicit.
4. Migrează treptat culorile hardcodate spre semantic color variants.
5. Redu animațiile pulsante și accentele care transmit urgență fără nevoie.
6. Verifică keyboard-only end-to-end: tabel clients → row → overlay → acțiune → close → return focus.

---

## 13. Suggested Component Standardization Plan

### Shell

```
DashboardLayout       → sidebar + topbar sticky + content scroll
DashboardPage         → max-w-7xl, spacing uniform
PageHeader            → titlu + subtitle + actions slot
QuickActionsMenu      → Plus icon, meniu vertical, condiționat contextual
```

### Cards

```
SectionCard           → secțiuni mari de pagină, border + bg-card
MetricCard            → KPI/status, cifre, titlu, trend
ActionCard            → card clickabil cu icon + value + badge + trailing
DataCard              → liste compacte, informație secundară
```

### Overlays

```
DrawerOverlay         → lateral (right/left), isOpen + onClose + title + footer
ModalOverlay          → centrat, acțiuni + generare + confirmare
DangerDialog          → dialog critic, red accent, confirmare explicită
```

Toate cu: același header height, același close control (X), același spacing intern, același footer pattern, același z-index din tabelul standard.

### Semantic styling

```
success   → bg-success/10 text-success border-success/20
warning   → bg-warning/10 text-warning border-warning/20
danger    → bg-danger/10 text-danger border-danger/20
info      → bg-info/10 text-info border-info/20
neutral   → bg-muted text-muted-foreground
```

Nicio componentă dashboard nu mai folosește `slate`, `rose`, `emerald`, `blue` hardcodat — doar token semantic sau culori decorative strict în public shell.

---

## Concluzie finală

Produsul transmite substanță și direcție clară. Nu arată ca un prototip fragil. Problema este că unele module au crescut cu propria personalitate vizuală în loc să urmeze baza comună.

**Nu este nevoie de redesign total. Este nevoie de disciplină de sistem.**

Ordinea logică de intervenție, după refactorul dashboard-ului: overlay standardization → z-index cleanup → QuickActions calm → client dashboard restructure → semantic colors migration.
