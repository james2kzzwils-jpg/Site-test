'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Status =
  | { type: 'working'; message: string }
  | { type: 'error'; message: string };

function normalizeRedirectPath(redirect: string | null) {
  if (!redirect || !redirect.startsWith('/')) return '/portal';
  return redirect;
}

function readHashParams() {
  if (typeof window === 'undefined') return new URLSearchParams();
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

export default function AuthCompleteClient() {
  const [status, setStatus] = useState<Status>({
    type: 'working',
    message: 'Completing sign-in…',
  });

  const redirectPath = useMemo(() => {
    if (typeof window === 'undefined') return '/portal';
    const url = new URL(window.location.href);
    return normalizeRedirectPath(url.searchParams.get('redirect'));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const hashParams = readHashParams();

      const code = url.searchParams.get('code');
      const tokenHash = url.searchParams.get('token_hash');
      const otpTypeParam = url.searchParams.get('type');
      const authError =
        url.searchParams.get('error_description') ??
        url.searchParams.get('error') ??
        hashParams.get('error_description') ??
        hashParams.get('error');

      if (authError) {
        throw new Error(authError);
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (otpTypeParam ?? 'magiclink') as EmailOtpType,
        });
        if (error) throw error;
      } else {
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('missing_code');
      }

      if (!cancelled) {
        window.location.replace(redirectPath);
      }
    }

    finishAuth().catch((error) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : 'Unexpected error';
      setStatus({
        type: 'error',
        message,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [redirectPath]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-sm border border-[var(--hairline)] p-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
          ◆ Auth
        </p>
        <h1 className="mb-3 font-display text-[clamp(1.8rem,4vw,2.4rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {status.type === 'working' ? 'Completing sign-in' : 'Sign-in failed'}
        </h1>
        <p className="text-[14px] leading-[1.7] text-[var(--foreground)]/70">
          {status.message}
        </p>
        {status.type === 'error' ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/portal/login"
              className="border border-[var(--accent)] bg-[var(--accent)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--background)]"
            >
              Back to login
            </Link>
            <Link
              href={redirectPath}
              className="border border-[var(--hairline)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/65"
            >
              Open portal
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
