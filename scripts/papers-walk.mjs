#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE PAPER-SESSION WALK — a real browser, two sittings, one question id.
//
// WHY THIS EXISTS. Question ids in a paper are POSITIONAL (`q33` in every
// paper). The page used to keep `answers`, `typed`, `working` and `flagged`
// when a learner returned to the picker, so a structured answer they wrote in
// one sitting appeared — and could be submitted — in the next paper they had
// not answered. The reset was fixed in two places (startPaper and the
// return-to-picker control), and a unit test cannot prove either: the state is
// React state on a page, and the interesting claim is about what the page
// SENDS, not what a helper returns.
//
// WHAT IT PROVES. A learner whose profile passes the REAL course gate (seeded
// with the same fields the wizard writes: country, subject, qualification,
// tier, year group, completion stamp) can:
//   1. open the paper picker instead of being bounced to /curriculum;
//   2. start AQA GCSE Mathematics Paper 1, reach its written question (q33),
//      type a structured answer and working, and flag it;
//   3. finish — and the submitted payload CONTAINS those values (so the
//      capture is real, not a listener that saw nothing);
//   4. sit another paper, reach the same q33, and see EMPTY answer and working
//      fields with the flag cleared;
//   5. finish again — and the second payload contains neither stale string.
//
// The two reset sites are exercised in sequence: the return-to-picker control
// (step 4) and startPaper (step 5). A regression in either shows up as a stale
// value in the second sitting.
//
// Run with the dev server up, on a SCRATCH store:
//   OPENMIND_DATA_DIR=$(mktemp -d) npm run dev
//   npm run verify:papers
//
// Optional env: PAPERS_WALK_BASE (default http://127.0.0.1:4173), CHROME_BIN.
// ─────────────────────────────────────────────────────────────────────────────
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.PAPERS_WALK_BASE ?? "http://127.0.0.1:4173";
const PORT = 9333 + Math.floor(Math.random() * 400);
const STALE_ANSWER = "STALE-ANSWER-42";
const STALE_WORKING = "STALE-WORKING-99";

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

async function main() {
  try {
    const r = await fetch(BASE, { method: "GET" });
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`The app is not answering at ${BASE}. Start it first:  npm run dev`);
    process.exit(2);
  }

  // ── Seed a learner that passes the real course gate ───────────────────────
  // The wizard writes `onboarded: true` only once country and subjects exist,
  // and the lifecycle needs the qualification, tier and year group before a
  // paper can be sat. Sending the SAME fields through the same route means the
  // gate is not bypassed: /papers must accept this learner on its own terms.
  const secret = `papers-walk-${Math.random().toString(36).slice(2)}-secret`;
  const seed = await (await fetch(`${BASE}/api/profile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      handle: "papers_walk",
      country: "GB",
      language: "en",
      birthYear: 2010,
      subjects: ["maths"],
      spec: "uk-gcse",
      secret,
    }),
  })).json();
  const id = seed.profile?.id;
  if (!id) {
    console.error("could not seed a learner:", JSON.stringify(seed).slice(0, 300));
    process.exit(2);
  }
  const saved = await (await fetch(`${BASE}/api/profile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id,
      secret,
      country: "GB",
      subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
      grade: "Year 11",
      onboarded: true,
    }),
  })).json();
  if (!saved.profile) {
    console.error("could not complete the course:", JSON.stringify(saved).slice(0, 300));
    process.exit(2);
  }

  // ── Capture what the page actually posts ──────────────────────────────────
  const posts = [];
  const { send, close } = await launchChrome({
    port: PORT,
    onEvent: (m) => {
      if (m.method !== "Network.requestWillBeSent") return;
      const req = m.params?.request;
      if (!req || req.method !== "POST") return;
      if (!/\/api\/paper(?:\?|$)/.test(req.url)) return;
      posts.push({ at: Date.now(), body: req.postData ?? "" });
    },
  });
  const p = pageFor(send);
  let profileId = id;

  try {
    section("A seeded learner passes the real course gate");
    await p.goto(`${BASE}/onboarding`);
    await p.evaluate(`localStorage.setItem("openmind:profileId", ${JSON.stringify(id)});
      localStorage.setItem("openmind:profileSecret", ${JSON.stringify(secret)});
      return true;`);
    await p.goto(`${BASE}/papers`);
    await p.waitFor(
      `return location.pathname === "/papers" && [...document.querySelectorAll("main button")].some(b => /^Start$/.test((b.textContent || "").trim()));`,
      "the paper picker for a learner with a complete course",
      30000,
    );
    const atPicker = await p.evaluate(`return { path: location.pathname, start: [...document.querySelectorAll("main button")].filter(b => /^Start$/.test((b.textContent || "").trim())).length };`);
    check(atPicker.path === "/papers" && atPicker.start > 0,
      `a learner with country, qualification, tier and year group reaches the picker, not /curriculum (${atPicker.start} papers)`);

    // Paper 1, addressed by the board AND the paper name: both boards publish
    // a "Paper 1" and the wrong one would still be a paper, just not the one
    // whose q33 carries method boxes for this test to fill.
    const aqaP1 = `[...document.querySelectorAll("main button")].find(b => /^Start$/.test((b.textContent || "").trim()) && /AQA/.test(b.parentElement?.innerText || "") && /Paper 1/.test(b.parentElement?.innerText || ""))`;
    const hasAqa = await p.evaluate(`return !!(${aqaP1});`);
    check(hasAqa, "AQA GCSE Mathematics Paper 1 is offered to this course");
    if (!hasAqa) throw new Error("the paper this walk measures is not in the picker");

    const start = async (what) => {
      await p.clickExpr(aqaP1, what);
      await p.waitFor(`return !!document.querySelector("[data-exam-head]") && /Question \\d+ of \\d+/.test(document.querySelector("[data-question-of]")?.textContent || "");`, "the exam sitting to open", 30000);
    };
    const gotoLast = async () => {
      await p.clickExpr(`[...document.querySelectorAll("[data-question-grid] button")].at(-1)`, "the last question in the grid");
      await p.waitFor(`return /Question 33 of 33/.test(document.querySelector("[data-question-of]")?.textContent || "");`, "the final question (the plotted one)", 10000);
    };
    const flagControl = `document.querySelector("[data-flag-control]")`;
    const finish = `[...document.querySelectorAll("main button")].find(b => /Finish and mark/.test(b.textContent || ""))`;

    /** Start one AQA paper by its name, from the picker the page actually shows. */
    const startNamed = async (paper, what) => {
      const row = `[...document.querySelectorAll("main button")].find(b => /^Start$/.test((b.textContent || "").trim()) && /AQA/.test(b.parentElement?.innerText || "") && /${paper}/.test(b.parentElement?.innerText || ""))`;
      const present = await p.evaluate(`return !!(${row});`);
      check(present, `AQA GCSE Mathematics ${paper} is offered to this course`);
      if (!present) throw new Error(`the paper ${paper} is not in the picker`);
      await p.clickExpr(row, what);
      await p.waitFor(`return !!document.querySelector("[data-exam-head]") && /Question \\d+ of \\d+/.test(document.querySelector("[data-question-of]")?.textContent || "");`, "the exam sitting to open", 30000);
    };
    const gotoQuestion = async (n) => {
      await p.clickExpr(`[...document.querySelectorAll("[data-question-grid] button")][${n - 1}]`, `question ${n} in the grid`);
      await p.waitFor(`return /Question ${n} of 33/.test(document.querySelector("[data-question-of]")?.textContent || "");`, `question ${n}`, 10000);
    };
    const fieldAt = (label) => `document.querySelector(${JSON.stringify(`input[aria-label="${label}"]`)})`;
    const fillAt = async (label, value) => {
      await p.typeInto(fieldAt(label), value, label);
    };

    section("A written question is answered, worked and flagged");
    await start("AQA Paper 1");
    await gotoLast();
    // The part is DISCOVERED, not assumed: the session bug is about a reused
    // positional id, so any part with both an answer box and a method box can
    // expose it. The working label names its part; the answer label is the same
    // minus the suffix.
    const workLabels = await p.evaluate(`return [...document.querySelectorAll('input[aria-label$=" working"]')].map(i => i.getAttribute("aria-label"));`);
    const workingLabel = workLabels?.[0] ?? null;
    const answerLabel = workingLabel ? workingLabel.replace(/ working$/, "") : null;
    const fieldFor = (label) => `document.querySelector(${JSON.stringify(`input[aria-label="${label}"]`)})`;
    const answerField = answerLabel ? fieldFor(answerLabel) : "null";
    const workingField = workingLabel ? fieldFor(workingLabel) : "null";
    check(!!answerLabel,
      `q33 has a part with both an answer box and a method box (${workingLabel ?? "none"})`);
    if (!answerLabel) throw new Error("no structured part with a working box on q33");

    await p.typeInto(answerField, STALE_ANSWER, "the structured answer");
    await p.typeInto(workingField, STALE_WORKING, "the working box");
    await p.clickExpr(flagControl, "the flag control");
    const firstState = await p.evaluate(`return { answer: ${answerField}?.value ?? null, working: ${workingField}?.value ?? null, flagged: ${flagControl}?.getAttribute("aria-pressed") };`);
    check(firstState.answer === STALE_ANSWER && firstState.working === STALE_WORKING,
      "the first sitting holds the answer and working the learner typed");
    check(firstState.flagged === "true", "and the question is flagged");

    posts.length = 0;
    await p.clickExpr(finish, "Finish and mark");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Sit another paper/.test(b.textContent || ""));`, "the first result", 30000);
    await sleep(300);
    check(posts.length === 1, `finishing sends exactly one paper submission (${posts.length})`);
    const firstBody = posts[0]?.body ?? "";
    check(firstBody.includes(STALE_ANSWER) && firstBody.includes(STALE_WORKING),
      "and the captured payload contains the stale values — so the capture is real");

    section("Sitting another paper starts empty");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Sit another paper/.test(b.textContent || ""))`, "Sit another paper");
    await p.waitFor(`return location.pathname === "/papers" && [...document.querySelectorAll("main button")].some(b => /^Start$/.test((b.textContent || "").trim()));`, "the picker after a sitting", 20000);
    await start("AQA Paper 1 again");
    await gotoLast();
    const secondState = await p.evaluate(`return {
      answer: ${answerField}?.value ?? null,
      working: ${workingField}?.value ?? null,
      flagged: ${flagControl}?.getAttribute("aria-pressed"),
      answered: document.querySelector("[data-question-grid] button[aria-current]")?.getAttribute("data-answered")
    };`);
    check(secondState.answer === "" && secondState.working === "",
      `the reused q33 opens with empty answer and working fields (answer=${JSON.stringify(secondState.answer)}, working=${JSON.stringify(secondState.working)})`);
    check(secondState.flagged === "false" && secondState.answered === "0",
      `the flag is cleared and the question is not marked answered (${secondState.flagged}/${secondState.answered})`);

    section("The second sitting sends no stale values");
    posts.length = 0;
    await p.clickExpr(finish, "Finish and mark the second sitting");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Sit another paper/.test(b.textContent || ""));`, "the second result", 30000);
    await sleep(300);
    check(posts.length === 1, `the second sitting sends one submission (${posts.length})`);
    let payload = null;
    try { payload = JSON.parse(posts[0]?.body ?? "null"); } catch { /* reported below */ }
    check(!!payload, "and its payload parses as JSON");
    const sent = posts[0]?.body ?? "";
    check(!sent.includes(STALE_ANSWER) && !sent.includes(STALE_WORKING),
      "the second payload contains neither stale answer nor stale working");
    if (payload) {
      check(!payload.answers || payload.answers.q33 === undefined,
        `no choice answer is sent for q33 (${JSON.stringify(payload.answers?.q33)})`);
      check(!payload.structuredAnswers || (payload.structuredAnswers.q33 ?? []).every((v) => v.trim() === ""),
        `structuredAnswers for q33 is absent or empty (${JSON.stringify(payload.structuredAnswers?.q33)})`);
      check(!payload.structuredWorking || (payload.structuredWorking.q33 ?? []).every((v) => v.trim() === ""),
        `structuredWorking for q33 is absent or empty (${JSON.stringify(payload.structuredWorking?.q33)})`);
    }

    section("Algebra, numeric and graph responses are served and marked");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Sit another paper/.test(b.textContent || ""))`, "Sit another paper after the second result");
    await p.waitFor(`return location.pathname === "/papers" && [...document.querySelectorAll("main button")].some(b => /^Start$/.test((b.textContent || "").trim()));`, "the picker before Paper 3", 20000);
    await startNamed("Paper 3", "AQA Foundation Paper 3");

    await gotoQuestion(21);
    const algebra = [["Question 21 (a)", "3x + 12"], ["Question 21 (b)", "x^2 - 5x"], ["Question 21 (c)", "5x - 4"]];
    for (const [label, value] of algebra) await fillAt(label, value);
    const algebraValues = await p.evaluate(`return ${JSON.stringify(algebra.map(([label]) => label))}.map(l => document.querySelector('input[aria-label="' + l + '"]')?.value ?? null);`);
    check(JSON.stringify(algebraValues) === JSON.stringify(algebra.map(([, value]) => value)),
      `Q21 takes three algebraic expressions (${JSON.stringify(algebraValues)})`);

    await gotoQuestion(31);
    const angles = [["Question 31 (a)", "180"], ["Question 31 (b)", "67"], ["Question 31 (c)", "70"], ["Question 31 (d)", "70"], ["Question 31 (e)", "72"]];
    for (const [label, value] of angles) await fillAt(label, value);
    check((await p.evaluate(`return ${JSON.stringify(angles.map(([label]) => label))}.every(l => (document.querySelector('input[aria-label="' + l + '"]')?.value ?? "") !== "");`)),
      "Q31 takes five numeric angle answers, not four options");

    await gotoQuestion(33);
    const lines = [["Question 33 (a)", "0,1 2,5"], ["Question 33 (b)", "0,3 2,1"], ["Question 33 (c)", "0,-2 2,-1"]];
    for (const [label, value] of lines) await fillAt(label, value);
    check((await p.evaluate(`return ${JSON.stringify(lines.map(([label]) => label))}.every(l => (document.querySelector('input[aria-label="' + l + '"]')?.value ?? "") !== "");`)),
      "Q33 takes coordinate pairs for three lines");

    let numericAnswer = null;
    let invalidAnswer = null;
    for (let n = 1; n <= 33; n++) {
      await gotoQuestion(n);
      const labels = await p.evaluate(`return [...document.querySelectorAll('input[aria-label]')].map(i => i.getAttribute('aria-label')).filter(l => /Your answer$/.test(l));`);
      if (!labels?.length) continue;
      const label = labels[0];
      if (!numericAnswer) {
        numericAnswer = { q: n, label };
        await fillAt(label, "0");
      } else if (!invalidAnswer) {
        invalidAnswer = { q: n, label };
        await fillAt(label, "abc");
        break;
      }
    }
    check(!!numericAnswer, "a numeric bank question is served with a typed answer box");
    check(!!invalidAnswer, "a second numeric question accepts a malformed entry for the invalid path");
    if (!numericAnswer || !invalidAnswer) throw new Error("the paper did not serve two numeric response questions");

    posts.length = 0;
    await p.clickExpr(finish, "Finish and mark Paper 3");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Sit another paper/.test(b.textContent || ""));`, "the Paper 3 result", 30000);
    await sleep(300);
    check(posts.length === 1, `Paper 3 sends one submission (${posts.length})`);
    let p3 = null;
    try { p3 = JSON.parse(posts[0]?.body ?? "null"); } catch { /* reported below */ }
    check(!!p3, "the Paper 3 payload parses as JSON");
    check(p3?.structuredAnswers?.q21?.join("|") === "3x + 12|x^2 - 5x|5x - 4",
      `the algebra answers are submitted as three expressions (${JSON.stringify(p3?.structuredAnswers?.q21)})`);
    check(p3?.structuredAnswers?.q31?.join("|") === "180|67|70|70|72",
      `the angle answers are submitted as five values (${JSON.stringify(p3?.structuredAnswers?.q31)})`);
    check(p3?.structuredAnswers?.q33?.join("|") === "0,1 2,5|0,3 2,1|0,-2 2,-1",
      `the graph answers are submitted as coordinate pairs (${JSON.stringify(p3?.structuredAnswers?.q33)})`);
    check(p3?.numericAnswers?.[`q${numericAnswer.q}`] === "0",
      `the numeric answer is submitted by question id (q${numericAnswer.q})`);
    check(p3?.numericAnswers?.[`q${invalidAnswer.q}`] === "abc",
      `the malformed numeric answer is submitted for validation (q${invalidAnswer.q})`);
    const p3Text = await p.allText();
    const markLine = (n) => {
      const m = new RegExp(`Question ${n} · (\\d+)/(\\d+)`).exec(p3Text);
      return m ? `${m[1]}/${m[2]}` : null;
    };
    check(markLine(21) === "3/3", `Q21 is marked 3/3 by the algebraic criterion (${markLine(21)})`);
    check(markLine(31) === "5/5", `Q31 is marked 5/5 from five numeric parts (${markLine(31)})`);
    check(markLine(33) === "6/6", `Q33 is marked 6/6 from three line criteria (${markLine(33)})`);
    check(!!markLine(numericAnswer.q), `the numeric question is marked, not left unanswered (Q${numericAnswer.q}: ${markLine(numericAnswer.q)})`);
    check(p3Text.includes("Not a number"), "a malformed numeric entry is reported as not a number, not as a wrong belief");

    section("A table and a plotted line are served and marked");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Sit another paper/.test(b.textContent || ""))`, "Sit another paper after the Paper 3 result");
    await p.waitFor(`return location.pathname === "/papers" && [...document.querySelectorAll("main button")].some(b => /^Start$/.test((b.textContent || "").trim()));`, "the picker before Paper 2", 20000);
    await startNamed("Paper 2", "AQA Foundation Paper 2");

    await gotoQuestion(11);
    await fillAt("Question 11 (a)", "180");
    await fillAt("Question 11 (b)", "276");
    check((await p.evaluate(`return ["Question 11 (a)", "Question 11 (b)"].every(l => (document.querySelector('input[aria-label="' + l + '"]')?.value ?? "") !== "");`)),
      "Q11 takes two short numeric answers");

    await gotoQuestion(27);
    const tableValues = ["-1", "1", "3", "5"];
    for (let i = 0; i < tableValues.length; i++) {
      await fillAt(`Question 27 (a), row 1, column ${i + 1}`, tableValues[i]);
    }
    const tableState = await p.evaluate(`return [...document.querySelectorAll("table[data-answer-table] input")].map(i => i.value);`);
    check(JSON.stringify(tableState) === JSON.stringify(tableValues),
      `Q27 renders four editable cells and holds all four values (${JSON.stringify(tableState)})`);

    await gotoQuestion(33);
    const pointField = fieldAt("Question 33 (a): add a point as x,y");
    const addPoint = `[...document.querySelectorAll("main button")].find(b => /^Add point$/.test((b.textContent || "").trim()))`;
    for (const point of ["-1,-3", "0,-1", "2,3", "3,5"]) {
      await p.typeInto(pointField, point, `plot point ${point}`);
      await p.clickExpr(addPoint, `add point ${point}`);
      await sleep(120);
    }
    const plotted = await p.evaluate(`return document.querySelector("[data-plot-points]")?.getAttribute("data-plot-points") ?? null;`);
    check(plotted === "4", `the plotted grid holds the four required points (${plotted})`);
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Join my points with a straight line/.test(b.textContent || ""))`, "join the plotted points with a line");
    const drawn = await p.evaluate(`return (document.querySelector("[data-plot-line]")?.getAttribute("data-plot-line") || "").trim();`);
    check(drawn.length > 0, `the plotted line is drawn through the points (${drawn || "none"})`);
    await fillAt("Question 33 (b)", "2");
    await fillAt("Question 33 (c)", "0,3 2,1");
    await fillAt("Question 33 (d)", "4");
    check((await p.evaluate(`return ["Question 33 (b)", "Question 33 (c)", "Question 33 (d)"].every(l => (document.querySelector('input[aria-label="' + l + '"]')?.value ?? "") !== "");`)),
      "Q33 takes the read-off and the second line after the plot");

    posts.length = 0;
    await p.clickExpr(finish, "Finish and mark Paper 2");
    await p.waitFor(`return [...document.querySelectorAll("main button")].some(b => /Sit another paper/.test(b.textContent || ""));`, "the Paper 2 result", 30000);
    await sleep(300);
    check(posts.length === 1, `Paper 2 sends one submission (${posts.length})`);
    let p2 = null;
    try { p2 = JSON.parse(posts[0]?.body ?? "null"); } catch { /* reported below */ }
    check(!!p2, "the Paper 2 payload parses as JSON");
    check(p2?.structuredAnswers?.q11?.join("|") === "180|276",
      `Q11's two numeric answers are submitted (${JSON.stringify(p2?.structuredAnswers?.q11)})`);
    let tableCells = null;
    try { tableCells = JSON.parse(p2?.structuredAnswers?.q27?.[0] ?? "null"); } catch { /* reported below */ }
    check(JSON.stringify(tableCells) === JSON.stringify(["-1", "1", "3", "5"]),
      `the table is submitted cell by cell (${JSON.stringify(tableCells)})`);
    let plotAnswer = null;
    try { plotAnswer = JSON.parse(p2?.structuredAnswers?.q33?.[0] ?? "null"); } catch { /* reported below */ }
    check(plotAnswer?.points?.length === 4 && !!plotAnswer?.line,
      `the plot is submitted as four semantic points and a line (${JSON.stringify(plotAnswer)})`);
    const p2Text = await p.allText();
    const p2Line = (n) => {
      const m = new RegExp(`Question ${n} · (\\d+)/(\\d+)`).exec(p2Text);
      return m ? `${m[1]}/${m[2]}` : null;
    };
    check(p2Line(11) === "2/2", `Q11 is marked 2/2 (${p2Line(11)})`);
    check(p2Line(27) === "4/4", `Q27 is marked 4/4 from four table cells (${p2Line(27)})`);
    check(p2Line(33) === "6/6", `Q33 is marked 6/6 across plot, read-off and line (${p2Line(33)})`);

    section("A narrow screen can answer a written question");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Sit another paper/.test(b.textContent || ""))`, "Sit another paper before the mobile check");
    await p.waitFor(`return location.pathname === "/papers" && [...document.querySelectorAll("main button")].some(b => /^Start$/.test((b.textContent || "").trim()));`, "the picker before the mobile check", 20000);
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await startNamed("Paper 3", "AQA Foundation Paper 3 on a narrow screen");
    await gotoQuestion(31);
    const mobile = await p.evaluate(`const field = document.querySelector('input[aria-label="Question 31 (b)"]'); return { width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, field: !!field, fieldWidth: field?.getBoundingClientRect().width ?? 0, grid: !!document.querySelector("[data-question-grid]"), header: !!document.querySelector("[data-exam-head]") };`);
    check(mobile.width === 390, `the narrow viewport is 390 px (${mobile.width})`);
    check(mobile.scrollWidth <= mobile.width + 1, `the question does not scroll sideways at 390 px (${mobile.scrollWidth} vs ${mobile.width})`);
    check(mobile.field && mobile.fieldWidth > 0, `the numeric answer box is usable on a phone (${Math.round(mobile.fieldWidth)} px wide)`);
    check(mobile.grid && mobile.header, "the mobile sitting still has its question grid and exam header");
    await send("Emulation.clearDeviceMetricsOverride");

    const profile = await (await fetch(`${BASE}/api/profile?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`)).json();
    check(profile.profile?.id === profileId,
      `the walk measured its own seeded profile (${profile.profile?.id ?? "missing"})`);
    check(profile.profile?.grade === "Year 11",
      `the Year 11 course value survives the save and the gate (${profile.profile?.grade ?? "missing"})`);
  } finally {
    await close();
  }

  console.log(`\nPaper session walk: ${passed} passed, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(`\nPaper session walk aborted: ${e?.message ?? e}`);
  process.exit(2);
});
