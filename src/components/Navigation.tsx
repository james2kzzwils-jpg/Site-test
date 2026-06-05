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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled
          ? 'bg-[#0a0a0a]/80 backdrop-blur-2xl'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-7 lg:px-16 lg:py-8">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="text-[18px] font-semibold tracking-[-0.02em] text-white transition-opacity duration-300 hover:opacity-70"
        >
          JAMES CREATIVE LABS
        </a>

        <div className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                const el = document.querySelector(item.href);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[14px] text-white/30 transition-colors duration-300 hover:text-white"
            >
              {t.nav[item.key]}
            </a>
          ))}

          <button
            onClick={() => scrollTo('#contact')}
            className="rounded-full bg-cyan-400 px-5 py-2 font-mono text-xs font-medium text-black uppercase tracking-wider transition-all hover:bg-cyan-300"
          >
            {t.hero.cta_contact}
          </button>

          <div className="ml-2 flex items-center gap-1 rounded-full border border-white/10 p-1">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 ${
                  locale === lang
                    ? 'bg-white text-[#0a0a0a]'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex flex-col gap-2 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-[1.5px] w-6 bg-white transition-all duration-300 ${
              isMobileOpen ? 'translate-y-[5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-[1.5px] w-6 bg-white transition-all duration-300 ${
              isMobileOpen ? '-translate-y-[5px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      <div
        className={`absolute inset-x-0 top-full overflow-hidden bg-[#0a0a0a]/95 backdrop-blur-2xl transition-all duration-500 md:hidden ${
          isMobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-2 px-8 py-8">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                const el = document.querySelector(item.href);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileOpen(false);
                }
              }}
              className="py-4 text-left text-[18px] text-white/50 transition-colors duration-300 hover:text-white"
            >
              {t.nav[item.key]}
            </a>
          ))}
          <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-6">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-6 py-3 text-[14px] font-medium transition-all duration-300 ${
                  locale === lang
                    ? 'bg-white text-[#0a0a0a]'
                    : 'bg-white/[0.05] text-white/30'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}

            <button
              onClick={() => scrollTo('#contact')}
              className="mt-2 rounded-full bg-cyan-400 px-6 py-3 font-mono text-sm font-medium text-black uppercase tracking-wider transition-all hover:bg-cyan-300"
            >
              {t.hero.cta_contact}
            </button>

            <div className="mt-4 flex items-center gap-2">
              {(['en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang as Locale)}
                  className={`rounded-full border px-4 py-2 font-mono text-xs uppercase transition-all ${
                    locale === lang
                      ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400'
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
