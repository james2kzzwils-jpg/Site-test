import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  assertPublicSupabaseEnv,
} from './env';

// Middleware Supabase client. Reads cookies from the inbound request
// and writes refreshed auth cookies to the outbound response so server
// components always see a valid session. Returns the response so the
// caller can mutate it (e.g. redirect to /portal/login).
export function createSupabaseMiddlewareClient(request: NextRequest) {
  assertPublicSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}
