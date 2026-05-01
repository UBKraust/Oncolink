# Flux 07 — Facturare + SmartBill

## Descriere

Facturarea este gestionată intern cu SmartBill ca sistem extern de emitere. Terapeutul creează facturi din dashboard, acestea sunt trimise către SmartBill prin API, iar raportarea financiară (revenue forecast, cheltuieli, bilanț lunar) este generată intern.

## Fișiere Cheie

- [src/app/dashboard/invoices/](../src/app/dashboard/invoices/) — paginile de facturi
- [src/components/invoices/invoice-form.tsx](../src/components/invoices/invoice-form.tsx) — formular factură
- [src/components/invoices/invoice-actions.tsx](../src/components/invoices/invoice-actions.tsx) — acțiuni factură
- [src/app/dashboard/invoices/actions.ts](../src/app/dashboard/invoices/actions.ts) — Server Actions CRUD
- [src/lib/smartbill/](../src/lib/smartbill/) — client API SmartBill
- [src/app/api/webhooks/smartbill/route.ts](../src/app/api/webhooks/smartbill/route.ts) — webhook SmartBill
- [src/app/api/imports/invoices/route.ts](../src/app/api/imports/invoices/route.ts) — import facturi existente
- [src/app/dashboard/billing/page.tsx](../src/app/dashboard/billing/page.tsx) — raport financiar lunar
- [src/app/dashboard/expenses/](../src/app/dashboard/expenses/) — cheltuieli cabinet

## Diagrama Flux Facturare

```mermaid
sequenceDiagram
    actor T as Terapeut
    participant UI as Dashboard UI
    participant DB as Supabase
    participant SB as SmartBill API

    Note over T,SB: CREARE FACTURĂ MANUALĂ

    T->>UI: /dashboard/invoices/new\nsau Ședință → "Creează factură"
    UI-->>T: InvoiceForm\n(client pre-completat dacă din ședință)

    T->>UI: Completează:\n• Client\n• Servicii + tarife\n• Data emitere\n• Scadență

    T->>UI: Submit
    UI->>DB: INSERT invoices\n{clientId, items, amount, status: Draft}

    T->>UI: "Emite factură (SmartBill)"
    UI->>SB: POST /invoices (SmartBill API)
    SB-->>UI: {invoiceNumber, invoiceId}

    UI->>DB: UPDATE invoices SET\nsmartbill_id, invoice_number,\nstatus: Emisa

    UI-->>T: Factură emisă ✅\n(nr. factură SmartBill)

    Note over T,SB: WEBHOOK CONFIRMARE

    SB->>UI: POST /api/webhooks/smartbill\n(confirmare/status update)
    UI->>DB: UPDATE invoices SET status

    Note over T,SB: IMPORT FACTURI EXISTENTE

    T->>UI: /dashboard/settings → Import
    UI->>SB: GET /invoices (SmartBill API)
    SB-->>UI: lista facturi existente
    UI->>DB: UPSERT invoices (sync)
    UI-->>T: Facturi importate ✅
```

## Stările unei Facturi

```mermaid
stateDiagram-v2
    [*] --> Draft : creare în dashboard

    Draft --> Emisa : trimitere la SmartBill
    Emisa --> Platita : confirmare plată
    Emisa --> Scadenta : depășit termenul
    Scadenta --> Platita : plată tardivă
    Emisa --> Stornata : stornare
    Platita --> [*]
    Stornata --> [*]
```

## Raportare Financiară

```mermaid
flowchart TD
    subgraph BILLING["/dashboard/billing — Raport Lunar"]
        REV["Revenue\nTotal încasat luna curentă"]
        EXP["Cheltuieli\nTotal cheltuieli înregistrate"]
        NET["Net\nVenit net (Revenue - Cheltuieli)"]
        FORE["Revenue Forecast\n/api/billing/revenue-forecast\n(proiecție bazată pe programări viitoare)"]
        MONTHLY["/api/analytics/monthly-review\nRaport detaliat per lună"]
    end

    subgraph REVIEW["/dashboard/review — Review Lunar"]
        KPI["KPI-uri lunare:\n• Clienți noi\n• Ședințe completate\n• Revenue\n• Rata prezentare"]
        EXPORT["Export raport PDF\n(src/lib/pdf/)"]
    end

    BILLING --> REVIEW
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
        uuid client_id FK
        uuid appointment_id FK
        text invoice_number
        text smartbill_id
        decimal amount
        text status "Draft|Emisa|Platita|Scadenta|Stornata"
        date issue_date
        date due_date
        jsonb items
        timestamp created_at
    }
    expenses {
        uuid id PK
        text description
        text category
        decimal amount
        date expense_date
        text receipt_url
    }
    clients ||--o{ invoices : "are facturi"
    invoices }o--|| appointments : "asociată ședinței"
```

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
