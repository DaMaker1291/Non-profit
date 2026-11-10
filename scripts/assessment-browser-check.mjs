#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNER-FACING ASSESSMENT LOOP, DRIVEN IN A REAL BROWSER.
//
// The HTTP journey already proves compile → serve → submit → mark → evidence →
// mastery → next step. It cannot prove that a learner can actually do it: the
// page has to paint the gate, load the fixture item, accept a response, show the
// mark scheme, identify a named misconception, withhold the key before marking,
// return prose unscored, and show the model answer and next step afterwards.
//
// This walk uses the TEST FIXTURE on purpose. The fixture is labelled in the
// interface and is never a teacher approval. No real blueprint is made
// servable by this file, and the gate assertions would fail if one were.
//
//   npm run assessment:browser
//   (requires a non-production server with OPENMIND_ASSESSMENT_FIXTURE=1)
// ─────────────────────────────────────────────────────────────────────────────
import { launchChrome, pageFor } from "./browser.mjs";

const BASE = process.env.OPENMIND_BASE ?? "http://127.0.0.1:4173";
const PORT = 9333 + Math.floor(Math.random() * 600);

let passed = 0;
let failed = 0;
const check = (condition, label) => {
  if (condition) { passed += 1; console.log(`  ✓ ${label}`); }
  else { failed += 1; console.error(`  ✗ FAIL: ${label}`); }
};
const section = (label) => console.log(`\n▸ ${label}`);

async function call(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, init);
  let body = null;
  try { body = await response.json(); } catch { /* a door may return no JSON */ }
  return { status: response.status, body };
}
const post = (path, body) => call(path, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const ready = await call("/api/ready");
if (ready.status !== 200) {
  console.error(`assessment browser: server is not ready at ${BASE} (status ${ready.status})`);
  process.exit(2);
}
const catalog = await call("/api/assessment");
if (catalog.body?.fixture?.notTeacherApproval !== true) {
  console.error("assessment browser: the test fixture is not enabled on this server");
  console.error("  start a non-production server with OPENMIND_ASSESSMENT_FIXTURE=1 and a scratch data directory");
  process.exit(2);
}

const secret = `assessment-browser-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const created = await post("/api/profile", {
  handle: "assessment_browser_e2e",
  country: "GB",
  language: "en",
  birthYear: 2009,
  grade: "Year 10",
  subjects: ["biology"],
  spec: "uk-gcse",
  specLevel: "foundation",
  subjectCourses: { biology: { spec: "uk-gcse", specLevel: "foundation" } },
  onboarded: true,
  secret,
});
const id = created.body?.profile?.id ?? created.body?.id ?? created.body?.state?.profile?.id;
if (created.status !== 200 || typeof id !== "string") {
  console.error(`assessment browser: could not create the scratch learner (status ${created.status})`);
  process.exit(2);
}

let browser = null;
try {
  browser = await launchChrome({ port: PORT });
  const p = pageFor(browser.send);
  const evaluation = p.evaluate;
  // This page renders in the application shell's content column, not inside a
  // <main> landmark. Scoping these assertions to <main> read an empty string and
  // made the fixture label look absent; the learner-visible text is body text.
  const allText = () => p.evaluate(`return (document.body.innerText || "").replace(/\\n+/g, " · ");`);
  const resultText = () => p.evaluate(`return document.querySelector("[data-assessment-result]")?.innerText ?? "";`);
  const openItem = async (itemId) => {
    const button = `[...document.querySelectorAll("[data-assessment-fixture] button")].find(b => (b.textContent || "").includes(${JSON.stringify(itemId)}))`;
    await p.clickExpr(button, `the fixture button for ${itemId}`);
    await p.waitFor(
      `return !!document.querySelector("[data-assessment-item]") && (document.querySelector("[data-assessment-item]").innerText || "").toLowerCase().includes(${JSON.stringify(itemId.toLowerCase())});`,
      `the ${itemId} item`,
    );
    await p.waitFor(`return !document.querySelector("[data-assessment-result]");`, `a fresh result area for ${itemId}`);
  };
  const submit = async (what) => {
    const button = `[...document.querySelectorAll("[data-assessment-item] button")].find(b => /Submit for marking/.test(b.textContent || ""))`;
    await p.clickExpr(button, `Submit for marking on ${what}`);
  };
  const waitMarked = async (awarded, total) => {
    await p.waitFor(
      `return (document.querySelector("[data-assessment-result]")?.innerText || "").toLowerCase().includes(${JSON.stringify(`marked ${awarded} / ${total}`)});`,
      `the ${awarded}/${total} verdict`,
    );
  };

  section("The gate is visible before any item is served");
  await p.goto(BASE);
  await p.evaluate(`localStorage.clear(); sessionStorage.clear();
    localStorage.setItem("openmind:profileId", ${JSON.stringify(id)});
    localStorage.setItem("openmind:profileSecret", ${JSON.stringify(secret)}); return true;`);
  await p.goto(`${BASE}/assessment`);
  await p.waitFor(`return !!document.querySelector("[data-assessment-gate]");`, "the assessment gate");

  const gate = await evaluation(`return {
    text: document.querySelector("[data-assessment-gate]").innerText,
    rows: [...document.querySelectorAll("[data-assessment-gate] tbody tr")].map((row) => [...row.cells].map((cell) => cell.innerText.trim())),
  };`);
  check(/Approved for real learners:\s*0/.test(gate.text), "the page states that zero blueprints are approved for real learners");
  check(gate.rows.length === 3, `all three authored blueprints are shown (${gate.rows.length})`);
  check(gate.rows.every((row) => row[row.length - 1] === "no"), "every authored blueprint is refused");
  check(gate.rows.every((row) => /unreviewed/.test(row[1])), "every blueprint's review status is unreviewed");
  const maths = gate.rows.find((row) => /Tables, substitution/.test(row[0]));
  check(Boolean(maths) && /cleared/.test(maths[2]) && /cleared/.test(maths[3]) && maths[4] === "no",
    "the table blueprint has clear rights and licensing but is still refused for review");
  check(/test data, not an approved assessment/i.test(await allText()), "the test fixture is labelled on the page");

  section("A numeric response: no key before marking, then full marks");
  await openItem("dd-05");
  const beforeMarking = await allText();
  check(/Test fixture — not teacher approval/i.test(beforeMarking), "the loaded item repeats the fixture warning");
  check(!/630 J\/g/.test(beforeMarking), "the served item does not reveal its numeric answer");
  check(await evaluation(`return !!document.querySelector("[data-assessment-item] input[type=text]");`),
    "the numeric answer field is present");
  check(await evaluation(`return !!document.querySelector("[data-assessment-item] textarea");`),
    "the method field is present");
  await p.typeInto(`document.querySelector("[data-assessment-item] input[type=text]")`, "630 J/g", "the numeric answer");
  await p.typeInto(`document.querySelector("[data-assessment-item] textarea")`, "20 × 4.2 × 15 = 1260", "the method");
  await submit("dd-05");
  await waitMarked(2, 2);
  const full = await resultText();
  check(/Recorded as an assessment evidence event/.test(full), "the marked answer is recorded as assessment evidence");
  check(/Model answer/.test(full), "the model answer appears only after marking");
  check(await evaluation(`return !!document.querySelector("[data-assessment-next]");`), "a next step is shown after marking");

  section("A table response: one mark per blank cell");
  await openItem("mt-01");
  check(await evaluation(`return document.querySelectorAll("[data-answer-table] input").length === 4;`),
    "the table has four editable cells");
  const cells = ["-1", "1", "3", "5"];
  for (let i = 0; i < cells.length; i += 1) {
    await p.typeInto(`document.querySelectorAll("[data-answer-table] input")[${i}]`, cells[i], `table cell ${i + 1}`);
  }
  await submit("mt-01");
  await waitMarked(4, 4);
  const tableResult = await resultText();
  check(/4 \/ 4/.test(tableResult), "the table response earns all four cell marks");
  check((tableResult.match(/1\/1 awarded/g) ?? []).length === 4, "each blank cell is reported as its own awarded mark");

  section("Partial credit and alternative wording on a short answer");
  await openItem("dd-01");
  await p.typeInto(`document.querySelector("[data-assessment-item] textarea")`, "fatty acids", "the partial short answer");
  await submit("dd-01");
  await waitMarked(1, 2);
  const partial = await resultText();
  check(/1\/1 awarded/.test(partial) && /0\/1 not awarded/.test(partial),
    "partial credit names the earned criterion and the missing one");

  await openItem("dd-01");
  await p.typeInto(`document.querySelector("[data-assessment-item] textarea")`, "glycerine and fatty acid", "the alternative short answer");
  await submit("dd-01");
  await waitMarked(2, 2);
  check(/2 \/ 2/.test(await resultText()), "the authored alternative earns full marks");

  section("An incorrect response names the authored misconception");
  await openItem("dd-01");
  await p.typeInto(`document.querySelector("[data-assessment-item] textarea")`, "glucose and amino acids", "the incorrect short answer");
  await submit("dd-01");
  await waitMarked(0, 2);
  const wrong = await resultText();
  check(/matches a named slip/.test(wrong), "the page names the misconception rather than only saying wrong");
  check(/sugar/i.test(wrong), "the named slip explains the sugar confusion");

  section("A missing unit loses the answer mark, not the method mark");
  await openItem("dd-05");
  await p.typeInto(`document.querySelector("[data-assessment-item] input[type=text]")`, "630", "the unitless answer");
  await p.typeInto(`document.querySelector("[data-assessment-item] textarea")`, "20 × 4.2 × 15 = 1260", "the method");
  await submit("dd-05");
  await waitMarked(1, 2);
  check(/unit/i.test(await resultText()), "the feedback names the missing unit");

  section("Invalid input is refused and writes no evidence");
  const beforeInvalid = (await call(`/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`)).body?.events?.length ?? -1;
  await openItem("dd-05");
  await p.typeInto(`document.querySelector("[data-assessment-item] input[type=text]")`, "not a number", "the invalid answer");
  await submit("dd-05");
  await p.waitFor(`return !!document.querySelector("[data-assessment-item] .notice");`, "the refusal notice");
  check(/could not be submitted/i.test(await evaluation(`return document.querySelector("[data-assessment-item] .notice")?.innerText ?? "";`)),
    "the page says the invalid response could not be submitted");
  check(await evaluation(`return !document.querySelector("[data-assessment-result]");`),
    "the invalid response produces no marked result");
  const afterInvalid = (await call(`/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`)).body?.events?.length ?? -1;
  check(beforeInvalid >= 0 && afterInvalid === beforeInvalid, "the invalid response writes no evidence");

  section("Prose is returned as a rubric, not a machine score");
  await openItem("dd-02");
  await p.typeInto(`document.querySelector("[data-assessment-item] textarea")`, "Villi are muscles that push food along.", "the prose response");
  await submit("dd-02");
  await p.waitFor(`return (document.querySelector("[data-assessment-result]")?.innerText || "").toLowerCase().includes("rubric returned");`, "the prose rubric");
  const prose = await evaluation(`return {
    text: document.querySelector("[data-assessment-result]")?.innerText ?? "",
    criteria: document.querySelectorAll("[data-assessment-result] li").length,
    advisory: !!document.querySelector("[data-advisory]"),
  };`);
  check(/Recorded as answer evidence: no/.test(prose.text), "prose states that it is not recorded as answer evidence");
  check(prose.criteria === 4, `the authored four-point rubric is printed (${prose.criteria})`);
  check(prose.advisory && /villi/i.test(prose.text), "the prose misconception is advisory, not a mark");
  check(!/marked \d+ \/ \d+/i.test(prose.text), "prose has no machine score");

  section("The browser submissions reach the evidence ledger and mastery");
  const ledger = await call(`/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`);
  const assessmentEvents = (ledger.body?.events ?? []).filter((event) => event.type === "answer_submitted" && event.source === "assessment");
  check(assessmentEvents.length === 6, `six machine-marked submissions are on the ledger (${assessmentEvents.length})`);
  check(assessmentEvents.some((event) => event.score?.awarded < event.score?.max), "partial credit survives into evidence");
  const progress = await call(`/api/progress?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`);
  check(progress.body?.progress?.digestion?.attempts === 5, "the five digestion submissions project into the learner model");
  check(progress.body?.progress?.digestion?.marksAwarded === 6 && progress.body?.progress?.digestion?.marksAvailable === 10,
    "the model keeps 6/10 marks for the mixed performance");
  check(progress.body?.progress?.["linear-equations"]?.marksAwarded === 4,
    "the table answer reaches the table concept's mastery record");
} finally {
  if (browser) await browser.close().catch(() => {});
  await call(`/api/profile?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}&confirm=ERASE`, { method: "DELETE" }).catch(() => {});
}

console.log(`\nassessment browser: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error("assessment browser: the learner-facing loop did not hold");
  process.exit(1);
}
console.log("✓ gate → item → submission → mark → partial credit → misconception → evidence → mastery → next step, for numeric, table, short-answer and prose responses.");
