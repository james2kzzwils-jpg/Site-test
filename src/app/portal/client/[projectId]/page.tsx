import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '@/app/portal/_shared/PortalHeader';
import Breadcrumb from '@/app/portal/_shared/Breadcrumb';
import StageStepper from '@/app/portal/_shared/StageStepper';
import StageThread, {
  type StageThreadLabels,
} from '@/app/portal/_shared/StageThread';
import {
  getPortalLocale,
  tFactory,
  type PortalLocale,
} from '@/lib/portal/i18n';
import { loadProjectThreads } from '@/lib/portal/thread-loader';
import {
  STAGE_ORDER,
  nextStageKind,
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

function stageStateLabel(
  locale: PortalLocale,
  t: ReturnType<typeof tFactory>,
  state: StageRow['state']
) {
  if (state === 'client_approved') {
    return locale === 'ru' ? 'клиент утвердил' : 'client approved';
  }

  switch (state) {
    case 'pending':
      return t('stageState.pending');
    case 'in_review':
      return t('stageState.in_review');
    case 'changes_requested':
      return t('stageState.changes_requested');
    case 'approved':
    default:
      return t('stageState.approved');
  }
}

function nextStepContent(args: {
  locale: PortalLocale;
  projectStatus: ProjectStatus;
  currentStage: StageRow | null;
  nextStageTitle: string | null;
}) {
  const { locale, projectStatus, currentStage, nextStageTitle } = args;

  if (projectStatus === 'archived') {
    return {
      title:
        locale === 'ru' ? 'Проект завершён и собран' : 'Project delivery is wrapped',
      body:
        locale === 'ru'
          ? 'Все финальные материалы и история обсуждений остаются на этой странице. Если нужно вернуться к деталям, используй треды по этапам ниже.'
          : 'The final files and conversation history stay on this page. If you need to revisit context, use the stage threads below.',
      currentCardLabel: locale === 'ru' ? 'Статус проекта' : 'Project status',
      currentCardValue: locale === 'ru' ? 'Завершён' : 'Wrapped',
      nextCardLabel: locale === 'ru' ? 'Дальше' : 'What next',
      nextCardValue:
        locale === 'ru'
          ? 'Можно возвращаться к файлам, комментариям и финальным договорённостям.'
          : 'You can revisit files, comments, and final delivery notes anytime.',
    };
  }

  if (!currentStage) {
    return {
      title:
        locale === 'ru'
          ? 'Проект готовится к следующему шагу'
          : 'The project is preparing for the next step',
      body:
        locale === 'ru'
          ? 'Текущий статус уже обновлён, а следующая стадия скоро появится в таймлайне ниже.'
          : 'The current status has already moved forward, and the next stage will appear in the timeline below shortly.',
      currentCardLabel: locale === 'ru' ? 'Текущий этап' : 'Current stage',
      currentCardValue: locale === 'ru' ? 'Обновляется' : 'Updating',
      nextCardLabel: locale === 'ru' ? 'Следом' : 'Up next',
      nextCardValue: nextStageTitle ?? (locale === 'ru' ? 'Скоро' : 'Soon'),
    };
  }

  switch (currentStage.state) {
    case 'in_review':
      return {
        title:
          locale === 'ru' ? 'Сейчас нужен твой фидбек' : 'Your feedback is needed now',
        body:
          locale === 'ru'
            ? `${currentStage.title} готов к ревью. Если всё ок — утверди этап. Если нужны правки, зафиксируй их здесь же, чтобы студия сразу вернулась в работу.${nextStageTitle ? ` После подтверждения студия откроет этап ${nextStageTitle}.` : ''}`
            : `${currentStage.title} is ready for review. Approve the stage if it looks right, or request changes here so the studio can jump back into iteration immediately.${nextStageTitle ? ` After sign-off, the studio will open ${nextStageTitle}.` : ''}`,
        currentCardLabel: locale === 'ru' ? 'Текущий этап' : 'Current stage',
        currentCardValue: currentStage.title,
        nextCardLabel: locale === 'ru' ? 'Следом' : 'Up next',
        nextCardValue:
          nextStageTitle ??
          (locale === 'ru' ? 'Финальная передача проекта' : 'Final project handoff'),
      };
    case 'client_approved':
      return {
        title:
          locale === 'ru'
            ? 'Твоё утверждение уже зафиксировано'
            : 'Your approval is already recorded',
        body:
          locale === 'ru'
            ? `${currentStage.title} уже отмечен как одобренный с твоей стороны. Теперь студия подтверждает передачу и двигает проект дальше.${nextStageTitle ? ` Следующим откроется этап ${nextStageTitle}.` : ''}`
            : `${currentStage.title} has already been marked approved on your side. The studio is now confirming the handoff and moving the project forward.${nextStageTitle ? ` ${nextStageTitle} will open next.` : ''}`,
        currentCardLabel: locale === 'ru' ? 'Текущий этап' : 'Current stage',
        currentCardValue: currentStage.title,
        nextCardLabel: locale === 'ru' ? 'Следом' : 'Up next',
        nextCardValue:
          nextStageTitle ??
          (locale === 'ru' ? 'Финальная передача проекта' : 'Final project handoff'),
      };
    case 'changes_requested':
      return {
        title:
          locale === 'ru'
            ? 'Студия сейчас вносит правки'
            : 'The studio is revising this stage',
        body:
          locale === 'ru'
            ? `Ты уже запросил правки по этапу ${currentStage.title}. Если появятся дополнительные детали, оставь их в обсуждении ниже — так следующий раунд останется в одном месте.`
            : `You have already requested changes on ${currentStage.title}. If more detail comes up, add it in the conversation below so the next revision round stays in one place.`,
        currentCardLabel: locale === 'ru' ? 'Текущий этап' : 'Current stage',
        currentCardValue: currentStage.title,
        nextCardLabel: locale === 'ru' ? 'Что ждать' : 'What to expect',
        nextCardValue:
          locale === 'ru'
            ? 'Студия обновит материалы и снова вернёт этап на ревью.'
            : 'The studio will update the deliverable and send the stage back for review.',
      };
    case 'approved':
      return {
        title:
          locale === 'ru'
            ? 'Этап закрыт, проект движется дальше'
            : 'This stage is complete and the project is moving on',
        body:
          locale === 'ru'
            ? `${currentStage.title} уже полностью закрыт. Следующий шаг — дождаться нового материала на следующем этапе.${nextStageTitle ? ` Дальше идёт ${nextStageTitle}.` : ''}`
            : `${currentStage.title} is fully complete. The next step is to wait for the next deliverable to arrive.${nextStageTitle ? ` ${nextStageTitle} is up next.` : ''}`,
        currentCardLabel: locale === 'ru' ? 'Текущий этап' : 'Current stage',
        currentCardValue: currentStage.title,
        nextCardLabel: locale === 'ru' ? 'Следом' : 'Up next',
        nextCardValue:
          nextStageTitle ??
          (locale === 'ru' ? 'Финальная передача проекта' : 'Final project handoff'),
      };
    case 'pending':
    default:
      return {
        title:
          locale === 'ru'
            ? 'Студия готовит следующий апдейт'
            : 'The studio is preparing the next update',
        body:
          locale === 'ru'
            ? `${currentStage.title} сейчас находится в работе. От тебя ничего не требуется, но если контекст изменился, можно заранее оставить комментарий в обсуждении ниже.`
            : `${currentStage.title} is currently being prepared by the studio. You do not need to do anything right now, but if context changed you can leave a note in the conversation below.`,
        currentCardLabel: locale === 'ru' ? 'Текущий этап' : 'Current stage',
        currentCardValue: currentStage.title,
        nextCardLabel: locale === 'ru' ? 'Следом' : 'Up next',
        nextCardValue:
          locale === 'ru'
            ? 'Когда результат будет готов, этап перейдёт в ревью.'
            : 'Once the deliverable is ready, this stage will move into review.',
      };
  }
}

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
  const nextKind = currentKind ? nextStageKind(currentKind) : null;
  const nextStageTitle = nextKind
    ? stages.find((stage) => stage.kind === nextKind)?.title ?? nextKind
    : null;
  const nextStep = nextStepContent({
    locale,
    projectStatus,
    currentStage,
    nextStageTitle,
  });
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

      <section className="mb-12 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <div className="border border-[var(--accent)] bg-[var(--accent)]/8 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
            {locale === 'ru' ? 'Что дальше' : 'What happens next'}
          </p>
          <h2 className="mt-3 font-display text-[24px] leading-[1.1] tracking-[-0.02em]">
            {nextStep.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-[var(--foreground)]/72">
            {nextStep.body}
          </p>
        </div>

        <div className="grid gap-4">
          <div className="border border-[var(--hairline)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {nextStep.currentCardLabel}
            </p>
            <p className="mt-2 font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
              {nextStep.currentCardValue}
            </p>
          </div>
          <div className="border border-[var(--hairline)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {nextStep.nextCardLabel}
            </p>
            <p className="mt-2 text-[13px] leading-[1.7] text-[var(--foreground)]/68">
              {nextStep.nextCardValue}
            </p>
          </div>
        </div>
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
                      isCurrent || isApproved || s.state === 'client_approved'
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
                    {stageStateLabel(locale, t, s.state)}
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
                          {locale === 'ru'
                            ? 'Фиксирует этап с твоей стороны. После этого студия подтверждает передачу и двигает проект дальше.'
                            : 'Records your approval for this stage. After that, the studio confirms the handoff and moves the project forward.'}
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
