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

---

## 8. Задачи для верстальщика — адаптация идей референс-скрина «Входящие без шума» к текущему дизайну (обновлено дизайн-ревьюером, 2026-07-17)

Важно: референс-скрин — это **концепт желаемого UX, а не макет для пиксельного повторения**. Задача — перенести его идеи в уже существующий дизайн портала. Тёмная тема, акцент `--accent #d4ff00`, hairline-рамки, mono-подписи и ◆-маркеры уже есть в `src/app/globals.css` и на `src/app/portal/admin/inbox/page.tsx` — токены, типографику и готовые компоненты НЕ меняем и не перекрашиваем. Существующая структура страницы (hero, 4 стат-карточки, фильтры, лента) остаётся основой; ниже — только дельта между текущим состоянием и референсом. Логику inbox (`portal_events`, read/unread, фильтры) не трогаем.

- [ ] Hero-блок inbox (`src/app/portal/admin/inbox/page.tsx`): заменить заголовок «Входящие по порталу» на более характерную формулировку в духе референса («Входящие без шума.», одно слово акцентным цветом), сохранив текущие font-display, размеры и сетку; рядом с «Отметить всё как прочитанное» добавить CTA «Добавить клиента» (ведёт на существующий флоу создания клиента) в текущем стиле кнопок (hairline + mono, акцент на hover).
- [ ] Сделать 4 стат-карточки кликабельными фильтрами, как на референсе: каждая карточка ведёт на свой `?filter=`, а акцентная рамка подсвечивает карточку активного фильтра (сейчас `tone: 'accent'` жёстко задан у «Требует внимания» в `summaryCard(...)`).
- [ ] Карточки событий в ленте: добавить автора события (готовый `actorLabel(...)`) mono-подписью в правом верхнем углу карточки, как на референсе; остальную разметку карточки (бейджи, заголовок, подсказка, кнопки) не менять.
- [ ] Строка статуса над лентой: добавить mono-индикатор вида «◆ Обновлено только что» в существующем стиле подписей; контрол «Настроить вид» со скрина пока не верстать — под него нет функциональности.
- [ ] Постоянная навигация админки: идею сайдбара со скрина адаптировать к текущему каркасу: добавить в `src/app/portal/_shared/PortalHeader.tsx` (или рядом с `Breadcrumb`) ссылки «Обзор / Клиенты / Входящие» с акцентным счётчиком «требует внимания» у «Входящих». Отдельную левую колонку не вводить, если она ломает текущую сетку портала.
- [ ] Блок «В работе»: компактный список активных проектов (название, этап, процент + тонкий акцентный прогресс-бар) со ссылкой «Открыть проекты →»; на широких экранах — правой колонкой рядом с лентой, на узких — под лентой. Стиль — существующие hairline-карточки и mono-подписи.
- [ ] Мини-календарь «Навигатор» со скрина — опционально: верстать только если у него появляется реальная функция (например, подсветка дней с событиями ленты); чисто декоративный календарь не добавлять.
- [ ] Общие ограничения: не вводить новые цвета, шрифты и токены — палитра и типографика текущего дизайна уже соответствуют референсу; все новые элементы собирать из уже существующих паттернов (hairline-рамки, mono-лейблы, акцент на hover, ◆-маркеры).
