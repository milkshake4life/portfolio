/**
 * Generates grayscale placeholder JPEGs for every image path referenced
 * in lib/projects.ts and lib/drinks.ts. Re-run any time with:
 *   node scripts/generate-placeholders.mjs
 * Swap the generated files for real photography when ready.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(process.cwd(), "public/images");

function svg(width, height, from, to, label) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
    font-family="Menlo, monospace" font-size="${Math.round(width / 60)}"
    letter-spacing="4" fill="rgba(255,255,255,0.28)">${label.toUpperCase()}</text>
</svg>`);
}

// A handful of gray pairings so adjacent placeholders read differently.
const TONES = [
  ["#2e2e2e", "#161616"],
  ["#3a3a3a", "#1d1d1d"],
  ["#262626", "#101010"],
  ["#444444", "#222222"],
  ["#323232", "#0e0e0e"],
];

const jobs = [];

function add(relPath, width, height, toneIndex, label) {
  jobs.push({ relPath, width, height, tone: TONES[toneIndex % TONES.length], label });
}

const projectSlugs = ["project-one", "project-two", "project-three", "project-four"];
projectSlugs.forEach((slug, i) => {
  add(`projects/${slug}/cover.jpg`, 2400, 1500, i, `${slug} cover`);
  for (let n = 1; n <= 3; n++) {
    add(`projects/${slug}/0${n}.jpg`, 2400, 1500, i + n, `${slug} 0${n}`);
  }
});

// Note: public/images/drinks/ now holds real photography — intentionally
// not generated here so re-running never overwrites it.

add("about/portrait.jpg", 1600, 2000, 3, "portrait");

const results = await Promise.all(
  jobs.map(async ({ relPath, width, height, tone, label }) => {
    const file = path.join(OUT, relPath);
    await mkdir(path.dirname(file), { recursive: true });
    await sharp(svg(width, height, tone[0], tone[1], label))
      .jpeg({ quality: 70 })
      .toFile(file);
    return relPath;
  })
);

console.log(`Generated ${results.length} placeholder images in public/images/`);
