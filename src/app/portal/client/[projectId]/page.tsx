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
  clientApproveStageAction,
  clientRequestChangesAction,
} from './actions';

interface ClientProjectParams {
  projectId: string;
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
