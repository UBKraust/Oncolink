# Audit Log Complet — Plan de implementare

Generat: 2026-05-04 · Stare: **TODO**

---

## Context și motivație

Aplicația gestionează date sensibile psihologice/sănătate: note clinice criptate, documente, contracte, evaluări, rapoarte, facturi, onboarding și consimțăminte.

Tabela actuală `activity_logs` există în schema inițială dar are doar `therapist_id`, `action_type`, `client_initials`, `timestamp` — insuficientă pentru SaaS cu date medicale. Nu există nicio folosire reală de tip `insert activity_logs` în codebase.

**Fără audit complet aplicația este un tool intern bun. Cu audit, devine SaaS profesionist conform pentru date sensibile.**

---

## Ce trebuie să știm despre fiecare acțiune auditată

```
cine a făcut acțiunea       → actor_user_id, actor_role
când                        → created_at
de unde                     → ip_address, user_agent
pe ce entitate              → entity_type, entity_id
ce tip de acțiune           → action, category
ce s-a schimbat             → before_snapshot, after_snapshot (câmpuri safe)
dacă a fost export/download → severity CRITICAL
dacă a implicat date sensibile → severity WARNING/CRITICAL
dacă acțiunea a reușit      → status SUCCESS/FAILED
```

---

## Schema nouă — `public.audit_logs`

**Fișier migrare:** `supabase/migrations/YYYYMMDDHHMMSS_audit_logs.sql`

```sql
create table public.audit_logs (
  id              uuid        primary key default gen_random_uuid(),

  therapist_id    uuid        not null references auth.users(id) on delete cascade,
  actor_user_id   uuid        references auth.users(id) on delete set null,
  actor_role      text        not null default 'THERAPIST',

  action          text        not null,
  category        text        not null,

  entity_type     text,
  entity_id       uuid,
  client_id       uuid        references public.clients(id) on delete set null,

  severity        text        not null default 'INFO',
  status          text        not null default 'SUCCESS',

  metadata        jsonb       not null default '{}',
  before_snapshot jsonb,
  after_snapshot  jsonb,

  ip_address      inet,
  user_agent      text,

  created_at      timestamptz not null default now()
);

-- Constrângeri
alter table public.audit_logs
  add constraint audit_logs_severity_check
    check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  add constraint audit_logs_status_check
    check (status in ('SUCCESS', 'FAILED')),
  add constraint audit_logs_category_check
    check (category in (
      'AUTH', 'CLIENT', 'NOTE', 'DOCUMENT', 'CONTRACT', 'CONSENT',
      'APPOINTMENT', 'ASSESSMENT', 'REPORT', 'INVOICE', 'SETTINGS',
      'SECURITY', 'AI', 'EXPORT', 'DELETE', 'SYSTEM'
    ));

-- Indexuri
create index audit_logs_therapist_date_idx
  on public.audit_logs (therapist_id, created_at desc);

create index audit_logs_client_date_idx
  on public.audit_logs (client_id, created_at desc);

create index audit_logs_category_date_idx
  on public.audit_logs (therapist_id, category, created_at desc);

create index audit_logs_action_date_idx
  on public.audit_logs (therapist_id, action, created_at desc);

create index audit_logs_severity_date_idx
  on public.audit_logs (therapist_id, severity, created_at desc);

-- RLS
alter table public.audit_logs enable row level security;

create policy "Therapist sees own audit logs"
  on public.audit_logs for select
  using (auth.uid() = therapist_id);

create policy "Therapist inserts own audit logs"
  on public.audit_logs for insert
  with check (auth.uid() = therapist_id);
```

---

## Categorii de acțiuni auditate

### 1. Acces dosar client · `category: CLIENT`

| Action | Severity |
|---|---|
| `CLIENT_VIEWED` | INFO |
| `CLIENT_CREATED` | INFO |
| `CLIENT_UPDATED` | INFO |
| `CLIENT_ARCHIVED` | WARNING |
| `CLIENT_ANONYMIZED` | CRITICAL |
| `CLIENT_DELETED` | CRITICAL |
| `CLIENT_EXPORTED` | CRITICAL |

### 2. Note clinice · `category: NOTE`

| Action | Severity |
|---|---|
| `NOTE_CREATED` | WARNING |
| `NOTE_UPDATED` | WARNING |
| `NOTE_DECRYPTED` | WARNING |
| `NOTE_EXPORTED` | CRITICAL |
| `NOTE_DELETED` | CRITICAL |
| `AI_SUMMARY_GENERATED_FROM_NOTE` | WARNING |

> **Important:** nu se loghează textul notei, doar metadatele acțiunii.

### 3. Documente · `category: DOCUMENT`

| Action | Severity |
|---|---|
| `DOCUMENT_UPLOADED` | WARNING |
| `DOCUMENT_VIEWED` | INFO |
| `DOCUMENT_DOWNLOADED` | CRITICAL |
| `DOCUMENT_DELETED` | CRITICAL |
| `DOCUMENT_SHARED` | WARNING |
| `DOCUMENT_SIGNED` | WARNING |
| `DOCUMENT_VERSION_CREATED` | INFO |

### 4. Contracte · `category: CONTRACT`

| Action | Severity |
|---|---|
| `CONTRACT_PREVIEWED` | INFO |
| `CONTRACT_ISSUED` | WARNING |
| `CONTRACT_DOWNLOADED` | CRITICAL |
| `CONTRACT_UPLOADED_TO_DRIVE` | WARNING |
| `CONTRACT_CANCELLED` | WARNING |
| `CONTRACT_REGENERATED` | WARNING |

> Registry-ul `generated_contracts` = document emis. Audit log = cine/ce/când/de unde.

### 5. Onboarding și linkuri publice · `category: CONSENT` sau `CLIENT`

| Action | Severity |
|---|---|
| `ONBOARDING_LINK_CREATED` | WARNING |
| `ONBOARDING_LINK_SENT` | WARNING |
| `ONBOARDING_LINK_OPENED` | INFO |
| `ONBOARDING_SUBMITTED` | WARNING |
| `ONBOARDING_TOKEN_USED` | WARNING |
| `ONBOARDING_TOKEN_REVOKED` | WARNING |
| `APPOINTMENT_CONFIRM_TOKEN_USED` | INFO |
| `APPOINTMENT_CANCEL_TOKEN_USED` | INFO |

> Nu se loghează tokenul, doar `expiresAt`, `channel`, `clientId`.

### 6. Consimțăminte · `category: CONSENT`

| Action | Severity |
|---|---|
| `CONSENT_CREATED` | INFO |
| `CONSENT_VIEWED` | INFO |
| `CONSENT_ACCEPTED` | WARNING |
| `CONSENT_REVOKED` | CRITICAL |
| `CONSENT_VERSION_UPDATED` | WARNING |
| `CONSENT_PDF_GENERATED` | WARNING |

### 7. Facturi / fiscal · `category: INVOICE`

| Action | Severity |
|---|---|
| `INVOICE_CREATED` | INFO |
| `INVOICE_SENT` | INFO |
| `INVOICE_PAID` | INFO |
| `INVOICE_CANCELLED` | WARNING |
| `INVOICE_STORNO_CREATED` | WARNING |
| `INVOICE_EXPORTED` | WARNING |
| `EFACTURA_XML_GENERATED` | WARNING |
| `EFACTURA_SUBMITTED` | WARNING |

### 8. Setări cabinet / securitate · `category: SETTINGS` sau `SECURITY`

| Action | Severity |
|---|---|
| `SETTINGS_UPDATED` | WARNING |
| `THERAPIST_PROFILE_UPDATED` | WARNING |
| `BILLING_SETTINGS_UPDATED` | CRITICAL |
| `GOOGLE_CONNECTED` | WARNING |
| `GOOGLE_DISCONNECTED` | WARNING |
| `PASSWORD_CHANGED` | CRITICAL |
| `MFA_ENABLED` | CRITICAL |
| `MFA_DISABLED` | CRITICAL |
| `SESSION_EXPIRED` | INFO |
| `LOGIN_SUCCESS` | INFO |
| `LOGIN_FAILED` | WARNING |
| `SUPPORT_ACCESS_GRANTED` | CRITICAL |
| `SUPPORT_ACCESS_REVOKED` | CRITICAL |

---

## Helper server-side

**Fișier:** `src/lib/audit/log.ts`

```typescript
// server-only
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AuditEventInput } from './types'

const SENSITIVE_KEYS = [
  'noteText', 'encryptedContent', 'cnp', 'rawAnswers',
  'password', 'token', 'tokenHash', 'secret'
]

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.includes(key)) continue
    if (key === 'cnpFull') {
      result['cnp_present'] = true
      continue
    }
    result[key] = value
  }
  return result
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('audit_logs').insert({
      therapist_id:    user.id,
      actor_user_id:   user.id,
      actor_role:      'THERAPIST',
      action:          input.action,
      category:        input.category,
      entity_type:     input.entityType ?? null,
      entity_id:       input.entityId ?? null,
      client_id:       input.clientId ?? null,
      severity:        input.severity ?? 'INFO',
      status:          input.status ?? 'SUCCESS',
      metadata:        sanitizeMetadata(input.metadata ?? {}),
      before_snapshot: input.beforeSnapshot ?? null,
      after_snapshot:  input.afterSnapshot ?? null,
    })

    if (error) {
      console.error('[audit] Insert failed:', error.message)
    }
  } catch (err) {
    // Audit nu blochează niciodată flow-ul principal
    console.error('[audit] Unexpected error:', err)
  }
}
```

**Fișier tipuri:** `src/lib/audit/types.ts`

```typescript
export type AuditCategory =
  | 'AUTH' | 'CLIENT' | 'NOTE' | 'DOCUMENT' | 'CONTRACT' | 'CONSENT'
  | 'APPOINTMENT' | 'ASSESSMENT' | 'REPORT' | 'INVOICE' | 'SETTINGS'
  | 'SECURITY' | 'AI' | 'EXPORT' | 'DELETE' | 'SYSTEM'

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AuditStatus   = 'SUCCESS' | 'FAILED'

export type AuditAction =
  | 'CLIENT_VIEWED' | 'CLIENT_CREATED' | 'CLIENT_UPDATED' | 'CLIENT_ARCHIVED'
  | 'CLIENT_ANONYMIZED' | 'CLIENT_DELETED' | 'CLIENT_EXPORTED'
  | 'NOTE_CREATED' | 'NOTE_UPDATED' | 'NOTE_DECRYPTED' | 'NOTE_EXPORTED' | 'NOTE_DELETED'
  | 'AI_SUMMARY_GENERATED_FROM_NOTE' | 'AI_SUMMARY_GENERATED'
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_VIEWED' | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_DELETED' | 'DOCUMENT_SHARED' | 'DOCUMENT_SIGNED' | 'DOCUMENT_VERSION_CREATED'
  | 'CONTRACT_PREVIEWED' | 'CONTRACT_ISSUED' | 'CONTRACT_DOWNLOADED'
  | 'CONTRACT_UPLOADED_TO_DRIVE' | 'CONTRACT_CANCELLED' | 'CONTRACT_REGENERATED'
  | 'CONSENT_CREATED' | 'CONSENT_VIEWED' | 'CONSENT_ACCEPTED'
  | 'CONSENT_REVOKED' | 'CONSENT_VERSION_UPDATED' | 'CONSENT_PDF_GENERATED'
  | 'ONBOARDING_LINK_CREATED' | 'ONBOARDING_LINK_SENT' | 'ONBOARDING_LINK_OPENED'
  | 'ONBOARDING_SUBMITTED' | 'ONBOARDING_TOKEN_USED' | 'ONBOARDING_TOKEN_REVOKED'
  | 'APPOINTMENT_CONFIRM_TOKEN_USED' | 'APPOINTMENT_CANCEL_TOKEN_USED'
  | 'INVOICE_CREATED' | 'INVOICE_SENT' | 'INVOICE_PAID'
  | 'INVOICE_CANCELLED' | 'INVOICE_STORNO_CREATED' | 'INVOICE_EXPORTED'
  | 'EFACTURA_XML_GENERATED' | 'EFACTURA_SUBMITTED'
  | 'SETTINGS_UPDATED' | 'THERAPIST_PROFILE_UPDATED' | 'BILLING_SETTINGS_UPDATED'
  | 'GOOGLE_CONNECTED' | 'GOOGLE_DISCONNECTED'
  | 'PASSWORD_CHANGED' | 'MFA_ENABLED' | 'MFA_DISABLED'
  | 'SESSION_EXPIRED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED'
  | 'SUPPORT_ACCESS_GRANTED' | 'SUPPORT_ACCESS_REVOKED'

export type AuditEntityType =
  | 'client' | 'note' | 'document' | 'contract' | 'consent'
  | 'appointment' | 'assessment' | 'report' | 'invoice' | 'onboarding_link'

export interface AuditEventInput {
  action:          AuditAction
  category:        AuditCategory
  entityType?:     AuditEntityType
  entityId?:       string
  clientId?:       string
  severity?:       AuditSeverity
  status?:         AuditStatus
  metadata?:       Record<string, unknown>
  beforeSnapshot?: Record<string, unknown>
  afterSnapshot?:  Record<string, unknown>
}
```

---

## Reguli de aur — ce nu se loghează niciodată

### Conținut note clinice

```json
// GREȘIT
{ "note_text": "clientul a spus că..." }

// CORECT
{ "note_id": "uuid", "encrypted": true, "operation": "decrypt_for_view" }
```

### CNP

```json
// GREȘIT
{ "cnp": "1901234567890" }

// CORECT
{ "cnp_present": true, "cnp_last4": "7890" }
```

### Output AI

```json
// GREȘIT
{ "prompt": "...", "output": "pacientul suferă de..." }

// CORECT
{ "note_id": "uuid", "model": "gemini-flash", "local": true, "duration_ms": 1240, "status": "success" }
```

### Token-uri și parole

Nu se loghează niciodată: `token`, `tokenHash`, `password`, `secret`, `apiKey`.

---

## UI — `/dashboard/activity`

Pagina există în nav ca „Registru activitate". Trebuie transformată în registru de audit real.

**Fișier:** `src/app/dashboard/activity/page.tsx`

### Filtre (query params)

```
?category=CONTRACT
?severity=CRITICAL
?clientId=uuid
?action=DOCUMENT_DOWNLOADED
?status=FAILED
```

### Coloane afișate

```
Data/Ora | Categorie | Acțiune | Severitate | Client | Entitate | Status
```

Exemplu rând:
```
10:42 · 04 Mai — CONTRACT  CONTRACT_ISSUED  ⚠ WARNING  M.I.  CTR-2026-0004  ✅ SUCCESS
```

### Tab în fișa clientului

Secțiune „Istoric acces" cu:
- dosar deschis / vizualizat
- notă creată / actualizată
- contract emis
- document descărcat
- GDPR acceptat
- raport generat

> Nu se afișează metadata brută sensibilă. Metadata se afișează sumarizat, doar chei safe.

---

## Prioritate de implementare

### P0 — Audit minim serios ✅ IMPLEMENTAT (2026-05-04)

- [x] Migrare SQL `audit_logs` cu RLS strict → `supabase/migrations/20260504000000_audit_logs.sql`
- [x] Helper `logAuditEvent` cu sanitizare metadata → `src/lib/audit/log.ts`
- [x] `logAuditEventAs` pentru contexte service-role (onboarding tokens) → `src/lib/audit/log.ts`
- [x] Tipuri TypeScript complete → `src/lib/audit/types.ts`
- [x] `CONTRACT_ISSUED` → `src/app/dashboard/clients/actions.ts:issueGeneratedContractNumber`
- [x] `CLIENT_CREATED` → `src/app/dashboard/clients/actions.ts:createClient`
- [x] `CLIENT_UPDATED` → `src/app/dashboard/clients/actions.ts:updateClient`
- [x] `NOTE_CREATED` + `NOTE_UPDATED` → `src/app/dashboard/notes/actions.ts:saveEncryptedNote`
- [x] `DOCUMENT_UPLOADED` → `src/app/api/uploads/document/route.ts` + `clients/actions.ts:uploadClientDocument`
- [x] `ONBOARDING_LINK_CREATED` → `src/lib/security/public-links.ts:createOnboardingAccessToken`
- [x] `INVOICE_CREATED` → `src/app/dashboard/invoices/actions.ts:createInvoice`
- [x] `/dashboard/activity` funcțional cu jurnal audit + filtre category/severity/clientId

**Note implementare:**
- Tipurile Supabase nu includ `audit_logs` (migrare nepush-uită local) → cast `as any` în log.ts, safe
- `logAuditEventAs` necesară pentru `public-links.ts` care rulează cu service client, fără sesiune auth
- Erorile de lint pre-existente (ReportEditor, ClientServiceTrackSelect) nu sunt legate de acest task

### P1 — Audit sensibil ✅ IMPLEMENTAT (2026-05-04)

- [x] `CLIENT_ANONYMIZED` → `clients/actions.ts:anonymizeClient` (await înainte de redirect)
- [x] `DOCUMENT_DELETED` → `vault/vault-actions.ts:deleteVaultDocument` (therapist-vault)
- [x] `CONSENT_ACCEPTED` → `onboarding-actions.ts:submitClientOnboarding` (calea dashboard cu sesiune)
- [x] `REPORT_FINALIZED` → `forms-actions.ts:finalizeTherapyReport`
- [x] `AI_SUMMARY_GENERATED` → `logAiSummaryAudit` Server Action în `notes/actions.ts`, apelat din `note-editor.tsx` după runOllama
- [ ] `NOTE_DECRYPTED` — decriptarea e client-side (PBKDF2/AES-GCM în browser), nu are punct server-side clar
- [x] `DOCUMENT_DOWNLOADED` → endpoint-uri explicite `api/documents/patient/[id]/download` și `api/documents/vault/[id]/download`
- [x] `CLIENT_DELETED` → `clients/actions.ts:hardDeleteClient` + pagină dedicată `clients/[id]/delete` (doar fără facturi / ședințe finalizate / contracte generate)
- [x] `CONSENT_REVOKED` → `clients/actions.ts:revokeClientConsent` + confirmare din `ClientDetailOverlay`

### P2 — Audit SaaS avansat ✅ IMPLEMENTAT (2026-05-05)

- [x] `LOGIN_SUCCESS` → `login/actions.ts:signInWithPassword` (await înainte de redirect)
- [x] `BILLING_SETTINGS_UPDATED` (CRITICAL) → `settings-actions.ts:updateProfileSettings` + `updateIntegrationsSettings`
- [x] `SETTINGS_UPDATED` → `settings-actions.ts:updatePricingSettings`, `updateScheduleSettings`, `updateCasSettings`
- [x] `PASSWORD_CHANGED` (CRITICAL) → `settings-actions.ts:updatePinSettings` (PIN note clinice)
- [x] `GOOGLE_CONNECTED` → `api/google/callback/route.ts`
- [x] `CLIENT_EXPORTED` (CRITICAL) → `api/activity/export/route.ts` (registru CPR)
- [x] `CLIENT_EXPORTED` (CRITICAL) → `api/exports/cas/route.ts` (raport SIUI/CAS)
- [x] `LOGIN_FAILED` → `login/actions.ts:signInWithPassword` + migrare DB `20260505225226_audit_log_actor_context.sql` (`therapist_id` nullable pentru actor anonim)
- [ ] `MFA_ENABLED` / `MFA_DISABLED` — MFA nu e implementat în aplicație
- [ ] `SUPPORT_ACCESS_GRANTED` / `SUPPORT_ACCESS_REVOKED` — feature inexistent
- [ ] `EFACTURA_SUBMITTED` — integrare ANAF inexistentă
- [x] `GOOGLE_DISCONNECTED` → `settings-actions.ts:disconnectGoogleIntegration` + UI în `SettingsClient.tsx`
- [x] Tab „Istoric acces" în fișa clientului → query `getClientAccessHistory()` + secțiune în `ClientDashboardUI.tsx`
- [x] Export audit log (CSV) cu severitate CRITICAL → `api/activity/export?dataset=audit` + buton în `dashboard/activity`

---

## Acceptance criteria

1. Există tabela `audit_logs` cu RLS strict — terapeutul vede doar propriile log-uri
2. Există helper `logAuditEvent` server-side cu sanitizare automată
3. Audit insert nu rupe flow-ul principal dacă eșuează (try/catch + console.error)
4. `CONTRACT_ISSUED` este auditat la emitere număr oficial
5. `CLIENT_CREATED` și `CLIENT_UPDATED` sunt auditate
6. `NOTE_CREATED` și `NOTE_UPDATED` sunt auditate fără conținut
7. `DOCUMENT_UPLOADED` este auditat
8. `ONBOARDING_LINK_CREATED` este auditat fără token
9. `/dashboard/activity` afișează audit logs cu filtre de bază
10. Nu se loghează: CNP complet, note brute, token-uri, parole, raw clinical content
11. `npm run lint` trece
12. `npm run build` trece

---

## Titlu PR sugerat

```
feat: add complete audit log foundation
```

## Descriere PR

```markdown
## Summary
- Adds strict multi-tenant `audit_logs` table with RLS (therapist sees only own logs)
- Adds server-side `logAuditEvent` helper with automatic metadata sanitization
- Logs core sensitive events: contracts, clients, notes, documents, onboarding
- Adds functional activity register UI at /dashboard/activity
- Never logs clinical note content, raw tokens, passwords, or complete CNP

## Compliance notes
- `before_snapshot` / `after_snapshot` only for non-sensitive or masked fields
- Audit insert failure is non-blocking (console.error only)
- RLS enforced at DB level — no cross-therapist leakage possible
```
