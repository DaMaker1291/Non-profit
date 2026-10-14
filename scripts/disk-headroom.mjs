// ─────────────────────────────────────────────────────────────────────────────
// THE DISK-HEADROOM RULE, AND THE ALARM THAT SAYS IT OUT LOUD.
//
// A full disk on this checkout is disguised as a broken product. Measured: at
// **4.1 GB** free (and ~4 GB before it, both times while a stale `.next-dev` was
// being rewritten in place) the dev server's webpack write failed with `ENOSPC`,
// the compile never answered, and the run died five minutes later on
// `HeadersTimeoutError` with **0 assertions reported** — reading like a hung
// route. The same source then ran green at **5.1 GB** with that cache deleted.
//
// Two test suites had each grown their own copy of the rule, and their comments
// had already started talking to each other across files ("keep these in step
// with `scripts/e2e-api.mjs`", "move both files"). That is the shape this
// repository spends its effort deleting: one rule, two owners, and a third that
// drifts. So the thresholds, the classification and the sentence live HERE, the
// two suites import them, and this file is also runnable AS the alarm an operator
// needs — which is the part that was missing: a bar that only exists inside a
// test suite warns nobody at 3 a.m.
//
//   · it measures the volume holding the STORE and the BUILDS (`statfs`), never
//     the size of a directory — a 3 GB project on a 10 GB volume is a full disk;
//   · `low` means writes are about to start failing, so the CLI EXITS NON-ZERO
//     and the e2e refuses before line one. `warn` means it will run and a build
//     may fail, so it is reported and does not refuse a release;
//   · a volume whose free space cannot be measured is `unknown`, and that is
//     reported as "no measurement", never as a pass. `statfs` is not universal;
//   · `OPENMIND_MIN_FREE_MB` moves the LOW bar only, and a value that is set but
//     not a number falls back to the default rather than disabling the check —
//     `Number("x")` is NaN and `freeMb < NaN` is false, which would have turned a
//     typo into no check at all. It exists so the refusal is a testable
//     behaviour, and so a small volume can deliberately run below the bar.
//
// The bars are BRACKETED by measurement, not chosen — but the bracket is NOT a
// statement of how much space a run needs, and measuring that changed what this
// file is for. A full `npm run e2e` was measured GREEN at **3.4 GB free** (861
// passed, 0 failed) with a transient footprint of **~550 MB**, while the volume's
// free space moved 2.7 → 3.2 → 3.6 → 4.7 → 3.5 → 1.0 GB during that one session
// with no change to this repository at all. The run costs a rounding error; the
// volume is shared with 414 GB of somebody else's data and churns by gigabytes.
//
// So the bar is a MARGIN, not a need: it exists so that other people's writes do
// not land on this one mid-compile, which is the failure actually measured
// (ENOSPC inside a webpack write, while a stale cache was being rewritten in
// place). It therefore deliberately refuses runs that would pass — 3.4 GB is
// refused and was green — and that is asserted rather than left to look like a
// bug. `E2E_FOOTPRINT_MB` and `OBSERVED_CHURN_MB` carry the two measurements, and
// `--self-test` asserts the relationship between them and the bar so a future
// edit cannot move it inside the noise. It also plants the mis-calibration that
// actually happened: the first cut used 500 MB, which classified the very run
// this exists for as "ok".
//
// Usage:
//   node scripts/disk-headroom.mjs [--json] [--root DIR] [--strict]
//   node scripts/disk-headroom.mjs --self-test
//
// Exit: 0 ok/warn · 1 warn under --strict, or a self-test failure · 2 refused
//       (usage) · 3 LOW — the alarm, and the same code `npm run e2e` refuses with
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Refuse below this: writes are about to start failing. 5 GB, bracketed by the
 *  measured failure at 4.1 GB and the measured success at 5.1 GB. */
export const LOW_MB_DEFAULT = 5120;
/** Watch below this: it will run, but a Next build writing here may hit ENOSPC. */
export const WARN_MB_DEFAULT = 8192;
/** The environment variable that moves the LOW bar. */
export const MIN_FREE_ENV = "OPENMIND_MIN_FREE_MB";

/**
 * WHAT A RUN COSTS AND WHAT MOVES AROUND IT — the two measurements that decide
 * whether the bar is defensible, exported so the self-test asserts the
 * relationship instead of restating it in prose.
 *
 * `E2E_FOOTPRINT_MB` — measured 14 Oct 2026: a full `npm run e2e` ran green at
 * 3.4 GB free and cost this volume 542 MB (`.next-dev`) + 3.7 MB (`.verify`) +
 * 468 KB (the scratch store). That is the whole of it.
 *
 * `OBSERVED_CHURN_MB` — the LARGEST independent drop in free space seen during
 * that same session, caused by processes outside this repository. The margin has
 * to cover this, because a compile that runs out of space mid-write is the
 * failure this whole file exists to make loud.
 */
export const E2E_FOOTPRINT_MB = 550;
export const OBSERVED_CHURN_MB = 2662;

/**
 * The two bars, resolved. `warn` is `max(low, WARN_DEFAULT)` so raising LOW above
 * the warning line collapses the warn band rather than inverting it — a caller
 * that refuses at 10 GB does not also want to be told 8 GB is "tight".
 */
export function thresholds(env = process.env) {
  const raw = Number(env[MIN_FREE_ENV]);
  const lowMb = Number.isFinite(raw) && raw >= 0 ? raw : LOW_MB_DEFAULT;
  return { lowMb, warnMb: Math.max(lowMb, WARN_MB_DEFAULT) };
}

/** Classify a measured free-space figure. `low` is strict: AT the bar is fine. */
export function classify(freeMb, t = thresholds()) {
  if (freeMb < t.lowMb) return "low";
  if (freeMb < t.warnMb) return "warn";
  return "ok";
}

/**
 * Measure the volume holding `root`.
 *
 * Returns `state: "unknown"` with `measured: false` when `statfs` is unavailable,
 * and carries the reason — a caller must be able to say "not measured" instead of
 * letting a missing number read as headroom.
 */
export function measureHeadroom(root = process.cwd(), env = process.env) {
  const t = thresholds(env);
  try {
    const st = fs.statfsSync(root);
    const freeMb = Math.floor((Number(st.bavail) * Number(st.bsize)) / (1024 * 1024));
    const freeGb = (freeMb / 1024).toFixed(1);
    return { measured: true, root, freeMb, freeGb, ...t, state: classify(freeMb, t), detail: null };
  } catch (e) {
    return {
      measured: false, root, freeMb: null, freeGb: null, ...t,
      state: "unknown", detail: e && e.message ? e.message : "statfs unavailable",
    };
  }
}

/** How much would have to be freed to reach the WARN line — what a fix needs to
 *  say, in GB, so an operator is not left to work it out. */
export function shortfallGb(m) {
  if (!m.measured) return null;
  return Math.max(0, Math.ceil((m.warnMb - m.freeMb) / 1024));
}

/**
 * The sentence, in the alarm's own voice — used by the CLI and by the e2e's
 * refusal. A surface that REPORTS rather than refuses (the release checklist)
 * composes its own one-liner from the measured fields instead: the RULE is what
 * has one owner, not every rendering of it.
 */
export function headroomSentence(m) {
  if (m.state === "unknown") {
    return (
      `heap space could not be measured on ${m.root} (${m.detail}). ` +
      "That is not headroom: nothing checked, and a full disk would still dress up as a broken route."
    );
  }
  const bars = `bar: refuse below ${(m.lowMb / 1024).toFixed(1)} GB, watch below ${(m.warnMb / 1024).toFixed(1)} GB`;
  if (m.state === "low") {
    return (
      `${m.freeGb} GB free on the volume holding the store, .verify and the builds (${bars}).\n` +
      `  Writes are about to fail (ENOSPC) and the failure will not look like one — it will look\n` +
      `  like a hung route or a crashed test with no assertion reported. Free at least ${shortfallGb(m)} GB\n` +
      "  (which clears both bars) — a regenerable build cache is the usual cause: `.next-dev`,\n" +
      "  `.next-prod` and `.verify` are the three that belong to this project and are safe to delete."
    );
  }
  if (m.state === "warn") {
    return `${m.freeGb} GB free (${bars}) — enough to run, tight enough that a build may fail (ENOSPC)`;
  }
  return `${m.freeGb} GB free (${bars})`;
}

/** Free the advice lines from the numeric detail, so a report line stays one line. */
export function headroomOneLine(m) {
  if (m.state === "unknown") return `not measured — ${m.detail}`;
  if (m.state === "low") {
    return `${m.freeMb} MB free on the volume holding the store and the builds — below ${m.lowMb} MB, writes are about to fail (ENOSPC); free at least ${shortfallGb(m)} GB`;
  }
  if (m.state === "warn") {
    return `${m.freeGb} GB free — enough to run, tight enough to watch; the store, the builds and the compiled mirror all write here`;
  }
  return `${m.freeGb} GB free`;
}

// ── The self-test: the bar must sit ABOVE the failure it catches ─────────────
/**
 * Every assertion here is about the CALIBRATION, because that is the half of a
 * guard that rots silently. A guard whose bar is too low does not fail: it passes
 * the run it exists for, which is the one outcome nobody notices.
 */
function selfTest() {
  let pass = 0;
  const failures = [];
  const check = (name, cond, detail = "") => {
    if (cond) pass++;
    else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ${cond ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  };

  console.log("\nOpenMind — disk headroom self-test (the guard's own calibration)\n");
  const d = thresholds({});

  // THE BRACKET. The failure was measured at 4.1 GB free and the success at
  // 5.1 GB, so the default LOW must sit inside (4.1, 5.1] GB.
  check("the LOW bar is above the measured ENOSPC (4.1 GB free)",
    d.lowMb > 4.1 * 1024, `${d.lowMb} MB vs ${Math.round(4.1 * 1024)} MB`);
  check("and at or below the measured green run (5.1 GB free)",
    d.lowMb <= Math.floor(5.1 * 1024), `${d.lowMb} MB vs ${Math.floor(5.1 * 1024)} MB`);

  // THE BAR IS A MARGIN, NOT A NEED. A full e2e costs ~550 MB and was measured
  // GREEN at 3.4 GB free, so "the run would not fit" is not the argument — the
  // argument is that the volume churns by gigabytes around it. This is the
  // assertion that stops a later edit lowering the bar into that noise.
  check("the bar exceeds the run's own measured footprint PLUS the churn observed around it",
    d.lowMb > E2E_FOOTPRINT_MB + OBSERVED_CHURN_MB,
    `${d.lowMb} MB vs ${E2E_FOOTPRINT_MB} + ${OBSERVED_CHURN_MB} = ${E2E_FOOTPRINT_MB + OBSERVED_CHURN_MB} MB`);
  check("and it is deliberately conservative: the measured GREEN run at 3.4 GB is refused",
    classify(3558, d) === "low", `3.4 GB free classified ${classify(3558, d)}`);

  // THE PLANTED LIE. The first cut of this guard used 500 MB, and it classified
  // the measured failure as fine. If a later edit reintroduces that, this fires.
  const firstCut = { lowMb: 500, warnMb: 2048 };
  check("the measured failure point (4.1 GB) is REFUSED at the default bar, and was NOT at the first cut",
    classify(4.1 * 1024, d) === "low" && classify(4.1 * 1024, firstCut) === "ok",
    `default ${classify(4.1 * 1024, d)}, first cut ${classify(4.1 * 1024, firstCut)}`);

  // Boundaries, both ends, and the strictness of the low edge.
  check("exactly at the LOW bar is not refused", classify(d.lowMb, d) === "warn", classify(d.lowMb, d));
  check("one MB below it is", classify(d.lowMb - 1, d) === "low");
  check("exactly at the WARN bar is ok", classify(d.warnMb, d) === "ok");
  check("one MB below that is a warning", classify(d.warnMb - 1, d) === "warn");

  // The override, including the trap that made it a rule.
  const over = thresholds({ [MIN_FREE_ENV]: "200" });
  check("OPENMIND_MIN_FREE_MB moves the LOW bar only", over.lowMb === 200 && over.warnMb === WARN_MB_DEFAULT);
  check("and a value that is not a number falls back to the default, rather than disabling the check",
    thresholds({ [MIN_FREE_ENV]: "x" }).lowMb === LOW_MB_DEFAULT);
  check("raising LOW above the warning line collapses the band instead of inverting it",
    thresholds({ [MIN_FREE_ENV]: "20480" }).warnMb === 20480);
  check("zero is accepted and means \"never refuse on space\"",
    thresholds({ [MIN_FREE_ENV]: "0" }).lowMb === 0 && classify(1, thresholds({ [MIN_FREE_ENV]: "0" })) === "warn");

  // An unmeasurable volume must never read as headroom.
  const unmeasured = { measured: false, root: "/nowhere", freeMb: null, freeGb: null, lowMb: d.lowMb, warnMb: d.warnMb, state: "unknown", detail: "no statfs" };
  check("an unmeasurable volume reports a MISSING measurement, not a pass",
    /not headroom/.test(headroomSentence(unmeasured)) && headroomOneLine(unmeasured).startsWith("not measured"));

  // IMPORTING MUST NOT RUN THE ALARM. This is a regression, not a hypothetical:
  // the CLI used to sit at module scope, so `import`ing this file from the e2e
  // executed its `process.exit()` in the e2e's own process — the suite refused
  // with RC 3 on a low volume and silently exited 0 with zero assertions on a
  // healthy one. Probed in a CHILD, because the assertion is about what happens
  // on import and this file cannot import itself without recursing.
  const probe = spawnSync(process.execPath, ["-e", `import(${JSON.stringify(new URL("./disk-headroom.mjs", import.meta.url).href)}).then(() => {})`], {
    encoding: "utf8",
  });
  check("importing this module runs NOTHING — no alarm, no exit",
    probe.status === 0 && probe.stdout.trim() === "" && probe.stderr.trim() === "",
    `exit ${probe.status}, stdout ${JSON.stringify(probe.stdout.slice(0, 40))}`);

  // …and the CLI DOES still work when it is the entry point. Measured in a child
  // with the bar pinned at both ends, so the assertion is about the CLI's wiring
  // rather than about how full this machine's disk happens to be.
  const self = fileURLToPath(import.meta.url);
  const runCli = (env) => {
    const r = spawnSync(process.execPath, [self, "--json"], { encoding: "utf8", env: { ...process.env, ...env } });
    let json = null;
    try { json = JSON.parse(r.stdout); } catch { /* asserted below */ }
    return { status: r.status, json };
  };
  const wide = runCli({ [MIN_FREE_ENV]: "9999999" });
  check("run AS the command it still measures, reports, and refuses with RC 3 when low",
    wide.status === 3 && wide.json?.state === "low" && wide.json?.measured === true,
    `exit ${wide.status}, state ${wide.json?.state}`);
  const roomy = runCli({ [MIN_FREE_ENV]: "0" });
  check("and exits 0 with a machine-readable measurement when the bar is cleared",
    roomy.status === 0 && roomy.json?.lowMb === 0 && roomy.json?.measured === true,
    `exit ${roomy.status}, lowMb ${roomy.json?.lowMb}`);

  console.log(`\n  ${pass} case(s) passed, ${failures.length} failed`);
  return failures.length;
}

// ── CLI: the alarm an operator schedules ────────────────────────────────────
/**
 * Is this file the program being RUN, or a module being IMPORTED?
 *
 * This module has a CLI with `process.exit()` in it, and it is imported by
 * `scripts/e2e-api.mjs` and `scripts/production-check.mjs` — so running the CLI
 * at module scope runs it on import too, inside a process whose argv belongs to
 * somebody else. It did: the e2e inherited the alarm's own exit, so it refused
 * with RC 3 when the volume was low and **silently exited 0 without a single
 * assertion** when it was not — and both of those read as the suite working.
 * That is the same class of failure this module exists to catch, one level up: a
 * guard whose own behaviour nobody suspected.
 *
 * Both sides are realpath'd, because a symlinked checkout (or npm handing over a
 * resolved path) can name the same file two ways.
 */
export function isEntryPoint() {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(self);
  } catch {
    return path.resolve(process.argv[1]) === self;
  }
}

/** The alarm, as a command. Returns the exit code rather than exiting, so the
 *  entry check below is the ONE place that decides to stop the process. */
function main() {
  const argv = process.argv.slice(2);
  const value = (name) => {
    const i = argv.indexOf(name);
    if (i < 0) return null;
    const next = argv[i + 1];
    return next && !next.startsWith("--") ? next : null;
  };

  if (argv.includes("--self-test")) return selfTest() ? 1 : 0;

  const root = value("--root") ? String(value("--root")) : process.cwd();
  const m = measureHeadroom(root);

  if (argv.includes("--json")) {
    console.log(JSON.stringify({
      measured: m.measured, root: m.root, freeMb: m.freeMb, freeGb: m.freeGb,
      lowMb: m.lowMb, warnMb: m.warnMb, state: m.state, detail: m.detail,
    }, null, 2));
  } else {
    const mark = m.state === "low" ? "✗" : m.state === "warn" ? "·" : "✓";
    console.log(`\nOpenMind — disk headroom  ${mark} ${m.state.toUpperCase()}\n`);
    console.log(`  ${headroomSentence(m)}\n`);
  }

  // The alarm's whole purpose: a low disk fails LOUDLY, so a scheduled check can
  // shout instead of waiting for a build to fail with a costume on.
  if (m.state === "low") return 3;
  if (m.state === "warn" && argv.includes("--strict")) return 1;
  return 0;
}

if (isEntryPoint()) process.exit(main());
