'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMediaQuery } from './useMediaQuery';

/**
 * Hero particle field. Two layers:
 *
 *  - Inner ambient shell (~4.5k pts, accent-tinted). Slow rotation +
 *    soft mouse parallax. Always present.
 *  - Outer morph layer (~6k pts, foreground-cream). Loops through
 *    `shell → A → E → shell`. The shell phase is a thicker spheroid
 *    cloud, the letter phases sample each glyph drawn on an offscreen
 *    canvas and slide every particle toward its sampled pixel target.
 *
 * Everything runs on the CPU with `Float32Array` position buffers —
 * cheap on the GPU and lets us morph without writing a shader. The
 * morph state lives at module scope so the per-frame `useFrame` loop
 * is free to mutate it; React's immutability rules apply only to
 * values returned from hooks (useState / useMemo / useRef).
 *
 * When the showreel opens (`reelOpen`), the whole field gently
 * converges toward the video panel spot on the left, shrinks and dims
 * — the reel looks like it is born out of the particles. Closing the
 * reel releases the field back to its ambient behaviour.
 */

const MORPH_COUNT = 6000;
const INNER_COUNT = 4500;

// Letter footprint in world units. The camera sits at z=6 with fov=55,
// so the visible plane at z=0 is roughly 6.25 world-units wide.
const LETTER_WIDTH = 4.4;
const LETTER_HEIGHT = 4.4;
const LETTER_SLAB = 0.4;

// Where the particle group drifts while the showreel is open — matches
// the video panel spot (left of centre) in world units at z=0.
const REEL_FOCUS_X = -2.2;

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

    // Showreel influence — eases toward 1 while the reel is open and
    // back to 0 when it closes. Drives the "particles gather to give
    // birth to the video" choreography.
    reelRef.current += ((reelOpen ? 1 : 0) - reelRef.current) * 0.045;
    const reel = reelRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04 + reel * 0.6;
      groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.14 * (1 - reel);
      const targetX =
        mouseRef.current.x * 0.4 * (1 - reel) + REEL_FOCUS_X * reel;
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

    const eased = smoothstep(localT);
    const from = state.targets[phase.from];
    const to = state.targets[phase.to];

    // Lerp live buffer toward target. Hold phases ease at a lower
    // factor so particles gently drift even when from === to.
    const followFactor = phase.from === phase.to ? 0.06 : 0.12;
    const live = state.livePositions;
    for (let i = 0; i < MORPH_COUNT * 3; i++) {
      const target = from[i] + (to[i] - from[i]) * eased;
      live[i] += (target - live[i]) * followFactor;
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
        </Suspense>
      </Canvas>
    </div>
  );
}
