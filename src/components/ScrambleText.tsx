'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * ScrambleText — terminal-style "decode" animation: the label starts
 * as random glyphs and resolves left-to-right into the real text.
 * Runs once when the element first scrolls into view and again on
 * hover. Respects prefers-reduced-motion (renders plain text).
 */

const GLYPHS = '!<>-_\\/[]{}—=+*^?#◆';

export default function ScrambleText({
  text,
  className,
  scrambleOnHover = true,
  duration = 900,
}: {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);

  const run = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const reveal = Math.floor(t * text.length);
      let out = text.slice(0, reveal);
      for (let i = reveal; i < text.length; i++) {
        const ch = text[i];
        out +=
          ch === ' '
            ? ' '
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        el.textContent = text;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [text, duration]);

  // Decode once when the label first becomes visible.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [run]);

  return (
    <span
      ref={ref}
      className={className}
      onMouseEnter={scrambleOnHover ? run : undefined}
    >
      {text}
    </span>
  );
}
