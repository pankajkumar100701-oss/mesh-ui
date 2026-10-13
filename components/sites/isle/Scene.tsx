"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { createRandom } from "@/lib/random";

export type Spot = {
  id: string;
  name: string;
  position: [number, number, number];
};

type SceneProps = {
  night: boolean;
  spots: Spot[];
  active: string | null;
  onSelect: (id: string | null) => void;
};

/** 0 = full day, 1 = full night. Shared by every animated part of the scene. */
type Mix = RefObject<number>;

const PALETTE = {
  grass: "#7cc46a",
  grassDark: "#5aa957",
  sand: "#e9d7a8",
  rock: "#9a8a78",
  rockDark: "#6f6257",
  wood: "#c98f5a",
  roof: "#a8483a",
  pine: "#3f8f5a",
  leaf: "#8bd06f",
  trunk: "#7a5236",
  stone: "#e3dccb",
  water: "#4fd1c5",
};

const SKY_DAY = new THREE.Color("#a5dfe6");
const SKY_NIGHT = new THREE.Color("#0b1630");
const SEA_DAY = new THREE.Color("#38a3a5");
const SEA_NIGHT = new THREE.Color("#0c2a3c");
const CLOUD_DAY = new THREE.Color("#ffffff");
const CLOUD_NIGHT = new THREE.Color("#55648c");
const SUN_COLOR = new THREE.Color("#fff1d6");
const MOON_COLOR = new THREE.Color("#9fb6ff");
const HEMI_SKY_DAY = new THREE.Color("#e4f7ff");
const HEMI_SKY_NIGHT = new THREE.Color("#2b3c70");
const HEMI_GROUND_DAY = new THREE.Color("#6b8f4e");
const HEMI_GROUND_NIGHT = new THREE.Color("#0f1620");
const SUN_POS = new THREE.Vector3(14, 16, -10);
const MOON_POS = new THREE.Vector3(-14, 14, -12);

const HOME_CAM = new THREE.Vector3(10, 5.5, 12);
const HOME_TARGET = new THREE.Vector3(0, 0.2, 0);

const CABIN = new THREE.Vector3(1.4, 0.4, -1.4);
const POOL = new THREE.Vector3(1.2, 0.4, 1.6);
const TIER = new THREE.Vector3(-1.6, 0.4, -1.2);
const FALLS = new THREE.Vector3(-3.6, 0.4, 1.8);
const POST = new THREE.Vector3(2.75, 0.4, 2.75);
const BALLOON = new THREE.Vector3(4.4, 2.2, 4.2);
const STREAM_START = new THREE.Vector3(-2.1, 0.41, 0.45);

/**
 * Pushes every vertex by a hash of its own position, so duplicated seam
 * vertices move together and the low-poly mesh stays watertight.
 */
function jitter(geo: THREE.BufferGeometry, amount: number, seed: number, keepTop?: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const hash = (x: number, y: number, z: number, k: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.3 + k * 51.9) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = Math.round(pos.getX(i) * 1000) / 1000;
    const y = Math.round(pos.getY(i) * 1000) / 1000;
    const z = Math.round(pos.getZ(i) * 1000) / 1000;
    const lockY = keepTop !== undefined && y >= keepTop;
    pos.setXYZ(
      i,
      x + hash(x, y, z, 1) * amount,
      lockY ? y : y + hash(x, y, z, 2) * amount * 0.6,
      z + hash(x, y, z, 3) * amount,
    );
  }
  geo.computeVertexNormals();
  return geo;
}

function damp(current: number, target: number, speed: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-speed * dt));
}

/* ------------------------------------------------------------------ */
/* Lighting, sky and fog                                               */
/* ------------------------------------------------------------------ */

function Atmosphere({ mixRef, night }: { mixRef: Mix; night: boolean }) {
  const background = useRef<THREE.Color>(null);
  const fog = useRef<THREE.Fog>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sunMesh = useRef<THREE.Mesh>(null);
  const moonMesh = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    mixRef.current = damp(mixRef.current, night ? 1 : 0, 2.2, dt);
    const m = mixRef.current;
    background.current?.lerpColors(SKY_DAY, SKY_NIGHT, m);
    fog.current?.color.lerpColors(SKY_DAY, SKY_NIGHT, m);
    if (sun.current) {
      sun.current.color.lerpColors(SUN_COLOR, MOON_COLOR, m);
      sun.current.intensity = THREE.MathUtils.lerp(2.6, 0.55, m);
      sun.current.position.lerpVectors(SUN_POS, MOON_POS, m);
    }
    if (hemi.current) {
      hemi.current.color.lerpColors(HEMI_SKY_DAY, HEMI_SKY_NIGHT, m);
      hemi.current.groundColor.lerpColors(HEMI_GROUND_DAY, HEMI_GROUND_NIGHT, m);
      hemi.current.intensity = THREE.MathUtils.lerp(1.2, 0.45, m);
    }
    sunMesh.current?.scale.setScalar(Math.max(0.001, 1 - m));
    moonMesh.current?.scale.setScalar(Math.max(0.001, m));
  });

  return (
    <>
      <color ref={background} attach="background" args={[SKY_DAY]} />
      <fog ref={fog} attach="fog" args={[SKY_DAY, 24, 70]} />
      <hemisphereLight ref={hemi} args={[HEMI_SKY_DAY, HEMI_GROUND_DAY, 1.2]} />
      <directionalLight
        ref={sun}
        position={SUN_POS}
        intensity={2.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
      <mesh ref={sunMesh} position={[30, 26, -40]}>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshBasicMaterial color={[2.2, 1.9, 1.2]} toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={moonMesh} position={[-30, 22, -36]} scale={0.001}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshBasicMaterial color={[1.6, 1.7, 2.1]} toneMapped={false} fog={false} />
      </mesh>
    </>
  );
}

function Stars({ mixRef }: { mixRef: Mix }) {
  const material = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const random = createRandom(7);
    const count = 700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(random() * 0.9 + 0.08);
      const r = 60 + random() * 20;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) - 4;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.opacity = mixRef.current * (0.75 + Math.sin(clock.elapsedTime * 1.7) * 0.15);
    material.current.visible = mixRef.current > 0.02;
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={material}
        color="#ffffff"
        size={0.55}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* The island                                                          */
/* ------------------------------------------------------------------ */

function IslandBody() {
  const { top, beach, rock, rockTail, tier } = useMemo(
    () => ({
      top: jitter(new THREE.CylinderGeometry(4.2, 4.15, 0.7, 14, 1), 0.12, 1, 0.34),
      beach: jitter(new THREE.CylinderGeometry(4.4, 4.3, 0.3, 14, 1), 0.1, 2),
      rock: jitter(new THREE.ConeGeometry(4.3, 4.6, 11, 4), 0.35, 3, 2.2),
      rockTail: jitter(new THREE.ConeGeometry(1.6, 2.4, 7, 2), 0.2, 4),
      tier: jitter(new THREE.CylinderGeometry(1.3, 1.55, 0.8, 9, 1), 0.08, 5, 0.39),
    }),
    [],
  );

  return (
    <group>
      <mesh geometry={top} position={[0, 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.grass} flatShading roughness={0.9} />
      </mesh>
      <mesh geometry={beach} position={[0, -0.2, 0]} receiveShadow>
        <meshStandardMaterial color={PALETTE.sand} flatShading roughness={1} />
      </mesh>
      <mesh geometry={rock} position={[0, -2.6, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <meshStandardMaterial color={PALETTE.rock} flatShading roughness={1} />
      </mesh>
      <mesh geometry={rockTail} position={[0.6, -5.2, -0.4]} rotation={[Math.PI, 0.4, 0]}>
        <meshStandardMaterial color={PALETTE.rockDark} flatShading roughness={1} />
      </mesh>
      <mesh geometry={tier} position={[TIER.x, 0.8, TIER.z]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.grassDark} flatShading roughness={0.9} />
      </mesh>
    </group>
  );
}

function FloatingRocks() {
  const group = useRef<THREE.Group>(null);
  const rocks = useMemo(() => {
    const random = createRandom(21);
    return Array.from({ length: 7 }, (_, i) => {
      const angle = (i / 7) * Math.PI * 2 + random() * 0.5;
      const r = 5.4 + random() * 1.8;
      return {
        position: [Math.cos(angle) * r, -1.5 - random() * 3, Math.sin(angle) * r] as const,
        scale: 0.25 + random() * 0.4,
        phase: random() * Math.PI * 2,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      const rock = rocks[i];
      child.position.y = rock.position[1] + Math.sin(clock.elapsedTime * 0.8 + rock.phase) * 0.25;
      child.rotation.y += 0.002;
    });
  });

  return (
    <group ref={group}>
      {rocks.map((rock, i) => (
        <mesh key={i} position={[...rock.position]} scale={rock.scale} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={PALETTE.rock} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Trees() {
  const trees = useMemo(() => {
    const random = createRandom(11);
    const avoid: [THREE.Vector3, number][] = [
      [CABIN, 1.35],
      [POOL, 1.35],
      [TIER, 1.75],
      [FALLS, 1.1],
      [POST, 0.8],
      [new THREE.Vector3(-2.9, 0.4, 1.15), 0.7],
      [new THREE.Vector3(1.3, 0.4, 0.1), 0.6],
    ];
    const list: { x: number; z: number; y: number; scale: number; kind: "pine" | "round"; rot: number }[] = [];
    let tries = 0;
    while (list.length < 22 && tries < 600) {
      tries++;
      const angle = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * 3.6;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const p = new THREE.Vector3(x, 0.4, z);
      if (avoid.some(([c, d]) => p.distanceTo(c) < d)) continue;
      if (list.some((t) => Math.hypot(t.x - x, t.z - z) < 0.6)) continue;
      list.push({ x, z, y: 0.4, scale: 0.7 + random() * 0.6, kind: random() > 0.45 ? "pine" : "round", rot: random() * 6 });
    }
    // A small grove on the upper tier.
    list.push({ x: TIER.x - 0.6, z: TIER.z - 0.5, y: 1.2, scale: 1.1, kind: "pine", rot: 0.4 });
    list.push({ x: TIER.x - 0.1, z: TIER.z - 0.85, y: 1.2, scale: 0.8, kind: "pine", rot: 1.2 });
    return list;
  }, []);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, t.y, t.z]} scale={t.scale} rotation={[0, t.rot, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 0.4, 5]} />
            <meshStandardMaterial color={PALETTE.trunk} flatShading />
          </mesh>
          {t.kind === "pine" ? (
            <>
              <mesh position={[0, 0.6, 0]} castShadow>
                <coneGeometry args={[0.38, 0.6, 6]} />
                <meshStandardMaterial color={PALETTE.pine} flatShading />
              </mesh>
              <mesh position={[0, 0.92, 0]} castShadow>
                <coneGeometry args={[0.27, 0.5, 6]} />
                <meshStandardMaterial color={PALETTE.pine} flatShading />
              </mesh>
            </>
          ) : (
            <mesh position={[0, 0.65, 0]} castShadow>
              <icosahedronGeometry args={[0.36, 0]} />
              <meshStandardMaterial color={PALETTE.leaf} flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/* Shared emissive materials whose glow follows the night mix (see GlowDriver). */
const glowMaterial = (color: string, base: string) =>
  new THREE.MeshStandardMaterial({ color: base, emissive: color, emissiveIntensity: 0, toneMapped: false });
const WINDOW_MAT = glowMaterial("#ffb347", "#3b2a1a");
const LANTERN_MAT = glowMaterial("#ffc46b", "#f6e2b3");
const PATH_MAT = glowMaterial("#ffbf5e", "#f1e3c2");
const CLOUD_MAT = new THREE.MeshStandardMaterial({ color: CLOUD_DAY, flatShading: true, roughness: 1, transparent: true, opacity: 0.95 });
const FALLS_UNIFORMS = { uTime: { value: 0 }, uNight: { value: 0 } };

function GlowDriver({ mixRef }: { mixRef: Mix }) {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = mixRef.current;
    const flicker = 1 + Math.sin(t * 9) * 0.04;
    WINDOW_MAT.emissiveIntensity = m * 3.2 * flicker;
    LANTERN_MAT.emissiveIntensity = m * 5 * flicker;
    PATH_MAT.emissiveIntensity = m * 4.5 * flicker;
    CLOUD_MAT.color.lerpColors(CLOUD_DAY, CLOUD_NIGHT, m);
    FALLS_UNIFORMS.uTime.value = t;
    FALLS_UNIFORMS.uNight.value = m;
  });
  return null;
}

function NightLight({ mixRef, position, strength = 7 }: { mixRef: Mix; position: [number, number, number]; strength?: number }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (light.current) light.current.intensity = mixRef.current * strength;
  });
  return <pointLight ref={light} position={position} color="#ffb04a" distance={5} decay={1.6} intensity={0} />;
}

function Cabin({ mixRef }: { mixRef: Mix }) {
  const rotation = Math.atan2(CABIN.x, CABIN.z);
  return (
    <group position={CABIN} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.8, 0.9]} />
        <meshStandardMaterial color={PALETTE.wood} flatShading />
      </mesh>
      <mesh position={[0, 1.08, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.98, 0.6, 4]} />
        <meshStandardMaterial color={PALETTE.roof} flatShading />
      </mesh>
      <mesh position={[0.3, 1.2, -0.15]} castShadow>
        <boxGeometry args={[0.14, 0.4, 0.14]} />
        <meshStandardMaterial color={PALETTE.stone} flatShading />
      </mesh>
      <mesh position={[-0.28, 0.48, 0.451]} material={WINDOW_MAT}>
        <planeGeometry args={[0.24, 0.24]} />
      </mesh>
      <mesh position={[0.28, 0.48, 0.451]} material={WINDOW_MAT}>
        <planeGeometry args={[0.24, 0.24]} />
      </mesh>
      <mesh position={[0.551, 0.48, 0]} rotation={[0, Math.PI / 2, 0]} material={WINDOW_MAT}>
        <planeGeometry args={[0.24, 0.24]} />
      </mesh>
      <mesh position={[0, 0.22, 0.452]}>
        <planeGeometry args={[0.2, 0.42]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[0, 0.03, 0.62]} receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.42]} />
        <meshStandardMaterial color="#b07a4a" flatShading />
      </mesh>
      <NightLight mixRef={mixRef} position={[0, 0.6, 1]} />
    </group>
  );
}

function Spa({ mixRef }: { mixRef: Mix }) {
  const water = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!water.current) return;
    water.current.emissiveIntensity = 0.15 + mixRef.current * (1.6 + Math.sin(clock.elapsedTime * 2) * 0.2);
  });
  return (
    <group position={POOL}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.85, 0.14, 8]} />
        <meshStandardMaterial color={PALETTE.stone} flatShading />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.02, 8]} />
        <meshStandardMaterial ref={water} color={PALETTE.water} emissive="#2dd4bf" emissiveIntensity={0.15} roughness={0.15} toneMapped={false} />
      </mesh>
      {/* Pavilion */}
      <group position={[0.95, 0, -0.75]}>
        {[
          [-0.3, -0.3],
          [0.3, -0.3],
          [-0.3, 0.3],
          [0.3, 0.3],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.32, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.64, 5]} />
            <meshStandardMaterial color="#f4ede0" />
          </mesh>
        ))}
        <mesh position={[0, 0.72, 0]} castShadow>
          <coneGeometry args={[0.6, 0.3, 4]} />
          <meshStandardMaterial color="#f2c48d" flatShading />
        </mesh>
      </group>
      {/* Loungers */}
      {[-0.35, 0.15].map((x, i) => (
        <mesh key={i} position={[x - 0.6, 0.06, 0.95]} rotation={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.22, 0.08, 0.55]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      <NightLight mixRef={mixRef} position={[0, 0.6, 0]} strength={3} />
    </group>
  );
}

function Lookout({ mixRef }: { mixRef: Mix }) {
  const flag = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.35;
  });
  return (
    <group position={[TIER.x, 1.2, TIER.z]}>
      {/* Flag */}
      <mesh position={[0.5, 0.55, 0.3]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.1, 4]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      <group ref={flag} position={[0.5, 0.95, 0.3]}>
        <mesh position={[0.2, 0, 0]}>
          <planeGeometry args={[0.4, 0.22]} />
          <meshStandardMaterial color="#f97362" side={THREE.DoubleSide} flatShading />
        </mesh>
      </group>
      {/* Bench */}
      <mesh position={[0.2, 0.1, 0.7]} rotation={[0, -0.6, 0]} castShadow>
        <boxGeometry args={[0.6, 0.06, 0.18]} />
        <meshStandardMaterial color={PALETTE.trunk} />
      </mesh>
      {/* Lantern post */}
      <mesh position={[-0.3, 0.35, 0.55]}>
        <cylinderGeometry args={[0.025, 0.03, 0.7, 5]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-0.3, 0.75, 0.55]} material={LANTERN_MAT}>
        <octahedronGeometry args={[0.1, 0]} />
      </mesh>
      <NightLight mixRef={mixRef} position={[-0.3, 0.9, 0.55]} strength={6} />
    </group>
  );
}

function PathLanterns() {
  const stones = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      out.push([THREE.MathUtils.lerp(CABIN.x, POOL.x, t) + Math.sin(t * 6) * 0.25, THREE.MathUtils.lerp(CABIN.z + 0.7, POOL.z - 0.9, t)]);
    }
    return out;
  }, []);
  return (
    <group>
      {stones.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.41, z]} rotation={[0, i, 0]} receiveShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.04, 6]} />
          <meshStandardMaterial color={PALETTE.stone} flatShading />
        </mesh>
      ))}
      {stones
        .filter((_, i) => i % 2 === 1)
        .map(([x, z], i) => (
          <group key={i} position={[x + 0.35, 0.4, z]}>
            <mesh position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.36, 4]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.4, 0]} material={PATH_MAT}>
              <octahedronGeometry args={[0.06, 0]} />
            </mesh>
          </group>
        ))}
    </group>
  );
}

const fallsVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fallsFragment = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  varying vec2 vUv;
  void main() {
    float stripes = sin(vUv.y * 46.0 + uTime * 9.0 + sin(vUv.x * 14.0) * 1.6) * 0.5 + 0.5;
    vec3 col = mix(vec3(0.58, 0.88, 0.94), vec3(1.0), stripes * 0.55);
    col *= mix(1.0, 0.4, uNight);
    float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
    float fade = smoothstep(0.0, 0.7, vUv.y);
    gl_FragColor = vec4(col, edge * fade * 0.9);
  }
`;

function Waterfall() {
  const angle = Math.atan2(FALLS.x, FALLS.z);
  const dir = new THREE.Vector3(FALLS.x, 0, FALLS.z).normalize();
  const edge = dir.clone().multiplyScalar(4.42);
  const streamEnd = dir.clone().multiplyScalar(4.1).setY(0.41);
  const streamLen = STREAM_START.distanceTo(streamEnd);
  const streamMid = STREAM_START.clone().add(streamEnd).multiplyScalar(0.5);
  const streamRot = Math.atan2(streamEnd.x - STREAM_START.x, streamEnd.z - STREAM_START.z);

  return (
    <group>
      <mesh position={[STREAM_START.x, 0.41, STREAM_START.z]}>
        <cylinderGeometry args={[0.45, 0.45, 0.03, 8]} />
        <meshStandardMaterial color="#5cc8d6" roughness={0.2} flatShading />
      </mesh>
      <mesh position={streamMid} rotation={[0, streamRot, 0]}>
        <boxGeometry args={[0.32, 0.03, streamLen]} />
        <meshStandardMaterial color="#5cc8d6" roughness={0.2} />
      </mesh>
      <mesh position={[edge.x, -2.6, edge.z]} rotation={[0, angle, 0]}>
        <planeGeometry args={[0.55, 6, 1, 1]} />
        <shaderMaterial
          vertexShader={fallsVertex}
          fragmentShader={fallsFragment}
          uniforms={FALLS_UNIFORMS}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Balloon() {
  const balloon = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!balloon.current) return;
    const t = clock.elapsedTime;
    balloon.current.rotation.z = Math.sin(t * 0.7) * 0.05;
    balloon.current.rotation.x = Math.cos(t * 0.6) * 0.04;
  });
  const basket = BALLOON.clone();
  const tether = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(POST.x, 0.85, POST.z), BALLOON.clone().add(new THREE.Vector3(0, 0.1, 0))]);
    return geo;
  }, []);
  return (
    <group>
      <mesh position={[POST.x, 0.62, POST.z]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.5, 5]} />
        <meshStandardMaterial color={PALETTE.trunk} />
      </mesh>
      <lineSegments geometry={tether}>
        <lineBasicMaterial color="#4b3a2a" />
      </lineSegments>
      <group ref={balloon} position={basket} scale={0.6}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.26, 0.36]} />
          <meshStandardMaterial color="#8b5a2b" flatShading />
        </mesh>
        {[
          [-0.15, -0.15],
          [0.15, -0.15],
          [-0.15, 0.15],
          [0.15, 0.15],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.45, z]}>
            <cylinderGeometry args={[0.008, 0.008, 0.65, 3]} />
            <meshBasicMaterial color="#3f3f46" />
          </mesh>
        ))}
        <mesh position={[0, 0.95, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.5, 0.55, 10]} />
          <meshStandardMaterial color="#f4d35e" flatShading />
        </mesh>
        <mesh position={[0, 1.55, 0]} scale={[1, 1.12, 1]} castShadow>
          <sphereGeometry args={[0.85, 10, 8]} />
          <meshStandardMaterial color="#ef7d57" flatShading />
        </mesh>
        <mesh position={[0, 1.55, 0]} scale={[1, 1.12, 1]}>
          <torusGeometry args={[0.86, 0.06, 4, 10]} />
          <meshStandardMaterial color="#fff4e0" flatShading />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sky life: clouds, birds, sea                                        */
/* ------------------------------------------------------------------ */

function Clouds() {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const random = createRandom(33);
    return Array.from({ length: 8 }, () => ({
      radius: 7.5 + random() * 6,
      angle: random() * Math.PI * 2,
      height: -3 + random() * 8,
      speed: (0.02 + random() * 0.03) * (random() > 0.5 ? 1 : -1),
      scale: 0.6 + random() * 0.7,
      puffs: Array.from({ length: 3 + Math.floor(random() * 3) }, (_, j) => ({
        x: (j - 1.5) * 0.7 + random() * 0.3,
        y: random() * 0.35,
        z: random() * 0.5 - 0.25,
        s: 0.45 + random() * 0.45,
      })),
    }));
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const c = clouds[i];
      const a = c.angle + t * c.speed;
      child.position.set(Math.cos(a) * c.radius, c.height + Math.sin(t * 0.3 + i) * 0.2, Math.sin(a) * c.radius);
      child.rotation.y = -a;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} scale={c.scale}>
          {c.puffs.map((p, j) => (
            <mesh key={j} position={[p.x, p.y, p.z]} scale={p.s} material={CLOUD_MAT}>
              <icosahedronGeometry args={[1, 0]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Birds() {
  const group = useRef<THREE.Group>(null);
  const wing = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, 0, -0.06, 0, 0, 0.08, 0.28, 0, 0]), 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
  const birds = useMemo(() => {
    const random = createRandom(55);
    return Array.from({ length: 6 }, () => ({
      radius: 5.5 + random() * 2.5,
      height: 2.6 + random() * 1.8,
      speed: 0.25 + random() * 0.15,
      phase: random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current?.children.forEach((bird, i) => {
      const b = birds[i];
      const a = b.phase + t * b.speed;
      bird.position.set(Math.cos(a) * b.radius, b.height + Math.sin(t * 1.3 + i) * 0.25, Math.sin(a) * b.radius);
      bird.rotation.y = -a;
      const flap = Math.sin(t * 9 + i * 1.7) * 0.7;
      bird.children[0].rotation.x = flap;
      bird.children[1].rotation.x = -flap;
    });
  });

  return (
    <group ref={group}>
      {birds.map((_, i) => (
        <group key={i}>
          <mesh geometry={wing} rotation={[0, Math.PI / 2, 0]}>
            <meshBasicMaterial color="#27313a" side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={wing} rotation={[0, -Math.PI / 2, 0]}>
            <meshBasicMaterial color="#27313a" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Sea({ mixRef }: { mixRef: Mix }) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const baseRef = useRef<Float32Array | null>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    const pos = mesh.current.geometry.attributes.position as THREE.BufferAttribute;
    baseRef.current ??= Float32Array.from(pos.array);
    const base = baseRef.current;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 0.22 + t * 0.9) * 0.4 + Math.cos(y * 0.27 + t * 0.7) * 0.35);
    }
    pos.needsUpdate = true;
    material.current?.color.lerpColors(SEA_DAY, SEA_NIGHT, mixRef.current);
  });

  return (
    <mesh ref={mesh} position={[0, -11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[160, 160, 48, 48]} />
      <meshStandardMaterial ref={material} color={SEA_DAY} flatShading roughness={0.35} metalness={0.1} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Hotspots + camera                                                   */
/* ------------------------------------------------------------------ */

function Hotspots({ spots, active, onSelect }: Omit<SceneProps, "night">) {
  return (
    <>
      {spots.map((spot) => {
        const isActive = spot.id === active;
        return (
          <Html key={spot.id} position={spot.position} center zIndexRange={[30, 0]}>
            <button
              type="button"
              onClick={() => onSelect(isActive ? null : spot.id)}
              aria-label={`Explore ${spot.name}`}
              aria-pressed={isActive}
              className="group relative flex size-9 cursor-pointer items-center justify-center"
            >
              <span className="absolute inline-flex size-6 animate-ping rounded-full bg-amber-300/70" />
              <span
                className={`relative size-4 rounded-full border-2 border-white shadow-[0_0_18px_rgba(251,191,36,0.95)] transition-transform group-hover:scale-125 ${
                  isActive ? "scale-125 bg-white" : "bg-amber-400"
                }`}
              />
              <span
                className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-950 shadow-md transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                }`}
              >
                {spot.name}
              </span>
            </button>
          </Html>
        );
      })}
    </>
  );
}

function CameraRig({ spots, active }: { spots: Spot[]; active: string | null }) {
  const flying = useRef(true);
  const lastInteraction = useRef(-10);
  const interacting = useRef(false);
  const justReleased = useRef(false);
  const goalCam = useMemo(() => new THREE.Vector3(), []);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    flying.current = true;
  }, [active]);

  useFrame((state: RootState, dt) => {
    const controls = state.controls as OrbitControlsImpl | null;
    if (!controls) return;
    const spot = spots.find((s) => s.id === active);
    const narrow = state.size.width / state.size.height < 0.8;

    if (flying.current) {
      if (spot) {
        goalTarget.set(...spot.position);
        const out = new THREE.Vector3(spot.position[0], 0, spot.position[2]);
        if (out.lengthSq() < 0.01) out.set(1, 0, 1);
        out.normalize().multiplyScalar(narrow ? 9 : 6.6);
        goalCam.copy(goalTarget).add(out).add(new THREE.Vector3(0, narrow ? 3.6 : 2.8, 0));
      } else {
        goalTarget.copy(HOME_TARGET);
        goalCam.copy(HOME_CAM).multiplyScalar(narrow ? 1.55 : 1);
      }
      const k = 1 - Math.exp(-dt * 2.4);
      state.camera.position.lerp(goalCam, k);
      controls.target.lerp(goalTarget, k);
      if (state.camera.position.distanceTo(goalCam) < 0.04) flying.current = false;
    }

    const now = state.clock.elapsedTime;
    if (justReleased.current) {
      lastInteraction.current = now;
      justReleased.current = false;
    }
    controls.autoRotate = !spot && !flying.current && !interacting.current && now - lastInteraction.current > 4;
  });

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={7}
      maxDistance={27}
      minPolarAngle={0.35}
      maxPolarAngle={1.7}
      autoRotateSpeed={0.6}
      onStart={() => {
        flying.current = false;
        interacting.current = true;
      }}
      onEnd={() => {
        interacting.current = false;
        justReleased.current = true;
      }}
    />
  );
}

function IslandWorld({ mixRef }: { mixRef: Mix }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.08;
  });
  return (
    <group ref={group}>
      <IslandBody />
      <FloatingRocks />
      <Trees />
      <Cabin mixRef={mixRef} />
      <Spa mixRef={mixRef} />
      <Lookout mixRef={mixRef} />
      <PathLanterns />
      <Waterfall />
      <Balloon />
    </group>
  );
}

export default function Scene({ night, spots, active, onSelect }: SceneProps) {
  const mixRef = useRef(night ? 1 : 0);
  const coarse = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [15, 9, 18], fov: 40, near: 0.1, far: 200 }}
      gl={{ antialias: true }}
      onPointerMissed={() => onSelect(null)}
      onCreated={({ gl }) => {
        // Let one-finger vertical swipes scroll the page on phones; spin uses two fingers there.
        if (coarse) gl.domElement.style.touchAction = "pan-y";
      }}
    >
      <Atmosphere mixRef={mixRef} night={night} />
      <GlowDriver mixRef={mixRef} />
      <Stars mixRef={mixRef} />
      <IslandWorld mixRef={mixRef} />
      <Clouds />
      <Birds />
      <Sea mixRef={mixRef} />
      <Hotspots spots={spots} active={active} onSelect={onSelect} />
      <CameraRig spots={spots} active={active} />
      <TouchConfig coarse={coarse} />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} />
      </EffectComposer>
    </Canvas>
  );
}

/** On touch screens, rotate with two fingers so a single finger can still scroll. */
function TouchConfig({ coarse }: { coarse: boolean }) {
  useFrame((state) => {
    const controls = state.controls as OrbitControlsImpl | null;
    if (!controls || !coarse) return;
    if (controls.touches.ONE !== undefined) {
      controls.touches = { ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE };
    }
    const el = controls.domElement as HTMLElement | undefined;
    if (el && el.style.touchAction !== "pan-y") el.style.touchAction = "pan-y";
  });
  return null;
}
