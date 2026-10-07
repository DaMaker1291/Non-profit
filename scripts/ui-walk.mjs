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
//
// THE BROWSER ITSELF IS NOT THIS FILE'S BUSINESS. Chrome, the CDP client and
// the element addresser live in scripts/browser.mjs, because the published
// static build needs the same three things (scripts/static-page-walk.mjs) and
// two copies of a browser harness is two chances to drive a subtly different
// browser. What stays here is what only this walk knows: the Next application's
// wizard, its field labels, its selects and its Next button.
// ─────────────────────────────────────────────────────────────────────────────
import { pageFor, launchChrome, sleep } from "./browser.mjs";

const BASE = process.env.UI_WALK_BASE ?? "http://127.0.0.1:4173";
const PORT = 9333 + Math.floor(Math.random() * 400);

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);// ── What only the NEXT application's wizard needs ────────────────────────────
function nextAppHelpers(base, send) {
  const { evaluate, clickExpr, text, pickOption } = base;

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

  /** This walk's name for the shared select driver. */
  const pick = (selectExpr, wanted, what, settle) => pickOption(selectExpr, wanted, what, settle);

  const stepCounter = () => evaluate(`return (document.querySelector("main")?.innerText || "").match(/Step \\d+ of \\d+/)?.[0] ?? null;`);

  const nextButton = buttonMatching('/(Next|Start learning)/');
  const clickNext = async (what) => {
    const enabled = await evaluate(`const b = ${nextButton}; return b ? !b.disabled : null;`);
    if (enabled === null) throw new Error(`no Next/Start button on the page at ${what}`);
    if (!enabled) { const body = await text(); throw new Error(`the button refuses to advance at ${what} — nothing on screen says why:\n     ${body}`); }
    await clickExpr(nextButton, `the button that advances ${what}`);
  };

  return { pick, stepCounter, clickNext, labelWith, selectUnder, selectUnderNth, buttonMatching };
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

  const { send, close } = await launchChrome({ port: PORT });
  // The shared plumbing, plus what only this walk knows about this application.
  const base = pageFor(send);
  const p = { ...base, ...nextAppHelpers(base, send) };
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

    // THE TIER IS THE LEARNER'S OWN CHOICE. Choosing a tiered qualification
    // must NOT quietly enrol them at the qualification's first tier. Measured
    // live, the select arrived with `levels[0]` (GCSE Foundation) already
    // selected, so a Higher candidate was served — and taught — at Foundation
    // depth without ever making that choice. The placeholder is the field
    // saying so, and the gap line names the tier it is waiting for.
    await p.waitFor(`return !!${level(0)};`, "the tier select to appear with the qualification");
    check(await p.valueOf(level(0)) === "", "choosing a tiered qualification leaves the tier UNCHOSEN rather than defaulting to its first one");
    const missingTier = await p.evaluate(`return (document.querySelector("main").innerText.match(/Mathematics · needs: [^\\n]+/) || [null])[0];`);
    check(/Level/.test(missingTier ?? ""), `and the step names the tier it is waiting for (${missingTier})`);

    // The tier options must belong to THAT qualification.
    const tiers = await p.evaluate(`return [...${level(0)}.options].map(o => o.value).filter(Boolean);`);
    const tier = tiers.includes("foundation") ? "foundation" : tiers[0];
    check(Boolean(tier), `the qualification's tiers are offered (${tiers.join(", ")})`);
    await p.pick(level(0), tier, "the first subject's tier");
    check(await p.valueOf(level(0)) === tier, `and the tier belongs to it (${tier})`);

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

    // The second subject — its own course, chosen separately.
    await p.pick(qual(1), gbSpec, "the second subject's qualification");
    check(await p.valueOf(qual(1)) === gbSpec, "the second subject's course is chosen separately, not copied");
    if (await p.evaluate(`return !!${level(1)};`)) {
      const tiers2 = await p.evaluate(`return [...${level(1)}.options].map(o => o.value).filter(Boolean);`);
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

    // ── The very first screen a new learner meets, in their own browser ──────
    // A sitting is adaptive, so it has no fixed length — and it used to show a
    // bare `01.` with no total, no concept named and no exit, which reads as
    // open-ended. The denominator is the ENGINE's estimate (it simulates the
    // climb), the concept is named, and a learner who does not know can say so
    // instead of guessing.
    // The counters render only once the first question has been served, so wait
    // for the sitting rather than reading the screen mid-fetch.
    await p.waitFor(`return /Question \\d+ of about \\d+/.test(document.querySelector("main").innerText);`, "the sitting to serve its first question and say how long it is", 20000);
    const sitting = await p.evaluate(`const t = document.querySelector("main").innerText; const progress = (t.match(/Question \\d+ of about \\d+/) || [null])[0]; const buttons = [...document.querySelectorAll("main button")].map((b) => b.textContent.trim()); const links = [...document.querySelectorAll("main a")].map((a) => a.textContent.trim()); return { progress, sure: buttons.some((x) => /I think I know/.test(x)), unsure: buttons.some((x) => /I'm unsure/.test(x)), idk: buttons.some((x) => /I don't know/.test(x)), ask: !!document.querySelector("[data-certainty]"), choices: document.querySelectorAll("main .choices button").length, leave: links.some((x) => /Leave for now/.test(x)) };`);
    check(/^Question \d+ of about \d+$/.test(sitting.progress ?? ""), `the sitting says how long it is, approximately (${sitting.progress})`);
    check(sitting.sure && sitting.unsure && sitting.idk,
      "and asks how sure the learner is, with an honest way to say they don't know");
    // COMMITTED BEFORE THE VERDICT: the choices stay hidden until the learner has
    // said, so a grade can never contaminate the self-report.
    check(sitting.ask === true && sitting.choices === 0,
      `the choices are withheld until the learner says how sure they are (${sitting.choices} shown)`);
    check(sitting.leave, "and a way to leave without losing the sitting");

    // And the self-report actually drives the sitting: saying it reveals the
    // choices, and answering is marked server-side as always.
    await p.clickExpr(`[...document.querySelectorAll("[data-certainty] button")].find(b => /think I know/.test(b.textContent || ""))`, 'the "I think I know" choice');
    await p.waitFor(`return document.querySelectorAll("main .choices button").length > 0;`, "the choices to appear once the learner has said", 10000);
    check(true, "saying how sure you are reveals the choices");
    await p.clickExpr(`[...document.querySelectorAll("main .choices button")][0]`, "the first choice");
    await p.waitFor(`return !!document.querySelector("main .marking");`, "the answer to come back marked", 15000);
    const marked = await p.evaluate(`const m = document.querySelector("main .marking"); return { cls: m ? m.className : "" };`);
    check(/good|bad/.test(marked.cls), `and the answer is still marked by the server (${marked.cls})`);

    // ── §14: a paper is sat like an exam, not scrolled like a worksheet ─────
    // The walk's learner is enrolled on GCSE maths, so the papers surface has a
    // paper for them. The claim is that the sitting FEELS like an exam: a header
    // that names the board and tier, a counter that says which question of how
    // many, a grid to jump through, a flag, and Prev / Next / Finish.
    section("A paper is sat like an exam");
    await p.goto(`${BASE}/papers`);
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Start/.test(b.textContent || ""));`, "the paper picker to offer a paper to start", 20000);
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Start/.test(b.textContent || ""))`, "the first paper's Start button");
    await p.waitFor(`return !!document.querySelector("[data-exam-head]") && /Question 1 of \\d+/.test(document.querySelector("[data-question-of]")?.textContent || "");`, "the exam header to name question 1 of how many", 25000);
    const exam = await p.evaluate(`
      const head = document.querySelector("[data-exam-head]");
      const of = document.querySelector("[data-question-of]")?.textContent?.trim() ?? "";
      const nums = [...document.querySelectorAll("[data-question-grid] button")].map(b => (b.textContent || "").trim()).filter(x => /^\\d+$/.test(x));
      const labels = [...document.querySelectorAll("main button")].map(b => (b.textContent || "").trim());
      return { head: (head?.innerText || "").replace(/\\n+/g, " · "), of, count: nums.length, flag: (document.querySelector("[data-flag-control]")?.textContent || "").trim(), prev: labels.some(x => /Previous/.test(x)), next: labels.some(x => /Next/.test(x)), finish: labels.some(x => /Finish/.test(x)) };
    `);
    check(/ · /.test(exam.head) && exam.head.length > 6, `the exam header names the paper's board, qualification and tier (${exam.head})`);
    check(/^Question 1 of \d+$/.test(exam.of ?? ""), `the sitting says which question of how many (${exam.of})`);
    check(exam.count >= 10, `every question in the paper gets a numbered press in the grid (${exam.count})`);
    check(Boolean(exam.flag), `a question can be flagged to come back to (${exam.flag})`);
    check(exam.prev && exam.next && exam.finish, "and the candidate can go back, forward, or finish at any point");

    // The grid must MOVE the sitting, not merely highlight a box.
    await p.clickExpr(`[...document.querySelectorAll("[data-question-grid] button")].find(b => (b.textContent || "").trim() === "3")`, "question 3 in the grid");
    await p.waitFor(`return /Question 3 of \\d+/.test(document.querySelector("[data-question-of]")?.textContent || "");`, "the grid to move the sitting to question 3", 8000);
    check(true, "the grid jumps the sitting to the question it names");

    // Flagging must mark the QUESTION, not just the button.
    await p.clickExpr(`document.querySelector("[data-flag-control]")`, "the flag control");
    const flagged = await p.evaluate(`const b = document.querySelector("[data-flag-control]"); return { pressed: b?.getAttribute("aria-pressed"), label: (b?.textContent || "").trim(), marked: [...document.querySelectorAll("[data-question-grid] button")].some(x => x.getAttribute("data-flagged") === "1") };`);
    check(flagged.pressed === "true" && flagged.marked, `flagging marks the question to come back to (${flagged.label})`);

    // §20: the shell names the learner's COURSE, not just the page. The whole
    // experience changes with it — curriculum map, questions, papers, vocabulary
    // — and none of that was visible from the chrome, which showed a subject
    // name and a board code and nothing about which course this actually was.
    section("The shell names the learner's course");
    const strip = await p.evaluate(`const el = document.querySelector("[data-context-strip]"); return { text: ((el?.innerText || el?.textContent || "")).trim(), label: el?.getAttribute("aria-label") ?? "" };`);
    check(/United Kingdom/.test(strip.text) && /GCSE/.test(strip.text) && /AQA/.test(strip.text) && /Year 10/.test(strip.text),
      `the shell names the learner's own country, course, board and year (${strip.text})`);
    check(/Mathematics/.test(strip.text),
      "and the subject they are being taught, in their own course's words");
    check(Boolean(strip.label), "with an accessible name — it is a run of bare nouns joined by separators");

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
