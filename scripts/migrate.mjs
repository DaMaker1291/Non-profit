// ─────────────────────────────────────────────────────────────────────────────
// THE MIGRATION RUNNER (§4 of the deployment brief).
//
// "Never deploy 'I changed the schema, hopefully the old data still works.'"
// So the schema is a set of numbered, PAIRED, checkable files and deployment is a
// sequence with a verifiable step in it:
//
//     backup → migration → application rollout → health check
//
// WHAT IT REFUSES TO DO, because each refusal is a real incident avoided:
//
//   · It will not run a migration that has no down file. A migration with no
//     reverse is not a migration, it is a one-way door, and the pairing is
//     checked BEFORE anything is applied rather than discovered afterwards.
//   · It will not apply anything on top of DRIFTED history. Every applied
//     migration's checksum is compared against the file on disk first, so
//     editing an already-applied migration — the single most common way a schema
//     silently diverges between staging and production — fails loudly and names
//     the file. A new migration is how you change a schema; editing an old one
//     only changes what your laptop believes.
//   · It will not revert in production without an explicit flag. `down` is a
//     destructive act performed on a database somebody is learning in.
//   · It will not rehearse against a database that holds learner data. The
//     rehearsal is the proof that this is reversible, and the only honest way to
//     prove it is to run the whole thing forwards, backwards and forwards again —
//     which must never happen on the database children's work lives in.
//
// COMMANDS
//
//   node scripts/migrate.mjs status     what is applied, what is pending, drift?
//   node scripts/migrate.mjs up         apply every pending migration, in order
//   node scripts/migrate.mjs down [n]   revert the last n (default 1), reverse order
//   node scripts/migrate.mjs rehearse   up → verify → down → up, on a scratch DB
//   node scripts/migrate.mjs verify     the schema's invariants, executed
//
// WHY THE INVARIANTS ARE EXECUTED. "Evidence is append-only" and "a re-sent event
// is a no-op" are the two claims the whole learning architecture rests on, and as
// prose they are worth nothing — the next writer can break either without
// noticing. `verify` appends a real event, re-sends it (must be refused), tries to
// edit it (must be refused), erases it (must succeed) and checks an unsafe learner
// id is rejected, all inside ONE TRANSACTION THAT IS ROLLED BACK, so the proof
// leaves no residue in the database it ran against.
//
// TRANSACTIONS. Each migration file runs inside its own transaction, so a
// migration that fails halfway leaves the schema exactly as it was — the failure
// is the failure, not a half-applied schema to reason about at 3am. This is also
// why no migration may use a statement PostgreSQL cannot run in a transaction (no
// `CREATE INDEX CONCURRENTLY`): the atomicity is worth more than the lock.
//
// Usage:
//   DATABASE_URL=postgres://… npm run db:migrate      # up
//   DATABASE_URL=postgres://… npm run db:status
//   DATABASE_URL=postgres://… npm run db:rehearse     # needs a scratch DB
//   DATABASE_URL=postgres://… npm run db:verify
//
// Without DATABASE_URL, `status` reports the deployment honestly as file-backed
// and exits 0 (so a gate is not failed for an unwired database), while every
// command that would ACT exits 2.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// `pg` is a dependency of THIS runner and, later, of the store. Required lazily so
// `status` without a database never needs the driver at all.
let pg = null;
function driver() {
  try {
    pg ??= require("pg");
  } catch (e) {
    fail(`the PostgreSQL driver is not installed (${e.message}). Run \`npm ci\`.`);
  }
  return pg;
}

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");
const LEDGER = "schema_migrations";
const COMMANDS = ["status", "up", "down", "rehearse", "verify"];

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const positional = argv.filter((a) => !a.startsWith("--"));
const command = positional[0] ?? "status";
const count = positional[1] === undefined ? 1 : Number(positional[1]);

const DATABASE_URL = process.env.DATABASE_URL ?? "";
// The environment's own name, so `down` can refuse the dangerous case without
// guessing from the URL. Anything not explicitly production may revert.
const ENV_NAME = process.env.OPENMIND_ENV ?? process.env.NODE_ENV ?? "development";
const IS_PRODUCTION = ENV_NAME === "production";

/**
 * Aborting WITHOUT `process.exit`.
 *
 * `process.exit` terminates before pending writes to a PIPE have been flushed, so
 * `migrate.mjs status --json > file` wrote an empty file while the same command
 * in a terminal printed its report — a bug that only shows up in the place it is
 * used from (a deploy script, production-check, CI) and never where it is
 * written. Throwing and letting the process end normally flushes everything and
 * still exits with the right code.
 */
class Exit extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function fail(message) {
  throw new Exit(2, message);
}
const say = (message) => console.log(`  ${message}`);

// Argument validation happens inside the guarded entry block below, not here:
// `fail` throws, and a throw at module scope becomes an uncaught rejection — a
// stack trace and exit 1 instead of the clean message and exit 2 this runner
// promises every other failure.

// ── The migration set, from disk, before anything is applied ────────────────
/**
 * Pairing and checksums are both decided here so a bad set fails with the schema
 * untouched. A missing `.down.sql` or a duplicate number is a property of the
 * FILES, and finding out halfway through applying is finding out too late.
 */
function discover() {
  if (!fs.existsSync(MIGRATIONS_DIR)) fail(`no migrations directory at ${MIGRATIONS_DIR}`);
  const byVersion = new Map();
  for (const file of fs.readdirSync(MIGRATIONS_DIR).sort()) {
    const m = file.match(/^(\d{4})_([a-z0-9_]+)\.(up|down)\.sql$/);
    if (!m) {
      // A stray file here is not harmless: it looks like a migration and is not
      // one. Refuse rather than silently ignoring it.
      fail(`unrecognised migration file ${JSON.stringify(file)} — expected NNNN_name.up.sql / NNNN_name.down.sql`);
    }
    const version = `${m[1]}_${m[2]}`;
    const entry = byVersion.get(version) ?? { version, number: Number(m[1]) };
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    entry[m[3]] = sql;
    entry[`${m[3]}_checksum`] = crypto.createHash("sha256").update(sql).digest("hex");
    byVersion.set(version, entry);
  }
  if (byVersion.size === 0) fail(`no migrations found in ${MIGRATIONS_DIR}`);

  const migrations = [...byVersion.values()].sort((a, b) => a.number - b.number);
  const seen = new Set();
  for (const m of migrations) {
    if (seen.has(m.number)) fail(`two migrations share number ${m.number} — migration order would be undefined`);
    seen.add(m.number);
    if (m.up === undefined) fail(`${m.version} has no .up.sql`);
    if (m.down === undefined) {
      fail(
        `${m.version} has no .down.sql. Every migration must be reversible or carry a documented ` +
        `recovery path — and the recovery path for a schema change IS the down file.`,
      );
    }
    // A down file that is only comments reverses nothing. Catch it here rather
    // than during an incident.
    if (!/^\s*(DROP|ALTER|DELETE|CREATE OR REPLACE|COMMENT)\b/im.test(m.down)) {
      fail(`${m.version}.down.sql contains no reversing statement`);
    }
  }
  return migrations;
}

// ── The ledger ──────────────────────────────────────────────────────────────
/**
 * The record of what has been applied, created on first use.
 *
 * It stores the checksum of BOTH directions, not just the up: a down file edited
 * after the fact is the same failure as an edited up file, one step further along.
 * `release` records the application version that ran the migration, which is what
 * makes "which build was live when this schema changed" answerable.
 */
const LEDGER_SQL = `
CREATE TABLE IF NOT EXISTS ${LEDGER} (
  version       text PRIMARY KEY,
  checksum      text NOT NULL,
  down_checksum text NOT NULL,
  applied_at    timestamptz NOT NULL DEFAULT now(),
  duration_ms   integer,
  release       text
)`;

async function open() {
  if (!DATABASE_URL) return null;
  const { Client } = driver();
  const db = new Client({ connectionString: DATABASE_URL });
  try {
    await db.connect();
  } catch (e) {
    fail(`cannot connect to the database (${e.message}). Is DATABASE_URL correct and the server reachable?`);
  }
  return db;
}

async function appliedRows(db) {
  await db.query(LEDGER_SQL);
  const { rows } = await db.query(
    `SELECT version, checksum, down_checksum, applied_at FROM ${LEDGER} ORDER BY version`,
  );
  return new Map(rows.map((r) => [r.version, r]));
}

/**
 * Has an already-applied migration been edited?
 *
 * This is the check that keeps staging and production the same database. An edited
 * migration's checksum no longer matches the file, and applying anything on top of
 * it would build on a schema that exists in no repository.
 */
function drift(migrations, applied) {
  const problems = [];
  for (const m of migrations) {
    const row = applied.get(m.version);
    if (!row) continue;
    if (row.checksum !== m.up_checksum) problems.push(`${m.version}: the up file changed after it was applied`);
    if (row.down_checksum !== m.down_checksum) problems.push(`${m.version}: the down file changed after it was applied`);
  }
  const known = new Set(migrations.map((m) => m.version));
  for (const version of applied.keys()) {
    if (!known.has(version)) problems.push(`${version}: recorded as applied, but no migration file exists`);
  }
  return problems;
}

/** The password is never printed, not even to a log a human is reading. */
function redact(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

// ── Commands ────────────────────────────────────────────────────────────────
async function status({ quiet = false } = {}) {
  const migrations = discover();
  if (!DATABASE_URL) {
    if (!quiet) {
      console.log("\n  DATABASE_URL is not set — this deployment is FILE-BACKED (lib/server/store.ts).");
      say("migrations: N/A — the store is a directory of JSON/JSONL files, not a database");
      say("to adopt the schema: set DATABASE_URL, then `npm run db:migrate` (docs/DEPLOYMENT.md §5)");
    }
    return { configured: false, applied: [], pending: migrations.map((m) => m.version), drift: [] };
  }
  const db = await open();
  try {
    const rows = await appliedRows(db);
    const problems = drift(migrations, rows);
    const pending = migrations.filter((m) => !rows.has(m.version)).map((m) => m.version);
    if (!quiet) {
      console.log(`\n  database: ${redact(DATABASE_URL)}  (${ENV_NAME})\n`);
      for (const m of migrations) {
        const row = rows.get(m.version);
        say(`${row ? "✓ applied" : "· pending"}  ${m.version}${row ? `  ${row.applied_at.toISOString()}` : ""}`);
      }
      console.log("");
    }
    // Drift goes to stderr so a caller reading stdout never has to parse prose,
    // and the human summary is suppressed under `--json` for the same reason.
    for (const p of problems) console.error(`  ✗ DRIFT ${p}`);
    if (!quiet) {
      if (!problems.length && pending.length) say(`${pending.length} migration(s) pending — run \`npm run db:migrate\``);
      if (!problems.length && !pending.length) say("schema is up to date");
    }
    return { configured: true, applied: [...rows.keys()], pending, drift: problems };
  } finally {
    await db.end();
  }
}

async function up() {
  const migrations = discover();
  if (!DATABASE_URL) fail("DATABASE_URL is not set — nothing to migrate. See docs/DEPLOYMENT.md §5.");
  const db = await open();
  try {
    const rows = await appliedRows(db);
    const problems = drift(migrations, rows);
    if (problems.length) {
      fail(
        `refusing to migrate on top of drifted history:\n      ${problems.join("\n      ")}\n` +
        `    An applied migration was edited. Add a NEW migration that corrects it.`,
      );
    }
    const pending = migrations.filter((m) => !rows.has(m.version));
    if (!pending.length) {
      say("schema is already up to date — nothing to apply");
      return 0;
    }
    for (const m of pending) {
      const started = Date.now();
      await db.query("BEGIN");
      try {
        await db.query(m.up);
        await db.query(
          `INSERT INTO ${LEDGER} (version, checksum, down_checksum, duration_ms, release) VALUES ($1,$2,$3,$4,$5)`,
          [m.version, m.up_checksum, m.down_checksum, Date.now() - started, process.env.OPENMIND_RELEASE ?? null],
        );
        await db.query("COMMIT");
      } catch (e) {
        await db.query("ROLLBACK").catch(() => {});
        fail(`${m.version} failed and was rolled back: ${e.message}`);
      }
      say(`✓ applied ${m.version} (${Date.now() - started}ms)`);
    }
    say(`${pending.length} migration(s) applied`);
    return pending.length;
  } finally {
    await db.end();
  }
}

async function down(steps = count) {
  const migrations = discover();
  if (!DATABASE_URL) fail("DATABASE_URL is not set — nothing to revert.");
  if (IS_PRODUCTION && !flags.has("--force")) {
    fail(
      "refusing to revert migrations in production. A down migration destroys data, and the recovery " +
      "path for production is the backup taken before the release (docs/DEPLOYMENT.md §4), not this " +
      "command. Pass --force only alongside a rehearsed restore.",
    );
  }
  const db = await open();
  try {
    const rows = await appliedRows(db);
    const toRevert = migrations.filter((m) => rows.has(m.version)).slice(-steps).reverse();
    if (!toRevert.length) {
      say("nothing applied — nothing to revert");
      return 0;
    }
    for (const m of toRevert) {
      const started = Date.now();
      await db.query("BEGIN");
      try {
        await db.query(m.down);
        await db.query(`DELETE FROM ${LEDGER} WHERE version = $1`, [m.version]);
        await db.query("COMMIT");
      } catch (e) {
        await db.query("ROLLBACK").catch(() => {});
        fail(`${m.version} could not be reverted and was rolled back: ${e.message}`);
      }
      say(`✓ reverted ${m.version} (${Date.now() - started}ms)`);
    }
    say(`${toRevert.length} migration(s) reverted`);
    return toRevert.length;
  } finally {
    await db.end();
  }
}

/**
 * The schema's own claims, executed, inside a transaction that is ROLLED BACK.
 *
 * SAVEPOINTS are load-bearing: two of the claims are that certain writes FAIL, and
 * PostgreSQL aborts the whole transaction after an error. A savepoint turns "this
 * must fail" into an assertion instead of a dead connection.
 */
async function verify({ quiet = false } = {}) {
  if (!DATABASE_URL) fail("DATABASE_URL is not set — nothing to verify. See docs/DEPLOYMENT.md §5.");
  const db = await open();
  const results = [];
  const check = (ok, name, detail = "") => {
    results.push({ ok, name });
    if (!quiet) console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  };
  const mustFail = async (name, sql, params) => {
    await db.query("SAVEPOINT probe");
    try {
      await db.query(sql, params);
      await db.query("ROLLBACK TO SAVEPOINT probe");
      check(false, name, "it was ACCEPTED");
    } catch {
      await db.query("ROLLBACK TO SAVEPOINT probe");
      check(true, name);
    }
  };
  const INSERT = `
    INSERT INTO evidence_events
      (id, learner_id, at, type, source, question_id, correct, chosen, mode, hints, ms, tags, schema_version, payload)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`;
  const eventValues = (overrides = {}) => {
    const e = {
      id: "verify_event_1",
      learner: "verify_learner_1",
      at: 1700000000000,
      type: "answer_submitted",
      source: "practice",
      questionId: "fractions:verify",
      correct: true,
      chosen: 0,
      mode: "independent",
      hints: 0,
      ms: 1200,
      tags: ["verify"],
      schemaVersion: 1,
      ...overrides,
    };
    return [
      e.id, e.learner, e.at, e.type, e.source, e.questionId, e.correct, e.chosen,
      e.mode, e.hints, e.ms, e.tags, e.schemaVersion, JSON.stringify({ ...e, payload: undefined }),
    ];
  };
  try {
    await db.query("BEGIN");
    await db.query(`INSERT INTO users (id, handle) VALUES ($1, 'verify_handle')`, ["verify_learner_1"]);
    check(true, "a learner account can be created");

    await db.query(INSERT, eventValues());
    check(true, "an event can be appended");

    // The idempotency rule the offline protocol depends on: a re-sent event is the
    // SAME event, not a second answer. Same id, so the only reason to refuse it is
    // the key that makes re-delivery a no-op.
    await mustFail("a re-sent event id is refused (idempotency)", INSERT, eventValues());

    // Append-only: correcting the past is an append, never an edit.
    await mustFail(
      "an event cannot be UPDATED (append-only)",
      `UPDATE evidence_events SET correct = false WHERE id = $1`,
      ["verify_event_1"],
    );

    // An id that could not be a safe storage key is refused — by the SCHEMA, not by
    // the caller remembering to check. Distinct id so this cannot pass merely
    // because the id was already taken.
    await mustFail(
      "an unsafe learner id is refused",
      INSERT,
      eventValues({ id: "verify_event_unsafe_id", learner: "../etc/passwd" }),
    );

    // ERASURE MUST STILL WORK — the deliberate exception to append-only, asserted
    // rather than assumed, because a guard that also blocks erasure turns a legal
    // obligation into a database error.
    await db.query("SAVEPOINT erase");
    const erased = await db.query(`DELETE FROM evidence_events WHERE learner_id = $1`, ["verify_learner_1"]);
    await db.query("ROLLBACK TO SAVEPOINT erase");
    check(erased.rowCount === 1, "an event can be DELETED for erasure", `${erased.rowCount} row(s)`);

    await db.query("ROLLBACK");
    if (!quiet) console.log("");
    return { ok: results.every((r) => r.ok), results };
  } catch (e) {
    await db.query("ROLLBACK").catch(() => {});
    fail(`schema verification could not run: ${e.message}`);
  } finally {
    await db.end();
  }
}

/**
 * THE REHEARSAL — up, verify, all the way down, and up again.
 *
 * This is the evidence that "every migration must be reversible" is true rather
 * than intended, and it is deliberately the DESTRUCTIVE version of that proof:
 * proving reversibility means actually reversing, on the database, and checking
 * the schema really came back.
 *
 * Which is why it refuses to run anywhere learner data lives. The guard is about
 * DATA, not about a name: an empty database is safe to rehearse on whatever it is
 * called, and a database holding a single learner is not, whatever it is called.
 */
async function rehearse() {
  const migrations = discover();
  if (!DATABASE_URL) fail("DATABASE_URL is not set — nothing to rehearse against. See docs/DEPLOYMENT.md §5.");
  if (IS_PRODUCTION) fail("refusing to rehearse against production: this command drops every table it creates.");

  // The guard, before anything is applied.
  const guard = await open();
  try {
    const present = await guard.query(
      `SELECT to_regclass('public.users') AS users, to_regclass('public.evidence_events') AS evidence`,
    );
    if (present.rows[0].users || present.rows[0].evidence) {
      await guard.query(LEDGER_SQL);
      const users = await guard.query(`SELECT count(*)::int AS n FROM users`);
      const events = await guard.query(`SELECT count(*)::int AS n FROM evidence_events`);
      const held = { users: users.rows[0].n, events: events.rows[0].n };
      if ((held.users > 0 || held.events > 0) && !flags.has("--force")) {
        fail(
          `refusing to rehearse on a database that holds learner data (${held.users} user(s), ${held.events} event(s)).\n` +
          `    A rehearsal drops everything it creates. Use a scratch database — CI does, see ` +
          `.github/workflows/ci.yml — or pass --force if this database is genuinely disposable.`,
        );
      }
    }
  } finally {
    await guard.end();
  }

  console.log("\n  rehearse: up → verify → down → up\n");
  const appliedCount = await up();

  const verified = await verify({ quiet: true });
  if (!verified.ok) {
    const failed = verified.results.filter((r) => !r.ok).map((r) => r.name);
    fail(`the schema's invariants failed (${failed.join("; ")}) — fix them before rehearsing, they are the news here`);
  }
  say("✓ the schema's invariants hold (append-only, idempotency, erasure)");

  // ALL the way down, not one step: a reversal that only works for the last
  // migration proves nothing about the ones underneath it.
  const total = appliedCount || migrations.length;
  await down(total);

  const after = await open();
  try {
    const leftover = await after.query(
      `SELECT to_regclass('public.users') AS users, to_regclass('public.evidence_events') AS evidence`,
    );
    const ledger = await after.query(`SELECT count(*)::int AS n FROM ${LEDGER}`);
    const gone = !leftover.rows[0].users && !leftover.rows[0].evidence;
    const cleanLedger = ledger.rows[0].n === 0;
    if (!gone) fail("the reversal left schema behind — a down migration is not undoing its up migration");
    if (!cleanLedger) fail("the reversal left applied-migration records behind — the ledger disagrees with the schema");
  } finally {
    await after.end();
  }
  say("✓ every table removed and the ledger cleared");

  await up();
  const finalStatus = await status({ quiet: true });
  if (finalStatus.pending.length || finalStatus.drift.length) {
    fail("the re-applied schema is not the schema the files describe");
  }
  say("✓ re-applied cleanly");

  console.log("\n  ────────────────────────────────────────────");
  console.log("  MIGRATION REHEARSAL: PASS — applied, verified, reversed and re-applied\n");
}

// ── Entry ───────────────────────────────────────────────────────────────────
// Every exit code is set through `process.exitCode` rather than `process.exit`,
// so the report is flushed before the process ends (see `Exit` above).
try {
  if (!COMMANDS.includes(command)) {
    fail(`unknown command ${JSON.stringify(command)} — expected one of ${COMMANDS.join(", ")}`);
  }
  if (command === "down" && (!Number.isInteger(count) || count < 1)) {
    fail(`down takes a positive number of migrations, got ${JSON.stringify(positional[1])}`);
  }
  if (command === "status") {
    // `--json` prints the report and NOTHING else, so a caller (production-check,
    // a deploy script, CI) can parse stdout without stripping a human table first.
    const result = await status({ quiet: flags.has("--json") });
    if (flags.has("--json")) console.log(JSON.stringify(result));
    process.exitCode = result.drift.length ? 1 : 0;
  } else if (command === "up") {
    await up();
  } else if (command === "down") {
    await down();
  } else if (command === "verify") {
    const result = await verify();
    process.exitCode = result.ok ? 0 : 1;
  } else if (command === "rehearse") {
    await rehearse();
  }
} catch (e) {
  if (e instanceof Exit) {
    console.error(`\n  ✗ ${e.message}\n`);
    process.exitCode = e.code;
  } else {
    // An unexpected error still exits non-zero, and still says what happened.
    console.error(`\n  ✗ ${e?.stack ?? e}\n`);
    process.exitCode = 2;
  }
}
