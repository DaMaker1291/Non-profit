// ─────────────────────────────────────────────────────────────────────────────
// THE JOURNEY, AGAINST THE ARTEFACT WE ACTUALLY SHIP.
//
//   npm run e2e:fresh
//
// The journey itself (scripts/e2e-fresh-learner.mjs) is only as good as the
// thing it drives. Run by hand, it drives whatever happens to be on :4173 —
// usually a dev server, compiled on the fly, with different module boundaries
// and none of the standalone server's asset layout. That is how a suite can be
// green while the shipped artefact is broken: it was measuring a build nobody
// deploys.
//
// The boot, the readiness wait, the scratch store and the teardown all live in
// scripts/production-server.mjs, shared with `npm run product-benchmark` so the
// two suites cannot drift into measuring different things.
// ─────────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import { withProductionServer } from "./production-server.mjs";

const PORT = Number(process.env.OPENMIND_E2E_PORT ?? 4199);
const EXTERNAL = process.env.OPENMIND_BASE;

function runJourney(base) {
  console.log(`\n▸ Run the fresh-learner journey against ${base}`);
  const run = spawnSync(process.execPath, ["scripts/e2e-fresh-learner.mjs"], {
    stdio: "inherit",
    env: { ...process.env, OPENMIND_BASE: base },
  });
  return run.status ?? 1;
}

let status;
if (EXTERNAL) {
  // An already-running server was named on purpose (CI starts the production
  // build once and points several gates at it). Nothing is built or started.
  status = runJourney(EXTERNAL);
} else {
  status = await withProductionServer({ port: PORT, build: true, label: "journey" }, async (base) => runJourney(base));
}

console.log(`\n${status === 0 ? "✓" : "✗"} production journey ${status === 0 ? "passed" : "FAILED"} against the real build`);
process.exit(status);
