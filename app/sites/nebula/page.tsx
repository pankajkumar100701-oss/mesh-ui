import type { Metadata } from "next";
import { Syne } from "next/font/google";
import NebulaSite from "@/components/sites/nebula/NebulaSite";
import SiteChrome from "@/components/SiteChrome";

const syne = Syne({
  variable: "--font-nebula",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Nebula Expeditions",
  description:
    "Space-tourism landing page with a shader galaxy and a scroll-driven camera flight.",
};

export default function Page() {
  return (
    <>
      <NebulaSite fontClassName={syne.variable} />
      <SiteChrome slug="nebula" />
    </>
  );
}
