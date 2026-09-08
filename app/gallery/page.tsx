import type { Metadata } from "next";
import MenuGallery from "@/components/gallery/MenuGallery";

export const metadata: Metadata = {
  title: "Journal — Ethan G.R. Lee",
  description:
    "A journal of custom-curated coffee and tea, photographed before they disappeared.",
};

export default function GalleryPage() {
  return <MenuGallery />;
}
