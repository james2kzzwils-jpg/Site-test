import type { PortalLocale } from '@/lib/portal/i18n';
import { switchLocaleAction } from './locale-action';

interface LocaleSwitcherProps {
  current: PortalLocale;
}

// Two-button language toggle shown in the portal header. Posts to a
// server action that writes the cookie and revalidates the layout.
export default function LocaleSwitcher({ current }: LocaleSwitcherProps) {
  return (
    <form action={switchLocaleAction} className="flex items-center gap-[2px]">
      {(['en', 'ru'] as const).map((loc) => {
        const active = loc === current;
        return (
          <button
            key={loc}
            type="submit"
            name="locale"
            value={loc}
            aria-pressed={active}
            className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
              active
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-[var(--hairline)] text-[var(--foreground)]/55 hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {loc}
          </button>
        );
      })}
    </form>
  );
}
