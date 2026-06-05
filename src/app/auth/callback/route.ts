import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Magic-link / OAuth callback. We support two arrival shapes:
//
//   1. PKCE flow: Supabase sends back `?code=…`. We exchange it for a
//      session via `auth.exchangeCodeForSession`. This is what
//      `signInWithOtp` from a server-bound client (with cookies)
//      produces when the visitor clicks the link in the email.
//
//   2. OTP / token_hash flow: we receive `?token_hash=…&type=magiclink`.
//      Used by the admin "test login link" flow because
//      `admin.auth.admin.generateLink` always returns an implicit-flow
//      link (no PKCE challenge), and the implicit link leaves the
//      access_token in the URL *fragment* — which is unreachable from
//      the server. We pull the `hashed_token` from the generateLink
//      response and verify it server-side via `auth.verifyOtp` so the
//      session cookies land on this response.
//
// Either path produces session cookies on the redirected response.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const otpTypeParam = url.searchParams.get('type');
  const redirect = url.searchParams.get('redirect') ?? '/portal';

  const supabase = await createSupabaseServerClient();

  if (tokenHash) {
    // OTP-style flow. `type` defaults to 'magiclink' because that's
    // the only path the admin test-link uses today; if we ever wire up
    // signup/invite/recovery via the same route, the caller is
    // expected to set it explicitly.
    const type = (otpTypeParam ?? 'magiclink') as EmailOtpType;
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/portal/login?error=${encodeURIComponent(error.message)}`, url)
      );
    }
    return NextResponse.redirect(new URL(redirect, url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/portal/login?error=${encodeURIComponent(error.message)}`, url)
      );
    }
    return NextResponse.redirect(new URL(redirect, url));
  }

  // Neither flow's params present — the user landed here from
  // somewhere that didn't pass a credential. Bounce to login with a
  // diagnostic flag so we don't silently 404.
  return NextResponse.redirect(new URL('/portal/login?error=missing_code', url));
}
