'use client';

import { useEffect, useState } from 'react';

/**
 * Floating scroll-to-top button — appears after scrolling 600px.
 * Same style as the one in ProjectDetail (bottom-left, accent ring).
 */
export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className={`fixed bottom-11 left-11 z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)]/45 bg-[var(--background)]/90 font-mono text-[20px] leading-none text-[var(--accent)] shadow-[0_6px_24px_rgba(0,0,0,0.45)] backdrop-blur transition-[opacity,transform,background-color,border-color] duration-300 hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.14] hover:text-[var(--accent)] ${
        show
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}
      data-cursor="hover"
    >
      ↑
    </button>
  );
}
