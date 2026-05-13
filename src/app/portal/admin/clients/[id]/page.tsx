import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../../../_shared/PortalHeader';
import Breadcrumb from '../../../_shared/Breadcrumb';

interface ClientDetailParams {
  id: string;
}

async function createProjectAction(formData: FormData) {
  'use server';
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const clientId = String(formData.get('client_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!clientId || !title) return;

  const { data, error } = await supabase
    .from('projects')
    .insert({ client_id: clientId, title })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create project');

  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}/projects/${data.id}`);
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<ClientDetailParams>;
}) {
  const { id } = await params;
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

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company, notes, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!client) notFound();

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, title, status, nda_until, is_public_portfolio, due_date')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  // is_under_nda derived at read time. `nda_until` is null → no NDA;
  // 'infinity' → perpetual; otherwise compare to today's date.
  const today = new Date().toISOString().slice(0, 10);
  const projects = (projectRows ?? []).map((p) => ({
    ...p,
    is_under_nda:
      p.nda_until != null &&
      (p.nda_until === 'infinity' || p.nda_until > today),
  }));

  return (
    <>
      <PortalHeader
        label={`Admin / ${client.name}`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: 'Clients', href: '/portal/admin' },
          { label: client.name },
        ]}
      />

      <div className="mb-10 flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <span className="text-[var(--accent)]">◆</span> Client
        </p>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {client.name}
        </h1>
        {client.company ? (
          <p className="text-[14px] text-[var(--foreground)]/55">{client.company}</p>
        ) : null}
      </div>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-[22px] font-medium tracking-[-0.01em]">
            Projects
          </h2>
        </div>

        <div className="border-t border-[var(--hairline)]">
          {projects.length === 0 ? (
            <p className="py-8 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              No projects yet. Create one below.
            </p>
          ) : (
            <ul>
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between border-b border-[var(--hairline)] py-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-display text-[18px] leading-[1.2] tracking-[-0.01em]">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
                      <span>{p.status}</span>
                      {p.is_under_nda ? (
                        <span className="text-[var(--accent)]">· NDA</span>
                      ) : null}
                      {p.is_public_portfolio ? (
                        <span>· portfolio</span>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={`/portal/admin/clients/${client.id}/projects/${p.id}`}
                    className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                  >
                    Open →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-[22px] font-medium tracking-[-0.01em]">
          New project
        </h2>
        <form action={createProjectAction} className="flex flex-col gap-4 sm:flex-row">
          <input type="hidden" name="client_id" value={client.id} />
          <input
            required
            name="title"
            placeholder="Project title"
            className="flex-1 border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            + Create project
          </button>
        </form>
      </section>
    </>
  );
}
