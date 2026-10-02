#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE UI WALK — a real browser, driving the real wizard.
//
// WHY THIS EXISTS. Every pass of this campaign verified the middle of the
// enrolment wizard — country, year group, subjects, qualification, tier,
// language — by READING THE DOM, never by clicking it, because the controls are
// native `<select>`s and React rejects a synthetic `change` event: dispatch one
// and the select shows the new value while the component's state stays put, so
// the wizard does not move. That is an instrumentation limit, and it left the
// exact steps nobody had driven as the exact steps nobody had verified. A pin
// that cannot touch the control it guards is not a gate.
//
// WHAT IT DOES INSTEAD. It drives Chrome through the DevTools Protocol with
// REAL input events — trusted mouse clicks and real key presses — so the
// browser's own event pipeline fires the `change` React is listening for. No
// dependency is added: Chrome and Node's global WebSocket are enough.
//
// WHAT IT PROVES. A fresh learner (empty browser storage, no account) can walk
// from country to goal through the interface alone, every step's `Next` is
// enabled only when the step is actually answered, and the profile the SERVER
// stored matches what the screen said it would.
//
// HOW IT DRIVES A SELECT. Chromium's own behaviour: a focused `<select>`
// responds to a typed character by jumping to the matching option, and repeating
// the same character cycles through the options that share it. So `pick()` reads
// the options out of the DOM, presses the target label's first character until
// the value matches, and gives up with the options listed if it cannot. Focus is
// set programmatically (what a Tab would do); every value change comes from a
// real key press.
//
// Run with the dev server up:   npm run verify:ui
// Optional env: UI_WALK_BASE (default http://127.0.0.1:4173), CHROME_BIN.
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BASE = process.env.UI_WALK_BASE ?? "http://127.0.0.1:4173";
const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333 + Math.floor(Math.random() * 400);

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

// ── A minimal CDP client ────────────────────────────────────────────────────
function client(ws) {
  let seq = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (!m.id || !pending.has(m.id)) return;
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) reject(new Error(`${m.error.message ?? "cdp error"}`));
    else resolve(m.result);
  });
  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const dir = mkdtempSync(path.join(tmpdir(), "openmind-uiwalk-"));
  let stderr = "";
  const proc = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${dir}`,
    "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--disable-dev-shm-usage", "--no-sandbox", "--window-size=1280,900",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  proc.stderr.on("data", (d) => { stderr += d.toString(); });

  const deadline = Date.now() + 20000;
  let target = null;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (target) break;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  if (!target) {
    proc.kill("SIGKILL");
    throw new Error(`Chrome did not expose a page target on :${PORT}.\n${stderr.slice(-600)}`);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("could not open the CDP socket")), { once: true });
  });
  const send = client(ws);
  await send("Page.enable");
  await send("Runtime.enable");
  const close = async () => {
    try { await send("Browser.close"); } catch { /* already gone */ }
    try { ws.close(); } catch { /* already closed */ }
    proc.kill("SIGKILL");
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  };
  return { send, close };
}

// ── Page helpers ────────────────────────────────────────────────────────────
function page(send) {
  const evaluate = async (body) => {
    const r = await send("Runtime.evaluate", {
      expression: `JSON.stringify((() => { ${body} })())`,
      awaitPromise: true, returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "evaluate threw");
    return r.result.value === undefined ? null : JSON.parse(r.result.value);
  };

  const goto = async (url) => {
    await send("Page.navigate", { url });
    await waitFor(`return document.readyState === "complete";`, `a completed load of ${url}`);
  };

  const waitFor = async (body, what, timeout = 20000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try { if (await evaluate(body)) return true; } catch { /* mid-navigation */ }
      await sleep(200);
    }
    // A gate that says only "timed out" wastes the next run. Show what the page
    // was actually displaying, which is enough to tell a wrong selector from a
    // step that never advanced.
    let where = "(the page could not be read)";
    try {
      where = await evaluate(`const m = document.querySelector("main"); return { heading: m?.querySelector("h1")?.textContent?.trim() ?? null, step: (m?.innerText.match(/Step \\d+\\s*\\/\\s*\\d+/) || [null])[0], text: (m?.innerText || "").replace(/\\n+/g, " · ").slice(0, 220) };`);
    } catch { /* keep the generic sentence */ }
    throw new Error(`timed out waiting for ${what} — on screen: ${JSON.stringify(where)}`);
  };

  /**
   * Where to click an element — SCROLLED INTO VIEW first.
   *
   * `getBoundingClientRect()` is viewport-relative, so a control below the fold
   * returns a y past the window and a mouse event at that coordinate hits
   * nothing at all. The tall steps (two subjects, each with its own selects) put
   * `Next` below the fold, which is exactly how a real click silently did
   * nothing while the button was enabled: the walk read "enabled", clicked at
   * y=1400, and the step never moved. A user scrolls; so does this.
   */
  const rectOf = (expr) => evaluate(`
    const el = ${expr};
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    let r = el.getBoundingClientRect();
    const vh = window.innerHeight || 900;
    if (r.top < 8 || r.bottom > vh - 8) {
      window.scrollBy(0, r.top - (vh - r.height) / 2);
      r = el.getBoundingClientRect();
    }
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, inView: r.top >= 0 && r.bottom <= (window.innerHeight || 900) && r.left >= 0 && r.right <= (window.innerWidth || 1280), text: (el.textContent || "").trim().slice(0, 40) };
  `);

  /** A real, trusted mouse click at the element's centre — not `el.click()`. */
  const clickExpr = async (expr, what) => {
    const p = await rectOf(expr);
    if (!p || !p.w || !p.h) throw new Error(`nothing clickable for ${what}`);
    if (!p.inView) throw new Error(`${what} could not be scrolled into the viewport (x=${Math.round(p.x)}, y=${Math.round(p.y)})`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
    await sleep(150);
    return p.text;
  };

  /** One real key press (with the character, so the page sees typed input). */
  const press = async (key) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, text: key, unmodifiedText: key });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key });
  };

  /** Real typing into a field: focus with a click, then per-character key events. */
  const typeInto = async (expr, text, what) => {
    await clickExpr(expr, what);
    for (const ch of text) { await press(ch); await sleep(25); }
  };

  // A label's OWN text, not everything inside it. `textContent` includes the
  // options of a select it wraps, so "Level" matched the QUALIFICATION field
  // (whose options include "A-Level Mathematics") and the walk picked a tier out
  // of the wrong control. Field labels keep their words in a direct <span>;
  // choice labels (checkbox/radio) have no span, so their trimmed text is theirs.
  const labelWith = (text) => `[...document.querySelectorAll("main label")].find(l => { const span = l.querySelector(":scope > span"); const own = span ? span.textContent.trim() : (l.textContent || "").trim(); return own === ${JSON.stringify(text)}; })`;
  const selectUnder = (labelText) => `${labelWith(labelText)}?.querySelector("select")`;
  /**
   * The nth select under a field label — one per declared subject, in the order
   * the learner declared them. "A course per subject" is only true if each
   * subject has its OWN control, so the walk addresses them by position.
   */
  const selectUnderNth = (labelText, n) =>
    `[...document.querySelectorAll("main label")].filter(l => { const s = l.querySelector(":scope > span"); return s && s.textContent.trim() === ${JSON.stringify(labelText)}; })[${n}]?.querySelector("select")`;
  const buttonMatching = (re) => `[...document.querySelectorAll("main button")].find(b => ${re}.test(b.textContent || ""))`;

  /**
   * Choose an option in a native select USING REAL KEYS.
   * Reads the options out of the DOM, then presses the target label's first
   * character until the value matches (repeating cycles matches, which is the
   * browser's own behaviour for a select).
   */
  const pick = async (selectExpr, wanted, what, settle) => {
    const sel = `(() => { const s = ${selectExpr}; if (!s) return null; return { value: s.value, options: [...s.options].map(o => ({ value: o.value, text: (o.textContent || "").trim() })) }; })()`;
    const info = await evaluate(`return ${sel};`);
    if (!info) throw new Error(`the ${what} select is not on the page`);
    const target = info.options.find((o) => o.value === wanted);
    if (!target) throw new Error(`no option "${wanted}" in the ${what} select: ${info.options.map((o) => o.value || "(empty)").join(", ")}`);
    if (info.value === wanted) return target.text;
    // Blur first: Chromium keeps a select's typeahead SEARCH STRING alive while
    // the element stays focused, so typing "e" straight after a pick that ended
    // in "fr" extends that search to "fre" — never a match, and the control looks
    // unfocusable while it is working perfectly. Dropping focus resets the string.
    await evaluate(`const el = ${selectExpr}; if (el) { el.blur(); el.focus(); } return true;`);
    await sleep(150);
    const read = async () => (settle
      ? await evaluate(`return !!(${settle});`)
      : (await evaluate(`const el = ${selectExpr}; return el ? el.value : null;`)) === wanted);

    // TYPE THE SHORTEST UNIQUE PREFIX of the option's label. One character is
    // rarely unique — "English" and "Español" both start with E — and cycling on
    // a shared character lands on whichever match follows the current one, which
    // is how switching the interface back to English stalled on French. A prefix
    // no other option shares selects the choice outright.
    const labels = info.options.map((o) => ({ value: o.value, text: (o.text || "").trim().toLowerCase() }));
    const own = (target.text || "").trim().toLowerCase();
    let prefix = own.slice(0, 1);
    for (let n = 1; n <= own.length; n++) {
      const cand = own.slice(0, n);
      prefix = cand;
      if (!labels.some((o) => o.value !== wanted && o.text.startsWith(cand))) break;
    }
    // A space would open the dropdown rather than type into it, so labels needing
    // one ("United Kingdom") keep the cycling behaviour below.
    if (prefix && !prefix.includes(" ")) {
      for (const ch of prefix) { await press(ch); await sleep(60); }
      await sleep(150);
      if (await read()) return target.text;
    }
    const first = own.slice(0, 1) || "a";
    await sleep(1300); // let any half-typed search string expire before cycling
    for (let i = 0; i < info.options.length + 2; i++) {
      await press(first);
      await sleep(90);
      if (await read()) return target.text;
    }
    // Say WHY it refused: a select that keeps its old value after a real key
    // press is either not focused any more, or has no option whose label starts
    // with the character typed. Both are visible in one line.
    const diag = await evaluate(`const s = ${selectExpr}; return { focused: document.activeElement === s, value: s?.value ?? null, labels: [...(s?.options ?? [])].map(o => (o.textContent || "").trim()).slice(0, 8) };`);
    throw new Error(`could not choose "${wanted}" in the ${what} select — it stayed on "${info.value}" (focused=${diag.focused}, labels: ${diag.labels.join(" | ")})`);
  };

  const valueOf = (expr) => evaluate(`return ${expr}?.value ?? null;`);
  const text = () => evaluate(`return (document.querySelector("main")?.innerText || "").replace(/\\n+/g, " · ").slice(0, 400);`);
  const stepCounter = () => evaluate(`return (document.querySelector("main")?.innerText || "").match(/Step \\d+ of \\d+/)?.[0] ?? null;`);

  const nextButton = buttonMatching('/(Next|Start learning)/');
  const clickNext = async (what) => {
    const enabled = await evaluate(`const b = ${nextButton}; return b ? !b.disabled : null;`);
    if (enabled === null) throw new Error(`no Next/Start button on the page at ${what}`);
    if (!enabled) { const body = await text(); throw new Error(`the button refuses to advance at ${what} — nothing on screen says why:\n     ${body}`); }
    await clickExpr(nextButton, `the button that advances ${what}`);
  };

  return { evaluate, goto, waitFor, clickExpr, press, typeInto, pick, valueOf, text, stepCounter, clickNext, labelWith, selectUnder, selectUnderNth, buttonMatching };
}

// ── The walk ────────────────────────────────────────────────────────────────
async function main() {
  // Fail with the useful sentence rather than a stack from a dead port.
  try {
    const r = await fetch(BASE, { method: "GET" });
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`The app is not answering at ${BASE}. Start it first:  npm run dev`);
    process.exit(2);
  }

  const { send, close } = await launch();
  const p = page(send);
  let profileId = null;
  try {
    section("A fresh learner opens the wizard");
    await p.goto(`${BASE}/onboarding`);
    await p.evaluate(`localStorage.clear(); sessionStorage.clear(); return true;`);
    await p.goto(`${BASE}/onboarding`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the wizard to render");
    const opened = await p.evaluate(`return { h1: document.querySelector("main h1").textContent.trim(), step: (document.querySelector("main").innerText.match(/Step \\d+\\s*\\/\\s*\\d+/) || [null])[0] };`);
    check(opened.h1 === "Create your account",
      `a learner with no account and no history is asked to create one, not to sign in ("${opened.h1}")`);
    check(/^Step \d+\s*\/\s*\d+$/.test(opened.step ?? ""), `and the wizard says where they are (${opened.step})`);

    // ── Step 1: the account choice, by real click on the label ──────────────
    await p.clickExpr(p.labelWith("Continue without an account"), "the continue-without-an-account choice");
    const guest = await p.evaluate(`return { h1: document.querySelector("main h1").textContent.trim(), next: ${p.buttonMatching('/(Next|Start learning)/')}?.disabled };`);
    check(guest.h1 === "Continue without an account", `choosing it states what the learner is doing ("${guest.h1}")`);
    check(guest.next === false, "and the step can be completed without inventing an account");
    await p.clickNext("the account step");

    // ── Step 2: country and year group — two native selects ─────────────────
    section("Country and year group, driven through the select itself");
    await p.waitFor(`return !!${p.selectUnder("Where you are")};`, "the country select");
    const step2 = await p.stepCounter();
    await p.typeInto(`document.querySelector("main input[type=text]")`, "walk_learner", "the display-name field");
    const countryText = await p.pick(p.selectUnder("Where you are"), "GB", "country");
    check(countryText === "United Kingdom" || /United Kingdom/.test(countryText), `the country is chosen by keystroke alone (${countryText})`);
    await p.waitFor(`return [...(${p.selectUnder("Your grade level")}?.options ?? [])].some(o => o.value === "Year 10");`, "the country's year groups to appear");
    const gradeText = await p.pick(p.selectUnder("Your grade level"), "Year 10", "year group");
    check(await p.valueOf(p.selectUnder("Your grade level")) === "Year 10", `and the year group follows from that country (${gradeText})`);
    await p.clickNext("the country step");

    // ── Step 3: subjects — checkboxes and a radio group ─────────────────────
    section("Subjects and daily time");
    await p.waitFor(`return !!${p.labelWith("Physics")};`, "the subject choices");
    await p.clickExpr(`${p.labelWith("Physics")}?.querySelector("input")`, "the Physics subject");
    await p.clickExpr(`${p.labelWith("30 min")}?.querySelector("input")`, "30 minutes a day");
    const subjects = await p.evaluate(`return [...document.querySelectorAll("main input[type=checkbox]")].filter(i => i.checked).map(i => (i.closest("label")?.textContent || "").trim());`);
    check(subjects.some((s) => /Physics/.test(s)), `a second subject can be added (${subjects.join(", ")})`);
    check(await p.evaluate(`return ${p.labelWith("30 min")}?.className.includes("on") ?? false;`), "and the daily-time choice registers");
    await p.clickNext("the subjects step");

    // ── Step 4: one course per subject — the selects the harness could not touch
    section("A course per subject: qualification and tier");
    const qual = (n) => p.selectUnderNth("Qualification", n);
    const level = (n) => p.selectUnderNth("Level", n);
    await p.waitFor(`return !!${qual(0)};`, "the first subject's qualification select");

    const controls = await p.evaluate(`return [...document.querySelectorAll("main label")].filter(l => { const s = l.querySelector(":scope > span"); return s && s.textContent.trim() === "Qualification"; }).length;`);
    check(controls === 2, `each of the two declared subjects gets its OWN qualification control (${controls})`);
    check(await p.valueOf(qual(1)) === "", "and the second subject starts unchosen rather than inheriting the first one's course");

    const courseInfo = await p.evaluate(`const s = ${qual(0)}; return { options: [...s.options].map(o => ({ value: o.value, text: (o.textContent || "").trim() })) };`);
    const gbSpec = courseInfo.options.find((o) => o.value.includes("gcse"))?.value
      ?? courseInfo.options.find((o) => o.value)?.value;
    check(Boolean(gbSpec), `the country's qualifications are offered for the first subject (${courseInfo.options.filter((o) => o.value).map((o) => o.value).join(", ")})`);
    const specText = await p.pick(qual(0), gbSpec, "the first subject's qualification");
    check(await p.valueOf(qual(0)) === gbSpec, `the qualification is chosen by keystroke (${specText})`);

    // THE GATE, WHILE IT IS STILL CLOSED. One course per subject means a
    // half-configured learner must not be able to continue — and the screen has
    // to say which subject it is waiting for AND which part of the course is
    // missing. "needs a course" named neither the field nor a way out: a learner
    // whose year group was never set read it, chose a qualification and a tier,
    // and `Next` stayed dead with nothing left on the screen to change.
    const refused = await p.evaluate(`const b = ${p.buttonMatching('/(Next|Start learning)/')}; return { disabled: b ? b.disabled : null, why: (document.querySelector("main").innerText.match(/(Mathematics|Physics) · needs: [^\\n]+/) || [null])[0] };`);
    check(refused.disabled === true, "with the second subject's course still unchosen the step refuses to continue");
    check(Boolean(refused.why), `and it names the subject it is waiting for, with the field it is missing (${refused.why})`);
    check(/Qualification/.test(refused.why ?? ""), "and the field it names is the one that is actually missing");

    // The tier select only exists once a qualification with tiers is chosen —
    // and the tier options must belong to THAT qualification.
    await p.waitFor(`return !!${level(0)};`, "the tier select to appear with the qualification");
    const tiers = await p.evaluate(`return [...${level(0)}.options].map(o => o.value);`);
    const tier = tiers.includes("foundation") ? "foundation" : tiers[0];
    await p.pick(level(0), tier, "the first subject's tier");
    check(await p.valueOf(level(0)) === tier, `and the tier belongs to it (${tier} of ${tiers.join(", ")})`);

    // The second subject — its own course, chosen separately.
    await p.pick(qual(1), gbSpec, "the second subject's qualification");
    check(await p.valueOf(qual(1)) === gbSpec, "the second subject's course is chosen separately, not copied");
    if (await p.evaluate(`return !!${level(1)};`)) {
      const tiers2 = await p.evaluate(`return [...${level(1)}.options].map(o => o.value);`);
      await p.pick(level(1), tiers2.includes("foundation") ? "foundation" : tiers2[0], "the second subject's tier");
      check(await p.valueOf(level(1)) !== "", "and its tier is answered too");
    }
    const enabled = await p.evaluate(`const b = ${p.buttonMatching('/(Next|Start learning)/')}; return b ? !b.disabled : null;`);
    check(enabled === true, "once both subjects have a course, the step opens");
    await p.clickExpr(`${p.labelWith("AQA")}?.querySelector("input")`, "the AQA board");
    const boardOn = await p.evaluate(`return ${p.labelWith("AQA")}?.className.includes("on") ?? false;`);
    check(boardOn, "the exam board is a declared choice, not a default");
    await p.clickNext("the course step");

    // ── Step 5: goals ───────────────────────────────────────────────────────
    section("Why they are learning");
    await p.waitFor(`return !!${p.selectUnder("Main reason")};`, "the goals step");
    await p.pick(p.selectUnder("Main reason"), "exams", "main reason");
    check(await p.valueOf(p.selectUnder("Main reason")) === "exams", "the coarse reason is chosen (exams)");
    await p.typeInto(`[...document.querySelectorAll("main input[type=text]")].find(i => i.value === "")`, "I want to pass my GCSE maths", "the goal field");
    const goal = await p.valueOf(`[...document.querySelectorAll("main input[type=text]")].find(i => i.value)`);
    check(/pass my GCSE/.test(goal ?? ""), `and their own words are recorded ("${goal}")`);
    await p.clickNext("the goals step");

    // ── Step 6: how it should talk to them — the language controls ──────────
    section("How OpenMind should talk to them");
    const LANG = "Language";
    const TEACH = "Teaching language (explanations)";
    const ANSWER = "Answer language (I reply in)";
    const SCHOOL = "My school uses (keep terms in)";
    await p.waitFor(`return !!${p.selectUnder(LANG)};`, "the language step");

    // The interface language is not a preference the page merely stores: it
    // switches the page. Change it, prove the document changed with it, and put
    // it back — every label the walk matches after this point is English.
    const englishH1 = await p.evaluate(`return document.querySelector("main h1").textContent.trim();`);
    // Addressed by POSITION, not by its label: one real key press re-renders the
    // page in the chosen language, so the English label this control had is gone
    // by the time anyone looks again.
    const LANG_SEL = '[...document.querySelectorAll("main select")][0]';
    await p.pick(LANG_SEL, "fr", "interface language", 'document.documentElement.lang === "fr"');
    await p.waitFor(`return document.documentElement.lang === "fr";`, "the interface to switch language");
    const switched = await p.evaluate(`return { h1: document.querySelector("main h1").textContent.trim(), dir: document.documentElement.dir, stored: localStorage.getItem("openmind:lang") };`);
    check(switched.h1 !== englishH1 && switched.stored === "fr",
      `choosing the interface language switches the interface itself ("${englishH1}" → "${switched.h1}", dir ${switched.dir})`);
    await p.pick(LANG_SEL, "en", "interface language", 'document.documentElement.lang === "en"');
    await p.waitFor(`return document.documentElement.lang === "en";`, "the interface to return to English");

    await p.pick(p.selectUnder(TEACH), "es", "teaching language");
    check(await p.valueOf(p.selectUnder(TEACH)) === "es", "the teaching language is chosen by keystroke (es)");
    await p.pick(p.selectUnder(ANSWER), "fr", "answer language");
    check(await p.valueOf(p.selectUnder(ANSWER)) === "fr", "and the language they answer in is a separate choice (fr)");
    await p.pick(p.selectUnder(SCHOOL), "en", "school language");
    check(await p.valueOf(p.selectUnder(SCHOOL)) === "en", "as is the language their school's terms stay in");
    await p.clickExpr(`${p.labelWith("Local terms only")}?.querySelector("input")`, "the local-terms choice");
    check(await p.evaluate(`return ${p.labelWith("Local terms only")}?.className.includes("on") ?? false;`), "and the terminology choice registers");
    await p.clickNext("the last step");

    // ── The walk lands, and the server has what the screen promised ─────────
    section("Where the walk lands, and what the server stored");
    await p.waitFor(`return location.pathname.startsWith("/diagnostic/");`, "the enrolment to finish and the diagnostic to open", 25000);
    const landed = await p.evaluate(`return { path: location.pathname, subject: location.pathname.split("/").pop() };`);
    check(landed.subject === "maths", `a new learner lands on the diagnostic for their first subject (${landed.path})`);

    const stored = await p.evaluate(`return { id: localStorage.getItem("openmind:profileId"), secret: localStorage.getItem("openmind:profileSecret") };`);
    profileId = stored.id;
    check(Boolean(stored.id && stored.secret), `the browser holds the profile it just created (${stored.id})`);
    const res = await fetch(`${BASE}/api/profile?id=${stored.id}&secret=${stored.secret}`);
    const body = await res.json();
    const prof = body.profile ?? {};
    check(prof.country === "GB", `the country the learner chose is stored (${prof.country})`);
    check(prof.grade === "Year 10", `and the year group (${prof.grade})`);
    check((prof.subjects ?? []).includes("physics") && (prof.subjects ?? []).includes("maths"), `both subjects are stored (${(prof.subjects ?? []).join(", ")})`);
    check(prof.subjectCourses?.maths?.spec === gbSpec, `the first subject's qualification is the one chosen (${prof.subjectCourses?.maths?.spec})`);
    check(prof.subjectCourses?.maths?.specLevel === tier, `with the tier chosen beside it (${prof.subjectCourses?.maths?.specLevel})`);
    check(prof.subjectCourses?.physics?.spec === gbSpec, `and the second subject has its OWN course, not the first one's silence (${JSON.stringify(prof.subjectCourses?.physics)})`);
    check(prof.spec === gbSpec, `the single-course mirror follows the first subject (${prof.spec})`);
    check(prof.board === "aqa", `the board is stored (${prof.board})`);
    check(prof.goal === "I want to pass my GCSE maths", `the learner's own goal is stored ("${prof.goal}")`);
    check(prof.teachingLang === "es" && prof.answerLang === "fr", `both language choices are stored (${prof.teachingLang}, ${prof.answerLang})`);
    check(prof.schoolLang === "en", `and the school's language (${prof.schoolLang})`);
    check(prof.language === "en", `and the interface language it finished in (${prof.language})`);
    check(prof.termsMode === "local", `and the terminology preference (${prof.termsMode})`);

    // LEAVE THE STORE AS IT FOUND IT. A gate that runs on every change must not
    // fill the data store with the learners it made — and the erasure door is the
    // product's own, so this exercises it too.
    const erase = await fetch(`${BASE}/api/profile?id=${stored.id}&secret=${encodeURIComponent(stored.secret)}&confirm=ERASE`, { method: "DELETE" });
    const erasure = await erase.json();
    check(erase.status === 200 && erasure.removed === true, `and the walk erases the learner it created through the erasure door (removed=${erasure.removed})`);
    if (erase.status === 200) profileId = null;
  } catch (err) {
    failed++;
    console.log(`   ✗ FAIL: ${err.message}`);
  } finally {
    await close();
  }

  console.log(`\n════ UI walk: ${passed} passed, ${failed} failed ════`);
  if (profileId) console.log(`Learner created by this walk: ${profileId} (clean up with scripts/cleanup-e2e-store.mjs)`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
