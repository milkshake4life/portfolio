import {
  cardFocusNumbers,
  cardFocusVars,
  drinks,
  type CardFocus,
} from "@/lib/drinks";
import {
  getCardMeta,
  projectsByCategory,
  type Project,
  type ProjectScreen,
} from "@/lib/projects";

export type { CardFocus, ProjectScreen };
export { cardFocusNumbers, cardFocusVars };

export type GalleryMeta = {
  label: string;
  value: string;
};

export type GalleryEntry = {
  id: string;
  name: string;
  /** Photograph for drinks; the lead screenshot for projects (thumbs use it) */
  image: string;
  /**
   * Projects only. Screenshots shown flat on a tray shape instead of the
   * photograph being filled edge to edge — see components/gallery/TrayStage.tsx.
   */
  screens?: ProjectScreen[];
  captionKind: string;
  captionNotes: string;
  cardFocus?: CardFocus;
  unoptimized: boolean;
  /** Work entries carry the project so the paper card can stand on the tray. */
  project?: Project;
  journal: {
    category: string;
    sublines: string[];
    entry: string;
    meta: GalleryMeta[];
  };
};

function fromDrink(
  drink: (typeof drinks)[number]
): GalleryEntry {
  return {
    id: drink.id,
    name: drink.name,
    image: drink.image,
    captionKind: drink.category,
    captionNotes: drink.notes,
    cardFocus: drink.cardFocus,
    unoptimized: drink.image.endsWith(".png"),
    journal: {
      category: drink.category,
      sublines: [drink.origin, drink.method],
      entry: drink.entry,
      meta: [
        { label: "Brewed", value: drink.place },
        { label: "On", value: drink.date },
        { label: "For", value: drink.occasion },
      ],
    },
  };
}

function fromProject(project: Project): GalleryEntry {
  const { eyebrow } = getCardMeta(project);
  const sublines = [project.notes, project.recognition].filter(
    (line): line is string => Boolean(line)
  );

  return {
    id: project.slug,
    name: project.cardTitle ?? project.title,
    // Screenshots stay whole, so there is no card crop — the frame is only
    // ever the black background the tray composition sits on.
    image: project.screens[0].src,
    screens: project.screens,
    captionKind: eyebrow,
    captionNotes: project.notes ?? project.role,
    unoptimized: false,
    project,
    journal: {
      category: eyebrow,
      sublines,
      entry: project.story ?? project.summary,
      meta: [
        { label: "Role", value: project.role },
        { label: "With", value: project.client },
        { label: "When", value: project.dateRange },
      ],
    },
  };
}

export const DRINK_ENTRIES: GalleryEntry[] = drinks.map(fromDrink);

/** Menu-sheet projects only — DPD stays on About. */
export const WORK_ENTRIES: GalleryEntry[] = projectsByCategory().flatMap(
  (section) => section.projects.map(fromProject)
);
