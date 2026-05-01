# Flux 03 — Onboarding Pacient Minor

## Descriere

Onboarding-ul pentru minori diferă de cel adult prin: participarea tutorelui/reprezentantului legal (nu minorul), câmpuri specifice de guardian, și condiții legale de consimțământ distinct. Ruta publică funcționează **doar** cu token securizat — nu există formular generic public pentru minori.

## Fișiere Cheie

- [src/app/onboarding/minor/page.tsx](../src/app/onboarding/minor/page.tsx) — pagina publică minor
- [src/components/onboarding/MinorOnboardingWizard.tsx](../src/components/onboarding/MinorOnboardingWizard.tsx) — wizard tutore
- [src/app/dashboard/clients/new-minor/page.tsx](../src/app/dashboard/clients/new-minor/page.tsx) — creare minor în dashboard
- [src/app/dashboard/clients/onboarding-actions.ts](../src/app/dashboard/clients/onboarding-actions.ts) — token minor
- [supabase/migrations/20260425234603_backfill_legacy_minor_guardian_fields.sql](../supabase/migrations/20260425234603_backfill_legacy_minor_guardian_fields.sql) — câmpuri guardian

## Diferențe față de Onboarding Adult

| Aspect | Adult | Minor |
|--------|-------|-------|
| Actor public | Pacientul însuși | Tutorele / Reprezentantul legal |
| Câmpuri | Date personale pacient | Date pacient + date guardian |
| Consimțământ | Auto-consimțământ | Consimțământ parental |
| Rută publică | `/onboarding?t=` | `/onboarding/minor?t=` |
| Creare dashboard | `/dashboard/clients/new` | `/dashboard/clients/new-minor` |
| Fallback public | NU (doar cu token) | NU (doar cu token) |

## Diagrama Flux

```mermaid
sequenceDiagram
    actor T as Terapeut
    actor G as Tutore/Guardian
    participant DB as Supabase
    participant UI as Dashboard
    participant PUB as /onboarding/minor

    T->>UI: /dashboard/clients/new-minor\n(creare fișă minor)
    UI->>DB: INSERT clients (is_minor: true,\nstatus: Lead nou)
    UI-->>T: Fișă minor creată

    T->>UI: Fișă client → "Copiază link onboarding minor"
    UI->>DB: generateOnboardingToken(clientId, type: minor)
    DB-->>UI: token securizat
    UI-->>T: Link: /onboarding/minor?t=<token>

    T->>G: Trimite link tutorelui

    G->>PUB: Accesează /onboarding/minor?t=<token>
    PUB->>DB: validateToken(token, type: minor) → clientId
    DB-->>PUB: ✅ token valid pentru minor

    Note over PUB: Wizard Guardian
    G->>PUB: Pas 1 — Date Minor\n(nume, dată naștere, CNP)
    G->>PUB: Pas 2 — Date Guardian\n(nume tutore, relație, contact)
    G->>PUB: Pas 3 — Antecedente Minorului
    G->>PUB: Pas 4 — Consimțământ Parental\n(semnătură reprezentant legal)
    G->>PUB: Submit final

    PUB->>DB: upsertMinorData(clientId, minorData, guardianData)
    PUB->>DB: markTokenUsed(token)
    PUB->>DB: updateStatus(clientId, "Onboarding")
    DB-->>PUB: ✅ salvat

    PUB-->>G: Confirmare completare

    T->>UI: Fișa minorului actualizată\n(onboarding finalizat, date guardian vizibile)
```

## Pașii Wizard-ului pentru Tutore

```mermaid
flowchart LR
    START(["/onboarding/minor?t=token"])

    V{Token minor\nvalid?}
    ERR[Eroare:\nLink invalid]

    P1["Pas 1\nDate Minor\n• Nume complet\n• Data nașterii\n• CNP\n• Adresă"]
    P2["Pas 2\nDate Tutore\n• Nume tutore\n• Relație (părinte/\ncurator/etc.)\n• Telefon + email"]
    P3["Pas 3\nAntecedente Minor\n• Istoric medical\n• Medicamente\n• Alergii\n• Observații școlare"]
    P4["Pas 4\nConsimțământ Parental\n• Termeni legali\n• Semnătură tutore\n• Confirmare GDPR\n(pentru minor)"]

    SUB[Submit]
    DB[(Supabase\nmajor + guardian data)]
    DONE([Confirmare])

    START --> V
    V -->|invalid| ERR
    V -->|valid| P1 --> P2 --> P3 --> P4 --> SUB --> DB --> DONE
```

## Câmpuri Guardian în Schema DB

```mermaid
erDiagram
    clients {
        uuid id PK
        boolean is_minor
        text guardian_name
        text guardian_relationship
        text guardian_phone
        text guardian_email
        text guardian_cnp
        text status
        timestamp onboarding_completed_at
    }
    onboarding_tokens {
        uuid id PK
        uuid client_id FK
        text token
        text type "adult | minor"
        boolean used
        timestamp expires_at
    }
    clients ||--o{ onboarding_tokens : "are token"
```

## Banner în Fișa Clientului Minor

Când onboarding-ul **nu** este finalizat, fișa clientului minor afișează un CTA explicit:

```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Onboarding necompletat                          │
│                                                     │
│ Trimite link-ul de onboarding tutorelui pentru      │
│ a completa datele pacientului minor.                │
│                                                     │
│ [📋 Copiază link onboarding minor]                  │
└─────────────────────────────────────────────────────┘
```
