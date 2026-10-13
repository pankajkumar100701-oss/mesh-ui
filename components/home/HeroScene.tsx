"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createRandom } from "@/lib/random";

function Core() {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current || !shell.current) return;
    // Ease the whole sculpture toward the pointer.
    const { x, y } = state.pointer;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, x * 0.6, 3, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -y * 0.4, 3, delta);
    shell.current.rotation.y += delta * 0.15;
    shell.current.rotation.z += delta * 0.08;
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh>
          <icosahedronGeometry args={[1.25, 32]} />
          <MeshDistortMaterial
            color="#6d5dfc"
            emissive="#1b0f5c"
            roughness={0.15}
            metalness={0.6}
            distort={0.38}
            speed={2.2}
          />
        </mesh>
      </Float>
      <mesh ref={shell} scale={2.05}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#9fb4ff" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function Satellites() {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(() => {
    const random = createRandom(7);
    const colors = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#a78bfa"];
    return Array.from({ length: 14 }, (_, i) => ({
      radius: 2.6 + random() * 1.6,
      angle: (i / 14) * Math.PI * 2,
      y: (random() - 0.5) * 2.4,
      size: 0.08 + random() * 0.14,
      shape: i % 3,
      color: colors[i % colors.length],
    }));
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <Float key={i} speed={1.5 + (i % 4) * 0.4} floatIntensity={1.2}>
          <mesh
            position={[Math.cos(it.angle) * it.radius, it.y, Math.sin(it.angle) * it.radius]}
            scale={it.size}
          >
            {it.shape === 0 && <boxGeometry />}
            {it.shape === 1 && <octahedronGeometry />}
            {it.shape === 2 && <torusGeometry args={[1, 0.4, 12, 32]} />}
            <meshStandardMaterial color={it.color} emissive={it.color} emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-4, -2, 2]} intensity={30} color="#22d3ee" />
      <pointLight position={[3, -3, -2]} intensity={30} color="#f472b6" />
      <Core />
      <Satellites />
    </Canvas>
  );
}
