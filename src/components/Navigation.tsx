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
          ? 'bg-[#0a0a0a]/70 backdrop-blur-2xl'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-6 lg:px-16">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-[14px] font-medium tracking-[-0.01em] text-white/70 transition-colors duration-300 hover:text-white"
        >
          JCL
        </button>

        <div className="hidden items-center gap-12 md:flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => scrollTo(item.href)}
              className="text-[13px] text-white/25 transition-colors duration-300 hover:text-white/60"
            >
              {t.nav[item.key]}
            </button>
          ))}

          <div className="flex items-center gap-1">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-3 py-1.5 text-[12px] transition-all duration-300 ${
                  locale === lang
                    ? 'bg-white/[0.08] text-white/70'
                    : 'text-white/20 hover:text-white/40'
                }`}
              >
                {lang.toUpperCase()}
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
            className={`block h-px w-5 bg-white/60 transition-all duration-300 ${
              isMobileOpen ? 'translate-y-[3.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-5 bg-white/60 transition-all duration-300 ${
              isMobileOpen ? '-translate-y-[3.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      <div
        className={`absolute inset-x-0 top-full overflow-hidden bg-[#0a0a0a]/95 backdrop-blur-2xl transition-all duration-500 md:hidden ${
          isMobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col px-8 py-8">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => scrollTo(item.href)}
              className="py-4 text-left text-[15px] text-white/40 transition-colors duration-300 hover:text-white"
            >
              {t.nav[item.key]}
            </button>
          ))}
          <div className="mt-6 flex items-center gap-3 border-t border-white/[0.04] pt-6">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-5 py-2.5 text-[13px] transition-all duration-300 ${
                  locale === lang
                    ? 'bg-white/[0.08] text-white/60'
                    : 'text-white/20'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
