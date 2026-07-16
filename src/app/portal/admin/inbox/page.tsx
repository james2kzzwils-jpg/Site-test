import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '@/app/portal/_shared/PortalHeader';
import Breadcrumb from '@/app/portal/_shared/Breadcrumb';
import {
  getPortalLocale,
  tFactory,
  type PortalLocale,
} from '@/lib/portal/i18n';
import {
  loadAdminInbox,
  type PortalInboxItem,
} from '@/lib/portal/inbox';
import {
  markAllInboxReadAction,
  setInboxEventReadStateAction,
} from './actions';

interface AdminInboxSearch {
  filter?: string;
  clientId?: string;
  projectId?: string;
}

type InboxFilter = 'all' | 'attention' | 'unread' | 'approvals';

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === 'string' ? value : null;
}

function stageLabel(item: PortalInboxItem) {
  return (
    payloadString(item.payload, 'stage_kind') ??
    payloadString(item.payload, 'to_stage') ??
    payloadString(item.payload, 'from_stage')
  );
}

function formatDate(locale: PortalLocale, value: string) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function actorLabel(item: PortalInboxItem, locale: PortalLocale) {
  if (item.actorRole === 'admin') return locale === 'ru' ? 'Студия' : 'Studio';
  if (item.actorName) return item.actorName;
  if (item.actorEmail) return item.actorEmail;
  return locale === 'ru' ? 'Участник' : 'Member';
}

function isActionRequired(item: PortalInboxItem) {
  const decision = payloadString(item.payload, 'decision');
  if (item.type === 'approval_requested') return true;
  if (item.type === 'approval_decided' && decision === 'changes_requested') {
    return true;
  }
  if (
    (item.type === 'comment_added' || item.type === 'file_uploaded') &&
    item.actorRole === 'client'
  ) {
    return true;
  }
  return false;
}

function isPendingApproval(item: PortalInboxItem) {
  const decision = payloadString(item.payload, 'decision');
  return (
    item.type === 'approval_requested' ||
    (item.type === 'approval_decided' && decision === 'approved')
  );
}

function titleFor(item: PortalInboxItem, locale: PortalLocale) {
  const stage = stageLabel(item);
  const decision = payloadString(item.payload, 'decision');

  switch (item.type) {
    case 'approval_requested':
      return locale === 'ru'
        ? `Этап ${stage ?? 'текущий'} отправлен на ревью`
        : `${stage ?? 'Current stage'} sent for review`;
    case 'approval_decided':
      if (decision === 'changes_requested') {
        return locale === 'ru'
          ? `Клиент запросил правки по ${stage ?? 'этапу'}`
          : `Client requested changes on ${stage ?? 'the stage'}`;
      }
      return locale === 'ru'
        ? `Клиент утвердил ${stage ?? 'этап'}`
        : `Client approved ${stage ?? 'the stage'}`;
    case 'comment_added':
      return item.actorRole === 'client'
        ? locale === 'ru'
          ? 'Новый комментарий от клиента'
          : 'New client comment'
        : locale === 'ru'
          ? 'Новый комментарий от студии'
          : 'New studio comment';
    case 'file_uploaded':
      return item.actorRole === 'client'
        ? locale === 'ru'
          ? 'Клиент загрузил файл'
          : 'Client uploaded a file'
        : locale === 'ru'
          ? 'Студия загрузила файл'
          : 'Studio uploaded a file';
    case 'project_created':
      return locale === 'ru' ? 'Создан новый проект' : 'New project created';
    case 'stage_changed':
      return locale === 'ru'
        ? `Этап переведён в ${payloadString(item.payload, 'to_stage') ?? 'новый статус'}`
        : `Stage moved to ${payloadString(item.payload, 'to_stage') ?? 'a new status'}`;
    case 'nda_signed':
      return locale === 'ru' ? 'Подписан NDA' : 'NDA signed';
    default:
      return locale === 'ru' ? 'Новое событие в портале' : 'New portal activity';
  }
}

function hintFor(item: PortalInboxItem, locale: PortalLocale) {
  const project =
    item.projectTitle ??
    (locale === 'ru' ? 'проект без названия' : 'untitled project');
  const client = item.clientName ?? (locale === 'ru' ? 'клиент' : 'client');
  const actor = actorLabel(item, locale);
  const filename = payloadString(item.payload, 'filename');

  switch (item.type) {
    case 'approval_requested':
      return locale === 'ru'
        ? `${project} · ${client} · проверь результат и при необходимости переведи проект дальше.`
        : `${project} · ${client} · review the deliverable and move the project forward if it's approved.`;
    case 'approval_decided':
      return payloadString(item.payload, 'decision') === 'changes_requested'
        ? locale === 'ru'
          ? `${project} · ${client} · открой карточку проекта и посмотри, какие правки запросил клиент.`
          : `${project} · ${client} · open the project and review the requested changes.`
        : locale === 'ru'
          ? `${project} · ${client} · клиент уже согласовал этап, можно подтверждать перевод дальше.`
          : `${project} · ${client} · the client has signed off, so the stage can be confirmed and advanced.`;
    case 'comment_added':
      return locale === 'ru'
        ? `${project} · ${client} · ${actor} оставил комментарий.`
        : `${project} · ${client} · ${actor} left a comment.`;
    case 'file_uploaded':
      return locale === 'ru'
        ? `${project} · ${client} · ${actor} загрузил ${filename ?? 'новый файл'}.`
        : `${project} · ${client} · ${actor} uploaded ${filename ?? 'a new file'}.`;
    case 'project_created':
      return locale === 'ru'
        ? `${project} · ${client} · проект уже готов к дальнейшей настройке этапов и участников.`
        : `${project} · ${client} · the project is ready for stage setup and client-facing work.`;
    case 'stage_changed':
      return locale === 'ru'
        ? `${project} · ${client} · статус проекта изменён студией.`
        : `${project} · ${client} · the project status was changed by the studio.`;
    case 'nda_signed':
      return locale === 'ru'
        ? `${project} · ${client} · обнови дальнейшие шаги с учётом NDA.`
        : `${project} · ${client} · continue the workflow with the NDA state in mind.`;
    default:
      return `${project} · ${client}`;
  }
}

function destinationFor(item: PortalInboxItem) {
  if (item.clientId && item.projectId) {
    return `/portal/admin/clients/${item.clientId}/projects/${item.projectId}`;
  }
  if (item.clientId) {
    return `/portal/admin/clients/${item.clientId}`;
  }
  return '/portal/admin';
}

function summaryCard(
  label: string,
  value: number,
  tone: 'default' | 'accent' = 'default'
) {
  return (
    <div
      className={`border p-4 ${
        tone === 'accent'
          ? 'border-[var(--accent)] bg-[var(--accent)]/8'
          : 'border-[var(--hairline)]'
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
        {label}
      </p>
      <p className="mt-2 font-display text-[36px] leading-none tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}

function normalizeFilter(value: string | undefined): InboxFilter {
  if (value === 'attention' || value === 'unread' || value === 'approvals') {
    return value;
  }
  return 'all';
}

function matchesFilter(item: PortalInboxItem, filter: InboxFilter) {
  switch (filter) {
    case 'attention':
      return isActionRequired(item);
    case 'unread':
      return item.readAt == null;
    case 'approvals':
      return isPendingApproval(item);
    case 'all':
    default:
      return true;
  }
}

function matchesScope(
  item: PortalInboxItem,
  args: { clientId?: string; projectId?: string }
) {
  const { clientId, projectId } = args;
  if (clientId && item.clientId !== clientId) return false;
  if (projectId && item.projectId !== projectId) return false;
  return true;
}

function filterLabel(filter: InboxFilter, locale: PortalLocale) {
  switch (filter) {
    case 'attention':
      return locale === 'ru' ? 'Требует внимания' : 'Needs attention';
    case 'unread':
      return locale === 'ru' ? 'Непрочитано' : 'Unread';
    case 'approvals':
      return locale === 'ru' ? 'Подтверждения' : 'Approvals';
    case 'all':
    default:
      return locale === 'ru' ? 'Все' : 'All';
  }
}

function scopedInboxHref(args: {
  filter?: InboxFilter;
  clientId?: string;
  projectId?: string;
}) {
  const params = new URLSearchParams();
  if (args.filter && args.filter !== 'all') params.set('filter', args.filter);
  if (args.clientId) params.set('clientId', args.clientId);
  if (args.projectId) params.set('projectId', args.projectId);
  const query = params.toString();
  return query ? `/portal/admin/inbox?${query}` : '/portal/admin/inbox';
}

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams?: Promise<AdminInboxSearch>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeFilter = normalizeFilter(resolvedSearchParams.filter);
  const scopedClientId = resolvedSearchParams.clientId?.trim() || undefined;
  const scopedProjectId = resolvedSearchParams.projectId?.trim() || undefined;

  const supabase = await createSupabaseServerClient();
  const locale = await getPortalLocale();
  const t = tFactory(locale);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') redirect('/portal');

  const inbox = await loadAdminInbox({ supabase, limit: 50 });
  const items = [...inbox.items].sort((a, b) => {
    const actionPriority = Number(isActionRequired(b)) - Number(isActionRequired(a));
    if (actionPriority !== 0) return actionPriority;

    const unreadPriority = Number(a.readAt == null) - Number(b.readAt == null);
    if (unreadPriority !== 0) return -unreadPriority;

    return b.createdAt.localeCompare(a.createdAt);
  });

  const scopedItems = items.filter((item) =>
    matchesScope(item, {
      clientId: scopedClientId,
      projectId: scopedProjectId,
    })
  );

  const filteredItems = scopedItems.filter((item) => matchesFilter(item, activeFilter));
  const needsAttention = scopedItems.filter(isActionRequired).length;
  const pendingApprovals = scopedItems.filter(isPendingApproval).length;
  const unreadCount = scopedItems.filter((item) => item.readAt == null).length;
  const recentActivity = scopedItems.length;

  const scopedClient = scopedClientId
    ? scopedItems.find((item) => item.clientId === scopedClientId)?.clientName ?? null
    : null;
  const scopedProject = scopedProjectId
    ? scopedItems.find((item) => item.projectId === scopedProjectId)?.projectTitle ?? null
    : null;

  const filters: Array<{ id: InboxFilter; count: number }> = [
    { id: 'all', count: recentActivity },
    { id: 'attention', count: needsAttention },
    { id: 'unread', count: unreadCount },
    { id: 'approvals', count: pendingApprovals },
  ];

  return (
    <>
      <PortalHeader
        label={`${t('role.admin')} / Inbox`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: t('crumb.clients'), href: '/portal/admin' },
          { label: 'Inbox' },
        ]}
      />

      <div className="mb-8 flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <span className="text-[var(--accent)]">◆</span>{' '}
          {locale === 'ru' ? 'Admin Inbox' : 'Admin Inbox'}
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
              {scopedProject
                ? locale === 'ru'
                  ? `Inbox проекта: ${scopedProject}`
                  : `Project inbox: ${scopedProject}`
                : scopedClient
                  ? locale === 'ru'
                    ? `Inbox клиента: ${scopedClient}`
                    : `Client inbox: ${scopedClient}`
                  : locale === 'ru'
                    ? 'Входящие по порталу'
                    : 'Portal inbox'}
            </h1>
            <p className="max-w-3xl text-[14px] leading-[1.7] text-[var(--foreground)]/55">
              {scopedProject
                ? locale === 'ru'
                  ? 'Сфокусированная лента событий по одному проекту: комментарии, правки, ревью и загрузки.'
                  : 'A focused event stream for one project: comments, change requests, reviews and uploads.'
                : scopedClient
                  ? locale === 'ru'
                    ? 'Сфокусированная лента событий по одному клиенту во всех его проектах.'
                    : 'A focused event stream for one client across all of their projects.'
                  : locale === 'ru'
                    ? 'Единая лента того, что требует внимания студии: новые ревью, правки, комментарии и загрузки файлов от клиентов.'
                    : 'A single queue for what needs studio attention across the portal: review requests, client changes, comments and file uploads.'}
            </p>
          </div>
          {unreadCount > 0 ? (
            <form action={markAllInboxReadAction}>
              <button
                type="submit"
                className="border border-[var(--hairline)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {locale === 'ru' ? 'Отметить всё как прочитанное' : 'Mark all as read'}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {scopedClient || scopedProject ? (
        <section className="mb-6 flex flex-wrap items-center gap-2">
          {scopedClient ? (
            <span className="border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              {locale === 'ru' ? 'Клиент' : 'Client'} · {scopedClient}
            </span>
          ) : null}
          {scopedProject ? (
            <span className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/60">
              {locale === 'ru' ? 'Проект' : 'Project'} · {scopedProject}
            </span>
          ) : null}
          <Link
            href="/portal/admin/inbox"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/45 hover:text-[var(--accent)]"
          >
            {locale === 'ru' ? 'Сбросить scope →' : 'Clear scope →'}
          </Link>
        </section>
      ) : null}

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        {summaryCard(
          locale === 'ru' ? 'Требует внимания' : 'Needs attention',
          needsAttention,
          'accent'
        )}
        {summaryCard(
          locale === 'ru' ? 'Непрочитано' : 'Unread',
          unreadCount
        )}
        {summaryCard(
          locale === 'ru' ? 'Ожидают подтверждения' : 'Pending approvals',
          pendingApprovals
        )}
        {summaryCard(
          locale === 'ru' ? 'Событий в ленте' : 'Events loaded',
          recentActivity
        )}
      </section>

      {inbox.status === 'not_ready' ? (
        <div className="mb-8 border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-[13px] leading-[1.7] text-[var(--foreground)]/75">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
            {locale === 'ru'
              ? 'Нужен Supabase migration'
              : 'Supabase migration required'}
          </p>
          <p className="mt-2">
            {locale === 'ru'
              ? 'Таблица portal_events ещё не создана. Примени migration 0008_portal_events.sql — после этого здесь появится живая лента событий.'
              : 'The portal_events table is not available yet. Apply migration 0008_portal_events.sql and this inbox will start showing live activity.'}
          </p>
        </div>
      ) : null}

      {inbox.status === 'error' ? (
        <div className="mb-8 border border-red-500/40 bg-red-500/10 p-4 text-[13px] leading-[1.7] text-red-200">
          {locale === 'ru'
            ? 'Не удалось загрузить inbox. Проверь подключение к базе и RLS-политики.'
            : 'The inbox could not be loaded. Check the database connection and RLS policies.'}
        </div>
      ) : null}

      <section className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const href = scopedInboxHref({
            filter: filter.id,
            clientId: scopedClientId,
            projectId: scopedProjectId,
          });
          const isActive = filter.id === activeFilter;

          return (
            <Link
              key={filter.id}
              href={href}
              className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--hairline)] text-[var(--foreground)]/60 hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              {filterLabel(filter.id, locale)} · {filter.count}
            </Link>
          );
        })}
      </section>

      <section className="border-t border-[var(--hairline)]">
        {filteredItems.length === 0 ? (
          <div className="py-10">
            <p className="text-[14px] leading-[1.7] text-[var(--foreground)]/55">
              {activeFilter === 'all'
                ? scopedProject
                  ? locale === 'ru'
                    ? 'По этому проекту пока нет событий в inbox.'
                    : 'There is no inbox activity for this project yet.'
                  : scopedClient
                    ? locale === 'ru'
                      ? 'По этому клиенту пока нет событий в inbox.'
                      : 'There is no inbox activity for this client yet.'
                    : locale === 'ru'
                      ? 'Событий пока нет. Как только клиенты начнут ревью, писать комментарии или загружать файлы, они появятся здесь.'
                      : 'No activity yet. As soon as clients review stages, leave comments or upload files, the events will appear here.'
                : locale === 'ru'
                  ? `По фильтру «${filterLabel(activeFilter, locale)}» пока ничего нет.`
                  : `Nothing currently matches the “${filterLabel(activeFilter, locale)}” filter.`}
            </p>
          </div>
        ) : (
          <ul>
            {filteredItems.map((item) => {
              const actionRequired = isActionRequired(item);
              const isUnread = item.readAt == null;

              return (
                <li
                  key={item.id}
                  className={`grid gap-4 border-b border-[var(--hairline)] py-5 lg:grid-cols-[1fr_auto] lg:items-start ${
                    isUnread ? 'bg-[var(--accent)]/5' : ''
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {actionRequired ? (
                        <span className="border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                          {locale === 'ru' ? 'Нужно действие' : 'Action required'}
                        </span>
                      ) : null}
                      {isUnread ? (
                        <span className="border border-[var(--foreground)]/15 bg-[var(--background)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/60">
                          {locale === 'ru' ? 'Непрочитано' : 'Unread'}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/35">
                          {locale === 'ru' ? 'Прочитано' : 'Read'}
                        </span>
                      )}
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/40">
                        {formatDate(locale, item.createdAt)}
                      </span>
                    </div>
                    <p className="font-display text-[22px] leading-[1.15] tracking-[-0.02em]">
                      {titleFor(item, locale)}
                    </p>
                    <p className="max-w-3xl text-[14px] leading-[1.7] text-[var(--foreground)]/60">
                      {hintFor(item, locale)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/40">
                      {item.projectTitle ??
                        (locale === 'ru' ? 'Без названия' : 'Untitled')}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <form action={setInboxEventReadStateAction}>
                        <input type="hidden" name="event_id" value={item.id} />
                        <input
                          type="hidden"
                          name="next_state"
                          value={isUnread ? 'read' : 'unread'}
                        />
                        <button
                          type="submit"
                          className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {isUnread
                            ? locale === 'ru'
                              ? 'Прочитано'
                              : 'Mark read'
                            : locale === 'ru'
                              ? 'Вернуть в непрочитанное'
                              : 'Mark unread'}
                        </button>
                      </form>
                      <Link
                        href={destinationFor(item)}
                        className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        {locale === 'ru' ? 'Открыть проект →' : 'Open project →'}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
