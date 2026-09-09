export const ABOUT_BIO =
  "Ethan G.R. Lee is a product designer crafting quiet, considered digital experiences. He specializes in systems thinking and interaction design, building products that feel satisfying to use, and the systems that let them grow without losing their shape.";

export const ABOUT_DESIGN =
  "That focus lives in the space between static screens: the transitions, the easing, the small moments of feedback that make an interface feel alive rather than assembled. Each interaction is its own design problem, built to stay consistent and hold its shape as a product grows, not a one-off flourish.";

export const SOCIAL_LINKS = [
  { label: "Email", href: "mailto:egl54@cornell.edu" },
  {
    label: "Resume",
    href: "https://drive.google.com/file/d/1BAYy1Ow5kHtrWHgdqD8c3AFtrXNznKix/view?usp=drive_link",
  },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ethangrlee/" },
] as const;

export const ABOUT_PORTRAIT = "/images/about/portrait.jpg";

export const SIDE_WORK = [
  {
    title: "DPD Instructor",
    role: "Teaching Assistant + Instructor",
    dates: "1.26 – Curr.",
    image: "/images/projects/dpd/hero-clean.png",
    imageAspect: "941 / 1048",
    imageAlt:
      "Ethan presenting Intro to Digital Product Design in a studio classroom",
    body: "Intro to Digital Product Design is a semester-long course through Cornell AppDev: thirty students, Figma, product thinking, and case studies they can actually carry. Ethan helped modernize the curriculum — bringing AI into the prototyping workflow, and turning critique into smaller, family-style pods so people get to know their TAs and each other.",
  },
  {
    title: "CUxD Eboard",
    role: "External Operations Lead",
    dates: "8.25 – Curr.",
    image: "/images/projects/cuxd/hero-clean.png",
    imageAspect: "1048 / 1025",
    imageAlt: "Poster for the CUxD Design-a-thon",
    body: "As External Operations Lead for CUxD, he plans events for Cornell's design community: workshops, panels, socials, and a nationwide design-a-thon. Coordinating that means reaching thirty-plus judges and speakers, and drawing students from fifty-plus schools.",
  },
] as const;

export const CAFE_DREAM =
  "The long plan is a cafe. Not a concept shop — a small room you could spend a morning in. A short menu, good light, and the same quiet attention he tries to put into products. Until the keys are in the door, the Journal is where that dream lives: recipes, pours, and the cafes he keeps going back to.";

export const CONTACT_LINE = "For work, coffee, or both.";

export const CAFE_TITLE = "Cafe dreams";

export const ABOUT_KICKERS = {
  intro: "About",
  contact: "Contact",
} as const;
