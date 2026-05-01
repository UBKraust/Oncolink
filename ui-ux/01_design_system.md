# Design System — Culori, Tipografie, Spațiere

## Fișiere sursă

- [src/app/globals.css](../src/app/globals.css) — CSS custom properties, variante dark, utilitare globale
- [src/app/layout.tsx](../src/app/layout.tsx) — configurare fonturi Geist

---

## Culori (OKLCH)

Sistemul de culori folosește [OKLCH](https://oklch.com/) — un spațiu perceptual uniform care garantează contrast predictibil între light și dark mode.

### Light Mode (`:root`)

| Token | Valoare OKLCH | Rol |
|-------|--------------|-----|
| `--background` | `oklch(1 0 0)` | Alb pur — fundalul general |
| `--foreground` | `oklch(0.145 0 0)` | Negru aproape pur — text principal |
| `--primary` | `oklch(0.52 0.13 215)` | Albastru — brand, CTA-uri, active |
| `--primary-foreground` | `oklch(0.985 0 0)` | Aproape alb — text pe primary |
| `--secondary` | `oklch(0.97 0 0)` | Gri deschis — fundal alternativ |
| `--secondary-foreground` | `oklch(0.205 0 0)` | Gri închis — text pe secondary |
| `--muted` | `oklch(0.97 0 0)` | Gri palid — zone muted, tabele |
| `--muted-foreground` | `oklch(0.556 0 0)` | Gri mediu — text secundar |
| `--accent` | `oklch(0.97 0 0)` | Accent hover |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Roșu saturat — acțiuni distructive |
| `--border` | `oklch(0.922 0 0)` | Gri foarte deschis — borduri |
| `--input` | `oklch(0.922 0 0)` | Identic border — fundal input |
| `--ring` | `oklch(0.708 0 0)` | Gri mediu — focus ring |
| `--card` | `oklch(1 0 0)` | Alb — fundalul cardurilor |

### Dark Mode (`.dark`)

| Token | Valoare OKLCH |
|-------|--------------|
| `--background` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.62 0.13 215)` |
| `--primary-foreground` | `oklch(0.205 0 0)` |
| `--muted` | `oklch(0.269 0 0)` |
| `--border` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(1 0 0 / 15%)` |

### Culori semantice (hardcodate în componente)

Folosite în Badge, Toast, erori inline — **nu** ca CSS custom properties, ci ca clase Tailwind directe:

| Semantic | Light | Dark |
|----------|-------|------|
| **success** | `bg-emerald-100 text-emerald-900` | `bg-emerald-950 text-emerald-100` |
| **warning** | `bg-amber-100 text-amber-900` | `bg-amber-950 text-amber-100` |
| **info** | `bg-sky-100 text-sky-900` | `bg-sky-950 text-sky-100` |
| **error inline** | `bg-rose-50 border-rose-300 text-rose-900` | `bg-rose-950/40 border-rose-900 text-rose-200` |
| **setup banner** | `bg-amber-50/80 border-amber-200 text-amber-950` | — |

---

## Tipografie

### Fonturi

```typescript
// src/app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
```

Ambele variabile sunt aplicate pe `<body>` ca clase CSS. Tailwind preia `--font-sans` ca `font-family` default.

### Ierarhie tipografică

| Element | Clase | Weight | Tracking | Unde apare |
|---------|-------|--------|----------|------------|
| **H1 / PageHeader title** | `text-3xl font-black` | 900 | `tracking-tight` | Titlu pagină dashboard |
| **H2 / Dialog title** | `text-xl font-bold` | 700 | — | AlertDialog, SectionCard |
| **H3 / EmptyState** | `text-lg font-black` | 900 | `tracking-tight` | Empty state |
| **Card title** | `text-lg font-semibold` | 600 | `tracking-tight` | Titlu card |
| **Body** | `text-sm` | 400 | — | Text curent, descrieri |
| **Label form** | `text-sm font-medium` | 500 | — | Label câmp |
| **Eyebrow** | `text-[11px] font-black` | 900 | `tracking-[0.24em]` | Subtitlu deasupra H1 |
| **Table header** | `text-[11px] font-black` | 900 | `tracking-[0.18em]` | Cap de tabel |
| **Badge** | `text-[10px] font-black` | 900 | `tracking-[0.16em]` | Badge status |
| **Nav group label** | `text-[10px] font-black` | 900 | `tracking-widest` | Titlu grup nav |
| **Muted / hint** | `text-sm text-muted-foreground` | 400 | — | Descrieri secundare |
| **Version / tiny** | `text-[9px] font-bold` | 700 | `uppercase` | Footer sidebar |

---

## Spațiere

### Gap (între elemente flex/grid)

| Clasă | Px | Utilizare tipică |
|-------|----|-----------------|
| `gap-1` | 4px | Rare, micro-spacing |
| `gap-2` | 8px | Grup buton + icon, tabs strânse |
| `gap-3` | 12px | Default flex row |
| `gap-4` | 16px | Secțiuni în card |
| `gap-5` | 20px | Grid câmpuri formular |
| `gap-6` | 24px | Secțiuni majore |

### Padding (intern componente)

| Context | Clase |
|---------|-------|
| Card content | `p-6` |
| Card header | `px-6 py-5` |
| Input / Textarea | `px-3.5 py-2` |
| Button default | `px-4 py-2` |
| Button sm | `px-3` |
| Badge | `px-2.5 py-1` |
| Nav item | `px-3 py-2` |
| Container pagină | `p-4 md:p-6` |

### Space-y (stack vertical)

| Clasă | Utilizare |
|-------|-----------|
| `space-y-1` | Text mic stacked (label + hint) |
| `space-y-1.5` | Card header internals |
| `space-y-2` | Grup câmpuri formular mic |
| `space-y-6` | Secțiuni mari în pagină |
| `space-y-8` | Layout dashboard top-level |

---

## Border Radius

Aplicat în ordinea frecvenței de apariție:

| Clasă | Valoare | Utilizare |
|-------|---------|-----------|
| `rounded-xl` | 12px | Buttons, inputs, nav items — **default** |
| `rounded-2xl` | 16px | AlertDialog acțiuni, toast-uri, cards mid |
| `rounded-3xl` | 24px | Dialog overlay, mobile menu panel |
| `rounded-[1.25rem]` | 20px | Table wrapper, EmptyState icon |
| `rounded-[2rem]` | 32px | Section header icon box |
| `rounded-[2.5rem]` | 40px | PublicDocumentShell |
| `rounded-full` | 9999px | Badge, avatar, indicatori circulari |
| `rounded-lg` | 8px | TabsList, secundar |
| `rounded-md` | 6px | TabsTrigger |
| `rounded-sm` | 4px | Micro-elemente |

---

## Shadows

| Clasă | Utilizare |
|-------|-----------|
| `shadow-sm` | Cards — subtle elevation |
| `shadow-lg` | Buttons cu elevație |
| `shadow-2xl` | Dialog-uri, mobile menu overlay |
| `shadow-xs` | Elemente muted cu elevație minimă |

---

## Dark Mode

### Implementare

```css
/* globals.css */
@custom-variant dark (&:is(.dark *));
```

Clasa `.dark` se aplică pe `<html>` sau un wrapper de nivel înalt. Toate tokenurile CSS custom properties se redefinesc în `.dark {}`. Componentele custom (Badge, Toast, erori) folosesc clase `dark:` Tailwind direct.

### Pattern de aplicare

```tsx
// Exemplu Badge success
className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"

// Exemplu eroare inline
className="bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
```

---

## Utilitare CSS globale (globals.css)

### Clase custom definite

```css
.ui-focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-ring focus-visible:ring-offset-2;
}

.ui-interactive-disabled {
  @apply disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50;
}

.ui-nav-item-idle {
  @apply text-muted-foreground hover:bg-accent hover:text-accent-foreground;
}

.ui-nav-item-active {
  @apply bg-primary/10 text-primary shadow-sm;
}

.custom-scrollbar {
  /* scrollbar thin custom styling */
}
```

### Animație custom

```css
.animate-pulse-subtle {
  animation: pulse-subtle 2.2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.02); opacity: 0.9; }
}
```
