import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../_shared/PortalHeader';
import Breadcrumb from '../_shared/Breadcrumb';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';
import { loadAdminInbox, type PortalInboxItem } from '@/lib/portal/inbox';

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === 'string' ? value : null;
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

function summaryCard(args: {
  label: string;
  value: number;
  href: string;
  tone?: 'default' | 'accent';
  caption: string;
}) {
  const { label, value, href, tone = 'default', caption } = args;

  return (
    <Link
      href={href}
      className={`border p-4 transition-colors ${
        tone === 'accent'
          ? 'border-[var(--accent)] bg-[var(--accent)]/8 hover:bg-[var(--accent)]/14'
          : 'border-[var(--hairline)] hover:border-[var(--accent)]'
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
        {label}
      </p>
      <p className="mt-2 font-display text-[36px] leading-none tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-3 text-[12px] leading-[1.6] text-[var(--foreground)]/55">
        {caption}
      </p>
    </Link>
  );
}

// Admin dashboard: list of all clients. RLS guarantees only admins can
// read these rows, but the middleware redirected non-admins already.
export default async function AdminClientsPage() {
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

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company, created_at')
    .order('created_at', { ascending: false });

  const inbox = await loadAdminInbox({ supabase, limit: 50 });
  const needsAttention = inbox.items.filter(isActionRequired).length;
  const unreadCount = inbox.items.filter((item) => item.readAt == null).length;
  const pendingApprovals = inbox.items.filter(isPendingApproval).length;
  const recentEvents = inbox.items.length;

  const countsByClient = new Map<
    string,
    { attention: number; unread: number; approvals: number }
  >();

  for (const item of inbox.items) {
    if (!item.clientId) continue;

    const current = countsByClient.get(item.clientId) ?? {
      attention: 0,
      unread: 0,
      approvals: 0,
    };

    if (isActionRequired(item)) current.attention += 1;
    if (item.readAt == null) current.unread += 1;
    if (isPendingApproval(item)) current.approvals += 1;

    countsByClient.set(item.clientId, current);
  }

  return (
    <>
      <PortalHeader
        label={`${t('role.admin')} / ${t('admin.clients.title')}`}
        email={profile?.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb trail={[{ label: t('crumb.clients') }]} />

      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
            {t('admin.clients.title')}
          </h1>
          <p className="mt-2 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
            {t('admin.clients.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/admin/inbox"
            className="border border-[var(--hairline)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/65 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {locale === 'ru' ? 'Inbox админа' : 'Admin inbox'}
          </Link>
          <Link
            href="/portal/admin/clients/new"
            className="border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            + {t('admin.clients.new')}
          </Link>
        </div>
      </div>

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        {summaryCard({
          label: locale === 'ru' ? 'Требует внимания' : 'Needs attention',
          value: needsAttention,
          href: '/portal/admin/inbox?filter=attention',
          tone: 'accent',
          caption:
            locale === 'ru'
              ? 'Клиентские комментарии, правки и события, где студии нужно реагировать.'
              : 'Client comments, change requests and events that need studio action.',
        })}
        {summaryCard({
          label: locale === 'ru' ? 'Непрочитано' : 'Unread',
          value: unreadCount,
          href: '/portal/admin/inbox?filter=unread',
          caption:
            locale === 'ru'
              ? 'Все ещё неразобранные события в ленте портала.'
              : 'Portal events that still have not been triaged.',
        })}
        {summaryCard({
          label: locale === 'ru' ? 'Подтверждения' : 'Approvals',
          value: pendingApprovals,
          href: '/portal/admin/inbox?filter=approvals',
          caption:
            locale === 'ru'
              ? 'Этапы, отправленные на ревью или уже подтверждённые клиентом.'
              : 'Stages sent for review or already approved by the client.',
        })}
        {summaryCard({
          label: locale === 'ru' ? 'Событий загружено' : 'Events loaded',
          value: recentEvents,
          href: '/portal/admin/inbox',
          caption:
            locale === 'ru'
              ? 'Быстрый переход в общую operational-ленту админа.'
              : 'Quick jump into the admin’s operational inbox feed.',
        })}
      </section>

      {inbox.status === 'not_ready' ? (
        <div className="mb-8 border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-[13px] leading-[1.7] text-[var(--foreground)]/75">
          {locale === 'ru'
            ? 'Сводка активности начнёт работать после применения migration 0008_portal_events.sql в Supabase.'
            : 'The activity summary will start working once migration 0008_portal_events.sql is applied in Supabase.'}
        </div>
      ) : null}

      <div className="border-t border-[var(--hairline)]">
        {(clients ?? []).length === 0 ? (
          <p className="py-10 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
            {t('admin.clients.empty')}
          </p>
        ) : (
          <ul>
            {clients!.map((c) => {
              const counts = countsByClient.get(c.id) ?? {
                attention: 0,
                unread: 0,
                approvals: 0,
              };

              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] py-5"
                >
                  <div className="flex flex-col gap-2">
                    <p className="font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                      {c.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.company ? (
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
                          {c.company}
                        </p>
                      ) : null}
                      {counts.attention > 0 ? (
                        <span className="border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                          {locale === 'ru'
                            ? `Внимание ${counts.attention}`
                            : `Attention ${counts.attention}`}
                        </span>
                      ) : null}
                      {counts.unread > 0 ? (
                        <span className="border border-[var(--hairline)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/60">
                          {locale === 'ru'
                            ? `Unread ${counts.unread}`
                            : `Unread ${counts.unread}`}
                        </span>
                      ) : null}
                      {counts.approvals > 0 ? (
                        <span className="border border-[var(--hairline)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/60">
                          {locale === 'ru'
                            ? `Approve ${counts.approvals}`
                            : `Approvals ${counts.approvals}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {counts.attention > 0 || counts.unread > 0 ? (
                      <Link
                        href={`/portal/admin/inbox?filter=${
                          counts.attention > 0 ? 'attention' : 'unread'
                        }`}
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/45 hover:text-[var(--accent)]"
                      >
                        {locale === 'ru' ? 'В inbox →' : 'In inbox →'}
                      </Link>
                    ) : null}
                    <Link
                      href={`/portal/admin/clients/${c.id}`}
                      className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                    >
                      {t('common.open')} →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
