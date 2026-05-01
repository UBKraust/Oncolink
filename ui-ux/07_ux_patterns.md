# UX Patterns — Interacțiuni, Accesibilitate, Responsive, Animații

---

## Keyboard Navigation

### Focus management general

Toate elementele interactive au `focus-visible` styling prin clasa utilitară `ui-focus-ring`:

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

Clasa `focus-visible` (nu `focus`) garantează că ring-ul apare **doar la navigare cu tastatura**, nu la click cu mouse.

### Overlay-uri și dialoguri

Toate overlay-urile implementează:

1. **Focus trap** — Tab rămâne în interiorul overlay-ului cât timp e deschis
2. **Auto-focus** — primul element focusabil primește focus la deschidere
3. **Focus return** — la închidere, focus revine pe trigger-ul care a deschis overlay-ul
4. **Esc to close** — `keydown` listener pe `Escape` pentru închidere

Pattern implementat în `use-overlay-a11y.ts`:

```typescript
// src/components/ui/use-overlay-a11y.ts
export function useOverlayA11y(isOpen: boolean, onClose: () => void) {
  // Salvează triggerul înainte de deschidere
  // La deschidere: focus primul element din overlay
  // Focus trap cu Tab/Shift+Tab
  // Esc → onClose() → focus return
}
```

### Butoane icon-only

Orice buton fără text vizibil are `aria-label`:

```tsx
<Button
  variant="ghost"
  size="icon"
  aria-label="Șterge documentul"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### Navigare cu tastatura în formulare

- `Tab` avansează prin câmpuri în ordinea `tabIndex` natural (DOM order)
- `Enter` pe buton de submit → trimite formularul
- `Esc` în modal → închide modalul fără submit
- `Space` pe checkbox/radio → toggle

---

## Responsive Design

### Breakpoints active

| Breakpoint | Pixels | Schimbări majore |
|------------|--------|-----------------|
| *(mobile)* | 0–767px | Sidebar ascuns, navigare prin topbar overlay |
| `md:` | 768px+ | Sidebar vizibil, layout 2 coloane |
| `lg:` | 1024px+ | PageHeader orizontal, user email vizibil |
| `sm:` | 640px+ | Text pe butoane topbar (altfel icon only) |

### Sidebar

```css
/* Mobile: ascuns complet */
.sidebar { display: none; }

/* Desktop: vizibil, fixed width */
@media (min-width: 768px) {
  .sidebar { display: flex; flex-direction: column; width: 16rem; }
}
```

### Formulare

- Mobile: toate câmpurile stacked `grid-cols-1`
- Desktop (`md:`): perechi de câmpuri `grid-cols-2`, triplete `grid-cols-3`

```tsx
<div className="grid gap-5 md:grid-cols-2">
  {/* câmpuri auto-stacked pe mobile */}
</div>
```

### Tabele

Pe mobile, tabelele devin scrollabile orizontal:
```tsx
<div className="overflow-x-auto">
  <Table>...</Table>
</div>
```

Pe mobile, unele coloane pot fi ascunse:
```tsx
<TableHead className="hidden md:table-cell">Telefon</TableHead>
<TableCell className="hidden md:table-cell">{client.phone}</TableCell>
```

### CardList → alternativă mobilă

Registrul de clienți afișează tabel pe desktop și carduri pe mobile:

```tsx
{/* Desktop */}
<div className="hidden md:block">
  <Table>...</Table>
</div>

{/* Mobile */}
<div className="md:hidden space-y-3">
  {clients.map(client => (
    <ClientMobileCard key={client.id} client={client} />
  ))}
</div>
```

---

## Animații și Tranziții

### Animate-in (intrare elemente)

Folosit pe toast-uri, dropdown-uri, overlay-uri:

```css
.animate-in { animation-fill-mode: both; }
.fade-in { animation-name: fadeIn; }
.slide-in-from-right-10 { --tw-enter-translate-x: 2.5rem; }
.zoom-in-95 { --tw-enter-scale: 0.95; }
```

Combinat:
```tsx
className="animate-in fade-in slide-in-from-right-10 duration-300"  // toast
className="animate-in fade-in zoom-in-95 duration-200"              // dropdown
```

### Tranziții CSS (hover, focus)

```css
/* Navigare */
transition-colors duration-150

/* Butoane */
transition-[color,box-shadow,background-color] duration-200

/* Progress bar fill */
transition-all duration-500

/* Indicator dot */
animation: animate-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite
```

### Pulse subtle (stare de atenție)

```css
.animate-pulse-subtle {
  animation: pulse-subtle 2.2s ease-in-out infinite;
}
@keyframes pulse-subtle {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.9; }
}
```

---

## Stări interactive

### Hover

```css
/* Butoane */
hover:bg-primary/80    /* default button */
hover:bg-secondary/80  /* secondary button */
hover:bg-accent hover:text-accent-foreground  /* nav items */

/* Tabele */
hover:bg-muted/25

/* Linkuri */
hover:text-primary hover:underline
```

### Focus visible

```css
/* Input, Select, Textarea */
focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring

/* Buttons, links, interactive */
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Disabled

```css
disabled:pointer-events-none
disabled:cursor-not-allowed
disabled:opacity-50
```

### Active (nav item)

```css
bg-primary/10 text-primary shadow-sm
```

---

## Pattern Overlay / Drawer

### Overlay full-screen (DialogAlert, mobile menu)

```
Estado: closed → open
1. Backdrop fade-in (opacity 0 → 0.5)
2. Panel zoom-in-95 + fade-in
3. Focus trap activat
4. First focusable element focusat

Estado: open → closed
1. Escape sau click backdrop → onClose()
2. Focus return pe trigger
3. Backdrop + panel animate-out (reverse)
```

### Session Drawer (lateral)

```
┌────────────────────────────┬─────────────────────┐
│  Conținut pagină           │  Session Drawer      │
│  (mai slab, blur)          │  (slide-in dreapta)  │
│                            │                      │
│                            │  Detalii programare  │
│                            │  + Acțiuni           │
│                            │                      │
└────────────────────────────┴─────────────────────┘
```

Implementat în [src/components/appointments/SessionDrawer.tsx](../src/components/appointments/SessionDrawer.tsx).

---

## Accesibilitate — Checklist aplicat

### Semantic HTML

- `<nav>`, `<main>`, `<header>`, `<footer>` folosite corect
- Titluri ierarhice: `h1` pe fiecare pagină, `h2`/`h3` în secțiuni
- Butoane sunt `<button>`, linkuri sunt `<a>`
- Formularele au `<form>` cu `action`

### ARIA

- `aria-label` pe butoane icon-only
- `aria-describedby` pe câmpuri cu erori sau hint-uri
- `role="alert"` pe mesajele de eroare
- `aria-expanded` pe elemente toggle (mobile menu)
- `aria-hidden` pe elemente decorative (iconuri pure)

### Contrast

- Text principal pe background: raport >7:1 (AAA)
- Muted text (`oklch(0.556)` pe `oklch(1)`): raport ~4.5:1 (AA)
- Badge text pe fundal colorat: verificat per variantă

### Touch targets

- Toate elementele interactive: minim `h-10 w-10` (40×40px)
- Nav items: `py-2 px-3` asigură target suficient
- Butoane icon: `size="icon"` = `h-10 w-10`

---

## Pattern Copy-to-Clipboard

```tsx
async function copyToClipboard(text: string, successMsg: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMsg);
  } catch {
    toast.error("Nu am putut copia. Încearcă manual.");
  }
}

<Button
  variant="outline"
  size="sm"
  onClick={() => copyToClipboard(onboardingLink, "Link copiat în clipboard!")}
>
  <Copy className="h-4 w-4 mr-2" />
  Copiază link
</Button>
```

---

## UX Decisions notabile

| Decizie | Motivație |
|---------|-----------|
| Native `<select>` în loc de Radix Select | Compatibilitate mobilă mai bună, niciun overhead JS |
| `useActionState` fără react-hook-form | Coeziune cu Server Actions, mai puțin JS client |
| Toast custom (nu Sonner/Toastify) | Control complet, zero dependențe externe |
| AlertDialog custom (nu Radix) | Simplitate, comportament predictibil în context specific |
| Badge cu `text-[10px] font-black uppercase` | Maxim lizibilitate la dimensiune mică, look clar |
| `font-black` pe headere și badge-uri | Greutate vizuală clară fără a folosi majuscule pe texte lungi |
| Mobile card list în loc de tabel scroll | Experiență de mobil mai naturală, fără scroll orizontal |
| `min-h-svh` (nu `min-h-screen`) | Corect pentru iOS Safari unde `100vh` e buggy |
| `backdrop-blur-sm` pe overlay-uri | Contextul din spate rămâne vizibil, nu e blocat total |
