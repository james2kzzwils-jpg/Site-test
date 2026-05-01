'use client';

import { useLanguage } from '@/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="font-mono text-sm tracking-widest text-white/60 uppercase">
              {t.footer.brand}
            </p>
            <p className="mt-1 font-mono text-xs text-white/30">
              {t.footer.tagline}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="font-mono text-xs text-white/30 uppercase tracking-wider transition-colors hover:text-cyan-400"
            >
              Behance
            </a>
            <a
              href="#"
              className="font-mono text-xs text-white/30 uppercase tracking-wider transition-colors hover:text-cyan-400"
            >
              Vimeo
            </a>
            <a
              href="#"
              className="font-mono text-xs text-white/30 uppercase tracking-wider transition-colors hover:text-cyan-400"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="font-mono text-xs text-white/30 uppercase tracking-wider transition-colors hover:text-cyan-400"
            >
              Telegram
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8 text-center">
          <p className="font-mono text-xs text-white/20">
            &copy; {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
