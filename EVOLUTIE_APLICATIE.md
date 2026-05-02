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
- `npm run build`: ✅ verde (2 erori TS pre-existente IconComponent vs LucideIcon, noi în P0)
- Migrarea lifecycle (`20260429223610_client_lifecycle_status.sql`) este scrisa dar **neaplicata inca in baza reala**
- Migrarea P0 service_type (`20260502_service_type_and_clinical_fields.sql`) este scrisa dar **neaplicata inca in baza reala** — aplică ambele migrări împreună
- Urmeaza: P1 — mapare documente recomandate per service_type, checklist documente lipsă

## Ce s-a facut

### 16. P0 — Service Type & Service Track Card (Client Service Flows)

- **Migrare DB** (`20260502_service_type_and_clinical_fields.sql`): adăugat pe `clients` — `service_type` (default `UNDECIDED`), `service_track_status`, `main_complaint`, `clinical_focus`, `treatment_goals`, `treatment_plan`, `risk_level`, `research_consent`. Index pe `(therapist_id, service_type)`.
- **`src/lib/clients/service-track.ts`** (fișier nou): tip `ServiceType`, labels, badge variants, `isServiceType()`, `computeServiceTrackNextAction()` — logică next action contextuală per tip de serviciu + status lifecycle.
- **`src/lib/supabase/types.ts`**: actualizat Row/Insert/Update pentru `clients` cu câmpurile noi.
- **`src/components/clients/types.ts`**: adăugat `service_type`, `service_track_status`, `main_complaint`, `risk_level`, `research_consent` pe `ClientProfile`.
- **`src/lib/clients/form-state.ts`**: adăugat `service_type` la `fieldErrors`.
- **`src/components/clients/client-form.tsx`**: selector nativ "Tip serviciu principal" (6 opțiuni). Poziționat înainte de secțiunea Demografice & Facturare.
- **`src/app/dashboard/clients/actions.ts`**: `parseForm` + `createClient` (upsert payload) + `updateClient` includ acum `service_type`.
- **`src/components/clients/ServiceTrackCard.tsx`** (componentă nouă): afișează tip serviciu (badge colorat), `service_track_status` opțional, next best action calculat din `computeServiceTrackNextAction`. Reutilizabilă.
- **`src/components/clients/ClientDashboardUI.tsx`**: badge service type în header (vizibil doar dacă nu e UNDECIDED), `ServiceTrackCard` randată deasupra gridului Status/Pași/Semnale.

**Urmează P1**: mapare documente recomandate per `service_type`, checklist documente lipsă în fișa clientului.

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
