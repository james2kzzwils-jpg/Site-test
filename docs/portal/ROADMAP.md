# Client Portal — Roadmap & Current State

> **Branch:** `devin/portal-phase-a`
> **Last updated:** 2026-06-02
> **Status:** Phase A (auth + schema) done. Phase B1.5 (UX polish) done. Phase B2/B3 ~80% done (not deployed). Phase B4+ pending.

---

## TL;DR

The client portal lives on this branch (`devin/portal-phase-a`) and is **not deployed to production yet**. Marketing site is on `devin/1777659987-redesign-premium` (also not deployed — `main` is the live prod state).

When ready to ship: merge `portal-phase-a` -> `redesign-premium` -> `main`, then apply Supabase migrations on production, then deploy on VPS.

---

## Architecture

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind 4
- **Auth/DB/Storage:** Supabase (magic-link OTP server-side, RLS, Storage bucket)
- **Hosting:** Cloudflare (DNS) + VPS 194.31.173.119 (Germany) + PM2 + nginx
- **i18n:** en / ru via custom locale-action
- **Domains:** aepovcg.online (marketing), portal.aepovcg.online (portal)

---

## Database (Supabase)

Migration files on this branch (`supabase/migrations/`):

- `0001_init_portal_schema.sql` — base tables (11 KB)
- `0002_rls_policies.sql` — Row-Level Security (8 KB)
- `0003_b2_b3_rounds_attachments.sql` — rounds.billable, closed_by, helper, Storage bucket (6 KB)
- `0004_contact_messages.sql` — contact form submissions (2.6 KB)

Apply via Supabase CLI or Dashboard SQL Editor, in order. Idempotent.

---

## Auth Flow

Magic-link via Supabase, **server-side OTP exchange**:
1. User submits email on `/portal/login`
2. Supabase sends link with `?token_hash=...&type=email`
3. Server route calls `supabase.auth.verifyOtp()`
4. Session cookie set; redirect to `/portal/client` or `/portal/admin`

---

## Feature Status

### Phase A — Foundations (DONE)
Supabase schema, RLS, magic-link auth, layout, role-based routing.

### Phase B1.5 — UX Polish (DONE)
StageStepper, PortalHeader, Breadcrumb, CopyButton, NDA.

### Phase B2 — Rounds & Comments (~80% DONE)
- Round tracking per stage (1 free revision baseline)
- Comment thread per round
- `postCommentAction`, `closeRoundAction`
- Billable flag, closed_by tracking

**B2 gaps:**
1. `postCommentAction` doesn't return `comment.id` -> attachments bound to stage, not comment
2. No explicit "Request new round" UI button
3. Client role cannot close rounds (intentional)
4. No round editing
5. No round-level billable override UI

### Phase B3 — Attachments & Clipboard Paste (~80% DONE)
- File upload via signed PUT URLs (two-step)
- 25 MB cap, sequential upload, clipboard paste
- Storage bucket `project-attachments` with RLS

**B3 gaps:**
1. Attachments bound to stage_id, not comment_id
2. No attachment delete/replace after posting
3. No drag-drop reordering
4. No per-file upload progress
5. No retry mechanism
6. No file-type restrictions beyond size

### Phase B4 — Publish to Portfolio Lock (PENDING)
### Phase B5 — Contact Form Rate-Limit (PARTIAL — migration done, logic pending)
### Phase C — Production Hardening (PENDING)

---

## Branch Strategy

- `main` — production, behind redesign-premium
- `devin/1777659987-redesign-premium` — marketing rewrite, NOT merged
- `devin/portal-phase-a` — portal foundation + B1.5 + B2/B3 ~80% (this branch)
- `devin/portal-phase-b2` — reserved for B2 gap fixes

**Decision (2026-06-02):** user chose NOT to merge anything. Portal stays isolated on phase-a. Production untouched.

When deploying portal to prod (future):
1. Create backup branches
2. PR portal-phase-a -> redesign-premium (manual merge)
3. PR redesign-premium -> main (manual merge)
4. Apply migrations 0001-0004
5. SSH VPS: git pull, npm run build, pm2 reload
6. Verify portal.aepovcg.online/portal/login

---

## Next Decisions

1. Test portal locally before deciding which gaps to fix
2. Decide on B2 gap fixes — highest-value is comment.id return
3. Decide deployment path: ship as-is OR polish first
4. Marketing backlog: Shop removal, progress bars, contact rate-limit
5. Housekeeping merge chain (deferred)

---

## CI/CD

`.github/workflows/lindy-apply.yml` workflow_dispatch inputs:
- branch (target, default lindy-improvements)
- base_branch (default main)
- file_path (required)
- file_content_b64 (required, base64)
- commit_message (default `chore: lindy update`)

One file per dispatch. Uses LINDY_A secret.

---

*Update this whenever a phase completes or new gaps are discovered.*
