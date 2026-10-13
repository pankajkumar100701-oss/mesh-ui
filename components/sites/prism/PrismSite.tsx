"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import type { ShapeId, SizeId } from "./Scene";

const HeroCanvas = dynamic(() => import("./Scene").then((m) => m.HeroCanvas), {
  ssr: false,
});
const ConfiguratorCanvas = dynamic(
  () => import("./Scene").then((m) => m.ConfiguratorCanvas),
  { ssr: false },
);

const serif = "font-(family-name:--font-prism-serif)";

const SHAPES: { id: ShapeId; name: string; note: string; price: number }[] = [
  { id: "knot", name: "Trefoil", note: "Endless knot", price: 148000 },
  { id: "gem", name: "Facet", note: "Twenty planes", price: 96000 },
  { id: "helix", name: "Helix", note: "Twisted column", price: 124000 },
  { id: "halo", name: "Halo", note: "Solid ring", price: 82000 },
];

const TINTS = [
  { name: "Clear", hex: "#ffffff", extra: 0 },
  { name: "Lavender", hex: "#c4b5fd", extra: 12000 },
  { name: "Amber", hex: "#fcd34d", extra: 14000 },
  { name: "Rose", hex: "#fda4af", extra: 12000 },
  { name: "Lagoon", hex: "#5eead4", extra: 16000 },
];

const SIZES: { id: SizeId; label: string; cm: string; factor: number }[] = [
  { id: "S", label: "Petite", cm: "18 cm", factor: 0.75 },
  { id: "M", label: "Studio", cm: "28 cm", factor: 1 },
  { id: "L", label: "Grand", cm: "42 cm", factor: 1.6 },
];

const COLLECTION = [
  {
    name: "Tide No. 4",
    edition: "Edition of 12",
    price: "₹2,40,000",
    art: "radial-gradient(circle at 30% 30%, #ffffffcc 0 18%, transparent 19%), conic-gradient(from 200deg at 50% 55%, #c4b5fd, #f0abfc, #fdba74, #99f6e4, #c4b5fd)",
  },
  {
    name: "Monsoon Lens",
    edition: "Edition of 8",
    price: "₹3,10,000",
    art: "radial-gradient(circle at 65% 35%, #ffffffd9 0 14%, transparent 15%), conic-gradient(from 90deg at 45% 50%, #5eead4, #a5f3fc, #e0e7ff, #5eead4)",
  },
  {
    name: "Ember Vessel",
    edition: "Unique",
    price: "₹4,80,000",
    art: "radial-gradient(circle at 40% 25%, #fff7ed 0 12%, transparent 13%), conic-gradient(from 0deg at 50% 60%, #fcd34d, #fb923c, #fda4af, #fcd34d)",
  },
  {
    name: "Quiet Orbit",
    edition: "Edition of 20",
    price: "₹1,65,000",
    art: "radial-gradient(circle at 50% 50%, transparent 0 28%, #ffffffb3 29% 36%, transparent 37%), conic-gradient(from 120deg, #e7e5e4, #d6d3d1, #c4b5fd, #e7e5e4)",
  },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/** True while the element is (nearly) on screen — used to pause offscreen canvases. */
function useInView<T extends Element>(ref: RefObject<T | null>) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

export default function PrismSite() {
  const heroRef = useRef<HTMLElement>(null);
  const configRef = useRef<HTMLDivElement>(null);
  const heroActive = useInView(heroRef);
  const configActive = useInView(configRef);

  const [shape, setShape] = useState<ShapeId>("knot");
  const [tint, setTint] = useState(TINTS[1]);
  const [size, setSize] = useState<SizeId>("M");
  const [reserved, setReserved] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const shapeInfo = SHAPES.find((s) => s.id === shape)!;
  const sizeInfo = SIZES.find((s) => s.id === size)!;
  const price = Math.round((shapeInfo.price * sizeInfo.factor + tint.extra) / 1000) * 1000;

  useEffect(() => {
    if (!reserved) return;
    const t = setTimeout(() => setReserved(false), 2600);
    return () => clearTimeout(t);
  }, [reserved]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#f3eee6] text-stone-900 selection:bg-violet-200">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#top" className={`${serif} text-2xl tracking-tight`}>
            Prism <span className="italic text-stone-500">Atelier</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
            <a href="#collection" className="hover:text-stone-900">Collection</a>
            <a href="#configure" className="hover:text-stone-900">Configure</a>
            <a href="#craft" className="hover:text-stone-900">Craft</a>
            <a href="#contact" className="hover:text-stone-900">Contact</a>
          </div>
          <a
            href="#configure"
            className="rounded-full border border-stone-900/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors hover:bg-stone-900 hover:text-[#f3eee6]"
          >
            Commission
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" ref={heroRef} className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0">
          <HeroCanvas active={heroActive} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#f3eee6] via-transparent to-transparent md:bg-gradient-to-r md:from-[#f3eee6]/90 md:via-[#f3eee6]/20" />
        <div className="pointer-events-none relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-24 sm:px-8 md:justify-center md:pb-0">
          <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-stone-500">
            Hand-blown optical glass · Jaipur
          </p>
          <h1 className={`${serif} max-w-xl text-6xl leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl`}>
            Light,
            <br />
            <span className="italic text-stone-500">held</span> still.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-stone-600">
            Sculptures cut from a single pour of optical crystal. Each one bends
            the room around it — and no two bend it the same way.
          </p>
          <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <a
              href="#configure"
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-[#f3eee6] transition-transform hover:-translate-y-0.5"
            >
              Design your piece
            </a>
            <a
              href="#collection"
              className="rounded-full border border-stone-900/20 bg-white/40 px-6 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-white/70"
            >
              View collection
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-6 right-6 hidden text-right text-[11px] uppercase tracking-[0.25em] text-stone-500 md:block">
          Move your cursor
          <br />
          the glass follows
        </div>
      </section>

      {/* Press strip */}
      <div className="border-y border-stone-900/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6 text-sm uppercase tracking-[0.25em] text-stone-400 sm:justify-between sm:px-8">
          {["Vogue Living", "Architectural Digest", "Wallpaper*", "Elle Decor", "Kinfolk"].map((p) => (
            <span key={p} className={serif + " text-base normal-case italic tracking-normal"}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Collection */}
      <section id="collection" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-stone-500">Autumn collection</p>
            <h2 className={`${serif} text-4xl sm:text-6xl`}>
              Four ways to <span className="italic">catch</span> the sun
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-stone-600">
            Limited editions, signed and numbered. Shipped in a hand-stitched
            linen case with a certificate of origin.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTION.map((c) => (
            <article key={c.name} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#ebe4d8]">
                <div
                  className="absolute inset-8 rounded-full blur-[2px] transition-transform duration-700 group-hover:rotate-45 group-hover:scale-110"
                  style={{ background: c.art }}
                />
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-white/70 via-transparent to-white/10 mix-blend-overlay" />
                <span className="absolute left-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] backdrop-blur">
                  {c.edition}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className={`${serif} text-2xl`}>{c.name}</h3>
                <span className="text-sm text-stone-500">{c.price}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Configurator */}
      <section id="configure" className="bg-[#ebe4d8]/60 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-stone-500">Live configurator</p>
            <h2 className={`${serif} text-4xl sm:text-6xl`}>
              Shape it. <span className="italic">Tint</span> it. Own it.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              What you see is rendered in real time with physically based glass —
              drag the piece to turn it in the light.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div
              ref={configRef}
              className="relative aspect-square overflow-hidden rounded-[32px] bg-[#ebe4d8] shadow-[0_30px_80px_-40px_rgba(68,64,60,0.5)] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[560px]"
            >
              <ConfiguratorCanvas active={configActive} shape={shape} tint={tint.hex} size={size} />
              <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-600 backdrop-blur">
                Drag to rotate
              </span>
            </div>

            <div className="flex flex-col gap-8 rounded-[32px] bg-[#f3eee6] p-6 sm:p-8">
              <div>
                <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-stone-500">Form</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SHAPES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setShape(s.id)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        shape === s.id
                          ? "border-stone-900 bg-stone-900 text-[#f3eee6]"
                          : "border-stone-900/15 hover:border-stone-900/40"
                      }`}
                    >
                      <span className={`${serif} block text-xl`}>{s.name}</span>
                      <span className="text-xs opacity-70">{s.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-stone-500">
                  Tint — <span className="normal-case tracking-normal text-stone-800">{tint.name}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {TINTS.map((t) => (
                    <button
                      key={t.name}
                      aria-label={t.name}
                      onClick={() => setTint(t)}
                      className={`h-11 w-11 rounded-full border border-stone-900/10 shadow-inner transition-transform hover:scale-110 ${
                        tint.name === t.name ? "ring-2 ring-stone-900 ring-offset-4 ring-offset-[#f3eee6]" : ""
                      }`}
                      style={{
                        background: `radial-gradient(circle at 30% 30%, #ffffff, ${t.hex} 60%, ${t.hex})`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-stone-500">Scale</h3>
                <div className="grid grid-cols-3 gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s.id)}
                      className={`rounded-2xl border px-3 py-3 text-center text-sm transition-all ${
                        size === s.id
                          ? "border-stone-900 bg-stone-900 text-[#f3eee6]"
                          : "border-stone-900/15 hover:border-stone-900/40"
                      }`}
                    >
                      <span className="block font-medium">{s.label}</span>
                      <span className="text-xs opacity-70">{s.cm}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-stone-900/10 pt-6">
                <div>
                  <p className="text-xs text-stone-500">
                    {shapeInfo.name} · {tint.name} · {sizeInfo.label}
                  </p>
                  <p key={price} className={`${serif} animate-[prism-pop_0.4s_ease] text-4xl`}>
                    {inr(price)}
                  </p>
                </div>
                <button
                  onClick={() => setReserved(true)}
                  className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-[#f3eee6] transition-transform hover:-translate-y-0.5"
                >
                  {reserved ? "Reserved ✓" : "Reserve piece"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Craft */}
      <section id="craft" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-stone-500">The atelier</p>
            <h2 className={`${serif} text-4xl leading-tight sm:text-6xl`}>
              Nine artisans. <br />
              <span className="italic">One</span> breath per piece.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-stone-600">
              Founded in 2011 in a converted haveli courtyard, Prism Atelier
              works only in lead-free optical crystal. Every sculpture is
              gathered, blown, annealed for three days and polished by hand
              until it disappears into the light.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-stone-900/10 pt-8">
              {[
                ["1,240°", "Furnace heat"],
                ["72 h", "Annealing"],
                ["0.02 mm", "Polish tolerance"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className={`${serif} text-3xl sm:text-4xl`}>{n}</dt>
                  <dd className="mt-1 text-xs text-stone-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ol className="space-y-4">
            {[
              ["Gather", "Molten crystal is gathered on a steel pipe in three layers, each one clearer than the last."],
              ["Breathe", "The form is blown and turned by hand — the only mould is the artisan's palm and a wet pearwood block."],
              ["Rest", "Pieces cool slowly in the annealing kiln for 72 hours so they never carry hidden stress."],
              ["Polish", "Faces are ground on diamond wheels and finished with cerium until the edges vanish."],
            ].map(([title, body], i) => (
              <li
                key={title}
                className="group flex gap-6 rounded-[28px] border border-stone-900/10 bg-white/40 p-6 transition-colors hover:bg-white/80"
              >
                <span className={`${serif} text-4xl italic text-stone-400 transition-colors group-hover:text-violet-400`}>
                  0{i + 1}
                </span>
                <div>
                  <h3 className={`${serif} text-2xl`}>{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Quote */}
      <section className="border-y border-stone-900/10 px-5 py-24 text-center sm:px-8">
        <blockquote className={`${serif} mx-auto max-w-4xl text-3xl leading-snug sm:text-5xl`}>
          “It sits on the windowsill and at four o’clock the whole room turns
          <span className="bg-gradient-to-r from-violet-400 via-rose-400 to-amber-400 bg-clip-text italic text-transparent"> violet</span>.”
        </blockquote>
        <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-stone-500">
          Meera Rao — collector, Bengaluru
        </p>
      </section>

      {/* CTA */}
      <section id="contact" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="relative overflow-hidden rounded-[40px] bg-stone-900 px-6 py-16 text-[#f3eee6] sm:px-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[conic-gradient(from_0deg,#c4b5fd,#fda4af,#fcd34d,#5eead4,#c4b5fd)] opacity-60 blur-3xl" />
          <div className="relative max-w-xl">
            <h2 className={`${serif} text-4xl sm:text-6xl`}>
              Commission a <span className="italic">one-off</span>.
            </h2>
            <p className="mt-4 text-stone-300">
              Tell us about your space and the light it gets. We’ll send sketches
              within a week.
            </p>
            {sent ? (
              <p className="mt-8 rounded-full bg-white/10 px-6 py-4 text-sm">
                Thank you — our studio will write to {email} shortly.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm placeholder:text-stone-500 focus:border-white/60 focus:outline-none"
                />
                <button className="rounded-full bg-[#f3eee6] px-6 py-3 text-sm font-medium text-stone-900 transition-transform hover:-translate-y-0.5">
                  Start a commission
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-28 pt-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className={`${serif} text-xl text-stone-900`}>
          Prism <span className="italic text-stone-500">Atelier</span>
        </p>
        <div className="flex flex-wrap gap-6">
          <a href="#collection" className="hover:text-stone-900">Collection</a>
          <a href="#craft" className="hover:text-stone-900">Atelier</a>
          <a href="#contact" className="hover:text-stone-900">Instagram</a>
        </div>
        <p>© 2026 Prism Atelier · Jaipur</p>
      </footer>

      <style>{`@keyframes prism-pop { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
