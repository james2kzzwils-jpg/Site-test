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
- [ ] rewrite About as a high-trust founder block
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
- [ ] elevate 3 flagship project directions
- [ ] use a clearer triad such as `Scale / Luxury / Innovation`
- [ ] ensure each featured project communicates challenge, role, process, and result
- [ ] support designer with clear visual hierarchy for case presentation
- [ ] preserve the rest of the portfolio as secondary depth

### Workstream E — services repackaging
Goal: explain what can be hired and why it matters.

Tasks:
- [ ] rewrite services around outcomes, not only tools
- [ ] decide the 3 anchor service lines
- [ ] clarify brand-facing value and studio-facing value separately
- [ ] review whether public minimum pricing supports premium positioning
- [ ] decide whether to keep pricing, soften pricing, or move to estimate-based language

### Workstream F — process / about / CTA refinement
Goal: increase trust and make starting a project easier.

Tasks:
- [ ] simplify process if it feels too long for the homepage
- [ ] replace abstract percentage signals with clearer deliverables if needed
- [ ] make About shorter, stronger, and more founder-led
- [ ] turn Contact into a stronger conversion block
- [ ] explain what happens after contact
- [ ] clarify which channel is best for which type of inquiry

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
- [ ] define 3 flagship work stories
- [ ] rewrite services around outcomes
- [ ] rewrite About with founder presence
- [ ] strengthen final CTA

### P1 — premium consistency fixes
- [x] fix brand naming inconsistencies — done: `Epov Creative Lab's` → `Epov Creative Labs` across EN/RU i18n
- [x] fix weak English phrasing — done: unified `Showreel` spelling, US spelling consistency (program, recognizable), clearer revision-rounds note, natural FAQ wording (rates, staying in control), `neural references` → `AI-generated references`; hero i18n block untouched (live hero copy is in Hero.tsx)
- [ ] review public prices for premium fit
- [ ] remove over-literal schedule/address language if not needed

### P2 — design and conversion enhancement
- [ ] add professional founder imagery
- [ ] add stronger trust signals
- [ ] strengthen FAQ and project-start guidance
- [ ] qualify contact flow more clearly

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
