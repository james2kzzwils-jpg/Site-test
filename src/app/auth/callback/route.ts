import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Magic-link / OAuth callback. Supabase redirects the user here with
// `?code=…` after they click the link in their email. We exchange the
// code for a session, then route the user back to whatever path they
// were trying to reach before the auth round-trip.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const redirect = url.searchParams.get('redirect') ?? '/portal';

  if (!code) {
    return NextResponse.redirect(new URL('/portal/login?error=missing_code', url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/portal/login?error=${encodeURIComponent(error.message)}`, url)
    );
  }

  return NextResponse.redirect(new URL(redirect, url));
}
