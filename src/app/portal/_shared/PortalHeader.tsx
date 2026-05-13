import Link from 'next/link';
import SignOutButton from './SignOutButton';

interface PortalHeaderProps {
  label: string;
  email: string;
  role: 'admin' | 'client';
}

// Compact in-portal header: section label on the left, identity + sign
// out on the right. Lives under /portal — never rendered on the public
// marketing site.
export default function PortalHeader({ label, email, role }: PortalHeaderProps) {
  return (
    <header className="mb-12 flex items-center justify-between border-b border-[var(--hairline)] pb-6">
      <div className="flex items-baseline gap-4">
        <Link
          href="/portal"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/55"
        >
          <span className="text-[var(--accent)]">◆</span> Epov Portal
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/35">
          / {label}
        </span>
      </div>
      <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/55">
        <span>
          {role} <span className="text-[var(--foreground)]/35">·</span> {email}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
