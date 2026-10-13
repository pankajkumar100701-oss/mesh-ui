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
      "A space-tourism landing page that opens with a hyperspace warp into a shader spiral galaxy, then flies you past a ringed gas giant, through a nebula and up to a ray-marched black hole as you scroll.",
    colors: ["#7c3aed", "#06b6d4"],
    tags: ["Warp intro", "Ray-marched black hole", "Scroll camera"],
    files: [
      "components/sites/nebula/NebulaSite.tsx",
      "components/sites/nebula/Scene.tsx",
      "components/sites/nebula/Galaxy.tsx",
      "components/sites/nebula/Warp.tsx",
      "components/sites/nebula/RingedPlanet.tsx",
      "components/sites/nebula/NebulaCloud.tsx",
      "components/sites/nebula/BlackHole.tsx",
      "components/sites/nebula/Glow.tsx",
      "components/sites/nebula/journey.ts",
      "components/sites/nebula/shaders.ts",
    ],
  },
  {
    slug: "prism",
    name: "Prism Atelier",
    tagline: "Real glass, real refraction, live configurator",
    description:
      "A luxury glass-sculpture studio. A beam of light strikes a crystal knot and fans into a rainbow; scroll and it shatters into quartz shards that reassemble as a brilliant-cut gem. Plus a live configurator.",
    colors: ["#f5f5f4", "#a78bfa"],
    tags: ["Dispersion glass", "Scroll story", "Configurator"],
    files: [
      "components/sites/prism/PrismSite.tsx",
      "components/sites/prism/Scene.tsx",
      "components/sites/prism/Optics.tsx",
      "components/sites/prism/Configurator.tsx",
    ],
  },
  {
    slug: "neon",
    name: "Neon Drive",
    tagline: "A synthwave racer you can actually play",
    description:
      "A retro racing-game launch page whose hero is a playable mini-game: dodge traffic, grab orbs and boost down a mirror-wet neon highway in a procedural sports car, with a 3D garage turntable below.",
    colors: ["#ec4899", "#f97316"],
    tags: ["Playable mini-game", "Reflective road", "Synthwave"],
    files: [
      "components/sites/neon/NeonSite.tsx",
      "components/sites/neon/Scene.tsx",
      "components/sites/neon/Car.tsx",
      "components/sites/neon/Garage.tsx",
    ],
  },
  {
    slug: "bounce",
    name: "Bounce Candy Co.",
    tagline: "Grab it, throw it, watch it bounce",
    description:
      "A playful candy brand with a real physics engine. Giant candy-cane letters pop in, an avalanche of sweets piles onto them, and you can grab, fling and shake every one.",
    colors: ["#fb7185", "#facc15"],
    tags: ["Rapier physics", "Drag & throw", "Pastel"],
    files: [
      "components/sites/bounce/BounceSite.tsx",
      "components/sites/bounce/Scene.tsx",
      "components/sites/bounce/Letters.tsx",
      "components/sites/bounce/candies.ts",
    ],
  },
  {
    slug: "isle",
    name: "Isle Retreats",
    tagline: "A floating island above a sea of clouds, from golden hour to lantern night",
    description:
      "A boutique resort site that dives through the clouds onto a living low-poly island: swaying trees, koi, a waterfall, a drifting balloon, and guided hotspot tours. Flip to night for moonlight, fireflies and rising lanterns.",
    colors: ["#f59e0b", "#8b5cf6"],
    tags: ["Cloud-dive intro", "Hotspot tour", "Day / night"],
    files: [
      "components/sites/isle/IsleSite.tsx",
      "components/sites/isle/Scene.tsx",
      "components/sites/isle/Island.tsx",
      "components/sites/isle/Sky.tsx",
      "components/sites/isle/Life.tsx",
      "components/sites/isle/shared.ts",
    ],
  },
];

export function getSite(slug: string) {
  return sites.find((s) => s.slug === slug);
}
