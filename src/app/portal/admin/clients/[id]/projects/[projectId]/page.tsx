import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '@/app/portal/_shared/PortalHeader';
import Breadcrumb from '@/app/portal/_shared/Breadcrumb';
import StageStepper from '@/app/portal/_shared/StageStepper';
import StageThread, {
  type StageThreadLabels,
} from '@/app/portal/_shared/StageThread';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';
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
