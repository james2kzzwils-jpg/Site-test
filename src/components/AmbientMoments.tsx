'use client';

import { useEffect, useRef } from 'react';
import { useMediaQuery } from './useMediaQuery';

/**
 * AmbientMoments — a quiet "second space" living behind the glass.
 *
 * The layer is built around depth + mouse parallax: every element has
 * its own depth factor, and the whole field shifts smoothly after the
 * cursor — nearer elements move more, deeper ones barely — so the page
 * feels like it hangs in front of a living 3D space.
 *
 * Contents:
 *  - a persistent sparse dust field (the space itself)
 *  - rare micro-events: a comet with a fading trail, a small accent
 *    ball hopping along the lower edge, a ◆ diamond that disintegrates
 *    into fragments
 *
 * Everything uses the brand palette (cream + acid lime) at low alpha.
 * The layer fades in only after the visitor scrolls past the hero
 * (which owns its own particle scene) and bails out entirely for
 * prefers-reduced-motion. Fully decorative: pointer-events none.
 */

const CREAM = '245,243,238';
const LIME = '212,255,0';

// How far (px) a depth=1 element shifts at full mouse deflection.
const PARALLAX = 34;

const DUST_COUNT = 70;

type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  alpha: number;
  accent: boolean;
};

type CometEvent = {
  kind: 'comet';
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
  depth: number;
  accent: boolean;
};

type BallEvent = {
  kind: 'ball';
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  age: number;
  ttl: number;
  floor: number;
  depth: number;
};

type Fragment = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
};

type BurstEvent = {
  kind: 'burst';
  x: number;
  y: number;
  age: number;
  ttl: number;
  hold: number;
  size: number;
  depth: number;
  fragments: Fragment[];
};

type Moment = CometEvent | BallEvent | BurstEvent;

export default function AmbientMoments() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)', false);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const sync = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sync();
    window.addEventListener('resize', sync);

    // --- Mouse parallax -------------------------------------------------
    // Normalized -1..1 deflection from the viewport centre; the field
    // eases toward it every frame, so the space follows the cursor with
    // a soft lag instead of snapping.
    const mouseTarget = { x: 0, y: 0 };
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / w) * 2 - 1;
      mouseTarget.y = (e.clientY / h) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // --- The dust field (the "space" itself) ----------------------------
    const dust: Dust[] = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      dust.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        depth: 0.25 + Math.random() * 0.95,
        alpha: 0.05 + Math.random() * 0.14,
        accent: Math.random() < 0.12,
      });
    }

    // --- Rare micro-events ----------------------------------------------
    const moments: Moment[] = [];
    let clock = 0;
    let nextComet = 3 + Math.random() * 5;
    let nextBall = 15 + Math.random() * 15;
    let nextBurst = 8 + Math.random() * 10;

    const spawnComet = () => {
      const fromLeft = Math.random() < 0.7;
      const vx = (60 + Math.random() * 80) * (fromLeft ? 1 : -1);
      moments.push({
        kind: 'comet',
        x: fromLeft ? -60 : w + 60,
        y: h * (0.1 + Math.random() * 0.7),
        vx,
        vy: (Math.random() - 0.5) * 40,
        age: 0,
        ttl: (w + 120) / Math.abs(vx),
        depth: 0.5 + Math.random() * 0.6,
        accent: Math.random() < 0.3,
      });
    };

    const spawnBall = () => {
      const fromLeft = Math.random() < 0.5;
      moments.push({
        kind: 'ball',
        x: fromLeft ? -20 : w + 20,
        y: h * 0.55,
        vx: (110 + Math.random() * 70) * (fromLeft ? 1 : -1),
        vy: -40 - Math.random() * 40,
        r: 3 + Math.random() * 2,
        age: 0,
        ttl: 6,
        floor: h * (0.78 + Math.random() * 0.08),
        depth: 0.9,
      });
    };

    const spawnBurst = () => {
      const cx = w * (0.1 + Math.random() * 0.8);
      const cy = h * (0.2 + Math.random() * 0.55);
      const fragments: Fragment[] = [];
      const n = 10 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 100;
        fragments.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 20,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 6,
          size: 1.5 + Math.random() * 2.5,
        });
      }
      moments.push({
        kind: 'burst',
        x: cx,
        y: cy,
        age: 0,
        ttl: 2.6,
        hold: 0.9,
        size: 5,
        depth: 0.6 + Math.random() * 0.5,
        fragments,
      });
    };

    const envelope = (age: number, ttl: number, inT = 0.5, outT = 0.6) =>
      Math.max(0, Math.min(1, age / inT, (ttl - age) / outT));

    // The layer eases in/out with scroll instead of popping.
    let layerAlpha = 0;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += dt;
      ctx.clearRect(0, 0, w, h);

      // Soft-follow the cursor.
      mouse.x += (mouseTarget.x - mouse.x) * 0.055;
      mouse.y += (mouseTarget.y - mouse.y) * 0.055;
      const parX = -mouse.x * PARALLAX;
      const parY = -mouse.y * PARALLAX;

      // The hero owns the first screen; this space fades in below it.
      const belowHero = window.scrollY > window.innerHeight * 0.6;
      layerAlpha += ((belowHero ? 1 : 0) - layerAlpha) * 0.06;

      if (layerAlpha > 0.01) {
        // Dust — persistent, slowly drifting, wrapped at the edges.
        for (const d of dust) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.x < -10) d.x = w + 10;
          else if (d.x > w + 10) d.x = -10;
          if (d.y < -10) d.y = h + 10;
          else if (d.y > h + 10) d.y = -10;

          const rgb = d.accent ? LIME : CREAM;
          ctx.fillStyle = `rgba(${rgb},${d.alpha * layerAlpha})`;
          ctx.beginPath();
          ctx.arc(
            d.x + parX * d.depth,
            d.y + parY * d.depth,
            0.8 + d.depth * 0.8,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        if (belowHero && moments.length < 4) {
          if (clock >= nextComet) {
            spawnComet();
            nextComet = clock + 7 + Math.random() * 9;
          }
          if (clock >= nextBall) {
            spawnBall();
            nextBall = clock + 24 + Math.random() * 20;
          }
          if (clock >= nextBurst) {
            spawnBurst();
            nextBurst = clock + 14 + Math.random() * 16;
          }
        }

        for (let m = moments.length - 1; m >= 0; m--) {
          const ev = moments[m];
          ev.age += dt;
          if (ev.age >= ev.ttl) {
            moments.splice(m, 1);
            continue;
          }
          const ox = parX * ev.depth;
          const oy = parY * ev.depth;

          if (ev.kind === 'comet') {
            ev.x += ev.vx * dt;
            ev.y += ev.vy * dt;
            const env = envelope(ev.age, ev.ttl) * layerAlpha;
            const rgb = ev.accent ? LIME : CREAM;
            const dirX = ev.vx >= 0 ? 1 : -1;
            const dirY = ev.vy / (Math.abs(ev.vx) || 1);
            for (let k = 0; k < 12; k++) {
              const fade = Math.pow(1 - k / 12, 2.2) * 0.38 * env;
              if (fade <= 0.003) continue;
              ctx.fillStyle = `rgba(${rgb},${fade})`;
              ctx.beginPath();
              ctx.arc(
                ev.x - dirX * k * 7 + ox,
                ev.y - dirX * k * 7 * dirY + oy,
                k === 0 ? 1.6 : 1.1,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          } else if (ev.kind === 'ball') {
            ev.vy += 260 * dt; // gravity
            ev.x += ev.vx * dt;
            ev.y += ev.vy * dt;
            if (ev.y > ev.floor) {
              ev.y = ev.floor;
              ev.vy = -Math.abs(ev.vy) * 0.55;
              ev.vx *= 0.92;
            }
            if (ev.x < -40 || ev.x > w + 40) {
              moments.splice(m, 1);
              continue;
            }
            const env = envelope(ev.age, ev.ttl, 0.3, 0.8) * layerAlpha;
            ctx.save();
            ctx.shadowColor = `rgba(${LIME},${0.5 * env})`;
            ctx.shadowBlur = 10;
            ctx.fillStyle = `rgba(${LIME},${0.65 * env})`;
            ctx.beginPath();
            ctx.arc(ev.x + ox, ev.y + oy, ev.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            // burst — a ◆ that holds, then shatters into fragments
            if (ev.age <= ev.hold) {
              const t01 = ev.age / ev.hold;
              const pulse = (0.35 + 0.3 * Math.sin(t01 * Math.PI)) * layerAlpha;
              ctx.save();
              ctx.translate(ev.x + ox, ev.y + oy);
              ctx.rotate(Math.PI / 4);
              ctx.fillStyle = `rgba(${LIME},${pulse})`;
              ctx.fillRect(-ev.size, -ev.size, ev.size * 2, ev.size * 2);
              ctx.restore();
            } else {
              const ft = ev.age - ev.hold;
              const life = ev.ttl - ev.hold;
              const env = Math.max(0, 1 - ft / life) * layerAlpha;
              for (const f of ev.fragments) {
                f.vy += 30 * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.rot += f.vr * dt;
                ctx.save();
                ctx.translate(f.x + ox, f.y + oy);
                ctx.rotate(f.rot);
                ctx.fillStyle = `rgba(${LIME},${0.45 * env * env})`;
                ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
                ctx.restore();
              }
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', sync);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[30]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
