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
  if ((item.type === 'comment_added' || item.type === 'file_uploaded') && item.actorRole === 'client') {
    return true;
  }
  return false;
}

function isPendingApproval(item: PortalInboxItem) {
  const decision = payloadString(item.payload, 'decision');
  return item.type === 'approval_requested' || (item.type === 'approval_decided' && decision === 'approved');
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
  const project = item.projectTitle ?? (locale === 'ru' ? 'проект без названия' : 'untitled project');
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
      return locale === 'ru'
        ? `${project} · ${client}`
        : `${project} · ${client}`;
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

export default async function AdminInboxPage() {
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
    const priority = Number(isActionRequired(b)) - Number(isActionRequired(a));
    if (priority !== 0) return priority;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const needsAttention = items.filter(isActionRequired).length;
  const pendingApprovals = items.filter(isPendingApproval).length;
  const recentActivity = items.length;

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
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {locale === 'ru' ? 'Входящие по порталу' : 'Portal inbox'}
        </h1>
        <p className="max-w-3xl text-[14px] leading-[1.7] text-[var(--foreground)]/55">
          {locale === 'ru'
            ? 'Единая лента того, что требует внимания студии: новые ревью, правки, комментарии и загрузки файлов от клиентов.'
            : 'A single queue for what needs studio attention across the portal: review requests, client changes, comments and file uploads.'}
        </p>
      </div>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {summaryCard(locale === 'ru' ? 'Требует внимания' : 'Needs attention', needsAttention, 'accent')}
        {summaryCard(locale === 'ru' ? 'Ожидают подтверждения' : 'Pending approvals', pendingApprovals)}
        {summaryCard(locale === 'ru' ? 'Событий в ленте' : 'Events loaded', recentActivity)}
      </section>

      {inbox.status === 'not_ready' ? (
        <div className="mb-8 border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-[13px] leading-[1.7] text-[var(--foreground)]/75">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
            {locale === 'ru' ? 'Нужен Supabase migration' : 'Supabase migration required'}
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

      <section className="border-t border-[var(--hairline)]">
        {items.length === 0 ? (
          <p className="py-10 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
            {locale === 'ru'
              ? 'Событий пока нет. Как только клиенты начнут ревью, писать комментарии или загружать файлы, они появятся здесь.'
              : 'No activity yet. As soon as clients review stages, leave comments or upload files, the events will appear here.'}
          </p>
        ) : (
          <ul>
            {items.map((item) => {
              const actionRequired = isActionRequired(item);
              return (
                <li
                  key={item.id}
                  className="grid gap-4 border-b border-[var(--hairline)] py-5 lg:grid-cols-[1fr_auto] lg:items-start"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {actionRequired ? (
                        <span className="border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                          {locale === 'ru' ? 'Нужно действие' : 'Action required'}
                        </span>
                      ) : null}
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
                      {(item.projectTitle ?? (locale === 'ru' ? 'Без названия' : 'Untitled'))}
                    </p>
                    <Link
                      href={destinationFor(item)}
                      className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {locale === 'ru' ? 'Открыть проект →' : 'Open project →'}
                    </Link>
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
