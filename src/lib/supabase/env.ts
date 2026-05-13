// Single source of truth for Supabase env vars.
//
// We use the new (2024+) key naming on purpose: `sb_publishable_*` is the
// public key replacing the legacy `anon` JWT, `sb_secret_*` is the
// service-role replacement. Both are first-class in @supabase/ssr; only
// the env var names are our convention.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

export function assertPublicSupabaseEnv(): void {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing Supabase public env vars. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (dev) or your ' +
        'hosting provider (Vercel project env).'
    );
  }
}

export function assertSecretSupabaseEnv(): void {
  assertPublicSupabaseEnv();
  if (!SUPABASE_SECRET_KEY) {
    throw new Error(
      'Missing SUPABASE_SECRET_KEY. Required for admin-only server actions ' +
        '(magic-link issuance, role promotion). Never expose this key to the ' +
        'browser.'
    );
  }
}
