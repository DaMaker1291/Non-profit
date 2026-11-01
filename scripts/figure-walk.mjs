// Capture every pilot figure at desktop and phone widths, and measure the
// geometry a screenshot can otherwise only suggest: text overlap, clipping,
// aspect-ratio distortion, sideways scroll. Evidence only — this is not an
// educator review.
import fs from "node:fs";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const IDS = [
  "fractions", "negatives", "algebra-expand", "linear-equations",
  "quadratics", "coordinates", "photosynthesis", "electricity-circuits",
];
const BASE = "http://127.0.0.1:4173";
const TITLES = {
  fractions: "Fractions",
  negatives: "Negative numbers",
  "algebra-expand": "Expanding & factorising",
  "linear-equations": "Linear equations",
  quadratics: "Quadratic equations",
  coordinates: "Coordinates & graphs",
  photosynthesis: "Photosynthesis",
  "electricity-circuits": "Circuits",
};
const OUT = "pilot-readiness/evidence";
fs.mkdirSync(OUT, { recursive: true });

const chrome = await launchChrome({ width: 1280, height: 900, port: 9377 });
const page = pageFor(chrome.send);
const results = [];

async function measure(width, height) {
  await chrome.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false,
  });
  for (const id of IDS) {
    // DEV-SERVER NAVIGATION: do not wait for `readyState === "complete"` here.
    // Next's development runtime keeps a hot-reload connection open, and the
    // document can be fully painted while that keeps `complete` from settling.
    // Wait for the rendered page, which is what the capture needs.
    await chrome.send("Page.navigate", { url: `${BASE}/pilot/${id}` });
    // The PATH plus the TITLE, not merely "an h1 exists": a navigate can leave
    // the previous page's DOM readable for a frame, which silently captured the
    // pie under the negatives URL in the first run.
    await page.waitFor(
      `return location.pathname === "/pilot/${id}" && document.querySelector("main h1")?.textContent?.trim() === ${JSON.stringify(TITLES[id])};`,
      `${id} page`,
      30000,
    );
    let data = null;
    for (let attempt = 0; attempt < 20 && !data; attempt++) {
      await page.waitFor(`return !!document.querySelector("[data-figure]");`, `${id} figure`);
      await sleep(400);
      data = await page.evaluate(`
      const f = document.querySelector("[data-figure]");
      if (!f) return null;
      const svg = f.querySelector("svg");
      if (!svg) return null;
      f.scrollIntoView({ block: "center", behavior: "instant" });
      const fr = f.getBoundingClientRect();
      const sr = svg?.getBoundingClientRect();
      const labels = [...(f?.querySelectorAll("text") || [])].map((t) => {
        const r = t.getBoundingClientRect();
        return { text: (t.textContent || "").trim(), x: r.x, y: r.y, w: r.width, h: r.height, fs: getComputedStyle(t).fontSize };
      });
      const pairs = [];
      for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i], b = labels[j];
        const over = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        if (over) pairs.push([a.text, b.text]);
      }
      return {
        id: ${JSON.stringify(id)},
        kind: f?.getAttribute("data-figure"),
        innerWidth, innerHeight,
        overflow: document.documentElement.scrollWidth - innerWidth,
        figure: fr ? { x: fr.x, y: fr.y, w: fr.width, h: fr.height } : null,
        capture: fr ? { x: fr.x + scrollX, y: fr.y + scrollY, w: fr.width, h: fr.height } : null,
        svg: sr ? { w: sr.width, h: sr.height, viewBox: svg.getAttribute("viewBox") } : null,
        labels, overlap: pairs,
        caption: f?.querySelector("figcaption")?.innerText ?? null,
        svgAspect: sr ? sr.width / sr.height : null,
        viewBoxAspect: svg ? (() => { const b = svg.getAttribute("viewBox").split(/\\s+/).map(Number); return b[2] / b[3]; })() : null,
      };
    `);
      if (!data) await sleep(250);
    }
    if (!data) throw new Error(`${id}: figure did not stay in the document`);
    const abs = data.capture;
    if (!abs) throw new Error(`${id}: figure could not be located for capture`);
    const shot = await chrome.send("Page.captureScreenshot", {
      format: "png", captureBeyondViewport: true,
      clip: { x: abs.x, y: abs.y, width: abs.w, height: abs.h, scale: 1 },
    });
    const file = path.join(OUT, `figure-${id}-${width}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    results.push({ ...data, file });
    console.log(`${id} ${width}: figure ${Math.round(abs.w)}x${Math.round(abs.h)}, overflow ${data.overflow}, labels ${data.labels.length}, overlap ${data.overlap.length}, file ${file}`);
  }
}

await measure(1280, 900);
await measure(320, 640);
await chrome.close();
fs.writeFileSync(path.join(OUT, "figure-walk.json"), JSON.stringify(results, null, 2));
console.log(`Wrote ${results.length} captures and ${path.join(OUT, "figure-walk.json")}`);
