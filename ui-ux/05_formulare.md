# Formulare — Pattern-uri, Validare, Erori

## Abordare generală

Aplicația folosește **Next.js Server Actions** cu `useActionState` (React 19). Nu se folosește `react-hook-form`. Validarea se face server-side, erorile se întorc în state și se afișează inline.

---

## Pattern de bază: câmp cu label și eroare

```tsx
<div className="space-y-1.5">
  <Label htmlFor="email">Adresă email</Label>
  <Input
    id="email"
    name="email"
    type="email"
    placeholder="client@exemplu.ro"
    aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
    defaultValue={client?.email ?? ""}
  />
  {state.fieldErrors?.email && (
    <p id="email-error" className="text-sm text-rose-700" role="alert">
      {state.fieldErrors.email}
    </p>
  )}
</div>
```

### Reguli

- `Label` are întotdeauna `htmlFor` corespunzând `id`-ului input-ului
- `aria-describedby` leagă input-ul de mesajul de eroare (accesibilitate)
- Erorile au `role="alert"` sau `id` expliciti
- `defaultValue` preia valoarea existentă la editare

---

## Structura FormState

```typescript
type ClientFormState = {
  error: string | null;         // eroare globală
  fieldErrors: {                // erori per câmp
    full_name?: string;
    email?: string;
    phone?: string;
    // ...
  };
  success?: boolean;
  clientId?: string;
};
```

---

## Legare Server Action

```tsx
"use client";

import { useActionState } from "react";
import { createClient } from "./actions";

const initialState: ClientFormState = { error: null, fieldErrors: {} };

export function ClientForm() {
  const [state, formAction, pending] = useActionState(createClient, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {/* câmpuri */}
      <Button type="submit" disabled={pending}>
        {pending ? "Se salvează..." : "Salvează client"}
      </Button>
    </form>
  );
}
```

---

## Eroare globală (formular)

Afișată în partea de sus a formularului când există o eroare generică:

```tsx
{state.error && (
  <div
    role="alert"
    className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900
               dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
  >
    {state.error}
  </div>
)}
```

---

## Layout grid formulare

### 2 coloane (câmpuri pereche)

```tsx
<div className="grid gap-5 md:grid-cols-2">
  <div className="space-y-1.5">
    <Label htmlFor="first_name">Prenume</Label>
    <Input id="first_name" name="first_name" />
  </div>
  <div className="space-y-1.5">
    <Label htmlFor="last_name">Nume</Label>
    <Input id="last_name" name="last_name" />
  </div>
</div>
```

### 3 coloane

```tsx
<div className="grid gap-5 md:grid-cols-3">
  {/* 3 câmpuri */}
</div>
```

Pe mobile, ambele colapse la single column.

---

## Secțiuni formular (grupare logică)

Câmpurile sunt grupate în `SectionCard`:

```tsx
<SectionCard title="Date personale" icon={User}>
  <div className="p-6 space-y-5">
    <div className="grid gap-5 md:grid-cols-2">
      {/* câmpuri date personale */}
    </div>
  </div>
</SectionCard>

<SectionCard title="Date de contact" icon={Phone}>
  <div className="p-6 space-y-5">
    {/* câmpuri contact */}
  </div>
</SectionCard>
```

---

## Tipuri de câmpuri și variante

### Input text standard

```tsx
<Input id="name" name="full_name" type="text" placeholder="Ion Popescu" />
```

### Textarea

```tsx
<Textarea
  id="notes"
  name="notes"
  placeholder="Observații despre client..."
  rows={4}
/>
```

### Select nativ

```tsx
<div className="relative">
  <Select name="session_frequency" defaultValue="SAPTAMANAL">
    <option value="SAPTAMANAL">Săptămânal</option>
    <option value="BISAPTAMANAL">Bi-săptămânal</option>
    <option value="LUNAR">Lunar</option>
  </Select>
  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
</div>
```

### Checkbox cu label

```tsx
<div className="flex items-center gap-3">
  <Checkbox
    id="gdpr_consent"
    name="gdpr_consent_signed"
    defaultChecked={client?.gdpr_consent_signed ?? false}
  />
  <Label htmlFor="gdpr_consent" className="font-normal">
    Client a semnat consimțământul GDPR
  </Label>
</div>
```

### Câmp cu hint

```tsx
<div className="space-y-1.5">
  <Label htmlFor="cnp">CNP</Label>
  <Input id="cnp" name="cnp_cif" type="text" />
  <p className="text-xs text-muted-foreground">
    Folosit exclusiv pentru generarea contractelor. Nu este transmis extern.
  </p>
</div>
```

### Câmp condiționat

```tsx
{isMinor && (
  <div className="space-y-1.5">
    <Label htmlFor="parent_name">Nume tutore *</Label>
    <Input id="parent_name" name="parent_name" required />
    {state.fieldErrors?.parent_name && (
      <p className="text-sm text-rose-700">{state.fieldErrors.parent_name}</p>
    )}
  </div>
)}
```

---

## Formulare multi-pas (Wizard)

Folosit în onboarding adult și minor. Pattern implementat în `ClientOnboardingWizard` și `MinorOnboardingWizard`:

```tsx
// State local pentru pasul curent
const [step, setStep] = useState(1);
const TOTAL_STEPS = 3;

// Progress indicator
<div className="flex gap-2">
  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
    <div
      key={i}
      className={cn(
        "h-1.5 flex-1 rounded-full transition-colors duration-300",
        i < step ? "bg-primary" : "bg-muted"
      )}
    />
  ))}
</div>

// Buton next cu validare
<Button
  type="button"
  onClick={() => {
    if (validateCurrentStep()) setStep(s => s + 1);
  }}
>
  Continuă
</Button>
```

### Reguli wizard

- Nu se poate trece la pasul următor fără a completa câmpurile obligatorii
- Erorile sunt afișate inline pe câmpuri, nu în `alert()`
- Datele se salvează **la submit final**, nu pas cu pas
- Butonul "Înapoi" permite revenirea fără pierdere de date

---

## Validare server-side

Pattern din `actions.ts`:

```typescript
function validate(payload: ReturnType<typeof parseForm>): ClientFormState {
  const fieldErrors: ClientFormState["fieldErrors"] = {};

  if (!payload.full_name) {
    fieldErrors.full_name = "Numele complet este obligatoriu.";
  }
  if (!payload.email) {
    fieldErrors.email = "Email-ul este obligatoriu.";
  } else if (!isValidEmail(payload.email)) {
    fieldErrors.email = "Adresă de email invalidă.";
  }
  if (payload.phone && !isValidRomanianPhone(payload.phone)) {
    fieldErrors.phone = "Telefon RO invalid (ex: +40722111222).";
  }

  return {
    error: Object.keys(fieldErrors).length ? "Verifică câmpurile marcate." : null,
    fieldErrors,
  };
}
```

Utilitare de validare: [src/lib/clients/validation.ts](../src/lib/clients/validation.ts)
- `isValidEmail()`
- `isValidRomanianPhone()`
- `validateCnpCif()` — validare CNP sau CIF cu algoritm

---

## Submit și redirect

```typescript
// actions.ts
export async function createClient(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const payload = parseForm(formData);
  const validation = validate(payload);
  if (validation.error) return validation; // → erori afișate în UI

  // ... logică business ...

  revalidatePath("/dashboard/clients");
  return { success: true, clientId: newClient.id, error: null, fieldErrors: {} };
}
```

La `success: true`, componenta client face redirect:

```tsx
useEffect(() => {
  if (state.success && state.clientId) {
    router.push(`/dashboard/clients/${state.clientId}`);
  }
}, [state.success]);
```

---

## Formulare cu upload fișier

Pattern din document upload:

```tsx
<form
  onSubmit={async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await uploadClientDocument(clientId, folderId, formData);
    if (result.error) toast.error(result.error);
    else toast.success("Document încărcat cu succes.");
  }}
>
  <input type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.png" />
  <Button type="submit">Încarcă</Button>
</form>
```

Nu se folosește `useActionState` pentru upload — apel direct async cu handler.

---

## Cheklist de verificare formular nou

- [ ] Fiecare `<Input>` are `id` și `name` distincte
- [ ] Fiecare `<Label>` are `htmlFor` corespunzător
- [ ] Câmpurile cu erori au `aria-describedby` legat la `id` mesajului de eroare
- [ ] Eroarea de câmp are `role="alert"` sau e anunțată prin `aria-describedby`
- [ ] Butonul submit este `disabled={pending}` în timp ce se procesează
- [ ] Textul butonului submit se schimbă în timpul loading
- [ ] Submit-ul nu este posibil fără câmpurile obligatorii completate
- [ ] Eroarea globală apare vizibil deasupra formularului
- [ ] Pe mobile, câmpurile grid colapsează la single column
