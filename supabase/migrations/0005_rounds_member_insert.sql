-- Wave B2 hotfix: missing INSERT policy on rounds.
--
-- 0002 only granted client members SELECT on rounds, so any attempt
-- by the portal UI to start round 2 (or any subsequent round) was
-- rejected by RLS:
--   "new row violates row-level security policy for table \"rounds\""
--
-- This policy mirrors the SELECT policy: a client member can INSERT a
-- round on a stage that belongs to a project owned by a client they
-- are a member of. Admins remain covered by rounds_admin_all.
--
-- Symmetric UPDATE policy added too so members mogut close a round
-- they own (closed_by, ended_at, status) without admin help. Tighten
-- later if we want to lock down which columns can be updated.

drop policy if exists rounds_member_insert on public.rounds;
create policy rounds_member_insert on public.rounds
  for insert with check (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = rounds.stage_id
        and public.is_member_of_client(p.client_id)
    )
  );

drop policy if exists rounds_member_update on public.rounds;
create policy rounds_member_update on public.rounds
  for update using (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = rounds.stage_id
        and public.is_member_of_client(p.client_id)
    )
  ) with check (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = rounds.stage_id
        and public.is_member_of_client(p.client_id)
    )
  );
