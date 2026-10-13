"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import type { DriveControls } from "./Scene";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const display = "font-(family-name:--font-neon-display)";
const heading = "font-(family-name:--font-neon-heading)";

const RELEASE = Date.UTC(2027, 2, 14, 18, 0, 0);

const features = [
  {
    title: "Endless highways",
    body: "Procedural roads that never repeat. Every run carves a new path through neon canyons and chrome deserts.",
    color: "#ff2a9d",
    icon: "M3 20 L10 4 M21 20 L14 4 M12 6 v2 M12 11 v2 M12 16 v3",
  },
  {
    title: "32 synthwave tracks",
    body: "An original soundtrack that shifts tempo with your speed. Hit boost and the drop hits with you.",
    color: "#ffb347",
    icon: "M9 18 V5 l11-2 v13 M9 18 a3 3 0 1 1-6 0 a3 3 0 0 1 6 0 M20 16 a3 3 0 1 1-6 0 a3 3 0 0 1 6 0",
  },
  {
    title: "Ghost racing",
    body: "Race the ghosts of your friends and the top 100 drivers worldwide, live, on the same stretch of road.",
    color: "#18e7ff",
    icon: "M5 21 V10 a7 7 0 0 1 14 0 v11 l-3-2 -2 2 -2-2 -2 2 -2-2 Z M9 10 h.01 M15 10 h.01",
  },
  {
    title: "Photo mode",
    body: "Freeze time at 300 km/h. Orbit, tilt, add film grain and VHS glitch, then share the shot in one tap.",
    color: "#b26bff",
    icon: "M4 8 h3 l2-3 h6 l2 3 h3 v11 H4 Z M12 17 a4 4 0 1 0 0-8 a4 4 0 0 0 0 8",
  },
];

const cars = [
  {
    name: "Vapor GT",
    class: "S-Class · Starter",
    from: "#ff2a9d",
    to: "#7b2cbf",
    stats: { Speed: 72, Handling: 88, Boost: 64 },
  },
  {
    name: "Magenta Interceptor",
    class: "X-Class · Pursuit",
    from: "#ffb347",
    to: "#ff2a6d",
    stats: { Speed: 91, Handling: 66, Boost: 80 },
  },
  {
    name: "Midnight RS",
    class: "Z-Class · Legendary",
    from: "#18e7ff",
    to: "#3b1d8f",
    stats: { Speed: 98, Handling: 79, Boost: 97 },
  },
];

const platforms = ["PC / Steam", "PlayStation 5", "Xbox Series X|S", "Switch 2", "Steam Deck"];

function Icon({ d, color }: { d: string; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(id);
    };
  }, []);

  const left = now === null ? null : Math.max(0, RELEASE - now);
  const parts: [string, number | null][] = [
    ["Days", left === null ? null : Math.floor(left / 86_400_000)],
    ["Hours", left === null ? null : Math.floor(left / 3_600_000) % 24],
    ["Min", left === null ? null : Math.floor(left / 60_000) % 60],
    ["Sec", left === null ? null : Math.floor(left / 1000) % 60],
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {parts.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-[#ff2a9d]/30 bg-black/40 px-2 py-3 text-center sm:px-4 sm:py-5"
        >
          <div
            className={`${heading} text-2xl font-bold tabular-nums text-white sm:text-5xl`}
            style={{ textShadow: "0 0 18px #ff2a9d" }}
          >
            {value === null ? "--" : String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[#ffb347] sm:text-xs">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBar({ label, value, from, to }: { label: string; value: number; from: string; to: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs uppercase tracking-widest text-white/60">
        <span>{label}</span>
        <span className="tabular-nums text-white">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${from}, ${to})`, boxShadow: `0 0 12px ${from}` }}
        />
      </div>
    </div>
  );
}

/** Side-on silhouette of a wedge sports car, tinted per card. */
function CarSilhouette({ from, to, id }: { from: string; to: string; id: string }) {
  return (
    <svg viewBox="0 0 240 90" className="w-full drop-shadow-[0_0_18px_rgba(255,42,157,0.45)]" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        d="M10 62 L22 46 L92 38 L128 20 L176 22 L214 42 L232 48 L232 62 Z"
        fill={`url(#${id})`}
        opacity={0.95}
      />
      <path d="M100 38 L130 25 L170 26 L196 40 Z" fill="#0b0618" opacity={0.85} />
      <path d="M22 50 L230 52" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.5} />
      {[60, 182].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={64} r={15} fill="#07030d" />
          <circle cx={cx} cy={64} r={9} fill="none" stroke={from} strokeWidth={2.5} />
        </g>
      ))}
      <rect x={224} y={44} width={8} height={5} rx={1} fill="#ff3355" />
    </svg>
  );
}

function Newsletter() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };
  if (sent) {
    return (
      <p className={`${heading} text-lg text-[#18e7ff]`} style={{ textShadow: "0 0 14px #18e7ff" }}>
        You&apos;re on the grid. See you at the starting line.
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <label htmlFor="neon-email" className="sr-only">
        Email address
      </label>
      <input
        id="neon-email"
        type="email"
        required
        placeholder="driver@grid.net"
        className="min-w-0 flex-1 rounded-full border border-[#ff2a9d]/40 bg-black/50 px-5 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#18e7ff] focus:shadow-[0_0_0_3px_rgba(24,231,255,0.2)]"
      />
      <button
        type="submit"
        className={`${heading} rounded-full bg-gradient-to-r from-[#ff2a9d] to-[#ffb347] px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition-transform hover:scale-[1.03] active:scale-95`}
      >
        Join the grid
      </button>
    </form>
  );
}

export default function NeonSite() {
  const controls = useRef<DriveControls>({ boost: false, pointerX: 0, keySteer: 0 });
  const speedRef = useRef<HTMLSpanElement>(null);
  const boostBarRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const heroVisibleRef = useRef(true);

  // Pause the WebGL loop once the hero scrolls out of view.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      heroVisibleRef.current = entry.isIntersecting;
      setHeroVisible(entry.isIntersecting);
      if (!entry.isIntersecting) controls.current.boost = false;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Space = boost, arrows / A-D = steer, only while the hero is on screen.
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    const steerFor = (key: string) =>
      key === "ArrowLeft" || key === "a" || key === "A" ? -1 : key === "ArrowRight" || key === "d" || key === "D" ? 1 : 0;

    const down = (e: KeyboardEvent) => {
      if (!heroVisibleRef.current || isTyping(e.target)) return;
      if (e.code === "Space") {
        e.preventDefault();
        controls.current.boost = true;
      }
      const s = steerFor(e.key);
      if (s !== 0) {
        e.preventDefault();
        controls.current.keySteer = s;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") controls.current.boost = false;
      if (steerFor(e.key) === controls.current.keySteer) controls.current.keySteer = 0;
    };
    const blur = () => {
      controls.current.boost = false;
      controls.current.keySteer = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const steerFromPointer = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    controls.current.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  };
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as Element).closest("a, button, input")) return;
    steerFromPointer(e);
    controls.current.boost = true;
  };
  const stopBoost = () => {
    controls.current.boost = false;
  };

  return (
    <div className="min-h-screen bg-[#0b0218] text-white selection:bg-[#ff2a9d] selection:text-black">
      {/* ---------- Hero ---------- */}
      <section
        ref={heroRef}
        onPointerMove={steerFromPointer}
        onPointerDown={onPointerDown}
        onPointerUp={stopBoost}
        onPointerCancel={stopBoost}
        onPointerLeave={stopBoost}
        onContextMenu={(e) => e.preventDefault()}
        className="relative h-[100svh] min-h-[560px] cursor-crosshair touch-pan-y select-none overflow-hidden"
      >
        <div className="absolute inset-0">
          <Scene controls={controls} speedRef={speedRef} boostBarRef={boostBarRef} active={heroVisible} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b0218] to-transparent" />

        <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
          <a href="#top" className={`${display} text-lg text-[#ff2a9d] sm:text-2xl`} style={{ textShadow: "0 0 12px #ff2a9d" }}>
            Neon Drive
          </a>
          <div className={`${heading} hidden items-center gap-8 text-xs uppercase tracking-[0.25em] text-white/75 md:flex`}>
            <a href="#features" className="hover:text-[#18e7ff]">Features</a>
            <a href="#garage" className="hover:text-[#18e7ff]">Garage</a>
            <a href="#release" className="hover:text-[#18e7ff]">Release</a>
          </div>
          <a
            href="#join"
            className={`${heading} rounded-full border border-[#18e7ff]/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#18e7ff] shadow-[0_0_18px_rgba(24,231,255,0.35)] transition-colors hover:bg-[#18e7ff] hover:text-black sm:text-xs`}
          >
            Wishlist
          </a>
        </nav>

        <div id="top" className="pointer-events-none absolute inset-x-0 top-[16%] z-10 px-4 text-center sm:top-[14%]">
          <p className={`${heading} mb-3 text-[10px] uppercase tracking-[0.5em] text-[#ffb347] sm:text-xs`}>
            Arcade racer · Spring 2027
          </p>
          <h1
            className={`${display} text-5xl leading-none text-white sm:text-7xl lg:text-8xl`}
            style={{ textShadow: "0 0 10px #ff2a9d, 0 0 40px #ff2a9d, 0 0 80px #7b2cbf" }}
          >
            Neon Drive
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] sm:text-base">
            Endless midnight highways, a soundtrack that hits harder the faster you go, and one rule: never lift.
          </p>
        </div>

        {/* Boost hint */}
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4 sm:bottom-10">
          <div
            className={`${heading} animate-pulse rounded-full border border-white/20 bg-black/50 px-5 py-2.5 text-[10px] uppercase tracking-[0.3em] text-white/90 backdrop-blur sm:text-xs`}
          >
            <span className="hidden sm:inline">
              Press &amp; hold <kbd className="mx-1 rounded border border-white/40 px-1.5 py-0.5 text-[#ffb347]">Space</kbd> or
              click to boost · steer with mouse
            </span>
            <span className="sm:hidden">Touch &amp; hold to boost</span>
          </div>
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute bottom-40 right-4 z-10 w-32 text-right sm:bottom-10 sm:right-8 sm:w-44">
          <div className={`${heading} leading-none`}>
            <span
              ref={speedRef}
              className="text-4xl font-black tabular-nums text-white sm:text-6xl"
              style={{ textShadow: "0 0 16px #18e7ff" }}
            >
              100
            </span>
            <span className="ml-1 text-[10px] uppercase tracking-widest text-[#18e7ff] sm:text-xs">km/h</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              ref={boostBarRef}
              className="h-full origin-left rounded-full bg-gradient-to-r from-[#ffb347] to-[#ff2a9d] shadow-[0_0_12px_#ff2a9d]"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <div className={`${heading} mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50`}>Boost</div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section
        id="features"
        className="relative px-4 py-24 sm:px-8"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,42,157,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,42,157,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className={`${heading} text-xs uppercase tracking-[0.4em] text-[#18e7ff]`}>01 · The ride</p>
          <h2 className={`${heading} mt-3 max-w-2xl text-3xl font-black uppercase leading-tight sm:text-5xl`}>
            Built for the{" "}
            <span className="bg-gradient-to-r from-[#ff2a9d] to-[#ffb347] bg-clip-text text-transparent">last minute of midnight</span>
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article
                key={f.title}
                className="group rounded-2xl border border-white/10 bg-[#140428]/80 p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: `inset 0 1px 0 ${f.color}33` }}
              >
                <div
                  className="mb-5 grid h-12 w-12 place-items-center rounded-xl border transition-shadow group-hover:shadow-[0_0_24px_var(--c)]"
                  style={{ borderColor: `${f.color}66`, ["--c" as string]: f.color }}
                >
                  <Icon d={f.icon} color={f.color} />
                </div>
                <h3 className={`${heading} text-lg font-bold uppercase tracking-wide`}>{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Garage ---------- */}
      <section id="garage" className="relative overflow-hidden px-4 py-24 sm:px-8">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[80%] -translate-x-1/2 rounded-full bg-[#7b2cbf]/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className={`${heading} text-xs uppercase tracking-[0.4em] text-[#ffb347]`}>02 · The garage</p>
          <h2 className={`${heading} mt-3 text-3xl font-black uppercase sm:text-5xl`}>Pick your machine</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {cars.map((car, i) => (
              <article
                key={car.name}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1b0636] to-[#0b0218] p-6 transition-all duration-300 hover:-translate-y-2"
                style={{ boxShadow: `0 20px 60px -30px ${car.from}` }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 h-1 opacity-60 transition-opacity group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, ${car.from}, ${car.to})` }}
                />
                <div className="flex items-start justify-between">
                  <span className={`${heading} text-[10px] uppercase tracking-[0.3em] text-white/50`}>{car.class}</span>
                  <span className={`${heading} text-xs text-white/40`}>0{i + 1}</span>
                </div>
                <div className="my-6 transition-transform duration-500 group-hover:translate-x-2 group-hover:scale-105">
                  <CarSilhouette from={car.from} to={car.to} id={`neon-car-${i}`} />
                </div>
                <h3 className={`${heading} text-xl font-black uppercase`} style={{ color: car.from }}>
                  {car.name}
                </h3>
                <div className="mt-5 space-y-3">
                  {Object.entries(car.stats).map(([label, value]) => (
                    <StatBar key={label} label={label} value={value} from={car.from} to={car.to} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Release ---------- */}
      <section id="release" className="px-4 py-24 sm:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className={`${heading} text-xs uppercase tracking-[0.4em] text-[#18e7ff]`}>03 · Launch</p>
            <h2 className={`${heading} mt-3 text-3xl font-black uppercase sm:text-5xl`}>
              Lights out on{" "}
              <span className={`${display} block pt-2 text-4xl font-normal text-[#ffb347] sm:text-6xl`} style={{ textShadow: "0 0 20px #ff7a18" }}>
                03.14.27
              </span>
            </h2>
            <p className="mt-4 max-w-md text-white/65">
              Day-one launch on every platform with cross-play ghost races and cloud saves. Pre-order to unlock the Midnight RS on launch night.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {platforms.map((p) => (
                <span
                  key={p}
                  className={`${heading} rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-widest text-white/80`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <Countdown />
        </div>
      </section>

      {/* ---------- Newsletter ---------- */}
      <section id="join" className="px-4 pb-28 pt-8 sm:px-8">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#ff2a9d]/30 bg-gradient-to-br from-[#2a0845] via-[#140428] to-[#3a0a2a] px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ffb347] to-[#ff2a9d] opacity-60 blur-2xl" />
          <h2 className={`${heading} relative text-2xl font-black uppercase sm:text-4xl`}>Get on the grid</h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/70">
            Beta keys, soundtrack drops and dev diaries. One email a month, no spam, no brakes.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Newsletter />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 pb-24 pt-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-white/45 sm:flex-row">
          <span className={`${display} text-base text-[#ff2a9d]`}>Neon Drive</span>
          <span>© 2027 Afterglow Interactive. A MeshUI demo, all names fictional.</span>
          <div className="flex gap-4 uppercase tracking-widest">
            <a href="#features" className="hover:text-white">Press kit</a>
            <a href="#join" className="hover:text-white">Discord</a>
            <a href="#top" className="hover:text-white">Top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
