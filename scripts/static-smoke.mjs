// ─────────────────────────────────────────────────────────────────────────────
// THE STATIC BUILD'S PARITY PROOF.
//
// `docs/openmind.engine.js` is a second way to run OpenMind's engines, and a
// second way to run them is a second chance to run them DIFFERENTLY. So this
// test does not check the static build against expectations. It takes ONE
// learner history and puts it through both write paths:
//
//   · the server's, exactly as a route handler does it — lib/server/projection
//     over the JSONL ledger on a real (temporary) disk;
//   · the static build's, exactly as the published page does it — the BUNDLED
//     lib/ledger.ts over the engine's own in-memory LedgerStore, which is what
//     the page's localStorage hydrates.
//
// and requires the two to arrive at the same learner model, the same next
// action and the same citations, field for field. If they ever disagree, the
// build is wrong, not the test.
//
// It also holds three properties a browser click-through cannot demonstrate:
// a re-delivered event counts ONCE, an event that arrives after newer ones
// neither reorders nor corrupts the record, and an event about another learner
// is refused by the store rather than written.
//
// It also holds the offline shell's version invariant: the worker's cache key
// is a hash of the files it caches, recomputed here from the shipped artifacts,
// so a worker that was not regenerated cannot be committed.
//
// WHAT THIS DOES NOT PROVE, stated plainly: it does not drive a browser, and it
// does not run the service worker. The worker's cache-first handler itself, and
// a real localStorage, are exercised only by loading docs/openmind.html in an
// actual browser; nothing here covers them.
//
// Prerequisite: `node scripts/build-static-app.mjs` (the bundle) and a compiled
// `.verify` mirror (npm run verify). The Pages workflow runs both before this.
//
// Run: node scripts/static-smoke.mjs      (npm run verify:static)
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const MIRROR = path.join(ROOT, ".verify");
const BUNDLE = path.join(ROOT, "docs", "openmind.engine.js");

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else {
    fail++;
    console.error("  ✗ FAIL:", msg);
  }
}
function section(name) {
  console.log(`\n▸ ${name}`);
}

if (!fs.existsSync(MIRROR)) {
  console.error(`missing ${MIRROR} — run \`npm run verify\` first`);
  process.exit(1);
}
if (!fs.existsSync(BUNDLE)) {
  console.error(`missing ${BUNDLE} — run \`node scripts/build-static-app.mjs\` first`);
  process.exit(1);
}

// A temporary home for the server's ledger, before anything reads DATA_DIR.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "om-static-"));
process.env.OPENMIND_DATA_DIR = tmp;

const server = {
  store: require(path.join(MIRROR, "server", "store.js")),
  projection: require(path.join(MIRROR, "server", "projection.js")),
  evidence: require(path.join(MIRROR, "server", "evidence.js")),
};
const client = require(BUNDLE);

const LEARNER = "static-smoke-learner";
const at = Date.now() - 3 * 24 * 60 * 60 * 1000;

/** One learner's afternoon, expressed as the events the app would mint. The
 *  answers are deliberately mixed so the decision has something to say. */
function events(learnerId = LEARNER) {
  const out = [];
  const answers = [
    ["fractions", true], ["fractions", false], ["fractions", true],
    ["decimals", false], ["decimals", false], ["decimals", false],
    ["standard-form", true], ["standard-form", false], ["standard-form", false],
    ["standard-form", false],
  ];
  answers.forEach(([conceptId, correct], i) => {
    out.push(client.evidence.answerEvidence({
      learnerId,
      at: at + i * 60_000,
      source: "practice",
      subject: "maths",
      conceptId,
      specificationId: "uk-gcse",
      questionId: `${conceptId}:q${i}`,
      correct,
      chosen: correct ? 0 : 1,
      mode: "independent",
      hints: 0,
      ms: 9000,
      tags: conceptId === "standard-form" ? ["sf-sig"] : [],
    }));
  });
  return out;
}

function profileFor() {
  return server.store.newProfileState(LEARNER, {
    handle: "Smoke",
    country: "GB",
    subjects: ["maths"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } },
    spec: "uk-gcse",
    specLevel: "higher",
    timePerDay: 30,
    onboardedAt: at,
  });
}

/** What a surface actually shows: the action's own words, and the answers the
 *  decision cites. Compared between the two builds, not against a literal. */
function presented(state, events) {
  const ctx = client.decision.decisionContext(state, events);
  const action = client.decision.decideOne(ctx, { title: (id) => client.contentI18n.ctitle("en", id) });
  if (!action) return null;
  const cites = client.evidenceView.citationsFor(action.evidenceIds, events, {
    titleFor: (id) => client.contentI18n.ctitle("en", id),
    t: client.i18n.translator("en"),
    locale: "en",
  });
  return {
    kind: action.kind,
    conceptId: action.conceptId,
    title: action.title,
    reason: action.reason,
    why: action.why,
    minutes: action.minutes,
    urgency: action.urgency,
    expectedOutcome: action.expectedOutcome,
    basis: action.basis,
    plan: action.plan,
    cited: cites.map((c) => `${c.concept}|${c.kind}|${c.correct}|${c.when}`),
    evidenceIds: [...action.evidenceIds].sort(),
  };
}

/** The fields a projection is allowed to differ on: everything the ledger owns,
 *  per concept, plus the concept set itself. */
function modelShape(state) {
  const out = {};
  for (const id of Object.keys(state.progress).sort()) {
    const p = state.progress[id];
    out[id] = {
      attempts: p.attempts, correct: p.correct, streak: p.streak, accuracy: p.accuracy,
      mastery: p.mastery, lastSeen: p.lastSeen, totalMs: p.totalMs, answers: p.answers,
      misconceptions: p.misconceptions ?? null,
      independent: p.independent ?? null,
      transfer: p.transfer ?? null,
      retention: p.retention ?? null,
    };
  }
  return out;
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  const all = events();

  // ── 1. The server's path: JSONL on a temporary disk ──────────────────────
  section("The server's write path (JSONL + projection)");
  const serverState = profileFor();
  await server.projection.commitAndProject(LEARNER, serverState, all);
  const onDisk = server.evidence.readEvidence(LEARNER);
  ok(onDisk.length === all.length, `the ledger holds every event (${onDisk.length}/${all.length})`);
  ok(onDisk.map((e) => e.id).join() === all.map((e) => e.id).join(), "the ledger preserves append order");

  // ── 2. The static build's path: the bundle + its own store ───────────────
  section("The static build's write path (bundled ledger + memory store)");
  const staticState = profileFor();
  const store = client.ledger.memoryLedger();
  client.ledger.commitAndProject(LEARNER, staticState, all, store);
  const held = store.read(LEARNER);
  ok(held.length === all.length, `the static ledger holds every event (${held.length}/${all.length})`);

  // ── 3. Parity: the two builds must be indistinguishable from outside ─────
  section("Parity: one history, two builds, one answer");
  ok(same(modelShape(serverState), modelShape(staticState)),
    "both builds produce the same learner model for the same history");
  const sp = presented(serverState, onDisk);
  const stp = presented(staticState, held);
  ok(same(sp, stp), "both builds present the same next action, reason, plan and citations");
  ok(sp !== null && sp.conceptId === "standard-form",
    `the decision names the concept the evidence is worst on (got ${sp && sp.conceptId})`);
  ok(sp !== null && /Standard form/.test(sp.title + sp.reason),
    `the decision names the belief or the concept in words, not a key (${sp && sp.reason})`);
  ok(sp !== null && !/\bmc\.[a-z-]+/.test(sp.reason + sp.title),
    "no raw i18n key reaches a learner's decision sentence");

  // ── 4. Idempotence: a re-delivered batch counts once ─────────────────────
  section("A duplicated delivery counts once, in both builds");
  const serverBefore = modelShape(serverState);
  const staticBefore = modelShape(staticState);
  const dupServer = await server.projection.commitAndProject(LEARNER, serverState, all);
  const dupStatic = client.ledger.commitAndProject(LEARNER, staticState, all, store);
  ok(dupServer.accepted.length === 0 && dupServer.duplicates.length === all.length,
    `the server reports every re-delivered event as a duplicate (${dupServer.duplicates.length})`);
  ok(dupStatic.accepted.length === 0 && dupStatic.duplicates.length === all.length,
    `the static store does the same (${dupStatic.duplicates.length})`);
  ok(server.evidence.readEvidence(LEARNER).length === all.length, "the ledger did not grow");
  ok(store.read(LEARNER).length === all.length, "the static ledger did not grow");
  ok(same(serverBefore, modelShape(serverState)) && same(staticBefore, modelShape(staticState)),
    "neither model moved");
  ok(same(presented(serverState, server.evidence.readEvidence(LEARNER)), sp),
    "the recommendation is unchanged by the duplicate");

  // ── 5. Out of order: late arrivals do not reorder or corrupt ────────────
  section("An out-of-order delivery leaves the record identical");
  // Two learners, one history: A takes the events in order, B takes them in
  // reverse. The store keeps ARRIVAL order (it is append-only and must not
  // reorder a file), so the question is whether anything READ of the ledger
  // depends on it. `orderEvents` is what answers that, and both builds use it.
  // ONE history, delivered two ways. The same events go to two independent
  // stores for the same learner — forward into one, reversed into the other —
  // so the only variable is arrival order. (Event ids are part of the events;
  // minting a second set would compare two different histories and prove
  // nothing.)
  const reversed = [...all].reverse();
  const aState = profileFor();
  const aStore = client.ledger.memoryLedger();
  client.ledger.commitAndProject(LEARNER, aState, all, aStore);
  const bState = profileFor();
  const bStore = client.ledger.memoryLedger();
  client.ledger.commitAndProject(LEARNER, bState, reversed, bStore);
  ok(same(modelShape(aState), modelShape(bState)),
    "a reversed arrival order yields the same model");
  ok(same(presented(aState, aStore.read(LEARNER)), presented(bState, bStore.read(LEARNER))),
    "a reversed arrival order yields the same recommendation, citations and all");
  const reordered = client.evidence.orderEvents(bStore.read(LEARNER));
  ok(reordered.map((e) => e.id).join() === all.map((e) => e.id).join(),
    "reading the ledger orders it by the server's clock, not by arrival");
  // The SERVER's path must agree too: a real ledger file whose lines arrived in
  // reverse order has to project to the same model as one that arrived in
  // order. This is the claim the offline-sync requirement is actually about.
  const rebrand = (id) => all.map((e) => ({ ...e, learnerId: id }));
  const fwd = server.store.newProfileState("static-fwd-learner", { country: "GB", subjects: ["maths"], spec: "uk-gcse", specLevel: "higher" });
  const rev = server.store.newProfileState("static-rev-learner", { country: "GB", subjects: ["maths"], spec: "uk-gcse", specLevel: "higher" });
  await server.projection.commitAndProject("static-fwd-learner", fwd, rebrand("static-fwd-learner"));
  await server.projection.commitAndProject("static-rev-learner", rev, rebrand("static-rev-learner").reverse());
  ok(same(modelShape(fwd), modelShape(rev)),
    "the server's replay is arrival-order independent too");
  ok(same(modelShape(rev), modelShape(staticState)),
    "and it agrees with the static build on the same reversed history");
  ok(server.evidence.readEvidence("static-rev-learner").length === all.length,
    "the late-arriving ledger kept every event (append-only, never rewritten)");

  // ── 6. The store refuses another learner's event ────────────────────────
  section("The ledger is the authorisation boundary's last line");
  let refused = false;
  try {
    store.append(LEARNER, [client.evidence.answerEvidence({
      learnerId: "somebody-else", at: Date.now(), source: "practice", subject: "maths",
      conceptId: "fractions", specificationId: null, questionId: "x", correct: true,
      chosen: 0, mode: "independent", hints: 0,
    })]);
  } catch {
    refused = true;
  }
  ok(refused, "an event about another learner is refused, not written");
  let unsafe = false;
  try {
    store.append("../etc/passwd", []);
  } catch {
    unsafe = true;
  }
  ok(unsafe, "an id that is not a safe key is refused");

  // ── 7. The artifact itself ──────────────────────────────────────────────
  section("The published artifact");
  const code = fs.readFileSync(BUNDLE, "utf8");
  ok(/GENERATED FILE/.test(code), "the bundle says it is generated");
  const bare = [...code.matchAll(/require\(\s*"([^"']+)"\s*\)/g)]
    .map((m) => m[1])
    .filter((s) => !s.startsWith(".") && s !== "module" && s !== "exports");
  // The bundle's own UMD wrapper mentions `module`/`exports`, which is not a
  // require; anything else bare would be a Node builtin on a browser path.
  ok(bare.filter((s) => /^(node:|fs|crypto|path|os|child_process)$/.test(s)).length === 0,
    `no Node builtin is required by the bundle (found: ${[...new Set(bare)].join(", ") || "none"})`);
  const modules = Number((code.match(/meta: \{ modules: (\d+)/) || [])[1] || 0);
  const defs = (code.match(/__def\("/g) || []).length;
  ok(modules > 0 && defs === modules + 1,
    `every module in the bundle is defined once (${defs} definitions for ${modules} modules + the entry)`);
  ok(fs.existsSync(path.join(ROOT, "docs", "openmind.html")), "the single-file build exists too");

  // ── The offline shell's version, which is the one thing a human used to have
  // to remember. The worker is cache-first, so its cache KEY is what decides
  // whether a returning learner gets this build or the previous one. Here the
  // key is recomputed from the artifacts themselves and required to match what
  // shipped: a sw.js that was not regenerated after a change to the engine (or
  // the page, or the styles) fails the gate instead of silently serving
  // yesterday's grader from every returning learner's disk.
  const SHELL = ["index.html", "app.css", "app.js", "openmind.engine.js"];
  const hash = crypto.createHash("sha256");
  for (const f of SHELL) {
    hash.update(f);
    hash.update(fs.readFileSync(path.join(ROOT, "docs", f)));
  }
  const version = hash.digest("hex").slice(0, 12);
  const sw = fs.readFileSync(path.join(ROOT, "docs", "sw.js"), "utf8");
  ok(sw.includes(`const CACHE = "openmind-static-${version}"`),
    `the offline cache is keyed by the artifacts it caches (expected openmind-static-${version})`);
  ok(/GENERATED by/.test(sw), "the worker says it is generated rather than hand-edited");
  // `"./"` is the request a browser makes for the directory itself; without it
  // the app cannot open offline, which is the whole point of the worker.
  ok(sw.includes(`"./"`), "the worker caches the directory request the app actually opens with");
  for (const f of SHELL) ok(sw.includes(`"./${f}"`), `the worker caches ./${f}`);
  ok(!/openmind-static-v\d/.test(sw), "no hand-numbered cache name survives in the worker");

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
