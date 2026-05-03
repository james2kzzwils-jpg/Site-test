'use client';

import { useState, useEffect } from 'react';
import { useLanguage, type Locale } from '@/i18n/LanguageContext';

interface NavigationProps {
  /** When true, the brand link goes to "/" instead of scrolling to top. */
  rooted?: boolean;
}

export default function Navigation({ rooted = false }: NavigationProps) {
  const { locale, setLocale, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { key: 'works', href: '#works' },
    { key: 'services', href: '#services' },
    { key: 'shop', href: '#shop' },
    { key: 'about', href: '#about' },
    { key: 'contact', href: '#contact' },
  ] as const;

  const brandHref = rooted ? '/' : '#';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled
          ? 'border-b border-[var(--hairline)] bg-[#050505]/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 sm:px-10 lg:px-14 lg:py-6">
        <a
          href={brandHref}
          onClick={(e) => {
            if (rooted) return;
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group flex items-center gap-3"
          data-cursor="hover"
        >
          <span className="monogram text-[26px] leading-none text-[var(--foreground)]">
            {t.brand.monogram}
          </span>
          {/* Brand chip-line — only on very wide screens to avoid colliding with nav links */}
          <span className="hidden items-center gap-2 xl:flex">
            {t.brand.roles.slice(0, 1).map((r) => (
              <span
                key={r}
                className="rounded-full border border-[var(--hairline)] px-3 py-[5px] font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--foreground)]/55"
              >
                {r}
              </span>
            ))}
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={rooted ? `/${item.href}` : item.href}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors duration-300 hover:text-[var(--foreground)]"
              data-cursor="hover"
            >
              {t.nav[item.key]}
            </a>
          ))}

          <div className="ml-2 flex items-center gap-1 rounded-full border border-[var(--hairline)] px-1 py-1">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                  locale === lang
                    ? 'bg-[var(--accent)] text-[var(--background)]'
                    : 'text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70'
                }`}
                data-cursor="hover"
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen((v) => !v)}
          className="flex flex-col gap-[5px] md:hidden"
          aria-label="Toggle menu"
          data-cursor="hover"
        >
          <span
            className={`block h-px w-7 bg-[var(--foreground)] transition-all duration-300 ${
              isMobileOpen ? 'translate-y-[6px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-7 bg-[var(--foreground)] transition-all duration-300 ${
              isMobileOpen ? '-translate-y-[6px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      <div
        className={`absolute inset-x-0 top-full overflow-hidden border-t border-[var(--hairline)] bg-[#050505]/95 backdrop-blur-xl transition-[max-height,opacity] duration-500 md:hidden ${
          isMobileOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-2 px-6 py-8 sm:px-10">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={rooted ? `/${item.href}` : item.href}
              onClick={() => setIsMobileOpen(false)}
              className="py-3 font-display text-[26px] leading-tight tracking-[-0.02em] text-[var(--foreground)]/80 transition-colors duration-300 hover:text-[var(--foreground)]"
            >
              {t.nav[item.key]}
            </a>
          ))}
          <div className="mt-6 flex items-center gap-2 border-t border-[var(--hairline)] pt-6">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${
                  locale === lang
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'border border-[var(--hairline)] text-[var(--foreground)]/40'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
