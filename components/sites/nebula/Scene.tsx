"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { createRandom } from "@/lib/random";

/* ------------------------------------------------------------------ */
/* Galaxy                                                              */
/* ------------------------------------------------------------------ */

const galaxyVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  varying vec3 vColor;

  void main() {
    // Differential rotation in the disc plane: inner stars orbit faster.
    vec3 p = position;
    float angle = atan(p.z, p.x);
    float dist = length(p.xz);
    angle += (1.0 / (dist + 0.8)) * uTime * 0.45;
    p.x = cos(angle) * dist;
    p.z = sin(angle) * dist;

    vec4 modelPosition = modelMatrix * vec4(p, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = min(uSize * aScale * uPixelRatio * (1.0 / -viewPosition.z), 60.0);
    vColor = color;
  }
`;

const galaxyFragment = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / d - 0.1;
    strength = clamp(strength, 0.0, 1.0);
    gl_FragColor = vec4(vColor * strength, strength);
  }
`;

function Galaxy({ count }: { count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const gl = useThree((s) => s.gl);

  const geometry = useMemo(() => {
    const random = createRandom(7);
    const radius = 14;
    const branches = 5;
    const spin = 1.15;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const inside = new THREE.Color("#ffc58a");
    const middle = new THREE.Color("#ff4fd8");
    const outside = new THREE.Color("#3f6bff");
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = Math.pow(random(), 1.7) * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin;
      const spread = (axis: number) =>
        Math.pow(random(), 3) * (random() < 0.5 ? 1 : -1) * 0.45 * (r * 0.35 + 0.6) * axis;

      positions[i * 3] = Math.cos(branchAngle + spinAngle) * r + spread(1);
      positions[i * 3 + 1] = spread(0.45);
      positions[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * r + spread(1);

      const t = r / radius;
      if (t < 0.35) tmp.copy(inside).lerp(middle, t / 0.35);
      else tmp.copy(middle).lerp(outside, (t - 0.35) / 0.65);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;

      scales[i] = 0.4 + random() * 1.1;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 38 },
      uPixelRatio: { value: 1 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value += delta;
    material.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return (
    <points geometry={geometry} rotation={[0.18, 0, 0.08]}>
      <shaderMaterial
        ref={material}
        vertexShader={galaxyVertex}
        fragmentShader={galaxyFragment}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Bright glowing core in the middle of the galaxy. */
function Core() {
  return (
    <group rotation={[0.18, 0, 0.08]}>
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshBasicMaterial color={[6, 4.2, 2.6]} toneMapped={false} />
      </mesh>
      <mesh scale={[3.2, 0.5, 3.2]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ff9f6b"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Background stars                                                    */
/* ------------------------------------------------------------------ */

const starsVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aPhase;
  attribute float aSize;
  varying float vTwinkle;

  void main() {
    vec4 viewPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    vTwinkle = 0.45 + 0.55 * sin(uTime * (1.2 + aPhase) + aPhase * 12.0);
    gl_PointSize = aSize * uPixelRatio * (0.6 + vTwinkle * 0.6);
  }
`;

const starsFragment = /* glsl */ `
  varying float vTwinkle;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * vTwinkle * 1.4, a * vTwinkle);
  }
`;

function Stars({ count }: { count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const gl = useThree((s) => s.gl);

  const geometry = useMemo(() => {
    const random = createRandom(42);
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 70 + random() * 90;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      phases[i] = random() * 3;
      sizes[i] = 1 + random() * 2.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value += delta;
    material.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={starsVertex}
        fragmentShader={starsFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Planets                                                             */
/* ------------------------------------------------------------------ */

const noiseChunk = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`;

const planetVertex = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vObjPos = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const planetFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uBands;
  uniform float uTime;
  varying vec3 vObjPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  ${noiseChunk}

  void main() {
    vec3 p = normalize(vObjPos);
    float n = fbm(p * 3.0 + vec3(uTime * 0.03, 0.0, 0.0));
    // Gas-giant style latitude bands warped by noise.
    float bands = sin((p.y + n * 0.35) * uBands) * 0.5 + 0.5;
    vec3 col = mix(uColorA, uColorB, bands);
    col = mix(col, uColorC, smoothstep(0.55, 0.8, fbm(p * 7.0)));

    // Lit by the galaxy core at the origin.
    vec3 lightDir = normalize(-vWorldPos);
    float diff = max(dot(normalize(vWorldNormal), lightDir), 0.0);
    float light = 0.08 + diff * 1.1;

    // Rim light so the dark side still reads against space.
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - max(dot(viewDir, normalize(vWorldNormal)), 0.0), 3.0);

    gl_FragColor = vec4(col * light + uColorB * rim * 0.6, 1.0);
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);
    gl_FragColor = vec4(uColor * 1.8, fresnel);
  }
`;

const ringVertex = /* glsl */ `
  varying float vRadius;
  varying vec3 vWorldPos;

  void main() {
    vRadius = length(position.xy);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const ringFragment = /* glsl */ `
  uniform float uInner;
  uniform float uOuter;
  uniform vec3 uColor;
  varying float vRadius;
  ${noiseChunk}

  void main() {
    float t = (vRadius - uInner) / (uOuter - uInner);
    float bands = noise(vec3(t * 40.0, 0.0, 0.0)) * 0.7 + noise(vec3(t * 140.0, 3.0, 0.0)) * 0.3;
    float edge = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.85, t);
    float gap = smoothstep(0.02, 0.06, abs(t - 0.62));
    float alpha = bands * edge * gap * 0.9;
    gl_FragColor = vec4(uColor * (0.6 + bands), alpha);
  }
`;

type PlanetProps = {
  position: [number, number, number];
  radius: number;
  colors: [string, string, string];
  atmosphere: string;
  bands?: number;
  ring?: { color: string; tilt: [number, number, number] };
  spin?: number;
};

function Planet({
  position,
  radius,
  colors,
  atmosphere,
  bands = 14,
  ring,
  spin = 0.06,
}: PlanetProps) {
  const body = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const planetUniforms = useMemo(
    () => ({
      uColorA: { value: new THREE.Color(colors[0]) },
      uColorB: { value: new THREE.Color(colors[1]) },
      uColorC: { value: new THREE.Color(colors[2]) },
      uBands: { value: bands },
      uTime: { value: 0 },
    }),
    [colors, bands],
  );
  const atmosphereUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(atmosphere) } }),
    [atmosphere],
  );
  const ringUniforms = useMemo(
    () => ({
      uInner: { value: radius * 1.4 },
      uOuter: { value: radius * 2.4 },
      uColor: { value: new THREE.Color(ring?.color ?? "#ffffff") },
    }),
    [radius, ring?.color],
  );

  useFrame((_, delta) => {
    if (body.current) body.current.rotation.y += delta * spin;
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <group position={position}>
      <mesh ref={body}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          ref={material}
          vertexShader={planetVertex}
          fragmentShader={planetFragment}
          uniforms={planetUniforms}
        />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmosphereUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {ring && (
        <mesh rotation={ring.tilt}>
          <ringGeometry args={[radius * 1.4, radius * 2.4, 160, 1]} />
          <shaderMaterial
            vertexShader={ringVertex}
            fragmentShader={ringFragment}
            uniforms={ringUniforms}
            side={THREE.DoubleSide}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll-driven camera                                                */
/* ------------------------------------------------------------------ */

const cameraPath = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 11, 26),
    new THREE.Vector3(7, 4.5, 15),
    new THREE.Vector3(12, 1.8, 5),
    new THREE.Vector3(5, 0.9, -5),
    new THREE.Vector3(-6, 1.2, -9),
    new THREE.Vector3(-11, 2.5, 1),
    new THREE.Vector3(-6, 9, 12),
    new THREE.Vector3(0, 20, 8),
  ],
  false,
  "catmullrom",
  0.4,
);

function CameraRig() {
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const smoothPointer = useRef({ x: 0, y: 0 });
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera }, delta) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, 2.6, delta);
    smoothPointer.current.x = THREE.MathUtils.damp(smoothPointer.current.x, pointer.current.x, 3, delta);
    smoothPointer.current.y = THREE.MathUtils.damp(smoothPointer.current.y, pointer.current.y, 3, delta);

    const t = progress.current;
    cameraPath.getPointAt(t, camera.position);
    camera.position.x += smoothPointer.current.x * 0.9;
    camera.position.y -= smoothPointer.current.y * 0.6;

    // Look ahead along the path mid-flight, at the galaxy core at both ends.
    cameraPath.getPointAt(Math.min(t + 0.08, 1), ahead);
    const lookAhead = Math.sin(Math.PI * t) * 0.75;
    lookAt.copy(origin).lerp(ahead, lookAhead);
    camera.lookAt(lookAt);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

const gasGiant: [string, string, string] = ["#f6b26b", "#b4542f", "#ffe3b8"];
const oceanWorld: [string, string, string] = ["#0b3d91", "#1fb6c9", "#e8fbff"];
const iceWorld: [string, string, string] = ["#c7d2fe", "#7c3aed", "#ffffff"];

function World() {
  const size = useThree((s) => s.size);
  const small = size.width < 768;

  return (
    <>
      <color attach="background" args={["#03020a"]} />
      <Stars count={small ? 1500 : 3500} />
      <Galaxy count={small ? 18000 : 40000} />
      <Core />
      <Planet
        position={[15, 1.2, 1.5]}
        radius={1.6}
        colors={oceanWorld}
        atmosphere="#38bdf8"
        bands={6}
        spin={0.08}
      />
      <Planet
        position={[-9.5, 0.4, -12.5]}
        radius={2.2}
        colors={gasGiant}
        atmosphere="#fb923c"
        bands={18}
        ring={{ color: "#f5d0a9", tilt: [-Math.PI / 2 + 0.35, 0.2, 0] }}
        spin={0.05}
      />
      <Planet
        position={[-14, 3.5, 5]}
        radius={1.1}
        colors={iceWorld}
        atmosphere="#a78bfa"
        bands={9}
        spin={0.12}
      />
      <CameraRig />
      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          intensity={small ? 0.9 : 1.25}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.3}
          radius={0.75}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 55, near: 0.1, far: 400, position: [0, 11, 26] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <World />
    </Canvas>
  );
}
