import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '@/app/portal/_shared/PortalHeader';
import Breadcrumb from '@/app/portal/_shared/Breadcrumb';
import StageStepper from '@/app/portal/_shared/StageStepper';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';
import {
  STAGE_ORDER,
  type ProjectStatus,
  type StageKind,
  type StageRow,
} from '@/lib/portal/stages';

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
              </li>
            );
          })}
        </ol>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
          {t('stages.b2hintClient')}
        </p>
      </section>
    </>
  );
}
