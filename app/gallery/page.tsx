import type { Metadata } from "next";
import MenuGallery from "@/components/gallery/MenuGallery";

export const metadata: Metadata = {
  title: "Gallery — Ethan G.R. Lee",
  description:
    "A gallery of custom-curated coffee and tea, photographed before they disappeared.",
};

export default function GalleryPage() {
  return <MenuGallery />;
}
