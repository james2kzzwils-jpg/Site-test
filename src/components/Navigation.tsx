'use client';

import { useState, useEffect } from 'react';
import { useLanguage, type Locale } from '@/i18n/LanguageContext';

export default function Navigation() {
  const { locale, setLocale, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-mono text-sm tracking-widest text-white/90 uppercase hover:text-cyan-400 transition-colors"
        >
          JCL<span className="text-cyan-400">_</span>
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => scrollTo(item.href)}
              className="font-mono text-xs tracking-wider text-white/50 uppercase transition-colors hover:text-cyan-400"
            >
              {t.nav[item.key]}
            </button>
          ))}

          <div className="ml-4 flex items-center gap-1 rounded-full border border-white/10 p-1">
            {(['en', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang as Locale)}
                className={`rounded-full px-3 py-1 font-mono text-xs uppercase transition-all ${
                  locale === lang
                    ? 'bg-cyan-400/20 text-cyan-400'
                    : 'text-white/40 hover:text-white/70'
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
            className={`block h-px w-6 bg-white transition-all ${
              isMobileOpen ? 'translate-y-[3.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-6 bg-white transition-all ${
              isMobileOpen ? '-translate-y-[3.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      {isMobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-6 py-8">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => scrollTo(item.href)}
                className="font-mono text-sm tracking-wider text-white/60 uppercase text-left transition-colors hover:text-cyan-400"
              >
                {t.nav[item.key]}
              </button>
            ))}
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
      )}
    </header>
  );
}
