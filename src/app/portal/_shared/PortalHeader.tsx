import Link from 'next/link';
import SignOutButton from './SignOutButton';
import LocaleSwitcher from './LocaleSwitcher';
import { getPortalLocale, t } from '@/lib/portal/i18n';

interface PortalHeaderProps {
  label: string;
  email: string;
  role: 'admin' | 'client';
}

// Compact in-portal header: section label on the left, identity +
// locale toggle + sign out on the right. Lives under /portal — never
// rendered on the public marketing site.
export default async function PortalHeader({ label, email, role }: PortalHeaderProps) {
  const locale = await getPortalLocale();
  const roleLabel = role === 'admin' ? t(locale, 'role.admin') : t(locale, 'role.client');

  return (
    <header className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hairline)] pb-6">
      <div className="flex items-baseline gap-4">
        <Link
          href="/portal"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55"
        >
          <span className="text-[var(--accent)]">◆</span> {t(locale, 'header.brand')}
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/35">
          / {label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55">
        <span>
          {roleLabel} <span className="text-[var(--foreground)]/35">·</span> {email}
        </span>
        <LocaleSwitcher current={locale} />
        <SignOutButton label={t(locale, 'header.signout')} />
      </div>
    </header>
  );
}
