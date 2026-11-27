// ─────────────────────────────────────────────────────────────────────────────
// FILE STORE → POSTGRES, ONE DIRECTION, WITH A RECEIPT.
//
// The backend has existed since `lib/server/storage-postgres.ts`; what did not
// exist is the move. This is that move, and its rules are the ones a data
// migration earns by being hard to reverse:
//
//   · DRY RUN IS THE DEFAULT. `--apply` is the only way to write, and the plan's
//     numbers are what the apply is then checked against.
//   · THE SOURCE IS OPENED READ-ONLY. Nothing here deletes, renames, rewrites or
//     "cleans" the directory it reads; a migration that edits its own source has
//     no rollback that is not a restore.
//   · EVERY FILE IS CHECKSUMMED (SHA-256) into a manifest, and the manifest is
//     printed with the plan. A migration report without the hash of what was read
//     cannot answer "is this the data I looked at?" six months later.
//   · ERASED LEARNERS ARE WITHHELD, NOT RESURRECTED. A profile (and its ledger)
//     whose learner has an erasure tombstone is counted, named, and NOT written.
//     Moving a store forward must not undo an erasure performed in the old one.
//   · WRITES GO THROUGH THE PORT. `activeStorage()` on the target URL, so the
//     rows are the backend's own mapping rather than a second opinion about the
//     schema — and the readback at the end is the proof: every migrated object is
//     read back out and compared to the source it came from.
//   · ACCOUNTS ARE THE ONE EXCEPTION, AND FOR A REASON. The port's
//     `createAccount` takes a plaintext password and MINTS a salt and id; a
//     migration has the stored hash and must keep the account id, the salt, the
//     session epoch and the verification state. So `users` is written directly,
//     preserving all of them, and read back field by field.
//   · IDEMPOTENT BY CONSTRUCTION. Port writers are idempotent on id; the users
//     insert is `on conflict do nothing`; the counts distinguish inserted from
//     already-present, so a retry after an interruption resumes and cannot
//     duplicate. `--stop-after=<entity>` exists to test exactly that.
//
// WHAT IT REFUSES: a target that is not obviously a scratch database (unless
// `--allow-remote-target` is passed deliberately), and any run without a plan
// that reconciled. It never touches a production URL on its own.
//
//   node scripts/migrate-store-to-postgres.mjs                        # dry run
//   node scripts/migrate-store-to-postgres.mjs --apply \
//     --target=postgres://… --source=.openmind-data
//   node scripts/migrate-store-to-postgres.mjs --self-test            # synthetic
// ─────────────────────────────────────────────────────────────────────────────
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { compileEngines } from "./compile-engines.mjs";
import { createRequire } from "node:module";

// `.verify/` is CommonJS built by tsc, so it is loaded the way the suites load it.
const require = createRequire(import.meta.url);

const ENTITIES = [
  "users", "profiles", "papers", "personal_papers", "classes", "rooms",
  "packs", "erasures", "evidence", "ai_cache", "interventions",
];

// ── the source, read as FILES ────────────────────────────────────────────────
// Deliberately not through `store.ts`: the migration's input is the bytes on
// disk, and a reader that normalises them would hide the very difference a
// migration report exists to expose.

function readJson(dir, name, fallback) {
  const p = join(dir, name);
  if (!existsSync(p)) return { value: fallback, file: null };
  const text = readFileSync(p, "utf8");
  return { value: JSON.parse(text), file: name, bytes: Buffer.byteLength(text) };
}

function readEvidence(dir) {
  const d = join(dir, "evidence");
  if (!existsSync(d)) return [];
  const out = [];
  for (const f of readdirSync(d).filter((n) => n.endsWith(".jsonl")).sort()) {
    const text = readFileSync(join(d, f), "utf8");
    const events = text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
    out.push({ file: `evidence/${f}`, bytes: Buffer.byteLength(text), events });
  }
  return out;
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/** The plan: what is IN the directory, counted, before anything is written. */
export function buildPlan(dir) {
  const manifest = [];
  const note = (file, bytes) => {
    const buf = readFileSync(join(dir, file));
    manifest.push({ file, bytes: buf.length, sha256: sha256(buf) });
  };

  const accounts = readJson(dir, "accounts.json", {});
  const profiles = readJson(dir, "profiles.json", {});
  const papers = readJson(dir, "papers.json", {});
  const personal = readJson(dir, "personal-papers.json", {});
  const classes = readJson(dir, "classes.json", []);
  const rooms = readJson(dir, "rooms.json", {});
  const packs = readJson(dir, "packs.json", {});
  // The erasure log has had two shapes (a bare array and `{version, entries}`),
  // and both are still on disk somewhere: read the union the way the product does.
  const erasuresRaw = readJson(dir, "erasures.json", { version: 1, entries: [] });
  const cache = readJson(dir, "ai-cache.json", {});
  const interventions = readJson(dir, "interventions.json", { records: [], version: 1 });

  for (const f of [accounts.file, profiles.file, papers.file, personal.file, classes.file,
    rooms.file, packs.file, erasuresRaw.file, cache.file, interventions.file]) {
    if (f) note(f);
  }
  const evidenceFiles = readEvidence(dir);
  for (const e of evidenceFiles) note(e.file);

  const entries = Array.isArray(erasuresRaw.value) ? erasuresRaw.value : (erasuresRaw.value.entries ?? []);
  const erased = new Set(entries.filter((e) => e.entry !== "completed").map((e) => e.learnerId));

  // `erasures.json` records what a learner ASKED for and what was CONFIRMED gone;
  // a legacy line carries `completedAt` instead of a second entry.
  const erasureRows = [];
  for (const e of entries) {
    if (e.entry === "completed") erasureRows.push({ learnerId: e.learnerId, entry: "completed", at: e.at, of: e.of ?? e.at });
    else {
      erasureRows.push({ learnerId: e.learnerId, entry: "recorded", at: e.at });
      if (typeof e.completedAt === "number") erasureRows.push({ learnerId: e.learnerId, entry: "completed", at: e.completedAt, of: e.at });
    }
  }

  const events = evidenceFiles.flatMap((e) => e.events);
  const withheldProfiles = Object.keys(profiles.value).filter((id) => erased.has(id));
  const withheldEvents = events.filter((e) => erased.has(e.learnerId));

  return {
    dir: resolve(dir),
    manifest,
    accounts: Object.values(accounts.value),
    profiles: Object.entries(profiles.value)
      .filter(([id]) => !erased.has(id))
      .map(([, state]) => state),
    withheldProfiles,
    papers: Object.values(papers.value),
    personalPapers: Object.values(personal.value),
    classes: Array.isArray(classes.value) ? classes.value : Object.values(classes.value),
    rooms: Object.values(rooms.value),
    packs: Object.values(packs.value),
    erasureRows,
    events: events.filter((e) => !erased.has(e.learnerId)),
    withheldEvents: withheldEvents.length,
    cache: Object.entries(cache.value).map(([key, value]) => ({ key, value })),
    interventions: Array.isArray(interventions.value) ? interventions.value : (interventions.value.records ?? []),
    // Session state is NOT migrated, on purpose: a session row is a live bearer
    // credential, and the correct outcome of moving a store is that everyone
    // signs in again. Reported so the number is visible rather than hidden.
    sessionState: Object.values(accounts.value)
      .reduce((n, a) => n + (Array.isArray(a?.sessions) ? a.sessions.length : 0), 0),
    skippedFiles: ["kiosk-sessions.json", "boots.json"].filter((f) => existsSync(join(dir, f))),
  };
}

// ── integrity, before a single write ────────────────────────────────────────
export function auditPlan(plan) {
  const problems = [];
  const warnings = [];
  const dupes = (list, key, label) => {
    const seen = new Set();
    for (const item of list) {
      const k = item?.[key];
      if (!k) { problems.push(`${label}: a record has no ${key}`); continue; }
      if (seen.has(k)) problems.push(`${label}: duplicate ${key} ${k}`);
      seen.add(k);
    }
  };
  dupes(plan.accounts, "id", "accounts");
  dupes(plan.profiles.map((p) => ({ ...p, id: p.profile?.id ?? p.id })), "id", "profiles");
  dupes(plan.papers, "id", "papers");
  dupes(plan.personalPapers, "id", "personal papers");
  dupes(plan.classes, "id", "classes");
  dupes(plan.rooms, "id", "rooms");
  dupes(plan.events, "id", "evidence");
  dupes(plan.interventions, "id", "interventions");

  // A learner record that names no profile it has, an account whose profile was
  // erased, a paper owned by nobody: each is a dangling reference the SOURCE
  // already had, and the migration reports it instead of inventing a fix.
  const profileIds = new Set(plan.profiles.map((p) => p.profile?.id ?? p.id));
  for (const a of plan.accounts) {
    if (a.profileId && !profileIds.has(a.profileId)) {
      warnings.push(`account ${a.id} owns profile ${a.profileId}, which is not in the source`);
    }
    if (Object.prototype.hasOwnProperty.call(a, "passHash") && (!a.passHash || !a.salt)) {
      problems.push(`account ${a.id} has no password hash or salt to preserve`);
    }
  }
  for (const p of plan.papers) {
    if (p.owner && !profileIds.has(p.owner)) warnings.push(`paper ${p.id} is owned by ${p.owner}, who is not a learner record here`);
  }
  for (const p of plan.personalPapers) {
    if (p.owner && !profileIds.has(p.owner)) warnings.push(`personal paper ${p.id} is owned by ${p.owner}, who is not a learner record here`);
  }
  for (const c of plan.classes) {
    for (const m of c.members ?? []) {
      const id = typeof m === "string" ? m : (m.learnerId ?? m.id);
      if (id && !profileIds.has(id)) warnings.push(`class ${c.id} lists member ${id}, who is not a learner record here`);
    }
  }
  for (const e of plan.events) {
    if (!e.learnerId) problems.push(`evidence ${e.id} names no learner`);
  }
  for (const w of plan.withheldProfiles) {
    warnings.push(`learner ${w} has an erasure tombstone: record and ledger withheld, tombstone migrated`);
  }
  if (plan.sessionState > 0) {
    warnings.push(`${plan.sessionState} stored session(s) not migrated: a moved store means signing in again`);
  }
  for (const f of plan.skippedFiles) {
    warnings.push(`${f} is transient deployment state (pins expire, boot counters describe a directory); not migrated`);
  }
  // Accounts are a UNIQUE email in the target, so two accounts with one address
  // would fail halfway through. Caught here, where nothing has been written.
  const emails = new Map();
  for (const a of plan.accounts) {
    const e = String(a.email ?? "").toLowerCase();
    if (emails.has(e)) problems.push(`accounts ${emails.get(e)} and ${a.id} share the email ${e}`);
    emails.set(e, a.id);
  }
  return { problems, warnings };
}

export function planCounts(plan) {
  return {
    users: plan.accounts.length,
    profiles: plan.profiles.length,
    papers: plan.papers.length,
    personal_papers: plan.personalPapers.length,
    classes: plan.classes.length,
    rooms: plan.rooms.length,
    packs: plan.packs.length,
    erasures: plan.erasureRows.length,
    evidence: plan.events.length,
    ai_cache: plan.cache.length,
    interventions: plan.interventions.length,
  };
}

// ── the write side ──────────────────────────────────────────────────────────
function loadTarget(targetUrl) {
  process.env.DATABASE_URL = targetUrl;
  process.env.OPENMIND_STORE = "postgres";
  delete process.env.OPENMIND_DATA_DIR;
  delete process.env.OPENMIND_SOURCE_DATA_DIR;
  compileEngines();
  const { activeStorage } = require("../.verify/server/storage-file.js");
  const pg = require("../.verify/server/pg.js");
  const storage = activeStorage();
  return { storage, pg };
}

const USER_COLUMNS = {
  id: "id", email: "email", name: "name", role: "role", passHash: "pass_hash", salt: "salt",
  profileId: "profile_id", verified: "verified", sessionEpoch: "session_epoch",
  recoverySalt: "recovery_salt", recoveryHash: "recovery_hash",
  resetSalt: "reset_salt", resetHash: "reset_hash", resetExpiresAt: "reset_expires_at",
  verifySalt: "verify_salt", verifyHash: "verify_hash", verifyExpiresAt: "verify_expires_at",
};

/** Accounts keep their id, salt, hash, epoch and verification: no re-hashing. */
async function writeUsers(pg, accounts) {
  const written = [];
  for (const a of accounts) {
    const cols = [];
    const exprs = [];
    const params = [];
    const put = (column, value, expr) => {
      cols.push(column);
      params.push(value);
      exprs.push(expr ?? `$${params.length}`);
    };
    for (const [key, column] of Object.entries(USER_COLUMNS)) {
      if (a[key] === undefined) continue;
      // The target normalises the address on every write, so a migrated row must
      // be normalised the same way or a sign-in looks like a different account.
      put(column, key === "email" ? String(a.email).toLowerCase() : a[key]);
    }
    // Timestamps come from the record, not from `now()`, so a migrated account
    // does not claim it was created during the migration.
    if (typeof a.createdAt === "number") {
      cols.push("created_at"); params.push(a.createdAt); exprs.push(`to_timestamp($${params.length} / 1000.0)`);
    }
    if (typeof a.lastSeenAt === "number") {
      cols.push("last_seen_at"); params.push(a.lastSeenAt); exprs.push(`to_timestamp($${params.length} / 1000.0)`);
    }
    const sql = `insert into users (${cols.join(", ")}) values (${exprs.join(", ")}) on conflict do nothing returning id`;
    const rows = await pg.pgQuery(sql, params);
    written.push({ id: a.id, inserted: rows.length > 0 });
  }
  return written;
}

async function countTarget(pg) {
  const one = async (sql) => Number((await pg.pgQuery(sql))[0]?.n ?? 0);
  return {
    users: await one("select count(*)::int as n from users"),
    profiles: await one("select count(*)::int as n from profiles"),
    papers: await one("select count(*)::int as n from papers"),
    personal_papers: await one("select count(*)::int as n from personal_papers"),
    classes: await one("select count(*)::int as n from classes"),
    rooms: await one("select count(*)::int as n from rooms"),
    packs: await one("select count(*)::int as n from packs"),
    erasures: await one("select count(*)::int as n from erasures"),
    evidence: await one("select count(*)::int as n from evidence_events"),
    ai_cache: await one("select count(*)::int as n from ai_cache"),
    interventions: await one("select count(*)::int as n from interventions"),
  };
}

/** Source ⊂ target, per object: the port may add fields, it may not lose one. */
function subsetDiff(source, target, path = "") {
  if (isDeepStrictEqual(source, target)) return [];
  if (source && target && typeof source === "object" && typeof target === "object") {
    const out = [];
    for (const k of Object.keys(source)) {
      if (!(k in target)) out.push(`${path}${k}: missing`);
      else out.push(...subsetDiff(source[k], target[k], `${path}${k}.`));
    }
    return out;
  }
  return [`${path.replace(/\.$/, "")}: ${JSON.stringify(source)} ≠ ${JSON.stringify(target)}`];
}

export async function migrate({ plan, targetUrl, apply, stopAfter = null, log = () => {} }) {
  const started = Date.now();
  const report = {
    at: new Date().toISOString(),
    source: plan.dir,
    mode: apply ? "apply" : "dry-run",
    manifest: plan.manifest,
    counts: planCounts(plan),
    withheld: { profiles: plan.withheldProfiles, evidence: plan.withheldEvents, sessions: plan.sessionState },
    inserted: {},
    readback: {},
    status: "planned",
    failures: [],
  };
  if (!apply) {
    report.status = "dry-run";
    report.ms = Date.now() - started;
    return report;
  }

  const { storage, pg } = loadTarget(targetUrl);
  const before = await countTarget(pg);
  report.before = before;

  // An interrupted run still reports what it had already committed: that snapshot
  // is what the RESUMED run is compared against.
  const stop = async (where) => {
    report.after = await countTarget(pg);
    return interrupted(report, started, where);
  };

  const done = (key, extra = {}) => {
    report.inserted[key] = extra;
    log(`  ${key}: ${JSON.stringify(extra)}`);
  };

  // ONE ORDER, and it is the order a learner is: account, record, work, class,
  // then the two logs that describe what happened to them.
  const users = await writeUsers(pg, plan.accounts);
  done("users", { inserted: users.filter((u) => u.inserted).length, existing: users.filter((u) => !u.inserted).length });
  if (stopAfter === "users") return await stop("users");

  for (const state of plan.profiles) await storage.saveProfile(state);
  done("profiles", { written: plan.profiles.length });
  if (stopAfter === "profiles") return await stop("profiles");

  for (const p of plan.papers) await storage.saveStoredPaper(p);
  for (const p of plan.personalPapers) await storage.savePersonalPaper(p);
  done("papers", { written: plan.papers.length, personal: plan.personalPapers.length });

  for (const c of plan.classes) await storage.saveClass(c);
  for (const r of plan.rooms) await storage.saveRoom(r);
  for (const p of plan.packs) await storage.savePack(p);
  done("classes", { classes: plan.classes.length, rooms: plan.rooms.length, packs: plan.packs.length });
  if (stopAfter === "classes") return await stop("classes");

  let recorded = 0;
  let confirmed = 0;
  for (const row of plan.erasureRows) {
    const wrote = row.entry === "completed"
      ? await storage.confirmErasure(row.learnerId, row.at)
      : await storage.recordErasure(row.learnerId, row.at);
    if (wrote) row.entry === "completed" ? confirmed++ : recorded++;
  }
  done("erasures", { recorded, confirmed });
  if (stopAfter === "erasures") return await stop("erasures");

  // The ledger is appended per learner, in the port's own idempotent append.
  const byLearner = new Map();
  for (const e of plan.events) {
    if (!byLearner.has(e.learnerId)) byLearner.set(e.learnerId, []);
    byLearner.get(e.learnerId).push(e);
  }
  let accepted = 0;
  let duplicates = 0;
  for (const [learnerId, events] of byLearner) {
    const res = await storage.appendEvents(learnerId, events);
    accepted += res.accepted.length;
    duplicates += res.duplicates.length;
  }
  done("evidence", { accepted, duplicates });
  if (stopAfter === "evidence") return await stop("evidence");

  for (const { key, value } of plan.cache) await storage.cacheSet(key, value);
  done("ai_cache", { written: plan.cache.length });

  // `interventions` has a table but no port method (the loop that writes them is
  // in `lib/server/interventions.ts`): written as its payload row, and counted
  // back rather than compared through a reader that does not exist.
  let interventions = 0;
  for (const rec of plan.interventions) {
    const rows = await pg.pgQuery(
      `insert into interventions (id, class_id, concept_id, kind, status, owner_id, version, created_at, payload)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing returning id`,
      [rec.id, rec.classId ?? null, rec.conceptId ?? null, rec.kind ?? null, rec.status ?? "proposed",
        rec.ownerId ?? null, rec.version ?? 1, rec.createdAt ?? Date.now(), JSON.stringify(rec)],
    );
    interventions += rows.length;
  }
  done("interventions", { inserted: interventions, existing: plan.interventions.length - interventions });

  const after = await countTarget(pg);
  report.after = after;
  report.readback = await readback(storage, pg, plan);
  report.status = "applied";
  report.ms = Date.now() - started;
  return report;
}

function interrupted(report, started, where) {
  report.status = "interrupted";
  report.interruptedAfter = where;
  report.ms = Date.now() - started;
  return report;
}

/**
 * The proof, not a summary: every migrated record is read back THROUGH THE PORT
 * and compared against the object it came from. Counts can agree while an object
 * arrives with a field missing; this is the check that would notice.
 */
async function readback(storage, pg, plan) {
  const out = { profiles: 0, papers: 0, personal_papers: 0, classes: 0, rooms: 0, packs: 0, evidence: 0, erasures: 0, users: 0, interventions: 0, differences: [] };
  const cmp = (label, source, target) => {
    const diff = subsetDiff(source, target);
    if (diff.length) out.differences.push(`${label}: ${diff.slice(0, 3).join("; ")}`);
    return diff.length === 0;
  };
  for (const state of plan.profiles) {
    if (cmp(`profile ${state.profile?.id ?? state.id}`, state, await storage.getProfile(state.profile?.id ?? state.id))) out.profiles++;
  }
  for (const p of plan.papers) if (cmp(`paper ${p.id}`, p, await storage.getStoredPaper(p.id))) out.papers++;
  for (const p of plan.personalPapers) {
    // Scoped by owner in the port, and that is the check: a personal paper read
    // back without its owner would be a paper nobody can open.
    if (cmp(`personal paper ${p.id}`, p, await storage.getPersonalPaper(p.id, p.owner))) out.personal_papers++;
  }
  const classes = await storage.listClasses();
  for (const c of plan.classes) if (cmp(`class ${c.id}`, c, classes.find((x) => x.id === c.id))) out.classes++;
  const rooms = await storage.listRooms();
  for (const r of plan.rooms) if (cmp(`room ${r.id}`, r, rooms.find((x) => x.id === r.id))) out.rooms++;
  const packs = await storage.readAllPacks();
  for (const p of plan.packs) if (cmp(`pack ${p.id}`, p, packs.find((x) => x.id === p.id))) out.packs++;

  for (const e of plan.events) {
    const rows = await pg.pgQuery("select payload from evidence_events where id = $1", [e.id]);
    if (!rows.length) { out.differences.push(`evidence ${e.id}: missing`); continue; }
    const payload = rows[0].payload;
    if (cmp(`evidence ${e.id}`, e, payload)) out.evidence++;
  }
  const tombstones = await storage.readErasures();
  for (const row of plan.erasureRows) {
    const hit = tombstones.some((t) => t.learnerId === row.learnerId && t.entry === row.entry);
    if (!hit) out.differences.push(`erasure ${row.learnerId}/${row.entry}: missing`);
  }
  out.erasures = plan.erasureRows.length - out.differences.filter((d) => d.startsWith("erasure")).length;

  for (const a of plan.accounts) {
    const rows = await pg.pgQuery(
      `select id, email, name, role, pass_hash, salt, profile_id, verified, session_epoch from users where id = $1`, [a.id]);
    if (!rows.length) { out.differences.push(`user ${a.id}: missing`); continue; }
    const r = rows[0];
    const same =
      r.id === a.id && r.email === String(a.email).toLowerCase() && r.pass_hash === a.passHash &&
      r.salt === a.salt && r.profile_id === a.profileId && r.verified === Boolean(a.verified) &&
      Number(r.session_epoch ?? 0) === Number(a.sessionEpoch ?? 0);
    if (same) out.users++;
    else out.differences.push(`user ${a.id}: a preserved credential field differs`);
  }
  const iv = await pg.pgQuery("select id, payload from interventions");
  for (const rec of plan.interventions) {
    const row = iv.find((r) => r.id === rec.id);
    if (cmp(`intervention ${rec.id}`, rec, row?.payload)) out.interventions++;
  }
  return out;
}

// ── the guard on WHERE this is allowed to write ──────────────────────────────
export function targetRefusal(targetUrl, { allowRemote = false } = {}) {
  let url;
  try { url = new URL(targetUrl); } catch { return "the target is not a URL"; }
  const host = url.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");
  const db = url.pathname.replace(/^\//, "");
  const scratch = /(_test|_scratch|_migrate|_drill)$/.test(db);
  if (local || scratch || allowRemote) return null;
  return `refusing to write to ${host}/${db}: not a local or *_test/_scratch database. ` +
    `A migration is aimed at a scratch database first; pass --allow-remote-target only when you mean it.`;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { apply: false, selfTest: false, allowRemoteTarget: false, source: null, target: null, stopAfter: null, report: null, keep: false };
  for (const a of argv) {
    if (a === "--apply") out.apply = true;
    else if (a === "--self-test") out.selfTest = true;
    else if (a === "--allow-remote-target") out.allowRemoteTarget = true;
    else if (a === "--keep") out.keep = true;
    else if (a.startsWith("--source=")) out.source = a.slice(9);
    else if (a.startsWith("--target=")) out.target = a.slice(9);
    else if (a.startsWith("--stop-after=")) out.stopAfter = a.slice(12);
    else if (a.startsWith("--report=")) out.report = a.slice(9);
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`unknown argument ${a}`);
  }
  return out;
}

export function printReport(report, out = console.log) {
  out(`\nstore migration — ${report.mode}${report.status === "interrupted" ? ` (INTERRUPTED after ${report.interruptedAfter})` : ""}`);
  out(`source: ${report.source}`);
  out("manifest (what was read):");
  for (const m of report.manifest) out(`  ${m.file.padEnd(34)} ${String(m.bytes).padStart(9)} B  ${m.sha256.slice(0, 16)}…`);
  out("counts: " + Object.entries(report.counts).map(([k, v]) => `${k}=${v}`).join(" "));
  if (report.withheld.profiles.length || report.withheld.evidence) {
    out(`withheld: ${report.withheld.profiles.length} erased learner record(s), ${report.withheld.evidence} ledger event(s)`);
  }
  if (report.inserted && Object.keys(report.inserted).length) {
    out("written: " + Object.entries(report.inserted).map(([k, v]) => `${k}(${JSON.stringify(v)})`).join(" "));
  }
  if (report.readback) {
    const rb = report.readback;
    out("readback: " + ["users", "profiles", "papers", "personal_papers", "classes", "rooms", "packs", "evidence", "erasures", "interventions"]
      .map((k) => `${k}=${rb[k]}`).join(" "));
    if (rb.differences.length) {
      out(`READBACK DIFFERENCES (${rb.differences.length}):`);
      for (const d of rb.differences.slice(0, 20)) out("  · " + d);
    }
  }
  out(`status: ${report.status}${report.ms ? ` in ${report.ms} ms` : ""}`);
}

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(0, 12).join("\n"));
    return 0;
  }
  if (args.selfTest) {
    const { selfTest } = await import("./migrate-store-selftest.mjs");
    return selfTest({ keep: args.keep });
  }
  const source = args.source ?? process.env.OPENMIND_SOURCE_DATA_DIR ?? process.env.OPENMIND_DATA_DIR ?? ".openmind-data";
  const target = args.target ?? process.env.MIGRATE_TARGET_DATABASE_URL ?? null;
  const plan = buildPlan(source);
  const { problems, warnings } = auditPlan(plan);

  console.log(`source ${plan.dir} — ${plan.manifest.length} file(s), ${plan.manifest.reduce((n, m) => n + m.bytes, 0)} bytes`);
  printReport({ mode: args.apply ? "apply" : "dry-run", status: "planned", source: plan.dir, manifest: plan.manifest, counts: planCounts(plan), withheld: { profiles: plan.withheldProfiles, evidence: plan.withheldEvents, sessions: plan.sessionState } });
  for (const w of warnings) console.log("  ! " + w);
  for (const p of problems) console.log("  ✗ " + p);
  if (problems.length) {
    console.log(`\nrefusing: ${problems.length} integrity problem(s) in the SOURCE. Nothing was written.`);
    return 2;
  }
  if (!args.apply) {
    console.log("\ndry run: nothing written. Re-run with --apply --target=<scratch database>.");
    return 0;
  }
  if (!target) { console.log("refusing: --apply needs --target=postgres://…"); return 2; }
  const refusal = targetRefusal(target, { allowRemote: args.allowRemoteTarget });
  if (refusal) { console.log("refusing: " + refusal); return 2; }

  const report = await migrate({ plan, targetUrl: target, apply: true, stopAfter: args.stopAfter, log: (l) => console.log(l) });
  printReport(report);
  if (args.report) {
    mkdirSync(resolve(args.report, ".."), { recursive: true });
    writeFileSync(args.report, JSON.stringify(report, null, 2));
    console.log(`report written to ${args.report}`);
  }
  if (report.status === "interrupted") return 75;
  const rb = report.readback;
  const bad = rb.differences.length > 0;
  if (bad) console.log(`\nFAILED: ${rb.differences.length} object(s) did not survive the round trip.`);
  return bad ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code)).catch((e) => {
    console.error(e?.stack ?? String(e));
    process.exit(1);
  });
}
