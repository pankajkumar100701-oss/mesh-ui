import type { Metadata } from "next";
import { Monoton, Orbitron } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import NeonSite from "@/components/sites/neon/NeonSite";

const monoton = Monoton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-neon-display",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-neon-heading",
});

export const metadata: Metadata = {
  title: "Neon Drive",
  description:
    "Synthwave racing-game launch page: endless neon terrain, a steerable car and hold-to-boost speed, built with React Three Fiber.",
};

export default function Page() {
  return (
    <div className={`${monoton.variable} ${orbitron.variable}`}>
      <NeonSite />
      <SiteChrome slug="neon" />
    </div>
  );
}
