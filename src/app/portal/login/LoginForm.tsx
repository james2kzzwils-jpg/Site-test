'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface LoginFormProps {
  redirectTo: string;
  initialError?: string;
}

// Magic-link form. Submits the email to Supabase, which dispatches an
// OTP email; the callback in /auth/callback exchanges the code on
// return. We never read or store the password — there isn't one.
export default function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('redirect', redirectTo);
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callback.toString() },
      });
      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-sm border border-[var(--hairline)] p-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
          ◆ Link sent
        </p>
        <p className="text-[14px] leading-[1.7] text-[var(--foreground)]/70">
          Check your inbox for an email from Supabase. The link signs you in
          and expires in 60 minutes. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-[var(--hairline)] bg-transparent px-4 py-3 text-[14px] outline-none focus:border-[var(--accent)]"
          placeholder="you@studio.com"
        />
      </label>
      {error ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#ff6363]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--background)] transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Send magic link'}
      </button>
    </form>
  );
}
