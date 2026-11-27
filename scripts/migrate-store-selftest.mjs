// ─────────────────────────────────────────────────────────────────────────────
// THE MIGRATION'S OWN EVIDENCE: synthetic source, real scratch database.
//
// A migration tool is believed only after it has been made to fail safely, so
// this drill does four things the CLI cannot do on its own:
//
//   1. builds a source directory that is SMALL AND KNOWN (two accounts, three
//      learner records including one ERASED learner, a paper, a class, a room, a
//      pack, an evidence ledger, an erasure log, a cache entry, an intervention),
//   2. applies it, then applies it AGAIN and asserts the second run inserts
//      nothing — idempotency is the property an interrupted retry depends on,
//   3. interrupts a run after `profiles` and finishes it, asserting the resumed
//      run completes without duplicating the rows the first half wrote,
//   4. asserts the erased learner was WITHHELD while their tombstone was moved,
//      and that every migrated object reads back through the port unchanged.
//
// It creates and drops its own database. It never reads `.openmind-data`.
// ─────────────────────────────────────────────────────────────────────────────
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { buildPlan, auditPlan, planCounts, migrate, targetRefusal } from "./migrate-store-to-postgres.mjs";

const T0 = Date.now() - 86_400_000;

function syntheticSource(dir) {
  const write = (name, value) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2));
  mkdirSync(join(dir, "evidence"), { recursive: true });
  // Two accounts: one plain, one carrying every credential artefact a real
  // account accumulates (epoch, verification, recovery, reset). The second is the
  // one that proves "preserve password hashes, salts and session state".
  write("accounts.json", {
    acc_a: { id: "acc_a", email: "learner@example.test", name: "Learner", role: "student", salt: "salt-a", passHash: "hash-a", profileId: "prof_a", createdAt: T0, lastSeenAt: T0 + 1000, verified: true, sessionEpoch: 3 },
    acc_b: { id: "acc_b", email: "teacher@example.test", name: "Teacher", role: "teacher", salt: "salt-b", passHash: "hash-b", profileId: "prof_b", createdAt: T0, lastSeenAt: T0 + 2000, verified: true, sessionEpoch: 0, recoverySalt: "rs", recoveryHash: "rh", resetSalt: "xs", resetHash: "xh", resetExpiresAt: T0 + 9000, verifySalt: "vs", verifyHash: "vh", verifyExpiresAt: T0 + 8000 },
  });
  const state = (id, extra = {}) => ({ profile: { id, country: "GB", language: "en", birthYear: 2011, subjects: ["maths"] }, secret: `secret-${id}`, progress: { fractions: { attempts: 2, correct: 1 } }, events: [], diagnostics: {}, masteries: {}, observed: {}, practice: {}, seenQuestions: [], ...extra });
  write("profiles.json", {
    prof_a: state("prof_a"),
    prof_b: state("prof_b", { specificationId: "gcse-higher" }),
    // The erased learner: present in the source because the erase deleted the
    // record but the snapshot predates it. It must NOT arrive.
    prof_erased: state("prof_erased"),
  });
  write("papers.json", {
    pap_1: { id: "pap_1", owner: "prof_a", createdAt: T0, name: "Paper 1", subject: "maths", level: "GCSE", minutes: 30, questions: [] },
  });
  write("personal-papers.json", {
    pp_1: { id: "pp_1", owner: "prof_b", createdAt: T0, title: "Extra practice", origin: "manual", questions: [] },
  });
  write("classes.json", [
    { id: "cls_1", ownerId: "prof_b", name: "Year 7", joinCode: "ABC123", subject: "maths", createdAt: T0, members: [{ learnerId: "prof_a", joinedAt: T0, role: "student" }] },
  ]);
  write("rooms.json", { room_1: { id: "room_1", createdBy: "prof_b", createdAt: T0, closedAt: null, title: "Live" } });
  write("packs.json", { pack_1: { id: "pack_1", learnerId: "prof_a", createdAt: T0, title: "Offline" } });
  write("erasures.json", { version: 1, entries: [{ entry: "recorded", learnerId: "prof_erased", at: T0 }] });
  write("ai-cache.json", { "what is a fraction?": { answer: "a part of a whole", at: T0 } });
  write("interventions.json", { version: 1, records: [{ id: "iv_1", classId: "cls_1", conceptId: "fractions", kind: "misconception", status: "proposed", ownerId: "prof_b", createdAt: T0 }] });
  const event = (id, learnerId) => ({
    id, learnerId, at: T0, deviceAt: T0, type: "answer_submitted", subject: "maths", conceptId: "fractions",
    specificationId: null, source: "practice", questionId: "q_1", correct: true, chosen: 0,
    givenValue: null, mode: "independent", hints: 0, ms: 1200, scoreAwarded: null, scoreMax: null,
    tags: ["denom-add"], certainty: "sure", schemaVersion: 1,
  });
  writeFileSync(join(dir, "evidence", "prof_a.jsonl"), [event("ev_1", "prof_a"), event("ev_2", "prof_a")].map((e) => JSON.stringify(e)).join("\n") + "\n");
  writeFileSync(join(dir, "evidence", "prof_erased.jsonl"), JSON.stringify(event("ev_erased", "prof_erased")) + "\n");
  // Files the migration must LEAVE ALONE and say so about.
  write("kiosk-sessions.json", {});
  write("boots.json", { boots: 1, deployment: "x", firstSeenAt: T0, survivedDeployments: 0 });
}

async function withDatabase(testUrl, name, fn) {
  const { default: pg } = await import("pg");
  const base = new URL(testUrl);
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const exists = await admin.query("select 1 from pg_database where datname = $1", [name]);
  if (!exists.rowCount) await admin.query(`create database "${name}"`);
  const url = new URL(testUrl);
  url.pathname = "/" + name;
  const target = url.toString();
  try {
    execFileSync(process.execPath, ["scripts/migrate.mjs", "up"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: target }, stdio: "pipe",
    });
    return await fn(target);
  } finally {
    await admin.query(`drop database if exists "${name}" with (force)`);
    await admin.end();
  }
}

export async function selfTest({ keep = false } = {}) {
  const testUrl = (process.env.OPENMIND_TEST_DATABASE_URL ?? "").trim();
  if (!testUrl) {
    console.log("SKIP migration self-test: OPENMIND_TEST_DATABASE_URL is not set (a scratch database is required).");
    return 0;
  }
  let pass = 0;
  let fail = 0;
  const check = (name, cond, detail = "") => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
  };

  const dir = mkdtempSync(join(tmpdir(), "om-migrate-src-"));
  syntheticSource(dir);
  const plan = buildPlan(dir);
  const audit = auditPlan(plan);
  const counts = planCounts(plan);

  console.log("\n▸ the PLAN reads the source, and nothing is written to it");
  check("two accounts are planned", counts.users === 2, String(counts.users));
  check("the erased learner's record is withheld", plan.withheldProfiles.length === 1 && plan.withheldProfiles[0] === "prof_erased");
  check("the erased learner's ledger is withheld", plan.withheldEvents === 1, String(plan.withheldEvents));
  check("the erasure tombstone IS migrated", plan.erasureRows.length === 1 && plan.erasureRows[0].entry === "recorded");
  check("every source file is in the manifest with a hash", plan.manifest.length >= 9 && plan.manifest.every((m) => /^[0-9a-f]{64}$/.test(m.sha256)));
  check("the source has no integrity problem", audit.problems.length === 0, audit.problems.join(" | "));
  check("a transient file is named, not silently dropped", plan.skippedFiles.includes("kiosk-sessions.json"));

  console.log("\n▸ the TARGET guard refuses anything that is not evidently scratch");
  check("a remote-sounding database is refused", /refusing/.test(targetRefusal("postgres://u:p@db.example.com/app") ?? ""));
  check("a *_test database is allowed", targetRefusal("postgres://u:p@db.example.com/app_test") === null);
  check("localhost is allowed", targetRefusal("postgres://u@127.0.0.1:5432/anything") === null);

  const name = `om_migrate_${Date.now().toString(36)}`;
  const code = await withDatabase(testUrl, name, async (target) => {
    console.log("\n▸ APPLY, INTERRUPT, RESUME — the retry is the point");
    const half = await migrate({ plan, targetUrl: target, apply: true, stopAfter: "profiles" });
    check("the interrupted run stops where it was told to", half.status === "interrupted" && half.interruptedAfter === "profiles");
    check("the first half committed (accounts + records)", half.after.users === 2 && half.after.profiles === 2, JSON.stringify(half.after));

    const resumed = await migrate({ plan, targetUrl: target, apply: true });
    check("the resumed run completes", resumed.status === "applied");
    check("no account was duplicated by the retry", resumed.after.users === 2, String(resumed.after.users));
    check("no learner record was duplicated", resumed.after.profiles === 2, String(resumed.after.profiles));
    check("the ledger arrived once", resumed.after.evidence === 2, String(resumed.after.evidence));
    check("the erasure tombstone arrived", resumed.after.erasures === 1, String(resumed.after.erasures));

    const again = await migrate({ plan, targetUrl: target, apply: true });
    check("a THIRD run inserts no accounts", again.inserted.users.inserted === 0, JSON.stringify(again.inserted.users));
    check("a third run accepts no new events", again.inserted.evidence.accepted === 0, JSON.stringify(again.inserted.evidence));
    check("counts are stable across runs", JSON.stringify(again.after) === JSON.stringify(resumed.after), `${JSON.stringify(resumed.after)} vs ${JSON.stringify(again.after)}`);

    console.log("\n▸ the READBACK is the migration's claim, checked object by object");
    // The resumed run is the one that reads back what the interrupted run wrote,
    // so its readback covers rows from BOTH halves — that is why it is asserted.
    check("every object read back unchanged", resumed.readback.differences.length === 0, resumed.readback.differences.slice(0, 3).join(" | "));
    check("accounts read back with their credentials intact", resumed.readback.users === 2, String(resumed.readback.users));
    check("records, papers, classes, rooms, packs, ledger and cache all read back",
      resumed.readback.profiles === 2 && resumed.readback.papers === 1 && resumed.readback.personal_papers === 1 &&
      resumed.readback.classes === 1 && resumed.readback.rooms === 1 && resumed.readback.packs === 1 &&
      resumed.readback.evidence === 2 && resumed.readback.interventions === 1,
      JSON.stringify(resumed.readback));

    const gate = await import("../.verify/server/pg.js");
    gate.resetDatabaseHealth?.();
    const erased = await gate.pgQuery("select id from profiles where id = 'prof_erased'");
    check("the erased learner was NOT resurrected", erased.length === 0);
    const tomb = await gate.pgQuery("select kind from erasures where learner_id = 'prof_erased'");
    check("their tombstone was carried forward", tomb.length === 1 && tomb[0].kind === "recorded", JSON.stringify(tomb));
    const erasedLedger = await gate.pgQuery("select id from evidence_events where learner_id = 'prof_erased'");
    check("their ledger did not arrive either", erasedLedger.length === 0);
    const cred = await gate.pgQuery("select salt, pass_hash, session_epoch, verified, reset_hash from users where id = 'acc_b'");
    check("the salt, hash, epoch and reset state are preserved exactly",
      cred[0]?.salt === "salt-b" && cred[0]?.pass_hash === "hash-b" && Number(cred[0]?.session_epoch) === 0 &&
      cred[0]?.verified === true && cred[0]?.reset_hash === "xh", JSON.stringify(cred[0]));
    await gate.endPool?.();
    return 0;
  });

  if (!keep) rmSync(dir, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  return fail === 0 ? code : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  selfTest({ keep: process.argv.includes("--keep") }).then((c) => process.exit(c)).catch((e) => {
    console.error(e?.stack ?? String(e));
    process.exit(1);
  });
}
