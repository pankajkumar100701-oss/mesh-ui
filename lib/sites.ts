export type Site = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Two colours used for the card gradient on the MeshUI home page. */
  colors: [string, string];
  tags: string[];
  /** Source files (relative to the project root) shown on the code page. */
  files: string[];
};

export const sites: Site[] = [
  {
    slug: "nebula",
    name: "Nebula Expeditions",
    tagline: "Scroll-driven flight through a living galaxy",
    description:
      "A space-tourism landing page. 40k-particle spiral galaxy built with a custom shader, a camera that flies past planets as you scroll, and bloom that makes the stars glow.",
    colors: ["#7c3aed", "#06b6d4"],
    tags: ["Custom shaders", "Scroll camera", "Bloom"],
    files: [
      "components/sites/nebula/NebulaSite.tsx",
      "components/sites/nebula/Scene.tsx",
    ],
  },
  {
    slug: "prism",
    name: "Prism Atelier",
    tagline: "Real glass, real refraction, live configurator",
    description:
      "A luxury glass-sculpture studio. Physically based transmission material, studio lighting made from light-formers, and a configurator that swaps shape and tint in real time.",
    colors: ["#f5f5f4", "#a78bfa"],
    tags: ["Transmission glass", "Configurator", "Light theme"],
    files: [
      "components/sites/prism/PrismSite.tsx",
      "components/sites/prism/Scene.tsx",
    ],
  },
  {
    slug: "neon",
    name: "Neon Drive",
    tagline: "Synthwave highway at 300 km/h",
    description:
      "A retro racing-game launch page. Endless scrolling neon terrain, a striped shader sun, a car you can steer with the mouse and hold-to-boost speed lines.",
    colors: ["#ec4899", "#f97316"],
    tags: ["Infinite terrain", "Interactive", "Synthwave"],
    files: [
      "components/sites/neon/NeonSite.tsx",
      "components/sites/neon/Scene.tsx",
    ],
  },
  {
    slug: "bounce",
    name: "Bounce Candy Co.",
    tagline: "Grab it, throw it, watch it bounce",
    description:
      "A playful candy brand with a real physics engine. Sweets rain from the sky, pile up, and you can drag and fling every one of them around the hero.",
    colors: ["#fb7185", "#facc15"],
    tags: ["Rapier physics", "Drag & throw", "Pastel"],
    files: [
      "components/sites/bounce/BounceSite.tsx",
      "components/sites/bounce/Scene.tsx",
    ],
  },
  {
    slug: "isle",
    name: "Isle Retreats",
    tagline: "A floating island you can spin, explore and light up at night",
    description:
      "A boutique resort site built around a low-poly floating island. Orbit around it, tap glowing hotspots to read about each spot, and flip between day and night.",
    colors: ["#22c55e", "#0ea5e9"],
    tags: ["Low-poly", "Hotspots", "Day / night"],
    files: [
      "components/sites/isle/IsleSite.tsx",
      "components/sites/isle/Scene.tsx",
    ],
  },
];

export function getSite(slug: string) {
  return sites.find((s) => s.slug === slug);
}
