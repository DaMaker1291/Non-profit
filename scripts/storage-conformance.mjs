// ─────────────────────────────────────────────────────────────────────────────
// THE STORAGE CONFORMANCE SUITE — one suite, every configured backend.
//
// docs/STORAGE_SPEC.md §6 names the thing that decides whether a second backend
// is a second product: "a second backend that is tested with a second test suite
// is a second product." So there is ONE suite, it lives here, and it drives the
// PORT rather than any backend's own functions.
//
// It runs the file backend always. A Postgres backend runs when one exists in
// this build — none does yet (slice 4), so that half is reported as SKIPPED WITH
// THE REASON, never as a pass it did not earn. §6's parity property is the
// FAILURE-LIST compare between two runs, so the last line of output is a stable,
// machine-readable failure list (`CONFORMANCE-FAILURES: a | b`) a second run can
// be compared against, plus a `--report` JSON for the record.
//
// ── What it asserts, and why each is a contract rather than a smoke test ─────
//   · an unknown learner is `null`, not an empty profile — §3 Q2: creating is not
//     a mutation of an existing learner
//   · TWO learners coexist. `profiles.json` is one shared map, so a save that
//     dropped the others would be catastrophic, silent, and invisible to a
//     single-learner test
//   · an erase removes the record AND writes the tombstone a restore re-applies,
//     while a FAILED erase writes nothing — a tombstone for a learner who was
//     never deleted is a false statement about a person
//   · `readEvents` is OLDEST FIRST. This case found a real defect on its first
//     run: the port promises clock order, and the file backend returned append
//     order — which differs the moment a device syncs work it did offline
//   · the ledger's dedupe / absence / deletion rules the sync path depends on
//   · owner-scoping on personal papers: a wrong owner gets `null`, which is the
//     privacy contract and has to hold in every backend
//   · the answer key reads back by paper id; marking depends on it
//   · the class/room update helpers answer `null` for a key they do not find
//     instead of creating a record — the difference between a lookup and a write
//   · and the FAILURE cases, which are what storage is actually for: a torn
//     final line, a write killed between the append and the projection, two
//     processes over one directory, and an append that fails outright. Each
//     asserts the property the failure must not break (see "durability under
//     failure"). They are FILE-BACKEND cases today, because the port's own
//     write path (`withLearner`) is slice 3 and does not exist yet.

// ── What it must never do ────────────────────────────────────────────────────
// Touch a real store. `DATA_DIR` is resolved at MODULE LOAD, so the temp
// directory is set before the first require — the rule verify-engines.mjs
// follows too, and the reason this file has no `--data` flag.
//
// Usage:
//   node scripts/storage-conformance.mjs [--report] [--keep]
//     --report  also write audit/storage-conformance.json
//     --keep    leave the temp store on disk for inspection
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const argv = process.argv.slice(2);

// BEFORE ANY REQUIRE. The store resolves DATA_DIR at module load, so this line is
// the difference between testing a temp store and testing a school's.
const STORE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "om-conformance-"));
process.env.OPENMIND_DATA_DIR = STORE_DIR;

// The compiled mirror. `storage.js` is the port alone — it imports nothing from
// the store — so it can be loaded and CONSULTED before anything that resolves the
// backend. That order matters: `store.js` resolves the configured backend at
// module load and throws for one this build cannot serve, so requiring the
// backend first would turn an operator's misconfiguration into a stack trace in
// the middle of a gate. This way the refusal is a sentence.
compileEngines();
const port = require("../.verify/server/storage.js");
const configured = port.storeKindReport();
if (configured.problem) {
  console.log(`\n  This build cannot serve OPENMIND_STORE="${configured.configured}" (${configured.problem.code}).`);
  console.log(`  ${configured.problem.detail}`);
  console.log("  NOTHING WAS TESTED: unset it to run the file store, or see docs/STORAGE_SPEC.md slice 4.\n");
  process.exit(2);
}
const { activeStorage, fileStorage } = require("../.verify/server/storage-file.js");
const { appendEvidence } = require("../.verify/server/evidence.js");
const { newProfileState } = require("../.verify/learner-profile.js");
const { ERASURES_FILE } = require("../.verify/server/erasures.js");
// The write path and the replayer, for the failure cases below. The port has no
// write method yet (slice 3), so those cases are driven through the modules the
// file backend really writes with — and they say so in their own skip line
// rather than pretending to be backend-neutral.
const { commitAndProject } = require("../.verify/server/projection.js");
const { reconcileDeep, replayModel } = require("../.verify/replay.js");
const { answerEvidence, submissionEventId } = require("../.verify/evidence.js");
const { spawn } = require("node:child_process");

let pass = 0;
const failures = [];
const skips = [];
const ok = (name, cond, detail = "") => {
  if (cond) pass++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`  ${cond ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const skipped = (what, why) => {
  skips.push(`${what} — ${why}`);
  console.log(`  · SKIPPED ${what} — ${why}`);
};

console.log("\nOpenMind — storage conformance (docs/STORAGE_SPEC.md §6)");
console.log(`  store under test: ${STORE_DIR}\n`);

// ── Which backends CAN this build serve? ────────────────────────────────────
// Asked before anything runs, because the answer decides whether this is a
// conformance run with a gap in it or a run that tested everything it claims to.
console.log("▸ which backends this build can serve");
{
  const report = port.storeKindReport();
  ok("an unconfigured deployment resolves to the file backend", report.kind === "file" && report.problem === null,
    `kind ${report.kind}`);
  const pg = port.storeKindReport({ OPENMIND_STORE: "postgres" });
  ok("postgres is refused rather than served as a file store (not implemented — slice 4)",
    pg.problem?.code === "store_not_implemented",
    pg.problem ? pg.problem.code : `resolved to ${pg.kind}`);
  if (pg.problem?.code === "store_not_implemented") {
    skipped("postgres conformance", "no Postgres backend exists in this build — docs/STORAGE_SPEC.md slice 4; " +
      "when it lands, its adapter goes in this file so there is still ONE suite");
  } else if (!process.env.DATABASE_URL) {
    skipped("postgres conformance", "DATABASE_URL is not set");
  } else {
    skipped("postgres conformance", "a Postgres backend exists and DATABASE_URL is set, but this suite has no adapter " +
      "for it — extend THIS file; a second suite is a second product (§6)");
  }
}

// ── The port's own completeness, for whichever backend is active ────────────
console.log("\n▸ the port describes the backend that runs");
const storage = activeStorage();
{
  ok("the active backend is the file backend", storage.kind === "file" && storage === fileStorage, storage.kind);
  const missing = port.STORAGE_METHODS.filter((m) => typeof storage[m] !== "function");
  ok(`every one of the port's ${port.STORAGE_METHODS.length} methods is implemented`,
    missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : "none missing");
}

// ── Profiles ────────────────────────────────────────────────────────────────
console.log("\n▸ profiles");
const MEL = "conf_learner_mel";
const SAM = "conf_learner_sam";
{
  ok("an unknown learner is null, not an empty profile", (await storage.getProfile("conf_nobody_here")) === null);

  const mel = newProfileState(MEL, { handle: "mel", subjects: ["maths", "physics"] });
  mel.profile.goal = "pass the GCSE";
  await storage.saveProfile(mel);
  const back = await storage.getProfile(MEL);
  ok("saveProfile → getProfile round-trips the same learner", back?.profile?.id === MEL, `got ${back?.profile?.id}`);
  ok("and the fields the caller set survive, not just the id", back?.profile?.goal === "pass the GCSE");

  // The shared-map case: one file holds every learner, so this is the regression
  // that would delete a classroom and show up nowhere else.
  await storage.saveProfile(newProfileState(SAM, { handle: "sam" }));
  const all = await storage.listProfiles();
  const ids = all.map((s) => s.profile.id);
  ok("two learners coexist: saving one does not drop the other",
    ids.includes(MEL) && ids.includes(SAM), `${ids.length} profile(s): ${ids.join(", ")}`);

  // ── Erasure: the record AND the intent ────────────────────────────────────
  const neverExisted = await storage.eraseProfile("conf_never_existed");
  ok("erasing a learner who was never there answers false", neverExisted === false);
  const logAfterMiss = fs.existsSync(path.join(STORE_DIR, ERASURES_FILE))
    ? fs.readFileSync(path.join(STORE_DIR, ERASURES_FILE), "utf8")
    : "";
  ok("and leaves NO tombstone — a failed erase must not claim a person was deleted",
    !logAfterMiss.includes("conf_never_existed"));

  const erased = await storage.eraseProfile(SAM);
  ok("erasing a real learner answers true", erased === true);
  ok("the record is gone", (await storage.getProfile(SAM)) === null);
  const after = (await storage.listProfiles()).map((s) => s.profile.id);
  ok("and it is gone from the list too", !after.includes(SAM), after.join(", "));
  const log = fs.existsSync(path.join(STORE_DIR, ERASURES_FILE))
    ? fs.readFileSync(path.join(STORE_DIR, ERASURES_FILE), "utf8")
    : "";
  ok("while the INTENT is recorded, which is what a restore re-applies", log.includes(SAM));
  ok("and the learner who was not erased is untouched", after.includes(MEL));
}

// ── The ledger, read side ───────────────────────────────────────────────────
console.log("\n▸ the ledger (read side — the write path is slice 3)");
const LEDGED = "conf_learner_ledger";
const UNLEDGED = "conf_learner_unledgered";
{
  const ev = (id, at) => ({
    id, learnerId: LEDGED, at, schemaVersion: 1, kind: "answer_submitted",
    source: "practice", provenance: "server", conceptId: "quadratics",
  });
  // Deliberately appended OUT of clock order: this is what an offline device
  // looks like, and it is the case the port's "oldest first" promise is about.
  await appendEvidence(LEDGED, [ev("ev_c", 300), ev("ev_a", 100), ev("ev_b", 200)]);

  const events = storage.readEvents(LEDGED);
  ok("readEvents returns the learner's whole history", events.length === 3, `${events.length} event(s)`);
  ok("OLDEST FIRST — clock order, not the order the file was written",
    events.map((e) => e.id).join(",") === "ev_a,ev_b,ev_c",
    `got ${events.map((e) => `${e.id}@${e.at}`).join(",")}`);

  ok("an unknown learner has an empty history rather than an error", storage.readEvents(UNLEDGED).length === 0);
  ok("hasEvent knows an event this learner wrote", storage.hasEvent(LEDGED, "ev_a") === true);
  ok("and answers false for one they did not", storage.hasEvent(LEDGED, "ev_nope") === false);
  ok("hasEvent is learner-scoped: another learner's id is not mine",
    storage.hasEvent(UNLEDGED, "ev_a") === false);

  const ledgers = storage.learnersWithEvents();
  ok("learnersWithEvents lists the learner who has a ledger", ledgers.includes(LEDGED));
  ok("and not one who has none — the impact report walks ledgers, not profiles",
    !ledgers.includes(UNLEDGED));

  const deleted = storage.deleteEvents(LEDGED);
  ok("deleteEvents reports having removed a ledger", deleted === true);
  ok("after which the history is empty", storage.readEvents(LEDGED).length === 0);
  ok("and the learner is gone from learnersWithEvents", !storage.learnersWithEvents().includes(LEDGED));
  ok("deleting again is false rather than a throw", storage.deleteEvents(LEDGED) === false);
}

// ── Durability under failure ────────────────────────────────────────────────
//
// The happy path is not what storage is for. These cases are the failures the
// write path meets in the world, and each one asserts the property the failure
// must not break:
//
//   F1 · a process killed mid-append costs ONE event, not the ledger — and the
//        damaged line is skipped, never repaired (history is append-only)
//   F2 · a write killed BETWEEN the append and the projection is
//        indistinguishable from one that completed, both by replaying the
//        ledger and by re-sending the write. This is the one window the
//        ordering WRITE EVENT → REPLAY → RESPOND cannot close by itself, so
//        the ledger being the source of truth is what has to cover it
//   F3 · two processes over one directory. The in-process lock is a promise
//        chain and says nothing about a second process, which is the entire
//        reason this storage work exists: `appendFileSync` with O_APPEND is the
//        file backend's only real concurrency story, so this MEASURES it rather
//        than assuming it
//   F4 · an append that cannot be written throws and the model does NOT move —
//        the invariant behind the route's `evidence_not_recorded` (503)
//   F5 · an id that is not a safe filename is REFUSED, not sanitised, and
//        nothing is created behind it
//
// They print the strongest claim available rather than the convenient one: F1
// and F3 read the FILE and parse every line, because `readEvents` skips a
// malformed line and would therefore hide a tear behind a smaller count.
//
// NO DISK BEYOND THE TEMP STORE AND NO DEV SERVER: this is the cheapest place
// in the repository to find out whether "safe storage" is measured or merely
// intended.
console.log("\n▸ durability under failure");
if (storage.kind !== "file") {
  skipped(
    "write-path failure cases (F1–F5)",
    "the port's write path (`withLearner`, docs/STORAGE_SPEC.md slice 3) does not exist yet, so these cases drive " +
      "lib/server/evidence.ts + lib/server/projection.ts — the FILE backend's own write primitive. Move them onto the " +
      "port when it lands; do not give them a second suite (§6)",
  );
} else {
  const EVIDENCE_DIR = path.join(STORE_DIR, "evidence");
  const ledgerFile = (id) => path.join(EVIDENCE_DIR, `${id}.jsonl`);
  /** One realistic server-observed answer, so the fold has something to fold. */
  const answer = (learnerId, conceptId, at, correct, seq) =>
    answerEvidence({
      learnerId, at, source: "practice", subject: "maths", conceptId, specificationId: null,
      questionId: `${learnerId}_q${seq}`, correct, chosen: correct ? 0 : 1,
      mode: "independent", hints: 0,
    });
  const what = (diffs) =>
    diffs.slice(0, 3).map((d) => `${d.conceptId}.${d.field}: ledger=${d.ledger} model=${d.model}`).join("; ") +
    (diffs.length > 3 ? ` (+${diffs.length - 3} more)` : "");

  // ── F1 · a process killed in the middle of an append ──────────────────────
  const TORN = "conf_learner_torn";
  {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    const landed = [answer(TORN, "quadratics", 100, true, 1), answer(TORN, "quadratics", 200, false, 2)];
    // Two complete lines, then the fragment a killed process leaves: a partial
    // JSON object and no trailing newline. This is what `appendFileSync` looks
    // like from the reader's side when the write did not finish.
    const fragment = `{"type":"answer_submitted","id":"ev_torn","learnerId":"${TORN}","at":150`;
    fs.writeFileSync(ledgerFile(TORN), landed.map((e) => JSON.stringify(e)).join("\n") + "\n" + fragment);

    const read = storage.readEvents(TORN);
    ok("a torn final line costs ONE event — the history before it still reads",
      read.length === 2, `${read.length} event(s)`);
    ok("and the events that did land come back in clock order, intact",
      read.map((e) => e.id).join(",") === landed.map((e) => e.id).join(","),
      read.map((e) => e.id).join(","));
    ok("the half-written event is NOT invented into the history",
      !read.some((e) => e.id === "ev_torn"));
    // The store's own stated rule: a malformed line is skipped, never repaired
    // and never deleted, because rewriting history is the one thing an
    // append-only ledger must not do.
    ok("and the fragment is left ON DISK — a damaged ledger is not rewritten",
      fs.readFileSync(ledgerFile(TORN), "utf8").includes("ev_torn"));

    // What the tear costs the MODEL: the surviving prefix must still fold. A
    // ledger that cannot be projected from is worse than one missing an answer.
    let replayed = null;
    try { replayed = replayModel(read, TORN); } catch { /* asserted below */ }
    ok("the surviving ledger still replays to a model",
      replayed?.progress?.quadratics?.attempts === 2,
      `attempts ${replayed?.progress?.quadratics?.attempts}`);

    // …and the learner can CARRY ON. A store that latched a poisoned id cache
    // on the damaged file would refuse every later answer from this learner.
    const next = answer(TORN, "quadratics", 300, true, 3);
    await appendEvidence(TORN, [next]);
    ok("the ledger still accepts new events afterwards",
      storage.readEvents(TORN).some((e) => e.id === next.id));
    ok("and appending did not rewrite the damaged line either",
      fs.readFileSync(ledgerFile(TORN), "utf8").includes("ev_torn"));
    // The precise claim, because the coarse one hid a real defect on the first
    // run: the new event must land on a line of its OWN. Appended straight onto
    // the fragment it is spliced into the wreckage, the reader skips the whole
    // line, and the answer is gone while `appendEvidence` reports it accepted.
    const afterTear = fs.readFileSync(ledgerFile(TORN), "utf8").split("\n").filter((l) => l.trim());
    ok("and the new event is a LINE OF ITS OWN, not spliced onto the half-written one",
      afterTear.length === 4 &&
        afterTear.filter((l) => { try { JSON.parse(l); return true; } catch { return false; } }).length === 3,
      `${afterTear.length} line(s), ${afterTear.filter((l) => { try { JSON.parse(l); return true; } catch { return false; } }).length} parseable`);
  }

  // ── F2 · a write killed between the append and the projection ────────────
  // The ordering is WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND, and the
  // window it cannot close by itself is the instant between the append and the
  // projection: kill the process there and the ledger holds an answer the model
  // never folded. Two learners run the same three answers — A through the real
  // path, B through an append whose projection never happened — and the claims
  // are that B replays to A's model, and that B's RETRY (the learner pressing
  // Check again) is recognised as already recorded rather than counted twice.
  const COMMITTED = "conf_learner_committed";
  const CRASHED = "conf_learner_crashed";
  {
    const shape = [
      ["quadratics", 1000, true], ["quadratics", 2000, false],
      ["linear-equations", 3000, true], ["quadratics", 4000, true],
    ];
    // The events are built ONCE and the SAME objects are re-sent, because that
    // is what a retry is in the product: the route derives the event id from the
    // device's submission token (`submissionEventId`), so a lost response, a
    // double flush or a second tab draining one queue all mint the SAME id and
    // the ledger recognises them as one event. Minting a fresh id per call would
    // model a second genuine attempt at the same question — a different thing,
    // which correctly counts twice. Deriving the ids here rather than inventing
    // them is what keeps this case about the crash and not about my fixture.
    const build = (id) =>
      shape.map(([c, at, correct], i) =>
        answerEvidence({
          learnerId: id, at, source: "practice", subject: "maths", conceptId: c, specificationId: null,
          questionId: `${id}_q${i}`, correct, chosen: correct ? 0 : 1, mode: "independent", hints: 0,
          id: submissionEventId(`confsubmit${id.replace(/_/g, "")}${i}`) ?? undefined,
        }));

    const committed = newProfileState(COMMITTED);
    await commitAndProject(COMMITTED, committed, build(COMMITTED));
    ok("the completed write produced a model",
      committed.progress.quadratics?.attempts === 3 && committed.progress["linear-equations"]?.attempts === 1,
      `quadratics ${committed.progress.quadratics?.attempts}, linear-equations ${committed.progress["linear-equations"]?.attempts}`);

    const crashed = newProfileState(CRASHED);
    await appendEvidence(CRASHED, build(CRASHED)); // …and the process dies HERE
    const divergence = reconcileDeep(replayModel(storage.readEvents(CRASHED), CRASHED), committed);
    ok("a write killed between the append and the projection replays to the SAME model the completed write produced",
      divergence.length === 0, what(divergence));

    const retry = newProfileState(CRASHED);
    const again = await commitAndProject(CRASHED, retry, build(CRASHED));
    ok("re-sending the interrupted write reports every event as a duplicate",
      again.accepted.length === 0 && again.duplicates.length === shape.length,
      `accepted ${again.accepted.length}, duplicates ${again.duplicates.length}`);
    ok("so the retry does not count the answers twice",
      reconcileDeep(retry, committed).length === 0, what(reconcileDeep(retry, committed)));

    // The other direction, which is the one a learner actually sees: the retried
    // state is the one the route validates against and then responds with.
    ok("and the retried model is the learner's whole history, not just the first two answers",
      retry.progress.quadratics?.attempts === 3,
      `attempts ${retry.progress.quadratics?.attempts}`);
  }

  // ── F3 · two processes over one directory ────────────────────────────────
  const RACE = "conf_learner_race";
  {
    const CHILDREN = 3, BATCHES = 10, PER_BATCH = 4;
    const expected = CHILDREN * BATCHES * PER_BATCH;
    const childFile = path.join(STORE_DIR, "append-child.cjs");
    // A real second process, because that is the only thing that can prove the
    // lock table is per-process. It requires the SAME compiled modules and
    // inherits OPENMIND_DATA_DIR, so it appends to the same directory as the
    // parent — which is the deployment that would collide in the field
    // (two node workers, or a worker and a CLI).
    fs.writeFileSync(childFile, [
      "// Written by scripts/storage-conformance.mjs — one process in F3.",
      `const { appendEvidence } = require(${JSON.stringify(path.join(ROOT, ".verify", "server", "evidence.js"))});`,
      `const LEARNER = ${JSON.stringify(RACE)};`,
      "const tag = process.argv[2], batches = Number(process.argv[3]), perBatch = Number(process.argv[4]);",
      "(async () => {",
      "  for (let b = 0; b < batches; b++) {",
      "    const batch = [];",
      "    for (let i = 0; i < perBatch; i++) {",
      "      const n = b * perBatch + i;",
      "      batch.push({",
      "        type: \"answer_submitted\", id: \"race_\" + tag + \"_\" + n, schemaVersion: 1,",
      "        learnerId: LEARNER, provenance: \"server\",",
      "        at: 1000000 + Number(tag) * 1000 + n, source: \"practice\", subject: \"maths\",",
      "        conceptId: \"quadratics\", specificationId: null, questionId: \"q_\" + tag + \"_\" + n,",
      "        correct: n % 2 === 0, chosen: 0, givenValue: null, mode: \"independent\",",
      "        hints: 0, score: null, ms: null, tags: [], deviceAt: null, certainty: null,",
      "      });",
      "    }",
      "    // A BATCH is one appendFileSync, so this is the case that matters: a torn",
      "    // multi-line write loses four events at once, not one.",
      "    await appendEvidence(LEARNER, batch);",
      "  }",
      "  process.exit(0);",
      "})().catch((e) => { console.error(e); process.exit(1); });",
      "",
    ].join("\n"));

    const runChild = (tag) =>
      new Promise((resolve, reject) => {
        const p = spawn(process.execPath, [childFile, String(tag), String(BATCHES), String(PER_BATCH)], {
          env: process.env, stdio: ["ignore", "ignore", "pipe"],
        });
        let err = "";
        p.stderr.on("data", (d) => { err += d; });
        p.on("error", reject);
        p.on("close", (code) =>
          code === 0 ? resolve() : reject(new Error(`append child ${tag} exited ${code}: ${err.trim()}`)));
      });
    await Promise.all(Array.from({ length: CHILDREN }, (_, i) => runChild(i)));

    const all = storage.readEvents(RACE);
    ok(`${CHILDREN} processes appending at once kept every event (${expected})`,
      all.length === expected, `${all.length} event(s)`);
    ok("and none was written twice (the ids are unique)",
      new Set(all.map((e) => e.id)).size === all.length,
      `${new Set(all.map((e) => e.id)).size} unique of ${all.length}`);
    // The claim that a COUNT cannot make: `readEvents` skips a malformed line, so
    // an interleaved write could shorten the file and still look orderly. Read
    // the file and parse every line instead.
    const lines = fs.readFileSync(ledgerFile(RACE), "utf8").split("\n").filter((l) => l.trim());
    let unparseable = 0;
    for (const line of lines) { try { JSON.parse(line); } catch { unparseable++; } }
    ok("every line of the file parses — no write was torn by another process",
      unparseable === 0 && lines.length === expected, `${lines.length} line(s), ${unparseable} unparseable`);
    ok("and no event crossed files: every one belongs to the learner whose ledger it is",
      all.every((e) => e.learnerId === RACE));
    let raced = null;
    try { raced = replayModel(all, RACE); } catch { /* asserted below */ }
    ok("a ledger written by three processes still rebuilds into one model",
      raced?.progress?.quadratics?.attempts === expected,
      `attempts ${raced?.progress?.quadratics?.attempts}`);
  }

  // ── F4 · a failed append must not move the model ─────────────────────────
  // The 503 contract: if the evidence cannot be written, the model does not
  // move and the learner is told so, rather than being shown a model that moved
  // for no auditable reason. Driven with an event about a DIFFERENT learner,
  // which the ledger refuses however the caller labels it.
  const FAILED = "conf_learner_failed";
  {
    const state = newProfileState(FAILED);
    let threw = false;
    try { await commitAndProject(FAILED, state, [answer("conf_learner_someone_else", "quadratics", 500, true, 1)]); }
    catch { threw = true; }
    ok("an append that cannot be written THROWS rather than reporting success", threw);
    ok("and the model did NOT move — no progress was invented",
      Object.keys(state.progress).length === 0 && Object.keys(state.masteries).length === 0,
      `progress ${JSON.stringify(state.progress)}`);
    ok("and no snapshot of a pre-ledger model was taken either", !state.projectionBase);
    ok("and nothing reached the ledger", storage.readEvents(FAILED).length === 0);
  }

  // ── F5 · an unsafe learner id is refused, not sanitised ──────────────────
  // Learner ids become FILE PATHS in this backend, so quietly rewriting one
  // could append one learner's evidence to another's file. A refusal is the only
  // safe answer, and it must leave nothing behind.
  {
    const filesBefore = fs.readdirSync(EVIDENCE_DIR).length;
    let threw = false;
    try { await appendEvidence("../../etc/passwd", [answer("../../etc/passwd", "quadratics", 1, true, 1)]); }
    catch { threw = true; }
    ok("an id that is not a safe filename is REFUSED", threw);
    ok("and nothing was created behind it",
      fs.readdirSync(EVIDENCE_DIR).length === filesBefore,
      `${fs.readdirSync(EVIDENCE_DIR).length} file(s), was ${filesBefore}`);
  }
}

// ── Classes and membership ──────────────────────────────────────────────────
console.log("\n▸ classes and membership");
const CLS = "cls_conf";
const MEMBER = "conf_learner_member";
{
  await storage.saveProfile(newProfileState(MEMBER, { handle: "member" }));
  await storage.saveClass({
    id: CLS, joinCode: "CONF42", name: "Conformance", createdAt: Date.now(),
    teacher: "conf_teacher", members: [MEMBER], membersById: { member: MEMBER }, students: {},
  });
  const cls = await storage.getClass(CLS);
  ok("saveClass → getClass round-trips the roster", cls?.id === CLS, `got ${cls?.id}`);
  ok("getClass answers null for an unknown id", (await storage.getClass("cls_nope")) === null);
  ok("updateClassByCode finds a class by a LOWER-CASE join code (the store normalises it)",
    (await storage.updateClassByCode("conf42", (c) => c.id))?.result === CLS);
  const missCode = await storage.updateClassByCode("NOSUCH", (c) => c.id);
  ok("updateClassByCode answers null for an unknown code instead of creating a class", missCode === null);
  const missId = await storage.updateClassById("cls_nope", (c) => c.id);
  ok("updateClassById answers null for an unknown id", missId === null);

  const removed = await storage.removeMemberEverywhere(MEMBER);
  ok("removeMemberEverywhere reports the rosters it changed", removed === 1, `changed ${removed}`);
  const after = await storage.getClass(CLS);
  ok("and the learner is no longer on the roster",
    !(after?.members ?? []).includes(MEMBER), `members: ${JSON.stringify(after?.members ?? null)}`);
  ok("removing a learner who is not a member changes nothing",
    (await storage.removeMemberEverywhere("conf_learner_member")) === 0);
}

// ── Rooms ───────────────────────────────────────────────────────────────────
console.log("\n▸ rooms");
const ROOM = "room_conf";
{
  await storage.saveRoom({ id: ROOM, createdAt: Date.now(), subject: "maths" });
  ok("saveRoom → getRoom round-trips", (await storage.getRoom(ROOM))?.id === ROOM);
  ok("getRoom answers null for an unknown id", (await storage.getRoom("room_nope")) === null);
  const updated = await storage.updateRoomById(ROOM, (r) => r.id);
  ok("updateRoomById returns the room and the mutator's result",
    updated?.room?.id === ROOM && updated?.result === ROOM);
  ok("updateRoomById answers null for an unknown id", (await storage.updateRoomById("room_nope", () => 1)) === null);
  ok("listRooms includes the room", (await storage.listRooms()).some((r) => r.id === ROOM));
}

// ── Community packs ─────────────────────────────────────────────────────────
console.log("\n▸ community packs");
const CONCEPT = "quadratics";
{
  const now = Date.now();
  await storage.savePack({ id: "pack_low", conceptId: CONCEPT, helpful: 1, createdAt: now });
  await storage.savePack({ id: "pack_high", conceptId: CONCEPT, helpful: 5, createdAt: now });
  const packs = await storage.listPacks(CONCEPT);
  ok("listPacks returns the concept's packs", packs.length >= 2, `${packs.length} pack(s)`);
  ok("sorted most-helpful first, which is the order a learner sees",
    packs[0].id === "pack_high", packs.map((p) => `${p.id}:${p.helpful}`).join(", "));
  ok("an unknown concept has no packs rather than an error", (await storage.listPacks("no_such_concept")).length === 0);
  ok("readAllPacks spans concepts (fork/helpful resolve a pack id with it)",
    (await storage.readAllPacks()).some((p) => p.id === "pack_high"));
}

// ── Papers: the server-side answer key ──────────────────────────────────────
console.log("\n▸ papers (the answer key stays server-side)");
const PAPER = "paper_conf";
{
  await storage.saveStoredPaper({ id: PAPER, createdAt: Date.now(), answers: [{ q: 1, key: "B" }] });
  const key = await storage.getStoredPaper(PAPER);
  ok("saveStoredPaper → getStoredPaper round-trips the key", key?.id === PAPER);
  ok("and the answers come back with it (marking needs nothing else)", key?.answers?.[0]?.key === "B");
  ok("getStoredPaper answers null for an unknown paper", (await storage.getStoredPaper("paper_nope")) === null);
}

// ── Personal papers: owner-scoped ───────────────────────────────────────────
console.log("\n▸ personal papers (owner-scoped)");
const PP = "pp_conf";
const OWNER = "conf_learner_owner";
const OTHER = "conf_learner_other";
{
  await storage.savePersonalPaper({ id: PP, owner: OWNER, createdAt: Date.now(), totalMarks: 40, marks: 30 });
  ok("the owner reads their own paper back", (await storage.getPersonalPaper(PP, OWNER))?.id === PP);
  ok("ANOTHER LEARNER GETS NULL — the privacy contract, in every backend",
    (await storage.getPersonalPaper(PP, OTHER)) === null);
  ok("an unknown paper is null even for the owner", (await storage.getPersonalPaper("pp_nope", OWNER)) === null);
  ok("listPersonalPapers lists the owner's own", (await storage.listPersonalPapers(OWNER)).some((p) => p.id === PP));
  ok("and never another learner's", (await storage.listPersonalPapers(OTHER)).length === 0);
}

// ── The AI result cache ─────────────────────────────────────────────────────
console.log("\n▸ the AI result cache (disposable by design)");
{
  ok("an uncached key is null (a miss is not an error)",
    (await storage.cacheGet("conf:missing")) === null);
  await storage.cacheSet("conf:key", { nested: { text: "hello" }, n: 3 });
  const got = await storage.cacheGet("conf:key");
  ok("cacheSet → cacheGet round-trips a structured value",
    got?.nested?.text === "hello" && got?.n === 3, JSON.stringify(got));
}

// ── Result ──────────────────────────────────────────────────────────────────
console.log(`\n▸ ${pass} case(s) passed, ${failures.length} failed, ${skips.length} skipped`);
if (failures.length) for (const f of failures) console.log(`  ✗ ${f}`);
// The parity assertion of §6 is a compare of these two lists between runs, so the
// list is printed in a fixed shape: one line, `|`-separated, empty when clean.
console.log(`CONFORMANCE-FAILURES: ${failures.join(" | ")}`);
console.log(`CONFORMANCE-SKIPPED: ${skips.join(" | ")}`);

if (argv.includes("--report")) {
  const out = path.join(ROOT, "audit", "storage-conformance.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({
    suite: "storage-conformance",
    spec: "docs/STORAGE_SPEC.md §6",
    generatedAt: new Date().toISOString(),
    storeIsTemporary: true,
    backendsTested: ["file"],
    casesPassed: pass,
    failures,
    skipped: skips,
  }, null, 2) + "\n");
  console.log(`  report written: ${path.relative(ROOT, out)}`);
}

if (argv.includes("--keep")) console.log(`  temp store kept: ${STORE_DIR}`);
else fs.rmSync(STORE_DIR, { recursive: true, force: true });

process.exit(failures.length ? 1 : 0);
