'use client';

import { useLanguage } from '@/i18n/LanguageContext';

// Proof / trust strip that sits right after the hero (marketing roadmap:
// Workstream B trust signals + P1 homepage foundation). Every fact here
// mirrors copy that already exists in Services, About, and Contact —
// no invented claims.
export default function TrustStrip() {
  const { t } = useLanguage();

  return (
    <section
      aria-label={t.trust.aria_label}
      className="border-b border-[var(--hairline)]"
    >
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-x-12 gap-y-10 px-6 py-12 sm:grid-cols-2 sm:px-10 lg:px-14 xl:grid-cols-4">
        {t.trust.items.map((item) => (
          <div key={item.value} className="flex flex-col gap-3">
            <p className="font-display text-[20px] font-medium tracking-[-0.02em] text-[var(--foreground)]">
              {item.value}
            </p>
            <p className="font-mono text-[11px] uppercase leading-[1.7] tracking-[0.18em] text-[var(--foreground)]/45">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
