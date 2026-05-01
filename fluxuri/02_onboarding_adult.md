# Flux 02 — Onboarding Pacient Adult

## Descriere

Onboarding-ul pentru adulți este un flux cu doi actori: terapeutul inițiază din dashboard, pacientul finalizează pe un link public securizat cu token. Fluxul garantează că datele clinice ajung în fișa corectă fără a expune date despre alți clienți.

## Fișiere Cheie

- [src/app/onboarding/page.tsx](../src/app/onboarding/page.tsx) — pagina publică
- [src/components/onboarding/ClientOnboardingWizard.tsx](../src/components/onboarding/ClientOnboardingWizard.tsx) — wizard multi-pas
- [src/app/dashboard/clients/onboarding-actions.ts](../src/app/dashboard/clients/onboarding-actions.ts) — generare token, confirmare
- [src/lib/security/public-links.ts](../src/lib/security/public-links.ts) — generare și validare token
- [src/lib/clients/lifecycle-sync.ts](../src/lib/clients/lifecycle-sync.ts) — tranziție status la finalizare

## Diagrama Flux

```mermaid
sequenceDiagram
    actor T as Terapeut
    actor P as Pacient Adult
    participant DB as Supabase
    participant UI as Dashboard UI
    participant PUB as /onboarding

    T->>UI: /dashboard/clients/new\n(creare client)
    UI->>DB: INSERT clients (status: Lead nou)
    UI-->>T: Fișa client creată

    T->>UI: Fișa client → "Generează link onboarding"
    UI->>DB: generateOnboardingToken(clientId)
    DB-->>UI: token UUID unic
    UI-->>T: Link: /onboarding?t=<token>\n(copiat în clipboard)

    T->>P: Trimite link prin email/SMS

    P->>PUB: Accesează /onboarding?t=<token>
    PUB->>DB: validateToken(token) → clientId
    DB-->>PUB: ✅ token valid

    Note over PUB: Wizard multi-pas
    P->>PUB: Pas 1 — Date personale\n(nume, dată naștere, adresă)
    P->>PUB: Pas 2 — Antecedente medicale
    P->>PUB: Pas 3 — Consimțământ semnat
    P->>PUB: Submit final

    PUB->>DB: upsertClientData(clientId, formData)
    PUB->>DB: markTokenUsed(token)
    PUB->>DB: updateStatus(clientId, "Onboarding")
    DB-->>PUB: ✅ salvat

    PUB-->>P: Pagina de confirmare

    Note over T,DB: Terapeut vede statusul actualizat
    T->>UI: /dashboard/clients/[id]
    UI->>DB: getClient(clientId)
    DB-->>UI: client cu status "Onboarding"\n+ date completate
    UI-->>T: Fișa actualizată cu\nbanner "Onboarding finalizat"
```

## Pașii Wizard-ului de Onboarding

```mermaid
flowchart LR
    START([Accesare link\n/onboarding?t=token])

    V{Token\nvalid?}
    ERR[Pagină eroare:\nLink invalid sau expirat]

    P1["Pas 1\nDate Personale\n• Nume complet\n• Data nașterii\n• Adresă\n• Telefon"]
    P2["Pas 2\nAntecedente\n• Istoric medical\n• Medicamente\n• Alergii"]
    P3["Pas 3\nConsimțământ\n• Citire termeni\n• Semnătură digitală\n• Confirmare GDPR"]

    SUB[Submit]
    DB[(Supabase\nupsert + token used)]
    DONE([Confirmare\nSucces])

    START --> V
    V -->|invalid| ERR
    V -->|valid| P1
    P1 -->|validare inline| P2
    P2 -->|validare inline| P3
    P3 --> SUB --> DB --> DONE
```

## Reguli de Securitate

```mermaid
graph TD
    subgraph TOKEN["Securitate Token"]
        GEN["generateOnboardingToken()\n→ UUID v4 unic în DB"]
        SINGLE["Un singur token activ\nper client la un moment"]
        USED["Token marcat used\nla prima utilizare"]
        EXP["Token expirat după X zile\n(configurat în env)"]
    end

    subgraph ROUTE["Securitate Rută"]
        NO_AUTH["Ruta publică\n(fără autentificare)"]
        ONLY_TOKEN["Accesibil DOAR cu token valid\nNu există UI fără token"]
        NO_LIST["Nu expune alți clienți\nNu listează date externe"]
    end
```

## Validare pe Pași

- Fiecare pas este validat inline înainte de a permite trecerea la pasul următor
- Erorile sunt afișate inline (nu `alert()`)
- Utilizatorul nu poate sări un pas incomplet
- Datele sunt salvate la submit final, nu pas cu pas (evitare date parțiale)
