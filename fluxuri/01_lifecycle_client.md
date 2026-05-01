# Flux 01 — Lifecycle Client

## Descriere

Fiecare client trece printr-un ciclu de viață explicit, urmărit persistent în Supabase (`clients.status` + tabel `client_status_history`). Stările sunt derivate din acțiuni reale (onboarding finalizat, programare creată, ședință completată, inactivitate) și nu din input manual arbitrar.

## Fișiere Cheie

- [src/lib/clients/lifecycle.ts](../src/lib/clients/lifecycle.ts) — logica stărilor
- [src/lib/clients/lifecycle-sync.ts](../src/lib/clients/lifecycle-sync.ts) — sincronizare pe acțiuni UI
- [src/lib/clients/queries.ts](../src/lib/clients/queries.ts) — `getClientStatusHistory()` cu fallback sigur
- [src/components/clients/types.ts](../src/components/clients/types.ts) — `ClientStatusHistoryItem`
- [src/components/clients/ClientsClient.tsx](../src/components/clients/ClientsClient.tsx) — registru cu filtrare
- [src/components/clients/ClientDashboardUI.tsx](../src/components/clients/ClientDashboardUI.tsx) — fișa client cu acțiuni lifecycle + secțiune "Istoric lifecycle"
- [src/app/dashboard/clients/[id]/page.tsx](../src/app/dashboard/clients/[id]/page.tsx) — fetch paralel `getClientStatusHistory`
- [supabase/migrations/20260429223610_client_lifecycle_status.sql](../supabase/migrations/20260429223610_client_lifecycle_status.sql) — schema `client_status_history`

## Diagrama Stărilor

```mermaid
stateDiagram-v2
    direction LR

    [*] --> LeadNou : terapeut crează client\n(dashboard/clients/new)
    [*] --> Onboarding : booking public\n(/book) fără autentificare

    LeadNou --> Onboarding : terapeut trimite\nlink onboarding securizat
    Onboarding --> Programat : onboarding finalizat\n+ programare creată
    Programat --> Activ : prima ședință\ncompletată
    Activ --> Inactiv : inactivitate > prag\nconfigurat (zile)
    Activ --> Incheiat : terapeut marchează\ncazul închis
    Activ --> Neconversie : relatie neconsolidată\n(nu a mai revenit)
    Inactiv --> Activ : terapeut reactivează\n(nouă programare)
    Inactiv --> Incheiat : terapeut închide\ncaz inactiv
    Incheiat --> LeadNou : reîncepere relaţie
    Activ --> Anonimizat : cerere GDPR\n(delete request)
    Inactiv --> Anonimizat : cerere GDPR\n(delete request)
    Incheiat --> Anonimizat : cerere GDPR\n(delete request)
    Anonimizat --> [*]
```

## Tranziții și Triggeruri

| Din stare | Către stare | Trigger | Fișier |
|-----------|-------------|---------|--------|
| *(nou)* | **Lead nou** | `clients/new` sau `clients/new-minor` | `clients/actions.ts` |
| *(nou)* | **Onboarding** | booking public `/book` | `api/bookings/create` |
| Lead nou | **Onboarding** | terapeut generează token onboarding | `onboarding-actions.ts` |
| Onboarding | **Programat** | onboarding finalizat + programare existentă | `lifecycle-sync.ts` |
| Programat | **Activ** | ședință marcată completă | `session-actions.ts` |
| Activ | **Inactiv** | job automat sau terapeut manual | `lifecycle.ts` |
| Activ | **Incheiat** | `markIncheiat()` din fișa client | `ClientDashboardUI.tsx` |
| Activ | **Neconversie** | `markNeconversie()` | `ClientDashboardUI.tsx` |
| Inactiv | **Activ** | `reactivate()` | `ClientDashboardUI.tsx` |
| Orice | **Anonimizat** | `/dashboard/clients/[id]/anonymize` | `anonymize/page.tsx` |

## Vizualizare în UI

```mermaid
flowchart TD
    REG["/dashboard/clients\nRegistru cu filtre pe status"]
    REG -->|click client| FISA[Fișa Client\nClientDashboardUI]

    FISA --> STATUS[Badge Status Curent]
    FISA --> ACTIONS[Acțiuni Lifecycle\n• Marchează Activ\n• Marchează Inactiv\n• Încheie caz\n• Neconversie\n• Reactivează]
    FISA --> HISTORY["Secțiunea Istoric lifecycle\n(implementat — task #9)"]
    FISA --> NEXT[Următori Pași Recomandați\n- Trimite onboarding\n- Creează programare\n- etc.]

    STATUS --> BADGE["Badge colorat:\n🔵 Lead nou\n🟡 Onboarding\n🟢 Activ\n🔴 Inactiv\n⚫ Incheiat"]

    HISTORY --> ENTRY["Fiecare intrare afișează:\nfrom_status → to_status\nMotiv (sau Fără motiv explicit)\nTimestamp formatat (d MMM yyyy, HH:mm)"]
    HISTORY --> EMPTY["Empty state dacă:\n- migrare neaplicată\n- client nou fără tranziții"]
```

## Date Istorice — Schema și Query

Tipul `ClientStatusHistoryItem` (din `src/components/clients/types.ts`):

```typescript
interface ClientStatusHistoryItem {
  id: string;
  from_status: string | null;   // null la prima tranziție (stare inițială)
  to_status: string;
  reason: string | null;        // fallback UI: "Fără motiv explicit"
  changed_at: string;           // ISO string, formatat cu date-fns ro
  changed_by_name: string | null; // extras din metadata.changed_by_name
}
```

Query în `getClientStatusHistory()`:
- Sursă: `client_status_history` WHERE `client_id = ?`
- Ordine: `changed_at DESC` (cel mai recent primul)
- Limită: **8 intrări** (istoricul recent relevant)
- **Fallback sigur**: dacă tabela lipsește (migrare neaplicată), returnează `[]` fără eroare

### Tracking `changed_by_name`

Stocat în `metadata.changed_by_name` (JSONB existent — fără migrare nouă):

```
lifecycle-sync.ts
  ├── fetchTherapistDisplayName(supabase, userId)
  │     └── SELECT full_name FROM therapist_settings WHERE therapist_id = userId
  │
  ├── syncClientLifecycleStatus() → auth.getUser() → fetchName → merge în metadata
  └── setClientLifecycleStatus()  → auth.getUser() → fetchName → merge în metadata
```

- Acțiuni din dashboard (terapeut autentificat) → înregistrează numele terapeutului
- Acțiuni de sistem/public (service role, fără sesiune) → `changed_by_name` absent → UI nu afișează nimic

## KPI-uri în Registrul de Clienți

```mermaid
graph LR
    subgraph KPI["KPI Dashboard - /dashboard/clients"]
        K1["Onboarding\n(in progres)"]
        K2["Prima Ședință\n(programat, nu a venit)"]
        K3["Clienți Activi\n(status Activ)"]
        K4["Inactivi\n(prag depășit)"]
    end
```

## Anonimizare (GDPR)

```mermaid
flowchart TD
    START[Terapeut → /dashboard/clients/id/anonymize]
    CONFIRM[Confirmare acțiune ireversibilă]
    ANON["Anonymize:\n- Ștergere PII: nume, email, telefon\n- Păstrare date statistice anonimizate\n- Status → Anonimizat\n- Înregistrare audit trail"]
    DONE[Client nu mai apare în registru activ]

    START --> CONFIRM --> ANON --> DONE
```
