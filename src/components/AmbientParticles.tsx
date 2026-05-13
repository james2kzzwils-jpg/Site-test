'use client';

import { useEffect, useRef } from 'react';
import { useMediaQuery } from './useMediaQuery';

/**
 * Lightweight section-background particle layer (2D canvas + rAF).
 *
 * Each particle drifts slowly within the parent's bounds and wraps
 * around the edges so the field looks infinite. When a `highlight`
 * rect is supplied (the visitor is hovering an item we want to call
 * attention to), particles within reach of the rect:
 *   - brighten
 *   - drift gently toward the rect centre
 *
 * The component is fully decorative — it sets `pointer-events: none`
 * on its wrapper and bails out for visitors who prefer reduced motion.
 *
 * Mutable particle state lives inside the useEffect closure (created
 * once on mount, never observed by React), so the immutability lint
 * doesn't apply.
 */

export type HighlightRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseAlpha: number;
};

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type AmbientParticlesProps = {
  /** Optional rect (in parent-local coords) the particles should
   * orient toward. `null` clears the highlight. */
  highlight?: HighlightRect | null;
  /** Particle count. Default ~120 reads as soft texture without
   * tipping into visual noise on large sections. */
  count?: number;
  /** PRNG seed — keeps the layout stable across re-renders and HMR. */
  seed?: number;
  /** Base particle colour (rgb-only — alpha is computed per-particle). */
  rgb?: string;
};

export default function AmbientParticles({
  highlight = null,
  count = 120,
  seed = 1,
  rgb = '245,243,238',
}: AmbientParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HighlightRect | null>(highlight);
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)', false);

  // Mirror the latest `highlight` prop into a ref so the rAF loop —
  // which captures the ref, not the prop — always sees fresh data
  // without needing to be torn down on every hover.
  useEffect(() => {
    highlightRef.current = highlight;
  }, [highlight]);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = container.clientWidth;
    let height = container.clientHeight;

    const sync = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(container);

    // Width of the "perimeter band" inside which particles prefer to
    // live. Anything outside this band gets a soft outward push back
    // toward the nearest edge, so the centre of the section stays
    // mostly clear and the field reads as a frame.
    const BAND_PX = 160;

    const spawnPosition = (rngF: () => number): { x: number; y: number } => {
      // Pick a side (0=top, 1=right, 2=bottom, 3=left) and place the
      // particle inside that side's band of thickness BAND_PX. This
      // keeps the initial frame readable even before the drift kicks
      // in.
      const side = Math.floor(rngF() * 4);
      switch (side) {
        case 0:
          return { x: rngF() * width, y: rngF() * BAND_PX };
        case 1:
          return { x: width - rngF() * BAND_PX, y: rngF() * height };
        case 2:
          return { x: rngF() * width, y: height - rngF() * BAND_PX };
        default:
          return { x: rngF() * BAND_PX, y: rngF() * height };
      }
    };

    const rng = makeRng(seed);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const { x, y } = spawnPosition(rng);
      particles.push({
        x,
        y,
        vx: (rng() - 0.5) * 0.22,
        vy: (rng() - 0.5) * 0.22,
        baseAlpha: 0.06 + rng() * 0.16,
      });
    }

    // Frame loop. Stays a single rAF chain so we don't accumulate
    // multiple animations when StrictMode re-runs the effect.
    let raf = 0;
    const reach = 260; // pixels within which highlight pulls/brightens

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      const hl = highlightRef.current;
      const hlCx = hl ? hl.x + hl.w / 2 : 0;
      const hlCy = hl ? hl.y + hl.h / 2 : 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around the section so the field reads as continuous.
        if (p.x < -8) p.x = width + 8;
        else if (p.x > width + 8) p.x = -8;
        if (p.y < -8) p.y = height + 8;
        else if (p.y > height + 8) p.y = -8;

        // Mild damping + occasional jitter so particles don't all
        // grind to a halt over time.
        p.vx *= 0.994;
        p.vy *= 0.994;
        if (Math.random() < 0.012) {
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;
        }

        // Soft outward push when the particle drifts past the perimeter
        // band toward the centre of the section. We nudge along the
        // *nearest-edge* normal so particles glide back toward the
        // frame rather than picking a single attractor. The push only
        // engages once the particle is more than BAND_PX from every
        // edge — within the band, free drift is preserved.
        const distLeft = p.x;
        const distRight = width - p.x;
        const distTop = p.y;
        const distBottom = height - p.y;
        const nearest = Math.min(distLeft, distRight, distTop, distBottom);
        if (nearest > BAND_PX) {
          const depth = nearest - BAND_PX;
          const k = Math.min(depth / 220, 1) * 0.012;
          if (nearest === distLeft) p.vx -= k;
          else if (nearest === distRight) p.vx += k;
          else if (nearest === distTop) p.vy -= k;
          else p.vy += k;
        }

        let alpha = p.baseAlpha;
        let radius = 1;
        if (hl) {
          const dx = p.x - hlCx;
          const dy = p.y - hlCy;
          const dist = Math.hypot(dx, dy);
          if (dist < reach) {
            const w = 1 - dist / reach;
            alpha = p.baseAlpha + w * 0.5;
            radius = 1 + w * 0.7;
            // Gentle attraction toward the rect centre.
            if (dist > 2) {
              p.vx -= (dx / dist) * w * 0.0035;
              p.vy -= (dy / dist) * w * 0.0035;
            }
          }
        }

        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count, reduce, seed, rgb]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
