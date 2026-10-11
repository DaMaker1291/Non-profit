// ─────────────────────────────────────────────────────────────────────────────
// THE RESTORE DRILL, EXECUTED RATHER THAN DESCRIBED.
//
// `docs/OPERATIONS.md` §4 has always ended with the sentence that matters —
// "a backup you have never restored is only a hope" — and then a six-step
// procedure an operator had to perform by hand, under pressure, on staging, at
// a moment when they were probably already worried. This is those six steps as
// one command, in the order the runbook states them:
//
//   1. take a backup (or accept one with `--backup`)
//   2. verify its recorded hashes — restoring a corrupted archive proves nothing
//   3. restore into a FRESH directory and compare BYTE FOR BYTE with the archive
//   4. boot the artefact that would be deployed, pointed at the restored store
//   5. GET /api/ready → this instance can serve a learner
//   6. for each learner with a ledger: GET /api/evidence →
//        deepReconcile.differences == []  and  deepReconcile.unprojectable == null
//
// Step 6 is the OpenMind-specific proof, and the reason a generic "file copy
// test" is not enough here: it says the RESTORED LEDGER is sufficient to
// reconstruct that learner's model. If `differences` is non-empty the model is
// not a projection of its own evidence, and if `unprojectable` is non-null some
// of that learner's history predates the ledger — see DATA_GOVERNANCE.md.
//
// Honest limits, stated here rather than discovered later:
//   · it drills the ARTEFACT IN THIS CHECKOUT. A restore onto different hardware
//     still has to be rehearsed on that hardware once.
//   · with no ledger in the archive, step 6 has nothing to measure. That is
//     reported as UNTESTED, never as a pass: storage and readiness were proven,
//     the projection was not.
//   · it does not stop writes during the backup. `npm run backup` reports any
//     file that changed mid-copy, so this is visible rather than assumed.
//
// Usage:
//   node scripts/restore-drill.mjs [--backup DIR] [--data DIR] [--learners N]
//                                  [--port N] [--keep-temp]
//   OPENMIND_SKIP_BUILD=1 skips the production build (drills an artefact that
//   already exists — the same escape hatch verify:persistence has).
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { prepareStandalone, startStandalone, waitForReady } from "./production-server.mjs";
import { snapshotGenerated, restoreGenerated } from "./generated-files.mjs";

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const value = (name, fallback = null) => {
  const i = argv.indexOf(name);
  if (i < 0) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
};

let pass = 0;
let fail = 0;
const step = (line) => console.log(`\n▸ ${line}`);
const ok = (cond, what, detail = "") => {
  if (cond) pass++;
  else fail++;
  console.log(`  ${cond ? "✓" : "✗"} ${what}${detail ? ` — ${detail}` : ""}`);
};
const note = (what) => console.log(`  · ${what}`);
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const linesOf = (file) =>
  fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").filter((s) => s.trim() !== "").length : 0;

/** Run one of this repository's own scripts, so the drill exercises the real
 *  CLI (and its refusals) rather than a private copy of its logic. */
function runScript(args, { allowFail = false } = {}) {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (!allowFail && r.status !== 0) {
    console.error(out.trimEnd());
    throw new Error(`${args.join(" ")} exited ${r.status}`);
  }
  return { status: r.status, out };
}

async function main() {
  console.log("\nOpenMind — restore drill (docs/OPERATIONS.md §4)");
  console.log(`  port ${Number(process.env.OPENMIND_DRILL_PORT ?? value("--port", 4202))}`);

  // The production build rewrites tracked generated files; the drill puts them
  // back, so drilling a release cannot be the thing that dirties the tree.
  const snapshot = snapshotGenerated();

  let server = null;
  let scratch = null;
  const temps = [];
  try {
    // ── 1. The archive ──────────────────────────────────────────────────────
    step("1 · the archive");
    let archive = value("--backup", null);
    if (archive) {
      archive = path.resolve(String(archive));
      ok(fs.existsSync(archive), "the archive exists", archive);
      if (!fs.existsSync(archive)) throw new Error(`no backup at ${archive}`);
    } else {
      const dataDir = path.resolve(
        String(value("--data", process.env.OPENMIND_DATA_DIR ?? path.join(ROOT, ".openmind-data"))),
      );
      const dest = fs.mkdtempSync(path.join(os.tmpdir(), "om-drill-archive-"));
      temps.push(dest);
      const r = runScript(["scripts/backup-store.mjs", "--data", dataDir, "--dest", dest]);
      const made = fs.readdirSync(dest).filter((n) => n.startsWith("openmind-data-"));
      ok(made.length === 1, `a backup of the live store was taken (${made[0] ?? "none"})`, dataDir);
      archive = path.join(dest, made[0]);
    }

    // ── 2. Its recorded hashes ──────────────────────────────────────────────
    step("2 · the archive is the store it claims to be");
    const verify = runScript(["scripts/backup-store.mjs", "--verify", archive], { allowFail: true });
    ok(verify.status === 0, "every recorded file still hashes to its manifest value");
    if (verify.status !== 0) {
      console.error(verify.out.trimEnd());
      throw new Error("the archive failed verification — restoring it would prove nothing");
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(archive, "manifest.json"), "utf8"));
    note(`${manifest.fileCount} file(s), ${manifest.bytes} bytes, taken ${manifest.takenAt}`);

    // ── 3. Restore into a FRESH directory ───────────────────────────────────
    step("3 · restore into a fresh directory, byte for byte");
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), "om-drill-restore-"));
    temps.push(scratch);
    let copied = 0;
    let mismatched = 0;
    for (const rel of Object.keys(manifest.files)) {
      const from = path.join(archive, rel);
      const to = path.join(scratch, rel);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      copied++;
      if (sha256(to) !== manifest.files[rel]) mismatched++;
    }
    ok(copied === manifest.fileCount, `every recorded file was restored (${copied})`);
    ok(mismatched === 0, "and each of them is byte-identical to the archive", `${mismatched} mismatch(es)`);
    // The two manifest files are the ARCHIVE's paperwork, not the store's data:
    // dropping them is what makes the restored directory the store itself.
    for (const doc of ["manifest.json", "BACKUP-MANIFEST.txt"]) fs.rmSync(path.join(scratch, doc), { force: true });
    note(`restored into ${scratch} (the manifest's own files are not part of a store)`);

    // ── 4. Boot the artefact, pointed at the restored store ─────────────────
    step("4 · boot the artefact against the restored store");
    await prepareStandalone({ build: !process.env.OPENMIND_SKIP_BUILD });
    const port = Number(process.env.OPENMIND_DRILL_PORT ?? value("--port", 4202));
    server = startStandalone({ port, dataDir: scratch });
    const ready = await waitForReady(server, { quiet: true });
    ok(server.exited() === null, "the server is still running");

    // ── 5. Readiness ────────────────────────────────────────────────────────
    step("5 · readiness on the restored store");
    ok(!!ready && ready.ready === true, "GET /api/ready answers 200", ready ? `service=${ready.service} version=${ready.version}` : "never became ready");
    ok(ready?.checks?.data?.ok === true, "and the store it is serving is WRITABLE", ready?.checks?.data?.code);
    ok(ready?.checks?.config?.ok === true, "with well-formed configuration", ready?.checks?.config?.code);
    ok(ready?.checks?.content?.ok === true, "and the content graph loaded", ready?.checks?.content?.code);

    // ── 6. The OpenMind-specific proof ──────────────────────────────────────
    step("6 · the restored ledger still reconstructs each learner");
    const profilesPath = path.join(scratch, "profiles.json");
    const profiles = fs.existsSync(profilesPath) ? JSON.parse(fs.readFileSync(profilesPath, "utf8")) : {};
    const ids = Object.keys(profiles);
    ok(ids.length > 0, `the restored store holds ${ids.length} learner profile(s)`);

    const cap = Number(value("--learners", 3));
    const withLedger = ids.filter((id) => fs.existsSync(path.join(scratch, "evidence", `${id}.jsonl`)));
    if (withLedger.length === 0) {
      note(
        "UNTESTED — no learner in this archive has an evidence ledger, so step 6's proof (the model is a " +
          "projection of the restored ledger) had nothing to measure. Storage, the restore and readiness were proven; " +
          "the projection was NOT.",
      );
    } else {
      if (withLedger.length > cap) note(`checking the first ${cap} of ${withLedger.length} learner(s) with a ledger`);
      for (const id of withLedger.slice(0, cap)) {
        const secret = profiles[id]?.secret;
        if (!secret) {
          note(`${id} has a ledger but no capability secret — skipped (the route would answer 401, which proves nothing)`);
          continue;
        }
        const res = await fetch(`${server.base}/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`, {
          signal: AbortSignal.timeout(15_000),
        });
        const body = await res.json().catch(() => null);
        const onDisk = linesOf(path.join(scratch, "evidence", `${id}.jsonl`));
        ok(res.status === 200, `${id}: GET /api/evidence answers 200`, `status ${res.status}`);
        ok(body?.total === onDisk, `and it serves the ledger the RESTORE holds (${onDisk} event(s))`, `total ${body?.total}`);
        ok(body?.deepReconcile?.compared === true, "the read door reports a deep reconciliation");
        ok(
          Array.isArray(body?.deepReconcile?.differences) && body.deepReconcile.differences.length === 0,
          "and the model IS the restored ledger — zero divergences",
          `${body?.deepReconcile?.differences?.length ?? "?"} difference(s)`,
        );
        ok(
          body?.deepReconcile?.unprojectable === null,
          "with nothing in that history the ledger cannot rebuild",
          body?.deepReconcile?.unprojectable ? `${body.deepReconcile.unprojectable.attempts} answer(s) predate the ledger` : "",
        );
      }
    }

    console.log(`\n${"─".repeat(58)}`);
    console.log(`RESTORE DRILL: ${fail === 0 ? "PASS" : `FAIL (${fail} failed)`} — ${pass} passed, ${fail} failed`);
    console.log(fail === 0 ? "  the archive restores, the instance serves it, and its learners' records survive." : "");
    return fail;
  } finally {
    if (server) await server.stop().catch(() => {});
    if (!argv.includes("--keep-temp")) for (const t of temps) fs.rmSync(t, { recursive: true, force: true });
    else console.log(`  · kept: ${temps.join(", ")}`);
    const back = restoreGenerated(snapshot);
    if (!back.restoredAll) console.log(`  ✗ a generated file could not be restored: ${back.changed.join(", ") || "(unknown)"}`);
  }
}

main().then((code) => process.exit(code === 0 ? 0 : 1));
