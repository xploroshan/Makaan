-- ============================================================================
-- Dwello — initial schema (Phase 0)
-- Postgres + PostGIS. Designed for the shared API consumed by web + mobile.
-- Conventions: snake_case, UUID PKs, created_at/updated_at, RLS on by default.
-- ============================================================================

-- ---------- Extensions ------------------------------------------------------
create extension if not exists postgis;       -- geospatial search (radius / map)
create extension if not exists pg_trgm;       -- fuzzy text / locality matching
create extension if not exists btree_gist;    -- composite geo+attr indexes

-- ---------- Enums -----------------------------------------------------------
create type user_role         as enum ('seeker', 'owner', 'agent', 'admin');
create type listing_status    as enum ('draft', 'pending_review', 'active', 'paused', 'rented', 'sold', 'expired', 'rejected');
create type transaction_type  as enum ('rent', 'lease', 'coliving', 'sale');
create type property_type     as enum ('flat', 'house', 'land');
create type media_type        as enum ('photo', 'video', 'tour360');
create type enquiry_status    as enum ('pending', 'accepted', 'declined');
create type visit_mode        as enum ('physical', 'video');
create type visit_status      as enum ('proposed', 'confirmed', 'completed', 'cancelled');
create type verification_type as enum ('identity', 'ownership');
create type verification_status as enum ('pending', 'verified', 'rejected');
create type agent_kind        as enum ('agent', 'company');

-- ---------- Helper: updated_at trigger --------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- USERS  (mirrors auth.users; the app's profile + role record)
-- ============================================================================
create table users (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text,
  phone         text,
  email         text,
  roles         user_role[] not null default '{seeker}',
  trust_score   numeric(4,1) not null default 0,
  locale        text not null default 'en-IN',
  currency      char(3) not null default 'INR',
  notifications jsonb not null default '{}'::jsonb,
  status        text not null default 'active',  -- active | suspended | banned
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

-- Admin check used throughout RLS policies.
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from users u
    where u.id = auth.uid() and 'admin' = any (u.roles)
  );
$$;

-- Provision a public.users row whenever an auth user is created.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, phone)
  values (new.id, new.email, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- PROFILES
-- ============================================================================
create table seeker_profiles (
  user_id     uuid primary key references users (id) on delete cascade,
  bio         text,
  city        text,
  occupation  text,
  is_student  boolean not null default false,
  languages   text[] not null default '{}',
  privacy     jsonb not null default '{}'::jsonb,  -- what unlocks on connect
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_seeker_profiles_updated before update on seeker_profiles
  for each row execute function set_updated_at();

create table lifestyle_profiles (
  user_id      uuid primary key references users (id) on delete cascade,
  schedule     text,             -- early_bird | night_owl | flexible
  food         text,             -- veg | non_veg | eggetarian | vegan
  cleanliness  text,             -- relaxed | moderate | very_tidy
  smoking      boolean,
  pets         boolean,
  guests       text,             -- rarely | sometimes | often
  gender_pref  text,             -- any | male | female
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_lifestyle_profiles_updated before update on lifestyle_profiles
  for each row execute function set_updated_at();

create table agent_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references users (id) on delete cascade,
  kind           agent_kind not null default 'agent',
  business_name  text not null,
  logo_url       text,
  banner_url     text,
  about          text,
  brokerage_terms text,
  areas_served   text[] not null default '{}',
  years_active   int,
  rating_avg     numeric(2,1) not null default 0,
  rating_count   int not null default 0,
  verified       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_agent_profiles_updated before update on agent_profiles
  for each row execute function set_updated_at();

-- ============================================================================
-- GEO CATALOGUE  (admin-managed; enables city/locality/pincode scoping)
-- ============================================================================
create table geo (
  id        uuid primary key default gen_random_uuid(),
  country   text not null default 'IN',
  city      text not null,
  locality  text,
  pincode   text,
  centroid  geography(point, 4326),
  enabled   boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_geo_pincode  on geo (pincode);
create index idx_geo_city_trgm on geo using gin (city gin_trgm_ops);

-- ============================================================================
-- LISTINGS + LOCATION + MEDIA
-- ============================================================================
create table listings (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references users (id) on delete cascade,
  agent_id         uuid references agent_profiles (id) on delete set null,
  transaction_type transaction_type not null,
  property_type    property_type not null,
  status           listing_status not null default 'draft',
  title            text,
  description      text,
  price            numeric(14,2),
  deposit          numeric(14,2),
  area_sqft        numeric(10,2),
  bhk              smallint,
  furnishing       text,             -- unfurnished | semi | full
  available_from   date,
  -- Category-specific fields validated against form_templates at the edge.
  attributes       jsonb not null default '{}'::jsonb,
  -- Full-text search document, maintained by trigger below.
  search_tsv       tsvector,
  published_at     timestamptz,
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_listings_updated before update on listings
  for each row execute function set_updated_at();

create index idx_listings_owner   on listings (owner_id);
create index idx_listings_status  on listings (status);
create index idx_listings_tx_prop on listings (transaction_type, property_type);
create index idx_listings_tsv     on listings using gin (search_tsv);
create index idx_listings_attrs   on listings using gin (attributes jsonb_path_ops);

create or replace function listings_tsv_update()
returns trigger language plpgsql as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'B');
  return new;
end;
$$;
create trigger trg_listings_tsv before insert or update of title, description
  on listings for each row execute function listings_tsv_update();

create table locations (
  listing_id uuid primary key references listings (id) on delete cascade,
  geom       geography(point, 4326),         -- precise pin (revealed on consent)
  address    text,                            -- exact address (hidden until reveal)
  locality   text,
  city       text,
  pincode    text,
  geohash    text,
  created_at timestamptz not null default now()
);
create index idx_locations_geom    on locations using gist (geom);
create index idx_locations_pincode on locations (pincode);
create index idx_locations_city    on locations using gin (city gin_trgm_ops);

create table media (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  type       media_type not null default 'photo',
  url        text not null,
  sort_order int not null default 0,
  status     text not null default 'ready',
  created_at timestamptz not null default now()
);
create index idx_media_listing on media (listing_id, sort_order);

-- ============================================================================
-- CONNECT: enquiries, chats, messages, visits, ratings
-- ============================================================================
create table enquiries (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings (id) on delete cascade,
  seeker_id       uuid not null references users (id) on delete cascade,
  status          enquiry_status not null default 'pending',
  contact_revealed boolean not null default false,
  message         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (listing_id, seeker_id)
);
create trigger trg_enquiries_updated before update on enquiries
  for each row execute function set_updated_at();
create index idx_enquiries_seeker on enquiries (seeker_id);
create index idx_enquiries_listing on enquiries (listing_id);

create table chats (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references listings (id) on delete set null,
  owner_id    uuid not null references users (id) on delete cascade,
  seeker_id   uuid not null references users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (listing_id, owner_id, seeker_id)
);
create index idx_chats_owner  on chats (owner_id);
create index idx_chats_seeker on chats (seeker_id);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references chats (id) on delete cascade,
  sender_id   uuid not null references users (id) on delete cascade,
  body        text,
  attachments jsonb not null default '[]'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_messages_chat on messages (chat_id, created_at);

create table visits (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings (id) on delete cascade,
  seeker_id   uuid not null references users (id) on delete cascade,
  slot        timestamptz not null,
  mode        visit_mode not null default 'physical',
  status      visit_status not null default 'proposed',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_visits_updated before update on visits
  for each row execute function set_updated_at();
create index idx_visits_listing on visits (listing_id);
create index idx_visits_seeker  on visits (seeker_id);

-- Visit-gated property ratings: insert allowed only with a completed visit (RLS below).
create table property_ratings (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings (id) on delete cascade,
  seeker_id   uuid not null references users (id) on delete cascade,
  visit_id    uuid not null references visits (id) on delete restrict,
  rating      smallint not null check (rating between 1 and 5),
  review      text,
  created_at  timestamptz not null default now(),
  unique (listing_id, seeker_id)
);
create index idx_ratings_listing on property_ratings (listing_id);

-- ============================================================================
-- SEEKER TOOLS + VERIFICATION
-- ============================================================================
create table saved_searches (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users (id) on delete cascade,
  name          text,
  filters       jsonb not null default '{}'::jsonb,
  alert_channel text not null default 'push',  -- push | email | whatsapp | none
  frequency     text not null default 'instant',
  created_at    timestamptz not null default now()
);
create index idx_saved_searches_user on saved_searches (user_id);

create table verifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users (id) on delete cascade,
  listing_id   uuid references listings (id) on delete cascade,
  type         verification_type not null,
  status       verification_status not null default 'pending',
  evidence_ref text,
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_verifications_user on verifications (user_id);

-- ============================================================================
-- DYNAMIC PLATFORM CONTROL (Super Admin — no-deploy config)
-- ============================================================================
create table form_templates (
  id               uuid primary key default gen_random_uuid(),
  transaction_type transaction_type not null,
  property_type    property_type not null,
  fields           jsonb not null default '[]'::jsonb,
  validations      jsonb not null default '{}'::jsonb,
  version          int not null default 1,
  enabled          boolean not null default true,
  updated_at       timestamptz not null default now(),
  unique (transaction_type, property_type, version)
);
create trigger trg_form_templates_updated before update on form_templates
  for each row execute function set_updated_at();

create table app_config (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  scope      text not null default 'global',  -- global | city:<x> | platform:<x>
  enabled    boolean not null default true,
  updated_by uuid references users (id),
  updated_at timestamptz not null default now()
);
create trigger trg_app_config_updated before update on app_config
  for each row execute function set_updated_at();

create table audit_log (
  id        bigint generated by default as identity primary key,
  actor     uuid references users (id),
  action    text not null,
  entity    text,
  entity_id text,
  ip        inet,
  detail    jsonb,
  at        timestamptz not null default now()
);
create index idx_audit_actor on audit_log (actor, at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table users               enable row level security;
alter table seeker_profiles     enable row level security;
alter table lifestyle_profiles  enable row level security;
alter table agent_profiles      enable row level security;
alter table geo                 enable row level security;
alter table listings            enable row level security;
alter table locations           enable row level security;
alter table media               enable row level security;
alter table enquiries           enable row level security;
alter table chats               enable row level security;
alter table messages            enable row level security;
alter table visits              enable row level security;
alter table property_ratings    enable row level security;
alter table saved_searches      enable row level security;
alter table verifications       enable row level security;
alter table form_templates      enable row level security;
alter table app_config          enable row level security;
alter table audit_log           enable row level security;

-- Users: self read/write; admins read all.
create policy users_self_select on users for select
  using (id = auth.uid() or is_admin());
create policy users_self_update on users for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Profiles: owner-managed; seeker/agent public profiles are world-readable.
create policy seeker_self_all on seeker_profiles for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());
create policy seeker_public_read on seeker_profiles for select using (true);

create policy lifestyle_self_all on lifestyle_profiles for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

create policy agent_public_read on agent_profiles for select using (true);
create policy agent_self_all on agent_profiles for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

-- Geo + form templates + active config: world-readable; admin-writable.
create policy geo_read   on geo for select using (true);
create policy geo_admin  on geo for all using (is_admin()) with check (is_admin());
create policy forms_read  on form_templates for select using (enabled or is_admin());
create policy forms_admin on form_templates for all using (is_admin()) with check (is_admin());
create policy config_read  on app_config for select using (enabled or is_admin());
create policy config_admin on app_config for all using (is_admin()) with check (is_admin());

-- Listings: active listings are public; owners manage their own; admins all.
create policy listings_public_read on listings for select
  using (status = 'active' or owner_id = auth.uid() or is_admin());
create policy listings_owner_write on listings for all
  using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

-- Locations / media inherit listing visibility.
create policy locations_read on locations for select using (
  exists (select 1 from listings l where l.id = listing_id
          and (l.status = 'active' or l.owner_id = auth.uid() or is_admin())));
create policy locations_write on locations for all using (
  exists (select 1 from listings l where l.id = listing_id
          and (l.owner_id = auth.uid() or is_admin())))
  with check (
  exists (select 1 from listings l where l.id = listing_id
          and (l.owner_id = auth.uid() or is_admin())));

create policy media_read on media for select using (
  exists (select 1 from listings l where l.id = listing_id
          and (l.status = 'active' or l.owner_id = auth.uid() or is_admin())));
create policy media_write on media for all using (
  exists (select 1 from listings l where l.id = listing_id
          and (l.owner_id = auth.uid() or is_admin())))
  with check (
  exists (select 1 from listings l where l.id = listing_id
          and (l.owner_id = auth.uid() or is_admin())));

-- Enquiries: visible to the seeker who made it and the listing owner.
create policy enquiries_party_read on enquiries for select using (
  seeker_id = auth.uid() or is_admin()
  or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy enquiries_seeker_insert on enquiries for insert
  with check (seeker_id = auth.uid());
create policy enquiries_owner_update on enquiries for update using (
  exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  or is_admin());

-- Chats + messages: only participants.
create policy chats_party_all on chats for all
  using (owner_id = auth.uid() or seeker_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or seeker_id = auth.uid());
create policy messages_party_read on messages for select using (
  exists (select 1 from chats c where c.id = chat_id
          and (c.owner_id = auth.uid() or c.seeker_id = auth.uid())) or is_admin());
create policy messages_party_send on messages for insert with check (
  sender_id = auth.uid() and
  exists (select 1 from chats c where c.id = chat_id
          and (c.owner_id = auth.uid() or c.seeker_id = auth.uid())));

-- Visits: seeker and listing owner.
create policy visits_party_all on visits for all using (
  seeker_id = auth.uid() or is_admin()
  or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (
  seeker_id = auth.uid()
  or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- Property ratings: world-readable; INSERT only with a completed visit (visit-gated).
create policy ratings_public_read on property_ratings for select using (true);
create policy ratings_visit_gated_insert on property_ratings for insert with check (
  seeker_id = auth.uid()
  and exists (
    select 1 from visits v
    where v.id = visit_id
      and v.seeker_id = auth.uid()
      and v.listing_id = property_ratings.listing_id
      and v.status = 'completed'
  ));

-- Saved searches + verifications: owner-only.
create policy saved_self_all on saved_searches for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());
create policy verif_self_read on verifications for select
  using (user_id = auth.uid() or is_admin());
create policy verif_self_insert on verifications for insert
  with check (user_id = auth.uid());

-- Audit log: admin-only read; writes happen via service role (bypasses RLS).
create policy audit_admin_read on audit_log for select using (is_admin());

-- ============================================================================
-- Geospatial radius search helper (used by the search service)
-- Returns active listings within `radius_m` metres of a point.
-- ============================================================================
create or replace function listings_within_radius(
  lng double precision,
  lat double precision,
  radius_m double precision
)
returns setof listings language sql stable as $$
  select l.* from listings l
  join locations loc on loc.listing_id = l.id
  where l.status = 'active'
    and loc.geom is not null
    and st_dwithin(loc.geom, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_m);
$$;
