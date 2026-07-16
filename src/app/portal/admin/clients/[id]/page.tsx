import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { insertPortalEvent } from '@/lib/portal/events';
import { loadAdminInbox, type PortalInboxItem } from '@/lib/portal/inbox';
import PortalHeader from '../../../_shared/PortalHeader';
import Breadcrumb from '../../../_shared/Breadcrumb';
import CopyButton from '../../../_shared/CopyButton';
import { getPortalLocale, tFactory, type PortalLocale } from '@/lib/portal/i18n';

interface ClientDetailParams {
  id: string;
}

interface ClientDetailSearch {
  sent?: string;
  err?: string;
  error_message?: string;
  /** Magic-link URL returned by generateTestLoginAction — surfaced on
   * the same page so the admin can copy it into a private window
   * without spending a Supabase email quota. */
  test_link?: string;
  test_link_email?: string;
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

function formatDate(locale: PortalLocale, value: string) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function activityTitle(item: PortalInboxItem, locale: PortalLocale) {
  const stage =
    payloadString(item.payload, 'stage_kind') ??
    payloadString(item.payload, 'to_stage') ??
    payloadString(item.payload, 'from_stage');
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

// Resolve the absolute `/auth/callback` URL for the *current* deploy
// by reading the live request headers. Used by every magic-link
// server action so we never hardcode `localhost` or `NEXT_PUBLIC_SITE_URL`.
// The forwarded headers are set by our reverse proxy (nginx) and fall
// back to the regular `host` header for direct connections.
async function resolveAuthCallbackUrl(redirect = '/portal'): Promise<string> {
  const h = await headers();
  return getPublicPortalOriginFromHeaders(h);
}

async function resolveEmailAuthRedirectUrl(redirect = '/portal'): Promise<string> {
  const origin = await resolvePublicPortalOrigin();
  return `${origin}/auth/complete?redirect=${encodeURIComponent(redirect)}`;
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
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

  return { supabase, user, profile };
}

async function createProjectAction(formData: FormData) {
  'use server';
  const { supabase, user } = await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!clientId || !title) return;

  const { data, error } = await supabase
    .from('projects')
    .insert({ client_id: clientId, title })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create project');

  await insertPortalEvent({
    supabase,
    projectId: data.id,
    clientId,
    actorId: user.id,
    type: 'project_created',
    payload: { title },
  });

  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}/projects/${data.id}`);
}

async function inviteMemberAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  if (!clientId || !email) return;

  const admin = createSupabaseAdminClient();
  const redirectTo = await resolveEmailAuthRedirectUrl('/portal');
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) {
    const params = new URLSearchParams({
      err: 'invite_failed',
      error_message: error.message,
    });
    redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
  }
  if (data?.user) {
    await admin.from('client_members').insert({
      client_id: clientId,
      profile_id: data.user.id,
    });
  }

  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}?sent=invited`);
}

async function generateTestLoginAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  if (!clientId || !email) return;

  const admin = createSupabaseAdminClient();
  const redirectTo = await resolveEmailAuthRedirectUrl('/portal');
  const origin = await resolvePublicPortalOrigin();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.hashed_token) {
    const params = new URLSearchParams({
      err: 'test_link_failed',
      error_message: error?.message ?? 'Missing token hash in generateLink response',
    });
    redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
  }

  const callbackParams = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
    redirect: '/portal',
  });
  const link = `${origin}/auth/complete?${callbackParams.toString()}`;

  const params = new URLSearchParams({
    test_link: link,
    test_link_email: email,
  });
  redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
}

async function resendMagicLinkAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  if (!clientId || !email) return;

  const admin = createSupabaseAdminClient();
  const emailRedirectTo = await resolveEmailAuthRedirectUrl('/portal');
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  });

  if (error) {
    const params = new URLSearchParams({
      err: 'resend_failed',
      error_message: error.message,
    });
    redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
  }

  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}?sent=resent`);
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<ClientDetailParams>;
  searchParams: Promise<ClientDetailSearch>;
}) {
  const { id } = await params;
  const { sent, err, error_message, test_link, test_link_email } =
    await searchParams;

  const { user, profile } = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const locale = await getPortalLocale();
  const t = tFactory(locale);

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company, notes, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!client) notFound();

  const adminDb = createSupabaseAdminClient();
  const { data: memberRows } = await adminDb
    .from('client_members')
    .select(
      'profile_id, invited_at, profile:profiles!inner(id, email, display_name)'
    )
    .eq('client_id', id)
    .order('invited_at', { ascending: true });
  type MemberRow = {
    profile_id: string;
    invited_at: string;
    profile: { id: string; email: string; display_name: string | null } | null;
  };
  const members = (memberRows ?? []) as unknown as MemberRow[];

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, title, status, nda_until, is_public_portfolio, due_date')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const projects = (projectRows ?? []).map((p) => ({
    ...p,
    is_under_nda:
      p.nda_until != null &&
      (p.nda_until === 'infinity' || p.nda_until > today),
  }));

  const inbox = await loadAdminInbox({ supabase, limit: 50 });
  const clientEvents = inbox.items
    .filter((item) => item.clientId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const clientNeedsAttention = clientEvents.filter(isActionRequired).length;
  const clientUnread = clientEvents.filter((item) => item.readAt == null).length;
  const clientApprovals = clientEvents.filter(isPendingApproval).length;
  const recentClientEvents = clientEvents.slice(0, 5);

  const projectMetrics = new Map<
    string,
    { attention: number; unread: number; approvals: number }
  >();

  for (const project of projects) {
    projectMetrics.set(project.id, { attention: 0, unread: 0, approvals: 0 });
  }

  for (const item of clientEvents) {
    const current = projectMetrics.get(item.projectId);
    if (!current) continue;
    if (isActionRequired(item)) current.attention += 1;
    if (item.readAt == null) current.unread += 1;
    if (isPendingApproval(item)) current.approvals += 1;
  }

  return (
    <>
      <PortalHeader
        label={`${t('role.admin')} / ${client.name}`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: t('crumb.clients'), href: '/portal/admin' },
          { label: client.name },
        ]}
      />

      {sent ? (
        <div className="mb-6 border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
          {t('admin.client.resentOk')}
        </div>
      ) : null}
      {err ? (
        <div className="mb-6 border border-red-500/40 bg-red-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-red-400">
          {err === 'resend_failed'
            ? locale === 'ru'
              ? 'Не удалось отправить ссылку. Проверь email.'
              : "Couldn't send magic link. Check the email."
            : err === 'test_link_failed'
              ? locale === 'ru'
                ? 'Не удалось сгенерировать тестовую ссылку.'
                : "Couldn't generate test login link."
              : locale === 'ru'
                ? 'Приглашение не отправлено.'
                : 'Invite failed.'}
        </div>
      ) : null}

      {test_link ? (
        <div className="mb-6 flex flex-col gap-3 border border-[var(--accent)] bg-[var(--accent)]/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              ◆ {t('admin.client.testLinkReady')}
              {test_link_email ? ` · ${test_link_email}` : ''}
            </p>
            <CopyButton
              value={test_link}
              label={t('admin.client.testLinkCopy')}
              labelCopied={t('admin.client.testLinkCopied')}
            />
          </div>
          <p className="text-[12px] leading-[1.6] text-[var(--foreground)]/70">
            {t('admin.client.testLinkHint')}
          </p>
          <code className="break-all border border-[var(--hairline)] bg-[var(--background)] p-2 font-mono text-[11px] leading-[1.5] text-[var(--foreground)]/80">
            {test_link}
          </code>
        </div>
      ) : null}

      <div className="mb-10 flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <span className="text-[var(--accent)]">◆</span> {t('admin.client.label')}
        </p>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {client.name}
        </h1>
        {client.company ? (
          <p className="text-[14px] text-[var(--foreground)]/55">{client.company}</p>
        ) : null}
      </div>

      <section className="mb-12 grid gap-4 md:grid-cols-4">
        {summaryCard({
          label: locale === 'ru' ? 'Требует внимания' : 'Needs attention',
          value: clientNeedsAttention,
          href: '/portal/admin/inbox?filter=attention',
          tone: 'accent',
          caption:
            locale === 'ru'
              ? 'События по этому клиенту, где студии нужно реагировать.'
              : 'Events for this client where the studio should act.',
        })}
        {summaryCard({
          label: locale === 'ru' ? 'Непрочитано' : 'Unread',
          value: clientUnread,
          href: '/portal/admin/inbox?filter=unread',
          caption:
            locale === 'ru'
              ? 'Непросмотренная активность по проектам этого клиента.'
              : 'Untriaged activity across this client’s projects.',
        })}
        {summaryCard({
          label: locale === 'ru' ? 'Подтверждения' : 'Approvals',
          value: clientApprovals,
          href: '/portal/admin/inbox?filter=approvals',
          caption:
            locale === 'ru'
              ? 'Ревью и подтверждения, относящиеся к этому клиенту.'
              : 'Review and approval events linked to this client.',
        })}
        {summaryCard({
          label: locale === 'ru' ? 'Проекты' : 'Projects',
          value: projects.length,
          href: `/portal/admin/clients/${client.id}`,
          caption:
            locale === 'ru'
              ? 'Быстрый индикатор масштаба работы по этому клиенту.'
              : 'Quick sense of how much active project surface this client has.',
        })}
      </section>

      {inbox.status === 'not_ready' ? (
        <div className="mb-8 border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-[13px] leading-[1.7] text-[var(--foreground)]/75">
          {locale === 'ru'
            ? 'Сводка активности клиента начнёт работать после применения migration 0008_portal_events.sql в Supabase.'
            : 'The client activity summary will start working once migration 0008_portal_events.sql is applied in Supabase.'}
        </div>
      ) : null}

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-medium tracking-[-0.01em]">
              {locale === 'ru' ? 'Последняя активность клиента' : 'Recent client activity'}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-[var(--foreground)]/55">
              {locale === 'ru'
                ? 'Последние события по всем проектам этого клиента, чтобы быстро понять контекст перед ответом или созвоном.'
                : 'Latest events across this client’s projects so the studio can quickly regain context before replying or reviewing.'}
            </p>
          </div>
          <Link
            href="/portal/admin/inbox"
            className="border border-[var(--hairline)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {locale === 'ru' ? 'Открыть inbox →' : 'Open inbox →'}
          </Link>
        </div>

        {recentClientEvents.length === 0 ? (
          <div className="border border-[var(--hairline)] p-5 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
            {locale === 'ru'
              ? 'По этому клиенту пока нет событий в activity feed.'
              : 'There is no client activity in the feed yet.'}
          </div>
        ) : (
          <ul className="border-t border-[var(--hairline)]">
            {recentClientEvents.map((item) => (
              <li
                key={item.id}
                className={`grid gap-4 border-b border-[var(--hairline)] py-4 lg:grid-cols-[1fr_auto] lg:items-start ${
                  item.readAt == null ? 'bg-[var(--accent)]/5' : ''
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {isActionRequired(item) ? (
                      <span className="border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                        {locale === 'ru' ? 'Нужно действие' : 'Action required'}
                      </span>
                    ) : null}
                    {item.readAt == null ? (
                      <span className="border border-[var(--foreground)]/15 bg-[var(--background)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/60">
                        {locale === 'ru' ? 'Непрочитано' : 'Unread'}
                      </span>
                    ) : null}
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/40">
                      {formatDate(locale, item.createdAt)}
                    </span>
                  </div>
                  <p className="font-display text-[20px] leading-[1.15] tracking-[-0.02em]">
                    {activityTitle(item, locale)}
                  </p>
                  <p className="text-[13px] leading-[1.7] text-[var(--foreground)]/60">
                    {item.projectTitle ??
                      (locale === 'ru' ? 'Проект без названия' : 'Untitled project')}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <Link
                    href={
                      item.projectId
                        ? `/portal/admin/clients/${client.id}/projects/${item.projectId}`
                        : `/portal/admin/clients/${client.id}`
                    }
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                  >
                    {locale === 'ru' ? 'Открыть →' : 'Open →'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Members + resend magic link */}
      <section className="mb-12">
        <h2 className="mb-4 font-display text-[22px] font-medium tracking-[-0.01em]">
          {t('admin.client.members')}
        </h2>
        <div className="border-t border-[var(--hairline)]">
          {members.length === 0 ? (
            <p className="py-6 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {locale === 'ru'
                ? 'Пока никто не приглашён.'
                : 'No one invited yet.'}
            </p>
          ) : (
            <ul>
              {members.map((m) => {
                const email = m.profile?.email ?? '';
                if (!email) return null;
                return (
                  <li
                    key={m.profile_id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px]">{email}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
                        invited {m.invited_at.slice(0, 10)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={generateTestLoginAction}>
                        <input
                          type="hidden"
                          name="client_id"
                          value={client.id}
                        />
                        <input type="hidden" name="email" value={email} />
                        <button
                          type="submit"
                          className="border border-[var(--accent)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--background)]"
                        >
                          {t('admin.client.testLink')}
                        </button>
                      </form>
                      <form action={resendMagicLinkAction}>
                        <input
                          type="hidden"
                          name="client_id"
                          value={client.id}
                        />
                        <input type="hidden" name="email" value={email} />
                        <button
                          type="submit"
                          className="border border-[var(--hairline)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {t('admin.client.resend')}
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form
          action={inviteMemberAction}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input type="hidden" name="client_id" value={client.id} />
          <input
            type="email"
            required
            name="email"
            placeholder={t('admin.client.inviteEmail')}
            className="flex-1 border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            {t('admin.client.invite')}
          </button>
        </form>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-[22px] font-medium tracking-[-0.01em]">
            {t('admin.client.projects')}
          </h2>
        </div>

        <div className="border-t border-[var(--hairline)]">
          {projects.length === 0 ? (
            <p className="py-8 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {t('admin.client.projectsEmpty')}
            </p>
          ) : (
            <ul>
              {projects.map((p) => {
                const metrics = projectMetrics.get(p.id) ?? {
                  attention: 0,
                  unread: 0,
                  approvals: 0,
                };
                const projectInboxBase = `/portal/admin/inbox?clientId=${client.id}&projectId=${p.id}`;

                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] py-4"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <p className="font-display text-[18px] leading-[1.2] tracking-[-0.01em]">
                        {p.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
                        <span>{p.status}</span>
                        {p.is_under_nda ? (
                          <span className="text-[var(--accent)]">· NDA</span>
                        ) : null}
                        {p.is_public_portfolio ? (
                          <span>· {locale === 'ru' ? 'портфолио' : 'portfolio'}</span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={projectInboxBase}
                          className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                        >
                          {locale === 'ru' ? 'Inbox →' : 'Inbox →'}
                        </Link>
                        {metrics.attention > 0 ? (
                          <Link
                            href={`${projectInboxBase}&filter=attention`}
                            className="border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
                          >
                            {locale === 'ru'
                              ? `Внимание ${metrics.attention}`
                              : `Attention ${metrics.attention}`}
                          </Link>
                        ) : null}
                        {metrics.unread > 0 ? (
                          <Link
                            href={`${projectInboxBase}&filter=unread`}
                            className="border border-[var(--hairline)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/60"
                          >
                            {locale === 'ru'
                              ? `Unread ${metrics.unread}`
                              : `Unread ${metrics.unread}`}
                          </Link>
                        ) : null}
                        {metrics.approvals > 0 ? (
                          <Link
                            href={`${projectInboxBase}&filter=approvals`}
                            className="border border-[var(--hairline)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/60"
                          >
                            {locale === 'ru'
                              ? `Approval ${metrics.approvals}`
                              : `Approval ${metrics.approvals}`}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      href={`/portal/admin/clients/${client.id}/projects/${p.id}`}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                    >
                      {t('common.open')} →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-[22px] font-medium tracking-[-0.01em]">
          {t('admin.client.newProject')}
        </h2>
        <form action={createProjectAction} className="flex flex-col gap-4 sm:flex-row">
          <input type="hidden" name="client_id" value={client.id} />
          <input
            required
            name="title"
            placeholder={t('admin.client.newProject.title')}
            className="flex-1 border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            + {t('admin.client.newProject.create')}
          </button>
        </form>
      </section>
    </>
  );
}
