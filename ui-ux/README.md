# UI/UX Documentation — Ce'ai Pățit?

Documentație completă pentru sistemul de design, componentele UI și pattern-urile UX ale aplicației ERP cabinet psihoterapie.

## Index

| Fișier | Conținut |
|--------|----------|
| [01_design_system.md](01_design_system.md) | Culori OKLCH, tipografie, spacing, border-radius, shadows, dark mode |
| [02_componente_ui.md](02_componente_ui.md) | Toate componentele de bază: Button, Badge, Card, Input, Table, etc. |
| [03_layout_si_shell.md](03_layout_si_shell.md) | Dashboard layout, Sidebar, Topbar, Page shells, PublicPageShell |
| [04_navigatie.md](04_navigatie.md) | Sidebar nav, mobile menu, search rapid, breadcrumbs, active states |
| [05_formulare.md](05_formulare.md) | Pattern-uri formuri, validare, erori inline, Server Actions |
| [06_feedback_si_stari.md](06_feedback_si_stari.md) | Toast, EmptyState, loading/pending, erori, SetupBanner |
| [07_ux_patterns.md](07_ux_patterns.md) | Keyboard nav, focus management, responsive, animații, accesibilitate |

## Stack UI

- **Framework:** Next.js 15 App Router (React 19)
- **Styling:** Tailwind CSS 4
- **Componente primitive:** Radix UI (parțial) + implementări custom
- **Iconografie:** lucide-react
- **Fonturi:** Geist (sans) + Geist Mono — din `next/font/google`
- **Animații:** Tailwind `animate-in` / `fade-in` / `slide-in-from-*`
- **Toast:** implementare custom (fără librărie externă)
- **Forms:** `useActionState` (Next.js) + Server Actions (fără react-hook-form)

## Principii de Design

1. **Claritate operațională** — terapeutul vede rapid ce e de făcut, fără ambiguitate
2. **Densitate moderată** — nu prea compact, nu prea aerat; cardul e unitatea de bază
3. **Mobile-first** — sidebar ascuns pe mobile, navigație prin topbar overlay
4. **Accesibilitate structurală** — ARIA, focus management, keyboard nav pe fluxurile critice
5. **Dark mode nativ** — token system OKLCH cu variantă `.dark` completă
6. **Feedback imediat** — toast pe orice acțiune, stări de loading clare pe butoane
