'use client';

import { useState, useEffect } from 'react';
import { useLanguage, type Locale } from '@/i18n/LanguageContext';

export default function Navigation() {
  const { locale, setLocale, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { key: 'works', href: '#works' },
    { key: 'services', href: '#services' },
    { key: 'shop', href: '#shop' },
    { key: 'about', href: '#about' },
    { key: 'contact', href: '#contact' },
  ] as const;

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMobileOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled
          ? 'bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.04]'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-5 lg:px-12">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-mono text-[13px] tracking-[0.2em] text-white/80 uppercase transition-colors duration-300 hover:text-white"
        >
          JCL<span className="text-cyan-400">_</span>
        </button>

        <div className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => scrollTo(item.href)}
              className="font-mono text-[11px] tracking-[0.15em] text-white/35 uppercase transition-colors duration-300 hover:text-white/80"
            >
              {t.nav[item.key]}
            </button>
          ))}

          <div className="ml-2 flex items-center gap-0.5 rounded-full border border-white/[0.06] p-1">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-300 ${
                  locale === lang
                    ? 'bg-white/[0.08] text-white/80'
                    : 'text-white/25 hover:text-white/50'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-px w-6 bg-white/70 transition-all duration-300 ${
              isMobileOpen ? 'translate-y-[3.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-6 bg-white/70 transition-all duration-300 ${
              isMobileOpen ? '-translate-y-[3.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      <div
        className={`absolute inset-x-0 top-full overflow-hidden border-b border-white/[0.04] bg-[#0a0a0a]/95 backdrop-blur-2xl transition-all duration-500 md:hidden ${
          isMobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 border-transparent'
        }`}
      >
        <div className="flex flex-col gap-1 px-8 py-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => scrollTo(item.href)}
              className="py-3 text-left font-mono text-[13px] tracking-[0.1em] text-white/50 uppercase transition-colors duration-300 hover:text-white"
            >
              {t.nav[item.key]}
            </button>
          ))}
          <div className="mt-4 flex items-center gap-2 border-t border-white/[0.04] pt-5">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full border px-5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-300 ${
                  locale === lang
                    ? 'border-white/15 bg-white/[0.06] text-white/70'
                    : 'border-white/[0.06] text-white/25'
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
