# LINDY HANDOFF -- aepovcg.pro portal project
> Last updated: 2026-06-04. Pass this file to a new AI agent to resume work instantly.

---

## 1. WHO YOU ARE WORKING WITH

- **Client:** Andrey Epov — CG/3D artist, brand "James Creative Labs"
- **GitHub account:** james2kzzwils-jpg
- **Email:** james2kzzWils@gmail.com
- **Socials:** Behance https://www.behance.net/2kzz | Vimeo https://vimeo.com/1166636825 | LinkedIn https://www.linkedin.com/in/andrey-epov-cg | Instagram https://www.instagram.com/2kzz___/ | Telegram https://t.me/aepov_2kzz

---

## 2. REPO & STACK

- **Repo:** https://github.com/james2kzzWils-jpg/Site-test
- **Default branch:** `devin/redesign-premium`
- **Portal branch (active work):** `devin/portal-phase-a`
- **Stack:** Next.js 16 + React 19 + Tailwind 4 + Three.js + Lenis + Supabase + Cloudflare + VPS (nginx + PM2)
- **VPS IP:** 194.31.173.119 (DE) — user `igor`
- **Sites:**
- `https://aepovcg.pro` -- marketing site (live)
- `https://portal.aepovcg.pro` -- client portal (live, login page loads OK)
- **Supabase project ID:** `awrnfgaqclfgrunetuhq`

---

## 3. CRITICAL: HOW TO WRITE FILES TO THE REPO

**Direct GitHub Contents API (create-or-update-file-contents) returns 404 on slash branches like `devin/portal-phase-a`.**

**The ONLY working write path is workflow_dispatch:**

- Workflow file: `.github/workflows/lindy-apply.yml`
- Workflow ID: `287771365`
- **Always use `ref=main`** when triggering
- Pass inputs as an array of 5 `{jsonPath, jsonValue}` pairs in a SINGLE call:
- branch: target branch name (e.g. devin/portal-phase-a)
- base_branch: same as branch
- file_path: path to file in repo
- commit_message: your commit message
- file_content_b64: full base64 of file content, never truncated

Confirmed working run example: **26878824105**

---

## 4. CURRENT STATE -- WHAT IS DONE

### Phase 1 (complete)
- Footer socials: Behance, Vimeo, LinkedIn, Instagram, Telegram
- Navigation CTA: "Start a Project" linking to #contact

### Portal Phase A (complete)
- Supabase schema: profiles, clients, client_members, projects, stages, rounds, comments, attachments
- Magic-link OTP auth (server-side)
- Auth callback route: /portal/auth/callback
- RLS policies: 0002_rls_policies.sql

### Portal Phase B1.5 (complete)
- StageStepper component
- NDA gate
- Magic-link email flow

### B2 audit -- 6 gaps identified, ROADMAP.md written to devin/portal-phase-a

### B2 gap #1 (complete)
- PostCommentResult type fix
- StageThread.tsx commentId fix
- Migration 0003_b2_b3_rounds_attachments.sql

### Infrastructure / .pro migration (complete)
- nginx configs updated: deploy/nginx-aepovcg.conf + deploy/nginx-portal.conf
- VPS nginx reloaded
- portal.aepovcg.pro loads login page OK

### B2 hotfix -- RLS on rounds (committed to repo as 0005_rounds_member_insert.sql, run 26892786814)
- **User still needs to apply in Supabase Dashboard SQL Editor:**

```sql
drop policy if exists rounds_member_insert on public.rounds;
create policy rounds_member_insert on public.rounds
for insert with check (
  exists (
    select 1 from public.stages s
    join public.projects p on p.id = s.project_id
    where s.id = rounds.stage_id
      and public.is_member_of_client(p.client_id)
  )
);

drop policy if exists rounds_member_update on public.rounds;
create policy rounds_member_update on public.rounds
for update using (
  exists (
    select 1 from public.stages s
    join public.projects p on p.id = s.project_id
    where s.id = rounds.stage_id
      and public.is_member_of_client(p.client_id)
  )
) with check (
  exists (
    select 1 from public.stages s
    join public.projects p on p.id = s.project_id
    where s.id = rounds.stage_id
      and public.is_member_of_client(p.client_id)
  )
);
```

---

## 5. PENDING TASKS (priority order)

### URGENT -- do first

**A. Supabase Dashboard (user must do manually):**
1. SQL Editor: run the rounds_member_insert + rounds_member_update SQL above
2. Authentication > URL Configuration:
 - Site URL: https://portal.aepovcg.pro
 - Redirect URLs: https://portal.aepovcg.pro/**
 - Fixes magic-links going to localhost

**B. Stale Server Action cache ("Failed to find Server Action"):**
- Not a code bug — stale browser cache after deploys
- Client fix: hard refresh (Ctrl+Shift+R) or private window
- Code fix: add `experimental.serverActions.encryptionKey` to next.config.js

### NEXT -- portal features

**B2 gap #2:** UI for creating a new round
- "Start new round" button on stage view (admin only)
- Creates rounds row: stage_id, round_number = prev+1, status = active

**B2 gap #4:** Edit/replace attachments UI

**B2 gap #3:** Publish-to-Portfolio lock -- only allow when stage status is Final or Archived

### LOW PRIORITY

- ROADMAP.md: update .online to .pro references (cosmetic)
- Shop section: remove from marketing site entirely
- Progress bars in "How I work": user undecided
- Contact form: rate-limit + DB -- needs reCAPTCHA keys from user

---

## 6. KEY FILES

```
supabase/migrations/
0001_init_portal_schema.sql
0002_rls_policies.sql
0003_b2_b3_rounds_attachments.sql
0004_contact_messages.sql
0005_rounds_member_insert.sql   <- hotfix, apply in Supabase Dashboard
deploy/
nginx-aepovcg.conf
nginx-portal.conf
components/portal/
StageThread.tsx
StageStepper.tsx
NdaGate.tsx
app/portal/
auth/callback/route.ts
[projectId]/page.tsx
ROADMAP.md
LINDY_HANDOFF.md                  <- this file
```

---

## 7. KNOWN GOTCHAS

1. workflow_dispatch only for writing files -- direct Contents API 404s on slash branches
2. Supabase Site URL needs updating to .pro in Dashboard (Auth > URL Config)
3. "Failed to find Server Action" = stale browser cache, not a code bug
4. RLS on rounds: INSERT/UPDATE policies missing in prod until user runs SQL above
5. Cloudflare blocks Russian IPs -- site accessible from DE VPS and non-RU IPs
6. Magic-link redirect goes to localhost until Supabase Site URL is updated

---

## 8. WORKFLOW FOR NEW AGENT

1. Read this file top to bottom
2. Check branch state: GET /repos/james2kzzwils-jpg/Site-test/contents/?ref=devin/portal-phase-a
3. Before writing ANY file: encode as base64, use workflow_dispatch (see section 3)
4. Before touching DB: read current migrations in supabase/migrations/
5. Always verify workflow run succeeded via list-workflow-runs after dispatch
6. Never merge branches -- user manages merges manually
7. Read code before writing -- always fetch file first, understand structure, then patch

---
*Generated by Lindy Assistant 2026-06-04. Repo: james2kzzwils-jpg/Site-test, branch: devin/portal-phase-a*
