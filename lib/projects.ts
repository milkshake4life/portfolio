import type { CardFocus } from "@/lib/drinks";

export type ProjectCategory =
  | "seasonal"
  | "specialty"
  | "single-origin"
  | "sides";

/**
 * A screenshot exactly as it was exported — shown flat, never tilted or
 * cropped. Intrinsic pixels come along so the strip can hold the aspect ratio.
 */
export type ProjectScreen = {
  src: string;
  width: number;
  height: number;
  /**
   * Trim against the other screenshots on the shelf, where 1 is the default
   * fit. Exports frame their device differently — a single phone sits tall
   * inside its canvas, Timing is a flat board rather than a device — so
   * this is what makes every project read at one scale, tray to tray.
   */
  trayFit?: number;
};

export type DeviceKind = "laptop" | "phone" | "board";

/** Screen well as a percentage of the device PNG. */
export type PrototypeScreen = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ProjectPrototype = {
  /** Screen recording only — no device chrome. */
  src: string;
  /** Override when the PNG is not a standard laptop / phone / board. */
  screen?: PrototypeScreen;
};

/**
 * Inner LCD of the shared Apple mockups. Laptop measured on Unbounded;
 * phone measured on the flat iPhone 15 stills.
 */
export const DEVICE_SCREEN_PRESETS: Record<DeviceKind, PrototypeScreen> = {
  laptop: { x: 10.16, y: 5.78, w: 79.72, h: 82.14 },
  phone: { x: 6.2, y: 2.4, w: 87.6, h: 95.4 },
  board: { x: 0, y: 0, w: 100, h: 100 },
};

const DEVICE_WELL_RADIUS: Record<DeviceKind, string> = {
  laptop: "1.35%",
  phone: "12.5%",
  board: "0.35%",
};

export function getPrototypeWell(project: Pick<Project, "device" | "prototype">) {
  if (!project.prototype?.src) return null;
  const device = project.device ?? "laptop";
  return {
    screen: project.prototype.screen ?? DEVICE_SCREEN_PRESETS[device],
    radius: DEVICE_WELL_RADIUS[device],
  };
}

export type Project = {
  slug: string;
  title: string;
  /** Right-column “price” on the menu — date range */
  dateRange: string;
  category: ProjectCategory;
  year: string;
  role: string;
  client: string;
  summary: string;
  /** Hero / drink image on the works serving + case study cover */
  cover: string;
  /**
   * What the Work strip shows: the screenshot(s), flat, resting on one shared
   * tray shape drawn in CSS (see components/gallery/TrayStage.tsx).
   */
  screens: ProjectScreen[];
  /** Device chrome in the tray still — drives the lightbox video well. */
  device?: DeviceKind;
  /**
   * Looping screen recording punched into the device after the lightbox
   * split. Omit until the file exists; the still stays up.
   */
  prototype?: ProjectPrototype;
  /** Optional hero width/height ratio (e.g. "1024 / 767") — defaults to Scope phones */
  heroAspectRatio?: string;
  /** Scale the menu hero relative to the default phone slot (1 = default) */
  heroScale?: number;
  /** Case-study images, in order */
  images: string[];
  /** Small line under the name on the menu (optional) */
  menuNote?: string;
  /** Profile-card tasting note — short sensory / outcome line */
  notes?: string;
  /** Longer “The Story” blurb on the drink profile card */
  story?: string;
  /** Recognition line on the profile card (e.g. award) */
  recognition?: string;
  /** Profile type label — defaults to “Case Study” */
  profile?: string;
  /** Optional override for the footer index (otherwise counted within cardKind) */
  caseNumber?: string;
  /** Profile-card heading — defaults to title (menu can stay longer) */
  cardTitle?: string;
  /** Slightly smaller profile title so a long word does not fill the card */
  cardTitleCompact?: boolean;
  /**
   * Card series. Eyebrow and footer collection are derived from this.
   * Footer index is project order (01–n, top to bottom).
   */
  cardKind?: CardKind;
  /** Smaller notes so a long tasting line stays on one row */
  notesCompact?: boolean;
  /** Tight crop for the work strip card (and lightbox thumbs) */
  cardFocus?: CardFocus;
};

export type CardKind =
  | "internship"
  | "product-work"
  | "case-study"
  | "course"
  | "leadership";

const CARD_KIND_COPY: Record<
  CardKind,
  { eyebrow: string; collection: string }
> = {
  internship: { eyebrow: "Internship", collection: "Internships" },
  "product-work": { eyebrow: "Product Work", collection: "Product Work" },
  "case-study": { eyebrow: "Case Study", collection: "Case Studies" },
  course: { eyebrow: "Course", collection: "Courses" },
  leadership: { eyebrow: "Leadership", collection: "Leadership" },
};

/** Menu section order + labels. Sides stays in the data, off this sheet. */
export const MENU_CATEGORIES: {
  id: ProjectCategory;
  label: string;
  note: string;
}[] = [
  { id: "seasonal", label: "Seasonal", note: "Currently building" },
  { id: "specialty", label: "Specialty", note: "Team projects" },
  { id: "single-origin", label: "Single Origin", note: "Solo projects" },
];

/**
 * Menu data from the Figma redesign.
 * Images live in public/images/projects/ — swap placeholders as needed.
 */
export const projects: Project[] = [
  {
    slug: "unbounded-build4good",
    title: "Unbounded",
    cardTitle: "Unbounded",
    cardTitleCompact: true,
    dateRange: "5.26 - Curr.",
    category: "seasonal",
    year: "2026",
    role: "Product Design Engineer",
    client: "Unbounded",
    notes: "Solo, Operational, Nonprofit",
    profile: "Internship",
    cardKind: "internship",
    story:
      "A 12-week paid internship building an internal planning tool for a nonprofit coordinating school district events. I designed a facilitator dashboard that consolidated outreach and scheduling, tracking who was teaching what and reaching every known facilitator in one place. The tool is now used by the organization.",
    summary:
      "A placeholder case study. Replace with a short, quiet summary of the problem, your role, and the outcome — two or three sentences at most.",
    cover: "/images/projects/unbounded/hero-2x.png",
    device: "laptop",
    prototype: { src: "/videos/projects/unbounded/prototype.mp4" },
    screens: [
      { src: "/images/projects/unbounded/hero-2x.png", width: 2066, height: 1316 },
    ],
    heroAspectRatio: "2066 / 1316",
    images: [
      "/images/projects/unbounded/hero-2x.png",
    ],
  },
  {
    slug: "resell",
    title: "Resell",
    dateRange: "10.25 - Curr.",
    category: "seasonal",
    year: "2025",
    role: "Associate Pod Lead",
    client: "Resell",
    notes: "Peer-to-Peer, Community-Driven, Polished",
    profile: "Product Work",
    cardKind: "product-work",
    story:
      "Resell, built with Cornell AppDev, brings secondhand shopping to Cornell students in one dedicated marketplace. I reworked the core experience end-to-end — from event-specific spaces that surface listings for moments like Homecoming and Halloween, to the Lucid release, which introduced fluid animations and a glassy new visual layer across the app.",
    summary:
      "A placeholder case study. Replace with a short, quiet summary of the problem, your role, and the outcome — two or three sentences at most.",
    cover: "/images/projects/resell/hero-flat.png",
    device: "phone",
    screens: [
      {
        src: "/images/projects/resell/hero-flat.png",
        width: 507,
        height: 1012,
        trayFit: 0.86,
      },
    ],
    images: [
      "/images/projects/resell/hero-flat.png",
    ],
  },
  {
    slug: "timing",
    title: "Timing",
    dateRange: "1.26 - 4.26",
    category: "specialty",
    year: "2026",
    role: "Lead Systems Designer",
    client: "Timing",
    notes: "Systemized, Scalable, Foundational",
    profile: "Internship",
    cardKind: "internship",
    story:
      "A 12-week internship on a team of product designers, where I led the redesign of Timing's entire design system. I rebuilt it around reusable components, giving the team a systemized foundation that makes designing new features faster and more consistent going forward.",
    summary:
      "A placeholder case study. Replace with a short, quiet summary of the problem, your role, and the outcome — two or three sentences at most.",
    cover: "/images/projects/timing/hero.png",
    device: "board",
    screens: [
      // A flat board rather than a device — pulled in a little so it does not
      // out-weigh the laptops and phones it shares the shelf with. The export
      // already carries Figma's frame outline, so the board reads as a frame.
      {
        src: "/images/projects/timing/hero.png",
        width: 736,
        height: 445,
        trayFit: 0.98,
      },
    ],
    heroAspectRatio: "736 / 445",
    images: [
      "/images/projects/timing/hero.png",
    ],
  },
  {
    slug: "hack4impact-ima",
    title: "Hack4Impact + IMA",
    cardTitle: "Hack4Impact",
    cardTitleCompact: true,
    dateRange: "1.26 - 5.26",
    category: "specialty",
    year: "2026",
    role: "Product Designer",
    client: "Hack4Impact",
    notes: "Collaborative, National, Networked",
    profile: "Product Work",
    cardKind: "product-work",
    story:
      "IMA (Internal Members Archive) gives every Hack4Impact chapter nationwide a shared home for past projects and the members behind them, making it easy to look back and reach out. Working alongside three designers on my team and Hack4Impact's national design members, I helped design the product from the ground up.",
    summary:
      "A placeholder case study. Replace with a short, quiet summary of the problem, your role, and the outcome — two or three sentences at most.",
    cover: "/images/projects/hack4impact/hero-flat.png",
    device: "laptop",
    prototype: { src: "/videos/projects/hack4impact/prototype.mp4" },
    screens: [
      { src: "/images/projects/hack4impact/hero-flat.png", width: 1003, height: 619 },
    ],
    heroAspectRatio: "1003 / 619",
    images: [
      "/images/projects/hack4impact/hero-flat.png",
    ],
  },
  {
    slug: "studio",
    title: "Studio",
    dateRange: "2.26 - 5.26",
    category: "single-origin",
    year: "2026",
    role: "Product Designer",
    client: "Studio",
    notes: "Zero-to-One, Collaborative, Grassroots",
    recognition: "Best NME Project",
    profile: "Case Study",
    cardKind: "case-study",
    story:
      "Cornell students have few ways to explore outside their own major — packed schedules rule out extra classes, and clubs stay nearly impossible to join. Studio lets students teach each other, turning personal passions into peer-led classes and the connections that follow.",
    summary:
      "A placeholder case study. Replace with a short, quiet summary of the problem, your role, and the outcome — two or three sentences at most.",
    cover: "/images/projects/studio/hero-flat.png",
    device: "phone",
    screens: [
      {
        src: "/images/projects/studio/hero-flat.png",
        width: 476,
        height: 958,
        trayFit: 0.86,
      },
    ],
    images: [
      "/images/projects/studio/hero-flat.png",
    ],
  },
  {
    slug: "scope",
    title: "Scope",
    dateRange: "9.25 - 12.25",
    category: "single-origin",
    year: "2025",
    role: "Lead Designer",
    client: "Cornell University",
    notes: "Editorial, Adaptive, Restrained",
    recognition: "Best UI/UX Award",
    profile: "Case Study",
    cardKind: "case-study",
    story:
      "Cornell students were tuning out campus news entirely, buried in cluttered inboxes and scattered across broken apps. Scope consolidates it all into one feed, built to fit into the pockets of time students already have.",
    summary:
      "A news outlet product for Cornell students — redesigning how campus journalism is discovered, read, and saved.",
    cover: "/images/projects/scope/hero-flat.png",
    device: "phone",
    screens: [
      {
        src: "/images/projects/scope/hero-flat.png",
        width: 508,
        height: 1021,
        trayFit: 0.86,
      },
    ],
    images: [
      "/images/projects/scope/hero-flat.png",
      "/images/projects/scope/cover.jpg",
    ],
  },
  {
    slug: "dpd-ta",
    title: "DPD Instructor",
    cardTitle: "DPD Instructor",
    cardTitleCompact: true,
    dateRange: "1.26 - Curr.",
    category: "sides",
    year: "2026",
    role: "Teaching Assistant + Instructor",
    client: "DPD Instructor",
    notes: "AI-Integrated, Community-Focused, Modernized",
    notesCompact: true,
    cardKind: "course",
    profile: "",
    story:
      "Intro to Digital Product Design is a semester-long course run through Cornell AppDev, teaching 30 students Figma and product thinking, building toward professional-level case studies they can carry into internships and resumes. I helped modernize the curriculum for current design standards: introducing AI into the prototyping workflow, and restructuring critique groups into tighter, family-style pods so students build closer relationships with their TAs and peers.",
    summary:
      "A placeholder case study. Replace with a short, quiet summary of the problem, your role, and the outcome — two or three sentences at most.",
    cover: "/images/projects/dpd/IMG_1017.jpg",
    screens: [
      { src: "/images/projects/dpd/IMG_1017.jpg", width: 4096, height: 3478 },
    ],
    heroAspectRatio: "4096 / 3478",
    images: [
      "/images/projects/dpd/IMG_1017.jpg",
    ],
  },
];

export function getCardMeta(project: Project) {
  const kind = project.cardKind ?? "case-study";
  const { eyebrow, collection } = CARD_KIND_COPY[kind];
  const index = projects.findIndex((p) => p.slug === project.slug);
  const number =
    project.caseNumber ?? String(Math.max(index, 0) + 1).padStart(2, "0");
  return { kind, eyebrow, collection, number };
}

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(slug: string) {
  const index = projects.findIndex((p) => p.slug === slug);
  return projects[(index + 1) % projects.length];
}

/** Menu sections in Figma order, each with its projects. */
export function projectsByCategory() {
  return MENU_CATEGORIES.map(({ id, label, note }) => ({
    id,
    label,
    note,
    projects: projects.filter((p) => p.category === id),
  })).filter((section) => section.projects.length > 0);
}
