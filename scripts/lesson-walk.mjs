#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE LESSON WALK — the pilot's teaching experience, in a real browser.
//
// WHY THIS EXISTS. Everything the pilot promised was, until now, checked by
// reading compiled modules: the plan has four paragraphs, the figure's cells are
// the terms they label, the repair exists for this slip. All of that is true and
// none of it is the same claim as "a learner opening this page reads a lesson".
// The failure modes a module test cannot see are the ones a learner sees first:
// a figure that overflows a 320-px screen, two labels on top of each other, a
// worked example rendered as a wall because the CSS that breaks it into
// paragraphs matched nothing, a repair card that never paints because the
// condition guarding it is false for the record the UI itself created.
//
// WHAT IT DOES. It drives Chrome through the DevTools Protocol with REAL input
// (the shared harness in scripts/browser.mjs — no Playwright, no new
// dependency) and:
//
//   1. enrols a fresh learner and chooses a maths course, because every learning
//      surface refuses a learner with none;
//   2. opens EVERY authored lesson (the FIGURED list below, cross-checked against
//      planFor by `npm run verify`) and MEASURES it at 1280×900 and at 320×640:
//      the drawing inside its box and the viewport, labels above 9 px, no two
//      overlapping, no sideways scroll — and, for the lessons whose plan
//      deliberately carries no drawing, the 320-px width check on its own, since
//      those are the prose-heavy lessons and a page that scrolls sideways is the
//      same defect with nothing to blame it on;
//   3. asserts the read stage's ORDER — objective → intuition → figure → idea →
//      worked → we-do → traps → door — because "teaches before it tests" is an
//      order, not a list of components that exist;
//   4. presses "Show me how" and requires the working to appear, then "Show the
//      first step" and requires the fade to be SHORTER than the whole;
//   5. answers a coordinates question wrong until one arrives carrying an
//      author-written note, and requires that note AND the repair card to paint;
//   6. reopens the lesson and requires it to open on the slip the practice just
//      made, with the count towards retirement printed from the model;
//   7. switches the interface to Spanish AND then German through the real picker
//      and requires the coaching paragraph under a misconception name to be in
//      that language — and the lesson to say, in it, what is translated.
//
// There is a tenth claim it deliberately does NOT make: "this teaches well".
// That needs learners. It distinguishes the review states on screen
// (`plan.unreviewed`) and reports them rather than dressing them up.
//
//   npm run verify:lesson            (with the dev server up on 4173)
//
// Optional env: LESSON_WALK_BASE (default http://127.0.0.1:4173), CHROME_BIN,
//               LESSON_WALK_SHOTS=0 to skip screenshots.
//
// Screenshots go to screenshots/lesson-walk/. They are evidence, not a gate:
// the assertions are what fail the run.
// ─────────────────────────────────────────────────────────────────────────────
import { pageFor, launchChrome, sleep } from "./browser.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.LESSON_WALK_BASE ?? "http://127.0.0.1:4173";
const PORT = 9333 + Math.floor(Math.random() * 600);
const SHOTS = process.env.LESSON_WALK_SHOTS !== "0";
const SHOT_DIR = "screenshots/lesson-walk";

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

/** EVERY authored lesson, and the figure its plan declares — `null` where the
 *  plan has decided a drawing would decorate rather than teach (decimals says so
 *  in its own comment: a pie of 0.45 shows that almost half is shaded and never
 *  explains why 0.45 < 0.5, which is the thing being taught). A plan that gains
 *  or loses a figure shows up here as a mismatch rather than being skipped, and a
 *  lesson added to lib/lesson-plans.ts without a row here is a lesson no walk
 *  measures — which is why the suite cross-checks the list against planFor. */
const FIGURED = [
  ["decimals", null],
  ["fractions", "pie"],
  ["fraction-ops", "pie"],
  ["percentages", null],
  ["negatives", "number-line"],
  ["order-ops", null],
  ["algebra-expressions", "rectangle"],
  ["coordinates", "axes"],
  ["algebra-expand", "rectangle"],
  ["straight-lines", "axes"],
  ["completing-square", "rectangle"],
  ["quadratics", "axes"],
  ["surds", "surd-square"],
  ["indices-intro", null],
  ["linear-equations", "balance"],
];

/** Every kind the figure union declares. A plan may only draw one of these. */
const KINDS = ["axes", "pie", "right-triangle", "number-line", "balance", "rectangle", "surd-square"];

async function main() {
  try {
    const r = await fetch(BASE, { method: "GET" });
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`The app is not answering at ${BASE}. Start it first:  npm run dev`);
    process.exit(2);
  }
  if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });

  const { send, close } = await launchChrome({ port: PORT });
  const base = pageFor(send);
  const p = { ...base, pick: base.pickOption };

  /** NAVIGATE, AND DO NOT ACCEPT AN EMPTY DOCUMENT AS A PAGE.
   *
   * A cold `next dev` compiles a route when it is first asked for, and the first
   * navigation of a run occasionally landed on a document with no `main` at all
   * while the compile finished — which reported as "the wizard never appeared"
   * on a page that answers 200 to curl a second later. `readyState` was
   * `complete` for that empty document, so the wait after it timed out against a
   * blank tree. Three attempts, and a page only counts when it has a body. */
  const goto = async (url) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await p.goto(url);
      try {
        if (await p.evaluate(`return document.readyState === "complete" && !!document.querySelector("body > *");`)) return;
      } catch { /* mid-navigation */ }
      await sleep(900);
    }
  };

  /** A viewport is a measurement, not a decoration: the 320 pass is the one
   *  that finds a drawing wider than the phone it is meant for. */
  const viewport = async (width, height) => {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    await sleep(200);
  };
  const shot = async (name) => {
    if (!SHOTS) return;
    const r = await send("Page.captureScreenshot", { format: "png" });
    if (r?.data) writeFileSync(`${SHOT_DIR}/${name}.png`, Buffer.from(r.data, "base64"));
  };

  // A label's OWN text, not everything inside it (a select's options would
  // otherwise join the label) — the same rule scripts/ui-walk.mjs uses.
  const labelWith = (text) => `[...document.querySelectorAll("main label")].find(l => { const span = l.querySelector(":scope > span"); const own = span ? span.textContent.trim() : (l.textContent || "").trim(); return own === ${JSON.stringify(text)}; })`;
  const selectUnder = (labelText) => `${labelWith(labelText)}?.querySelector("select")`;
  const buttonMatching = (re) => `[...document.querySelectorAll("main button")].find(b => ${re}.test(b.textContent || ""))`;
  const door = buttonMatching("/Now your turn/");

  /** Every number below is read off the rendered DOM, never inferred from the
   *  spec that produced it. */
  const measureFigure = () => p.evaluate(`
    const fig = document.querySelector("figure.lesson-figure");
    const svg = fig?.querySelector("svg");
    if (!svg) return { missing: true };
    const box = svg.getBoundingClientRect();
    const texts = [...svg.querySelectorAll("text")].map((el) => {
      const r = el.getBoundingClientRect();
      return { text: (el.textContent || "").trim(), x: r.x, y: r.y, w: r.width, h: r.height, size: parseFloat(getComputedStyle(el).fontSize || "0") };
    });
    const overlaps = [];
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i], b = texts[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 1 && oy > 1) {
          const smaller = Math.min(a.w * a.h, b.w * b.h) || 1;
          if ((ox * oy) / smaller > 0.2) overlaps.push(a.text + " × " + b.text);
        }
      }
    }
    return {
      box: { x: box.x, y: box.y, w: box.width, h: box.height },
      hidden: svg.getAttribute("aria-hidden"),
      caption: (fig.querySelector("figcaption")?.textContent || "").trim(),
      texts, overlaps,
      pageScroll: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  `);

  /** WHICH ELEMENT IS WIDER THAN THE SCREEN.
   *
   * "333 vs 320" is a true measurement and a useless one: the next run has to
   * find the offending element all over again. The deepest overflowing node is
   * the cause (its ancestors are the symptom), so the failure names it. */
  const offenders = async () => {
    const bad = await p.evaluate(`
      const W = window.innerWidth;
      const depth = (el) => { let n = 0, e = el; while (e.parentElement) { n++; e = e.parentElement; } return n; };
      const describe = (el) => {
        const cls = el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className;
        return { tag: el.tagName.toLowerCase(), cls: String(cls).slice(0, 44), d: depth(el), text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 44) };
      };
      const wide = [];   // a box whose right edge is past the screen
      const spill = [];  // a box whose CONTENT is wider than the box (nowrap text)
      // THE WHOLE BODY, not just main: the shell (topbar, nav, sticky bars) is as
      // capable of pushing a phone's page sideways as the lesson is, and
      // "nothing inside main is wider" is a dead end worth not hitting twice.
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > W + 1) wide.push({ ...describe(el), right: Math.round(r.right), w: Math.round(r.width) });
        // A nowrap sentence overflows its CONTAINER by ink, not by layout: every
        // rect stays inside 320 and the page still scrolls 13 px. That is the
        // signature, and it is the case that reported "nothing is wider".
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "hidden") {
          spill.push({ ...describe(el), over: el.scrollWidth - el.clientWidth });
        }
      }
      wide.sort((a, b) => b.d - a.d);
      spill.sort((a, b) => b.over - a.over);
      return { wide: wide.slice(0, 3), spill: spill.slice(0, 3) };
    `);
    const fmt = (b, extra) => `<${b.tag}${b.cls ? ` class="${b.cls}"` : ""}> ${extra} "${b.text}"`;
    return [
      ...((bad?.wide ?? []).map((b) => fmt(b, `to ${b.w}px ends at ${b.right}`))),
      ...((bad?.spill ?? []).map((b) => fmt(b, `content ${b.over}px wider than its box`))),
    ];
  };

  /** Open a concept's practice: the read stage's own door, pressed for real.
   *
   * A served item is not always four options — the numeric layer asks the learner
   * to PRODUCE the answer — so this waits for either control and reports which.
   * Waiting only for `.choices` timed out on a numeric draw and read as "the
   * practice is broken". */
  const openPractice = async (concept) => {
    await goto(`${BASE}/learn/maths/${concept}`);
    await p.waitFor(`return !!${door};`, `the ${concept} read stage to offer its practice door`, 30000);
    await p.clickExpr(door, `the practice door on ${concept}`);
    await p.waitFor(`return !!document.querySelector("main .choices button") || !!document.querySelector("main .numeric-input");`, `a served ${concept} question`, 30000);
    return p.evaluate(`return document.querySelector("main .numeric-input") ? "numeric" : "choice";`);
  };

  /** WHICH ELEMENT IS PUSHING THE PAGE WIDER — measured, not guessed.
   *
   * When no element's right edge is past the screen, the overflow is being made
   * by something subtler (a nowrap line, a fixed bar), and "nothing is wider" is
   * a diagnostic that costs a whole run to get past. So the failure HIDES each
   * candidate in turn and reports which one, removed, brings the page back to the
   * width of the screen. */
  const isolate = async () => {
    const r = await p.evaluate(`
      const W = window.innerWidth;
      const start = document.documentElement.scrollWidth;
      const trials = [];
      for (const sel of [".topbar-where", ".context-strip", ".dims", ".topbar", ".sidebar", ".bottomnav", "figure.lesson-figure", "main"]) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const prev = el.style.display;
        el.style.display = "none";
        const now = document.documentElement.scrollWidth;
        el.style.display = prev;
        if (now <= W + 1) trials.push(sel);
      }
      return { start, inner: W, culprits: trials };
    `);
    return r.culprits?.length
      ? `hiding ${r.culprits.join(" or ")} brings it back to ${r.inner}`
      : `no single candidate explains ${r.start - r.inner}px of overflow`;
  };

  try {
    // ── 1. A learner, and a course ───────────────────────────────────────────
    section("A fresh learner enrols and chooses a maths course");
    await goto(`${BASE}/onboarding`);
    await p.evaluate(`localStorage.clear(); sessionStorage.clear(); return true;`);
    await goto(`${BASE}/onboarding`);
    // The first page of a cold `next dev` is compiled on demand, so this one
    // wait is generous: a 20-second ceiling here would blame the product for the
    // compiler's first route.
    await p.waitFor(`return !!document.querySelector("main h1");`, "the wizard", 90000);
    await p.clickExpr(labelWith("Continue without an account"), "the continue-without-an-account choice");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the account step");
    await p.waitFor(`return !!${selectUnder("Where you are")};`, "the about step");
    await p.typeInto(`document.querySelector("main input[type=text]")`, "lesson_walk", "the display-name field");
    await p.pick(selectUnder("Where you are"), "GB", "country");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the about step");
    await p.waitFor(`return !!${labelWith("Mathematics")};`, "the subject step");
    await p.clickExpr(`${labelWith("Mathematics")}?.querySelector("input")`, "the Mathematics subject");
    await p.clickExpr(buttonMatching("/(Next|Start learning)/"), "Next on the subject step");

    await p.waitFor(`return location.pathname === "/curriculum";`, "the course screen", 30000);
    check(true, "enrolment lands on the course screen, where a course can be explained");
    await p.waitFor(`return !!document.querySelector("#curr-spec");`, "the qualification select");
    const specs = await p.evaluate(`return [...document.querySelector("#curr-spec").options].map(o => ({ value: o.value, text: (o.textContent || "").trim() }));`);
    const gbSpec = specs.find((o) => /gcse/i.test(o.value) && /mathematics/i.test(o.text))?.value
      ?? specs.find((o) => /gcse/i.test(o.value))?.value ?? specs.find((o) => o.value)?.value;
    await p.pick(`document.querySelector("#curr-spec")`, gbSpec, "the maths qualification");
    await p.waitFor(`return !!document.querySelector("#curr-level");`, "the tier select");
    const tiers = await p.evaluate(`return [...document.querySelector("#curr-level").options].map(o => o.value).filter(Boolean);`);
    const tier = tiers.includes("foundation") ? "foundation" : tiers[0];
    await p.pick(`document.querySelector("#curr-level")`, tier, "the maths tier");
    await p.waitFor(`return [...(${selectUnder("Your grade level")}?.options ?? [])].some(o => o.value === "Year 10");`, "the year groups");
    await p.pick(selectUnder("Your grade level"), "Year 10", "year group");
    await p.clickExpr(buttonMatching("/Save my course/"), "Save my course");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the save to confirm", 15000);
    check(true, `a learner with a ${tier} maths course exists, which is what the learning surfaces require`);

    // ── 2. Every figured lesson, measured at both widths ─────────────────────
    section("Every pilot figure, measured at 1280 and at 320");
    const kinds = new Set();
    for (const [concept, expectedKind] of FIGURED) {
      await viewport(1280, 900);
      await goto(`${BASE}/learn/maths/${concept}`);
      await p.waitFor(`return !!document.querySelector("main h1");`, `the ${concept} lesson`, 30000);
      await sleep(600); // the plan's figure is server-rendered; a font swap can move a label

      if (!expectedKind) {
        const none = await p.evaluate(`return !document.querySelector("figure.lesson-figure");`);
        check(none, `${concept} carries no drawing, because its plan declares none (decoration teaches a learner to skip pictures)`);
        // A LESSON WITH NO PICTURE IS STILL A PAGE A PHONE HAS TO HOLD.
        // The width sweep below hangs off the figure, so skipping the figure
        // would skip the sideways-scroll check with it — and the lessons with no
        // drawing are the prose-heavy ones: `decimals` is six paragraphs of
        // place-value talk with numbers inside the text, which is exactly the
        // shape that once pushed a 320-px page 13 px wide (a nowrap sentence, no
        // visible culprit). So the narrow screen is measured here too, without a
        // figure to measure.
        await viewport(320, 640);
        await sleep(420);
        const narrowProse = await p.evaluate(`return { scroll: document.documentElement.scrollWidth, inner: window.innerWidth };`);
        check(narrowProse.scroll <= narrowProse.inner + 1,
          `${concept} holds a 320-px screen without a drawing to explain the overflow (${narrowProse.scroll} vs ${narrowProse.inner})`);
        continue;
      }

      await p.waitFor(`return !!document.querySelector("figure.lesson-figure svg");`, `the ${concept} figure`, 20000);
      const kind = await p.evaluate(`return document.querySelector("figure.lesson-figure")?.getAttribute("data-figure") ?? null;`);
      check(kind === expectedKind, `${concept} draws the figure its plan declares (${kind}, expected ${expectedKind})`);
      check(KINDS.includes(kind), `and that kind is one the renderer's union declares (${kind})`);
      kinds.add(kind);

      const wide = await measureFigure();
      check(wide.box.w > 0 && wide.box.h > 0, `${concept}'s drawing has a size instead of collapsing (${Math.round(wide.box.w)}×${Math.round(wide.box.h)})`);
      check(wide.hidden === "true", `${concept}'s svg is aria-hidden, so its caption is what a screen reader hears`);
      check(wide.caption.length > 20, `${concept}'s caption states the point (${wide.caption.slice(0, 54)}…)`);
      const smallWide = wide.texts.length ? Math.min(...wide.texts.map((t) => t.size)) : 0;
      check(wide.texts.length > 0 && smallWide >= 9, `${concept}'s labels are legible (smallest ${smallWide.toFixed(1)}px over ${wide.texts.length} labels)`);
      check(wide.overlaps.length === 0, `${concept}'s labels do not sit on top of one another${wide.overlaps.length ? " — " + wide.overlaps.slice(0, 3).join(", ") : ""}`);
      check(wide.box.x >= -1 && wide.box.x + wide.box.w <= wide.innerWidth + 1,
        `${concept}'s drawing is inside the viewport at 1280 (${Math.round(wide.box.x)}…${Math.round(wide.box.x + wide.box.w)} of ${wide.innerWidth})`);
      check(wide.pageScroll <= wide.innerWidth + 1, `${concept}'s lesson does not scroll sideways at 1280 (${wide.pageScroll} vs ${wide.innerWidth})`);
      if (concept === "negatives" || concept === "quadratics") await shot(`1280-${concept}`);

      // ── the narrow screen, which is the one the mission is for ────────────
      await viewport(320, 640);
      await sleep(420);
      const narrow = await measureFigure();
      check(narrow.box.w > 0 && narrow.box.x >= -1 && narrow.box.x + narrow.box.w <= narrow.innerWidth + 1,
        `${concept}'s drawing fits a 320-px screen (${Math.round(narrow.box.w)} px inside ${narrow.innerWidth})`);
      const outside = narrow.texts.filter((t) => t.x < -1 || t.x + t.w > narrow.innerWidth + 1);
      check(outside.length === 0, `${concept}'s labels are all inside the screen at 320${outside.length ? " — " + outside.slice(0, 3).map((t) => `"${t.text}"`).join(", ") : ""}`);
      check(narrow.overlaps.length === 0, `${concept}'s labels still do not collide at 320${narrow.overlaps.length ? " — " + narrow.overlaps.slice(0, 3).join(", ") : ""}`);
      if (narrow.pageScroll > narrow.innerWidth + 1) {
        const guilty = await offenders();
        const why = await isolate();
        check(false, `${concept}'s lesson does not scroll sideways at 320 (${narrow.pageScroll} vs ${narrow.innerWidth}) — ${why}; ${guilty.join(" · ") || "no element is past the edge"}`);
      } else {
        check(true, `${concept}'s lesson does not scroll sideways at 320 (${narrow.pageScroll} vs ${narrow.innerWidth})`);
      }
      const smallNarrow = narrow.texts.length ? Math.min(...narrow.texts.map((t) => t.size)) : 0;
      check(smallNarrow >= 9, `${concept}'s labels stay legible at 320 (smallest ${smallNarrow.toFixed(1)}px)`);
      if (["linear-equations", "surds", "straight-lines"].includes(concept)) await shot(`320-${concept}`);
    }
    check(kinds.size === 6, `the pilot's plans use ${kinds.size} distinct figure kinds (${[...kinds].join(", ")})`);

    // ── 3. The read stage teaches in an order ────────────────────────────────
    // ── 2b. A fraction is set ON the line, not under it ─────────────────────
    //
    // Reported as "some of these questions look broken", with a screenshot of
    // `Work out 4/5 ÷ 5/4`: the numerators sat on the text line, the
    // denominators hung below it and the ÷ floated above the bars. The cause was
    // arithmetic, not taste — an inline-flex box takes its baseline from its
    // FIRST flex item, so `vertical-align: -0.42em` put the NUMERATOR on the
    // baseline instead of nudging the bar: measured in a browser, the bar landed
    // 12.3px BELOW the baseline where the maths axis (half the x-height) is ~5px
    // above it. Asserted as a ratio of the font size so it holds at every size
    // the product sets maths in, and so a stray !important cannot slip it back.
    section("A fraction sits on the line's maths axis");
    await viewport(1280, 900);
    await goto(`${BASE}/learn/maths/fraction-ops`);
    await p.waitFor(`return !!document.querySelector("main .qprompt .mfrac");`, "a fraction in a question", 30000);
    await sleep(400);
    const fracGeo = await p.evaluate(`
      const f = document.querySelector("main .qprompt .mfrac");
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
      return { above: (baseline - bar) / em, em, height: f.getBoundingClientRect().height };
    `);
    check(!!fracGeo && fracGeo.above > 0.1 && fracGeo.above < 0.45,
      fracGeo
        ? `the fraction's bar sits ${fracGeo.above.toFixed(2)}em ABOVE the baseline — on the maths axis, not under the line (${fracGeo.em}px text, ${Math.round(fracGeo.height)}px tall)`
        : "no fraction in a prompt to measure");

    section("The lesson teaches before it asks, in that order");
    await viewport(1280, 900);
    await goto(`${BASE}/learn/maths/negatives`);
    await p.waitFor(`return !!document.querySelector(".plan-objective");`, "the objective card", 30000);
    const order = await p.evaluate(`
      const marks = [];
      const q = (sel) => document.querySelector(sel);
      const push = (name, el) => marks.push({ name, top: el.getBoundingClientRect().top + window.scrollY, text: (el.textContent || "").replace(/\\s+/g, " ").slice(0, 60) });
      if (q(".plan-objective")) push("objective", q(".plan-objective"));
      if (q('section[aria-label="Start here"]')) push("intuition", q('section[aria-label="Start here"]'));
      if (q("figure.lesson-figure")) push("figure", q("figure.lesson-figure"));
      if (q(".lesson-lead")) push("idea", q(".lesson-lead"));
      if (q('section[aria-label="Worked example"]')) push("worked", q('section[aria-label="Worked example"]'));
      const again = [...document.querySelectorAll("section.card")].filter(s => (s.getAttribute("aria-label") || "").startsWith("Let"));
      if (again.length) push("guided", again[0]);
      if (q('section[aria-label="Where this goes wrong"]')) push("traps", q('section[aria-label="Where this goes wrong"]'));
      const d = [...document.querySelectorAll("main button")].find(b => /Now your turn/.test(b.textContent || ""));
      if (d) push("door", d);
      return marks;
    `);
    const at = (n) => order.findIndex((m) => m.name === n);
    const names = order.map((m) => m.name).join(" → ");
    check(at("objective") === 0, `the lesson opens with what the learner will be able to do ("${order[0]?.text ?? ""}")`);
    check(at("intuition") > at("objective"), "an intuition follows, before any terminology");
    check(at("figure") > at("intuition"), "the picture arrives with the idea it shows, not after the practice");
    check(at("idea") > at("figure"), "the formal explanation follows the picture");
    check(at("worked") > at("idea"), "a worked example comes after the explanation and before the practice");
    check(at("guided") > at("worked"), "and the faded \"we do\" comes after the whole one");
    check(at("traps") > at("guided"), "the traps are named once the method has been shown");
    check(at("door") > at("traps"), "and the only door on the stage is the one into practice, at the end");
    check(order.length === 8, `all eight stages are on the page, in order (${names})`);
    const stageText = await p.allText();
    check(/Not yet checked by a subject teacher/.test(stageText),
      "and the page says the plan has not been subject-reviewed, on the screen rather than in a document");

    // ── 4. The worked example, and the fade ─────────────────────────────────
    section("The worked example shows the method, and the fade withholds it");
    const WORKED = 'section[aria-label="Worked example"]';
    const worked = await p.evaluate(`return (document.querySelector('${WORKED}')?.innerText || "");`);
    check(!/Explanation/.test(worked), "a solved item is not already solved when the page opens, so there is something to try first");
    // The example is fetched from a profile-less route, so the button appears
    // once that fetch lands. Waiting for it is not politeness: a cold dev server
    // compiles the route on first use, and clicking before it exists reported
    // "nothing clickable for Show me how" — a harness race that reads as a
    // missing feature.
    const showMe = `[...document.querySelectorAll('${WORKED} button')].find(b => /Show me how/.test(b.textContent || ""))`;
    await p.waitFor(`return !!${showMe};`, "the worked example to load", 30000);
    await p.clickExpr(showMe, "Show me how");
    await p.waitFor(`return /this is the answer/.test(document.querySelector('${WORKED}')?.innerText || "");`, "the working and the marked answer", 20000);
    const revealed = await p.evaluate(`
      const s = document.querySelector('${WORKED}');
      return { note: (s.querySelector(".note")?.innerText || ""), prompt: (s.querySelector(".qprompt")?.innerText || ""), choices: s.querySelectorAll(".worked-choices li").length, marked: s.querySelectorAll(".worked-choices .worked-correct").length };
    `);
    check(revealed.note.length > 80, `pressing it shows a worked solution, not a bare answer (${revealed.note.replace(/\s+/g, " ").slice(0, 90)}…)`);
    check(revealed.choices === 4, `the item is a real four-option item from the bank (${revealed.choices})`);
    check(revealed.marked === 1, `and exactly one of them is marked correct (${revealed.marked})`);
    await shot("1280-worked");

    const firstPrompt = revealed.prompt.replace(/\s+/g, " ");
    await p.clickExpr(`[...document.querySelectorAll('${WORKED} button')].find(b => /Another one, harder/.test(b.textContent || ""))`, "Another one, harder");
    await p.waitFor(`return /Show me how/.test(document.querySelector('${WORKED}')?.innerText || "");`, "a fresh, unrevealed example", 20000);
    const second = await p.evaluate(`return (document.querySelector('${WORKED} .qprompt')?.innerText || "").replace(/\\s+/g, " ");`);
    check(second.length > 0 && second !== firstPrompt, `and the next example is a NEW item at rising depth (${second.slice(0, 80)}…)`);

    // THE FADE IS MEASURED, not read off the mode prop: the first step must be
    // SHORTER than the whole, and pressing on must complete it. A "guided" stage
    // that shows everything is a worked example wearing another heading.
    const guidedSel = await p.evaluate(`
      const s = [...document.querySelectorAll("section.card")].find((el) => (el.getAttribute("aria-label") || "").startsWith("Let"));
      if (!s) return null;
      s.setAttribute("data-walk", "guided");
      return s.getAttribute("aria-label");
    `);
    check(!!guidedSel, `the faded "we do" stage is on the page ("${guidedSel}")`);
    const GUIDED = 'section[data-walk="guided"]';
    await p.waitFor(`return !!${buttonMatching('/Show the first step/')};`, "the faded example to load", 30000);
    await p.clickExpr(`[...document.querySelectorAll('${GUIDED} button')].find(b => /Show the first step/.test(b.textContent || ""))`, "Show the first step");
    await p.waitFor(`return /Finish it in your head first/.test(document.querySelector('${GUIDED}')?.innerText || "");`, "the invitation to finish it", 20000);
    const firstStep = await p.evaluate(`return (document.querySelector('${GUIDED} .note')?.innerText || "");`);
    check(firstStep.length > 0, `the first move is shown and the rest withheld ("${firstStep.replace(/\s+/g, " ").slice(0, 80)}…")`);
    await p.clickExpr(`[...document.querySelectorAll('${GUIDED} button')].find(b => /Show the rest/.test(b.textContent || ""))`, "Show the rest");
    await p.waitFor(`return ![...document.querySelectorAll('${GUIDED} button')].some(b => /Show the rest/.test(b.textContent || ""));`, "the rest to be revealed", 20000);
    const wholeGuided = await p.evaluate(`return (document.querySelector('${GUIDED} .note')?.innerText || "");`);
    check(wholeGuided.length > firstStep.length + 20,
      `the first step is genuinely a fraction of the method (${firstStep.length} → ${wholeGuided.length} characters)`);

    // ── 5. A wrong answer that has something to say ─────────────────────────
    //
    // coordinates is the pilot concept whose distractors each carry an authored
    // note, so it is where "the feedback is about YOUR option" is observable. An
    // item allows one attempt, so each try opens a fresh practice rather than
    // guessing twice at the same question.
    section("A wrong answer gets the note for that option, and the repair");
    // THE MEASUREMENT THIS SECTION IS FOR: not every `coordinates` item carries a
    // slip. The concept has three branches and one of them — a distance from the
    // origin — is a Pythagoras item, so its distractors are staircase/d²/
    // subtraction and the *option note* is the whole teaching; tagging it
    // `axis-swap` would name a belief the item does not discriminate. So this
    // draws until a TAGGED item is answered wrong, and reports how many draws
    // that took: a repair that reaches one served item in ten is a card most
    // learners never see, and the count is the honest way to say so.
    let noted = null;   // a wrong answer that had a per-option note
    let draws = 0;
    const servedLog = [];
    for (let i = 0; i < 12 && !noted; i++) {
      let control;
      try {
        control = await openPractice("coordinates");
      } catch (e) {
        check(false, `a coordinates practice could not be opened: ${e.message.slice(0, 200)}`);
        break;
      }
      draws++;
      servedLog.push((await p.evaluate(`return (document.querySelector("main .qprompt")?.innerText || "").replace(/\\s+/g, " ").slice(0, 46);`)) ?? "");
      if (control === "numeric") {
        // A numeric item has no options to read a note off, but it still has to
        // be answered: 999 is wrong for every coordinates answer the bank makes,
        // so the draw produces the wrong-answer surface rather than a correct one
        // that skips the feedback.
        await p.typeInto(`document.querySelector("main .numeric-input")`, "999", "the answer box");
        await p.clickExpr(buttonMatching("/Check/"), "Check the typed answer");
      } else {
        const count = await p.evaluate(`return document.querySelectorAll("main .choices button").length;`);
        await p.clickExpr(`[...document.querySelectorAll("main .choices button")][${i % count}]`, `choice ${(i % count) + 1}`);
      }
      await p.waitFor(`return /Not yet|Correct/.test(document.querySelector("main .feedback .verdict")?.textContent || "");`, "the verdict", 25000);
      const graded = await p.evaluate(`
        const f = document.querySelector("main .feedback");
        return {
          verdict: (f?.querySelector(".verdict")?.textContent || "").trim(),
          note: (f?.querySelector("p.small")?.textContent || "").trim(),
          repair: !!f.querySelector(".repair"),
          repairTitle: (f.querySelector(".repair .eyebrow")?.textContent || "").trim(),
          pairs: f.querySelectorAll(".repair-pair").length,
        };
      `);
      if (!/Not yet/.test(graded.verdict)) continue;
      if (!noted && graded.note.length > 20) { noted = graded; await shot("1280-wrong-answer"); }
    }
    check(!!noted,
      `a wrong answer was marked and explained in ${draws} draw(s)${noted ? "" : `; served: ${servedLog.slice(0, 4).join(" / ")}`}`);
    if (noted) {
      check(noted.note.length > 20 && !/^Misconception/.test(noted.note),
        `and the feedback speaks about the option the learner chose ("${noted.note.slice(0, 100)}…")`);
    }

    // ── 5b. The LOOP, on an item a click cannot get right ───────────────────
    //
    // The section above measures the OPTION NOTE, and it deliberately stops
    // there. It cannot measure the repair loop: the walk clicks a rotating
    // option, so roughly a quarter of its answers are right, the record's
    // accuracy stays healthy, and the serve never decides this learner needs a
    // repair — measured, 12 draws of `coordinates` at a GCSE Higher aim produced
    // none. That is a fact about guessing, not about the product: the decision
    // asks for a RUN of failure, and a learner clicking at random has not shown
    // one.
    //
    // A numeric item cannot be guessed by clicking, and 999 is wrong for every
    // item this bank makes, so the same few answers produce a genuine run of
    // failure. `linear-equations` is where the pilot authors `bal-slip` ("the
    // same thing must come off both sides"), so the serve has something to
    // chase, and what is asserted is the promise the strategy note makes: a
    // learner who keeps slipping is shown THAT belief's repair, on the answer.
    section("A learner who keeps slipping gets that belief's repair");
    let slipDraws = 0;
    let slipRepair = null;
    let slipSource = "";
    for (let i = 0; i < 8 && !slipRepair; i++) {
      let control;
      try {
        control = await openPractice("linear-equations");
      } catch {
        break;
      }
      slipDraws++;
      if (control === "numeric") {
        await p.typeInto(`document.querySelector("main .numeric-input")`, "999", "the answer box");
        await p.clickExpr(buttonMatching("/Check/"), "Check the typed answer");
      } else {
        await p.clickExpr(`[...document.querySelectorAll("main .choices button")][0]`, "the first option");
      }
      await p.waitFor(`return /Not yet|Correct/.test(document.querySelector("main .feedback .verdict")?.textContent || "");`, "the verdict", 25000);
      const graded = await p.evaluate(`
        const f = document.querySelector("main .feedback");
        return {
          verdict: (f?.querySelector(".verdict")?.textContent || "").trim(),
          repair: !!f.querySelector(".repair"),
          repairTitle: (f.querySelector(".repair .eyebrow")?.textContent || "").trim(),
          pairs: f.querySelectorAll(".repair-pair").length,
          source: (document.querySelector("main .qprompt")?.innerText || "").replace(/\\s+/g, " ").slice(0, 60),
        };`);
      if (!/Not yet/.test(graded.verdict)) continue;
      if (graded.repair && graded.pairs > 0) { slipRepair = graded; slipSource = graded.source; }
    }
    check(!!slipRepair,
      slipRepair
        ? `a run of wrong answers is met with the authored repair, after ${slipDraws} draw(s) (${slipRepair.pairs} contrast pair(s), "${slipRepair.repairTitle}")`
        : `no repair card in ${slipDraws} failed draws — the serve never chased the slip`);

    // ── 5b. A NEW QUESTION MEETS AN EMPTY ANSWER BOX ────────────────────────
    //
    // Reported from the product: "in the practice part of each topic, the question
    // field doesn't clear after every input". It did not — the box is rendered at
    // the same place for every question, so React kept the instance and its
    // `value`, and the next item arrived with the previous answer still typed in
    // it, one press of Check from being marked as an attempt the learner never
    // made. Fixed in components/numeric-answer.tsx (a `questionId` prop and a
    // reset guarded by a ref), and this is the assertion that keeps it fixed —
    // `typeInto` CLEARS the field before typing, so every other section in this
    // walk would pass whether or not the bug existed.
    section("A new question starts with an empty answer box");
    await viewport(1280, 900);
    // WALK THE PRACTICE UNTIL THE SAME KIND OF QUESTION ARRIVES TWICE.
    //
    // The defect is a numeric box that survives the swap to the next numeric
    // item, so the measurement needs numeric → numeric. Reading "the first draw
    // was a choice" as a failure and re-serving instead is how this section
    // first went red for a reason that had nothing to do with the bug: a fresh
    // practice on `fraction-ops` opens on a choice draw, and every re-open
    // opened the same one again. Both response kinds are therefore answered and
    // advanced through, and the assertion is on the transition.
    const advance = `[...document.querySelectorAll("main button")].find(b => /^(Next|Retry|Continue|Finish)/i.test((b.textContent || "").trim()))`;
    const servedKinds = [];
    let boxCheck = null;
    // THREE DRAWS PER PRACTICE SESSION, then start again. The session has its own
    // arc (read → practise → prove → transfer), and walking past the practice
    // phase lands on a result panel with no question on it — which is what the
    // first version of this loop did, timing out on "the question after a choice
    // answer" and blaming the serve.
    // `linear-equations` asks for a NUMBER on nearly every draw (a numeric
    // answer with three-decimal tolerance), while `fraction-ops` opens on a
    // choice family — and the arc of a session (read → practise → prove →
    // transfer) means the test needs the numeric → numeric transition EARLY,
    // before the practice phase closes. So the concept is chosen for the
    // response kind it serves, and the walk only ever takes one step forward.
    for (const concept of ["linear-equations", "indices-intro", "fraction-ops"]) {
      if (boxCheck) break;
      await openPractice(concept);
      let typedThisSession = false;
      for (let step = 0; step < 1 && !boxCheck; step++) {
        const kind = await p.evaluate(`return document.querySelector("main .numeric-input") ? "numeric" : document.querySelector("main .choices") ? "choice" : "none";`);
        servedKinds.push(kind);
        if (kind === "none") break;
        if (kind === "numeric") {
          if (typedThisSession) {
            const held = await p.evaluate(`return document.querySelector("main .numeric-input")?.value ?? null;`);
            // A box still holding the previous item's answer IS the defect.
            boxCheck = { kind: "numeric", value: held ?? "", keptWhileGraded: "carried over a NEW question" };
            break;
          }
          await p.typeInto(`document.querySelector("main .numeric-input")`, "0.12345", "the answer box");
          // Submit through the FORM: in this viewport the tutor panel overlaps the
          // Check button's coordinates, and a click that lands on the panel does
          // nothing at all (a probe run wasted on exactly that).
          await p.evaluate(`const f = document.querySelector("main form.numeric-answer"); if (f?.requestSubmit) f.requestSubmit(); return true;`);
          await p.waitFor(`return !!${advance};`, "the grade on the numeric item", 25000);
          // THE RETRY IS ONE EDIT AWAY: the graded item keeps what was typed while
          // its feedback is read. Without this the empty next box would prove
          // nothing (a box that cleared on every keystroke would also be empty).
          const kept = await p.evaluate(`return document.querySelector("main .numeric-input")?.value ?? null;`);
          typedThisSession = true;
          await p.clickExpr(advance, "the advance button after a wrong numeric answer");
          // WAIT FOR THE GRADE TO LEAVE THE SCREEN, not merely for a box to
          // exist. The old box exists throughout the fetch, so reading the value
          // as soon as one is present measures the frame BEFORE the swap — and
          // in the planted-failure run that frame is indistinguishable from the
          // defect (both show the typed answer). The graded panel is what the
          // page removes when the next item arrives.
          await p.waitFor(`return !document.querySelector("main .feedback");`, "the next question to replace the graded one", 25000);
          await sleep(150);
          const next = await p.evaluate(`
            const box = document.querySelector("main .numeric-input");
            return box ? { kind: "numeric", value: box.value } : { kind: "choice", value: null };`);
          servedKinds.push(next.kind);
          if (next.kind === "numeric") boxCheck = { kind: "numeric", value: next.value, keptWhileGraded: kept };
          break;
        }
        await p.clickExpr(`document.querySelector("main .choices button")`, "an option on the choice draw");
        await p.waitFor(`return !!${advance};`, "the grade on the choice draw", 25000);
        await p.clickExpr(advance, "the advance button after a choice answer");
        await p.waitFor(`return !document.querySelector("main .feedback");`, "the question after a choice answer", 25000);
        await sleep(150);
      }
    }
    check(!!boxCheck && boxCheck.kind === "numeric",
      boxCheck
        ? "a numeric item follows a numeric item, which is the transition the defect lived in"
        : `no numeric draw in ${servedKinds.length} step(s), so the reset could not be measured (served: ${servedKinds.join(", ") || "none"})`);
    check(!!boxCheck && boxCheck.kind === "numeric",
      boxCheck
        ? "a numeric draw was served, which is the only kind that can show a stale value"
        : `no numeric draw in 4 serves, so the reset could not be measured (served: ${boxServes.join(", ") || "none"}; errors: ${boxErrors.join(" | ") || "none"})`);
    check(!!boxCheck && boxCheck.value === "",
      boxCheck
        ? `and the next question's box is EMPTY ("${boxCheck.value}"), while the graded one kept what was typed ("${boxCheck.keptWhileGraded}")`
        : "the next question's box was never reached");
    check(!!boxCheck && boxCheck.keptWhileGraded === "0.12345",
      "a retry is one edit away: the value stays visible while the feedback is read, and only a NEW question clears it");

    // ── 6. The lesson opens where this learner now is ───────────────────────
    section("The read stage opens with the slip the practice just made");
    // The concept the repair came from, not a fixed one: the slip is in that
    // concept's record, and asking any other lesson for it would be a different
    // question. `linear-equations` by default, because the loop above is what
    // produces a live slip deterministically.
    const slipConcept = slipRepair ? "linear-equations" : "coordinates";
    await goto(`${BASE}/learn/maths/${slipConcept}`);
    await p.waitFor(`return !!document.querySelector("main h1");`, `the ${slipConcept} lesson`, 30000);
    await sleep(700);
    const slip = await p.evaluate(`
      const s = document.querySelector('section[aria-label="Start with the slip from last time"]');
      if (!s) return null;
      const t = (s.innerText || "");
      return { text: t, pairs: s.querySelectorAll(".repair-pair").length, progress: (t.match(/Clean answers in a row:\\s*\\d+ of \\d+/) || [null])[0] };
    `);
    check(!!slip, "the concept page carries a section for the learner's live slip");
    if (slip) {
      check(slip.pairs > 0, `and it is the authored contrast pair, not a one-line warning (${slip.pairs})`);
      check(!!slip.progress, `the count towards retirement is printed from the model (${slip.progress})`);
      check(/This part disappears once you answer three in a row correctly/.test(slip.text),
        "and the section says what closes it, so the loop is visible rather than mysterious");
      check(/Not yet checked by a subject teacher/.test(slip.text), "the repair's review state is declared beside it");
    }
    await viewport(320, 640);
    await sleep(400);
    const slipNarrow = await p.evaluate(`return { scroll: document.documentElement.scrollWidth, inner: window.innerWidth, pairs: document.querySelectorAll(".repair-pair").length };`);
    if (slipNarrow.scroll > slipNarrow.inner + 1) {
      const guilty = await offenders();
      check(false, `the slip card does not push a 320-px page sideways (${slipNarrow.scroll} vs ${slipNarrow.inner}) — ${guilty.join(" · ") || "no element of main is wider, so the overflow is in the shell"}`);
    } else {
      check(true, `the slip card does not push a 320-px page sideways (${slipNarrow.scroll} vs ${slipNarrow.inner})`);
    }
    await shot("320-slip-lesson");

    // ── 7. Spanish, through the picker, on the rendered page ─────────────────
    //
    // The dictionary lookup was asserted in the suite. What was never asserted is
    // the PAGE: that the language a learner selected reaches the paragraph under a
    // misconception name. Switching through the topbar's real control is what a
    // learner does; the assertion is on the text that ends up on screen.
    section("The coaching paragraph a Spanish learner reads is Spanish");
    await viewport(1280, 900);
    await goto(`${BASE}/learn/maths/coordinates`);
    await p.waitFor(`return !!document.querySelector(".lang-compact");`, "the interface language picker in the topbar", 25000);
    await p.pick('document.querySelector(".lang-compact")', "es", "interface language", 'document.documentElement.lang === "es"');
    await p.waitFor(`return document.documentElement.lang === "es";`, "the interface to switch to Spanish", 20000);
    check(true, "the topbar picker switches the interface language");
    await goto(`${BASE}/learn/maths/coordinates`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the coordinates lesson in Spanish", 30000);
    await sleep(700);
    const es = await p.evaluate(`return { lang: document.documentElement.lang, text: (document.querySelector("main")?.innerText || "") };`);
    check(es.lang === "es", `the document is in Spanish (${es.lang})`);
    check(/ANCHO/.test(es.text), "the coaching paragraph under the misconception is Spanish, not the English one");
    check(!/the first number is always how far ACROSS/.test(es.text), "and no English coaching paragraph sits under a Spanish heading");
    const note = await p.evaluate(`return (document.querySelector(".lang-note")?.textContent || "").trim();`);
    check(note.length > 20, `the lesson states in Spanish what is translated and what is not ("${note.slice(0, 80)}…")`);
    check(!/Concept names, blurbs and misconception names render natively/.test(note), "and that sentence is not the English one");
    const unreviewed = await p.evaluate(`return (document.querySelector("main")?.innerText || "").includes("Aún no revisado");`);
    check(unreviewed, "the review state is translated with the rest of the interface");

    await viewport(320, 640);
    await sleep(400);
    const esNarrow = await p.evaluate(`return { scroll: document.documentElement.scrollWidth, inner: window.innerWidth };`);
    check(esNarrow.scroll <= esNarrow.inner + 1, `and the Spanish lesson does not scroll sideways at 320 (${esNarrow.scroll} vs ${esNarrow.inner})`);
    await shot("320-spanish-lesson");

    // ── 7b. German too, because one language is not a localisation path ──────
    //
    // Spanish proved the picker reaches the paragraph. It does not prove the
    // PARAGRAPHS exist: the translated coaching is authored per language, and a
    // language whose coaching was never written falls back to the NAME alone
    // (lib/content-i18n#mcCoaching). German is one of the four that have them, so
    // it is the second case that must actually paint — and the interface being
    // German while the paragraph stays English is the exact defect this pair of
    // checks exists to catch.
    section("The coaching paragraph a German learner reads is German");
    await viewport(1280, 900);
    await goto(`${BASE}/learn/maths/coordinates`);
    await p.waitFor(`return !!document.querySelector(".lang-compact");`, "the interface language picker in the topbar", 25000);
    await p.pick('document.querySelector(".lang-compact")', "de", "interface language", 'document.documentElement.lang === "de"');
    await p.waitFor(`return document.documentElement.lang === "de";`, "the interface to switch to German", 20000);
    check(true, "the same picker switches to German, not only to Spanish");
    await goto(`${BASE}/learn/maths/coordinates`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the coordinates lesson in German", 30000);
    await sleep(700);
    const de = await p.evaluate(`return { lang: document.documentElement.lang, text: (document.querySelector("main")?.innerText || "") };`);
    check(de.lang === "de", `the document is in German (${de.lang})`);
    check(/RECHTS \(x\)/.test(de.text) || /erste Zahl ist immer der Weg/.test(de.text),
      "the coaching paragraph under the misconception is German");
    check(!/the first number is always how far ACROSS/.test(de.text), "with no English coaching paragraph under a German heading");
    check(/Konzeptnamen/.test(de.text), "and the page says, in German, which half of the teaching is translated");
    const deUnreviewed = await p.evaluate(`return (document.querySelector("main")?.innerText || "").includes("Fachlehrkraft");`);
    check(deUnreviewed, "the review state is German too — the honesty line is translated with the rest");

    // Put the interface back, so a later walk in the same browser profile is not
    // surprised by Spanish — and because leaving a learner's app in a language
    // they did not choose is exactly the state this section is about.
    await viewport(1280, 900);
    await goto(`${BASE}/`);
    await p.waitFor(`return !!document.querySelector(".lang-compact");`, "the picker again", 25000);
    await p.pick('document.querySelector(".lang-compact")', "en", "interface language", 'document.documentElement.lang === "en"');
    check(await p.evaluate(`return document.documentElement.lang;`) === "en", "and the interface can be put back");

    // ── 7c. The drawing a question depends on is also described in words ────
    //
    // The SVG is aria-hidden, and the claim that made that safe ("the stem says
    // everything the picture says") was FALSE for one family: `scatter-
    // correlation` plots the data, so its points appear in no prompt. The caption
    // is the fix, and this is the app's page — the twin's caption is measured by
    // `npm run verify:live`, and one build proving it is not the other build
    // doing it.
    section("A question's diagram is stated in words as well as drawn");
    await viewport(1280, 900);
    // `coordinates` is the concept that DRAWS on most serves (its plots appear on
    // ~26 of 40 draws at a Higher aim); `pythagoras` was tried first and the loop
    // broke on the first draw without a drawing, reporting "no captioned figure in
    // 4 draws" as though the feature were missing. The prompt of every draw is
    // printed on failure for the same reason the contrast-pair section prints
    // its served prompts: a harness that says "none" without saying WHAT it saw
    // costs a whole run to get past.
    let figureCap = null;
    const servedPrompts = [];
    for (let i = 0; i < 6 && !figureCap; i++) {
      try { await openPractice("coordinates"); } catch { break; }
      servedPrompts.push((await p.evaluate(`return (document.querySelector("main .qprompt, main .q")?.innerText || "").replace(/\\s+/g, " ").slice(0, 70);`)) || "");
      figureCap = await p.evaluate(`
        const f = document.querySelector("main .qfigure");
        if (!f) return null;
        const cap = f.querySelector("figcaption.qfigure-cap");
        return {
          kind: f.getAttribute("data-figure"),
          caption: (cap?.textContent || "").trim(),
          hidden: f.querySelector("svg")?.getAttribute("aria-hidden") === "true",
          labels: [...f.querySelectorAll("svg text")].map((t) => (t.textContent || "").trim()),
          size: cap ? parseFloat(getComputedStyle(cap).fontSize) : 0,
        };`);
    }
    check(!!figureCap && figureCap.caption.length > 20,
      figureCap
        ? `the drawing carries a caption a screen reader can read ("${figureCap.caption.slice(0, 64)}…")`
        : `no captioned figure appeared in ${servedPrompts.length} serve(s) — served: ${servedPrompts.join(" | ") || "nothing"}`);
    check(!!figureCap && figureCap.hidden && figureCap.labels.length >= 3,
      "while the SVG stays aria-hidden, because the words are the accessible reading of it");
    // THE READING ORDER, which is the part a sighted reader never has to find
    // out and a screen-reader one always does: the description must arrive BEFORE
    // the options, or a learner is asked to pick an answer to a picture that has
    // not been described yet. (Whether the caption's numbers ARE the drawn ones
    // is asserted in `npm run verify`, where the spec is in scope and the check
    // can compare the sentence against the points themselves.)
    // The control can be four options OR a numeric box — both are answers, so
    // the claim is that the description arrives before EITHER. Reading only
    // `.choices` returned null on a numeric draw and reported a reading-order
    // defect that was not there.
    const capBefore = await p.evaluate(`
      const cap = document.querySelector("main .qfigure figcaption.qfigure-cap");
      const answer = document.querySelector("main .choices") || document.querySelector("main form.numeric-answer");
      if (!cap || !answer) return { ok: null, which: answer ? "caption" : "answer control" };
      return { ok: !!(cap.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING), which: answer.className };`);
    check(capBefore?.ok === true,
      capBefore?.ok === true
        ? "and it is read before the answer control, so the picture is described before it is asked about"
        : `the caption was not read before the answer control (missing: ${capBefore?.which})`);

  } finally {
    try { await close(); } catch { /* already gone */ }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (SHOTS) console.log(`screenshots: ${SHOT_DIR}/`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`\nThe lesson walk could not finish: ${e?.message ?? e}`);
  process.exit(1);
});
