'use client';

import { useLanguage } from '@/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[var(--hairline)]">
      {/* Big monogram + tagline */}
      <div className="mx-auto max-w-[1600px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
          <div>
            <p className="font-display text-[clamp(2.4rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--foreground)]">
              {t.footer.brand}
            </p>
            <p className="mt-6 max-w-md font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
              {t.footer.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                ◆ Sitemap
              </p>
              <div className="flex flex-col gap-3">
                {(['works', 'services', 'shop', 'about', 'contact'] as const).map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    className="hover-line inline-block w-fit pb-[3px] font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
                    data-cursor="hover"
                  >
                    {t.nav[item]}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/40">
                ◆ Social
              </p>
              <div className="flex flex-col gap-3">
                {['Behance', 'Vimeo', 'LinkedIn', 'Telegram'].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="hover-line inline-block w-fit pb-[3px] font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
                    data-cursor="hover"
                  >
                    {s} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-10 lg:px-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            © {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            {t.footer.available}
          </p>
        </div>
      </div>
    </footer>
  );
}
