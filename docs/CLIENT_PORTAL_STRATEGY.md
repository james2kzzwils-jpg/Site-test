# Client Portal — UX & Monetization Strategy

> Prepared by Lindy (AI Chief of Staff) — 2026-06-02
> Branch: `lindy-portal-ux` (based on `devin/portal-phase-a`)
> Status: PROPOSAL — review before merge

---

## 1. Snapshot of the current portal (what works)

Already shipped on `devin/portal-phase-a`:

- Magic-link auth (Supabase) + admin/client roles
- 5-stage pipeline per project: Discovery → Moodboard → Animatic → Lookdev → Final Render
- Round-based revisions (1 free per stage, Final all paid)
- Per-project NDA (none / date / perpetual) blocking portfolio publish
- File attachments (Supabase Storage, 25MB cap)
- Comments per stage, threaded by round
- Admin: create clients, generate test login link, manage members
- Bilingual EN/RU, breadcrumbs, copy-link UX

**Verdict:** plumbing is solid. What's missing is the *experience layer* that makes clients want to log in again, and the *admin shortcuts* that save Andrey's time.

---

## 2. Pain points

### For ANDREY (admin)
1. **No "what needs my attention" dashboard.** `/portal/admin` is a flat list. Have to click into each project to see status.
2. **No notifications.** When a client comments or approves, nothing pings you.
3. **Stage status invisible at a glance.** No aggregate "3 projects waiting on you, 2 waiting on client".
4. **No templates.** Every new project = re-typing brief placeholders, deadlines, budget.
5. **Manual NDA / billing tracking.** Billable rounds not auto-summed.

### For CLIENTS
1. **Portal feels like a project tracker.** No reason to *return* between stages.
2. **Approval friction.** "Approve / request changes" is binary. No "love it but tweak X" without burning a revision.
3. **No reward / surprise mechanic.** Every interaction is transactional.
4. **No referrals built-in.**

---

## 3. Admin UX improvements (ranked by ROI)

| # | Improvement | Effort | Time saved | Priority |
|---|---|---|---|---|
| A | Inbox-style admin dashboard — "X waiting on you / Y on client / Z overdue" | Medium | ~15min/day | 🔥 P0 |
| B | Email / Telegram pings on client action — comment, approve, file upload | Low | Awareness | 🔥 P0 |
| C | Project templates — Product Viz, Animation, Houdini FX presets | Medium | ~30min/project | P1 |
| D | Auto-invoice draft — sum billable rounds + flat stage costs | High | ~20min/project | P1 |
| E | Per-stage time-tracking | Low | Pricing data | P2 |
| F | "Soft revision" comments — non-revision feedback | Low | Client UX | P2 |

---

## 4. Client-side additions (the casino mechanic)

**Centerpiece: fortune wheel reward** — designed in §5.

Smaller ideas:
- Stage celebration animations — confetti on approval
- Referral link — "Send a friend, get 10% off your next round"
- Loyalty tiers — Bronze (1 project), Silver (3), Gold (5+) — better wheel odds, priority queue, free consult
- Project-completion gift — at Final stage, auto-spawn one "thank you" spin with best odds

---

## 5. Fortune Wheel — design spec

### 5.1 Premise
After a client hits a milestone (stage approval, Final stage, anniversary), they earn one wheel spin. Prizes weighted by value. **Near-miss bias** — the pointer visibly grazes the top prize before settling on the actual prize. Used by Duolingo, Starbucks etc. — high dopamine, ethical because actual win distribution is honest.

### 5.2 Prize table (configurable)

| Slot | Prize | Weight | Cost to you |
|---|---|---|---|
| 1 | Free revision round (stages 1–4) | 30 | Low |
| 2 | 10% off next round | 25 | Low |
| 3 | Free 30-min strategy call | 15 | Time |
| 4 | Showreel slot mention | 10 | Marketing trade |
| 5 | 30% off next project | 8 | Real $ |
| 6 | "Skip the queue" priority slot | 7 | None |
| 7 | **50% off current project** (jackpot) | 3 | Real $ — rare |
| 8 | "Try again next stage" | 2 | None |

### 5.3 "Almost-won" mechanic
- Roll actual prize via weighted RNG.
- Animation: 6 full rotations + extra `(actual + Math.random(0.5, 0.9)) * sliceAngle`.
- **Trick:** if actual prize ≠ jackpot, deceleration overshoots PAST jackpot, hesitates ~150ms, then nudges back. Jackpot slot pulses briefly while pointer is on it.
- Creates "I almost had it!" feeling. Actual win distribution unchanged.

### 5.4 Anti-abuse
- One spin per stage approval (server-side tracked).
- 7-day cooldown between spins.
- All prizes stored in `rewards` table with `redeemed_at` + `expires_at` (90 days default).
- Admin can revoke/extend.

### 5.5 Database addition (Supabase migration — apply manually)

```sql
create table public.rewards (
id uuid primary key default gen_random_uuid(),
client_id uuid references public.clients(id) on delete cascade,
project_id uuid references public.projects(id) on delete cascade,
prize_key text not null,
prize_label text not null,
prize_value_json jsonb default '{}'::jsonb,
won_at timestamptz default now(),
redeemed_at timestamptz,
expires_at timestamptz default (now() + interval '90 days'),
notes text
);
alter table public.rewards enable row level security;

create policy "client_own_rewards" on public.rewards
for select using (
  auth.uid() in (
    select user_id from client_members where client_id = rewards.client_id
  )
);

create policy "admin_all_rewards" on public.rewards
for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
```

> NOT applied in this PR — review and apply via Supabase Studio.

### 5.6 Component contract (in this PR)
- `<RewardWheel prizes={...} onSpinComplete={(result) => ...} disabled />` — pure UI, no data layer
- File: `src/components/portal/RewardWheel.tsx`
- Page wrapper at `/portal/client/[projectId]/rewards` — NOT included in this PR, scaffolded once you approve

---

## 6. Answer on "progress bars" (plan item 7)

Current: About section has 5-step Approach with static percentage bars.

**Recommendation:** Replace with **animated lifetime-stats counter**:
- "47 projects shipped" (counter)
- "12 industries served"
- "94% client return rate"
- "200+ hours of Houdini sims rendered"

Pulls real data from Supabase. Counts up on scroll-into-view. More alive + trust-building than abstract %s.

Alternative (heavier): keep 5-step bars but show **real average time per stage** ("Discovery — avg 3 days"). Transparency play for premium clients.

**My pick: animated counter.** Faster win, more eye-catching. Will ship in a follow-up PR if you approve.

---

## 7. Monetization ideas

| Tier | Offering | Pricing | Why 2026 |
|---|---|---|---|
| Productized service | "48h Brand Sting" — 5–10s logo intro w/ preset Houdini sims | flat $400–800 | Agency demand, low custom work |
| Productized service | "Site-in-a-week" — Next.js + Three.js portfolio for other artists | flat $2k–4k | You already built one — repurpose templates |
| Subscription | "Sim Library" — monthly `.hip` files, presets, lookdev kits | $29/mo | Recurring revenue, low marginal cost |
| Subscription | Existing AI prompt packs → bundled subscription | $19/mo | Existing product, add recurring |
| Edu | "Houdini for product viz" course | $199 | Houdini courses scarce + premium-priced |
| Coaching | "1:1 portfolio review for CG artists" | $150/hr | High margin, builds network |
| Licensing | Real-time Unreal scenes for archviz studios | $500–2k/project | UE5 + Cosmos experience = niche moat |
| Affiliate | Render farm partnerships (Pixel Logic, Garage Farm) | rev-share | Passive |
| SaaS | Lightweight portal-as-a-product for other freelance CG artists | $9–19/mo | Massive underserved niche |

**Top 3 bets:**
1. **Productized "Brand Sting"** — quick launch, social-shareable, builds pipeline
2. **Sim Library subscription** — recurring + leverages existing work
3. **Portal-as-SaaS** — longest payoff but real moat

---

## 8. What's in THIS PR (`lindy-portal-ux`)

✅ This document (`docs/CLIENT_PORTAL_STRATEGY.md`)
✅ `<RewardWheel />` component — drop-in, theme-matched cyan accent, no new deps (Web Animations API)

❌ NOT in this PR (decisions needed):
- Supabase migration for `rewards` table (SQL above, apply manually)
- Page wrapper at `/portal/client/[projectId]/rewards` — wire after approval
- Server action to record spin
- Admin dashboard improvements (§3, scoped for follow-up)
- Stats counter component (§6, scoped for follow-up)

---

## 9. Open questions

1. **Branch strategy:** Phase-1 Footer/Nav work is on `lindy-improvements` (from `main`). This is on `lindy-portal-ux` (from `devin/portal-phase-a`). What's the canonical merge target — merge `devin/portal-phase-a` → `main` first, then layer my UX on top?
2. **aepovcg.pro vs aepovcg.online:** history says `.online`, you use `.pro`. Same deployment or two domains?
3. **Wheel trigger:** auto-spawn on stage approval, or button on dashboard?
4. **Prize redemption flow:** show in portal + email it? DM via Telegram?

Reply when back — PR open.