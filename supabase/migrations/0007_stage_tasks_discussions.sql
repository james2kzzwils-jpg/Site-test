-- Migration 0007: stage_tasks + stage_discussions
--
-- Two lightweight tables for deliverable-level project management
-- inside each stage, outside of the revision-round workflow.
--
--   stage_tasks        → todo check-list per stage deliverable
--   stage_discussions  → direct comments on a stage (not round-bound)
--
-- Both are scoped to a single stage and visible to all project members
-- (admins + client members). RLS follows the existing pattern.

-- ---------------------------------------------------------------------------
-- 1. stage_tasks
-- ---------------------------------------------------------------------------
create table if not exists public.stage_tasks (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  title text not null,
  assignee text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  order_index smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stage_tasks enable row level security;

drop policy if exists stage_tasks_admin_all on public.stage_tasks;
create policy stage_tasks_admin_all on public.stage_tasks
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists stage_tasks_member_select on public.stage_tasks;
create policy stage_tasks_member_select on public.stage_tasks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = stage_tasks.stage_id
        and public.is_member_of_client(p.client_id)
    )
  );

drop policy if exists stage_tasks_member_update on public.stage_tasks;
create policy stage_tasks_member_update on public.stage_tasks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = stage_tasks.stage_id
        and public.is_member_of_client(p.client_id)
    )
  )
  with check (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = stage_tasks.stage_id
        and public.is_member_of_client(p.client_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 2. stage_discussions – comments on a stage that aren't tied to a revision round
-- ---------------------------------------------------------------------------
create table if not exists public.stage_discussions (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_role public.portal_role not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.stage_discussions enable row level security;

drop policy if exists stage_discussions_admin_all on public.stage_discussions;
create policy stage_discussions_admin_all on public.stage_discussions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists stage_discussions_member_select on public.stage_discussions;
create policy stage_discussions_member_select on public.stage_discussions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = stage_discussions.stage_id
        and public.is_member_of_client(p.client_id)
    )
  );

drop policy if exists stage_discussions_member_insert on public.stage_discussions;
create policy stage_discussions_member_insert on public.stage_discussions
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = stage_discussions.stage_id
        and public.is_member_of_client(p.client_id)
    )
  );

-- ---------------------------------------------------------------------------
-- updated_at helper for stage_tasks
-- ---------------------------------------------------------------------------
drop trigger if exists touch_stage_tasks on public.stage_tasks;
create trigger touch_stage_tasks before update on public.stage_tasks
  for each row execute function public.touch_updated_at();
