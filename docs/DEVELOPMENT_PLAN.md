# Dwello (repo: Makaan) — Web Application Development Plan

## Context

**Why this plan exists.** The repository is greenfield (only a `README.md`). The
attached PRD (Dwello v1.1) specifies a broker-free, India-first property &
co-living marketplace delivered across **three surfaces — responsive web,
Android, iOS — over one shared, versioned API and a common database**. The
brief: build the **Web Application first**, then reuse the same API to build the
Android and iOS apps.

**Intended outcome of this document.** A phased, executable plan for the _web_
build that (a) ships the PRD's Phase-1 (MVP) value, and (b) leaves a clean,
client-agnostic `/api/v1` contract so the future mobile apps consume the exact
same backend with zero rework.

**Confirmed foundational decisions (from the user):**
| Decision | Choice |
|---|---|
| Shared API layer | **Next.js (App Router) `/app/api/v1/*` route handlers** act as the versioned shared API. Web UI + API in one repo/runtime. Mobile later consumes the same `/v1` endpoints. |
| Data / Auth / Storage / Realtime | **Supabase** — managed Postgres + **PostGIS**, Auth (phone OTP / Google / Apple / email, JWT), Storage (S3-compatible), Realtime. Postgres FTS + PostGIS for search at MVP; OpenSearch added later only if needed. |
| This session | **Plan only** — no code yet. |
| First vertical slice (after foundations) | **Listing → Search → Detail** (the core supply+discovery loop). |

> Note: PostGIS is required for the geospatial/radius/map search that is core to
> Phase 1. It is a Postgres extension Supabase supports (`create extension postgis`).
> Redis and OpenSearch from the PRD are **deferred** — Postgres + Supabase
> Realtime cover MVP needs; they re-enter the plan at the scale points called out below.

---

## 1. Target Architecture (web-first, mobile-ready)

```
┌──────────────────────────────────────────────────────────┐
│ Clients:  Responsive Web (now) → Android, iOS (later)      │
└───────────────┬──────────────────────────────────────────┘
                │ HTTPS (same versioned contract for all clients)
┌───────────────▼──────────────────────────────────────────┐
│ Next.js App (Vercel)                                       │
│  • UI: /app/(public), /app/(seeker), /app/(owner), /admin  │
│  • Shared API: /app/api/v1/*  ← the "one API"              │
│  • Server Actions only for UI-internal mutations;          │
│    everything mobile needs lives under /api/v1             │
└───────────────┬──────────────────────────────────────────┘
                │ service layer (lib/services/*) — framework-agnostic
┌───────────────▼──────────────────────────────────────────┐
│ Supabase: Postgres + PostGIS · Auth (JWT) · Storage · RT   │
│  + RLS policies as the authorization backbone              │
└────────────────────────────────────────────────────────────┘
External: Claude API (listing assist, NL search — P2) · Map tiles ·
          Payment partner (P2) · SMS/WhatsApp/email (notifications)
```

**Key principle for mobile-readiness:** all business logic lives in a
**framework-agnostic service layer** (`lib/services/*`) and is exposed through
`/api/v1` route handlers. Next.js Server Components/Actions call the _same
services_ — never duplicate logic in UI. When mobile work starts, the API is
already the single source of truth (extractable to a standalone service later
with no contract change, per the PRD's "modular monolith now, microservices later").

---

## 2. Technology Stack (web phase)

| Concern          | Choice                                                   | Notes                                                                                        |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Framework        | **Next.js (App Router, TypeScript)**                     | SSR/SEO for city/locality landing pages (GTM需要), PWA-installable.                          |
| API              | **Route handlers under `/app/api/v1`**                   | Versioned, REST, OpenAPI spec generated/maintained as source of truth.                       |
| DB               | **Supabase Postgres + PostGIS**                          | JSONB for flexible/category-specific attributes; `geography` columns + GIST indexes for geo. |
| Auth             | **Supabase Auth**                                        | Phone OTP, Google, Apple, email; JWT; refresh rotation. RBAC via custom claims + RLS.        |
| AuthZ            | **Postgres RLS** + service-layer checks                  | Consent-based contact reveal, owner-only edits, admin RBAC enforced at the row level.        |
| Storage/Media    | **Supabase Storage + CDN**                               | Photos/video/360 + documents. Image transform on delivery.                                   |
| Realtime         | **Supabase Realtime**                                    | Chat, presence, live notifications, enquiry status.                                          |
| Search (MVP)     | **Postgres FTS (`tsvector`) + PostGIS + trigram**        | Faceted + full-text + geo + pincode. OpenSearch deferred to scale.                           |
| Styling/UI       | **Tailwind CSS + shadcn/ui + Radix**                     | Design system, dark mode, WCAG 2.2 AA.                                                       |
| Forms/Validation | **react-hook-form + Zod**                                | Zod schemas shared by client forms AND `/api/v1` request validation.                         |
| State/data       | **TanStack Query**                                       | Client cache for search/listing; optimistic updates for chat/shortlist.                      |
| Maps             | **MapLibre GL / Mapbox or Google Maps**                  | (Provider decided in Phase 0.) Pins, clustering, draw-to-search.                             |
| AI (P2)          | **Claude API + pgvector**                                | Listing assist, NL-search parsing, recommendations.                                          |
| Hosting          | **Vercel** (web) + Supabase (data)                       | Available tooling; preview deploys per PR.                                                   |
| Tooling          | ESLint, Prettier, Vitest + Playwright, GitHub Actions CI | Test gates before deploy; feature flags via `app_config` table.                              |

---

## 3. Repository Structure (proposed)

```
/app
  /(public)        # landing, city/locality SEO pages, listing detail (public)
  /(auth)          # login, OTP, social callback
  /(seeker)        # search, shortlist, profile, enquiries, visits
  /(owner)         # listing wizard, dashboard, leads
  /(agent)         # agent/broker branded profile + portfolio
  /admin           # Super Admin console (RBAC-gated)
  /api/v1          # THE shared API — auth, listings, search, enquiries,
                   #   chats, visits, ratings, agents, verifications, admin
/lib
  /services        # framework-agnostic domain logic (listing, search, identity…)
  /db              # supabase clients (server/admin/browser), query helpers
  /validation      # Zod schemas (shared: forms + API + DB-bound types)
  /auth            # session, RBAC, claims helpers
  /config          # feature flags, dynamic config loader (server-driven)
/components        # design system (shadcn/ui) + composite UI
/supabase
  /migrations      # SQL migrations (schema, RLS, indexes, functions)
  /seed            # cities/localities/pincodes, form templates, demo data
/openapi           # OpenAPI spec (source of truth for clients/SDKs)
/tests             # unit (Vitest) + e2e (Playwright)
```

**Critical files to create first:** `supabase/migrations/0001_init.sql`,
`lib/db/supabase.ts`, `lib/services/listing.ts`, `lib/services/search.ts`,
`lib/validation/listing.ts`, `app/api/v1/listings/route.ts`,
`app/api/v1/search/route.ts`, `openapi/dwello.v1.yaml`.

---

## 4. Data Model (MVP subset, from PRD §9)

Map PRD entities to Postgres tables. MVP tables (later-phase ones noted):

- `users` (id, name, phone, email, roles[], trust_score, locale, currency, status) — dual-role single account.
- `seeker_profiles` (bio, city, occupation, languages, privacy json) + `lifestyle_profiles` (schedule, food, cleanliness, smoking, pets, gender_pref).
- `agent_profiles` (type, business_name, banner_url, logo, about, brokerage_terms, areas_served[], rating_avg, verified).
- `listings` (owner_id, category, transaction_type, property_type, status, title, description, price, deposit, area, bhk, furnishing, available_from, **attributes JSONB**) — JSONB holds category-specific fields.
- `locations` (listing_id 1—1, `geography(Point)` lat/lng, address, locality, city, pincode, geohash) — **GIST index** for geo.
- `media` (listing_id, type photo/video/360, url, order, status).
- `enquiries` (listing_id, seeker_id, status pending/accepted/declined, contact_revealed) — drives consent flow.
- `chats` / `messages` (participants, body, attachments, read_at) — Realtime.
- `visits` (listing_id, seeker_id, slot, mode physical/video, status) — gates ratings.
- `property_ratings` (listing_id, seeker_id, visit_id, rating, review) — **visit-gated** (FK to a completed visit).
- `saved_searches` (user_id, filters JSONB, alert_channel, frequency).
- `verifications` (user_id, listing_id, type identity/ownership, status, evidence_ref).
- `form_templates` (transaction_type, property_type, fields JSONB, validations JSONB, version) — drives the dynamic listing wizard + admin editing.
- `geo` (city, locality, pincode, lat/lng, enabled) — admin-managed catalogue.
- `app_config` / `feature_flags` (key, value JSONB, scope, enabled, updated_by) — server-driven dynamic control.
- `audit_log` (actor, action, entity, timestamp, ip) — every admin action.
- _P2/P3:_ `reviews`, `agreements`, `payments`, `rent_ledger`, `bookings`.

**RLS posture:** public can read `active` listings (address/contact masked);
owners write only their own; contact fields exposed only when a matching
`enquiries.contact_revealed = true` exists; admin role bypasses via policy.
`property_ratings` insert allowed only if a `visits` row (mode physical/video,
status completed) exists for that seeker+listing.

---

## 5. The Shared `/api/v1` Contract (from PRD §8.2)

Implement REST resources mirroring the PRD so mobile reuses them verbatim:

- **Auth:** `POST /auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `GET /me`, `PATCH /me/preferences`.
- **Listings:** `POST /listings`, `PATCH /listings/{id}`, `GET /listings/{id}`, `POST /listings/{id}/media`, `POST /listings/{id}/status`.
- **Search:** `GET /search?q=&geo=&pincode=&filters=`, `POST /search/saved`, `GET /recommendations` (P2).
- **Connect:** `POST /enquiries`, `POST /enquiries/{id}/consent`, `GET /chats`, `POST /chats/{id}/messages`, `POST /visits`, `POST /listings/{id}/ratings`.
- **Agents:** `GET/POST/PATCH /agents/{id}`, `GET /agents/{id}/listings`, `POST /agents/{id}/reviews`.
- **Trust/Owner:** `POST /verifications/identity|ownership`, `GET /owner/dashboard`.
- **Admin (RBAC):** `GET/PUT /admin/config`, `PUT /admin/forms/{template}`, `PUT /admin/geo`, `POST /admin/listings/{id}/moderate`.

Cross-cutting (PRD §8.3): JWT auth, cursor pagination, consistent envelopes,
Zod validation at the edge, idempotency keys on writes, OpenAPI as source of truth.

---

## 6. Phased Delivery Roadmap (web)

### Phase 0 — Foundations (Weeks 0–6 equiv.)

- Repo scaffold (structure §3), Next.js + TS + Tailwind + shadcn/ui design system, dark mode, a11y baseline.
- Supabase project: enable PostGIS; migration `0001_init` (core tables + RLS + indexes); seed cities/localities/pincodes + form templates.
- Auth end-to-end (OTP + Google/Apple/email), unified dual-role profile, role context switch, session/device security.
- API skeleton: `/api/v1` envelope, error model, Zod validation, auth middleware, OpenAPI scaffold, idempotency helper.
- CI/CD: GitHub Actions (lint, typecheck, unit, e2e, migration check) + Vercel preview deploys; feature-flag loader from `app_config`.

### Phase 1 — MVP (the PRD's Phase 1) — built as vertical slices

**Slice A (FIRST): Listing → Search → Detail** _(user-selected)_

- Guided **category-specific listing wizard** driven by `form_templates` (rent/lease/co-living/sell flat-house/sell land — incl. land registration fields), Zod validation, auto-save draft, <3-min publish.
- Media upload (photos/video/360 placeholder) to Supabase Storage; geo-tag (map pin + pincode auto-detect; hide exact address pre-reveal).
- Search & Discovery: multi-facet filter, **pincode search**, map-based search w/ clustering + radius/near-me (PostGIS), sort/compare, shortlist, recently-viewed, saved searches.
- Listing detail: immersive gallery, key-facts panel, similar listings, share/report.
- Owner listing lifecycle (active/paused/rented-sold).

**Slice B: Auth-adjacent Profiles** — rich seeker profile (privacy-controlled), agent/broker **branded profile page** (banner, brokerage, portfolio, ratings), verification badges (identity/ownership basics).

**Slice C: Connect + Trust** — enquiry → **consent-based contact reveal** → real-time chat (Realtime) + spam controls; **visit scheduling** (physical/video); **visit-gated property ratings**; report/moderation; owner/agent **dashboard** (views, leads, conversions).

**Slice D: Super Admin Console** — RBAC; users/listings moderation; **dynamic form-template editor**; geo/pincode/city catalogue; feature flags; pricing/config; CMS for landing/banners/FAQs; audit log. (Server-driven, no-deploy control per PRD §5.10.)

### Phase 2 — Transactional depth (fast-follow)

Digital agreements, online rent payment (tokenised partner), tenant verification,
AI listing-assist + NL-search (Claude + pgvector), reviews, alerts (push/email/WhatsApp),
recommendations, more cities. _Introduce OpenSearch + Redis here if Postgres FTS/cache hit limits._

### Phase 3 — Expansion

Co-living operator tools/occupancy, services marketplace, advanced AI/recommendations,
multi-language/currency, international pilots.

### Then — Mobile (Android, iOS)

React Native (or Flutter) clients consuming the unchanged `/api/v1`. Shared
OpenAPI → generated SDK. No backend rework: parity guaranteed by the single API.

---

## 7. Non-Functional Targets (carried from PRD §6.2)

- Search p95 < 500 ms; detail < 1 s; CDN-optimised media; lazy load.
- TLS 1.3; encryption at rest; RLS + least-privilege; OWASP Top-10; secret management.
- India DPDP + GDPR alignment; consent management; right-to-erasure.
- WCAG 2.2 AA; responsive; dark mode; <3-click core journeys.
- Observability: logging, metrics, error tracking from Phase 0.

---

## 8. Verification Strategy (how we'll prove each phase)

- **Unit (Vitest):** service-layer logic — form-template validation, search query
  builder, consent/visit-gating rules, RBAC checks.
- **Integration:** `/api/v1` route handlers against a local/branch Supabase
  (seeded), asserting envelopes, auth, RLS enforcement, idempotency.
- **E2E (Playwright):** the Slice-A golden path — owner logs in → creates a
  land + a flat listing via category forms → publishes → seeker searches by
  pincode + map radius → opens detail. Then Slice-C: enquiry → consent → chat →
  visit → visit-gated rating.
- **Migrations:** every schema change is a reviewed SQL migration; CI runs them
  on a Supabase preview branch before merge.
- **Manual/MCP:** use Supabase MCP (apply_migration / execute_sql) and Vercel
  preview deploys to validate live; Figma MCP available for design-system work.
- **Definition of done per slice:** API documented in OpenAPI, RLS tested, e2e
  green, a11y check, preview deployed.

---

## 9. Open Items to Resolve at Phase-0 Kickoff (not blocking this plan)

- Map provider (MapLibre+OSM vs Mapbox vs Google) — cost/feature trade-off.
- Mobile framework (React Native vs Flutter) — decided before mobile phase, not now.
- SMS/WhatsApp/email provider for OTP + notifications.
- Payment partner (P2) and KYC/DigiLocker provider (verification).

---

## 10. First Concrete Steps (when we move from plan → build)

1. Scaffold Next.js + TS + Tailwind + shadcn/ui; commit base design system.
2. Create Supabase project; enable PostGIS; write `0001_init.sql` (core tables, RLS, GIST/FTS indexes); seed geo + form templates.
3. Stand up `/api/v1` envelope + auth + Zod + OpenAPI scaffold; wire Supabase Auth (OTP + social).
4. Build **Slice A** (Listing wizard → Search → Detail) end-to-end with tests.
5. CI/CD + Vercel previews; iterate Slices B → C → D.
