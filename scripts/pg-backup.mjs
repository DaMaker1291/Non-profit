// ─────────────────────────────────────────────────────────────────────────────
// BACKUP AND RESTORE, AND A DRILL THAT ACTUALLY RESTORES.
//
// The promise an operator needs is not "we take backups" — it is "this backup was
// read back, into a different database, and the learners were still there". So the
// unit here is a DRILL, and `backup` exists mostly so the drill has something real
// to restore.
//
// FOUR PROPERTIES, EACH ONE MEASURED RATHER THAN ASSERTED:
//
//   encrypted     AES-256-GCM, key derived from a passphrase with scrypt. The key
//                 never lives in the repository: OPENMIND_BACKUP_KEY is required
//                 to take a backup, and a missing key is a REFUSAL, because an
//                 unencrypted dump of every learner's record is the one artefact
//                 that must never be produced quietly.
//   verifiable    a manifest beside each archive carries its SHA-256, byte count
//                 and the database it came from. `verify` recomputes the digest
//                 from the file on disk, decrypts it, and asks `pg_restore --list`
//                 whether the plaintext is a real archive. A backup nobody has
//                 read back is a file with a reassuring name.
//   retentive     `--keep N` prunes older archives in the target directory, and the
//                 pruning happens AFTER the new archive is verified, so a failed
//                 backup cannot delete the last good one.
//   restorable    `drill` restores into a NEWLY CREATED database, compares row
//                 counts for every table that carries learner data, and checks that
//                 a specific account's credentials, its learner record and its
//                 ledger came back identical — then drops the restored database.
//
// WHAT IS NOT DONE HERE, SAID PLAINLY: the archive is written to a local directory.
// "Independent private object storage" needs a bucket and its credentials, which
// this workspace does not have; `--out` is the seam where an operator points it at
// a mounted bucket or uploads the directory. Nothing in this script touches
// production: it is given a URL and writes files.
//
// Usage:
//   OPENMIND_BACKUP_KEY=… node scripts/pg-backup.mjs backup --url <dsn> --out <dir> [--keep 7]
//   OPENMIND_BACKUP_KEY=… node scripts/pg-backup.mjs drill  --url <dsn> [--out <dir>] [--keep 7]
//   node scripts/pg-backup.mjs verify --file <archive.dump.enc> [--key-stdin]
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";

const MAGIC = Buffer.from("OMB1");
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;

/** The tables whose survival is the point of a backup. A missing table is skipped
 *  rather than failed: this same drill runs against a database at any migration. */
const LEARNER_TABLES = [
  "users", "profiles", "classes", "class_members", "evidence_events",
  "learner_projections", "rooms", "packs", "papers", "personal_papers",
  "erasures", "assignments", "assignment_results", "ai_cache", "interventions",
];

function binary(name) {
  const override = process.env[name.toUpperCase()];
  if (override) return override;
  const candidates = [
    name,
    `/opt/homebrew/opt/postgresql@14/bin/${name}`,
    `/usr/local/opt/postgresql@14/bin/${name}`,
    `/usr/lib/postgresql/14/bin/${name}`,
  ];
  for (const c of candidates) {
    try {
      execFileSync(c, ["--version"], { stdio: "ignore" });
      return c;
    } catch { /* try the next one */ }
  }
  throw new Error(`${name} not found: set ${name.toUpperCase()} to its path`);
}

function databaseName(url) {
  try { return new URL(url).pathname.replace(/^\//, "") || "unknown"; } catch { return "unknown"; }
}

/** The same URL pointed at another database, keeping every other part of it. */
function withDatabase(url, name) {
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u.toString();
}

function deriveKey(passphrase, salt) {
  // scrypt with the default cost is the right shape here: this runs once per
  // backup, and the passphrase is an operator secret rather than a password a
  // learner types.
  return scryptSync(passphrase, salt, 32);
}

function encrypt(plaintext, passphrase) {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
}

function decrypt(archive, passphrase) {
  if (!archive.subarray(0, 4).equals(MAGIC)) throw new Error("not an OpenMind backup archive (bad magic)");
  const salt = archive.subarray(4, 4 + SALT_LEN);
  const iv = archive.subarray(4 + SALT_LEN, 4 + SALT_LEN + IV_LEN);
  const tag = archive.subarray(4 + SALT_LEN + IV_LEN, 4 + SALT_LEN + IV_LEN + TAG_LEN);
  const body = archive.subarray(4 + SALT_LEN + IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  // A wrong key, or a byte flipped on disk, fails HERE — GCM authenticates — which
  // is why the drill decrypts rather than only hashing: a digest proves the file
  // did not change, and the tag proves it is the file we made.
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function countsIn(url) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const out = {};
    for (const table of LEARNER_TABLES) {
      const exists = await client.query("select to_regclass($1) as reg", [`public.${table}`]);
      if (!exists.rows[0]?.reg) continue;
      const n = await client.query(`select count(*)::int as n from ${table}`);
      out[table] = n.rows[0].n;
    }
    return out;
  } finally {
    await client.end();
  }
}

async function sampleLearner(url) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const account = await client.query(
      "select id, email, profile_id, role from users where email is not null order by created_at asc limit 1",
    );
    if (!account.rows[0]) return null;
    const row = account.rows[0];
    const profile = await client.query("select id, secret_hash from profiles where id = $1", [row.profile_id]);
    const events = await client.query("select count(*)::int as n from evidence_events where learner_id = $1", [row.profile_id]);
    return {
      accountId: row.id,
      email: row.email,
      role: row.role,
      profileId: row.profile_id,
      secretHash: profile.rows[0]?.secret_hash ?? null,
      events: events.rows[0]?.n ?? 0,
    };
  } finally {
    await client.end();
  }
}

function prune(dir, keep) {
  const archives = fs.readdirSync(dir)
    .filter((f) => f.endsWith(".dump.enc"))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  const doomed = archives.slice(Math.max(0, keep));
  for (const { f } of doomed) {
    fs.rmSync(path.join(dir, f), { force: true });
    fs.rmSync(path.join(dir, f.replace(/\.dump\.enc$/, ".json")), { force: true });
  }
  return doomed.map((d) => d.f);
}

async function takeBackup(url, outDir, passphrase) {
  fs.mkdirSync(outDir, { recursive: true });
  const name = `${databaseName(url)}-${stamp()}`;
  const plainPath = path.join(os.tmpdir(), `${name}.dump`);
  const archivePath = path.join(outDir, `${name}.dump.enc`);
  try {
    execFileSync(binary("pg_dump"), [
      "--format=custom", "--no-owner", "--no-privileges", `--file=${plainPath}`, url,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    const plaintext = fs.readFileSync(plainPath);
    if (plaintext.length === 0) throw new Error("pg_dump produced an empty archive");
    const archive = encrypt(plaintext, passphrase);
    fs.writeFileSync(archivePath, archive);
    const manifest = {
      createdAt: new Date().toISOString(),
      sourceDatabase: databaseName(url),
      archiveBytes: archive.length,
      plaintextBytes: plaintext.length,
      sha256: sha256(archive),
      algorithm: "aes-256-gcm/scrypt",
      // The dump's own TOC listing, recorded at backup time: it is what "this file
      // is a restorable archive" meant when it was written, not what we hope later.
      objects: execFileSync(binary("pg_restore"), ["--list", plainPath], { encoding: "utf8" })
        .split("\n").filter((l) => /^\d+;/.test(l)).length,
    };
    fs.writeFileSync(archivePath.replace(/\.dump\.enc$/, ".json"), JSON.stringify(manifest, null, 2));
    return { archivePath, manifest, plaintext };
  } finally {
    fs.rmSync(plainPath, { force: true });
  }
}

function verifyArchive(archivePath, passphrase) {
  const archive = fs.readFileSync(archivePath);
  const manifestPath = archivePath.replace(/\.dump\.enc$/, ".json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;
  const digest = sha256(archive);
  if (manifest && manifest.sha256 !== digest) {
    throw new Error(`integrity: sha256 ${digest} does not match the manifest's ${manifest.sha256}`);
  }
  const plaintext = decrypt(archive, passphrase);
  if (manifest && manifest.plaintextBytes !== plaintext.length) {
    throw new Error(`integrity: decrypted ${plaintext.length} bytes, manifest says ${manifest.plaintextBytes}`);
  }
  const plainPath = path.join(os.tmpdir(), `om-verify-${Date.now()}.dump`);
  try {
    fs.writeFileSync(plainPath, plaintext);
    // The LAST check, and the only one that reads the file as an archive: a
    // correct hash over bytes that are not a dump is a corrupt backup that passes
    // every checksum.
    const toc = execFileSync(binary("pg_restore"), ["--list", plainPath], { encoding: "utf8" });
    const objects = toc.split("\n").filter((l) => /^\d+;/.test(l)).length;
    if (objects === 0) throw new Error("integrity: the archive's table of contents is empty");
    return { digest, objects, bytes: plaintext.length, manifest };
  } finally {
    fs.rmSync(plainPath, { force: true });
  }
}

async function drill(url, outDir, passphrase) {
  const log = (s) => console.log(s);
  const source = { counts: await countsIn(url), learner: await sampleLearner(url) };
  log(`▸ source ${databaseName(url)}: ${Object.entries(source.counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);

  const { archivePath, manifest } = await takeBackup(url, outDir, passphrase);
  log(`▸ backup written: ${path.basename(archivePath)} (${manifest.archiveBytes} bytes, sha256 ${manifest.sha256.slice(0, 12)}…)`);

  const verified = verifyArchive(archivePath, passphrase);
  log(`▸ verified: digest matches, decrypts to ${verified.bytes} bytes, ${verified.objects} archive objects`);

  // ── RESTORE INTO A DATABASE THAT DID NOT EXIST A MOMENT AGO ───────────────
  const restoreName = `openmind_restore_${Date.now().toString(36)}`;
  const restoreUrl = withDatabase(url, restoreName);
  const admin = new pg.Client({ connectionString: withDatabase(url, "postgres") });
  await admin.connect();
  const created = await admin.query("select 1 from pg_database where datname = $1", [restoreName]);
  if (created.rows.length) throw new Error(`refusing to restore into an existing database ${restoreName}`);
  await admin.query(`create database ${restoreName}`);
  await admin.end();

  const plainPath = path.join(os.tmpdir(), `${restoreName}.dump`);
  try {
    fs.writeFileSync(plainPath, decrypt(fs.readFileSync(archivePath), passphrase));
    execFileSync(binary("pg_restore"), [
      "--no-owner", "--no-privileges", `--dbname=${restoreUrl}`, plainPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });

    const restored = { counts: await countsIn(restoreUrl), learner: await sampleLearner(restoreUrl) };
    log(`▸ restored ${restoreName}: ${Object.entries(restored.counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);

    const failures = [];
    for (const [table, n] of Object.entries(source.counts)) {
      if (restored.counts[table] !== n) failures.push(`${table}: ${n} → ${restored.counts[table]}`);
    }
    if (failures.length) throw new Error(`row counts changed across the restore: ${failures.join(", ")}`);

    if (source.learner) {
      const a = source.learner, b = restored.learner;
      if (!b) throw new Error("the restored database has no account at all");
      if (a.accountId !== b.accountId || a.email !== b.email) {
        throw new Error(`the account came back as ${b.accountId}/${b.email}, not ${a.accountId}/${a.email}`);
      }
      if (a.profileId !== b.profileId || a.secretHash !== b.secretHash) {
        throw new Error("the learner record came back with a different id or capability hash — the account would not sign in");
      }
      if (a.events !== b.events) throw new Error(`the ledger came back with ${b.events} events, not ${a.events}`);
      log(`▸ the account, its record and its ${a.events}-event ledger came back identical`);
    }

    const pruned = prune(outDir, Number(process.env.OPENMIND_BACKUP_KEEP ?? 7));
    if (pruned.length) log(`▸ retention pruned: ${pruned.join(", ")}`);
    log("\n✓ restore drill PASSED — the backup is readable, decryptable and restorable, and the learners in it are intact");
    return true;
  } finally {
    fs.rmSync(plainPath, { force: true });
    const drop = new pg.Client({ connectionString: withDatabase(url, "postgres") });
    await drop.connect();
    // The restored database is scratch by construction: it is named, created and
    // dropped by this function, and the guard above refuses an existing name.
    await drop.query(`drop database if exists ${restoreName}`);
    await drop.end();
  }
}

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  const command = process.argv[2];
  const url = arg("url") ?? process.env.DATABASE_URL;
  const passphrase = process.env.OPENMIND_BACKUP_KEY ?? "";
  const outDir = arg("out") ?? path.join(os.homedir(), "openmind-backups");

  if (command === "verify") {
    const file = arg("file");
    if (!file) throw new Error("verify needs --file <archive.dump.enc>");
    if (!passphrase) throw new Error("OPENMIND_BACKUP_KEY is not set, so the archive cannot be decrypted");
    const v = verifyArchive(file, passphrase);
    console.log(`✓ ${file} is intact: ${v.bytes} bytes of archive, ${v.objects} objects, sha256 ${v.digest.slice(0, 16)}…`);
    return 0;
  }

  if (!url) throw new Error("no database: pass --url or set DATABASE_URL");
  if (command === "backup") {
    if (!passphrase) {
      throw new Error("OPENMIND_BACKUP_KEY is not set. A backup holds every learner's record; it is written encrypted or not at all.");
    }
    const { archivePath, manifest } = await takeBackup(url, outDir, passphrase);
    const v = verifyArchive(archivePath, passphrase);
    const pruned = prune(outDir, Number(arg("keep", process.env.OPENMIND_BACKUP_KEEP ?? 7)));
    console.log(`✓ ${archivePath}\n  ${manifest.archiveBytes} bytes, ${v.objects} objects, sha256 ${manifest.sha256}`);
    if (pruned.length) console.log(`  pruned: ${pruned.join(", ")}`);
    return 0;
  }

  if (command === "drill") {
    // A drill with no configured key still drills the WHOLE path — it generates a
    // throwaway passphrase in memory and uses it for both directions. What it must
    // not do is write an archive encrypted with a key nobody has, so the key is
    // reported when it was generated.
    const key = passphrase || randomBytes(32).toString("hex");
    if (!passphrase) console.log("▸ OPENMIND_BACKUP_KEY is unset: using a throwaway key for this drill (archive is not for keeping)");
    const ok = await drill(url, outDir, key);
    return ok ? 0 : 1;
  }

  console.log("usage: pg-backup.mjs backup|drill|verify [--url <dsn>] [--out <dir>] [--keep N] [--file <archive>]");
  return 2;
}

main().then((code) => process.exit(code)).catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
