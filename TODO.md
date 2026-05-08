# TODO — Pași următori de implementat

Generat: 2026-05-02 · Actualizat: 2026-05-08

---

## P0 — Stabilitate UI/UX și acțiuni critice

Acest bloc înlocuiește ordinea de lucru imediată după auditul transversal al aplicației.

### În curs acum

- [x] Dashboard rezilient la erori parțiale de încărcare
  Context: dacă un singur query Supabase eșuează, nu trebuie să cadă întregul `/dashboard`.
- [x] Detaliu programare rezilient la `fetch failed`
  Context: `/dashboard/appointments/[id]` trebuie să arate banner de eroare și cale de întoarcere, nu runtime crash.

### Următoarele P0

- [x] Înlocuiește acțiunea bulk SmartBill placeholder cu flux real server-side
  Context: `alert(...)` în billing induce că emiterea s-a făcut, dar nu execută nimic real.
- [x] Separă clar `empty state` de `error state` în zonele `forms`, `clients`, `invoices`
  Context: listele goale și erorile de infrastructură sunt afișate prea similar.
- [x] Elimină fallback-urile care mimează succesul pe `PatientDocuments`
  Context: uploadul local după eșecul API creează impresia falsă că documentul a fost salvat real.

## P1 — Date reale și coerență operațională

- [x] Înlocuiește mock data din `ClientFinancialHistory` cu date reale din appointments + invoices + payments
- [x] Elimină ultimele ramuri `Mod Demo` din `ClientDetailOverlay`
- [x] Adaugă workspace financiar dedicat pentru facturi `PREGĂTITĂ`
- [x] Batch select + batch send către SmartBill din `/dashboard/invoices`
- [x] Istoric vizibil `PREGĂTITĂ -> EMISĂ -> PLĂTITĂ / ANULATĂ`

## P2 — Readiness clinic și conformitate

- [x] Blochează administrarea testelor care au itemi placeholder
- [x] Afișează explicit când P3/forms nu sunt disponibile sau migrările lipsesc
- [x] Marchează modulele cu stare de readiness: `safe`, `partial`, `demo`, `blocked`
- [x] Unifică bannerele de setup, warning și error într-un pattern UX comun

## P3 — Extinderea pattern-ului bun din Programări

- [x] Mută mai multe acțiuni din `Clients` în overlay-uri locale, fără scoatere din context
- [ ] Aplică același model de lucru local pentru `Facturi`, `Forms`, `Documents`
- [ ] Reduce zonele unde `router.refresh()` e încă reflexul principal după acțiuni mici

---

Stare baseline istorică: lint ✅ · build ✅ · `npx supabase db push` ✅

---

## ✅ Migrare aplicată în baza reală

Status: rulat pe `2026-05-02` cu `npx supabase db push` → `Remote database is up to date`.

Nu mai este blocker activ. Următorul pas este validarea lifecycle pe date reale.

### Verificare după aplicare

```sql
-- Verifică că tabela există
SELECT count(*) FROM public.client_status_history;

-- Verifică că RLS este activ
SELECT relname, relrowsecurity
FROM pg_class WHERE relname = 'client_status_history';

-- Verifică backfill-ul inițial (toți clienții trebuie să aibă cel puțin o intrare)
SELECT c.full_name, h.to_status, h.reason
FROM clients c
LEFT JOIN client_status_history h ON h.client_id = c.id AND h.reason = 'Backfill lifecycle status'
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## ✅ Validare lifecycle

Testează fiecare buton din fișa unui client real și confirmă că scrie în `client_status_history`:

| Buton | Status așteptat | `changed_by_name` |
|-------|----------------|-------------------|
| Marchează activ | `ACTIV` | Numele terapeutului |
| Marchează inactiv | `INACTIV` | Numele terapeutului |
| Încheie caz | `INCHEIAT` | Numele terapeutului |
| Neconversie | `NECONVERSIE` | Numele terapeutului |
| Reactivează | `ACTIV` (sync derivat) | Numele terapeutului |

Verifică și că secțiunea "Istoric lifecycle" din fișă afișează tranzițiile cu timestamp + `de [Nume Terapeut]`.

Verifică că fluxurile automate (booking public `/book`, onboarding, anonimizare) scriu și ele în istoric **fără** `changed_by_name` — asta e comportamentul corect (sistem, nu terapeut).

Status validat pe remote la nivel de persistență:
- [x] `Marchează activ` → `ACTIV` + `changed_by_name`
- [x] `Marchează inactiv` → `INACTIV` + `changed_by_name`
- [x] `Încheie caz` → `INCHEIAT` + `changed_by_name`
- [x] `Neconversie` → `NECONVERSIE` + `changed_by_name`
- [x] `Reactivează` → `ACTIV` derivat + `changed_by_name`
- [x] Fluxuri automate scriu în istoric fără `changed_by_name`

Notă:
- În timpul validării a fost descoperit un drift de schemă pe remote: migrarea lifecycle apărea în istoricul de migrare, dar obiectele (`clients.lifecycle_status`, `client_status_history`, policy-ul RLS) lipseau efectiv. Drift-ul a fost reparat prin reaplicarea SQL-ului din [supabase/migrations/20260429223610_client_lifecycle_status.sql](/Users/sch_work/Documents/Oncolink/supabase/migrations/20260429223610_client_lifecycle_status.sql) direct pe baza linkată.

---

## ✅ Implementare: Date dinamice hardcodate eliminate

- [x] Raportul lunar — footer PDF citește acum `practice_name` / `full_name` din settings
- [x] Google Drive — template-urile folosesc acum `full_name` / `practice_name` din settings
- [x] Lista documente — `therapistName` vine acum din settings server-side
- [x] Lifecycle history — `changed_by_name` are fallback și pe `practice_name` dacă `full_name` lipsește

Fișiere atinse:
- [src/app/dashboard/review/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/review/page.tsx)
- [src/app/dashboard/review/review-client.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/review/review-client.tsx)
- [src/app/dashboard/documents/page.tsx](/Users/sch_work/Documents/Oncolink/src/app/dashboard/documents/page.tsx)
- [src/components/documents/document-list.tsx](/Users/sch_work/Documents/Oncolink/src/components/documents/document-list.tsx)
- [src/lib/google/drive.ts](/Users/sch_work/Documents/Oncolink/src/lib/google/drive.ts)
- [src/lib/clients/lifecycle-sync.ts](/Users/sch_work/Documents/Oncolink/src/lib/clients/lifecycle-sync.ts)

---

## ✅ Implementare: `vaultAlertsCount`

**Fișier:** [src/lib/dashboard/queries.ts](src/lib/dashboard/queries.ts) — linia 151

Status: implementat pe `patient_documents`, cu prag `<= 30 zile` și includere documente deja expirate.

---

## 🟡 QA funcțional cap-la-cap

Testare manuală, în ordine de prioritate:

### Flux 1 — Creare client adult nou
1. `/dashboard/clients/new` — completează formularul complet
2. Verifică validare inline pe câmpuri obligatorii
3. Verifică redirect la fișa clientului după submit reușit
4. Verifică că `lifecycle_status = 'LEAD'` apare în fișă

Status backend:
- [x] Persistența stării inițiale `LEAD` este confirmată
- [ ] Validare UI formular + redirect

### Flux 2 — Onboarding adult (link securizat)
1. Din fișa clientului, copiază linkul de onboarding
2. Deschide în browser incognito
3. Completează wizard-ul în 3 pași
4. Verifică că datele apar în fișă și `lifecycle_status` trece la `ONBOARDING`

Status backend:
- [x] `submitClientOnboarding` mută clientul în `ONBOARDING`
- [ ] Validare UI wizard + link securizat + afișare fișă

### Flux 3 — Onboarding minor (tutore)
1. Creează client minor din `/dashboard/clients/new-minor`
2. Din fișă, copiază linkul de onboarding minor
3. Completează ca tutore în browser incognito (date guardian)
4. Verifică că `is_onboarding_complete` devine `true` și bannerul dispare din fișă

Status backend:
- [x] `submitMinorOnboarding` setează `onboarding_completed_at`, `legal_liability_consent_signed_at`, `needs_legal_review` și `lifecycle_status = 'ONBOARDING'`
- [ ] Validare UI banner/link/wizard minor

Notă:
- În cod, semnalul real folosit de UI este `onboarding_completed_at` / `lifecycle.isOnboardingComplete`, nu un câmp literal `is_onboarding_complete`.

### Flux 4 — Booking public
1. Deschide `/book` fără autentificare
2. Completează formularul de programare
3. Verifică că apare `?confirmed=1` după submit
4. Verifică că programarea apare în `/dashboard/appointments`
5. Verifică că clientul apare în registru (sau că cel existent a primit o programare nouă)

Status backend:
- [x] `createPublicBooking` creează `appointments.status = 'PROGRAMAT'` și mută clientul în `PROGRAMAT`
- [ ] Validare UI booking public + redirect `?confirmed=1`

### Flux 5 — Marcare ședință completă
1. Din `/dashboard/appointments`, deschide o programare `PROGRAMAT`
2. Din SessionDrawer, marchează ca `FINALIZAT`
3. Verifică că `lifecycle_status` clientului trece la `ACTIV` (sync automat)
4. Verifică intrarea în `client_status_history` fără `changed_by_name` (sistem)

Status backend:
- [x] `updateAppointmentStatus -> FINALIZAT` mută clientul în `ACTIV` și scrie în istoric fără `changed_by_name`
- [ ] Validare UI din `SessionDrawer`

### Flux 6 — Emitere factură SmartBill
1. Din fișa clientului sau `/dashboard/invoices/new`, creează factură
2. Apasă "Emite în SmartBill" (dacă credentials configurate)
3. Verifică că status devine `Emisă` și numărul de factură apare

### Flux 7 — Upload document client
1. Din fișa clientului → tab Documente
2. Încarcă un PDF sau imagine
3. Verifică că apare în listă cu link funcțional

### Flux 8 — Vault note clinice
1. Configurează PIN în `/dashboard/vault` (dacă nu e setat)
2. Deschide nota pentru o ședință din `/dashboard/notes`
3. Scrie text, salvează
4. Lock vault, unlock cu PIN, verifică decriptare corectă

### Flux 9 — Anonimizare client
1. Din fișa unui client de test, apasă Anonimizează
2. Trece prin AlertDialog de confirmare
3. Scrie `ȘTERGE PII` în câmpul de confirmare
4. Verifică redirect cu `?anonymized=1` și banner verde
5. Verifică că `lifecycle_status = 'ANONIMIZAT'` și datele PII sunt șterse

Status backend:
- [x] Anonimizarea mută clientul în `ANONIMIZAT` și scrie istoric fără `changed_by_name`
- [ ] Validare UI dialog + redirect + banner

---

## 🟡 QA accesibilitate

| Verificare | Tool recomandat |
|-----------|----------------|
| Navigare keyboard-only prin formularul de client | Tab + Enter manual |
| Focus trap în overlay-uri (ClientDetailOverlay, SessionDrawer) | Tab în overlay deschis |
| Focus return după închidere overlay | Observă unde revine focus-ul |
| Contrast badge-uri status (`LEAD`, `ACTIV`, etc.) | DevTools → Accessibility |
| Touch targets pe mobile (`h-10 w-10` minim) | DevTools Mobile emulation |
| iOS Safari — `min-h-svh` vs `min-h-screen` | Test fizic sau BrowserStack |

---

## 🟢 Polish opțional

- [x] Pagina `/dashboard/review` — înlocuiește textul hardcodat din footer-ul PDF cu date reale din settings
- [x] `vaultAlertsCount` — implementează query-ul real (vezi secțiunea de mai sus)
- [x] `document-list.tsx` — preia `therapistName` din settings, nu fallback static
- [x] `google/drive.ts` — înlocuiește numele hardcodat din template-urile Google Drive
- [ ] Separare model `guardian` — câmpurile plate `parent_name`, `parent_phone`, `parent_email` de pe `clients` pot fi mutate într-un subtabel `client_guardians` (task separat, necesită migrare nouă)

---

## 🔵 Viitor / Opțional

- [ ] Notificări email automate la tranziții lifecycle importante (ex: client trecut în `Inactiv`)
- [ ] Export CSV din istoricul lifecycle pentru audit extern
- [ ] Dashboard cu grafic funnel: Lead → Onboarding → Activ → Încheiat
- [ ] Suport multi-terapeut (RLS deja pregătit, UI și logica de rutare lipsesc)

---

## Ordine recomandată de lucru

```
1. QA funcțional UI (flux 1→9) pentru pașii încă neverificați vizual
2. QA accesibilitate
3. Separare model `guardian` (opțional, cu migrare nouă)
4. Viitor / opțional
```
