"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CapsuleCollider,
  CuboidCollider,
  CylinderCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createRandom } from "@/lib/random";

const PALETTE = ["#fb7185", "#f472b6", "#facc15", "#38bdf8", "#a78bfa", "#34d399", "#fb923c"];
const KINDS = ["donut", "lollipop", "gumdrop", "wrapped"] as const;
type Kind = (typeof KINDS)[number];

type CandySpec = {
  id: number;
  kind: Kind;
  color: string;
  accent: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

/** Holds the candy currently being dragged and drives the canvas cursor. */
function createDrag() {
  let body: RapierRigidBody | null = null;
  let el: HTMLElement | null = null;
  return {
    attach(element: HTMLElement) {
      el = element;
    },
    held: () => body,
    grab(next: RapierRigidBody) {
      body = next;
      next.wakeUp();
      if (el) el.style.cursor = "grabbing";
    },
    release() {
      body = null;
      if (el) el.style.cursor = "";
    },
    hover(over: boolean) {
      if (!body && el) el.style.cursor = over ? "grab" : "";
    },
  };
}
type Drag = ReturnType<typeof createDrag>;

export type SceneProps = {
  /** Number of extra batches dropped via "More candy". */
  batches: number;
  /** Incremented each time "Shake it!" is pressed. */
  shake: number;
  onCountChange?: (count: number, full: boolean) => void;
};

/* ---------- shared geometry & materials ---------- */

function useCandyAssets() {
  return useMemo(() => {
    const rand = createRandom(7);

    // Sprinkles: many tiny capsules merged into one vertex-coloured geometry.
    const sprinkleParts: THREE.BufferGeometry[] = [];
    const color = new THREE.Color();
    for (let i = 0; i < 26; i++) {
      const g = new THREE.CapsuleGeometry(0.025, 0.09, 2, 6);
      const angle = rand() * Math.PI * 2;
      const r = 0.32 + rand() * 0.26;
      g.rotateZ(rand() * Math.PI);
      g.rotateX(Math.PI / 2 + (rand() - 0.5) * 0.6);
      g.translate(Math.cos(angle) * r, Math.sin(angle) * r, 0.27);
      color.set(PALETTE[Math.floor(rand() * PALETTE.length)]);
      const count = g.attributes.position.count;
      const colors = new Float32Array(count * 3);
      for (let v = 0; v < count; v++) color.toArray(colors, v * 3);
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      g.deleteAttribute("uv");
      sprinkleParts.push(g);
    }
    const sprinkles = mergeGeometries(sprinkleParts)!;

    // Icing: the front half of a slightly fatter torus.
    const icing = new THREE.TorusGeometry(0.46, 0.235, 18, 40);

    // Lollipop swirl: stacked rings on the face of the disc.
    const swirl = new THREE.TorusGeometry(1, 0.05, 8, 40);

    const materials = new Map<string, THREE.MeshPhysicalMaterial>();
    const material = (hex: string, roughness = 0.22) => {
      const key = `${hex}-${roughness}`;
      let m = materials.get(key);
      if (!m) {
        m = new THREE.MeshPhysicalMaterial({
          color: hex,
          roughness,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          sheen: 0.4,
          sheenColor: new THREE.Color("#ffffff"),
        });
        materials.set(key, m);
      }
      return m;
    };

    const sprinkleMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.35,
      clearcoat: 0.6,
    });
    const dough = new THREE.MeshPhysicalMaterial({ color: "#f3c98b", roughness: 0.6, clearcoat: 0.2 });
    const stick = new THREE.MeshStandardMaterial({ color: "#fffaf3", roughness: 0.5 });

    return { sprinkles, icing, swirl, material, sprinkleMaterial, dough, stick };
  }, []);
}

type Assets = ReturnType<typeof useCandyAssets>;

/* ---------- candy meshes ---------- */

function CandyBody({ spec, assets }: { spec: CandySpec; assets: Assets }) {
  const main = assets.material(spec.color);
  const accent = assets.material(spec.accent);
  switch (spec.kind) {
    case "donut":
      return (
        <>
          <mesh castShadow material={assets.dough}>
            <torusGeometry args={[0.45, 0.22, 18, 40]} />
          </mesh>
          <mesh castShadow geometry={assets.icing} material={main} position={[0, 0, 0.06]} scale={[1, 1, 0.75]} />
          <mesh geometry={assets.sprinkles} material={assets.sprinkleMaterial} />
          <CylinderCollider args={[0.22, 0.67]} rotation={[Math.PI / 2, 0, 0]} restitution={0.55} friction={0.7} />
        </>
      );
    case "lollipop":
      return (
        <>
          <mesh castShadow material={main} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.22, 40]} />
          </mesh>
          {[0.42, 0.28, 0.14].map((r, i) => (
            <mesh
              key={r}
              geometry={assets.swirl}
              material={i % 2 ? main : accent}
              scale={[r, r, 1]}
              position={[0, 0, 0.115]}
            />
          ))}
          <mesh castShadow material={assets.stick} position={[0, -0.95, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 1, 10]} />
          </mesh>
          <CylinderCollider args={[0.11, 0.55]} rotation={[Math.PI / 2, 0, 0]} restitution={0.6} friction={0.6} />
          <CuboidCollider args={[0.05, 0.5, 0.05]} position={[0, -0.95, 0]} restitution={0.4} />
        </>
      );
    case "gumdrop":
      return (
        <>
          <mesh castShadow material={main}>
            <capsuleGeometry args={[0.3, 0.38, 8, 20]} />
          </mesh>
          <CapsuleCollider args={[0.19, 0.3]} restitution={0.85} friction={0.5} />
        </>
      );
    case "wrapped":
      return (
        <>
          <mesh castShadow material={main} scale={[1.25, 0.9, 0.9]}>
            <sphereGeometry args={[0.36, 28, 20]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              castShadow
              material={accent}
              position={[side * 0.62, 0, 0]}
              rotation={[0, 0, (side * Math.PI) / 2]}
            >
              <coneGeometry args={[0.26, 0.38, 14, 1, true]} />
            </mesh>
          ))}
          <BallCollider args={[0.38]} restitution={0.7} friction={0.6} />
          <CuboidCollider args={[0.78, 0.18, 0.18]} restitution={0.5} />
        </>
      );
  }
}

function Candy({
  spec,
  assets,
  register,
  drag,
}: {
  spec: CandySpec;
  assets: Assets;
  register: (id: number, body: RapierRigidBody | null) => void;
  drag: Drag;
}) {
  const body = useRef<RapierRigidBody>(null);

  useEffect(() => {
    register(spec.id, body.current);
    return () => register(spec.id, null);
  }, [register, spec.id]);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!body.current || drag.held()) return;
    e.stopPropagation();
    drag.grab(body.current);
  };

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={spec.position}
      rotation={spec.rotation}
      linearDamping={0.15}
      angularDamping={0.4}
      ccd
    >
      <group
        onPointerDown={onDown}
        onPointerOver={() => drag.hover(true)}
        onPointerOut={() => drag.hover(false)}
      >
        <CandyBody spec={spec} assets={assets} />
      </group>
    </RigidBody>
  );
}

/* ---------- invisible box the candies live in ---------- */

function Bounds() {
  const { width, height } = useThree((s) => s.viewport);
  const w = width / 2;
  const h = height / 2;
  return (
    <RigidBody type="fixed" colliders={false} key={`${width.toFixed(2)}-${height.toFixed(2)}`}>
      <CuboidCollider args={[w + 2, 0.5, 3]} position={[0, -h - 0.5, 0]} restitution={0.5} friction={0.8} />
      <CuboidCollider args={[0.5, h + 8, 3]} position={[-w - 0.5, 6, 0]} />
      <CuboidCollider args={[0.5, h + 8, 3]} position={[w + 0.5, 6, 0]} />
      <CuboidCollider args={[w + 2, h + 8, 0.5]} position={[0, 6, -2.1]} />
      <CuboidCollider args={[w + 2, h + 8, 0.5]} position={[0, 6, 2.1]} />
      <CuboidCollider args={[w + 2, 0.5, 3]} position={[0, h + 14, 0]} />
    </RigidBody>
  );
}

/* ---------- pointer: drag, fling and the hover pusher ---------- */

const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hit = new THREE.Vector3();
const PARKED = { x: 0, y: -100, z: 0 };

function PointerControls({ drag }: { drag: Drag }) {
  const pusher = useRef<RapierRigidBody>(null);
  const hover = useRef({ inside: false, mouse: false });
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const el = gl.domElement;
    drag.attach(el);
    const release = () => drag.release();
    const enter = (e: PointerEvent) => {
      hover.current.inside = true;
      hover.current.mouse = e.pointerType === "mouse";
    };
    const leave = () => {
      hover.current.inside = false;
    };
    // While a candy is held on a touch screen, stop the page from scrolling.
    const touchMove = (e: TouchEvent) => {
      if (drag.held()) e.preventDefault();
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("touchmove", touchMove);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [gl, drag]);

  useFrame((state) => {
    const held = drag.held();
    if (held) {
      const p = held.translation();
      plane.constant = -p.z;
      state.raycaster.setFromCamera(state.pointer, state.camera);
      if (state.raycaster.ray.intersectPlane(plane, hit)) {
        let vx = (hit.x - p.x) * 14;
        let vy = (hit.y - p.y) * 14;
        const speed = Math.hypot(vx, vy);
        if (speed > 28) {
          vx *= 28 / speed;
          vy *= 28 / speed;
        }
        held.setLinvel({ x: vx, y: vy, z: -p.z * 2 }, true);
        const av = held.angvel();
        held.setAngvel({ x: av.x * 0.9, y: av.y * 0.9, z: av.z * 0.9 }, true);
      }
    }

    const body = pusher.current;
    if (!body) return;
    if (!held && hover.current.inside && hover.current.mouse) {
      plane.constant = 0;
      state.raycaster.setFromCamera(state.pointer, state.camera);
      if (state.raycaster.ray.intersectPlane(plane, hit)) {
        body.setNextKinematicTranslation({ x: hit.x, y: hit.y, z: 0 });
        return;
      }
    }
    body.setNextKinematicTranslation(PARKED);
  });

  return (
    <RigidBody ref={pusher} type="kinematicPosition" colliders={false} position={[0, -100, 0]}>
      <BallCollider args={[0.45]} />
    </RigidBody>
  );
}

/* ---------- the world ---------- */

function makeSpecs(count: number, width: number, height: number, initial: number, batchSize: number) {
  const specs: CandySpec[] = [];
  for (let i = 0; i < count; i++) {
    const rand = createRandom(1000 + i * 31);
    const kind = KINDS[Math.floor(rand() * KINDS.length)];
    const color = PALETTE[Math.floor(rand() * PALETTE.length)];
    let accent = PALETTE[Math.floor(rand() * PALETTE.length)];
    if (accent === color) accent = "#ffffff";
    // Each batch stacks upwards so candies fall in a staggered shower.
    const indexInBatch = i < initial ? i : (i - initial) % batchSize;
    const x = (rand() - 0.5) * Math.max(1, width - 1.6);
    const y = height / 2 + 1.2 + indexInBatch * 0.55;
    const z = (rand() - 0.5) * 1.8;
    specs.push({
      id: i,
      kind,
      color,
      accent,
      position: [x, y, z],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
    });
  }
  return specs;
}

function World({ batches, shake, onCountChange }: SceneProps) {
  const assets = useCandyAssets();
  const viewport = useThree((s) => s.viewport);
  const isPhone = useThree((s) => s.size.width < 640);
  const [drag] = useState(createDrag);
  const bodies = useRef(new Map<number, RapierRigidBody>());

  const initial = isPhone ? 24 : 48;
  const batchSize = isPhone ? 10 : 16;
  const cap = isPhone ? 54 : 100;
  const count = Math.min(cap, initial + batches * batchSize);

  // Spawn positions are captured when a candy first mounts; later viewport
  // changes don't move existing candies, so freeze the dimensions per mount.
  const [dims] = useState(() => ({ width: viewport.width, height: viewport.height }));
  const specs = useMemo(
    () => makeSpecs(count, dims.width, dims.height, initial, batchSize),
    [count, dims, initial, batchSize],
  );

  useEffect(() => {
    onCountChange?.(count, count >= cap);
  }, [count, cap, onCountChange]);

  const register = useMemo(
    () => (id: number, body: RapierRigidBody | null) => {
      if (body) bodies.current.set(id, body);
      else bodies.current.delete(id);
    },
    [],
  );

  useEffect(() => {
    if (!shake) return;
    for (const body of bodies.current.values()) {
      const m = body.mass();
      body.wakeUp();
      body.applyImpulse(
        { x: (Math.random() - 0.5) * 5 * m, y: (7 + Math.random() * 7) * m, z: (Math.random() - 0.5) * m },
        true,
      );
      body.applyTorqueImpulse(
        { x: (Math.random() - 0.5) * 0.4 * m, y: (Math.random() - 0.5) * 0.4 * m, z: (Math.random() - 0.5) * 0.4 * m },
        true,
      );
    }
  }, [shake]);

  return (
    <>
      <Bounds />
      <PointerControls drag={drag} />
      {specs.map((spec) => (
        <Candy key={spec.id} spec={spec} assets={assets} register={register} drag={drag} />
      ))}
    </>
  );
}

function ShadowBackdrop() {
  const { width, height } = useThree((s) => s.viewport);
  return (
    <mesh position={[0, 0, -1.65]} receiveShadow>
      <planeGeometry args={[width * 1.5, height * 1.5]} />
      <shadowMaterial transparent opacity={0.14} color="#7a3b5c" />
    </mesh>
  );
}

export default function Scene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 16], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[4, 8, 10]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-radius={6}
        shadow-bias={-0.0005}
      />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} color="#fff1f6" position={[0, 5, 6]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={2} color="#fde68a" position={[-6, 0, 4]} scale={[3, 8, 1]} />
        <Lightformer form="ring" intensity={2.5} color="#bae6fd" position={[6, 2, 3]} scale={3} />
        <Lightformer form="rect" intensity={1} color="#ffffff" position={[0, -4, 5]} scale={[10, 2, 1]} />
      </Environment>
      <ShadowBackdrop />
      <Physics gravity={[0, -14, 0]} timeStep="vary">
        <World {...props} />
      </Physics>
    </Canvas>
  );
}
