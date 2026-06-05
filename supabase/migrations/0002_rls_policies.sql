-- RLS policies. Read this top-to-bottom: every table that holds portal
-- data has RLS forced on, and we expose access through narrow policies.
--
-- The rule of thumb:
--   • Admins (role = 'admin') see and write everything.
--   • Clients see only the clients/projects they are linked to via
--     client_members, and only their own profile.
--   • Service-role key bypasses RLS automatically; we never use it from
--     the browser — only from Next.js server actions on signed-in admin
--     sessions, and ultra-narrow scripts.

-- ---------------------------------------------------------------------------
-- Helper: is_admin() — true if the current auth.uid() has role='admin'.
-- We mark it SECURITY DEFINER so the function reads profiles even
-- against profiles' own RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper: is_member_of_client(uuid) — true if current user is in
-- client_members for the given client.
-- ---------------------------------------------------------------------------
create or replace function public.is_member_of_client(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.client_members
    where client_id = target_client and profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
drop policy if exists clients_admin_all on public.clients;
create policy clients_admin_all on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists clients_member_select on public.clients;
create policy clients_member_select on public.clients
  for select using (public.is_member_of_client(id));

-- ---------------------------------------------------------------------------
-- client_members
-- ---------------------------------------------------------------------------
drop policy if exists client_members_admin_all on public.client_members;
create policy client_members_admin_all on public.client_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists client_members_self_select on public.client_members;
create policy client_members_self_select on public.client_members
  for select using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists projects_member_select on public.projects;
create policy projects_member_select on public.projects
  for select using (public.is_member_of_client(client_id));

-- ---------------------------------------------------------------------------
-- stages
-- ---------------------------------------------------------------------------
drop policy if exists stages_admin_all on public.stages;
create policy stages_admin_all on public.stages
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists stages_member_select on public.stages;
create policy stages_member_select on public.stages
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = stages.project_id
        and public.is_member_of_client(p.client_id)
    )
  );

-- ---------------------------------------------------------------------------
-- rounds
-- ---------------------------------------------------------------------------
drop policy if exists rounds_admin_all on public.rounds;
create policy rounds_admin_all on public.rounds
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists rounds_member_select on public.rounds;
create policy rounds_member_select on public.rounds
  for select using (
    exists (
      select 1
      from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = rounds.stage_id
        and public.is_member_of_client(p.client_id)
    )
  );

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
drop policy if exists comments_admin_all on public.comments;
create policy comments_admin_all on public.comments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists comments_member_select on public.comments;
create policy comments_member_select on public.comments
  for select using (
    exists (
      select 1
      from public.rounds r
      join public.stages s on s.id = r.stage_id
      join public.projects p on p.id = s.project_id
      where r.id = comments.round_id
        and public.is_member_of_client(p.client_id)
    )
  );

drop policy if exists comments_member_insert on public.comments;
create policy comments_member_insert on public.comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.rounds r
      join public.stages s on s.id = r.stage_id
      join public.projects p on p.id = s.project_id
      where r.id = comments.round_id
        and public.is_member_of_client(p.client_id)
    )
  );

-- ---------------------------------------------------------------------------
-- attachments
-- ---------------------------------------------------------------------------
drop policy if exists attachments_admin_all on public.attachments;
create policy attachments_admin_all on public.attachments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists attachments_member_select on public.attachments;
create policy attachments_member_select on public.attachments
  for select using (
    -- attached to a stage we can see
    (
      stage_id is not null and exists (
        select 1 from public.stages s
        join public.projects p on p.id = s.project_id
        where s.id = attachments.stage_id
          and public.is_member_of_client(p.client_id)
      )
    )
    or
    -- attached to a comment we can see
    (
      comment_id is not null and exists (
        select 1
        from public.comments c
        join public.rounds r on r.id = c.round_id
        join public.stages s on s.id = r.stage_id
        join public.projects p on p.id = s.project_id
        where c.id = attachments.comment_id
          and public.is_member_of_client(p.client_id)
      )
    )
  );

drop policy if exists attachments_member_insert on public.attachments;
create policy attachments_member_insert on public.attachments
  for insert with check (
    uploaded_by = auth.uid()
    and (
      (
        comment_id is not null and exists (
          select 1
          from public.comments c
          join public.rounds r on r.id = c.round_id
          join public.stages s on s.id = r.stage_id
          join public.projects p on p.id = s.project_id
          where c.id = attachments.comment_id
            and c.author_id = auth.uid()
            and public.is_member_of_client(p.client_id)
        )
      )
    )
  );
