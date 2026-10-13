"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  MeshTransmissionMaterial,
  PresentationControls,
} from "@react-three/drei";
import { createRandom } from "@/lib/random";

export const PEARL = "#f3eee6";

export type ShapeId = "knot" | "gem" | "helix" | "halo";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/** Studio lighting made only of light-formers — no HDR download needed. */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#ece6dc"]} />
      <Lightformer form="ring" intensity={4} position={[0, 5, -2]} scale={6} />
      <Lightformer form="rect" intensity={3} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
      <Lightformer form="rect" intensity={2} color="#c4b5fd" position={[5, 0, 0]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={2} color="#fdba74" position={[0, -1, 5]} scale={[10, 1, 1]} />
      <Lightformer form="circle" intensity={6} position={[2, 4, 4]} scale={1.5} />
    </Environment>
  );
}

/** Pointer position over the whole window, normalised to -1..1. */
function useWindowPointer() {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return pointer;
}

function twistedColumn() {
  const g = new THREE.BoxGeometry(0.85, 2.3, 0.85, 4, 96, 4);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const a = v.y * 1.5;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pos.setXYZ(i, v.x * c - v.z * s, v.y, v.x * s + v.z * c);
  }
  g.computeVertexNormals();
  return g;
}

function makeGeometry(shape: ShapeId) {
  switch (shape) {
    case "knot":
      return new THREE.TorusKnotGeometry(0.75, 0.26, 220, 36, 2, 3);
    case "gem":
      return new THREE.IcosahedronGeometry(1.15, 0);
    case "helix":
      return twistedColumn();
    case "halo":
      return new THREE.TorusGeometry(0.9, 0.34, 48, 128);
  }
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function HeroSculpture() {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const pointer = useWindowPointer();
  const { viewport, size } = useThree();
  const mobile = size.width < 768;
  const geometry = useMemo(() => makeGeometry("knot"), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    if (!group.current || !mesh.current) return;
    const p = pointer.current;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -p.y * 0.35, 3, dt);
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, -p.x * 0.25, 3, dt);
    mesh.current.rotation.y += dt * 0.25;
  });

  const x = mobile ? 0 : viewport.width * 0.2;
  const y = mobile ? 0.55 : 0.1;
  const scale = mobile ? 0.85 : 1.15;

  return (
    <group ref={group} position={[x, y, 0]} scale={scale}>
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh ref={mesh} geometry={geometry}>
          <MeshTransmissionMaterial
            samples={mobile ? 4 : 10}
            resolution={mobile ? 256 : 768}
            backside
            backsideThickness={0.3}
            thickness={0.6}
            roughness={0.05}
            ior={1.45}
            chromaticAberration={0.35}
            anisotropy={0.3}
            anisotropicBlur={0.15}
            distortion={0.25}
            distortionScale={0.4}
            temporalDistortion={0.08}
            color="#ffffff"
          />
        </mesh>
      </Float>
    </group>
  );
}

/** Small glass pebbles drifting around the sculpture (cheap built-in transmission). */
function Pebbles() {
  const { viewport, size } = useThree();
  const mobile = size.width < 768;
  const items = useMemo(() => {
    const rand = createRandom(7);
    const kinds = ["sphere", "ico", "torus", "oct"] as const;
    return Array.from({ length: 9 }, (_, i) => ({
      kind: kinds[i % kinds.length],
      position: [
        (rand() - 0.5) * 9,
        (rand() - 0.5) * 4.5,
        -1.5 - rand() * 3,
      ] as [number, number, number],
      scale: 0.18 + rand() * 0.28,
      speed: 0.8 + rand() * 1.5,
      tint: ["#ffffff", "#ddd6fe", "#fed7aa", "#bbf7d0"][Math.floor(rand() * 4)],
    }));
  }, []);

  return (
    <group position={[mobile ? 0 : viewport.width * 0.08, 0, 0]}>
      {items.map((it, i) => (
        <Float key={i} speed={it.speed} rotationIntensity={2} floatIntensity={1.5}>
          <mesh position={it.position} scale={it.scale}>
            {it.kind === "sphere" && <sphereGeometry args={[1, 32, 32]} />}
            {it.kind === "ico" && <icosahedronGeometry args={[1, 0]} />}
            {it.kind === "torus" && <torusGeometry args={[0.8, 0.3, 24, 48]} />}
            {it.kind === "oct" && <octahedronGeometry args={[1, 0]} />}
            <meshPhysicalMaterial
              color={it.tint}
              transmission={1}
              thickness={0.8}
              roughness={0.08}
              ior={1.5}
              iridescence={0.6}
              iridescenceIOR={1.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** Coloured orbs behind the glass so there is something rich to refract. */
function Backdrop() {
  const { viewport, size } = useThree();
  const mobile = size.width < 768;
  const x = mobile ? 0 : viewport.width * 0.2;
  return (
    <group position={[x, mobile ? 0.55 : 0.1, -3.2]}>
      <mesh position={[-1.1, 0.6, 0]}>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.4} />
      </mesh>
      <mesh position={[1.2, -0.5, -0.4]}>
        <sphereGeometry args={[0.75, 48, 48]} />
        <meshStandardMaterial color="#fb923c" roughness={0.4} />
      </mesh>
      <mesh position={[0.2, 1.4, -0.8]}>
        <sphereGeometry args={[0.45, 48, 48]} />
        <meshStandardMaterial color="#34d399" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.2, -1.2]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[6, 0.08, 0.08]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
    </group>
  );
}

export function HeroCanvas({ active }: { active: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[PEARL]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <Studio />
      <Backdrop />
      <Pebbles />
      <HeroSculpture />
      <ContactShadows position={[0, -1.85, 0]} opacity={0.35} scale={14} blur={2.6} far={4} resolution={512} color="#57534e" />
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* Configurator                                                        */
/* ------------------------------------------------------------------ */

const SIZE_SCALE = { S: 0.8, M: 1, L: 1.2 } as const;
export type SizeId = keyof typeof SIZE_SCALE;

function ConfigPiece({ shape, tint, size }: { shape: ShapeId; tint: string; size: SizeId }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [shown, setShown] = useState<ShapeId>(shape);
  const scale = useRef(0);
  const target = useMemo(() => new THREE.Color(), []);
  const mobile = useThree((s) => s.size.width < 640);

  const geometries = useMemo(
    () => ({
      knot: makeGeometry("knot"),
      gem: makeGeometry("gem"),
      helix: makeGeometry("helix"),
      halo: makeGeometry("halo"),
    }),
    [],
  );
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    // Shrink the old shape away, swap geometry at the bottom, grow the new one back.
    const goal = shown === shape ? SIZE_SCALE[size] : 0;
    scale.current = THREE.MathUtils.damp(scale.current, goal, 9, dt);
    if (shown !== shape && scale.current < 0.04) setShown(shape);
    m.scale.setScalar(scale.current);
    m.rotation.y += dt * 0.35;
    const mat = m.material as THREE.MeshPhysicalMaterial;
    mat.color.lerp(target.set(tint), 1 - Math.exp(-6 * dt));
  });

  return (
    <mesh ref={mesh} geometry={geometries[shown]} rotation={[0.35, 0, 0]}>
      <MeshTransmissionMaterial
        samples={mobile ? 4 : 8}
        resolution={mobile ? 256 : 512}
        backside
        backsideThickness={0.25}
        thickness={0.7}
        roughness={0.04}
        ior={1.5}
        chromaticAberration={0.25}
        anisotropicBlur={0.1}
        distortion={0.15}
        distortionScale={0.3}
        temporalDistortion={0.05}
      />
    </mesh>
  );
}

function ConfigBackdrop() {
  const rings = useMemo(() => {
    const rand = createRandom(21);
    return Array.from({ length: 7 }, (_, i) => ({
      x: (i - 3) * 0.9,
      h: 1.5 + rand() * 2.5,
      color: ["#c4b5fd", "#fdba74", "#fda4af", "#99f6e4"][i % 4],
    }));
  }, []);
  return (
    <group position={[0, 0, -2.6]}>
      {rings.map((r, i) => (
        <mesh key={i} position={[r.x, r.h / 2 - 1.6, 0]}>
          <boxGeometry args={[0.35, r.h, 0.35]} />
          <meshStandardMaterial color={r.color} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function ConfiguratorCanvas({
  active,
  shape,
  tint,
  size,
}: {
  active: boolean;
  shape: ShapeId;
  tint: string;
  size: SizeId;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.3, 5.5], fov: 35 }}
    >
      <color attach="background" args={["#ebe4d8"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={1} />
      <Studio />
      <ConfigBackdrop />
      <PresentationControls
        global={false}
        cursor
        snap
        speed={1.4}
        polar={[-0.4, 0.4]}
        azimuth={[-Math.PI / 2, Math.PI / 2]}
      >
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
          <ConfigPiece shape={shape} tint={tint} size={size} />
        </Float>
      </PresentationControls>
      <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={8} blur={2.4} far={3} resolution={512} color="#57534e" />
    </Canvas>
  );
}
