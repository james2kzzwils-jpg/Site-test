'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import en from './en.json';
import ru from './ru.json';

export type Locale = 'en' | 'ru';

const dictionaries: Record<Locale, typeof en> = { en, ru };
const STORAGE_KEY = 'epov:locale';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof en;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// Static-export sites can't read the visitor IP, so we approximate region
// via the browser's preferred language. Any `ru-*` BCP 47 tag flips the
// site to Russian; everything else falls back to English. Manual choice
// is persisted in localStorage and always wins on subsequent visits.
function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') return stored;
  } catch {
    /* localStorage unavailable */
  }
  const langs: readonly string[] = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || 'en'];
  return langs.some((l) => l.toLowerCase().startsWith('ru')) ? 'ru' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR/SSG renders the EN snapshot to keep markup deterministic; the
  // detector runs in a useEffect on the client and may flip to RU.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Browser-only state hydration. We render `en` during SSG to keep
    // the static HTML deterministic, then flip to the visitor's locale
    // on mount. The state update here is intentional — we cannot read
    // navigator/localStorage during the server render.
    const initial = detectInitialLocale();
    if (initial !== 'en') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(initial);
    }
    document.documentElement.lang = initial;
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    try {
      window.localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const t = dictionaries[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
