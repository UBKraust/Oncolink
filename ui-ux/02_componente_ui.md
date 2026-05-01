# Componente UI de Bază

Toate componentele de bază sunt în [src/components/ui/](../src/components/ui/).

---

## Button

**Fișier:** [src/components/ui/button.tsx](../src/components/ui/button.tsx)

### Props

| Prop | Tip | Default | Descriere |
|------|-----|---------|-----------|
| `variant` | string | `"default"` | Stilul vizual |
| `size` | string | `"default"` | Dimensiunea |
| `asChild` | boolean | `false` | Randare prin Slot (Radix) |
| `disabled` | boolean | — | Dezactivat |

### Variante

| Variant | Aspect | Utilizare |
|---------|--------|-----------|
| `default` | Fundal primary, text alb | CTA principal |
| `destructive` | Fundal roșu | Ștergere, acțiuni ireversibile |
| `outline` | Border, transparent | Secundar lângă primary |
| `secondary` | Fundal gri deschis | Acțiune terțiară |
| `ghost` | Transparent, hover cu bg | Nav, acțiuni subtile |
| `link` | Text cu underline | Link inline |

### Dimensiuni

| Size | Height | Padding | Utilizare |
|------|--------|---------|-----------|
| `default` | `h-10` | `px-4 py-2` | Standard |
| `sm` | `h-9` | `px-3` | Compact, tabele |
| `lg` | `h-11` | `px-8` | CTA proeminent |
| `icon` | `h-10 w-10` | — | Buton icon-only |

### Exemple de utilizare

```tsx
<Button>Salvează</Button>
<Button variant="outline" size="sm">Anulează</Button>
<Button variant="destructive">Șterge client</Button>
<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
<Button asChild><Link href="/dashboard">Dashboard</Link></Button>
```

### Stare de loading

```tsx
<Button disabled={pending}>
  {pending ? "Se salvează..." : "Salvează"}
</Button>
```

---

## Badge

**Fișier:** [src/components/ui/badge.tsx](../src/components/ui/badge.tsx)

**Styling fix:** `rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] border-transparent`

### Variante

| Variant | Light | Dark | Utilizare |
|---------|-------|------|-----------|
| `default` | Primary color | — | Status generic |
| `secondary` | Gri | — | Etichetă neutră |
| `destructive` | Roșu | — | Eroare, pericol |
| `outline` | Border gri | — | Tag, categorie |
| `success` | Verde deschis | Verde închis | Confirmat, activ |
| `warning` | Galben | Galben închis | Atenție, lipsă |
| `info` | Albastru deschis | Albastru închis | Informație |

### Exemple de utilizare

```tsx
<Badge variant="success">Activ</Badge>
<Badge variant="warning">Onboarding</Badge>
<Badge variant="outline">Minor</Badge>
<Badge variant="destructive">Inactiv</Badge>
```

---

## Card

**Fișier:** [src/components/ui/card.tsx](../src/components/ui/card.tsx)

### Subcomponente

| Componentă | Clase cheie |
|------------|-------------|
| `Card` | `rounded-xl border bg-card text-card-foreground shadow-sm` |
| `CardHeader` | `flex flex-col space-y-1.5 p-6` |
| `CardTitle` | `text-lg font-semibold leading-none tracking-tight` |
| `CardDescription` | `text-sm text-muted-foreground` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `flex items-center p-6 pt-0` |

### Exemplu

```tsx
<Card>
  <CardHeader>
    <CardTitle>Detalii client</CardTitle>
    <CardDescription>Ultima actualizare: azi</CardDescription>
  </CardHeader>
  <CardContent>
    {/* conținut */}
  </CardContent>
  <CardFooter>
    <Button>Editează</Button>
  </CardFooter>
</Card>
```

---

## Input

**Fișier:** [src/components/ui/input.tsx](../src/components/ui/input.tsx)

```
h-11 w-full rounded-xl border border-input bg-background
px-3.5 py-2 text-sm
placeholder:text-muted-foreground
focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring
disabled:opacity-50 disabled:cursor-not-allowed
```

### Exemplu

```tsx
<Input
  id="email"
  name="email"
  type="email"
  placeholder="client@exemplu.ro"
  defaultValue={client?.email ?? ""}
/>
```

---

## Textarea

**Fișier:** [src/components/ui/textarea.tsx](../src/components/ui/textarea.tsx)

```
min-h-[96px] w-full rounded-xl border border-input bg-background
px-3.5 py-3 text-sm
```

Comportament identic cu Input pentru focus/disabled.

---

## Select

**Fișier:** [src/components/ui/select.tsx](../src/components/ui/select.tsx)

```
h-11 w-full appearance-none rounded-xl border border-input bg-background
px-3.5 pr-10 text-sm
```

Icon `ChevronDown` (lucide) poziționat absolut dreapta. **Native `<select>`**, nu Radix Select.

### Exemplu

```tsx
<Select name="status" defaultValue={client.status ?? ""}>
  <option value="">— Selectează —</option>
  <option value="ACTIV">Activ</option>
  <option value="INACTIV">Inactiv</option>
</Select>
```

---

## Label

**Fișier:** [src/components/ui/label.tsx](../src/components/ui/label.tsx)

```
text-sm font-medium leading-none
peer-disabled:opacity-70 peer-disabled:cursor-not-allowed
```

Folosit întotdeauna cu `htmlFor` corespunzând `id`-ului câmpului asociat.

---

## Checkbox

**Fișier:** [src/components/ui/checkbox.tsx](../src/components/ui/checkbox.tsx)

```
h-4 w-4 shrink-0 rounded-sm border border-primary
accent-primary
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

---

## Radio Group

**Fișier:** [src/components/ui/radio-group.tsx](../src/components/ui/radio-group.tsx)

Bazat pe Radix UI RadioGroup.

- Root: `grid gap-3`
- Item: `size-4 rounded-full border border-input text-primary`
- Indicator: `CircleIcon` (lucide) `size-2`

---

## Tabs

**Fișier:** [src/components/ui/tabs.tsx](../src/components/ui/tabs.tsx)

### Variante

| Variant | Descriere |
|---------|-----------|
| `default` | Fundal `bg-muted`, tab activ cu bg alb și border |
| `line` | Fără fundal, tab activ cu linie de jos (`after:`) |

### Orientare

| Orientation | Descriere |
|-------------|-----------|
| `horizontal` | Default, tabs pe rând |
| `vertical` | Tabs pe coloană stânga |

```tsx
<Tabs defaultValue="tab1" variant="line">
  <TabsList>
    <TabsTrigger value="tab1">Detalii</TabsTrigger>
    <TabsTrigger value="tab2">Istoric</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">...</TabsContent>
  <TabsContent value="tab2">...</TabsContent>
</Tabs>
```

---

## Alert Dialog (custom)

**Fișier:** [src/components/ui/alert-dialog.tsx](../src/components/ui/alert-dialog.tsx)

Implementare custom (nu Radix AlertDialog). Gestionat prin React state intern.

### Subcomponente

| Componentă | Descriere |
|------------|-----------|
| `AlertDialogTrigger` | cloneElement cu onClick |
| `AlertDialogContent` | Overlay + panel centrat |
| `AlertDialogTitle` | `text-xl font-bold` |
| `AlertDialogDescription` | `text-sm text-slate-500` |
| `AlertDialogAction` | Buton confirm — primary |
| `AlertDialogCancel` | Buton anulare — ghost |

**Styling overlay:** `fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm`
**Styling panel:** `rounded-3xl max-w-lg shadow-2xl p-6`

```tsx
<AlertDialog>
  <AlertDialogTrigger>
    <Button variant="destructive">Șterge</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
    <AlertDialogDescription>Acțiunea este ireversibilă.</AlertDialogDescription>
    <AlertDialogAction onClick={handleDelete}>Șterge</AlertDialogAction>
    <AlertDialogCancel>Anulează</AlertDialogCancel>
  </AlertDialogContent>
</AlertDialog>
```

---

## Table

**Fișier:** [src/components/ui/table.tsx](../src/components/ui/table.tsx)

### Subcomponente

| Componentă | Clase cheie |
|------------|-------------|
| `Table` | Wrapper `rounded-[1.25rem] border bg-card shadow-sm overflow-hidden` |
| `TableHeader` | `bg-muted/35` |
| `TableBody` | Standard |
| `TableRow` | `border-b border-border/60 hover:bg-muted/25 transition-colors` |
| `TableHead` | `h-11 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground` |
| `TableCell` | `px-4 py-3.5 align-middle` |

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Client</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Ion Popescu</TableCell>
      <TableCell><Badge variant="success">Activ</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Progress

**Fișier:** [src/components/ui/progress.tsx](../src/components/ui/progress.tsx)

```tsx
<Progress value={75} />
// value: 0-100
```

- Track: `h-4 rounded-full bg-secondary`
- Fill: `h-full bg-primary transition-all duration-500`

---

## Separator

**Fișier:** [src/components/ui/separator.tsx](../src/components/ui/separator.tsx)

```tsx
<Separator />                        // orizontal — h-px w-full bg-border
<Separator orientation="vertical" /> // vertical — h-full w-px bg-border
```

---

## Toast (custom)

**Fișier:** [src/components/ui/toast.tsx](../src/components/ui/toast.tsx)

Detalii complete în [06_feedback_si_stari.md](06_feedback_si_stari.md).

```typescript
toast.success("Clientul a fost salvat.")    // 3000ms
toast.error("Eroare la salvare.")           // 5000ms
```

---

## Iconografie

**Librărie:** `lucide-react`

### Icoane frecvente

| Context | Icoane |
|---------|--------|
| **Navigation** | `LayoutDashboard`, `CalendarCheck`, `Users`, `FileText`, `Receipt`, `Settings`, `Lock` |
| **Acțiuni** | `Plus`, `Trash2`, `Edit`, `Copy`, `ExternalLink`, `Download`, `Upload` |
| **Status** | `CheckCircle2`, `AlertTriangle`, `ShieldAlert`, `XCircle` |
| **UI** | `ChevronDown`, `ArrowRight`, `Menu`, `X`, `Search`, `LogOut` |
| **Calendaristic** | `CalendarPlus`, `CalendarDays`, `CalendarRange` |

### Sizing standard

| Context | Clasă |
|---------|-------|
| Nav icon | `h-4 w-4` |
| Button icon | `h-4 w-4` |
| Section header | `h-5 w-5` |
| EmptyState decorativ | `h-11 w-11` (în container `h-14 w-14`) |
| Toast indicator | `h-2 w-2` |

### Color patterns

```tsx
// Icon activ
<Icon className="h-4 w-4 text-primary" />

// Icon muted
<Icon className="h-4 w-4 text-muted-foreground" />

// Icon pe fundal colorat (EmptyState)
<Icon className="h-5 w-5 text-primary" /> // în container bg-primary/10
```
