-- Wave 7: marketing site contact form storage.
--
-- The public Contact section now POSTs to /api/contact, which writes into
-- this table via the service-role key. The row is invisible to anonymous
-- visitors (no SELECT policy for `anon`) — only the admin portal (which
-- already runs with the service-role client for admin actions) reads from
-- it. We also keep the IP + user agent so we can rate-limit per IP and
-- spot abuse later.
--
-- This migration is independent of 0001-0003 (different feature area), so
-- nothing in it touches the portal schema. Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- table
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  email        text not null,
  project_type text,
  message      text not null,
  -- request metadata for rate-limiting + abuse review. nullable so we
  -- never block insert when the request lacks a forwarded header.
  ip_address   inet,
  user_agent   text,
  -- soft status: 'new' on insert; admin can move to 'read' / 'archived'
  -- without deleting the row.
  status       text not null default 'new' check (status in ('new', 'read', 'archived'))
);

-- index for the per-IP rate-limit lookup ("how many rows from this IP in
-- the last N hours"). Without this the rate-limit check would scan the
-- whole table on each submit.
create index if not exists contact_messages_ip_created_idx
  on public.contact_messages (ip_address, created_at desc);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- We deliberately do NOT grant any select/insert/update/delete to the
-- `anon` or `authenticated` roles. All writes happen with the
-- service-role key from /api/contact; all reads happen from the admin
-- portal which also uses the service-role client.
alter table public.contact_messages enable row level security;

-- Nothing to grant for anon — the API route uses service role.
-- For sanity: explicitly revoke from public.
revoke all on table public.contact_messages from public;
revoke all on table public.contact_messages from anon;
revoke all on table public.contact_messages from authenticated;
