'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function requireAdmin() {
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

  return { supabase, user };
}

export async function setInboxEventReadStateAction(formData: FormData) {
  const eventId = String(formData.get('event_id') ?? '');
  const nextState = String(formData.get('next_state') ?? 'read');
  if (!eventId) return;

  const { supabase } = await requireAdmin();
  const readAt = nextState === 'unread' ? null : new Date().toISOString();

  await supabase.from('portal_events').update({ read_at: readAt }).eq('id', eventId);

  revalidatePath('/portal/admin/inbox');
}

export async function markAllInboxReadAction() {
  const { supabase } = await requireAdmin();

  await supabase
    .from('portal_events')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  revalidatePath('/portal/admin/inbox');
}
