import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "About — Ethan G.R. Lee",
  description:
    "Product designer crafting quiet, considered digital experiences.",
};

export default function AboutPage() {
  return <AboutContent />;
}
