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

        <div className="mt-8 border-t border-white/5 pt-8 text-center">
          <p className="font-mono text-xs text-white/20">
            &copy; {new Date().getFullYear()} {t.footer.brand}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
