#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE COMPUTING JOURNEY — one learner, three lessons, from teaching to evidence.
//
// The lesson walk proves a page renders. This walk proves a learner can USE it:
//
//   enrol → choose a Computing course → read the teaching → open a hint →
//   attempt a graded item, get it wrong, read the feedback → answer it correctly
//   → repair and run the Python exercise → open the self-marked criteria →
//   confirm the server stored the evidence → open the next activity Home offers.
//
// It reads the store on disk as well as the page, because a green "Correct" label
// is not the same claim as a projected record. That is the distinction the
// reports keep: the browser proves the interaction, the file proves persistence.
//
// Usage:
//   OPENMIND_DATA_DIR=/tmp/openmind-journey npm run dev
//   OPENMIND_DATA_DIR=/tmp/openmind-journey node scripts/computing-journey-check.mjs
//
// The store is REQUIRED to be a scratch directory: this walk writes learner
// evidence, and the live `.openmind-data` is the user's own record.
import fs from "node:fs";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.COMPUTING_JOURNEY_BASE ?? "http://127.0.0.1:4173";
const DATA_DIR = process.env.OPENMIND_DATA_DIR ? path.resolve(process.env.OPENMIND_DATA_DIR) : "";
if (!DATA_DIR) {
  console.error("Refusing to run without OPENMIND_DATA_DIR: this walk writes a learner ledger.");
  process.exit(2);
}
if (DATA_DIR === path.join(process.cwd(), ".openmind-data")) {
  console.error(`Refusing to write the journey learner into the live store (${DATA_DIR}).`);
  console.error("Start the server with a scratch OPENMIND_DATA_DIR and pass the same value here.");
  process.exit(2);
}

let passed = 0;
let failed = 0;
const check = (condition, message) => {
  if (condition) {
    passed++;
    console.log(`   ✓ ${message}`);
  } else {
    failed++;
    console.log(`   ✗ FAIL: ${message}`);
  }
};
const section = (name) => console.log(`\n▸ ${name}`);

const LESSONS = [
  {
    id: "lists-arrays",
    title: "lists",
    starterOutput: "3\nNone",
    repairedCode: `def count_above(values, threshold):
    count = 0
    for value in values:
        if value > threshold:
            count = count + 1
    return count

print(count_above([12, 18, 9, 25, 21], 15))`,
    repairedOutput: "3",
    graded: [
      { id: "a2", wrong: "[3,8,5]", right: "[3,8,5,3]" },
      { id: "a4", wrong: "13", right: "12" },
    ],
  },
  {
    id: "functions-code",
    title: "functions",
    starterOutput: "60.0\nNone",
    repairedCode: `def apply_discount(price, percent):
    return price - price * percent / 100

print(apply_discount(80, 25))`,
    repairedOutput: "60.0",
    graded: [
      { id: "a2", wrong: "Hello, Ada", right: "Hello, Ada Hello, Lin" },
      { id: "a4", wrong: "20", right: "24" },
    ],
  },
  {
    id: "dictionaries",
    title: "dictionaries",
    starterOutput: "KeyError",
    repairedCode: `def word_count(words):
    counts = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    return counts

result = word_count(["pen", "book", "pen", "pen"])
print(result["pen"])
print(len(result))`,
    repairedOutput: "3\n2",
    graded: [
      { id: "a2", wrong: "10 0 3", right: "10 0 2" },
    ],
  },
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
}

function ledgerFor(learnerId) {
  const file = path.join(DATA_DIR, "evidence", `${learnerId}.jsonl`);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

async function waitForFile(checkFile, timeoutMs = 5000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (checkFile()) return true;
    await sleep(100);
  }
  return false;
}

async function main() {
  const { send, close } = await launchChrome();
  const base = pageFor(send);
  const p = { ...base, pick: base.pickOption };
  const labelWith = (text) => `[...document.querySelectorAll("main label")].find(l => {
    const span = l.querySelector(":scope > span");
    const own = span ? span.textContent.trim() : (l.textContent || "").trim();
    return own === ${JSON.stringify(text)};
  })`;
  const selectUnder = (text) => `${labelWith(text)}?.querySelector("select")`;
  const buttonMatching = (re) => `[...document.querySelectorAll("main button")].find(b => ${re}.test(b.textContent || ""))`;
  const nextButton = buttonMatching("/(Next|Start learning)/");
  const saveButton = buttonMatching("/Save my course/");
  const assessment = `document.querySelector('[aria-label="Independent assessment"]')`;

  try {
    section("A learner enrols for Computing, not by borrowing a maths course");
    await p.goto(`${BASE}/onboarding`);
    await p.evaluate(`localStorage.clear(); sessionStorage.clear(); return true;`);
    await p.goto(`${BASE}/onboarding`);
    await p.waitFor(`return !!document.querySelector("main h1");`, "the onboarding wizard", 90000);
    await p.waitFor(`return document.querySelectorAll("main label").length >= 3;`, "the account choices", 30000);
    const labels = await p.evaluate(`return [...document.querySelectorAll("main label")].map(l => (l.textContent || "").trim()).filter(Boolean).slice(0, 8);`);
    const guest = labels.find((text) => /^Continue without an account$/i.test(text));
    if (!guest) throw new Error(`the account step was not in English (labels: ${labels.join(" | ")})`);
    await p.clickExpr(labelWith(guest), "the guest account choice");
    await p.clickExpr(nextButton, "Next on the account step");

    await p.waitFor(`return !!${selectUnder("Where you are")};`, "the about step");
    await p.typeInto(`document.querySelector("main input[type=text]")`, "journey_learner", "the display-name field");
    await p.pick(selectUnder("Where you are"), "GB", "country");
    await p.clickExpr(nextButton, "Next on the about step");

    await p.waitFor(`return !!${labelWith("Computing")};`, "the Computing subject choice");
    await p.clickExpr(`${labelWith("Mathematics")}?.querySelector("input")`, "the Mathematics checkbox, to remove it");
    await p.clickExpr(`${labelWith("Computing")}?.querySelector("input")`, "the Computing checkbox");
    await p.waitFor(`return !!${labelWith("Computing")}?.querySelector("input")?.checked;`, "Computing to be selected");
    const checked = await p.evaluate(`return [...document.querySelectorAll("main input[type=checkbox]")].filter(i => i.checked).map(i => (i.closest("label")?.textContent || "").trim());`);
    check(checked.length === 1 && /Computing/.test(checked[0]), `the learner's only subject is Computing (${checked.join(", ")})`);
    await p.clickExpr(nextButton, "Next on the subjects step");

    await p.waitFor(`return location.pathname === "/curriculum";`, "the course screen", 30000);
    await p.waitFor(`return !!document.querySelector("#curr-spec");`, "the qualification select");
    const specs = await p.evaluate(`return [...document.querySelector("#curr-spec").options].map(o => ({ value: o.value, text: (o.textContent || "").trim() }));`);
    const spec = specs.find((o) => o.value && /computer science|computing|ict/i.test(o.text))?.value
      ?? specs.find((o) => o.value)?.value;
    check(Boolean(spec), `a Computing qualification is offered (${specs.filter((o) => o.value).slice(0, 4).map((o) => o.text).join(" | ")})`);
    if (!spec) throw new Error(`no Computing qualification in ${JSON.stringify(specs)}`);
    await p.pick(`document.querySelector("#curr-spec")`, spec, "the Computing qualification");
    const tiers = await p.evaluate(`const s = document.querySelector("#curr-level"); return s ? [...s.options].map(o => o.value).filter(Boolean) : [];`);
    if (tiers.length > 0) {
      await p.pick(`document.querySelector("#curr-level")`, tiers[0], "the Computing tier");
    }
    await p.waitFor(`return [...(${selectUnder("Your grade level")}?.options ?? [])].some(o => o.value === "Year 10");`, "the year groups");
    await p.pick(selectUnder("Your grade level"), "Year 10", "year group");
    await p.clickExpr(saveButton, "Save my course");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Saved/i.test(b.textContent || ""));`, "the Computing course to save", 15000);
    check(true, "the Computing course is saved before a lesson is opened");

    const stored = await p.evaluate(`return { id: localStorage.getItem("openmind:profileId"), secret: localStorage.getItem("openmind:profileSecret") };`);
    check(Boolean(stored.id && stored.secret), `the browser holds the learner's capability (${stored.id})`);
    if (!stored.id) throw new Error("the learner has no profile id after onboarding");
    const learnerId = stored.id;

    for (const lesson of LESSONS) {
      section(`The ${lesson.title} lesson, completed as a learner`);
      await p.goto(`${BASE}/learn/computing/${lesson.id}`);
      await p.waitFor(`return !!document.querySelector("main .authored-lesson");`, `the ${lesson.title} authored lesson`, 30000);
      await p.waitFor(`return !!document.querySelector('[aria-label="Independent assessment"]');`, `the ${lesson.title} assessment section`, 15000);
      const teaching = await p.evaluate(`return {
        objectives: !!document.querySelector('[aria-label="Lesson objectives"]'),
        guided: !!document.querySelector('[aria-label="Guided practice"]'),
        assessment: !!document.querySelector('[aria-label="Independent assessment"]'),
        transfer: !!document.querySelector('[aria-label="Transfer challenge"]')
      };`);
      check(teaching.objectives, `${lesson.title}: the measurable objectives are on the page`);
      check(teaching.guided, `${lesson.title}: guided practice is on the page`);
      check(teaching.assessment, `${lesson.title}: the independent assessment is on the page`);
      check(teaching.transfer, `${lesson.title}: the transfer challenge is on the page`);

      const hint = await p.evaluate(`const h = document.querySelector('[aria-label="Guided practice"] details.authored-hint'); h?.querySelector("summary")?.click(); return h ? (h.querySelector("p")?.textContent || "").trim() : "";`);
      check(hint.length > 20, `${lesson.title}: the guided practice offers a real hint (${hint.slice(0, 48)}…)`);
      const guidedAnswer = await p.evaluate(`const d = document.querySelector('[aria-label="Guided practice"] details.authored-answer'); d?.querySelector("summary")?.click(); return d ? (d.textContent || "").trim().length : 0;`);
      check(guidedAnswer > 40, `${lesson.title}: the guided answer can be checked without being shown as the prompt`);

      const lab = `document.querySelector("[data-code-lab]")`;
      const runButton = `${lab} && [...${lab}.querySelectorAll("button")].find(b => /^Run program$/.test((b.textContent || "").trim()))`;
      const labText = `${lab}?.innerText || ""`;
      const output = `${lab}?.querySelector("pre")?.textContent || ""`;
      await p.waitFor(`return !!${lab};`, `the ${lesson.title} code lab`, 30000);
      await p.waitFor(`return !/Loading the sandboxed Python runtime/.test(${labText});`, `the ${lesson.title} Python runtime`, 60000);
      check(await p.evaluate(`return /Ready|Python/.test(${labText}) && !/Loading the sandboxed Python runtime/.test(${labText});`),
        `${lesson.title}: the real Pyodide runtime leaves its loading state`);
      check(await p.evaluate(`return ${lab}.querySelector("iframe")?.getAttribute("sandbox") === "allow-scripts";`),
        `${lesson.title}: the runner remains sandboxed with allow-scripts only`);

      await p.clickExpr(runButton, `Run the ${lesson.title} starter`);
      await p.waitFor(`return /Not there yet|All checks passed/.test(${labText});`, `the ${lesson.title} starter result`, 30000);
      const starterText = await p.evaluate(`return ${labText};`);
      const starterOutput = await p.evaluate(`return ${output};`);
      check(/Not there yet/.test(starterText), `${lesson.title}: the starter is honestly reported as not meeting the check`);
      check(starterOutput.includes(lesson.starterOutput),
        `${lesson.title}: the starter output is observable (${JSON.stringify(starterOutput.trim().slice(0, 80))})`);

      await p.evaluate(`
        const el = document.querySelector("#code-lab-editor");
        const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
        set.call(el, ${JSON.stringify(lesson.repairedCode)});
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return el.value;
      `);
      await p.clickExpr(runButton, `Run the repaired ${lesson.title} program`);
      await p.waitFor(`return /All checks passed|Not there yet/.test(${labText});`, `the repaired ${lesson.title} result`, 30000);
      const repairedText = await p.evaluate(`return ${labText};`);
      const repairedOutput = await p.evaluate(`return ${output};`);
      check(/All checks passed/.test(repairedText), `${lesson.title}: the repaired program passes its authored check`);
      check(repairedOutput.trim() === lesson.repairedOutput,
        `${lesson.title}: the repaired output is exactly ${JSON.stringify(lesson.repairedOutput)} (got ${JSON.stringify(repairedOutput.trim())})`);
      check(/not a recorded mark|practice feedback/.test(repairedText)
        && /No code is sent to OpenMind's server/.test(repairedText),
        `${lesson.title}: the lab says the checks are practice and the code stays in the sandbox`);

      for (const [gradedIndex, item] of lesson.graded.entries()) {
        const itemInput = `document.querySelector("#${lesson.id}-${item.id}")`;
        await p.waitFor(`return !!${itemInput};`, `${lesson.title} assessment input ${item.id}`);
        const row = `${itemInput}.closest("div").parentElement`;
        const rowText = `${row}?.innerText || ""`;
        const checkButton = `${row}?.querySelector("button")`;

        await p.typeInto(itemInput, item.wrong, `the ${lesson.title} wrong answer to ${item.id}`);
        await p.clickExpr(checkButton, `Check the ${lesson.title} wrong answer to ${item.id}`);
        await p.waitFor(`return /Not yet/.test(${rowText});`, `${lesson.title} ${item.id} wrong-answer feedback`, 15000);
        const wrongText = await p.evaluate(`return ${rowText};`);
        check(/Not yet/.test(wrongText) && /recorded too/.test(wrongText),
          `${lesson.title} ${item.id}: a wrong answer is marked and recorded as a first attempt`);

        await p.typeInto(itemInput, item.right, `the ${lesson.title} correct answer to ${item.id}`);
        await p.clickExpr(checkButton, `Check the ${lesson.title} correct answer to ${item.id}`);
        await p.waitFor(`return /Correct/.test(${rowText});`, `${lesson.title} ${item.id} correct-answer feedback`, 15000);
        const correctText = await p.evaluate(`return ${rowText};`);
        check(/Correct/.test(correctText) && /recorded on this concept as an independent answer/.test(correctText),
          `${lesson.title} ${item.id}: the correct answer is marked and recorded as independent`);
      }

      const selfMarked = await p.evaluate(`const d = [...(${assessment}?.querySelectorAll("details") ?? [])]; return { count: d.length, text: d.map(x => x.textContent || "").join("\\n") };`);
      check(selfMarked.count >= 2 && /cannot be marked automatically/.test(selfMarked.text),
        `${lesson.title}: the code and constructed responses expose marking criteria, not an invented score (${selfMarked.count} disclosures)`);

      const eventsFor = (itemId) => ledgerFor(learnerId).filter((e) => e.questionId === `lesson:${lesson.id}:${itemId}`);
      const ledgerReady = await waitForFile(() => lesson.graded.every((item) =>
        eventsFor(item.id).some((e) => e.correct === true)));
      const ledger = ledgerFor(learnerId);
      const correctEvents = lesson.graded.map((item) => eventsFor(item.id).find((e) => e.correct === true));
      const wrongEvents = lesson.graded.map((item) => eventsFor(item.id).find((e) => e.correct === false));
      check(ledgerReady && correctEvents.every((e) => e?.mode === "independent" && e?.hints === 0),
        `${lesson.title}: every correct lesson answer is persisted as independent and unassisted`);
      check(wrongEvents.every(Boolean), `${lesson.title}: every deliberate wrong first attempt was persisted too, rather than discarded`);
      const ungradedItems = ["a3", ...(lesson.graded.some((item) => item.id === "a4") ? [] : ["a4"])];
      check(!ungradedItems.some((id) => ledger.some((e) => e.questionId === `lesson:${lesson.id}:${id}`)),
        `${lesson.title}: constructed responses were not scored or turned into evidence`);

      const profile = readJson("profiles.json")[learnerId];
      const progress = profile?.progress?.[lesson.id]?.lessonCheck;
      check(progress && progress.asked === lesson.graded.length * 2 && progress.correct === lesson.graded.length,
        `${lesson.title}: the projected record counts all attempts and all correct answers (${JSON.stringify(progress)})`);
    }

    section("The learner can act on the next activity Home offers");
    await p.goto(`${BASE}/dashboard`);
    await p.waitFor(`return !!document.querySelector("main");`, "Home after the three lessons", 30000);
    // Home has TWO legitimate next activities. Once the course is chosen and
    // evidence exists, the decision card is the usual one. But if the learner
    // has not sat the baseline diagnostic yet, the route guard deliberately asks
    // for it first: a recommendation built before that measurement would be a
    // guess. The journey opens lessons directly, so this gate is the honest
    // state here — and it is an action, not a dead end. Accept either, but make
    // each open a real surface.
    const next = await p.evaluate(`
      const decision = document.querySelector("main a.next-cta");
      if (decision) return { kind: "decision", href: decision.getAttribute("href"), text: (decision.textContent || "").trim() };
      const gate = [...document.querySelectorAll("main a[href*='/diagnostic/']")]
        .find(a => /next/i.test((a.textContent || "").trim()));
      return gate ? { kind: "diagnostic", href: gate.getAttribute("href"), text: (gate.textContent || "").trim() } : null;
    `);
    if (!next) {
      const home = await p.evaluate(`return { text: (document.querySelector("main")?.innerText || "").replace(/\\n+/g, " · ").slice(0, 900), links: [...document.querySelectorAll("main a")].map(a => a.getAttribute("href")).filter(Boolean).slice(0, 16) };`);
      console.log(`   · Home without a next activity: ${JSON.stringify(home)}`);
    }
    check(Boolean(next?.href), `Home offers one next activity after the evidence (${next ? `${next.kind}: ${next.text} → ${next.href}` : "none"})`);
    if (next?.href) {
      await p.clickExpr(`
        document.querySelector("main a.next-cta") ??
        [...document.querySelectorAll("main a[href*='/diagnostic/']")].find(a => /next/i.test((a.textContent || "").trim()))
      `, `the ${next.kind} next activity`);
      await p.waitFor(`return location.pathname !== "/dashboard";`, "the next activity to open", 30000);
      const landed = await p.evaluate(`return { path: location.pathname, h1: document.querySelector("main h1")?.textContent?.trim() ?? "" };`);
      check(Boolean(landed.h1), `the next activity opens a real surface (${landed.path} — ${landed.h1.slice(0, 60)})`);
      if (next.kind === "diagnostic") {
        check(landed.path.startsWith("/diagnostic/"), `the diagnostic gate opens the learner's own Computing diagnostic (${landed.path})`);
      }
    }

    section("The completed lesson still fits a phone");
    await p.goto(`${BASE}/learn/computing/dictionaries`);
    await p.waitFor(`return !!document.querySelector("main .authored-lesson");`, "the dictionaries lesson again", 30000);
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await sleep(200);
    const phone = await p.evaluate(`return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth };`);
    check(phone.scroll <= phone.client + 1, `the completed lesson holds a 320-px screen (${phone.scroll} vs ${phone.client})`);
  } finally {
    try { await close(); } catch { /* already gone */ }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error?.stack ?? String(error));
  process.exit(2);
});
