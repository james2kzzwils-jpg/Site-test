import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../_shared/PortalHeader';
import Breadcrumb from '../_shared/Breadcrumb';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';

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
            {projects!.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border-b border-[var(--hairline)] py-5"
              >
                <div>
                  <p className="font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                    {p.title}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
                    {p.status}
                    {p.due_date ? ` · ${t('admin.project.due')} ${p.due_date}` : ''}
                  </p>
                </div>
                <Link
                  href={`/portal/client/${p.id}`}
                  className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                >
                  {t('common.open')} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
