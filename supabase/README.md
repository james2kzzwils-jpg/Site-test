# Supabase setup — Portal Phase A

This folder holds the SQL migrations that build the portal schema and
its Row Level Security (RLS) policies. The portal app (`/portal/*`)
depends on them.

## One-time setup

1. Create a Supabase project (free tier is enough for Phase A/B).
2. Save the API URL, **publishable** key (`sb_publishable_*`) and
   **secret** key (`sb_secret_*`) to your `.env.local` (dev) and to
   the Vercel project env vars (prod). Names:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
3. Apply both migrations to the database **in order**:

### Option A — Supabase SQL Editor (zero install)

Open the dashboard → SQL Editor → paste the contents of
`migrations/0001_init_portal_schema.sql`, run. Then paste
`migrations/0002_rls_policies.sql`, run.

### Option B — Supabase CLI

```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

## Promoting yourself to admin

The trigger `on_auth_user_created` makes every new auth user a
`client` by default. To run the admin UI, promote yourself once:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Run that in the SQL Editor after signing in once with the magic link.

## Storage buckets

Phase A doesn't auto-create buckets — Phase B adds the upload UI. When
we get there, we'll create:

- `attachments-public` — for clients' moodboards (RLS via signed URLs)
- `attachments-private` — for NDA-flagged work (always signed URLs)

## Notes on the schema

- The `clients` table is the *real-world* client; `client_members`
  links auth profiles to clients (one client may have multiple
  contacts, one contact may sit on multiple clients).
- `stages` is auto-populated on every `projects` insert via the
  `on_project_created` trigger. Five fixed stages (discovery, mood,
  animatic, lookdev, final) with seed deliverable copy that matches
  the marketing site's About section.
- `attachments` accepts either a Supabase Storage reference
  (`storage_bucket` + `storage_path`) or an `external_url` (Google
  Drive / Yandex Disk) — required because heavy renders won't fit in
  the free Supabase Storage tier.
- `projects.is_under_nda` is a generated column derived from
  `nda_until`. `'infinity'::date` means perpetual NDA.
- `projects.is_public_portfolio` toggles whether the project shows up
  on the public site once Phase D ships.
