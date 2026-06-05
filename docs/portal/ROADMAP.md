# Client Portal — Roadmap & Current State

> **Branch:** `devin/portal-phase-a`
> **Last updated:** 2026-06-02
> **Status:** Phase A (auth + schema) ✅ done. Phase B1.5 (UX polish) ✅ done. Phase B2/B3 ✅ ~80% done (not deployed). Phase B4+ pending.

---

## TL;DR

The client portal lives on this branch (`devin/portal-phase-a`) and is **not deployed to production yet**. Marketing site is on `devin/1777659987-redesign-premium` (also not deployed — `main` is the live prod state).

When ready to ship: merge `portal-phase-a` → `redesign-premium` → `main`, then apply Supabase migrations on production, then deploy on VPS.

---

## Architecture

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind 4
- **Auth/DB/Storage:** Supabase (magic-link OTP server-side, RLS, Storage bucket)
- **Hosting:** Cloudflare (DNS) + VPS 194.31.173.119 (Germany) + PM2 + nginx
- **i18n:** en / ru via custom locale-action
- **Domains:**
  - `aepovcg.online` — marketing site
  - `portal.aepovcg.online` — client portal

---

## Database (Supabase)

Migration files on this branch (`supabase/migrations/`):

| File | Purpose | Size |
|---|---|---|
| `0001_init_portal_schema.sql` | Base tables: profiles, projects, project_members, stages, rounds, comments, attachments, audit_log | 11 KB |
| `0002_rls_policies.sql` | Row-Level Security policies for all tables | 8 KB |
| `0003_b2_b3_rounds_attachments.sql` | Adds `rounds.billable`, `rounds.closed_by`, `is_member_of_project()` helper, `project-attachments` Storage bucket + RLS, tightens attachments insert policy | 6 KB |
| `0004_contact_messages.sql` | Contact form submissions table + rate-limit support | 2.6 KB |

**To apply on production:** run via Supabase CLI (`supabase db push`) or paste SQL into Supabase Dashboard SQL Editor, in order. Idempotent (uses `create ... if not exists`).

---

## Auth Flow

Magic-link via Supabase, **server-side OTP exchange** (not implicit `#access_token` flow):

1. User submits email on `/portal/login`
2. Supabase sends email with link containing `?token_hash=...&type=email`
3. Link target is server route which calls `supabase.auth.verifyOtp()`
4. Session cookie set; redirect to `/portal/client` (or `/portal/admin` based on role)

`SignOutButton.tsx` calls `supabase.auth.signOut()` and redirects to home.

---

## Portal Structure

```
src/app/portal/
├── layout.tsx                    — wraps portal pages, mounts PortalHeader
├── page.tsx                      — role-based redirect (client/admin)
├── login/                        — magic-link OTP entry
├── client/
│   ├── page.tsx                  — client dashboard (list of own projects)
│   └── [projectId]/              — per-project view with stages + threads
├── admin/
│   ├── page.tsx                  — admin dashboard (all clients overview)
│   └── clients/                  — admin client management
└── _shared/
    ├── PortalHeader.tsx          — top nav (locale switcher, sign-out)
    ├── Breadcrumb.tsx            — path crumbs
    ├── CopyButton.tsx            — clipboard copy helper
    ├── LocaleSwitcher.tsx        — en/ru toggle
    ├── SignOutButton.tsx         — auth sign-out
    ├── StageStepper.tsx          — 5-stage progress: Discovery → Moodboard → Animatic → Lookdev → Final Render
    ├── StageThread.tsx           — ⭐ MAIN COMPONENT: rounds + comments + attachments + clipboard paste (19 KB)
    └── locale-action.ts          — server action for locale persistence
```

---

## Feature Status

### ✅ Phase A — Foundations (DONE)
- Supabase schema (projects, stages, rounds, comments, attachments, profiles, members, audit_log)
- RLS policies (clients see own projects only; admins see all)
- Magic-link auth via server-side OTP
- Portal layout + header + locale switcher
- Role-based routing (client/admin)

### ✅ Phase B1.5 — UX Polish (DONE)
- `StageStepper` — 5-stage progress UI
- `PortalHeader` with locale + sign-out
- Breadcrumb navigation
- CopyButton for project IDs / share links
- NDA acknowledgment per project (in schema)

### ✅ Phase B2 — Rounds & Comments (~80% DONE)
Implemented in `StageThread.tsx`:
- ✅ Round tracking per stage (1 free revision baseline)
- ✅ Comment thread within each round (chronological, with author names)
- ✅ `postCommentAction` server action — posts comment to current open round
- ✅ `closeRoundAction` server action — admin closes round; next comment opens round N+1
- ✅ Billable flag on rounds (when client exceeds free revisions)
- ✅ `closed_by` tracking for audit

**B2 gaps (improvements, not blockers):**
1. `postCommentAction` doesn't return `comment.id` → attachments bound to `stage_id` instead of specific comment
2. No explicit "Request new round" UI button — rounds created implicitly after closure + next comment
3. Client role cannot close rounds (intentional — admin-only closure)
4. No round editing (rename / reorder / delete)
5. No round-level billable override UI

### ✅ Phase B3 — Attachments & Clipboard Paste (~80% DONE)
Implemented in `StageThread.tsx`:
- ✅ File upload via signed PUT URLs (two-step: `createUploadUrlAction` → PUT to Storage → `finalizeAttachmentAction`)
- ✅ 25 MB per-file size cap
- ✅ Sequential upload (one file at a time)
- ✅ Clipboard paste handler — `onPaste` reads `clipboardData.items`, finds files, auto-renames with timestamp
- ✅ Storage bucket `project-attachments` with RLS (members only)

**B3 gaps (improvements, not blockers):**
1. Attachments bound to `stage_id`, not `comment_id` (consequence of B2 gap #1)
2. No attachment deletion / replacement after posting
3. No drag-and-drop reordering of pending attachments
4. No per-file upload progress indicator (only `isPending` boolean)
5. No retry mechanism for failed uploads
6. No file-type restrictions beyond size cap (e.g. could add image-only / video-only filters)

### ⬜ Phase B4 — Publish to Portfolio Lock (PENDING)
- Lock projects in `Final Render` or `Archived` status from being edited
- "Publish to portfolio" button gates on `stage === 'Final' && status === 'completed'`
- Auto-archive projects N days after Final delivery

### ⬜ Phase B5 — Contact Form Rate-Limit (PARTIALLY DONE)
- ✅ `0004_contact_messages.sql` migration exists (DB table for submissions)
- ⬜ API route `/api/contact` exists as folder but content not yet audited
- ⬜ Rate-limit logic: 1-3 submissions per email per 24h
- ⬜ Resend integration for email notifications to admin

### ⬜ Phase C — Production Hardening (PENDING)
- Audit log UI for admins (table exists in schema)
- Project archival flow
- Client onboarding email templates
- Admin invitation flow (admin can invite clients via email)
- Project status transitions (Active → On Hold → Completed → Archived)

---

## Branch Strategy

| Branch | Purpose | Status |
|---|---|---|
| `main` | Production (what's live on aepovcg.online) | Behind redesign-premium |
| `devin/1777659987-redesign-premium` | Marketing site rewrite (max-filled) | NOT yet merged to main |
| `devin/portal-phase-a` | Portal foundation + B1.5 + B2/B3 ~80% (this branch) | NOT yet merged to redesign-premium |
| `devin/portal-phase-b2` | (Reserved) future B2 gap fixes | Not yet created |

**Decision (2026-06-02):** user chose NOT to merge anything yet. All portal code stays isolated on `devin/portal-phase-a` and its descendants. Production stays on `main` untouched. When deploying portal to prod (future decision):

1. Create backup branches: `backup/main-YYYY-MM-DD`, `backup/redesign-premium-YYYY-MM-DD`, `backup/portal-phase-a-YYYY-MM-DD`
2. Open PR `portal-phase-a` → `redesign-premium`, review, merge (user manually clicks merge)
3. Open PR `redesign-premium` → `main`, review, merge (user manually clicks merge)
4. Apply Supabase migrations 0001-0004 on production (idempotent)
5. SSH into VPS, `git pull`, `npm run build`, `pm2 reload`
6. Verify `portal.aepovcg.online/portal/login` works

If something goes wrong on prod: backup branches allow full restore via `git push -f` from backup branch to `main`.

---

## Next Decisions for the User

In rough priority order:

1. **Test the portal locally** before deciding whether B2/B3 gaps need fixing — the gaps may be acceptable for v1.
2. **Decide on B2 gap fixes:** the highest-value fix is returning `comment.id` from `postCommentAction` so attachments link to specific comments (not just stages).
3. **Decide on portal deployment path:** ship existing B2/B3 to prod, OR polish gaps first then ship.
4. **Marketing-site backlog:** remove Shop section, decide on progress bars in "How I work" section, contact form rate-limit.
5. **Housekeeping merge chain:** `portal-phase-a` → `redesign-premium` → `main` to clean up branch divergence.

---

## CI/CD

GitHub Actions workflow `.github/workflows/lindy-apply.yml` accepts `workflow_dispatch` with inputs:
- `branch` (target, default `lindy-improvements`)
- `base_branch` (default `main`)
- `file_path` (required)
- `file_content_b64` (required, base64-encoded)
- `commit_message` (default `chore: lindy update`)

Writes one file per dispatch. Uses `LINDY_A` secret (Contents:write). Used for AI-driven file commits to any branch.

---

*This document is the canonical state of the portal. Update it whenever a phase completes or new gaps are discovered.*
