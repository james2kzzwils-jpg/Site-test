import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../_shared/PortalHeader';
import Breadcrumb from '../_shared/Breadcrumb';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';
import {
  STAGE_LONG_LABELS,
  STAGE_ORDER,
  type ProjectStatus,
  type StageKind,
  type StageState,
} from '@/lib/portal/stages';

interface ProjectStageSummary {
  project_id: string;
  kind: StageKind;
  state: StageState;
  order_index: number;
}

function getProgressPercent(status: ProjectStatus) {
  if (status === 'archived') return 100;
  const idx = STAGE_ORDER.indexOf(status as StageKind);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
}

function getCurrentStageLabel(status: ProjectStatus) {
  if (status === 'archived') return STAGE_LONG_LABELS.final;
  return STAGE_LONG_LABELS[status as StageKind] ?? status;
}

function getCurrentStageState(
  status: ProjectStatus,
  stagesByProject: Record<string, ProjectStageSummary[]>,
  projectId: string
): StageState | null {
  if (status === 'archived') return 'approved';
  const stages = stagesByProject[projectId] ?? [];
  return stages.find((stage) => stage.kind === status)?.state ?? null;
}

function getNextStepCopy(
  status: ProjectStatus,
  stageState: StageState | null,
  t: ReturnType<typeof tFactory>
) {
  if (status === 'archived') {
    return {
      badge: t('client.card.completed'),
      hint: t('client.card.completedHint'),
      badgeClass:
        'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    };
  }

  if (stageState === 'in_review') {
    return {
      badge: t('client.card.waitingOnYou'),
      hint: t('client.card.waitingOnYouHint'),
      badgeClass:
        'border-[var(--accent)]/40 bg-[var(--accent)]/12 text-[var(--accent)]',
    };
  }

  if (stageState === 'client_approved') {
    return {
      badge: t('client.card.awaitingStudio'),
      hint: t('client.card.awaitingStudioHint'),
      badgeClass:
        'border-blue-400/30 bg-blue-400/10 text-blue-200',
    };
  }

  return {
    badge: t('client.card.inStudio'),
    hint: t('client.card.inStudioHint'),
    badgeClass:
      'border-[var(--hairline)] bg-[var(--foreground)]/5 text-[var(--foreground)]/72',
  };
}

// Client landing: list all projects visible to the signed-in client
// (RLS already filters to client_members rows). For most clients this
// will be one or two projects.
export default async function ClientProjectsPage() {
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
  if (profile?.role === 'admin') redirect('/portal/admin');

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, due_date')
    .order('created_at', { ascending: false });

  const projectIds = (projects ?? []).map((project) => project.id);
  const stagesByProject: Record<string, ProjectStageSummary[]> = {};

  if (projectIds.length > 0) {
    const { data: stages } = await supabase
      .from('stages')
      .select('project_id, kind, state, order_index')
      .in('project_id', projectIds)
      .order('order_index', { ascending: true });

    for (const stage of (stages ?? []) as ProjectStageSummary[]) {
      stagesByProject[stage.project_id] ??= [];
      stagesByProject[stage.project_id].push(stage);
    }
  }

  return (
    <>
      <PortalHeader
        label={`${t('role.client')} / ${t('admin.client.projects')}`}
        email={profile?.email ?? user.email ?? ''}
        role="client"
      />

      <Breadcrumb trail={[{ label: t('crumb.myProjects') }]} />

      <h1 className="mb-3 font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
        {t('client.title')}
      </h1>
      <p className="mb-10 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
        {t('client.subtitle')}
      </p>

      <div className="border-t border-[var(--hairline)]">
        {(projects ?? []).length === 0 ? (
          <p className="py-10 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
            {t('client.empty')}
          </p>
        ) : (
          <ul>
            {projects!.map((project) => {
              const status = project.status as ProjectStatus;
              const stageState = getCurrentStageState(
                status,
                stagesByProject,
                project.id
              );
              const nextStep = getNextStepCopy(status, stageState, t);
              const progress = getProgressPercent(status);
              const currentStageLabel = getCurrentStageLabel(status);

              return (
                <li
                  key={project.id}
                  className="border-b border-[var(--hairline)] py-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-display text-[22px] leading-[1.15] tracking-[-0.01em]">
                          {project.title}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${nextStep.badgeClass}`}
                        >
                          {nextStep.badge}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground)]/45">
                            {t('client.card.currentStage')}
                          </p>
                          <p className="mt-1 text-[14px] leading-[1.7] text-[var(--foreground)]/78">
                            {currentStageLabel}
                            {project.due_date
                              ? ` · ${t('admin.project.due')} ${project.due_date}`
                              : ''}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--foreground)]/45">
                            {t('client.card.nextStep')}
                          </p>
                          <p className="mt-1 text-[14px] leading-[1.7] text-[var(--foreground)]/72">
                            {nextStep.hint}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 max-w-xl">
                        <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/45">
                          <span>{t('client.card.progress')}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--foreground)]/10">
                          <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/portal/client/${project.id}`}
                      className="inline-flex shrink-0 items-center self-start border border-[var(--hairline)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/72 hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
