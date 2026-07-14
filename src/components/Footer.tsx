'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { resetConsent } from '@/components/CookieConsent';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--hairline)]">
      {/* Abstract luminous background — sits behind footer content as a
          faint mood piece. Decorative (aria-hidden), pointer-events-none. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
      >
        <img
          src="/footer-bg.webp"
          alt=""
          className="absolute bottom-0 right-0 h-full w-full object-cover opacity-40"
          style={{ objectPosition: 'right bottom' }}
          loading="lazy"
        />
        {/* Fade edges to match site background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-transparent" />
      </div>

      {/* Big monogram + tagline */}
      <div className="relative mx-auto max-w-[1600px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
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
                <span className="accent-diamond">◆</span> Sitemap
              </p>
              <div className="flex flex-col gap-3">
                {(['works', 'services', 'about', 'faq', 'contact'] as const).map((item) => (
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
                <span className="accent-diamond">◆</span> Social
              </p>
              <div className="flex flex-col gap-3">
                {(
                  [
                    ['Behance', 'https://www.behance.net/2kzz'],
                    ['Vimeo', 'https://vimeo.com/1166636825'],
                    ['LinkedIn', 'https://www.linkedin.com/in/andrey-epov-cg'],
                    ['Telegram', 'https://t.me/aepov_2kzz'],
                    ['Instagram', 'https://www.instagram.com/2kzz___/'],
                  ] as const
                ).map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover-line inline-block w-fit pb-[3px] font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
                    data-cursor="hover"
                  >
                    {label} <span className="text-[var(--accent)]">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center sm:px-10 lg:px-14">
          <p className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            <span>© {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}</span>
            <Link
              href="/privacy"
              className="transition-colors hover:text-[var(--foreground)]/60"
              data-cursor="hover"
            >
              {t.footer.privacy}
            </Link>
            <button
              type="button"
              onClick={resetConsent}
              className="uppercase transition-colors hover:text-[var(--foreground)]/60"
              data-cursor="hover"
            >
              {t.footer.cookieSettings}
            </button>
          </p>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] animate-pulse rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
            />
            {t.footer.available}
          </p>
        </div>
      </div>
    </footer>
  );
}


