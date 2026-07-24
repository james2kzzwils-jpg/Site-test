# Marketing site roadmap

Updated: 2026-07-24
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
- [ ] add a "Open for collaborations" / availability signal on the homepage near the showreel CTA (so the visitor instantly sees the status)

### Workstream B — founder presence and trust
Goal: show the person behind the work without collapsing into a generic freelancer image.

Tasks:
- [ ] define founder-presence visual strategy
- [ ] add a professional portrait / controlled founder visual language
- [ ] decide hero founder treatment: direct portrait, side profile, silhouette, or integrated background presence
- [ ] rewrite About as a high-trust founder block
- [ ] add concise trust signals: experience, education, specialism, geography, client context
- [ ] remove low-premium trust signals if they are too tactical or too literal
- [ ] review footer address: decide whether it implies "visit possible"; either remove full street address or replace with a clearer "Moscow / Remote" style line

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
- [ ] increase "movement" in the first screen by featuring a curated video strip (pull from existing case videos) — reference: https://locomotive.ca/en

### Workstream D — featured work strategy
Goal: make the strongest projects work as proof, not just gallery entries.

Tasks:
- [ ] elevate 3 flagship project directions
- [ ] use a clearer triad such as `Scale / Luxury / Innovation`
- [ ] ensure each featured project communicates challenge, role, process, and result
- [ ] support designer with clear visual hierarchy for case presentation
- [ ] preserve the rest of the portfolio as secondary depth
- [ ] quality-pass the Motion cases: unify art direction, fix cropping, remove questionable frames, keep only the strongest proof (plus real-world application shots where possible)

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
- [ ] fix Calendly availability: past dates must not appear selectable; ensure timezone handling and slot generation is correct

### Workstream G — visual system and motion polish
Goal: preserve premium art direction without sacrificing clarity or performance.

Tasks:
- [ ] define visual hierarchy for founder + CGI coexistence
- [ ] define still image fallback strategy
- [ ] define mobile-safe motion strategy
- [ ] only then prototype premium motion enhancements
- [ ] showreel modal desktop layout: ensure the desktop view is not using the mobile layout (increase viewport usage so details read)

### Workstream H — case pages (UX, media, proof)
Goal: make case pages read like a premium editorial story with clear proof.

Reference: https://www.pentagram.com/work/porsche?rel=discipline&rel-id=25

Tasks:
- [ ] move the strongest motion/video proof to the top of each case (above the fold)
- [ ] increase image quality where it looks soft on desktop (audit Next/Image sizes, srcset, compression, and original assets)
- [ ] remove QR codes unless they are strictly necessary; if a QR encodes a URL, add the URL as an explicit clickable link рядом с QR (or remove QR and keep the link)
- [ ] for each case: reduce gallery noise (fewer but stronger frames), ensure crop/ratio consistency, and highlight "real-world usage" frames

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
- case-page editorial layout and media rhythm (video-first / gallery reduction)

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
- [ ] add proof / trust strip after Hero
- [ ] re-sequence homepage blocks
- [ ] define 3 flagship work stories
- [ ] rewrite services around outcomes
- [ ] rewrite About with founder presence
- [ ] strengthen final CTA

### P1 — premium consistency fixes
- [x] fix brand naming inconsistencies — done: `Epov Creative Lab's` → `Epov Creative Labs` across EN/RU i18n
- [ ] fix weak English phrasing
- [ ] review public prices for premium fit
- [ ] remove over-literal schedule/address language if not needed

### P1.5 — media + UX fixes (from owner review, 2026-07-24)
- [ ] motion-cases quality pass (cropping, questionable frames, consistency)
- [ ] Metalplace: QR → remove or add a direct clickable link next to it
- [ ] showreel desktop layout: not mobile-sized on desktop
- [ ] image quality audit: improve desktop sharpness (srcset/sizes/compression/original assets)
- [ ] calendly: fix past days showing as available
- [ ] "Show all" behavior: verify it matches the label (no misleading partial expansion)

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

---

## 12. Задачи от дизайн-ревьюера — видеофайл шоурила (добавлено 2026-07-17)

Контекст: анимация появления шоурила «из частиц» (панель появляется справа — в пустой половине хиро-композиции), мгновенный muted-автостарт, кнопка вкл/выкл звука и акцентный прогресс-бар уже реализованы в коде (`src/components/ShowreelModal.tsx`, `Scene3D.tsx`, `Hero.tsx`). Остались задачи по самому видеофайлу — без них шоурил грузится медленно:

- [ ] Пережать `public/showreel/Andrey Epov Showreel.mp4` (сейчас **45,5 МБ**) до ~6–10 МБ: H.264, 1080×1920, CRF 22–24, `-movflags +faststart`, аудио AAC 128k. Пример: `ffmpeg -i "Andrey Epov Showreel.mp4" -c:v libx264 -crf 23 -preset slow -vf scale=1080:-2 -movflags +faststart -c:a aac -b:a 128k showreel.mp4`
- [ ] Положить результат как `public/showreel/showreel.mp4`, обновить константу `SHOWREEL_SRC` в `src/components/ShowreelModal.tsx` (там стоит TODO-комментарий) и удалить старый 45-МБ файл из репозитория.
- [ ] Экспортировать постер-кадр (яркий кадр рила, JPEG ~100–150 КБ, 1080×1920) как `public/showreel/poster.jpg` и добавить `poster="/showreel/poster.jpg"` на `<video>` в `ShowreelModal.tsx`, чтобы красивый кадр был виден мгновенно ещё до загрузки видео.
- [ ] Проверить на деплое: клик по «Watch Showreel» → частицы стягиваются вправо и панель «рождается» из них в пустой правой части экрана; видео стартует сразу без звука; кнопка звука включает аудио; Esc / крестик / клик по фону закрывают, и частицы возвращаются в обычный режим.

---

## 13. Отметка о проверке — дизайн-ревьюер (2026-07-17, ~17:00 CET)

Проверены новые коммиты с прошлой проверки: `731edc9` + `7e5be77` (футер: CSS-глоу в акцентной палитре вместо растрового фона, удалён `footer-bg.webp`), `f3b9b75` (унификация бренд-нейминга и исправление «Perfume»), `aa8cbe3` + `55a648c9` (шоурил «из частиц», панель справа) и docs-коммиты по роадмапам.

- Замены «Epov Creative Lab's» → «Epov Creative Labs» и «Parfume. Simulation» → «Perfume. Simulation» подтверждены в `src/i18n/en.json` и `src/i18n/ru.json`; поиск по репозиторию не находит оставшихся вхождений «Lab's» / «Parfume». Соответствующие пункты Workstream A и P1 отмечены выполненными.
- Футер и шоурил на уровне кода соответствуют плану (только существующая акцентная палитра, без новых цветов; primary CTA — Showreel). Пиксельная сверка с макетом Figma в этот запуск не выполнена: макет открыть не удалось — расхождения не фиксируются без оснований.
- Задачи по видеофайлу шоурила из раздела 12 остаются открытыми (видео всё ещё 45,5 МБ, постер не добавлен).

---

## 14. Отметка о проверке — дизайн-ревьюер (2026-07-17, ~18:00 CET)

Проверены новые коммиты с прошлой проверки (после `8bbbae2`): `8a35288` (CTA хиро перенесены в левую колонку; эллиптическая halo-зона вытеснения частиц вокруг панели рила в `Scene3D.tsx`), `8f9a9fc` → `f063667` → `4cedf7c` → `814e56a` (итерации по локализованному заголовку хиро и стилям CTA; финальное состояние: RU-заголовок «CGI и моушн-дизайн / для брендов и продуктов» с иерархией размеров, EN сохраняет «Giving Form to the Invisible»; кнопки выровнены по габаритам через inline-grid, стили раздельные), `8000e16` (поле частиц / буквы A-E смещены в пустую правую половину хиро — `BASE_FOCUS_X`; поднят ряд kicker). Все изменения — в `src/components/Hero.tsx` и `src/components/Scene3D.tsx`.

- **Соответствие плану — CTA:** решение из раздела 4 реализовано корректно: primary «Watch Showreel» в акцентном стиле (accent border + glow), secondary «Start a Project» в нейтральном, одинаковые размеры; selected works достигается скроллом (нижний scroll cue), отдельной кнопки в хиро нет. Пункт Workstream A «define one main CTA and one secondary CTA» отмечен выполненным (решение зафиксировано в разделе 4 и реализовано в коде).
- **RU-заголовок:** ясный безпафосный заголовок для RU работает на цель Workstream A «объяснить оффер за 5 секунд» и на bilingual capability из раздела 2; EN-строка остаётся эмоциональной осью с поясняющим founder-led сабтайтлом — противоречий с планом нет.
- **Наблюдение (не задача по вёрстке):** новые коммиты продолжают развивать сложную систему частиц хиро (буквы из частиц, halo-зона) — по разделу 4 это не приоритет первой фазы; задачи P0/P1 (proof-strip, flagship works, About, услуги) остаются открытыми. Рекомендуется после текущей полировки хиро вернуться к P1.
- **Figma:** макет открыть в этот запуск снова не удалось — подключённые инструменты Figma позволяют читать только FigJam-доски, а макет является design-файлом. Пиксельная сверка не выполнена; расхождения с макетом не фиксируются без оснований.
- Задачи по видеофайлу шоурила из раздела 12 остаются открытыми — новые коммиты их не затрагивали.

---

## 15. Отметка о проверке — дизайн-ревьюер (2026-07-17, ~19:00 CET)

Проверены новые коммиты с прошлой проверки (после `8a5358b`): `f9f5166` + `6068710` (Scene3D: моушн-изинг quintic in-out с контрастом скоростей для морфов shell→A→E и разреженный слой комет с затухающими хвостами; фикс через 2 минуты вернул lookup морф-таргетов, потерянный при переработке изинга — в актуальном коде переменные `from`/`to` на месте), `7a917be` + `45e1312` (новый декоративный слой `src/components/AmbientMoments.tsx`, подключён в `HomePage.tsx`: постоянное поле пыли с глубинными слоями и mouse-parallax, редкие микро-события — кометы, прыгающий акцентный шар, распадающийся ◆; слой проявляется только после скролла ниже хиро), `4718874` (планета частиц и панель шоурила привязаны к общей горизонтальной оси `FOCUS_FRACTION = 0.267` ≈ 77% ширины вьюпорта — под чипом «CG Generalist»; ось считается от живого вьюпорта и синхронизирована с отступом панели в `ShowreelModal.tsx`).

- **Качество реализации:** в `AmbientMoments.tsx` корректно обработан `prefers-reduced-motion` (слой полностью отключается), канвас `pointer-events-none` + `aria-hidden`, DPR ограничен 1.5, слушатели снимаются в cleanup; палитра — только брендовые cream/lime на низкой альфе. Привязка поля частиц и панели рила к одной адаптивной оси — согласованное решение, панель больше не «уедет» от планеты на разных ширинах экрана.
- **Figma:** макет открыть в этот запуск снова не удалось — подключённые инструменты Figma читают только FigJam-доски, а макет является design-файлом. Пиксельная сверка не выполнена; расхождения с макетом не фиксируются без оснований. Слой AmbientMoments в плане и (насколько известно) в макете не описан — стоит согласовать его с дизайнером.
- **Соответствие плану:** все пять коммитов — работа уровня P3 «motion and spectacle layer» (разделы 4 и 8). Наблюдение из отметок 13–14 сохраняет силу: задачи P0/P1 (позиционирование первого экрана, proof-strip, flagship works, услуги через outcomes, About, финальный CTA) остаются открытыми — рекомендуется вернуться к ним после текущей полировки.
- Задачи по видеофайлу шоурила из раздела 12 остаются открытыми — TODO в `ShowreelModal.tsx` на месте, видео не пережато, постер не добавлен.

Новые задачи для верстальщика (AmbientMoments):

- [ ] `src/components/AmbientMoments.tsx`: слой смонтирован как `fixed inset-0 z-[30]` ПОВЕРХ контента страницы, хотя по замыслу (комментарий компонента) это «пространство за стеклом». Пыль на альфе 0.05–0.19 малозаметна, но акцентные события рисуются прямо поверх текста секций: lime-шар — альфа до 0.65 с glow (`shadowBlur: 10`), фрагменты ◆ — до 0.45. Убрать конфликт с читаемостью premium-типографики: либо приглушить события до уровня пыли, либо не спавнить их в зоне текстовых колонок, либо опустить слой под контент (z-index ниже секций) — вариант согласовать с макетом Figma.
- [ ] `src/components/AmbientMoments.tsx`: rAF-цикл работает постоянно, в том числе на первом экране, где слой невидим (`layerAlpha → 0`), — `clearRect` и прокачка кадров идут параллельно тяжёлой WebGL-сцене хиро. Останавливать цикл полностью, пока `scrollY < 0.6 × innerHeight` (перезапуск по scroll-порогу или IntersectionObserver), чтобы декоративный слой не тратил бюджет кадра на хиро.

---

## 16. Отметка о проверке — дизайн-ревьюер (2026-07-18, ~00:00 CET)

Новых коммитов в `redesignLinda` с прошлой проверки нет (вершина ветки — сама отметка №15). Проверены новые пуши в PR-ветках, появившиеся после прошлой проверки: PR #68 `feat/faq-project-start` (`7e18501`), PR #69 `feat/qualify-contact` (`e0cdebf`), PR #70 `feat/inspiration-effects` (`321ce92`, база — `redesignLinda`), PR #71 `feat/deliverable-signals` (`dd67914`), PR #72 `fix/hero-i18n-copy` (`6bee664`).

- **PR #68 (FAQ):** новый default-open пункт «How do I start a project?», публичные стартовые цены в ответе про стоимость, пять реальных этапов и включённый раунд правок в ответе про контроль процесса. Соответствует P2 «strengthen FAQ and project-start guidance»; копия согласована с обещаниями Contact (ответ за 2 ч → точная оценка за 24 ч → короткий созвон), цены совпадают с публичными в Services; EN/RU синхронны. Расхождений нет.
- **PR #69 (Contact):** CTA «Send an email» открывает предзаполненный черновик (тема + мини-бриф: компания/продукт, что нужно, сроки, бюджетная вилка, ссылки), обычная ссылка-адрес в колонке координат оставлена чистой. Соответствует P2 «qualify contact flow more clearly» на уровне копии; кодирование subject/body через `encodeURIComponent` корректно. Расхождений нет.
- **PR #71 (About):** абстрактные процентные бары «Alignment / Result» заменены конкретным блоком «→ You Get / На выходе» с реальными деливераблами этапов — и на десктопе, и в мобильной версии. Прямое выполнение пункта Workstream F «replace abstract percentage signals with clearer deliverables»; вёрстка аккуратная, деливерабл-строки берутся из существующих локалей. Расхождений нет.
- **PR #72 (копия хиро):** founder-led копия хиро перенесена из локальных тернарников `Hero.tsx` в `en/ru.json` (`t.hero.*`) — строки идентичны прежним, визуальных изменений нет; устранено противоречие между устаревшим i18n-блоком hero («Portfolio — 2026», tool-led сабтайтл) и живой копией (Workstream A «remove weak or contradictory copy»). Расхождений нет.
- **PR #70 (шесть «inspiration»-эффектов):** cursor swirl и scroll-дисперсия в `Scene3D.tsx` реализованы аккуратно (оба эффекта затухают при открытом риле и дисперсии), `Magnetic.tsx` и `ScrambleText.tsx` уважают `prefers-reduced-motion`, magnetic-цикл самозатухает после ухода курсора. Два конкретных замечания вынесены в задачи ниже. По плану всё это снова уровень P3 «motion and spectacle layer»; декоративные решения (зерно, scramble, magnetic, floating preview) в плане и макете не описаны — согласовать с дизайнером.
- **Наблюдение:** цепочка PR #58–#72 закрывает значительную часть P0/P1 на уровне копии и структуры (proof-strip, resequence, услуги через outcomes, founder-About, flagship works, финальный CTA, FAQ, контакт) и ждёт мержа в `redesignNotion`. PR #58–#67 созданы до прошлой проверки и отметками 13–15 не покрывались — пройду по ним отдельным ревью (либо после мержа цепочки в базовую ветку).
- **Figma:** макет открыть снова не удалось — подключённые инструменты Figma читают только FigJam-доски, а макет является design-файлом. Пиксельная сверка не выполнена; расхождения с макетом не фиксируются без оснований.
- Задачи по видеофайлу шоурила (раздел 12) и по AmbientMoments (раздел 15) остаются открытыми — новые пуши их не затрагивали.

Новые задачи для верстальщика (PR #70, ветка `feat/inspiration-effects`):

- [ ] `src/components/Works.tsx`: rAF-цикл плавающего превью обложек запускается при монтировании секции и не останавливается никогда — он крутится и на мобильных (где превью скрыто `hidden lg:block`), и когда ни одна карточка не наведена, и при `prefers-reduced-motion` (в отличие от `Magnetic`/`ScrambleText`, которые его уважают). Запускать цикл только на десктопе и только пока превью видимо или доводится до курсора, останавливать после затухания — по образцу самозатухающего цикла в `Magnetic.tsx`.
- [ ] `src/app/globals.css` (`.grain-overlay`): слой зерна растянут `inset: -100%` — это фиксированный анимируемый слой ~9× площади вьюпорта. Амплитуда сдвигов в `grain-shift` не превышает ±3%, поэтому достаточно `inset: -5%` (заметно меньше памяти на композитинг, важно для мобильных). Заодно проверить стек слоёв: `z-index: 60` кладёт зерно поверх панели шоурила и остального UI — согласовать с макетом/дизайнером, должно ли зерно лежать поверх модальных слоёв, или опустить его ниже.
