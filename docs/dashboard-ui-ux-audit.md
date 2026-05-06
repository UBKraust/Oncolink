# Dashboard UI/UX Audit — navbar, dashboard, fișa clientului

**Data:** 2026-05-06  
**Status:** audit salvat, backlog UI/UX pregătit  
**Scope:** `/dashboard`, navbar, search, acțiuni rapide, listă clienți, fișa clientului, flow listă → client → acțiune → revenire

---

## 1. Ce este deja închis

### Taskuri completate anterior

- [x] audit log fazele `P0 + P1 + P2` implementate și documentate în `docs/audit-log-plan.md`
- [x] refactorul principal pentru `/dashboard` către modelul `Clinical Command Center`
- [x] panouri operaționale dedicate:
  - `TodayCommandCenter`
  - `ClinicalAlertsPanel`
  - `DocumentTasksPanel`
  - `ServiceTracksOverview`
- [x] context clinic mai aproape de punctul de lucru:
  - `AppointmentsToday`
  - `SessionDrawer`
  - `ClientDashboardUI`
- [x] audit static UI/UX complet pentru dashboard, navbar și flow-ul fișei clientului

### Suprafețe auditate acum

- [x] `src/app/dashboard/page.tsx`
- [x] `src/components/dashboard/nav-groups.ts`
- [x] `src/components/dashboard/sidebar.tsx`
- [x] `src/components/dashboard/topbar.tsx`
- [x] `src/components/dashboard/TodayCommandCenter.tsx`
- [x] `src/components/dashboard/QuickActionsWheel.tsx`
- [x] `src/components/dashboard/ClinicalAlertsPanel.tsx`
- [x] `src/components/dashboard/DocumentTasksPanel.tsx`
- [x] `src/components/dashboard/ServiceTracksOverview.tsx`
- [x] `src/components/clients/ClientsClient.tsx`
- [x] `src/components/clients/ClientDashboardUI.tsx`
- [x] `src/app/dashboard/clients/[id]/page.tsx`

---

## 2. Auditul propriu-zis

## F1. Nu există un flux unic de lucru pe dashboard

Dashboard-ul are prea multe sisteme paralele de acțiune:

- CTA-uri în header
- `TodayCommandCenter`
- `QuickActionsWheel`
- CTA-uri în panourile tematice
- `DashboardSecondaryTabs`

Efectul este că utilizatorul trebuie să decidă mai întâi unde lucrează, nu ce rezolvă. Pentru un dashboard operațional, ordinea corectă este inversă.

Referințe:
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/TodayCommandCenter.tsx`
- `src/components/dashboard/QuickActionsWheel.tsx`
- `src/components/dashboard/DashboardSecondaryTabs.tsx`

## F2. Aceeași muncă apare în mai multe locuri

Conceptul de lucru zilnic este duplicat:

- programul zilei în `TodayCommandCenter`
- suprafață separată în `appointments-today`
- programări viitoare în taburi locale

Asta fragmentează trierea și scade încrederea că utilizatorul se uită în locul corect.

Referințe:
- `src/components/dashboard/TodayCommandCenter.tsx`
- `src/components/dashboard/appointments-today.tsx`
- `src/components/dashboard/DashboardSecondaryTabs.tsx`

## F3. Multe CTA-uri duc spre liste generale, nu spre rezolvarea exactă

Exemple:

- alerta clinică trimite în `compliance`, nu la itemul concret
- următoarea programare duce în lista de programări, nu direct în programarea respectivă
- unele acțiuni rapide deschid o pagină intermediară, nu flow-ul de creare

Asta introduce retriere manuală după click și slăbește eficiența.

Referințe:
- `src/components/dashboard/ClinicalAlertsPanel.tsx`
- `src/components/dashboard/TodayCommandCenter.tsx`
- `src/components/dashboard/QuickActionsWheel.tsx`

## F4. Prea multe suprafețe sunt state locale, nu destinații reale

`TodayCommandCenter`, `DashboardSecondaryTabs`, `ServiceTracksOverview` și subsecțiunile din fișa clientului sunt în mare parte locale. Consecințe:

- refresh-ul pierde context
- link-urile directe lipsesc
- back button nu reflectă starea de lucru
- colaborarea între oameni devine mai grea

Referințe:
- `src/components/dashboard/TodayCommandCenter.tsx`
- `src/components/dashboard/DashboardSecondaryTabs.tsx`
- `src/components/dashboard/ServiceTracksOverview.tsx`
- `src/components/clients/ClientDashboardUI.tsx`

## F5. Search-ul global este doar un jump-to-route limitat

Topbar search indexează doar `dashboardNavGroups`. Nu caută:

- taskuri
- widgeturi
- alerte
- acțiuni rapide
- clienți

Pentru utilizator, pare command palette, dar în practică este doar un shortcut către pagini.

Referințe:
- `src/components/dashboard/topbar.tsx`
- `src/components/dashboard/nav-groups.ts`

## F6. `QuickActionsWheel` are contract UX inconsistent

Probleme:

- dispare pe pagini unde ar fi foarte util
- numele promite acțiuni instant, dar unele duc în pagini generale
- adaugă încă un strat concurent de CTA peste header și panouri

Nu este clar dacă trebuie să fie:

- launcher global permanent
- fallback pe mobil
- meniu contextual doar în anumite pagini

Referințe:
- `src/components/dashboard/QuickActionsWheel.tsx`
- `src/app/dashboard/layout.tsx`

## F7. Fișa clientului are încă două modele concurente

Lista de clienți deschide în principal overlay, dar există și pagină dedicată. Asta rupe modelul mental al utilizatorului și face flow-ul instabil:

- uneori lucrezi într-o suprafață temporară
- alteori într-un workspace real
- refresh, share și revenire nu sunt previzibile

Referințe:
- `src/components/clients/ClientsClient.tsx`
- `src/components/clients/ClientDetailOverlay.tsx`
- `src/app/dashboard/clients/[id]/page.tsx`

## F8. Fișa clientului nu este suficient de URL-driven

Subsecțiunile importante sunt controlate prin state local. În plus, taburile mari apar relativ târziu în pagină. Efect:

- structură greu de învățat
- deep-linking slab
- scroll mare înainte de intrarea în zona de lucru

Referințe:
- `src/components/clients/ClientDashboardUI.tsx`

## F9. Lista de clienți nu ajută suficient la triere operațională

Filtrarea actuală este prea subțire pentru munca reală. Lipsesc filtre utile pentru:

- onboarding incomplet
- contract lipsă
- minor
- documente lipsă
- risc
- lifecycle
- blocaje administrative

Astfel, dashboard-ul semnalizează probleme, dar registrul de clienți nu ajută suficient la rezolvarea lor în lot.

Referințe:
- `src/components/clients/ClientsClient.tsx`

## F10. Taxonomia este mixtă între română, engleză și termeni concurenți

Exemple actuale:

- `Clinical & Legal Alerts`
- `TodayCommandCenter`
- `Overview`
- `Lifecycle`
- `Cabinet`
- `Fișe & Rapoarte`

Această mixtură încetinește onboarding-ul mental și face mai grea memorarea produsului.

Referințe:
- `src/components/dashboard/ClinicalAlertsPanel.tsx`
- `src/components/dashboard/DashboardSecondaryTabs.tsx`
- `src/components/clients/ClientDashboardUI.tsx`

---

## 3. Ce urmează

## P0 — de făcut prima dată

- [x] Alege un singur model principal pentru fișa clientului:
  - pagina dedicată este acum intrarea principală din registrul de clienți
  - overlay-ul nu mai este punctul implicit de acces din listă
- [x] Mută navigația majoră din fișa clientului în URL:
  - `overview`
  - `clinic`
  - `appointments`
  - `lifecycle`
  - overlay-urile secundare și evaluările păstrează acum contextul de view în query string
- [x] Redu dashboard-ul la un singur flux operațional primar:
  - `Ce urmează acum`
  - `Ce este blocat`
  - `Unde intru ca să rezolv`
  - dashboard home este acum reorganizat în:
    - `Ce Urmează Acum`
    - `Ce Blochează`
    - `Rezolvare Pe Flux`
    - `Batch Work`
- [x] Înlocuiește CTA-urile generale cu deep links către itemuri concrete
  - alertele și taskurile cheie duc acum spre:
    - cohortă filtrată în registrul de clienți
    - evaluare specifică în fișa clientului
    - view clinic direct, unde există contextul de lucru
- [x] Decide contractul final pentru `QuickActionsWheel`:
  - fallback contextual pentru creare rapidă
  - ascuns pe dashboard home și în workspace-urile unde există deja CTA-uri dominante
  - păstrează doar acțiuni care deschid direct un flow real de creare

## P1 — imediat după

- [ ] Transformă topbar search într-un command palette real
- [ ] Adaugă filtre operaționale puternice în registrul de clienți
- [ ] Mută taburile mari din fișa clientului mai sus în pagină
- [ ] Curăță header-ul fișei clientului și elimină CTA-urile duplicate
- [ ] Unifică terminologia în română pentru dashboard și fișa clientului

### Îmbunătățire aplicată după P0

- [x] Dashboard home nu mai afișează toate blocurile într-un stack lung
- [x] A fost introdus un model de workspace cu 3 moduri:
  - `Azi`
  - `Flux clinic`
  - `Operațional`
- [x] Workspace-ul activ este controlat prin query string:
  - `/dashboard`
  - `/dashboard?workspace=flow`
  - `/dashboard?workspace=ops`
- [x] Cardurile de sumar au devenit și puncte de navigație, nu doar KPI-uri pasive
- [x] Workspace-urile `Azi`, `Flux clinic` și `Operațional` folosesc acum aceeași compoziție UI
- [x] Fișa clientului are taburi mari în aceeași familie vizuală cu dashboard-ul
- [x] Taburile mari din fișa clientului schimbă local contextul și nu mai reîncarcă toată pagina
- [x] Overlay-urile din fișa clientului sunt locale, cu URL sincronizat și tranziții animate

## P2 — polish și consolidare

- [ ] Normalizează toate suprafețele locale care merită rute dedicate
- [ ] Introdu o ierarhie unică de severitate pentru alerte și taskuri
- [ ] Leagă toate panourile de aceeași logică:
  - urgent
  - azi
  - în curând
  - informativ
- [ ] Standardizează pattern-ul:
  - alertă
  - motiv
  - impact
  - CTA direct
- [x] Elimină senzația de reload în fișa clientului:
  - taburile mari sunt client-side
  - cardurile din `Sumar` deschid overlay-uri locale
  - evaluările din `Clinic` deschid local `AssessmentDetailOverlay`
  - `SectionDetailOverlay` are acum animație de intrare / ieșire și backdrop blur progresiv

---

## 4. Propunere de redesign pe scurt

### Dashboard

Dashboard-ul ar trebui să fie organizat în 3 întrebări:

1. Ce am de făcut acum?
2. Ce este blocat sau riscant?
3. Ce lucru pot rezolva în batch?

### Navbar + search

Navbar-ul ar trebui să fie strict despre destinații reale, iar search-ul despre:

- navigare
- clienți
- comenzi
- taskuri

### Fișa clientului

Fișa clientului ar trebui să devină workspace-ul stabil al cazului, cu:

- URL clar
- subsecțiuni linkable
- un singur header de acțiuni
- overview mai scurt
- zona de lucru mai sus

---

## 5. Ordinea recomandată de implementare

1. Stabilizare model fișă client: pagină principală + overlay doar preview
2. URL state pentru subsecțiunile clientului
3. Refactor dashboard home către un singur command flow
4. Decizie finală pentru `QuickActionsWheel`
5. Command palette real + filtre operaționale în lista de clienți
6. Unificare terminologie și polish vizual

---

## 6. Concluzie

Produsul nu are nevoie de redesign total. Are nevoie de disciplină de flow și de o arhitectură mai clară între:

- navigare globală
- acțiune imediată
- workspace pe client

Problema principală nu este lipsa de funcții, ci faptul că aceeași muncă este reprezentată în prea multe suprafețe concurente. Dacă reducem aceste ramificații, dashboard-ul și fișa clientului pot deveni mult mai rapide, mai calme și mai previzibile.
