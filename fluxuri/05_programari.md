# Flux 05 — Management Programări (Ședințe)

## Descriere

Programările sunt nucleul operațional al cabinetului. Pot fi create de terapeut (din dashboard) sau de client (booking public). Sunt sincronizate cu Google Calendar, generează remindere automate prin email, și sunt legate de note clinice și facturi.

## Fișiere Cheie

- [src/app/dashboard/appointments/](../src/app/dashboard/appointments/) — paginile de programări
- [src/components/appointments/appointment-form.tsx](../src/components/appointments/appointment-form.tsx) — formular creare/editare
- [src/components/appointments/SessionDrawer.tsx](../src/components/appointments/SessionDrawer.tsx) — drawer detalii ședință
- [src/components/appointments/AppointmentsViewManager.tsx](../src/components/appointments/AppointmentsViewManager.tsx) — manager vizualizare
- [src/app/dashboard/appointments/actions.ts](../src/app/dashboard/appointments/actions.ts) — Server Actions CRUD
- [src/app/dashboard/appointments/session-actions.ts](../src/app/dashboard/appointments/session-actions.ts) — acțiuni ședință
- [src/app/api/cron/reminders/route.ts](../src/app/api/cron/reminders/route.ts) — remindere automate
- [src/lib/google/](../src/lib/google/) — integrare Google Calendar

## Diagrama Flux Complet

```mermaid
sequenceDiagram
    actor T as Terapeut
    participant UI as Dashboard UI
    participant DB as Supabase
    participant GCAL as Google Calendar
    participant MAIL as Email Service

    Note over T,MAIL: CREARE PROGRAMARE

    T->>UI: /dashboard/appointments/new\nsau Fișa Client → "Programare nouă"
    UI-->>T: AppointmentForm\n(client, dată, oră, tip, observații)
    T->>UI: Completează + Submit
    UI->>DB: INSERT appointments\n{clientId, date, time, type, notes}
    DB-->>UI: appointmentId

    UI->>GCAL: createCalendarEvent(appointment)
    GCAL-->>UI: eventId
    UI->>DB: UPDATE appointments SET gcal_event_id

    UI->>MAIL: scheduleReminder(clientEmail, appointment)
    UI-->>T: Programare creată ✅

    Note over T,MAIL: ÎNAINTE DE ȘEDINȚĂ (CRON)

    MAIL->>MAIL: /api/cron/reminders\n(rulat la 24h + 1h înainte)
    MAIL->>DB: getUpcomingAppointments()
    MAIL->>MAIL: sendReminderEmail(client, appointment)

    Note over T,MAIL: ÎN ZIUA ȘEDINȚEI

    T->>UI: /dashboard/appointments sau /dashboard/calendar
    UI-->>T: Vedere zilnică/săptămânală\ncu programările de azi

    T->>UI: Click programare → SessionDrawer
    UI-->>T: Detalii + acțiuni:\n• Marchează completă\n• Adaugă notă clinică\n• Creează factură\n• Reprogramează

    T->>UI: "Marchează ședință completă"
    UI->>DB: UPDATE appointments SET status=Completata
    UI->>DB: updateClientStatus(clientId, Activ)
    UI-->>T: Status actualizat ✅

    Note over T,MAIL: POST-ȘEDINȚĂ

    T->>UI: /dashboard/notes/[appointmentId]
    UI-->>T: Editor note clinice\n(criptat AES-256)

    T->>UI: /dashboard/invoices/new
    UI-->>T: Formular factură\npre-completat cu clientul
```

## Stările unei Programări

```mermaid
stateDiagram-v2
    [*] --> Programata : creare (dashboard sau booking)

    Programata --> Confirmata : confirmare automată\nsau manuală
    Confirmata --> Completata : terapeut marchează\nședința finalizată
    Completata --> [*]

    Confirmata --> Anulata : terapeut sau client\nanulează
    Programata --> Anulata : anulare înainte de confirmare
    Anulata --> Programata : reprogramare

    Completata --> ReprogramataLa : necesită follow-up\n(recurente)
    ReprogramataLa --> Programata : nouă instanță creată
```

## Tipuri de Vizualizare

```mermaid
graph LR
    subgraph VIEWS["/dashboard/appointments — Vizualizări"]
        LIST["📋 Listă\nCronologică cu filtre\nper status / client"]
        CAL_W["📅 Calendar Săptămânal\n/dashboard/calendar\n(week-view.tsx)"]
        CAL_M["📅 Calendar Lunar\n(month-view)"]
        DRAWER["🔲 Session Drawer\nDetalii + acțiuni rapide\nper programare"]
    end

    LIST <-->|toggle| CAL_W
    CAL_W <-->|zoom out| CAL_M
    LIST --> DRAWER
    CAL_W --> DRAWER
```

## Integrare Google Calendar

```mermaid
flowchart TD
    AUTH["Terapeut conectează\nGoogle Calendar\n/api/google/auth → OAuth"]
    CALLBACK["/api/google/callback\nstochează token în DB"]
    
    SYNC_OUT["La orice creare/editare/\nștergere programare:\nsync → Google Calendar"]
    WEBHOOK["/api/google/webhook\nSync bidirecțional:\nmodificări din GCal → DB"]

    AUTH --> CALLBACK --> SYNC_OUT
    SYNC_OUT --> WEBHOOK
```

## Programări Recurente

```mermaid
flowchart LR
    CREATE["Terapeut creează\nprogramare recurentă\n(săptămânal/bi-săptămânal)"]
    RULE["Regula de recurență\nstocată în DB\n(0015_recurring_appointments.sql)"]
    GEN["Generator automat:\ncrează instanțele viitoare\npe baza regulii"]
    CANCEL["Anulare individuală\nsau a întregii serii"]

    CREATE --> RULE --> GEN
    GEN --> CANCEL
```

## Remindere Automate (Cron)

```mermaid
sequenceDiagram
    participant CRON as Cron Job
    participant DB as Supabase
    participant MAIL as Email Service
    actor C as Client

    Note over CRON: Rulat periodic (via cron extern)

    CRON->>DB: GET appointments WHERE\ndate = tomorrow AND status=Confirmata
    DB-->>CRON: lista programări

    loop pentru fiecare programare
        CRON->>MAIL: sendReminder(client.email, appointment)
        MAIL-->>C: Email reminder cu detalii
        CRON->>DB: logReminderSent(appointmentId)
    end
```
