import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '@/app/portal/_shared/PortalHeader';
import Breadcrumb from '@/app/portal/_shared/Breadcrumb';
import StageStepper from '@/app/portal/_shared/StageStepper';
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
} from './actions';

interface ProjectDetailParams {
  id: string;
  projectId: string;
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<ProjectDetailParams>;
}) {
  const { id, projectId } = await params;
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

  // Derive UX-friendly NDA mode from the stored value.
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

  return (
    <>
      <PortalHeader
        label={`Admin / Project / ${project.title}`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: 'Clients', href: '/portal/admin' },
          {
            label: client?.name ?? 'Client',
            href: `/portal/admin/clients/${id}`,
          },
          { label: project.title },
        ]}
      />

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <span className="text-[var(--accent)]">◆</span> Project
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {project.title}
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
          status: {project.status}
          {isUnderNda
            ? project.nda_until === 'infinity'
              ? ' · NDA perpetual'
              : ` · NDA until ${project.nda_until}`
            : ' · no NDA'}
          {project.is_public_portfolio ? ' · published' : ''}
        </p>
      </div>

      <StageStepper stages={stages} projectStatus={projectStatus} />

      <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[18px] font-medium tracking-[-0.01em]">
            Progress controls
          </h2>
          <p className="max-w-md text-[13px] leading-[1.7] text-[var(--foreground)]/55">
            Advance the project to the next stage once the current deliverable
            is signed off. Approved stages stay locked unless you reset the
            whole flow.
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
                ? 'Archived'
                : projectStatus === 'final'
                ? 'Finish project →'
                : 'Approve & advance →'}
            </button>
          </form>
          <form action={resetProjectAction}>
            <input type="hidden" name="client_id" value={id} />
            <input type="hidden" name="project_id" value={project.id} />
            <button
              type="submit"
              className="border border-[var(--hairline)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Reset to discovery
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
            Project meta
          </h2>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              Brief / scope
            </span>
            <textarea
              name="brief"
              defaultValue={project.brief ?? ''}
              rows={4}
              className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] leading-[1.6] outline-none focus:border-[var(--accent)]"
              placeholder="Goals, audience, scope, deadline notes…"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
                Budget
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
                Currency
              </span>
              <input
                name="currency"
                defaultValue={project.currency ?? 'USD'}
                className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                placeholder="USD"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              Due date
            </span>
            <input
              type="date"
              name="due_date"
              defaultValue={project.due_date ?? ''}
              className="w-fit border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
            />
          </label>

          <button
            type="submit"
            className="mt-2 self-start border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            Save meta
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
              NDA
            </h2>
            <div className="flex flex-col gap-3 text-[13px]">
              {(
                [
                  ['none', 'No NDA — public-safe'],
                  ['until', 'Active until date'],
                  ['perpetual', 'Perpetual NDA'],
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
                Until date (if active)
              </span>
              <input
                type="date"
                name="nda_until_date"
                defaultValue={ndaMode === 'until' ? project.nda_until ?? '' : ''}
                className="w-fit border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <button
              type="submit"
              className="mt-1 self-start border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
            >
              Save NDA
            </button>
          </form>

          <form
            action={togglePublishAction}
            className="flex flex-col gap-3 border border-[var(--hairline)] p-6"
          >
            <input type="hidden" name="client_id" value={id} />
            <input type="hidden" name="project_id" value={project.id} />
            <h2 className="font-display text-[18px] font-medium tracking-[-0.01em]">
              Portfolio
            </h2>
            <p className="text-[12px] leading-[1.7] text-[var(--foreground)]/55">
              Flag this project to appear in the public Works section. The
              actual sync to the marketing site lands once cover images are
              wired up.
            </p>
            <label className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/65">
              <input
                type="checkbox"
                name="publish"
                defaultChecked={project.is_public_portfolio}
                className="accent-[var(--accent)]"
              />
              Publish to portfolio
            </label>
            <button
              type="submit"
              className="mt-1 self-start border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
            >
              Save publish flag
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-6 font-display text-[22px] font-medium tracking-[-0.01em]">
          Stages detail
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
                      {String(STAGE_ORDER.indexOf(s.kind as StageKind) + 1).padStart(2, '0')}{' '}
                      · {s.kind}
                    </p>
                    <p className="mt-1 font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                      {s.title}
                    </p>
                    {s.deliverable ? (
                      <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-[var(--foreground)]/55">
                        → Deliverable: {s.deliverable}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55">
                    {s.state}
                  </span>
                </div>

                {isCurrent && s.state !== 'approved' ? (
                  <div className="flex flex-wrap gap-2 border-t border-[var(--hairline)] pt-4">
                    {(
                      [
                        ['pending', 'Mark pending'],
                        ['in_review', 'Send to review'],
                        ['changes_requested', 'Request changes'],
                      ] as const
                    ).map(([value, label]) => (
                      <form key={value} action={setStageStateAction}>
                        <input type="hidden" name="client_id" value={id} />
                        <input type="hidden" name="project_id" value={project.id} />
                        <input type="hidden" name="stage_id" value={s.id} />
                        <input type="hidden" name="state" value={value} />
                        <button
                          type="submit"
                          className={`border px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                            s.state === value
                              ? 'border-[var(--accent)] text-[var(--accent)]'
                              : 'border-[var(--hairline)] text-[var(--foreground)]/55 hover:border-[var(--accent)] hover:text-[var(--accent)]'
                          }`}
                        >
                          {label}
                        </button>
                      </form>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
          Round comments, file uploads and paste-from-clipboard ship in Wave B2 next.
        </p>
      </section>
    </>
  );
}
