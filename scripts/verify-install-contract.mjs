// ─────────────────────────────────────────────────────────────────────────────
// THE DOCUMENTED INSTALL CONTRACT, DRIVEN THROUGH THE ARTEFACT WE SHIP.
//
// WHY THIS EXISTS. The audit of 16 Oct 2026 found a P0 in the docs, not in the
// code: the README's non-Docker path was `npm ci && npm run build && npm start`
// and configuration was described as "all optional". `next start` runs the
// production artefact with `NODE_ENV=production`, so an undeclared data directory
// is `data_dir_undeclared` — a BLOCKING code in `lib/env.ts` — which means the
// site RENDERS, the diagnostic OPENS, and every learner-record write answers 503.
// The other two documented paths (`docker compose up -d`, `./start-openmind.sh`)
// set the variable from the artefact itself, which is exactly why the defect
// survived: the author never met it.
//
// The documents are fixed. This file is what keeps them fixed, and it is the
// half a docs-only fix cannot provide: it boots the REAL standalone artefact in
// each state and asserts what it does, so "the documented command is configured"
// is a measurement rather than a reading of a code block.
//
// THE THREE STATES ARE THE POINT — they are what the deployment may be, and the
// fix must not have collapsed them into one:
//
//   configured  a declared store on a host that keeps it            → writes accepted
//   unproven    a host that discards its filesystem, nothing said   → writes REFUSED
//   declared    the same host, with a disk declared durable, or
//               ephemerality accepted in so many words              → the report decides
//
// For the last two the assertion is deliberately NOT "200" or "503": it is that
// the deployment's own `/api/ready` report and the store's behaviour AGREE, and
// that the store holds the learner record exactly when it says it may. That is
// the invariant a learner actually experiences; a test that hard-coded 200 would
// be asserting this machine's mount table rather than the contract.
//
// WHAT A GREEN RUN PROVES, AND WHAT IT DOES NOT. It proves readiness and write
// behaviour on THIS host, through the artefact that would be deployed, with the
// environment the documented command produces. It does NOT prove that the store
// survives a container replacement: no statistic a running process can take
// answers that, which is why the claim has to be DECLARED and its evidence is the
// restart drill (`npm run verify:persistence -- --write`, replace the instance,
// `--verify`). A local process restart is not that drill either — it is the same
// filesystem, still there.
//
//   node scripts/verify-install-contract.mjs            # build if needed, then drive
//   OPENMIND_SKIP_BUILD=1 …                             # drive an existing build
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepareStandalone, startStandalone } from "./production-server.mjs";
import { measureHeadroom, headroomSentence } from "./disk-headroom.mjs";

const PORT = Number(process.env.OPENMIND_INSTALL_PORT ?? 4204);
const SKIP_BUILD = process.env.OPENMIND_SKIP_BUILD === "1";
const WAIT_MS = Number(process.env.OPENMIND_INSTALL_WAIT_MS ?? 90_000);

let pass = 0;
const failures = [];
const ok = (cond, name, detail = "") => {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};
const group = (n) => console.log(`\n${n}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** The two codes that mean "this store is not proven", in the order lib/env.ts
 *  prefers them: a filesystem MEASURED to be the host's own, or one nothing
 *  could establish. Either way the answer is the same, and which one it is is
 *  the report's business, not this test's. */
const UNPROVEN_CODES = ["data_dir_not_durable", "durability_unknown"];

/**
 * Wait for the server to ANSWER its readiness door at all.
 *
 * Not `waitForReady` from `production-server.mjs`, deliberately: that helper
 * returns only on HTTP 200 and treats a 503 as "not up yet", which is right for a
 * suite that must never measure a half-configured server and exactly wrong here —
 * the 503 IS the subject. A refusal is a successful answer to this question.
 */
async function firstReadyAnswer(base) {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(3000) });
      return { status: res.status, body: await res.json().catch(() => null) };
    } catch {
      /* not listening yet */
    }
    await sleep(400);
  }
  return null;
}

async function probe(state) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), `om-install-${state.id}-`));
  const headline =
    state.id === "configured"
      ? "a declared store, on a host that keeps it (the documented command's environment)"
      : state.label;
  console.log(`\n▸ ${state.id}: ${headline}`);
  console.log(`  env: ${["NODE_ENV=production", "OPENMIND_DATA_DIR=<scratch>", ...Object.entries(state.env).map(([k, v]) => `${k}=${v}`)].join(" ")}`);

  const server = startStandalone({ port: PORT, dataDir, prefix: `  [${state.id}] `, extraEnv: state.env });
  try {
    const ready = await firstReadyAnswer(server.base);
    if (!ready) {
      ok(false, `${state.id}: the artefact answered /api/ready`, `no answer within ${WAIT_MS / 1000}s`);
      return;
    }
    const store = ready.body?.store ?? {};
    const persistence = store.persistence ?? {};
    console.log(
      `  /api/ready → HTTP ${ready.status} · ready=${ready.body?.ready} · store.kind=${store.kind} · ` +
        `durability=${store.durability} · mode=${persistence.mode} · writesPermitted=${persistence.writesPermitted}`,
    );

    // THE WRITE ITSELF, not the report's opinion of it. POST /api/profile with an
    // empty body is the create door onboarding uses, and it reaches
    // `saveProfile` — a learner-record write — before anything else.
    const res = await fetch(`${server.base}/api/profile`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const body = await res.json().catch(() => null);
    // Where the write must land for the claim to hold. `boots.json` is written by
    // the readiness door itself (lib/server/boot-log.ts, outside the store's write
    // policy), so "nothing was written" is asserted on the LEARNER RECORD and not
    // on an empty directory.
    const profilesFile = path.join(dataDir, "profiles.json");
    const profiles = fs.existsSync(profilesFile)
      ? JSON.parse(fs.readFileSync(profilesFile, "utf8"))
      : null;
    const landed = Boolean(body?.profile?.id && profiles && body.profile.id in profiles);
    console.log(`  POST /api/profile → HTTP ${res.status} · learner record on disk: ${landed}`);

    for (const check of state.checks({ ready, store, persistence, res, body, landed })) {
      ok(check.cond, `${state.id}: ${check.name}`, check.detail ?? "");
    }
  } finally {
    await server.stop().catch(() => {});
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

/**
 * The states, each with the assertions its own configuration earns.
 *
 * `configured` is the documented command. `unproven` is the trap the audit found.
 * `declared`/`accepted` are the two deliberate escapes, and they are asserted as
 * AGREEMENT rather than as an outcome — because on a host whose mount table proves
 * the store is on the host's own filesystem, a MEASUREMENT outranks a declaration
 * and the refusal is correct (lib/env.ts says so, and the engines suite pins it).
 */
const STATES = [
  {
    id: "configured",
    env: {},
    checks: ({ ready, store, persistence, res, landed }) => [
      { cond: ready.status === 200 && ready.body?.ready === true, name: "the deployment reports itself ready" },
      { cond: store.kind === "file", name: `it serves the one backend this build can serve (${store.kind})` },
      { cond: persistence.writesPermitted === true, name: "and says learner records may be written" },
      { cond: res.status === 200, name: `a learner record is ACCEPTED (HTTP ${res.status})` },
      { cond: landed, name: "and it is in the store the server was told about — the write went where the report said" },
    ],
  },
  {
    id: "unproven",
    label: "a host that replaces its filesystem, with nothing declared",
    env: { RENDER: "true" },
    checks: ({ ready, persistence, res, body, landed }) => [
      { cond: ready.status === 503 && ready.body?.ready === false, name: `the deployment reports itself NOT ready (HTTP ${ready.status})` },
      {
        cond: persistence.writesPermitted === false && UNPROVEN_CODES.includes(persistence.blockedBy),
        name: `and names the finding that stopped writes (${persistence.blockedBy})`,
      },
      { cond: res.status === 503, name: `a learner record is REFUSED (HTTP ${res.status})` },
      { cond: body?.error === "store_not_durable" && body?.writes === false, name: `with the code a client can branch on (${body?.error})` },
      { cond: landed === false, name: "and NOTHING was written — a refusal is not an accepted write that is discarded later" },
    ],
  },
  {
    id: "accepted",
    label: "the same host, ephemerality accepted in so many words (a labelled demo)",
    env: { RENDER: "true", OPENMIND_ALLOW_EPHEMERAL_STORE: "1" },
    checks: ({ ready, persistence, res, landed }) => [
      {
        cond: persistence.mode === "accepted-ephemeral" || persistence.blockedBy === "data_dir_not_durable",
        // The NAME carries the reason when a pass is not the clean case, because
        // `detail` is only printed on failure: "the declaration was received"
        // beside `mode=unproven` would read as a declaration that was ignored,
        // and a green line must not say something the run does not show.
        name: persistence.mode === "accepted-ephemeral"
          ? `the declaration was received (mode=${persistence.mode})`
          : `the declaration was received, and a MEASURED loss on this host outranks it — correct, and named (mode=${persistence.mode}, blockedBy=${persistence.blockedBy})`,
      },
      { cond: (ready.status === 200) === (res.status === 200), name: `the report and the write path AGREE (ready=${ready.status}, write=${res.status})` },
      { cond: ready.status === 200 ? landed : !landed, name: ready.status === 200 ? "and the store holds the record it said it would take" : "and nothing was written, as the report said" },
    ],
  },
  {
    id: "declared",
    label: "the same host, with a disk declared durable (proved by the restart drill, not here)",
    env: { RENDER: "true", OPENMIND_DATA_DIR_DURABLE: "1" },
    checks: ({ ready, persistence, res, landed }) => [
      {
        cond: persistence.mode === "declared-durable" || persistence.blockedBy === "data_dir_not_durable",
        // Same rule as the `accepted` state above: this host measures the scratch
        // directory on its own filesystem and reports certain loss, which outranks
        // a declaration by design — so the line has to SAY that rather than report
        // a declaration beside a mode that looks like it was ignored. On a host
        // with a real volume the first branch is the one that runs.
        name: persistence.mode === "declared-durable"
          ? `the declaration was received (mode=${persistence.mode}, declaredBy=${persistence.declaredBy})`
          : `the declaration was received, and a MEASURED loss on this host outranks it — correct, and named (mode=${persistence.mode}, declaredBy=${persistence.declaredBy}, blockedBy=${persistence.blockedBy})`,
      },
      { cond: (ready.status === 200) === (res.status === 200), name: `the report and the write path AGREE (ready=${ready.status}, write=${res.status})` },
      { cond: ready.status === 200 ? landed : !landed, name: ready.status === 200 ? "and the store holds the record it said it would take" : "and nothing was written, as the report said" },
    ],
  },
];

console.log("OpenMind — the documented install contract (docs + the built artefact)");

// The build this drives is a real one, so the project's own headroom bar applies
// rather than being bypassed: a LOW reading is refused with the reason, and the
// regenerable caches are named. `npm run disk-headroom` has the full sentence.
const headroom = measureHeadroom(process.cwd());
console.log(`\n▸ Disk headroom: ${headroomSentence(headroom).split("\n")[0]}`);
if (headroom.state === "low") {
  console.log("\n✗ REFUSED: this script builds the production artefact and the volume is below the LOW bar.");
  console.log(`  ${headroomSentence(headroom).split("\n").slice(1).join("\n  ")}`);
  console.log("  (A test that runs until the disk fills is not a passing test — it is the ENOSPC failure this bar exists for.)");
  process.exit(1);
}

try {
  await prepareStandalone({ build: !SKIP_BUILD });
} catch (e) {
  console.error(`\n✗ could not build the artefact: ${e.message}`);
  process.exit(1);
}

for (const state of STATES) {
  await probe(state);
}

group("──────────────────────────────────────────────────────────");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
ok(
  /OPENMIND_DATA_DIR/.test(fs.readFileSync("README.md", "utf8")) && /OPENMIND_DATA_DIR/.test(fs.readFileSync("docs/DEPLOYMENT.md", "utf8")),
  "both documents still say where the production store lives (the fix this file pins)",
);
ok(
  !/NEXT_DIST_DIR/.test(pkg.scripts?.start ?? ""),
  `and \`npm start\` still does not hard-code a dist dir (${pkg.scripts?.start})`,
);

console.log(`\nINSTALL CONTRACT: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  · ${f}`);
  console.error(
    "\nA red run here means a documented way to start the server, or the write policy behind it, no longer holds.\n" +
      "Fix the document or the environment rule — do NOT relax lib/env.ts's STORE_BLOCKING_CODES: the refusal is the\n" +
      "feature, and accepting a learner record into a store the host is about to discard is the defect it prevents.",
  );
  process.exit(1);
}
console.log(
  "  What this proves: readiness and write behaviour on this host, through the shipped artefact, in all three states.\n" +
    "  What it does NOT prove: that the store survives a container replacement — that claim is declared, and its only\n" +
    "  evidence is the restart drill (`npm run verify:persistence -- --write`, replace the instance, `--verify`).",
);
process.exit(0);
