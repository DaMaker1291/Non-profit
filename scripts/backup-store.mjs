// ─────────────────────────────────────────────────────────────────────────────
// BACK UP THE WHOLE DEPLOYMENT — one directory, hashed, off the machine.
//
// `docs/OPERATIONS.md` §4 says the same thing twice: the store IS the state
// (`profiles.json`, `accounts.json`, `classes.json`, `papers.json`, `rooms.json`,
// `packs.json`, `session-secret`, `evidence/*.jsonl`), and "a backup you have
// never restored is only a hope". The procedure was a `tar` an operator typed by
// hand, and the honesty page listed automation under **PROPOSED**. This is that
// procedure as an executable:
//
//   · the destination is OUTSIDE the repository, and the script REFUSES to write
//     a classroom into the source tree it is backing up, or into the store
//     itself (a backup inside the directory it copies grows on every run);
//   · every file is hashed as it is copied and compared against the source's own
//     hash, so "the backup is the store" is a measurement, and a store that was
//     being written mid-copy is REPORTED instead of discovered during a restore;
//   · a machine manifest (`manifest.json`) records those hashes, so
//     `--verify DIR` can re-check an archive months later, and a human
//     `BACKUP-MANIFEST.txt` records what an operator needs — including the one
//     fact worth stating exactly and never printing: whether the session secret
//     is present, never its value;
//   · `--keep N` prunes only backups THIS tool made (they have a manifest),
//     oldest first, so a hand-made archive sitting beside them is never deleted.
//
// What it deliberately does NOT do is stop writes. It cannot: an operator
// backing up a live school should know that each JSON file is written by
// temp-file rename (so no individual file is ever half-written) while a copy
// across many files can still catch different moments. `--verify` is how that is
// checked rather than assumed, and the drill (`npm run restore-drill`) is what
// proves the restored store still reconstructs a learner.
//
// `--max-age-days N` is the other half of a deletion policy, and the reason it
// exists here: `docs/DATA_GOVERNANCE.md` §7 answers "what about the copies?" with
// "a backup is not exempt from deletion forever, but it cannot be edited, so
// deletion is satisfied by expiry" — which is only true once something expires.
// An archive older than N days is destroyed, whatever `--keep` would have kept,
// and the erase-a-learner case is handled the other way round: the intent is
// re-applied on RESTORE (`lib/server/erasures.ts`), so a learner who asked to be
// forgotten does not come back out of an archive that predates them.
//
// Usage:
//   node scripts/backup-store.mjs [--data DIR] [--dest DIR] [--keep N] [--max-age-days N]
//   node scripts/backup-store.mjs --verify [DIR]     # no DIR → the latest here
//
// Exit: 0 ok · 1 verification failed · 2 refused (usage, unsafe destination)
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DEFAULT_DEST = path.join(os.homedir(), "openmind-backups");
/** The naming convention a timestamped backup directory must match. ISO-8601
 *  basic format in UTC (`20261011T113000Z`) — sortable as text, so "the latest
 *  backup" needs no metadata to answer. */
const STAMP_RE = /^openmind-data-\d{8}T\d{6}Z$/;

const argv = process.argv.slice(2);
const value = (name, fallback = null) => {
  const i = argv.indexOf(name);
  if (i < 0) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
};

const die = (msg, code = 2) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(code);
};
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

/** Every file under `dir`, relative, sorted — the unit a backup is a copy of. */
function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else if (e.isFile()) out.push(path.relative(base, full));
  }
  return out.sort();
}

const countOf = (dir, file, pick = (j) => Object.keys(j ?? {}).length) => {
  try {
    return pick(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
  } catch {
    return null; // absent or unreadable — reported as unknown, never as 0
  }
};

/** What is IN this store, counted by parse. Never a secret value — only whether
 *  the signing secret is present, which is the fact a restore depends on. */
function inventory(dir) {
  const ledgers = fs.existsSync(path.join(dir, "evidence"))
    ? fs.readdirSync(path.join(dir, "evidence")).filter((f) => f.endsWith(".jsonl"))
    : [];
  return {
    profiles: countOf(dir, "profiles.json"),
    accounts: countOf(dir, "accounts.json"),
    classes: countOf(dir, "classes.json", (j) => (Array.isArray(j) ? j.length : null)),
    rooms: countOf(dir, "rooms.json", (j) => (Array.isArray(j) ? j.length : null)),
    papers: countOf(dir, "papers.json"),
    personalPapers: countOf(dir, "personal-papers.json"),
    packs: countOf(dir, "packs.json"),
    evidenceLedgers: ledgers.length,
    sessionSecret: fs.existsSync(path.join(dir, "session-secret")),
  };
}

function gitHead() {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

// ── Verify: is this archive still the store it claims to be? ────────────────
function verify(dir) {
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    die(
      `no manifest.json in ${dir}.\n` +
        `  This is not a backup ${path.basename(process.argv[1])} made — a hand-made archive has no\n` +
        `  recorded hashes, so there is nothing to check it against. That is a fact about the\n` +
        `  archive, not a failure of it: verify it by restoring it (npm run restore-drill).`,
    );
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const problems = [];
  const listed = Object.entries(manifest.files ?? {});
  for (const [rel, expected] of listed) {
    const full = path.join(dir, rel);
    if (!fs.existsSync(full)) {
      problems.push(`missing: ${rel}`);
      continue;
    }
    const actual = sha256(full);
    if (actual !== expected) problems.push(`changed: ${rel}`);
  }
  // Extra files are information, not corruption: an operator may have dropped a
  // note beside the archive. Only the RECORDED files are asserted.
  const extra = walk(dir).filter(
    (rel) => rel !== "manifest.json" && rel !== "BACKUP-MANIFEST.txt" && !(rel in (manifest.files ?? {})),
  );

  console.log(`\nOpenMind — verify backup`);
  console.log(`  ${dir}`);
  console.log(`  taken ${manifest.takenAt} · ${listed.length} recorded file(s) · ${manifest.bytes} bytes\n`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  if (extra.length) console.log(`  · ${extra.length} file(s) present but not recorded by this manifest (not asserted)`);
  const ok = problems.length === 0;
  console.log(`\n${ok ? "✓" : "✗"} BACKUP VERIFY: ${ok ? "PASS" : `FAIL (${problems.length} file(s))`}`);
  process.exit(ok ? 0 : 1);
}

// ── Take a backup ───────────────────────────────────────────────────────────
function run() {
  const dataDir = path.resolve(
    String(value("--data", process.env.OPENMIND_DATA_DIR ?? path.join(ROOT, ".openmind-data"))),
  );
  const destRoot = path.resolve(String(value("--dest", DEFAULT_DEST)));
  const keep = Number(value("--keep", 7));

  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    die(`no data directory at ${dataDir}.\n  Point --data at the store, or set OPENMIND_DATA_DIR.`);
  }
  if (destRoot === dataDir || dataDir.startsWith(destRoot + path.sep)) {
    die(`${destRoot} contains the data directory it would copy — a backup inside its own source grows on every run.`);
  }
  if (destRoot === ROOT || destRoot.startsWith(ROOT + path.sep)) {
    die(
      `${destRoot} is inside the repository.\n` +
        `  A backup holds a classroom: profiles, evidence ledgers and the session secret.\n` +
        `  Keep it off the source tree (the default is ~/openmind-backups) so no commit can carry it.`,
    );
  }
  if (!Number.isFinite(keep) || keep < 1) die(`--keep must be a positive number, got ${value("--keep")}.`);
  const maxAgeDays = Number(value("--max-age-days", 0));
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0) {
    die(`--max-age-days must be zero (expiry off) or a positive number of days, got ${value("--max-age-days")}.`);
  }

  const stamp = `${new Date().toISOString().slice(0, 19).replace(/[-:]/g, "")}Z`;
  const out = path.join(destRoot, `openmind-data-${stamp}`);
  if (fs.existsSync(out)) {
    die(`${out} already exists — refusing to overwrite a backup. Two backups in one second are one too many.`);
  }

  const all = walk(dataDir);
  // `writeJson` writes `<file>.<pid>.<rand>.tmp` and renames it, so a `.tmp` is
  // an in-flight write, not data. Copying one would archive a half-written file
  // under a name no reader would ever look for.
  const files = all.filter((rel) => !rel.endsWith(".tmp"));
  const skippedTmp = all.length - files.length;

  console.log(`\nOpenMind — backup`);
  console.log(`  from ${dataDir}`);
  console.log(`  to   ${out}\n`);

  fs.mkdirSync(out, { recursive: true });
  const hashes = {};
  const drifted = [];
  let bytes = 0;
  for (const rel of files) {
    const src = path.join(dataDir, rel);
    const dst = path.join(out, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    const fromSrc = sha256(src);
    const copied = sha256(dst);
    hashes[rel] = copied;
    bytes += fs.statSync(dst).size;
    // A store being written WHILE it is copied: the file was whole at both reads
    // (temp-file rename guarantees that) but it moved between them, so this
    // archive holds a moment that is neither the before nor the after. Reported,
    // never hidden — it is the one honest limit of copying a live directory.
    if (fromSrc !== copied) drifted.push(rel);
  }

  const inv = inventory(out);
  const manifest = {
    tool: "scripts/backup-store.mjs",
    takenAt: new Date().toISOString(),
    source: dataDir,
    host: `${os.type()} ${os.release()} ${os.arch()}`,
    gitHead: gitHead(),
    method: "fs.copyFileSync, per-file sha256 compared against the source",
    files: hashes,
    fileCount: files.length,
    bytes,
    skippedTmp,
    counts: inv,
  };
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));

  const human = [
    "OpenMind .openmind-data backup",
    `taken (UTC):       ${manifest.takenAt}`,
    `source:            ${dataDir}`,
    `method:            ${manifest.method}`,
    `host:              ${manifest.host}`,
    `git HEAD at backup: ${manifest.gitHead ?? "(not a git checkout)"}`,
    "",
    "WHAT IS IN IT (counted by parse; no secret value is recorded)",
    `profiles           ${inv.profiles ?? "unknown"}`,
    `accounts           ${inv.accounts ?? "unknown"}`,
    `evidence ledgers   ${inv.evidenceLedgers} (evidence/*.jsonl files)`,
    `classes            ${inv.classes ?? "unknown"}`,
    `rooms              ${inv.rooms ?? "unknown"}`,
    `papers             ${inv.papers ?? "unknown"}`,
    `personal-papers    ${inv.personalPapers ?? "unknown"}`,
    `packs              ${inv.packs ?? "unknown"}`,
    `session-secret     ${inv.sessionSecret ? "present (auth cookies survive a restore only if this file does)" : "absent"}`,
    "",
    "FILES",
    `${files.length} file(s), ${bytes} bytes. Every hash is in manifest.json;`,
    "`node scripts/backup-store.mjs --verify <this directory>` re-checks them.",
    skippedTmp ? `${skippedTmp} in-flight .tmp file(s) were skipped (an unfinished write, not data).` : "",
    "",
    "RESTORING IT",
    "npm run restore-drill --backup <this directory>   # restores, boots and re-derives a learner",
    "docs/OPERATIONS.md §4 is the runbook this implements.",
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");
  fs.writeFileSync(path.join(out, "BACKUP-MANIFEST.txt"), human + "\n");

  console.log(`  ✓ copied ${files.length} file(s), ${bytes} bytes`);
  if (skippedTmp) console.log(`  · skipped ${skippedTmp} in-flight .tmp file(s)`);
  if (drifted.length) {
    console.log(`  ! ${drifted.length} file(s) CHANGED while being copied — this archive is a consistent`);
    console.log(`    copy of each file, but the store was being written during it: ${drifted.slice(0, 5).join(", ")}`);
  }

  // ── Retention: prune only archives this tool made ─────────────────────────
  // A hand-made directory has no manifest and is left alone, whatever its name —
  // it is somebody's archive, and this tool did not put it there.
  const ours = fs
    .readdirSync(destRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && STAMP_RE.test(e.name))
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(destRoot, name, "manifest.json")))
    .sort();
  // The timestamp is IN the name, so expiry needs no metadata and cannot be
  // fooled by a file's mtime (which a copy rewrites).
  const stampedAt = (name) => {
    const m = /^openmind-data-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(name);
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
  };
  const cutoff = maxAgeDays > 0 ? Date.now() - maxAgeDays * 86_400_000 : null;
  const aged = cutoff === null ? [] : ours.filter((n) => (stampedAt(n) ?? Date.now()) < cutoff);
  const unexpired = ours.filter((n) => !aged.includes(n));
  const overCount = unexpired.slice(0, Math.max(0, unexpired.length - keep));
  for (const name of aged) {
    fs.rmSync(path.join(destRoot, name), { recursive: true, force: true });
    console.log(`  · expired ${name} (older than --max-age-days ${maxAgeDays})`);
  }
  for (const name of overCount) {
    fs.rmSync(path.join(destRoot, name), { recursive: true, force: true });
    console.log(`  · pruned ${name} (--keep ${keep})`);
  }

  console.log(`\n✓ BACKUP: PASS — ${out}`);
  console.log(`  verify it now: node scripts/backup-store.mjs --verify ${out}`);
  console.log(`  restore it:    npm run restore-drill --backup ${out}\n`);
}

const verifyIdx = argv.indexOf("--verify");
if (verifyIdx >= 0) {
  const next = argv[verifyIdx + 1];
  const explicit = next && !next.startsWith("--") ? path.resolve(next) : null;
  if (explicit) verify(explicit);
  else {
    // No directory named: the latest archive in --dest. The stamp sorts as text,
    // which is the whole reason the name carries it.
    const destRoot = path.resolve(String(value("--dest", DEFAULT_DEST)));
    const latest = fs.existsSync(destRoot)
      ? fs
          .readdirSync(destRoot)
          .filter((n) => STAMP_RE.test(n))
          .sort()
          .pop()
      : null;
    if (!latest) die(`no backups in ${destRoot}. Pass a directory: --verify <dir>`);
    verify(path.join(destRoot, latest));
  }
} else {
  run();
}
