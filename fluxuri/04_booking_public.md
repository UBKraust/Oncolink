# Flux 04 — Programare Publică (Booking Widget)

## Descriere

Booking-ul public permite oricui să se programeze fără autentificare, prin widget-ul disponibil la `/book`. La submit, sistemul creează automat un client nou (sau îl identifică pe cel existent) și o programare asociată. Este singurul punct de intrare în sistem fără token.

## Fișiere Cheie

- [src/app/book/page.tsx](../src/app/book/page.tsx) — pagina publică booking
- [src/components/booking/BookingForm.tsx](../src/components/booking/BookingForm.tsx) — formular booking
- [src/components/booking/booking-widget.tsx](../src/components/booking/booking-widget.tsx) — widget embedding
- [src/app/api/bookings/create/route.ts](../src/app/api/bookings/create/route.ts) — API endpoint creare
- [src/lib/booking/](../src/lib/booking/) — logica de business booking
- [src/lib/security/](../src/lib/security/) — rate limiting, validare
- [src/app/confirm-result/page.tsx](../src/app/confirm-result/page.tsx) — pagina confirmare

## Diagrama Flux Principal

```mermaid
sequenceDiagram
    actor P as Public (Potențial Client)
    participant BOOK as /book
    participant API as /api/bookings/create
    participant DB as Supabase
    participant MAIL as Email Service

    P->>BOOK: Accesează /book
    BOOK-->>P: Afișează BookingForm\n(calendar disponibilitate + formular)

    P->>BOOK: Selectează data + ora disponibilă
    P->>BOOK: Completează date personale\n(nume, email, telefon, motiv)
    P->>BOOK: Submit

    BOOK->>API: POST /api/bookings/create\n{slot, personalData}

    Note over API: Validare + Rate Limiting
    API->>DB: findExistingClient(email)

    alt Client existent
        DB-->>API: clientId existent
    else Client nou
        API->>DB: INSERT clients\n(status: Onboarding)
        DB-->>API: clientId nou
    end

    API->>DB: INSERT appointments\n(clientId, slot, status: Confirmata)
    API->>DB: INSERT client_status_history

    API->>MAIL: Trimite email confirmare\n(client + terapeut)
    MAIL-->>P: Email confirmare cu detalii

    API-->>BOOK: {success: true, appointmentId}
    BOOK-->>P: Redirect /confirm-result\ncu detalii programare
```

## Diagrama Flux Booking Form (UI)

```mermaid
flowchart TD
    START(["/book"])

    CAL["Calendar Disponibilitate\n(zile + ore libere)"]
    SEL{Slot\nSelectat?}
    FORM["Formular Date Personale\n• Nume complet\n• Email\n• Telefon\n• Motiv consultatie (optional)"]
    
    VAL{Validare\ncâmpuri}
    ERR["Erori inline\npe câmpuri"]
    
    SUBMIT["Submit"]
    RATE{Rate\nLimit OK?}
    RATE_ERR["Eroare: prea multe\ncereri recente"]
    
    PROC["Procesare server:\n1. Verifică slot disponibil\n2. Găsește/creează client\n3. Creează programare\n4. Trimite email"]
    
    CONF(["/confirm-result\nConfirmare cu detalii"])
    ERR2["Eroare: slot ocupat\nsau eroare server"]

    START --> CAL --> SEL
    SEL -->|nu| CAL
    SEL -->|da| FORM
    FORM --> VAL
    VAL -->|invalid| ERR --> FORM
    VAL -->|valid| SUBMIT
    SUBMIT --> RATE
    RATE -->|blocat| RATE_ERR
    RATE -->|ok| PROC
    PROC -->|succes| CONF
    PROC -->|eroare| ERR2
```

## Securitate Booking Public

```mermaid
graph TD
    subgraph SEC["Protecții /api/bookings/create"]
        RL["Rate Limiting\nper IP + email"]
        DUP["Verificare duplicate\n(același slot + email)"]
        VAL["Validare server-side\na tuturor câmpurilor"]
        SLOT["Verificare disponibilitate\nslot în timp real"]
        SPAM["Protecție spam\n(honeypot field + timing)"]
    end

    subgraph DATA["Date Colectate (minim)"]
        D1["Nume complet — obligatoriu"]
        D2["Email — obligatoriu"]
        D3["Telefon — obligatoriu"]
        D4["Motiv — opțional"]
        D5["Slot ales — din UI"]
    end
```

## Starea Clientului după Booking Public

```mermaid
stateDiagram-v2
    [*] --> OnboardingAutomat : booking public submit OK

    OnboardingAutomat --> Programat : programare creată automat

    note right of OnboardingAutomat
        Client creat automat cu:
        - date din formular
        - status: Onboarding
        - programare asociată
    end note

    note right of Programat
        Terapeut poate vedea\nclientul în registru\ncu programarea viitoare
    end note
```

## Pagina de Confirmare

La finalul unui booking reușit, `/confirm-result` afișează:

```
┌─────────────────────────────────────────────────────┐
│ ✅ Programare confirmată!                            │
│                                                     │
│ Data:   Joi, 15 Mai 2025                            │
│ Ora:    10:00                                       │
│ Locație: Cabinet Str. Exemplu nr. 1                 │
│                                                     │
│ Un email de confirmare a fost trimis la             │
│ email@exemplu.ro                                    │
│                                                     │
│ Vă așteptăm!                                        │
└─────────────────────────────────────────────────────┘
```
