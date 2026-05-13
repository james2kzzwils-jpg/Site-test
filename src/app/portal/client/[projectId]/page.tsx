import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../../_shared/PortalHeader';

interface ClientProjectParams {
  projectId: string;
}

// Client view of a single project. Phase A: read-only timeline of the
// five stages with their current state and deliverable. Phase B will
// add the rounds/comments thread + upload affordance.
export default async function ClientProjectPage({
  params,
}: {
  params: Promise<ClientProjectParams>;
}) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
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
    .select('id, title, status, due_date, brief')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data: stages } = await supabase
    .from('stages')
    .select('id, kind, order_index, title, deliverable, admin_summary, state')
    .eq('project_id', project.id)
    .order('order_index', { ascending: true });

  return (
    <>
      <PortalHeader
        label={`Client / ${project.title}`}
        email={profile?.email ?? user.email ?? ''}
        role="client"
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
          {project.due_date ? ` · due ${project.due_date}` : ''}
        </p>
        {project.brief ? (
          <p className="mt-6 max-w-2xl text-[14px] leading-[1.7] text-[var(--foreground)]/65">
            {project.brief}
          </p>
        ) : null}
      </div>

      <section>
        <h2 className="mb-6 font-display text-[22px] font-medium tracking-[-0.01em]">
          Stages
        </h2>
        <ol className="grid gap-4">
          {(stages ?? []).map((s) => (
            <li key={s.id} className="border border-[var(--hairline)] p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
                  {String(s.order_index).padStart(2, '0')} · {s.kind}
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55">
                  {s.state}
                </span>
              </div>
              <p className="mt-1 font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                {s.title}
              </p>
              {s.deliverable ? (
                <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-[var(--foreground)]/55">
                  → You get: {s.deliverable}
                </p>
              ) : null}
              {s.admin_summary ? (
                <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-[var(--foreground)]/75">
                  {s.admin_summary}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
          Comment threads and file uploads land here next.
        </p>
      </section>
    </>
  );
}
