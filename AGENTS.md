# AGENTS.md

## Quick Reference

```bash
npm run dev        # Next.js dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint (flat config, eslint-config-next)
npm run start      # Serve production build
npx tsc --noEmit   # Type checking (no script configured)
```

No test framework is configured.

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript + Supabase

**React Compiler is enabled** in `next.config.ts` (`reactCompiler: true`). Do not add `"use memo"` or React.memo wrappers where the compiler handles optimization.

**Single Supabase client** at `lib/supabaseClient.ts` — requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

### Key Files

| Path | Role |
|---|---|
| `app/services/biService.ts` | **All** Supabase queries live here (~1000 lines). CRUD for every table. |
| `app/lib/config.ts` | TypeScript interfaces + admin-configurable settings (localStorage cache + Supabase `admin_config` table). |
| `app/api/bi/route.ts` | Central API route — dispatches to `biService` functions by `action` param. GET has a 90s server-side timeout. |
| `app/api/bi/email-updates/route.ts` | Email updates API — `GET ?clients=true` (list clients), `GET ?client=X` (history), `POST` (n8n webhook receiver). |
| `app/components/GlobalDataProvider.tsx` | Root context — fetches `/api/bi` on mount, provides `syncData()`. |
| `app/components/SidebarNav.tsx` | Sidebar — all navigation routes defined here. |
| `app/actions/auth.ts` | Server action for login/logout — password from `ADMIN_PASSWORD` env var. |
| `supabase/schema.sql` | Full DB schema. |
| `supabase/migrations/` | Incremental migrations — append-only, ordered by date prefix. |

### Data Flow

```
Supabase DB
  → biService.ts (server-side queries)
    → /api/bi/route.ts (GET returns all data, POST dispatches mutations)
      → GlobalDataProvider (caches in React state, exposes via context)
        → Page components read from context
```

Most pages are `'use client'` and read data from `useGlobalData()` or `getConfig()`.

### Routes (from SidebarNav)

- `/` — Strategy & RACI
- `/dashboard` — BI Dashboard
- `/kpi-dashboard` — KPI Dashboard
- `/b2b-performance` — B2B Performance
- `/growth` — Platform Performance
- `/academy-performance` — Academy Performance
- `/social-media-performance` — Social Media Performance
- `/b2b-board` — B2B Delivery & Ops
- `/daily-standup` — Daily Standup
- `/b2c-campaigns` — B2C Campaigns
- `/crm-wa` — WA CRM & Blast
- `/kpi-config` — KPI Config
- `/links-setup` — Public Links
- `/gallery-config` — Gallery & Assets
- `/pricing-list` — Pricing List

### Email Scraping System

Two-part system for tracking client email status:

1. **Real-time (n8n):** `n8n-email-realtime-workflow.json` — triggers on new IMAP email, matches to known clients via API, summarizes with AI, POSTs to `/api/bi/email-updates`.
2. **Historical (Python):** `scripts/email-historical-scraper.py` — batch processes old emails, exports to Excel. Reads credentials from `.env.local`.

```bash
# Python script dependencies
pip install imapclient openpyxl python-dotenv supabase

# Run historical scraper
python scripts/email-historical-scraper.py
```

The `email_updates` table stores historical scrape results per client (summary, email_count, period dates, created_at).

### Scripts Directory

Utility scripts for data migration and extraction:

- `scripts/migrate.js` — general data migration
- `scripts/migrate-crm.mjs` — CRM-specific migration
- `scripts/migrate-standup.mjs` — standup data migration
- `scripts/update-kanban-progress.mjs` — kanban progress updater
- `scripts/import_payments.js` — payment data import
- `scripts/extract-pdf.cjs` / `extract-pdf.mjs` — PDF extraction utilities

### Authentication

Cookie-based (`bi_auth`). Protected routes: `/`, `/dashboard`, `/admin`, `/growth`. The `proxy.ts` at root contains middleware logic but is **not wired as `middleware.ts`** — auth protection is currently handled by the `GlobalDataProvider` redirect, not Next.js middleware.

## Environment Setup

Copy `.env.example` to `.env.local`. Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `ADMIN_PASSWORD` — Login password (default: `MAPID2026`)
- `N8N_WEBHOOK_URL` — WhatsApp blast webhook (optional)
- `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS` — Email IMAP credentials for scraper
- `N8N_SOCIALS_WEBHOOK_URL` — Social media scraper webhook (optional)

## Conventions

- **UI style:** Zinc monochrome palette, `font-black` headings, `tracking-tight`/`tracking-tighter`, `rounded-2xl`/`rounded-3xl` cards. Tailwind v4 with `@import "tailwindcss"` in `globals.css`.
- **Icons:** `lucide-react` exclusively.
- **Charts:** `recharts` (BarChart, etc.).
- **Data fetching:** `swr` for client-side polling; no React Query.
- **Path alias:** `@/*` maps to project root (configured in `tsconfig.json`).
- **No monorepo** — single Next.js app, no workspaces.
- **No CI/CD config** in repo — likely deployed via Vercel or manual.

## Gotchas

- The `README.md` is a B2B Kanban PRD, not a usage README. Don't treat it as onboarding docs.
- `api.md` at root is sample JSON payload data, not API documentation.
- `proxy.ts` at root exports middleware-like code but is never imported by Next.js. Do not edit it expecting middleware behavior.
- `next.config.ts` computes `NEXT_PUBLIC_APP_VERSION` from git commit count at build time — builds outside git will fall back to `0.1.0`.
- The `biService.ts` column-to-camelCase mapping is the source of truth for field names. Frontend components use camelCase; Supabase uses snake_case. Always match the mapping when adding new fields.
- Supabase RLS (Row Level Security) is not mentioned in schema. The app uses the anon key directly — all data is publicly readable if the URL is known. Do not add sensitive data without enabling RLS.
- **IMAP unicode passwords:** Python's `imaplib` defaults to ASCII encoding. The email scraper patches `server._imap._encoding = "utf-8"` before login to support special characters in passwords.
- **Migadu IMAP:** Only `SUBJECT` search is supported. `FROM`/`TO` search throws errors. Use raw `uid('SEARCH')` instead of imapclient's `search()` method for reliability.
