# Marketing site roadmap

Updated: 2026-07-17
Base branch: `redesignLinda`

This file tracks the **marketing site only**.
The client portal has its own separate execution plan in `docs/PORTAL_IMPLEMENTATION_ROADMAP.md`.

Use this file for founder positioning, homepage structure, visual direction, design handoff, and public-site conversion work.

---

## 1. Working brand model

### Chosen direction
- **Epov Creative Labs** should be presented as a **founder-led creative lab**
- not as a fake large studio
- not as a generic solo freelancer profile
- not as a purely abstract art project with no commercial clarity

### Public-facing positioning direction
Use one of these as the working model while the final wording is refined:
- **Founder-led creative lab for premium CGI, product visuals, and procedural motion**
- **Independent CGI & motion studio led by Andrey Epov**
- **Boutique CGI practice for brands, products, and spatial experiences**

### Brand tension we are resolving
The current site mixes:
- `studio / labs` language
- `I build visuals` language
- technical expert language
- portfolio language

This roadmap aligns them into one coherent identity.

---

## 2. Core brand principles

### Keep
- **Giving Form to the Invisible. Precision in service of Intention.**
- founder / creative director / digital craftsman archetype
- premium editorial visual language
- technical depth as a differentiator
- real case-led proof
- bilingual capability

### Change
- do **not** rely on the manifesto alone to explain the offer
- do **not** present the brand like a large team if it is not one
- do **not** position the site like a generic freelance portfolio
- do **not** let heavy motion effects outrun clarity, trust, and conversion

### Important clarification
`Giving Form to the Invisible` stays as the **emotional brand axis**, but not as the only first-screen explanation of the service.

---

## 3. Audit summary — current strengths vs gaps

### What is already strong
- strong visual character
- solid project base
- visible Houdini / Blender / CG expertise
- existing EN / RU structure
- multiple contact entry points
- current homepage already has Works / Services / About / FAQ / Contact foundation

### Main gaps to solve
- homepage reads more like a portfolio showcase than a conversion-led marketing site
- positioning is still too broad in the first screen
- founder presence is weak: the person behind the work is not visible enough
- `studio` vs `solo` brand framing is inconsistent
- services lean too much on tools and not enough on outcomes
- proof / trust layer is not structured strongly enough
- premium visual ambition is ahead of message clarity in some places

---

## 4. Strategic decisions already made

### Founder presence must increase
The marketing site should deliberately show **Andrey Epov as the founder presence**.
This is expected to improve:
- trust
- memorability
- premium perception
- clarity on who the client is hiring

### Photos / presence are now part of the plan
Planned insertion points:
1. Hero
2. About / founder section
3. Final CTA
4. optional secondary use in Services / Process if it supports clarity

### Hero CTA decision
- primary CTA: **Showreel**
- secondary CTA: **Start a Project**
- selected works should be reached by scroll, not by a dedicated hero button

### Heavy 3D / cinematic motion is not phase one
The following are **not blocked forever**, but are **not phase-one priorities**:
- complex hero particle system
- horizontal works scroll as a core interaction model
- cinematic service scenes that replace clear service explanation
- advanced transitions that risk performance or usability

These belong after message clarity, structure, and proof are solved.

---

## 5. Marketing site workstreams

### Workstream A — positioning and message clarity
Goal: explain the offer in 5 seconds.

Tasks:
- [ ] finalize public brand model
- [ ] choose the primary audience priority
- [x] rewrite the first-screen positioning — done: founder-led hero reframe (PR #57)
- [ ] define one main CTA and one secondary CTA
- [ ] remove weak or contradictory copy
- [x] fix naming / language consistency such as `Epov Creative Lab's` — done: unified to `Epov Creative Labs` in EN/RU i18n (site metadata already used the correct name)
- [x] fix project naming issues such as `Parfume` → `Perfume` — done: EN project title corrected (internal id/asset paths and the Behance URL intentionally kept as-is)

### Workstream B — founder presence and trust
Goal: show the person behind the work without collapsing into a generic freelancer image.

Tasks:
- [ ] define founder-presence visual strategy
- [ ] add a professional portrait / controlled founder visual language
- [ ] decide hero founder treatment: direct portrait, side profile, silhouette, or integrated background presence
- [x] rewrite About as a high-trust founder block — done (copy layer): About philosophy now opens founder-led — names Andrey Epov, frames the lab as his personal CGI/motion practice, and adds the `no layers between you and the artist` trust argument in EN/RU (PR #65); portrait/visual founder presence remains a designer task (§7, P2)
- [ ] add concise trust signals: experience, education, specialism, geography, client context
- [ ] remove low-premium trust signals if they are too tactical or too literal

### Workstream C — homepage architecture
Goal: rebuild the homepage into a cleaner marketing funnel.

Target structure:
1. Hero
2. Proof / positioning strip
3. Selected works
4. Services
5. Process
6. About / founder presence
7. Final CTA

Tasks:
- [ ] confirm the order of blocks
- [ ] reduce duplicate information
- [ ] move long secondary explanations lower
- [ ] make each section support conversion, not only aesthetics

### Workstream D — featured work strategy
Goal: make the strongest projects work as proof, not just gallery entries.

Tasks:
- [x] elevate 3 flagship project directions — done (copy layer): owner selected the flagship trio 2026-07-17 — Cosmos. Moscow (Scale), Perfume. Simulation (Luxury), ThyName (Innovation); the Works index now leads with these three in that order and a new works subtitle frames them as flagship stories in EN/RU (PR #66); visual case hierarchy remains a designer task
- [x] use a clearer triad such as `Scale / Luxury / Innovation` — done: flagship trio mapped to the triad (Cosmos → Scale, Perfume → Luxury, ThyName → Innovation), recorded here and reflected in the flagship-first Works order (PR #66)
- [ ] ensure each featured project communicates challenge, role, process, and result
- [ ] support designer with clear visual hierarchy for case presentation
- [ ] preserve the rest of the portfolio as secondary depth

### Workstream E — services repackaging
Goal: explain what can be hired and why it matters.

Tasks:
- [x] rewrite services around outcomes, not only tools — done: services subtitle and all three business-facing descriptions now lead with client outcomes (scroll-stopping product reveals; one brief in → launch-ready graded film out; visual signature locked before expensive production) in EN/RU; tool-facing descriptions for producers/studios intentionally kept (PR #64)
- [ ] decide the 3 anchor service lines
- [ ] clarify brand-facing value and studio-facing value separately
- [x] review whether public minimum pricing supports premium positioning — done: reviewed with owner 2026-07-17
- [x] decide whether to keep pricing, soften pricing, or move to estimate-based language — done: owner decision 2026-07-17 — keep the public starting prices as-is (`от 15 000 ₽ / от $250`, `от 25 000 ₽ / от $400`, `от 10 000 ₽ / от $150`)

### Workstream F — process / about / CTA refinement
Goal: increase trust and make starting a project easier.

Tasks:
- [ ] simplify process if it feels too long for the homepage
- [x] replace abstract percentage signals with clearer deliverables if needed — done: the Approach step cards no longer show the abstract `Alignment / Result` percentage bars; each stage now ends with the concrete `You Get / На выходе` deliverable (written brief, approved moodboard, approved cut, composited preview renders, graded master + cut-downs) on desktop and mobile — the deliverable strings already existed in both locales and are now actually rendered (PR #71); unused `mutual_pct` / `result_pct` keys intentionally kept in i18n to avoid a risky locale-file rewrite
- [ ] make About shorter, stronger, and more founder-led
- [x] turn Contact into a stronger conversion block — done (copy layer): contact subtitle rewritten from a vague pleasantry into a conversion path built on existing promises (send a brief → reply within 2h → exact quote within 24h → short call locking scope, timeline, start date) in EN/RU (PR #67); visual CTA composition and founder CTA shot remain designer tasks (§6, §7)
- [x] explain what happens after contact — done: the new contact subtitle spells out the concrete next steps — reply within 2 hours, exact quote within 24, then a short call to lock scope, timeline and start date (EN/RU, PR #67)
- [x] clarify which channel is best for which type of inquiry — done: channel sub-lines now route inquiries — Telegram for quick questions and ideas (fastest reply), email for briefs, files and exact quotes, Calendly call for scope and timeline (EN/RU, PR #67)

### Workstream G — visual system and motion polish
Goal: preserve premium art direction without sacrificing clarity or performance.

Tasks:
- [ ] define visual hierarchy for founder + CGI coexistence
- [ ] define still image fallback strategy
- [ ] define mobile-safe motion strategy
- [ ] only then prototype premium motion enhancements

---

## 6. Design handoff scope

This section is the cleanest handoff surface for a designer.

### Designer should work on
- hero composition concepts
- founder-presence concepts
- proof bar / trust strip
- selected works presentation
- services section hierarchy
- about / founder block
- final CTA composition
- typography and spacing rhythm for premium editorial feel
- mobile adaptation principles for all above

### Designer should not treat as first priority
- complex WebGL hero systems
- engineering-heavy particle logic
- advanced scroll choreography
- portal UI / portal IA / portal auth flows

### References to lean into
- premium watchmaking precision
- architectural minimalism and controlled space
- low-key cinematic lighting
- disciplined materials and reduced noise
- human presence with composure, not lifestyle casualness

---

## 7. Founder photo / asset production plan

### Priority shots
- [ ] Hero shot — side profile / controlled presence / slow-breath loop option
- [ ] About shot — direct portrait with confident eye contact
- [ ] CTA shot — respectful direct presence for conversion
- [ ] optional service-support frame — seated / hands / workspace / craft presence

### Visual constraints
- dark or low-key environment
- clean wardrobe, no noisy styling
- strong material texture in background
- controlled light shape, preferably Rembrandt / low-key inspired
- premium restraint over theatrical excess

### Important rule
Founder photography should support trust and authorship.
It should not feel like influencer lifestyle content.

---

## 8. Immediate content and structure priorities

### P0 — strategic alignment
- [ ] finalize one public positioning direction
- [ ] finalize the role of `Epov Creative Labs` vs `Andrey Epov`
- [ ] define primary target audience priority

### P1 — homepage foundation
- [x] rewrite Hero — done: founder-led hero reframe (PR #57)
- [x] add proof / trust strip after Hero — done: TrustStrip section after the hero marquee, built only on facts already in the site copy (founder-led, full-cycle, Houdini+Blender FX, Moscow / remote worldwide + 2h response); designer can restyle per §6
- [x] re-sequence homepage blocks — done: funnel is now Hero → proof strip → Works → Services → About → FAQ → ScheduleCalendar + Contact as one closing conversion block (FAQ moved above the booking calendar); a dedicated Process section is still a future addition per Workstream C target structure
- [x] define 3 flagship work stories — done: owner picked Cosmos. Moscow (Scale), Perfume. Simulation (Luxury), ThyName (Innovation) on 2026-07-17; Works index reordered flagship-first with a new subtitle framing the three stories in EN/RU (PR #66); each flagship already carries a challenge/outcome/tech case block — designer visual hierarchy per Workstream D remains open
- [x] rewrite services around outcomes — done: outcome-led subtitle + business-facing descriptions in EN/RU, prices unchanged (PR #64)
- [x] rewrite About with founder presence — done (copy layer): About philosophy text now names Andrey Epov, frames Epov Creative Labs as his founder-led practice, and adds the direct-access argument (`you brief the person who actually does the work`) in EN/RU (PR #65); founder imagery in About remains P2
- [x] strengthen final CTA — done (copy layer): Contact rewritten as a conversion block — subtitle with concrete next steps (reply in 2h → exact quote in 24h → short call locking scope, timeline, start date) and inquiry-routing channel descriptions (Telegram / email / Calendly call) in EN/RU (PR #67); founder CTA imagery remains P2 (§7) and final CTA composition is a designer task (§6)

### P1 — premium consistency fixes
- [x] fix brand naming inconsistencies — done: `Epov Creative Lab's` → `Epov Creative Labs` across EN/RU i18n
- [x] fix weak English phrasing — done: unified `Showreel` spelling, US spelling consistency (program, recognizable), clearer revision-rounds note, natural FAQ wording (rates, staying in control), `neural references` → `AI-generated references`; hero i18n block untouched (live hero copy is in Hero.tsx)
- [x] review public prices for premium fit — done: owner decision 2026-07-17 — keep the public `от 15 000 ₽ / от $250` starting prices as-is; outcome-led service copy now carries the premium framing
- [x] remove over-literal schedule/address language if not needed — done: public street address replaced with `Moscow / Remote Worldwide` and the weekday work-schedule line replaced with a premium availability line (`Open for new projects — limited slots each month`) in EN/RU; booking-calendar UI copy kept as functional text

### P2 — design and conversion enhancement
- [ ] add professional founder imagery
- [ ] add stronger trust signals
- [x] strengthen FAQ and project-start guidance — done (copy layer): FAQ now opens with a new default-open `How do I start a project?` item that routes channels and spells out the path (reply in 2h → exact quote in 24h → short call locking scope, timeline, start date; written brief built together at Discovery); the rates answer now cites the public starting prices from Services (Lookdev from 10 000 ₽ / $150, FX from 15 000 ₽ / $250, Full-Cycle from 25 000 ₽ / $400); the process-control answer now matches the real five-stage approach with the included revision round (EN/RU, PR #68); visual/UX qualification of the contact flow stays in `qualify contact flow more clearly`
- [x] qualify contact flow more clearly — done (copy + light code): the `Send an email` CTA now opens a pre-filled draft — subject `Project inquiry — Epov Creative Labs` plus a mini-brief checklist (company/product, what's needed, timeline, optional budget range, links & references) ending with the 2h-reply reassurance — so inquiries arrive pre-qualified for the 24h exact quote; the plain address link in the coordinates column stays clean; EN/RU synced (PR #69); any visual qualification UI (e.g. inquiry-type selector) remains a designer task (§6)

### P3 — motion and spectacle layer
- [ ] prototype premium hero motion
- [ ] test richer section transitions
- [ ] evaluate horizontal or cinematic interactions only after MVP clarity wins

---

## 9. Separation from the portal roadmap

### Marketing site includes
- public homepage
- public project cases
- public service pages
- About / Process / Contact
- SEO / content / analytics for public acquisition
- founder positioning
- designer handoff and visual direction

### Portal includes
- client portal
- admin workflows
- inbox
- auth
- projects / approvals / internal UX
- Supabase-driven operational surfaces

If a task affects the private client experience after login, it belongs in the portal roadmap.
If it affects public positioning, acquisition, trust, or case presentation, it belongs here.

---

## 10. Definition of done for the marketing MVP

The first strong marketing-site version is done when:
- [ ] the homepage explains the offer in 5 seconds
- [ ] founder-led identity is clear and consistent
- [ ] the brand does not feel like fake big studio or generic freelancer
- [ ] 3 flagship project stories are clearly presented
- [ ] services are understandable in client-value terms
- [ ] founder trust layer is visible
- [ ] CTA feels premium and actionable
- [ ] the public site is clearly separated from portal planning
- [ ] a designer can take this file and work from it without needing portal context

---

## 11. Next concrete deliverables

### Deliverable 1
- [ ] final brand-model options
- [ ] final recommended public phrasing

### Deliverable 2
- [ ] new homepage structure
- [ ] role of each section in the funnel

### Deliverable 3
- [ ] 2–3 hero messaging directions
- [ ] founder-presence integration directions

### Deliverable 4
- [ ] designer-ready homepage brief
- [ ] section-by-section notes
- [ ] art-direction references
