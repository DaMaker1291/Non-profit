#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE UI WALK — a real browser, driving the real wizard.
//
// WHY THIS EXISTS. Every pass of this campaign verified the middle of the
// enrolment wizard — country, subjects, qualification, tier, language — by
// READING THE DOM, never by clicking it, because the controls are native
// `<select>`s and React rejects a synthetic `change` event: dispatch one and the
// select shows the new value while the component's state stays put, so the
// wizard does not move. That is an instrumentation limit, and it left the exact
// steps nobody had driven as the exact steps nobody had verified. A pin that
// cannot touch the control it guards is not a gate.
//
// WHAT IT DOES INSTEAD. It drives Chrome through the DevTools Protocol with
// REAL input events — trusted mouse clicks and real key presses — so the
// browser's own event pipeline fires the `change` React is listening for. No
// dependency is added: Chrome and Node's global WebSocket are enough.
//
// WHAT IT PROVES. A fresh learner (empty browser storage, no account) can enrol
// in THREE screens — an account (or an honest "not yet"), where they are and
// what they read, and what they study — and nothing else is asked at the door.
// The course, the year group and the preferences are then driven on the pages
// that own them (`/curriculum`, `/access`), because that is where a learner can
// answer them with something to go on. Every step's `Next` is enabled only when
// the step is answered, and the profile the SERVER stored matches what the
// screens said it would.
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
  const buttonMatching = (re) => `[...document.querySelectorAll("main button")].find(b => ${re}.test(b.textContent || ""))`;

  /** This walk's name for the shared select driver. */
  const pick = (selectExpr, wanted, what, settle) => pickOption(selectExpr, wanted, what, settle);

  // The counter is written `Step 2/3` on the page. Matched loosely and compared
  // EXACTLY, because a loose match is how the old walk kept a step counter it
  // never asserted.
  const stepCounter = () => evaluate(`return (document.querySelector("main")?.innerText || "").match(/Step \\d+\\s*\\/\\s*\\d+/)?.[0] ?? null;`);

  const nextButton = buttonMatching('/(Next|Start learning)/');
  const clickNext = async (what) => {
    const enabled = await evaluate(`const b = ${nextButton}; return b ? !b.disabled : null;`);
    if (enabled === null) throw new Error(`no Next/Start button on the page at ${what}`);
    if (!enabled) { const body = await text(); throw new Error(`the button refuses to advance at ${what} — nothing on screen says why:\n     ${body}`); }
    await clickExpr(nextButton, `the button that advances ${what}`);
  };

  return { pick, stepCounter, clickNext, labelWith, selectUnder, buttonMatching };
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
    check(/^Step 1\s*\/\s*3$/.test(opened.step ?? ""),
      `and the wizard says where they are — the first of THREE screens, not six (${opened.step})`);

    // ── Step 1: the account choice, by real click on the label ──────────────
    await p.clickExpr(p.labelWith("Continue without an account"), "the continue-without-an-account choice");
    const guest = await p.evaluate(`return { h1: document.querySelector("main h1").textContent.trim(), next: ${p.buttonMatching('/(Next|Start learning)/')}?.disabled };`);
    check(guest.h1 === "Continue without an account", `choosing it states what the learner is doing ("${guest.h1}")`);
    check(guest.next === false, "and the step can be completed without inventing an account");
    await p.clickNext("the account step");

    // ── Step 2: where they are and what they read — all of it ───────────────
    section("Where they are and what they read");
    await p.waitFor(`return !!${p.selectUnder("Where you are")};`, "the country select");
    const step2 = await p.stepCounter();
    check(/^Step 2\s*\/\s*3$/.test(step2 ?? ""), `the second of three screens (${step2})`);
    await p.typeInto(`document.querySelector("main input[type=text]")`, "walk_learner", "the display-name field");
    const countryText = await p.pick(p.selectUnder("Where you are"), "GB", "country");
    check(/United Kingdom/.test(countryText), `the country is chosen by keystroke alone (${countryText})`);
    // THE YEAR GROUP IS NOT ASKED HERE ANY MORE. It is a fact about a course the
    // learner has not chosen yet, and the screen that asks for the course asks
    // for it (`/curriculum`). The walk proves the deferral instead of trusting
    // it: there is no grade control on this screen.
    check(await p.evaluate(`return !!${p.selectUnder("Your grade level")};`) === false,
      "the year group is not asked at sign-up, where nothing yet depends on it");

    // The interface language is not a preference the page merely stores: it
    // switches the page. Change it, prove the document changed with it, and put
    // it back — every label the walk matches after this point is English.
    const englishH1 = await p.evaluate(`return document.querySelector("main h1").textContent.trim();`);
    // Addressed by POSITION, not by its label: one real key press re-renders the
    // page in the chosen language, so the English label this control had is gone
    // by the time anyone looks again. [0] is the country, [1] the language.
    const LANG_SEL = '[...document.querySelectorAll("main select")][1]';
    await p.pick(LANG_SEL, "fr", "interface language", 'document.documentElement.lang === "fr"');
    await p.waitFor(`return document.documentElement.lang === "fr";`, "the interface to switch language");
    const switched = await p.evaluate(`return { h1: document.querySelector("main h1").textContent.trim(), dir: document.documentElement.dir, stored: localStorage.getItem("openmind:lang") };`);
    check(switched.h1 !== englishH1 && switched.stored === "fr",
      `choosing the interface language switches the interface itself ("${englishH1}" → "${switched.h1}", dir ${switched.dir})`);
    await p.pick(LANG_SEL, "en", "interface language", 'document.documentElement.lang === "en"');
    await p.waitFor(`return document.documentElement.lang === "en";`, "the interface to return to English");
    await p.clickNext("the about step");

    // ── Step 3: subjects — checkboxes, and the last screen ─────────────────
    section("What they study");
    await p.waitFor(`return !!${p.labelWith("Physics")};`, "the subject choices");
    const step3 = await p.stepCounter();
    check(/^Step 3\s*\/\s*3$/.test(step3 ?? ""), `and the third screen is the last one (${step3})`);
    await p.clickExpr(`${p.labelWith("Physics")}?.querySelector("input")`, "the Physics subject");
    const subjects = await p.evaluate(`return [...document.querySelectorAll("main input[type=checkbox]")].filter(i => i.checked).map(i => (i.closest("label")?.textContent || "").trim());`);
    check(subjects.some((s) => /Physics/.test(s)), `a second subject can be added (${subjects.join(", ")})`);
    await p.clickNext("the subjects step");

    // ── The walk lands on the COURSE, because a course is a required field ──
    //
    // Enrolment collected where and what. The qualification and its tier are
    // chosen on /curriculum — and the baseline diagnostic is a measurement OF a
    // course, so the guard sends an enrolled, course-less learner there first
    // rather than sampling the fallback syllabus and building every later
    // recommendation on it. The order is therefore
    // `onboarding → course → diagnostic → home`, and it is proven here rather
    // than described: landing, a refused diagnostic, and a refused lesson.
    section("Where the walk lands: the required course comes first");
    await p.waitFor(`return location.pathname === "/curriculum";`, "the enrolment to finish and the course screen to open", 25000);
    const landed = await p.evaluate(`return { path: location.pathname };`);
    check(landed.path === "/curriculum", `a new learner lands on the course screen, not the diagnostic (${landed.path})`);
    // AND THE GATE IS REAL, not a suggestion: the pages that need a course refuse
    // an enrolled learner who has not chosen one.
    await p.goto(`${BASE}/diagnostic/maths`);
    await p.waitFor(`return location.pathname === "/curriculum";`, "the diagnostic to refuse a course-less learner", 20000);
    const bounced = await p.evaluate(`return location.pathname + location.search;`);
    check(/^\/curriculum\?return=/.test(bounced),
      `the baseline diagnostic refuses a learner with no course, and keeps where they were going (${bounced})`);
    await p.goto(`${BASE}/learn/maths/fractions`);
    await p.waitFor(`return location.pathname === "/curriculum";`, "the lesson page to refuse a course-less learner", 20000);
    check(true, "and so does the learning surface, which would otherwise be served the fallback syllabus");

    // ── THE COURSE IS ASKED LATER, WHERE IT CAN BE EXPLAINED ────────────────
    // The wizard used to ask for a qualification and a tier at the end of a
    // sign-up, which is the worst moment to ask a tired learner to name a paper
    // they have not been taught yet — and seeding `levels[0]` enrolled them at
    // the easier tier without their having chosen it. The course now lives on
    // the screen whose job is changing it, and these are the claims that matter:
    // nothing is saved that the learner did not choose, a tiered qualification
    // arrives UNCHOSEN, and the screen names the part it is waiting for.
    section("The course is chosen where it can be explained");
    await p.goto(`${BASE}/curriculum`);
    await p.waitFor(`return !!document.querySelector("#curr-spec");`, "the course screen", 20000);
    const saveCourse = p.buttonMatching('/Save my course/');
    const beforeChoice = await p.evaluate(`const b = ${saveCourse}; return { disabled: b ? b.disabled : null, why: (document.querySelector("main .field-error")?.textContent || "").trim() };`);
    check(beforeChoice.disabled === true,
      "a learner who has never chosen a course cannot save the one the page fell back to");
    check(/Qualification|Course/i.test(beforeChoice.why), `and the screen names what is still missing (${beforeChoice.why})`);
    const specInfo = await p.evaluate(`const s = document.querySelector("#curr-spec"); return { first: (s.options[0]?.textContent || "").trim(), value: s.value };`);
    check(specInfo.value === "" && /Choose your qualification/i.test(specInfo.first),
      `and the qualification control opens on a prompt, not on the fallback wearing the learner's name (${specInfo.first})`);

    const courseOptions = await p.evaluate(`return [...document.querySelector("#curr-spec").options].map(o => ({ value: o.value, text: (o.textContent || "").trim() }));`);
    const gbSpec = courseOptions.find((o) => /gcse/i.test(o.value) && /mathematics/i.test(o.text))?.value
      ?? courseOptions.find((o) => /gcse/i.test(o.value))?.value
      ?? courseOptions[0]?.value ?? "";
    check(Boolean(gbSpec), `the country's qualifications are offered (${courseOptions.map((o) => o.value).join(", ")})`);
    await p.pick(`document.querySelector("#curr-spec")`, gbSpec, "the maths qualification");
    check(await p.valueOf(`document.querySelector("#curr-spec")`) === gbSpec, `the qualification is chosen by keystroke (${gbSpec})`);

    // THE TIER IS THE LEARNER'S OWN CHOICE. Choosing a tiered qualification must
    // NOT quietly enrol them at the qualification's first tier — measured live,
    // the select arrived with `levels[0]` (GCSE Foundation) already selected, so
    // a Higher candidate was served — and taught — at Foundation depth without
    // ever making that choice.
    await p.waitFor(`return !!document.querySelector("#curr-level");`, "the tier select");
    check(await p.valueOf(`document.querySelector("#curr-level")`) === "",
      "choosing a tiered qualification leaves the tier UNCHOSEN rather than defaulting to its first one");
    const tierInfo = await p.evaluate(`const s = document.querySelector("#curr-level"); return { first: (s.options[0]?.textContent || "").trim(), options: [...s.options].map(o => o.value).filter(Boolean) };`);
    check(/Choose a tier/i.test(tierInfo.first),
      `and the empty option is a prompt, not a tier wearing the learner's name (${tierInfo.first})`);
    const refusedCourse = await p.evaluate(`const b = ${saveCourse}; return { disabled: b ? b.disabled : null, why: (document.querySelector("main .field-error")?.textContent || "").trim() };`);
    check(refusedCourse.disabled === true, "so Save refuses the course while the tier is unanswered");
    check(/Level|Tier/i.test(refusedCourse.why), `and names the tier it is waiting for (${refusedCourse.why})`);

    const tier = tierInfo.options.includes("foundation") ? "foundation" : tierInfo.options[0];
    await p.pick(`document.querySelector("#curr-level")`, tier, "the maths tier");
    check(await p.valueOf(`document.querySelector("#curr-level")`) === tier, `and the tier belongs to that qualification (${tier})`);
    // THE YEAR GROUP IS PART OF THE COURSE, so Save waits for it too. It did
    // not: a learner could answer the qualification and the tier, read "Saved ✓"
    // and be told "needs: year group" by Home — a save that leaves the course
    // still incomplete is the loop this screen exists to close.
    const beforeGrade = await p.evaluate(`const b = ${saveCourse}; return { disabled: b ? b.disabled : null, why: (document.querySelector("main .field-error")?.textContent || "").trim() };`);
    check(beforeGrade.disabled === true && /Year|Grade/i.test(beforeGrade.why),
      `and Save waits for the year group the course also needs (${beforeGrade.why})`);
    // The tier this learner ends the walk on. It starts as the one chosen here
    // and moves if the check below changes it — the stored-profile section reads
    // the SERVER, so it has to compare against the last thing the walk chose, not
    // against the first.
    let mathsTier = tier;

    // The year group is asked HERE, beside the course it describes.
    await p.waitFor(`return [...(${p.selectUnder("Your grade level")}?.options ?? [])].some(o => o.value === "Year 10");`, "the country's year groups");
    await p.pick(p.selectUnder("Your grade level"), "Year 10", "year group");
    check(await p.valueOf(p.selectUnder("Your grade level")) === "Year 10", "and the year group is chosen beside its course (Year 10)");

    check(await p.evaluate(`const b = ${saveCourse}; return b ? !b.disabled : null;`) === true,
      "once the course and its tier are answered, Save opens");
    await p.clickExpr(saveCourse, "Save my course");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the course to be saved", 10000);
    check(true, "and the screen confirms the save rather than claiming it silently");

    // ── A COURSE ALREADY CHOSEN IS NOT ASKED FOR AGAIN ──────────────────────
    //
    // The report this pins: "⚠ Still to choose: Level" over a course that HAS a
    // tier, on every visit — the gate counted only the select's own value, which
    // is empty until the control is touched, and forgot that the learner had
    // already answered. Driving only the first save could never see it, because
    // the state it fails in is the state AFTER a save.
    section("A tier already chosen is not asked for again");
    await p.goto(`${BASE}/curriculum`);
    await p.waitFor(`return !!document.querySelector("#curr-level");`, "the course screen to reopen after the save", 20000);
    const reopened = await p.evaluate(`const l = document.querySelector("#curr-level"); const s = document.querySelector("#curr-spec"); return { spec: s.value, tier: l.value, shown: l.selectedOptions[0].textContent.trim(), why: (document.querySelector("main .field-error")?.textContent || "").trim(), disabled: document.querySelector("main .actions button")?.disabled };`);
    check(reopened.spec === gbSpec && reopened.tier === tier,
      `the course saved a moment ago comes back chosen (${reopened.shown})`);
    check(!/Still to choose|needs/i.test(reopened.why),
      `and the screen does not ask for the tier again (${reopened.why || "no warning"})`);
    check(reopened.disabled === false, "so Save is open without the learner re-answering anything");

    // AND A TIER CHANGED ON ITS OWN IS THE TIER THAT IS SAVED. The page read the
    // qualification select first and the tier only when that had been touched, so
    // with a stored course filling it the new tier was dropped: the control
    // snapped back and Save wrote the old one.
    const otherTier = (await p.evaluate(`return [...document.querySelector("#curr-level").options].map(o => o.value).filter(Boolean);`)).find((v) => v !== tier);
    check(Boolean(otherTier), `the qualification offers a second tier to change to (${otherTier})`);
    if (otherTier) {
      await p.pick(`document.querySelector("#curr-level")`, otherTier, "the other tier");
      check(await p.valueOf(`document.querySelector("#curr-level")`) === otherTier,
        `a change of tier is kept by the control (${otherTier})`);
      await p.clickExpr(saveCourse, "Save the changed tier");
      await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the changed tier to save", 10000);
      await p.goto(`${BASE}/curriculum`);
      await p.waitFor(`return !!document.querySelector("#curr-level");`, "the course screen to reopen", 20000);
      const kept = await p.valueOf(`document.querySelector("#curr-level")`);
      check(kept === otherTier, `and the changed tier is what comes back after a reload (${kept})`);
      mathsTier = otherTier;
    }

    // The second subject has its OWN course control, chosen separately. The
    // "Saved ✓" badge is timed (2.5s), so wait for the button to offer itself
    // again before addressing it — a label that has not reset yet is not a
    // missing control.
    await sleep(2700);
    await p.waitFor(`return !!${saveCourse};`, "the course button to offer itself again");
    await p.clickExpr(p.buttonMatching('/Physics/'), "the Physics chip");
    await p.waitFor(`return [...document.querySelectorAll("main p strong")].some(s => s.textContent.trim() === "Physics");`, "the Physics course panel");
    await p.pick(`document.querySelector("#curr-spec")`, gbSpec, "the physics qualification");
    if (await p.valueOf(`document.querySelector("#curr-level")`) === "") {
      const phyTiers = await p.evaluate(`return [...document.querySelector("#curr-level").options].map(o => o.value).filter(Boolean);`);
      await p.pick(`document.querySelector("#curr-level")`, phyTiers.includes("foundation") ? "foundation" : phyTiers[0], "the physics tier");
    }
    await p.clickExpr(saveCourse, "Save my course for Physics");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the second course to be saved", 10000);
    check(true, "the second subject's course is saved separately, not inherited from the first");

    // ── NOW THE BASELINE, WHICH THE COURSE JUST UNLOCKED ──────────────────────
    // /curriculum is public and carries no ticket for a learner who simply
    // enrolled, so the walk asks for the diagnostic by name — the same door the
    // guard refused a moment ago, and the proof that the refusal was about the
    // course rather than about the learner.
    section("The baseline diagnostic the course unlocked");
    await p.goto(`${BASE}/diagnostic/maths`);
    await p.waitFor(`return /Question \\d+ of about \\d+/.test(document.querySelector("main").innerText);`, "the sitting to serve its first question and say how long it is", 25000);
    const sitting = await p.evaluate(`const t = document.querySelector("main").innerText; const progress = (t.match(/Question \\d+ of about \\d+/) || [null])[0]; const buttons = [...document.querySelectorAll("main button")].map((b) => b.textContent.trim()); const links = [...document.querySelectorAll("main a")].map((a) => a.textContent.trim()); return { progress, sure: buttons.some((x) => /I think I know/.test(x)), unsure: buttons.some((x) => /I'm unsure/.test(x)), idk: buttons.some((x) => /I don't know/.test(x)), ask: !!document.querySelector("[data-certainty]"), choices: document.querySelectorAll("main .choices button").length, leave: links.some((x) => /Leave for now/.test(x)) };`);
    check(/^Question \d+ of about \d+$/.test(sitting.progress ?? ""), `the sitting says how long it is, approximately (${sitting.progress})`);
    check(sitting.sure && sitting.unsure && sitting.idk,
      "and asks how sure the learner is, with an honest way to say they don't know");
    check(sitting.ask === true && sitting.choices === 0,
      `the choices are withheld until the learner says how sure they are (${sitting.choices} shown)`);
    check(sitting.leave, "and a way to leave without losing the sitting");
    await p.clickExpr(`[...document.querySelectorAll("[data-certainty] button")].find(b => /think I know/.test(b.textContent || ""))`, 'the "I think I know" choice');
    await p.waitFor(`return document.querySelectorAll("main .choices button").length > 0;`, "the choices to appear once the learner has said", 10000);
    check(true, "saying how sure you are reveals the choices");
    await p.clickExpr(`[...document.querySelectorAll("main .choices button")][0]`, "the first choice");
    await p.waitFor(`return !!document.querySelector("main .marking");`, "the answer to come back marked", 15000);
    const marked = await p.evaluate(`const m = document.querySelector("main .marking"); return { cls: m ? m.className : "" };`);
    check(/good|bad/.test(marked.cls), `and the answer is still marked by the server (${marked.cls})`);

    // ── Everything the screens promised, read back from the SERVER ──────────
    section("What the server stored");
    const stored = await p.evaluate(`return { id: localStorage.getItem("openmind:profileId"), secret: localStorage.getItem("openmind:profileSecret") };`);
    profileId = stored.id;
    check(Boolean(stored.id && stored.secret), `the browser holds the profile it just created (${stored.id})`);
    const res = await fetch(`${BASE}/api/profile?id=${stored.id}&secret=${stored.secret}`);
    const body = await res.json();
    const prof = body.profile ?? {};
    check(prof.country === "GB", `the country the learner chose is stored (${prof.country})`);
    check(prof.grade === "Year 10", `and the year group they deferred, then chose with the course (${prof.grade})`);
    check((prof.subjects ?? []).includes("physics") && (prof.subjects ?? []).includes("maths"), `both subjects are stored (${(prof.subjects ?? []).join(", ")})`);
    check(prof.subjectCourses?.maths?.spec === gbSpec, `the first subject's qualification is the one chosen (${prof.subjectCourses?.maths?.spec})`);
    check(prof.subjectCourses?.maths?.specLevel === mathsTier, `with the tier chosen beside it (${prof.subjectCourses?.maths?.specLevel})`);
    check(prof.subjectCourses?.physics?.spec === gbSpec,
      `and the second subject has its OWN course, not the first one's silence (${JSON.stringify(prof.subjectCourses?.physics)})`);
    check(prof.spec === gbSpec, `the single-course mirror follows the first subject (${prof.spec})`);
    // THE DEFERRED ANSWERS ARE TRUE DEFAULTS, NOT MISSING ONES: the languages the
    // wizard no longer asks each follow the one the learner read, and the goal it
    // no longer asks is empty rather than invented for them.
    check(prof.teachingLang === "en" && prof.answerLang === "en" && prof.schoolLang === "en",
      `the languages nobody was asked follow the one they read (${prof.teachingLang}, ${prof.answerLang}, ${prof.schoolLang})`);
    check(prof.language === "en", `and the interface language it finished in (${prof.language})`);
    check(prof.goal === "", `the goal nobody was asked is empty, not put in their mouth ("${prof.goal}")`);

    // ── AND THE DEFERRED PREFERENCES ARE STILL REACHABLE ────────────────────
    // Deferring a question is only honest if the answer can still be given. This
    // is the screen that owns the terminology choice the wizard used to ask — and
    // the one whose payload once dropped it for a no-account learner.
    section("The rest of the personalisation is still reachable");
    await p.goto(`${BASE}/access`);
    await p.waitFor(`return !!${p.buttonMatching('/Local terms only/')};`, "the preferences screen", 20000);
    await p.clickExpr(p.buttonMatching('/Local terms only/'), "the local-terms choice");
    await p.clickExpr(p.buttonMatching('/^\\s*Save\\s*$/'), "Save on the preferences screen");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the preferences to be saved", 10000);
    const afterAccess = await (await fetch(`${BASE}/api/profile?id=${stored.id}&secret=${stored.secret}`)).json();
    check(afterAccess.profile?.termsMode === "local",
      `the terminology choice a learner makes later is stored (${afterAccess.profile?.termsMode})`);

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

    // ── §stage: ONE STAGE OF A CONCEPT PAGE AT A TIME ──────────────────────
    // The concept page stacked the status card, the lesson, the teach-back, the
    // trap list, the evidence, the question, the tutor and the packs: measured
    // 2,542px on a 1,215px screen, so the question sat two screens below where a
    // learner arrived and the tutor sat beside a card they had to scroll to
    // find. The chips at the top already said "1. Read · 2. Practise"; they did
    // not switch anything. They do now.
    //
    // The tutor's composer is the second half of the same report ("the ask the
    // tutor box is so small"): it measured 41px WIDE, because it was the only
    // shrinkable item in a row it shared with two buttons.
    section("A concept page shows one stage at a time");
    await p.goto(`${BASE}/learn/maths/fractions`);
    await p.waitFor(`return !!document.querySelector("nav button.chip");`, "the stage chips to render", 25000);
    const stageOne = await p.evaluate(`
      const chips = [...document.querySelectorAll("nav button.chip")].map(b => ({ text: (b.textContent || "").trim(), pressed: b.getAttribute("aria-pressed") }));
      return { chips, question: !!document.querySelector(".qprompt"), lesson: !!document.querySelector(".reading"), docH: document.documentElement.scrollHeight, viewH: innerHeight };
    `);
    check(stageOne.chips.length === 2 && stageOne.chips[0].pressed === "true",
      `the page opens on Read, and the stage on screen says so (${stageOne.chips.map((c) => `${c.text}:${c.pressed}`).join(" · ")})`);
    check(stageOne.lesson && !stageOne.question,
      "with the lesson on screen and NO question under it — the session opens in the background and must not hijack the page");

    await p.clickExpr(`[...document.querySelectorAll("nav button.chip")].find(b => /Practise/.test(b.textContent || ""))`, "the Practise chip");
    await p.waitFor(`return !!document.querySelector(".qprompt") && !document.querySelector(".reading");`, "the question to replace the lesson", 20000);
    const stageTwo = await p.evaluate(`
      const ta = document.querySelector(".tutor-form textarea");
      const panel = document.querySelector(".tutor-panel");
      const chip = [...document.querySelectorAll("nav button.chip")].find(b => /Practise/.test(b.textContent || ""));
      return { ta: ta ? Math.round(ta.getBoundingClientRect().width) : 0, taH: ta ? Math.round(ta.getBoundingClientRect().height) : 0, panel: panel ? Math.round(panel.getBoundingClientRect().height) : 0, pressed: chip?.getAttribute("aria-pressed"), docH: document.documentElement.scrollHeight };
    `);
    check(stageTwo.pressed === "true", `pressing Practise switches the page to the session (${stageTwo.docH}px: the question, not the reading)`);
    check(stageTwo.ta >= 240, `and the tutor's box is a box, not a sliver (${stageTwo.ta}×${stageTwo.taH}px; measured 41px wide before this)`);
    check(stageTwo.panel >= 400, `with a panel tall enough to hold a conversation in (${stageTwo.panel}px)`);

    await p.clickExpr(`[...document.querySelectorAll("nav button.chip")].find(b => /Read/.test(b.textContent || ""))`, "the Read chip");
    await p.waitFor(`return !!document.querySelector(".reading") && !document.querySelector(".qprompt");`, "the lesson to come back", 10000);
    check(true, "and Read brings the lesson back, so the switch is not one-way");

    // §20: the shell names the learner's COURSE, not just the page. The whole
    // experience changes with it — curriculum map, questions, papers, vocabulary
    // — and none of that was visible from the chrome, which showed a subject
    // name and a board code and nothing about which course this actually was.
    section("The shell names the learner's course");
    const strip = await p.evaluate(`const el = document.querySelector("[data-context-strip]"); return { text: ((el?.innerText || el?.textContent || "")).trim(), label: el?.getAttribute("aria-label") ?? "" };`);
    check(/United Kingdom/.test(strip.text) && /GCSE/.test(strip.text) && /Year 10/.test(strip.text),
      `the shell names the learner's own country, course and year (${strip.text})`);
    check(/Mathematics/.test(strip.text),
      "and the subject they are being taught, in their own course's words");
    check(Boolean(strip.label), "with an accessible name — it is a run of bare nouns joined by separators");

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
