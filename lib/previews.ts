import type { StaticImageData } from "next/image";
import nebula from "@/assets/previews/nebula.webp";
import prism from "@/assets/previews/prism.webp";
import neon from "@/assets/previews/neon.webp";
import bounce from "@/assets/previews/bounce.webp";
import isle from "@/assets/previews/isle.webp";

/**
 * Still screenshots of each site for the MeshUI gallery. Static imports give next/image the size and a
 * blur placeholder, so cards stay light: no WebGL runs until someone opens a demo.
 */
export const previews: Record<string, StaticImageData> = { nebula, prism, neon, bounce, isle };
