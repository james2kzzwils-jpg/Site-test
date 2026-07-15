import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../_shared/PortalHeader';
import Breadcrumb from '../_shared/Breadcrumb';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';

// Admin dashboard: list of all clients. RLS guarantees only admins can
// read these rows, but the middleware redirected non-admins already.
export default async function AdminClientsPage() {
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

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company, created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <PortalHeader
        label={`${t('role.admin')} / ${t('admin.clients.title')}`}
        email={profile?.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb trail={[{ label: t('crumb.clients') }]} />

      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
            {t('admin.clients.title')}
          </h1>
          <p className="mt-2 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
            {t('admin.clients.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/admin/inbox"
            className="border border-[var(--hairline)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/65 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {locale === 'ru' ? 'Inbox админа' : 'Admin inbox'}
          </Link>
          <Link
            href="/portal/admin/clients/new"
            className="border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            + {t('admin.clients.new')}
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        {(clients ?? []).length === 0 ? (
          <p className="py-10 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
            {t('admin.clients.empty')}
          </p>
        ) : (
          <ul>
            {clients!.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border-b border-[var(--hairline)] py-5"
              >
                <div>
                  <p className="font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                    {c.name}
                  </p>
                  {c.company ? (
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
                      {c.company}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/portal/admin/clients/${c.id}`}
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
