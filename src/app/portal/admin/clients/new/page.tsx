import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from '@/lib/supabase/server';
import { getPublicPortalOriginFromHeaders } from '@/lib/portal/public-origin';
import PortalHeader from '../../../_shared/PortalHeader';
import Breadcrumb from '../../../_shared/Breadcrumb';
import { getPortalLocale, tFactory } from '@/lib/portal/i18n';

async function resolvePublicPortalOrigin(): Promise<string> {
  const h = await headers();
  return getPublicPortalOriginFromHeaders(h);
}

async function resolveEmailAuthRedirectUrl(redirectTo = '/portal'): Promise<string> {
  const origin = await resolvePublicPortalOrigin();
  return `${origin}/auth/complete?redirect=${encodeURIComponent(redirectTo)}`;
}

// Server action for creating a client + invitee. We use the secret
// client to generate the auth invite (bypass RLS), then attach them
// via client_members from the same flow.
async function createClientAction(formData: FormData) {
  'use server';
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') redirect('/portal');

  const name = String(formData.get('name') ?? '').trim();
  const company = String(formData.get('company') ?? '').trim() || null;
  const inviteEmail = String(formData.get('invite_email') ?? '').trim();

  if (!name) return;

  const admin = createSupabaseAdminClient();

  const { data: clientRow, error: insertErr } = await admin
    .from('clients')
    .insert({ name, company, created_by: user.id })
    .select('id')
    .single();
  if (insertErr || !clientRow) {
    throw new Error(insertErr?.message ?? 'Failed to create client');
  }

  if (inviteEmail) {
    const inviteRedirectTo = await resolveEmailAuthRedirectUrl('/portal');
    const { data: inviteData, error: inviteErr } =
      await admin.auth.admin.inviteUserByEmail(inviteEmail, {
        redirectTo: inviteRedirectTo,
      });

    if (inviteErr) {
      const params = new URLSearchParams({
        err: 'invite_failed',
        error_message: inviteErr.message,
      });
      redirect(`/portal/admin/clients/${clientRow.id}?${params.toString()}`);
    }

    if (inviteData?.user) {
      await admin.from('client_members').insert({
        client_id: clientRow.id,
        profile_id: inviteData.user.id,
      });
    }
  }

  revalidatePath('/portal/admin');
  redirect(`/portal/admin/clients/${clientRow.id}${inviteEmail ? '?sent=invited' : ''}`);
}

export default async function NewClientPage() {
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
  if (profile?.role !== 'admin') redirect('/portal');

  return (
    <>
      <PortalHeader
        label={`${t('role.admin')} / ${t('crumb.newClient')}`}
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: t('crumb.clients'), href: '/portal/admin' },
          { label: t('crumb.newClient') },
        ]}
      />

      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {t('admin.newClient.title')}
        </h1>
        <p className="mb-10 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
          {t('admin.newClient.subtitle')}
        </p>

        <form action={createClientAction} className="flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              {t('admin.newClient.name')}
            </span>
            <input
              required
              name="name"
              className="border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
              placeholder={locale === 'ru' ? 'Иван Петров' : 'Alex Petrov'}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              {t('admin.newClient.company')}
            </span>
            <input
              name="company"
              className="border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
              placeholder={locale === 'ru' ? 'Название студии' : 'Studio name'}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              {t('admin.newClient.contactEmail')}
            </span>
            <input
              type="email"
              name="invite_email"
              className="border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
              placeholder="contact@studio.com"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
              {locale === 'ru'
                ? 'Оставь пустым — добавишь емейлы позже с страницы клиента.'
                : 'Leave empty to add later from the client detail screen.'}
            </span>
          </label>

          <button
            type="submit"
            className="mt-4 inline-flex items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            {t('admin.newClient.submit')}
          </button>
        </form>
      </div>
    </>
  );
}
