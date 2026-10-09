// ─────────────────────────────────────────────────────────────────────────────
// THE CLAIM THE DEPLOYMENT BRIEF PUTS BEFORE EVERY OTHER ONE:
// **a redeploy must not wipe a learner.**
//
//   npm run verify:persistence              the whole test, automatically
//   OPENMIND_BASE=https://… npm run verify:persistence -- --write
//   OPENMIND_BASE=https://… npm run verify:persistence -- --verify
//
// WHY THIS FILE EXISTS, AND WHY IT IS NOT ALREADY COVERED.
//
// `npm run e2e:fresh` proves a new learner can arrive, be measured, be taught
// and be told what to do next — against the real production build. It proves it
// in ONE process, so it cannot distinguish two very different products:
//
//   · one that persists a learner's record, and
//   · one whose store is the application directory inside an ephemeral
//     container, where every fact it "remembered" lives only until the next
//     restart.
//
// Both pass that journey. Only one survives a redeploy, and the difference is
// invisible to every other suite in this repository: they all boot the server,
// assert, and tear down, so nothing they check ever has to outlive a process.
// On a host with no mounted volume (Render's default, Fly's default, a Docker
// container's writable layer) the second product is what ships — and it fails
// silently, at 3am, as "the learners disappeared".
//
// So the question is asked directly, as the mission states it:
//
//   signup → profile → onboarding → diagnostic → answer → evidence
//          → RESTART → evidence still exists → the class still exists
//
// ── TWO MODES, ONE SET OF ASSERTIONS ────────────────────────────────────────
//
// LOCAL (default, no OPENMIND_BASE): build the artefact, boot it on a temp
// store, do all of the above, STOP IT, boot a SECOND process on the SAME store,
// and require every fact to still be there — byte-comparable. This is the mode
// CI can run, and it is a complete test of the store's durability.
//
// REMOTE (OPENMIND_BASE set): a restart cannot be performed from here, and
// pretending otherwise is how a persistence test becomes theatre. So the check
// is split in two, in the same shape `docs/DEPLOYMENT.md` §8 uses:
//
//   --write   creates a real learner with real evidence on the deployment and
//             records an identity file (in the system temp dir, never the repo:
//             it carries a capability secret).
//   --verify  run AFTER the operator restarts or redeploys, re-reads every fact
//             and requires it to be unchanged.
//
// The remote half also REFUSES to pass unless a restart genuinely happened. The
// witness is `/api/health`'s own `uptimeSeconds`, which makes "when did this
// process start" a fact the server reports about itself: if the process start
// time is unchanged from the write phase, nothing was restarted, the same
// process answered, and a green result would be a lie — so it fails with that
// sentence instead.
//
// ── WHAT IT TOUCHES ─────────────────────────────────────────────────────────
//
// Local mode writes only to a temp store, and removes it on every exit path.
// Remote mode creates ONE learner whose records are ALL erased again on success
// (`DELETE /api/profile?confirm=ERASE`, which takes the profile, the evidence
// ledger and every class membership with it). One residue is honest and named:
// this deployment has no account-deletion route, so a SIGN-UP leaves its email
// row behind — which is why remote mode creates its learner with a capability
// secret instead of an account. Nothing here writes to a store it was not
// pointed at, and the local mode asserts that too.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepareStandalone, startStandalone, waitForReady } from "./production-server.mjs";

const REMOTE_BASE = process.env.OPENMIND_BASE ?? "";
const ARGS = process.argv.slice(2);
const MODE = ARGS.includes("--write") ? "remote-write" : ARGS.includes("--verify") ? "remote-verify" : "local";
const CANARY = path.join(os.tmpdir(), "openmind-persistence-canary.json");
const ROOT = process.cwd();

// ── Reporting ───────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
const lost = [];
const step = (name) => console.log(`\n▸ ${name}`);
const ok = (cond, message, detail = "") => {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${message}${detail ? ` (${detail})` : ""}`);
  } else {
    fail += 1;
    lost.push(message);
    console.error(`  ✗ ${message}${detail ? ` — ${detail}` : ""}`);
  }
};
/** Equality with both values named: "the mastery survived" is only useful with
 *  the number it survived as, and a mismatch is only diagnosable with both. */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okSame = (before, after, message) =>
  ok(same(before, after), message, same(before, after) ? `${JSON.stringify(after)}` : `was ${JSON.stringify(before)}, now ${JSON.stringify(after)}`);

// ── HTTP ────────────────────────────────────────────────────────────────────
async function call(base, p, opts) {
  const res = await fetch(base + p, { ...opts, signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body, headers: res.headers };
}
const post = (base, p, body) =>
  call(base, p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const query = (p, params) => {
  const q = new URLSearchParams(params).toString();
  return `${p}${p.includes("?") ? "&" : "?"}${q}`;
};
const authed = (base, p, id, secret) => call(base, query(p, { id, secret }));
/** `/api/classes` names the CALLER in `me`, not `id` — `id` is the class. */
const authedMe = (base, p, meId, secret, extra = {}) => call(base, query(p, { me: meId, secret, ...extra }));

/**
 * Where the projection that produced the model lives on a ledger response.
 *
 * ONE reader, deliberately. This expression was written into both halves of
 * this test and only one half was corrected, so the write phase recorded the
 * projection object while the verify phase read `null` — and the run reported
 * "the projection is the same version: was null, now {…}" against a product
 * that had done nothing wrong. It is the same hazard this repository's notes
 * describe for any rule with two copies: a rule with two copies has two
 * answers.
 */
const projectionOf = (body) => body?.projectionVersion ?? body?.projection?.version ?? body?.projection ?? null;

/**
 * When did the process serving this request start?
 *
 * `/api/health` reports `uptimeSeconds` and its own `now`, so the answer is
 * arithmetic on the server's own testimony rather than anything this script
 * could observe from outside. It is the restart witness: a persistence check
 * that cannot tell "the store survived" from "nothing restarted" proves
 * nothing, and this is the cheapest fact that separates them.
 */
async function processStart(base) {
  const h = await call(base, "/api/health");
  if (h.status !== 200 || typeof h.body?.uptimeSeconds !== "number" || typeof h.body?.now !== "number") return null;
  return {
    start: h.body.now - Math.round(h.body.uptimeSeconds * 1000),
    deployment: h.body.deployment ?? null,
  };
}

// ── Create a learner, two ways ──────────────────────────────────────────────
/**
 * LOCAL: the real sign-up path, because the local run is thrown away with its
 * temp store and there is no reason to exercise anything less than the flow a
 * learner takes.
 * REMOTE: `POST /api/profile` with a capability secret, and deliberately NOT
 * sign-up — a deployment has no route that deletes an account, so a remote run
 * that signed up would leave an email row on a real host forever. Same learner,
 * same evidence, no residue.
 */
async function createLearner(base, mode) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  if (mode === "local") {
    const email = `persist-${stamp}@openmind.test`;
    const password = "openmind-persistence-passphrase";
    const r = await post(base, "/api/auth/signup", {
      email, password, name: "Persistence Check", country: "GB", language: "en",
    });
    return { id: r.body?.profile?.profile?.id ?? "", secret: r.body?.secret ?? "", email, password, status: r.status };
  }
  const secret = `persist-${stamp}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const r = await post(base, "/api/profile", {
    handle: `persist_${stamp}`, country: "GB", language: "en", subjects: ["maths"], secret,
  });
  return { id: r.body?.profile?.id ?? "", secret, email: null, password: null, status: r.status };
}

// ── PHASE A: create a real record, and record exactly what exists ───────────
async function writeCanary(base, mode) {
  step("The deployment answers, and a record is created on it");

  const at = await processStart(base);
  ok(at !== null, "the deployment reports its own identity and process start time");
  ok(at?.deployment != null, `and names the artefact serving it${at?.deployment ? ` (${at.deployment})` : ""}`);

  const learner = await createLearner(base, mode);
  ok(learner.status === 200 && learner.id.length > 0, `a learner is created (HTTP ${learner.status})`);
  ok(learner.secret.length >= 16, "with a capability secret long enough to authorise their later writes");
  if (!learner.id) throw new Error("no learner id — nothing further can be asserted");

  // ── ONBOARDING, and the course ────────────────────────────────────────────
  const onb = await post(base, "/api/profile", {
    id: learner.id, secret: learner.secret,
    grade: "Year 10", birthYear: 2010, goal: "exams", subjects: ["maths"], onboarded: true,
  });
  ok(onb.status === 200, `the enrolment write lands (HTTP ${onb.status})`);
  const onboardedAt = onb.body?.profile?.onboardedAt ?? null;
  ok(typeof onboardedAt === "number", "onboarding is recorded as the moment it finished");

  const course = await post(base, "/api/profile", {
    id: learner.id, secret: learner.secret,
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } },
  });
  ok(course.status === 200, `choosing a course lands (HTTP ${course.status})`);
  const spec = course.body?.profile?.subjectCourses?.maths?.spec ?? null;
  ok(spec === "uk-gcse", "and the course is stored against its subject");

  // ── DIAGNOSTIC: a sitting, which folds as ONE event ───────────────────────
  // Included on purpose: a sitting and a practice answer reach the model
  // through DIFFERENT folds (`mergeDiagnosticSeed` vs `recordAnswer`), so a
  // store that preserved one and not the other is a real failure this catches.
  const start = await post(base, "/api/diagnostic", { id: learner.id, secret: learner.secret, subject: "maths", action: "start", kind: "baseline" });
  ok(start.status === 200 && typeof start.body?.question?.id === "string", `the diagnostic opens and serves a question (HTTP ${start.status})`);
  ok(start.body?.question?.answer === undefined, "and serves it without its answer — the strip is real in the artefact");

  const firstQ = start.body?.question;
  if (firstQ?.id) {
    const a = await post(base, "/api/diagnostic", {
      id: learner.id, secret: learner.secret, subject: "maths", action: "answer",
      questionId: firstQ.id, chosen: 0, certainty: "unsure",
    });
    ok(a.status === 200, `the diagnostic answer is graded (HTTP ${a.status})`);
  }
  let skips = 0;
  for (;;) {
    if (skips++ > 60) {
      ok(false, "the diagnostic ladder ended within 60 steps");
      break;
    }
    const s = await post(base, "/api/diagnostic", { id: learner.id, secret: learner.secret, subject: "maths", action: "skip" });
    if (s.status !== 200) {
      ok(false, `skipping a concept answers 200 (HTTP ${s.status})`);
      break;
    }
    if (!s.body?.next) break;
  }
  const finish = await post(base, "/api/diagnostic", { id: learner.id, secret: learner.secret, subject: "maths", action: "finish" });
  ok(finish.status === 200 && finish.body?.result != null, "closing the sitting produces the report the learner reads");

  // ── PRACTICE: serve, answer, and watch the model move ─────────────────────
  const next = await authed(base, "/api/next", learner.id, learner.secret);
  ok(next.status === 200 && Array.isArray(next.body?.actions) && next.body.actions.length > 0, "the decision door recommends something");
  const conceptId = next.body?.actions?.[0]?.conceptId ?? "linear-equations";
  const groundedEvents = next.body?.decision?.evidenceEvents ?? 0;
  ok(groundedEvents > 0, `from evidence it has actually read (${groundedEvents} events)`);

  const served = await post(base, "/api/progress", { action: "serve", id: learner.id, secret: learner.secret, conceptId, lang: "en" });
  ok(served.status === 200 && typeof served.body?.question?.id === "string", `a practice question is served (HTTP ${served.status})`);
  ok(served.body?.question?.answer === undefined, "and it carries no answer either");
  const q = served.body?.question;
  const submission = {
    action: "answer", id: learner.id, secret: learner.secret, conceptId, questionId: q?.id,
    submissionId: `sub_persist_${Date.now().toString(36)}`, deviceAt: Date.now(),
  };
  // A numeric item names NO option, and a picked one names no number — sending
  // the wrong shape is a plain 400 with no hint about the field, which is how a
  // persistence test can silently stop measuring. Ask the served question which
  // shape it is.
  if (q?.responseKind === "numeric") submission.numericAnswer = "0";
  else submission.choiceIndex = 0;
  const graded = await post(base, "/api/progress", submission);
  ok(graded.status === 200, `the practice answer is graded (HTTP ${graded.status})`);
  ok(typeof graded.body?.correct === "boolean", "the verdict is a real boolean, decided server-side");
  ok(typeof graded.body?.mastery === "number", `and the concept's mastery moved (${graded.body?.mastery})`);
  ok(typeof graded.body?.demonstrated?.mode === "string", `with the server attributing what it proved (${graded.body?.demonstrated?.mode})`);

  // ── A CLASS, because "learner data" is not only the learner ───────────────
  const made = await post(base, "/api/classes", { action: "create", name: "Persistence check", subject: "maths", id: learner.id, secret: learner.secret });
  ok(made.status === 200 && typeof made.body?.cls?.id === "string", `a class is created (HTTP ${made.status})`);
  const cls = { id: made.body?.cls?.id ?? null, joinCode: made.body?.cls?.joinCode ?? null };
  ok(typeof cls.joinCode === "string" && cls.joinCode.length >= 4, "with a join code, which is the thing a restart most easily loses");

  // ── WHAT MUST SURVIVE, recorded field by field ────────────────────────────
  const summary = await authed(base, "/api/evidence-summary", learner.id, learner.secret);
  ok(summary.status === 200, `the learner's own record is readable (HTTP ${summary.status})`);
  const answers = summary.body?.totals?.answers ?? null;
  ok(typeof answers === "number" && answers >= 2, `it counts the diagnostic and the practice answer (${answers})`);
  const row = (summary.body?.concepts ?? []).find((c) => c.conceptId === conceptId) ?? null;
  ok(row != null, "the concept just practised appears in the record");
  // Guarded so the comparison after the restart cannot pass VACUOUSLY: if the
  // row exposed no measurable state, "attempts before === attempts after" would
  // be undefined === undefined and would report a survival that was never
  // measured. Ask for the state first, and say what it is rather than banking a
  // green tick for it.
  //
  // NOTE what is deliberately NOT here: `mastery`. This is the DISPLAY door, and
  // a mastery number is model vocabulary — the same rule that keeps
  // `schemaVersion` out of this response. The grade response carries mastery
  // (asserted above); this row carries what a learner can read.
  ok(
    typeof row?.attempts === "number" && row.attempts > 0,
    "and carries the measurable state the restart will be judged against",
    `attempts=${row?.attempts}`,
  );

  const ledger = await authed(base, "/api/evidence", learner.id, learner.secret);
  ok(ledger.status === 200, `the ledger itself is readable (HTTP ${ledger.status})`);
  const events = (ledger.body?.events ?? []).map((e) => e.id).sort();
  ok(events.length >= 2, `and holds the events behind the model (${events.length})`);
  // Where the projection version actually lives on this response. Asked for in
  // the same order the fresh-learner journey asks, because guessing wrong makes
  // the comparison below vacuous (null === null) — which is how a check silently
  // stops protecting anything.
  const projection = projectionOf(ledger.body);
  ok(projection != null, "and names the projection that produced the model from it", `v${projection?.projectionVersion ?? projection?.version ?? "?"}`);

  return {
    base: base.replace(/\/+$/, ""),
    createdAt: Date.now(),
    processStart: at?.start ?? null,
    deployment: at?.deployment ?? null,
    learner: { id: learner.id, secret: learner.secret, email: learner.email },
    profile: { onboardedAt, spec },
    concept: { id: conceptId, mastery: graded.body?.mastery ?? null, attempts: row?.attempts ?? null },
    /** The WHOLE row the display door returned, compared verbatim after the
     *  restart. One field would not be enough: a model that reset to its priors
     *  would empty the dimension bands while `attempts` (a count) could still
     *  read correctly from the fold. */
    conceptRow: row,
    answers,
    events,
    projection,
    cls,
    groundedEvents,
    canaryEvidence: { answers, events, projection, spec, onboardedAt, mastery: graded.body?.mastery ?? null, classJoinCode: cls.joinCode, conceptId },
  };
}

// ── PHASE B: everything above, after a restart ──────────────────────────────
async function verifyCanary(base, canary, { expectRestart = true } = {}) {
  const l = canary.learner;
  step("The same record, after a restart");

  // ── The restart witness, FIRST ────────────────────────────────────────────
  // If this is not established, everything below is consistent with "nothing
  // restarted, the process answered from memory", and a green run would be
  // worse than a red one.
  const nowAt = await processStart(base);
  ok(nowAt !== null, "the deployment still reports its identity");
  if (expectRestart) {
    ok(
      canary.processStart != null && nowAt != null && nowAt.start !== canary.processStart,
      "a genuinely DIFFERENT process is serving this — the restart really happened",
      nowAt?.start === canary.processStart
        ? "the process start time is unchanged, so nothing restarted and this check would prove nothing"
        : `${new Date(canary.processStart ?? 0).toISOString()} → ${new Date(nowAt?.start ?? 0).toISOString()}`,
    );
  }

  const ready = await call(base, "/api/ready");
  ok(ready.status === 200 && ready.body?.ready === true, `readiness is 200 again (HTTP ${ready.status})`, ready.body?.checks?.config?.code);
  ok(ready.body?.checks?.data?.ok === true, "and storage is still writable after the restart");

  // ── The learner's DECLARED facts ──────────────────────────────────────────
  const prof = await authed(base, "/api/profile", l.id, l.secret);
  ok(prof.status === 200, `the learner still exists and the SAME capability still opens them (HTTP ${prof.status})`);
  ok(prof.body?.profile?.id === l.id, "and it is the same learner, not a recreated one");
  okSame(prof.body?.profile?.onboardedAt ?? null, canary.profile.onboardedAt, "their onboarding moment survived");
  okSame(prof.body?.profile?.subjectCourses?.maths?.spec ?? null, canary.profile.spec, "and the course they chose survived");

  // ── The EVIDENCE, which is the part a redeploy must never eat ─────────────
  const summary = await authed(base, "/api/evidence-summary", l.id, l.secret);
  ok(summary.status === 200, `their record is still readable (HTTP ${summary.status})`);
  okSame(summary.body?.totals?.answers ?? null, canary.answers, "the number of recorded answers is UNCHANGED — nothing was lost");
  const row = (summary.body?.concepts ?? []).find((c) => c.conceptId === canary.concept.id) ?? null;
  ok(row != null, "and the concept they practised is still in it");
  okSame(row?.attempts ?? null, canary.concept.attempts, "with the same number of attempts");
  // The model after a restart is REPLAYED from the events, not restored from a
  // snapshot, so the whole row has to come back identical — the attempt count
  // and every dimension band derived from it. A store that lost the ledger
  // would show a row full of nulls here, which is precisely the failure this
  // line exists to catch.
  okSame(row, canary.conceptRow, "and the concept's whole record is identical — attempts and every dimension band");

  const ledger = await authed(base, "/api/evidence", l.id, l.secret);
  ok(ledger.status === 200, `the ledger still reads (HTTP ${ledger.status})`);
  const events = (ledger.body?.events ?? []).map((e) => e.id).sort();
  okSame(events, canary.events, `every recorded event is still there (${events.length} of ${canary.events.length}) — none lost, none duplicated`);
  okSame(projectionOf(ledger.body), canary.projection, "and the projection is the same version");

  // ── The class, and the join code on it ────────────────────────────────────
  const classRead = await authedMe(base, "/api/classes", l.id, l.secret);
  ok(classRead.status === 200, `the class roster still reads (HTTP ${classRead.status})`);
  const found = (classRead.body?.classes ?? []).find((c) => c.id === canary.cls.id) ?? null;
  ok(found != null, "the class the learner created is still there");
  okSame(found?.joinCode ?? null, canary.cls.joinCode, "with the same join code — the thing a learner has written on the board");

  // ── The decision, still derived from that evidence ────────────────────────
  const next = await authed(base, "/api/next", l.id, l.secret);
  ok(next.status === 200, `the decision door still answers (HTTP ${next.status})`);
  ok(
    (next.body?.decision?.evidenceEvents ?? 0) >= canary.groundedEvents,
    "and still decides from the evidence it read before the restart",
    `${next.body?.decision?.evidenceEvents ?? 0} events ≥ ${canary.groundedEvents}`,
  );
  return { events };
}

// ── Cleanup ─────────────────────────────────────────────────────────────────
/** Take the whole record back off a deployment. `confirm=ERASE` is the route's
 *  own consent gate; it removes the profile, the evidence ledger and every
 *  class membership in one act. */
async function eraseRemote(base, l) {
  const r = await call(base, query("/api/profile", { id: l.id, secret: l.secret, confirm: "ERASE" }), { method: "DELETE" });
  return r.status === 200;
}

// ── The local run: two boots over one store, automatically ─────────────────
async function runLocal() {
  const PORT = Number(process.env.OPENMIND_PERSISTENCE_PORT ?? 4201);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "om-persist-"));
  const liveProfiles = path.join(ROOT, ".openmind-data", "profiles.json");
  let first = null;

  try {
    step("Boot 1 · the production artefact, on a store of its own");
    await prepareStandalone({ build: !process.env.OPENMIND_SKIP_BUILD });
    first = startStandalone({ port: PORT, dataDir });
    const readyA = await waitForReady(first);
    if (!readyA) throw new Error(`boot 1 never became ready at ${first.base}/api/ready`);
    ok(readyA.ready === true, "the artefact reports itself ready");
    ok(readyA.checks?.config?.ok === true, "with well-formed configuration", readyA.checks?.config?.code);

    const canary = await writeCanary(first.base, "local");

    // ── What is ON DISK, before the restart ─────────────────────────────────
    step("Boot 1 · what the store actually wrote");
    const profilesPath = path.join(dataDir, "profiles.json");
    const ledgerPath = path.join(dataDir, "evidence", `${canary.learner.id}.jsonl`);
    ok(fs.existsSync(profilesPath), "the profile is in the store the deployment was POINTED at");
    let onDiskId = false;
    try {
      onDiskId = Object.prototype.hasOwnProperty.call(JSON.parse(fs.readFileSync(profilesPath, "utf8")), canary.learner.id);
    } catch {
      /* reported below */
    }
    ok(onDiskId, "and it is keyed by the learner's own id");
    ok(fs.existsSync(ledgerPath), "the evidence ledger is a file in that store, not in memory");
    const ledgerBefore = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, "utf8") : "";
    const linesBefore = ledgerBefore.split("\n").filter((s) => s.trim().length > 0).length;
    okSame(linesBefore, canary.events.length, `and holds one line per event (${linesBefore})`);

    // ── The write went where it was told, and nowhere else ──────────────────
    // The failure this catches is quiet and total: if OPENMIND_DATA_DIR were
    // ignored, every assertion above would still pass (the store would be
    // written and read back perfectly) while the deployment wrote a classroom
    // into its own image — the exact thing that makes a redeploy eat it.
    let leakedIntoApp = false;
    try {
      const live = JSON.parse(fs.readFileSync(liveProfiles, "utf8"));
      leakedIntoApp = Object.prototype.hasOwnProperty.call(live, canary.learner.id);
    } catch {
      /* no live store, or unreadable — nothing leaked */
    }
    ok(!leakedIntoApp, "and NOTHING was written into the application's own default store — the data directory is honoured");

    // ── The restart ─────────────────────────────────────────────────────────
    step("Restart · the first process is stopped, then a second one starts");
    const pidBefore = first.pid;
    const code = await first.stop();
    ok(first.exited() !== null, "boot 1 exited, so the port cannot be answered by the old process", `exit ${code}`);
    first = startStandalone({ port: PORT, dataDir });
    ok(first.pid !== pidBefore, "boot 2 is a DIFFERENT process", `pid ${pidBefore} → ${first.pid}`);
    const readyB = await waitForReady(first);
    if (!readyB) throw new Error(`boot 2 never became ready at ${first.base}/api/ready`);
    ok(readyB.ready === true, "and it reports itself ready against the SAME store");

    const after = await verifyCanary(first.base, canary, { expectRestart: false });
    // `expectRestart` is false only for the uptime witness: a local restart
    // happens fast enough that `now - uptime` can land in the same second, so
    // the pid above is the witness here and the byte comparison below is the
    // proof. The remote mode turns the uptime witness back on, because there a
    // pid is not observable and a no-op "restart" is the real risk.

    // ── Byte-comparable: the ledger was not rewritten ───────────────────────
    step("Restart · the evidence file itself");
    const ledgerAfter = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, "utf8") : "";
    ok(ledgerAfter === ledgerBefore, "the ledger file is byte-identical after the restart");
    okSame(after.events, canary.events, "and the events the API returns are exactly the ones it returned before");

    console.log(`\n${"─".repeat(58)}`);
    console.log(`PERSISTENCE (local, across a real process restart): ${pass} passed, ${fail} failed`);
    console.log(`  store: ${dataDir}`);
    return fail;
  } finally {
    if (first) await first.stop().catch(() => {});
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch {
      /* leave it for the OS if a file is locked */
    }
  }
}

// ── The remote halves ──────────────────────────────────────────────────────
async function runRemoteWrite() {
  const base = REMOTE_BASE.replace(/\/+$/, "");
  console.log(`\nOpenMind — persistence, phase 1 (write) against ${base}`);
  const canary = await writeCanary(base, "remote");
  fs.writeFileSync(CANARY, JSON.stringify(canary, null, 2), { mode: 0o600 });
  console.log(`\n${"─".repeat(58)}`);
  console.log(`PERSISTENCE (phase 1 of 2): ${pass} passed, ${fail} failed`);
  console.log(`  a learner now exists on ${base} with ${canary.events.length} events in their ledger.`);
  console.log(`  identity file: ${CANARY}  (it holds a capability secret — do not commit it)`);
  console.log(`\n  NEXT: restart or redeploy the instance, then run`);
  console.log(`    OPENMIND_BASE=${base} npm run verify:persistence -- --verify`);
  return fail;
}

async function runRemoteVerify() {
  const base = REMOTE_BASE.replace(/\/+$/, "");
  console.log(`\nOpenMind — persistence, phase 2 (verify) against ${base}`);
  if (!fs.existsSync(CANARY)) {
    console.error(`\n✗ no phase-1 identity file at ${CANARY}.\n  Run the --write phase first, on the same machine.\n`);
    process.exit(2);
  }
  const canary = JSON.parse(fs.readFileSync(CANARY, "utf8"));
  if (canary.base !== base) {
    console.error(`\n✗ the identity file was written against ${canary.base}, not ${base}.\n  A learner is not the same object on two hosts; re-run the --write phase.\n`);
    process.exit(2);
  }

  await verifyCanary(base, canary, { expectRestart: true });

  // Only erase what survived verification: if this run failed, the record is
  // the evidence, and deleting it would destroy the thing worth looking at.
  if (fail === 0) {
    step("Cleanup");
    const gone = await eraseRemote(base, canary.learner);
    ok(gone, "the test learner's record is erased from the deployment (profile, ledger and class membership)");
    if (gone) fs.rmSync(CANARY, { force: true });
    if (canary.learner.email == null) {
      console.log("  · this learner was created with a capability secret, not a sign-up account — nothing was left behind");
    }
  } else {
    console.log(`\n  · NOT erased: the record is the evidence of this failure. Identity file kept at ${CANARY}.`);
  }

  console.log(`\n${"─".repeat(58)}`);
  console.log(`PERSISTENCE (across a real restart of ${base}): ${pass} passed, ${fail} failed`);
  return fail;
}

// ── Entry ──────────────────────────────────────────────────────────────────
console.log("\nOpenMind — persistence: does a learner survive a restart?");
console.log(`  mode: ${MODE}${REMOTE_BASE ? ` · target: ${REMOTE_BASE}` : " · store: a temp directory"}`);

if (MODE !== "local" && !REMOTE_BASE) {
  console.error(`\n✗ --write and --verify need a deployment to act on: set OPENMIND_BASE.\n  (With no OPENMIND_BASE this script runs the complete local test instead.)\n`);
  process.exit(2);
}

const failures = MODE === "remote-write" ? await runRemoteWrite() : MODE === "remote-verify" ? await runRemoteVerify() : await runLocal();

if (failures > 0) {
  console.error(`\n  A redeploy would lose: ${lost.slice(0, 6).join("; ")}${lost.length > 6 ? ` … (+${lost.length - 6} more)` : ""}\n`);
}
process.exit(failures > 0 ? 1 : 0);
