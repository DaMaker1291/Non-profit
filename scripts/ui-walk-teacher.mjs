#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE TEACHER'S WALK — the evidence-to-intervention loop, driven in a real
// browser by real input.
//
// WHY THIS EXISTS, AND WHY THE API SUITE IS NOT ENOUGH. Every stage of the
// loop is pinned over HTTP (scripts/e2e-api.mjs §22) and every rule of it is
// pinned as a pure function (scripts/verify-engines.mjs §8) — and the first
// version of this feature still shipped with the loop UNREACHABLE from the
// product: the panel opened the builder but never created the proposal record,
// the builder set the assignment through the ordinary door so the record never
// got a baseline, and "Read what happened" could never appear. Three suites
// were green while a teacher could not actually complete the journey. The
// missing instrument was a walk: a person, a browser, and the route through
// the interface.
//
// WHAT IT DOES. It creates a real fixture over the real doors (a teacher, a
// class, four students, evidence that genuinely contains a recurring slip),
// then drives the teacher's own page:
//
//   Teacher Home → Class → Learning Needs → Evidence Detail → Intervention
//   Proposal → Teacher Review → Assignment Builder (edited) → Assignment
//   Results → Before/After Comparison → Next Teaching Decision
//
// and, at the end, checks what the SERVER holds — because a page that shows an
// outcome it never recorded is the failure mode this walk is for.
//
// WHAT IT DOES NOT DO. It does not make the follow-up evidence by clicking a
// student's practice screen: the claim under test is the TEACHER's loop. The
// students' answers are recorded through the same grading door a student uses
// (`/api/progress` serve + answer), which is exactly how the e2e suite's
// learner completes assigned work.
//
// Run with the dev server up:   npm run verify:ui:teacher
// Optional env: UI_WALK_BASE (default http://127.0.0.1:4173), CHROME_BIN.
// ─────────────────────────────────────────────────────────────────────────────
import { pageFor, launchChrome } from "./browser.mjs";

const BASE = process.env.UI_WALK_BASE ?? "http://127.0.0.1:4173";
const PORT = 9333 + Math.floor(Math.random() * 400);

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`   ✓ ${msg}`); }
  else { failed++; console.log(`   ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

// ── HTTP: the fixture, made through the product's own doors ─────────────────
async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 200) }; }
  return { status: res.status, body, headers: res.headers };
}
const post = (p, b) => call(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
const query = (params) => {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : "";
};

const SECRETS = new Map();
const created = [];
/** A learner, created by the profile door — the same door a device uses. */
async function learner(handle) {
  const secret = `uiwalk-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const r = await post("/api/profile", {
    handle, secret, country: "GB", language: "en", subjects: ["maths"], onboarded: true,
  });
  const id = r.body?.profile?.id;
  if (!id) throw new Error(`could not create the learner ${handle}: HTTP ${r.status}`);
  SECRETS.set(id, secret);
  created.push({ id, secret });
  return id;
}
const postAs = (id, path, body) => post(path, { ...body, id, secret: SECRETS.get(id) });
const getAs = (id, path, params = {}) => call(`${path}${query({ ...params, secret: SECRETS.get(id) })}`);

/** One server-graded answer, through the practice door a learner uses. */
async function serveAnswer(who, conceptId, correct) {
  const s = await postAs(who, "/api/progress", { action: "serve", id: who, conceptId, reveal: true });
  if (s.status === 200 && s.body?.question && !("answer" in s.body.question)) {
    console.error(
      "\n  This walk drives the `reveal` test hook, which a production build strips.\n" +
      "  Run it against the development server:\n\n" +
      "      npm run dev &   # → http://localhost:4173\n      npm run verify:ui:teacher\n",
    );
    process.exit(2);
  }
  if (s.status !== 200) return null;
  const q = s.body.question;
  const idx = correct ? q.answer : (q.answer + 1) % q.choices.length;
  const r = await postAs(who, "/api/progress", { action: "answer", id: who, conceptId, questionId: q.id, choiceIndex: idx });
  return r.status === 200 ? r.body : null;
}

async function main() {
  // Fail with the useful sentence rather than a stack from a dead port.
  try {
    const r = await fetch(BASE, { method: "GET" });
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`The app is not answering at ${BASE}. Start it first:  npm run dev`);
    process.exit(2);
  }

  // ── THE FIXTURE ───────────────────────────────────────────────────────────
  // `negatives` is used because EVERY one of its question shapes carries the
  // same named slip (`neg-slip`), so two learners missing it genuinely produce
  // a recurring pattern rather than a lucky draw.
  section("A class whose own answers contain a recurring slip");
  const teacherId = await learner("uiw_teacher");
  const clsRes = await postAs(teacherId, "/api/classes", {
    action: "create", name: "Walk class", subject: "maths", specificationId: "uk-gcse",
  });
  const cls = clsRes.body?.cls;
  if (!cls?.id || !cls?.joinCode) throw new Error(`could not create the class: HTTP ${clsRes.status}`);
  const handles = ["uiw_s1", "uiw_s2", "uiw_s3", "uiw_s4"];
  const students = [];
  for (const handle of handles) {
    const id = await learner(handle);
    await postAs(id, "/api/classes", { action: "join", joinCode: cls.joinCode, handle });
    students.push(id);
  }
  const [s1, s2, s3, s4] = students;
  for (let i = 0; i < 2; i++) { await serveAnswer(s1, "negatives", false); await serveAnswer(s2, "negatives", false); }
  await serveAnswer(s3, "negatives", true);
  check(true, `four students joined and recorded real evidence (${handles.join(", ")}; s1/s2 both missed the same slip, s4 has no evidence)`);

  const dueISO = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { send, close } = await launchChrome({ port: PORT });
  const p = pageFor(send);
  try {
    // ── TEACHER HOME → CLASS ────────────────────────────────────────────────
    section("Teacher Home shows the class, and the class shows what the evidence says");
    await p.goto(BASE);
    await p.evaluate(`localStorage.setItem("openmind:profileId", ${JSON.stringify(teacherId)}); localStorage.setItem("openmind:profileSecret", ${JSON.stringify(SECRETS.get(teacherId))}); return true;`);
    await p.goto(`${BASE}/teacher`);
    await p.waitFor(`return !!document.getElementById(${JSON.stringify("class-" + cls.id)});`, "the class card to render", 25000);
    const card = await p.evaluate(`
      const el = document.getElementById(${JSON.stringify("class-" + cls.id)});
      return { text: (el?.innerText || "").replace(/\\n+/g, " · "), today: /today/i.test(document.body.innerText) };
    `);
    check(/Walk class/.test(card.text) && /4 students/.test(card.text),
      `the class the teacher owns is on their page, with its real head-count (${card.text.slice(0, 90)})`);
    check(card.today, "and the page opens with Today — the day's work, before any class list");

    await p.waitFor(`return !!document.querySelector("[data-needs-panel]");`, "the learning-needs panel", 25000);
    const panel = await p.evaluate(`const el = document.querySelector("[data-needs-panel]"); return (el?.innerText || "").replace(/\\n+/g, " · ");`);
    check(/Possible shared misconception/.test(panel) && /Negative numbers/.test(panel),
      `the panel surfaces the recurring slip as a finding on the concept (${panel.slice(0, 110)})`);
    check(/2 of 3 learners with evidence/.test(panel) && /of 4 in the class/.test(panel) && /1 have no evidence/.test(panel),
      `and names every denominator — measured, with evidence, and unmeasured stay distinct (${(panel.match(/\d+ of \d+ learners with evidence[^·]*/) || [""])[0].trim()})`);

    // ── EVIDENCE DETAIL → PROPOSAL ──────────────────────────────────────────
    section("The teacher opens the finding and reviews its evidence");
    await p.clickExpr(
      `[...document.querySelectorAll("[data-needs-panel] button")].find(b => (b.textContent || "").trim() === "Review")`,
      "the first finding's Review button",
    );
    await p.waitFor(`return !!document.querySelector("[data-need-detail]");`, "the finding's evidence detail");
    const detail = await p.evaluate(`const el = document.querySelector("[data-need-detail]"); return (el?.innerText || "").replace(/\\n+/g, " · ");`);
    check(/Possible shared misconception/.test(detail) && /Sign slip with negatives/.test(detail),
      `the detail names the RULE the evidence points at, not a diagnosis of a child (${detail.slice(0, 120)})`);
    check(/uiw_s1/.test(detail) && /uiw_s2/.test(detail),
      "and the learners the pattern was seen from, beside the population sentence");

    await p.clickExpr(
      `[...document.querySelectorAll("[data-need-detail] button")].find(b => /Prepare targeted work/.test(b.textContent || ""))`,
      "the prepare-targeted-work button",
    );
    await p.waitFor(`return document.querySelector("[data-work-builder]")?.getAttribute("data-work-step") === "0";`, "the builder to open on WHO", 20000);
    const who = await p.evaluate(`
      const el = document.querySelector("[data-work-builder]");
      return {
        boxes: [...el.querySelectorAll("input[type=checkbox]")].filter((c) => c.checked).map((c) => (c.closest("label")?.textContent || "").trim()),
        someOn: [...el.querySelectorAll("input[type=radio]")].some((r) => /Selected learners/.test(r.closest("label")?.textContent || "") && r.checked),
      };
    `);
    check(who.someOn && who.boxes.includes("uiw_s1") && who.boxes.includes("uiw_s2"),
      `the proposal pre-populates the learners the finding was about (${who.boxes.join(", ")})`);
    // AND THE TEACHER EDITS IT. The finding is about two learners; this teacher
    // judges that one needs the work now. The list is the teacher's to change,
    // and the walk proves the change is what the assignment and the outcome
    // both follow — not the proposal's suggestion.
    await p.clickExpr(
      `[...document.querySelectorAll("[data-work-builder] label")].find(l => (l.textContent || "").trim() === "uiw_s2")?.querySelector("input")`,
      "the second learner's checkbox, to take them off the work",
    );
    const who2 = await p.evaluate(`const el = document.querySelector("[data-work-builder]"); return [...el.querySelectorAll("input[type=checkbox]")].filter((c) => c.checked).map((c) => (c.closest("label")?.textContent || "").trim());`);
    check(who2.join(",") === "uiw_s1", `and the edited population is what stays selected (${who2.join(", ")})`);

    // ── THE BUILDER, EDITED ON PURPOSE ──────────────────────────────────────
    section("The teacher edits the proposal before setting it");
    const nextInBuilder = `[...document.querySelectorAll("[data-work-builder] button")].find(b => (b.textContent || "").trim() === "Next")`;
    await p.clickExpr(nextInBuilder, "Next on WHO");
    await p.waitFor(`return document.querySelector("[data-work-builder]")?.getAttribute("data-work-step") === "1";`, "the builder to move to WHAT");
    const what = await p.evaluate(`const el = document.querySelector("[data-work-builder]"); return [...el.querySelectorAll("input[type=checkbox]")].filter((c) => c.checked).map((c) => (c.closest("label")?.textContent || "").trim());`);
    check(what.includes("Negative numbers"), `the finding's idea is pre-picked (${what.join(", ")})`);
    await p.clickExpr(
      `[...document.querySelectorAll("[data-work-builder] label")].find(l => /^\\s*Fractions\\s*$/.test(l.textContent || ""))?.querySelector("input")`,
      "the Fractions concept beside it",
    );
    const what2 = await p.evaluate(`const el = document.querySelector("[data-work-builder]"); return [...el.querySelectorAll("input[type=checkbox]")].filter((c) => c.checked).map((c) => (c.closest("label")?.textContent || "").trim());`);
    check(what2.includes("Negative numbers") && what2.includes("Fractions"),
      `and the teacher may add suitable content beside it (${what2.join(", ")})`);

    await p.clickExpr(nextInBuilder, "Next on WHAT");
    await p.waitFor(`return document.querySelector("[data-work-builder]")?.getAttribute("data-work-step") === "2";`, "the builder to move to WHEN");
    // The due date. A native date input's segments are ordered by the browser's
    // LOCALE (mm/dd vs dd/mm), so typing digits into it is not a deterministic
    // instrument across machines. The value is written through the same native
    // setter and event React listens for — the control's real onChange path,
    // without pretending a keystroke order that varies by machine.
    await p.evaluate(`
      const el = document.querySelector("[data-work-builder] input[type=date]");
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      set.call(el, ${JSON.stringify(dueISO)});
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    `);
    const when = await p.evaluate(`const el = document.querySelector("[data-work-builder]"); return { date: el.querySelector("input[type=date]")?.value, label: el.querySelector("input[type=text]")?.value };`);
    check(when.date === dueISO, `a deadline is set for it (${when.date})`);
    check(/review/i.test(when.label || ""), `with the work titled after the rule being reviewed (${when.label})`);

    await p.clickExpr(nextInBuilder, "Next on WHEN");
    await p.waitFor(`return document.querySelector("[data-work-builder]")?.getAttribute("data-work-step") === "3";`, "the builder to reach REVIEW AND ASSIGN");
    const review = await p.evaluate(`const el = document.querySelector("[data-work-builder]"); return (el?.innerText || "").replace(/\\n+/g, " · ");`);
    check(/Walk class/.test(review) && /uiw_s1/.test(review) && /Negative numbers/.test(review) && /Fractions/.test(review),
      `the review stage names exactly what will be set — class, learners, both ideas (${review.slice(0, 150)})`);

    // ── SET IT: through the review's own record ─────────────────────────────
    section("Setting the work, from the review");
    // The step chips are buttons too, and one of them reads "4. Set this work" —
    // matching by substring pressed the chip instead of the submit and silently
    // did nothing. The submit is the button whose WHOLE label is the action.
    await p.clickExpr(
      `[...document.querySelectorAll("[data-work-builder] button")].find(b => (b.textContent || "").trim() === "Set this work")`,
      "Set this work",
    );
    await p.waitFor(`return (document.querySelector("main")?.innerText || "").includes("Assignment created. The learners you selected can now start.");`, "the assignment confirmation", 20000);
    check(true, "setting it confirms the exact learners it was set for");
    await p.waitFor(`return /work set — collecting evidence/.test(document.querySelector("[data-needs-panel]")?.innerText || "");`, "the review to record its assignment", 20000);
    check(true, "and the review records that work is set — the panel's own status moved, not just a toast");
    const mon = await p.evaluate(`return (document.body.innerText.match(/Selected learners: [^\\n]+/) || [null])[0];`);
    check(/uiw_s1/.test(mon || ""), `the class page now carries the assignment and its target (${mon})`);

    // ── THE STUDENTS DO THE WORK ────────────────────────────────────────────
    section("What the assignment produced");
    await serveAnswer(s1, "negatives", true);
    await serveAnswer(s1, "negatives", true);
    await p.clickExpr(
      `[...document.querySelectorAll("[data-needs-panel] button")].find(b => /Read what happened/.test(b.textContent || ""))`,
      "Read what happened",
    );
    await p.waitFor(`return !!document.querySelector("[data-outcome]");`, "the outcome to render", 20000);
    const outcome = await p.evaluate(`const el = document.querySelector("[data-outcome]"); return (el?.innerText || "").replace(/\\n+/g, " · ");`);
    check(/More learners demonstrated the skill unaided in the follow-up work than before\./.test(outcome),
      `the comparison claims DEMONSTRATION, never that the teaching caused it (${outcome.slice(0, 120)})`);
    check(/uiw_s1/.test(outcome) && /unaided: 0 before → 2 after/.test(outcome),
      `with the member's own before → after shown, split at the baseline instant (${(outcome.match(/uiw_s1[^·]*/) || [""])[0].trim()})`);

    // ── THE NEXT DECISION ───────────────────────────────────────────────────
    section("The teacher decides what happens next");
    await p.waitFor(`return !!document.querySelector("[data-need-decision]");`, "the decision panel");
    await p.clickExpr(
      `[...document.querySelectorAll("[data-need-decision] button")].find(b => /Repeat targeted practice/.test(b.textContent || ""))`,
      "the repeat-targeted-practice decision",
    );
    await p.waitFor(`return /reviewed — decision recorded/.test(document.querySelector("[data-needs-panel]")?.innerText || "");`, "the review to close", 15000);
    check(true, "the chosen next step is recorded and the review closes");

    // ── WHAT THE SERVER HOLDS ───────────────────────────────────────────────
    // The page is a rendering; these are the facts. A surface showing an
    // outcome that was never recorded is the failure this section catches.
    section("The record on the server, after the walk");
    const finalNeeds = await getAs(teacherId, "/api/needs", { me: teacherId, cls: cls.id });
    const rec = (finalNeeds.body?.records ?? []).find((r) => r.status === "resolved");
    check(rec?.decision?.kind === "repeat_practice" && typeof rec.baseAt === "number" && rec.version >= 1,
      `the review is closed with the teacher's decision, a baseline instant and the definition version (${rec?.decision?.kind} @ v${rec?.version})`);
    const s1Work = (await getAs(s1, "/api/assignments", { me: s1 })).body?.assigned ?? [];
    const s2Work = (await getAs(s2, "/api/assignments", { me: s2 })).body?.assigned ?? [];
    check(s1Work.some((w) => w.assignment.id === rec?.assignmentId),
      "the targeted learner's list holds the work");
    check(!s2Work.some((w) => w.assignment.id === rec?.assignmentId),
      "and the learner the teacher took OFF the proposal cannot see it — an edited target list is enforced, not just displayed");
    const s4Work = (await getAs(s4, "/api/assignments", { me: s4 })).body?.assigned ?? [];
    check(!s4Work.some((w) => w.assignment.id === rec?.assignmentId),
      "nor can the learner who was never measured on the concept");
  } catch (err) {
    failed++;
    console.log(`   ✗ FAIL: ${err.message}`);
  } finally {
    await close();
  }

  // ── LEAVE THE STORE AS IT WAS FOUND ───────────────────────────────────────
  // The erasure door is the product's own, so this exercises it too. The class
  // record is left to scripts/cleanup-e2e-store.mjs, which removes recent
  // classes and rooms (there is no class-deletion route by design).
  section("Leaving the store as it was found");
  let allGone = true;
  for (const { id, secret } of [...created].reverse()) {
    const r = await call(`/api/profile?id=${id}&secret=${encodeURIComponent(secret)}&confirm=ERASE`, { method: "DELETE" });
    if (!(r.status === 200 && r.body?.removed === true)) allGone = false;
  }
  check(allGone, `every learner this walk created is erased through the erasure door (${created.length})`);
  console.log("  · the class record is left for scripts/cleanup-e2e-store.mjs (recent classes are removed by it)");

  console.log(`\n════ Teacher walk: ${passed} passed, ${failed} failed ════`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
