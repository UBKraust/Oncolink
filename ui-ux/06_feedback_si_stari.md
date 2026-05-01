# Feedback și Stări UI

Documentează toate mecanismele de feedback vizual: toast-uri, empty states, loading, erori, banner-uri de setup.

---

## Toast Notifications

**Fișier:** [src/components/ui/toast.tsx](../src/components/ui/toast.tsx)

### API

```typescript
toast.success("Clientul a fost salvat.")   // auto-close: 3000ms
toast.error("Eroare la salvare.")          // auto-close: 5000ms
```

### Vizual

```
Bottom-right, fixed, z-[300]

┌────────────────────────────────┐
│  ● Clientul a fost salvat.  ✕  │  ← success (border emerald, dot verde)
└────────────────────────────────┘

┌────────────────────────────────┐
│  ● Eroare la salvare.       ✕  │  ← error (border rose, dot roșu)
└────────────────────────────────┘
```

### Styling

| Tip | Background | Border | Dot | Text |
|-----|-----------|--------|-----|------|
| success | white | `border-emerald-100` | `bg-emerald-500` | `text-emerald-900` |
| error | white | `border-rose-100` | `bg-rose-500` | `text-rose-900` |

```css
/* Container toast */
position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 300;
display: flex; flex-direction: column; gap: 0.75rem;
pointer-events: none;

/* Item toast */
pointer-events: auto;
padding: 1rem 1.5rem;
border-radius: 1rem;
box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
border: 1px solid;
min-width: 300px;

/* Animație intrare */
animation: animate-in slide-in-from-right-10 fade-in; duration: 300ms;

/* Indicator dot */
height: 0.5rem; width: 0.5rem; border-radius: 9999px; animation: animate-pulse;
```

### Pattern de utilizare în componente

```tsx
"use client";
import { toast } from "@/components/ui/toast";

// La submit reușit
toast.success("Programarea a fost salvată.");

// La eroare server
toast.error(result.error ?? "Eroare necunoscută. Încearcă din nou.");

// După acțiune de lifecycle
toast.success("Clientul a fost marcat activ.");
```

---

## Empty State

**Componentă:** `EmptyState` din [src/components/app/page-shell.tsx](../src/components/app/page-shell.tsx)

### Vizual

```
        ┌──────────┐
        │  [Icon]  │   ← container h-14 w-14 rounded-[1.25rem] bg-primary/10
        └──────────┘
         Titlu stare
         Descriere muted

        [  Acțiune  ]   ← opțional
```

### Props

```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
}
```

### Exemple din aplicație

| Pagină | Titlu | Trigger |
|--------|-------|---------|
| Clienți | "Niciun client găsit" | Lista goală sau filtru fără rezultate |
| Programări | "Nicio programare" | Calendar fără events |
| Facturi | "Nicio factură emisă" | Modul financiar gol |
| Vault | "Nicio notă în seif" | Vault deblocat dar gol |
| Istoric lifecycle | "Istoricul nu este disponibil încă" | Migrare neaplicată |
| Documente | "Niciun document adăugat" | Fișa client fără documente |

---

## Loading / Pending States

### Button în loading

```tsx
const [state, formAction, pending] = useActionState(action, initialState);

<Button type="submit" disabled={pending}>
  {pending ? "Se salvează..." : "Salvează"}
</Button>
```

Pattern standard: textul butonului se schimbă, butonul devine `disabled` (opacity-50, pointer-events-none).

### Tranziție lifecycle (optimistic UI)

```tsx
const [isPending, startTransition] = useTransition();

function handleLifecycleTransition(nextStatus, successMessage) {
  startTransition(async () => {
    await transitionClientLifecycle(client.id, nextStatus);
    toast.success(successMessage);
    router.refresh();
  });
}

<Button
  disabled={isPending}
  onClick={() => handleLifecycleTransition("ACTIV", "Client marcat activ.")}
>
  {isPending ? "Se actualizează..." : "Marchează activ"}
</Button>
```

### Page-level loading (Next.js)

Fișierele `loading.tsx` din directoarele de pagini (dacă există) afișează skeleton screens sau spinners la navigare. Nu am componente skeleton definite global — starea de loading e gestionată la nivel de acțiune.

---

## Erori Inline (câmpuri formular)

### Per câmp

```tsx
{state.fieldErrors?.email && (
  <p
    id="email-error"
    className="text-sm text-rose-700 dark:text-rose-400"
    role="alert"
  >
    {state.fieldErrors.email}
  </p>
)}
```

### Global (top formular)

```tsx
{state.error && (
  <div
    role="alert"
    className={cn(
      "rounded-xl border px-4 py-3 text-sm",
      "border-rose-300 bg-rose-50 text-rose-900",
      "dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
    )}
  >
    {state.error}
  </div>
)}
```

---

## Setup Banner

Afișat când terapeutul nu a finalizat o configurare importantă (Google Calendar, SmartBill, etc.).

### Vizual

```
┌──────────────────────────────────────────────────────┐
│  ⚠  Titlu banner                     [Buton acțiune] │
│     Descriere banner                                  │
└──────────────────────────────────────────────────────┘
```

### Styling

```css
border-amber-200 bg-amber-50/80 text-amber-950
border rounded-3xl px-5 py-4
```

Icon box: `h-9 w-9 rounded-2xl bg-amber-100 text-amber-700`

### Exemple

| Context | Titlu |
|---------|-------|
| Settings fără Google Calendar | "Conectează Google Calendar pentru sync automat" |
| SmartBill neconfigurat | "Adaugă credențialele SmartBill pentru facturare" |
| Vault nesetat | "Configurează PIN-ul pentru a proteja notele clinice" |
| Onboarding minor necompletat | "Onboarding necompletat — trimite link tutorelui" |

---

## Banner Onboarding Minor (fișă client)

Specific fișei clientului minor când onboarding-ul nu e finalizat:

```tsx
{isMinor && !lifecycle.isOnboardingComplete && (
  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4">
    <p className="font-semibold text-amber-900">Onboarding necompletat</p>
    <p className="text-sm text-amber-700 mt-1">
      Trimite link-ul de onboarding tutorelui pentru a completa datele minorului.
    </p>
    <Button
      variant="outline"
      size="sm"
      className="mt-3"
      onClick={copyOnboardingLink}
    >
      <Copy className="h-4 w-4 mr-2" />
      Copiază link onboarding minor
    </Button>
  </div>
)}
```

---

## Confirmare acțiuni distructive (AlertDialog)

Orice acțiune ireversibilă (ștergere, anonimizare, revocare) trece printr-un `AlertDialog`:

```
┌──────────────────────────────────────┐
│                                      │
│  ⚠ Ești sigur?                       │
│                                      │
│  Această acțiune este ireversibilă.  │
│  Toate datele personale vor fi       │
│  șterse definitiv.                   │
│                                      │
│  [ Anulează ]  [ Șterge date PII ]   │
│                                      │
└──────────────────────────────────────┘
```

```tsx
<AlertDialog>
  <AlertDialogTrigger>
    <Button variant="destructive">Anonimizează</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
    <AlertDialogDescription>
      Acțiunea este ireversibilă. Toate datele personale vor fi șterse.
    </AlertDialogDescription>
    <AlertDialogAction onClick={handleAnonymize}>
      Șterge date PII
    </AlertDialogAction>
    <AlertDialogCancel>Anulează</AlertDialogCancel>
  </AlertDialogContent>
</AlertDialog>
```

---

## Stări de succes post-acțiune

### Redirect cu param

```typescript
// La anonimizare reușită
redirect(`/dashboard/clients/${id}?anonymized=1`);

// Pagina citește param-ul și afișează banner
const justAnonymized = searchParams.anonymized === "1";

{justAnonymized && (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
    <p className="font-semibold text-emerald-900">
      Datele personale au fost șterse cu succes.
    </p>
  </div>
)}
```

### Toast imediat

Cea mai frecventă metodă — `toast.success()` imediat după acțiune fără redirect.

---

## Rezumat pattern de feedback per tip de acțiune

| Acțiune | Feedback |
|---------|---------|
| Salvare formular | `toast.success()` + `router.refresh()` |
| Eroare validare | Erori inline per câmp + eroare globală top |
| Eroare server | `toast.error(message)` |
| Acțiune lifecycle (status) | `toast.success()` + `router.refresh()` |
| Anonimizare (distructivă) | `AlertDialog` → redirect cu `?anonymized=1` |
| Upload fișier | `toast.success/error()` |
| Copiere link (clipboard) | `toast.success("Link copiat!")` |
| Acțiune pending | Buton disabled + text schimbat |
| Pagină fără date | `EmptyState` component |
| Configurare lipsă | `SetupBanner` amber |
