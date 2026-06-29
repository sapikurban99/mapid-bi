# AGENTS.md

## Quick Reference

```bash
npm run dev        # Next.js dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint (flat config, eslint-config-next)
npm run start      # Serve production build
```

No test framework is configured. No typecheck script — run `npx tsc --noEmit` for type checking.

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript + Supabase

**React Compiler is enabled** in `next.config.ts` (`reactCompiler: true`). Do not add `"use memo"` or React.memo wrappers where the compiler handles optimization.

**Single Supabase client** at `lib/supabaseClient.ts` — requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

### Key Files

| Path | Role |
|---|---|
| `app/services/biService.ts` | **All** Supabase queries live here (~1000 lines). CRUD for every table. |
| `app/lib/config.ts` | Admin-configurable settings (localStorage cache + Supabase `admin_config` table). |
| `app/api/bi/route.ts` | Central API route — dispatches to `biService` functions by `action` param. |
| `app/components/GlobalDataProvider.tsx` | Root context — fetches `/api/bi` on mount, provides `syncData()`. |
| `app/components/SidebarNav.tsx` | Sidebar — all navigation routes defined here. |
| `app/actions/auth.ts` | Server action for login/logout — password from `ADMIN_PASSWORD` env var. |
| `supabase/schema.sql` | Full DB schema (15 tables). |
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

### Authentication

Cookie-based (`bi_auth`). Protected routes: `/`, `/dashboard`, `/admin`, `/growth`. The `proxy.ts` at root contains middleware logic but is **not wired as `middleware.ts`** — auth protection is currently handled by the `GlobalDataProvider` redirect, not Next.js middleware.

## Environment Setup

Copy `.env.example` to `.env.local`. Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `ADMIN_PASSWORD` — Login password (default: `MAPID2026`)
- `N8N_WEBHOOK_URL` — WhatsApp blast webhook (optional)

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
