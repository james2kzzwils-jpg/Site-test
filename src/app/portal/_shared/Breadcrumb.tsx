import Link from 'next/link';
import { Fragment } from 'react';

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  trail: Crumb[];
}

// Compact breadcrumb row used at the top of every portal page so the
// admin (and client) can hop back up the tree. The last item is
// rendered as plain text (current page); everything before it is a
// link.
export default function Breadcrumb({ trail }: BreadcrumbProps) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
      {trail.map((crumb, idx) => {
        const last = idx === trail.length - 1;
        return (
          <Fragment key={`${crumb.label}-${idx}`}>
            {crumb.href && !last ? (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-[var(--accent)]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={last ? 'text-[var(--foreground)]/85' : undefined}>
                {crumb.label}
              </span>
            )}
            {last ? null : (
              <span className="text-[var(--foreground)]/25">/</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
