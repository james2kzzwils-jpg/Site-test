import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

// Protect /portal/* by refreshing the Supabase session cookie and
// redirecting unauthenticated visitors to /portal/login. The login
// page itself and the OAuth callback are publicly reachable so the
// magic-link round-trip can complete.
//
// Next.js 16 renamed the file convention from `middleware` to `proxy`;
// the exported function name changes to match.
const PUBLIC_PORTAL_PATHS = new Set<string>([
  '/portal/login',
  '/auth/callback',
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast path for everything outside the portal.
  if (!pathname.startsWith('/portal') && !pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (PUBLIC_PORTAL_PATHS.has(pathname)) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/portal/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only zone gate. RLS will block at the DB level too, but a
  // server-side redirect gives a cleaner UX than a blank page.
  if (pathname.startsWith('/portal/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/portal/client';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/portal/:path*', '/auth/:path*'],
};
