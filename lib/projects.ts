export type ProjectCategory =
  | "seasonal"
  | "specialty"
  | "single-origin"
  | "sides";

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
   * Footer index is menu order (01–08, top to bottom).
   */
  cardKind?: CardKind;
  /** Smaller notes so a long tasting line stays on one row */
  notesCompact?: boolean;
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

/** Menu section order + labels — matches the Figma sheet */
export const MENU_CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: "seasonal", label: "Seasonal" },
  { id: "specialty", label: "Specialty" },
  { id: "single-origin", label: "Single Origin" },
  { id: "sides", label: "Sides" },
];

/**
 * Menu data from the Figma redesign.
 * Images live in public/images/projects/ — swap placeholders as needed.
 */
export const projects: Project[] = [
  {
    slug: "unbounded-build4good",
    title: "Unbounded + Build4Good",
    cardTitle: "Unbounded",
    cardTitleCompact: true,
    dateRange: "5.26 - Cur",
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
    heroAspectRatio: "2066 / 1316",
    images: [
      "/images/projects/unbounded/hero-2x.png",
    ],
  },
  {
    slug: "resell",
    title: "Resell",
    dateRange: "10.25 - Cur",
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
    cover: "/images/projects/resell/hero-clean.png",
    images: [
      "/images/projects/resell/hero-clean.png",
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
    cover: "/images/projects/timing/hero-2x.png",
    heroAspectRatio: "2072 / 1172",
    images: [
      "/images/projects/timing/hero-2x.png",
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
    cover: "/images/projects/hack4impact/hero-2x.png",
    heroAspectRatio: "2066 / 1266",
    images: [
      "/images/projects/hack4impact/hero-2x.png",
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
    cover: "/images/projects/studio/hero-clean.png",
    images: [
      "/images/projects/studio/hero-clean.png",
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
    cover: "/images/projects/scope/hero-clean.png",
    images: [
      "/images/projects/scope/hero-clean.png",
      "/images/projects/scope/cover.jpg",
    ],
  },
  {
    slug: "dpd-ta",
    title: "DPD Instructor",
    cardTitle: "DPD Instructor",
    cardTitleCompact: true,
    dateRange: "1.26 - Cur",
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
    cover: "/images/projects/dpd/hero-clean.png",
    heroAspectRatio: "941 / 1048",
    images: [
      "/images/projects/dpd/hero-clean.png",
    ],
  },
  {
    slug: "cuxd-eboard",
    title: "CUxD Eboard",
    cardTitleCompact: true,
    dateRange: "8.25 - Cur",
    category: "sides",
    year: "2025",
    role: "External Operations Lead",
    client: "CUxD",
    notes: "Community-Wide, Nationwide, High-Scale",
    notesCompact: true,
    cardKind: "leadership",
    profile: "",
    story:
      "As External Operations Lead for CUxD, I planned events for Cornell's entire design community: 10+ workshops, panels, and socials, plus our nationwide annual design-a-thon. Coordinating this meant reaching out to 30+ judges and speakers and drawing participation from 50+ universities and design organizations.",
    summary:
      "A placeholder case study. Replace with a short, quiet summary of the problem, your role, and the outcome — two or three sentences at most.",
    cover: "/images/projects/cuxd/hero-clean.png",
    heroAspectRatio: "1048 / 1025",
    heroScale: 1.16,
    images: [
      "/images/projects/cuxd/hero-clean.png",
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
  return MENU_CATEGORIES.map(({ id, label }) => ({
    id,
    label,
    projects: projects.filter((p) => p.category === id),
  })).filter((section) => section.projects.length > 0);
}
