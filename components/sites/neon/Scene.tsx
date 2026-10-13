"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Scanline,
  Vignette,
} from "@react-three/postprocessing";
import type { ChromaticAberrationEffect } from "postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { createRandom } from "@/lib/random";

/** Mutable input state written by the page (pointer, keys) and read every frame here. */
export type DriveControls = {
  boost: boolean;
  /** Pointer X across the hero, -1 (left) … 1 (right). */
  pointerX: number;
  /** Keyboard steer, -1 / 0 / 1. Overrides the pointer while held. */
  keySteer: number;
};

type SceneProps = {
  controls: RefObject<DriveControls>;
  speedRef: RefObject<HTMLSpanElement | null>;
  boostBarRef: RefObject<HTMLDivElement | null>;
  active: boolean;
};

const BASE_SPEED = 22; // world units per second at 100 km/h
const LOOP = 200; // terrain noise repeats every LOOP units, so travel can wrap
const ROAD_HALF = 4.6;

/** Shared, per-frame drive state so every object reads the same speed. */
type Drive = { travel: number; boost: number; speed: number; carX: number };

const noiseGLSL = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  // Value noise whose lattice wraps every \`period\` cells along y.
  float noise(vec2 p, float period) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float y0 = mod(i.y, period);
    float y1 = mod(i.y + 1.0, period);
    float a = hash(vec2(i.x, y0));
    float b = hash(vec2(i.x + 1.0, y0));
    float c = hash(vec2(i.x, y1));
    float d = hash(vec2(i.x + 1.0, y1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
`;

const terrainVertex = /* glsl */ `
  uniform float uTravel;
  varying vec2 vWorld;
  varying float vHeight;
  varying float vDist;
  ${noiseGLSL}
  void main() {
    vec3 p = position;
    vec2 w = vec2(p.x, p.z - uTravel);
    float side = smoothstep(${(ROAD_HALF + 1.5).toFixed(1)}, 16.0, abs(p.x));
    // 0.08 * 200 = 16 cells and 0.2 * 200 = 40 cells: both octaves loop with LOOP.
    float n = noise(w * 0.08, 16.0) * 0.65 + noise(w * 0.2, 40.0) * 0.35;
    float h = pow(n, 1.6) * side * (9.0 + abs(p.x) * 0.35);
    p.y += h;
    vWorld = w;
    vHeight = h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const terrainFragment = /* glsl */ `
  uniform vec3 uGrid;
  uniform vec3 uRoadEdge;
  uniform vec3 uDash;
  uniform vec3 uFog;
  uniform float uBoost;
  varying vec2 vWorld;
  varying float vHeight;
  varying float vDist;

  float line(float coord, float spacing) {
    float c = coord / spacing;
    float g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    return 1.0 - min(g, 1.0);
  }

  void main() {
    float ax = abs(vWorld.x);
    vec3 base = mix(vec3(0.02, 0.0, 0.06), vec3(0.09, 0.0, 0.16), clamp(vHeight / 12.0, 0.0, 1.0));
    vec3 col = base;

    if (ax < ${ROAD_HALF.toFixed(1)}) {
      // Asphalt with glowing edges and a dashed centre line.
      col = vec3(0.015, 0.005, 0.04);
      float edge = smoothstep(0.18, 0.0, abs(ax - ${(ROAD_HALF - 0.35).toFixed(2)}));
      col += uRoadEdge * edge * (2.2 + uBoost * 2.0);
      float dash = step(0.5, fract(vWorld.y / 8.0)) * smoothstep(0.09, 0.0, ax);
      col += uDash * dash * 2.0;
    } else {
      float g = max(line(vWorld.x, 2.0), line(vWorld.y, 2.0));
      float glow = 1.4 + clamp(vHeight / 10.0, 0.0, 1.0) * 1.2 + uBoost * 0.8;
      col += uGrid * g * glow;
    }

    float fog = smoothstep(25.0, 150.0, vDist);
    col = mix(col, uFog, fog);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);
    // Disc occupies radius 0.36 of the quad, the rest is halo.
    float disc = smoothstep(0.36, 0.355, d);
    float y = (c.y + 0.36) / 0.72; // 0 at disc bottom, 1 at top
    vec3 col = mix(vec3(1.0, 0.1, 0.45), vec3(1.0, 0.82, 0.25), clamp(y, 0.0, 1.0));
    // Classic synthwave cut-outs, thicker toward the bottom, drifting down.
    float band = fract(y * 11.0 + uTime * 0.35);
    float cut = y < 0.55 ? step(band, (0.55 - y) * 1.3) : 0.0;
    float a = disc * (1.0 - cut);
    float halo = exp(-max(d - 0.36, 0.0) * 14.0) * 0.55 * (1.0 - disc);
    vec3 outCol = col * 1.8 * a + vec3(1.0, 0.25, 0.55) * halo;
    gl_FragColor = vec4(outCol, max(a, halo));
    #include <colorspace_fragment>
  }
`;

const skyVertex = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  varying vec3 vPos;
  void main() {
    float h = normalize(vPos).y;
    vec3 horizon = vec3(0.55, 0.06, 0.38);
    vec3 mid = vec3(0.16, 0.02, 0.28);
    vec3 top = vec3(0.01, 0.0, 0.05);
    vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.12, h));
    col = mix(col, top, smoothstep(0.12, 0.6, h));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const FOG = new THREE.Color("#3a0a45");
/** Scratch object for composing instance matrices. */
const dummy = new THREE.Object3D();

function Terrain({ driveRef }: { driveRef: RefObject<Drive> }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 170, 180, 340);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({
      uTravel: { value: 0 },
      uBoost: { value: 0 },
      uGrid: { value: new THREE.Color("#ff2a9d") },
      uRoadEdge: { value: new THREE.Color("#18e7ff") },
      uDash: { value: new THREE.Color("#ffb347") },
      uFog: { value: new THREE.Color().setRGB(0.32, 0.03, 0.26) },
    }),
    [],
  );

  const material = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (!material.current) return;
    material.current.uniforms.uTravel.value = driveRef.current.travel;
    material.current.uniforms.uBoost.value = driveRef.current.boost;
  });

  return (
    <mesh geometry={geometry} position={[0, 0, -75]}>
      <shaderMaterial
        ref={material}
        vertexShader={terrainVertex}
        fragmentShader={terrainFragment}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function Sun() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const material = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });
  return (
    <mesh position={[0, 16, -175]}>
      <planeGeometry args={[95, 95]} />
      <shaderMaterial
        ref={material}
        vertexShader={sunVertex}
        fragmentShader={sunFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Sky() {
  return (
    <mesh>
      <sphereGeometry args={[320, 32, 16]} />
      <shaderMaterial
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function Stars() {
  const geometry = useMemo(() => {
    const rand = createRandom(7);
    const count = 1400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI - Math.PI; // only the half in front of the camera
      const phi = 0.08 + rand() * 1.3;
      const r = 280;
      pos[i * 3] = Math.cos(theta) * Math.cos(phi) * r;
      pos[i * 3 + 1] = Math.sin(phi) * r;
      pos[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#ffd6f5"
        size={1.6}
        sizeAttenuation={false}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

/** Neon pylons lining both road edges, sliding past to sell the speed. */
function Pylons({ driveRef }: { driveRef: RefObject<Drive> }) {
  const PER_SIDE = 20;
  const SPACING = LOOP / PER_SIDE;
  const poles = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    if (!poles.current || !caps.current) return;
    const t = driveRef.current.travel;
    for (let i = 0; i < PER_SIDE * 2; i++) {
      const side = i < PER_SIDE ? -1 : 1;
      const k = i % PER_SIDE;
      const z = ((k * SPACING + t) % LOOP) - LOOP + 12;
      dummy.position.set(side * (ROAD_HALF + 1.4), 1.1, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poles.current.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 2.25;
      dummy.updateMatrix();
      caps.current.setMatrixAt(i, dummy.matrix);
    }
    poles.current.instanceMatrix.needsUpdate = true;
    caps.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, PER_SIDE * 2]}>
        <boxGeometry args={[0.12, 2.2, 0.12]} />
        <meshStandardMaterial color="#1a0630" metalness={0.4} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, PER_SIDE * 2]}>
        <boxGeometry args={[0.5, 0.12, 0.12]} />
        <meshBasicMaterial color={[0.3, 3, 3.4]} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function makeSpeedLines(count: number) {
  const rand = createRandom(42);
  return Array.from({ length: count }, () => {
    const a = rand() * Math.PI * 2;
    const r = 2.5 + rand() * 7;
    return {
      x: Math.cos(a) * r,
      y: 1.5 + Math.sin(a) * r * 0.6,
      z: -70 + rand() * 80,
      len: 2 + rand() * 5,
    };
  });
}

/** Streaks that rush past the camera, only visible while boosting. */
const SPEED_LINE_COUNT = 140;
const speedLines = makeSpeedLines(SPEED_LINE_COUNT);

function SpeedLines({ driveRef }: { driveRef: RefObject<Drive> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return;
    const { speed, boost } = driveRef.current;
    material.current.opacity = boost * 0.7;
    mesh.current.visible = boost > 0.02;
    if (!mesh.current.visible) return;
    for (let i = 0; i < SPEED_LINE_COUNT; i++) {
      const l = speedLines[i];
      l.z += speed * delta * 2.2;
      if (l.z > 10) l.z -= 80;
      dummy.position.set(l.x, l.y, l.z);
      dummy.scale.set(1, 1, l.len * (0.5 + boost));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SPEED_LINE_COUNT]}>
      <boxGeometry args={[0.025, 0.025, 1]} />
      <meshBasicMaterial
        ref={material}
        color={[2.2, 1.6, 2.6]}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

const WHEELS: [number, number][] = [
  [-0.86, -1.15],
  [0.86, -1.15],
  [-0.86, 1.2],
  [0.86, 1.2],
];

function Car({
  driveRef,
  controls,
}: {
  driveRef: RefObject<Drive>;
  controls: RefObject<DriveControls>;
}) {
  const car = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const tail = useRef<THREE.MeshBasicMaterial>(null);
  const flames = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);

  useFrame((state, delta) => {
    if (!car.current || !body.current) return;
    const d = driveRef.current;
    const c = controls.current;
    const steer = c.keySteer !== 0 ? c.keySteer : c.pointerX;
    // Keep the car on screen in portrait: narrower steering range.
    const range = Math.min(3.1, (viewport.aspect || 1) * 2.1);
    const targetX = THREE.MathUtils.clamp(steer, -1, 1) * range;
    const prevX = car.current.position.x;
    car.current.position.x = THREE.MathUtils.damp(prevX, targetX, 4, delta);
    const vx = (car.current.position.x - prevX) / Math.max(delta, 1e-4);
    driveRef.current.carX = car.current.position.x;

    body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, -vx * 0.045, 8, delta);
    car.current.rotation.y = THREE.MathUtils.damp(car.current.rotation.y, -vx * 0.035, 8, delta);
    // Engine rumble, stronger under boost.
    body.current.position.y =
      Math.sin(state.clock.elapsedTime * 38) * (0.006 + d.boost * 0.012);
    body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, d.boost * 0.05, 4, delta);

    if (tail.current) {
      const glow = 3 + d.boost * 5;
      tail.current.color.setRGB(glow, 0.15, 0.35);
    }
    if (flames.current) {
      const flicker = 0.75 + Math.sin(state.clock.elapsedTime * 60) * 0.25;
      flames.current.scale.set(1, 1, Math.max(0.001, d.boost * flicker));
      flames.current.visible = d.boost > 0.03;
    }
  });

  return (
    <group ref={car} position={[0, 0, 2.2]}>
      <group ref={body}>
        {/* Lower body */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.85, 0.36, 3.7]} />
          <meshStandardMaterial color="#2a0b46" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Wedge nose */}
        <mesh position={[0, 0.5, -1.95]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[1.8, 0.12, 0.6]} />
          <meshStandardMaterial color="#2a0b46" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Cabin */}
        <mesh position={[0, 0.8, 0.15]}>
          <boxGeometry args={[1.35, 0.38, 1.7]} />
          <meshStandardMaterial color="#0a0518" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Cabin neon trim */}
        <mesh position={[0, 0.995, 0.15]}>
          <boxGeometry args={[1.38, 0.02, 1.72]} />
          <meshBasicMaterial color={[0.2, 2.4, 3]} toneMapped={false} />
        </mesh>
        {/* Side strips */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.93, 0.42, 0]}>
            <boxGeometry args={[0.02, 0.05, 3.5]} />
            <meshBasicMaterial color={[3, 0.3, 1.8]} toneMapped={false} />
          </mesh>
        ))}
        {/* Spoiler */}
        <mesh position={[0, 0.88, 1.7]}>
          <boxGeometry args={[1.9, 0.06, 0.35]} />
          <meshStandardMaterial color="#14052a" metalness={0.6} roughness={0.35} />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.7, 1.7]}>
            <boxGeometry args={[0.06, 0.3, 0.2]} />
            <meshStandardMaterial color="#14052a" />
          </mesh>
        ))}
        {/* Tail light bar */}
        <mesh position={[0, 0.5, 1.86]}>
          <boxGeometry args={[1.65, 0.09, 0.03]} />
          <meshBasicMaterial ref={tail} color={[3, 0.15, 0.35]} toneMapped={false} />
        </mesh>
        {/* Underglow */}
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.2, 4]} />
          <meshBasicMaterial
            color={[2.5, 0.2, 1.6]}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Exhaust flames (boost only) */}
        <group ref={flames} position={[0, 0.32, 1.88]}>
          {[-0.45, 0.45].map((x) => (
            <mesh key={x} position={[x, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.1, 0.7, 10]} />
              <meshBasicMaterial color={[3.5, 1.4, 0.3]} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
      {WHEELS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.32, 0.32, 0.26, 14]} />
            <meshStandardMaterial color="#07030d" roughness={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, x < 0 ? 0.135 : -0.135, 0]}>
            <torusGeometry args={[0.2, 0.025, 6, 18]} />
            <meshBasicMaterial color={[0.3, 2.4, 3]} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Advances travel/speed, drives the camera and pushes the HUD numbers into the DOM. */
function Rig({
  driveRef,
  controls,
  speedRef,
  boostBarRef,
}: {
  driveRef: RefObject<Drive>;
  controls: RefObject<DriveControls>;
  speedRef: RefObject<HTMLSpanElement | null>;
  boostBarRef: RefObject<HTMLDivElement | null>;
}) {
  const lastKmh = useRef(-1);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const d = driveRef.current;
    const boosting = controls.current.boost;
    driveRef.current.boost = THREE.MathUtils.damp(d.boost, boosting ? 1 : 0, boosting ? 2.2 : 3, dt);
    driveRef.current.speed = BASE_SPEED * (1 + d.boost * 2);
    driveRef.current.travel = (d.travel + d.speed * dt) % LOOP;

    const cam = state.camera as THREE.PerspectiveCamera;
    const portrait = state.viewport.aspect < 1;
    const fov = (portrait ? 72 : 58) + d.boost * 18;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const shake = d.boost * 0.03;
    cam.position.set(
      d.carX * 0.45 + Math.sin(state.clock.elapsedTime * 47) * shake,
      (portrait ? 2.2 : 1.75) + Math.cos(state.clock.elapsedTime * 53) * shake,
      portrait ? 9 : 7.2,
    );
    cam.lookAt(d.carX * 0.25, 1.1, -12);

    const kmh = Math.round(100 * (1 + d.boost * 2));
    if (kmh !== lastKmh.current) {
      lastKmh.current = kmh;
      if (speedRef.current) speedRef.current.textContent = String(kmh).padStart(3, "0");
    }
    if (boostBarRef.current) boostBarRef.current.style.transform = `scaleX(${d.boost.toFixed(3)})`;
  });
  return null;
}

function Effects({ driveRef }: { driveRef: RefObject<Drive> }) {
  const ca = useRef<ChromaticAberrationEffect>(null);
  useFrame(() => {
    const b = driveRef.current.boost;
    ca.current?.offset.set(0.0006 + b * 0.0035, 0.0003 + b * 0.0015);
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.35} luminanceSmoothing={0.2} />
      <ChromaticAberration ref={ca} radialModulation={false} modulationOffset={0} />
      <Scanline density={1.6} opacity={0.08} />
      <Vignette offset={0.25} darkness={0.75} />
    </EffectComposer>
  );
}

export default function Scene({ controls, speedRef, boostBarRef, active }: SceneProps) {
  const driveRef = useRef<Drive>({ travel: 0, boost: 0, speed: BASE_SPEED, carX: 0 });

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.75, 7.2], fov: 58, near: 0.1, far: 400 }}
      onCreated={({ scene }) => {
        scene.background = FOG.clone();
      }}
    >
      <ambientLight intensity={0.5} color="#b48cff" />
      <directionalLight position={[0, 6, -10]} intensity={2.2} color="#ff4fa8" />
      <pointLight position={[0, 2.5, 5]} intensity={6} distance={10} color="#18e7ff" />
      <Sky />
      <Stars />
      <Sun />
      <Terrain driveRef={driveRef} />
      <Pylons driveRef={driveRef} />
      <Car driveRef={driveRef} controls={controls} />
      <SpeedLines driveRef={driveRef} />
      <Rig driveRef={driveRef} controls={controls} speedRef={speedRef} boostBarRef={boostBarRef} />
      <Effects driveRef={driveRef} />
    </Canvas>
  );
}
