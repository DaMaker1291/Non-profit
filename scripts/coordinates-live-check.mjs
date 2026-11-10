#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// COORDINATES — the assessment path through the RUNNING application.
//
// The coordinate gate proves the keys are right. The browser walk proves the
// page renders. Neither proves that the server marks an ordered pair, refuses
// to mark prose, records the answer as independent evidence, and keeps the two
// results apart. This script drives the real HTTP endpoints of a running dev
// server with a scratch learner.
//
// It is an API-level check. It does NOT type into the visible assessment form
// and it does NOT observe a rendered verdict.
//
// Requires the dev server on OPENMIND_BASE (default :4173) and the same
// OPENMIND_DATA_DIR the server uses, so the stored record can be read back.
//
// Run: node scripts/coordinates-live-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.OPENMIND_BASE ?? "http://127.0.0.1:4173";
const SECRET = `e2e-coordinates-live-${Date.now().toString(36)}`;

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
    handle: "coord_live",
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
  call("/api/progress", json({ action: "lessonCheck", id, conceptId: "coordinates", itemId, answer, secret }));

const a2 = await check("a2", "(3, -4)");
ok(a2.status === 200 && a2.body?.correct === true, "a2 marks (3, -4) correct");
ok(a2.body?.modelAnswer === "(3, -4)", "a2 returns its model answer after marking");
ok(Array.isArray(a2.body?.marking) && a2.body.marking.length >= 2,
  "a2 returns its marking criteria, not only a boolean");
ok(!("check" in (a2.body ?? {})), "the response does not leak the accepted-answer list");

const a3 = await check("a3", "(0, -2)");
ok(a3.status === 200 && a3.body?.correct === false, "a3 marks the reversed pair (0, -2) as wrong");
ok(a3.body?.modelAnswer === "(-2, 0)", "a3 shows the crossing as (-2, 0)");

const a1 = await check("a1", "P is (-2, 5) in the second quadrant");
ok(a1.status === 400 && a1.body?.error === "not gradable",
  "the constructed response is refused, not turned into a mark");

const wrong = await check("a2", "(3, -4)", "wrong-wrong-wrong");
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
const lessonCheck = entry?.progress?.["coordinates"]?.lessonCheck;
ok(lessonCheck?.asked === 2 && lessonCheck?.correct === 1,
  `the store records asked 2 / correct 1 (${JSON.stringify(lessonCheck)})`);
ok(lessonCheck?.asked === 2,
  "the ungradable a1 and the refused secret did not increment the quiz count");

// ── The evidence ledger ─────────────────────────────────────────────────────
const ledger = await call(
  `/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(liveSecret)}`,
);
const events = Array.isArray(ledger.body?.events) ? ledger.body.events : [];
const ours = events.filter((event) => String(event.questionId ?? "").startsWith("lesson:coordinates:"));
ok(ledger.status === 200, "the learner's own ledger is readable");
ok(ours.length === 2, `the ledger holds exactly two coordinates lesson events (${ours.length})`);
ok(ours.every((event) => event.mode === "independent"), "both were recorded as independent work");
ok(ours.every((event) => event.hints === 0), "neither recorded a hint");
ok(ours.some((event) => event.correct === true) && ours.some((event) => event.correct === false),
  "the right and the wrong answer are preserved separately");
ok(new Set(ours.map((event) => event.questionId)).size === 2,
  "the two items are named separately, so they cannot collapse into one");

if (failures.length) {
  console.error(`\n${failures.length} coordinates live check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
