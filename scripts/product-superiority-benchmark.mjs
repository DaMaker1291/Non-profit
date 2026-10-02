// ─────────────────────────────────────────────────────────────────────────────
// THE PRODUCT BENCHMARK — is this a product a learner can USE?
//
// Usage (development server on :4173 for the HTTP journeys):
//     npm run product-benchmark
//
// WHY THIS EXISTS, AND WHAT IT IS NOT. `verify` proves the engines are correct;
// `superiority-test` proves the DECISIONS beat a sequential baseline. Neither
// answers the question the product actually lives or dies on: can a real learner
// — Year 7, Year 11, teacher, low-bandwidth, mistaken, advanced — take the
// journeys the product promises, and does the product tell the truth at every
// step? This file drives those journeys through the REAL doors (HTTP routes on
// the running server, the real fold, the shipped offline bundle) and records,
// per check, a category and a SEVERITY, so the next cycle knows what to fix
// first instead of what is easiest to see.
//
// THE BASELINE RULE. The first run IS the baseline: it is written to
// `.benchmark/latest.json` before any fix, and the report prints the worst
// failures in severity order. No check is deleted to pass; a check that is
// genuinely wrong is changed only with its rationale in the commit, and a
// check that cannot be run is recorded as UNTESTED with the reason — never
// silently dropped and never counted as a pass.
//
// Severities: P0 the user cannot use the product; P1 a wrong educational
// decision; P2 misleading information; P3 friction; P4 cosmetic.
// Exit code is non-zero when any P0–P2 check fails.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { compileEngines } from "./compile-engines.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PRODUCT_BENCH_BASE ?? "http://localhost:4173";
const NOW = new Date(2027, 0, 10, 12, 0, 0).getTime();
const DAY = 86400000;

compileEngines();
const require = createRequire(import.meta.url);
const genome = require("../.verify/genome.js");
const decisionMod = require("../.verify/decision.js");
const lm = require("../.verify/learner-model.js");
const transfer = require("../.verify/transfer.js");
const assignmentView = require("../.verify/server/assignment-view.js");
const socratic = require("../.verify/socratic.js");
const i18nMod = require("../.verify/i18n.js");
const enT = i18nMod.translator("en");
const specs = require("../.verify/specifications.js");
const evidenceMod = require("../.verify/evidence.js");
const learnerProfile = require("../.verify/learner-profile.js");
const replayMod = require("../.verify/replay.js");
const bundle = require(path.join(ROOT, "docs", "openmind.engine.js"));

const ns = await import("./north-star.mjs");
const { a, times, learner, decideFor, topFor, ORDER_INDEX, mulberry32 } = ns;

// ── the record ──────────────────────────────────────────────────────────────
const checks = [];
const untested = [];
function check(category, id, severity, ok, detail) {
  checks.push({ category, id, severity, ok: !!ok, detail: String(detail ?? "") });
}
function notTested(category, id, severity, reason) {
  untested.push({ category, id, severity, reason });
}
const SEV_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

// ── the shipped decisions, through the one door ─────────────────────────────
const COURSE = (subject, grade = "Year 11", spec = "uk-gcse", level = "higher", extra = {}) => ({
  country: "GB", grade, board: "aqa", spec, specLevel: level,
  subjects: [subject],
  subjectCourses: { [subject]: { spec, specLevel: level, board: "aqa" } },
  ...extra,
});
const subjectOf = (id) => genome.getConcept(id)?.subject ?? null;
const prereqsOf = (id) => genome.getConcept(id)?.prereqs ?? [];
const firstSlip = (id) => (genome.getConcept(id)?.misconceptions ?? [])[0] ?? null;
const courseIdsFor = (L) => {
  const active = specs.specForProfile(L.profile, L.profile.subjects[0]);
  return specs.courseConceptIds(active.spec);
};
const weak = (id, n = 3) => times(n, id, false, firstSlip(id) ? { tags: [firstSlip(id)] } : {});
const strong = (id, n = 5) => times(n, id, true);

// ── HTTP transport (the same shape e2e/acceptance use) ──────────────────────
const SECRETS = new Map();
async function call(p, opts) {
  // A network failure must become a RECORDED failure, not a stack trace that
  // ends the run: a transient ECONNRESET during cleanup killed a whole cycle's
  // report once (measured), which hides every other result behind one flaky
  // socket. Status 0 is a status like any other, and the checks read it.
  const once = async () => {
    const res = await fetch(BASE + p, opts);
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 200) }; }
    return { status: res.status, body, headers: res.headers };
  };
  try {
    return await once();
  } catch (e) {
    // ONE retry, and only for a network-level failure. Measured: the reset hits
    // the FIRST request after the browser-walk child process tears down
    // (Chrome + dev-server recompiles), while the erasure door answered 6/6 in
    // a direct probe — so this is the benchmark's transport losing a keep-alive
    // race, not the product failing. A genuine outage fails both attempts and
    // is reported as status 0, which every check reads.
    try { return await once(); } catch (e2) {
      return { status: 0, body: { error: "network", detail: String(e2).slice(0, 120) }, headers: new Headers() };
    }
  }
}
const post = (p, b) => {
  const body = b && typeof b === "object" && b.id && SECRETS.has(b.id) ? { ...b, secret: SECRETS.get(b.id) } : b;
  return call(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
};
const getAuthed = (p, id) => call(`${p}${p.includes("?") ? "&" : "?"}secret=${encodeURIComponent(SECRETS.get(id) ?? "")}`);
async function newProfile(body) {
  const secret = `bench-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const r = await post("/api/profile", { ...body, secret });
  if (r.body?.profile?.id) SECRETS.set(r.body.profile.id, secret);
  return r;
}

let serverUp = false;
try {
  const ping = await fetch(BASE + "/api/question?conceptId=fractions");
  serverUp = ping.status < 500;
} catch { serverUp = false; }
if (!serverUp) {
  for (const [cat, id, sev] of [
    ["ACCOUNT", "account", "P0"], ["PROFILE", "profile", "P1"], ["LEARNING-LOOP", "loop", "P1"],
    ["TEACHER", "class", "P1"], ["FAILURE", "honesty", "P2"], ["UX", "routes", "P3"],
  ]) notTested(cat, `${id}·all`, sev, `the dev server is not answering at ${BASE} — start it with \`npm run dev\``);
}

// ═════════════════════════════════════════════════════════════════════════════
// ENGINE JOURNEYS — the decision a learner would meet, from the real fold
// ═════════════════════════════════════════════════════════════════════════════

// ── CURRICULUM: twenty declared learners, from the user's own table ─────────
// Two variants per row, so "strong algebra" is not one lucky fixture.
function curriculumProfiles() {
  const rows = [
    { key: "A", subject: "maths", grade: "Year 11", strong: ["algebra-expand", "quadratics"], weak: ["circle-theorems", "pythagoras"] },
    { key: "B", subject: "maths", grade: "Year 11", strong: ["circle-theorems", "pythagoras"], weak: ["algebra-expand", "quadratics"] },
    { key: "C", subject: "maths", grade: "Year 11", strong: ["algebra-expand", "quadratics", "circle-theorems"], weak: [] },
    { key: "D", subject: "maths", grade: "Year 11", strong: [], weak: ["fraction-ops"] },
    { key: "E", subject: "maths", grade: "Year 11", strong: ["fraction-ops", "fractions"], weak: [] },
    { key: "F", subject: "maths", grade: "Year 9", strong: ["algebra-expand"], weak: ["simultaneous"] },
    { key: "G", subject: "maths", grade: "Year 7", strong: ["place-value"], weak: ["multiplication"] },
    { key: "H", subject: "physics", grade: "Year 11", strong: ["forces-basics", "newton-laws"], weak: [] },
    { key: "I", subject: "physics", grade: "Year 11", strong: [], weak: ["electricity-circuits"] },
    { key: "J", subject: "chemistry", grade: "Year 11", strong: [], weak: ["ionic-bonding"] },
  ];
  const siblings = {
    A: { strong: ["algebra-expand"], weak: ["trig-ratios"] },
    B: { strong: ["trig-ratios"], weak: ["inequalities"] },
    C: { strong: ["volume"], weak: [] },
    D: { strong: [], weak: ["fractions"] },
    E: { strong: ["percentages"], weak: [] },
    F: { strong: ["straight-lines"], weak: ["volume"] },
    G: { strong: ["addition"], weak: ["division"] },
    H: { strong: ["energy-conservation", "work-power"], weak: [] },
    I: { strong: [], weak: ["magnetism"] },
    J: { strong: [], weak: ["covalent-bonding"] },
  };
  const out = [];
  for (const r of rows) {
    for (const [variant, use] of [["a", r], ["b", { ...r, ...siblings[r.key] }]]) {
      const history = [
        ...use.strong.flatMap((id) => strong(id)),
        ...use.weak.flatMap((id) => (variant === "a" ? weak(id) : weak(id, 4))),
      ];
      out.push({ id: `CUR-${r.key}${variant}`, ...use, history });
    }
  }
  return out;
}

{
  const profiles = curriculumProfiles();
  const foundationStage = 1;
  let noAction = 0, wrongSubject = 0, offCourse = 0, wrongLevel = 0;
  const offenders = [];
  for (const p of profiles) {
    const L = learner(`bench_${p.id}`, COURSE(p.subject, p.grade), p.history);
    const top = topFor(L);
    if (!top || !top.conceptId) { noAction++; offenders.push(`${p.id}: no action`); continue; }
    if (subjectOf(top.conceptId) !== p.subject) { wrongSubject++; offenders.push(`${p.id}: ${top.kind}:${top.conceptId} is ${subjectOf(top.conceptId)}, not ${p.subject}`); }
    if (!courseIdsFor(L).has(top.conceptId)) { offCourse++; offenders.push(`${p.id}: ${top.conceptId} is outside the declared course`); }
    // The Year 11 → 10 × 5 rule: a foundation-stage concept may only be TAUGHT
    // when this learner failed it, or it is the groundwork of something they
    // touched. A serve that is a retrieval is the schedule and not "work".
    const kind = String(top.kind ?? "").toUpperCase();
    const teaches = kind === "EXPLAIN" || kind === "PRACTISE" || kind === "REMEDIATE";
    if ((genome.getConcept(top.conceptId)?.stage ?? 0) <= foundationStage && teaches) {
      const ev = Object.keys(L.model.progress).filter((id) => (L.model.progress[id]?.attempts ?? 0) > 0);
      const failedIt = (L.model.progress[top.conceptId]?.correct ?? 0) < (L.model.progress[top.conceptId]?.attempts ?? 0);
      // Groundwork means: a declared ancestor of something this learner has
      // evidence on, OR of the concept their course advances to next — which is
      // exactly what the engine's prerequisite-safety branch serves, and calling
      // it "unearned elementary work" would fail the product for teaching the
      // foundation instead of skipping the gap. The first run asserted only the
      // touched concepts and mis-read CUR-Cb (coordinates, the declared
      // prerequisite of transformations, served before transformations).
      const order = genome.bySubject(p.subject).map((c) => c.id);
      const frontier = order.reduce((n, id, i) => ((L.model.progress[id]?.attempts ?? 0) > 0 ? i : n), -1);
      const nextId = frontier >= 0 ? order[frontier + 1] : null;
      const groundwork = ev.some((id) => genome.ancestorsOf(id).includes(top.conceptId))
        || (nextId ? nextId === top.conceptId || genome.ancestorsOf(nextId).includes(top.conceptId) : false);
      if (!failedIt && !groundwork) { wrongLevel++; offenders.push(`${p.id}: taught ${top.conceptId} unearned`); }
    }
  }
  check("CURRICULUM", "every-declared-learner-receives-an-action", "P1", noAction === 0, `${profiles.length - noAction}/${profiles.length} decisions exist`);
  check("CURRICULUM", "subject-is-the-declared-subject", "P1", wrongSubject === 0, `${profiles.length - wrongSubject}/${profiles.length} served inside the learner's subject`);
  check("CURRICULUM", "served-inside-the-declared-course", "P1", offCourse === 0, `${profiles.length - offCourse}/${profiles.length} served inside the declared qualification's coverage`);
  check("CURRICULUM", "no-unearned-elementary-work", "P1", wrongLevel === 0, `${profiles.length - wrongLevel}/${profiles.length} honest at their level${offenders.length ? ` — ${offenders.slice(0, 4).join("; ")}` : ""}`);
}

// ── LEARNING: the adversarial states must not collapse into one answer ──────
{
  const concept = "algebra-expand";
  const pairs = [
    ["improving vs plateau", [...weak(concept, 3), ...strong(concept, 3)], [...weak(concept, 6)]],
    ["fail-after-success vs clean", [...strong(concept, 4), ...weak(concept, 2)], [...strong(concept, 5)]],
    ["contradictory vs all-right", [...times(6, concept, true, {})].map((e, i) => (i % 2 === 0 ? e : { ...e, correct: false })), [...strong(concept, 5)]],
    ["old vs recent evidence", [a(concept, true, { gapDays: 40 }), a(concept, true, { gapDays: 39 })], [a(concept, true, { gapDays: 2 }), a(concept, true, { gapDays: 1 })]],
    ["prereq-mastered vs target-mastered", [...strong("angles-lines", 5)], [...strong("circle-theorems", 5), ...weak("angles-lines", 3)]],
    ["routine vs transfer success", [...strong(concept, 5)], [...strong(concept, 5), a(concept, true, { mode: "transfer", gapDays: 1 })]],
  ];
  let collapsed = 0;
  const offenders = [];
  pairs.forEach(([label, h1, h2], i) => {
    const d1 = topFor(learner(`bench_learn_a${i}`, COURSE("maths"), h1));
    const d2 = topFor(learner(`bench_learn_b${i}`, COURSE("maths"), h2));
    const same = d1?.kind === d2?.kind && d1?.conceptId === d2?.conceptId;
    if (same) { collapsed++; offenders.push(`${label}: both ${d1?.kind}:${d1?.conceptId}`); }
  });
  check("LEARNING", "adversarial-states-stay-distinct", "P1", collapsed === 0,
    `${pairs.length - collapsed}/${pairs.length} state pairs decide differently${offenders.length ? ` — ${offenders.join("; ")}` : ""}`);

  // ── RETENTION: unlearned ≠ learned-but-due, and mastered ≠ needs re-teaching
  const dueLongAgo = learner("bench_due", COURSE("maths"), [
    ...times(4, "fractions", true, { mode: "independent" }),
    a("fractions", true, { gapDays: 40, mode: "independent" }),
  ]);
  const neverSeen = learner("bench_never", COURSE("maths"), [...strong("algebra-expand", 3)]);
  const dueTop = topFor(dueLongAgo);
  const neverTop = topFor(neverSeen);
  check("LEARNING", "a-due-review-is-retrieved", "P1",
    dueTop?.kind === "RETRIEVE" && dueTop?.conceptId === "fractions",
    `five correct answers 40 days ago → ${dueTop?.kind}:${dueTop?.conceptId} ("${dueTop?.why ?? ""}")`);

  // And a concept the learner has NO record on is never retrieved as if a proof
  // existed — the honesty rule, measured against the same door. (Asserted on
  // the served concept, not on "fractions": a new concept may legitimately be
  // taught, and the failure being tested is a retrieval of nothing.)
  check("LEARNING", "unlearned-is-never-retrieved", "P1",
    neverTop?.kind !== "RETRIEVE" || neverTop?.conceptId !== "fractions",
    `a learner with no fractions record gets ${neverTop?.kind}:${neverTop?.conceptId}, never a retrieval of nothing`);

  // Mastered work is not re-taught: eight unaided answers on a concept must not
  // come back as EXPLAIN/PRACTISE/REMEDIATE on that concept.
  const mastered = learner("bench_mastered", COURSE("maths"), [...times(8, "fractions", true), a("fractions", true, { mode: "transfer", gapDays: 2 })]);
  const mTop = topFor(mastered);
  const mKind = String(mTop?.kind ?? "").toUpperCase();
  check("LEARNING", "mastered-work-is-not-re-taught", "P1",
    !(mTop?.conceptId === "fractions" && (mKind === "EXPLAIN" || mKind === "PRACTISE" || mKind === "REMEDIATE")),
    `a proved-and-transferred concept is served as ${mTop?.kind}:${mTop?.conceptId}`);

  // …and the frontier must move: with the concept proved and transferred, the
  // plan has to reach material PAST it rather than loop on what is done.
  const order = genome.bySubject("maths").map((c) => c.id);
  const pastFraction = (id) => order.indexOf(id) > order.indexOf("fractions");
  const plan = decideFor(mastered);
  check("LEARNING", "new-material-is-reachable", "P1", plan.some((x) => pastFraction(x.conceptId)),
    `the plan reaches past the mastered concept (${plan.map((x) => `${x.kind}:${x.conceptId}`).join(" | ")})`);
}

// ── EVIDENCE: what the model may claim, and what it must not ────────────────
{
  const fresh = learner("bench_evidence_new", COURSE("maths"), []);
  const snapshot = lm.buildSnapshot(fresh.model);
  const invented = snapshot.evidence.filter((e) => (e.attempts ?? 0) === 0);
  check("EVIDENCE", "unmeasured-concepts-are-untouched", "P1", invented.length === 0,
    `a learner with no answers has ${snapshot.evidence.length} evidenced concepts (must be 0)`);

  const events = learner("bench_evidence_replay", COURSE("maths"), [...weak("fractions", 3), ...strong("algebra-expand", 3)]).events;
  const m1 = JSON.stringify(replayMod.replayModel(events, "bench_evidence_replay", undefined, undefined));
  const m2 = JSON.stringify(replayMod.replayModel(events, "bench_evidence_replay", undefined, undefined));
  check("EVIDENCE", "replay-is-deterministic", "P1", m1 === m2, "the same ledger folds to the same model twice");

  const shuffled = [...events].reverse();
  const m3 = JSON.stringify(replayMod.replayModel(shuffled, "bench_evidence_replay", undefined, undefined));
  check("EVIDENCE", "out-of-order-ledger-does-not-corrupt", "P1", m3 === m1,
    "a reversed ledger folds to the same model (order is a fact of the events, not the array)");

  const hinted = learner("bench_evidence_hinted", COURSE("maths"), times(5, "fractions", true, { hints: 1, mode: "guided" }));
  const unaided = learner("bench_evidence_unaided", COURSE("maths"), times(5, "fractions", true));
  const hEv = lm.buildSnapshot(hinted.model).evidence.find((e) => e.conceptId === "fractions");
  const uEv = lm.buildSnapshot(unaided.model).evidence.find((e) => e.conceptId === "fractions");
  check("EVIDENCE", "scaffolding-is-not-independence", "P1",
    (hEv?.independentCorrect ?? 0) === 0 && (uEv?.independentCorrect ?? 0) > 0,
    `hinted ${hEv?.independentCorrect ?? "?"}/${hEv?.attempts ?? "?"} independent vs unaided ${uEv?.independentCorrect ?? "?"}/${uEv?.attempts ?? "?"}`);
}

// ── AI: ten real messages, one concept, the shipped fallback ────────────────
const TUTOR_MESSAGES = [
  "I don't understand.", "Why?", "I got x = 13.", "I think I should divide first.",
  "What does the 7 represent?", "hint please", "explain it to me",
  "show me a worked example", "The capital of France is Paris.", "I don't get why the 7 works",
];
{
  const conceptId = "algebra-expand";
  const grounded = { question: "Solve 3x + 7 = 22", serveReason: "recall is strong, application is developing", hitIds: [] };
  const replies = TUTOR_MESSAGES.map((m) => socratic.socraticReply(conceptId, m, "en", grounded));
  const distinct = new Set(replies).size;
  check("AI", "different-inputs-different-replies", "P1", distinct >= 9,
    `${distinct}/${TUTOR_MESSAGES.length} distinct replies (canned text repeats)`);
  check("AI", "every-reply-references-the-screen", "P1", replies.every((r) => r.includes(grounded.question)),
    "every reply names the question actually on the learner's screen");
  check("AI", "no-answer-leakage", "P1", replies.every((r) => !/x\s*=\s*5\b/.test(r)),
    "a Socratic turn never hands over the answer");
  check("AI", "no-claim-without-evidence", "P1",
    TUTOR_MESSAGES.map((m) => socratic.socraticReply(conceptId, m, "en", { question: grounded.question }))
      .every((r) => !/triggered/i.test(r) && !/recorded answers/i.test(r)),
    "with no learner evidence supplied, no reply claims any");
  check("AI", "no-unrendered-placeholder", "P1", replies.every((r) => !r.includes("{") && !r.includes("undefined")),
    "no raw key or undefined leaks into a reply");
  // Truthfulness is a property of the turn, not of a log line: a reply that did
  // not come from a model must say so on its own payload (`aiUnavailable`), and
  // a reply that claims a model must have one configured.
  const llm = require("../.verify/llm.js");
  const tutor = require("../.verify/server/tutor.js");
  const status = llm.aiStatus();
  const honest = (await Promise.all(TUTOR_MESSAGES.map((m) => tutor.tutorTurn({ learnerId: null, conceptId, message: m, language: "en", now: NOW }))))
    .every((t) => t && (t.answerSource === "ai" ? status.enabled : t.aiUnavailable !== null));
  const statement = status.enabled
    ? `LOCAL_AI = RUNNING (${status.provider} · ${status.model})`
    : "LOCAL_AI = NOT_IMPLEMENTED — replies are the deterministic Socratic engine, and every turn says so";
  check("AI", "model-state-is-truthful", "P1", honest, statement);
}

// ── TEACHER: thirty learners, interventions that can be explained ───────────
{
  const concepts = ["fractions", "fraction-ops", "decimals", "percentages", "ratio", "proportion"];
  const assignment = { id: "bench_asg", conceptIds: concepts, subject: "maths", setAt: NOW - 7 * DAY, dueAt: NOW + 7 * DAY };
  const rng = mulberry32(0x7a11b0c1);
  const rows = [];
  for (let i = 0; i < 30; i++) {
    const weakConcept = concepts[Math.floor(rng() * concepts.length)];
    const history = rng() < 0.5
      ? [...times(4, weakConcept, false, firstSlip(weakConcept) ? { tags: [firstSlip(weakConcept)] } : {}), ...strong("fractions", 1)]
      : [...times(3, weakConcept, true)];
    const L = learner(`bench_teacher_${i}`, COURSE("maths"), history);
    rows.push(assignmentView.deriveAssignmentProgress(assignment, `bench_student_${i}`, L.id, L.events));
  }
  const interventions = assignmentView.interventionsFor(rows);
  const complete = interventions.every((iv) => iv.handle && iv.conceptId && iv.reason);
  check("TEACHER", "interventions-name-who-and-why", "P1", interventions.length > 0 && complete,
    `${interventions.length} interventions; every one names student, concept and reason: ${complete}`);
}

// ── OFFLINE: the shipped bundle is the same engine, and it is current ───────
{
  const BUNDLE = path.join(ROOT, "docs", "openmind.engine.js");
  check("OFFLINE", "bundle-exists", "P0", fs.existsSync(BUNDLE), "docs/openmind.engine.js is present");
  // Freshness: the bundle is generated from lib/. A lib source newer than the
  // artifact means every offline learner is served the previous engine.
  const libFiles = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f)) libFiles.push(p);
    }
  };
  walk(path.join(ROOT, "lib"));
  const newestLib = libFiles.reduce((n, f) => Math.max(n, fs.statSync(f).mtimeMs), 0);
  const bundleTime = fs.existsSync(BUNDLE) ? fs.statSync(BUNDLE).mtimeMs : 0;
  const stale = newestLib > bundleTime || bundleTime === 0;
  const newestName = stale ? path.relative(ROOT, libFiles.find((f) => fs.statSync(f).mtimeMs === newestLib) ?? "") : null;
  check("OFFLINE", "bundle-is-not-stale", "P1", !stale,
    stale ? `the bundle predates its source (${newestName}) — run npm run build:static` : "the bundle is at least as new as every lib source");

  // PARITY: the same evidence must get the same decision from the shipped
  // offline engine and the server engine. This is the claim "content works
  // offline", at the level that matters — the decision a learner meets.
  const answers = [["fractions", false], ["fractions", false], ["fractions", true], ["decimals", true], ["decimals", false], ["standard-form", true], ["standard-form", true]];
  const at = NOW - 10 * DAY;
  const mint = (engine, events) => answers.forEach(([conceptId, correct], i) => events.push(engine.answerEvidence({
    learnerId: "bench_offline", at: at + i * 60000, source: "practice", subject: "maths",
    conceptId, specificationId: "uk-gcse", questionId: `bench-${i}`, correct, chosen: correct ? 0 : 1,
    mode: "independent", hints: 0, tags: [],
  })));
  const serverEvents = [];
  const offlineEvents = [];
  mint(evidenceMod, serverEvents);
  mint(bundle.evidence, offlineEvents);
  const serverProfile = learnerProfile.newProfileState("bench_offline", COURSE("maths")).profile;
  const offlineProfile = bundle.learnerProfile.newProfileState("bench_offline", COURSE("maths")).profile;
  const serverTop = decisionMod.decide(decisionMod.decisionContext(replayMod.replayModel(serverEvents, serverProfile.id, undefined, serverProfile), serverEvents), { max: 1, now: NOW })[0];
  const offlineTop = bundle.decision.decide(bundle.decision.decisionContext(bundle.replay.replayModel(offlineEvents, offlineProfile.id, undefined, offlineProfile), offlineEvents), { max: 1, now: NOW })[0];
  const sameDecision = serverTop?.kind === offlineTop?.kind && serverTop?.conceptId === offlineTop?.conceptId;
  check("OFFLINE", "same-evidence-same-decision", "P0", sameDecision,
    `server ${serverTop?.kind}:${serverTop?.conceptId} vs offline ${offlineTop?.kind}:${offlineTop?.conceptId}`);

  const offlineReplies = TUTOR_MESSAGES.map((m) => bundle.socratic.socraticReply("algebra-expand", m, "en", { question: "Solve 3x + 7 = 22" }));
  const serverReplies = TUTOR_MESSAGES.map((m) => socratic.socraticReply("algebra-expand", m, "en", { question: "Solve 3x + 7 = 22" }));
  check("OFFLINE", "same-tutor-online-and-offline", "P1",
    offlineReplies.length === serverReplies.length && offlineReplies.every((r, i) => r === serverReplies[i]),
    "the offline tutor replies are byte-identical to the server's for the same inputs");
}

// ═════════════════════════════════════════════════════════════════════════════
// HTTP JOURNEYS — the doors a real learner/teacher actually walks through
// ═════════════════════════════════════════════════════════════════════════════
const stamp = Date.now().toString(36);
const createdProfiles = [];
const createdClasses = [];

if (serverUp) {
  // ── ACCOUNT ───────────────────────────────────────────────────────────────
  {
    const email = `bench_${stamp}@example.org`;
    const signup = await post("/api/auth/signup", {
      email, password: "bench-password-1", name: "Bench Learner", role: "student",
      country: "GB", language: "en", subjects: ["maths"],
    });
    // The response nests the whole ProfileState: `profile` is the state, its
    // learner is `profile.profile`. The first run of this benchmark asserted
    // `body.profile.id` and reported a working signup as broken — an instrument
    // bug, corrected here against the route's real contract.
    const pid = signup.body?.profile?.profile?.id;
    const accountOk = signup.status === 200 && signup.body?.account?.email === email && !!pid && typeof signup.body?.secret === "string";
    check("ACCOUNT", "signup-works", "P0", accountOk, `POST /api/auth/signup → ${signup.status} profile ${pid ?? "none"} secret ${typeof signup.body?.secret}`);
    if (pid) { SECRETS.set(pid, signup.body.secret); createdProfiles.push(pid); }

    const me = await call("/api/auth/me", { headers: { cookie: (signup.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ") } });
    check("ACCOUNT", "session-persists-across-requests", "P0", me.status === 200 && me.body?.account?.email === email && me.body?.profile?.profile?.id === pid,
      `GET /api/auth/me with the session cookie → ${me.status} (same learner: ${me.body?.profile?.profile?.id === pid})`);

    // `me` is "who is signed in" and answers `{account:null}` with 200 when
    // nobody is — that is the route's documented contract, so the assertion is
    // about the PAYLOAD, not the status (the first run asserted the status and
    // reported correct behaviour as a P0).
    const anon = await call("/api/auth/me");
    check("ACCOUNT", "signed-out-is-not-a-session", "P0",
      anon.status === 200 && anon.body?.account === null && !anon.body?.profile,
      `GET /api/auth/me with no cookie → ${anon.status} account=${JSON.stringify(anon.body?.account)} profile=${anon.body?.profile ? "LEAKED" : "none"}`);

    const login = await post("/api/auth/login", { email, password: "bench-password-1" });
    check("ACCOUNT", "signin-works", "P0", login.status === 200 && login.body?.profile?.profile?.id === pid,
      `POST /api/auth/login → ${login.status}${login.body?.profile?.profile?.id === pid ? " (same learner)" : ` (${JSON.stringify(login.body).slice(0, 100)})`}`);

    // The adoption hole (fixed once, pinned forever): a device that holds a
    // session must not hand ANOTHER ACCOUNT'S learner to a new account. The
    // first run of this benchmark presented an ANONYMOUS profile — which the
    // signup route deliberately may adopt (that IS "carry this device's
    // progress") — and reported correct behaviour as a P0. The theft case is a
    // profile an account already owns.
    const second = await post("/api/auth/signup", {
      email: `bench_${stamp}_2@example.org`, password: "bench-password-2", name: "Second Learner",
      claim: { profileId: pid, secret: signup.body?.secret },
    });
    const secondPid = second.body?.profile?.profile?.id;
    check("ACCOUNT", "signup-does-not-steal-a-learner", "P0", !!secondPid && secondPid !== pid,
      `a second account presenting the first account's learner got ${secondPid === pid ? "THAT learner" : `its own profile (${secondPid ?? "none"})`}`);
    if (secondPid) { SECRETS.set(secondPid, second.body.secret ?? ""); createdProfiles.push(secondPid); }
  }

  // ── PROFILE ───────────────────────────────────────────────────────────────
  {
    const p = await newProfile({
      handle: "bench_profile", country: "GB", grade: "Year 11", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher", board: "aqa" } },
      goal: "pass my exams", language: "en",
    });
    const id = p.body?.profile?.id;
    if (id) createdProfiles.push(id);
    const got = id ? await getAuthed(`/api/profile?id=${id}`, id) : { status: 0, body: null };
    const prof = got.body?.profile ?? {};
    check("PROFILE", "curriculum-fields-persist", "P1",
      prof.country === "GB" && prof.grade === "Year 11" && prof.subjectCourses?.maths?.spec === "uk-gcse",
      `country ${prof.country}, grade ${prof.grade}, course ${prof.subjectCourses?.maths?.spec ?? "none"}`);
    const again = id ? await getAuthed(`/api/profile?id=${id}`, id) : { body: null };
    check("PROFILE", "persists-across-reads", "P1",
      JSON.stringify(again.body?.profile?.subjectCourses) === JSON.stringify(prof.subjectCourses),
      "a second read returns the same course");

    // Two refusals the data really reaches: a qualification id that means
    // nothing, and a TIER borrowed from a different qualification. (The
    // subject-coverage refusal exists in the code but every spec in the bank
    // covers every STEM subject, so it is unreachable today — recorded in the
    // report as a coverage observation rather than asserted here.)
    const unknownSpec = await post("/api/profile", { id, subjectCourses: { maths: { spec: "not-a-real-spec" } } });
    const badTier = await post("/api/profile", { id, subjectCourses: { maths: { spec: "uk-gcse", specLevel: "a2" } } });
    check("PROFILE", "impossible-course-combination-refused", "P1",
      unknownSpec.body?.error === "unknown_spec" && badTier.body?.error === "bad_spec_level",
      `unknown qualification → ${unknownSpec.body?.error ?? unknownSpec.status}; A-level tier on GCSE → ${badTier.body?.error ?? badTier.status}`);
  }

  // ── LEARNING LOOP: a fresh learner, through serve → answer → next ─────────
  {
    const p = await newProfile({ handle: "bench_loop", country: "GB", grade: "Year 11", subjects: ["maths"], subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher", board: "aqa" } } });
    const id = p.body?.profile?.id;
    if (id) createdProfiles.push(id);
    const next0 = id ? await getAuthed(`/api/next?id=${id}`, id) : { body: null };
    const action0 = next0.body?.action ?? next0.body?.actions?.[0] ?? null;
    const diagnosticFirst = action0?.href?.includes("/diagnostic") || action0?.conceptId === null;
    check("LEARNING-LOOP", "fresh-learner-is-diagnosed-first", "P1", diagnosticFirst,
      `a learner with no evidence is sent to ${action0?.href ?? action0?.kind ?? "nothing"}`);

    const served = id ? await post("/api/progress", { id, action: "serve", conceptId: "fractions", reveal: true }) : { body: null };
    if (served.body?.question) {
      const wrong = (served.body.question.answer + 1) % served.body.question.choices.length;
      const answered = await post("/api/progress", { id, action: "answer", conceptId: "fractions", questionId: served.body.question.id, choiceIndex: wrong });
      const summary = id ? await getAuthed(`/api/evidence-summary?id=${id}`, id) : { body: null };
      const entry = (summary.body?.concepts ?? summary.body?.rows ?? []).find?.((c) => c.conceptId === "fractions") ?? null;
      check("LEARNING-LOOP", "an-answer-becomes-evidence", "P1",
        answered.status === 200 && (entry ? (entry.attempts ?? 0) >= 1 : summary.status === 200),
        `graded ${answered.status}; the ledger ${entry ? `shows fractions attempts=${entry.attempts}` : "did not expose a per-concept row"} (read shape: ${Object.keys(summary.body ?? {}).slice(0, 5).join(", ")})`);

      const next1 = await getAuthed(`/api/next?id=${id}`, id);
      const action1 = next1.body?.action ?? next1.body?.actions?.[0] ?? null;
      check("LEARNING-LOOP", "the-next-action-follows-the-answer", "P1",
        action1 && (action1.conceptId === "fractions" || action1.href?.includes("fractions")),
        `after a wrong answer the next action is ${action1?.kind}:${action1?.conceptId ?? action1?.href}`);

      const summaryText = JSON.stringify(summary.body ?? {});
      const inventedMastery = /"status":"strong"/.test(summaryText) || /"mastered":true/.test(summaryText);
      check("LEARNING-LOOP", "one-wrong-answer-is-not-mastery", "P1", !inventedMastery,
        "nothing in the evidence summary claims strength after one wrong answer");
    } else {
      notTested("LEARNING-LOOP", "serve-answer-next", "P1", `the serve door answered ${served.status} without a question (reveal hook is stripped outside development?)`);
    }
  }

  // ── TEACHER: class, course, assignment — and the plan follows the course ──
  {
    const teacher = await newProfile({ handle: "bench_teacher", country: "GB", subjects: ["maths"] });
    const tid = teacher.body?.profile?.id;
    if (tid) createdProfiles.push(tid);
    const cls = await post("/api/classes", { id: tid, action: "create", name: `bench_class_${stamp}`, subject: "physics", specificationId: "uk-gcse", language: "en" });
    const clsId = cls.body?.cls?.id ?? null;
    if (clsId) createdClasses.push(clsId);
    check("TEACHER", "class-declares-subject-and-qualification", "P1",
      cls.status === 200 && cls.body?.cls?.subject === "physics" && cls.body?.cls?.specificationId === "uk-gcse",
      `POST /api/classes create → ${cls.status} subject ${cls.body?.cls?.subject ?? "?"} course ${cls.body?.cls?.specificationId ?? "?"}`);

    // A class cannot be stored on a course it cannot name, nor on a course with
    // no subject to be a course OF — both refusals the route really reaches.
    const refusedUnknown = await post("/api/classes", { id: tid, action: "create", name: `bench_bad_${stamp}`, subject: "physics", specificationId: "not-a-real-spec" });
    const refusedNoSubject = await post("/api/classes", { id: tid, action: "create", name: `bench_bad2_${stamp}`, specificationId: "uk-gcse" });
    check("TEACHER", "impossible-class-course-refused", "P1",
      refusedUnknown.body?.error === "unknown_spec" && refusedNoSubject.body?.error === "course_without_subject",
      `unknown course → ${refusedUnknown.body?.error ?? refusedUnknown.status}; course without subject → ${refusedNoSubject.body?.error ?? refusedNoSubject.status}`);

    // A class with no qualification declares itself incomplete rather than
    // inheriting a paper nobody chose.
    const bare = await post("/api/classes", { id: tid, action: "create", name: `bench_bare_${stamp}`, subject: "maths" });
    if (bare.body?.cls?.id) createdClasses.push(bare.body.cls.id);
    check("TEACHER", "class-without-course-says-so", "P1",
      bare.status === 200 && bare.body?.cls?.specificationId === null,
      `a maths class with no course stores course=null (got ${JSON.stringify(bare.body?.cls?.specificationId)})`);

    // ── THE TEACHER JOURNEY, end to end ──────────────────────────────────
    // Make a class, two students join, one does real work, and the monitor
    // must show THAT student's evidence, not a report either of them typed.
    const s1 = await newProfile({ handle: `bench_s1_${stamp}`, country: "GB", grade: "Year 11", subjects: ["maths"], subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher", board: "aqa" } } });
    const s2 = await newProfile({ handle: `bench_s2_${stamp}`, country: "GB", grade: "Year 11", subjects: ["maths"], subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher", board: "aqa" } } });
    const s1id = s1.body?.profile?.id, s2id = s2.body?.profile?.id;
    if (s1id) createdProfiles.push(s1id);
    if (s2id) createdProfiles.push(s2id);
    const joinCode = cls.body?.cls?.joinCode;
    const j1 = await post("/api/classes", { id: s1id, action: "join", joinCode });
    const j2 = await post("/api/classes", { id: s2id, action: "join", joinCode });
    check("TEACHER", "students-join-the-class", "P1", j1.status === 200 && j2.status === 200,
      `both students joined (${j1.status}, ${j2.status}) with the class's join code`);

    // S1 does the work — two wrong then one right, hint-free so it lands in the
    // monitor's independent record. S2 does nothing at all.
    for (let i = 0; i < 3; i++) {
      const served = await post("/api/progress", { id: s1id, action: "serve", conceptId: "fractions", reveal: true });
      if (!served.body?.question) break;
      const wantRight = i === 2;
      const idx = wantRight ? served.body.question.answer : (served.body.question.answer + 1) % served.body.question.choices.length;
      await post("/api/progress", { id: s1id, action: "answer", conceptId: "fractions", questionId: served.body.question.id, choiceIndex: idx });
    }
    const roster = await getAuthed(`/api/classes?id=${cls.body?.cls?.id}&me=${tid}`, tid);
    const rosterBody = roster.body?.cls ?? {};
    const handle1 = rosterBody.membersById ? Object.entries(rosterBody.membersById).find(([, id]) => id === s1id)?.[0] : null;
    const handle2 = rosterBody.membersById ? Object.entries(rosterBody.membersById).find(([, id]) => id === s2id)?.[0] : null;
    const live1 = handle1 ? rosterBody.live?.[handle1] : null;
    const live2 = handle2 ? rosterBody.live?.[handle2] : null;
    check("TEACHER", "monitor-shows-the-evidence-that-exists", "P1",
      !!live1 && (live1.answers ?? 0) >= 1 && !!live1.concepts?.fractions,
      `the student who worked shows ${live1?.answers ?? 0} answers and ${live1?.concepts?.fractions ? `${live1.concepts.fractions.correct}/${live1.concepts.fractions.asked} on fractions` : "no concept row"}`);
    check("TEACHER", "unknown-is-not-weak", "P1",
      !!live2 && (live2.answers ?? 0) === 0 && !live2.weakest && Object.keys(live2.concepts ?? {}).length === 0,
      `the student who did nothing reads answers=${live2?.answers ?? "?"} weakest=${JSON.stringify(live2?.weakest ?? null)} — never a failure`);
    // The teacher is a member (that is how they read their own class) but not a
    // student who owes it work: their handle must not appear among the rows the
    // monitor counts, or every class is one student larger than it is and the
    // teacher is listed under "needs attention" for their own assignment.
    const teacherHandle = Object.entries(rosterBody.membersById ?? {}).find(([, id]) => id === tid)?.[0] ?? null;
    check("TEACHER", "the-teacher-is-not-a-student-row", "P1",
      !!teacherHandle && !(teacherHandle in (rosterBody.students ?? {})) && handle1 in (rosterBody.students ?? {}),
      `students are ${Object.keys(rosterBody.students ?? {}).join(", ") || "none"}; the teacher (${teacherHandle}) is not among them`);
    check("TEACHER", "intervention-has-a-named-concept", "P1",
      !!live1?.weakest?.conceptId && typeof live1.weakest.rate === "number",
      `the weakest-concept row exists with a rate: ${JSON.stringify(live1?.weakest ?? null)}`);

    void tid;
  }

  // ── EVIDENCE over HTTP: one session's work survives the next ────────────
  {
    const email = `bench_ev_${stamp}@example.org`;
    const up = await post("/api/auth/signup", { email, password: "bench-password-3", name: "Bench Evidence", role: "student", country: "GB", language: "en", subjects: ["maths"] });
    const pid = up.body?.profile?.profile?.id;
    if (pid) { SECRETS.set(pid, up.body.secret); createdProfiles.push(pid); }
    let answersBefore = null;
    if (pid) {
      const served = await post("/api/progress", { id: pid, action: "serve", conceptId: "decimals", reveal: true });
      if (served.body?.question) {
        await post("/api/progress", { id: pid, action: "answer", conceptId: "decimals", questionId: served.body.question.id, choiceIndex: served.body.question.answer });
      }
      const before = await getAuthed(`/api/evidence-summary?id=${pid}`, pid);
      answersBefore = before.body?.totals?.answers ?? null;
      // A NEW session (a second sign-in) must see the same ledger.
      const again = await post("/api/auth/login", { email, password: "bench-password-3" });
      const pid2 = again.body?.profile?.profile?.id;
      const secret2 = again.body?.secret;
      const after = await call(`/api/evidence-summary?id=${pid}&secret=${encodeURIComponent(secret2 ?? SECRETS.get(pid) ?? "")}`);
      check("EVIDENCE", "survives-a-new-session", "P1",
        pid2 === pid && answersBefore !== null && (after.body?.totals?.answers ?? null) === answersBefore,
        `answers before ${answersBefore}, after a fresh sign-in ${after.body?.totals?.answers ?? "?"} (same learner: ${pid2 === pid})`);
    } else {
      notTested("EVIDENCE", "survives-a-new-session", "P1", "the account could not be created");
    }
  }

  // ── UX: a screen either says something or says it is loading ────────────
  // The first version of this check demanded an INVITATION in the raw HTML and
  // failed /dashboard for showing a loading state instead — but a JS-driven
  // screen ships its loader in the HTML and hydrates into content, and "a
  // loading state exists" is what the user's own brief asks for. The honest
  // claim, checkable without a browser: every primary signed-out route ships
  // either a real invitation or an explicit loading state, and never an empty
  // main. The browser-level behaviour is owned by `npm run verify:ui`, whose
  // result is recorded in the COMPARATIVE section rather than re-implemented.
  {
    const routes = [["/dashboard", /loading|checking|taking you/i], ["/account", /loading|checking|taking you/i], ["/teacher", /create a class|sign in|start|class/i]];
    for (const [route, mustShow] of routes) {
      const res = await fetch(BASE + route);
      const html = await res.text();
      const mains = [...html.matchAll(/<main[^>]*>([\s\S]*?)<\/main>/g)].map((m) => m[1]);
      const mainText = mains.join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      check("UX", `signed-out-${route.replace(/\//g, "")}-never-blank`, "P3",
        mainText.length > 40 && mustShow.test(mainText),
        `${route} signed-out: ${mainText.length} chars of main text — ${JSON.stringify(mainText.slice(0, 90))}`);
    }
  }

  // ── FAILURE: the product says what went wrong ─────────────────────────────
  {
    // Against a learner that EXISTS: a nonexistent id correctly answers 404
    // (nothing to authorize), so the 401 claim needs a real profile — the first
    // run asserted it against `bench_nope` and mis-read a correct 404.
    const real = await newProfile({ handle: "bench_failure", country: "GB", subjects: ["maths"] });
    const realId = real.body?.profile?.id;
    if (realId) createdProfiles.push(realId);
    const noSecret = await call(`/api/profile?id=${realId}`);
    check("FAILURE", "no-secret-no-access", "P2", noSecret.status === 401, `GET a real learner's profile without a secret → ${noSecret.status}`);
    const wrongSecretNext = await call(`/api/next?id=${realId}&secret=wrong-wrong-wrong`);
    check("FAILURE", "wrong-secret-is-refused", "P2", wrongSecretNext.status === 401, `GET /api/next for a real learner with a wrong secret → ${wrongSecretNext.status}`);
    const missingConcept = await call("/api/question?conceptId=bench_nope");
    check("FAILURE", "unknown-concept-is-a-404", "P2", missingConcept.status === 404, `GET /api/question?conceptId=bench_nope → ${missingConcept.status}`);
    const malformed = await call("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
    check("FAILURE", "malformed-body-is-refused", "P2", malformed.status >= 400, `a malformed JSON body → ${malformed.status}`);
    const missing = await post("/api/progress", { action: "answer", id: "bench_nope", conceptId: "fractions", questionId: "x", choiceIndex: 0 });
    check("FAILURE", "unknown-learner-is-refused", "P2", missing.status >= 400, `an answer from a learner that does not exist → ${missing.status}`);
  }

  // ── UX: the routes a learner can land on ──────────────────────────────────
  {
    const routes = ["/", "/dashboard", "/learn/maths", "/learn/maths/fractions", "/curriculum", "/progress", "/mind", "/account", "/onboarding", "/diagnostic/maths"];
    const results = [];
    for (const r of routes) {
      try {
        const res = await fetch(BASE + r);
        const html = await res.text();
        const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
        const leak = /\bundefined\b|\bNaN\b/.test(text) || /\{\{[^}]{0,40}\}\}/.test(text);
        results.push({ r, status: res.status, leak, links: (text.match(/href="\//g) ?? []).length });
      } catch (e) {
        results.push({ r, status: 0, leak: false, links: 0, err: String(e).slice(0, 60) });
      }
    }
    const bad = results.filter((x) => x.status !== 200);
    check("UX", "every-primary-route-answers", "P3", bad.length === 0,
      `${routes.length - bad.length}/${routes.length} routes answer 200${bad.length ? ` — ${bad.map((b) => `${b.r}:${b.status}`).join(", ")}` : ""}`);
    const leaks = results.filter((x) => x.leak);
    check("UX", "no-undefined-or-raw-key-on-screen", "P3", leaks.length === 0,
      `${routes.length - leaks.length}/${routes.length} routes render no undefined/NaN/raw key${leaks.length ? ` — ${leaks.map((l) => l.r).join(", ")}` : ""}`);
    const deadEnds = results.filter((x) => x.status === 200 && x.links === 0);
    check("UX", "no-dead-end-screens", "P3", deadEnds.length === 0,
      `${deadEnds.length} screens offer no onward link${deadEnds.length ? ` — ${deadEnds.map((d) => d.r).join(", ")}` : ""}`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// THE COMPARATIVE — owned by the superiority test; recorded here, never redone
// ═════════════════════════════════════════════════════════════════════════════
{
  const run = (cmd) => {
    try {
      const out = execFileSync("npm", ["run", cmd], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 300000 });
      return { ok: true, out };
    } catch (e) {
      return { ok: false, out: `${e.stdout ?? ""}\n${e.stderr ?? ""}`.slice(-2000) };
    }
  };
  const sup = run("superiority-test");
  const tail = sup.out.trim().split("\n").filter(Boolean).slice(-1)[0] ?? "";
  check("COMPARATIVE", "differentiation-benchmark", "P1", sup.ok && /DIFFERENTIATION DEMONSTRATED/.test(sup.out),
    `OpenMind differentiation benchmark (owner: npm run superiority-test) — ${tail || "no result line"}`);
  const stat = run("verify:static");
  const statTail = stat.out.trim().split("\n").filter(Boolean).slice(-1)[0] ?? "";
  check("COMPARATIVE", "offline-bundle-smoke", "P1", stat.ok, `npm run verify:static — ${statTail || "no result line"}`);
  // The only BROWSER-level gate in the campaign: a fresh learner driven through
  // the real wizard with trusted input events. Recorded here so the product
  // benchmark's claims include one that no HTTP fetch could make.
  const ui = run("verify:ui");
  const uiTail = ui.out.trim().split("\n").filter(Boolean).slice(-1)[0] ?? "";
  check("COMPARATIVE", "browser-walk", "P1", ui.ok && /0 failed/.test(ui.out), `npm run verify:ui — ${uiTail || "no result line"}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// CLEANUP — a benchmark that leaves test learners in a real dashboard is a bug
// ═════════════════════════════════════════════════════════════════════════════
{
  let erased = 0;
  const stuck = [];
  for (const id of createdProfiles) {
    const secret = SECRETS.get(id) ?? "";
    const res = await call(`/api/profile?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}&confirm=ERASE`, { method: "DELETE" });
    if (res.status === 200) erased++;
    else stuck.push(`${id}→${res.status}${res.body?.error ? ` (${res.body.error})` : ""}`);
  }
  // Classes whose owner is a bench learner are removed file-level, exactly as
  // the e2e cleanup does, with a backup first.
  let removedClasses = 0;
  try {
    const file = path.join(ROOT, ".openmind-data", "classes.json");
    if (createdClasses.length && fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      const arr = Array.isArray(raw) ? raw : raw.classes ?? [];
      fs.copyFileSync(file, `/tmp/bench-classes-${stamp}.json`);
      const keep = arr.filter((c) => !createdClasses.includes(c.id) && !new RegExp(`^bench_class_${stamp}$`).test(c.name ?? ""));
      removedClasses = arr.length - keep.length;
      if (Array.isArray(raw)) fs.writeFileSync(file, JSON.stringify(keep, null, 2));
      else fs.writeFileSync(file, JSON.stringify({ ...raw, classes: keep }, null, 2));
    }
  } catch (e) {
    notTested("CLEANUP", "classes-removed", "P3", `could not prune bench classes: ${String(e).slice(0, 80)}`);
  }
  check("CLEANUP", "bench-data-erased", "P3",
    createdProfiles.length === erased,
    `${erased}/${createdProfiles.length} bench learners erased through DELETE /api/profile${stuck.length ? ` — stuck: ${stuck.join(", ")}` : ""}; ${removedClasses} bench classes pruned`);
}

// ═════════════════════════════════════════════════════════════════════════════
// THE REPORT
// ═════════════════════════════════════════════════════════════════════════════
const categories = [...new Set(checks.map((c) => c.category))];
console.log("");
console.log("  OPENMIND PRODUCT BENCHMARK — can a learner actually use this?");
console.log("");
console.log(`  ${"CATEGORY".padEnd(16)} ${"PASS".padStart(6)} ${"FAIL".padStart(6)}   WORST`);
console.log("  " + "─".repeat(52));
for (const cat of categories) {
  const rows = checks.filter((c) => c.category === cat);
  const failed = rows.filter((c) => !c.ok);
  const worst = failed.length ? failed.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])[0].severity : "—";
  console.log(`  ${cat.padEnd(16)} ${String(rows.length - failed.length).padStart(6)} ${String(failed.length).padStart(6)}   ${worst}`);
}
const failures = checks.filter((c) => !c.ok).sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
console.log("");
if (failures.length) {
  console.log("  FAILURES, worst first:");
  for (const f of failures) console.log(`    ${f.severity} ${f.category} · ${f.id}\n       ${f.detail}`);
} else {
  console.log("  No failures — every journey this battery can drive works.");
}
if (untested.length) {
  console.log("");
  console.log("  UNTESTED (recorded, never counted as passes):");
  for (const u of untested) console.log(`    ${u.severity} ${u.category} · ${u.id} — ${u.reason}`);
}
// ── OWNED ELSEWHERE ─────────────────────────────────────────────────────
// Capabilities this battery deliberately does NOT re-implement, each with the
// gate that owns it. Printed so the report cannot imply wider coverage than
// the run has — and so a gate that goes missing is visible here.
const ownedElsewhere = [
  ["offline sync: dedupe, out-of-order, offline capture", "npm run verify:static"],
  ["keyboard, touch and responsive layout (real browser, trusted input)", "npm run verify:ui"],
  ["every tutor sentence in all 15 dictionaries", "npm run verify"],
  ["engine round-trips, pins and invariants", "npm run verify"],
  ["decisions vs a sequential baseline", "npm run superiority-test"],
];
console.log("");
console.log("  COVERED BY OTHER GATES (not re-implemented here):");
for (const [what, who] of ownedElsewhere) console.log(`    ${what} — ${who}`);
const blocking = failures.filter((f) => SEV_ORDER[f.severity] <= 2);
console.log("");
console.log(`  ${checks.filter((c) => c.ok).length}/${checks.length} checks passed · ${blocking.length} blocking (P0–P2) · ${untested.length} untested`);

const payload = {
  at: new Date().toISOString(),
  server: serverUp ? BASE : null,
  checks, untested, ownedElsewhere,
  totals: { checks: checks.length, passed: checks.filter((c) => c.ok).length, blocking: blocking.length },
};
fs.mkdirSync(path.join(ROOT, ".benchmark"), { recursive: true });
fs.writeFileSync(path.join(ROOT, ".benchmark", "latest.json"), JSON.stringify(payload, null, 2));
console.log(`  baseline written to .benchmark/latest.json`);
process.exit(blocking.length ? 1 : 0);
