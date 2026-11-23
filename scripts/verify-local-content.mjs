#!/usr/bin/env node
// ── THE SCHOOL-LOCAL MIRROR, EXPORTED AND SERVED FOR REAL ──────────────────
//
// The claims a school needs are narrower than "an offline platform": the folder
// must be complete, its files must match their checksums, it must not contain a
// learner record, an account or a teacher key, and the little server must be
// read-only. This script builds the folder into a scratch directory, verifies
// every hash from disk, starts the server on loopback, and makes those HTTP
// requests. It never touches the live store or the committed dist/ folder.
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const OUT = mkdtempSync(path.join(tmpdir(), "openmind-local-content-"));
const PORT = 18100 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
let passed = 0;
let failed = 0;
const check = (condition, label) => {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ FAIL: ${label}`); }
};
const section = (label) => console.log(`\n▸ ${label}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let server = null;
try {
  section("Export 135 authored lessons into a scratch mirror");
  const built = spawnSync(process.execPath, ["scripts/local-content-pack.mjs"], {
    cwd: ROOT,
    env: { ...process.env, OPENMIND_CONTENT_DIR: OUT, OPENMIND_CONTENT_VERSION: "verify-local-1" },
    encoding: "utf8",
  });
  check(built.status === 0, `the exporter exits 0 (${built.status})`);
  if (built.status !== 0) throw new Error((built.stderr || built.stdout || "exporter failed").slice(0, 1200));

  const manifest = JSON.parse(readFileSync(path.join(OUT, "manifest.json"), "utf8"));
  check(manifest.contract === "openmind.local-content/1.0", "the manifest names its contract");
  check(manifest.version === "verify-local-1", "the manifest carries the requested version");
  check(manifest.lessons === 135, `the mirror contains 135 lessons (${manifest.lessons})`);
  check(Object.values(manifest.subjects).reduce((n, value) => n + value, 0) === 135,
    "the subject counts add up to the lesson count");
  check(manifest.files.length >= 137, `the manifest lists every support and lesson file (${manifest.files.length})`);
  check(/checksum, not an authentication guarantee/i.test(manifest.note),
    "the manifest states the limit of a checksum");

  section("Every file matches its checksum, read back from disk");
  let bad = 0;
  for (const file of manifest.files) {
    const full = path.join(OUT, file.path);
    if (!statSync(full).isFile()) { bad++; continue; }
    const body = readFileSync(full);
    const sha = createHash("sha256").update(body).digest("hex");
    if (body.length !== file.bytes || sha !== file.sha256) bad++;
  }
  check(bad === 0, `all ${manifest.files.length} files match their byte count and SHA-256 (${bad} bad)`);
  const lessonFiles = readdirSync(path.join(OUT, "lessons")).filter((name) => name.endsWith(".json"));
  check(lessonFiles.length === 135, `135 lesson JSON files exist on disk (${lessonFiles.length})`);

  section("No learner record, account, teacher key or database is in the mirror");
  const names = walk(OUT).map((file) => path.relative(OUT, file));
  for (const forbidden of ["profiles.json", "accounts.json", "papers.json", "classes.json", "rooms.json", "erasures.json", "evidence"]) {
    check(!names.some((name) => name === forbidden || name.startsWith(forbidden + path.sep)),
      `the mirror has no ${forbidden}`);
  }
  const allText = names.filter((name) => /\.(json|txt|html)$/.test(name))
    .map((name) => readFileSync(path.join(OUT, name), "utf8")).join("\n");
  check(!/"secret"\s*:/.test(allText), "no lesson pack carries a learner secret field");
  check(!/"password"\s*:/.test(allText), "no lesson pack carries a password field");
  check(!/"modelAnswer"\s*:/.test(allText) && !/"marking"\s*:/.test(allText),
    "the mirror carries practice items, not the authored model-answer or marking key");
  check(!/Teacher answer key · not for pupils/i.test(allText), "no teacher key document is present");

  section("Serve the mirror over loopback and prove it is read-only");
  server = spawn(process.execPath, ["scripts/serve-local-content.mjs"], {
    cwd: ROOT,
    env: { ...process.env, OPENMIND_CONTENT_DIR: OUT, LOCAL_CONTENT_HOST: "127.0.0.1", LOCAL_CONTENT_PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/manifest.json`);
      if (r.ok) { ready = true; break; }
    } catch { /* not listening yet */ }
    await sleep(150);
  }
  check(ready, `the content server answers on ${BASE}`);
  if (!ready) throw new Error("local content server did not become ready");

  const index = await fetch(`${BASE}/`);
  check(index.status === 200 && /text\/html/.test(index.headers.get("content-type") ?? ""),
    "the index is served as HTML");
  check(index.headers.get("cache-control") === "no-store", "the server tells clients not to cache a stale version");
  const indexText = await index.text();
  check(indexText.includes("135 lessons") && indexText.includes("verify-local-1"),
    "the index states the lesson count and version");

  const lesson = await fetch(`${BASE}/lessons/fractions.json`);
  const lessonBody = await lesson.json();
  check(lesson.status === 200 && lessonBody.conceptId === "fractions",
    "a lesson file is served with the expected concept id");
  check(lessonBody.contract === "openmind.offline-pack/1.0", "the lesson uses the offline-pack contract");

  const head = await fetch(`${BASE}/manifest.json`, { method: "HEAD" });
  check(head.status === 200 && (await head.text()).length === 0, "HEAD returns headers without a body");
  const write = await fetch(`${BASE}/manifest.json`, { method: "POST", body: "{}" });
  check(write.status === 405 && write.headers.get("allow") === "GET, HEAD",
    "a write is refused with 405 and the allowed methods");
  const traversal = await fetch(`${BASE}/%2e%2e/package.json`);
  check(traversal.status === 404, "encoded path traversal is refused (404)");
  const missing = await fetch(`${BASE}/lessons/not-a-lesson.json`);
  check(missing.status === 404, "an unknown lesson is a 404");

  console.log(`\nlocal content: ${passed} passed, ${failed} failed`);
} finally {
  if (server) {
    try { server.kill("SIGTERM"); } catch { /* best effort */ }
    await sleep(150);
  }
  rmSync(OUT, { recursive: true, force: true });
}

if (failed) process.exit(1);
