"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-rose-400">
      Unwrapping candy…
    </div>
  ),
});

const display = { fontFamily: "var(--font-bounce), ui-rounded, system-ui, sans-serif" };

const flavours = [
  { name: "Strawberry Pop", note: "Bright, tangy, a little bit loud.", colors: ["#fb7185", "#fecdd3"] },
  { name: "Lemon Zing", note: "Sour first, sunshine after.", colors: ["#facc15", "#fef08a"] },
  { name: "Blue Raspberry", note: "The flavour that isn't in nature.", colors: ["#38bdf8", "#bae6fd"] },
  { name: "Grape Fizz", note: "Purple, sparkly, unapologetic.", colors: ["#a78bfa", "#ddd6fe"] },
  { name: "Mint Cloud", note: "Cool like the other side of the pillow.", colors: ["#34d399", "#bbf7d0"] },
  { name: "Mango Tango", note: "Juicy enough to need a napkin.", colors: ["#fb923c", "#fed7aa"] },
];

const steps = [
  { n: "01", title: "Real fruit, slow cooked", body: "We simmer fruit purée in copper kettles until it smells like summer." },
  { n: "02", title: "Poured & shaped", body: "Each candy is poured into tiny moulds and cooled on marble." },
  { n: "03", title: "Glazed to a shine", body: "A thin sugar glaze gives that glossy, bouncy finish." },
  { n: "04", title: "Packed with a grin", body: "Hand-packed in compostable tins and posted the same day." },
];

const reviews = [
  { quote: "I bought them for my kids. I ate them. Ordering again.", name: "Aanya R.", stars: 5 },
  { quote: "The lemon ones made my whole face scrunch up. 10/10.", name: "Marcus T.", stars: 5 },
  { quote: "Prettiest tin on my desk and the candy disappears fast.", name: "Priya S.", stars: 5 },
];

function Blob({ colors }: { colors: string[] }) {
  return (
    <div className="relative h-24 w-24">
      <div
        className="absolute inset-0 rounded-[42%_58%_55%_45%/50%_45%_55%_50%] shadow-[inset_-10px_-12px_0_rgba(0,0,0,0.08)] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
        style={{ background: `radial-gradient(circle at 30% 30%, ${colors[1]}, ${colors[0]} 65%)` }}
      />
      <div className="absolute left-4 top-3 h-4 w-6 -rotate-12 rounded-full bg-white/70" />
    </div>
  );
}

export default function BounceSite() {
  const [batches, setBatches] = useState(0);
  const [shake, setShake] = useState(0);
  const [count, setCount] = useState(0);
  const [full, setFull] = useState(false);
  const onCountChange = useCallback((n: number, isFull: boolean) => {
    setCount(n);
    setFull(isFull);
  }, []);

  return (
    <div className="min-h-screen bg-[#fff7f2] text-[#3b1d2e]">
      {/* ---------- hero ---------- */}
      <section className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#ffe4ec,transparent_45%),radial-gradient(circle_at_85%_20%,#fef3c7,transparent_40%),radial-gradient(circle_at_50%_100%,#e0f2fe,transparent_55%)]">
        <div className="absolute inset-0">
          <Scene batches={batches} shake={shake} onCountChange={onCountChange} />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 pt-5 sm:px-8">
          <a href="#" className="flex items-center gap-2 text-xl font-bold" style={display}>
            <span className="inline-block h-7 w-7 rounded-full bg-[conic-gradient(#fb7185,#facc15,#38bdf8,#a78bfa,#fb7185)] ring-4 ring-white" />
            Bounce
          </a>
          <div className="hidden items-center gap-7 text-sm font-semibold sm:flex">
            <a href="#flavours" className="hover:text-rose-500">Flavours</a>
            <a href="#how" className="hover:text-rose-500">How it&apos;s made</a>
            <a href="#reviews" className="hover:text-rose-500">Reviews</a>
          </div>
          <a
            href="#shop"
            className="rounded-full bg-[#3b1d2e] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_#fb7185] transition-transform hover:-translate-y-0.5"
          >
            Shop
          </a>
        </nav>

        <div className="pointer-events-none relative z-10 mx-auto mt-[9svh] max-w-3xl px-4 text-center">
          <p className="mb-3 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-500 shadow-sm">
            Grab one · fling it
          </p>
          <h1 className="text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl md:text-8xl" style={display}>
            Sweets that
            <br />
            <span className="text-rose-500">bounce back.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base font-medium text-[#3b1d2e]/70 sm:text-lg">
            Small-batch fruit candy, glossy as a gumball and twice as fun. Go on — throw one.
          </p>
          <div className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShake((s) => s + 1)}
              className="rounded-full bg-rose-500 px-6 py-3 text-base font-bold text-white shadow-[0_5px_0_#be123c] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_#be123c]"
              style={display}
            >
              Shake it!
            </button>
            <button
              type="button"
              onClick={() => setBatches((b) => b + 1)}
              disabled={full}
              className="rounded-full bg-white px-6 py-3 text-base font-bold shadow-[0_5px_0_#facc15] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_#facc15] disabled:opacity-50"
              style={display}
            >
              {full ? "Jar's full!" : "More candy"}
            </button>
          </div>
          {count > 0 && (
            <p className="mt-3 text-xs font-semibold text-[#3b1d2e]/50">{count} candies in play</p>
          )}
        </div>
      </section>

      {/* ---------- flavours ---------- */}
      <section id="flavours" className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-4xl font-bold sm:text-5xl" style={display}>
            Pick your <span className="text-sky-500">flavour</span>
          </h2>
          <p className="max-w-sm text-[#3b1d2e]/70">Six signature sweets, all natural colours, zero boring.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {flavours.map((f) => (
            <article
              key={f.name}
              className="group flex items-center gap-5 rounded-[2rem] bg-white p-5 shadow-[0_6px_0_rgba(59,29,46,0.08)] ring-1 ring-[#3b1d2e]/5 transition-transform hover:-translate-y-1"
            >
              <Blob colors={f.colors} />
              <div>
                <h3 className="text-xl font-bold" style={display}>{f.name}</h3>
                <p className="mt-1 text-sm text-[#3b1d2e]/65">{f.note}</p>
                <div className="mt-3 flex gap-1.5">
                  {f.colors.map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- how it's made ---------- */}
      <section id="how" className="bg-[#3b1d2e] px-4 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold sm:text-5xl" style={display}>
            How it&apos;s <span className="text-yellow-300">made</span>
          </h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.n} className="rounded-[2rem] bg-white/5 p-6 ring-1 ring-white/10">
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-[#3b1d2e]"
                  style={{ ...display, background: flavours[i].colors[0] }}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 text-xl font-bold" style={display}>{s.title}</h3>
                <p className="mt-2 text-sm text-white/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- reviews ---------- */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <h2 className="text-center text-4xl font-bold sm:text-5xl" style={display}>
          Sticky <span className="text-violet-500">reviews</span>
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <figure
              key={r.name}
              className="rounded-[2rem] bg-white p-6 shadow-[0_6px_0_rgba(59,29,46,0.08)] ring-1 ring-[#3b1d2e]/5"
              style={{ rotate: `${(i - 1) * 1.5}deg` }}
            >
              <div className="text-yellow-400" aria-label={`${r.stars} stars`}>
                {"★".repeat(r.stars)}
              </div>
              <blockquote className="mt-3 text-lg font-semibold leading-snug" style={display}>
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm text-[#3b1d2e]/60">— {r.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- shop CTA ---------- */}
      <section id="shop" className="px-4 pb-24 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-[2.5rem] bg-gradient-to-br from-rose-400 via-pink-400 to-amber-300 px-6 py-14 text-center text-white shadow-[0_10px_0_#be123c] sm:py-20">
          <h2 className="text-4xl font-bold sm:text-6xl" style={display}>
            The Bounce Tin
          </h2>
          <p className="max-w-md text-white/90">
            All six flavours, 60 candies, one very shiny tin. Free shipping over ₹999.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-3xl font-bold" style={display}>₹649</span>
            <a
              href="#shop"
              className="rounded-full bg-white px-7 py-3 font-bold text-rose-500 shadow-[0_5px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5"
              style={display}
            >
              Add to bag
            </a>
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-[#3b1d2e]/10 px-4 pt-10 pb-24 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-bold" style={display}>Bounce Candy Co.</p>
            <p className="mt-1 text-sm text-[#3b1d2e]/60">Made with sugar and gravity.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-[#3b1d2e]/70">
            <a href="#flavours" className="hover:text-rose-500">Flavours</a>
            <a href="#how" className="hover:text-rose-500">Process</a>
            <a href="#reviews" className="hover:text-rose-500">Reviews</a>
            <a href="#shop" className="hover:text-rose-500">Shop</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
