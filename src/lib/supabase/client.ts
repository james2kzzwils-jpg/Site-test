'use client';

import { createBrowserClient } from '@supabase/ssr';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  assertPublicSupabaseEnv,
} from './env';

// Browser-side Supabase client. Holds the publishable key, never the
// secret key. Cookie handling is delegated to @supabase/ssr which
// matches what the server-side helper expects.
export function createSupabaseBrowserClient() {
  assertPublicSupabaseEnv();
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
