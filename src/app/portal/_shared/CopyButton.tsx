'use client';

import { useState } from 'react';

/**
 * Small client-side button that writes `value` to the clipboard
 * and shows a transient "copied" label for ~1.6s. Used in places
 * where the surrounding page is a server component (e.g. the test
 * login banner) so we keep the copy interaction isolated.
 */
export default function CopyButton({
  value,
  label,
  labelCopied,
  className = '',
}: {
  value: string;
  label: string;
  labelCopied: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older Safari / no clipboard API — fall back to the
      // ancient execCommand pathway. We don't bubble errors:
      // the user still sees the raw URL in the banner.
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border border-[var(--accent)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--background)] ${className}`}
    >
      {copied ? labelCopied : label}
    </button>
  );
}
