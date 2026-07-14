'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Showreel overlay — the 9:16 vertical video flies onto the screen
 * and sits over the hero particle field, offset to the left.
 * Cinematic black backdrop, Escape / backdrop / × to close.
 */
export default function ShowreelModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Auto-play / pause
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label="Showreel"
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[9998] flex items-center bg-black/90 backdrop-blur-md transition-all duration-500 ${
        open
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
      style={{ cursor: 'auto' }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-white/5 font-mono text-[18px] text-white/70 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        style={{ cursor: 'pointer' }}
      >
        ✕
      </button>

      {/* Label */}
      <p className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
        <span className="text-[var(--accent)]">◆</span> Showreel 2026
      </p>

      {/* Video container — 9:16 vertical, offset left on desktop, centered on mobile */}
      <div
        className={`relative mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:mx-0 ${
          open
            ? 'translate-x-0 translate-y-0 scale-100 opacity-100'
            : '-translate-x-12 translate-y-8 scale-90 opacity-0'
        }`}
        style={{
          /* Offset ~20% from left on desktop, centered on mobile */
          marginLeft: 'clamp(1rem, 15vw, 20vw)',
        }}
      >
        {/* Accent glow behind the video */}
        <div
          aria-hidden="true"
          className="absolute -inset-4 rounded-2xl opacity-30 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, var(--accent-glow) 0%, transparent 70%)',
          }}
        />

        <div className="relative overflow-hidden rounded-lg border border-[var(--accent)]/20 shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_40px_var(--accent-glow)]">
          {/* 9:16 aspect container */}
          <div
            className="relative bg-black"
            style={{
              width: 'min(45vh, 340px)',
              aspectRatio: '9 / 16',
            }}
          >
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src="/showreel/showreel.mp4"
              controls
              playsInline
              preload="metadata"
            />
          </div>

          {/* Scanline overlay */}
          <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.06] [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)]" />
        </div>

        {/* Bottom caption */}
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
          Andrey Epov — Selected Works
        </p>
      </div>

      {/* Right side decorative text (desktop only) */}
      <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/15 [writing-mode:vertical-rl]">
          CG Generalist & Motion Designer
        </p>
      </div>
    </div>
  );
}
