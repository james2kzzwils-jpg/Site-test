'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMediaQuery } from './useMediaQuery';

/**
 * Hero particle field. Three layers:
 *
 *  - Inner ambient shell (~4.5k pts, accent-tinted). Slow rotation +
 *    soft mouse parallax. Always present.
 *  - Outer morph layer (~6k pts, foreground-cream). Loops through
 *    `shell → A → E → shell`. The shell phase is a thicker spheroid
 *    cloud, the letter phases sample each glyph drawn on an offscreen
 *    canvas and slide every particle toward its sampled pixel target.
 *    Morph transitions use a quintic in-out ease plus a mid-transition
 *    "rush" in the follow factor — slow gathering, fast flight,
 *    gentle settle — for proper motion-design contrast.
 *  - Comet layer: a handful of faint drifting particles crossing the
 *    scene from the left, each with a fading trail — a quiet cosmic
 *    depth cue. Deliberately sparse (~7 comets) to keep the scene calm.
 *
 * The field is anchored horizontally at FOCUS_FRACTION of the viewport
 * width (right of centre) — on desktop that lands right under the
 * "CG Generalist" role chip, in the deliberately empty half of the
 * hero, away from the left-aligned typography. Because the anchor is a
 * fraction of the live viewport, it tracks the chip across screen
 * sizes instead of drifting like a fixed world coordinate would.
 *
 * Everything runs on the CPU with `Float32Array` position buffers —
 * cheap on the GPU and lets us morph without writing a shader. The
 * morph state lives at module scope so the per-frame `useFrame` loop
 * is free to mutate it; React's immutability rules apply only to
 * values returned from hooks (useState / useMemo / useRef).
 *
 * When the showreel opens (`reelOpen`), the field gently converges on
 * the same anchor axis (the panel is centred on it too), shrinks and
 * dims. On top of that, an elliptical exclusion zone around the panel
 * displaces particles outward, so they form a living halo around the
 * video: the reel and the particles share one space, and the panel
 * visibly "pushes" the field aside. Closing the reel releases
 * everything back to ambient.
 */

const MORPH_COUNT = 6000;
const INNER_COUNT = 4500;

// Letter footprint in world units. The camera sits at z=6 with fov=55,
// so the visible plane at z=0 is roughly 6.25 world-units wide.
const LETTER_WIDTH = 4.4;
const LETTER_HEIGHT = 4.4;
const LETTER_SLAB = 0.4;

// Horizontal anchor of the field, as a signed fraction of the live
// viewport width measured from the centre. 0.267 → the centre sits at
// ~77% of the screen — directly under the "CG Generalist" role chip on
// desktop. The showreel panel is centred on the same axis (see
// ShowreelModal), so the field converges exactly onto the panel spot.
const FOCUS_FRACTION = 0.267;

// Elliptical exclusion zone around the video panel (world units).
// Particles are displaced out of it so the reel sits inside the field
// as a physical object — a halo forms around the video instead of
// particles hiding behind it.
const PANEL_HALF_W = 1.15;
const PANEL_HALF_H = 1.75;

// Comet layer — kept deliberately tiny so the scene stays calm.
const COMET_COUNT = 7;
const TRAIL_LENGTH = 16;
const TRAIL_SPACING = 0.09;

// Phase machine (seconds). Picks an ease and a target for every frame.
const PHASES: { duration: number; from: 'shell' | 'A' | 'E'; to: 'shell' | 'A' | 'E' }[] = [
  { duration: 3.5, from: 'shell', to: 'shell' }, // settle
  { duration: 3.0, from: 'shell', to: 'A' }, // morph into A
  { duration: 2.5, from: 'A', to: 'A' }, // hold A
  { duration: 3.0, from: 'A', to: 'E' }, // morph A → E
  { duration: 2.5, from: 'E', to: 'E' }, // hold E
  { duration: 3.0, from: 'E', to: 'shell' }, // morph back to ambient
];
const TOTAL_DURATION = PHASES.reduce((sum, p) => sum + p.duration, 0);

// Deterministic PRNG (mulberry32) — keeps layouts stable across HMR
// reloads and StrictMode double mounts.
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

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

// Quintic in-out — much stronger contrast than smoothstep: a slow
// wind-up, a fast rush through the middle, and a soft landing. Used
// for the shell → letter → shell morph transitions.
function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function generateShellPositions(count: number, rng: () => number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Sparse spheroid — same flavour as the inner shell, just wider.
    const r = 2.0 + Math.pow(rng(), 1.6) * 2.4;
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    out[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.9;
    out[i * 3 + 2] = r * Math.cos(phi);
  }
  return out;
}

function generateLetterPositions(
  letter: string,
  count: number,
  rng: () => number
): Float32Array {
  const out = new Float32Array(count * 3);
  if (typeof document === 'undefined') return out;

  // Draw the glyph filling an offscreen canvas, then sample bright
  // pixels uniformly to seed particle targets.
  const size = 384;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return out;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(size * 0.92)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Nudge the baseline a hair so capitals sit visually centred.
  ctx.fillText(letter, size / 2, size / 2 + size * 0.04);

  const data = ctx.getImageData(0, 0, size, size).data;
  const candidates: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (data[idx] > 128) {
        candidates.push(x);
        candidates.push(y);
      }
    }
  }

  if (candidates.length === 0) return out;

  for (let i = 0; i < count; i++) {
    const sampleIndex = Math.floor(rng() * (candidates.length / 2)) * 2;
    const px = candidates[sampleIndex] + (rng() - 0.5);
    const py = candidates[sampleIndex + 1] + (rng() - 0.5);
    out[i * 3 + 0] = (px / size - 0.5) * LETTER_WIDTH;
    out[i * 3 + 1] = -((py / size - 0.5)) * LETTER_HEIGHT;
    out[i * 3 + 2] = (rng() - 0.5) * LETTER_SLAB;
  }
  return out;
}

type MorphState = {
  innerGeometry: THREE.BufferGeometry;
  morphGeometry: THREE.BufferGeometry;
  targets: { shell: Float32Array; A: Float32Array; E: Float32Array };
  livePositions: Float32Array;
};

// Module-scope cache. Populated on first client mount, reused across
// re-renders / HMR. SSR never touches this because the parent gates on
// `useMediaQuery` and bails out before ParticleField mounts.
let cachedState: MorphState | null = null;

function buildState(): MorphState {
  const innerRng = makeRng(0xc0ffee);
  const inner = new Float32Array(INNER_COUNT * 3);
  for (let i = 0; i < INNER_COUNT; i++) {
    const r = 1.6 + innerRng() * 0.6;
    const theta = innerRng() * Math.PI * 2;
    const phi = Math.acos(2 * innerRng() - 1);
    inner[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    inner[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85;
    inner[i * 3 + 2] = r * Math.cos(phi);
  }
  const innerGeometry = new THREE.BufferGeometry();
  innerGeometry.setAttribute('position', new THREE.BufferAttribute(inner, 3));

  const shellTarget = generateShellPositions(MORPH_COUNT, makeRng(0xabc123));
  const aTarget = generateLetterPositions('A', MORPH_COUNT, makeRng(0x771e1f));
  const eTarget = generateLetterPositions('E', MORPH_COUNT, makeRng(0xdeadbe));

  const livePositions = shellTarget.slice();
  const morphGeometry = new THREE.BufferGeometry();
  morphGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(livePositions, 3)
  );

  return {
    innerGeometry,
    morphGeometry,
    targets: { shell: shellTarget, A: aTarget, E: eTarget },
    livePositions,
  };
}

function getMorphState(): MorphState {
  if (!cachedState) {
    cachedState = buildState();
  }
  return cachedState;
}

// ------------------------------------------------------------------
// Comet layer — sparse "space dust" drifting in from the left with
// barely-visible fading trails. Rendered as one Points cloud with
// per-vertex colors (additive blending makes darker = more
// transparent, which is how the trails fade out).
// ------------------------------------------------------------------

type Comet = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  brightness: number;
  accent: boolean;
};

type CometState = {
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  colors: Float32Array;
  comets: Comet[];
  rng: () => number;
};

function spawnComet(rng: () => number, anywhere: boolean): Comet {
  return {
    // Fresh comets enter just off the left edge; the initial seeding
    // scatters them across the whole width so the sky is never empty.
    x: anywhere ? -7 + rng() * 14 : -7.5 - rng() * 1.5,
    y: -2.8 + rng() * 5.6,
    z: -1.6 + rng() * 1.4,
    vx: 0.3 + rng() * 0.45,
    vy: (rng() - 0.5) * 0.12,
    brightness: 0.2 + rng() * 0.28,
    accent: rng() < 0.25,
  };
}

let cachedCometState: CometState | null = null;

function buildCometState(): CometState {
  const rng = makeRng(0x0c0c0c);
  const positions = new Float32Array(COMET_COUNT * TRAIL_LENGTH * 3);
  const colors = new Float32Array(COMET_COUNT * TRAIL_LENGTH * 3);
  const comets: Comet[] = [];
  for (let c = 0; c < COMET_COUNT; c++) {
    comets.push(spawnComet(rng, true));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return { geometry, positions, colors, comets, rng };
}

function getCometState(): CometState {
  if (!cachedCometState) {
    cachedCometState = buildCometState();
  }
  return cachedCometState;
}

function CometField({ reelOpen }: { reelOpen: boolean }) {
  const reelRef = useRef(0);
  const state = getCometState();

  useFrame((frame, delta) => {
    const st = getCometState();
    const dt = Math.min(delta, 0.05);
    const t = frame.clock.elapsedTime;

    // Comets dim to half while the showreel is open so they never
    // compete with the video.
    reelRef.current += ((reelOpen ? 1 : 0) - reelRef.current) * 0.045;
    const dim = 1 - 0.5 * reelRef.current;

    for (let c = 0; c < COMET_COUNT; c++) {
      let comet = st.comets[c];
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt + Math.sin(t * 0.6 + c * 2.1) * 0.0015;
      if (comet.x - TRAIL_LENGTH * TRAIL_SPACING > 7.5) {
        comet = spawnComet(st.rng, false);
        st.comets[c] = comet;
      }

      const dirY = comet.vy / comet.vx;
      for (let k = 0; k < TRAIL_LENGTH; k++) {
        const idx = (c * TRAIL_LENGTH + k) * 3;
        const back = k * TRAIL_SPACING;
        st.positions[idx] = comet.x - back;
        st.positions[idx + 1] = comet.y - back * dirY;
        st.positions[idx + 2] = comet.z;

        // Quadratic falloff along the trail — the tail dissolves into
        // the black background (additive blending: darker = invisible).
        const fade =
          Math.pow(1 - k / TRAIL_LENGTH, 2.2) * comet.brightness * dim;
        if (comet.accent) {
          st.colors[idx] = 0.83 * fade;
          st.colors[idx + 1] = 1.0 * fade;
          st.colors[idx + 2] = 0.0;
        } else {
          st.colors[idx] = 0.96 * fade;
          st.colors[idx + 1] = 0.95 * fade;
          st.colors[idx + 2] = 0.93 * fade;
        }
      }
    }

    (st.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;
    (st.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points geometry={state.geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.85}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ParticleField({ reelOpen }: { reelOpen: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Points>(null);
  const morphRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  // Eased 0→1 influence of the open showreel on the field.
  const reelRef = useRef(0);

  const { innerGeometry, morphGeometry } = getMorphState();

  // Per-frame work. We sample group rotation / inner spin as before,
  // and additionally lerp each morph-layer position toward its current
  // target with an eased weight derived from the phase clock. State
  // is re-fetched inside the callback — `getMorphState` is a module
  // helper, so the linter does not flag captured-mutable warnings.
  useFrame((frame) => {
    const state = getMorphState();
    const t = frame.clock.elapsedTime;

    // The anchor axis, in world units, derived from the live viewport
    // — tracks the "CG Generalist" chip across screen sizes.
    const focusX = FOCUS_FRACTION * frame.viewport.width;

    // Showreel influence — eases toward 1 while the reel is open and
    // back to 0 when it closes. Drives the "particles gather to give
    // birth to the video" choreography.
    reelRef.current += ((reelOpen ? 1 : 0) - reelRef.current) * 0.045;
    const reel = reelRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04 + reel * 0.6;
      groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.14 * (1 - reel);
      // The field idles on the anchor axis and stays there while the
      // reel is open; mouse parallax fades out with reel.
      const targetX = focusX + mouseRef.current.x * 0.4 * (1 - reel);
      const targetY = -mouseRef.current.y * 0.3 * (1 - reel);
      groupRef.current.position.x +=
        (targetX - groupRef.current.position.x) * 0.04;
      groupRef.current.position.y +=
        (targetY - groupRef.current.position.y) * 0.04;
      groupRef.current.scale.setScalar(1 - 0.55 * reel);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.08;
      innerRef.current.rotation.z = t * 0.025;
      (innerRef.current.material as THREE.PointsMaterial).opacity =
        0.55 * (1 - 0.45 * reel);
    }
    if (morphRef.current) {
      (morphRef.current.material as THREE.PointsMaterial).opacity =
        0.55 * (1 - 0.45 * reel);
    }

    // Resolve the active phase. PHASES is small, so linear search is
    // perfectly fine and avoids extra mutable state.
    const cycle = t % TOTAL_DURATION;
    let acc = 0;
    let phase = PHASES[0];
    let localT = 0;
    for (const p of PHASES) {
      if (cycle < acc + p.duration) {
        phase = p;
        localT = (cycle - acc) / p.duration;
        break;
      }
      acc += p.duration;
    }

    // Motion-design easing: morph transitions get a quintic in-out
    // (slow wind-up → rush → soft landing); hold phases keep the
    // gentle smoothstep drift.
    const morphing = phase.from !== phase.to;
    const eased = morphing ? easeInOutQuint(localT) : smoothstep(localT);
    const from = state.targets[phase.from];
    const to = state.targets[phase.to];

    // Follow factor breathes with the transition: relaxed at the ends,
    // tight through the middle — particles visibly accelerate mid-morph
    // and decelerate into the final form.
    const bell = 4 * localT * (1 - localT);
    const followFactor = morphing ? 0.05 + 0.16 * bell : 0.06;
    const live = state.livePositions;

    // Panel repulsion — while the reel is open, particles that would
    // land inside the elliptical zone around the video panel get
    // displaced outward (in world space), forming a halo around the
    // reel. The zone is defined in world coordinates on the anchor
    // axis, so we project each morph target through the group
    // transform (rotation.x fades to 0 while the reel is open, so only
    // Y-rotation matters).
    const g = groupRef.current;
    const repel = reel > 0.01 && g !== null;
    const gs = g ? g.scale.x : 1;
    const ggx = g ? g.position.x : 0;
    const ggy = g ? g.position.y : 0;
    const rotY = g ? g.rotation.y : 0;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    for (let p = 0; p < MORPH_COUNT; p++) {
      const i = p * 3;
      let tx = from[i] + (to[i] - from[i]) * eased;
      let ty = from[i + 1] + (to[i + 1] - from[i + 1]) * eased;
      let tz = from[i + 2] + (to[i + 2] - from[i + 2]) * eased;

      if (repel) {
        // Approximate world position of this morph target.
        const wx = (cosY * tx + sinY * tz) * gs + ggx;
        const wy = ty * gs + ggy;
        const ex = (wx - focusX) / PANEL_HALF_W;
        const ey = wy / PANEL_HALF_H;
        const d2 = ex * ex + ey * ey;
        if (d2 < 1) {
          const d = Math.sqrt(d2) || 1e-4;
          const push = (1 - d) * reel;
          const pxWorld = (ex / d) * push * PANEL_HALF_W;
          const pyWorld = (ey / d) * push * PANEL_HALF_H;
          // Transform the world-space push back into group-local space.
          tx += (cosY * pxWorld) / gs;
          tz += (sinY * pxWorld) / gs;
          ty += pyWorld / gs;
        }
      }

      live[i] += (tx - live[i]) * followFactor;
      live[i + 1] += (ty - live[i + 1]) * followFactor;
      live[i + 2] += (tz - live[i + 2]) * followFactor;
    }

    const attr = state.morphGeometry.attributes
      .position as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  // Pointer parallax — separate frame loop so the rotation block above
  // does not have to read the pointer itself.
  useFrame(({ pointer }) => {
    mouseRef.current.x = pointer.x;
    mouseRef.current.y = pointer.y;
  });

  return (
    <group ref={groupRef}>
      <points ref={innerRef} geometry={innerGeometry}>
        <pointsMaterial
          color="#d4ff00"
          size={0.012}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={morphRef} geometry={morphGeometry}>
        <pointsMaterial
          color="#f5f3ee"
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function Scene3D({
  reelOpen = false,
}: {
  reelOpen?: boolean;
}) {
  // SSR-safe: returns `false` during SSR, real value on client.
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)', false);
  const supportsCanvas = useMediaQuery('all', true); // proxy for client mount

  if (!supportsCanvas || reduce) {
    return (
      <div
        className="absolute inset-0 z-0 flex items-center justify-end pr-[10vw]"
        aria-hidden="true"
      >
        <div className="h-[42vmin] w-[42vmin] rounded-full border border-[var(--foreground)]/10" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ParticleField reelOpen={reelOpen} />
          <CometField reelOpen={reelOpen} />
        </Suspense>
      </Canvas>
    </div>
  );
}
