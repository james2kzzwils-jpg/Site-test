'use client';

import { useLanguage } from '@/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-16 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">
        <div className="flex flex-col items-start justify-between gap-12 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-medium text-white/40">
              {t.footer.brand}
            </p>
            <p className="mt-2 text-[13px] text-white/15">
              {t.footer.tagline}
            </p>
          </div>

          <div className="flex items-center gap-10">
            {['Behance', 'Vimeo', 'LinkedIn', 'Telegram'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-[13px] text-white/15 transition-colors duration-300 hover:text-white/40"
              >
                {social}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-white/[0.04] pt-8">
          <p className="text-[12px] text-white/10">
            &copy; {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
