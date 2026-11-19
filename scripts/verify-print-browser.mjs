#!/usr/bin/env node
// ── THE PRINT PATH, RENDERED BY A REAL BROWSER ─────────────────────────────
//
// This does NOT claim a physical printer was used. It drives Chrome's actual
// print-to-PDF path, which is the same layout engine a print preview uses, and
// records page counts and PDF bytes for representative lessons. It also checks
// the pupil DOM for answer-bearing text before printing, so a key leak cannot
// pass because the PDF happened to be cropped.
//
//   PRINT_BASE=http://127.0.0.1:4174 node scripts/verify-print-browser.mjs
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.PRINT_BASE ?? "http://127.0.0.1:4174";
const OUT = path.resolve("reports/print-evidence");
mkdirSync(OUT, { recursive: true });
const profileDir = mkdtempSync(path.join(tmpdir(), "openmind-print-"));

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ FAIL: ${msg}`); }
};
const section = (s) => console.log(`\n▸ ${s}`);
const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
async function call(p, opts) {
  const r = await fetch(BASE + p, opts);
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: r.status, body, cookie: (r.headers.get("set-cookie") ?? "").split(";")[0] };
}
const exactButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === ${JSON.stringify(text)})`;

async function teacher() {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = `print-teacher-${stamp}@example.test`;
  const password = "print-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: "Print Teacher", role: "teacher", country: "GB", language: "en", subjects: ["maths"],
  }));
  if (r.status !== 200) throw new Error(`signup ${r.status} ${JSON.stringify(r.body)}`);
  return { email, password };
}

async function signIn(p, account) {
  await p.goto(`${BASE}/onboarding?mode=signin`);
  await p.waitFor(`return !!document.querySelector("main input[type=email]");`, "the sign-in form", 25000);
  await p.typeInto(`document.querySelector("main input[type=email]")`, account.email, "the email");
  await p.typeInto(`document.querySelector("main input[type=password]")`, account.password, "the password");
  await p.clickExpr(exactButton("Sign in"), "Sign in");
  await p.waitFor(`return location.pathname !== "/onboarding" || !document.querySelector("main input[type=email]");`, "the teacher session", 30000);
}

async function printRoute(p, send, route, name) {
  await p.goto(`${BASE}${route}`);
  await p.waitFor(`return !!document.querySelector(".print-sheet");`, `${name}'s print sheet`, 30000);
  await send("Emulation.setEmulatedMedia", { media: "print" });
  const metrics = await p.evaluate(`return (() => {
    const groupTable = document.querySelector(".guide-groups");
    const runTable = [...document.querySelectorAll(".guide-table")].find((t) => /Suggested run of show/i.test(t.closest("section")?.innerText || ""));
    const overflow = (t) => t ? Math.max(0, t.scrollWidth - t.clientWidth) : 0;
    return {
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      text: (document.querySelector(".print-sheet")?.innerText || "").replace(/\\n+/g, " · "),
      figures: document.querySelectorAll(".print-sheet svg, .print-sheet figure").length,
      tables: document.querySelectorAll(".print-sheet table").length,
      answerRules: document.querySelectorAll(".print-rule").length,
      key: !!document.querySelector(".print-key"),
      groupRows: groupTable ? groupTable.rows.length : 0,
      groupColumns: groupTable?.rows[0] ? groupTable.rows[0].cells.length : 0,
      groupOverflow: overflow(groupTable),
      groupHeader: groupTable?.tHead?.innerText.replace(/\\s+/g, " ").trim() || "",
      groupBreak: groupTable?.rows[0] ? getComputedStyle(groupTable.rows[0]).breakInside : "",
      groupHeadDisplay: groupTable?.tHead ? getComputedStyle(groupTable.tHead).display : "",
      runRows: runTable ? runTable.rows.length : 0,
      runColumns: runTable?.rows[0] ? runTable.rows[0].cells.length : 0,
      runOverflow: overflow(runTable),
      runHeader: runTable?.tHead?.innerText.replace(/\\s+/g, " ").trim() || "",
      runBreak: runTable?.rows[0] ? getComputedStyle(runTable.rows[0]).breakInside : "",
      runHeadDisplay: runTable?.tHead ? getComputedStyle(runTable.tHead).display : "",
    };
  })();`);
  console.log(`  · printing ${name} …`);
  const pdf = await send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0.35,
    marginBottom: 0.35,
    marginLeft: 0.35,
    marginRight: 0.35,
  });
  const bytes = Buffer.from(pdf.data, "base64");
  const file = path.join(OUT, `${name}.pdf`);
  writeFileSync(file, bytes);
  const pages = (bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  await send("Emulation.setEmulatedMedia", { media: "screen" });
  return { route, name, bytes: bytes.length, pages, file: path.relative(process.cwd(), file), ...metrics };
}

/**
 * EVERY PRINT ROUTE ON A 320px PHONE.
 *
 * The A4 assertion above runs at 1280, where a table that cannot fit is still
 * invisible: the browser widens the document and nothing looks wrong. At 320 the
 * failure is two-fold — the page scrolls sideways, and a sheet whose content is
 * wider than its own box needs a sideways gesture INSIDE the document to read
 * the right-hand column. Measured here, so a later block cannot reintroduce it
 * silently: the worksheet scrolled 118px at this width once, and the subject
 * index widened the document to 351px.
 */
async function phoneRoute(p, send, route, name) {
  await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
  await p.goto(`${BASE}${route}`);
  await p.waitFor(`return !!document.querySelector(".print-sheet, main");`, `${name} at 320px`, 30000);
  await sleep(600);
  const metrics = await p.evaluate(`return (() => {
    const doc = document.documentElement;
    const sheet = document.querySelector(".print-sheet");
    return {
      width: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      sheets: document.querySelectorAll(".print-sheet").length,
      sheetScroll: sheet ? sheet.scrollWidth : 0,
      sheetClient: sheet ? sheet.clientWidth : 0,
    };
  })();`);
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  return { route, name, ...metrics };
}

let browser = null;
try {
  const ping = await fetch(`${BASE}/api/health`);
  if (!ping.ok) throw new Error(`health ${ping.status}`);
  const account = await teacher();

  browser = await launchChrome({ port: 11200 + Math.floor(Math.random() * 60), userDataDir: profileDir, keepProfile: true });
  const p = pageFor(browser.send);
  const rows = [];

  section("Mathematics: a long lesson with a figure and set notation");
  rows.push(await printRoute(p, browser.send, "/print/maths/fractions", "maths-fractions"));
  rows.push(await printRoute(p, browser.send, "/print/maths/quadratics", "maths-quadratics-graph"));
  rows.push(await printRoute(p, browser.send, "/print/maths/algebra-expressions", "maths-algebra-rectangle"));
  // The table part is authored on data-charts: counts are printed, angle cells
  // are blank, and the answer key holds the three answers separately.
  rows.push(await printRoute(p, browser.send, "/print/maths/data-charts", "maths-data-charts-table"));
  // The plot part is authored on motion-graphs: the pupil gets a blank grid and
  // the key gets the points and the fitted line.
  rows.push(await printRoute(p, browser.send, "/print/physics/motion-graphs", "physics-motion-plot"));

  section("Science: structured, gap-fill, matching and practical planning");
  rows.push(await printRoute(p, browser.send, "/print/biology/photosynthesis", "biology-photosynthesis"));
  rows.push(await printRoute(p, browser.send, "/print/chemistry/acids-bases", "chemistry-acids-bases"));
  // A practical-planning response is not a separate print primitive: it is a
  // constructed response with enough ruled space. This page proves the paper
  // route carries the authored planning prompt and no model answer.
  rows.push(await printRoute(p, browser.send, "/print/chemistry/rates-reaction", "chemistry-rates-practical"));
  rows.push(await printRoute(p, browser.send, "/print/physics/electricity-circuits", "physics-circuits"));

  section("Computing: code tracing and ordering");
  rows.push(await printRoute(p, browser.send, "/print/computing/what-is-code", "computing-what-is-code"));
  rows.push(await printRoute(p, browser.send, "/print/maths/scatter-correlation", "maths-scatter"));

  section("A whole-subject batch");
  const all = await printRoute(p, browser.send, "/print/maths/all", "maths-all");
  rows.push(all);

  for (const r of rows) {
    check(r.bytes > 8_000, `${r.name}: produced a real PDF (${r.bytes} bytes)`);
    check(r.pages >= 1, `${r.name}: rendered ${r.pages} page(s)`);
    check(r.scrollWidth <= r.width + 1, `${r.name}: print layout does not overflow sideways (${r.scrollWidth}/${r.width})`);
    check(!/Model answer|Teacher answer/.test(r.text), `${r.name}: pupil sheet contains no marking key`);
    check(r.answerRules > 0, `${r.name}: printed answer spaces are present (${r.answerRules})`);
    if (r.name === "maths-fractions") check(r.figures > 0, `${r.name}: the assessed diagram is present (${r.figures})`);
    if (r.name === "maths-data-charts-table") {
      check(r.tables > 0, `${r.name}: the authored table is printed (${r.tables})`);
      check(/Angle/i.test(r.text) && /Walk/.test(r.text) && /Bus/.test(r.text) && /Car/.test(r.text),
        `${r.name}: the table keeps its categories and angle row`);
    }
    if (r.name === "physics-motion-plot") {
      check(r.figures > 0, `${r.name}: the plot grid is printed (${r.figures})`);
      check(/Plot the cyclist/i.test(r.text) && /read the velocity/i.test(r.text),
        `${r.name}: the plot and read-off instructions are on the pupil sheet`);
    }
    if (r.name === "chemistry-rates-practical") {
      check(/plans an experiment/i.test(r.text) && /mean rate/i.test(r.text),
        `${r.name}: the practical-planning prompt is on the pupil sheet`);
      check(!/gas syringe connected|same mass and surface area|fewer acid particles per unit volume/i.test(r.text),
        `${r.name}: the pupil sheet does not print the model answer`);
    }
    if (r.name === "maths-all") check(r.pages > 20, `the whole-subject set is a real batch (${r.pages} pages)`);
  }

  section("The teacher key is a separate document");
  await signIn(p, account);
  const key = await printRoute(p, browser.send, "/print/maths/fractions/key", "maths-fractions-key");
  check(key.key, "the key route renders the key document, not the pupil sheet");
  check(/Model answer/.test(key.text), "the key document carries model answers");
  check(key.bytes > 5_000 && key.pages >= 1, `the key printed as a separate PDF (${key.bytes} bytes, ${key.pages} page(s))`);

  section("The teacher guide: default and large-class");
  const guideDefs = [
    { route: "/print/maths/fractions/guide", name: "maths-fractions-guide" },
    { route: "/print/maths/fractions/guide?context=large-class", name: "maths-fractions-guide-large-class" },
  ];
  const guides = [];
  for (const def of guideDefs) {
    const g = await printRoute(p, browser.send, def.route, def.name);
    guides.push(g);
    check(g.bytes > 8_000, `${g.name}: produced a real PDF (${g.bytes} bytes)`);
    check(g.pages >= 2 && g.pages <= 12, `${g.name}: rendered a plausible guide length (${g.pages} page(s))`);
    check(g.scrollWidth <= g.width + 1, `${g.name}: guide does not overflow sideways (${g.scrollWidth}/${g.width})`);
    check(g.groupRows === 5 && g.groupColumns === 4,
      `${g.name}: group table has a header and four groups (${g.groupRows} rows, ${g.groupColumns} columns)`);
    check(g.groupOverflow === 0, `${g.name}: group table has no horizontal overflow (${g.groupOverflow}px)`);
    check(g.groupBreak === "avoid" && g.groupHeadDisplay === "table-header-group",
      `${g.name}: group rows avoid splitting and the header repeats (${g.groupBreak}/${g.groupHeadDisplay})`);
    check(/Group.*Focus.*Task.*What to check/i.test(g.groupHeader), `${g.name}: group table keeps its four headings`);
    check(g.runRows === 7 && g.runColumns === 3,
      `${g.name}: run of show has a header and six steps (${g.runRows} rows, ${g.runColumns} columns)`);
    check(g.runOverflow === 0, `${g.name}: run-of-show table has no horizontal overflow (${g.runOverflow}px)`);
    check(g.runBreak === "avoid" && g.runHeadDisplay === "table-header-group",
      `${g.name}: run-of-show rows avoid splitting and the header repeats (${g.runBreak}/${g.runHeadDisplay})`);
    check(/Min.*Step.*What the teacher does/i.test(g.runHeader), `${g.name}: run of show keeps its three headings`);
    check(/Temporary groups for this lesson/.test(g.text) && /Suggested run of show/.test(g.text),
      `${g.name}: both tables are on the printed guide`);
    check(["Foundational", "Developing", "Applying", "Extending"].every((level) => g.text.includes(level)),
      `${g.name}: all four temporary groups are printed`);
    check(!/Model answer/.test(g.text), `${g.name}: guide does not print the marking key`);
  }
  check(guides[0].text !== guides[1].text && /shoulder partners/i.test(guides[1].text),
    "the large-class guide uses the large-class group routine, not the default routine");
  check(!/shoulder partners/i.test(guides[0].text), "the default guide does not claim the large-class routine");

  section("Every print route fits a 320px phone");
  const PHONE_ROUTES = [
    ["/print", "print-index"],
    ["/print/maths", "maths-index"],
    ["/print/maths/fractions", "maths-fractions"],
    ["/print/maths/fractions/key", "maths-fractions-key"],
    ["/print/maths/fractions/guide", "maths-fractions-guide"],
    ["/print/maths/fractions/guide?context=large-class", "maths-fractions-guide-large-class"],
    ["/print/maths/all", "maths-all"],
  ];
  const phone = [];
  for (const [route, name] of PHONE_ROUTES) {
    const m = await phoneRoute(p, browser.send, route, name);
    phone.push(m);
    check(m.width === 320, `${name} at 320: measured at 320 CSS px (${m.width})`);
    check(m.scrollWidth <= m.width + 1, `${name} at 320: the document does not overflow sideways (${m.scrollWidth}/${m.width})`);
    if (m.sheets > 0) {
      check(m.sheetScroll <= m.sheetClient + 1,
        `${name} at 320: the sheet needs no sideways scroll of its own (${m.sheetScroll}/${m.sheetClient})`);
    }
  }

  writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    base: BASE,
    note: "Rendered with Chrome's print-to-PDF path. No physical printer or scanner was used.",
    documents: rows.concat(guides, [key]),
    phone,
  }, null, 2));
  console.log(`\nEvidence written to ${path.relative(process.cwd(), OUT)}/summary.json`);
} finally {
  try { if (browser) await browser.close(); } catch { /* best effort */ }
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* best effort */ }
}

console.log(`\n${"─".repeat(58)}`);
console.log(`PRINT RENDER: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
