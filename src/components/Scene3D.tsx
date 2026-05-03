'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMediaQuery } from './useMediaQuery';

function WireSphere() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.06;
    groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.18;
    groupRef.current.position.y = Math.sin(t * 0.4) * 0.1;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial
          color="#f5f3ee"
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[2.05, 0]} />
        <meshBasicMaterial
          color="#f5f3ee"
          wireframe
          transparent
          opacity={0.07}
        />
      </mesh>
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
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <WireSphere />
        </Suspense>
      </Canvas>
    </div>
  );
}
