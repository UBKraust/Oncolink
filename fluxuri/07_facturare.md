# Flux 07 — Facturare + SmartBill

## Descriere

Facturarea este gestionată intern cu SmartBill ca sistem extern de emitere. În starea actuală, aplicația separă clar trei etape:

1. calculul și închiderea lunii în `/dashboard/billing`;
2. pregătirea internă a facturilor pentru financiar, cu status local `PREGĂTITĂ`;
3. trimiterea efectivă în SmartBill din registrul de facturi.

## Fișiere Cheie

- [src/app/dashboard/invoices/](../src/app/dashboard/invoices/) — paginile de facturi
- [src/components/invoices/invoice-form.tsx](../src/components/invoices/invoice-form.tsx) — formular factură
- [src/components/invoices/invoice-actions.tsx](../src/components/invoices/invoice-actions.tsx) — acțiuni factură
- [src/app/dashboard/invoices/actions.ts](../src/app/dashboard/invoices/actions.ts) — Server Actions CRUD
- [src/lib/billing/monthly-summary.ts](../src/lib/billing/monthly-summary.ts) — sursa comună pentru sumarul lunar
- [src/lib/smartbill/](../src/lib/smartbill/) — client API SmartBill
- [src/app/api/webhooks/smartbill/route.ts](../src/app/api/webhooks/smartbill/route.ts) — webhook SmartBill
- [src/app/api/billing/monthly-export/route.ts](../src/app/api/billing/monthly-export/route.ts) — export lunar CSV
- [src/app/dashboard/billing/page.tsx](../src/app/dashboard/billing/page.tsx) — raport financiar lunar
- [src/app/dashboard/expenses/](../src/app/dashboard/expenses/) — cheltuieli cabinet

## Diagrama Flux Facturare

```mermaid
sequenceDiagram
    actor T as Terapeut
    participant UI as Dashboard UI
    participant DB as Supabase
    participant SB as SmartBill API

    Note over T,SB: CALCUL LUNAR → COADĂ FINANCIARĂ

    T->>UI: /dashboard/billing
    UI-->>T: Raport lunar calculat\n(ședințe, ore, sume)
    T->>UI: "Trimite la financiar"
    UI->>DB: INSERT invoices\n{appointment_id, amount, status: PREGĂTITĂ}
    UI-->>T: Coada financiară creată ✅

    Note over T,SB: FINANCIAR → EMITERE SMARTBILL

    T->>UI: /dashboard/invoices?status=PREGĂTITĂ
    UI-->>T: Registru facturi pregătite
    T->>UI: Deschide factură\n→ "Trimite în SmartBill"
    UI->>SB: POST /invoice (SmartBill API)
    SB-->>UI: {series, number, paymentLink, pdf}
    UI->>DB: UPDATE invoices SET\nsmartbill_id, smartbill_series,\nsmartbill_number, status: EMISĂ

    UI-->>T: Factură emisă ✅

    Note over T,SB: WEBHOOK CONFIRMARE

    SB->>UI: POST /api/webhooks/smartbill\n(confirmare/status update)
    UI->>DB: UPDATE invoices SET status

    Note over T,SB: FACTURARE MANUALĂ DIRECTĂ

    T->>UI: /dashboard/invoices/new
    UI-->>T: InvoiceForm
    T->>UI: Submit
    UI->>SB: emitere directă (dacă SmartBill este configurat)
    UI->>DB: persistă factura local
```

## Stările unei Facturi

```mermaid
stateDiagram-v2
    [*] --> Pregatita : creată pentru financiar

    Pregatita --> Emisa : trimitere la SmartBill
    Emisa --> Platita : confirmare plată
    Emisa --> Restanta : follow-up financiar
    Restanta --> Platita : plată tardivă
    Emisa --> Anulata : anulare
    Pregatita --> Anulata : anulare înainte de emitere
    Platita --> [*]
    Anulata --> [*]
```

## Raportare Financiară

```mermaid
flowchart TD
    subgraph BILLING["/dashboard/billing — Raport Lunar"]
        CALC["Calculează luna\nședințe + ore + sume"]
        QUEUE["Trimite la financiar\ncreează PREGĂTITĂ"]
        EXPORT["Export lunar CSV\n/api/billing/monthly-export"]
        FORE["Revenue Forecast\n/api/billing/revenue-forecast"]
    end

    subgraph INVOICES["/dashboard/invoices — Coada financiară"]
        PREP["Filtru PREGĂTITĂ"]
        SEND["Trimite în SmartBill"]
        FOLLOW["Urmărește EMISĂ / RESTANTĂ / PLĂTITĂ"]
    end

    BILLING --> INVOICES
```

## Management Cheltuieli

```mermaid
flowchart LR
    subgraph EXPENSES["/dashboard/expenses"]
        ADD["Adaugă cheltuială\n(chirie, utilități, training, etc.)"]
        CAT["Categorizare\n(tip cheltuială)"]
        LIST["Listă cheltuieli\nfiltrate pe lună"]
    end

    subgraph IMPORT["Import Cheltuieli"]
        CSV["/api/imports/expenses\nImport din CSV/Excel"]
    end

    EXPENSES --> IMPORT
    EXPENSES --> BILLING
    BILLING["Dashboard Billing\n(calcul net)"]
```

## Schema Factură

```mermaid
erDiagram
    invoices {
        uuid id PK
        uuid appointment_id FK
        text client_name
        text smartbill_id
        text smartbill_series
        text smartbill_number
        decimal amount
        text status "Pregatita|Emisa|Platita|Restanta|Anulata"
        text payment_link
        text pdf_url
        timestamptz issued_at
        uuid therapist_id
    }
    expenses {
        uuid id PK
        text description
        text category
        decimal amount
        date expense_date
        text receipt_url
    }
    invoices }o--|| appointments : "asociată ședinței"
```

## Contract UX Curent

- `/dashboard/billing` este suprafața de calcul și închidere lunară
- `Trimite la financiar` nu trimite direct în SmartBill; doar pregătește coada internă
- `/dashboard/invoices` este spațiul financiar de control operațional
- `PREGĂTITĂ` înseamnă:
  - factura există local
  - este asociată unei programări
  - poate fi verificată de financiar
  - abia apoi este emisă în SmartBill

## SmartBill Integration

```mermaid
graph LR
    subgraph DB["Supabase"]
        INV[("invoices table")]
    end

    subgraph SMARTBILL["SmartBill"]
        API["SmartBill REST API"]
        WEB["Webhook callbacks"]
    end

    subgraph APP["Aplicație"]
        CLIENT["src/lib/smartbill/client.ts"]
        WEBHOOK["api/webhooks/smartbill"]
        IMPORT["api/imports/invoices"]
    end

    CLIENT -->|emitere factură| API
    API -->|nr. factură + ID| CLIENT
    WEB -->|status updates| WEBHOOK
    IMPORT -->|sync import| API
    API -->|lista facturi| IMPORT
    CLIENT --> INV
    WEBHOOK --> INV
    IMPORT --> INV
```
