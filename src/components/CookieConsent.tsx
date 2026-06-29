'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

const CONSENT_KEY = 'epov:cookie-consent';
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export type ConsentValue = 'accepted' | 'rejected';

/** Read stored consent. Returns null when no choice has been made or it has expired. */
export function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const { value, expires } = JSON.parse(raw) as {
      value: ConsentValue;
      expires: number;
    };
    if (Date.now() > expires) {
      window.localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function setStoredConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ value, expires: Date.now() + CONSENT_TTL_MS }),
    );
  } catch {
    /* localStorage unavailable */
  }
}

/** Clear stored consent and re-show the banner. Call from any component. */
export function resetConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* localStorage unavailable */
  }
  window.dispatchEvent(new Event('reset-consent'));
}

/**
 * Cookie-consent banner (GDPR-compliant).
 *
 * - Two equally-prominent buttons: "Accept all" and "Only essential".
 * - No pre-checked boxes.
 * - Links to the Privacy Policy page.
 * - Stores choice in localStorage for 1 year.
 * - Fires a custom `consent-changed` event so `<ConsentAnalytics>` can react.
 * - Listens for `reset-consent` event to re-show the banner (e.g. from footer link).
 */
export default function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only when the user hasn't made a choice yet.
    if (getStoredConsent() === null) {
      setVisible(true);
    }

    // Allow external components (e.g. Footer "Cookie Settings" link) to
    // re-open the banner by dispatching a `reset-consent` event.
    const onReset = () => setVisible(true);
    window.addEventListener('reset-consent', onReset);
    return () => window.removeEventListener('reset-consent', onReset);
  }, []);

  const handleChoice = useCallback((value: ConsentValue) => {
    setStoredConsent(value);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('consent-changed', { detail: value }));
  }, []);

  if (!visible) return null;

  const cc = t.cookieConsent;

  return (
    <div
      role="dialog"
      aria-label={cc.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-[720px] rounded-2xl border border-[var(--hairline-strong)] bg-[#0c0c0c]/95 px-6 py-5 shadow-[0_-4px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-8 sm:py-6">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
          <span className="accent-diamond">◆</span> Cookies
        </p>

        <p className="text-[13px] leading-relaxed text-[var(--foreground)]/70 sm:text-[14px]">
          {cc.text}{' '}
          <Link
            href="/privacy"
            className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            data-cursor="hover"
          >
            {cc.policyLink}
          </Link>
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="flex-1 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--background)] transition-opacity hover:opacity-85"
            data-cursor="hover"
          >
            {cc.acceptAll}
          </button>
          <button
            type="button"
            onClick={() => handleChoice('rejected')}
            className="flex-1 rounded-lg border border-[var(--hairline-strong)] bg-transparent px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--foreground)]/70 transition-colors hover:border-[var(--foreground)]/40 hover:text-[var(--foreground)]"
            data-cursor="hover"
          >
            {cc.rejectAll}
          </button>
        </div>
      </div>
    </div>
  );
}
