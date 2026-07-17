# Portal implementation roadmap

Updated: 2026-07-17
Base branch: `redesignLinda`

This file is the working execution plan for the **client portal only**.
Marketing-site planning now lives separately in `docs/MARKETING_SITE_ROADMAP.md`.

This file is the working execution plan for the portal. Completed items are struck through. Open items stay active until they are shipped.

---

## 1. Done in the portal foundation

- ~~Analyze the repository and map the full portal architecture~~
- ~~Stabilize the baseline portal flows and canonical client routes~~
- ~~Harden auth callback redirects so portal auth stops falling back to localhost~~
- ~~Add clearer auth error recovery on the login screen~~
- ~~Add client dashboard progress + next-step context~~
- ~~Introduce `portal_events` as the canonical activity stream foundation~~
- ~~Create Admin Inbox v1 on top of `portal_events`~~
- ~~Add read / unread controls to Admin Inbox~~
- ~~Add inbox triage filters: all / needs attention / unread / approvals~~
- ~~Fix public-origin resolution for test links and emailed auth redirects~~
- ~~Fix new-client invite flow so invite errors stop being silently swallowed~~
- ~~Expose real invite / resend error messages in the admin UI~~

---

## 2. Built and in active rollout / review

- [ ] Project activity feed on admin project pages
- [ ] End-to-end verification of the new public-origin auth flow on production
- [ ] Manual Supabase application of `supabase/migrations/0008_portal_events.sql`

---

## 3. Current priority line

### P0 — inbox + operational awareness
- ~~Create `portal_events` foundation~~
- ~~Create Admin Inbox~~
- ~~Add read / unread state~~
- ~~Add inbox filters~~
- [ ] Add project-level activity feed everywhere it helps the admin move faster
- [ ] Add unread / attention counters in more admin entry points

### P0 — auth reliability
- ~~Fix localhost origin leakage~~
- ~~Fix invite flow visibility and real error surfacing~~
- [ ] Finish robust email-auth completion flow for invite + magic-link emails
- [ ] Verify production auth behavior on fresh users, repeated users, and resend flows

---

## 4. Next planned portal work

### Admin UX
- [ ] Admin overview dashboard: waiting on studio / waiting on client / overdue
- [ ] Client-level health summary on `/portal/admin`
- [ ] Better project creation defaults / templates
- [ ] Faster admin actions for stage transitions
- [ ] Billable-round and payment visibility

### Client UX
- [ ] Better approval UX beyond binary approve / request changes
- [ ] Clearer “what happens next” on project detail pages
- [ ] Stage celebrations / softer delight moments
- [ ] Final delivery and retention flow

### Notifications
- [ ] Email notifications for comments, approvals, file uploads
- [ ] Notification preferences
- [ ] In-app notification surfaces

---

## 5. Later roadmap items

- [ ] Project templates by service type
- [ ] Billing / invoice support around billable rounds
- [ ] NDA and legal workflow polish
- [ ] Referral / loyalty mechanics
- [ ] Reward / wheel experiments only after core portal UX is stable
- [ ] Portal-as-product thinking only after the studio workflow is fast and reliable

---

## 6. Important operational notes

### Manual Supabase step still required
The inbox / activity line depends on this migration being applied manually in Supabase:

- `supabase/migrations/0008_portal_events.sql`

### Public auth origin must stay configured
Production must keep this env var set on the app server:

```bash
PORTAL_PUBLIC_URL=https://portal.aepovcg.pro
```

### Review order for stacked portal PRs
1. `#22` — portal events foundation
2. `#23` — admin inbox v1
3. `#25` — admin inbox read / unread
4. `#26` — admin inbox filters
5. `#29` — project activity feed

---

## 7. Definition of success for the current phase

The current portal phase is successful when:

- auth links work reliably on the live domain
- the admin no longer has to click through every project to know what needs attention
- project pages show enough recent activity to act immediately
- comments, uploads, approvals, and stage changes all land in one coherent activity system
- the portal feels like a service workflow, not a brittle demo
