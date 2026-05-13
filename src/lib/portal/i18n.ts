// Portal i18n. Server-component-friendly:
//   - the chosen locale lives in a cookie ('portal-locale'), set via
//     the LocaleSwitcher server action.
//   - if no cookie, fall back to accept-language; ru-* → RU, else EN.
//   - technical pipeline terms (Discovery / Mood / Animatic / Lookdev /
//     Final / NDA / Magic Link) deliberately stay in latin in both
//     locales — they double as stage codenames.

import { cookies, headers } from 'next/headers';

export type PortalLocale = 'en' | 'ru';

export const PORTAL_LOCALES: PortalLocale[] = ['en', 'ru'];
const COOKIE_NAME = 'portal-locale';

export async function getPortalLocale(): Promise<PortalLocale> {
  const c = await cookies();
  const fromCookie = c.get(COOKIE_NAME)?.value;
  if (fromCookie === 'en' || fromCookie === 'ru') return fromCookie;

  const h = await headers();
  const accept = h.get('accept-language') ?? '';
  if (/\bru\b/i.test(accept) || accept.toLowerCase().startsWith('ru')) {
    return 'ru';
  }
  return 'en';
}

export async function setPortalLocaleCookie(locale: PortalLocale) {
  const c = await cookies();
  c.set(COOKIE_NAME, locale, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
}

// Translation dictionary. Every UI string used in portal pages must
// have both EN and RU entries so we never accidentally fall back to a
// key.
type Dict = Record<string, { en: string; ru: string }>;

const DICT = {
  // Header / nav
  'header.brand': { en: 'Epov Portal', ru: 'Epov Portal' },
  'header.signout': { en: 'Sign out', ru: 'Выйти' },

  // Roles
  'role.admin': { en: 'Admin', ru: 'Админ' },
  'role.client': { en: 'Client', ru: 'Клиент' },

  // Breadcrumb labels
  'crumb.clients': { en: 'Clients', ru: 'Клиенты' },
  'crumb.client': { en: 'Client', ru: 'Клиент' },
  'crumb.newClient': { en: 'New client', ru: 'Новый клиент' },
  'crumb.myProjects': { en: 'My projects', ru: 'Мои проекты' },

  // Admin clients list
  'admin.clients.title': { en: 'Clients', ru: 'Клиенты' },
  'admin.clients.subtitle': {
    en: 'Every client and lead Epov is collaborating with.',
    ru: 'Все клиенты и лиды, с которыми работает Epov.',
  },
  'admin.clients.new': { en: 'Add client', ru: 'Добавить клиента' },
  'admin.clients.empty': {
    en: 'No clients yet. Add your first one.',
    ru: 'Пока нет клиентов. Добавь первого.',
  },

  // Admin new client
  'admin.newClient.title': {
    en: 'Invite a new client',
    ru: 'Пригласить нового клиента',
  },
  'admin.newClient.subtitle': {
    en: 'Create a client record and email a magic link to their first contact.',
    ru: 'Создай карточку клиента и отправь magic link на email его контакта.',
  },
  'admin.newClient.name': { en: 'Client name', ru: 'Название клиента' },
  'admin.newClient.company': { en: 'Company', ru: 'Компания' },
  'admin.newClient.contactEmail': {
    en: 'Contact email',
    ru: 'Email контакта',
  },
  'admin.newClient.notes': { en: 'Notes', ru: 'Заметки' },
  'admin.newClient.submit': {
    en: 'Create & send magic link',
    ru: 'Создать и отправить magic link',
  },

  // Admin client detail
  'admin.client.label': { en: 'Client', ru: 'Клиент' },
  'admin.client.members': { en: 'Members', ru: 'Участники' },
  'admin.client.inviteAnother': {
    en: 'Invite another email',
    ru: 'Пригласить ещё один email',
  },
  'admin.client.inviteEmail': { en: 'Email', ru: 'Email' },
  'admin.client.invite': {
    en: 'Send invite',
    ru: 'Отправить приглашение',
  },
  'admin.client.resend': {
    en: 'Send magic link',
    ru: 'Отправить ссылку',
  },
  'admin.client.resentOk': {
    en: 'Magic link sent',
    ru: 'Ссылка отправлена',
  },
  'admin.client.projects': { en: 'Projects', ru: 'Проекты' },
  'admin.client.projectsEmpty': {
    en: 'No projects yet. Create one below.',
    ru: 'Проектов пока нет. Создай новый ниже.',
  },
  'admin.client.newProject': { en: 'New project', ru: 'Новый проект' },
  'admin.client.newProject.title': {
    en: 'Project title',
    ru: 'Название проекта',
  },
  'admin.client.newProject.brief': {
    en: 'Brief (optional)',
    ru: 'Бриф (опционально)',
  },
  'admin.client.newProject.create': {
    en: 'Create project',
    ru: 'Создать проект',
  },

  // Admin project detail
  'admin.project.label': { en: 'Project', ru: 'Проект' },
  'admin.project.status': { en: 'status', ru: 'статус' },
  'admin.project.due': { en: 'due', ru: 'срок' },
  'admin.project.ndaUntil': { en: 'NDA until', ru: 'NDA до' },
  'admin.project.ndaPerpetual': {
    en: 'NDA perpetual',
    ru: 'NDA бессрочно',
  },
  'admin.project.ndaNone': { en: 'no NDA', ru: 'без NDA' },
  'admin.project.published': { en: 'published', ru: 'опубликован' },

  // Progress controls
  'progress.title': {
    en: 'Progress controls',
    ru: 'Управление прогрессом',
  },
  'progress.help': {
    en: 'Advance the project to the next stage once the current deliverable is signed off. Approved stages stay locked unless you reset the whole flow.',
    ru: 'Переводи проект на следующую стадию, когда текущий результат утверждён. Утверждённые стадии не редактируются — только полным сбросом.',
  },
  'progress.advance': {
    en: 'Approve & advance →',
    ru: 'Утвердить и далее →',
  },
  'progress.finish': {
    en: 'Finish project →',
    ru: 'Завершить проект →',
  },
  'progress.archived': { en: 'Archived', ru: 'В архиве' },
  'progress.reset': {
    en: 'Reset to discovery',
    ru: 'Сбросить в Discovery',
  },

  // Stage states
  'stageState.pending': { en: 'pending', ru: 'ожидает' },
  'stageState.in_review': { en: 'in review', ru: 'на ревью' },
  'stageState.changes_requested': {
    en: 'changes',
    ru: 'правки',
  },
  'stageState.approved': { en: 'approved', ru: 'утверждено' },
  'stageState.current': { en: 'current', ru: 'текущая' },

  // Stage action buttons
  'stageAction.pending': { en: 'Mark pending', ru: 'В ожидание' },
  'stageAction.in_review': { en: 'Send to review', ru: 'На ревью' },
  'stageAction.changes_requested': {
    en: 'Request changes',
    ru: 'Запросить правки',
  },

  // Project meta
  'meta.title': { en: 'Project meta', ru: 'Метаданные проекта' },
  'meta.brief': { en: 'Brief / scope', ru: 'Бриф / задача' },
  'meta.briefPlaceholder': {
    en: 'Goals, audience, scope, deadline notes…',
    ru: 'Цели, аудитория, объём, дедлайн…',
  },
  'meta.budget': { en: 'Budget', ru: 'Бюджет' },
  'meta.currency': { en: 'Currency', ru: 'Валюта' },
  'meta.dueDate': { en: 'Due date', ru: 'Срок' },
  'meta.save': { en: 'Save meta', ru: 'Сохранить' },

  // NDA
  'nda.title': { en: 'NDA', ru: 'NDA' },
  'nda.none': {
    en: 'No NDA — public-safe',
    ru: 'Без NDA — можно публиковать',
  },
  'nda.until': {
    en: 'Active until date',
    ru: 'До конкретной даты',
  },
  'nda.perpetual': { en: 'Perpetual NDA', ru: 'Бессрочный NDA' },
  'nda.untilLabel': {
    en: 'Until date (if active)',
    ru: 'Дата окончания (если активен)',
  },
  'nda.save': { en: 'Save NDA', ru: 'Сохранить NDA' },

  // Portfolio
  'portfolio.title': { en: 'Portfolio', ru: 'Портфолио' },
  'portfolio.help': {
    en: 'Flag this project to appear in the public Works section. The actual sync to the marketing site lands once cover images are wired up.',
    ru: 'Отметь проект, чтобы он появился в публичных Works. Сама синхронизация на сайт включится, когда подключим обложки.',
  },
  'portfolio.toggle': {
    en: 'Publish to portfolio',
    ru: 'Опубликовать в портфолио',
  },
  'portfolio.save': {
    en: 'Save publish flag',
    ru: 'Сохранить флаг',
  },

  // Stage detail section
  'stagesDetail.title': { en: 'Stages detail', ru: 'Детали этапов' },
  'stagesDetail.deliverable': {
    en: '→ Deliverable',
    ru: '→ Результат',
  },
  'stages.youGet': { en: '→ You get', ru: '→ Получаешь' },
  'stages.title': { en: 'Stages', ru: 'Этапы' },
  'stages.b2hint': {
    en: 'Round comments, file uploads and paste-from-clipboard ship in Wave B2 next.',
    ru: 'Раунды правок, загрузка файлов и вставка из буфера — в следующем релизе.',
  },
  'stages.b2hintClient': {
    en: 'Comment threads and file uploads land here next.',
    ru: 'Тред комментариев и загрузка файлов появятся здесь дальше.',
  },

  // Per-stage thread (rounds + comments + attachments)
  'thread.studio': { en: 'Studio', ru: 'Студия' },
  'thread.client': { en: 'Client', ru: 'Клиент' },
  'thread.round': { en: 'Round', ru: 'Раунд' },
  'thread.included': { en: 'included', ru: 'включён' },
  'thread.billable': { en: 'billable', ru: 'оплачивается' },
  'thread.open': { en: 'open', ru: 'открыт' },
  'thread.closed': { en: 'closed', ru: 'закрыт' },
  'thread.empty': {
    en: 'No notes on this stage yet.',
    ru: 'Заметок по этой стадии ещё нет.',
  },
  'thread.closeRound': { en: 'Close round', ru: 'Закрыть раунд' },
  'thread.composer.placeholder': {
    en: 'Notes, requests, edits…',
    ru: 'Заметки, правки, вопросы…',
  },
  'thread.composer.attach': {
    en: 'Attach files',
    ru: 'Прикрепить файлы',
  },
  'thread.composer.send': { en: 'Send', ru: 'Отправить' },
  'thread.composer.sending': { en: 'Sending…', ru: 'Отправка…' },
  'thread.composer.hint': {
    en: 'Drag & drop · Paste from clipboard · 25 MB max',
    ru: 'Drag-n-drop · Вставка из буфера · до 25 МБ',
  },
  'thread.uploading': { en: 'Uploading…', ru: 'Загрузка…' },
  'thread.uploadFailed': { en: 'Upload failed', ru: 'Ошибка загрузки' },
  'thread.attachments': { en: 'Attachment', ru: 'Вложение' },
  'thread.pastedClipboard': {
    en: 'Pasted from clipboard',
    ru: 'Вставлено из буфера',
  },
  'thread.title': { en: 'Conversation', ru: 'Обсуждение' },

  // Client list / projects
  'client.title': { en: 'Your projects', ru: 'Твои проекты' },
  'client.subtitle': {
    en: 'Every active engagement Epov is running with you. Open one to follow progress, leave notes and approve stages.',
    ru: 'Все активные проекты Epov с тобой. Открой проект, чтобы следить за прогрессом, оставлять заметки и утверждать стадии.',
  },
  'client.empty': {
    en: "You don't have any active projects yet. We'll send an invite when one starts.",
    ru: 'Активных проектов пока нет. Мы пришлём приглашение, когда стартует первый.',
  },

  // Common
  'common.open': { en: 'Open', ru: 'Открыть' },
  'common.cancel': { en: 'Cancel', ru: 'Отмена' },
  'common.save': { en: 'Save', ru: 'Сохранить' },
  'common.email': { en: 'Email', ru: 'Email' },
} as const satisfies Dict;

export type PortalKey = keyof typeof DICT;

export function t(locale: PortalLocale, key: PortalKey): string {
  return DICT[key][locale];
}

// Convenience: returns a curried translator bound to the current locale.
export function tFactory(locale: PortalLocale) {
  return (key: PortalKey) => DICT[key][locale];
}
