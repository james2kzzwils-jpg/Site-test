'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Showreel overlay — the reel is "born from the particles": the hero
 * particle field converges toward the panel spot (see Scene3D `reelOpen`),
 * the backdrop stays translucent so the field keeps living behind, and
 * the 9:16 panel scales up out of the glow. The panel is centred on
 * the same anchor axis as the particle planet — ~77% of the viewport
 * width, right under the "CG Generalist" role chip on desktop — in the
 * intentionally empty half of the hero, opposite the left-aligned
 * typography. Muted autoplay gives an instant start; sound is one tap
 * away via the custom toggle. Native controls are replaced by an
 * accent progress bar; click the video to pause / resume. Escape /
 * backdrop / × to close.
 */

// TODO(showreel): switch to the compressed export `/showreel/showreel.mp4`
// once it is produced — see the showreel tasks in docs/MARKETING_SITE_ROADMAP.md.
const SHOWREEL_SRC = '/showreel/Andrey Epov Showreel.mp4';

export default function ShowreelModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

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

  // Instant muted autoplay on open — the reel starts the moment the
  // panel is born, nobody waits for a loading spinner.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.currentTime = 0;
      v.muted = true;
      setMuted(true);
      setProgress(0);
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

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label="Showreel"
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 px-5 transition-all duration-500 sm:justify-end sm:px-10 lg:px-14 ${
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

      {/* Video container — keep the mobile 9:16 shape, but let desktop use
          substantially more viewport height so details are readable. */}
      <div
        className={`relative transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:mr-[max(1rem,calc(23.3vw-min(33vh,260px)))] ${
          open ? 'scale-100 opacity-100' : 'scale-[0.4] opacity-0'
        }`}
        style={{
          transitionDelay: open ? '250ms' : '0ms',
        }}
      >
        {/* Accent glow behind the video — the "birth" light */}
        <div
          aria-hidden="true"
          className="absolute -inset-4 rounded-2xl opacity-40 blur-3xl"
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
              width: 'min(88vw, 520px)',
              maxHeight: '86svh',
              aspectRatio: '9 / 16',
            }}
          >
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={SHOWREEL_SRC}
              muted
              loop
              playsInline
              preload="metadata"
              onClick={togglePlay}
              onTimeUpdate={() => {
                const v = videoRef.current;
                if (v && v.duration > 0) {
                  setProgress(v.currentTime / v.duration);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Scanline overlay */}
          <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.06] [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)]" />

          {/* Sound toggle — one tap to bring the audio in */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            style={{ cursor: 'pointer' }}
          >
            {muted ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Accent progress bar instead of native controls */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2px] bg-white/10">
            <div
              className="h-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Bottom caption */}
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
          Andrey Epov — Selected Works
        </p>
      </div>

      {/* Left side decorative text (desktop only) — sits on the left
          edge so it never collides with the right-hand video panel. */}
      <div className="absolute left-10 top-1/2 hidden -translate-y-1/2 lg:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/15 [writing-mode:vertical-rl]">
          CG Generalist & Motion Designer
        </p>
      </div>
    </div>
  );
}
