import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message}`));

await page.goto("http://localhost:3000/gallery", { waitUntil: "networkidle" });
await page.evaluate(() => sessionStorage.setItem("preloader-seen", "1"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const diagnostics = await page.evaluate(() => {
  const items = [...document.querySelectorAll("[data-item]")];
  const track = document.querySelector("[data-track]");
  return {
    itemCount: items.length,
    itemStates: items.slice(0, 3).map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        opacity: cs.opacity,
        rect: { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) },
      };
    }),
    trackRect: track
      ? { w: Math.round(track.getBoundingClientRect().width), transform: getComputedStyle(track).transform }
      : null,
    imgs: [...document.querySelectorAll("[data-item] img")].slice(0, 3).map((img) => ({
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      currentSrc: img.currentSrc.slice(0, 60),
    })),
  };
});

console.log(JSON.stringify(diagnostics, null, 2));
console.log("CONSOLE ERRORS:", errors.length ? errors : "none");

await page.screenshot({ path: "scripts/gallery-debug.png" });
await browser.close();
