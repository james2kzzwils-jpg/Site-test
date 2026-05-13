import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import PortalHeader from '../../../_shared/PortalHeader';
import Breadcrumb from '../../../_shared/Breadcrumb';

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

  // 1) Create the client row using the admin client (bypasses RLS for
  //    the created_by self-reference; we still record it).
  const { data: clientRow, error: insertErr } = await admin
    .from('clients')
    .insert({ name, company, created_by: user.id })
    .select('id')
    .single();
  if (insertErr || !clientRow) {
    throw new Error(insertErr?.message ?? 'Failed to create client');
  }

  // 2) Invite the contact (magic link). Supabase will create the
  //    auth.users row and dispatch an email automatically.
  if (inviteEmail) {
    const { data: inviteData, error: inviteErr } =
      await admin.auth.admin.inviteUserByEmail(inviteEmail);
    if (inviteErr) {
      // We don't unwind the client row — the admin can re-invite from
      // the client detail screen later.
      console.warn('invite failed:', inviteErr.message);
    } else if (inviteData?.user) {
      await admin.from('client_members').insert({
        client_id: clientRow.id,
        profile_id: inviteData.user.id,
      });
    }
  }

  revalidatePath('/portal/admin');
  redirect(`/portal/admin/clients/${clientRow.id}`);
}

export default async function NewClientPage() {
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

  return (
    <>
      <PortalHeader
        label="Admin / New client"
        email={profile.email ?? user.email ?? ''}
        role="admin"
      />

      <Breadcrumb
        trail={[
          { label: 'Clients', href: '/portal/admin' },
          { label: 'New client' },
        ]}
      />

      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Invite a new client
        </h1>
        <p className="mb-10 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
          We create the client record and dispatch a one-time sign-in link to
          the email below. They land directly on their first project once they
          accept.
        </p>

        <form action={createClientAction} className="flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              Client name
            </span>
            <input
              required
              name="name"
              className="border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
              placeholder="Alex Petrov"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              Company (optional)
            </span>
            <input
              name="company"
              className="border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
              placeholder="Studio name"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
              Invite email
            </span>
            <input
              type="email"
              name="invite_email"
              className="border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
              placeholder="contact@studio.com"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/35">
              Leave empty to add later from the client detail screen.
            </span>
          </label>

          <button
            type="submit"
            className="mt-4 inline-flex items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--background)]"
          >
            Create + send magic link
          </button>
        </form>
      </div>
    </>
  );
}
