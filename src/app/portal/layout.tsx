import type { ReactNode } from 'react';

// Portal pages are always dynamic — they depend on the user's session
// cookie which is a Request-time API. Declaring it here means the
// editorial marketing routes stay SSG without leaking session state.
export const dynamic = 'force-dynamic';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10 lg:px-14">
        {children}
      </div>
    </div>
  );
}
