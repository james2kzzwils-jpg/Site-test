import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../_shared/PortalHeader';
import Breadcrumb from '../_shared/Breadcrumb';
import {
  getPortalLocale,
  tFactory,
  type PortalLocale,
} from '@/lib/portal/i18n';
import type { ProjectStatus, StageKind, StageState } from '@/lib/portal/stages';

interface ProjectRow {
  id: string;
  title: string;
  status: ProjectStatus;
  due_date: string | null;
}

interface StageLookupRow {
  project_id: string;
  kind: StageKind;
  title: string;
  state: StageState;
}

function projectStatusSummary(args: {
  locale: PortalLocale;
  project: ProjectRow;
  currentStage: StageLookupRow | null;
}) {
  const { locale, project, currentStage } = args;

  if (project.status === 'archived') {
    return {
      tone: 'default' as const,
      label: locale === 'ru' ? 'Завершён' : 'Wrapped',
      hint:
        locale === 'ru'
          ? 'Финальные материалы уже собраны. Можно открыть проект и вернуться к файлам или договорённостям.'
          : 'Delivery is wrapped. Open the project anytime to revisit files or final notes.',
    };
  }

  if (!currentStage) {
    return {
      tone: 'default' as const,
      label: locale === 'ru' ? 'Обновляется' : 'Updating',
      hint:
        locale === 'ru'
          ? 'Статус проекта уже обновлён, а следующая стадия скоро появится внутри проекта.'
          : 'The project status already moved forward and the next stage will appear inside the project shortly.',
    };
  }

  switch (currentStage.state) {
    case 'in_review':
      return {
        tone: 'accent' as const,
        label: locale === 'ru' ? 'Нужно твоё ревью' : 'Needs your review',
        hint:
          locale === 'ru'
            ? `${currentStage.title} готов к проверке. Открой проект, чтобы утвердить этап или запросить правки.`
            : `${currentStage.title} is ready for review. Open the project to approve the stage or request changes.`,
      };
    case 'client_approved':
      return {
        tone: 'default' as const,
        label: locale === 'ru' ? 'Утверждение записано' : 'Approval recorded',
        hint:
          locale === 'ru'
            ? 'Твоё подтверждение уже сохранено. Студия сейчас подтверждает передачу и двигает проект дальше.'
            : 'Your approval is already recorded. The studio is confirming the handoff and moving the project forward.',
      };
    case 'changes_requested':
      return {
        tone: 'default' as const,
        label: locale === 'ru' ? 'Студия вносит правки' : 'Studio revising',
        hint:
          locale === 'ru'
            ? 'Правки уже зафиксированы. Следующий апдейт появится после нового раунда.'
            : 'Your change requests are already logged. The next update will arrive after the next revision round.',
      };
    case 'approved':
      return {
        tone: 'default' as const,
        label: locale === 'ru' ? 'Этап закрыт' : 'Stage complete',
        hint:
          locale === 'ru'
            ? 'Текущий этап уже закрыт. Студия готовит следующий шаг проекта.'
            : 'The current stage is complete. The studio is preparing the next project step.',
      };
    case 'pending':
    default:
      return {
        tone: 'default' as const,
        label: locale === 'ru' ? 'Студия работает' : 'Studio working',
        hint:
          locale === 'ru'
            ? `${currentStage.title} сейчас в работе. От тебя ничего не требуется, пока этап не перейдёт в ревью.`
            : `${currentStage.title} is currently in progress. You do not need to do anything until the stage moves into review.`,
      };
  }
}

function summaryToneClasses(tone: 'default' | 'accent') {
  return tone === 'accent'
    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
    : 'border-[var(--hairline)] text-[var(--foreground)]/65';
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

  const { data: projectsRaw } = await supabase
    .from('projects')
    .select('id, title, status, due_date')
    .order('created_at', { ascending: false });

  const projects = (projectsRaw ?? []) as ProjectRow[];
  const projectIds = projects.map((project) => project.id);

  const { data: stagesRaw } = projectIds.length
    ? await supabase
        .from('stages')
        .select('project_id, kind, title, state')
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

  const needsReviewCount = projects.filter((project) => {
    const currentStage = currentStageByProject.get(project.id);
    return currentStage?.state === 'in_review';
  }).length;
  const inProgressCount = projects.filter((project) => {
    const currentStage = currentStageByProject.get(project.id);
    return currentStage?.state === 'pending' || currentStage?.state === 'changes_requested';
  }).length;
  const wrappedCount = projects.filter((project) => project.status === 'archived').length;

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
      <p className="mb-8 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
        {t('client.subtitle')}
      </p>

      {(projects ?? []).length > 0 ? (
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="border border-[var(--accent)] bg-[var(--accent)]/8 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              {locale === 'ru' ? 'Ждут твоего ревью' : 'Waiting for your review'}
            </p>
            <p className="mt-2 font-display text-[36px] leading-none tracking-[-0.04em]">
              {needsReviewCount}
            </p>
          </div>
          <div className="border border-[var(--hairline)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {locale === 'ru' ? 'Студия в работе' : 'Studio in progress'}
            </p>
            <p className="mt-2 font-display text-[36px] leading-none tracking-[-0.04em]">
              {inProgressCount}
            </p>
          </div>
          <div className="border border-[var(--hairline)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {locale === 'ru' ? 'Завершено' : 'Wrapped'}
            </p>
            <p className="mt-2 font-display text-[36px] leading-none tracking-[-0.04em]">
              {wrappedCount}
            </p>
          </div>
        </section>
      ) : null}

      <div className="border-t border-[var(--hairline)]">
        {projects.length === 0 ? (
          <p className="py-10 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
            {t('client.empty')}
          </p>
        ) : (
          <ul>
            {projects.map((project) => {
              const currentStage = currentStageByProject.get(project.id) ?? null;
              const summary = projectStatusSummary({
                locale,
                project,
                currentStage,
              });

              return (
                <li
                  key={project.id}
                  className="flex flex-col gap-4 border-b border-[var(--hairline)] py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                        {project.title}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
                        {project.status}
                        {project.due_date
                          ? ` · ${t('admin.project.due')} ${project.due_date}`
                          : ''}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span
                        className={`w-fit border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${summaryToneClasses(
                          summary.tone
                        )}`}
                      >
                        {summary.label}
                      </span>
                      <p className="max-w-2xl text-[13px] leading-[1.7] text-[var(--foreground)]/60">
                        {summary.hint}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/portal/client/${project.id}`}
                    className="w-fit font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                  >
                    {t('common.open')} →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
