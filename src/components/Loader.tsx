'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Loader() {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startDelay = reduce ? 200 : 1500;
    const removeDelay = reduce ? 400 : 2300;

    document.documentElement.style.overflow = 'hidden';

    const t1 = window.setTimeout(() => setHidden(true), startDelay);
    const t2 = window.setTimeout(() => {
      setDone(true);
      document.documentElement.style.overflow = '';
    }, removeDelay);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (done) return null;

  const label = t.loader.label;
  // Highlight the cluster of 'o' characters so we can stretch them
  const match = label.match(/^([^o]*?)(o+)(.*)$/i);
  const head = match?.[1] ?? label;
  const stretched = match?.[2] ?? '';
  const tail = match?.[3] ?? '';

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#050505] text-[#f5f3ee] transition-opacity duration-700 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden={hidden}
    >
      <div className="flex w-full items-center justify-between px-8 lg:px-16">
        <span className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f5f3ee]/40">
          <span aria-hidden="true" className="h-[6px] w-[6px] rounded-full bg-[var(--accent)]" />
          {t.brand.name}
        </span>
        <span className="font-display text-[clamp(2rem,7vw,5rem)] font-medium tracking-[-0.04em]">
          {head}
          <span className="loader-stretch text-[var(--accent)]">{stretched}</span>
          {tail}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#f5f3ee]/40">
          2026 ©
        </span>
      </div>
    </div>
  );
}
