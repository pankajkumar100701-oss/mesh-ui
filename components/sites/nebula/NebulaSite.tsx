"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const display = "font-(family-name:--font-nebula)";

const destinations = [
  {
    name: "Kepler Blue",
    kind: "Ocean world · 3 nights",
    body: "Skim the cloud tops of a planet that is 90% ocean, then watch twin sunsets from the observation ring.",
    color: "from-sky-400/40 to-cyan-300/10",
  },
  {
    name: "Saturnine Rings",
    kind: "Ring cruise · 5 nights",
    body: "Thread the Cassini gap in a glass-bottomed cruiser while ice crystals glitter a few hundred metres below.",
    color: "from-orange-400/40 to-amber-200/10",
  },
  {
    name: "The Core",
    kind: "Deep voyage · 11 nights",
    body: "Our flagship route to the galactic heart, where a hundred million suns light the sky like permanent dawn.",
    color: "from-fuchsia-500/40 to-violet-400/10",
  },
];

const stats = [
  { value: "2.4 ly", label: "Furthest route flown" },
  { value: "0 g", label: "Hours of float time / day" },
  { value: "11", label: "Nights on the Core voyage" },
  { value: "98%", label: "Guests who book again" },
];

const tiers = [
  {
    name: "Orbit",
    price: "$24k",
    note: "Weekend",
    perks: ["2 nights in low orbit", "Panoramic sleep pod", "Spacewalk simulator"],
  },
  {
    name: "Voyager",
    price: "$180k",
    note: "Most booked",
    perks: ["Kepler Blue + Rings", "Private cabin with view-dome", "Guided EVA", "Chef's zero-g tasting"],
    featured: true,
  },
  {
    name: "Odyssey",
    price: "$1.2M",
    note: "Once in a lifetime",
    perks: ["Full Core voyage", "Captain's table", "Name a star", "Lifetime return pass"],
  },
];

const quotes = [
  {
    text: "I cried at the first sunrise. Then I cried at the second one eight minutes later.",
    who: "Amara O., Voyager 2026",
  },
  {
    text: "You don't look at the galaxy from the Core. You stand inside it.",
    who: "Ravi S., Odyssey 2025",
  },
];

function Glass({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_0_60px_-20px_rgba(168,85,247,0.45)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function NebulaSite({ fontClassName = "" }: { fontClassName?: string }) {
  const [email, setEmail] = useState("");
  const [booked, setBooked] = useState(false);

  return (
    <div className={`${fontClassName} relative min-h-screen text-white selection:bg-fuchsia-500/40`}>
      <div className="fixed inset-0 -z-0" aria-hidden>
        <Scene />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <a href="#top" className={`${display} text-lg font-bold tracking-[0.25em]`}>
              ✦ NEBULA
            </a>
            <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <a href="#destinations" className="hover:text-white">Destinations</a>
              <a href="#voyage" className="hover:text-white">The voyage</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
            </div>
            <a
              href="#book"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-white hover:text-black"
            >
              Book a seat
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section id="top" className="flex min-h-[100svh] items-center px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl pt-20">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400" />
              Now boarding · Season 07
            </p>
            <h1
              className={`${display} max-w-4xl text-[clamp(2.6rem,9vw,7.5rem)] font-extrabold leading-[0.92] tracking-tight`}
            >
              Leave the planet.
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
                Keep the view.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/70 sm:text-lg">
              Nebula Expeditions flies small crews through the brightest corners of the galaxy.
              Scroll down — your flight has already started.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#pricing"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.03]"
              >
                Choose your voyage
              </a>
              <a
                href="#destinations"
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
              >
                See destinations
              </a>
            </div>
            <div className="mt-20 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
              <span className="block h-10 w-px animate-pulse bg-gradient-to-b from-white/70 to-transparent" />
              Scroll to launch
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section id="destinations" className="flex min-h-screen items-center px-4 py-24 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">01 — Destinations</p>
            <h2 className={`${display} mt-4 max-w-2xl text-4xl font-bold sm:text-6xl`}>
              Three worlds. One unforgettable route.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {destinations.map((d) => (
                <Glass key={d.name} className="group relative overflow-hidden transition hover:-translate-y-1">
                  <div
                    className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${d.color} blur-2xl transition group-hover:scale-125`}
                  />
                  <p className="relative text-xs uppercase tracking-[0.25em] text-white/50">{d.kind}</p>
                  <h3 className={`${display} relative mt-3 text-2xl font-bold`}>{d.name}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/70">{d.body}</p>
                </Glass>
              ))}
            </div>
          </div>
        </section>

        {/* Voyage / stats */}
        <section id="voyage" className="flex min-h-screen items-center px-4 py-24 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl justify-end">
            <Glass className="w-full max-w-xl p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-300/80">02 — The voyage</p>
              <h2 className={`${display} mt-4 text-3xl font-bold sm:text-5xl`}>
                Built for wonder. Engineered for calm.
              </h2>
              <p className="mt-4 text-white/70">
                Every Nebula craft carries six guests, two pilots and a full-time stargazer.
                Artificial gravity when you want it, weightlessness when you don&apos;t.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className={`${display} text-3xl font-bold sm:text-4xl`}>{s.value}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-wider text-white/50">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </Glass>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="flex min-h-screen items-center px-4 py-24 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">03 — Pricing</p>
            <h2 className={`${display} mt-4 text-4xl font-bold sm:text-6xl`}>Pick your altitude.</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {tiers.map((t) => (
                <Glass
                  key={t.name}
                  className={
                    t.featured
                      ? "relative border-fuchsia-400/50 bg-fuchsia-500/[0.08] md:-translate-y-4"
                      : "relative"
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`${display} text-2xl font-bold`}>{t.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                        t.featured ? "bg-fuchsia-400 text-black" : "bg-white/10 text-white/70"
                      }`}
                    >
                      {t.note}
                    </span>
                  </div>
                  <p className={`${display} mt-6 text-5xl font-extrabold`}>{t.price}</p>
                  <p className="text-xs text-white/50">per guest</p>
                  <ul className="mt-6 space-y-2 text-sm text-white/75">
                    {t.perks.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="text-fuchsia-300">✦</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#book"
                    className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition ${
                      t.featured
                        ? "bg-white text-black hover:scale-[1.02]"
                        : "border border-white/20 hover:bg-white/10"
                    }`}
                  >
                    Reserve {t.name}
                  </a>
                </Glass>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="flex min-h-[80vh] items-center px-4 py-24 sm:px-6">
          <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2">
            {quotes.map((q) => (
              <figure key={q.who}>
                <Glass className="h-full p-8">
                  <blockquote className={`${display} text-2xl leading-snug sm:text-3xl`}>
                    “{q.text}”
                  </blockquote>
                  <figcaption className="mt-6 text-sm text-white/50">— {q.who}</figcaption>
                </Glass>
              </figure>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="book" className="flex min-h-screen items-center px-4 py-24 sm:px-6">
          <div className="mx-auto w-full max-w-3xl text-center">
            <h2 className={`${display} text-[clamp(2.4rem,7vw,5.5rem)] font-extrabold leading-[0.95]`}>
              Your seat among the stars is waiting.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-white/70">
              Season 08 manifests open soon. Join the list and we&apos;ll call you before launch day.
            </p>
            {booked ? (
              <p className="mx-auto mt-10 max-w-md rounded-full border border-emerald-300/40 bg-emerald-400/10 px-6 py-4 text-sm text-emerald-200 backdrop-blur">
                ✦ You&apos;re on the manifest. See you in orbit.
              </p>
            ) : (
              <form
                className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setBooked(true);
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@earth.com"
                  className="min-w-0 flex-1 rounded-full border border-white/20 bg-black/40 px-5 py-3 text-sm outline-none backdrop-blur placeholder:text-white/40 focus:border-fuchsia-300"
                />
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-amber-200 via-fuchsia-400 to-sky-400 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.03]"
                >
                  Join the manifest
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/40 px-4 pb-24 pt-10 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 text-sm text-white/50 sm:flex-row">
            <p className={`${display} font-bold tracking-[0.25em] text-white`}>✦ NEBULA</p>
            <p>Departures from Earth Orbital Port 3 · A fictional company built with MeshUI.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
