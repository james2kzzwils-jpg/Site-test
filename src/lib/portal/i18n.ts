import { getPortalLocale as _getPortalLocale } from './locale';

type DeepRecord = Record<string, string | DeepRecord>;
type LocaleMap = Record<string, DeepRecord>;

const locales: LocaleMap = {
en: {
  role: { admin: 'Admin' },
  crumb: { clients: 'Clients', client: 'Client' },
  admin: {
    project: {
      label: 'Project',
      status: 'Status',
      ndaPerpetual: 'NDA (perpetual)',
      ndaUntil: 'NDA until',
      ndaNone: 'No NDA',
      published: 'Published in portfolio',
    },
  },
  progress: {
    title: 'Progress',
    help: 'Advance the project through production stages.',
    advance: 'Advance Stage',
    finish: 'Finish Project',
    confirmAdvance: 'Confirm & Advance',
    confirmAdvanceHint: 'Client-approved stage is ready to advance',
    reset: 'Reset',
    navigate: 'Go to',
  },
  meta: {
    title: 'Project Meta',
    brief: 'Brief',
    briefPlaceholder: 'Project description...',
    budget: 'Budget',
    currency: 'Currency',
    dueDate: 'Due Date',
    save: 'Save',
  },
  nda: {
    title: 'NDA Settings',
    none: 'No NDA',
    until: 'NDA expires on...',
    perpetual: 'Perpetual NDA',
    untilLabel: 'Expiration date',
    save: 'Save NDA',
  },
  portfolio: {
    title: 'Portfolio',
    help: 'Show this project on the public portfolio page.',
    toggle: 'Publish in portfolio',
    save: 'Save',
    lockedHint: 'Project must be Finished or Archived to publish',
  },
  stagesDetail: { title: 'Stages', deliverable: 'Deliverable' },
  stageState: {
    pending: 'Pending',
    in_review: 'In Review',
    changes_requested: 'Changes Requested',
    client_approved: 'Client Approved',
    approved: 'Approved',
  },
  stageMeta: {
    discovery: { label: 'Discovery Notes', placeholder: 'Creative direction...' },
    mood: { label: 'Mood Notes', placeholder: 'Color palette...' },
    animatic: { label: 'Animatic Notes', placeholder: 'Timing...' },
    lookdev: { label: 'Lookdev Notes', placeholder: 'Lighting...' },
    final: { label: 'Final Notes', placeholder: 'Render settings...' },
    archived: { label: 'Archived Notes', placeholder: '' },
  },
  stageActions: {
    adminLabel: 'Stage Actions',
    pending: { title: 'Pending', hint: 'Mark as awaiting work' },
    in_review: { title: 'In Review', hint: 'Send for client review' },
    changes_requested: { title: 'Changes', hint: 'Flag changes needed' },
    client_approved: { title: 'Approve', hint: 'Mark client-approved' },
  },
  thread: {
    title: 'Thread', studio: 'Studio', client: 'Client', round: 'Round',
    included: 'Included', billable: 'Billable', open: 'Open', closed: 'Closed',
    empty: 'No messages yet', closeRound: 'Close Round',
    uploading: 'Uploading...', uploadFailed: 'Upload failed',
    pastedClipboard: 'Pasted from clipboard', attachments: 'Attachments',
    composer: {
      placeholder: 'Write a message...', attach: 'Attach',
      send: 'Send', sending: 'Sending...',
      hint: 'Enter to send, Shift+Enter for new line',
    },
  },
},
ru: {
  role: { admin: 'Админ' },
  crumb: { clients: 'Клиенты', client: 'Клиент' },
  admin: {
    project: {
      label: 'Проект', status: 'Статус',
      ndaPerpetual: 'NDA (бессрочно)', ndaUntil: 'NDA до',
      ndaNone: 'Без NDA', published: 'Опубликовано',
    },
  },
  progress: {
    title: 'Прогресс',
    help: 'Переводите проект между этапами производства.',
    advance: 'На следующий этап',
    finish: 'Завершить проект',
    confirmAdvance: 'Подтвердить',
    confirmAdvanceHint: 'Этап одобрен клиентом',
    reset: 'Сброс',
    navigate: 'Перейти',
  },
  meta: {
    title: 'Настройки проекта', brief: 'Брифинг',
    briefPlaceholder: 'Описание проекта...',
    budget: 'Бюджет', currency: 'Валюта',
    dueDate: 'Срок сдачи', save: 'Сохранить',
  },
  nda: {
    title: 'Настройки NDA', none: 'Без NDA',
    until: 'NDA действует до...', perpetual: 'Бессрочное NDA',
    untilLabel: 'Дата окончания', save: 'Сохранить NDA',
  },
  portfolio: {
    title: 'Портфолио',
    help: 'Показывать проект в публичном портфолио.',
    toggle: 'Опубликовать', save: 'Сохранить',
    lockedHint: 'Проект должен быть завершён',
  },
  stagesDetail: { title: 'Этапы', deliverable: 'Результат' },
  stageState: {
    pending: 'Ожидание', in_review: 'На проверке',
    changes_requested: 'Требуются правки',
    client_approved: 'Одобрено', approved: 'Утверждено',
  },
  stageMeta: {
    discovery: { label: 'Заметки discovery', placeholder: 'Творческое направление...' },
    mood: { label: 'Заметки mood', placeholder: 'Цветовая палитра...' },
    animatic: { label: 'Заметки animatic', placeholder: 'Тайминг...' },
    lookdev: { label: 'Заметки lookdev', placeholder: 'Освещение...' },
    final: { label: 'Заметки final', placeholder: 'Настройки рендера...' },
    archived: { label: 'Архивные заметки', placeholder: '' },
  },
  stageActions: {
    adminLabel: 'Действия',
    pending: { title: 'В ожидание', hint: 'Отметить как ожидание' },
    in_review: { title: 'На проверку', hint: 'Отправить на проверку' },
    changes_requested: { title: 'Правки', hint: 'Запросить изменения' },
    client_approved: { title: 'Одобрить', hint: 'Отметить как одобрено' },
  },
  thread: {
    title: 'Чат', studio: 'Студия', client: 'Клиент', round: 'Раунд',
    included: 'Включено', billable: 'Оплачивается',
    open: 'Открыт', closed: 'Закрыт', empty: 'Нет сообщений',
    closeRound: 'Закрыть раунд', uploading: 'Загрузка...',
    uploadFailed: 'Ошибка', pastedClipboard: 'Вставлено из буфера',
    attachments: 'Вложения',
    composer: {
      placeholder: 'Напишите сообщение...', attach: 'Прикрепить',
      send: 'Отправить', sending: 'Отправка...',
      hint: 'Enter для отправки, Shift+Enter для новой строки',
    },
  },
},
};

function resolvePath(obj: DeepRecord, path: string): string {
const keys = path.split('.');
let current: DeepRecord | string = obj;
for (const key of keys) {
  if (typeof current === 'object' && current !== null && key in current) {
    current = current[key] as DeepRecord | string;
  } else return path;
}
return typeof current === 'string' ? current : path;
}

export function getPortalLocale(): Promise<string> {
return _getPortalLocale();
}

export function tFactory(locale: string) {
const map = locale === 'ru' ? locales.ru : locales.en;
return (key: string, vars?: Record<string, string | number>): string => {
  let val = resolvePath(map, key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      val = val.replace('${' + k + '}', String(v));
    }
  }
  return val;
};
}