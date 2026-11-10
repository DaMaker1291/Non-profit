#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// RATIO / PROPORTION / SEQUENCES — the server path, and what the store kept.
//
// The browser walk proves the rendered controls accept a submission. The
// arithmetic gate proves the keys independently. Neither proves that a
// `lessonCheck` was written to the learner's record. This script drives the
// real endpoint against a scratch store and then reads the store back:
//
//   • correct submissions for each lesson are marked server-side;
//   • a wrong submission is recorded as a wrong attempt, not discarded;
//   • lessonCheck counts are per concept, not one shared counter;
//   • the evidence ledger has one event per submission, independent and hint-free;
//   • a wrong capability secret is refused.
//
// It requires the dev server on OPENMIND_BASE and the SAME
// OPENMIND_DATA_DIR the server uses. It never reads the live store when the
// caller supplies a scratch directory.
//
// Run: OPENMIND_DATA_DIR=$(mktemp -d) node scripts/maths-batch-live-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.OPENMIND_BASE ?? "http://127.0.0.1:4173";
const DATA_DIR = process.env.OPENMIND_DATA_DIR;
const RUN = Date.now().toString(36);
const SECRET = `e2e-maths-batch-${RUN}`;

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.log(`  ✗ FAIL: ${label}`);
  }
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

if (!DATA_DIR) {
  console.error(
    "\n  OPENMIND_DATA_DIR must name the store the server writes.\n" +
      "  Refusing to claim persistence without the directory to read back.\n",
  );
  process.exit(2);
}

const created = await call(
  "/api/profile",
  json({
    handle: `maths_batch_${RUN}`,
    country: "GB",
    language: "en",
    subjects: ["maths"],
    onboarded: true,
    secret: SECRET,
  }),
);
const id = created.body?.id ?? created.body?.profile?.id;
const liveSecret = created.body?.secret ?? SECRET;
ok(
  created.status === 200 && typeof id === "string" && id.startsWith("prof_"),
  `a scratch learner was created (HTTP ${created.status})`,
);

const check = (conceptId, itemId, answer, secret = liveSecret) =>
  call(
    "/api/progress",
    json({
      action: "lessonCheck",
      id,
      conceptId,
      itemId,
      answer,
      secret,
    }),
  );

const cases = [
  ["ratio", "a1", "3:4", "ratio 18:24 simplifies and is marked 3:4"],
  ["proportion", "a1", "30", "proportion y = 18 at x = 6 gives y = 30 at x = 10"],
  ["sequences", "a1", "58", "sequences 5n - 2 has 58 as its 12th term"],
];

for (const [conceptId, itemId, answer, label] of cases) {
  const result = await check(conceptId, itemId, answer);
  ok(result.status === 200 && result.body?.correct === true, label);
  ok(
    typeof result.body?.modelAnswer === "string" &&
      Array.isArray(result.body?.marking) &&
      result.body.marking.length > 0,
    `${conceptId} returns a model answer and marking criteria, not only a boolean`,
  );
}

// A wrong attempt must be preserved too. This makes the store's asked/correct
// pair non-trivial: asked 2 / correct 1 for ratio, not a counter that only
// increments on success.
const wrong = await check("ratio", "a1", "9:4");
ok(
  wrong.status === 200 && wrong.body?.correct === false,
  "a wrong ratio submission is marked wrong and kept as an attempt",
);

const denied = await check("proportion", "a1", "30", "wrong-wrong-wrong");
ok(denied.status === 401, "a wrong capability secret is refused");

// ── What the store kept ─────────────────────────────────────────────────────
let entry = null;
try {
  const store = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "profiles.json"), "utf8"),
  );
  entry = store[id] ?? store.profiles?.[id] ?? null;
} catch (error) {
  failures.push(`the store at ${DATA_DIR} could not be read (${error.message})`);
}
ok(entry !== null, "the learner is in the store the server writes");

const expected = new Map([
  ["ratio", { asked: 2, correct: 1 }],
  ["proportion", { asked: 1, correct: 1 }],
  ["sequences", { asked: 1, correct: 1 }],
]);
for (const [conceptId, want] of expected) {
  const got = entry?.progress?.[conceptId]?.lessonCheck;
  ok(
    got?.asked === want.asked && got?.correct === want.correct,
    `the store keeps ${conceptId} separately at asked ${want.asked} / correct ${want.correct} (${JSON.stringify(got)})`,
  );
}

// ── The evidence ledger: API and file ───────────────────────────────────────
const ledger = await call(
  `/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(liveSecret)}`,
);
const events = Array.isArray(ledger.body?.events) ? ledger.body.events : [];
const ours = events.filter((event) =>
  /^lesson:(ratio|proportion|sequences):/.test(String(event.questionId ?? "")),
);
ok(ledger.status === 200, "the learner's own evidence ledger is readable");
ok(ours.length === 4, `the ledger holds exactly four new lesson events (${ours.length})`);
ok(
  ours.filter((event) => event.correct === true).length === 3 &&
    ours.filter((event) => event.correct === false).length === 1,
  "three right and one wrong attempt are preserved separately",
);
ok(
  ours.every((event) => event.mode === "independent" && event.hints === 0),
  "every lesson event is independent and hint-free",
);
ok(
  new Set(ours.map((event) => event.questionId)).size === 3,
  "the three lesson items are named separately",
);

let fileEvents = [];
try {
  const ledgerFile = path.join(DATA_DIR, "evidence", `${id}.jsonl`);
  fileEvents = fs
    .readFileSync(ledgerFile, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((event) =>
      /^lesson:(ratio|proportion|sequences):/.test(
        String(event.questionId ?? ""),
      ),
    );
} catch (error) {
  failures.push(`the on-disk evidence ledger could not be read (${error.message})`);
}
ok(fileEvents.length === 4, `the on-disk ledger has the same four events (${fileEvents.length})`);
ok(
  fileEvents.filter((event) => event.correct === true).length === 3 &&
    fileEvents.filter((event) => event.correct === false).length === 1,
  "the on-disk ledger keeps the correct and wrong attempts apart",
);

if (failures.length) {
  console.error(
    `\n${failures.length} maths-batch live check${failures.length === 1 ? "" : "s"} failed:`,
  );
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`\nMaths batch live: ${passed} passed, 0 failed`);
