// ─────────────────────────────────────────────────────────────────────────────
// THE LEGACY-ROSTER REPAIR, AS SOMETHING AN OPERATOR CAN RUN.
//
// A class roster written before member ids existed holds `students: { handle: … }`
// and nothing that says WHO those handles are. Reconciling it means matching names
// ONCE and writing the identity down — the alternative the product shipped was
// matching a name on every read, which let a stranger into a class.
//
// That reconciliation used to happen inside `listClasses`/`getClass`: every roster
// READ took the whole profile table, rewrote `classes.json`, and swallowed a write
// failure with `.catch(() => {})`. So a read mutated durable state, a read could not
// report the write it was making, and a repair that FAILED was invisible — a
// teacher's table quietly missing rows with no error anywhere (F-3 of
// docs/STORAGE_SPEC.md §13).
//
// It is now an explicit, idempotent operation, and this is its entry point: the
// class door still calls it (best-effort, because a read must not fail on a repair),
// and an operator who wants it DONE — rather than attempted on the next roster
// view — runs this.
//
//   OPENMIND_DATA_DIR=/data npm run data:repair-classes
//
// It repairs and reports. Two properties make it safe to run at any time, on any
// store: it binds a handle only when exactly ONE profile in the whole store carries
// it (an ambiguous handle is left unbound rather than handed to whichever profile
// the loop saw last), and a second run changes nothing.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);

// BEFORE ANY REQUIRE, and the same rule the suites follow: the store resolves
// DATA_DIR at module load, so the directory has to be settled first. Reported out
// loud, because a repair that ran against the wrong directory would be a silent
// edit to somebody's school.
const dir = process.env.OPENMIND_DATA_DIR
  ? path.resolve(process.env.OPENMIND_DATA_DIR)
  : path.join(process.cwd(), ".openmind-data");
process.env.OPENMIND_DATA_DIR = dir;

console.log(`\nOpenMind — repair class identities`);
console.log(`  store: ${dir}`);
if (!fs.existsSync(dir)) {
  console.log(`  nothing to repair: there is no store at that path (nothing was created).\n`);
  process.exit(0);
}

compileEngines();
const store = require("../.verify/server/store.js");

try {
  const before = await store.listClasses();
  const outcome = await store.reconcileClassIdentities();
  const after = await store.listClasses();
  // The repair binds identities; if it changed nothing, say so rather than
  // reporting work that did not happen.
  console.log(`  ${outcome.classes} class(es) read, ${outcome.repaired} repaired`);
  if (outcome.repaired === 0) {
    console.log(`  every roster already names its members by identity — nothing was written.\n`);
  } else {
    console.log(`  wrote ${after.length} roster(s) back, now identity-only.`);
    console.log(`  re-run to confirm it is idempotent: a second pass repairs 0.\n`);
    void before;
  }
  // A class that was NOT repaired because a handle is ambiguous is a real finding,
  // not a failure: two profiles sharing one name is the case the repair refuses to
  // guess about, and it will bind by itself once the name is unambiguous.
  const ambiguous = after.filter((c) => Object.keys(c.students ?? {}).some((h) => !c.membersById?.[h]));
  if (ambiguous.length) {
    console.log(`  ${ambiguous.length} class(es) still hold a row with no identity: ${ambiguous.map((c) => c.id).join(", ")}`);
    console.log(`  That is a name two profiles share — the repair will not guess which one a legacy row belonged to.\n`);
  }
  process.exit(0);
} catch (e) {
  console.error(`  FAILED: ${e?.message ?? e}`);
  console.error(`  A repair that could not be written is a failure, not a silent skip.\n`);
  process.exit(1);
}
