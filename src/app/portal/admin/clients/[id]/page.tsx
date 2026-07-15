import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { insertPortalEvent } from '@/lib/portal/events';
import { getPublicPortalOriginFromHeaders } from '@/lib/portal/public-origin';
import PortalHeader from '../../../_shared/PortalHeader';
import Breadcrumb from '../../../_shared/Breadcrumb';
import CopyButton from '../../../_shared/CopyButton';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';

interface ClientDetailParams {
  id: string;
}

interface ClientDetailSearch {
  sent?: string;
  err?: string;
  error_message?: string;
  test_link?: string;
  test_link_email?: string;
}

async function resolvePublicPortalOrigin(): Promise<string> {
  const h = await headers();
  return getPublicPortalOriginFromHeaders(h);
}

async function resolveEmailAuthRedirectUrl(redirect = '/portal'): Promise<string> {
  const origin = await resolvePublicPortalOrigin();
  return `${origin}/auth/complete?redirect=${encodeURIComponent(redirect)}`;
}

async function requireAdmin() {
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

  return { supabase, user, profile };
}

async function createProjectAction(formData: FormData) {
  'use server';
  const { supabase, user } = await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!clientId || !title) return;

  const { data, error } = await supabase
    .from('projects')
    .insert({ client_id: clientId, title })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create project');

  await insertPortalEvent({
    supabase,
    projectId: data.id,
    clientId,
    actorId: user.id,
    type: 'project_created',
    payload: { title },
  });

  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}/projects/${data.id}`);
}

async function inviteMemberAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  if (!clientId || !email) return;

  const admin = createSupabaseAdminClient();
  const redirectTo = await resolveEmailAuthRedirectUrl('/portal');
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) {
    const params = new URLSearchParams({
      err: 'invite_failed',
      error_message: error.message,
    });
    redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
  }
  if (data?.user) {
    await admin.from('client_members').insert({
      client_id: clientId,
      profile_id: data.user.id,
    });
  }

  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}?sent=invited`);
}

async function generateTestLoginAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  if (!clientId || !email) return;

  const admin = createSupabaseAdminClient();
  const redirectTo = await resolveEmailAuthRedirectUrl('/portal');
  const origin = await resolvePublicPortalOrigin();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.hashed_token) {
    const params = new URLSearchParams({
      err: 'test_link_failed',
      error_message: error?.message ?? 'Missing token hash in generateLink response',
    });
    redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
  }

  const callbackParams = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
    redirect: '/portal',
  });
  const link = `${origin}/auth/complete?${callbackParams.toString()}`;

  const params = new URLSearchParams({
    test_link: link,
    test_link_email: email,
  });
  redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
}

async function resendMagicLinkAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  if (!clientId || !email) return;

  const admin = createSupabaseAdminClient();
  const emailRedirectTo = await resolveEmailAuthRedirectUrl('/portal');
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  });

  if (error) {
    const params = new URLSearchParams({
      err: 'resend_failed',
      error_message: error.message,
    });
    redirect(`/portal/admin/clients/${clientId}?${params.toString()}`);
  }

  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}?sent=resent`);
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<ClientDetailParams>;
  searchParams: Promise<ClientDetailSearch>;
}) {
  const { id } = await params;
  const { sent, err, error_message, test_link, test_link_email } =
    await searchParams;

  const { user, profile } = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const locale = await getPortalLocale();
  const t = tFactory(locale);

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company, notes, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!client) notFound();

  const adminDb = createSupabaseAdminClient();
  const { data: memberRows } = await adminDb
    .from('client_members')
    .select(
      'profile_id, invited_at, profile:profiles!inner(id, email, display_name)'
    )
    .eq('client_id', id)
    .order('invited_at', { ascending: true });
  type MemberRow = {
    profile_id: string;
    invited_at: string;
    profile: { id: string; email: string; display_name: string | null } | null;
  };
  const members = (memberRows ?? []) as unknown as MemberRow[];

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, title, status, nda_until, is_public_portfolio, due_date')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

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
        label={`${t('role.admin')} / ${client.name}`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: t('crumb.clients'), href: '/portal/admin' },
          { label: client.name },
        ]}
      />

      {sent ? (
        <div className="mb-6 border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
          {t('admin.client.resentOk')}
        </div>
      ) : null}
      {err ? (
        <div className="mb-6 flex flex-col gap-2 border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-400">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em]">
            {err === 'resend_failed'
              ? locale === 'ru'
                ? 'Не удалось отправить ссылку. Проверь email.'
                : "Couldn't send magic link. Check the email."
              : err === 'test_link_failed'
                ? locale === 'ru'
                  ? 'Не удалось сгенерировать тестовую ссылку.'
                  : "Couldn't generate test login link."
                : locale === 'ru'
                  ? 'Приглашение не отправлено.'
                  : 'Invite failed.'}
          </div>
          {error_message ? (
            <div className="text-[12px] leading-[1.6] text-red-200">
              {error_message}
            </div>
          ) : null}
        </div>
      ) : null}

      {test_link ? (
        <div className="mb-6 flex flex-col gap-3 border border-[var(--accent)] bg-[var(--accent)]/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              ◆ {t('admin.client.testLinkReady')}
              {test_link_email ? ` · ${test_link_email}` : ''}
            </p>
            <CopyButton
              value={test_link}
              label={t('admin.client.testLinkCopy')}
              labelCopied={t('admin.client.testLinkCopied')}
            />
          </div>
          <p className="text-[12px] leading-[1.6] text-[var(--foreground)]/70">
            {t('admin.client.testLinkHint')}
          </p>
          <code className="break-all border border-[var(--hairline)] bg-[var(--background)] p-2 font-mono text-[11px] leading-[1.5] text-[var(--foreground)]/80">
            {test_link}
          </code>
        </div>
      ) : null}

      <div className="mb-10 flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55">
          <span className="text-[var(--accent)]">◆</span> {t('admin.client.label')}
        </p>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {client.name}
        </h1>
        {client.company ? (
          <p className="text-[14px] text-[var(--foreground)]/55">{client.company}</p>
        ) : null}
      </div>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-[22px] font-medium tracking-[-0.01em]">
          {t('admin.client.members')}
        </h2>
        <div className="border-t border-[var(--hairline)]">
          {members.length === 0 ? (
            <p className="py-6 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {locale === 'ru'
                ? 'Пока никто не приглашён.'
                : 'No one invited yet.'}
            </p>
          ) : (
            <ul>
              {members.map((m) => {
                const email = m.profile?.email ?? '';
                if (!email) return null;
                return (
                  <li
                    key={m.profile_id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-[14px]">{email}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
                        invited {m.invited_at.slice(0, 10)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={generateTestLoginAction}>
                        <input
                          type="hidden"
                          name="client_id"
                          value={client.id}
                        />
                        <input type="hidden" name="email" value={email} />
                        <button
                          type="submit"
                          className="border border-[var(--accent)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--background)]"
                        >
                          {t('admin.client.testLink')}
                        </button>
                      </form>
                      <form action={resendMagicLinkAction}>
                        <input
                          type="hidden"
                          name="client_id"
                          value={client.id}
                        />
                        <input type="hidden" name="email" value={email} />
                        <button
                          type="submit"
                          className="border border-[var(--hairline)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {t('admin.client.resend')}
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form
          action={inviteMemberAction}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input type="hidden" name="client_id" value={client.id} />
          <input
            type="email"
            required
            name="email"
            placeholder={t('admin.client.inviteEmail')}
            className="flex-1 border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            {t('admin.client.invite')}
          </button>
        </form>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-[22px] font-medium tracking-[-0.01em]">
            {t('admin.client.projects')}
          </h2>
        </div>

        <div className="border-t border-[var(--hairline)]">
          {projects.length === 0 ? (
            <p className="py-8 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
              {t('admin.client.projectsEmpty')}
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
                        <span>· {locale === 'ru' ? 'портфолио' : 'portfolio'}</span>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={`/portal/admin/clients/${client.id}/projects/${p.id}`}
                    className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                  >
                    {t('common.open')} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-[22px] font-medium tracking-[-0.01em]">
          {t('admin.client.newProject')}
        </h2>
        <form action={createProjectAction} className="flex flex-col gap-4 sm:flex-row">
          <input type="hidden" name="client_id" value={client.id} />
          <input
            required
            name="title"
            placeholder={t('admin.client.newProject.title')}
            className="flex-1 border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            + {t('admin.client.newProject.create')}
          </button>
        </form>
      </section>
    </>
  );
}
