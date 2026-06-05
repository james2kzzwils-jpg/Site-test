-- Wave B2 + B3 migration.
--
-- The schema groundwork for rounds, comments and attachments was laid
-- in 0001/0002. This migration only adds what the UI actually needs:
--
--   * a `billable` flag on `rounds` so we can paint a free vs paid pill
--     in the UI; rule of thumb (mirrors the marketing site copy):
--       - stages 1–4 (discovery / mood / animatic / lookdev):
--         round 1 is included, every later round is billable
--       - stage 5 (final): every round is billable
--   * a `closed_by` column on `rounds` so we can audit who closed a
--     round and surface it in the UI if we want to later
--   * `is_member_of_project(uuid)` SQL helper used by the storage
--     policies (mirrors `is_member_of_client` but takes a project id)
--   * a `project-attachments` Supabase Storage bucket + RLS policies
--     so authenticated users can write into their own project folder
--     and read back via signed URLs (we never expose the bucket public)
--
-- Reading note: a project is "yours" if you're in `client_members` for
-- the project's owning client OR you're an admin.

-- ---------------------------------------------------------------------------
-- rounds: billable + closed_by
-- ---------------------------------------------------------------------------
alter table public.rounds
  add column if not exists billable boolean not null default false;

alter table public.rounds
  add column if not exists closed_by uuid references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- helper: is_member_of_project(uuid)
-- ---------------------------------------------------------------------------
create or replace function public.is_member_of_project(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.client_members cm on cm.client_id = p.client_id
    where p.id = target_project
      and cm.profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- comments: allow inserts from authenticated client members tied to a
-- round on a project they belong to. The existing comments_member_insert
-- policy already requires `author_id = auth.uid()`, so this is mainly
-- here to make the auditing of comment author roles explicit.
-- ---------------------------------------------------------------------------
-- (no-op kept for documentation; the policy ships in 0002)

-- ---------------------------------------------------------------------------
-- Storage bucket: project-attachments
--   Path layout: <project_id>/<attachment_id>/<filename>
--   We never make this bucket public; consumers get signed URLs from
--   server actions.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', false)
on conflict (id) do nothing;

-- Helper inside storage policies: pull the project id out of the path.
-- storage.foldername(name) returns a text[] of the path segments.
-- We use the first segment as the project id.

drop policy if exists "project-attachments admin all" on storage.objects;
create policy "project-attachments admin all" on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'project-attachments'
    and public.is_admin()
  )
  with check (
    bucket_id = 'project-attachments'
    and public.is_admin()
  );

drop policy if exists "project-attachments member read" on storage.objects;
create policy "project-attachments member read" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-attachments'
    and public.is_member_of_project(
      (storage.foldername(name))[1]::uuid
    )
  );

drop policy if exists "project-attachments member write" on storage.objects;
create policy "project-attachments member write" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-attachments'
    and public.is_member_of_project(
      (storage.foldername(name))[1]::uuid
    )
  );

drop policy if exists "project-attachments member delete" on storage.objects;
create policy "project-attachments member delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-attachments'
    and (
      public.is_admin()
      or owner = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- attachments: tighten the existing insert policy so members can also
-- attach to stages directly (not only to comments they authored). The
-- 0002 policy only handled the comment_id case; this adds the stage_id
-- case for member uploads where the file is associated with a stage
-- but not yet linked to a comment.
-- ---------------------------------------------------------------------------
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
      or
      (
        stage_id is not null and exists (
          select 1
          from public.stages s
          join public.projects p on p.id = s.project_id
          where s.id = attachments.stage_id
            and public.is_member_of_client(p.client_id)
        )
      )
    )
  );
