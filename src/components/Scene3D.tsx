'use client';

import { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMediaQuery } from './useMediaQuery';

/**
 * Luxury particle field for the hero. ~14k points distributed in a soft
 * spheroid shell; the inner core has a subtle accent-tinted dust ring,
 * the outer shell is foreground-cream at low opacity. Slow rotation +
 * tiny mouse parallax. One geometry, one material — cheap on the GPU.
 */
function ParticleField() {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Points>(null);
  const outerRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const { innerGeometry, outerGeometry } = useMemo(() => {
    // Deterministic PRNG (mulberry32) — stable seed keeps the layout
    // identical across renders and lets useMemo stay pure.
    const makeRng = (seed: number) => {
      let s = seed >>> 0;
      return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const rng = makeRng(0xc0ffee);

    const innerCount = 4500;
    const outerCount = 9500;

    const inner = new Float32Array(innerCount * 3);
    for (let i = 0; i < innerCount; i++) {
      // Concentrated shell with slight thickness
      const r = 1.6 + rng() * 0.6;
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      inner[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      inner[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85;
      inner[i * 3 + 2] = r * Math.cos(phi);
    }
    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute('position', new THREE.BufferAttribute(inner, 3));

    const outer = new Float32Array(outerCount * 3);
    for (let i = 0; i < outerCount; i++) {
      // Wider, sparser cloud
      const r = 2.2 + Math.pow(rng(), 1.6) * 2.6;
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      outer[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      outer[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.9;
      outer[i * 3 + 2] = r * Math.cos(phi);
    }
    const outerGeo = new THREE.BufferGeometry();
    outerGeo.setAttribute('position', new THREE.BufferAttribute(outer, 3));

    return { innerGeometry: innerGeo, outerGeometry: outerGeo };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04;
      groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.14;
      // soft mouse parallax — eased
      groupRef.current.position.x +=
        (mouseRef.current.x * 0.4 - groupRef.current.position.x) * 0.04;
      groupRef.current.position.y +=
        (-mouseRef.current.y * 0.3 - groupRef.current.position.y) * 0.04;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.08;
      innerRef.current.rotation.z = t * 0.025;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.018;
    }
  });

  // Pick up pointer position once on mount
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
      <points ref={outerRef} geometry={outerGeometry}>
        <pointsMaterial
          color="#f5f3ee"
          size={0.014}
          sizeAttenuation
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function Scene3D() {
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
          <ParticleField />
          {/* subtle volumetric fog to fade outer particles into the bg */}
          <fog attach="fog" args={['#050505', 4.5, 8.5]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
