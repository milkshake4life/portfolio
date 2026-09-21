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
  /** Neighbours and the current tray recede before the serving splits */
  fadeDuration: 0.48,
  fadeEase: "power2.in",
  fadeY: 36,
  /** Stillness after the trays have gone, before the product and card move */
  splitHold: 0.45,
  /** Product to the left, profile card to the right */
  splitDuration: 1.05,
  splitEase: "expo.out",
} as const;

/** Lightbox slide between drinks — slow, eased both ends, unhurried glide */
export const SLIDE = {
  duration: 1.15,
  ease: "power2.inOut",
} as const;

/** Route changes (Work ↔ About ↔ Coffee) — quick cover, smooth reveal */
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

/**
 * Work / Coffee strip. The strip always comes to rest with one card on the
 * centre line, so a wheel, a flick, or an arrow press ends on a project
 * rather than between two, and the centred card is the one brought forward.
 */
export const STRIP = {
  /** Quiet time after the last scroll change before the strip settles */
  settleDelay: 90,
  /** Settle onto the nearest card — brief for a nudge, longer for a throw */
  snapMin: 0.42,
  snapMax: 0.95,
  /** Eased at both ends: a settle begins from a strip already at rest, so a
      fast-start curve would read as a second, separate shove */
  snapEase: "power2.inOut",
  /** Pointer speed on release is carried this far forward before settling */
  flingMs: 170,
  /** Released mid-throw, so this one does start fast and run out long */
  flingEase: "expo.out",
  /** How much the centred work tray grows */
  focusScale: 0.42,
  /** Coffee photographs keep the original, smaller spotlight */
  photoFocusScale: 0.28,
  /** Neighbours recede a little so the centred card reads as the one in front */
  focusRest: 0.03,
  focusFade: 0.46,
  /** The fade reaches its floor further out than the growth does */
  focusFadeSpread: 1.6,
} as const;

/**
 * Work strip load-in. The centred product is the origin; neighbours to the
 * right rise from below in a short ripple so the shelf fills in sequence.
 */
export const RIPPLE = {
  duration: 0.72,
  ease: "expo.out",
  stagger: 0.1,
  rise: 36,
  delay: 0.06,
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
