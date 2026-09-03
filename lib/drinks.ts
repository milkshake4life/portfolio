export type CardFocus = {
  x: string;
  y: string;
  zoom: number;
};

export type Drink = {
  id: string;
  name: string;
  category: "coffee" | "tea";
  /** Short caption shown under the card in the strip */
  notes: string;
  image: string;
  /** Le Labo–style label: subtitle + preparation line */
  origin: string;
  method: string;
  /** Personal journal entry — a few sensory lines */
  entry: string;
  /** Labeled rows, apothecary-ticket style */
  place: string;
  date: string;
  occasion: string;
  /**
   * Tight crop for the strip card (and lightbox thumbs).
   * The lightbox itself always shows the full frame.
   */
  cardFocus?: CardFocus;
};

/** Unitless custom properties so GSAP can tween the crop open/closed. */
export function cardFocusVars(
  focus?: CardFocus
): Record<`--${string}`, string> | undefined {
  if (!focus) return undefined;
  const x = parseFloat(focus.x);
  const y = parseFloat(focus.y);
  return {
    "--card-x": String(Number.isFinite(x) ? x : 50),
    "--card-y": String(Number.isFinite(y) ? y : 50),
    "--card-zoom": String(focus.zoom),
  };
}

export function cardFocusNumbers(focus?: CardFocus) {
  if (!focus) return null;
  const x = parseFloat(focus.x);
  const y = parseFloat(focus.y);
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
    zoom: focus.zoom,
  };
}

/**
 * "The Menu" — drink photography data.
 * All cards render as the same portrait rectangle; photos are
 * cropped to fit, so any aspect works. These photos are the only
 * place color lives on the site.
 *
 * Each drink carries a short journal entry, written like an
 * apothecary label (see the Le Labo reference) and surfaced in
 * the lightbox.
 */
export const drinks: Drink[] = [
  {
    id: "drink-01",
    name: "Iced Long Black",
    category: "coffee",
    notes: "Cold brew over ice, late sun",
    image: "/images/drinks/drink-01.jpg",
    origin: "Single origin · Ethiopia, Harrar",
    method: "Long black · over ice · no sugar",
    entry:
      "Two shots pulled long and poured over a full glass of ice. Drank it on the balcony before the sun cleared the rooftops — bitter, bright, and gone far too fast.",
    place: "Home, late sun",
    date: "2026.01",
    occasion: "The first quiet hour",
  },
  {
    id: "drink-03",
    name: "Pair on a Tray",
    category: "coffee",
    notes: "Iced matcha and shaken espresso, side by side",
    image: "/images/drinks/drink-03.jpg",
    origin: "Matcha & espresso · side by side",
    method: "Iced · shaken · unsweetened",
    entry:
      "Couldn't decide, so I made both. Iced matcha and a shaken espresso lined up on the same tray, sweating in the afternoon light. Drank the espresso first.",
    place: "Kitchen counter, north light",
    date: "2026.02",
    occasion: "An indecisive afternoon",
  },
  {
    id: "drink-06",
    name: "Two Flat Whites",
    category: "coffee",
    notes: "Flat white — rosetta, for two",
    image: "/images/drinks/drink-06.jpg",
    origin: "Flat white · a rosetta, for two",
    method: "Double ristretto · steamed milk",
    entry:
      "Pulled two and poured a rosetta into each — one for me, one for whoever was awake. The foam held just long enough to admire before the first sip ruined it.",
    place: "Home, slow start",
    date: "2026.04",
    occasion: "A shared morning",
  },
  {
    id: "drink-09",
    name: "Two Einspanners",
    category: "tea",
    notes: "Matcha and strawberry, da-mo",
    image: "/images/drinks/drink-09.jpg",
    origin: "Matcha & strawberry einspanner · da-mo",
    method: "Iced · cream foam",
    entry:
      "The first specialty cafe I ever walked into — still second-favorite of all time. I always go back for the strawberry einspanner: their take on strawberry milk, floral without tipping sweet, dead-on instead of flat.",
    place: "da-mo",
    date: "2026.09",
    occasion: "The first one",
    cardFocus: {
      x: "56%",
      y: "72%",
      zoom: 1.35,
    },
  },
];
