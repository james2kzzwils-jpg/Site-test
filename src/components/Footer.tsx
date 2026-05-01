'use client';

import { useLanguage } from '@/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-white/[0.04] py-16">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[13px] tracking-[0.2em] text-white/60 uppercase">
              {t.footer.brand}
            </p>
            <p className="mt-2 text-[13px] text-white/20">
              {t.footer.tagline}
            </p>
          </div>

          <div className="flex items-center gap-8">
            {['Behance', 'Vimeo', 'LinkedIn', 'Telegram'].map((social) => (
              <a
                key={social}
                href="#"
                className="font-mono text-[11px] tracking-[0.1em] text-white/20 uppercase transition-colors duration-300 hover:text-white/60"
              >
                {social}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.04] pt-8">
          <p className="font-mono text-[11px] tracking-[0.1em] text-white/15">
            &copy; {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
