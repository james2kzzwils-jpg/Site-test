'use client';

import { useSyncExternalStore } from 'react';

/**
 * SSR-safe matchMedia hook.
 * Returns `fallback` during SSR / pre-mount, then the live value on the client.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback
  );
}
