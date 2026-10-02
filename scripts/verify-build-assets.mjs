// ─────────────────────────────────────────────────────────────────────────────
// BUILD ASSET INTEGRITY — the gate that was missing, and the cause of the
// completely-unstyled production page.
//
// WHAT GOES WRONG. A Next standalone server does not serve its own CSS from the
// bundle; it serves HTML that points at a SEPARATE static tree, and every asset
// URL is CONTENT-HASHED per build. The document therefore carries no guarantee
// that the directory next to it belongs to the same build. When they disagree,
// the document still returns HTTP 200 — the page is simply bare HTML: Times New
// Roman, default blue underlined links, default buttons, no layout, both navs
// visible at once and the footer sitting directly under the content, because the
// rules that hide `.bottomnav` and stretch `.shell-main` ARE the stylesheet.
//
// This is not hypothetical. The checkout shipped with `.next` holding DEVELOPMENT
// output (static/development/, webpack hot-update files, no standalone/ at all)
// while the real production build sat in `.next-prod`, and
// `.next-prod/standalone/.next/static` did not exist. Serving that build returns
// 200 for `/` and 404 for the stylesheet it asks for.
//
// This script makes that state impossible to serve silently. It does not guess:
// it reads the HTML the server actually emits and checks every asset it points
// at against the tree that will serve it.
//
//   node scripts/verify-build-assets.mjs [--dist .next] [--port 3000]
//
// Exits non-zero, loudly, on: no stylesheet linked, a linked stylesheet missing
// on disk or empty, a referenced static asset missing, a standalone bundle with
// no static tree, or a stylesheet that does not actually define the document's
// typography (a 404 body served as 200 is the failure this exists to catch).
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const DIST = arg("dist", ".next");
const PORT = arg("port", "3000");
const BASE = `http://localhost:${PORT}`;

let failures = 0;
const fail = (msg) => { failures++; console.error(`  ✗ ${msg}`); };
const pass = (msg) => console.log(`  ✓ ${msg}`);

console.log(`\nBuild asset integrity — dist=${DIST} server=${BASE}\n`);

// ── 1. The build output itself ───────────────────────────────────────────────
console.log("1 · build output");
if (!fs.existsSync(path.join(DIST, "BUILD_ID"))) {
  fail(`${DIST} has no BUILD_ID — this is not a production build (is it a dev distDir?)`);
} else {
  pass(`${DIST} is a production build (BUILD_ID ${fs.readFileSync(path.join(DIST, "BUILD_ID"), "utf8").trim()})`);
}

const staticDir = path.join(DIST, "static");
if (!fs.existsSync(staticDir)) {
  fail(`${staticDir} does not exist — nothing can be served`);
} else {
  const css = fs.readdirSync(path.join(staticDir, "css")).filter((f) => f.endsWith(".css"));
  if (!css.length) fail("no built stylesheet in dist/static/css");
  else pass(`built stylesheet(s): ${css.join(", ")}`);
}

// ── 2. A standalone bundle must carry the static tree it will serve ───────────
console.log("\n2 · standalone bundle");
const standalone = path.join(DIST, "standalone");
if (fs.existsSync(path.join(standalone, "server.js"))) {
  const bundled = path.join(standalone, ".next", "static");
  if (!fs.existsSync(bundled)) {
    fail(`standalone/server.js exists but ${bundled} is missing — this build will serve UNSTYLED HTML`);
  } else {
    const n = fs.existsSync(path.join(bundled, "css")) ? fs.readdirSync(path.join(bundled, "css")).length : 0;
    if (!n) fail("standalone static tree has no css/ directory");
    else pass(`standalone ships its own static tree (${n} css file(s))`);
  }
} else {
  pass("no standalone bundle in this dist (not a standalone build — skipped)");
}

// ── 3. What the running server actually emits ─────────────────────────────────
console.log("\n3 · the running server's HTML and the assets it points at");
let html = null;
try {
  const res = await fetch(`${BASE}/`, { redirect: "follow" });
  if (!res.ok) fail(`server returned ${res.status} for /`);
  html = await res.text();
  pass(`server returned ${res.status} (${html.length} bytes)`);
} catch (e) {
  fail(`cannot reach ${BASE} — start the server first (${e.message})`);
}

if (html) {
  const sheets = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  if (!sheets.length) {
    fail("the served HTML links NO stylesheet — this is the unstyled page");
  } else if (sheets.length > 1) {
    fail(`the served HTML links ${sheets.length} stylesheets (${sheets.join(", ")}) — it must be loaded once`);
  } else {
    pass(`exactly one stylesheet linked: ${sheets[0]}`);
  }

  // EVERY referenced static asset must resolve. This is the check that would
  // have caught the failure: 200 for the document, 404 for the stylesheet.
  const refs = [...new Set([...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]))];
  let missing = 0;
  for (const r of refs) {
    const onDisk = path.join(DIST, r.replace(/^\/_next\//, "").split("?")[0]);
    if (!fs.existsSync(onDisk)) { fail(`referenced asset not on disk: ${r}`); missing++; continue; }
    try {
      const res = await fetch(BASE + r);
      if (!res.ok) { fail(`${r} → HTTP ${res.status} over the wire`); missing++; }
    } catch (e) { fail(`${r} → unreachable (${e.message})`); missing++; }
  }
  if (!missing) pass(`all ${refs.length} referenced static assets resolve (200 + on disk)`);

  // The stylesheet must be a real stylesheet, not an HTML error body served
  // with a 200. A 404 page returned for a .css request is how a proxy hides this.
  if (sheets.length === 1) {
    try {
      const cssRes = await fetch(BASE + sheets[0]);
      const body = await cssRes.text();
      if (!/<(!doctype|html)/i.test(body)) {
        pass(`stylesheet served is CSS (${body.length} bytes, not an HTML error page)`);
        // The document's typography must actually come from this file. If the
        // design system's body font rule is missing, every page silently falls
        // back to the browser default — the exact reported symptom.
        if (/body\s*\{[^}]*font-family/.test(body)) pass("stylesheet defines the body font-family (no browser-default fallback)");
        else fail("stylesheet does not define a body font-family — the page would render in the browser default");
        if (/--paper\s*:/.test(body)) pass("stylesheet carries the design tokens (:root custom properties)");
        else fail("stylesheet has no :root design tokens — the theme is not being applied");
      } else {
        fail(`${sheets[0]} returned an HTML document — an error page is being served for the stylesheet`);
      }
    } catch (e) { fail(`could not read the stylesheet (${e.message})`); }
  }

  // Structural pins that only make sense WITH the stylesheet present, because
  // the stylesheet is what supplies them. Each one is a symptom the reported
  // screenshot showed, asserted at the markup level.
  const mainMenus = [...html.matchAll(/<nav[^>]*aria-label="Main menu"/g)].length;
  if (mainMenus !== 1 && mainMenus !== 2) fail(`expected the sidebar+bottom nav pair, found ${mainMenus} "Main menu" landmarks`);
  else pass(`${mainMenus} "Main menu" landmarks in markup (one is hidden by CSS at each viewport)`);
  if (!/class="footer"/.test(html)) fail("no footer in the served markup");
  else pass("footer present in the served markup");
  if (!/class="shell"/.test(html) || !/class="shell-main"/.test(html)) fail("the .shell / .shell-main layout wrappers are missing from the markup");
  else pass("layout wrappers (.shell / .shell-main) present");
}

console.log(`\n${"─".repeat(58)}`);
if (failures) {
  console.error(`BUILD ASSET INTEGRITY: ${failures} problem(s). DO NOT SERVE THIS BUILD.`);
  process.exit(1);
}
console.log("BUILD ASSET INTEGRITY: OK — the build can be served styled.");
