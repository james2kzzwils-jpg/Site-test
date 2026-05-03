'use client';

import { useLanguage } from '@/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-white/[0.06] py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-8 lg:px-16">
        <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-4 text-[18px] font-semibold tracking-[-0.02em] text-white">
              {t.footer.brand}
            </p>
            <p className="text-[14px] leading-[1.6] text-white/25">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <p className="mb-5 text-[12px] font-medium tracking-[0.1em] text-white/15 uppercase">
              Navigation
            </p>
            <div className="flex flex-col gap-3">
              {['works', 'services', 'shop', 'about', 'contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(`#${item}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[14px] text-white/30 transition-colors duration-300 hover:text-white/60"
                >
                  {t.nav[item as keyof typeof t.nav]}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-5 text-[12px] font-medium tracking-[0.1em] text-white/15 uppercase">
              Social
            </p>
            <div className="flex flex-col gap-3">
              {['Behance', 'Vimeo', 'LinkedIn', 'Telegram'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-[14px] text-white/30 transition-colors duration-300 hover:text-white/60"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-5 text-[12px] font-medium tracking-[0.1em] text-white/15 uppercase">
              Contact
            </p>
            <div className="flex flex-col gap-3">
              <a href="mailto:hello@jamescreativelabs.com" className="text-[14px] text-white/30 transition-colors duration-300 hover:text-white/60">
                hello@jamescreativelabs.com
              </a>
              <a href="https://t.me/jamescreativelabs" className="text-[14px] text-white/30 transition-colors duration-300 hover:text-white/60">
                @jamescreativelabs
              </a>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-white/[0.04] pt-8 sm:flex-row sm:items-center">
          <p className="text-[12px] text-white/15">
            &copy; {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}
          </p>
          <p className="text-[12px] text-white/10">
            Motion Design & CG Solutions
          </p>
        </div>
      </div>
    </footer>
  );
}
