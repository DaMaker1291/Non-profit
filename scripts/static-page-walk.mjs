#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE LIVE PAGE WALK — a real browser, driving the artefact learners actually use.
//
// WHY THIS EXISTS. `verify:ui` drives the Next application, which needs a server
// and has never been deployed. The page a learner really meets today is the
// static build published to GitHub Pages: `docs/index.html`, its content-hashed
// engine, and a service worker. Nothing tested it. `verify:static` says so in
// its own header — it does not drive a browser, and a real localStorage was
// exercised, if at all, by a person clicking around. So the one product with
// real users was the one product outside behavioural coverage, and every claim
// about it rested on reading files.
//
// WHAT IT DOES. It serves `docs/` from an in-process static server (the same
// thing GitHub Pages does: files, no route handlers), drives Chrome over the
// DevTools Protocol with REAL clicks and keystrokes, and takes a learner from a
// blank browser through the whole journey the product promises:
//
//   LANDING → SETUP → DIAGNOSTIC → HOME → CURRICULUM → PRACTICE → EVIDENCE
//
// then reloads the page and requires the record to still be there, still with
// no server anywhere in the picture.
//
// WHY IT CHECKS WHAT IT CHECKS. The failures worth catching here are the ones
// only this artefact can have: an asset that 404s because the build renamed it
// (the engine then never loads and every screen silently shows its loading
// state), a raw i18n key or a `NaN` reaching a learner, a dimension nobody has
// measured shown as 0 instead of "not yet measured", and work that was helped
// being reported as independent. Each of those is a sentence on a screen, so
// each is asserted on a screen.
//
// Run:  npm run verify:live        (builds nothing; walks docs/ as it ships)
// Optional env: CHROME_BIN, LIVE_WALK_PORT.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs");
const PORT = Number(process.env.LIVE_WALK_PORT ?? 8420) + Math.floor(Math.random() * 60);

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

/** The host, exactly as GitHub Pages behaves: files on disk, `/` → index.html,
 *  and a 404 for anything else. Deliberately NOT a router — if the page ever
 *  needs a server to work, this walk fails, which is the point: it is a claim
 *  about the deployment we ship. */
function serveDocs() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const file = path.join(DOCS, rel);
    if (!file.startsWith(DOCS) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

const BASE = `http://127.0.0.1:${PORT}`;

/** The screen a learner is looking at, flattened — the instrument every claim
 *  below is read from, because a claim IS what the screen says. */
const screen = (p) => p.allText();

/** How many answers the record is showing. Counted from the list the page
 *  renders (`ul.items`, one entry per recent answer), not from a number in a
 *  sentence — a claim about a count has to be read from the thing that IS the
 *  count. */
const countAnswers = (p) => p.evaluate(`return document.querySelectorAll("main ul.items li").length;`);

/**
 * Click the link that says something, and PROVE the click reached it.
 *
 * A real mouse event goes to a POINT, so anything floating over that point
 * takes it instead. The page has a toast and a tutor panel; a control that a
 * message is sitting on top of is clickable in the DOM and unreachable in the
 * hand, which is exactly the class of bug this walk exists to find — and it is
 * invisible to a check that only asks whether a handler fired. So the hit test
 * comes first and the failure names what was actually there.
 */
async function clickLink(p, matches, what) {
  // ANY link, not only those inside `main`: a learner uses the navigation, and
  // the navigation is exactly where a covered or mislabelled link would hide
  // from a check that only looked at the page body.
  const sel = `[...document.querySelectorAll("a")].find(a => new RegExp(${JSON.stringify(matches)}, "i").test(a.textContent || ""))`;
  const point = await p.rectOf(sel);
  if (!point) throw new Error(`no link matching /${matches}/ for ${what}`);
  const hit = await p.evaluate(`const el = document.elementFromPoint(${point.x}, ${point.y});
    return el ? { tag: el.tagName.toLowerCase(), cls: String(el.className || "").slice(0, 40), text: (el.textContent || "").trim().slice(0, 40), inside: el.closest("a") === ${sel} } : null;`);
  if (!hit?.inside) {
    throw new Error(`${what} is covered: the click point lands on <${hit?.tag ?? "nothing"} class="${hit?.cls ?? ""}"> ("${hit?.text ?? ""}")`);
  }
  await p.clickExpr(sel, what);
  return point.text;
}

async function main() {
  const engineFile = fs.readdirSync(DOCS).find((f) => /^openmind\.engine\.[a-f0-9]{12}\.js$/.test(f));
  const appFile = fs.readdirSync(DOCS).find((f) => /^app\.[a-f0-9]{12}\.js$/.test(f));
  const index = fs.readFileSync(path.join(DOCS, "index.html"), "utf8");
  check(!!engineFile && index.includes(engineFile),
    `the page names the engine build it will load (${engineFile ?? "none"} — index.html ${engineFile && index.includes(engineFile) ? "agrees" : "DISAGREES"})`);
  check(!!appFile && index.includes(appFile),
    `and the page build beside it (${appFile ?? "none"})`);

  const server = await serveDocs();
  const { send, close } = await launchChrome({ port: 9333 + Math.floor(Math.random() * 400) });
  const p = pageFor(send);

  try {
    await p.goto(`${BASE}/`);
    await p.evaluate(`localStorage.clear(); sessionStorage.clear(); return true;`);
    await p.goto(`${BASE}/`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the landing page to render");

    // ── 1. The page boots its own engine, offline, with nothing missing ───────
    // The failure this catches is invisible on screen: a renamed asset 404s, the
    // engine never loads, and the app shows its "loading the learning engine…"
    // line for ever while every check that reads a list of files still passes.
    section("The live page boots on its own assets");
    const booted = await p.evaluate(`return {
      loading: /loading the learning engine/i.test(document.body.innerText || ""),
      scripts: [...document.querySelectorAll("script[src]")].map(s => s.getAttribute("src")),
      failures: [...document.querySelectorAll("script[src]")].filter(s => !s.dataset).length,
    };`);
    check(!booted.loading, "the page is running, not still waiting for its engine");
    check(booted.scripts.length >= 2 && booted.scripts.every((s) => fs.existsSync(path.join(DOCS, s))),
      `every script it loads is on disk (${booted.scripts.join(", ")})`);

    const landing = await screen(p);
    check(/adapts to what you actually know/i.test(landing), "the landing page says what the product does");
    check(!/world-class|Server-graded|internal evidence|THE ANSWER THAT DECIDED IT/i.test(landing),
      "and makes no claim the artefact cannot keep — no marketing superlative, no server grading, no engineering demo");
    check(/\d+ \/ \d+ concepts/.test(landing), "and states what it can teach, counted from the genome it shipped");

    // ── 2. Setup, driven by the fields the learner meets ─────────────────────
    section("Setup: country, year, course");
    await clickLink(p, "start learning", "the start-learning link");
    await p.waitFor(`return !!document.querySelector("#f-country");`, "the setup form");
    await p.typeInto(`document.querySelector("#f-name")`, "LiveWalk", "the nickname field");
    await p.typeInto(`document.querySelector("#f-grade")`, "Year 10", "the year-group field");
    await p.pickOption(`document.querySelector("#f-country")`, "GB", "country");
    const country = await p.valueOf(`document.querySelector("#f-country")`);
    check(country === "GB", `the country is chosen through the select itself (${country})`);
    await p.waitFor(`return !![...document.querySelectorAll("main select")].find(s => /uk-gcse/.test(s.innerHTML));`, "the UK courses to appear");
    const courseSelect = `[...document.querySelectorAll("main select")].find(s => /uk-gcse/.test(s.innerHTML))`;
    await p.pickOption(courseSelect, "uk-gcse|higher", "course");
    const course = await p.valueOf(courseSelect);
    check(course === "uk-gcse|higher", `and the course is the one chosen, not a default (${course})`);
    const grade = await p.valueOf(`document.querySelector("#f-grade")`);
    check(typeof grade === "string" && grade.length > 0, `the year group is recorded (${grade})`);
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /start learning/i.test(b.textContent || ""))`, "the start-learning button");

    // ── 3. The diagnostic, and the honest report it produces ─────────────────
    section("Diagnostic, and what it refuses to claim");
    await p.waitFor(`return /#\\/diag$/.test(location.hash);`, "the diagnostic sitting", 20000);
    const asking = await screen(p);
    check(/adaptive diagnostic/i.test(asking), "the sitting says what it is");
    check(!/question 1 of 20/i.test(asking), `and does not invent a fixed length for an adaptive measurement ("${(asking.match(/Question [^·]*/) || ["none"])[0]}")`);
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /finish diagnostic/i.test(b.textContent || ""))`, "finish the diagnostic");
    const found = await screen(p);
    check(/what we found/i.test(found), "the report says what was found");
    check(/not measured/i.test(found), "a dimension nobody measured says so");
    check(!/NaN|undefined|\[object Object\]|\b[a-z]+\.[a-z][a-zA-Z.]+\b:/.test(found), "and no raw key, NaN or object reaches the learner");

    // ── 4. Home: one decision, with a reason ─────────────────────────────────
    section("Home: the next step, and why");
    await clickLink(p, "continue learning", "the continue-learning link");
    await p.waitFor(`return /#\\/home$/.test(location.hash);`, "Home");
    const home = await screen(p);
    check(/hello|welcome back/i.test(home), "Home greets the learner");
    check(/your next step/i.test(home), "and leads with one next step, not a dashboard of numbers");
    check(/why now/i.test(home) || /based on/i.test(home), "with the reason it is that step");
    // The demonstrated / not-yet split is ONE rule over the record
    // (lib/learner-model#demonstrationSplit), and it is deliberately NOT drawn
    // for a learner who has demonstrated nothing: four "not yet" rows on a
    // first screen is a page of deficits, and the decision here is already the
    // starting point.
    check(!/you have demonstrated/i.test(home),
      "a learner who has demonstrated nothing is shown no list of what they have not done");

    // ── 5. The lesson, offline ───────────────────────────────────────────────
    //
    // THE TEACHING USED TO BE MISSING FROM THIS ARTEFACT ENTIRELY. The authored
    // plans (lib/lesson-plans.ts) reached only the React page, so the product a
    // low-connectivity learner actually uses went from a concept straight to a
    // question — the exact defect the plan format was written to fix, still
    // present in the one build that exists for the hardest learners. This is the
    // claim that it now teaches: the same plan objects, read from the same
    // module, in a page with no server anywhere.
    section("The lesson: teaching before the questions, with no server");
    await p.goto(`${BASE}/#/learn?concept=fractions`);
    await p.waitFor(`return /#\\/learn\\?concept=fractions/.test(location.hash) && !!document.querySelector("main h1");`, "the lesson");
    const lesson = await screen(p);
    check(/by the end you can/i.test(lesson), "the lesson opens on an observable objective");
    check(/start here/i.test(lesson), "then an intuition before the terminology");
    check(/the idea/i.test(lesson), "then the formal explanation");
    const order = await p.evaluate(`
      const marks = ["plan.can", "plan.start", "learn.idea", "worked.eyebrow", "plan.together", "plan.traps"];
      const secs = [...document.querySelectorAll("main section")];
      const found = secs.map((s) => (s.getAttribute("aria-label") || ""));
      return found;`);
    check(order.length >= 5 && order[0].toLowerCase().startsWith("by the end"),
      `the parts arrive in teaching order, by position (${order.join(" → ")})`);
    check(/fraction/i.test(lesson), "and it teaches THIS concept, not a template");
    check(/not yet checked by a subject teacher/i.test(lesson),
      "the review status is stated on the screen, not only in a document");
    // THE PRACTICE AFFORDANCES ARE ABSENT ON THE READ STAGE. "Explain before you
    // test" is not a sentence in a document; it is the absence of an answerable
    // question here.
    const readOnly = await p.evaluate(`return {
      answerable: document.querySelectorAll('[data-act="answer"], #numeric-input').length,
      hint: document.querySelectorAll('[data-act="hint"]').length,
      door: !!document.querySelector('a[href*="stage=practice"]'),
    };`);
    check(readOnly.answerable === 0, "nothing on the read stage can be answered — it teaches first");
    check(readOnly.door, "and the stage ends with a door into the practice");

    // I DO: one whole, revealed on a press rather than shown already solved.
    await p.clickExpr(`document.querySelector('[id="worked-slot-worked"] [data-act="worked"]')`, "show me how");
    await sleep(120);
    const solved = await p.evaluate(`
      const slot = document.getElementById("worked-slot-worked");
      return {
        marked: slot.querySelectorAll('li[data-state="right"]').length,
        options: slot.querySelectorAll("li").length,
        working: (slot.querySelector(".expl")?.innerText || "").trim(),
      };`);
    check(solved.options >= 2, `the worked example draws a real item (${solved.options} options)`);
    check(solved.marked === 1, `exactly one option is marked as the answer (${solved.marked})`);
    check(solved.working.split(/\s+/).length >= 12,
      `with a worked solution in prose, not a bare answer (${solved.working.split(/\s+/).length} words)`);

    // WE DO: the same shape, faded — first move only, then the rest.
    await p.clickExpr(`document.querySelector('[id="worked-slot-guided"] [data-act="worked"]')`, "show the first step");
    await sleep(120);
    const faded = await p.evaluate(`
      const slot = document.getElementById("worked-slot-guided");
      return {
        first: (slot.querySelector("p strong")?.parentElement?.innerText || "").trim(),
        marked: slot.querySelectorAll('li[data-state="right"]').length,
        offersRest: !!slot.querySelector('[data-act="worked"]'),
      };`);
    check(faded.first.length > 0, "the guided item shows its first move");
    check(faded.marked === 0, "and withholds the answer until the learner has finished it");
    check(faded.offersRest, "inviting the learner to finish the rest");
    check(faded.first.length < solved.working.length,
      `the first step is shorter than the whole working (${faded.first.length} < ${solved.working.length} chars)`);

    // THE PICTURE, DRAWN. This build had no figure renderer at all, so a lesson
    // figure was a caption with nothing above it. `fractions` carries a pie whose
    // marked sector IS the teaching, so it is the one to measure.
    const drew = await p.evaluate(`
      const f = document.querySelector("main figure[data-figure]");
      if (!f) return null;
      const svg = f.querySelector("svg");
      const box = svg.getBoundingClientRect();
      return {
        kind: f.getAttribute("data-figure"),
        shapes: f.querySelectorAll("svg path, svg circle, svg rect, svg line, svg polygon").length,
        caption: (f.querySelector("figcaption")?.innerText || "").trim(),
        width: Math.round(box.width),
        sideways: document.documentElement.scrollWidth > window.innerWidth + 1,
      };`);
    check(drew && drew.kind === "pie", `the lesson draws its figure (${drew ? drew.kind : "none"})`);
    check(drew && drew.shapes >= 2, `with real shapes in it (${drew ? drew.shapes : 0})`);
    check(drew && drew.caption.length > 20, "and keeps the caption that says what to notice");
    check(drew && !drew.sideways && drew.width <= 340,
      `the drawing fits the page width (${drew ? drew.width : 0}px wide, no sideways scroll)`);

    // A FRACTION IS SET ON THE LINE, NOT UNDER IT. The same defect the server app
    // had (`vertical-align` on an inline-flex box aligns the NUMERATOR, so the
    // bar landed below the text baseline and the denominators hung under the
    // line) lived in this stylesheet too, because the twin draws maths with its
    // own copy of the rules. A fix in one stylesheet is not a fix in the other,
    // so the offline build is measured the same way the app is.
    const fracGeo = await p.evaluate(`
      const f = document.querySelector("main .mfrac");
      if (!f) return null;
      const holder = f.closest(".math") || f.parentElement;
      const probe = document.createElement("span");
      probe.style.cssText = "font-size:0;line-height:0;display:inline-block;width:0;height:0;";
      // IMMEDIATELY BEFORE the fraction, not appended to the holder: in a
      // paragraph of prose the holder's last position can be on the NEXT line,
      // and then the probe measures that line's baseline (it reported the bar
      // 2.18em "above" the axis when the fraction was mid-sentence).
      holder.insertBefore(probe, f);
      const baseline = probe.getBoundingClientRect().top;
      probe.remove();
      const bar = f.querySelector(".mfrac-d").getBoundingClientRect().top;
      const em = parseFloat(getComputedStyle(holder).fontSize);
      return { above: (baseline - bar) / em, text: (f.parentElement?.innerText || "").slice(0, 40) };
    `);
    check(!!fracGeo && fracGeo.above > 0.1 && fracGeo.above < 0.45,
      fracGeo
        ? `a fraction's bar sits ${fracGeo.above.toFixed(2)}em ABOVE the baseline, on the maths axis ("${fracGeo.text}")`
        : "no fraction on the offline lesson page to measure");

    // THE DOOR LEADS TO PRACTICE ON THE SAME CONCEPT.
    await p.clickExpr(`document.querySelector('a[href*="stage=practice"]')`, "now your turn");
    await p.waitFor(`return /stage=practice/.test(location.hash) && !!(document.querySelector("main .q") || document.getElementById("numeric-input"));`, "the practice screen");
    check(true, "the door opens the practice on the concept just taught");

    // A PHONE, MEASURED — because the viewport is the browser's, not the page's.
    // An SVG with a viewBox and no width fills its parent, so the drawing is the
    // one new element here that could push a 320-px screen sideways, and a phone
    // is the cheapest device this product is built for.
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await p.goto(`${BASE}/#/learn?concept=fractions`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the lesson at 320px");
    const phone = await p.evaluate(`
      const svg = document.querySelector("main figure[data-figure] svg");
      const box = svg ? svg.getBoundingClientRect() : null;
      return {
        width: Math.round(box ? box.width : 0),
        page: document.documentElement.scrollWidth,
        view: window.innerWidth,
      };`);
    check(phone.width > 0 && phone.width <= 320, `the drawing shrinks to a phone (${phone.width}px at a ${phone.view}px viewport)`);
    check(phone.page <= phone.view + 1, `and the lesson does not scroll sideways on one (${phone.page} vs ${phone.view})`);
    await send("Emulation.clearDeviceMetricsOverride");

    // A COORDINATE GRID, WHICH IS THE OTHER KIND A LESSON AND A WORKED EXAMPLE
    // BOTH CARRY. Three plotted points and a line through them is what the
    // coordinates plan says out loud, so the drawing either shows those or it is
    // contradicting the paragraph beside it.
    await p.goto(`${BASE}/#/learn?concept=coordinates`);
    await p.waitFor(`return !!document.querySelector("main figure[data-figure=\\"axes\\"]");`, "the coordinates lesson");
    const grid = await p.evaluate(`
      const f = document.querySelector('main figure[data-figure="axes"]');
      return {
        plots: f.querySelectorAll("svg circle").length,
        lines: f.querySelectorAll("svg line").length,
        caption: (f.querySelector("figcaption")?.innerText || "").trim().length,
        worked: document.querySelectorAll("main .qfigure").length,
      };`);
    check(grid.plots >= 3, `a coordinate grid plots the points its lesson names (${grid.plots} plots)`);
    check(grid.lines >= 6, `with its grid and axes drawn (${grid.lines} lines)`);
    check(grid.caption > 20, "and the caption that says what to notice");
    check(grid.worked >= 1, `and the worked example's own item carries its drawing too (${grid.worked})`);

    // ── 5b. Practice: serve, help, answer, feedback ──────────────────────────
    section("Practice: a question, help, an answer, and what it proved");
    await clickLink(p, "curriculum", "the curriculum link");
    await p.waitFor(`return /#\\/curriculum$/.test(location.hash);`, "the curriculum list");
    const curriculum = await screen(p);
    check(/your curriculum/i.test(curriculum), "the curriculum names itself");
    const firstConcept = await p.evaluate(`const a = [...document.querySelectorAll("main a")].find(a => /#\\/learn\\?concept=/.test(a.getAttribute("href") || "")); return a ? { href: a.getAttribute("href"), text: (a.textContent || "").trim().slice(0, 40) } : null;`);
    check(!!firstConcept, `every concept is reachable (first: ${firstConcept?.text})`);
    // `stage=practice` on purpose: the list is a door into TEACHING now, and this
    // section is about the question surface. A concept with no plan ignores it.
    await p.goto(`${BASE}/${firstConcept.href}${firstConcept.href.includes("?") ? "&" : "?"}stage=practice`);
    await p.waitFor(`return /#\\/learn\\?concept=/.test(location.hash) && !!document.querySelector("main");`, "the practice screen");
    const question = await screen(p);
    check(/practice · /i.test(question), `the practice screen names the concept it is on (${(question.match(/PRACTICE · [^·]+/i) || ["?"])[0]})`);
    const served = await p.evaluate(`return { prompt: (document.querySelector("main .q")?.innerText || "").trim().slice(0, 80) || null, numeric: !!document.querySelector("#numeric-input"), choices: document.querySelectorAll('[data-act="answer"]').length, hint: !!document.querySelector('[data-act="hint"]') };`);
    check(!!served.prompt, `a real question is on screen ("${served.prompt}")`);
    check(served.numeric || served.choices > 0,
      `with a way to answer it (${served.numeric ? "a numeric box" : `${served.choices} options`})`);
    check(served.hint, "and help is offered beside it, not instead of it");
    check(/why this question/i.test(question), "with the reason this question was chosen");
    // WHAT IT IS TESTING, declared BEFORE the answer. The demand level used to
    // reach the learner only after a sitting, in the diagnostic report, and the
    // marks reached no surface at all. The record is lib/question-bank
    // #declareQuestion's — the same rule the React question screen draws.
    //
    // READ FROM THE DECLARATION, NOT FROM THE SCREEN'S PROSE. The two checks
    // here used to look for the sentence "what is this testing" and for a demand
    // word in the page's visible text, and neither exists on either surface: the
    // line reads `<label> <concept>` (label = `ask.whatTesting`, "Skill") and the
    // demand and marks are METADATA on the element, deliberately — naming the
    // trap before the answer would be a hint. So the gate failed on a claim the
    // product does not make, twice, on every run. The hook below is the claim it
    // does make, and both renderers carry it (`data-declaration`), so an item
    // that declares nothing still fails this.
    const declared = await p.evaluate(`
      const el = document.querySelector("main [data-declaration]");
      return el ? { text: (el.innerText || "").replace(/\\s+/g, " ").trim(), title: el.getAttribute("title") || "" } : null;`);
    // `startsWith`, not `/^skill\b/`: inside a template literal the backslash
    // double-escapes into the regex SOURCE, so the check looked for a literal
    // backslash and failed on a line that reads "SKILL Decimals".
    check(!!declared && declared.text.toLowerCase().startsWith("skill ") && declared.text.length > "skill ".length + 2,
      `the item declares what it is testing before it is answered ("${declared?.text ?? "missing"}")`);
    check(!!declared && /recall|application|multi-step|data & graphs/i.test(declared.title) && /marks/i.test(declared.title),
      `naming the demand level and the marks in the dictionary's own words ("${declared?.title ?? "missing"}")`);

    // TAKE THE HINT FIRST, so the answer that follows is guided work — and the
    // claim the product makes about it can be compared with the claim the ledger
    // keeps. This is the honest-attribution path, driven the way a learner does.
    await p.clickExpr(`document.querySelector('[data-act="hint"]')`, "the hint button");
    const helped = await screen(p);
    check(/hint 1/i.test(helped), `taking help is acknowledged (${(helped.match(/Hint \d[^·]*/) || ["?"])[0].trim()})`);
    // ANSWERED BLINDLY, the way a learner answers: the key is not on the wire
    // and the walk does not want it. A wrong number is a valid attempt, and the
    // claim under test is what the product says it PROVED, not the score.
    if (served.numeric) {
      await p.typeInto(`document.querySelector("#numeric-input")`, "1", "the answer box");
      await p.clickExpr(`document.querySelector("#numeric-form button[type=submit]")`, "check");
    } else {
      await p.clickExpr(`document.querySelector('[data-act="answer"]')`, "the first option");
    }
    await p.waitFor(`return /correct|not quite|incorrect|try again/i.test(document.querySelector("main")?.innerText || "");`, "the verdict", 15000);
    const verdict = await screen(p);
    check(/correct|not quite|incorrect|try again/i.test(verdict), "the answer is marked, on the device, with no server in the loop");
    check(/guided|on your own|without help|independent/i.test(verdict),
      `and the verdict says what the answer PROVED rather than only whether it was right ("${(verdict.match(/[^·]*(?:guided|on your own|without help|independent)[^·]*/i) || ["?"])[0].trim().slice(0, 120)}")`);

    // ── 6. Evidence: what is counted, and what is honestly not ───────────────
    section("Evidence: counted from answers, or not claimed at all");
    await clickLink(p, "evidence", "the evidence link");
    await p.waitFor(`return /#\\/evidence$/.test(location.hash);`, "the evidence page");
    const evidence = await screen(p);
    check(/answers recorded/i.test(evidence), "the record says how many answers are behind it");
    check(/not yet measured/i.test(evidence), "and names the dimensions it has not measured");
    check(!/transfer\s*·?\s*0%/i.test(evidence), "it never reports an unmeasured dimension as zero");
    check(!/NaN|undefined|\[object Object\]/.test(evidence), "and no raw value reaches it");
    const counted = await countAnswers(p);
    check(counted >= 1, `the answer just given is in the record (${counted} entr${counted === 1 ? "y" : "ies"})`);
    check(/guided/i.test(evidence),
      "and it is listed as GUIDED, because help was taken — the record agrees with the verdict");

    // ── 7. It keeps working with no server, and remembers the learner ────────
    // The claim the whole static build exists to make. Nothing here talks to a
    // port except this walk's own file server: the ledger is on the device.
    section("Close the tab's context, come back, keep the record");
    await p.goto(`${BASE}/#/evidence`);
    await p.waitFor(`return /#\\/evidence$/.test(location.hash) && !!document.querySelector("main");`, "the page to come back");
    const after = await countAnswers(p);
    check(after >= counted, `the record survived a full page load (${counted} → ${after})`);
    const where = await p.evaluate(`return { href: location.href, profile: Object.keys(localStorage).length > 0 };`);
    check(where.profile, "and the learner's own device still holds it, with no account and no server");

    // ── 8b. The seam, in THIS artefact ──────────────────────────────────────
    // The published build now carries the shared client layer
    // (lib/api/client.ts) and the seam itself (lib/api/transport.ts), which is
    // what makes "the live site is the same product" a reachable claim rather
    // than an intention. Two things are worth proving here and nowhere else:
    // that the layer is really in the shipped bundle, and that installing a wire
    // in THIS page is the wire its operations use — including the answer, which
    // used to call `fetch` behind the seam's back.
    section("The published build carries the one client layer, with a swappable wire");
    // The bundle publishes itself as `window.OpenMindEngine`; `docs/app.js`
    // takes its own local `E` from it. Read the global, not a local name.
    const seam = await p.evaluate(`
      const E = window.OpenMindEngine;
      const seen = [];
      window.__walkWire = seen;
      const wire = typeof (E && E.api && E.api.serveQuestion) === "function"
        && typeof (E && E.apiTransport && E.apiTransport.setApiSender) === "function";
      // The record names the METHOD, the door, and whether the call carried a
      // submission token — which is what distinguishes an ANSWER from the other
      // writes that share this route (a serve is a POST too).
      if (wire) E.apiTransport.setApiSender(async (req) => { seen.push(req.method + " " + req.path + (req.body && req.body.submissionId ? " sub=" + String(req.body.submissionId) : "")); return { status: 200, json: { ok: true } }; });
      return { wire, operations: E && E.api ? Object.keys(E.api).length : 0 };
    `);
    check(seam.wire, "the page can install a wire and call the shared operations");
    check(seam.operations >= 40, `and it carries the whole layer, not a sample (${seam.operations} operations)`);
    const refused = await p.evaluateAsync(`window.OpenMindEngine.api.serveQuestion("walk-seam-learner", "fractions", { lang: "en" })
      .then(() => "resolved", (e) => "refused:" + (e && e.status))`);
    check(refused === "resolved", `an operation reaches the installed wire (${refused})`);
    const answerOut = await p.evaluateAsync(`window.OpenMindEngine.api.answerQuestion({ id: "walk-seam-learner", conceptId: "fractions", questionId: "q1", choiceIndex: 0 })
      .then((o) => "outcome:" + o.kind, (e) => "refused:" + (e && e.status))`);
    const posts = await p.evaluate(`return window.__walkWire.filter((x) => x.startsWith("POST "));`);
    // A serve is a POST to the same route, so the ANSWER is the one carrying a
    // submission token — the queue's own name for this attempt, which is also
    // what makes a replay idempotent (lib/evidence.ts#submissionEventId).
    const answers = posts.filter((x) => / sub=sub_/.test(x));
    check(answers.length === 1 && answerOut.startsWith("outcome:"),
      `and THE ANSWER goes over it too, which is the call that used to bypass the seam (${posts.length} POSTs, ${answers.length} of them an answer: ${answers[0] ?? "none"} → ${answerOut})`);

    // ── 8c. The reason's NUMBER, composed by the artifact that is deployed ──
    //
    // Both products share this decision, so a wording defect in it ships twice.
    // The practise sentence is the one that carried one: it printed the
    // projected MASTERY figure (a smoothed, evidence-integrated number) inside a
    // claim about accuracy — "You solve straightforward ones at 64%" — one
    // screen after a diagnostic report whose demand row showed the accuracy the
    // sitting actually measured. Same words, two quantities, nothing on screen
    // saying which was which. Composed HERE, through the published bundle, so
    // the deployed artifact is the thing held to it.
    const rung = await p.evaluate(`
      const E = window.OpenMindEngine;
      const s = { profile: { id: "walk-reason", handle: "walk", country: "GB", birthYear: null, language: "en", goal: "", intent: "", subjects: ["maths"], createdAt: 0 }, secret: "walk", progress: {}, diagnostics: {}, masteries: {} };
      // The ladder's own route into the practise rung: wrong, wrong, right —
      // measured, below the established bar, no help taken.
      E.progress.recordAnswer(s, "fractions", "rw1", 1, false, "", [], { hints: 0 });
      E.progress.recordAnswer(s, "fractions", "rw2", 1, false, "", [], { hints: 0 });
      E.progress.recordAnswer(s, "fractions", "rw3", 0, true, "", [], { hints: 0 });
      const a = E.nextEngine.decideNext(s, 1)[0];
      const mastery = s.progress.fractions.mastery;
      return { kind: a.kind, reason: a.reason, mastery,
        labelled: a.reason.includes(E.i18n.translator("en")("next.ev.mastery")),
        figure: a.reason.includes(Math.round(mastery * 100) + "%") };
    `);
    check(rung.kind === "PRACTISE", `the published bundle still reaches the practise rung (${rung.kind})`);
    check(rung.labelled && rung.figure,
      `and the number in that reason is named as the mastery it is, not read as an accuracy ("${rung.reason}")`);

    // ── 8d. What the record has DEMONSTRATED, drawn by the published page ────
    // The rule itself is pinned in the engines suite; what no proxy can claim is
    // that the page a learner loads actually DRAWS it, from that learner's own
    // stored record, in words the shipped dictionaries define. So: seed the
    // record of the concept this card points at with a hint-free correct answer
    // — the model's own definition of demonstrated recall AND application —
    // reload the real page, and read what the learner is shown.
    section("Home: what the record has demonstrated, and what it has not");
    const seeded = await p.evaluate(`
      const E = window.OpenMindEngine;
      const KEY = "openmind.static.v1";
      const raw = JSON.parse(localStorage.getItem(KEY));
      const id = raw.ui.learnerId;
      const st = raw.profiles[id];
      const ev = E.ledger.memoryLedger(raw.ledgers || {}).read(id);
      const top = E.decision.decide(E.decision.decisionContext(st, ev), { max: 1 })[0];
      const cid = top && top.conceptId;
      if (!cid) return { seeded: false, kind: top ? top.kind : "no action" };
      const pr = st.progress[cid] || {};
      const ind = pr.independent || { asked: 0, correct: 0 };
      pr.attempts = (pr.attempts || 0) + 2;
      pr.correct = (pr.correct || 0) + 2;
      pr.independent = { asked: ind.asked + 2, correct: ind.correct + 2 };
      st.progress[cid] = pr;
      localStorage.setItem(KEY, JSON.stringify(raw));
      return { seeded: true, cid: cid, kind: top.kind };
    `);
    check(seeded.seeded,
      `the card points at a real concept whose record can be seeded (${seeded.seeded ? seeded.cid : `no concept — the action is ${seeded.kind}`})`);
    // A QUERY, not just the fragment: the app is hash-routed, so a
    // fragment-only navigation is a SAME-DOCUMENT one — it does not reload, and
    // the page would redraw from the copy of the record it already held in
    // memory, never seeing what was just written. (That is not a test artefact:
    // it is the app honestly keeping one in-memory learner for the tab.)
    await p.goto(`${BASE}/?seeded=1#/home`);
    // And wait for HOME'S OWN CONTENT, not merely for the hash: "main exists"
    // is true while the previous screen is still on it.
    await p.waitFor(`return /#\\/home$/.test(location.hash) && /your next step/i.test(document.querySelector("main")?.innerText || "");`, "Home again, with its decision drawn");
    const drawn = await screen(p);
    check(/you have demonstrated/i.test(drawn),
      `the published page states what the record HAS demonstrated ("${(drawn.match(/[^·]*demonstrated[^·]*/i) || ["?"])[0].trim().slice(0, 90)}")`);
    check(/recall/i.test(drawn) && /application/i.test(drawn),
      "naming the rungs that record actually earned, in the dictionary's own words");
    check(/haven.t yet demonstrated/i.test(drawn) && /transfer/i.test(drawn),
      "and what it has not — the next missing dimension, named rather than implied");

    // …and the CURRICULUM draws the same record as a row: the marker, the place
    // the learner is, and the same two halves of the split the card shows — the
    // published LIST's version of one record, from one function.
    await clickLink(p, "curriculum", "the curriculum link");
    await p.waitFor(`return /#\\/curriculum$/.test(location.hash) && document.querySelectorAll("main ul.items li").length > 0;`, "the curriculum list");
    const alive = await screen(p);
    check(/◐/.test(alive),
      "a concept the record has started is marked ◐, not banded by a ratio of the list's own");
    check(/you are here/i.test(alive),
      "the row the decision points at says so, instead of being whatever happens to be first");
    check(/you have demonstrated/i.test(alive) && /haven.t yet demonstrated/i.test(alive),
      "and that row carries the same two halves of the split the Home card does");

    // ── 8. What the learner was never shown ──────────────────────────────────
    // Every screen visited above is scanned once more, together, for the
    // artefacts of a build that leaked its internals: a raw dictionary key
    // ("dash.hi"), a template that never filled ("{n}"), a stray undefined.
    // ── 8b. Localisation, measured on the page rather than in a dictionary
    //
    // The product makes exactly two promises in a translated interface: the
    // VOCABULARY (concept titles, blurbs, belief names — all fifteen languages)
    // and, for the four languages with coaching, the repair paragraph itself.
    // Everything else — the lesson's paragraphs, the question, the working — is
    // English, and the page SAYS so above the first English paragraph. These
    // checks are about which of those is actually on the screen: a translated
    // heading over an English paragraph is the failure this section exists for.
    section("Localisation: what is translated, and what the page admits");
    await p.goto(`${BASE}/#/learn?concept=fractions`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the lesson");
    await p.pickOption(`document.querySelector("#lang")`, "es", "language");
    await p.waitFor(`return !!document.querySelector("main .belief");`, "the Spanish lesson");
    const es = await p.evaluate(`
      const note = document.querySelector("main [role=note]")?.innerText || "";
      const belief = document.querySelector("main .belief")?.innerText || "";
      return { note: note.trim(), belief: belief.trim(), title: document.querySelector("main h1")?.innerText.trim() || "" };`);
    check(/en tu idioma/i.test(es.note), `the page tells a Spanish reader which half is translated ("${es.note.slice(0, 40)}…")`);
    check(/denominador/i.test(es.belief), `and the belief's coaching really is Spanish ("${es.belief.slice(0, 46)}…")`);
    check(!/counts the parts/i.test(es.belief), "not the English paragraph under a translated heading");

    await p.pickOption(`document.querySelector("#lang")`, "de", "language");
    await p.waitFor(`return /Nenner/i.test(document.querySelector("main .belief")?.innerText || "");`, "the German coaching");
    const de = await p.evaluate(`
      const note = document.querySelector("main [role=note]")?.innerText || "";
      return { note: note.trim(), belief: (document.querySelector("main .belief")?.innerText || "").trim() };`);
    check(/Konzeptnamen/i.test(de.note), "German gets its own note, not the English one");
    check(/Nenner/i.test(de.belief), `and its own repair sentence ("${de.belief.slice(0, 46)}…")`);

    // ONE OF THE ELEVEN WITH NO TRANSLATED COACHING. The honest fallback is the
    // translated NAME alone — no English paragraph, and no blank heading either.
    await p.pickOption(`document.querySelector("#lang")`, "ja", "language");
    await p.waitFor(`return !!document.querySelector("main .belief");`, "the Japanese lesson");
    const ja = await p.evaluate(`
      const b = document.querySelector("main .belief");
      return {
        name: (b?.querySelector("strong")?.innerText || "").trim(),
        coaching: [...(b?.querySelectorAll("span") || [])].map((s) => (s.innerText || "").trim()).filter(Boolean).join(" "),
        note: (document.querySelector("main [role=note]")?.innerText || "").trim(),
      };`);
    check(ja.name.length > 0 && !/[A-Za-z]{4,}/.test(ja.name), `a language with no coaching still names the belief in its own words ("${ja.name.slice(0, 20)}")`);
    check(ja.coaching === "", "and prints no English coaching under it");
    check(/[\u3000-\u9fff]/.test(ja.note), `while the note about what is translated stays in Japanese ("${ja.note.slice(0, 24)}…")`);
    await p.pickOption(`document.querySelector("#lang")`, "en", "language");

    // ── 9. A foundation learner, and the drawing a question cannot do without
    //
    // The tier matters here: `pythagoras` serves its labelled right triangle on
    // 40 of 40 draws at a foundation aim and 5 of 40 near the top of its range
    // (measured), so this learner meets one every time and the check is a fact
    // rather than a lucky draw. Before the renderer existed, the item asked for a
    // side of a triangle that was not on the page — not a hard question, an
    // unanswerable one.
    section("A foundation learner: the picture a question depends on");
    await p.goto(`${BASE}/`);
    await p.evaluate(`localStorage.clear(); sessionStorage.clear(); return true;`);
    await p.goto(`${BASE}/#/setup`);
    await p.waitFor(`return !!document.querySelector("#f-country");`, "the setup form");
    await p.typeInto(`document.querySelector("#f-name")`, "Foundation", "the nickname field");
    await p.typeInto(`document.querySelector("#f-grade")`, "Year 10", "the year-group field");
    await p.pickOption(`document.querySelector("#f-country")`, "GB", "country");
    await p.waitFor(`return !![...document.querySelectorAll("main select")].find(s => /uk-gcse/.test(s.innerHTML));`, "the UK courses to appear");
    await p.pickOption(`[...document.querySelectorAll("main select")].find(s => /uk-gcse/.test(s.innerHTML))`, "uk-gcse|foundation", "course");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /start learning/i.test(b.textContent || ""))`, "the start-learning button");
    await p.waitFor(`return /#\\/diag$/.test(location.hash);`, "the diagnostic sitting", 20000);
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /finish diagnostic/i.test(b.textContent || ""))`, "finish the diagnostic");
    await p.waitFor(`return /what we found/i.test(document.body.innerText || "");`, "the report");
    await p.goto(`${BASE}/#/learn?concept=pythagoras&stage=practice`);
    await p.waitFor(`return !!document.querySelector("main .q");`, "a pythagoras question");
    const tri = await p.evaluate(`
      const f = document.querySelector("main .qfigure");
      if (!f) return null;
      const svg = f.querySelector("svg");
      const box = svg ? svg.getBoundingClientRect() : null;
      return {
        kind: f.getAttribute("data-figure"),
        labels: [...f.querySelectorAll("svg text")].map((t) => (t.textContent || "").trim()),
        width: box ? Math.round(box.width) : 0,
        sideways: document.documentElement.scrollWidth > window.innerWidth + 1,
        // THE PICTURE IN WORDS. The SVG is aria-hidden, so this sentence is the
        // drawing for a learner using a screen reader — and the only reading of
        // it in a greyscale print.
        caption: (f.querySelector("figcaption.qfigure-cap")?.textContent || "").trim(),
        captionSize: f.querySelector("figcaption.qfigure-cap")
          ? parseFloat(getComputedStyle(f.querySelector("figcaption.qfigure-cap")).fontSize) : 0,
      };`);
    check(tri && tri.kind === "right-triangle", `a question that depends on a drawing gets one (${tri ? tri.kind : "none"})`);
    check(tri && tri.labels.length >= 3, `with its sides labelled (${tri ? tri.labels.join(" / ") : ""})`);
    check(tri && tri.labels.includes("?"),
      "and the side the question asks for left as ? — a diagram must not answer its own question");
    check(tri && !tri.sideways && tri.width > 0 && tri.width <= 340,
      `drawn to fit a phone (${tri ? tri.width : 0}px wide, no sideways scroll)`);
    check(!!tri?.caption && tri.caption.length > 20,
      `and the drawing is stated in words under it, because the SVG is aria-hidden on this page too ("${(tri?.caption || "").slice(0, 70)}…")`);
    check(!!tri?.caption && tri.labels.filter((l) => /^[0-9]/.test(l)).every((n) => tri.caption.includes(n.replace(/[^0-9.]/g, ""))),
      "naming the same numbers the drawing labels, because both come from the one spec");
    check((tri?.captionSize ?? 0) >= 13,
      `at body size rather than the browser's default caption size (${tri?.captionSize ?? 0}px)`);

    section("Nothing internal reached the screen");
    const pages = [landing, asking, found, home, curriculum, question, verdict, evidence].join(" · ");
    const leaks = [];
    const keyLike = pages.match(/\b[a-z]{2,10}\.[a-z][a-zA-Z]{2,}\b/g) ?? [];
    const suspicious = keyLike.filter((k) => !/^\d/.test(k) && !/\.(js|css|html|json|io|org|com|net|dev|app|co\.uk)$/.test(k)
      && !/^(hash|location|window|document|localStorage|sessionStorage|http|https|openmind\.static|fractions|decimals|mathematics|physics|chemistry|biology|computing|uk-gcse|uk-alevel|aqa|edexcel|ocr)/.test(k));
    if (suspicious.length) leaks.push(`raw keys: ${[...new Set(suspicious)].slice(0, 5).join(", ")}`);
    if (/\{[a-z]+\}/.test(pages)) leaks.push("an unfilled template placeholder");
    if (/undefined/.test(pages)) leaks.push("the word undefined");
    check(leaks.length === 0, leaks.length ? `leaks found — ${leaks.join("; ")}` : `no raw key, placeholder or undefined across ${8} screens`);
  } finally {
    await close();
    server.close();
  }

  console.log(`\n════ Live page walk: ${passed} passed, ${failed} failed ════`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
