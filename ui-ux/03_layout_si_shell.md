# Layout și Shell Components

## Fișiere cheie

- [src/app/dashboard/layout.tsx](../src/app/dashboard/layout.tsx) — layout principal dashboard
- [src/components/app/page-shell.tsx](../src/components/app/page-shell.tsx) — componente reutilizabile shell
- [src/components/dashboard/sidebar.tsx](../src/components/dashboard/sidebar.tsx) — sidebar navigație
- [src/components/dashboard/topbar.tsx](../src/components/dashboard/topbar.tsx) — bara de sus

---

## Dashboard Layout

### Structură HTML

```tsx
// src/app/dashboard/layout.tsx
<div className="flex min-h-svh bg-muted/30">
  <DashboardSidebar />                          {/* w-64, hidden pe mobile */}
  <div className="flex min-w-0 flex-1 flex-col">
    <DashboardTopbar />                         {/* h-16, sticky top */}
    <div className="flex-1 overflow-auto p-4 md:p-6">
      {children}                                {/* conținut pagină */}
    </div>
  </div>
</div>
```

### Diagrama layout

```
┌─────────────────────────────────────────────────┐
│ DashboardTopbar (h-16, border-b)                │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Sidebar     │   Page Content                   │
│  (w-64)      │   (p-4 md:p-6)                   │
│  hidden      │                                  │
│  md:flex     │   max-w-7xl mx-auto              │
│              │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

**Pe mobile:** Sidebar dispare. Topbar afișează burger menu care deschide overlay.

---

## Sidebar

### Structură

```tsx
// hidden pe mobile, visible de la md:
<div className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
  {/* Header brand */}
  <div className="flex h-16 items-center gap-2 border-b px-6">
    <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground font-black italic">
      C
    </div>
    <div>
      <div className="text-sm font-black italic tracking-tighter text-primary">Ce'ai Pățit?</div>
      <div className="text-[11px] text-muted-foreground">ERP Cabinet</div>
    </div>
  </div>

  {/* Nav groups */}
  <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
    {navGroups.map(group => (
      <NavGroup key={group.label} group={group} />
    ))}
  </nav>

  {/* Footer */}
  <div className="border-t p-4 bg-muted/20">
    <a href="/privacy">Confidențialitate</a>
    <a href="/terms">Termeni</a>
    <span>v0.1.0</span>
  </div>
</div>
```

### Nav item states

| Stare | Clase |
|-------|-------|
| Idle | `text-muted-foreground hover:bg-accent hover:text-accent-foreground` |
| Active | `bg-primary/10 text-primary shadow-sm` |

**Detecție active:**
```typescript
const active = href === "/dashboard"
  ? pathname === href           // match exact pentru dashboard
  : pathname?.startsWith(href); // prefix match pentru subpagini
```

---

## Topbar

### Structură desktop

```
┌─────────────────────────────────────────────────────────────┐
│  [Burger]  [Search input ___________]  [+Prog] [User] [Out] │
└─────────────────────────────────────────────────────────────┘
```

- **Burger** (mobile only): `h-10 w-10 rounded-xl border`
- **Search** (desktop only): input cu dropdown autocomplete
- **VaultIndicator**: badge care arată dacă vault-ul e deblocat
- **+Programare**: buton cu `CalendarPlus` icon
- **User email**: `lg:inline hidden`
- **Logout**: icon button

### Mobile menu overlay

Când burger e apăsat, apare un overlay over content:

```
┌───────────────────────────────┐
│ ╔═══════════════════════════╗ │
│ ║  Mobile Nav Panel         ║ │
│ ║  (rounded-3xl, shadow-2xl)║ │
│ ║                           ║ │
│ ║  [Grup 1]                 ║ │
│ ║    ○ Dashboard            ║ │
│ ║    ○ Programări           ║ │
│ ║  [Grup 2]                 ║ │
│ ║    ○ Clienți              ║ │
│ ║    ...                    ║ │
│ ╚═══════════════════════════╝ │
│  [Backdrop blur]              │
└───────────────────────────────┘
```

**Backdrop:** `fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm`
**Panel:** `absolute left-4 right-4 top-20 max-h-[calc(100svh-6rem)] rounded-3xl border bg-card p-4 shadow-2xl overflow-y-auto`

---

## Page Shell Components

Toate componentele din [src/components/app/page-shell.tsx](../src/components/app/page-shell.tsx):

### `DashboardPage`

Container wrapper pentru conținutul paginii:

```tsx
<DashboardPage>
  <PageHeader title="Clienți" description="Registrul de clienți" />
  {/* conținut */}
</DashboardPage>
```

```css
mx-auto w-full max-w-7xl space-y-6 pb-10
```

### `PageHeader`

```tsx
<PageHeader
  title="Clienți"
  description="Registrul de pacienți activi"
  eyebrow="Management"
  actions={<Button>Client nou</Button>}
/>
```

| Prop | Tip | Descriere |
|------|-----|-----------|
| `title` | string | H1 al paginii |
| `description` | string | Text muted sub titlu |
| `eyebrow` | string? | Text mic deasupra titlului |
| `actions` | ReactNode? | Butoane dreapta (desktop) |

**Responsive:** `flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`

**Eyebrow styling:** `text-[11px] font-black uppercase tracking-[0.24em] text-primary/70`
**Title styling:** `text-3xl font-black tracking-tight text-foreground`

### `SectionCard`

Card cu header structurat (icon + titlu + descriere) și slot pentru conținut:

```tsx
<SectionCard
  title="Informații personale"
  description="Date de contact și identificare"
  icon={User}
>
  {/* conținut secțiune */}
</SectionCard>
```

| Prop | Tip | Descriere |
|------|-----|-----------|
| `title` | string | Titlu secțiune |
| `description` | string? | Subtitlu |
| `icon` | LucideIcon | Icon header |
| `badgeVariant` | string? | Variantă badge opțional |
| `badge` | string? | Text badge opțional |

**Header:** `border-b border-border/60 px-6 py-5 flex items-center gap-4`
**Icon box:** `h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center`

### `EmptyState`

Afișat când un modul nu are date:

```tsx
<EmptyState
  title="Niciun client găsit"
  description="Adaugă primul client din butonul de mai sus."
  icon={Users}
  action={<Button>Client nou</Button>}
/>
```

| Prop | Tip | Descriere |
|------|-----|-----------|
| `title` | string | Titlu stare goală |
| `description` | string | Explicație |
| `icon` | LucideIcon | Icon decorativ |
| `action` | ReactNode? | CTA opțional |

**Layout:** centrat, `text-center`, `py-16`
**Icon container:** `h-14 w-14 rounded-[1.25rem] bg-primary/10 text-primary`

### `SetupBanner`

Banner de avertizare pentru setări incomplete:

```tsx
<SetupBanner
  title="Conectează Google Calendar"
  description="Sincronizează programările automat."
  icon={Calendar}
  action={<Button size="sm">Conectează</Button>}
/>
```

**Styling:** `rounded-3xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-amber-950`
**Icon box:** `h-9 w-9 rounded-2xl bg-amber-100 text-amber-700`

---

## Public Page Shell

### `PublicPageShell`

Shell pentru paginile publice (`/onboarding`, `/book`, `/confirm-result`):

```tsx
<PublicPageShell>
  {/* formular onboarding sau booking */}
</PublicPageShell>
```

**Background:** gradient radial sky-ish + linear subtil:
```css
bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.02_215)_0%,transparent_60%),
    linear-gradient(180deg,oklch(0.98_0.005_215)_0%,oklch(1_0_0)_100%)]
```

**Wrapper:** `min-h-svh px-4 py-10`

### `PublicDocumentShell`

Shell pentru documente publice (contracte, GDPR, termeni):

```tsx
<PublicDocumentShell
  title="Contract de prestări servicii"
  subtitle="Cabinet Individual — Ce'ai Pățit?"
  icon={FileText}
  accentColor="bg-slate-950"
>
  {/* conținut document */}
</PublicDocumentShell>
```

**Header dark:** `bg-slate-950 text-white rounded-t-[2.5rem]`
**Content:** `bg-card rounded-b-[2.5rem] p-8`
**Max-width:** `max-w-4xl mx-auto`
