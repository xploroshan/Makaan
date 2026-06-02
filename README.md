# Dwello (Makaan)

Dwello is a broker-free, India-first **property & co-living marketplace**. Home
owners, agents and brokers list properties for **rent, co-living, lease, or
sale** — flats, houses and land — with rich media and geo-tagged location, and
connect with seekers through internal chat plus **consent-based** contact
reveal (zero brokerage, zero spam).

This repository contains the **web application**, built on a single shared,
versioned API (`/api/v1`) that the future **Android and iOS** apps will consume
unchanged.

> 📄 Full plan: [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md)
> · Product requirements: `Dwello_Product_Requirement_Document_v1.1_.docx`

## Tech stack

| Layer                            | Choice                                                 |
| -------------------------------- | ------------------------------------------------------ |
| Framework                        | Next.js 16 (App Router, TypeScript)                    |
| Shared API                       | Route handlers under `app/api/v1/*`                    |
| Data / Auth / Storage / Realtime | Supabase (Postgres + PostGIS, Auth, Storage, Realtime) |
| AuthZ                            | Postgres Row Level Security + service-layer checks     |
| Search (MVP)                     | Postgres FTS + PostGIS + pg_trgm                       |
| UI                               | Tailwind CSS v4 + design tokens, dark mode             |
| Forms / Validation               | react-hook-form + Zod (shared by forms **and** API)    |
| Data fetching                    | TanStack Query                                         |
| Tests                            | Vitest (unit) + Playwright (e2e)                       |
| Hosting                          | Vercel (web) + Supabase (data)                         |

## Project structure

```
app/
  api/v1/        # THE shared API (health, me, …)
  page.tsx       # landing
lib/
  api/           # response envelope, error model, route handler wrapper
  auth/          # session + RBAC helpers
  db/            # Supabase clients (server / browser / admin) + env
  config/        # server-driven feature flags / dynamic config
  validation/    # shared Zod schemas
components/       # design system (ui/) + providers
supabase/
  migrations/    # 0001_init (schema, RLS, indexes), 0002_storage (buckets)
  seed/          # launch geo + category-specific form templates
openapi/          # dwello.v1.yaml — API contract (source of truth)
tests/unit/       # Vitest unit tests
```

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# and SUPABASE_SERVICE_ROLE_KEY from your Supabase project.

# 3. Apply the database schema (via the Supabase CLI or SQL editor)
#    supabase/migrations/0001_init.sql
#    supabase/migrations/0002_storage.sql
#    supabase/seed/seed.sql

# 4. Run
npm run dev          # http://localhost:3000
```

## Scripts

| Script              | Purpose                     |
| ------------------- | --------------------------- |
| `npm run dev`       | Start the dev server        |
| `npm run build`     | Production build            |
| `npm run lint`      | ESLint                      |
| `npm run typecheck` | `tsc --noEmit`              |
| `npm test`          | Vitest unit tests           |
| `npm run e2e`       | Playwright end-to-end tests |
| `npm run format`    | Prettier write              |

## API smoke test

```bash
curl http://localhost:3000/api/v1/health
# { "data": { "status": "ok", ... }, "meta": { "requestId": "…" } }
```

## Status

- **Phase 0 — Foundations** ✅ — app scaffold, design system, Supabase schema +
  RLS + seed, auth/session + RBAC helpers, `/api/v1` envelope/error framework,
  OpenAPI contract, CI.
- **Slice A — Listing → Search → Detail** ✅ — category-specific listing wizard
  driven by form templates (incl. land + registration fields), draft → publish
  lifecycle with completeness checks, media attach, faceted + pincode + PostGIS
  radius search with keyset pagination, and the public listing detail page
  (address masked until consent). Service layer is framework-agnostic and
  unit-tested (19 tests).

- **Slice B — Profiles** ✅ — rich seeker profile with **privacy controls**
  (public fields are filtered server-side), lifestyle profile for co-living
  matching, agent/broker **branded pages** (banner, logo, brokerage, areas
  served, portfolio, ratings) with self-service registration + reviews
  (aggregated rating via trigger), and **verification badges** (identity /
  ownership). Includes a role-escalation guard so users can't self-assign admin.

- **Slice C — Connect + Trust** ✅ — the zero-spam flow: express interest →
  **consent-based contact reveal** (owner contact stays hidden until accepted,
  exact address unmasks on consent), **real-time chat** (Supabase Realtime) with
  a spam/scam screen + burst limit, **visit scheduling** (physical/video) with
  confirm/complete, **visit-gated property ratings** (RLS-enforced), report/
  moderation queue, and an **owner dashboard** (views, leads, conversions).

Next: **Slice D — Super Admin console** (RBAC, moderation, dynamic form/geo/
config editing, feature flags, CMS, audit log).
