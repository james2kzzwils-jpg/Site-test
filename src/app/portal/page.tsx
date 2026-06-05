import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// /portal — landing route. Sends admins to /portal/admin, clients to
// their project listing. Middleware has already ensured the user is
// signed in, but we re-check here in case of cookie weirdness.
export default async function PortalIndexPage() {
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

  if (profile?.role === 'admin') redirect('/portal/admin');
  redirect('/portal/client');
}
