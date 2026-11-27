// ─────────────────────────────────────────────────────────────────────────────
// DISCARD A SCRATCH STORE — and nothing else. Ever.
//
// This used to be a live-store cleaner: it pinned one profile id as "the real
// learner", deleted every other profile, every account whose profile was not the
// pin, every evidence ledger, and every class/room/paper it judged orphaned. It
// ran against real learner data, and on 2026-11-25 it removed 31 profiles — six
// of which predated the test incident it was cleaning up — and 21 evidence
// ledgers that it did not back up.
//
// The rule now is the one that should have been there from the start: a cleanup
// script deletes ONLY a directory a runner created, marked as scratch, outside
// the repository and outside the live store. It cannot reach learner data, so it
// cannot delete a record whose owner nobody can reconstruct.
//
// Changing the live store is not a cleanup task. It is an incident decision,
// made after `node scripts/reconcile-e2e-incident.mjs` has reconciled the store
// against its backup, with the preserved copy in hand.
//
//   node scripts/cleanup-e2e-store.mjs --list
//   node scripts/cleanup-e2e-store.mjs --confirm
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { checkScratchStore } from "./test-isolation.mjs";

const dir = process.env.OPENMIND_DATA_DIR;
if (!dir) {
  console.error(
    [
      "",
      "  REFUSED: OPENMIND_DATA_DIR is not set.",
      "",
      "  This script only discards a runner-created scratch store. It will not",
      "  touch the live store, and it has no way to guess which directory you meant.",
      "",
      "  For the live store, reconcile first:",
      "      node scripts/reconcile-e2e-incident.mjs --backup-dir <preserved backups>",
      "",
    ].join("\n"),
  );
  process.exit(2);
}

const store = checkScratchStore(dir);
if (!store.ok) {
  console.error(`\n  REFUSED (${store.code}): ${store.reason}\n`);
  console.error("  Nothing was deleted.\n");
  process.exit(2);
}

const files = [];
const walk = (current) => {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
};
walk(store.dataDir);
const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);

console.log(`scratch store: ${store.dataDir}`);
console.log(`run id:        ${store.marker.runId ?? "(unrecorded)"}`);
console.log(`created:       ${store.marker.createdAt ?? "(unrecorded)"}`);
console.log(`contents:      ${files.length} files, ${(bytes / 1024).toFixed(1)} KB`);
for (const file of files.slice(0, 20)) console.log(`  · ${path.relative(store.dataDir, file)}`);
if (files.length > 20) console.log(`  · … and ${files.length - 20} more`);

if (!process.argv.includes("--confirm")) {
  console.log("\nnothing deleted. Re-run with --confirm to discard this scratch store.");
  process.exit(0);
}

// Re-check immediately before the delete: the guard is cheap, and a path that
// stopped being a scratch store between the two calls must not be removed.
const again = checkScratchStore(store.dataDir);
if (!again.ok) {
  console.error(`\n  REFUSED on re-check (${again.code}): ${again.reason}\n`);
  process.exit(2);
}
fs.rmSync(store.dataDir, { recursive: true, force: true });
console.log(`\ndiscarded ${store.dataDir} (${files.length} files, ${(bytes / 1024).toFixed(1)} KB)`);
