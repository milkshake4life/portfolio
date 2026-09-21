import type { Metadata } from "next";
import CoffeeGallery from "@/components/gallery/CoffeeGallery";

export const metadata: Metadata = {
  title: "Coffee — Ethan G.R. Lee",
  description:
    "A journal of custom-curated coffee and tea, photographed before they disappeared.",
};

export default function CoffeePage() {
  return <CoffeeGallery />;
}
