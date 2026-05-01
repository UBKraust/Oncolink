# TODO — Pași următori de implementat

Generat: 2026-05-02 · Stare baseline: lint ✅ · build ✅ · 11 taskuri finalizate

---

## 🔴 BLOCKER — Aplică migrarea în baza reală

Fără acest pas, butoanele lifecycle nu persistă nimic și secțiunea "Istoric lifecycle" din fișa clientului rămâne goală.

```bash
# Din directorul proiectului, cu Supabase CLI configurat:
supabase db push
```

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

## 🟠 Validare lifecycle (imediat după migrare)

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

---

## 🟡 Implementare: Date dinamice rămase hardcodate

### A. Raportul lunar — footer PDF hardcodat

**Fișier:** [src/app/dashboard/review/page.tsx](src/app/dashboard/review/page.tsx) — linia 318

```tsx
// Actual (hardcodat):
Generat de Ce`ai Pățit? ERP · Cabinet Psihoterapie Ioana Cosmina Terente PFA ·

// De înlocuit cu:
const settings = await getTherapistSettings().catch(() => null);
// și în JSX:
{settings?.practice_name ?? settings?.full_name ?? "Cabinet"}
```

Pagina este `"use client"` — trebuie fie refactorată la Server Component pentru header, fie expusă `practice_name` printr-un API call sau prop din server.

### B. Google Drive — templates hardcodate

**Fișier:** [src/lib/google/drive.ts](src/lib/google/drive.ts) — liniile 198, 229

```ts
// Actual:
TERAPEUT: Ioana Cosmina Terente
Operator: Cabinet Psihoterapie Ioana Cosmina Terente

// De înlocuit cu:
// Fetch therapist settings înainte de a genera template-ul
// și injectează full_name / practice_name
```

### C. Lista documente — fallback hardcodat

**Fișier:** [src/components/documents/document-list.tsx](src/components/documents/document-list.tsx) — liniile 58, 75

```ts
// Actual:
therapistName: "Dr. Psiholog",

// De înlocuit cu:
// Fetch getTherapistSettings() în page.tsx (server) și pasează ca prop
```

---

## 🟡 Implementare: `vaultAlertsCount` mereu 0

**Fișier:** [src/lib/dashboard/queries.ts](src/lib/dashboard/queries.ts) — linia 151

`vaultAlertsCount: 0` este hardcodat. Valoarea ar trebui să reflecte numărul de documente din vault cu `expiry_date` în mai puțin de 30 de zile sau expirate deja.

```ts
// De adăugat în getDashboardStats():
const { count: vaultAlertsCount } = await supabase
  .from("patient_documents") // sau tabela corectă de vault
  .select("*", { count: "exact", head: true })
  .not("expiry_date", "is", null)
  .lte("expiry_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
```

Verifică mai întâi care tabelă stochează documentele din seif și dacă are câmpul `expiry_date`.

---

## 🟡 QA funcțional cap-la-cap

Testare manuală, în ordine de prioritate:

### Flux 1 — Creare client adult nou
1. `/dashboard/clients/new` — completează formularul complet
2. Verifică validare inline pe câmpuri obligatorii
3. Verifică redirect la fișa clientului după submit reușit
4. Verifică că `lifecycle_status = 'LEAD'` apare în fișă

### Flux 2 — Onboarding adult (link securizat)
1. Din fișa clientului, copiază linkul de onboarding
2. Deschide în browser incognito
3. Completează wizard-ul în 3 pași
4. Verifică că datele apar în fișă și `lifecycle_status` trece la `ONBOARDING`

### Flux 3 — Onboarding minor (tutore)
1. Creează client minor din `/dashboard/clients/new-minor`
2. Din fișă, copiază linkul de onboarding minor
3. Completează ca tutore în browser incognito (date guardian)
4. Verifică că `is_onboarding_complete` devine `true` și bannerul dispare din fișă

### Flux 4 — Booking public
1. Deschide `/book` fără autentificare
2. Completează formularul de programare
3. Verifică că apare `?confirmed=1` după submit
4. Verifică că programarea apare în `/dashboard/appointments`
5. Verifică că clientul apare în registru (sau că cel existent a primit o programare nouă)

### Flux 5 — Marcare ședință completă
1. Din `/dashboard/appointments`, deschide o programare `PROGRAMAT`
2. Din SessionDrawer, marchează ca `FINALIZAT`
3. Verifică că `lifecycle_status` clientului trece la `ACTIV` (sync automat)
4. Verifică intrarea în `client_status_history` fără `changed_by_name` (sistem)

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

- [ ] Pagina `/dashboard/review` — înlocuiește textul hardcodat din footer-ul PDF cu date reale din settings
- [ ] `vaultAlertsCount` — implementează query-ul real (vezi secțiunea de mai sus)
- [ ] `document-list.tsx` — preia `therapistName` din settings, nu fallback static
- [ ] `google/drive.ts` — înlocuiește numele hardcodat din template-urile Google Drive
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
1. supabase db push                    ← BLOCKER, faci tu manual
2. Validare lifecycle (butoane + istoric)
3. Implementare date dinamice (A, B, C + vault alerts)
4. QA funcțional (flux 1→9)
5. QA accesibilitate
6. Polish opțional
```
