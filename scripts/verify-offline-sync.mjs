// ─────────────────────────────────────────────────────────────────────────────
// THE OFFLINE SYNC PROTOCOL, PROVEN (§21 of the deployment brief).
//
// The learner-facing story the brief asks for is:
//
//   ONLINE → download → OFFLINE → answer → device closes → reopens → still works
//   → ONLINE → sync → dedupe → replay
//
// This suite drives the second half of that story — the part a server owns — and
// it does so against a running server with a SCRATCH store, because "a device
// reconnects" must not be simulated by trusting the code. It establishes, over
// real HTTP:
//
//   1. A device's batch lands, and every event is stamped `provenance: "device"`
//      no matter what the body claims — an offline answer is real AND disclosed
//      as unverified.
//   2. Dedupe is by event id against what is ON DISK: re-sending a batch is a
//      no-op, and a duplicate inside one batch is refused rather than written
//      twice. This is what stops a retried sync double-counting a learner's work.
//   3. A batch naming another learner, a wrong schema version, or a malformed
//      event is REFUSED by name, not silently dropped.
//   4. A page of events is bounded, and the cursor is what a device keeps so it
//      only asks for what is new.
//   5. After syncing, the learner model IS the ledger: `deepReconcile` reports
//      no differences and `unprojectable: null`, which is the claim §16 rests on
//      — a restored ledger reconstructs the learner.
//
// Usage:
//   OPENMIND_BASE=http://localhost:4173 node scripts/verify-offline-sync.mjs
// ─────────────────────────────────────────────────────────────────────────────
const BASE = process.env.OPENMIND_BASE ?? "http://localhost:4173";

let pass = 0, fail = 0;
const bad = [];
const ok = (cond, msg, detail = "") => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; bad.push(msg); console.error(`  ✗ ${msg}${detail ? ` — ${detail}` : ""}`); }
};
const group = (n) => console.log(`\n${n}`);

async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 200) }; }
  return { status: res.status, body };
}
const json = (body) => ({
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

// Preflight.
try {
  const ping = await call("/api/health");
  if (ping.status !== 200) throw new Error(`health returned ${ping.status}`);
} catch (e) {
  console.error(`\nverify-offline-sync: cannot reach ${BASE} — start a server first. (${e.message})\n`);
  process.exit(2);
}

// A learner whose ledger this suite owns.
const secret = `sync-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
const created = await call("/api/profile", json({ handle: "sync_learner", country: "GB", language: "en", subjects: ["maths"], secret }));
const id = created.body?.profile?.id;
if (!id) {
  console.error("verify-offline-sync: could not create a scratch learner — is the data directory writable?");
  process.exit(2);
}

let seq = 0;
/** One offline answer event, exactly as a device's queue would hold it. The id is
 *  the idempotency key, so it is stable across retries by construction. */
function deviceAnswer(overrides = {}) {
  seq += 1;
  return {
    type: "answer_submitted",
    // The ledger's idempotency key must satisfy the validator's shape
    // (lib/evidence.ts#ID_RE: `ev_` + 8..64 of [A-Za-z0-9_-]).
    id: `ev_sync${seq}_${Math.random().toString(36).slice(2, 10)}`,
    schemaVersion: 1,
    learnerId: id,
    // Deliberately a LIE: the device claims the server watched it. The server
    // must overwrite this to "device" (see the first assertion below).
    provenance: "server",
    at: Date.now() - seq * 1000,
    source: "practice",
    subject: "maths",
    conceptId: "linear-equations",
    specificationId: null,
    questionId: `sync-q-${seq}`,
    correct: seq % 2 === 0,
    chosen: 0,
    mode: "independent",
    hints: 0,
    score: null,
    ms: 5000,
    tags: [],
    deviceAt: null,
    ...overrides,
  };
}
const post = (events) => call("/api/evidence", json({ id, secret, events }));
const get = (since) => call(`/api/evidence?id=${id}&secret=${encodeURIComponent(secret)}${since != null ? `&since=${since}` : ""}`);

// ── 0. The baseline ──────────────────────────────────────────────────────────
group("0 · baseline: a brand-new learner has an empty, consistent ledger");
const base = await get();
ok(base.status === 200, "the learner can read their own ledger");
ok(base.body?.total === 0, "the ledger starts empty", `total ${base.body?.total}`);
ok(base.body?.deepReconcile?.differences?.length === 0, "and the model already reconciles with the (empty) ledger");

// ── 1. A device batch lands, and is stamped as device-reported ───────────────
group("1 · an offline batch is accepted and disclosed as device-reported");
const batch1 = [deviceAnswer(), deviceAnswer(), deviceAnswer()];
const posted1 = await post(batch1);
ok(posted1.status === 200, "a batch of three offline answers is accepted");
ok(posted1.body?.accepted === 3, "all three are accepted", `accepted ${posted1.body?.accepted}`);
ok(posted1.body?.duplicates === 0, "with no duplicates");

const read1 = await get();
ok(read1.body?.total === 3, "the ledger holds three events", `total ${read1.body?.total}`);
const synced = (read1.body?.events ?? []).filter((e) => batch1.some((b) => b.id === e.id));
ok(synced.length === 3, "and they are the events the device sent");
ok(synced.every((e) => e.provenance === "device"),
  "every event is stamped provenance:\"device\" DESPITE the body claiming \"server\"");
ok((read1.body?.projection?.totals?.answers ?? 0) === 3, "the projection counts the offline answers");
ok((read1.body?.deepReconcile?.differences?.length ?? 1) === 0,
  "and the learner model is still exactly the projection of the ledger after the sync");
ok(read1.body?.deepReconcile?.unprojectable === null,
  "the ledger alone reconstructs this learner — nothing here is unprojectable");

// ── 2. Dedupe: a retried sync is a no-op ─────────────────────────────────────
group("2 · dedupe is enforced against the ledger, not the caller's promise");
const postedAgain = await post(batch1);
ok(postedAgain.status === 200, "re-sending the same batch succeeds");
ok(postedAgain.body?.accepted === 0, "but nothing new is accepted", `accepted ${postedAgain.body?.accepted}`);
ok(postedAgain.body?.duplicates === 3, "all three are reported as duplicates");
const read2 = await get();
ok(read2.body?.total === 3, "the ledger is unchanged — a retry cannot double-count", `total ${read2.body?.total}`);

const dupInBatch = [deviceAnswer(), deviceAnswer()];
dupInBatch[1].id = dupInBatch[0].id;
const postedDup = await post(dupInBatch);
ok(postedDup.status === 200 && postedDup.body?.accepted === 1 && postedDup.body?.duplicates === 0,
  "a duplicate INSIDE one batch is not written twice");
ok((postedDup.body?.refused ?? []).some((r) => r.reason === "duplicate_in_batch"),
  "and it is refused by name (duplicate_in_batch)");

// ── 3. Refusals are named ────────────────────────────────────────────────────
group("3 · a bad event is refused by name, never silently dropped");
const refusedBatch = [
  deviceAnswer({ learnerId: "stu_someone_else_entirely" }),          // learner_mismatch
  deviceAnswer({ schemaVersion: 999 }),                              // schema_mismatch
  { type: "answer_submitted", id: "ev_sync_bad", learnerId: id, schemaVersion: 1, at: Date.now(), source: "practice" }, // bad_question
];
const postedRefused = await post(refusedBatch);
ok(postedRefused.status === 200, "the request itself succeeds");
ok(postedRefused.body?.accepted === 0, "but none of the bad events are accepted");
const reasons = (postedRefused.body?.refused ?? []).map((r) => r.reason);
ok(reasons.includes("learner_mismatch"), "an event about another learner is refused (learner_mismatch)");
ok(reasons.includes("schema_mismatch"), "an event from an unknown schema version is refused (schema_mismatch)");
ok(reasons.length >= 3, "and a malformed event is refused too", reasons.join(", "));

const crossLearner = await get();
ok(crossLearner.body?.total === 4,
  "the refused events left no trace in the ledger", `total ${crossLearner.body?.total}`);

// ── 4. Pages and the cursor ──────────────────────────────────────────────────
group("4 · the sync is paged, and the cursor only returns what is new");
const big = await post(Array.from({ length: 501 }, () => deviceAnswer()));
ok(big.status === 413, "a batch larger than 500 events is refused (413)", `got ${big.status}`);
ok(big.body?.max === 500, "and the cap is stated in the response");

const cursorNow = (await get()).body?.cursor;
const afterCursor = await get(cursorNow);
ok((afterCursor.body?.count ?? -1) === 0, "asking for events after the cursor returns none", `count ${afterCursor.body?.count}`);
const oneMore = await post([deviceAnswer({ at: Date.now() + 5000 })]);
ok(oneMore.body?.accepted === 1, "one new offline answer arrives");
const afterNew = await get(cursorNow);
ok(afterNew.body?.count === 1, "and the cursor surfaces exactly that one", `count ${afterNew.body?.count}`);

// ── 5. Out-of-order arrival does not corrupt the record ──────────────────────
group("5 · a device with a wrong clock does not corrupt the record");
const older = await post([deviceAnswer({ at: Date.now() - 30 * 24 * 60 * 60 * 1000 })]);
ok(older.body?.accepted === 1, "an event claiming a date 30 days ago is accepted");
const reconciled = await get();
ok((reconciled.body?.deepReconcile?.differences?.length ?? 1) === 0,
  "the model still reconciles with the ledger after an out-of-order arrival");
ok(reconciled.body?.deepReconcile?.unprojectable === null,
  "and the ledger is still the whole history (nothing unprojectable)");

console.log(`\n${"─".repeat(58)}`);
console.log(`OFFLINE SYNC: ${pass} passed, ${fail} failed`);
if (fail) for (const b of bad) console.log(`  · ${b}`);
process.exit(fail ? 1 : 0);
