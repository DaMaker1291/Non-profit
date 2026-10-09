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
//
// ── WHY THE STEPS ARE ALSO EXPORTED INDIVIDUALLY ────────────────────────────
// `withProductionServer` boots ONCE and throws the store away, which is exactly
// right for a journey and exactly wrong for the one question it cannot ask:
// **does the data survive a restart?** Answering that needs the SAME store
// across TWO boots, sequentially, with the first process genuinely gone before
// the second starts — so the primitives underneath are exported and
// `npm run verify:persistence` drives them twice. Splitting them rather than
// copying them is the point: a second boot recipe would be a second artefact,
// and then the persistence test would prove something about a server nobody
// ships.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Build the production artefact and assemble the standalone server beside it.
 *
 * Next's standalone output deliberately omits the static tree and the public
 * folder: a deployment places them beside server.js. Getting this wrong yields
 * a server that answers 200 with unstyled HTML — the failure this repository
 * has actually shipped once, which is why the copy is part of the boot and not
 * a step a caller may forget.
 *
 * Throws rather than returning a status: nothing downstream is measurable
 * against a stale artefact, and a suite that cannot be run must never look like
 * a suite that passed.
 */
export async function prepareStandalone({ build = true } = {}) {
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

  say("▸ Assemble the standalone server");
  fs.rmSync(path.join(STANDALONE, "public"), { recursive: true, force: true });
  fs.rmSync(path.join(STANDALONE, ".next", "static"), { recursive: true, force: true });
  if (fs.existsSync(path.join(ROOT, "public"))) {
    fs.cpSync(path.join(ROOT, "public"), path.join(STANDALONE, "public"), { recursive: true });
  }
  fs.cpSync(path.join(ROOT, ".next", "static"), path.join(STANDALONE, ".next", "static"), { recursive: true });
}

/**
 * Start the assembled standalone server against a caller-chosen store.
 *
 * Returns a handle, not a bare child, because a restart test has to be able to
 * ask two things a child process cannot answer on its own:
 *
 *   · `pid`     — is the process serving this request a DIFFERENT one? A
 *                 restart that silently failed to happen would otherwise make
 *                 every assertion below pass for the wrong reason.
 *   · `stopped` — the first process must be genuinely GONE before the second
 *                 binds the port, or the "restart" was a no-op answering from
 *                 the old process's memory.
 *
 * `stop()` marks the shutdown as deliberate, so the exit watcher does not
 * report an intended teardown as a crash.
 */
export function startStandalone({ port, dataDir, prefix = "  [server] " }) {
  const base = `http://localhost:${port}`;
  fs.mkdirSync(dataDir, { recursive: true });

  const child = spawn(process.execPath, [SERVER], {
    cwd: STANDALONE,
    env: { ...process.env, PORT: String(port), OPENMIND_DATA_DIR: dataDir, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const state = { exited: null, stopping: false };
  child.stdout.on("data", (d) => process.stdout.write(`${prefix}${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`${prefix}${d}`));
  child.on("exit", (code) => {
    state.exited = code ?? 0;
    if (!state.stopping && code !== 0 && code !== null) {
      console.error(`\n✗ the production server exited with code ${code}`);
    }
  });

  return {
    base,
    child,
    pid: child.pid,
    exited: () => state.exited,
    /** Stop, and do not return until the process is really gone — SIGTERM,
     *  then SIGKILL if it refuses. A restart that overlapped two writers over
     *  one store would be exactly the corruption this product must not have. */
    async stop({ timeoutMs = 20_000 } = {}) {
      state.stopping = true;
      if (state.exited !== null) return state.exited;
      try {
        child.kill("SIGTERM");
      } catch {
        /* already gone */
      }
      const deadline = Date.now() + timeoutMs;
      while (state.exited === null && Date.now() < deadline) await sleep(100);
      if (state.exited === null) {
        try {
          child.kill("SIGKILL");
        } catch {
          /* already gone */
        }
        const hard = Date.now() + 5_000;
        while (state.exited === null && Date.now() < hard) await sleep(100);
      }
      return state.exited;
    },
  };
}

/**
 * Wait for READINESS, not for listening.
 *
 * A server that is listening but not ready answers the first request with a
 * 503, and every assertion after that blames the product. /api/ready is the
 * deployment's own report, and it names WHAT is not ready, so a stalled harness
 * reads as a diagnosis rather than a wait.
 *
 * Returns the readiness body on success and null on timeout, so a caller can
 * distinguish "never became ready" from "became ready and then broke".
 */
export async function waitForReady(server, { timeoutMs = 90_000, quiet = false } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && server.exited() === null) {
    try {
      const res = await fetch(`${server.base}/api/ready`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const body = await res.json();
        if (!quiet) say(`  ready: service=${body.service} version=${body.version}`);
        return body;
      }
      const body = await res.json().catch(() => null);
      if (body?.problems?.length && !quiet) {
        say(`  not ready: ${body.problems.map((p) => `${p.key}:${p.code}`).join(", ")}`);
      }
    } catch {
      /* not listening yet */
    }
    await sleep(500);
  }
  return null;
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
  const dataDir = path.join(ROOT, `.production-${label}-${Date.now().toString(36)}`);

  let server = null;
  const cleanup = () => {
    if (server && server.exited() === null) {
      try {
        server.child.kill("SIGTERM");
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
    await prepareStandalone({ build });

    say(`▸ Start production on http://localhost:${port} with a scratch store`);
    server = startStandalone({ port, dataDir });

    say("▸ Wait for readiness");
    const ready = await waitForReady(server);
    if (!ready) throw new Error(`the production server did not report ready within 90s at ${server.base}/api/ready`);

    return await fn(server.base, dataDir);
  } finally {
    if (server) await server.stop().catch(() => {});
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
