import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../_shared/PortalHeader';
import Breadcrumb from '../_shared/Breadcrumb';
import { getPortalLocale, tFactory, type PortalLocale } from '@/lib/portal/i18n';
import { loadAdminInbox, type PortalInboxItem } from '@/lib/portal/inbox';
import type { ProjectStatus, StageKind, StageState } from '@/lib/portal/stages';

interface ProjectRow {
  id: string;
  client_id: string;
  status: ProjectStatus;
  due_date: string | null;
}

interface StageLookupRow {
  project_id: string;
  kind: StageKind;
  state: StageState;
}

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

function clientInboxHref(
  clientId: string,
  counts: { attention: number; unread: number; approvals: number },
) {
  const params = new URLSearchParams({ clientId });

  if (counts.attention > 0) {
    params.set('filter', 'attention');
  } else if (counts.approvals > 0) {
    params.set('filter', 'approvals');
  } else if (counts.unread > 0) {
    params.set('filter', 'unread');
  }

  return `/portal/admin/inbox?${params.toString()}`;
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

function workflowBucketCard(args: {
  label: string;
  value: number;
  caption: string;
  tone?: 'default' | 'accent';
}) {
  const { label, value, caption, tone = 'default' } = args;

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
      <p className="mt-2 font-display text-[30px] leading-none tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-3 text-[12px] leading-[1.6] text-[var(--foreground)]/55">
        {caption}
      </p>
    </div>
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

  const { data: projectsRaw } = await supabase
    .from('projects')
    .select('id, client_id, status, due_date')
    .order('created_at', { ascending: false });

  const projects = (projectsRaw ?? []) as ProjectRow[];
  const projectIds = projects.map((project) => project.id);
  const today = new Date().toISOString().slice(0, 10);

  const { data: stagesRaw } = projectIds.length
    ? await supabase
        .from('stages')
        .select('project_id, kind, state')
        .in('project_id', projectIds)
    : { data: [] as StageLookupRow[] };

  const stages = (stagesRaw ?? []) as StageLookupRow[];
  const currentStageByProject = new Map<string, StageLookupRow>();

  for (const project of projects) {
    if (project.status === 'archived') continue;

    const currentStage = stages.find(
      (stage) =>
        stage.project_id === project.id &&
        stage.kind === (project.status as StageKind)
    );

    if (currentStage) currentStageByProject.set(project.id, currentStage);
  }

  const waitingOnClient = projects.filter((project) => {
    const currentStage = currentStageByProject.get(project.id);
    return currentStage?.state === 'in_review';
  }).length;

  const waitingOnStudio = projects.filter((project) => {
    const currentStage = currentStageByProject.get(project.id);
    return (
      currentStage?.state === 'pending' ||
      currentStage?.state === 'changes_requested' ||
      currentStage?.state === 'client_approved'
    );
  }).length;

  const overdueProjects = projects.filter(
    (project) =>
      project.status !== 'archived' &&
      project.due_date != null &&
      project.due_date < today
  ).length;

  const inbox = await loadAdminInbox({ supabase, limit: 50 });
  const needsAttention = inbox.items.filter(isActionRequired).length;
  const unreadCount = inbox.items.filter((item) => item.readAt == null).length;
  const pendingApprovals = inbox.items.filter(isPendingApproval).length;
  const recentEvents = inbox.items.length;

  const countsByClient = new Map<
    string,
    {
      attention: number;
      unread: number;
      approvals: number;
      waitingOnClient: number;
      waitingOnStudio: number;
      overdue: number;
    }
  >();
  const latestByClient = new Map<string, PortalInboxItem>();

  for (const project of projects) {
    if (!project.client_id) continue;

    const current = countsByClient.get(project.client_id) ?? {
      attention: 0,
      unread: 0,
      approvals: 0,
      waitingOnClient: 0,
      waitingOnStudio: 0,
      overdue: 0,
    };

    const currentStage = currentStageByProject.get(project.id);

    if (currentStage?.state === 'in_review') current.waitingOnClient += 1;
    if (
      currentStage?.state === 'pending' ||
      currentStage?.state === 'changes_requested' ||
      currentStage?.state === 'client_approved'
    ) {
      current.waitingOnStudio += 1;
    }
    if (
      project.status !== 'archived' &&
      project.due_date != null &&
      project.due_date < today
    ) {
      current.overdue += 1;
    }

    countsByClient.set(project.client_id, current);
  }

  for (const item of inbox.items) {
    if (!item.clientId) continue;

    const current = countsByClient.get(item.clientId) ?? {
      attention: 0,
      unread: 0,
      approvals: 0,
      waitingOnClient: 0,
      waitingOnStudio: 0,
      overdue: 0,
    };

    if (isActionRequired(item)) current.attention += 1;
    if (item.readAt == null) current.unread += 1;
    if (isPendingApproval(item)) current.approvals += 1;

    countsByClient.set(item.clientId, current);

    if (!latestByClient.has(item.clientId)) {
      latestByClient.set(item.clientId, item);
    }
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

      <section className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-medium tracking-[-0.01em]">
              {locale === 'ru' ? 'Workflow buckets' : 'Workflow buckets'}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-[1.7] text-[var(--foreground)]/55">
              {locale === 'ru'
                ? 'Быстрый operational-срез: где студия ждёт клиента, где команда ещё внутри продакшна и сколько проектов уже выбились по сроку.'
                : 'A fast operational slice of where the studio is waiting on the client, where work is still in production, and how many live projects are already overdue.'}
            </p>
          </div>
          <Link
            href="/portal/admin/inbox"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/45 hover:text-[var(--accent)]"
          >
            {locale === 'ru' ? 'Открыть inbox →' : 'Open inbox →'}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {workflowBucketCard({
            label: locale === 'ru' ? 'Ждут клиента' : 'Waiting on client',
            value: waitingOnClient,
            tone: 'accent',
            caption:
              locale === 'ru'
                ? 'Этапы уже отправлены на ревью и ждут утверждения или комментариев клиента.'
                : 'Stages already handed off for review and currently waiting for client sign-off or feedback.',
          })}
          {workflowBucketCard({
            label: locale === 'ru' ? 'Ждут студию' : 'Waiting on studio',
            value: waitingOnStudio,
            caption:
              locale === 'ru'
                ? 'Проекты, где команда ещё производит апдейт, дорабатывает правки или подтверждает клиентское approve.'
                : 'Projects where the team is still producing the update, iterating on revisions, or confirming client approval.',
          })}
          {workflowBucketCard({
            label: locale === 'ru' ? 'Просрочены' : 'Overdue',
            value: overdueProjects,
            caption:
              locale === 'ru'
                ? 'Живые проекты с дедлайном в прошлом. Полезно для ежедневного контроля нагрузки.'
                : 'Live projects whose due date is already in the past. Useful as a daily load and risk check.',
          })}
        </div>
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
                waitingOnClient: 0,
                waitingOnStudio: 0,
                overdue: 0,
              };
              const latest = latestByClient.get(c.id);

              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] py-5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                      {counts.waitingOnClient > 0 ? (
                        <span className="border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                          {locale === 'ru'
                            ? `Ждут клиента ${counts.waitingOnClient}`
                            : `Client review ${counts.waitingOnClient}`}
                        </span>
                      ) : null}
                      {counts.waitingOnStudio > 0 ? (
                        <span className="border border-[var(--hairline)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/60">
                          {locale === 'ru'
                            ? `В работе ${counts.waitingOnStudio}`
                            : `Studio ${counts.waitingOnStudio}`}
                        </span>
                      ) : null}
                      {counts.overdue > 0 ? (
                        <span className="border border-[var(--accent)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                          {locale === 'ru'
                            ? `Просрочено ${counts.overdue}`
                            : `Overdue ${counts.overdue}`}
                        </span>
                      ) : null}
                    </div>
                    {latest ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-[13px] leading-[1.7] text-[var(--foreground)]/62">
                          {activityTitle(latest, locale)}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/38">
                          {formatDate(locale, latest.createdAt)}
                        </p>
                      </div>
                    ) : inbox.status === 'ready' ? (
                      <p className="text-[13px] leading-[1.7] text-[var(--foreground)]/45">
                        {locale === 'ru'
                          ? 'Пока без недавней активности по порталу.'
                          : 'No recent portal activity yet.'}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    {counts.attention > 0 || counts.unread > 0 || counts.approvals > 0 ? (
                      <Link
                        href={clientInboxHref(c.id, counts)}
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
