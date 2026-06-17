'use client';

import { useEffect, useRef } from 'react';
import { useMediaQuery } from './useMediaQuery';

/**
 * Floating tool "balls" for the About → Toolkit row. Each tool is a
 * uniform circle that drifts inside the container, bounces off the
 * walls and softly collides with its neighbours. Pure DOM + rAF — no
 * canvas, no physics library.
 *
 * Each known tool is assigned a brand colour. The base appearance is
 * neutral so the labels stay legible; on collision both circles flash
 * a glow in their own brand colour and fade back to neutral over
 * roughly 600ms. Visitors who prefer reduced motion get the static
 * pill list back.
 */

// Brand RGB triples for every tool we recognise. Unknown tools fall
// back to a soft cream so the layout still reads as a single family.
// Keep keys lowercased so we can match case-insensitively against
// whatever the i18n dictionary throws at us.
const BRAND_COLORS: Record<string, string> = {
  houdini: '255,124,18',
  vellum: '255,150,40',
  flip: '90,160,255',
  particles: '255,180,80',
  embergen: '255,90,30',
  blender: '255,123,40',
  'unreal engine': '120,150,255',
  unreal: '120,150,255',
  cycles: '240,170,55',
  octane: '235,60,110',
  'nano banana': '255,215,70',
  'after effects': '180,150,255',
  'davinci resolve': '240,85,75',
  davinci: '240,85,75',
  resolve: '240,85,75',
  photoshop: '49,168,255',
  illustrator: '255,154,0',
  figma: '170,108,255',
  cavalry: '0,210,180',
  veo: '70,170,255',
  gemini: '150,120,250',
  higgsfield: '80,225,130',
  'marvelous designer': '220,170,90',
  marvelous: '220,170,90',
  python: '70,140,210',
  javascript: '247,223,30',
  typescript: '49,120,198',
  html: '227,79,38',
  css: '21,114,182',
  hdas: '255,140,30',
  hda: '255,140,30',
  pipeline: '140,160,220',
  'пайплайн': '140,160,220',
  'менторство': '210,210,210',
  'mentorship': '210,210,210',
  'разборы': '210,210,210',
  'reviews': '210,210,210',
  'дорожная карта': '210,210,210',
  'roadmap': '210,210,210',
};

const NEUTRAL = '210,205,196';

// Glow never fully decays — each ball keeps a soft constant halo in its
// brand colour so the field reads as colourful even at rest.
const GLOW_FLOOR = 0.28;
const colorFor = (label: string) =>
  BRAND_COLORS[label.trim().toLowerCase()] ?? NEUTRAL;

type Ball = {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 0..1 — collision glow intensity. Decays each frame. */
  glow: number;
  /** rgb triple ("r,g,b") used as a CSS variable inside the ball. */
  rgb: string;
};

function StaticPills({ tools }: { tools: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tools.map((tool) => {
        const rgb = colorFor(tool);
        return (
          <span
            key={tool}
            className="rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--foreground)]/85"
            style={{
              borderColor: `rgba(${rgb}, 0.6)`,
              background: `rgba(${rgb}, 0.1)`,
            }}
          >
            {tool}
          </span>
        );
      })}
    </div>
  );
}

export default function ToolBalls({ tools }: { tools: readonly string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<(Ball | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)', false);

  useEffect(() => {
    if (reduce) return;
    const container = containerRef.current;
    if (!container) return;

    const balls = ballsRef.current.filter((b): b is Ball => b !== null);
    if (balls.length === 0) return;

    // Layout pass: pin every ball to a deterministic-jittered slot on
    // a 4-column grid so the first frame isn't a stack of overlaps.
    const layout = () => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      const cols = Math.max(2, Math.min(5, Math.floor(W / 140)));
      const cellW = W / cols;
      const rows = Math.ceil(balls.length / cols);
      const cellH = Math.min(H / Math.max(rows, 1), 120);

      balls.forEach((b, i) => {
        const rect = b.el.getBoundingClientRect();
        b.r = Math.max(rect.width, rect.height) / 2;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.4;
        const cy = (H - rows * cellH) / 2 + cellH * (row + 0.5) +
          (Math.random() - 0.5) * cellH * 0.4;
        b.x = Math.max(b.r + 4, Math.min(W - b.r - 4, cx));
        b.y = Math.max(b.r + 4, Math.min(H - b.r - 4, cy));
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.28 + Math.random() * 0.22;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
        b.glow = 0;
        b.el.style.setProperty('--ball-rgb', b.rgb);
      });
    };
    layout();

    // Sync layout on container resize so dragging across breakpoints
    // doesn't trap balls outside the new viewport.
    const ro = new ResizeObserver(layout);
    ro.observe(container);

    const tick = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;

      // Wall bounce + integration
      for (const b of balls) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x - b.r < 0) {
          b.x = b.r;
          b.vx = Math.abs(b.vx);
          b.glow = Math.max(b.glow, 0.78);
        } else if (b.x + b.r > cw) {
          b.x = cw - b.r;
          b.vx = -Math.abs(b.vx);
          b.glow = Math.max(b.glow, 0.78);
        }
        if (b.y - b.r < 0) {
          b.y = b.r;
          b.vy = Math.abs(b.vy);
          b.glow = Math.max(b.glow, 0.78);
        } else if (b.y + b.r > ch) {
          b.y = ch - b.r;
          b.vy = -Math.abs(b.vy);
          b.glow = Math.max(b.glow, 0.78);
        }
      }

      // Pair-wise ball collisions — uniform circles, so the math is
      // exact: two balls overlap when the centre distance is less than
      // the sum of their radii. We resolve overlap by pushing each
      // ball along the collision normal, then swap the normal-velocity
      // components for an elastic bounce.
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const c = balls[j];
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minDist = a.r + c.r;
          if (dist > 0.0001 && dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            c.x += nx * overlap;
            c.y += ny * overlap;
            const va = a.vx * nx + a.vy * ny;
            const vc = c.vx * nx + c.vy * ny;
            const diff = vc - va;
            a.vx += diff * nx;
            a.vy += diff * ny;
            c.vx -= diff * nx;
            c.vy -= diff * ny;
            // Light glow flash for both balls — they each light up
            // with their own brand colour. Strength scales with the
            // closing speed so soft brushes flash softly.
            const flash = Math.min(0.65 + Math.abs(diff) * 0.9, 1);
            a.glow = Math.max(a.glow, flash);
            c.glow = Math.max(c.glow, flash);
          }
        }
      }

      // Speed cap + tiny drift so the field never settles. Without the
      // drift, elastic collisions slowly steal energy via the wall
      // damping below and the ball field freezes after ~30 seconds.
      const cap = 0.95;
      for (const b of balls) {
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > cap) {
          b.vx = (b.vx / sp) * cap;
          b.vy = (b.vy / sp) * cap;
        }
        b.vx += (Math.random() - 0.5) * 0.004;
        b.vy += (Math.random() - 0.5) * 0.004;

        // Glow decays exponentially toward a constant floor so collisions
        // read as a snappy pulse on top of a permanent brand-colour halo.
        b.glow = Math.max(b.glow * 0.92, GLOW_FLOOR);

        b.el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`;
        b.el.style.setProperty('--ball-glow', b.glow.toFixed(3));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    // Only animate while the widget is on screen. It lives well below the
    // fold, so this keeps the rAF loop off the main thread during the
    // initial load (helping Time To Interactive) and pauses it whenever the
    // section is scrolled out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    return () => {
      stopLoop();
      io.disconnect();
      ro.disconnect();
    };
  }, [reduce, tools]);

  if (reduce) {
    return <StaticPills tools={tools} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[360px] w-full overflow-hidden rounded-sm border border-[var(--hairline)] bg-[var(--foreground)]/[0.012] sm:h-[420px] lg:h-[460px]"
      aria-hidden="true"
    >
      {tools.map((tool, i) => {
        const rgb = colorFor(tool);
        return (
          <div
            key={tool}
            ref={(node) => {
              if (!node) {
                ballsRef.current[i] = null;
                return;
              }
              ballsRef.current[i] = {
                el: node,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                r: 0,
                glow: 0,
                rgb,
              };
            }}
            className="tool-ball pointer-events-none absolute left-0 top-0 flex h-[76px] w-[76px] select-none items-center justify-center rounded-full border border-[rgba(var(--ball-rgb),0.6)] px-2 text-center font-mono text-[10px] uppercase leading-[1.1] tracking-[0.14em] text-[var(--foreground)]/90 backdrop-blur-[2px] will-change-transform sm:h-[84px] sm:w-[84px]"
            style={{
              transform: 'translate3d(-9999px, -9999px, 0)',
              // Custom properties consumed by the .tool-ball CSS rules
              // below for the collision-glow halo. We set --ball-rgb
              // once in the rAF loop after measurement; --ball-glow
              // ticks every frame.
              ['--ball-rgb' as string]: rgb,
              ['--ball-glow' as string]: '0',
              // Brand-tinted base so each ball carries its colour at rest,
              // sitting on the dark background for legible labels.
              background:
                'radial-gradient(circle at 50% 32%, rgba(var(--ball-rgb), calc(0.22 + var(--ball-glow) * 0.35)), rgba(var(--ball-rgb), 0.06) 70%), rgba(10,10,10,0.82)',
              boxShadow:
                '0 0 0 1px rgba(var(--ball-rgb), calc(0.28 + var(--ball-glow) * 0.7)), 0 0 30px rgba(var(--ball-rgb), calc(var(--ball-glow) * 0.85)), 0 0 82px rgba(var(--ball-rgb), calc(var(--ball-glow) * 0.55)), inset 0 0 26px rgba(var(--ball-rgb), calc(0.12 + var(--ball-glow) * 0.4))',
            }}
          >
            {tool}
          </div>
        );
      })}

      {/* Static a11y / no-JS fallback list */}
      <ul className="sr-only">
        {tools.map((tool) => (
          <li key={`a11y-${tool}`}>{tool}</li>
        ))}
      </ul>
    </div>
  );
}
