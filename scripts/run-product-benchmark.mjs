// ─────────────────────────────────────────────────────────────────────────────
// `npm run product-benchmark`, COMPLETED.
//
//   build production → start production → real HTTP path → benchmark → report
//
// The benchmark itself (scripts/product-superiority-benchmark.mjs) is the
// battery: ~100 journey checks across accounts, profile, the learning loop,
// evidence, offline parity, the teacher view, AI honesty, refusals, UX and the
// comparative gates. What it never had was a BUILD. It documented "requires a
// server on :4173" and hoped, so it drove whatever happened to be listening —
// and a battery that measures a different artefact from the one a learner is
// served is measuring an imaginary product.
//
// This runner removes the hope. It boots the real standalone build on a scratch
// store through scripts/production-server.mjs, points the battery at it with
// PRODUCT_BENCH_BASE, and tears everything down whichever way the run ends.
//
// Escape hatches, both deliberate:
//   PRODUCT_BENCH_BASE=…      skip the boot and bench an already-running server
//                             (the local loop: `npm run dev` in one terminal)
//   OPENMIND_BENCH_NO_BUILD=1 use the existing .next build instead of rebuilding
// ─────────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import { withProductionServer } from "./production-server.mjs";

const PORT = Number(process.env.OPENMIND_BENCH_PORT ?? 4198);
const EXTERNAL = process.env.PRODUCT_BENCH_BASE;

function runBattery(base) {
  console.log(`\n▸ Run the benchmark against ${base}`);
  const run = spawnSync(process.execPath, ["scripts/product-superiority-benchmark.mjs"], {
    stdio: "inherit",
    env: { ...process.env, PRODUCT_BENCH_BASE: base },
  });
  return run.status ?? 1;
}

let status;
if (EXTERNAL) {
  // An already-running server was named on purpose. Nothing is built and
  // nothing is started — and the battery's own report says which server it read
  // (`server` in .benchmark/latest.json), so a run against a dev server is
  // visible in the artefact rather than inferred.
  console.log(`▸ PRODUCT_BENCH_BASE set — benchmarking the server already at ${EXTERNAL}`);
  status = runBattery(EXTERNAL);
} else {
  status = await withProductionServer(
    { port: PORT, build: process.env.OPENMIND_BENCH_NO_BUILD !== "1", label: "bench" },
    async (base) => runBattery(base),
  );
}

console.log(`\n${status === 0 ? "✓" : "✗"} product benchmark ${status === 0 ? "passed" : "FAILED"} against the real build`);
process.exit(status);
