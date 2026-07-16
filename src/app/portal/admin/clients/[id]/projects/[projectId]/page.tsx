import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '@/app/portal/_shared/PortalHeader';
import Breadcrumb from '@/app/portal/_shared/Breadcrumb';
import StageStepper from '@/app/portal/_shared/StageStepper';
import StageThread, {
  type StageThreadLabels,
} from '@/app/portal/_shared/StageThread';
import { getPortalLocale, tFactory, type PortalLocale } from '@/lib/portal/i18n';
import {
  loadProjectActivity,
  type PortalInboxItem,
} from '@/lib/portal/inbox';
import { loadProjectThreads } from '@/lib/portal/thread-loader';
import {
  STAGE_ORDER,
  type ProjectStatus,
  type StageKind,
  type StageRow,
} from '@/lib/portal/stages';
import {
  advanceStageAction,
  resetProjectAction,
  setStageStateAction,
  togglePublishAction,
  updateProjectMetaAction,
  updateProjectNdaAction,
  updateStageSummaryAction,
} from './actions';

interface ProjectDetailParams {
  id: string;
  projectId: string;
}

// Whitelist of supported currencies in the meta form. Stored as plain
// text in the DB (`currency` column) so adding new options is just an
// edit here.
const CURRENCY_OPTIONS = ['USD', 'EUR', 'RUB', 'USDT', 'BTC', 'ETH'] as const;

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

function formatActivityDate(locale: PortalLocale, value: string) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function activityActorLabel(item: PortalInboxItem, locale: PortalLocale) {
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

function activityTitle(item: PortalInboxItem, locale: PortalLocale) {
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

function activityHint(item: PortalInboxItem, locale: PortalLocale) {
  const actor = activityActorLabel(item, locale);
  const filename = payloadString(item.payload, 'filename');

  switch (item.type) {
    case 'approval_requested':
      return locale === 'ru'
        ? `${actor} отправил результат на ревью. Можно проверить этап и двигать проект дальше.`
        : `${actor} sent the deliverable for review. You can check the stage and move the project forward.`;
    case 'approval_decided':
      return payloadString(item.payload, 'decision') === 'changes_requested'
        ? locale === 'ru'
          ? `${actor} оставил запрос на правки по текущему этапу.`
          : `${actor} requested changes on the current stage.`
        : locale === 'ru'
          ? `${actor} утвердил текущий этап.`
          : `${actor} approved the current stage.`;
    case 'comment_added':
      return locale === 'ru'
        ? `${actor} оставил комментарий в обсуждении этапа.`
        : `${actor} left a new comment in the stage discussion.`;
    case 'file_uploaded':
      return locale === 'ru'
        ? `${actor} загрузил ${filename ?? 'новый файл'} в этап.`
        : `${actor} uploaded ${filename ?? 'a new file'} to this stage.`;
    case 'project_created':
      return locale === 'ru'
        ? 'Проект создан и готов к дальнейшей настройке.'
        : 'The project was created and is ready for the next setup steps.';
    case 'stage_changed':
      return locale === 'ru'
        ? `${actor} перевёл проект в другой статус.`
        : `${actor} moved the project to a new status.`;
    case 'nda_signed':
      return locale === 'ru'
        ? 'Состояние NDA было обновлено для проекта.'
        : 'The NDA state for this project was updated.';
    default:
      return locale === 'ru'
        ? `${actor} обновил активность проекта.`
        : `${actor} updated project activity.`;
  }
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<ProjectDetailParams>;
}) {
  const { id, projectId } = await params;
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

  const { data: project } = await supabase
    .from('projects')
    .select(
      'id, client_id, title, brief, budget_cents, currency, due_date, status, nda_until, is_public_portfolio'
    )
    .eq('id', projectId)
    .eq('client_id', id)
    .maybeSingle();
  if (!project) notFound();

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  const { data: stagesRaw } = await supabase
    .from('stages')
    .select(
      'id, kind, order_index, title, deliverable, admin_summary, state, approved_at'
    )
    .eq('project_id', project.id)
    .order('order_index', { ascending: true });

  const stages = (stagesRaw ?? []) as StageRow[];
  const projectStatus = project.status as ProjectStatus;
  const threadsByStage = await loadProjectThreads(project.id);
  const activity = await loadProjectActivity({
    supabase,
    projectId: project.id,
    limit: 8,
  });
  const threadLabels: StageThreadLabels = {
    studio: t('thread.studio'),
    client: t('thread.client'),
    round: t('thread.round'),
    included: t('thread.included'),
    billable: t('thread.billable'),
    open: t('thread.open'),
    closed: t('thread.closed'),
    empty: t('thread.empty'),
    closeRound: t('thread.closeRound'),
    composerPlaceholder: t('thread.composer.placeholder'),
    composerAttach: t('thread.composer.attach'),
    composerSend: t('thread.composer.send'),
    composerSending: t('thread.composer.sending'),
    composerHint: t('thread.composer.hint'),
    uploading: t('thread.uploading'),
    uploadFailed: t('thread.uploadFailed'),
    attachmentsLabel: t('thread.attachments'),
    pastedClipboard: t('thread.pastedClipboard'),
  };

  const ndaMode: 'none' | 'until' | 'perpetual' =
    project.nda_until == null
      ? 'none'
      : project.nda_until === 'infinity'
        ? 'perpetual'
        : 'until';

  const today = new Date().toISOString().slice(0, 10);
  const isUnderNda =
    project.nda_until != null &&
    (project.nda_until === 'infinity' || project.nda_until > today);

  const budgetValue =
    typeof project.budget_cents === 'number'
      ? (project.budget_cents / 100).toFixed(2)
      : '';

  const dueDateDefault = project.due_date ?? today;
  const ndaDateDefault = ndaMode === 'until' ? project.nda_until ?? today : today;
  const selectedCurrency = (project.currency ?? 'USD').toUpperCase();
  const knownCurrency = CURRENCY_OPTIONS.includes(
    selectedCurrency as (typeof CURRENCY_OPTIONS)[number]
  )
    ? selectedCurrency
    : 'USD';
  const projectInboxBase = `/portal/admin/inbox?clientId=${id}&projectId=${project.id}`;
  const projectNeedsAttention = activity.items.filter(isActionRequired).length;
  const projectUnread = activity.items.filter((item) => item.readAt == null).length;
  const projectApprovals = activity.items.filter(isPendingApproval).length;

  return (
    <>
      <PortalHeader
        label={`${t('role.admin')} / ${t('admin.project.label')} / ${project.title}`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: t('crumb.clients'), href: '/portal/admin' },
          {
            label: client?.name ?? t('crumb.client'),
            href: `/portal/admin/clients/${id}`,
          },
          { label: project.title },
        ]}
      />

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <span className="text-[var(--accent)]">◆</span> {t('admin.project.label')}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {project.title}
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
          {t('admin.project.status')}: {project.status}
          {isUnderNda
            ? project.nda_until === 'infinity'
              ? ` · ${t('admin.project.ndaPerpetual')}`
              : ` · ${t('admin.project.ndaUntil')} ${project.nda_until}`
            : ` · ${t('admin.project.ndaNone')}`}
          {project.is_public_portfolio ? ` · ${t('admin.project.published')}` : ''}
        </p>
      </div>

      <StageStepper stages={stages} projectStatus={projectStatus} />

      <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[18px] font-medium tracking-[-0.01em]">
            {t('progress.title')}
          </h2>
          <p className="max-w-md text-[13px] leading-[1.7] text-[var(--foreground)]/55">
            {t('progress.help')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={advanceStageAction}>
            <input type="hidden" name="client_id" value={id} />
            <input type="hidden" name="project_id" value={project.id} />
            <button
              type="submit"
              disabled={projectStatus === 'archived'}
              className="border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {projectStatus === 'archived'
                ? t('progress.archived')
                : projectStatus === 'final'
                  ? t('progress.finish')
                  : t('progress.advance')}
            </button>
          </form>
          <form action={resetProjectAction}>
            <input type="hidden" name="client_id" value={id} />
            <input type="hidden" name="project_id" value={project.id} />
            <button
              type="submit"
              className="border border-[var(--hairline)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {t('progress.reset')}
            </button>
          </form>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-[22px] font-medium tracking-[-0.01em]">
              {locale === 'ru' ? 'Активность проекта' : 'Project activity'}
            </h2>
            <p className="max-w-2xl text-[13px] leading-[1.7] text-[var(--foreground)]/55">
              {locale === 'ru'
                ? 'Последние события по этому проекту: ревью, комментарии, загрузки файлов и смена статусов.'
                : 'Latest events for this project: reviews, comments, file uploads and status changes.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={projectInboxBase}
              className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {locale === 'ru' ? 'Все' : 'All'}
            </Link>
            <Link
              href={`${projectInboxBase}&filter=attention`}
              className="border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/16"
            >
              {locale === 'ru'
                ? `Внимание ${projectNeedsAttention}`
                : `Attention ${projectNeedsAttention}`}
            </Link>
            <Link
              href={`${projectInboxBase}&filter=unread`}
              className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {locale === 'ru'
                ? `Unread ${projectUnread}`
                : `Unread ${projectUnread}`}
            </Link>
            <Link
              href={`${projectInboxBase}&filter=approvals`}
              className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {locale === 'ru'
                ? `Approval ${projectApprovals}`
                : `Approval ${projectApprovals}`}
            </Link>
          </div>
        </div>

        {activity.status === 'not_ready' ? (
          <div className="border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-[13px] leading-[1.7] text-[var(--foreground)]/75">
            {locale === 'ru'
              ? 'Лента активности появится после применения migration 0008_portal_events.sql.'
              : 'This activity feed will appear once migration 0008_portal_events.sql is applied.'}
          </div>
        ) : activity.status === 'error' ? (
          <div className="border border-red-500/40 bg-red-500/10 p-4 text-[13px] leading-[1.7] text-red-200">
            {locale === 'ru'
              ? 'Не удалось загрузить активность проекта.'
              : 'The project activity feed could not be loaded.'}
          </div>
        ) : activity.items.length === 0 ? (
          <div className="border border-[var(--hairline)] p-5 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
            {locale === 'ru'
              ? 'По этому проекту пока нет событий. Как только начнутся комментарии, ревью или загрузки, они появятся здесь.'
              : 'There is no project activity yet. As soon as reviews, comments or uploads start, they will appear here.'}
          </div>
        ) : (
          <ul className="border-t border-[var(--hairline)]">
            {activity.items.map((item) => (
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
                      {formatActivityDate(locale, item.createdAt)}
                    </span>
                  </div>
                  <p className="font-display text-[20px] leading-[1.15] tracking-[-0.02em]">
                    {activityTitle(item, locale)}
                  </p>
                  <p className="max-w-3xl text-[13px] leading-[1.7] text-[var(--foreground)]/60">
                    {activityHint(item, locale)}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/40">
                    {activityActorLabel(item, locale)}
                  </p>
                  <Link
                    href={
                      isPendingApproval(item)
                        ? `${projectInboxBase}&filter=approvals`
                        : isActionRequired(item)
                          ? `${projectInboxBase}&filter=attention`
                          : item.readAt == null
                            ? `${projectInboxBase}&filter=unread`
                            : projectInboxBase
                    }
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                  >
                    {locale === 'ru' ? 'Открыть в inbox →' : 'Open in inbox →'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12 grid gap-8 lg:grid-cols-2">
        <form
          action={updateProjectMetaAction}
          className="flex flex-col gap-4 border border-[var(--hairline)] p-6"
        >
          <input type="hidden" name="client_id" value={id} />
          <input type="hidden" name="project_id" value={project.id} />
          <h2 className="font-display text-[18px] font-medium tracking-[-0.01em]">
            {t('meta.title')}
          </h2>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              {t('meta.brief')}
            </span>
            <textarea
              name="brief"
              defaultValue={project.brief ?? ''}
              rows={4}
              className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] leading-[1.6] outline-none focus:border-[var(--accent)]"
              placeholder={t('meta.briefPlaceholder')}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                {t('meta.budget')}
              </span>
              <input
                name="budget"
                inputMode="decimal"
                defaultValue={budgetValue}
                className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                {t('meta.currency')}
              </span>
              <select
                name="currency"
                defaultValue={knownCurrency}
                className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-[var(--background)]">
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              {t('meta.dueDate')}
            </span>
            <input
              type="date"
              name="due_date"
              defaultValue={dueDateDefault}
              min="2020-01-01"
              max="2100-12-31"
              className="w-fit border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
            />
          </label>

          <button
            type="submit"
            className="mt-2 self-start border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            {t('meta.save')}
          </button>
        </form>

        <div className="flex flex-col gap-6">
          <form
            action={updateProjectNdaAction}
            className="flex flex-col gap-4 border border-[var(--hairline)] p-6"
          >
            <input type="hidden" name="client_id" value={id} />
            <input type="hidden" name="project_id" value={project.id} />
            <h2 className="font-display text-[18px] font-medium tracking-[-0.01em]">
              {t('nda.title')}
            </h2>
            <div className="flex flex-col gap-3 text-[13px]">
              {(
                [
                  ['none', t('nda.none')],
                  ['until', t('nda.until')],
                  ['perpetual', t('nda.perpetual')],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/65"
                >
                  <input
                    type="radio"
                    name="nda_mode"
                    value={value}
                    defaultChecked={ndaMode === value}
                    className="accent-[var(--accent)]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                {t('nda.untilLabel')}
              </span>
              <input
                type="date"
                name="nda_until_date"
                defaultValue={ndaDateDefault}
                min="2020-01-01"
                max="2100-12-31"
                className="w-fit border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <button
              type="submit"
              className="mt-1 self-start border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
            >
              {t('nda.save')}
            </button>
          </form>

          {/* Portfolio publish: locked until the project reaches Final
              OR has been wrapped early (status === 'archived'). Until
              then the toggle is disabled and we show a hint explaining
              why. Server action mirrors the same guard. */}
          {(() => {
            const canPublish =
              projectStatus === 'final' || projectStatus === 'archived';
            return (
              <form
                action={togglePublishAction}
                className={`flex flex-col gap-3 border border-[var(--hairline)] p-6 ${
                  canPublish ? '' : 'opacity-60'
                }`}
              >
                <input type="hidden" name="client_id" value={id} />
                <input type="hidden" name="project_id" value={project.id} />
                <h2 className="font-display text-[18px] font-medium tracking-[-0.01em]">
                  {t('portfolio.title')}
                </h2>
                <p className="text-[12px] leading-[1.7] text-[var(--foreground)]/55">
                  {t('portfolio.help')}
                </p>
                {!canPublish ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                    {t('portfolio.lockedHint')}
                  </p>
                ) : null}
                <label className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/65">
                  <input
                    type="checkbox"
                    name="publish"
                    defaultChecked={project.is_public_portfolio}
                    disabled={!canPublish}
                    className="accent-[var(--accent)]"
                  />
                  {t('portfolio.toggle')}
                </label>
                <button
                  type="submit"
                  disabled={!canPublish}
                  className="mt-1 self-start border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('portfolio.save')}
                </button>
              </form>
            );
          })()}
        </div>
      </section>

      <section>
        <h2 className="mb-6 font-display text-[22px] font-medium tracking-[-0.01em]">
          {t('stagesDetail.title')}
        </h2>
        <ol className="grid gap-4">
          {stages.map((s) => {
            const isCurrent = (s.kind as StageKind) === projectStatus;
            return (
              <li
                key={s.id}
                className={`flex flex-col gap-4 border p-5 ${
                  isCurrent
                    ? 'border-[var(--accent)]'
                    : 'border-[var(--hairline)]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`font-mono text-[10px] uppercase tracking-[0.24em] ${
                        isCurrent
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--foreground)]/55'
                      }`}
                    >
                      {String(
                        STAGE_ORDER.indexOf(s.kind as StageKind) + 1
                      ).padStart(2, '0')}{' '}
                      · {s.kind}
                    </p>
                    <p className="mt-1 font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                      {s.title}
                    </p>
                    {s.deliverable ? (
                      <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-[var(--foreground)]/55">
                        {t('stagesDetail.deliverable')}: {s.deliverable}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55">
                    {s.state === 'pending'
                      ? t('stageState.pending')
                      : s.state === 'in_review'
                        ? t('stageState.in_review')
                        : s.state === 'changes_requested'
                          ? t('stageState.changes_requested')
                          : t('stageState.approved')}
                  </span>
                </div>

                {/* Per-stage summary editor (admin only). Placeholder
                    is stage-aware so the field obviously means
                    "references" on Mood, "scene list" on Animatic,
                    etc. — instead of repeating the project-level
                    brief on every stage. */}
                <form
                  action={updateStageSummaryAction}
                  className="flex flex-col gap-2 border-t border-[var(--hairline)] pt-4"
                >
                  <input type="hidden" name="client_id" value={id} />
                  <input
                    type="hidden"
                    name="project_id"
                    value={project.id}
                  />
                  <input type="hidden" name="stage_id" value={s.id} />
                  <label className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                    {t(`stageMeta.${s.kind as StageKind}.label` as const)}
                  </label>
                  <textarea
                    name="summary"
                    defaultValue={s.admin_summary ?? ''}
                    rows={3}
                    placeholder={t(
                      `stageMeta.${s.kind as StageKind}.placeholder` as const
                    )}
                    className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] leading-[1.6] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    className="self-start border border-[var(--accent)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)]"
                  >
                    {t('stageMeta.save')}
                  </button>
                </form>

                {isCurrent && s.state !== 'approved' ? (
                  <div className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-4">
                    {/* Admin-only stage transitions. Each button has a
                        clearly-worded label + a one-line hint so it's
                        obvious what happens when it's pressed. The
                        approve-and-advance step (next stage) lives in
                        the global Progress Controls panel above. */}
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
                      <span className="text-[var(--accent)]">◆</span>{' '}
                      {t('stageActions.adminLabel')}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          [
                            'pending',
                            t('stageActions.pending.title'),
                            t('stageActions.pending.hint'),
                          ],
                          [
                            'in_review',
                            t('stageActions.in_review.title'),
                            t('stageActions.in_review.hint'),
                          ],
                          [
                            'changes_requested',
                            t('stageActions.changes_requested.title'),
                            t('stageActions.changes_requested.hint'),
                          ],
                        ] as const
                      ).map(([value, title, hint]) => (
                        <form key={value} action={setStageStateAction}>
                          <input type="hidden" name="client_id" value={id} />
                          <input
                            type="hidden"
                            name="project_id"
                            value={project.id}
                          />
                          <input type="hidden" name="stage_id" value={s.id} />
                          <input type="hidden" name="state" value={value} />
                          <button
                            type="submit"
                            className={`flex h-full w-full flex-col items-start gap-1 border px-3 py-3 text-left transition-colors ${
                              s.state === value
                                ? 'border-[var(--accent)] text-[var(--accent)]'
                                : 'border-[var(--hairline)] text-[var(--foreground)]/65 hover:border-[var(--accent)] hover:text-[var(--accent)]'
                            }`}
                          >
                            <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                              {title}
                            </span>
                            <span className="text-[11px] leading-[1.55] text-[var(--foreground)]/55">
                              {hint}
                            </span>
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="border-t border-[var(--hairline)] pt-5">
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                    <span className="text-[var(--accent)]">◆</span>{' '}
                    {t('thread.title')}
                  </p>
                  <StageThread
                    projectId={project.id}
                    clientId={id}
                    stageId={s.id}
                    stageKind={s.kind as StageKind}
                    rounds={threadsByStage[s.id] ?? []}
                    role="admin"
                    labels={threadLabels}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
