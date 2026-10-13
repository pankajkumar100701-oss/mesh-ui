# MeshUI

A collection of complete 3D websites built with Next.js, Three.js and React Three Fiber. Each one has a live demo and a code page you can copy from.

| Site | Route | Highlights |
| --- | --- | --- |
| Nebula Expeditions | `/sites/nebula` | Shader galaxy, scroll-driven camera, bloom |
| Prism Atelier | `/sites/prism` | Transmission glass, live configurator |
| Neon Drive | `/sites/neon` | Infinite synthwave terrain, steer and boost |
| Bounce Candy Co. | `/sites/bounce` | Rapier physics, drag and throw |
| Isle Retreats | `/sites/isle` | Low-poly island, hotspots, day/night |

Source for each site is shown at `/code/<slug>`.

## Develop

```bash
npm install
npm run dev
```

## Add a site

1. Build it in `components/sites/<slug>/` with a `"use client"` entry component.
2. Add `app/sites/<slug>/page.tsx` that renders it plus `<SiteChrome slug="<slug>" />`.
3. Register it in `lib/sites.ts` (the `files` list drives the code page).

Everything is procedural (no models, textures or HDRs), so the sites work offline.
