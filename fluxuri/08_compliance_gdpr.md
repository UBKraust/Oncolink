# Flux 08 — Conformitate GDPR, CAS Export, Anonimizare

## Descriere

Aplicația este construită cu conformitate GDPR ca cerință de design, nu ca adăugire ulterioară. Există trei mecanisme principale: panoul de conformitate pentru audit vizual, exportul CAS fără PII pentru autorități, și anonimizarea ireversibilă a clienților la cerere.

## Fișiere Cheie

- [src/app/dashboard/compliance/page.tsx](../src/app/dashboard/compliance/page.tsx) — panou conformitate
- [src/components/compliance/CompliancePanel.tsx](../src/components/compliance/CompliancePanel.tsx) — UI GDPR
- [src/lib/compliance/](../src/lib/compliance/) — engine GDPR + sanitizare PII
- [src/app/dashboard/cas/](../src/app/dashboard/cas/) — modul CAS
- [src/components/cas/CasModuleUI.tsx](../src/components/cas/CasModuleUI.tsx) — UI export CAS
- [src/components/cas/ReferralUploader.tsx](../src/components/cas/ReferralUploader.tsx) — upload referințe
- [src/app/api/exports/cas/route.ts](../src/app/api/exports/cas/route.ts) — API export CAS
- [src/app/dashboard/clients/[id]/anonymize/](../src/app/dashboard/clients/[id]/anonymize/) — anonimizare client
- [src/app/dashboard/activity/](../src/app/dashboard/activity/) — registru activitate
- [src/app/api/health/data-integrity/route.ts](../src/app/api/health/data-integrity/route.ts) — verificare integritate

## Diagrama Conformitate GDPR

```mermaid
flowchart TD
    subgraph GDPR["Mecanisme GDPR"]
        CONSENT["Consimțământ colectat\nla onboarding\n(adult + minor/tutore)"]
        ENCRYPT["Criptare note clinice\nAES-GCM 256 (end-to-end)"]
        RLS["Row-Level Security\nSupabase (per terapeut)"]
        ANON["Anonimizare ireversibilă\nla cerere client"]
        AUDIT["Audit trail complet\n(client_status_history + activity log)"]
        EXPORT["Export CAS fără PII\n(date anonimizate pt. autorități)"]
        HEALTH["Health check\nintegritate date\n/api/health/data-integrity"]
    end

    CONSENT --> AUDIT
    AUDIT --> EXPORT
    ANON --> AUDIT
```

## Flux Anonimizare Client (GDPR Delete Request)

```mermaid
sequenceDiagram
    actor C as Client (cerere verbală/email)
    actor T as Terapeut
    participant UI as Dashboard
    participant DB as Supabase
    participant LOG as Activity Log

    C->>T: Cerere ștergere date personale\n(drept GDPR Art. 17)

    T->>UI: /dashboard/clients/[id]/anonymize
    UI-->>T: Pagina confirmare cu avertisment\n(acțiune IREVERSIBILĂ)

    T->>UI: Bifează înțelegere + confirm
    UI->>DB: anonymizeClient(clientId)

    Note over DB: Anonymize:
    DB->>DB: UPDATE clients SET\nnume = "Client Anonim"\nemail = NULL\ntelefon = NULL\ncnp = NULL\nadresa = NULL\nguardian_* = NULL\nstatus = "Anonimizat"

    DB->>DB: Păstrează:\n- appointmentDates (statistici)\n- invoiceTotals (contabilitate)\n- statusHistory (anonymizat)\n- assessmentScores (anonime)

    DB->>DB: DELETE onboarding_tokens (clientId)
    DB->>LOG: logActivity("GDPR_ANONYMIZE", clientId, userId)

    DB-->>UI: ✅ client anonimizat
    UI-->>T: Confirmare\n"Datele personale au fost șterse"

    Note over T: Clientul dispare din registrul\nactiv — apare în audit log\nca "Client Anonim"
```

## Export CAS (Sistemul de Asistență Socială)

```mermaid
sequenceDiagram
    actor T as Terapeut
    participant CAS_UI as /dashboard/cas
    participant API as /api/exports/cas
    participant DB as Supabase
    participant SAN as Sanitizare PII

    T->>CAS_UI: Accesează modul CAS
    CAS_UI-->>T: Formular export:\n• Perioadă (de la / până la)\n• Tip date\n• Format (JSON/CSV)

    T->>CAS_UI: Configurează + Exportă
    CAS_UI->>API: GET /api/exports/cas?from=&to=&type=

    API->>DB: getAppointmentsInRange(from, to)
    DB-->>API: date cu PII

    API->>SAN: sanitizePII(data)
    Note over SAN: Elimină: nume, email,\ntelefon, CNP, adresă\nPăstrează: vârstă, gen,\ncategorie diagnostic, nr. ședințe

    SAN-->>API: date fără PII

    API-->>CAS_UI: Export JSON/CSV
    CAS_UI-->>T: Download fișier

    Note over T: Fișierul conține NUMAI\ndate statistice anonimizate\ncompatibile cu raportarea CAS
```

## Panou Conformitate GDPR

```mermaid
flowchart LR
    subgraph PANEL["/dashboard/compliance — CompliancePanel"]
        OVERVIEW["Overview Conformitate\n• Nr. clienți cu consimțământ\n• Nr. fără consimțământ (alertă)\n• Date expirare consimțăminte"]
        
        REQUESTS["Cereri GDPR Înregistrate\n• Cereri de acces\n• Cereri de ștergere\n• Status per cerere"]
        
        HEALTH_C["Stare Tehnică\n• RLS activ ✅\n• Backup criptare ✅\n• Audit log activ ✅"]
        
        EXPORT_C["Export Raport Conformitate\n(PDF pentru auditor)"]
    end
```

## Registru de Activitate

```mermaid
flowchart TD
    subgraph ACTIVITY["/dashboard/activity"]
        LOG["Audit Trail\nToate acțiunile din aplicație:\n• Creare/editare client\n• Onboarding finalizat\n• Programare creată/anulată\n• Factură emisă\n• Anonimizare GDPR\n• Login/logout"]

        FILTER["Filtrare:\n• Per tip acțiune\n• Per client\n• Per dată"]

        EXPORT_A["Export CSV\n(pentru audit intern)"]
    end

    LOG --> FILTER --> EXPORT_A
```

## Health Check Date

```mermaid
sequenceDiagram
    participant CRON as Monitor/Cron
    participant API as /api/health/data-integrity
    participant DB as Supabase

    CRON->>API: GET /api/health/data-integrity

    API->>DB: checkOrphanedAppointments()
    API->>DB: checkClientsWithoutConsent()
    API->>DB: checkExpiredTokens()
    API->>DB: checkEncryptionIntegrity()

    DB-->>API: rezultate checks

    alt Totul OK
        API-->>CRON: {status: "healthy", checks: [...]}
    else Probleme detectate
        API-->>CRON: {status: "degraded", issues: [...]}
        Note over CRON: Alert pentru terapeut/admin
    end
```

## Straturi de Securitate

```mermaid
graph TD
    subgraph LAYERS["Straturi de Securitate (Defense in Depth)"]
        L1["L1 — Autentificare\nSupabase Auth (session-based)\nServer-side validation"]

        L2["L2 — Autorizare\nRow-Level Security (RLS) Supabase\nFiecare terapeut vede DOAR propriii clienți"]

        L3["L3 — Criptare la Repaus\nNote clinice: AES-GCM 256\nCheia niciodată pe server"]

        L4["L4 — Criptare in Transit\nHTTPS obligatoriu\nSupabase SSL"]

        L5["L5 — Acces Public Limitat\nBooking: rate limiting per IP\nOnboarding: token cu expirare\nFără enumeration de clienți"]

        L6["L6 — Audit Trail\nToate acțiunile loggate\nAnonimizare GDPR cu log"]
    end

    L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

## Upload Referințe Medicale

```mermaid
flowchart LR
    T[Terapeut] -->|upload fișier| REF["/dashboard/cas\nReferralUploader"]
    REF --> API["/api/uploads/referral"]
    API --> STORE["Supabase Storage\n(private bucket)"]
    STORE --> LINK["URL privat\ncu access control"]
    LINK --> FISA["Visible în fișa\nclientului asociat"]
```
