// ─────────────────────────────────────────────────────────────────────────────
// WORKTREE CHECKPOINT — a verified copy of uncommitted work, OUTSIDE the repo.
//
// A working tree with 116 uncommitted files is one `git checkout .` away from
// losing a week. This writes the tracked modifications, the untracked source
// files, the diff against HEAD and a HEAD bundle to a single archive outside the
// repository, then proves the archive by extracting it again and comparing every
// checksum in the manifest.
//
// It is NOT a commit: nothing is staged, no branch moves, no remote is touched.
//
// Deliberately excluded: node_modules, build caches, the learner store, and any
// file that looks like a credential (`.env*` except `.env.example`, `*.pem`,
// `*.key`, `*secret*`). A checkpoint is shared more easily than a repository.
//
//   npm run checkpoint:worktree
//   node scripts/checkpoint-worktree.mjs --out ~/openmind-backups/worktree-x
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] ?? null : null;
};

// ── VERIFY AN EXISTING ARCHIVE, READ-ONLY ──────────────────────────────────
// A checkpoint that can only be verified at the moment it is written is a
// promise, not a copy. This mode re-extracts an archive, recomputes every
// checksum from its own MANIFEST and reports the HEAD it was taken at. It
// touches nothing in the repository.
const verifyArchive = arg("--verify");
if (verifyArchive) {
  const archive = path.resolve(verifyArchive);
  if (!fs.existsSync(archive) || !archive.endsWith(".tar.gz")) {
    console.error(`REFUSED: ${archive} is not an existing .tar.gz checkpoint.`);
    process.exit(2);
  }
  const hashFile = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "openmind-checkpoint-verify-"));
  let verified = 0;
  const mismatches = [];
  try {
    execFileSync("tar", ["-xzf", archive, "-C", dir]);
    const head = fs.readFileSync(path.join(dir, "git-head.txt"), "utf8").trim().split("\n");
    for (const line of fs.readFileSync(path.join(dir, "MANIFEST.sha256"), "utf8").trim().split("\n")) {
      const [expected, rel] = line.split("  ");
      const file = path.join(dir, "files", rel);
      if (!fs.existsSync(file)) mismatches.push(`missing: ${rel}`);
      else if (hashFile(file) !== expected) mismatches.push(`checksum: ${rel}`);
      else verified += 1;
    }
    console.log("\nWORKTREE CHECKPOINT — RE-VERIFICATION");
    console.log(`  archive:     ${archive}`);
    console.log(`  sha256:      ${hashFile(archive)}`);
    console.log(`  HEAD:        ${head[0]} (${head[1] ?? "?"})`);
    console.log(`  files:       ${mismatches.length === 0 ? `${verified}/${verified} re-extracted and checksum-matched` : `${mismatches.length} MISMATCH(ES)`}`);
    for (const m of mismatches) console.log(`    ✗ ${m}`);
    console.log(`  live store:  not read`);
    if (mismatches.length > 0) process.exit(1);
    console.log("\n  The archive still verifies.\n");
    process.exit(0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outRoot = path.resolve(arg("--out") ?? path.join(os.homedir(), "openmind-backups", `worktree-${stamp}`));
const inside = (child, parent) => {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};
if (inside(outRoot, REPO)) {
  console.error(`REFUSED: ${outRoot} is inside the repository. A checkpoint must survive the repository.`);
  process.exit(2);
}
if (fs.existsSync(outRoot)) {
  console.error(`REFUSED: ${outRoot} already exists. Checkpoints are never overwritten.`);
  process.exit(2);
}

const git = (gitArgs, opts = {}) =>
  execFileSync("git", gitArgs, { cwd: REPO, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...opts });

const HEAD = git(["rev-parse", "HEAD"]).trim();
const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
const statusText = git(["status", "--porcelain=v1"]);
const statusZ = git(["status", "--porcelain=v1", "-z"]);

// ── Which paths belong in the checkpoint ───────────────────────────────────
const EXCLUDED_DIRS = [
  "node_modules", ".git", ".next", ".next-dev", ".next-prod", ".next-test", ".next-e2e",
  ".openmind-data", ".wrangler", ".verify", ".verify-tmp", ".static-build", ".benchmark",
  ".visual", ".visual-selftest-9knNNt", ".visual-selftest-SSgFCR", ".ui-preview",
  ".cloud-attachments", "dist", "screenshots",
];
const isExcluded = (rel) => {
  const parts = rel.split("/");
  if (parts.some((p) => EXCLUDED_DIRS.includes(p))) return true;
  const base = parts[parts.length - 1];
  if (base === ".env.example") return false;
  if (base === ".env" || base.startsWith(".env.")) return true;
  if (/\.(pem|key|p12|pfx)$/i.test(base)) return true;
  if (/secret/i.test(base) && !/\.(ts|tsx|mjs|js|md)$/i.test(base)) return true;
  return false;
};

const paths = new Set();
// -z output: `XY <path>\0` and for renames/copies `XY <new>\0<old>\0`.
const tokens = statusZ.split("\0").filter(Boolean);
for (let i = 0; i < tokens.length; i += 1) {
  const entry = tokens[i];
  const code = entry.slice(0, 2);
  const rel = entry.slice(3);
  if (code[0] === "R" || code[0] === "C") i += 1; // skip the original-path token
  if (!rel) continue;
  if (rel.endsWith("/")) {
    // An untracked directory: include the files inside it, not the directory.
    const walk = (current) => {
      for (const item of fs.readdirSync(path.join(REPO, current), { withFileTypes: true })) {
        const next = `${current}/${item.name}`;
        if (item.isDirectory()) walk(next);
        else paths.add(next);
      }
    };
    walk(rel.replace(/\/$/, ""));
  } else {
    paths.add(rel);
  }
}
const included = [...paths].filter((rel) => !isExcluded(rel) && fs.existsSync(path.join(REPO, rel))).sort();
const skipped = [...paths].filter((rel) => !included.includes(rel));

if (included.length === 0) {
  console.error("REFUSED: nothing to checkpoint (the working tree is clean, or every change is excluded).");
  process.exit(2);
}

// ── Stage, checksum, archive ───────────────────────────────────────────────
const stage = path.join(outRoot, "files");
fs.mkdirSync(stage, { recursive: true });
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const manifest = [];
for (const rel of included) {
  const from = path.join(REPO, rel);
  const to = path.join(stage, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  manifest.push(`${sha(to)}  ${rel}`);
}
fs.writeFileSync(path.join(outRoot, "MANIFEST.sha256"), `${manifest.join("\n")}\n`);
fs.writeFileSync(path.join(outRoot, "git-head.txt"), `${HEAD}\n${branch}\n`);
fs.writeFileSync(path.join(outRoot, "git-status.txt"), statusText);
fs.writeFileSync(path.join(outRoot, "git-diff.patch"), git(["diff", "HEAD", "--no-color", "--binary"]));
fs.writeFileSync(path.join(outRoot, "git-untracked.txt"), git(["ls-files", "--others", "--exclude-standard"]));
if (skipped.length > 0) fs.writeFileSync(path.join(outRoot, "excluded.txt"), `${skipped.join("\n")}\n`);

let bundle = false;
try {
  execFileSync("git", ["bundle", "create", path.join(outRoot, "repo-head.bundle"), "HEAD"], { cwd: REPO, stdio: "ignore" });
  bundle = true;
} catch {
  bundle = false;
}

fs.writeFileSync(
  path.join(outRoot, "RESTORE.md"),
  [
    "# Worktree checkpoint",
    "",
    `Created: ${new Date().toISOString()}`,
    `HEAD:    ${HEAD} (${branch})`,
    `Files:   ${included.length} changed/untracked paths`,
    "",
    "This is a copy of UNCOMMITTED work. Nothing was committed, staged or pushed.",
    "",
    "## Restore into a checkout at the same HEAD",
    "",
    "```bash",
    `git -C <repo> checkout ${HEAD}`,
    `tar -xzf ${path.basename(outRoot)}.tar.gz -C <repo> --strip-components=1 files`,
    "```",
    "",
    "## Verify",
    "",
    "```bash",
    "cd files && shasum -a 256 -c ../MANIFEST.sha256",
    "```",
    "",
    "`git-diff.patch` is the tracked change against HEAD; `git-untracked.txt` lists",
    "the files that had never been added. Excluded paths, when any, are in",
    "`excluded.txt` — build caches, the learner store and credential-shaped files.",
    "",
  ].join("\n"),
);

const archive = `${outRoot}.tar.gz`;
execFileSync("tar", ["-czf", archive, "-C", outRoot, "files", "MANIFEST.sha256", "git-head.txt", "git-status.txt", "git-diff.patch", "git-untracked.txt", "RESTORE.md", ...(bundle ? ["repo-head.bundle"] : []), ...(skipped.length ? ["excluded.txt"] : [])]);

// ── PROVE THE ARCHIVE, don't describe it ───────────────────────────────────
const verifyDir = fs.mkdtempSync(path.join(os.tmpdir(), "openmind-checkpoint-verify-"));
let verified = 0;
const mismatches = [];
try {
  execFileSync("tar", ["-xzf", archive, "-C", verifyDir]);
  for (const line of fs.readFileSync(path.join(outRoot, "MANIFEST.sha256"), "utf8").trim().split("\n")) {
    const [expected, rel] = line.split("  ");
    const file = path.join(verifyDir, "files", rel);
    if (!fs.existsSync(file)) mismatches.push(`missing: ${rel}`);
    else if (sha(file) !== expected) mismatches.push(`checksum: ${rel}`);
    else verified += 1;
  }
  const archived = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n").filter((l) => !l.endsWith("/")).length;
  if (archived < verified) mismatches.push(`archive lists ${archived} files but the manifest has ${verified}`);
} finally {
  fs.rmSync(verifyDir, { recursive: true, force: true });
}

const archiveSha = sha(archive);
const size = fs.statSync(archive).size;
console.log("\nWORKTREE CHECKPOINT");
console.log(`  HEAD:        ${HEAD} (${branch})`);
console.log(`  changed:     ${included.length} files copied, ${skipped.length} excluded`);
console.log(`  archive:     ${archive}`);
console.log(`  sha256:      ${archiveSha}`);
console.log(`  size:        ${(size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  HEAD bundle: ${bundle ? "included" : "not created"}`);
console.log(`  verification: ${mismatches.length === 0 ? `${verified}/${verified} files re-extracted and checksum-matched` : `${mismatches.length} MISMATCH(ES)`}`);
for (const m of mismatches) console.log(`    ✗ ${m}`);
console.log(`  provenance:  ${outRoot}/git-status.txt, git-diff.patch, MANIFEST.sha256`);
if (mismatches.length > 0) {
  console.error("\n  THE ARCHIVE DID NOT VERIFY. Do not treat this checkpoint as a copy.");
  process.exit(1);
}
console.log("\n  Nothing was committed, staged or pushed.\n");
