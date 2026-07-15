-- Migration 0008: portal_events foundation
--
-- Unified event stream for portal actions. This powers future inbox,
-- notifications, per-project activity feeds and "waiting on you"
-- surfaces without having to scrape multiple domain tables.

create table if not exists public.portal_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'comment_added',
      'file_uploaded',
      'stage_changed',
      'approval_requested',
      'approval_decided',
      'nda_signed',
      'project_created'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.portal_events enable row level security;

create index if not exists portal_events_project_created_idx
  on public.portal_events (project_id, created_at desc);
create index if not exists portal_events_client_created_idx
  on public.portal_events (client_id, created_at desc);
create index if not exists portal_events_type_created_idx
  on public.portal_events (type, created_at desc);
create index if not exists portal_events_unread_idx
  on public.portal_events (read_at, created_at desc);

drop policy if exists portal_events_admin_all on public.portal_events;
create policy portal_events_admin_all on public.portal_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists portal_events_member_select on public.portal_events;
create policy portal_events_member_select on public.portal_events
  for select
  to authenticated
  using (public.is_member_of_project(project_id));

drop policy if exists portal_events_member_insert on public.portal_events;
create policy portal_events_member_insert on public.portal_events
  for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and public.is_member_of_project(project_id)
  );
