import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '@/app/portal/_shared/PortalHeader';
import Breadcrumb from '@/app/portal/_shared/Breadcrumb';
import StageStepper from '@/app/portal/_shared/StageStepper';
import StageThread, {
  type StageThreadLabels,
} from '@/app/portal/_shared/StageThread';
import { getPortalLocale, tFactory, type PortalLocale } from '@/lib/portal/i18n';
import { loadProjectThreads } from '@/lib/portal/thread-loader';
import {
  STAGE_ORDER,
  type ProjectStatus,
  type StageKind,
  type StageRow,
} from '@/lib/portal/stages';
import {
  clientApproveStageAction,
  clientRequestChangesAction,
} from './actions';

interface ClientProjectParams {
  projectId: string;
}

function stageStateLabel(locale: PortalLocale, state: StageRow['state']) {
  switch (state) {
    case 'pending':
      return locale === 'ru' ? 'в работе' : 'in progress';
    case 'in_review':
      return locale === 'ru' ? 'на ревью' : 'in review';
    case 'changes_requested':
      return locale === 'ru' ? 'нужны правки' : 'changes requested';
    case 'client_approved':
      return locale === 'ru' ? 'клиент утвердил' : 'client approved';
    case 'approved':
    default:
      return locale === 'ru' ? 'утверждено' : 'approved';
  }
}

// Client view of a single project. Read-only timeline with the same
// stepper the admin uses so progress is unambiguous on both sides.
// Round comments + uploads hang off the active stage in Wave B2.
export default async function ClientProjectPage({
  params,
}: {
  params: Promise<ClientProjectParams>;
}) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const locale = await getPortalLocale();
  const t = tFactory(locale);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .maybeSingle();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, status, due_date, brief, nda_until')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data: stagesRaw } = await supabase
    .from('stages')
    .select(
      'id, kind, order_index, title, deliverable, admin_summary, state'
    )
    .eq('project_id', project.id)
    .order('order_index', { ascending: true });

  const stages = (stagesRaw ?? []) as StageRow[];
  const projectStatus = project.status as ProjectStatus;
  const currentKind = projectStatus === 'archived' ? null : (projectStatus as StageKind);
  const currentStage = currentKind
    ? stages.find((stage) => stage.kind === currentKind) ?? null
    : null;
  const currentStageIndex = currentKind ? STAGE_ORDER.indexOf(currentKind) : -1;
  const nextStageKind =
    currentStageIndex >= 0 && currentStageIndex < STAGE_ORDER.length - 1
      ? STAGE_ORDER[currentStageIndex + 1]
      : null;
  const nextStage = nextStageKind
    ? stages.find((stage) => stage.kind === nextStageKind) ?? null
    : null;
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

  const today = new Date().toISOString().slice(0, 10);
  const isUnderNda =
    project.nda_until != null &&
    (project.nda_until === 'infinity' || project.nda_until > today);

  const nextStepTitle = projectStatus === 'archived'
    ? locale === 'ru'
      ? 'Финальная поставка уже закрыта'
      : 'Final delivery is wrapped'
    : currentStage?.state === 'in_review'
      ? locale === 'ru'
        ? `${currentStage.title} ждёт твой ответ`
        : `${currentStage.title} is waiting on you`
      : currentStage?.state === 'changes_requested'
        ? locale === 'ru'
          ? `${currentStage.title} снова у студии в работе`
          : `${currentStage.title} is back with the studio`
        : currentStage?.state === 'client_approved'
          ? locale === 'ru'
            ? `Твое approval по ${currentStage.title} уже зафиксировано`
            : `Your approval for ${currentStage.title} is already recorded`
          : currentStage?.state === 'approved'
            ? locale === 'ru'
              ? `${currentStage.title} закрыт, студия двигает проект дальше`
              : `${currentStage.title} is closed and the studio is moving forward`
            : currentStage
              ? locale === 'ru'
                ? `Студия сейчас готовит ${currentStage.title}`
                : `The studio is preparing ${currentStage.title}`
              : locale === 'ru'
                ? 'Проект в работе'
                : 'Project in progress';

  const nextStepBody = projectStatus === 'archived'
    ? locale === 'ru'
      ? 'Все основные этапы завершены. Материалы и история обсуждений остаются в этом проекте как единая точка доступа — можно вернуться сюда за файлами, комментариями и финальным контекстом.'
      : 'All major stages are complete. Files and conversation history stay here as one delivery hub, so you can return for assets, comments, and final context anytime.'
    : currentStage?.state === 'in_review'
      ? locale === 'ru'
        ? 'Сейчас лучший момент быстро проверить deliverable ниже: если всё ок — нажми approve, если нужны изменения — отправь changes request и допиши детали в обсуждении.'
        : 'This is the best moment to review the deliverable below: approve it if everything is ready, or request changes and leave specifics in the conversation if something still needs work.'
      : currentStage?.state === 'changes_requested'
        ? locale === 'ru'
          ? 'Студия уже увидела твой feedback и дорабатывает этап. Когда новая версия будет готова, этот же экран снова покажет CTA на review.'
          : 'The studio has already seen your feedback and is iterating on the stage. Once the next version is ready, this same page will surface the review CTA again.'
        : currentStage?.state === 'client_approved'
          ? locale === 'ru'
            ? `Этап зафиксирован как approved. Дальше студия переведёт проект в ${nextStage?.title ?? 'следующий шаг'} — тебе ничего дополнительно делать не нужно.`
            : `The stage is already recorded as approved. Next the studio will move the project into ${nextStage?.title ?? 'the next step'} — no extra action is needed from you right now.`
          : currentStage?.state === 'approved'
            ? locale === 'ru'
              ? `Текущий этап уже закрыт. Студия завершает handoff и готовит переход в ${nextStage?.title ?? 'следующий этап'}.`
              : `The current stage is already closed. The studio is finishing the handoff and preparing the move into ${nextStage?.title ?? 'the next stage'}.`
            : currentStage
              ? locale === 'ru'
                ? 'Пока студия в production-режиме, тебе не нужно постоянно проверять портал. Когда появится результат для review, это будет видно здесь сразу.'
                : 'While the studio is still in production mode, you do not need to keep checking the portal constantly. As soon as something is ready for review, it will be obvious here.'
              : locale === 'ru'
                ? 'Проект движется по pipeline. Следующий апдейт появится здесь.'
                : 'The project is moving through the pipeline. The next update will appear here.';

  const deliveryChecklist = projectStatus === 'archived'
    ? [
        locale === 'ru'
          ? 'Проверь финальные deliverables и сохранённые ссылки в текущем треде.'
          : 'Check the final deliverables and saved links inside the current thread.',
        locale === 'ru'
          ? 'Вернись к NDA-пометке выше, если проект остаётся непубличным.'
          : 'Use the NDA note above as the reference if the project still needs to stay private.',
        locale === 'ru'
          ? 'Если нужен новый раунд работ, этот проект даёт студии весь исторический контекст.'
          : 'If a new round of work is needed, this project already gives the studio the full historical context.',
      ]
    : currentStage?.state === 'in_review'
      ? [
          locale === 'ru'
            ? 'Открой текущий этап ниже и посмотри summary + файлы.'
            : 'Open the current stage below and review the summary plus files.',
          locale === 'ru'
            ? 'Если всё готово — approve. Если нет — request changes и добавь комментарий с деталями.'
            : 'Approve if it is ready. If not, request changes and leave a precise comment with details.',
          locale === 'ru'
            ? 'После approval проект не исчезнет — ты сможешь вернуться к истории этапа в любой момент.'
            : 'After approval the project will not disappear — you can return to the stage history at any time.',
        ]
      : currentStage?.state === 'changes_requested'
        ? [
            locale === 'ru'
              ? 'Оставляй новые детали в треде только если появился дополнительный контекст.'
              : 'Add more notes in the thread only if new context appears.',
            locale === 'ru'
              ? 'Когда студия пришлёт новую версию, review-action снова появится прямо здесь.'
              : 'Once the studio ships a new version, the review action will appear here again.',
            locale === 'ru'
              ? 'Весь revision history остаётся на этом же этапе — не нужно искать старые сообщения отдельно.'
              : 'The full revision history stays attached to this same stage, so older context is never lost.',
          ]
        : currentStage?.state === 'client_approved'
          ? [
              locale === 'ru'
                ? 'Approval уже записан — можно просто дождаться следующего студийного апдейта.'
                : 'Your approval is already recorded — you can simply wait for the next studio update.',
              locale === 'ru'
                ? 'Если всплывёт новый контекст, его лучше добавить комментарием в текущий тред как можно раньше.'
                : 'If new context appears, the best place to add it is the current thread as early as possible.',
              locale === 'ru'
                ? 'Следующий этап появится здесь же, без отдельной новой ссылки.'
                : 'The next stage will show up here in the same project — no new link is needed.',
            ]
          : [
              locale === 'ru'
                ? 'Портал останется главным местом для review, файлов и решения правок.'
                : 'This portal stays the main place for reviews, files, and revision decisions.',
              locale === 'ru'
                ? 'Как только студия отправит следующий deliverable, ты увидишь это на текущем экране.'
                : 'As soon as the studio sends the next deliverable, you will see it on this same page.',
              locale === 'ru'
                ? 'Если сроки важны, ориентируйся на due date в шапке проекта.'
                : 'If timing matters, use the project due date in the header as your checkpoint.',
            ];

  return (
    <>
      <PortalHeader
        label={`${t('role.client')} / ${project.title}`}
        email={profile?.email ?? user.email ?? ''}
        role="client"
      />

      <Breadcrumb
        trail={[
          { label: t('crumb.myProjects'), href: '/portal/client' },
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
          {project.due_date ? ` · ${t('admin.project.due')} ${project.due_date}` : ''}
          {isUnderNda ? ' · NDA' : ''}
        </p>
        {project.brief ? (
          <p className="mt-6 max-w-2xl text-[14px] leading-[1.7] text-[var(--foreground)]/65">
            {project.brief}
          </p>
        ) : null}
      </div>

      <StageStepper stages={stages} projectStatus={projectStatus} />

      <section className="mb-12 border border-[var(--hairline)] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              <span className="text-[var(--accent)]">◆</span>{' '}
              {locale === 'ru' ? 'Что происходит дальше' : 'What happens next'}
            </p>
            <h2 className="mt-2 font-display text-[22px] font-medium tracking-[-0.01em]">
              {nextStepTitle}
            </h2>
            <p className="mt-3 text-[14px] leading-[1.7] text-[var(--foreground)]/65">
              {nextStepBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentStage ? (
              <span className="border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                {stageStateLabel(locale, currentStage.state)}
              </span>
            ) : null}
            {projectStatus === 'archived' ? (
              <span className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/55">
                {locale === 'ru' ? 'Delivery hub' : 'Delivery hub'}
              </span>
            ) : nextStage ? (
              <span className="border border-[var(--hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/55">
                {locale === 'ru'
                  ? `Далее ${nextStage.title}`
                  : `Next ${nextStage.title}`}
              </span>
            ) : null}
          </div>
        </div>

        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {deliveryChecklist.map((item) => (
            <li
              key={item}
              className="border border-[var(--hairline)] px-4 py-4 text-[13px] leading-[1.7] text-[var(--foreground)]/60"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-6 font-display text-[22px] font-medium tracking-[-0.01em]">
          {t('stages.title')}
        </h2>
        <ol className="grid gap-4">
          {stages.map((s) => {
            const isCurrent = (s.kind as StageKind) === currentKind;
            const isApproved = s.state === 'approved';
            return (
              <li
                key={s.id}
                className={`border p-5 ${
                  isCurrent
                    ? 'border-[var(--accent)]'
                    : 'border-[var(--hairline)]'
                } ${!isCurrent && !isApproved ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={`font-mono text-[10px] uppercase tracking-[0.24em] ${
                      isCurrent || isApproved
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--foreground)]/55'
                    }`}
                  >
                    {String(
                      STAGE_ORDER.indexOf(s.kind as StageKind) + 1
                    ).padStart(2, '0')}{' '}
                    · {s.kind}
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55">
                    {s.state === 'pending'
                      ? t('stageState.pending')
                      : s.state === 'in_review'
                      ? t('stageState.in_review')
                      : s.state === 'changes_requested'
                      ? t('stageState.changes_requested')
                      : s.state === 'client_approved'
                      ? locale === 'ru'
                        ? 'клиент утвердил'
                        : 'client approved'
                      : t('stageState.approved')}
                  </span>
                </div>
                <p className="mt-1 font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                  {s.title}
                </p>
                {s.deliverable ? (
                  <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-[var(--foreground)]/55">
                    {t('stages.youGet')}: {s.deliverable}
                  </p>
                ) : null}
                {s.admin_summary ? (
                  <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-[var(--foreground)]/75">
                    {s.admin_summary}
                  </p>
                ) : null}

                {/* Client-side stage controls: only surfaced when the
                    studio has marked this stage as ready for review
                    (`in_review`). Approve advances to the next stage;
                    Request changes flips state back into iteration. */}
                {isCurrent && s.state === 'in_review' ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <form action={clientApproveStageAction}>
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="stage_id" value={s.id} />
                      <input type="hidden" name="stage_kind" value={s.kind} />
                      <button
                        type="submit"
                        className="flex h-full w-full flex-col items-start gap-1 border border-[var(--accent)] bg-[var(--accent)] px-3 py-3 text-left text-[var(--background)] transition-colors"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                          {t('clientStageActions.approve.title')}
                        </span>
                        <span className="text-[11px] leading-[1.55] text-[var(--background)]/80">
                          {t('clientStageActions.approve.hint')}
                        </span>
                      </button>
                    </form>
                    <form action={clientRequestChangesAction}>
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="stage_id" value={s.id} />
                      <button
                        type="submit"
                        className="flex h-full w-full flex-col items-start gap-1 border border-[var(--hairline)] px-3 py-3 text-left text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                          {t('clientStageActions.changes.title')}
                        </span>
                        <span className="text-[11px] leading-[1.55] text-[var(--foreground)]/55">
                          {t('clientStageActions.changes.hint')}
                        </span>
                      </button>
                    </form>
                  </div>
                ) : null}

                <div className="mt-5 border-t border-[var(--hairline)] pt-5">
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                    <span className="text-[var(--accent)]">◆</span>{' '}
                    {t('thread.title')}
                  </p>
                  <StageThread
                    projectId={project.id}
                    clientId={null}
                    stageId={s.id}
                    stageKind={s.kind as StageKind}
                    rounds={threadsByStage[s.id] ?? []}
                    role="client"
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
