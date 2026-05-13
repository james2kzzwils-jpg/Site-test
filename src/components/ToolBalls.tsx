'use client';

import { useEffect, useRef } from 'react';
import { useMediaQuery } from './useMediaQuery';

/**
 * Floating pills for the About → Toolkit row. Each tool is a soft ball
 * that drifts inside the container and bumps off the walls and its
 * neighbours. Pure DOM + rAF — no canvas, no physics library.
 *
 * Reduced-motion users get the static pill list back automatically.
 */
type Ball = {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  r: number; // effective radius for collision (~max(w,h)/2)
};

function StaticPills({ tools }: { tools: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tools.map((tool) => (
        <span
          key={tool}
          className="rounded-full border border-[var(--hairline)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--foreground)]/65"
        >
          {tool}
        </span>
      ))}
    </div>
  );
}

export default function ToolBalls({ tools }: { tools: readonly string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const rafRef = useRef<number | null>(null);
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)', false);

  useEffect(() => {
    if (reduce) return;
    const container = containerRef.current;
    if (!container) return;

    const balls = ballsRef.current.filter(Boolean);
    if (balls.length === 0) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // Measure every pill and seed it with a sensible starting position
    // and velocity. We use deterministic-ish but jittered placement to
    // avoid overlap on first frame.
    balls.forEach((b, i) => {
      const rect = b.el.getBoundingClientRect();
      b.w = rect.width;
      b.h = rect.height;
      b.r = Math.max(rect.width, rect.height) / 2;
      const col = i % 4;
      const row = Math.floor(i / 4);
      b.x = 40 + col * (W / 4) + (Math.random() - 0.5) * 30;
      b.y = 40 + row * 80 + (Math.random() - 0.5) * 30;
      // clamp inside bounds
      b.x = Math.max(b.w / 2, Math.min(W - b.w / 2, b.x));
      b.y = Math.max(b.h / 2, Math.min(H - b.h / 2, b.y));
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.22 + Math.random() * 0.18;
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
    });

    const tick = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;

      // Move + wall bounce
      for (const b of balls) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x - b.w / 2 < 0) {
          b.x = b.w / 2;
          b.vx = Math.abs(b.vx);
        } else if (b.x + b.w / 2 > cw) {
          b.x = cw - b.w / 2;
          b.vx = -Math.abs(b.vx);
        }
        if (b.y - b.h / 2 < 0) {
          b.y = b.h / 2;
          b.vy = Math.abs(b.vy);
        } else if (b.y + b.h / 2 > ch) {
          b.y = ch - b.h / 2;
          b.vy = -Math.abs(b.vy);
        }
      }

      // Pairwise soft collisions — treat each pill as a circle whose
      // radius is half the pill width (cheap enough for ≤16 tools).
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const c = balls[j];
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minDist = a.r * 0.85 + c.r * 0.85;
          if (dist > 0 && dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            c.x += nx * overlap;
            c.y += ny * overlap;
            // exchange velocity components along the collision normal
            const va = a.vx * nx + a.vy * ny;
            const vc = c.vx * nx + c.vy * ny;
            const diff = vc - va;
            a.vx += diff * nx;
            a.vy += diff * ny;
            c.vx -= diff * nx;
            c.vy -= diff * ny;
          }
        }
      }

      // Speed cap so nothing rockets off after a chain collision
      const cap = 0.85;
      for (const b of balls) {
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > cap) {
          b.vx = (b.vx / sp) * cap;
          b.vy = (b.vy / sp) * cap;
        }
        // Tiny drift so balls keep moving even after equilibrium
        b.vx += (Math.random() - 0.5) * 0.002;
        b.vy += (Math.random() - 0.5) * 0.002;
        b.el.style.transform = `translate3d(${b.x - b.w / 2}px, ${b.y - b.h / 2}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [reduce, tools]);

  if (reduce) {
    return <StaticPills tools={tools} />;
  }

  // We render until mounted so React keeps the ref assignments, then
  // the rAF loop in the effect above takes over the positioning.
  return (
    <div
      ref={containerRef}
      className="relative h-[360px] w-full overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.012] sm:h-[420px] lg:h-[460px]"
      aria-hidden="true"
    >
      {tools.map((tool, i) => (
        <div
          key={tool}
          ref={(node) => {
            if (!node) {
              ballsRef.current[i] = undefined as unknown as Ball;
              return;
            }
            ballsRef.current[i] = {
              el: node,
              x: 0,
              y: 0,
              vx: 0,
              vy: 0,
              w: 0,
              h: 0,
              r: 0,
            };
          }}
          className="pointer-events-none absolute left-0 top-0 select-none rounded-full border border-[var(--hairline-strong)] bg-[var(--background)]/65 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--foreground)]/75 backdrop-blur-[2px] will-change-transform"
          style={{ transform: 'translate3d(-9999px, -9999px, 0)' }}
        >
          {tool}
        </div>
      ))}

      {/* Static a11y / no-JS fallback list */}
      <ul className="sr-only">
        {tools.map((tool) => (
          <li key={`a11y-${tool}`}>{tool}</li>
        ))}
      </ul>
    </div>
  );
}
