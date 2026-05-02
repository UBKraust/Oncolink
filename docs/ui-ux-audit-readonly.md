# UI/UX Audit Read-Only

Repository: `UBKraust/Oncolink`  
Branch context: `Ceai-Patit`  
Mode: audit only, no implementation changes

## Implementation Rollout

Status legend:

- `done`
- `in progress`
- `pending`

### Task Board

| Task | Status | Notes |
|---|---|---|
| 1. Add implementation rollout plan and progress tracking | `done` | This section is now the working journal for UI/UX cleanup |
| 2. Refine dashboard shell and quick actions | `done` | Topbar is sticky, mobile nav uses the shared overlay a11y contract, quick actions are calmer and route-aware |
| 3. Standardize overlay layering and close behavior | `done` | Client overlays now share calmer layering and client section close flows no longer rely on `window.location.href` |
| 4. Continue with client dashboard simplification pass | `done` | Client dashboard now keeps top signals visible and moves heavier sections into workspace tabs |
| 5. Standardize semantic colors and cards in client registry surfaces | `done` | KPI cards, search/action shell, mobile cards, and table wrappers now align more closely with the shared system |
| 6. Continue semantic cleanup in client detail overlay | `done` | Status chips, legal/info blocks, alert surfaces, and destructive actions now sit closer to shared semantic and surface patterns |
| 7. Extract shared metric and action card primitives | `done` | Repeated KPI and click-surface patterns now have shared shell primitives and are already applied in client-facing areas |
| 8. Extend shared card primitives into remaining client summary surfaces | `done` | Assessment summaries and adjacent repeated client cards now reuse the same shell primitives instead of staying custom |
| 9. Final polish pass | `done` | Navigation correctness, remaining client header semantics, and light appointments/admin alignment are now in place |
| 10. Secondary alignment pass for appointments/dashboard support surfaces | `done` | Remaining older-style toggles, appointment rows, and sidebar/dashboard helper surfaces are now visually closer to the shared system |
| 11. Standardize billing and compliance surfaces | `done` | Financial summary, bulk invoicing, forecast, and compliance rule cards now sit closer to shared primitives and semantic badges |
| 12. Standardize monthly review surfaces | `done` | KPI summaries, financial health, chart area, compliance alerts, and AI recap now align with shared card primitives and calmer semantics |
| 13. Align assessments, AI, and settings entry surfaces | `done` | Secondary dashboard pages now use calmer status, chip, and error surfaces closer to the shared system |
| 14. Align visible vault surfaces | `done` | Expiry badges, archive cards, and upload modal states now match the calmer semantic/dashboard language |
| 15. Clean deeper settings and import support surfaces | `done` | Settings tabs, legacy accent cards, and import feedback states now use calmer shared shells and semantic treatment closer to the rest of the dashboard |
| 16. Align secondary compliance, expenses, CAS, and documents surfaces | `done` | Support panels now reuse calmer headers, badge semantics, and less bespoke accent treatment across compliance, document generation, expense filtering, and referral upload |
| 17. Align onboarding and patient document support flows | `done` | Minor onboarding, patient document upload, and assessment support states now use calmer alert/success shells and less bespoke emphasis |
| 18. Align contextual AI assistant surface | `done` | The client-side AI drawer now matches the calmer dashboard language instead of keeping a separate consumer-style visual tone |
| 19. Align remaining assessment and crisis support surfaces | `done` | Test execution, client financial drilldown, and crisis note surfaces now use calmer shells and semantic feedback closer to the shared system |
| 20. Align CAS registry and remaining client detail overlays | `done` | CAS registry tables and the remaining medical/financial client overlays now use calmer card, empty-state, and semantic surface treatment |
| 21. Final support-surface polish sweep | `done` | The last small Drive, assessment-builder, and crisis-detail utility surfaces now sit on the same calmer shell language as the rest of the dashboard |
| 22. Micro-finish on residual utility overlays and buttons | `done` | Remaining small crisis/contact/section-title utility surfaces now follow the same calmer shell and control treatment |

### Progress Log

#### 2026-05-02

- Completed task 1 by adding a tracked rollout section inside this document.
- Completed task 2 with three shell-level improvements:
- `DashboardTopbar` is now sticky and uses the same overlay accessibility hook as the rest of the app.
- `QuickActionsWheel` was converted into a calmer `Quick Add` pattern with lower visual pressure and safer visibility rules.
- Quick actions are now hidden on dense client/appointment routes where primary CTAs already exist.
- Completed task 3 with overlay-level cleanup:
- `SectionDetailOverlay` and `ClientDetailOverlay` now use calmer shared surfaces and standardized modal layering.
- Client detail section overlays now close through router navigation instead of `window.location.href`.
- Client detail overlay header/footer were toned down to better match the rest of the dashboard system.
- Validation: targeted ESLint run passed on all modified UI files.
- Completed task 4 with a first simplification pass on the client dashboard:
- The top decision layer remains visible: status, next steps, and administrative signals.
- Heavier content is now split into workspace tabs: `Overview`, `Clinic`, `Programări`, `Lifecycle`.
- This reduces immediate competition between lifecycle history, appointments, charts, evaluations, documents, and AI.
- Validation: targeted ESLint run passed for the updated client dashboard component.
- Current focus: semantic color cleanup and card standardization in client registry and related summary surfaces.
- Completed task 5 in the client registry area:
- KPI cards now use a more consistent card shell and toned semantic icon treatments.
- Search/action shell, mobile client cards, and desktop table wrapper now align more closely with shared card surfaces.
- Several custom chips were replaced or normalized toward shared badge variants like `success`, `warning`, and `info`.
- Validation: targeted ESLint run passed for `ClientsPage` and `ClientsClient`.
- Current focus: continue semantic cleanup inside `ClientDetailOverlay`, where the highest concentration of hardcoded accent styling still remains.
- Completed task 6 inside `ClientDetailOverlay`:
- Header status chips now lean on shared badge variants instead of custom high-contrast pills.
- Contact, stats, legal, timeline, and destructive alert surfaces were moved closer to token-based muted/semantic backgrounds.
- Destructive actions now read more consistently with the rest of the dashboard instead of using a separate dramatic style language.
- Validation: targeted ESLint run passed for `ClientDetailOverlay`.
- Current focus: extract shared `MetricCard` and `ActionCard` primitives, then apply them to repeating patterns in KPI and appointment/widget surfaces.
- Completed task 7 by extracting shared primitives:
- `MetricCard` now handles repeated KPI/status card structure.
- `ActionCard` now handles repeated click-through summary surfaces with icon, value, subtitle, badge, and trailing affordance.
- These primitives were applied in `ClientsPage` KPI cards and client dashboard widget cards.
- Appointment rows in the client dashboard were also normalized further toward shared semantic badge usage.
- Validation: targeted ESLint run passed for `page-shell.tsx`, `ClientsPage`, and `ClientDashboardUI`.
- Current focus: extend the same primitives into assessment summaries and the remaining repeated client-facing card patterns.
- Completed task 8 by extending primitive usage further:
- `ActionCard` now supports richer content and footer zones, not only simple widget summaries.
- `AssessmentCard` in the client dashboard now reuses the same shell primitive instead of keeping a separate custom structure.
- This reduces the number of bespoke card layouts in the same user-facing area and strengthens consistency.
- Validation: targeted ESLint run passed for `page-shell.tsx` and `ClientDashboardUI`.
- Final polish pass started.
- Completed subtask: `ActionCard` now uses Next.js `Link` instead of plain anchor navigation, so shared dashboard cards follow the same router contract as the rest of the app.
- Completed subtask: client dashboard header chips now use shared semantic badge variants instead of remaining custom accent pills.
- Completed subtask: appointments/admin surfaces received a light alignment pass, especially filter pills and the configuration area inside `SessionDrawer`.
- Validation: targeted ESLint run passed for `page-shell.tsx`, `ClientDashboardUI`, `appointments/page.tsx`, and `SessionDrawer`.
- Final state: the main UX debt identified in the original audit has been addressed through one focused standardization wave without a full redesign.
- Completed task 10 with a secondary support-surface alignment pass:
- `AppointmentsViewManager` toggle now uses the same muted/card surface language as the rest of the dashboard.
- `dashboard/appointment-row` now relies on shared badge semantics and calmer card surfaces.
- Sidebar legal footer links and dashboard helper banners were aligned more closely with token-driven colors and dark-mode behavior.
- Validation: targeted ESLint run passed for `AppointmentsViewManager`, `dashboard/appointment-row`, `sidebar`, and `dashboard/page`.
- Current state: the UI/UX cleanup now covers both the main client flows and the most visible support surfaces around them.
- Completed task 11 with a first broader dashboard-page pass:
- `billing/page` now reuses `MetricCard` and `SectionCard` for KPI, collection progress, bulk invoicing, and forecast areas instead of relying on separate custom shells.
- Billing status chips now use shared badge variants, and the main financial table sits on calmer token-driven surfaces with less ad-hoc emphasis.
- `compliance/page` rule cards now use the same rounded surface language and semantic badges for `CRITICAL` and `WARNING` severity.
- Validation: targeted ESLint run passed for `billing/page.tsx` and `compliance/page.tsx`.
- Completed task 12 in the monthly review area:
- `review/review-client` now reuses `MetricCard` and `SectionCard` for KPI summaries, financial health, weekly distribution, compliance alerts, and the AI executive summary.
- The review page keeps its informational richness, but the loudest ad-hoc color blocks were replaced by calmer shared surfaces and badge semantics.
- Validation: targeted ESLint run passed for `review/review-client.tsx`.
- Completed task 13 across secondary dashboard pages:
- `assessments/page` now uses calmer token-based label and score treatments instead of leftover `slate` accents.
- `ai/page` now uses shared semantic badges and calmer chat/error/prompt surfaces while preserving the local-assistant workflow.
- `settings/page` now renders load failures through the same `SectionCard` language instead of a one-off warning box.
- Validation: targeted ESLint run passed for `assessments/page.tsx`, `ai/page.tsx`, and `settings/page.tsx`.
- Completed task 14 in the vault area:
- `VaultClient` expiry states now use shared semantic badge variants instead of bespoke orange/emerald treatments.
- Document cards and upload modal surfaces were toned down toward the same border/background language as the rest of the dashboard.
- Upload success and error states now read more consistently with the shared semantic system.
- Validation: targeted ESLint run passed for `VaultClient.tsx`.
- Completed task 15 with a deeper settings/import support pass:
- `SettingsClient` now relies more consistently on shared card shells, calmer semantic badges, and standard footer/action treatment across tabs.
- Legacy accent-heavy panels in `Security`, `CAS`, and the SmartBill import entry were toned down toward the shared dashboard language.
- `ImportDashboard` upload, success, and error states now sit on calmer token-driven surfaces instead of older utility styling.
- Validation: targeted ESLint run passed for `SettingsClient.tsx` and `ImportDashboard.tsx`.
- Completed task 16 across another support-surface wave:
- `CompliancePanel` now leans more consistently on shared badge semantics and calmer card/header shells instead of bespoke severity pills and noisier status framing.
- `DocumentList`, `ExpensesClient`, and `ReferralUploader` now use the same calmer header/surface treatment as the rest of the dashboard.
- Success and error states in CAS referral upload were toned down toward the shared semantic system while preserving operational clarity.
- Validation: targeted ESLint run passed for `document-list.tsx`, `CompliancePanel.tsx`, `ExpensesClient.tsx`, and `ReferralUploader.tsx`.
- Completed task 17 across onboarding and patient-document support flows:
- `MinorOnboardingWizard` now uses calmer shared alert/success shells instead of harsher accent framing in the legal and consent steps.
- `PatientDocuments` upload and missing-document states now sit closer to the shared dashboard card language.
- `AssessmentDetailOverlay` success and email action states were toned down toward the same semantic surface treatment.
- Validation: targeted ESLint run passed for `MinorOnboardingWizard.tsx`, `PatientDocuments.tsx`, and `AssessmentDetailOverlay.tsx`.
- Completed task 18 in the contextual AI area:
- `ClientAiAssistant` floating trigger, drawer header, empty state, chat bubbles, error surface, and composer now align more closely with the calmer dashboard and dedicated AI page language.
- The assistant still reads as an interactive tool, but no longer looks like a separate consumer micro-product inside the client file.
- Validation: targeted ESLint run passed for `ClientAiAssistant.tsx`.
- Completed task 19 across another small support-surface pass:
- `TestExecutionForm` now uses calmer result, AI-interpretation, and success/error shells instead of older accent-heavy utility styling.
- `ClientFinancialHistory` transaction drilldown and summary cards now sit closer to the shared card/header language.
- `CrisisNotesList` now uses the same calmer header and note-surface treatment as the rest of the dashboard support modules.
- Validation: targeted ESLint run passed for `TestExecutionForm.tsx`, `ClientFinancialHistory.tsx`, and `CrisisNotesList.tsx`.
- Completed task 20 across CAS and the remaining client detail overlays:
- `CasModuleUI` registry tables now use the same calmer table-card treatment as the rest of the dashboard support pages.
- `FinancialDetailOverlay` and `MedicalDetailOverlay` no longer use separate dramatic accent blocks and now sit closer to the shared overlay/card language.
- Validation: targeted ESLint run passed for `CasModuleUI.tsx`, `FinancialDetailOverlay.tsx`, and `MedicalDetailOverlay.tsx`.
- Completed task 21 in a final support-surface polish sweep:
- `ClientDriveDocuments` now uses the same calmer card, empty-state, and file-row treatment as the other document surfaces.
- `TestBuilderForm` question and subscale shells were tightened slightly toward the shared card language.
- `CrisisNotesDetailOverlay` no longer relies on bespoke dramatic accent blocks and now sits closer to the standard overlay/support treatment.
- Validation: targeted ESLint run passed for `ClientDriveDocuments.tsx`, `TestBuilderForm.tsx`, and `CrisisNotesDetailOverlay.tsx`.
- Completed task 22 in a final micro-finish pass:
- `CrisisNoteButton` modal and control chips now sit closer to the same calm modal/surface language used elsewhere.
- `PersonalInfoOverlay` section headers were normalized further toward shared muted dividers/titles.
- Validation: targeted ESLint run passed for `PersonalInfoOverlay.tsx`, `CrisisNoteButton.tsx`, and `ClientDriveDocuments.tsx`.
- Current focus: the visible cleanup wave is complete; remaining changes would be true one-off micro-tweaks only.

## 1. Executive Summary

Aplicația are o fundație UI/UX bună: există design system documentat, shell de dashboard coerent, pattern-uri de accesibilitate pentru overlay-uri și o separare clară între public shell și dashboard shell. Nu pare un produs improvizat.

Problema principală nu este lipsa de structură, ci pierderea disciplinei de sistem în zonele care au crescut mai repede decât baza comună. În acest moment coexistă mai multe limbaje vizuale:

- un dashboard ERP sobru și utilitar;
- pagini publice mai premium și prietenoase;
- overlays funcționale simple;
- overlay-uri și quick actions mult mai expresive, aproape consumer.

Concluzia generală: aplicația nu are nevoie de redesign total. Are nevoie de unificare, ierarhie mai clară și reducerea variațiilor vizuale care concurează cu claritatea operațională.

## 2. What Works Well

### Design system real

Există tokens OKLCH pentru light/dark mode, tipografie, radius, spacing și utilitare globale în [globals.css](/Users/sch_work/Documents/Oncolink/src/app/globals.css:6). Asta oferă o bază foarte bună pentru scalare și întreținere.

### Shell principal sănătos

Dashboard-ul folosește un layout logic, cu sidebar, topbar și conținut scrollabil în [layout.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/layout.tsx:27). `DashboardPage`, `PageHeader`, `SectionCard`, `EmptyState` și `SetupBanner` din [page-shell.tsx](/Users/sch_work/Documents/Oncolink/src/components/app/page-shell.tsx:5) sunt componente bune pentru consistență.

### Navigație bine grupată

Structura din [nav-groups.ts](/Users/sch_work/Documents/Oncolink/src/components/dashboard/nav-groups.ts:21) este intuitivă și acoperă bine aria produsului: activitate zilnică, management clienți, financiar și legal/configurare.

### Accesibilitate de bază pentru overlay-uri

`useOverlayA11y` din [use-overlay-a11y.ts](/Users/sch_work/Documents/Oncolink/src/components/ui/use-overlay-a11y.ts:28) implementează focus trap, Escape close, body scroll lock și focus return. Este o fundație foarte bună și peste media multor aplicații interne.

### Ambiție de produs bună în fișa clientului

Fișa clientului centralizează clinic, administrativ, programări, evaluări, documente și lifecycle în [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:272). Ca direcție de produs, asta e valoroasă și potrivită pentru un cabinet care vrea un „cockpit” unificat.

## 3. Main UX Risks

### Supraîncărcare vizuală în fișa clientului

Fișa clientului concentrează prea multe elemente cu prioritate aparent egală: status, next steps, administrative signals, widget cards, lifecycle history, programări, chart, documente, evaluări și AI în aceeași suprafață principală, vezi [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:341), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:486), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:519), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:565), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:630), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:673).

Efectul UX este că utilizatorul trebuie să decidă singur unde se uită prima dată.

### Inconsistență între overlay-uri

`SectionDetailOverlay` este sobru și sistemic în [SectionDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/SectionDetailOverlay.tsx:41), `SessionDrawer` este utilitar în [SessionDrawer.tsx](/Users/sch_work/Documents/Oncolink/src/components/appointments/SessionDrawer.tsx:125), iar `ClientDetailOverlay` este dramatic, cu hero dark, glow-uri, alert blocks puternice și footer sticky în [ClientDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDetailOverlay.tsx:208). Acestea nu mai par variații ale aceluiași pattern.

### Quick actions prea puternic vizual pentru contextul clinic

`QuickActionsWheel` este montat global în shell și folosește `Zap`, pulse, culori tari și `z-[100]`, vezi [layout.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/layout.tsx:35) și [QuickActionsWheel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/QuickActionsWheel.tsx:72). Pentru un ERP clinic-administrativ, componenta transmite mai degrabă „speed tool” sau „consumer app” decât calm operațional.

### Drift față de design system

Deși baza de tokens e bună, implementarea reală folosește des culori și forme hardcodate. Se vede foarte clar în [ClientsClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientsClient.tsx:86), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:294), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:727), [ClientDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDetailOverlay.tsx:310), [SessionDrawer.tsx](/Users/sch_work/Documents/Oncolink/src/components/appointments/SessionDrawer.tsx:412).

## 4. Page/Shell Audit

### Ce funcționează

- layout-ul principal este clar și robust în [layout.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/layout.tsx:27);
- `DashboardPage` normalizează lățimea și spacing-ul în [page-shell.tsx](/Users/sch_work/Documents/Oncolink/src/components/app/page-shell.tsx:5);
- `PageHeader` este reutilizabil și bine proporționat în [page-shell.tsx](/Users/sch_work/Documents/Oncolink/src/components/app/page-shell.tsx:18);
- paginile publice au un shell separat și un ton mai cald, vezi [page.tsx](/Users/sch_work/Documents/Oncolink/src/app/page.tsx:7), [login/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/login/page.tsx:24), [book/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/book/page.tsx:12).

### Riscuri

- topbar-ul nu este sticky în implementare, deși documentația îl descrie ca sticky; în cod apare doar ca `header` simplu în [topbar.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/topbar.tsx:93);
- `QuickActionsWheel` este global și nu ține cont de densitatea paginii în [layout.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/layout.tsx:35);
- experiența demo și experiența reală pot diferi suficient de mult încât unele decizii UI să fie evaluate greșit.

### Concluzie shell

Shell-ul este bun, dar trebuie întărit prin reguli ferme: topbar sticky sau documentat ca non-sticky, FAB condiționat contextual, și un singur contract vizual pentru shell și sub-shells.

## 5. Navigation Audit

### Ce funcționează

- gruparea principală este bună în [nav-groups.ts](/Users/sch_work/Documents/Oncolink/src/components/dashboard/nav-groups.ts:21);
- stările active și idle sunt curate în sidebar și topbar search;
- topbar search oferă acces rapid la destinații în [topbar.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/topbar.tsx:180).

### Probleme

- prea multe module par să aibă greutate egală;
- unele label-uri sunt încă ambigue sau suprapuse mental:
  - `Registru`
  - `Raportare Lună`
  - `Sumar Lunar`
- `Asistent AI`, `Evaluări`, `Documente`, `Vault` și `CAS` concurează cu modulele zilnice în loc să fie mai clar ierarhizate.

### Recomandare

Navigația ar trebui să reflecte explicit trei straturi:

- „Ce fac azi?”: Dashboard, Programări, Calendar, Clienți, Note
- „Administrare”: Facturi, Cheltuieli, Billing, CAS, Compliance, Settings
- „Avansat / Suport”: AI, Evaluări, Documente, Vault

## 6. Card System Audit

### Ce funcționează

- cardul este clar unitatea de informație dominantă;
- `SectionCard` este un pattern bun în [page-shell.tsx](/Users/sch_work/Documents/Oncolink/src/components/app/page-shell.tsx:63);
- paginile publice folosesc carduri bine proporționate.

### Probleme

- există prea multe variații de radius: `rounded-2xl`, `rounded-3xl`, `rounded-[1.75rem]`, `rounded-[2rem]`, `rounded-[2.5rem]`;
- shadows variază mult între `shadow-sm`, `shadow-xl`, `shadow-2xl`;
- multe carduri sunt custom și nu derivă clar dintr-o taxonomie comună, vezi [ClientsClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientsClient.tsx:208), [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:342), [ClientDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDetailOverlay.tsx:333).

### Recomandare

Definirea a 4 tipuri oficiale ar reduce mult zgomotul:

- `SectionCard`
- `MetricCard`
- `ActionCard`
- `DataCard`

## 7. Overlay/Drawer/Modal Audit

### Ce funcționează

- `useOverlayA11y` este corect și reutilizabil;
- `SessionDrawer` este un drawer operațional eficient în [SessionDrawer.tsx](/Users/sch_work/Documents/Oncolink/src/components/appointments/SessionDrawer.tsx:125);
- `SectionDetailOverlay` este un bun exemplu de variantă laterală sobră în [SectionDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/SectionDetailOverlay.tsx:41).

### Probleme

- `ClientDetailOverlay` folosește un ton complet diferit, cu hero dark și decor puternic în [ClientDetailOverlay.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDetailOverlay.tsx:229);
- z-index-urile nu sunt clar standardizate: mobile nav la `z-50`, drawer la `z-50`, quick actions la `z-[100]`, overlays de client la `z-[110]`;
- unele close flows folosesc `router.push`, altele `window.location.href`, vezi [SessionDrawer.tsx](/Users/sch_work/Documents/Oncolink/src/components/appointments/SessionDrawer.tsx:88) și [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:677);
- meniul mobil din topbar implementează manual comportament de overlay și nu reusește hook-ul standard în [topbar.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/topbar.tsx:106).

### Recomandare

Standard minim pentru overlay API:

- `isOpen`
- `onClose`
- `title`
- `subtitle`
- `size`
- `footer`

Standard minim pentru layering:

- dropdown/topbar: 40
- drawer: 50
- modal: 60
- critical dialog: 70
- quick actions: sub modal, nu peste tot

## 8. Client Dashboard Audit

### Ce funcționează

- ambiția de a centraliza întreaga relație cu clientul este foarte bună;
- triada `Status Curent`, `Următorii Pași`, `Semnale Administrative` este promițătoare în [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:341);
- integrarea dintre programări, documente și evaluări are sens de produs.

### Probleme

- header-ul și acțiunile primare sunt deja multe înainte să înceapă restul paginii;
- după zona de status urmează încă 4 widget cards, apoi lifecycle history, apoi programări, apoi chart/documente, apoi evaluări;
- AI este persistent și nu este clar dacă este primary workflow sau secondary assistive layer în [ClientDashboardUI.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientDashboardUI.tsx:673);
- multe badge-uri și pills introduc accent semantic suplimentar, uneori inutil.

### Recomandare

Fișa ar beneficia de o structură progresivă:

- nivel 1: status, next best action, semnale critice
- nivel 2: tabs sau segmente mari
  - Overview
  - Clinic
  - Programări
  - Documente
  - Financiar
  - Lifecycle
- nivel 3: AI, risc, detalii secundare

## 9. Mobile/Responsive Audit

### Ce funcționează

- sidebar-ul dispare pe mobile și există mobile menu;
- clients registry are fallback mobil pe carduri în [ClientsClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientsClient.tsx:108);
- paginile publice folosesc bine grid-uri care cad natural pe verticală.

### Riscuri

- `QuickActionsWheel` poate intra peste conținut și peste alte overlays pe ecrane mici în [QuickActionsWheel.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/QuickActionsWheel.tsx:72);
- fișa clientului este foarte lungă și densă pentru mobil;
- multiple CTA-uri mari în header-ul fișei clientului pot aglomera partea superioară.

### Recomandare

Pe mobile, fișa clientului ar trebui să reducă conținutul inițial vizibil și să păstreze doar:

- status
- next action
- un CTA principal
- restul în secțiuni collapsible sau tabs

## 10. Accessibility Audit

### Ce funcționează

- focus trap și focus return în `useOverlayA11y`;
- support bun pentru Enter/Space pe rândurile registrului clienți în [ClientsClient.tsx](/Users/sch_work/Documents/Oncolink/src/components/clients/ClientsClient.tsx:73);
- icon buttons importante au `aria-label` în mai multe locuri.

### Riscuri

- mobile menu din topbar nu reutilizează același contract A11y ca celelalte overlays, vezi [topbar.tsx](/Users/sch_work/Documents/Oncolink/src/components/dashboard/topbar.tsx:106);
- intensitatea vizuală a unor alerte și culori pulse poate produce stres inutil pentru o aplicație clinică;
- row-click + nested action buttons în registry trebuie urmărit atent ca pattern de accesibilitate și predictibilitate.

### Concluzie

Accesibilitatea structurală este peste medie, dar trebuie standardizată, nu duplicată local în fiecare overlay special.

## 11. Dark Mode / Token Audit

### Ce funcționează

- tokenurile OKLCH și `.dark` sunt bine configurate în [globals.css](/Users/sch_work/Documents/Oncolink/src/app/globals.css:6);
- utilitarele globale pentru nav și focus sunt curate în [globals.css](/Users/sch_work/Documents/Oncolink/src/app/globals.css:91).

### Probleme

- multe componente folosesc direct `bg-slate-*`, `text-slate-*`, `bg-blue-*`, `bg-emerald-*`, `bg-rose-*`;
- asta reduce portabilitatea tokenurilor și îngreunează coerența în dark mode;
- semantic colors există mai mult ca obicei local decât ca sistem real.

### Recomandare

Direcția bună este introducerea unor variante semantice clare:

- `success`
- `warning`
- `danger`
- `info`
- `neutral`
- `clinical`
- `admin`

## 12. Prioritized Recommendations

### P0: Must Fix

1. Standardizează overlay-urile și drawer-ele într-un singur contract vizual și tehnic.
2. Reduce stilurile hardcodate pe `slate/rose/blue/emerald` în zonele dense.
3. Calmează sau condiționează `QuickActionsWheel`.
4. Reorganizează fișa clientului pe niveluri sau tabs mari.
5. Normalizează layering-ul și close behavior pentru overlays.

### P1: Should Improve

1. Reierarhizează navigația pe baza frecvenței reale de utilizare.
2. Clarifică label-urile nav cu ambiguitate operațională.
3. Mută acțiunile secundare din clients registry în meniuri contextuale.
4. Definește clar rolul AI: persistent, contextual sau secondary assistive.
5. Decide explicit dacă topbar-ul trebuie să fie sticky și aplică uniform.

### P2: Polish

1. Refolosește `useOverlayA11y` și pentru mobile menu.
2. Auditează touch targets și overlap-uri pe mobile.
3. Uniformizează shadow/radius defaults.
4. Revizuiește dark mode în toate zonele cu semantic colors hardcodate.
5. Redu animațiile pulsante și accentele care transmit urgență fără nevoie.

## 13. Suggested Component Standardization Plan

### Shell

- un singur contract pentru dashboard shell;
- topbar sticky sau explicit non-sticky;
- quick actions condiționat pe pagini și viewport.

### Cards

- `SectionCard` pentru secțiuni mari;
- `MetricCard` pentru KPI și status;
- `ActionCard` pentru elemente clickabile;
- `DataCard` pentru liste compacte și informație secundară.

### Overlays

- `DrawerOverlay` pentru detalii laterale;
- `ModalOverlay` pentru acțiuni, generare și confirmări;
- `DangerDialog` pentru operații critice;
- toate cu același header, spacing, close control, footer și z-index model.

### Semantic styling

- extragere progresivă a culorilor hardcodate în variante semantice;
- limitarea excepțiilor decorative la paginile publice;
- separarea clară între tonul public, tonul dashboard și tonul juridic/documentar.

## Final Conclusion

Produsul transmite deja că are substanță și direcție. Nu arată ca un prototip fragil. Dar începe să piardă coerență tocmai pentru că unele module au crescut cu propria personalitate vizuală.

Direcția recomandată este:

`calm, clinic, administrativ, clar, uman, fără anxietate vizuală`

Nu este nevoie de redesign total. Este nevoie de disciplină de sistem.
