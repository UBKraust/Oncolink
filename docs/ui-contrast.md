# UI Contrast Note

## Token audit summary

The main low-contrast risk came from using `text-muted-foreground` on low-emphasis surfaces (`background`, `card`, `accent`, and `muted`) for very small copy (9–11px), especially in sidebar legal/footer metadata and helper labels.

To improve legibility globally (instead of adding one-off overrides), token values were adjusted in `src/app/globals.css`:

- Light theme: `--muted-foreground` changed from `oklch(0.556 0 0)` to `oklch(0.44 0 0)`.
- Dark theme: `--muted-foreground` changed from `oklch(0.708 0 0)` to `oklch(0.78 0 0)`.

## Approved contrast pairs

Use these combinations for body and helper text:

- `foreground` on `background`
- `foreground` on `card`
- `muted-foreground` on `background` (normal helper text)
- `muted-foreground` on `card` (normal helper text)
- `accent-foreground` on `accent` for interactive states
- `secondary-foreground` on `secondary`
- Strong status text on tinted status fills, e.g.:
  - `text-emerald-800` on `bg-emerald-100` (light)
  - `text-emerald-300` on `bg-emerald-950` (dark)
  - equivalent amber/rose scales for warning/critical

## Disallowed / avoid combinations

- `muted-foreground` with opacity reductions (`/60`, `/70`) on tiny text (`text-[9px]`, `text-[10px]`, `text-[11px]`).
- Slate hardcoded neutrals (`text-slate-400`, `text-slate-500`) for legal/footer microcopy where tokens should drive theme consistency.
- Mid-tone status text on tinted status cards for very small labels (e.g., `text-*-700` on `bg-*-100` in 10px contexts) when stronger token/scale is available.

## Practical guidance

- Prefer token-level defaults first (`muted-foreground` tune) before component-level overrides.
- For microcopy under 12px, avoid additional opacity modifiers unless contrast is verified.
- For tinted status cards, use one stronger text step than typical body status text.
