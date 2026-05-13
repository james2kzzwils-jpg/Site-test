import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../../../../../_shared/PortalHeader';

interface ProjectDetailParams {
  id: string;
  projectId: string;
}

// Project detail (admin view). Phase A only renders the read-only
// summary: project metadata + the five auto-created stages. Phase B
// adds inline editing, rounds, comments, and uploads.
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
    .select('id, client_id, title, brief, budget_cents, currency, due_date, status, nda_until, is_public_portfolio')
    .eq('id', projectId)
    .eq('client_id', id)
    .maybeSingle();
  if (!project) notFound();

  const { data: stages } = await supabase
    .from('stages')
    .select('id, kind, order_index, title, deliverable, admin_summary, state, approved_at')
    .eq('project_id', project.id)
    .order('order_index', { ascending: true });

  return (
    <>
      <PortalHeader
        label={`Admin / Project / ${project.title}`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
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
          {project.nda_until
            ? ` · NDA until ${project.nda_until}`
            : ' · no NDA'}
          {project.is_public_portfolio ? ' · published' : ''}
        </p>
      </div>

      <section>
        <h2 className="mb-6 font-display text-[22px] font-medium tracking-[-0.01em]">
          Stages
        </h2>
        <ol className="grid gap-4">
          {(stages ?? []).map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between border border-[var(--hairline)] p-5"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
                  {String(s.order_index).padStart(2, '0')} · {s.kind}
                </p>
                <p className="mt-1 font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                  {s.title}
                </p>
                {s.deliverable ? (
                  <p className="mt-2 max-w-2xl text-[14px] leading-[1.7] text-[var(--foreground)]/55">
                    {s.deliverable}
                  </p>
                ) : null}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55">
                {s.state}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
          Phase B will unlock: round comments, file uploads, paste-from-clipboard, NDA toggle, publish-to-portfolio.
        </p>
      </section>
    </>
  );
}
