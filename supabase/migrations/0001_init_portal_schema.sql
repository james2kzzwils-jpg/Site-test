-- Portal Phase A schema.
-- Run with: supabase db push  (or apply manually in the Supabase SQL editor).
-- The schema is intentionally minimal: it covers the data model, the
-- role-based view (admin / client) and Row Level Security. UI for
-- comments / file uploads / NDA flags lives in Phase B but the columns
-- exist now so we don't need destructive migrations later.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth.users row, carries the role and the user's
-- chosen display name. Created automatically via the trigger below.
-- ---------------------------------------------------------------------------
create type if not exists portal_role as enum ('admin', 'client');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role portal_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Clients: a real-world client/lead. One profile (role='client') may be
-- linked to multiple client rows over time, and one client row may have
-- multiple invited profiles (e.g. brand + agency contact).
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create table if not exists public.client_members (
  client_id uuid not null references public.clients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_at timestamptz not null default now(),
  primary key (client_id, profile_id)
);

alter table public.client_members enable row level security;

-- ---------------------------------------------------------------------------
-- Projects. NDA flags + portfolio publication flag live here so the
-- admin can flip them per-project from the start.
-- ---------------------------------------------------------------------------
create type if not exists project_status as enum (
  'discovery', 'mood', 'animatic', 'lookdev', 'final', 'archived'
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  brief text,
  budget_cents integer,
  currency text default 'USD',
  due_date date,
  status project_status not null default 'discovery',
  nda_until date,            -- null = no NDA, 'infinity'::date = perpetual
  is_under_nda boolean generated always as (nda_until is not null and (nda_until = 'infinity' or nda_until > current_date)) stored,
  is_public_portfolio boolean not null default false,
  portfolio_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- ---------------------------------------------------------------------------
-- Stages. Five fixed stages per project, created automatically on insert
-- so the admin doesn't need to manage them by hand. Each stage carries
-- the deliverable text the client sees in the marketing site (mirrors
-- the About section's "You Get / На выходе" copy).
-- ---------------------------------------------------------------------------
create type if not exists stage_kind as enum (
  'discovery', 'mood', 'animatic', 'lookdev', 'final'
);

create type if not exists stage_state as enum (
  'pending', 'in_review', 'changes_requested', 'approved'
);

create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind stage_kind not null,
  order_index smallint not null,
  title text not null,
  deliverable text,
  admin_summary text,
  state stage_state not null default 'pending',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, kind)
);

alter table public.stages enable row level security;

-- ---------------------------------------------------------------------------
-- Rounds: a revision round inside a stage. Round 1 is opened with the
-- first comment; admin closes it explicitly to start Round 2.
-- ---------------------------------------------------------------------------
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  index smallint not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (stage_id, index)
);

alter table public.rounds enable row level security;

-- ---------------------------------------------------------------------------
-- Comments. Comments hang off a round; if no round exists yet we lazily
-- open one in the API. Comments support both Supabase-stored attachments
-- and external URLs (Drive / Yandex Disk) for heavy files.
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_role portal_role not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- ---------------------------------------------------------------------------
-- Attachments. Either an internal Supabase Storage object (storage_bucket
-- + storage_path) OR an external URL. Phase A uses Supabase Storage; we
-- keep the columns explicit so migrating to R2 later is a column swap.
-- ---------------------------------------------------------------------------
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references public.comments(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('image', 'video', 'document', 'link', 'other')),
  storage_bucket text,
  storage_path text,
  external_url text,
  filename text,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now(),
  check (
    (storage_bucket is not null and storage_path is not null)
    or (external_url is not null)
  )
);

alter table public.attachments enable row level security;

-- ---------------------------------------------------------------------------
-- Profile trigger: on every new auth.users row, create a matching
-- profiles row defaulting to role='client'. Admin promotes manually.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Project trigger: on every new project, materialise the five stages
-- in fixed order. Deliverable / admin_summary copy is filled by the
-- admin later from the portal UI; we seed sane defaults that mirror
-- the marketing site's About copy.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stages (project_id, kind, order_index, title, deliverable) values
    (new.id, 'discovery', 1, 'Discovery', 'Brief: goals, audience, scope, budget, deadline.'),
    (new.id, 'mood',      2, 'Moodboard & References', 'Mood approved: visual direction locked.'),
    (new.id, 'animatic',  3, 'Animatic', 'Cut approved: timings, camera, story locked.'),
    (new.id, 'lookdev',   4, 'Lookdev & Lighting', 'Look approved: shaders, light, comp previews.'),
    (new.id, 'final',     5, 'Final Render', 'Master delivery + platform cutdowns.')
  on conflict (project_id, kind) do nothing;
  return new;
end;
$$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- ---------------------------------------------------------------------------
-- updated_at touch helper
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_clients on public.clients;
create trigger touch_clients before update on public.clients
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_projects on public.projects;
create trigger touch_projects before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_stages on public.stages;
create trigger touch_stages before update on public.stages
  for each row execute function public.touch_updated_at();
