'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 2000;

function createParticleData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 10;
    positions[i3 + 1] = (Math.random() - 0.5) * 10;
    positions[i3 + 2] = (Math.random() - 0.5) * 10;
    velocities[i3] = (Math.random() - 0.5) * 0.002;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.002;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.002;
  }
  return { positions, velocities };
}

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const dataRef = useRef<ReturnType<typeof createParticleData> | null>(null);
  const geoRef = useRef<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const data = createParticleData();
    dataRef.current = data;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geoRef.current = geo;

    if (meshRef.current) {
      meshRef.current.geometry = geo;
    }

    return () => { geo.dispose(); };
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !dataRef.current) return;
    const { velocities } = dataRef.current;
    const posAttr = meshRef.current.geometry.getAttribute('position');
    if (!posAttr) return;
    const posArray = posAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArray[i3] += velocities[i3] + Math.sin(time * 0.3 + i * 0.01) * 0.001;
      posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i * 0.01) * 0.001;
      posArray[i3 + 2] += velocities[i3 + 2];

      for (let j = 0; j < 3; j++) {
        if (Math.abs(posArray[i3 + j]) > 5) {
          velocities[i3 + j] *= -1;
        }
      }
    }
    posAttr.needsUpdate = true;

    meshRef.current.rotation.y = time * 0.02;
    meshRef.current.rotation.x = Math.sin(time * 0.01) * 0.1;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.03}
        color="#00f0ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingGeo() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.05;
    groupRef.current.rotation.z = Math.sin(t * 0.1) * 0.1;
    groupRef.current.position.y = Math.sin(t * 0.3) * 0.2;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial
          color="#0a0a0a"
          wireframe
          emissive="#00f0ff"
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshStandardMaterial
          color="#0a0a0a"
          wireframe
          emissive="#8B5CF6"
          emissiveIntensity={0.1}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#00f0ff" />
        <pointLight position={[-5, -5, 5]} intensity={0.3} color="#8B5CF6" />
        <ParticleField />
        <FloatingGeo />
      </Canvas>
    </div>
  );
}
