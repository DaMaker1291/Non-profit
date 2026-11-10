#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// PROBABILITY BASICS — the assessment path through the RUNNING application.
//
// The arithmetic gate proves the keys. The browser walk proves the page renders
// and (for this lesson) submits one answer through the visible control. This
// script proves the server marks the remaining deterministic items, refuses the
// constructed response, records independent evidence and keeps the results
// apart.
//
// It is an API-level check for a3, a4, a5 and a1. It does not observe a rendered
// verdict for those four; the visible submission is measured by the walk for a2.
//
// Requires the dev server on OPENMIND_BASE (default :4173) and the same
// OPENMIND_DATA_DIR the server uses, so the stored record can be read back.
//
// Run: node scripts/probability-basics-live-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.OPENMIND_BASE ?? "http://127.0.0.1:4173";
const SECRET = `e2e-probability-live-${Date.now().toString(36)}`;

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
async function call(route, init) {
  const res = await fetch(BASE + route, init);
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* a non-JSON refusal is still a status */
  }
  return { status: res.status, body };
}
const json = (body) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const created = await call(
  "/api/profile",
  json({
    handle: "probability_live",
    country: "GB",
    language: "en",
    subjects: ["maths"],
    onboarded: true,
    secret: SECRET,
  }),
);
const id = created.body?.id ?? created.body?.profile?.id;
const liveSecret = created.body?.secret ?? SECRET;
ok(created.status === 200 && typeof id === "string" && id.startsWith("prof_"),
  `a scratch learner was created (HTTP ${created.status})`);

const check = (itemId, answer, secret = liveSecret) =>
  call("/api/progress", json({ action: "lessonCheck", id, conceptId: "probability-basics", itemId, answer, secret }));

const a3 = await check("a3", "0.2");
ok(a3.status === 200 && a3.body?.correct === true,
  "a3 marks 0.4 × 0.5 = 0.2 correct for independent events");
ok(a3.body?.modelAnswer === "0.2", "a3 returns its model answer after marking");
ok(Array.isArray(a3.body?.marking) && a3.body.marking.length >= 2,
  "a3 returns its marking criteria, not only a boolean");

const a4 = await check("a4", "0.5");
ok(a4.status === 200 && a4.body?.correct === false,
  "a4 marks 0.5 wrong, because 0.5 is neither the sum nor the product of 0.3 and 0.5");
ok(a4.body?.modelAnswer === "0.8", "a4 shows the mutually exclusive sum, 0.8");

const a5 = await check("a5", "1/5");
ok(a5.status === 200 && a5.body?.correct === true,
  "a5 marks 1/5 correct for the students who like neither sport");
ok(a5.body?.modelAnswer === "1/5", "a5 returns 1/5");

const a1 = await check("a1", "the draws are dependent because there is no replacement");
ok(a1.status === 400 && a1.body?.error === "not gradable",
  "the constructed response is refused, not turned into a mark");

// ── The structured activities: server-marked, not client-marked ─────────────
const activity = (activityId, response) =>
  call("/api/progress", json({
    action: "probabilityActivity",
    id,
    conceptId: "probability-basics",
    activityId,
    response,
    secret: liveSecret,
  }));

const union = await activity("venn-union", ["onlyA", "onlyB", "both"]);
ok(union.status === 200 && union.body?.correct === true,
  "the server marks the union selection correct when it includes the overlap");
ok(typeof union.body?.feedback === "string" && union.body.feedback.includes("24"),
  "the union verdict gives the count, not only a boolean");

const unionWrong = await activity("venn-union", ["onlyA", "onlyB"]);
ok(unionWrong.status === 200 && unionWrong.body?.correct === false,
  "the server marks a union that misses the overlap wrong");

const neither = await activity("venn-neither", "20%");
ok(neither.status === 200 && neither.body?.correct === true,
  "the server accepts 20% as the same answer as 1/5");

const tree = await activity("tree-values", {
  rr: "6/20", bb: "0.1", atLeastOneRed: "9/10", dependent: "Dependent",
});
ok(tree.status === 200 && tree.body?.correct === true,
  "the server marks a completed dependent tree correct");
ok(Array.isArray(tree.body?.fields) && tree.body.fields.length === 4,
  "the tree verdict returns a line for all four fields");

const treePartial = await activity("tree-values", {
  rr: "6/20", bb: "2/20", atLeastOneRed: "", dependent: "Dependent",
});
ok(treePartial.status === 200 && treePartial.body?.correct === false,
  "a partially completed tree is recorded as an unsuccessful attempt");
ok(treePartial.body?.fields?.filter((field) => field.correct).length === 3,
  "the partial tree still reports which three fields were right");

const invalidUnion = await activity("venn-union", ["onlyA", "not-a-region"]);
ok(invalidUnion.status === 400,
  "malformed region input is refused, not recorded as a wrong answer");
const invalidTree = await activity("tree-values", { rr: "nonsense" });
ok(invalidTree.status === 400,
  "malformed tree input is refused, not recorded as a misconception");

const wrong = await check("a3", "0.2", "wrong-wrong-wrong");
ok(wrong.status === 401, "a wrong capability secret is refused");

// ── What the store kept ─────────────────────────────────────────────────────
const dir = process.env.OPENMIND_DATA_DIR;
let entry = null;
try {
  const store = JSON.parse(fs.readFileSync(path.join(dir, "profiles.json"), "utf8"));
  entry = store[id] ?? store.profiles?.[id] ?? null;
} catch (error) {
  failures.push(`the store at ${dir} could not be read (${error.message})`);
}
ok(entry !== null, "the learner is in the store the server writes");
const lessonCheck = entry?.progress?.["probability-basics"]?.lessonCheck;
ok(lessonCheck?.asked === 8 && lessonCheck?.correct === 5,
  `the store records asked 8 / correct 5 across the graded items and activities (${JSON.stringify(lessonCheck)})`);
ok(lessonCheck?.asked === 8,
  "the ungradable a1, malformed activities and the refused secret did not increment the quiz count");

// ── The evidence ledger ─────────────────────────────────────────────────────
const ledger = await call(
  `/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(liveSecret)}`,
);
const events = Array.isArray(ledger.body?.events) ? ledger.body.events : [];
const ours = events.filter((event) => String(event.questionId ?? "").startsWith("lesson:probability-basics:"));
ok(ledger.status === 200, "the learner's own ledger is readable");
ok(ours.length === 3, `the ledger holds exactly three probability lesson events (${ours.length})`);
const activityEvents = events.filter((event) => String(event.questionId ?? "").startsWith("activity:probability-basics:"));
ok(activityEvents.length === 5,
  `the ledger holds exactly five structured activity events (${activityEvents.length})`);
ok(activityEvents.filter((event) => event.correct === true).length === 3 &&
  activityEvents.filter((event) => event.correct === false).length === 2,
  "the activity ledger keeps three right and two wrong attempts separately");
ok(activityEvents.every((event) => event.mode === "independent" && event.hints === 0),
  "structured activities are recorded as independent, hint-free work");
ok(ours.every((event) => event.mode === "independent"), "all three were recorded as independent work");
ok(ours.every((event) => event.hints === 0), "none recorded a hint");
ok(ours.filter((event) => event.correct === true).length === 2 &&
  ours.filter((event) => event.correct === false).length === 1,
  "two right and one wrong are preserved separately");
ok(new Set(ours.map((event) => event.questionId)).size === 3,
  "the three items are named separately, so they cannot collapse into one");

if (failures.length) {
  console.error(`\n${failures.length} probability-basics live check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
