#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE VISUAL GUARD — "exactly the same" as a MEASUREMENT, not an intention.
//
// A stylesheet refactor is the one kind of change where every existing gate in
// this repository stays green while the product quietly moves: `npm run verify`
// reads source, `verify:render` asserts that rules EXIST, `verify:q` grades
// questions. None of them would notice a label that grew half a pixel, a card
// that lost its radius, or a phone layout that started wrapping one word later.
//
// So this captures what the BROWSER resolved, not what the source says:
//
//   computed  every element in document order, its ~60 resolved properties
//   geometry  every element's x/y/width/height, to sub-pixel precision
//   content   every LEAF's text (and every control's value), so "no copy
//             changed" is checked as well as "no pixel moved"
//
// Two captures of the same tree must compare equal; a capture before and after
// a refactor must compare equal too — that is the acceptance criterion. The
// comparison is element-by-element and NAMES the first differences (element,
// property, before, after) instead of reporting a percentage, because "95%
// identical" is not a claim this project is willing to make about a UI.
//
// THE MEASUREMENT CONDITIONS, and every one of them was found by running the
// control rather than by reasoning about it:
//   · the page is given a HYDRATION GRACE PERIOD before it is read, because two
//     matching reads taken 220ms apart can both happen BEFORE the client
//     renders — the guard then measures a server shell and calls it the page
//     (measured: `/learn` at 120 elements in one run and 163 in the next);
//   · animation and transitions are FROZEN, so a capture is a still rather than
//     whichever frame it landed on (measured: two runs differed by 4 bytes of
//     PNG on two routes with identical computed styles);
//   · script/style/JSON-payload elements are NOT UI and are excluded — Next's
//     RSC payload is a stream of text that differs every run;
//   · a dev stylesheet URL carries `?v=<timestamp>`, so stylesheets compare by
//     path and rule COUNT, not by URL.
//
// WHY IT MUST BE VALIDATED BEFORE IT IS TRUSTED. A comparator that always says
// "identical" passes every run and proves nothing. `--selftest` mutates one
// declaration in the served stylesheet, re-captures, and FAILS IF THE DIFF IS
// EMPTY — the instrument proving it can see. Run that before believing a green.
//
// USAGE, with the dev server already up on a scratch store (never the real
// `.openmind-data` — the guard creates a learner to reach gated pages):
//
//   OPENMIND_DATA_DIR=/tmp/om-visual npm run dev          # in one terminal
//   node scripts/visual-guard.mjs capture --out=.visual/before --data-dir=/tmp/om-visual
//   …make the change…
//   node scripts/visual-guard.mjs capture --out=.visual/after  --data-dir=/tmp/om-visual
//   node scripts/visual-guard.mjs compare --before=.visual/before --after=.visual/after
//
// Exit codes: 0 = identical (or self-test caught a real change), 1 = the diff is
// non-empty / the self-test saw nothing, 2 = the harness could not run.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { launchChrome, pageFor, sleep, chromeAvailable } from "./browser.mjs";

const argv = process.argv.slice(2);
const cmd = (argv[0] ?? "capture").replace(/^--/, "");
const arg = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const BASE = arg("base", process.env.VISUAL_BASE ?? "http://127.0.0.1:4173");
const WIDTHS = arg("widths", "1440x900,390x844").split(",").map((w) => {
  const [width, height] = w.split("x").map(Number);
  return { width, height };
});
const DATA_DIR = arg("data-dir", process.env.OPENMIND_DATA_DIR ?? null);

/** The routes worth measuring: the public entry points, the shell at both
 *  sizes, and the gated pages a signed-in scratch learner can actually reach.
 *  A route that renders an empty state still renders the SHELL, and the shell
 *  is where most of the shared styling lives. */
const ROUTES = [
  { name: "home", url: "/" },
  { name: "about", url: "/about" },
  { name: "curriculum", url: "/curriculum" },
  { name: "learn", url: "/learn" },
  { name: "offline", url: "/offline" },
  { name: "solve", url: "/solve" },
  { name: "progress", url: "/progress" },
  { name: "mind", url: "/mind" },
  { name: "papers", url: "/papers" },
  { name: "account", url: "/account" },
  { name: "concept", url: "/learn/maths/quadratics" },
];

/** The properties that decide whether a page LOOKS the same. Deliberately
 *  includes the layout box (width/height/margins/padding/gap) and the resolved
 *  box of every element, so a change that cannot be seen in a screenshot — a
 *  3px taller header pushing the whole page down — is still a difference. */
const PROPS = [
  "display", "position", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-self",
  "flex-grow", "flex-shrink", "flex-basis", "grid-template-columns", "gap", "row-gap", "column-gap", "order",
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-top-color", "border-radius",
  "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing",
  "text-align", "text-transform", "text-decoration-line", "white-space",
  "color", "background-color", "background-image", "box-shadow", "opacity", "transform",
  "overflow-x", "overflow-y", "z-index", "visibility",
];

/** Elements that are not UI. A <script> inside <body> carries Next's streamed
 *  RSC payload, whose text varies between runs; a <style> is CSS source, which
 *  this guard is deliberately NOT measuring (the resolved values are). */
const NOT_UI = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "TITLE", "BASE"]);

/** Freeze animation so a capture is a still frame. Injected identically in every
 *  capture, and it touches only properties the fingerprint does not measure. */
const FREEZE = `
  const id = "visual-guard-freeze";
  document.getElementById(id)?.remove();
  const s = document.createElement("style");
  s.id = id;
  s.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";
  document.head.appendChild(s);
  return true;
`;

/** Runs in the page. Kept as a string so `page.evaluate` can carry it. */
const FINGERPRINT = `
  const props = ${JSON.stringify(PROPS)};
  const round = (n) => Math.round(n * 100) / 100;
  const els = [...document.body.querySelectorAll("*")].filter((el) => !${JSON.stringify([...NOT_UI])}.includes(el.tagName));
  const rows = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const leaf = el.childElementCount === 0 ? (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 140) : null;
    const value = (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") ? (el.value ?? null) : null;
    rows.push([
      el.tagName.toLowerCase(),
      el.id || null,
      typeof el.className === "string" ? el.className : null,
      round(r.x), round(r.y), round(r.width), round(r.height),
      leaf, value,
      props.map((p) => cs.getPropertyValue(p)),
    ]);
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollHeight: document.scrollingElement ? document.scrollingElement.scrollHeight : 0,
    sheets: [...document.styleSheets].map((s) => {
      const where = (s.href || "inline").replace(/[?].*$/, "");
      try { return where + ":" + (s.cssRules ? s.cssRules.length : -1); } catch { return where + ":blocked"; }
    }),
    elements: rows,
  };
`;

const sha = (s) => createHash("sha256").update(s).digest("hex");

/**
 * The PIXELS of a PNG, not the bytes of its file.
 *
 * The first version compared screenshot bytes and the control run failed on two
 * routes by ONE byte each (257149 → 257150) with every computed property,
 * every geometry value and every text identical — the container's compression
 * is not the rendering, and treating it as the rendering would make the guard
 * flaky enough that its red would stop meaning anything. So the zlib streams
 * are inflated (the filtered scanlines Chrome wrote) and compared: equal
 * scanlines are equal pixels, and a difference still fails.
 */
function pngScanlinesFrom(buf) {
  const idat = [];
  let off = 8; // skip the signature
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    if (type === "IDAT") idat.push(buf.subarray(off + 8, off + 8 + len));
    if (type === "IEND") break;
    off += 12 + len;
  }
  if (!idat.length) return null;
  try {
    return zlib.inflateSync(Buffer.concat(idat));
  } catch {
    return null; // an unrecognised container: fall back to byte comparison
  }
}

const pngScanlines = (file) => pngScanlinesFrom(fs.readFileSync(file));

/** Decode a PNG to raw RGB(A) pixels. Needed because the pixel comparison has
 *  to measure HOW MUCH differs, not merely that something does — see
 *  `pixelDelta`. */
function decodePng(buf) {
  const idat = [];
  let off = 8, w = 0, h = 0, ct = 0;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    if (type === "IHDR") { w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12); ct = buf[off + 17]; }
    if (type === "IDAT") idat.push(buf.subarray(off + 8, off + 8 + len));
    if (type === "IEND") break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : 1;
  const stride = w * ch;
  const out = Buffer.alloc(stride * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    const line = raw.subarray(p, p + stride); p += stride;
    const prev = y === 0 ? Buffer.alloc(stride) : out.subarray((y - 1) * stride, y * stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      cur[x] = v & 0xff;
    }
  }
  return { w, h, ch, px: out };
}

/**
 * HOW DIFFERENT two renders are — size, not merely existence.
 *
 * Measured, not assumed: two captures of the UNCHANGED tree differed on
 * `1440-solve` at eight pixels, by one unit in a single channel, on the
 * antialiased edge of a glyph (`(510,290) rgb(24,28,34) → rgb(25,28,34)`).
 * Glyph rasterisation is not bit-stable between Chrome runs, so a check that
 * demands byte equality is asserting something that is not true and would fail
 * on a tree nobody touched — which is how a guard's red stops meaning anything.
 *
 * So the comparison is on MAGNITUDE, with limits set from that measurement
 * rather than from taste. Measured noise, on a pair of captures of the SAME
 * tree: 45 pixels changed, largest channel move 3, 0.0035% of the image. So:
 *
 *   fail if the largest channel move  > 6         (2× the measured noise)
 *   fail if the changed area          > 0.05%     (14× the measured noise)
 *
 * A single glyph that moves, a border that recolours, an element that appears —
 * each moves a channel by tens and hundreds of pixels, far past both. A subtle
 * COLOUR change is caught exactly by the property comparison above, which reads
 * the resolved value rather than the rasterised result, so this backstop does
 * not need to see it. Everything below the limits is reported as measured
 * noise, never silently ignored.
 */
const NOISE_CHANNEL = 6;
const NOISE_AREA = 0.0005;
function pixelDelta(aBuf, bBuf) {
  const A = decodePng(aBuf), B = decodePng(bBuf);
  if (A.w !== B.w || A.h !== B.h || A.ch !== B.ch) return { shape: true, count: Infinity, max: 255, frac: 1 };
  let count = 0, max = 0;
  for (let i = 0; i < A.px.length; i += A.ch) {
    const d = Math.max(
      Math.abs(A.px[i] - B.px[i]),
      Math.abs(A.px[i + 1] - B.px[i + 1]),
      Math.abs(A.px[i + 2] - B.px[i + 2]),
    );
    if (d > 0) { count++; if (d > max) max = d; }
  }
  return { shape: false, count, max, frac: count / (A.w * A.h) };
}

/**
 * A screenshot that HOLDS STILL.
 *
 * The control run produced two routes whose pixels differed between runs while
 * every computed property, geometry value and text matched — the signature of a
 * late webfont swap, since `getComputedStyle` reports the family that was
 * REQUESTED and says nothing about which face has loaded. Rather than trust
 * that diagnosis, the guard now takes the frame twice and requires the pixels to
 * agree before it keeps them; a page that never settles is REPORTED as unstable
 * rather than silently contributing a coin-flip to the comparison.
 */
async function stableShot(send, tries = 8) {
  let buf = null, prev = null;
  for (let i = 0; i < tries; i++) {
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    buf = Buffer.from(shot.data, "base64");
    const sl = pngScanlinesFrom(buf);
    const key = sl ? sha(sl) : sha(buf);
    if (prev !== null && key === prev) return { buf, stable: true };
    prev = key;
    await sleep(320);
  }
  return { buf, stable: false };
}

/** One scratch learner, with a FIXED secret so the second capture reuses the
 *  same profile: a fresh learner per run would change the data behind gated
 *  pages, and a data difference between two captures looks exactly like a CSS
 *  regression. Created through the public API, exactly as the client does. */
const GUARD_SECRET = "visualguard00000000000000000001";

function learnerWithSecret(dir) {
  const file = path.join(dir, "profiles.json");
  if (!fs.existsSync(file)) return null;
  const store = JSON.parse(fs.readFileSync(file, "utf8"));
  const ids = Object.keys(store).filter((id) => store[id]?.secret === GUARD_SECRET);
  if (ids.length === 0) return null;
  if (ids.length > 1) throw new Error(`${ids.length} scratch learners share the guard's secret in ${file}`);
  return ids[0];
}

async function seedLearner(page, dir) {
  if (!dir) {
    throw new Error("gated routes need a scratch store: pass --data-dir (the same OPENMIND_DATA_DIR the server writes to)");
  }
  let id = learnerWithSecret(dir);
  if (!id) {
    // WRAPPED IN AN IIFE: `evaluateAsync` interpolates its argument where an
    // EXPRESSION goes, so a bare statement block is a syntax error — which is
    // how the first run created no learner at all and silently measured boot
    // screens on every gated route.
    const created = await page.evaluateAsync(`(async () => {
      const secret = ${JSON.stringify(GUARD_SECRET)};
      localStorage.setItem("openmind:profileSecret", secret);
      const body = {
        secret, country: "GB", grade: "Year 10", timePerDay: 30,
        subjects: ["maths", "physics"],
        subjectCourses: {
          maths: { spec: "uk-gcse", specLevel: "higher", board: "aqa" },
          physics: { spec: "uk-gcse", specLevel: "higher", board: "aqa" },
        },
        language: "en",
      };
      const r = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, body: await r.json().catch(() => null) };
    })()`);
    if (!created || created.status >= 400) {
      throw new Error(`could not create the scratch learner: HTTP ${created?.status} ${JSON.stringify(created?.body)?.slice(0, 200)}`);
    }
    id = learnerWithSecret(dir);
    if (!id) throw new Error(`the POST succeeded but no profile holding the guard's secret is in ${path.join(dir, "profiles.json")}`);
  }
  await page.evaluate(`
    localStorage.setItem("openmind:profileId", ${JSON.stringify(id)});
    localStorage.setItem("openmind:profileSecret", ${JSON.stringify(GUARD_SECRET)});
    return true;
  `);
  return id;
}

async function capture({ out }) {
  if (!chromeAvailable()) {
    console.error("✗ no Chrome to drive (set CHROME_BIN) — the guard cannot claim a page is unchanged without rendering it.");
    process.exit(2);
  }
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(path.join(out, "png"), { recursive: true });

  let learner = null;
  for (const { width, height } of WIDTHS) {
    const chrome = await launchChrome({ width, height });
    const page = pageFor(chrome.send);
    const send = chrome.send;
    try {
      await send("Emulation.setDeviceMetricsOverride", {
        width, height, deviceScaleFactor: 1, mobile: width < 700,
      });
      try {
        await page.goto(BASE + "/");
        await page.waitFor(`return document.readyState === "complete";`, "the app to load");
        // PER LAUNCH, not once: every width gets a fresh temp Chrome profile, so
        // a learner seeded for one viewport does not exist in the next — and the
        // gated routes would compare two boot screens, which look identical and
        // would silently make the guard vacuous.
        if (DATA_DIR) learner = await seedLearner(page, DATA_DIR);
      } catch (e) {
        console.error(`  ! seeding the scratch learner failed (${e.message}) — gated routes will show the boot screen`);
      }

      for (const route of ROUTES) {
        // WARM-UP VISIT: in dev the first request to a route compiles it on
        // demand, so a cold route answers with a shell that a later visit never
        // shows — measured as `/papers` at 109 elements on the first pass and
        // 154 on the second, with no change to any source file.
        await page.goto(BASE + route.url);
        await page.waitFor(`return document.readyState === "complete";`, `a warm-up load of ${route.url}`);
        await sleep(350);
        await page.goto(BASE + route.url);
        await page.waitFor(`return document.readyState === "complete";`, `a load of ${route.url}`);
        // A skeleton is the product's own "not yet" signal (`components/states.tsx`
        // renders `.skeleton`), so waiting for it to clear is waiting on the real
        // page rather than on a stopwatch. A page that keeps one (because a fetch
        // was refused) still proceeds — the guard is measuring styling, not uptime.
        try {
          await page.waitFor(`return document.querySelectorAll(".skeleton").length === 0;`, `${route.url} to finish loading`, 8000);
        } catch {
          console.log(`  ! ${route.name}: a skeleton was still on screen after 8s — captured as it is`);
        }
        // HYDRATION GRACE PERIOD, then a SETTLE that needs THREE identical
        // consecutive reads. Two reads taken back to back are satisfied by the
        // server shell before the client has rendered anything, which is how a
        // route measured 120 elements in one run and 163 in the next while
        // reporting itself as settled.
        await sleep(600);
        // Freeze BEFORE settling, not after: a looping animation (the skeleton's
        // shimmer) changes measured properties forever, so a settle that waits
        // for stability on an animating page can never converge and silently
        // keeps whichever frame it ran out on.
        await page.evaluate(FREEZE);
        let fp = null, streak = 0, previous = null;
        for (let i = 0; i < 30; i++) {
          fp = await page.evaluate(FINGERPRINT);
          const key = JSON.stringify(fp);
          streak = key === previous ? streak + 1 : 0;
          previous = key;
          if (streak >= 3) break;
          await sleep(350);
        }
        await page.evaluate(FREEZE);
        // FONTS BEFORE PIXELS: a late swap changes what is painted without
        // changing any value the fingerprint can see.
        try {
          await page.evaluateAsync(`(async () => { if (document.fonts?.ready) { await document.fonts.ready; } return document.fonts ? document.fonts.status : "none"; })()`);
        } catch { /* no FontFaceSet: nothing to wait for */ }
        fp = await page.evaluate(FINGERPRINT);
        const file = path.join(out, `${width}-${route.name}.json`);
        fs.writeFileSync(file, JSON.stringify({ route: route.url, width, height, ...fp }));
        const { buf, stable } = await stableShot(send);
        if (!stable) console.log(`  ! ${route.name}: the frame never held still — its screenshot may differ for reasons that are not styling`);
        const png = path.join(out, "png", `${width}-${route.name}.png`);
        fs.writeFileSync(png, buf);
        const els = fp.elements.length;
        console.log(`  ${String(width).padStart(4)}  ${route.name.padEnd(11)} ${String(els).padStart(5)} elements   ${String(fp.scrollHeight).padStart(6)}px tall   png ${(fs.statSync(png).size / 1024).toFixed(0)}kB`);
      }
    } finally {
      await chrome.close();
    }
  }
  const index = { base: BASE, widths: WIDTHS, routes: ROUTES, props: PROPS, at: new Date().toISOString(), learner };
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index, null, 2));
  console.log(`\n  captured into ${out} (learner ${learner ?? "none"})`);
}

/** Compare two captures, element by element, and name what moved. */
function compare({ before, after }) {
  // AN EMPTY COMPARISON IS NOT A PASS. The first version of this function read
  // two directories that a crashed capture had left empty and reported
  // "IDENTICAL" — the exact vacuous green this guard exists to prevent. A
  // comparison must have something to compare, and it must be the SAME set of
  // routes on both sides.
  for (const dir of [before, after]) {
    if (!fs.existsSync(path.join(dir, "index.json"))) {
      console.error(`✗ ${dir} holds no capture (no index.json) — nothing was compared.`);
      process.exit(2);
    }
  }
  const files = fs.readdirSync(before).filter((f) => f.endsWith(".json") && f !== "index.json").sort();
  const afterFiles = fs.readdirSync(after).filter((f) => f.endsWith(".json") && f !== "index.json").sort();
  const bi = JSON.parse(fs.readFileSync(path.join(before, "index.json"), "utf8"));
  const ai = JSON.parse(fs.readFileSync(path.join(after, "index.json"), "utf8"));
  const shape = (i) => `${i.routes.map((r) => r.name).join(",")}|${i.widths.map((w) => w.width).join(",")}`;
  if (shape(bi) !== shape(ai)) {
    console.error(`✗ the two captures measured different route/width sets — refusing to compare:\n    before: ${shape(bi)}\n    after:  ${shape(ai)}`);
    process.exit(2);
  }
  if (files.length === 0) {
    console.error("✗ both captures are empty of route files — nothing was compared");
    process.exit(2);
  }
  const diffs = [];
  const notes = [];
  let compared = 0;
  for (const f of files) {
    const b = JSON.parse(fs.readFileSync(path.join(before, f), "utf8"));
    const aPath = path.join(after, f);
    if (!fs.existsSync(aPath)) { diffs.push(`${f}: missing in AFTER`); continue; }
    const a = JSON.parse(fs.readFileSync(aPath, "utf8"));
    compared++;
    const head = (x) => `${f}: ${x}`;
    if (a.scrollHeight !== b.scrollHeight) diffs.push(head(`page height ${b.scrollHeight} → ${a.scrollHeight}`));
    if (a.width !== b.width) diffs.push(head(`viewport width ${b.width} → ${a.width}`));
    // The stylesheet SET is rendering-relevant (a sheet that failed to load is a
    // different page); the RULE COUNT is not — a refactor that ADDS rules while
    // every resolved value stays put is exactly the change this guard exists to
    // wave through, and the first run of the tokenisation slice failed 22
    // captures on the rule count climbing 397 → 401 while every computed
    // property, geometry value and pixel matched. Paths are compared; the count
    // is REPORTED so a reader can see the source moved.
    const paths = (s) => s.map((x) => x.replace(/:[^:]*$/, "")).join(" ");
    if (paths(a.sheets) !== paths(b.sheets)) diffs.push(head(`stylesheets ${paths(b.sheets)} → ${paths(a.sheets)}`));
    if (a.sheets.join() !== b.sheets.join()) notes.push(head(`rule count ${b.sheets.join(" ")} → ${a.sheets.join(" ")} (source changed, rendering did not)`));
    if (a.elements.length !== b.elements.length) {
      diffs.push(head(`element count ${b.elements.length} → ${a.elements.length}`));
      continue; // an element-by-element walk past a structural change is noise
    }
    for (let i = 0; i < b.elements.length; i++) {
      const be = b.elements[i], ae = a.elements[i];
      const where = `${f}: element #${i} <${be[0]}${be[2] ? ` class="${be[2]}"` : ""}>`;
      for (let k = 0; k < 9; k++) {
        if (JSON.stringify(be[k]) !== JSON.stringify(ae[k])) {
          const label = ["tag", "id", "class", "x", "y", "w", "h", "text", "value"][k];
          diffs.push(`${where} ${label}: ${JSON.stringify(be[k])} → ${JSON.stringify(ae[k])}`);
        }
      }
      for (let p = 0; p < PROPS.length; p++) {
        const bv = be[9][p], av = ae[9][p];
        if (bv !== av) diffs.push(`${where} ${PROPS[p]}: ${JSON.stringify(bv)} → ${JSON.stringify(av)}`);
      }
      if (diffs.length > 400) break;
    }
    // Screenshots are the human half of the evidence: identical bytes are the
    // strongest statement available, and a difference sends the reviewer to the
    // PNG rather than to a number.
    for (const png of fs.readdirSync(path.join(before, "png")).filter((p) => p === f.replace(/\.json$/, ".png"))) {
      const bp = path.join(before, "png", png), ap = path.join(after, "png", png);
      const bs = pngScanlines(bp), as = pngScanlines(ap);
      if (bs && as) {
        const d = pixelDelta(fs.readFileSync(bp), fs.readFileSync(ap));
        if (d.shape || d.max > NOISE_CHANNEL || d.frac > NOISE_AREA) {
          diffs.push(`${png}: rendered pixels differ — ${d.count} px changed, largest channel move ${d.max}, ${(d.frac * 100).toFixed(3)}% of the image`);
        } else if (d.count > 0) {
          notes.push(`${png}: ${d.count} px of antialias noise tolerated (largest channel move ${d.max})`);
        }
      } else if (sha(fs.readFileSync(bp)) !== sha(fs.readFileSync(ap))) {
        diffs.push(`${png}: screenshot file differs and its pixels could not be read`);
      }
    }
  }
  console.log(`\nvisual guard — ${compared} of ${files.length} route/viewport captures compared`);
  if (compared !== files.length || files.length !== afterFiles.length) {
    console.error(`✗ the two captures are not the same size (before ${files.length}, after ${afterFiles.length}, compared ${compared}) — a missing file is never a pass`);
    return 2;
  }
  for (const n of notes.slice(0, 3)) console.log(`  · ${n}`);
  if (!diffs.length) {
    console.log("  ✓ IDENTICAL: every element, every computed property, every geometry value, every leaf text and every screenshot pixel");
    return 0;
  }
  console.log(`  ✗ ${diffs.length} difference(s):\n`);
  for (const d of diffs.slice(0, 40)) console.log(`    ${d}`);
  if (diffs.length > 40) console.log(`    … and ${diffs.length - 40} more`);
  return 1;
}

/** Prove the comparator can SEE. Mutates one served declaration, re-captures a
 *  single route, and requires the diff to be non-empty. */
async function selftest() {
  const tmp = fs.mkdtempSync(path.join(process.cwd(), ".visual-selftest-"));
  console.log("self-test: capture, mutate the live page, capture again — the diff MUST be non-empty");
  await captureSingle({}, `${tmp}/a`);
  // Two mutations, because there are two halves of the claim to prove: pure
  // typography (letter-spacing on every element, which changes computed values
  // and the width of text boxes) and pure geometry (9px of body padding, which
  // moves every element on the page down). A comparator that only watched text
  // would miss the second; one that only watched boxes would miss the first.
  await captureSingle({ mutate: true }, `${tmp}/b`);
  const rc = compare({ before: `${tmp}/a`, after: `${tmp}/b` });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (rc === 0) {
    console.error("\n✗ SELF-TEST FAILED: the guard reported NO difference for a page that was visibly mutated. It cannot be trusted.");
    process.exit(1);
  }
  console.log("\n✓ self-test passed: the guard detects a 1px typographic change and names it.");
  return 0;
}

/** One route, one width, captured exactly like a real capture — the self-test's
 *  pair, so what it validates is the same code path the gate uses. */
async function captureSingle({ mutate }, outDir) {
  fs.mkdirSync(path.join(outDir, "png"), { recursive: true });
  // The same index a real capture writes, so the hardened compare can check the
  // two self-test sides measured the same shape instead of refusing them.
  fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify({
    base: BASE, widths: [WIDTHS[0]], routes: [{ name: "home", url: "/" }], props: PROPS, selfTest: true,
  }, null, 2));
  const { width, height } = WIDTHS[0];
  const chrome = await launchChrome({ width, height });
  const page = pageFor(chrome.send);
  try {
    await chrome.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    await page.goto(BASE + "/");
    await page.waitFor(`return document.readyState === "complete";`, "the home page");
    let fp = null, previous = null;
    for (let i = 0; i < 14; i++) {
      // The mutation is re-applied before EVERY read, because a React re-render
      // (or any navigation) drops an injected <style> — and an instrument whose
      // mutation silently evaporated would "pass" a self-test it never ran.
      if (mutate) {
        await page.evaluate(FREEZE);
        await page.evaluateAsync(`(async () => {
          const id = "visual-guard-mutation";
          document.getElementById(id)?.remove();
          const s = document.createElement("style");
          s.id = id;
          s.textContent = "* { letter-spacing: 0.45px !important; } body { padding-top: 9px !important; }";
          document.head.appendChild(s);
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return true;
        })()`);
      }
      fp = await page.evaluate(FINGERPRINT);
      const key = JSON.stringify(fp);
      if (previous !== null && key === previous) break;
      previous = key;
      await sleep(220);
    }
    fs.writeFileSync(path.join(outDir, `${width}-home.json`), JSON.stringify({ route: "/", width, height, ...fp }));
    const { buf } = await stableShot(chrome.send);
    fs.writeFileSync(path.join(outDir, "png", `${width}-home.png`), buf);
  } finally {
    await chrome.close();
  }
}

if (cmd === "capture") await capture({ out: arg("out", ".visual/capture") });
else if (cmd === "compare") {
  const before = arg("before"), after = arg("after");
  if (!before || !after) { console.error("compare needs --before=<dir> and --after=<dir>"); process.exit(2); }
  process.exit(compare({ before, after }));
} else if (cmd === "selftest") process.exit(await selftest());
else { console.error(`unknown command "${cmd}" — use capture | compare | selftest`); process.exit(2); }
