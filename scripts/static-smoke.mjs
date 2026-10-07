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
// The engine is published under a CONTENT-HASHED name (see
// scripts/build-static-app.mjs: a fixed URL let the browser's HTTP cache serve
// yesterday's engine after a deploy, which no service-worker cache key could
// fix). The stylesheet is hashed for the same reason, and it was the one that
// was still fixed — observed live — so it is asserted here beside the engine.
// So the files to load are discovered, not hardcoded — and the discovery
// itself is asserted below, because "the hashed file is what index.html names"
// is the whole mechanism.
const DOCS = path.join(ROOT, "docs");
const engineFile = fs
  .readdirSync(DOCS)
  .find((f) => /^openmind\.engine\.[a-f0-9]{12}\.js$/.test(f));
const appFile = fs.readdirSync(DOCS).find((f) => /^app\.[a-f0-9]{12}\.js$/.test(f));
const cssFile = fs.readdirSync(DOCS).find((f) => /^app\.[a-f0-9]{12}\.css$/.test(f));
const BUNDLE = path.join(ROOT, "docs", engineFile || "openmind.engine.js");

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

  // ── 6b. THE PAGE'S OWN SERVE PATH, DRIVEN THROUGH THE BUNDLE IT LOADS ────
  // The static build answers serves with NO SERVER: `docs/app.js` calls
  // `E.operations.servePractice`, which is the same operation
  // app/api/progress/route.ts calls. Before that module existed the page held
  // its own copy of the decision, and the copy had drifted — so the thing worth
  // gating is not "the file names the operation" (that is asserted in the
  // engine suite) but that the operation, AS PUBLISHED, does what the page
  // depends on: it stages the item it returns, it remembers what it has handed
  // out, and the next serve moves on instead of repeating.
  //
  // This is the closest thing to the browser a gate can be without a browser:
  // the file loaded here IS the file the page loads, running in plain Node.
  section("The published serve path: what the page actually calls");
  ok(typeof client.operations?.servePractice === "function",
    "the bundle exposes the serve operation the page calls");
  ok(typeof client.operations?.practiceAim === "function", "and the aim, so a surface can say why");
  {
    const pageState = profileFor();
    const seen = [];
    let stagedEveryTime = true;
    let reasonsNamed = true;
    for (let i = 0; i < 3; i++) {
      const r = client.operations.servePractice({ state: pageState, conceptId: "fractions", seed: `smoke-serve-${i}` });
      if (!r.ok) { ok(false, `a serve decided (draw ${i}: ${r.error})`); break; }
      const staged = pageState.practice?.fractions?.q;
      if (!staged || staged.id !== r.served.question.id) stagedEveryTime = false;
      if (typeof r.served.aim?.target?.reason !== "string") reasonsNamed = false;
      seen.push(client.answer.answerKey(r.served.question));
    }
    ok(stagedEveryTime, "every serve stages the item it returns — nothing can be answered that was never served");
    ok(reasonsNamed, "and every serve carries the reason the record moved the rung, from the record itself");
    ok(seen.length === 3 && new Set(seen).size === 3,
      `three serves on one concept are three DIFFERENT items (${seen.length} drawn, ${new Set(seen).size} distinct)`);
    const recorded = pageState.servedPractice?.fractions ?? [];
    ok(recorded.length === seen.length,
      `and every item handed out is remembered in the learner's own state (${recorded.length} keys)`);

    // ── A DUE REVIEW IS SERVED AS A REVIEW, AND THE PAGE CANNOT DECLARE ONE ─
    // Retention is only evidence when the recall was genuinely delayed. The
    // staging that decides it is written by the operation, so the page has no
    // way to ask for retention credit: it can only serve and find out.
    const aged = profileFor();
    for (const id of Object.keys(aged.progress)) delete aged.progress[id];
    aged.progress.fractions = {
      ...(aged.progress.fractions ?? {}),
      attempts: 5, correct: 5, streak: 5, mastery: 0.95, accuracy: 1,
      lastSeen: Date.now() - 60 * 24 * 60 * 60 * 1000,
    };
    const dueServe = client.operations.servePractice({ state: aged, conceptId: "fractions", seed: "smoke-due" });
    ok(dueServe.ok === true && dueServe.served.aim.due === true,
      "a concept the scheduler has aged into a review is served AS a review");
    ok(aged.retrievalStage?.fractions?.questionId === dueServe.served.question.id,
      "and the stage that will stamp the answer `retrieval` is written by the operation, not by a caller");

    // ── WHAT AN ANSWER DEMONSTRATED, THROUGH THE BUNDLE THE PAGE LOADS ──────
    // The page writes its own answers, so the claim "this was independent" is
    // made HERE, on the learner's device — which is exactly why the rule cannot
    // be the page's: the same operation the server grades by decides it.
    const att = profileFor();
    const aServe = client.operations.servePractice({ state: att, conceptId: "decimals", seed: "smoke-attrib" });
    ok(aServe.ok === true, "a serve to attribute an answer against");
    const qid = aServe.served.question.id;
    const fresh = client.operations.answerDisposition(att, "decimals", qid);
    ok(fresh.mode === "independent" && fresh.source === "practice" && fresh.hints === 0,
      `training an unaided answer is independent practice (${fresh.mode}/${fresh.source}, ${fresh.hints} hints)`);
    ok(client.operations.noteHint(att, qid) === 1,
      "and a hint taken is counted by the operation, in the ledger the grader reads");
    const helped = client.operations.answerDisposition(att, "decimals", qid);
    ok(helped.mode === "guided" && helped.hints === 1,
      `so the SAME answer is guided once help was given (${helped.mode}, ${helped.hints}) — a page cannot declare its way to independence`);
  }

  // ── 7. The published TUTOR is the source's tutor ────────────────────────
  // The bundle is GENERATED from lib/, so the offline app has ONE tutor
  // implementation, not two. What it can have is a STALE one: it is only as
  // current as the last build, and a bundle built before a tutor fix shipped
  // the pre-fix replies to every learner with no connection — the canned,
  // identical paragraph on every message that the tutor directive forbids.
  // Nothing caught it, because nothing compared the artifact with its source.
  //
  // This compares them as BEHAVIOUR, not as markers in a file: the same
  // messages, the same screen context and the same language, answered by the
  // published bundle and by the freshly compiled mirror, and required to be the
  // same sentence. A marker check can be satisfied by a comment; a reply cannot.
  section("The published tutor is the source's tutor, not a stale copy");
  const sourceSocratic = require(path.join(MIRROR, "socratic.js"));
  const TUTOR_CONCEPT = "place-value";
  // The screen the learner is looking at, handed to both builds exactly as the
  // exercise panel hands it to the server.
  const TUTOR_CTX = { question: "What is the value of the tens digit in 915?", serveReason: "stretch", hitIds: [] };
  const TUTOR_INPUTS = [
    ["What is this?", "a genuine question"],
    ["I don't understand it.", "not understanding"],
    ["Give me a hint.", "a request for a hint"],
    ["Why is my answer wrong?", "a why-question"],
    ["I think you just add the two numbers together and that's the answer.", "a stated method"],
    ["What is the capital of France?", "nothing to do with this question"],
    ["Can you explain quadratics to me instead?", "another concept"],
  ];
  for (const lang of ["en", "ar"]) {
    for (const [message, label] of TUTOR_INPUTS) {
      const offline = client.socratic.socraticReply(TUTOR_CONCEPT, message, lang, TUTOR_CTX);
      const source = sourceSocratic.socraticReply(TUTOR_CONCEPT, message, lang, TUTOR_CTX);
      ok(offline === source, `${lang}: ${label} is answered identically offline and from source`);
    }
  }
  // And the distinctions themselves, asserted ON THE BUNDLE — the surface a
  // learner actually has when the connection is gone. These are the four fixes
  // this pin exists to keep: a why-question is not a request for the answer, a
  // stated method is read back and tested, an unrelated message is not met with
  // the Socratic prompt for this question, and no reply repeats a context line
  // the surface already renders under it.
  const offlineReply = (m) => client.socratic.socraticReply(TUTOR_CONCEPT, m, "en", TUTOR_CTX);
  const whyReply = offlineReply("Why is my answer wrong?");
  const claimReply = offlineReply("I think you just add the two numbers together and that's the answer.");
  const unrelatedReply = offlineReply("What is the capital of France?");
  const claimLead = require(path.join(MIRROR, "i18n.js")).translator("en")("soc.claimLead");
  ok(whyReply !== claimReply,
    "offline: asking WHY and stating a method are not the same reply");
  ok(claimReply.includes(claimLead) && claimReply.includes("add the two numbers"),
    "offline: a stated method is read back to the learner and handed to them to test");
  ok(!/hand over the answer/i.test(whyReply),
    "offline: a why-question is answered as a request for REASONING, not refused as a request for the answer");
  ok(!/restate the question in your own words/i.test(unrelatedReply),
    "offline: an unrelated message is told plainly that the tutor can only follow this question");
  ok(TUTOR_INPUTS.every(([m]) => !/OpenMind served this one to/.test(offlineReply(m))),
    "offline: no reply restates the serve reason the surface already shows under it");
  const distinctOffline = new Set(TUTOR_INPUTS.map(([m]) => offlineReply(m))).size;
  ok(distinctOffline >= 5,
    `offline: the tutor does not repeat one canned paragraph (${distinctOffline}/${TUTOR_INPUTS.length} distinct replies)`);
  // The sentences the tutor composes must also RESOLVE in the bundle's own
  // dictionaries: a stale bundle can carry the new code with the old dictionary,
  // and a missing key renders as the raw key on a learner's screen.
  const bundleT = client.i18n.translator("en");
  const sourceT = require(path.join(MIRROR, "i18n.js")).translator("en");
  const tutorKeys = ["soc.claimLead", "soc.claimQ", "soc.serveWhy", "soc.refuse", "soc.hintLead", "soc.unclear", "soc.restate"];
  const unresolved = tutorKeys.filter((k) => bundleT(k) === k);
  ok(unresolved.length === 0,
    `offline: every sentence the tutor composes resolves in the bundle's dictionaries (unresolved: ${unresolved.join(", ") || "none"})`);
  ok(tutorKeys.every((k) => bundleT(k) === sourceT(k)),
    "offline: and each is the same text the source ships — no dictionary drift either");

  // ── 8. The artifact itself ──────────────────────────────────────────────
  section("The published artifact");
  const code = fs.readFileSync(BUNDLE, "utf8");
  ok(/GENERATED FILE/.test(code), "the bundle says it is generated");

  // ── THE ASSET URLS THEMSELVES ────────────────────────────────────────────
  //
  // THE FAILING SCENARIO, KEPT: every build published its engine at
  // `openmind.engine.js`. GitHub Pages serves it with `cache-control: max-age=600`,
  // so after a deploy a returning learner's HTTP cache still held the PREVIOUS
  // 2.4 MB engine and the page ran it — old dictionaries, old questions, old
  // claims — while the service worker's content-hashed CACHE NAME said the build
  // was current. The cache key versions the worker's cache; it never touched the
  // HTTP cache sitting in front of it. Observed live, not theorised.
  //
  // It could also feed itself: the incoming worker's `install` `addAll` is
  // handled by the OUTGOING worker, which is cache-first, so the new worker
  // could pre-cache the OLD bytes under the NEW cache name and evict the
  // genuinely-old cache — leaving a learner stuck on a build the cache claimed
  // was current, with no way out but a manual cache clear.
  //
  // A hash in the FILENAME removes the window instead of managing it: a new
  // build's engine is a URL no cache has ever held.
  section("The published asset URLs are content-hashed");
  const shippedHtml = fs.readFileSync(path.join(ROOT, "docs", "index.html"), "utf8");
  const shippedSw = fs.readFileSync(path.join(ROOT, "docs", "sw.js"), "utf8");
  ok(!!engineFile, `the engine is published under a hashed name (docs/${engineFile || "MISSING"})`);
  ok(!!appFile, `the app script is published under a hashed name (docs/${appFile || "MISSING"})`);
  ok(!!cssFile, `the stylesheet is published under a hashed name (docs/${cssFile || "MISSING"})`);
  ok(shippedHtml.includes(`src="${engineFile}"`), "index.html names the hashed engine, so a new build is a new URL");
  ok(shippedHtml.includes(`src="${appFile}"`), "index.html names the hashed app script");
  ok(shippedHtml.includes(`href="${cssFile}"`), "index.html names the hashed stylesheet");
  ok(!/src="(?:app|openmind\.engine)\.js"/.test(shippedHtml),
    "index.html references no fixed (unversioned) asset URL");
  ok(!/href="app\.css"/.test(shippedHtml),
    "index.html references no fixed stylesheet URL — the one that survived the fix and rendered the previous design on the first visit after a deploy");
  ok(!fs.existsSync(path.join(ROOT, "docs", "openmind.engine.js")),
    "the legacy fixed-name engine is gone, so nothing can fetch yesterday's bytes by that URL");
  ok(shippedSw.includes(`./${engineFile}`) && shippedSw.includes(`./${appFile}`),
    "the worker caches the hashed assets by their real names");
  ok(shippedSw.includes(`./${cssFile}`), "the worker caches the hashed stylesheet by its real name");
  ok(!shippedSw.includes('"./app.js"') && !shippedSw.includes('"./openmind.engine.js"'),
    "the worker caches no fixed-name script");
  ok(!shippedSw.includes('"./app.css"'),
    "the worker caches no fixed-name stylesheet — cache-first plus a fixed URL is how a returning learner kept the old design");
  // index.html is the only file whose URL never changes, so it is the only one
  // that must not be cache-first, or a returning learner never discovers the
  // new build at all.
  ok(/endsWith\("\/"\)|endsWith\("\/index\.html"\)/.test(shippedSw),
    "the worker treats index.html as the discovery file");
  const netFirst = shippedSw.indexOf("index.html") > -1 && /fetch\(req\)[\s\S]{0,400}caches\.match\(req\)/.test(shippedSw);
  ok(netFirst, "index.html is served network-first and falls back to the cache when offline");
  ok(shippedSw.includes('caches.match("./")'),
    "the directory request still resolves offline from the cached shell");
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

  // ── 9. The landing page's claims, which are the first thing a visitor reads.
  //
  // THE FAILING SCENARIO, KEPT: the static build's dictionary is a SEPARATE key
  // family from the Next app's, and it was written before §landing forbade
  // unbacked marketing. When the app's headline was replaced, this one was not,
  // so the published page still opened with
  //
  //   "Every student deserves a world-class tutor."   (home.heroTitle)
  //   "...on any phone, even offline."                 (home.heroSub)
  //   "A world-class tutor for every student."        (brand.tagline)
  //   "Server-graded practice"                         (home.offline)
  //
  // The last one is the reason this is a gate and not a style note: `home.offline`
  // sits in the dictionary of the build that has NO SERVER, and told the learner
  // their answers were graded on a machine they do not control. On this build
  // their own browser grades them and keeps them. The learner was being told
  // something false about where their own schoolwork lives.
  //
  // Read through the PUBLISHED bundle's translator, not through lib/i18n.ts: the
  // claim a visitor meets is the one in the bytes that shipped, and a fix that
  // never got rebuilt must fail here rather than pass against the source.
  section("The landing page tells the learner the truth");
  const landT = client.i18n.translator("en");
  const CLAIMS = {
    "home.heroTitle": "a headline the software can back up",
    "home.heroSub": "a pitch without unbacked absolutes",
    "brand.tagline": "a brand line without a quality claim",
    "home.offline": "where grading actually happens",
  };
  const FORBIDDEN = [
    ["world-class", "a quality claim the product has not earned"],
    ["Server-graded", "false about a build with no server"],
    ["on any phone", "untested at the widths that matter"],
    ["free, forever", "a promise no code can keep"],
  ];
  for (const [key, why] of Object.entries(CLAIMS)) {
    const v = landT(key);
    ok(v !== key, `landing: ${key} resolves in the published dictionary (${why})`);
    const bad = FORBIDDEN.filter(([needle]) => v.includes(needle)).map(([, why2]) => why2);
    ok(bad.length === 0,
      `landing: ${key} makes no unbacked claim${bad.length ? " — " + bad.join("; ") : ""}`);
  }
  // The key named `offline` must not assert a server: on this build the browser
  // grades. Asserted separately because it is the one that misled a learner.
  ok(!/server/i.test(landT("home.offline")),
    "landing: the offline badge does not claim server grading on a build with no server");
  // Every language carries the same four, so a learner reading the page in
  // Tamil is not the one who is told the truth.
  let translatedClaims = 0;
  for (const code of client.i18n.LANG_CODES) {
    if (code === "en") continue;
    const t = client.i18n.translator(code);
    for (const key of Object.keys(CLAIMS)) {
      const v = t(key);
      if (v === key) continue; // falls back rather than lying — counted below
      if (!/world-class|Server-graded|on any phone|free, forever/.test(v)) translatedClaims++;
    }
  }
  ok(translatedClaims === (client.i18n.LANG_CODES.length - 1) * Object.keys(CLAIMS).length,
    `landing: all ${Object.keys(CLAIMS).length} claims are free of the old copy in all ${client.i18n.LANG_CODES.length} languages (${translatedClaims} clean)`);

  // ── BYTE-STABLE, which is what makes the cache key mean something ─────────
  // The engine used to carry `meta.builtAt`. Because `shellVersion` hashes these
  // exact bytes, a build clock here made the worker's cache name change on EVERY
  // rebuild — including one that changed nothing — and `activate` then evicted
  // the cached shell, re-downloading the whole engine on every returning
  // learner's next visit. A build clock is the entire class of that defect, so
  // its return fails here instead of on someone's data bundle.
  const clocks = code.match(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g) ?? [];
  ok(clocks.length === 0,
    `the engine carries no build clock (${clocks.length ? clocks.slice(0, 2).join(", ") : "none"})`);

  // ── The offline shell's version, which is the one thing a human used to have
  // to remember. The worker is cache-first, so its cache KEY is what decides
  // whether a returning learner gets this build or the previous one. Here the
  // key is recomputed from the artifacts themselves and required to match what
  // shipped: a sw.js that was not regenerated after a change to the engine (or
  // the page, or the styles) fails the gate instead of silently serving
  // yesterday's grader from every returning learner's disk.
  const SHELL = ["index.html", engineFile || "openmind.engine.js", appFile || "app.js", cssFile || "app.css"];
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
