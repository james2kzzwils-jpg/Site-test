'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { resetConsent } from '@/components/CookieConsent';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--hairline)]">
      {/* Ambient accent glow — pure CSS, no raster asset. A faint mood piece
          in the brand palette (black + acid accent), replacing the old
          footer-bg.webp. Decorative (aria-hidden), pointer-events-none. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
      >
        {/* Primary glow anchored to the bottom-right corner */}
        <div
          className="absolute -bottom-1/3 -right-1/5 h-[85%] w-[70%] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--accent-glow) 0%, rgba(212, 255, 0, 0.05) 45%, transparent 72%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Faint vertical wash so the corner glow dissolves into the page */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              'linear-gradient(to top, rgba(212, 255, 0, 0.035) 0%, transparent 65%)',
          }}
        />
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
