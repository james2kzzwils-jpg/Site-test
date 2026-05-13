'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Tiny client component just for the sign-out action. We keep the
// header on the server so it can read the profile, and only this
// button needs the browser-side session.
export default function SignOutButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const supabase = createSupabaseBrowserClient();
          await supabase.auth.signOut();
          router.push('/portal/login');
          router.refresh();
        });
      }}
      className="border border-[var(--hairline)] px-3 py-[6px] uppercase tracking-[0.16em] text-[var(--foreground)]/55 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
    >
      {pending ? '…' : 'Sign out'}
    </button>
  );
}
