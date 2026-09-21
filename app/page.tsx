import type { Metadata } from "next";
import MenuGallery from "@/components/gallery/MenuGallery";
import { WORK_ENTRIES } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Work — Ethan G.R. Lee",
  description:
    "Product work by Ethan G.R. Lee — internships, team projects, and case studies.",
};

export default function WorksPage() {
  return (
    <MenuGallery entries={WORK_ENTRIES} thumbsLabel="All projects" />
  );
}
