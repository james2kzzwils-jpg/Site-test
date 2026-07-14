'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Full-screen showreel modal with cinematic black backdrop.
 * Closes on Escape, on backdrop click, or via the × button.
 * The video auto-plays when opened and pauses when closed.
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
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-500 ${
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

      {/* Video container */}
      <div
        className={`relative w-[92vw] max-w-[1200px] overflow-hidden rounded-sm border border-[var(--hairline)] shadow-[0_0_80px_rgba(0,0,0,0.6)] transition-transform duration-500 ${
          open ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            src="/showreel/showreel.mp4"
            controls
            playsInline
            preload="metadata"
          />
        </div>
        {/* Scanline overlay */}
        <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-10 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_3px)]" />
      </div>
    </div>
  );
}
