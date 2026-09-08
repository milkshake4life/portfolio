/**
 * Shared motion vocabulary. Every GSAP animation on the site pulls
 * from these so all future interactions feel like one hand made them.
 * Mirrors the CSS custom properties in app/styles/tokens.css.
 */
export const EASE = {
  out: "expo.out",
  inOut: "power3.inOut",
  wipe: "expo.inOut",
} as const;

export const DUR = {
  fast: 0.3,
  base: 0.6,
  slow: 1.1,
} as const;

/**
 * Lightbox box morph (grow from clicked frame / shrink back).
 * Open: quick launch + long expo settle so the image glides into place.
 * Close: symmetric ease so dismissing feels deliberate, a touch snappier.
 */
export const MORPH = {
  openDuration: 1.25,
  openEase: "expo.out",
  closeDuration: 0.9,
  closeEase: "power3.inOut",
} as const;

/** Lightbox slide between drinks — slow, eased both ends, unhurried glide */
export const SLIDE = {
  duration: 1.15,
  ease: "power2.inOut",
} as const;

/** Route changes (Menu ↔ About ↔ Journal) — quick cover, smooth reveal */
export const NAV = {
  coverDuration: 0.22,
  revealDuration: 0.4,
  coverEase: "power2.in",
  revealEase: "expo.out",
} as const;

/** Index counter roll — short enough to track the scrub without floating */
export const COUNTER = {
  duration: 0.35,
  ease: "expo.out",
} as const;

/** Lightbox journal — lines compose top to bottom, slow and unhurried */
export const JOURNAL = {
  duration: 1.15,
  ease: "expo.out",
  stagger: 0.14,
  rise: 22,
  blur: 4,
} as const;

/**
 * Apple-style welcome preloader — three phrases, then the site.
 * Kept short so the product is reachable in a few seconds.
 */
export const WELCOME = {
  fadeIn: 0.68,
  hold: 0.82,
  fadeOut: 0.55,
  gap: 0.16,
  exit: 0.5,
  ease: "power2.inOut",
} as const;
