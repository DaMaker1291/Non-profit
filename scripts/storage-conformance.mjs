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
//
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
