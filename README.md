# Oncolink

ERP privat pentru cabinet de psihoterapie (MVP, single-therapist, Romania).
Conform GDPR, ANAF e-Factura și reglementărilor Colegiului Psihologilor din România.

## Stack

- **Next.js** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Shadcn/UI** (new-york)
- **Supabase** (Postgres + Row Level Security, Auth)
- **Cloudflare Pages** (API routes: `export const runtime = "edge"`)
- Integrări: Google Calendar, SmartBill (e-Factura), Twilio/WhatsApp, Ollama local (Gemma 2 9B Instruct)

## Start

```bash
cp .env.example .env.local   # completează secretele
npm install
npm run dev                  # http://localhost:3000
```

Smoke test edge route:

```bash
curl http://localhost:3000/api/health
```

## Structură

```
src/
  app/                # rute App Router (UI + API)
    api/health/       # exemplu edge-runtime endpoint
  components/ui/      # Shadcn primitives (Button, Card, …)
  lib/
    supabase/         # client browser / server / service
    utils.ts          # cn() helper
supabase/migrations/  # schema + RLS
```

## Reguli de aur

- Fiecare API route nouă **trebuie** să declare `export const runtime = "edge"`.
- Textul notelor clinice se criptează client-side înainte de a fi trimis la DB.
- AI-ul rulează **local** (Ollama). Nu trimite text de notă la furnizori cloud.
- Toate secretele se citesc din `process.env`.
- Commit & push pe branch-ul `claude/psychotherapist-erp-setup-7gt30`.
