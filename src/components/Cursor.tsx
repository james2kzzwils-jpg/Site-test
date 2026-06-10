'use client';

import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

type CursorMode = 'default' | 'hover' | 'view';

export default function Cursor() {
  const isFinePointer = useMediaQuery(
    '(hover: hover) and (pointer: fine)',
    false
  );
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CursorMode>('default');
  const [label, setLabel] = useState<string>('');

  // Half-size of the ring in px — kept in a ref so the rAF tick (set up
  // once in useEffect) always sees the latest mode-driven value without
  // re-binding. Ramped toward the target half-size so the offset animates
  // in step with the CSS width/height transition (300ms).
  const targetHalfRef = useRef(18);
  const renderedHalfRef = useRef(18);

  useEffect(() => {
    targetHalfRef.current =
      mode === 'view' ? 64 : mode === 'hover' ? 24 : 18;
  }, [mode]);

  useEffect(() => {
    if (!isFinePointer) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.transform = `translate3d(${targetX - 3}px, ${targetY - 3}px, 0)`;
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      renderedHalfRef.current +=
        (targetHalfRef.current - renderedHalfRef.current) * 0.18;
      const half = renderedHalfRef.current;
      ring.style.transform = `translate3d(${ringX - half}px, ${ringY - half}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const updateForTarget = (el: HTMLElement | null) => {
      if (!el) {
        setMode('default');
        setLabel('');
        return;
      }
      const cursorEl = el.closest<HTMLElement>('[data-cursor]');
      if (cursorEl) {
        const m = (cursorEl.dataset.cursor as CursorMode) || 'hover';
        setMode(m);
        setLabel(cursorEl.dataset.cursorLabel || '');
        return;
      }
      const interactive = el.closest('a, button, input, textarea, select, label');
      if (interactive) {
        setMode('hover');
        setLabel('');
      } else {
        setMode('default');
        setLabel('');
      }
    };

    const onOver = (e: MouseEvent) => updateForTarget(e.target as HTMLElement);
    const onOut = () => updateForTarget(null);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onOut);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onOut);
    };
  }, [isFinePointer]);

  if (!isFinePointer) return null;

  const ringSize =
    mode === 'view'
      ? 'h-32 w-32 text-[11px]'
      : mode === 'hover'
      ? 'h-12 w-12'
      : 'h-9 w-9';

  const isView = mode === 'view';

  return (
    <>
      <div
        ref={dotRef}
        className={`pv-cursor h-[6px] w-[6px] rounded-full ${
          isView ? 'bg-[var(--accent)]' : 'is-blend bg-[#f5f3ee]'
        }`}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={`pv-cursor flex items-center justify-center rounded-full backdrop-blur-[3px] transition-[width,height,background-color,color,border-color,box-shadow] duration-300 ease-out ${ringSize} ${
          isView
            ? 'border bg-[var(--accent)] text-[var(--background)] border-[var(--accent)] shadow-[0_0_48px_8px_var(--accent-glow)]'
            : mode === 'hover'
            ? 'border border-[var(--accent)]/70 bg-[var(--accent)]/[0.06] text-transparent shadow-[0_0_36px_4px_var(--accent-glow)]'
            : 'is-blend border border-[#f5f3ee]/60 bg-transparent text-transparent'
        }`}
        aria-hidden="true"
      >
        {isView && (
          <span
            className="text-center font-mono uppercase tracking-[0.18em] [text-indent:0.18em]"
          >
            {label || 'View'}
          </span>
        )}
      </div>
    </>
  );
}
