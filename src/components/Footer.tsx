'use client';

import { useLanguage } from '@/i18n/LanguageContext';

const SOCIAL_LINKS = [
  { name: 'Behance', href: 'https://www.behance.net/2kzz' },
  { name: 'Vimeo', href: 'https://vimeo.com/1166636825' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/andrey-epov-cg' },
  { name: 'Instagram', href: 'https://www.instagram.com/2kzz___/' },
  { name: 'Telegram', href: 'https://t.me/aepov_2kzz' },
] as const;

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

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-white/30 uppercase tracking-wider transition-colors hover:text-cyan-400"
              >
                {link.name}
              </a>
            ))}
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
