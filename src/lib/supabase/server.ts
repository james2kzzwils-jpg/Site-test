import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY,
  SUPABASE_URL,
  assertPublicSupabaseEnv,
  assertSecretSupabaseEnv,
} from './env';

// Server-side client tied to the request's cookies. Use this in
// Server Components, Route Handlers, and Server Actions where the
// caller's session is required. Auth checks happen via RLS — the
// publishable key carries no special privilege.
export async function createSupabaseServerClient() {
  assertPublicSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component during render — cookies can
          // only be mutated from Server Actions / Route Handlers. The
          // middleware refreshes them anyway, so this is safe to swallow.
        }
      },
    },
  });
}

// Service-role client. Bypasses RLS — only use from Server Actions and
// Route Handlers that have already verified the caller is an admin. We
// detach cookies here because requests via the secret key are not
// per-user.
export function createSupabaseAdminClient() {
  assertSecretSupabaseEnv();
  return createServerClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
