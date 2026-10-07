// ─────────────────────────────────────────────────────────────────────────────
// ONE WAY TO BOOT THE ARTEFACT WE SHIP.
//
// Two suites need the same four things — `npm run e2e:fresh` and
// `npm run product-benchmark` — and neither of them may ever measure a
// different build from the one a learner is served:
//
//   build production → assemble the standalone server → start it on a SCRATCH
//   store → wait until it ANSWERS (its own /api/ready report) → hand the caller
//   a base URL → tear everything down, on every exit path
//
// This used to be nobody's job. The product benchmark documented "requires a
// server on :4173" and simply hoped one was running, so in practice it drove
// whatever happened to be there — usually a dev server, compiled on the fly,
// with different module boundaries and none of the standalone server's asset
// layout. That is how a benchmark can be green while the shipped artefact is
// broken, and it is the failure this module exists to make impossible.
//
// The scratch store is not tidiness. A benchmark signs up learners, answers
// questions and creates classes; run against a deployment's data it would leave
// exactly that behind. Each run gets its own directory, and the directory goes
// away whether the run passed, failed or crashed.
// ─────────────────────────────────────────────────────────────────────────────

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, ".next", "standalone");
const SERVER = path.join(STANDALONE, "server.js");

function say(line) {
  console.log(line);
}

/**
 * Run one `fn(baseUrl)` against a freshly started production build.
 *
 * `fn` receives the base URL and the scratch store's path. Whatever it returns
 * is returned here. If it throws, or the server dies under it, the error
 * propagates after teardown — a suite that cannot be run must never look like a
 * suite that passed.
 */
export async function withProductionServer({ port = 4199, build = true, label = "run" }, fn) {
  const base = `http://localhost:${port}`;
  const dataDir = path.join(ROOT, `.production-${label}-${Date.now().toString(36)}`);

  let child = null;
  /** Set before the deliberate teardown so the exit handler does not report a
   *  clean shutdown as a crash. */
  let stopping = false;

  const cleanup = () => {
    if (child && !child.killed) {
      try {
        child.kill("SIGTERM");
      } catch {
        /* already gone */
      }
    }
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch {
      /* a locked file on Windows is not worth failing the run over */
    }
  };
  const onExit = () => cleanup();
  process.on("exit", onExit);

  try {
    if (build) {
      say("▸ Build the production artefact");
      const built = spawnSync("npm", ["run", "build"], {
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      if (built.status !== 0) throw new Error("`npm run build` failed — nothing is measured against a stale artefact.");
    }

    if (!fs.existsSync(SERVER)) {
      throw new Error(`no standalone server at ${SERVER} — build with output: "standalone" first.`);
    }

    // Next's standalone output deliberately omits the static tree and the public
    // folder: a deployment places them beside server.js. Getting this wrong
    // yields a server that answers 200 with unstyled HTML.
    say("▸ Assemble the standalone server");
    fs.rmSync(path.join(STANDALONE, "public"), { recursive: true, force: true });
    fs.rmSync(path.join(STANDALONE, ".next", "static"), { recursive: true, force: true });
    if (fs.existsSync(path.join(ROOT, "public"))) {
      fs.cpSync(path.join(ROOT, "public"), path.join(STANDALONE, "public"), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, ".next", "static"), path.join(STANDALONE, ".next", "static"), { recursive: true });

    say(`▸ Start production on ${base} with a scratch store`);
    fs.mkdirSync(dataDir, { recursive: true });
    child = spawn(process.execPath, [SERVER], {
      cwd: STANDALONE,
      env: { ...process.env, PORT: String(port), OPENMIND_DATA_DIR: dataDir, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (d) => process.stdout.write(`  [server] ${d}`));
    child.stderr.on("data", (d) => process.stderr.write(`  [server] ${d}`));
    let died = null;
    child.on("exit", (code) => {
      died = code;
      if (!stopping && code !== 0 && code !== null) {
        console.error(`\n✗ the production server exited with code ${code}`);
      }
    });

    // ── Wait for READINESS, not for listening ──────────────────────────────
    // A server that is listening but not ready answers the first request with a
    // 503, and every assertion after that blames the product. /api/ready is the
    // deployment's own report, and it names WHAT is not ready, so a stalled
    // harness reads as a diagnosis rather than a wait.
    say("▸ Wait for readiness");
    const deadline = Date.now() + 90_000;
    let ready = false;
    while (Date.now() < deadline && died === null) {
      try {
        const res = await fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const body = await res.json();
          say(`  ready: service=${body.service} version=${body.version}`);
          ready = true;
          break;
        }
        const body = await res.json().catch(() => null);
        if (body?.problems?.length) {
          say(`  not ready: ${body.problems.map((p) => `${p.key}:${p.code}`).join(", ")}`);
        }
      } catch {
        /* not listening yet */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!ready) throw new Error(`the production server did not report ready within 90s at ${base}/api/ready`);

    return await fn(base, dataDir);
  } finally {
    stopping = true;
    cleanup();
    process.off("exit", onExit);
  }
}

/** Whether a Chrome the ui-walk can drive is actually present. Asked so a
 *  missing browser is recorded as UNTESTED rather than reported as the product
 *  failing a gate it cannot run. */
export function chromeAvailable() {
  const bin = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(bin)) return true;
  // A linux/CI install, or a chrome on PATH.
  return ["google-chrome", "chromium", "chromium-browser"].some((name) => {
    const found = spawnSync(process.platform === "win32" ? "where" : "which", [name], { stdio: "ignore" });
    return found.status === 0;
  });
}
