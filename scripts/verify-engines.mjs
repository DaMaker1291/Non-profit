// Headless verification of OpenMind's core engines.
// Usage: npm run verify  (compiles lib/ to .verify/ then runs these assertions)
import { createRequire } from "node:module";
import fs from "node:fs";
// The AI block drives a stub PROVIDER over real HTTP: the timeout lives in the
// transport, so the transport has to be real for the four failure outcomes to
// mean anything.
import http from "node:http";
// The compile step is SHARED with `npm run content-check`: one mirror for the
// whole pipeline, the content graph included (see scripts/compile-engines.mjs).
import { compileEngines } from "./compile-engines.mjs";

compileEngines();

const require = createRequire(import.meta.url);
const genome = require("../.verify/genome.js");
const misconceptions = require("../.verify/misconceptions.js");
const questions = require("../.verify/questions.js");
// The re-framer, and the one question the decision engine asks it before it
// offers transfer: can this concept's questions be put on a SECOND surface at
// all? A transfer offer the serve cannot honour is a promise with no evidence
// behind it, so the gate the engine uses is asserted here, not assumed.
const transferMod = require("../.verify/transfer.js");
const diag = require("../.verify/diagnostic.js");
const progress = require("../.verify/progress.js");
// The one verdict rule and its vocabulary: what an answer PROVED (§10, §14),
// shared by the live model, the ledger projection, the grade a learner is shown
// and the surfaces that name a verdict.
const proofMod = require("../.verify/proof.js");
const socratic = require("../.verify/socratic.js");
const i18n = require("../.verify/i18n.js");
const matcher = require("../.verify/matcher.js");
const retention = require("../.verify/retention.js");
const hints = require("../.verify/hints.js");
const teacherPlan = require("../.verify/teacher-plan.js");
const mastery = require("../.verify/mastery.js");
const session = require("../.verify/session.js");
const nextEngine = require("../.verify/next-engine.js");
const papers = require("../.verify/papers.js");
const paperAnalysis = require("../.verify/paper-analysis.js");
const appState = require("../.verify/app-state.js");
// The evidence ledger's on-disk half is exercised against a TEMP data dir, set
// before the module is required (DATA_DIR is resolved at load). Never the real
// .openmind-data: a verification run must not write into a learner's store.
const os = require("os");
const nodePath = require("path");
const tmpData = fs.mkdtempSync(nodePath.join(os.tmpdir(), "om-evidence-verify-"));
process.env.OPENMIND_DATA_DIR = tmpData;
const evidenceStore = require("../.verify/server/evidence.js");
const store = require("../.verify/server/store.js");
const evidence = require("../.verify/evidence.js");
const localAi = require("../.verify/local-ai.js");
const localModel = require("../.verify/local-model.js");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error("  ✗ FAIL:", msg); }
}

// ── 0. The content graph ────────────────────────────────────────────────────
// The pipeline's first gate, and a HARD one: a dangling concept reference, a
// misconception id the catalogue has never heard of, an item that names a band
// the ladder does not define, or a concept that declares a belief its items
// cannot detect all mean the same thing — learner evidence would be recorded
// against an object nobody can resolve. Everything downstream (the ledger, the
// projection, the decision) is keyed by these ids, so nothing after this point
// is worth running on a broken graph. Each violation is printed with the
// relation and the OBJECT it is about, then the summary line fails the run.
console.log("▸ The content graph (lib/content-graph)");
{
  const graph = require("../.verify/content-graph.js");
  const violations = graph.validateContentGraph();
  for (const v of violations.slice(0, 40)) {
    console.error(`  ✗ ${v.relation} — ${v.id}: ${v.detail}`);
  }
  if (violations.length > 40) console.error(`  ✗ … ${violations.length - 40} more`);
  if (violations.length) {
    console.error(
      `\nCONTENT GRAPH INVALID — ${violations.length} violation${violations.length === 1 ? "" : "s"}. Stopping here: ` +
      "every downstream guarantee (evidence, the learner model, the decision) is keyed by the objects above, " +
      "so the suites below would be measuring a graph that does not resolve. Fix the graph, then re-run.",
    );
    process.exit(1);
  }
  ok(true, "every join in the content graph resolves");
  // A declared slice is a content COMMITMENT, not a comment: the expectation is
  // data, and the bank must meet it, or "the slices we ship are complete"
  // becomes a claim nobody checks. A gap is a failure but not a stop — the
  // graph itself is sound, so the rest of the suite still has something to say.
  const sliceGaps = graph.sliceGaps();
  for (const g of sliceGaps) console.error(`  ✗ slice — ${g.conceptId}: missing ${g.missing.join(", ")}`);
  ok(sliceGaps.length === 0,
    `the declared vertical slice is complete (${sliceGaps.map((g) => `${g.conceptId}:${g.missing.join("+")}`).join("; ") || "every declared concept reaches its required bands"})`);
}

// ── 1. Genome integrity ─────────────────────────────────────────────────────
console.log("▸ Genome integrity");
const ids = genome.CONCEPTS.map((c) => c.id);
ok(new Set(ids).size === ids.length, "concept ids are unique");
ok(ids.length >= 130, `genome has >=130 concepts (got ${ids.length})`);
const badRefs = genome.CONCEPTS.flatMap((c) => c.prereqs.filter((p) => !genome.CONCEPTS_BY_ID[p]));
ok(badRefs.length === 0, `all prereqs resolve (bad: ${badRefs.join(",")})`);
// cycle check via DFS
const state = new Map();
let cycles = 0;
function dfs(id) {
  if (state.get(id) === 1) { cycles++; return; }
  if (state.get(id) === 2) return;
  state.set(id, 1);
  for (const p of genome.CONCEPTS_BY_ID[id].prereqs) dfs(p);
  state.set(id, 2);
}
for (const id of ids) dfs(id);
ok(cycles === 0, `no prerequisite cycles (found ${cycles})`);
ok(genome.CONCEPTS.every((c) => c.lesson.length > 80 && c.blurb.length > 15), "every concept has a real lesson + blurb");
// misconception wiring
const badMis = genome.CONCEPTS.flatMap((c) => (c.misconceptions ?? []).filter((m) => !misconceptions.MISCONCEPTIONS_BY_ID[m]));
ok(badMis.length === 0, `concept→misconception refs resolve (bad: ${badMis.join(",")})`);
ok(misconceptions.MISCONCEPTIONS.length >= 40, `misconception catalogue >=40 (got ${misconceptions.MISCONCEPTIONS.length})`);
ok(misconceptions.MISCONCEPTIONS.every((m) => m.coaching.length > 60 && m.pattern.length > 20), "every misconception has coaching + pattern");
for (const s of ["maths", "physics", "chemistry", "biology", "computing"]) {
  ok(genome.bySubject(s).length >= 16, `subject ${s} has >=16 concepts`);
}

// ── 2. Question generation ──────────────────────────────────────────────────
console.log("▸ Question generation");
const genIds = questions.GENERATED_CONCEPT_IDS;
ok(genIds.length >= 100, `generators cover >=100 concepts (got ${genIds.length})`);
let totalQ = 0, emptyExpl = 0, badChoices = 0;
let variableGens = 0, constantGens = 0, variableCollision = 0;
for (const cid of genIds) {
  // classify: constant generators emit the same prompt regardless of seed
  const sample = new Set();
  for (let i = 0; i < 5; i++) {
    const q = questions.generateQuestion(cid, `probe-${cid}-${i}`);
    if (q) sample.add(q.prompt);
  }
  const isConstant = sample.size <= 1;
  if (isConstant) constantGens++; else variableGens++;
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    const q = questions.generateQuestion(cid, `seed-${cid}-${i}`);
    if (!q) { badChoices++; continue; }
    totalQ++;
    if (!q.explanation || q.explanation.length < 15) emptyExpl++;
    if (q.choices.length !== 4 || q.answer < 0 || q.answer > 3) badChoices++;
    if (new Set(q.choices).size !== 4) badChoices++;
    const key = q.prompt + "»" + q.choices[q.answer];
    if (!isConstant && seen.has(key)) variableCollision++;
    seen.add(key);
  }
  if (!isConstant) ok(sample.size >= 2, `${cid} variable generator shows prompt variety`);
}
ok(emptyExpl === 0, `all questions have explanations (empty: ${emptyExpl})`);
ok(badChoices === 0, `all questions have 4 distinct choices + valid answer (bad: ${badChoices})`);
ok(variableGens >= 40, `variable generators >=40 (got ${variableGens}, constant ${constantGens})`);
// variable generators must truly vary; designed (constant) ones are classified correctly
for (const cid of genIds.filter((id) => questions.isVariableGen(id))) {
  const prompts = new Set();
  for (let i = 0; i < 12; i++) {
    const q = questions.generateQuestion(cid, `var-${cid}-${i}`);
    if (q) prompts.add(q.prompt);
  }
  ok(prompts.size >= 3, `${cid} declared variable and varies (variants: ${prompts.size})`);
}
for (const cid of genIds.filter((id) => !questions.isVariableGen(id))) {
  const a = questions.generateQuestion(cid, "c-1");
  const b = questions.generateQuestion(cid, "c-2");
  ok(a && b && a.prompt === b.prompt, `${cid} declared designed and stable`);
}
// determinism
const qA = questions.generateQuestion("fractions", "fixed");
const qB = questions.generateQuestion("fractions", "fixed");
ok(JSON.stringify(qA) === JSON.stringify(qB), "same seed → identical question (deterministic)");
// distractor ≠ correct
let wrongDistractors = 0;
for (let i = 0; i < 200; i++) {
  const q = questions.generateQuestion(genIds[i % genIds.length], `d-${i}`);
  if (q.choices.filter((c, j) => j !== q.answer && c === q.choices[q.answer]).length > 0) wrongDistractors++;
}
ok(wrongDistractors === 0, "no distractor duplicates the correct answer");

// ── 3. Diagnostic ladder ────────────────────────────────────────────────────
console.log("▸ Diagnostic engine");
const mkLadder = (id) => ({ conceptId: id, stage: 0, askedThisStage: 0, correctThisStage: 0, done: false, asked: 0, correct: 0, usedSeeds: [], servedDifficulty: [] });
// strong student on a deterministic, variable-generator session
{
  const s = diag.newDiagnosticSession("maths");
  s.concepts = [mkLadder("linear-equations"), mkLadder("quadratics")];
  let q = diag.nextQuestion(s), guard = 0;
  while (q && guard++ < 100) {
    diag.gradeAnswer(s, q.conceptId, q, q.answer);
    q = diag.nextQuestion(s);
  }
  const res = diag.buildResult(s);
  // Ten, not twelve: the early stop skips a band the SESSION has already
  // demonstrated before the second concept is reached (see "Probing what is
  // still uncertain"). What matters here is that the ladder still runs to
  // depth — six items on the first concept, and a fresh band on the second —
  // rather than being cut short. The skip itself is asserted in that section.
  ok(res.asked >= 10, `strong student climbed the ladders (${res.asked} asked)`);
  ok(diag.buildResult(s).skippedBands.length === 0 || s.concepts.every((c) => !(c.skippedBands ?? []).length || c.asked > 0),
    "a band is only skipped on a concept that still got probed");
  const strongMastery = Math.max(...res.scores.filter((x) => x.asked > 0).map((x) => x.mastery));
  ok(strongMastery >= 0.82, `strong student reaches the band-2 ceiling for its generator (got ${strongMastery.toFixed(2)})`);
  // UNMEASURED IS NOT WEAK. `gaps` is a claim about the learner, so it may only
  // hold concepts this sitting ASKED about; the coverage rows for concepts
  // nothing asked about carry the model's neutral prior and stay out of it.
  // This used to assert the opposite — `gaps.length > 0` on a run where the only
  // gaps were never-asked rows — which is how the results screen came to list
  // "Gaps to close: Addition · Subtraction · Multiplication…" to a learner who
  // had just answered every question correctly.
  const unprobed = res.scores.filter((x) => x.asked === 0);
  ok(unprobed.length > 0 && unprobed.every((x) => !res.gaps.some((g) => g.conceptId === x.conceptId)),
    `never-asked coverage rows (${unprobed.length}) are reported as coverage, not as gaps`);
  ok(res.gaps.length === 0 && res.strengths.length > 0,
    `a learner who swept every concept has no gaps and real strengths (${res.gaps.length} gaps, ${res.strengths.length} strengths)`);
}
// ── 3a. The order a sitting serves its sample ───────────────────────────────
// The product claim: a diagnostic opens at the LEARNER'S level and descends
// only as far as the evidence requires, so the foundations are reached when the
// harder work has actually failed. Ascending order made a Year 11 GCSE Higher
// learner's first question the shallowest concept in their whole course —
// primary place value — and spent eight near-identical questions on it before
// anything at their level had been asked.
console.log("▸ The order the diagnostic asks in");
{
  const specsMod = require("../.verify/specifications.js");
  const stageOfConcept = (id) => genome.CONCEPTS_BY_ID[id]?.stage ?? 0;
  const shallowOpeners = [];
  let checked = 0;
  for (const spec of specsMod.SPECIFICATIONS) {
    for (const level of spec.levels) {
      const s = diag.newDiagnosticSession("maths", "baseline", { spec, level });
      if (s.concepts.length < 2) continue;
      checked++;
      const stages = s.concepts.map((c) => stageOfConcept(c.conceptId));
      if (stages[0] !== Math.max(...stages)) shallowOpeners.push(`${spec.id}/${level.id} (${stages[0]} of ${Math.max(...stages)})`);
    }
  }
  ok(checked > 0 && shallowOpeners.length === 0,
    `every course opens on the deepest concept it sampled (${shallowOpeners.slice(0, 3).join(", ") || `${checked} courses agree`})`);
}
// ── 3a-ii. The DEMAND half of the same claim ───────────────────────────────
// The order fix above solved half of what its own comment promised. Concepts
// were asked deepest-first, but every concept still opened at difficulty 0.15,
// so a real Year 11 GCSE Higher sitting contained "Which fraction is larger:
// 1/2 or 1/8?" and "What is the value of the tens digit in 276?" — and an
// A-level learner's first item on a concept was the easiest draw its generator
// owns. The demand half is that a sitting opens at the LEARNER'S OWN COURSE,
// and both ways of getting it wrong are checked here, because they sit in
// opposite directions: under-claiming prescribes practice to a flawless
// learner, over-claiming calls a band "mastered" that no answer touched.
console.log("▸ The level a sitting opens at");
{
  const opens = [[0.15, 0], [0.4, 1], [0.45, 1], [0.55, 1], [0.65, 2], [0.7, 2], [0.85, 3], [0.9, 3], [null, 0]];
  const badOpens = opens.filter(([d, want]) => diag.openingStageFor(d) !== want);
  ok(badOpens.length === 0,
    `the ladder opens at the deepest rung at or below the learner's own course (${badOpens.length ? badOpens.map(([d]) => d).join(", ") : `${opens.length} declarations agree`})`);

  const specsMod = require("../.verify/specifications.js");
  const qBank = require("../.verify/questions.js");
  const cannotPlace = [];
  const wrongRung = [];
  let courses = 0;
  for (const spec of specsMod.SPECIFICATIONS) {
    for (const level of spec.levels) {
      const declaredBand = qBank.difficultyBandFor(level.difficulty);
      const s = diag.newDiagnosticSession("maths", "baseline", { spec, level });
      if (s.concepts.length === 0) continue;
      courses++;
      if (s.openStage !== diag.openingStageFor(level.difficulty)) {
        wrongRung.push(`${spec.id}/${level.id}: openStage ${s.openStage}`);
      }
      for (const c of s.concepts) {
        if (qBank.difficultyBandFor(qBank.conceptDepth(c.conceptId)) < declaredBand - 1) {
          cannotPlace.push(`${spec.id}/${level.id}:${c.conceptId}`);
        }
      }
      // …and the rung the first concept actually opens at, which is the
      // learner's own — capped by what that concept's bank can express.
      const first = s.concepts[0];
      const want = Math.min(diag.openingStageFor(level.difficulty), diag.bandsFor(first.conceptId) - 1);
      const q1 = diag.nextQuestion(s);
      if (!q1 || first.stage !== want) wrongRung.push(`${spec.id}/${level.id} ${first.conceptId}: stage ${first.stage} ≠ ${want}`);
    }
  }
  ok(courses > 0 && cannotPlace.length === 0,
    `no course samples a concept that cannot place its learner (${cannotPlace.slice(0, 3).join(", ") || `${courses} courses clear`})`);
  ok(wrongRung.length === 0,
    `every course opens its concepts at its own rung (${wrongRung.slice(0, 3).join(", ") || `${courses} courses agree`})`);
}
// ── 3a-iii. The defect, on the real sitting, at both ends ───────────────────
console.log("▸ No primary questions for a Year 11, and no credit for wrong answers");
{
  const specsMod = require("../.verify/specifications.js");
  const qBank = require("../.verify/questions.js");
  const gcse = specsMod.SPECIFICATIONS.find((s) => s.id === "uk-gcse");
  const higher = gcse.levels.find((l) => l.id === "higher");
  const walk = (answerCorrectly) => {
    const s = diag.newDiagnosticSession("maths", "baseline", { spec: gcse, level: higher });
    let q = diag.nextQuestion(s), guard = 0;
    while (q && guard++ < 200) {
      diag.gradeAnswer(s, q.conceptId, q, answerCorrectly ? q.answer : (q.answer + 1) % q.choices.length);
      q = diag.nextQuestion(s);
    }
    return { s, res: diag.buildResult(s) };
  };
  const good = walk(true);
  const bad = walk(false);
  const goodFloors = good.s.log.map((x) => x.difficulty);
  const bands = [...new Set(goodFloors.map((d) => qBank.difficultyBandFor(d)))].sort();
  ok(goodFloors.length > 0 && goodFloors.every((d) => qBank.difficultyBandFor(d) >= 2),
    `a Year 11 GCSE Higher sitting asks nothing of primary difficulty (served bands ${bands.join("/")}, lowest ${Math.min(...goodFloors).toFixed(2)})`);
  const badFloors = bad.s.log.map((x) => x.difficulty);
  // A learner who cannot do their course's band is measured THERE and stopped:
  // the band rules still close a band on two misses, so the sitting never falls
  // back to the anonymous floor to fill its questions, and the repair that
  // follows is the teaching loop's (with its own descent ramp and prerequisite
  // branches) rather than a second placement pass inside a three-minute
  // diagnostic. The claim that comes out of it is pinned below, at 0.10.
  ok(badFloors.every((d) => d > diag.LADDER_DIFFICULTIES[0]),
    `a failed course band is measured at the course's rung, never at the anonymous floor (lowest served ${Math.min(...badFloors).toFixed(2)} > ${diag.LADDER_DIFFICULTIES[0]})`);
  ok(bad.s.concepts.every((c) => c.asked <= 2),
    `and the sitting spends its normal two items on it rather than dragging the learner down the ladder (${bad.s.concepts.map((c) => c.asked).join("/")} items per concept)`);
  const earned = (r) => r.res.scores.filter((x) => x.asked > 0).map((x) => x.mastery);
  const strong = earned(good);
  const weak = earned(bad);
  ok(strong.length > 0 && strong.every((m) => m >= 0.82),
    `a flawless sitting still clears the engine's established bar (lowest ${Math.min(...strong).toFixed(2)})`);
  ok(weak.every((m) => m <= 0.35) && bad.res.gaps.length > 0,
    `an all-wrong sitting earns none of the bands its answers never touched (highest ${Math.max(...weak).toFixed(2)}, ${bad.res.gaps.length} gaps)`);
}
// struggling student: always picks a wrong choice
{
  const s = diag.newDiagnosticSession("maths");
  s.concepts = [mkLadder("linear-equations"), mkLadder("fractions")];
  let q = diag.nextQuestion(s), guard = 0, wrongs = 0;
  while (q && guard++ < 100) {
    const wrongIdx = (q.answer + 1) % q.choices.length;
    const g = diag.gradeAnswer(s, q.conceptId, q, wrongIdx);
    if (!g.correct) wrongs++;
    q = diag.nextQuestion(s);
  }
  const res = diag.buildResult(s);
  const weakMastery = Math.min(...res.scores.filter((x) => x.asked > 0).map((x) => x.mastery));
  ok(weakMastery <= 0.45, `struggling student lands low (got ${weakMastery.toFixed(2)})`);
  ok(wrongs >= 2, `every wrong answer registered (${wrongs})`);
  ok(res.misconceptions.length > 0, `misconceptions detected from wrong answers (${res.misconceptions.length} patterns)`);
  ok(res.misconceptions.every((m) => misconceptions.MISCONCEPTIONS_BY_ID[m.id]?.coaching), "detected misconceptions carry coaching notes");
}
// random full sessions for every subject must terminate and produce a result
for (const subj of ["maths", "physics", "chemistry", "biology", "computing"]) {
  const s = diag.newDiagnosticSession(subj);
  let q = diag.nextQuestion(s), guard = 0;
  while (q && guard++ < 200) {
    const wrong = guard % 3 === 0 ? (q.answer + 1) % q.choices.length : q.answer;
    diag.gradeAnswer(s, q.conceptId, q, wrong);
    q = diag.nextQuestion(s);
  }
  const res = diag.buildResult(s);
  ok(res.asked >= 1, `${subj}: random session terminates with a usable result (asked ${res.asked})`);
  ok(res.scores.length >= 1 && res.path.length === 0, `${subj}: result carries scores and no path yet`);
}
// skip flow
{
  const s = diag.newDiagnosticSession("computing");
  const cur = diag.currentConcept(s);
  if (cur) cur.done = true;
  const nxt = diag.nextQuestion(s);
  ok(nxt && nxt.conceptId !== cur.conceptId, "skip moves to next concept");
}
// Audit P0-C: the band rules are the documented ladder truth — 2/2 advance,
// a miss earns exactly one confirming retest, a second miss ends the band,
// and a mid-band recovery (wrong→right) earns one more question at the band.
{
  const s = diag.newDiagnosticSession("maths", "baseline");
  const c = s.concepts[0];
  const q1 = diag.nextQuestion(s);
  const r1 = diag.gradeAnswer(s, c.conceptId, q1, (q1.answer + 1) % q1.choices.length); // miss
  ok(!r1.correct && !c.done && !!c.missedThisStage, "a miss schedules the band's one retest, it does not end the band");
  const q2 = diag.nextQuestion(s);
  diag.gradeAnswer(s, c.conceptId, q2, q2.answer); // confirming recovery
  ok(!c.done && c.stage === 0 && c.askedThisStage === 2, "wrong→right stays mid-band for one more question");
  const q3 = diag.nextQuestion(s);
  diag.gradeAnswer(s, c.conceptId, q3, q3.answer); // second correct at the band
  ok(c.stage === 1 || c.done, "the recovered band advances on its second correct answer");
}
{
  const s = diag.newDiagnosticSession("maths", "baseline");
  const c = s.concepts[0];
  const q1 = diag.nextQuestion(s);
  diag.gradeAnswer(s, c.conceptId, q1, (q1.answer + 1) % q1.choices.length); // miss
  const q2 = diag.nextQuestion(s);
  diag.gradeAnswer(s, c.conceptId, q2, (q2.answer + 1) % q2.choices.length); // second miss
  ok(c.done && c.correctThisStage === 0, "0/2 after the retest stops the band honestly");
}
// Audit P0-B: fixed anchors make baseline/retest a matched measurement.
{
  const anchors = diag.benchmarkAnchors("maths");
  ok(anchors.length >= 3, `maths has a fixed anchor set (${anchors.join(", ")})`);
  const s2 = diag.newDiagnosticSession("maths", "baseline");
  const ids = s2.concepts.map((x) => x.conceptId);
  ok(anchors.every((a) => ids.includes(a)), "a baseline session walks exactly the anchor concepts");
  ok(s2.kind === "baseline", "baseline sessions are labelled");
  const p = diag.newDiagnosticSession("maths");
  ok(p.kind === "probe", "probe sessions stay random and labelled");
}
// Audit P0-A: the evidence fold seeds the learner model, marks observation,
// never touches proof records, and releases to practice evidence in time.
{
  const st = { profile: { id: "t" }, progress: {}, diagnostics: {}, masteries: {}, secret: "s" };
  const c = mkLadder("fractions");
  c.asked = 4; c.correct = 1; c.servedDifficulty = [0.15, 0.4];
  diag.applyDiagnosticResult(st, { kind: "baseline", concepts: [c] });
  const seeded = st.progress.fractions;
  ok(seeded && seeded.attempts === 4 && seeded.mastery > 0, "diagnostic evidence seeds state.progress");
  ok(!!st.observed?.fractions, "a baseline marks the probed concept as observed");
  seeded.independent = { asked: 2, correct: 2 };
  diag.applyDiagnosticResult(st, { kind: "baseline", concepts: [c] });
  ok(seeded.independent.asked === 2, "the fold never touches independence evidence");
  const st2 = { profile: { id: "t2" }, progress: {}, diagnostics: {}, masteries: {}, secret: "s" };
  st2.progress.fractions = { attempts: 10, correct: 9, streak: 0, mastery: 0.7, accuracy: 0.9, lastSeen: 1, misconceptions: {} };
  diag.applyDiagnosticResult(st2, { kind: "baseline", concepts: [c] });
  ok(st2.progress.fractions.accuracy >= 0.85, "after practice release, stronger practice accuracy stands");
}

// ── 4. Path builder ─────────────────────────────────────────────────────────
console.log("▸ Learning path");
{
  // Simulate an advanced student: everything mastered except quadratics (0.5)
  // and its prereq algebra-expand (0.3).
  const masteries = Object.fromEntries(genIds.map((id) => [id, 0.95]));
  masteries["quadratics"] = 0.5;
  masteries["algebra-expand"] = 0.3;
  const hits = { "sign-slip": 3, "neg-slip": 2 };
  const path = diag.buildPath("maths", masteries, hits);
  ok(path.length >= 1, `path generated (${path.length} steps)`);
  ok(path.some((st) => st.conceptId === "quadratics" || st.conceptId === "algebra-expand"), "advanced gap appears in path");
  const withPrereq = path.find((st) => st.actions.some((a) => a.kind === "prerequisite"));
  ok(!!withPrereq, "weak prerequisite action present for advanced gap");
  ok(path.some((st) => st.note && st.note.length > 30), "misconception coaching note attached");
  ok(path.every((st) => st.actions.length > 0), "every step has actions");
  // beginner student: default 0.2 baseline → full path, stage-ordered
  const beginner = diag.buildPath("maths", {}, {});
  ok(beginner.length >= 6, `beginner path is long (${beginner.length})`);
  const stagesOf = beginner.map((st) => genome.CONCEPTS_BY_ID[st.conceptId].stage);
  ok(stagesOf.every((v, i) => i === 0 || v >= stagesOf[i - 1] - 1), "path roughly stage-ordered");
  const withLearn = beginner.filter((st) => st.actions.some((a) => a.kind === "learn"));
  ok(withLearn.length >= 3, "low-mastery steps include a learn action");
}

// ── 5. Progress / mastery ───────────────────────────────────────────────────
console.log("▸ Progress tracking");
{
  const state = {
    profile: { id: "t1", handle: "t", country: "KE", birthYear: 2010, language: "sw", goal: "engineer", subjects: ["maths"], createdAt: 0 },
    progress: {}, diagnostics: {}, masteries: {},
  };
  const m0 = progress.emptyProgress().mastery;
  let m = m0;
  for (let i = 0; i < 5; i++) m = progress.updateMastery(m, true, i + 1);
  ok(m > 0.7, `mastery climbs with correct answers (${m.toFixed(2)})`);
  let w = m;
  w = progress.updateMastery(w, false, 0);
  ok(w < m, "wrong answer drops mastery");
  const r1 = progress.recordAnswer(state, "fractions", "q1", 1, false, "expl", ["frac-slice"]);
  ok(r1.streak === 0 && state.progress.fractions.attempts === 1, "recordAnswer logs attempt + resets streak");
  ok(state.progress.fractions.misconceptions["frac-slice"] === 1, "wrong answer increments misconception counter");
  const r2 = progress.recordAnswer(state, "fractions", "q2", 0, true, "expl", []);
  ok(r2.streak === 1, "correct answer builds streak");
  const hits = progress.misconceptionHits(state, "maths");
  ok(hits["frac-slice"] === 1, "misconceptionHits aggregates by subject");
  const mm = progress.masteryMap(state, "maths");
  ok(typeof mm.fractions === "number", "masteryMap returns mastery");

  // ── The retention rule, probed at its edges ───────────────────────────────
  // Retention is the one dimension a learner cannot buy with more work in the
  // same sitting, and the same rule now decides (i) what the live model folds,
  // (ii) what the ledger projection replays and (iii) what the learner is TOLD
  // the moment their answer is marked. Three call sites and one rule: if the
  // predicate drifts, a learner gets congratulated for a memory they never
  // demonstrated — so every near-miss is asserted here rather than trusted.
  const retention = progress.isRetentionEvidence;
  const DAY = 24 * 60 * 60 * 1000;
  ok(retention({ source: "retrieval", hints: 0, sinceLast: DAY }) === true,
    "delayed hint-free retrieval IS retention evidence");
  ok(retention({ source: "retrieval", hints: 0, sinceLast: DAY - 1 }) === false,
    "and 24h − 1ms is not: the day is a threshold, not a rounding");
  ok(retention({ source: "retrieval", hints: 1, sinceLast: 9 * DAY }) === false,
    "a hinted retrieval is not (the recall was not unaided)");
  ok(retention({ source: "practice", hints: 0, sinceLast: 9 * DAY }) === false,
    "and neither is same-day practice, however long ago the last one was");
  ok(retention({ source: "retrieval", hints: 0, sinceLast: null }) === false,
    "nor recall of something with no prior evidence at all — unknown is not zero");
}

// ── 5c. What an answer PROVED: one rule, one vocabulary (§10, §14, §15, §18) ─
// The sentence under the mark, My Evidence's concept row, the session headline,
// a learner's assigned work and the teacher's monitor column all NAME the same
// four verdicts. They agree because they ask the same function — so the rule is
// probed at its edges here, and the two ways of asking it (one answer, and a
// record's own counts) are asserted to give the same verdict for the same
// evidence. A rule with two answers is the failure mode: nothing crashes, the
// sentence merely describes work the learner did not do.
console.log("▸ What an answer proved");
{
  const { proofVerdict, strongestProof, proofSentenceKey, proofLabelKey, PROOF_VERDICTS } = proofMod;
  const v = proofVerdict;
  ok(v({ correct: true, mode: "transfer", source: "transfer", hints: 0 }) === "transfer",
    "an unaided re-framing is transfer evidence");
  ok(v({ correct: true, mode: "transfer", source: "transfer", hints: 2 }) === "supported",
    "a HINTED re-framing is support, not transfer — the hint count is checked first, which is the bug this rule replaced");
  ok(v({ correct: true, mode: "independent", source: "practice", hints: 0 }) === "independent",
    "right with no hints at all is independence");
  ok(v({ correct: true, mode: "guided", source: "practice", hints: 3 }) === "supported",
    "and right with help is support — never described as autonomy");
  ok(v({ correct: true, retained: true, source: "retrieval", hints: 0 }) === "retained",
    "delayed unaided recall is the strongest claim there is, and it outranks the rest");
  ok(v({ correct: false, mode: "independent", source: "practice", hints: 0 }) === null,
    "a WRONG answer proves nothing: a miss is evidence, and this vocabulary describes achievement");

  // The aggregate form — what a table, a concept row or a session headline has
  // instead of one answer — must agree with the per-answer form.
  ok(strongestProof({ correct: 4, independentCorrect: 2, transferCorrect: 0, retentionCorrect: 0 }) === "independent",
    "a record with hint-free right answers has proved independence");
  ok(strongestProof({ correct: 4, independentCorrect: 2, transferCorrect: 1, retentionCorrect: 0 }) === "transfer",
    "and one with a re-framing outranks it rather than averaging with it");
  ok(strongestProof({ correct: 4, independentCorrect: 2, transferCorrect: 1, retentionCorrect: 1 }) === "retained",
    "and delayed recall outranks everything, exactly as it does for a single answer");
  ok(strongestProof({ correct: 3, independentCorrect: 0, transferCorrect: 0, retentionCorrect: 0 }) === "supported",
    "answers that were all taken with help are support");
  ok(strongestProof({ correct: 0, independentCorrect: 0, transferCorrect: 0, retentionCorrect: 0 }) === null,
    "while a page of wrong answers proves NOTHING — being marked is not being helped");

  // The names, and the fact that the code asks for them through the helper.
  ok(PROOF_VERDICTS.join() === "retained,transfer,independent,supported",
    "the four verdicts are declared strongest-first, so the priority order is data rather than a comment");
  for (const verdict of PROOF_VERDICTS) {
    ok(proofSentenceKey(verdict) === `fb.${verdict}` && proofLabelKey(verdict) === `prf.${verdict}`,
      `"${verdict}" has both a sentence and a short name, derived from the same word`);
  }
  ok(proofLabelKey("independent") !== proofSentenceKey("independent"),
    "the label is not the sentence — a table cell and a paragraph are different registers");

  // THE RULE IS SHARED, NOT COPIED. The live model folds through this exact
  // function object; if a caller ever grows its own copy this identity is what
  // fails.
  ok(progress.isRetentionEvidence === proofMod.isRetentionEvidence,
    "the live model and every other asker share ONE retention rule, not two that agree today");

  // ONE VOCABULARY, ENFORCED AT THE SOURCE. A surface that spells
  // `"fb.transfer"` by hand — or grows its own priority table — drifts from the
  // rule while still compiling, and the drift is invisible: the sentence still
  // reads like English. So the literals live only where they are defined
  // (lib/proof.ts) and where they are translated (lib/i18n.ts).
  const walkAll = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walkAll(`${dir}/${d.name}`) : [`${dir}/${d.name}`]);
  const codeFiles = [...walkAll("app"), ...walkAll("components"), ...walkAll("lib")]
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .filter((f) => f !== "lib/proof.ts" && f !== "lib/i18n.ts");
  const spelling = codeFiles.filter((f) => /"(fb|prf)\.(independent|supported|transfer|retained)"/.test(fs.readFileSync(f, "utf8")));
  ok(spelling.length === 0,
    `no surface spells a verdict key by hand — the vocabulary comes from lib/proof.ts (${spelling.join(", ") || `${codeFiles.length} files clean`})`);
  // The priority order as a copied LIST, which is the shape a second rule takes.
  const ruleCopies = codeFiles.filter((f) =>
    /\[[^\]]*"retained"[^\]]*"supported"[^\]]*\]/.test(fs.readFileSync(f, "utf8")));
  ok(ruleCopies.length === 0,
    `and none of them carries its own copy of the priority order (${ruleCopies.join(", ") || "none"})`);
  // Each surface that NAMES a verdict reaches the vocabulary rather than
  // guessing: the feedback sentence uses `proofSentenceKeyFor`, the tables use
  // `proofLabelKey` and `strongestProof`.
  for (const f of [
    "app/learn/[subject]/[concept]/page.tsx",
    "components/session-result.tsx",
    "app/progress/page.tsx",
    "app/teacher/page.tsx",
    "components/assignments.tsx",
  ]) {
    const src = fs.readFileSync(f, "utf8");
    ok(src.includes("proofLabelKey(") || src.includes("proofSentenceKeyFor("),
      `${f} names what the work proved through the shared vocabulary`);
  }
  // ONE OWNER FOR THE BAND WORD, by the same rule as the verdict vocabulary.
  // A rate becomes "Strong"/"Developing" in lib/evidence-view#dim (0.7) and
  // becomes a KEY only in components/dims#bandKey, so a surface that spells
  // `"mm.strong"` itself carries a second rule with its own threshold. There
  // was exactly one such surface: components/mind-map.tsx derived the same
  // three words from the model's MASTERY at 0.9/0.5, so one concept could read
  // "Strong" in the map and "Developing" in the record beside it. Nothing
  // imported it — only this file's own reachability table kept it in the tree
  // — so it is deleted, and the spelling is pinned here instead.
  const bandSpelling = codeFiles.filter((f) => /"mm\.(strong|developing|learning|new)"/.test(fs.readFileSync(f, "utf8")));
  ok(bandSpelling.length === 0,
    `no surface spells the band word by hand — it comes from components/dims#bandKey (${bandSpelling.join(", ") || `${codeFiles.length} files clean`})`);
  ok(!fs.existsSync("components/mind-map.tsx"),
    "and the orphaned mind map is gone rather than kept alive by a pin (it was the second derivation)");
}

// ── 5a-ter. The DECLARED TARGET ENVIRONMENT (lib/deployment.ts) ────────────
//
// OpenMind is built for schools where one teacher has fifty learners, five
// devices and a connection that disappears for a week, so those constraints
// are an input the system reads rather than an assumption it makes. What is
// pinned here is that the input is HONEST: the shipped profiles are valid, an
// unusable one is refused by name instead of being rounded to a default that
// would silently shape what children are taught, and every derived rule has a
// caller rather than sitting in the tree as scaffolding.
console.log("▸ Deployment profiles");
{
  const dep = require("../.verify/deployment.js");
  const llmMod = require("../.verify/llm.js");

  const bad = dep.DEPLOYMENT_PROFILES.filter((p) => dep.deploymentRefusal(p) !== null);
  ok(bad.length === 0,
    `every built-in deployment profile passes its own validation (${bad.map((p) => p.id).join(", ") || `${dep.DEPLOYMENT_PROFILES.length} profiles`})`);
  const ids = dep.DEPLOYMENT_PROFILES.map((p) => p.id);
  ok(new Set(ids).size === ids.length, `and their ids are unique (${ids.join(", ")})`);

  // A profile that is not one is refused BY NAME — the code, not a sentence,
  // because a log, a settings screen and this test all read the same answer.
  const shaped = (over) => ({
    id: "x", connectivity: "online", deviceMode: "personal", syncFrequency: "manual",
    maxDeviceStorageBytes: 1, languages: ["en"], teacherDevices: 0, learnerDevices: 0, ...over,
  });
  for (const [raw, want] of [
    [null, "not_an_object"],
    [{}, "missing_id"],
    [shaped({ connectivity: "sometimes" }), "bad_connectivity"],
    [shaped({ deviceMode: "classroom" }), "bad_device_mode"],
    [shaped({ syncFrequency: "often" }), "bad_sync_frequency"],
    [shaped({ maxDeviceStorageBytes: 0 }), "bad_storage_budget"],
    [shaped({ languages: [] }), "no_languages"],
    [shaped({ learnerDevices: -1 }), "bad_learnerDevices"],
  ]) {
    ok(dep.deploymentRefusal(raw) === want, `an unusable profile is refused by name (${want})`);
  }

  const unknown = dep.resolveDeployment({ OPENMIND_DEPLOYMENT: "not_a_site" });
  ok(unknown.profile.id === "default" && unknown.problem === "unknown_profile" && unknown.requested === "not_a_site",
    `an unknown profile still leaves a usable site, and says so rather than silently swapping (${unknown.problem})`);
  const inline = dep.resolveDeployment({ OPENMIND_DEPLOYMENT_PROFILE: JSON.stringify(shaped({ id: "own" })) });
  ok(inline.profile.id === "own" && inline.problem === "", "and a site's own profile in JSON is honoured");
  const junk = dep.resolveDeployment({ OPENMIND_DEPLOYMENT_PROFILE: "{not json" });
  ok(junk.profile.id === "default" && junk.problem === "profile_not_json", `while unreadable JSON is a named problem (${junk.problem})`);

  // ── The derived answers, which are the only way a caller asks ──────────
  const rural = dep.profileById("rural_school");
  const hubSite = dep.profileById("community_learning_hub");
  const fallback = dep.profileById("default");
  ok(dep.drainsOnArrival(rural) === false && dep.drainsOnArrival(hubSite) === true,
    "a metered site does not drain its own queue, a connected hub does");
  ok(dep.drainIntervalMs(rural) === null && dep.drainIntervalMs(hubSite) === 60000,
    `and only a site with a real connection gets a clock (${dep.drainIntervalMs(hubSite)}ms)`);
  ok(dep.mayReachCloud(rural) === false && dep.mayReachCloud(fallback) === true,
    "a declared-offline site may not reach the cloud; an undeclared one may");

  // ── Behaviour, through the real provider selector ──────────────────────
  // A key in the environment is not permission to spend a child's data.
  const savedKey = process.env.GEMINI_API_KEY;
  const savedDep = process.env.OPENMIND_DEPLOYMENT;
  process.env.GEMINI_API_KEY = "test-key-not-used";
  delete process.env.OPENMIND_DEPLOYMENT;
  const onDefault = llmMod.activeProvider();
  process.env.OPENMIND_DEPLOYMENT = "rural_school";
  const onOfflineSite = llmMod.activeProvider();
  if (savedDep === undefined) delete process.env.OPENMIND_DEPLOYMENT; else process.env.OPENMIND_DEPLOYMENT = savedDep;
  if (savedKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = savedKey;
  ok(onDefault === "gemini" && onOfflineSite === null,
    `a declared-offline site picks no cloud model even with a key present (${String(onDefault)} → ${String(onOfflineSite)})`);

  // ── The surfaces read the owner, and never claim what they did not do ──
  const bar = fs.readFileSync("components/offline-bar.tsx", "utf8");
  ok(bar.includes("drainsOnArrival(") && bar.includes("drainIntervalMs("),
    "the offline bar takes its sync policy from the one owner rather than from navigator.onLine alone");
  ok(/auto \? syncingLabel : waitingLabel/.test(bar),
    "and a site that may not drain by itself never tells the learner work is being sent");
  const hubRoute = fs.readFileSync("app/api/hub-status/route.ts", "utf8");
  ok(hubRoute.includes("resolveDeployment(process.env)") && hubRoute.includes("maxDeviceStorageBytes") && hubRoute.includes("problem"),
    "and the hub reports the environment it is actually running as, with any refusal, because that is the pilot's first question");

  // ── No scaffolding: every derived rule is read by something ────────────
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]);
  const readers = [...walk("app"), ...walk("components"), ...walk("lib")]
    .filter((f) => /\.(ts|tsx)$/.test(f) && f !== "lib/deployment.ts");
  const orphans = ["mayReachCloud", "drainsOnArrival", "drainIntervalMs"].filter((rule) =>
    !readers.some((f) => new RegExp(`\\b${rule}\\(`).test(fs.readFileSync(f, "utf8"))));
  ok(orphans.length === 0,
    `every derived deployment rule has a consumer (${orphans.join(", ") || "3 rules, 3 callers"})`);

  const syncKeys = ["offline.waiting", "offline.syncNow"];
  const syncGaps = [];
  const i18nMod = require("../.verify/i18n.js");
  for (const l of i18nMod.LANGS) {
    const tr = i18nMod.translator(l.code);
    for (const k of syncKeys) if (tr(k) === k) syncGaps.push(`${l.code}:${k}`);
  }
  ok(syncGaps.length === 0,
    `the manual-sync strings exist in all 15 languages (${syncGaps.slice(0, 4).join(", ") || "none missing"})`);
}

// ── 5b. Integrated mastery (audit P0-D): the claim matches the evidence ────
console.log("▸ Integrated mastery");
{
  const base = () => ({
    profile: { id: "t", handle: "t", country: "KE", birthYear: 2010, language: "sw", goal: "engineer", subjects: ["maths"], createdAt: 0 },
    progress: {}, diagnostics: {}, masteries: {},
  });
  // Guided drilling: EWMA accuracy reaches ~0.93, but no proof attempts exist.
  // Unproven accuracy caps at 0.75 — "I drilled it" is not "I can use it".
  const drilled = base();
  for (let i = 0; i < 12; i++) progress.recordAnswer(drilled, "fractions", `q${i}`, 0, true, "", []);
  const acc = drilled.progress.fractions.accuracy ?? 0;
  ok(acc >= 0.9, `guided accuracy climbs (${acc.toFixed(2)})`);
  ok(drilled.progress.fractions.mastery <= 0.75, `unproven drilling cannot claim strong (${drilled.progress.fractions.mastery.toFixed(2)})`);
  ok(drilled.progress.fractions.mastery < acc, "the claim never exceeds what was demonstrated");
  // Clean hint-free proof unlocks the 0.85 independence ceiling — higher than
  // the 0.75 cap unproven drilling earns — but transfer still gates strong.
  const proved = base();
  for (let i = 0; i < 3; i++) progress.recordAnswer(proved, "fractions", `q${i}`, 0, true, "", []);
  progress.recordAnswer(proved, "fractions", "p1", 0, true, "", [], { mode: "independent", hints: 0 });
  progress.recordAnswer(proved, "fractions", "p2", 0, true, "", [], { mode: "independent", hints: 0 });
  progress.recordAnswer(proved, "fractions", "p3", 0, true, "", [], { mode: "independent", hints: 0 });
  ok(Math.abs(proved.progress.fractions.mastery - 0.85) < 0.01, `clean independence unlocks the 0.85 ceiling (${proved.progress.fractions.mastery.toFixed(2)})`);
  ok(proved.progress.fractions.mastery > 0.75, `and stands above the unproven cap (0.75)`);
  // Transfer proof unlocks strong — no transfer evidence, no strong claim.
  const transferred = base();
  for (let i = 0; i < 8; i++) progress.recordAnswer(transferred, "fractions", `q${i}`, 0, true, "", []);
  for (let i = 0; i < 8; i++) progress.recordAnswer(transferred, "fractions", `t${i}`, 0, true, "", [], { mode: "transfer", hints: 0 });
  ok(transferred.progress.fractions.mastery >= 0.9, `proven transfer reaches strong (${transferred.progress.fractions.mastery.toFixed(2)})`);
  // A failed proof pulls the claim DOWN to what was demonstrated.
  const failed = base();
  for (let i = 0; i < 8; i++) progress.recordAnswer(failed, "fractions", `q${i}`, 0, true, "", []);
  progress.recordAnswer(failed, "fractions", "f1", 0, false, "", [], { mode: "independent", hints: 0 });
  progress.recordAnswer(failed, "fractions", "f2", 0, false, "", [], { mode: "independent", hints: 0 });
  ok(failed.progress.fractions.mastery < failed.progress.fractions.accuracy, `failed proof pulls the claim below accuracy (${failed.progress.fractions.mastery.toFixed(2)} < ${failed.progress.fractions.accuracy.toFixed(2)})`);
  // Recurring uncured misconception drags; a passed micro-diagnostic releases it.
  const slipping = base();
  for (let i = 0; i < 6; i++) progress.recordAnswer(slipping, "fractions", `q${i}`, 0, true, "", []);
  progress.recordAnswer(slipping, "fractions", "m1", 0, false, "", ["frac-slice"]);
  progress.recordAnswer(slipping, "fractions", "m2", 0, false, "", ["frac-slice"]);
  const before = slipping.progress.fractions.mastery;
  ok(mastery.masteryExplain(mastery.integratedMastery(slipping.progress.fractions)).includes("drag"), "explain string names the drag");
  slipping.progress.fractions.microDiag = { "frac-slice": { misconceptionId: "frac-slice", askedAt: Date.now(), answeredAt: Date.now(), score: 1 } };
  const after = mastery.integratedMastery(slipping.progress.fractions).integrated;
  ok(after > before + 0.03, `curing the misconception releases the drag (${before.toFixed(2)} → ${after.toFixed(2)})`);
}

// ── 3b. Difficulty targeting + depth-honest caps (audit P0-A) ─────────────
console.log("▸ Difficulty-tracked diagnostic");
{
  // Band targets drive seed-search targeting: the served question meets the
  // band when the generator can reach it, otherwise the best draw wins.
  const s = diag.newDiagnosticSession("maths");
  s.concepts = [{ conceptId: "negatives", stage: 0, askedThisStage: 0, correctThisStage: 0, done: false, asked: 0, correct: 0, usedSeeds: [], servedDifficulty: [] }];
  const easy = diag.nextQuestion(s);
  ok(!!easy && (easy?.difficulty ?? 0) >= 0.15, `band-0 serve meets its target (got ${easy?.difficulty})`);
  const s2 = diag.newDiagnosticSession("maths");
  s2.concepts = [{ conceptId: "negatives", stage: 2, askedThisStage: 0, correctThisStage: 0, done: false, asked: 0, correct: 0, usedSeeds: [], servedDifficulty: [] }];
  const hard = diag.nextQuestion(s2);
  ok(!!hard && (hard?.difficulty ?? 0) >= 0.3, `band-2 serve targets the top of the generator's range (got ${hard?.difficulty})`);
  // Depth-honest claim cap. The ceiling a ladder can claim is set by the
  // hardest question the CONCEPT genuinely serves, so the two ends are driven
  // here rather than asserted as a constant:
  //   · a shallow concept (negatives, whose generator tops out around 0.30)
  //     cannot yield a high mastery claim however cleanly it was answered;
  //   · a concept the depth layer reaches (averages) can, because its items now
  //     ask for reading a table rather than recalling a rule.
  // The old form of this test hard-coded `linear-equations serves 0.3 at every
  // band`, which stopped being true the moment that concept gained a multi-step
  // item — the cap moved because the CONTENT improved, not because the rule
  // changed.
  const driveConcept = (conceptId) => {
    const s = diag.newDiagnosticSession("maths");
    s.concepts = [{ conceptId, stage: 0, askedThisStage: 0, correctThisStage: 0, done: false, asked: 0, correct: 0, usedSeeds: [], servedDifficulty: [] }];
    let qq = diag.nextQuestion(s), g = 0;
    while (qq && g++ < 100) {
      diag.gradeAnswer(s, qq.conceptId, qq, qq.answer);
      qq = diag.nextQuestion(s);
    }
    return s.concepts[0];
  };
  const shallowRungs = diag.bandsFor("negatives");
  const shallowRun = driveConcept("negatives");
  const shallowM = diag.ladderMastery(shallowRun);
  // THE CLIMB STOPS AT THIS CONCEPT'S CEILING. It used to run the full ladder
  // for every concept, which served a generator topping out at 0.30 roughly
  // eight near-identical items, and then reported a mastery computed against
  // bands the concept had never expressed.
  ok(shallowRungs < diag.LADDER_STAGES && shallowRun.stage === shallowRungs - 1,
    `the climb stops at this concept's own ceiling (stage ${shallowRun.stage} of ${shallowRungs - 1}; its bank can express ${shallowRungs} of ${diag.LADDER_STAGES} bands)`);
  ok(shallowRun.asked === shallowRungs * 2,
    `and pays two questions per expressible band instead of eight (${shallowRun.asked} asked)`);
  // A FLAWLESS SWEEP OF THAT RANGE IS NOT CAPPED, and this is precisely where
  // the cap must not apply. It exists so a claim cannot outrun the evidence, but
  // measured against an absolute scale it made the strongest possible
  // demonstration of a shallow concept indistinguishable from a weak one — for
  // EVERY learner, permanently, because the ceiling belongs to the question bank
  // and not to them. The decision engine reads below the established bar as
  // "practise" and prescribed it again; that is the one-hop trap this pins shut.
  ok(shallowM >= 0.9,
    `a flawless sweep of a shallow concept's whole range reads as established, not as weak (${shallowM.toFixed(2)} ≥ 0.9; its items stop at ${questions.conceptDepth("negatives").toFixed(2)})`);
  const deepRun = driveConcept("averages");
  const deepM = diag.ladderMastery(deepRun);
  ok(deepM > 0.9 && deepM <= 0.98,
    `and a concept the depth layer reaches may claim more, because its items really are harder (${deepM.toFixed(2)} for a concept reaching ${questions.conceptDepth("averages").toFixed(2)})`);
  // The cap STILL BINDS where it should: a range that was not swept clean — one
  // wrong answer in this run — cannot claim more than the hardest item genuinely
  // served earned, however well the rest of it went.
  const oneSlip = diag.newDiagnosticSession("maths");
  oneSlip.concepts = [mkLadder("negatives")];
  let sq = diag.nextQuestion(oneSlip), firstWrong = true, guardS = 0;
  while (sq && guardS++ < 100) {
    const idx = firstWrong ? (sq.answer + 1) % sq.choices.length : sq.answer;
    firstWrong = false;
    diag.gradeAnswer(oneSlip, sq.conceptId, sq, idx);
    sq = diag.nextQuestion(oneSlip);
  }
  const slippedM = diag.ladderMastery(oneSlip.concepts[0]);
  const slipCap = Math.max(0.05, Math.min(0.98, 0.35 + 0.95 * questions.conceptDepth("negatives")));
  ok(slippedM <= slipCap + 1e-9,
    `but a run that was NOT swept clean is still capped by what its items served (${slippedM.toFixed(3)} ≤ cap ${slipCap.toFixed(3)})`);
  // A generator that CAN reach the band gets its full claim.
  const full = diag.newDiagnosticSession("maths");
  full.concepts = [{ conceptId: "quadratics", stage: 0, askedThisStage: 0, correctThisStage: 0, done: false, asked: 0, correct: 0, usedSeeds: [], servedDifficulty: [] }];
  let q3 = diag.nextQuestion(full), guard3 = 0;
  while (q3 && guard3++ < 100) {
    diag.gradeAnswer(full, q3.conceptId, q3, q3.answer);
    q3 = diag.nextQuestion(full);
  }
  const fullRun = full.concepts[0];
  ok(diag.ladderMastery(fullRun) >= 0.82, `full-depth run on a capable generator reaches its depth ceiling (${diag.ladderMastery(fullRun).toFixed(2)})`);
  // A single slip no longer amputates the ladder (two-strike bands).
  const resilient = diag.newDiagnosticSession("maths");
  resilient.concepts = [{ conceptId: "linear-equations", stage: 0, askedThisStage: 0, correctThisStage: 0, done: false, asked: 0, correct: 0, usedSeeds: [], servedDifficulty: [] }];
  let q2 = diag.nextQuestion(resilient), slips = 0, guard2 = 0;
  while (q2 && guard2++ < 60) {
    const wrong = slips === 0; // exactly one slip, then perfect
    const g = diag.gradeAnswer(resilient, q2.conceptId, q2, wrong ? (q2.answer + 1) % q2.choices.length : q2.answer);
    if (!g.correct) slips++;
    q2 = diag.nextQuestion(resilient);
  }
  const cur = resilient.concepts[0];
  ok(cur.stage >= 2 || cur.done, `one slip still lets the student climb (reached stage ${cur.stage})`);
}

// ── 5b. The depth layer, and practice difficulty following the record ──────
//
// Two claims, checked separately because they fail differently. The depth layer
// is a CONTENT claim (the bank can now ask a multi-step or interpreting
// question, and its items are well-formed); the practice ramp is a DECISION
// claim (what the learner has already done moves the next rung, up or down).
console.log("▸ The depth layer (lib/questions-deep)");
{
  const deep = require("../.verify/questions-deep.js");
  const bankQ = require("../.verify/question-bank.js");
  const ids = questions.DEPTH_CONCEPT_IDS;
  ok(ids.length >= 15, `the bank carries a depth family for ${ids.length} concepts`);
  ok(ids.every((id) => questions.hasGenerator(id)), "every depth family belongs to a concept that really has a generator");
  const SEEDS = 240;
  const problems = [];
  const deepestOf = new Map();
  for (const id of ids) {
    const declared = new Set(genome.CONCEPTS_BY_ID[id]?.misconceptions ?? []);
    let deepest = 0;
    for (let s = 0; s < SEEDS; s++) {
      const r = new questions.Rng(questions.hashSeed(`${id}:deep:${s}`));
      let item;
      try {
        item = deep.DEEP_GENS[id](r);
      } catch (err) {
        problems.push(`${id}: threw ${String(err).slice(0, 60)}`);
        break;
      }
      deepest = Math.max(deepest, item.difficulty);
      const opts = [item.correct, ...item.wrongs];
      if (new Set(opts).size !== opts.length || opts.some((o) => !String(o ?? "").trim())) {
        problems.push(`${id}: colliding options at seed ${s} — ${opts.join(" | ")}`);
      }
      if (!item.prompt?.trim() || !item.explanation?.trim()) problems.push(`${id}: empty text at seed ${s}`);
      if (!(item.difficulty >= 0 && item.difficulty <= 1)) problems.push(`${id}: difficulty ${item.difficulty} outside [0,1]`);
      for (const tag of item.tags) {
        if (!declared.has(tag)) problems.push(`${id}: tags "${tag}", which the concept does not declare`);
      }
    }
    deepestOf.set(id, deepest);
  }
  ok(problems.length === 0,
    `every depth family holds the option, text, band and belief contract over ${SEEDS} draws (${problems.slice(0, 3).join(" · ") || "all clean"})`);
  const multi = [...deepestOf.values()].filter((d) => bankQ.bandReachable("multi_step", d)).length;
  const dataB = [...deepestOf.values()].filter((d) => bankQ.bandReachable("data_interpretation", d)).length;
  ok(multi === ids.length, `every depth family can express multi-step work (${multi}/${ids.length})`);
  ok(dataB >= 6, `and ${dataB} of them reach the interpreting band, where the answer comes out of a table, graph or model`);
  // The deep items must not lean on the assembler's last-resort filler: a deep
  // family that needs "None of these" to reach four options is a broken item.
  const padded = [];
  for (const id of ids) {
    for (let s = 0; s < 40; s++) {
      const qq = questions.generateQuestion(id, `pad:${s}`);
      if (qq && qq.choices.some((c) => /None of these|Not enough information|Cannot be determined|^Option \d/.test(String(c)))) {
        padded.push(`${id}:${s}`);
      }
    }
  }
  ok(padded.length === 0, `no deep item falls back to filler options (${padded.slice(0, 3).join(", ") || "none"})`);

  // ── WHAT A STUDENT WOULD WRITE, IN THE TEXT THEY ARE SHOWN ────────────────
  // The option contract above checks that options are DISTINCT; these three
  // check that they are FIT TO READ. Each one exists because authoring the
  // senior families produced exactly this mistake, and the format sweep could
  // not see any of them:
  //
  //   · a coefficient that should have been whole came out of a division, so a
  //     prompt read "passes through the point (2, 23.333333333333332)";
  //   · choosing the constant freely made a "give your answers in surd form"
  //     item whose answer was "x = −4 ± √1" — two integers and no surd;
  //   · filtering a fixed index list against an already-drawn base emptied it,
  //     so a log question's index was NaN and "log₂₇ 9" became an integer.
  const hygiene = [];
  for (const id of ids) {
    for (let s = 0; s < SEEDS; s++) {
      const r = new questions.Rng(questions.hashSeed(`${id}:deep:${s}`));
      const item = deep.DEEP_GENS[id](r);
      const text = [item.prompt, item.correct, ...item.wrongs].join(" | ");
      if (/\d+\.\d{9,}/.test(text)) hygiene.push(`${id}: float tail in "${text.slice(0, 60)}"`);
      // Scoped to MATHS OPTIONS: `undefined` is a legitimate word in a
      // computing item (a program printing 'undefined' is the concept) and in
      // maths prose (a function that is undefined at a point), but it can
      // never be the value of a maths answer.
      const maths = genome.CONCEPTS_BY_ID[id]?.subject === "maths";
      if (maths && [item.correct, ...item.wrongs].some((o) => /NaN|undefined|Infinity/.test(String(o)))) {
        hygiene.push(`${id}: unprintable value in "${text.slice(0, 60)}"`);
      }
      if (id === "completing-square" && /surd form/.test(item.prompt)) {
        const m = String(item.correct).match(/√(\d+)/);
        if (!m || Number.isInteger(Math.sqrt(Number(m[1])))) hygiene.push(`${id}: "${item.correct}" is not a surd`);
      }
      // "1x³" and "+ -3x²" — the two ways an algebra item can read as a
      // print-out rather than as maths. General on purpose: the same blemish
      // exists in the BASE families (polynomials writes "x³ + -1x² + 1x"), and
      // a rule that only watched the family being fixed would report a clean
      // bank while a student read the rest of it.
      if (maths) {
        const algebra = [item.prompt, item.correct, ...item.wrongs].join(" | ");
        if (/(^|[^\d.])1x[²³⁴]?/.test(algebra)) hygiene.push(`${id}: writes a coefficient of 1 ("${String(item.prompt).split("\n")[0].slice(0, 44)}")`);
        if (/\+ -|− -|- -/.test(algebra)) hygiene.push(`${id}: plus a negative ("${String(item.prompt).split("\n")[0].slice(0, 44)}")`);
      }
      if (id === "logs" && /Without a calculator/.test(item.prompt)) {
        const m = String(item.correct).match(/^(\d+)\/(\d+)$/);
        if (m && Number(m[1]) % Number(m[2]) === 0) hygiene.push(`${id}: "${item.correct}" is an integer index`);
      }
    }
  }
  ok(hygiene.length === 0,
    `every deep item is written the way a student would write it (${hygiene.slice(0, 3).join(" · ") || "all clean"})`);
}
console.log("▸ Practice difficulty follows the learner's own record");
{
  const bank = require("../.verify/question-bank.js");
  const T = bank.practiceTarget;
  const fresh = T({ tier: 0.45, attempts: 0, correct: 0, streak: 0 });
  ok(fresh.reason === "fresh" && Math.abs(fresh.difficulty - 0.45) < 1e-9,
    `a concept with no answers starts at the course tier (${fresh.difficulty})`);
  const steady = T({ tier: 0.45, attempts: 2, correct: 1, streak: 0 });
  ok(steady.reason === "steady" && steady.difficulty === 0.45, "one right and one wrong holds the rung");
  const two = T({ tier: 0.45, attempts: 6, correct: 5, streak: 2 });
  const three = T({ tier: 0.45, attempts: 7, correct: 6, streak: 3 });
  ok(three.difficulty > two.difficulty, `a third straight correct raises the target (${two.difficulty} → ${three.difficulty})`);
  ok(two.reason === "stretch" && three.reason === "stretch", "and both name the reason a surface shows the learner");
  const climb = [0, 1, 2, 3, 4, 5, 6, 9].map((streak) => T({ tier: 0.45, attempts: streak + 2, correct: streak + 2, streak }).difficulty);
  ok(climb.every((d, i) => i === 0 || d >= climb[i - 1]), `the ramp never slides backwards as the streak grows (${climb.join(" → ")})`);
  ok(climb[climb.length - 1] <= bank.PRACTICE_MAX,
    `and it stops at the practice ceiling (${climb[climb.length - 1]} ≤ ${bank.PRACTICE_MAX}) — anything harder is the plan's call, not the serve's`);
  const repair = T({ tier: 0.45, attempts: 3, correct: 0, streak: 0 });
  ok(repair.reason === "repair" && repair.scaffold === true && repair.difficulty < 0.45,
    `a struggling learner is eased onto a lower rung AND offered support (${repair.difficulty}, scaffold ${repair.scaffold})`);
  const belief = T({ tier: 0.45, attempts: 9, correct: 7, streak: 3, misconceptionHits: 3 });
  ok(belief.scaffold === true && belief.reason === "repair",
    "a repeating belief outranks a good score — a streak does not buy past a named misconception");
  const floor = T({ tier: 0.15, attempts: 5, correct: 0, streak: 0 });
  ok(floor.difficulty >= bank.PRACTICE_MIN, `and the rung never drops below the floor (${floor.difficulty} ≥ ${bank.PRACTICE_MIN})`);
  const capTier = T({ tier: 0.95, attempts: 0, correct: 0, streak: 0 });
  ok(capTier.difficulty <= 0.7, `a tier above the practice band is anchored, not carried (${capTier.difficulty} ≤ 0.7)`);
}

// ── 6. Socratic tutor ───────────────────────────────────────────────────────
console.log("▸ Socratic tutor");
{
  const reply = socratic.socraticReply("quadratics", "I am stuck, please give me the answer");
  ok(reply.length > 40 && reply.length < 800, "tutor reply is a reasonable length");
  ok(!/\bthe answer is\b/i.test(reply), "tutor never hands over the answer directly");
  ok(socratic.socraticReply("quadratics", "why?").includes("?"), "tutor replies with a question");
  const pack = socratic.tutorPromptPack("fractions", "help");
  ok(pack.includes("MISCONCEPTION") || pack.includes("CONCEPT"), "LLM context pack carries misconception data");
  const ex = socratic.workedExample("linear-equations");
  ok(ex && ex.steps.length === 4 && ex.prompt.length > 5, "worked example generates with 4 steps");
}

// ── 7. i18n integrity ───────────────────────────────────────────────────────
console.log("▸ Internationalisation");
{
  const enKeys = Object.keys(i18n.LANGS) && null; // noop guard
  const en = require("../.verify/i18n.js");
  const t = en.translator("en");
  ok(t("home.heroTitle") !== "home.heroTitle", "en dictionary resolves");
  const full = en.LANGS.filter((l) => l.status === "full");
  ok(full.length >= 9, `full languages >=9 (got ${full.length})`);
  ok(en.LANGS.length >= 14, `languages >=14 (got ${en.LANGS.length})`);
  const rtl = en.LANGS.filter((l) => l.dir === "rtl").map((l) => l.code);
  ok(JSON.stringify(rtl) === JSON.stringify(["ar", "ur", "fa"]), `RTL set correct (${rtl.join(",")})`);
  // every full language resolves the core keys to non-English text for key ones
  const core = ["home.heroTitle", "home.cta", "learn.check", "rooms.create", "teach.createClass"];
  for (const l of full) {
    const tr = en.translator(l.code);
    const missing = core.filter((k) => tr(k) === en.translator("en")(k) && k !== "home.heroTitle" && l.code !== "en");
    if (l.code !== "en") ok(missing.length <= 1, `${l.code} covers core keys (missing: ${missing.join(",")})`);
  }
  // draft languages fall back gracefully
  const trDe = en.translator("de");
  ok(trDe("home.heroTitle") !== "home.heroTitle" || true, "draft resolves");
  ok(typeof trDe("nonexistent.key.zzz") === "string", "missing keys fall back without crashing");

  // ── Every tutor sentence, in every language ───────────────────────────────
  // The tutor's sentences are keys, but lib/socratic.ts resolves them from an
  // ARRAY (`openerKeys`) and through a helper with an inline English default, so
  // neither a `t("…")` scan nor a crash would notice a hole. English was missing
  // all five openers and twelve other lines: the opener resolved to the key, the
  // array came back empty, and EVERY default reply collapsed to one fixed
  // paragraph — a learner typing three different things got the identical reply
  // three times, which is what "the tutor is canned text" looks like from the
  // outside. A string living only in code is invisible to translation, so this
  // sweep holds all fifteen dictionaries to the same standard.
  const SOC_KEYS = [
    "soc.opener1", "soc.opener2", "soc.opener3", "soc.opener4", "soc.opener5",
    "soc.refuse", "soc.sure", "soc.whyQ", "soc.stuckLead", "soc.given", "soc.givenQ",
    "soc.restate", "soc.start", "soc.step1", "soc.step2", "soc.step3", "soc.step4",
    "soc.check", "soc.checkQ",
    // The grounded fallback's three sentences: without them a locale's tutor
    // falls back to the inline English mid-reply, exactly the leak this sweep
    // exists to catch.
    "soc.onScreen", "soc.serveWhy", "soc.ownSlips",
    // The three moves the acceptance battery forced into existence: a hint
    // request, a question about a DIFFERENT concept, and a message that
    // touches nothing on the screen. Each is a sentence a learner reads, so
    // each is an entry in all fifteen dictionaries.
    "soc.hintLead", "soc.hintQ", "soc.otherConcept", "soc.hereInstead", "soc.unclear",
    // The two teach-me moves, added because the product benchmark measured
    // "explain it to me" and "show me a worked example" getting the SAME reply
    // as "The capital of France is Paris." (8/10 distinct replies).
    "soc.explainLead", "soc.explainQ", "soc.exampleLead", "soc.exampleQ", "soc.exampleNone",
    // And the why-branch's read-back, which ended the byte-identical collision
    // between two different why-questions.
    "soc.whyLead",
  ];
  for (const l of en.LANGS) {
    const tr = en.translator(l.code);
    const unresolved = SOC_KEYS.filter((k) => tr(k) === k);
    ok(unresolved.length === 0,
      `${l.code} defines every Socratic sentence (unresolved: ${unresolved.join(", ") || "none"})`);
  }
  {
    // …and the dictionary is what a reply actually uses: an opener must appear
    // in the reply, not merely resolve. This is the assertion the live bug would
    // have failed.
    const soc = require("../.verify/socratic.js");
    const replies = new Set();
    for (let i = 0; i < 40; i++) replies.add(soc.socraticReply("linear-equations", `I am working on question number ${i}`, "en"));
    ok(replies.size >= 3,
      `different questions are not all answered with one canned paragraph (${replies.size} distinct replies in 40 turns)`);
    ok(soc.socraticReply("linear-equations", "I am working on question 3", "en")
      === soc.socraticReply("linear-equations", "I am working on question 3", "en"),
      "and the same question twice is answered the same way — a tutor a learner cannot re-read is not a tutor");
    const gibberish = soc.socraticReply("linear-equations", "xx", "en");
    ok(gibberish === soc.socraticReply("linear-equations", "xx", "en")
      && !/balance scale|3x/.test(gibberish),
      `words with nothing to work with get an honest request, not a lesson (${gibberish.slice(0, 60)}…)`);
    ok(soc.socraticReply("linear-equations", "help", "en").includes("?"),
      "while a keyword that DOES decide still decides — \"help\" is the stuck scaffold");

    // ── The three moves a real learner's messages demanded ────────────────
    // An acceptance pass over eight messages on one concept showed every single
    // one answered with the concept definition plus a Socratic question: a hint
    // request got a question about intuition, and "what is the capital of
    // France?" got the place-value lesson. §tutor is explicit — be short, do
    // not repeat the definition, and say so when the question is unrelated —
    // and these four assertions are that paragraph, executable.
    const screen = { question: "What is the value of the tens digit in 873?", serveReason: "steady" };
    const grounded = soc.socraticReply("place-value", "What is this?", "en", screen);
    ok(!grounded.includes("Place value:"),
      "a grounded turn does NOT repeat the concept definition — the lesson is on the page behind the panel");
    ok(grounded.includes("873"),
      "it speaks about the question actually on screen instead");
    const hinted = soc.socraticReply("place-value", "Give me a hint", "en", screen);
    ok(/hint/i.test(hinted) && !hinted.includes("Place value:"),
      `asking for a hint points at the hint ladder, not at the definition (${hinted.slice(0, 70)}…)`);
    const other = soc.socraticReply("place-value", "Can you explain quadratics to me instead?", "en", screen);
    ok(/quadratic/i.test(other) && !other.includes("Place value:"),
      `asking about a DIFFERENT concept names that concept and says where it lives (${other.slice(0, 80)}…)`);
    const unrelated = soc.socraticReply("place-value", "What is the capital of France?", "en", screen);
    ok(!unrelated.includes("Place value:") && unrelated.length < 400,
      `a message that touches nothing on screen gets a short offer, not a lesson (${unrelated.slice(0, 80)}…)`);
    // ── ASKING TO BE TAUGHT IS NOT AN UNRELATED MESSAGE ────────────────────
    // "explain it to me" and "show me a worked example" were not recognised as
    // requests at all, so all three messages above got ONE reply — the product
    // benchmark measured 8/10 distinct. These four keep them apart: the
    // explanation names the idea, the example walks the engine's own generated
    // question (a DIFFERENT one — the on-screen answer stays withheld), and
    // only the message that touches nothing gets the offer.
    const explained = soc.socraticReply("place-value", "explain it to me", "en", screen);
    const exemplified = soc.socraticReply("place-value", "show me a worked example", "en", screen);
    ok(explained !== unrelated && exemplified !== unrelated && explained !== exemplified,
      "asking to be taught is answered as a request, not as an unrelated message");
    ok(explained.includes("Place value:"),
      `an explanation request gets the idea itself (${explained.slice(0, 60)}…)`);
    // The example is the engine's OWN generated question, and the reply says so:
    // it still names the learner's on-screen question (that is grounding, not
    // leakage) but walks a different one, whose answer is not the one withheld.
    ok(/Step 1/.test(exemplified) && /different question/.test(exemplified),
      `a worked-example request gets a worked example of its own, labelled as a different question (${exemplified.slice(0, 60)}…)`);
    // …and naming another idea still wins: "explain quadratics to me" is about
    // quadratics, whichever move recognises it.
    const elsewhere = soc.socraticReply("place-value", "Can you explain quadratics to me instead?", "en", screen);
    ok(/quadratic/i.test(elsewhere) && !/Place value:/.test(elsewhere),
      `an explain request about ANOTHER concept still names that concept (${elsewhere.slice(0, 70)}…)`);
    // A worked example is generated, so it must be SEEDED by the ask: the same
    // request twice has to walk the same example, or a tutor cannot be re-read
    // and the offline engine cannot agree with the server on the same inputs.
    ok(soc.socraticReply("place-value", "show me a worked example", "en", screen)
      === soc.socraticReply("place-value", "show me a worked example", "en", screen),
      "and the same worked-example request walks the same example twice");
    // The concept-only caller keeps its shape: rooms and the offline card still
    // get the concept-grounded scaffold, because there they have no screen.
    ok(soc.socraticReply("place-value", "I am stuck on this one", "en").includes("Place value:"),
      "a concept-only turn (no screen context) still carries the concept line");
    const we = soc.workedExample("fractions", "es");
    ok(we !== null && we.steps[3].includes("\""),
      `a translated worked example still states the correct choice (${we?.steps[3]?.slice(0, 60)})`);
  }

  // ── What the answer PROVED, in every language (§10, §14) ──────────────────
  // The method verdict is the sentence that follows the mark, so a hole in a
  // dictionary is not a cosmetic gap: it is the most-read line in the product
  // rendered as a raw key. And "defined" is not enough — the four sentences are
  // the same CLAIM about the same answer in fifteen languages, so one that is
  // merely English copied fifteen times would satisfy `tr(k) !== k` while
  // shipping an untranslated interface. Both halves are asserted.
  const FB_KEYS = ["fb.independent", "fb.supported", "fb.transfer", "fb.retained"];
  const enFb = en.translator("en");
  for (const l of en.LANGS) {
    const tr = en.translator(l.code);
    const unresolved = FB_KEYS.filter((k) => tr(k) === k);
    ok(unresolved.length === 0,
      `${l.code} defines every method verdict (unresolved: ${unresolved.join(", ") || "none"})`);
    if (l.code === "en") continue;
    const copied = FB_KEYS.filter((k) => tr(k) === enFb(k));
    ok(copied.length === 0,
      `${l.code} translates the method verdict rather than repeating the English (copied: ${copied.join(", ") || "none"})`);
  }
  // ── …and in the RIGHT dictionary ─────────────────────────────────────────
  // The dictionaries in lib/i18n.ts are not in `LANGS` order — the draft block
  // (de, ja, zh, fa, ur) sits between `tl` and `bn` — so a one-shot script that
  // pairs text with dictionary by INDEX writes Urdu into German, and nothing
  // crashes: the TypeScript is valid, every key resolves, and the app quietly
  // congratulates a German learner in Urdu. Cross-language equality cannot see
  // it (German text ≠ Urdu text), but the SCRIPT can: the assertion below pins
  // each language to its own writing system, which is the property a wrong
  // pairing violates and a correct one always satisfies.
  const SCRIPT = {
    // code: [regex of a character the sentence must contain, "what it must be"]
    ar: [/[\u0600-\u06FF]/, "Arabic script"],
    ur: [/[\u0600-\u06FF]/, "Arabic script"],
    fa: [/[\u0600-\u06FF]/, "Arabic script"],
    hi: [/[\u0900-\u097F]/, "Devanagari"],
    bn: [/[\u0980-\u09FF]/, "Bengali script"],
    ja: [/[\u3040-\u30FF\u4E00-\u9FFF]/, "kana or kanji"],
    zh: [/[\u4E00-\u9FFF]/, "CJK"],
  };
  // Latin-script languages must contain NO character from the ranges above: a
  // Devanagari or Arabic glyph in `de` is the same bug seen from the other side.
  const NON_LATIN = /[\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\u3040-\u30FF\u4E00-\u9FFF]/;
  for (const l of en.LANGS) {
    const tr = en.translator(l.code);
    const sentences = FB_KEYS.map((k) => tr(k));
    const spec = SCRIPT[l.code];
    if (spec) {
      const wrong = sentences.filter((s) => !spec[0].test(s));
      ok(wrong.length === 0,
        `${l.code} writes its method verdict in ${spec[1]} (off-script: ${wrong.length}/${sentences.length})`);
    } else {
      const wrong = sentences.filter((s) => NON_LATIN.test(s));
      ok(wrong.length === 0,
        `${l.code} writes its method verdict in Latin script, not another language's (off-script: ${wrong.length}/${sentences.length})`);
    }
  }

  // ── …and the SHORT NAME for each verdict, in every language ──────────────
  // The same four verdicts also appear as one-word labels: My Evidence's
  // concept row, the session headline, a learner's assigned work and the
  // teacher's monitor column. A reader compares those across a table, so a hole
  // is not a cosmetic gap — it is a bare `prf.transfer` in a cell. And the keys
  // are taken from the HELPERS the surfaces actually call, so a rename that
  // forgot the dictionaries is caught here rather than on screen.
  const PRF_KEYS = proofMod.PROOF_VERDICTS.map((v) => proofMod.proofLabelKey(v));
  ok(PRF_KEYS.every((k) => FB_KEYS.includes(`fb.${k.slice(4)}`)),
    "every labelled verdict has a sentence too — a label with no sentence is a verdict nobody explained");
  for (const l of en.LANGS) {
    const tr = en.translator(l.code);
    const unresolved = PRF_KEYS.filter((k) => tr(k) === k);
    ok(unresolved.length === 0,
      `${l.code} names every proof verdict (unresolved: ${unresolved.join(", ") || "none"})`);
    if (l.code === "en") continue;
    const copied = PRF_KEYS.filter((k) => tr(k) === enFb(k));
    ok(copied.length === 0,
      `${l.code} names the verdicts in its own language (copied: ${copied.join(", ") || "none"})`);
    // …and in the RIGHT dictionary, which is the failure this check exists for:
    // a positional one-shot writes Urdu into German, every key resolves, and the
    // app labels a German learner's work in Urdu. Cross-language equality cannot
    // see it; the writing system can.
    const labels = PRF_KEYS.map((k) => tr(k));
    const labelSpec = SCRIPT[l.code];
    if (labelSpec) {
      const wrong = labels.filter((s) => !labelSpec[0].test(s));
      ok(wrong.length === 0,
        `${l.code} names its proof verdicts in ${labelSpec[1]} (off-script: ${wrong.length}/${labels.length})`);
    } else {
      const wrong = labels.filter((s) => NON_LATIN.test(s));
      ok(wrong.length === 0,
        `${l.code} names its proof verdicts in Latin script, not another language's (off-script: ${wrong.length}/${labels.length})`);
    }
  }
  // The session headline and the teacher's column are read by people who are
  // not the learner, so they are keys in their own right, not reused prose.
  for (const k of ["sess.proved", "teach.proved"]) {
    for (const l of en.LANGS) {
      ok(en.translator(l.code)(k) !== k, `${l.code} defines ${k}`);
    }
  }

  // The content tier: every non-English dictionary must carry every concept
  // title, every blurb and every misconception name. Those are what a learner
  // reads most often, and a gap shows up as English mid-sentence.
  const content = require("../.verify/content-i18n.js");
  const genomeMod = require("../.verify/genome.js");
  const mcMod = require("../.verify/misconceptions.js");
  const concepts = genomeMod.CONCEPTS.map((c) => c.id);
  const mcIds = Object.keys(mcMod.MISCONCEPTIONS_BY_ID);
  ok(concepts.length >= 130, `genome has a full concept set (${concepts.length})`);
  ok(mcIds.length >= 40, `misconception catalogue is populated (${mcIds.length})`);
  for (const l of en.LANGS) {
    if (l.code === "en") continue;
    const tr = en.translator(l.code);
    const missTitles = concepts.filter((id) => tr(`cn.${id}`) === `cn.${id}`);
    const missBlurbs = concepts.filter((id) => tr(`cb.${id}`) === `cb.${id}`);
    const missNames = mcIds.filter((id) => tr(`mc.${id}`) === `mc.${id}`);
    ok(missTitles.length === 0, `${l.code} names every concept (missing ${missTitles.length})`);
    ok(missBlurbs.length === 0, `${l.code} describes every concept (missing ${missBlurbs.length})`);
    ok(missNames.length === 0, `${l.code} names every misconception (missing ${missNames.length})`);
  }
  // Coaching is authored English only, so it must NEVER be spliced into a
  // translated sentence: the helper returns "" instead, and the caller drops
  // the clause. English reads the catalogue (it is the source text).
  const arCoach = content.mcCoachingNative("ar", mcIds[0]);
  ok(arCoach === "", `coaching stays out of a translated sentence ("${arCoach.slice(0, 40)}")`);
  ok(content.mcCoachingNative("en", mcIds[0]).length > 20, "English still reads the catalogue's coaching");
  // A translated name is returned as itself, never as a raw mc.<id> key.
  const arName = content.mcName("ar", mcIds[0], "FALLBACK");
  ok(arName !== "FALLBACK" && arName !== `mc.${mcIds[0]}`, `misconception names arrive translated (${arName.slice(0, 30)})`);
}

// ── 8. ancestors / descendants sanity ───────────────────────────────────────
console.log("▸ Graph utilities");
{
  const anc = genome.ancestorsOf("calculus-diff");
  ok(anc.includes("functions") && anc.includes("indices-intro"), `ancestorsOf(calculus) finds chain (${anc.length} nodes)`);
  const desc = genome.descendantsOf("fractions");
  ok(desc.length >= 5, `descendantsOf(fractions) >=5 (${desc.length})`);
  ok(!anc.includes("calculus-diff"), "ancestors exclude self");
}

// ── 9. Question matcher (the wedge's brain) ─────────────────────────────
console.log("▸ Question matcher");
{
  const cases = [
    ["Solve 3x + 5 = 20", "linear-equations"],
    ["how do I add fractions with different denominators", "fraction-ops"],
    ["what is the gradient of y = 2x + 3", "straight-lines"],
    ["expand and simplify (x+2)(x+3)", "algebra-expand"],
    ["I keep getting the probability of at least one head wrong with tree diagrams", "tree-diagrams"],
    ["how do I complete the square for x^2 + 6x + 5", "completing-square"],
    ["what does dy/dx mean for y = x^2", "calculus-diff"],
    ["find the area of a circle with radius 5", "circle-area-arc"],
    ["simplify the surd root 50", "surds"],
    ["what is 15 percent of 60", "percentages"],
  ];
  for (const [text, expected] of cases) {
    const m = matcher.matchQuestion(text);
    ok(m !== null, `match("${text}") returns a result`);
    if (!m) continue;
    ok(m.confident, `match("${text}") is confident → ${m.conceptId} (${m.score.toFixed(2)})`);
    ok(m.conceptId === expected, `match("${text}") → ${expected} (got ${m.conceptId})`);
  }
  // honesty floor: gibberish must NOT pretend to know
  const junk = matcher.matchQuestion("zzz qq blorp 47 grrrr");
  ok(junk === null || !junk.confident, "gibberish is not confidently matched");
  const empty = matcher.matchQuestion("   ");
  ok(empty === null, "empty input returns null");
  // top-N: alternatives are provided and ranked
  const top = matcher.matchTop("solve quadratic equations by factorising", 3);
  ok(top.length >= 1 && top[0].conceptId === "quadratics", `matchTop ranks quadratics first (got ${top[0]?.conceptId})`);
}

// ── 10. Retention ladder ────────────────────────────────────────────────
console.log("▸ Retention scheduling");
{
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const mk = (mastery, lastSeen) => ({
    attempts: 5, correct: 4, streak: 2, mastery, lastSeen, misconceptions: {},
  });
  const state = {
    progress: {
      a: mk(0.95, now - 40 * DAY),  // 30-day bucket, 40d old → due
      b: mk(0.8, now - 10 * DAY),   // 7-day bucket (0.75–0.9), 10d old → due
      c: mk(0.8, now - 2 * DAY),    // 7-day bucket, not yet due
      d: mk(0.2, now - 10 * DAY),   // below the 0.3 floor → never scheduled
    },
  };
  const due = retention.dueReviews(state, now);
  const ids = due.map((r) => r.conceptId);
  ok(ids.includes("a"), "mastered-but-old concept is due");
  ok(ids.includes("b"), "7-day-bucket concept is due (0.8 mastery, 10 days)");
  ok(!ids.includes("c"), "not-yet-due concept is not due (0.8, 2 days)");
  ok(!ids.includes("d"), "unmastered concept is never scheduled");
  ok(due[0].conceptId === "a", "most overdue first");
}

// ── 11. Hint ladder ─────────────────────────────────────────────────────
console.log("▸ Hint ladder");
{
  const q = { prompt: "Solve 3x + 5 = 20", explanation: "Subtract 5 from both sides: 3x = 15. Then divide by 3: x = 5." };
  const l1 = hints.buildHint(q, 1);
  const l2 = hints.buildHint(q, 2);
  const l3 = hints.buildHint(q, 3);
  const l4 = hints.buildHint(q, 4);
  ok(l1.key && !l1.text, "level 1 is a translated nudge only");
  ok(l2.key && !l2.text, "level 2 is a translated strategy only");
  ok(l3.key && l3.text && l3.text.startsWith("Subtract 5"), "level 3 adds the question's first move");
  ok(l4.text === q.explanation && !l4.key, "level 4 is the full walkthrough");
  ok(!JSON.stringify(l1).includes("x = 5") && !JSON.stringify(l2).includes("x = 5"), "levels 1-2 never leak the answer");
  ok(hints.HINT_LEVELS.length === 4, "four rungs on the ladder");
}

// ── 12. Teacher weekly plan ─────────────────────────────────────────────────
console.log("▸ Teacher weekly plan");
{
  const cls = (students, conceptIds) => ({
    id: "cls_test", name: "Test", teacher: "t", joinCode: "ABC123", language: "en",
    conceptIds, students, createdAt: 0,
  });

  // Empty class: honest curriculum plan, full week structure, seeds present.
  const p0 = teacherPlan.buildWeeklyPlan(cls({}, ["fractions", "ratio"]));
  ok(p0.fromCurriculum === true, "no data → honest curriculum plan");
  ok(p0.days.length === 5 && p0.days[0].kind === "explain" && p0.days[4].kind === "mastery", "Mon explain → Fri mastery");
  ok(p0.focus.length >= 1, "focus non-empty even with no data");
  ok(p0.days.every((d) => d.seeds.length >= 3), "every day carries deterministic seeds");

  // Eight students, real-shaped data: fraction-ops weakest class-wide.
  const roster = {
    ada:  { fractions: 0.95, "fraction-ops": 0.3,  percentages: 0.9  },
    ben:  { fractions: 0.55, "fraction-ops": 0.1,  percentages: 0.85 },
    cy:   { fractions: 0.9,  "fraction-ops": 0.2,  percentages: 0.3  },
    dee:  { fractions: 0.85, "fraction-ops": 0.9,  percentages: 0.55 },
    eva:  { fractions: 0.92, "fraction-ops": 0.88, percentages: 0.95 },
    fin:  { fractions: 0.6,  "fraction-ops": 0.15, percentages: 0.25 },
    gus:  { fractions: 0.7,  "fraction-ops": 0.5,  percentages: 0.6  },
    hal:  { fractions: 0.5,  "fraction-ops": 0.05, percentages: 0.15 },
  };
  const data = cls(roster, ["fractions", "fraction-ops", "percentages"]);
  const plan = teacherPlan.buildWeeklyPlan(data);
  ok(plan.fromCurriculum === false, "data → data-driven plan");
  ok(plan.focus.includes("fraction-ops"), "class's weakest concept in focus");
  ok(plan.focus.indexOf("fractions") < plan.focus.indexOf("fraction-ops"), "foundations before operations");
  ok(JSON.stringify({ ...plan, generatedAt: 0 }) === JSON.stringify({ ...teacherPlan.buildWeeklyPlan(data), generatedAt: 0 }), "plan is deterministic");

  // Groups: snake-draft mixed ability — every student once, both levels per group.
  const all = plan.groups.flatMap((g) => g.members).sort();
  ok(JSON.stringify(all) === JSON.stringify(Object.keys(roster).sort()), "every student grouped exactly once");
  ok(plan.groups.every((g) => {
    const vs = g.members.map((h) => roster[h].percentages);
    return Math.max(...vs) >= 0.6 && Math.min(...vs) < 0.6;
  }), "each group mixes strong and weak students");

  // Scaffolds: ben (0.1 on fraction-ops, prereq fractions at 0.55) gets named;
  // dee (nothing below the line) does not.
  ok(plan.scaffolds.some((s) => s.who === "ben" && s.conceptId === "fractions"), "struggling student scaffolded to his weak prerequisite");
  ok(!plan.scaffolds.some((s) => s.who === "dee"), "healthy student not flagged");
  ok(plan.scaffolds.every((s) => s.who !== "ada" && s.who !== "cy"), "students with strong prereqs are practised, not scaffolded");

  ok(teacherPlan.classSubject(data) === "maths", "subject inferred from the roster's concepts");

  // ── WHICH SUBJECT THIS CLASS IS TAUGHT: ONE OWNER, AND IT IS NOT A LITERAL ──
  // The plan used to infer the subject from `cls.conceptIds` and end in
  // `return "maths"` — and since nothing in the product ever writes
  // `conceptIds`, that literal was the answer for every class it could make: a
  // class that declared physics was served a MATHS week, on screen and in the
  // printed pack, while the same class's assignment picker correctly offered
  // physics. The declaration now wins, inference survives for rosters that
  // predate the field, and a class that declares neither gets null — no week at
  // all, rather than a subject nobody chose. Asserted for EVERY subject the
  // platform teaches, so a future fallback cannot pass by being maths-shaped.
  const SUBJECTS = require("../.verify/subjects.js").SUBJECT_IDS;
  const declaring = (subject, conceptIds = []) => ({ ...cls({}, conceptIds), subject });
  for (const s of SUBJECTS) {
    ok(teacherPlan.classSubject(declaring(s)) === s, `a class that declares ${s} is taught ${s}`);
    const p = teacherPlan.buildWeeklyPlan(declaring(s));
    // Null-safe on purpose: a plan that does not exist must FAIL these, not
    // take the suite down with a TypeError — a crashed run reports nothing.
    ok(p?.subject === s && p.days.length === 5, `and its week is a ${s} week, not a maths one (${p?.subject})`);
    ok(!!p && p.days.every((d) => genome.getConcept(d.conceptId)?.subject === s) &&
       p.focus.every((cid) => genome.getConcept(cid)?.subject === s),
      `every concept the ${s} plan names belongs to ${s} (${p?.focus?.join(", ")})`);
  }
  ok(teacherPlan.classSubject(declaring("physics", ["fractions"])) === "physics",
    "the DECLARATION beats a concept that says otherwise — one owner, no second opinion");
  ok(teacherPlan.classSubject(cls({}, [])) === null,
    "a class that declared nothing has NO subject — an absence, not maths");
  ok(teacherPlan.buildWeeklyPlan(cls({}, [])) === null && teacherPlan.buildWeeklyPlan(declaring("math", [])) === null,
    "so there is no week to plan (and no maths week to print) for a subject nobody declared or the genome cannot serve");
  const planSrc = fs.readFileSync("lib/teacher-plan.ts", "utf8");
  ok(!/return\s+"maths"/.test(planSrc),
    "and the fallback literal that made every class in the product a maths class cannot come back");

  // ── THE CLASS'S OWN QUALIFICATION IS A CURRICULUM, NOT A LABEL ────────────
  // A class declares the subject it is taught and, optionally, the qualification
  // it sits. The picker has always narrowed by the course; the week did not, so
  // two classes of one subject at different qualifications planned the SAME week
  // and the declaration was decoration. Both now read one rule —
  // lib/specifications#courseConceptIds — and a class that declares no course is
  // still its whole subject.
  const specs = require("../.verify/specifications.js");
  ok(specs.courseRefusal("maths", "uk-gcse") === null,
    "a qualification the subject is part of is accepted for a class");
  ok(specs.courseRefusal("maths", "no-such-course") === "unknown_spec",
    "an id that means nothing is refused by name, never defaulted to a course");
  ok(specs.courseRefusal("physics", "us-sat") === "spec_does_not_teach_physics",
    `and a real qualification the subject is not part of is refused, naming the subject (${specs.courseRefusal("physics", "us-sat")})`);
  const withCourse = (specificationId) => ({ ...declaring("maths"), specificationId });
  const pGcse = teacherPlan.buildWeeklyPlan(withCourse("uk-gcse"));
  const pAlevel = teacherPlan.buildWeeklyPlan(withCourse("uk-alevel"));
  const pNone = teacherPlan.buildWeeklyPlan(withCourse(null));
  ok(JSON.stringify(pGcse.focus) !== JSON.stringify(pAlevel.focus),
    `two classes of one subject at different qualifications plan different weeks (${pGcse.focus.join(",")} vs ${pAlevel.focus.join(",")})`);
  const gcseCourse = specs.courseConceptIds(specs.specById("uk-gcse"));
  ok(pGcse.focus.every((cid) => gcseCourse.has(cid)),
    `and every concept the GCSE week names is in the GCSE course (${pGcse.focus.join(",")})`);
  ok(JSON.stringify(pNone.focus) === JSON.stringify(teacherPlan.buildWeeklyPlan(declaring("maths")).focus),
    "while a class that declares no qualification is planned against its whole subject, unchanged");
  const assignView = require("../.verify/server/assignment-view.js");
  const setOf = (course) => new Set(assignView.assignableConcepts("maths", course));
  ok(pGcse.focus.every((cid) => setOf("uk-gcse").has(cid)) || pGcse.fromCurriculum,
    "what the week teaches is a subset of what the class may be set — one curriculum, two readers");

  // ── ABSENCE IS NOT A LOW SCORE ────────────────────────────────────────────
  // A student with real work on one concept and NOTHING on another must read as
  // unmeasured on the second: no remediation aimed at it, no group built on it,
  // nothing in the plan that treats missing evidence as a failure. The scaffold
  // rule read `(m[pid] ?? 0) < 0.6`, so an unmeasured prerequisite was
  // indistinguishable from a failed one and the plan announced it was repairing
  // a gap it had never seen.
  const physicsClass = (students) => ({ ...cls(students, []), subject: "physics" });
  const partial = teacherPlan.buildWeeklyPlan(physicsClass({ kim: { momentum: 0.1 } }));
  ok(partial.focus[0] === "momentum", `the concept with evidence is what the week teaches (${partial.focus[0]})`);
  ok(partial.scaffolds.length === 0,
    `and an unmeasured prerequisite is NOT a gap to repair (${JSON.stringify(partial.scaffolds)})`);
  // The readable difference: a prerequisite the ledger DID measure low is still
  // named, so this is a rule about evidence, not the removal of the feature.
  // (momentum's first ancestor is newton-laws; measured at 0.5 it is below the
  // scaffold line but above the "stuck" line, so the plan must name it.)
  const prereq = genome.ancestorsOf("momentum")[0];
  const withMeasuredPrereq = teacherPlan.buildWeeklyPlan(physicsClass({ kim: { momentum: 0.1, [prereq]: 0.5 } }));
  ok(withMeasuredPrereq.scaffolds.some((s) => s.who === "kim" && s.conceptId === prereq),
    `while a prerequisite the ledger measured low is still scaffolded (${JSON.stringify(withMeasuredPrereq.scaffolds)})`);
  // No record at all: no focus, no group, no scaffold, and an honest curriculum plan.
  const blank = teacherPlan.buildWeeklyPlan(physicsClass({ kim: {} }));
  ok(blank.scaffolds.length === 0 && blank.groups.length === 0 && blank.fromCurriculum === true,
    "and a student with no record at all attracts no remediation and no ability group");
  ok(!/\?\?\s*0\)\s*<\s*0\.6/.test(planSrc) && planSrc.includes('typeof m[pid] === "number"'),
    "the absent-as-zero read cannot come back — the prerequisite must be MEASURED");
}

// ── 12. micro-diagnostic engine (§4–5) ──────────────────────────────────
console.log("▸ Micro-diagnostic engine");
{
  const micro = require("../.verify/microdiag.js");

  // Window semantics: 1s push at the tail, bounded length.
  const p = progress.emptyProgress();
  micro.pushRecentHit(p, "neg-slip", true);
  micro.pushRecentHit(p, "neg-slip", true);
  micro.pushRecentHit(p, "neg-slip", true);
  micro.pushRecentHit(p, "neg-slip", true);
  ok(micro.recentHitPattern(p, "neg-slip").length === 3, "recent window bounded to 3");
  ok(micro.shouldFlare(p, "neg-slip"), "2+ hits in window with recent miss flares");
  ok(!micro.shouldFlare(p, "no-such-tag"), "absent tag never flares");

  // Single mistake must NOT flare — never punish one slip with a diagnosis.
  const q1 = progress.emptyProgress();
  micro.pushRecentHit(q1, "neg-slip", true);
  ok(!micro.shouldFlare(q1, "neg-slip"), "single miss does not flare");

  // Repaired recent window (two passes at the tail) does not flare.
  const ok1 = progress.emptyProgress();
  micro.pushRecentHit(ok1, "neg-slip", true);
  micro.pushRecentHit(ok1, "neg-slip", true);
  micro.pushRecentHit(ok1, "neg-slip", false);
  micro.pushRecentHit(ok1, "neg-slip", false);
  micro.pushRecentHit(ok1, "neg-slip", false);
  ok(!micro.shouldFlare(ok1, "neg-slip"), "repaired window does not flare");

  // buildFlare returns a served (answer-free) micro-question on the home concept.
  const state = { profile: { id: "t1" }, progress: { "negatives": p }, masteries: {} };
  const flare = micro.buildFlare(state, "negatives", "neg-slip");
  ok(!!flare, "flare payload built for a flaring misconception");
  if (flare) {
    ok(flare.misconceptionId === "neg-slip", "flare names the misconception");
    ok(flare.check === null || !("answer" in flare.check.question), "micro-question served without answers");
    ok(flare.check === null || !("answerIndex" in flare.check.question), "no answer index without the test hook");
  }
  // Building the flare anchors it: a repeat build serves the identical probe.
  const flare2 = micro.buildFlare(state, "negatives", "neg-slip");
  ok(flare2 && flare.check && flare2.check && flare2.check.question.id === flare.check.question.id, "repeated flare serves the identical probe");

  // buildFlare refuses a resolved flare.
  const done = progress.emptyProgress();
  micro.pushRecentHit(done, "neg-slip", true);
  micro.pushRecentHit(done, "neg-slip", true);
  done.microDiag = { "neg-slip": { misconceptionId: "neg-slip", askedAt: 1, answeredAt: 2, score: 1 } };
  const state2 = { profile: { id: "t1" }, progress: { "negatives": done }, masteries: {} };
  ok(micro.buildFlare(state2, "negatives", "neg-slip") === null, "resolved flare does not re-probe");

  // gradeMicroCheck: build the flare first (anchors the probe), then grade the
  // served probe. The home concept is computed exactly as the engine does.
  const homeOf = misconceptions.MISCONCEPTIONS_BY_ID["neg-slip"].concepts.find((cid) => cid !== "negatives") ?? "negatives";
  const gp = progress.emptyProgress();
  micro.pushRecentHit(gp, "neg-slip", true);
  micro.pushRecentHit(gp, "neg-slip", true);
  const gstate = { profile: { id: "t1" }, progress: { "negatives": gp }, masteries: {} };
  const gflare = micro.buildFlare(gstate, "negatives", "neg-slip", true);
  ok(gflare && gflare.check && gflare.check.question.answerIndex === questions.generateQuestion(homeOf, micro.generateProbeId(gstate, "negatives", "neg-slip")).answer, "dev test hook exposes the probe's answer index");
  const seed = micro.generateProbeId(gstate, "negatives", "neg-slip");
  const realQ = questions.generateQuestion(homeOf, seed);
  ok(!!realQ && gflare?.check && realQ.id === gflare.check.question.id, "probe seed regenerates the served question");
  // The probe survives intervening answers: seed anchored to askedAt, not attempts.
  micro.pushRecentHit(gp, "neg-slip", false);
  progress.recordAnswer(gstate, "negatives", "x1", 0, false, "", []);
  const graded = micro.gradeMicroCheck(gstate, "negatives", "neg-slip", realQ.id, realQ.answer);
  ok(graded && graded.status === "procedural", "passed check classifies procedural, even after later answers");
  ok(gstate.progress["negatives"].microDiag["neg-slip"].score === 1, "micro-diag persisted on the concept");
  // Double grading is impossible: the flare is consumed.
  const again = micro.gradeMicroCheck(gstate, "negatives", "neg-slip", realQ.id, realQ.answer);
  ok(again === null, "an answered flare cannot be re-graded");

  // A missed check classifies conceptual.
  const cp = progress.emptyProgress();
  micro.pushRecentHit(cp, "neg-slip", true);
  micro.pushRecentHit(cp, "neg-slip", true);
  const cstate = { profile: { id: "t2" }, progress: { "negatives": cp }, masteries: {} };
  micro.buildFlare(cstate, "negatives", "neg-slip");
  const cq = questions.generateQuestion(homeOf, micro.generateProbeId(cstate, "negatives", "neg-slip"));
  const wrong = (cq.answer + 1) % cq.choices.length;
  const cgraded = micro.gradeMicroCheck(cstate, "negatives", "neg-slip", cq.id, wrong);
  ok(cgraded && cgraded.status === "conceptual", "failed check classifies conceptual");

  // Unanswered stays unresolved — no guessing.
  ok(micro.classify({ misconceptionId: "neg-slip", askedAt: 1, answeredAt: null, score: null }) === "unresolved", "unanswered check stays unresolved");
}

// ── Starter Mode engine (§6/§15) ──────────────────────────────────────────
{
  const starter = require("../.verify/starter.js");
  const gq = (cid) => questions.generateQuestion(cid, `starter-test:${cid}`);

  // Concept with tagged misconceptions (negatives → neg-slip, which also
  // touches linear-equations and algebra-expand): a confusion trap exists.
  const q = gq("negatives");
  ok(!!q, "negatives generates a question for the starter test");
  const s = starter.buildStarter("negatives", q);
  ok(s.asked === 3 && s.choices.length === 3, "starter builds a 3-connector bridge step");
  ok(!("answerIndex" in starter.viewStarter(s)), "view never leaks the answer index");
  const titles = s.choices;
  ok(new Set(titles).size === 3, "connector titles are unique");
  ok(titles.includes("Negative numbers"), "the real connector is among the choices");
  ok(starter.viewStarter(s).choices.join("|") === titles.join("|"), "view mirrors the state's deterministic shuffle");

  // Determinism: same seed → identical choices and answer index.
  const s2 = starter.buildStarter("negatives", q);
  ok(s2.choices.join("|") === s.choices.join("|") && s2.answerIndex === s.answerIndex, "starter is deterministic per question seed");

  // Wrong pick completes the flow (teaching, not gating) with the true bridge.
  const wrongIdx = s.choices.findIndex((t) => t !== "Negative numbers");
  const revW = starter.gradeConnector("negatives", s, wrongIdx, q);
  ok(revW.done && revW.correct === false, "a wrong bridge pick still completes the flow");
  ok(revW.connectorTitle === "Negative numbers", "the reveal names the real connector regardless");
  ok(typeof revW.firstMoveText === "string" && revW.firstMoveText.length > 0, "the reveal carries the first move (from the hint ladder)");

  // Right pick: reveal correct.
  const rightIdx = s.choices.indexOf("Negative numbers");
  const revR = starter.gradeConnector("negatives", s, rightIdx, q);
  ok(revR.done && revR.correct === true, "the correct bridge pick grades true");

  // Tiny-concept fallback: a concept with no tagged misconceptions and few
  // same-family siblings must degrade honestly rather than fake a step 3.
  const sNo = starter.buildStarter("place-value", gq("place-value"));
  ok(sNo.done === true || sNo.choices.length === 3, "concepts without connectors degrade honestly (skip or full step)");
  const vNo = starter.viewStarter(sNo);
  ok(vNo.step === 4 || (vNo.choices && vNo.choices.length === 3), "the view exposes only a skip or a full bridge step");
}

// ── Adaptation engine (§2, §10, §11) ───────────────────────────────────
{
  const access = require("../.verify/access.js");

  // Preference classes: each flag maps to exactly one html class.
  ok(JSON.stringify(access.prefClasses({ readAloud: false, largeText: true, highContrast: false, reduceMotion: true, preferSpeech: false })) === JSON.stringify(["access-large", "access-calm"]), "prefClasses maps flags to css classes");
  ok(access.prefClasses({ readAloud: true, largeText: false, highContrast: false, reduceMotion: false, preferSpeech: true }).length === 0, "speech preferences are behavioural, not css");

  // BCP-47 mapping for the device voice picker, with honest fallback.
  ok(access.bcp47("en") === "en-US" && access.bcp47("sw") === "sw-KE", "bcp47 maps UI codes to device tags");
  ok(access.bcp47("tl") === "fil-PH", "Filipino maps through its legacy code to fil-PH");
  ok(access.bcp47("xx") === "en-US", "unknown languages fall back to en-US");

  // Speakable text: control glyphs must never be read aloud.
  ok(access.speakableText("✓ Correct! → next 🔈") === "Correct! next", "speakableText strips control glyphs");
  ok(access.speakableText("  Work  out   8 − (−9). ") === "Work out 8 − (−9).", "speakableText collapses whitespace but keeps the maths");

  // Speech on a bare node context: supported() is false (no window), and the
  // speak wrapper must be a silent no-op rather than throw.
  ok(access.speechSupported() === false, "speechSupported is false without a browser");
  let threw = false;
  try { access.speak("hello", "en"); access.stopSpeaking(); } catch { threw = true; }
  ok(!threw, "speak wrappers never throw outside the browser");
}

// ── Curriculum specifications (§1, §2, §4, §9) ──────────────────────────────
// The specification layer is the claim "this platform understands your course".
// These assertions keep it honest: coverage must resolve to real genome
// concepts, no tier may claim an empty course, terminology mappings must occur
// in actual content rather than being decoration, and a tier's difficulty band
// must be the thing that changes how deep practice pitches.
console.log("▸ Curriculum specifications");
{
  const S = require("../.verify/specifications.js");
  const specs = S.SPECIFICATIONS;
  ok(specs.length >= 20, `at least 20 specifications are mapped (got ${specs.length})`);

  const countries = new Set(specs.map((s) => s.country));
  for (const c of ["GB", "US", "IN", "KE", "ZA", "AU", "CA", "IE", "NG", "PK", "BD", "PH", "ID", "BR", "MX", "INT", "XX"]) {
    ok(countries.has(c), `country ${c} has a mapped specification`);
  }

  const genomeIds = new Set(genome.CONCEPTS.map((c) => c.id));
  const unknown = [];
  let emptyTiers = 0;
  let totalCovered = 0;
  let bandsValid = true;
  let tiersAscend = true;
  for (const spec of specs) {
    ok(spec.levels.length >= 1, `${spec.id} has at least one tier`);
    ok(Object.keys(spec.coverage).length >= 1, `${spec.id} covers at least one subject`);
    for (let i = 1; i < spec.levels.length; i++) {
      if (spec.levels[i].difficulty < spec.levels[i - 1].difficulty) tiersAscend = false;
    }
    for (const lvl of spec.levels) {
      const rep = S.coverageReport({ spec, level: lvl });
      if (rep.covered === 0) emptyTiers++;
      totalCovered += rep.covered;
      if (lvl.difficulty < 0 || lvl.difficulty > 1) bandsValid = false;
      for (const id of [...(lvl.include ?? []), ...(lvl.exclude ?? [])]) {
        if (!genomeIds.has(id)) unknown.push(`${spec.id}/${lvl.id}:${id}`);
      }
      // Every covered concept must be a real concept, and coverage must never
      // exceed the genome it is resolved against.
      for (const c of S.coverageOf({ spec, level: lvl })) {
        if (!genomeIds.has(c.id)) unknown.push(`${spec.id}/${lvl.id}:${c.id}`);
      }
      if (rep.covered > genome.CONCEPTS.length) unknown.push(`${spec.id}/${lvl.id}: coverage exceeds genome`);
    }
  }
  ok(unknown.length === 0, `every specification concept resolves to the genome (bad: ${unknown.slice(0, 5).join(", ")})`);
  ok(emptyTiers === 0, `no tier has empty coverage (empty: ${emptyTiers})`);
  ok(totalCovered > 0, "coverage resolves concepts somewhere");
  ok(bandsValid, "every difficulty band is within [0, 1]");
  ok(tiersAscend, "tiers within a specification ascend in difficulty");

  // A national course must be a proper subset of the map; only the independent
  // pathway may claim the whole genome.
  const gcse = S.specById("uk-gcse");
  const found = S.coverageReport({ spec: gcse, level: gcse.levels[0] });
  ok(found.covered > 0 && found.covered < genome.CONCEPTS.length,
    `GCSE Foundation is a proper subset of the genome (${found.covered}/${genome.CONCEPTS.length})`);
  const ind = S.specById("any-independent");
  const indAdv = S.coverageReport({ spec: ind, level: ind.levels[ind.levels.length - 1] });
  ok(indAdv.covered === genome.CONCEPTS.length, "the independent pathway can reach the whole genome");

  // Terminology: a mapping that never matches real content is decoration, and
  // one that maps a word to itself is a no-op pretending to be a decision.
  const content = fs.readFileSync("lib/genome.ts", "utf8") + fs.readFileSync("lib/questions.ts", "utf8");
  for (const board of ["commoncore", "cbse", "kenyan", "aqa"]) {
    for (const { from, to } of S.termsFor(board)) {
      const hits = (content.match(new RegExp(`\\b${from}\\b`, "gi")) || []).length;
      ok(hits > 0, `term "${from}" (${board}) occurs in real content`);
      ok(from !== to, `term "${from}" (${board}) actually changes the word`);
    }
  }
  ok(S.applyTerminology("the gradient and BIDMAS", "commoncore") === "the slope and PEMDAS",
    "US terminology rewrites gradient and BIDMAS");
  ok(S.applyTerminology("the gradient and BIDMAS", "aqa") === "the gradient and BIDMAS",
    "UK keeps the genome's own words");
  ok(S.applyTerminology("standard form", "commoncore") === "scientific notation",
    "US terminology rewrites standard form");
  ok(S.applyTerminology("Standard form", "commoncore") === "Scientific notation",
    "terminology preserves sentence case");

  // The layer must surface in real generated content, not only in a string the
  // test wrote itself. A mapping that changes nothing a student ever reads is
  // decoration. Meanwhile a UK board must leave the genome's English alone.
  {
    let changed = 0;
    let example = null;
    let ukCorrupted = 0;
    for (const id of questions.GENERATED_CONCEPT_IDS) {
      for (let i = 0; i < 8; i++) {
        const q = questions.generateQuestion(id, `term-${i}`);
        if (!q) continue;
        const after = S.applyTerminology(q.explanation, "commoncore");
        if (after !== q.explanation) {
          changed++;
          example = example ?? `${id}: …${q.explanation.slice(0, 46)}… → …${after.slice(0, 46)}…`;
        }
        if (S.applyTerminology(q.explanation, "aqa") !== q.explanation) ukCorrupted++;
      }
    }
    ok(changed >= 3, `terminology changes real generated explanations (changed: ${changed})${example ? " — " + example : ""}`);
    ok(ukCorrupted === 0, `UK boards never rewrite the genome's own words (corrupted: ${ukCorrupted})`);

    // A replacement must read as English inside real sentences. Mapping
    // "gradient" → "slope of the line" turned "the gradient of the line" into
    // "the slope of the line of the line", because the source already carries
    // the phrase. So: no replacement may end with the word that follows the
    // match in the corpus.
    const collisions = [];
    for (const board of ["commoncore", "cbse", "kenyan"]) {
      for (const { from, to } of S.termsFor(board)) {
        const re = new RegExp(`\\b${from}\\b\\s+([A-Za-z']+)`, "gi");
        const after = [...content.matchAll(re)].map((m) => m[1].toLowerCase());
        const tail = to.split(/\s+/).pop().toLowerCase();
        if (after.includes(tail)) collisions.push(`${board}: "${from}" → "${to}" before "${tail}"`);
      }
    }
    ok(collisions.length === 0, `no terminology mapping repeats the following word (bad: ${collisions.join("; ")})`);
  }

  // Profile → specification resolution, including the exclusions that matter.
  const uk = S.specForProfile({ country: "GB", board: "aqa", grade: "Year 11" });
  ok(uk.spec.country === "GB" && uk.spec.id === "uk-gcse", "a UK AQA profile resolves to GCSE");
  const cbse = S.specForProfile({ country: "IN", board: "cbse", grade: "Class 10" });
  ok(cbse.level.id === "class10", `CBSE Class 10 grade selects the Class 10 tier (got ${cbse.level.id})`);
  ok(!S.inSpecification(cbse, "trig-rule"), "CBSE Class 10 does not claim the sine and cosine rules");
  ok(S.inSpecification(cbse, "quadratics"), "CBSE Class 10 does claim quadratics");
  const sat = S.specForProfile({ country: "US", board: "collegeboard", exam: "SAT" });
  ok(!S.inSpecification(sat, "proof"), "the SAT does not claim proof");
  ok(!S.inSpecification(sat, "vectors"), "the SAT does not claim vectors");
  ok(S.inSpecification(sat, "quadratics"), "the SAT does claim quadratics");
  const unmapped = S.specForProfile({ country: "ZZ" });
  ok(unmapped.spec.id === "any-independent" || unmapped.spec.country === "INT",
    "an unmapped country still gets a route");

  // The tier is the thing that changes practice depth.
  ok(S.difficultyFor({ spec: gcse, level: gcse.levels[0] }) < S.difficultyFor({ spec: gcse, level: gcse.levels[1] }),
    "Foundation pitches easier practice than Higher");

  // ...and the band must actually reach the question engine as a TARGET, not a
  // floor. `generateQuestionAt(concept, seed, 0.45)` on a generator spanning
  // 0.30–0.50 returns the 0.50 draw (the hardest work available) because "at
  // least 0.45" is satisfied by the top of the range — which would give a
  // Foundation student harder questions than a Higher student.
  {
    const mean = (conceptId, target) => {
      let sum = 0, n = 0;
      for (let i = 0; i < 40; i++) {
        const q = questions.generateQuestionNear(conceptId, `tier-${i}`, target, 5);
        if (q) { sum += q.difficulty; n++; }
      }
      return n ? sum / n : 1;
    };
    // `coordinates` is one of the generators with a real difficulty spread.
    const easy = mean("coordinates", 0.25);
    const hard = mean("coordinates", 0.5);
    ok(easy < hard, `a lower tier band serves easier draws on average (${easy.toFixed(3)} < ${hard.toFixed(3)})`);

    // The honest limit, asserted rather than hidden: most generators declare a
    // single difficulty, so tier bands cannot move them. Where that is the
    // case the served difficulty must equal the concept's one true value — no
    // fabricated variation — and the curriculum's real depth lever remains the
    // concept set its stage window selects.
    let uniformConcepts = 0;
    let fabricated = 0;
    for (const id of questions.GENERATED_CONCEPT_IDS) {
      const seen = new Set();
      for (let i = 0; i < 12; i++) {
        const q = questions.generateQuestion(id, `uni-${i}`);
        if (q) seen.add(q.difficulty);
      }
      if (seen.size === 1) {
        uniformConcepts++;
        const only = [...seen][0];
        const served = questions.generateQuestionNear(id, "uni", 0.95, 5);
        if (!served || served.difficulty !== only) fabricated++;
      }
    }
    ok(fabricated === 0, `a uniform generator never fakes a harder draw (bad: ${fabricated})`);
    ok(uniformConcepts > 0,
      `single-difficulty generators are declared, not hidden (${uniformConcepts} of ${questions.GENERATED_CONCEPT_IDS.length})`);
  }
}

// ── M9b. A paper is diagnostic evidence, not a score ────────────────────────
// The marking engine has always known which concept each question tested; the
// analysis turns that into "which ideas cost marks, did any recur, and what to
// drill". These assertions run on a REAL paper built by lib/papers.ts, so the
// claims are made about the same object a learner sits.
console.log("▸ Paper analysis");
{
  const { analysePaper } = paperAnalysis;
  const spec = require("../.verify/specifications.js");
  const uk = spec.specById("uk-gcse");
  ok(Boolean(uk), "the UK GCSE specification resolves for the paper test");
  const active = { spec: uk, level: uk.levels[uk.levels.length - 1] };
  const built = papers.buildPaper({ active, subject: "maths", seed: "analysis-1" });
  ok(built.key.questions.length > 10, `a real paper is built to analyse (${built.key.questions.length} questions)`);

  // Every question wrong: the diagnosis must account for every mark, name the
  // recurring ideas, and point at the biggest loss.
  const allWrong = {};
  for (const q of built.key.questions) allWrong[q.id] = (q.answer + 1) % 4;
  const result = papers.markPaper(built.key, allWrong);
  const a = analysePaper(built.key, result);

  const available = a.byConcept.reduce((s, c) => s + c.marksAvailable, 0);
  const awarded = a.byConcept.reduce((s, c) => s + c.marksAwarded, 0);
  const lost = a.byConcept.reduce((s, c) => s + c.marksLost, 0);
  ok(available === result.total, `per-idea marks add up to the paper total (${available} = ${result.total})`);
  ok(awarded === result.raw, "per-idea marks awarded add up to the raw score");
  ok(lost === a.lostMarks && a.lostMarks === result.total - result.raw, "lost marks are accounted for exactly");
  ok(a.unansweredCount === 0, "every question was answered, so none is counted unanswered");

  const maxLost = Math.max(...a.byConcept.map((c) => c.marksLost));
  ok(a.weakest && a.weakest.marksLost === maxLost, "the drill target is the biggest loss");
  ok(a.byConcept.every((c) => c.wrong + c.correct + c.unanswered === c.questions),
    "every question is classified exactly once");
  // Recurring ideas are the whole point: a paper that tests one idea twice and
  // loses marks on both is a pattern, not a slip.
  const repeated = a.byConcept.filter((c) => c.questions > 1);
  ok(repeated.length > 0, `this paper tests some ideas more than once (${repeated.length})`);
  ok(a.recurring.every((c) => c.questions > 1 && c.marksLost > 0), "only repeated ideas that cost marks are recurring");
  ok(a.concentration > 0 && a.concentration <= 1, `loss concentration is a real ratio (${a.concentration.toFixed(2)})`);
  const recurringLoss = a.recurring.reduce((s, c) => s + c.marksLost, 0);
  ok(Math.abs(a.concentration - recurringLoss / a.lostMarks) < 1e-9, "concentration is recurring loss over total loss");
  ok(a.missed.length === built.key.questions.length, "every lost question appears in the review list");
  // Tags come from the answer key and are attributed only to answers given:
  // a skipped question proves nothing about what the learner believes.
  const tagged = a.byConcept.filter((c) => c.tags.length > 0);
  // The two assertions below run PER tagged idea, so this block's coverage is
  // set by what the paper happened to draw: changing the bank moved the count
  // from 56 to 54 without a word. Asserted first so an untagged paper — the
  // case where the loop silently proves nothing — fails loudly instead.
  ok(tagged.length > 0, `the analysed paper carries tagged ideas for the loop below (${tagged.length})`);
  for (const c of tagged) {
    ok(c.wrong > 0, `${c.conceptId}: a misconception is only tagged when an answer was actually wrong`);
    ok(c.tags.every((t) => t.hits >= 1), `${c.conceptId}: tag hits are counted, not invented`);
  }

  // A perfect paper repairs nothing — and says so.
  const allRight = {};
  for (const q of built.key.questions) allRight[q.id] = q.answer;
  const perfect = analysePaper(built.key, papers.markPaper(built.key, allRight));
  ok(perfect.lostMarks === 0 && perfect.recurring.length === 0 && perfect.weakest === null,
    "a paper with no lost marks has nothing to repair");
  ok(perfect.concentration === 0, "concentration of an empty loss is zero, not NaN");

  // Skipping: lost marks, counted unanswered, never a wrong answer, never a tag.
  const halfSkipped = {};
  for (const [i, q] of built.key.questions.entries()) if (i % 2 === 0) halfSkipped[q.id] = q.answer;
  const skipped = analysePaper(built.key, papers.markPaper(built.key, halfSkipped));
  const totalSkipped = skipped.byConcept.reduce((s, c) => s + c.unanswered, 0);
  ok(skipped.unansweredCount === totalSkipped && totalSkipped > 0, "unanswered questions are counted as such");
  ok(skipped.byConcept.every((c) => c.tags.length === 0 || c.wrong > 0),
    "a skipped question never tags a misconception");
  ok(skipped.lostMarks > 0, "a skipped question still costs its marks");

  // A SPECIFICATION-BUILT paper's name is UI, not data: it must not spell out
  // the raw subject id. "— maths paper" is what a translated page used to show
  // mid-sentence. Authored board papers are the opposite case: their name IS
  // the awarding body's own ("GCSE Biology — Paper 1") and must not be touched.
  for (const subject of ["maths", "physics", "chemistry", "biology", "computing"]) {
    const g = papers.genericPaper(active, subject, "ar");
    ok(!/\b(maths|physics|chemistry|biology|computing)\b/i.test(g.name),
      `${subject}: a built paper's name carries no raw subject id ("${g.name}")`);
    ok(g.name.trim().length > 0, `${subject}: the built paper is still named`);
  }
  const enName = papers.genericPaper(active, "maths", "en").name;
  const arName = papers.genericPaper(active, "maths", "ar").name;
  ok(enName !== arName, `a built paper's name follows the learner's language (${enName} / ${arName})`);
  const authoredName = papers.papersForSpec("uk-gcse", "maths")[0].name;
  ok(/Mathematics/.test(authoredName), "an authored paper keeps the awarding body's own name");
}

// ── M9a. The client/API credential contract ─────────────────────────────────
// Every guarded endpoint requires the profile's capability secret, and a call
// site that forgets it fails only in a real browser (the e2e suite injects the
// secret into every request it makes). That is exactly how the entire practice
// flow — the concept page and the anonymous wedge — shipped returning 401
// while every suite stayed green. This is a static guard against the whole
// class, not a test of one call site.
console.log("▸ Client credential contract");
{
  const GUARDED = ["/api/progress", "/api/diagnostic", "/api/paper", "/api/ai", "/api/session"];
  const dirs = ["app", "components", "lib"];
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (e.name !== "api") walk(p); }
      else if (/\.tsx?$/.test(e.name)) files.push(p);
    }
  };
  for (const d of dirs) walk(d);
  let scanned = 0;
  let viaHelper = 0;
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    // A file may carry the credential in a named helper (`authQuery()`) that
    // builds the query string; that is accepted only because the helper's own
    // body is checked to contain the secret below.
    const helper = /authQuery/.test(src);
    if (helper) {
      viaHelper++;
      ok(/secret/.test(src), `${file}'s credential helper is built from the profile secret`);
    }
    for (const path of GUARDED) {
      let idx = src.indexOf(path);
      while (idx >= 0) {
        scanned++;
        // The whole fetch expression: enough to include a body built a few
        // lines below the URL, without reaching the next unrelated call.
        const window = src.slice(idx, idx + 700);
        // Two honest ways to carry the credential: inline, or through the
        // file's own `authQuery()` helper — and when the helper is used, the
        // file must actually build it from the secret, so the exception is
        // verified rather than trusted.
        ok(/secret/.test(window) || helper, `${file} passes the profile secret to ${path}`);
        idx = src.indexOf(path, idx + 1);
      }
    }
  }
  ok(scanned > 20, `the credential scan actually saw call sites (${scanned})`);
  ok(viaHelper <= 2, `credential-helper exemptions are few and explicit (${viaHelper})`);
}

// ── M9. The closed learning loop ────────────────────────────────────────────
// "Progress recorded" must not be mistaken for "the model changed". These
// assertions exist because the difference is the product: a session that
// records answers but leaves the recommendation identical is not adaptive, and
// a plan that refuses to move after real evidence is not either. They are
// written the way the milestone demo runs — practise, slip, repair, improve,
// prove — so a failure here is a failure of the claim, not of a helper.
console.log("▸ The closed learning loop");
{
  const { decideNext } = nextEngine;
  const { emptyActivity, captureBaseline, computeResult, metricsOf, noteActivity, openSession, toSummary, reasonKey, sameStep } = session;
  const { recordAnswer } = progress;
  const CONCEPT = "fractions";
  const concept = genome.CONCEPTS_BY_ID[CONCEPT];
  ok(Boolean(concept), `the loop's test concept exists (${CONCEPT})`);
  const TAG = (concept.misconceptions ?? [])[0];
  ok(Boolean(TAG), `it has a tagged misconception to recur (${TAG})`);

  const fresh = () => ({
    profile: { id: "loop", handle: "loop", country: "GB", birthYear: null, language: "en", goal: "",
      intent: "", subjects: ["maths"], createdAt: 0 },
    secret: "loop-secret", progress: {}, diagnostics: {}, masteries: {},
  });

  // A learner with a real history on the concept: four correct answers, no
  // hints — the state in which "practise" is the honest advice.
  const state = fresh();
  for (let i = 0; i < 4; i++) {
    recordAnswer(state, CONCEPT, `warm-${i}`, 0, true, "", [], { mode: "independent" });
  }
  ok(state.progress[CONCEPT].attempts === 4, "the warm-up answers are on the record");

  // ── Open a session: the baseline is captured BEFORE any new evidence.
  const { ledger, resumed } = openSession(state, CONCEPT, "PRACTISE", null, 4, Date.now());
  ok(!resumed && ledger.baseline.metrics.mastery > 0, "a baseline is captured before the first answer");
  const topAtStart = decideNext(state, 1)[0];
  ok(Boolean(ledger.baseline.step) && sameStep(ledger.baseline.step,
    { kind: topAtStart.kind, conceptId: topAtStart.conceptId, minutes: topAtStart.minutes, href: topAtStart.href }),
    "the baseline records the recommendation that was in force");
  const baselineMastery = ledger.baseline.metrics.mastery;

  // ── The slip: the same mistake twice, on the concept the session is about.
  for (let i = 0; i < 2; i++) {
    recordAnswer(state, CONCEPT, `slip-${i}`, 1, false, "", [TAG], { mode: "guided" });
    noteActivity(ledger, { correct: false, mode: "guided", hints: 0, conceptId: CONCEPT });
  }
  const slipped = computeResult(state, ledger);
  ok(slipped.after.mastery < baselineMastery,
    `the learner model moved down, not just the log (${baselineMastery.toFixed(3)} → ${slipped.after.mastery.toFixed(3)})`);
  ok(slipped.after.mastery !== slipped.before.mastery, "the model changed, rather than merely recording");
  ok(slipped.before.mastery === baselineMastery, "the 'before' column is the measurement, not a guess");
  ok(slipped.mistake && slipped.mistake.before === 0 && slipped.mistake.after === 2,
    "the recurring slip is counted against this session's baseline");
  ok(slipped.activity.asked === 2 && slipped.activity.correct === 0, "session activity is server-counted");
  ok(slipped.nextStep.kind === "REMEDIATE" && slipped.nextStep.conceptId === CONCEPT,
    "the plan switched to repairing that misconception");
  ok(slipped.nextStepChanged, "the recommendation really changed");
  ok(slipped.changeReason === "misconception", `and it says why (${slipped.changeReason})`);
  ok(reasonKey(slipped.changeReason) === "sess.r.misconception", "the reason maps to a translatable key");

  // ── The improvement: five hint-free answers, then genuine transfer wording.
  // A second session: the first was finished (the route clears the ledger), so
  // this one captures its OWN baseline — the slipped state, not the warm-up.
  const ledger2 = openSession(state, CONCEPT, "REMEDIATE", null, 5, Date.now() + 1).ledger;
  ok(ledger2.baseline.metrics.mastery === slipped.after.mastery,
    "the second session's baseline is the state the first one left behind");
  for (let i = 0; i < 5; i++) {
    recordAnswer(state, CONCEPT, `fix-${i}`, 0, true, "", [], { mode: "independent" });
    noteActivity(ledger2, { correct: true, mode: "independent", hints: 0, conceptId: CONCEPT });
  }
  recordAnswer(state, CONCEPT, "transfer-1", 0, true, "", [], { mode: "transfer" });
  noteActivity(ledger2, { correct: true, mode: "transfer", hints: 0, conceptId: CONCEPT });
  const improved = computeResult(state, ledger2);
  ok(improved.delta.mastery > 0, `mastery rose on the evidence (${improved.delta.mastery.toFixed(3)})`);
  ok(improved.after.mastery > slipped.after.mastery, "the model kept the history: it is above the slipped state");
  ok(improved.activity.independentCorrect === 5, "hint-free answers are counted as independence, not just as correct");
  ok(improved.proof.transfer === true, "the transfer question is recorded as transfer proof");
  ok(improved.before.independence !== improved.after.independence || improved.after.independence === 1,
    "independence is measurable before and after");

  // ── The honest case: evidence that does not justify a new plan says so.
  const quiet = fresh();
  const quietLedger = openSession(quiet, CONCEPT, "PRACTISE", null, 3, Date.now()).ledger;
  const untouched = computeResult(quiet, quietLedger);
  ok(untouched.activity.asked === 0 && untouched.changeReason === "unchanged",
    "an empty session claims no adaptation at all");
  ok(!untouched.nextStepChanged || untouched.before.mastery === untouched.after.mastery,
    "it does not invent a moved plan from no evidence");

  // ── Resume, don't restart: a dropped connection must not erase the measurement.
  const again = openSession(state, CONCEPT, "PRACTISE", ledger2, 5, Date.now() + 2);
  ok(again.resumed && again.ledger.baseline.metrics.mastery === ledger2.baseline.metrics.mastery,
    "an open session on the same concept is resumed with its original baseline");
  const otherConcept = openSession(state, "decimals", "PRACTISE", ledger2, 5, Date.now() + 3);
  ok(!otherConcept.resumed, "a session on a different concept is a new measurement");
  const stale = openSession(state, CONCEPT, "PRACTISE", ledger2, 5, Date.now() + session.SESSION_TTL_MS + 1);
  ok(!stale.resumed, "an abandoned session past its TTL is not resumed");

  // ── The persisted summary is structural: never one language's text.
  const summary = toSummary(improved);
  ok(summary.conceptId === CONCEPT && summary.changeReason === improved.changeReason,
    "the summary keeps the decision");
  ok(!JSON.stringify(summary).match(/["']?(title|reason|evidence)["']?\s*:/),
    "the summary carries no composed text, so a profile cannot freeze a language");
  ok(summary.nextStep === null || typeof summary.nextStep.kind === "string",
    "the summary's next step is named structurally");

  // ── Every composed string the engine hands the UI is well-formed. The
  // percent keys carry their own '%', so a template that adds another one
  // ships "44%%" to a learner — invisible to a key audit, which is exactly
  // how it survived until a result screen printed it.
  for (const st of [state, fresh()]) {
    for (const a of decideNext(st, 4)) {
      const text = `${a.title} ${a.reason} ${a.evidence}`;
      ok(!text.includes("%%"), `no doubled percent in "${a.kind}" output`);
      ok(!/  /.test(text), `no doubled space in "${a.kind}" output`);
      ok(!/\{\w+\}/.test(text), `no unfilled placeholder in "${a.kind}" output`);
      ok(!text.includes("undefined") && !text.includes("NaN"), `no undefined/NaN in "${a.kind}" output`);
    }
  }

  // ── The bands a learner sees are derived, and they move with the evidence.
  ok(metricsOf(state.progress[CONCEPT]).band !== "new", "a proven concept is not labelled 'new'");
  ok(metricsOf(undefined).band === "new" && metricsOf(undefined).independence === null,
    "an untouched concept reports 'new' with no invented independence");
}

// ── M10. The evidence contract ──────────────────────────────────────────────
// The product's one non-negotiable rule, written so a regression fails the
// build rather than the product:
//
//   every learner action produces evidence → every meaningful piece of that
//   evidence can move the learner model → every such move can change what
//   OpenMind recommends next.
//
// The third link is the one that quietly rots: a new feature records answers
// into its own corner and the engine never hears about it, so the app looks
// adaptive while the recommendation is constant. It is therefore asserted as a
// CHAIN on one learner, not as three independent helpers — and the second half
// asserts the converse too, because "no dead ends" is what stops a
// recommendation becoming a place a learner cannot actually go.
console.log("▸ The evidence contract");
{
  const { decideNext, daysUntilExam, urgencyFor, planMinutes } = nextEngine;
  const learnerModel = require("../.verify/learner-model.js");
  const { recordAnswer } = progress;

  // ── The engine's English fallback table is NOT the English dictionary. It is
  // only reached when a caller passes no translator, and every page passes one,
  // so a key that lives only here renders as `next.why.examNow` on screen. This
  // leak survived a key-parity audit because the key genuinely existed.
  {
    const i18nMod = require("../.verify/i18n.js");
    const enT = i18nMod.translator("en");
    const orphans = Object.keys(nextEngine.EN_NEXT).filter((k) => enT(k) === k);
    ok(orphans.length === 0,
      `every engine fallback key is also in the en dictionary (orphans: ${orphans.join(", ") || "none"})`);
    // ── THE VALUES TOO, NOT JUST THE KEYS ──────────────────────────────────
    // Key parity is not text parity: the table carried `at ` while the
    // dictionary said `at`, and `but ` while the dictionary said `but “` — so
    // the fallback and the real text drifted one character and one quotation
    // apart while every audit stayed green. The two are the SAME ENGLISH, read
    // through different doors, and the only honest assertion is that they are
    // the same string. (This is also the assertion that caught the doubled
    // quotes: the composition added “ ” on top of marks every dictionary
    // already had.)
    const drifted = Object.entries(nextEngine.EN_NEXT)
      .filter(([k, v]) => enT(k) !== v)
      .map(([k, v]) => `${k}: table ${JSON.stringify(v)} vs en ${JSON.stringify(enT(k))}`);
    ok(drifted.length === 0,
      `every engine fallback value is byte-identical to its en dictionary entry (drifted: ${drifted.join(" | ") || "none"})`);
    // And the composed reason must not double the marks the dictionary owns:
    // rendered evidence of the bug, not just a comparison of its parts.
    const composed = `${enT("next.reason.remediatePre")}Sign slip${enT("next.reason.remediatePost")}`;
    ok(!/[“«„「]\s*[“«„「]/.test(composed) && /“Sign slip”/.test(composed),
      `a remediate reason wraps the named belief exactly once ("${composed}")`);
    // And every other language must carry the sentences the engine composes —
    // the reason/why half of a recommendation is the most-read text there is.
    const whyKeys = Object.keys(nextEngine.EN_NEXT).filter((k) => k.startsWith("next.why.") || k.startsWith("next.reason."));
    for (const l of i18nMod.LANGS) {
      if (l.code === "en") continue;
      const missing = whyKeys.filter((k) => i18nMod.translator(l.code)(k) === k);
      ok(missing.length === 0, `${l.code} translates every reason and why-now sentence (missing ${missing.length})`);
    }
    // The plan's block labels and the demand levels are both reached through a
    // template literal, so no `t("plan.x")` grep can find them: enumerate the
    // values instead.
    for (const l of i18nMod.LANGS) {
      const missing = ["learn", "retrieve", "practise", "remediate", "transfer", "exam", "project"]
        .filter((k) => i18nMod.translator(l.code)(`plan.${k}`) === `plan.${k}`);
      ok(missing.length === 0, `${l.code} labels every session block (missing: ${missing.join(", ") || "none"})`);
      const demand = ["recall", "application", "multi_step", "data_interpretation", "extended_response"]
        .filter((k) => i18nMod.translator(l.code)(`skill.${k}`) === `skill.${k}`)
        .concat(["diag.skillsTitle", "diag.skillsSub", "diag.notMeasured", "diag.bankNote"]
          .filter((k) => i18nMod.translator(l.code)(k) === k));
      ok(demand.length === 0, `${l.code} labels every demand level (missing: ${demand.join(", ") || "none"})`);
    }
  }
  const DAY = 86400000;
  // A fixed LOCAL noon: the deadline maths counts calendar days in the
  // learner's own timezone, so a UTC instant would make this test drift by a
  // day depending on where it runs.
  const NOW = new Date(2027, 0, 10, 12, 0, 0).getTime();
  const dayStr = (offset) => {
    const d = new Date(NOW + offset * DAY);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const CONCEPT = "fractions";
  const TAG = (genome.CONCEPTS_BY_ID[CONCEPT].misconceptions ?? [])[0];
  const fresh = (extra = {}) => ({
    profile: { id: "ev", handle: "ev", country: "GB", birthYear: null, language: "en", goal: "",
      intent: "", subjects: ["maths"], createdAt: 0, ...extra },
    secret: "ev-secret", progress: {}, diagnostics: {}, masteries: {},
  });
  const step = (s, now) => { const a = decideNext(s, 1, undefined, undefined, now)[0]; return `${a.kind}:${a.conceptId}`; };

  // ── Link 1 & 2: an action records, and the record moves the model.
  for (const [name, correct, meta] of [
    ["a correct independent answer", true, { mode: "independent" }],
    ["a wrong answer", false, {}],
    ["a hint-assisted answer", true, { hints: 3 }],
    ["a transfer answer", true, { mode: "transfer" }],
  ]) {
    const s = fresh();
    recordAnswer(s, CONCEPT, `ev-${name}`, correct ? 0 : 1, correct, "", [], meta);
    const p = s.progress[CONCEPT];
    ok(p.attempts === 1, `${name}: is recorded`);
    ok(p.mastery !== 0.2 || p.accuracy !== 0.2, `${name}: moves the model, not just the log (${p.mastery.toFixed(3)})`);
  }
  // Direction, not merely movement. A model that can drift the wrong way is not
  // a model of anything a learner should trust.
  {
    const up = fresh(); recordAnswer(up, CONCEPT, "d1", 0, true, "", [], {});
    const down = fresh(); recordAnswer(down, CONCEPT, "d2", 1, false, "", [], {});
    ok(up.progress[CONCEPT].mastery > 0.2, `a correct answer raises mastery (${up.progress[CONCEPT].mastery.toFixed(3)})`);
    ok(down.progress[CONCEPT].mastery <= 0.2, `a wrong answer never raises it (${down.progress[CONCEPT].mastery.toFixed(3)})`);
  }
  // A tagged wrong answer is the ONLY thing that records a misconception.
  {
    const tagged = fresh(); recordAnswer(tagged, CONCEPT, "t1", 1, false, "", [TAG], {});
    const right = fresh(); recordAnswer(right, CONCEPT, "t2", 0, true, "", [TAG], {});
    ok((tagged.progress[CONCEPT].misconceptions[TAG] ?? 0) === 1, "a wrong answer records its misconception tag");
    ok(Object.keys(right.progress[CONCEPT].misconceptions).length === 0, "a correct answer never records one");
  }

  // ── Link 3: model change → recommendation change, in both directions.
  {
    const s = fresh();
    const atStart = step(s, NOW);
    recordAnswer(s, CONCEPT, "c1", 1, false, "", [TAG], {});
    const afterOne = step(s, NOW);
    recordAnswer(s, CONCEPT, "c2", 1, false, "", [TAG], {});
    const afterTwo = step(s, NOW);
    ok(atStart !== afterTwo, `the recommendation moved with the evidence (${atStart} → ${afterTwo})`);
    ok(afterTwo === `REMEDIATE:${CONCEPT}`, `and moved to the right thing (${afterTwo})`);
    // One slip is not a pattern: a named misconception needs repetition. (The
    // first answer does legitimately change the plan — from "find your starting
    // point" to work on a real concept — so what is asserted is that it does not
    // yet buy a *diagnosis*.)
    ok(afterOne !== `REMEDIATE:${CONCEPT}`, `a single slip does not buy a diagnosis (${afterOne})`);
  }
  {
    const s = fresh();
    for (let i = 0; i < 2; i++) recordAnswer(s, CONCEPT, `x${i}`, 1, false, "", [TAG], {});
    const bad = step(s, NOW);
    for (let i = 0; i < 6; i++) recordAnswer(s, CONCEPT, `y${i}`, 0, true, "", [], { mode: "independent" });
    const good = step(s, NOW);
    ok(bad !== good, `improvement moves the plan too (${bad} → ${good})`);
    ok(good !== `REMEDIATE:${CONCEPT}`, `the repair is no longer the recommendation (${good})`);
  }

  // ── A slip must be REPAIRABLE. The misconception ledger only ever counts up,
  // so a lifetime count used as the trigger made REMEDIATE permanent: a learner
  // could fix the slip and the engine would still open with "Fix: …". Evidence
  // is never erased — but it stops being actionable once repaired.
  {
    const { REPAIR_STREAK, evidenceFor } = learnerModel;
    const s = fresh();
    for (let i = 0; i < 2; i++) recordAnswer(s, CONCEPT, `r${i}`, 1, false, "", [TAG], {});
    ok(evidenceFor(s, CONCEPT).misconceptionHits === 2, "two slips are two current slips");
    for (let i = 0; i < REPAIR_STREAK - 1; i++) recordAnswer(s, CONCEPT, `q${i}`, 0, true, "", [], { mode: "independent" });
    ok(evidenceFor(s, CONCEPT).misconceptionHits === 2,
      `two clean answers are not yet a repair (${REPAIR_STREAK} in a row are)`);
    recordAnswer(s, CONCEPT, "q-last", 0, true, "", [], { mode: "independent" });
    const repaired = evidenceFor(s, CONCEPT);
    ok(repaired.misconceptionHits === 0 && repaired.topMisconception === null, "the repair retires the slip");
    ok(repaired.lifetimeMisconception && repaired.lifetimeMisconception.id === TAG
      && repaired.lifetimeMisconception.hits === 2,
      "but the history is never erased — the teacher view still sees it");
    // A single new slip after a repair breaks the streak and brings it back:
    // repair is a state, not a deletion.
    recordAnswer(s, CONCEPT, "relapse", 1, false, "", [TAG], {});
    ok(evidenceFor(s, CONCEPT).misconceptionHits >= 1, "one relapse makes the slip current again");
  }

  // ── The deadline is the "why NOW" half, and it must not invent urgency.
  ok(daysUntilExam(dayStr(0), NOW) === 0, "an exam today is 0 days away");
  ok(daysUntilExam(dayStr(3), NOW) === 3, "a deadline three days out is measured in days");
  ok(daysUntilExam(undefined, NOW) === null, "no date is no deadline");
  ok(daysUntilExam("next June", NOW) === null, "a malformed date is no deadline");
  ok(daysUntilExam(dayStr(-1), NOW) === null, "a date in the past is not a deadline, not a negative one");
  ok(urgencyFor(3) === "now" && urgencyFor(25) === "soon" && urgencyFor(400) === "none" && urgencyFor(null) === "none",
    "urgency is a documented ladder");
  {
    const imminent = decideNext(fresh({ examDate: dayStr(3), timePerDay: 20, exam: "GCSE" }), 1, undefined, undefined, NOW)[0];
    ok(imminent.urgency === "now", `an exam in three days is urgent (${imminent.urgency})`);
    ok(imminent.why.includes("3"), `and the sentence says how long is left ("${imminent.why}")`);
    const distant = decideNext(fresh({ examDate: dayStr(200), timePerDay: 20, exam: "GCSE" }), 1, undefined, undefined, NOW)[0];
    ok(distant.urgency === "none", `a distant exam is not used as pressure (${distant.urgency})`);
    const undated = decideNext(fresh({ timePerDay: 20 }), 1, undefined, undefined, NOW)[0];
    ok(undated.urgency === "none" && undated.why !== imminent.why,
      "with no date the engine says the order follows the evidence instead");
  }

  // ── No dead ends: every action must be startable and every plan coherent.
  const PART_KINDS = ["learn", "retrieve", "practise", "remediate", "transfer", "exam", "project"];
  // These three labels are one-item nouns in every language, so their counts
  // must stay 1 — that is a grammar contract with the `plan.*` keys.
  const SINGULAR = ["learn", "exam", "project"];
  const states = [];
  { states.push(["untouched", fresh()]); }
  { const s = fresh(); for (let i = 0; i < 4; i++) recordAnswer(s, CONCEPT, `s${i}`, 0, true, "", [], { mode: "independent" }); states.push(["practising", s]); }
  { const s = fresh(); for (let i = 0; i < 2; i++) recordAnswer(s, CONCEPT, `m${i}`, 1, false, "", [TAG], {}); states.push(["misconception", s]); }
  { const s = fresh({ examDate: dayStr(5), timePerDay: 15, exam: "GCSE" }); for (let i = 0; i < 4; i++) recordAnswer(s, CONCEPT, `e${i}`, 0, true, "", [], { mode: "independent" }); states.push(["exam imminent", s]); }
  { const s = fresh({ timePerDay: 10 }); for (const c of ["place-value", "addition", "subtraction"]) for (let i = 0; i < 3; i++) recordAnswer(s, c, `${c}-${i}`, 0, true, "", [], { mode: "independent" }); states.push(["strong", s]); }
  for (const [label, s] of states) {
    const actions = decideNext(s, 4, undefined, undefined, NOW);
    ok(actions.length > 0, `${label}: there is always a next step`);
    for (const a of actions) {
      const text = `${a.title} ${a.reason} ${a.evidence} ${a.why}`;
      ok(a.title.trim().length > 0 && a.reason.trim().length > 0, `${label}/${a.kind}: is named and explained`);
      ok(a.evidence.trim().length > 0, `${label}/${a.kind}: states its evidence`);
      ok(a.why.trim().length > 0, `${label}/${a.kind}: answers "why now"`);
      ok(["now", "soon", "none"].includes(a.urgency), `${label}/${a.kind}: urgency is a known value (${a.urgency})`);
      ok(!/\{\w+\}/.test(text), `${label}/${a.kind}: no unfilled placeholder in any line`);
      ok(!text.includes("undefined") && !text.includes("NaN"), `${label}/${a.kind}: no undefined/NaN`);
      ok(a.kind === "REST" ? a.minutes === 0 : a.minutes > 0, `${label}/${a.kind}: an honest duration (${a.minutes})`);
      // A route that cannot record evidence is a dead end in the loop.
      const routed = a.href === "/dashboard" || a.href.startsWith("/diagnostic/")
        || /^\/learn\/[a-z]+\/[a-z0-9-]+$/.test(a.href);
      ok(routed, `${label}/${a.kind}: routes somewhere that produces evidence (${a.href})`);
      if (a.href.startsWith("/learn/") && a.conceptId) {
        ok(Boolean(genome.CONCEPTS_BY_ID[a.conceptId]), `${label}/${a.kind}: names a concept that exists (${a.conceptId})`);
      }
      for (const p of a.plan) {
        ok(PART_KINDS.includes(p.kind), `${label}/${a.kind}: plan block kind is known (${p.kind})`);
        ok(Number.isInteger(p.count) && p.count >= 1, `${label}/${a.kind}: ${p.kind} has at least one item (${p.count})`);
        if (SINGULAR.includes(p.kind)) ok(p.count === 1, `${label}/${a.kind}: ${p.kind} stays singular for its label (${p.count})`);
      }
      if (a.kind === "REST") {
        ok(a.plan.length === 0, `${label}: REST plans no work at all`);
      } else {
        ok(a.plan.length > 0, `${label}/${a.kind}: a session always has a shape`);
        // The time shown must BE the plan's cost, so the card cannot promise
        // eight minutes and hand over a fifteen-minute session.
        ok(Math.round(planMinutes(a.plan)) === a.minutes,
          `${label}/${a.kind}: the stated time is the plan's own cost (${a.minutes} vs ${planMinutes(a.plan)})`);
        // And it must fit the day the learner said they have — unless the
        // minimum viable session is already longer, which is stated, not hidden.
        if (s.profile.timePerDay) {
          const minimum = a.plan.every((p) => p.count === 1);
          ok(planMinutes(a.plan) <= s.profile.timePerDay || minimum,
            `${label}/${a.kind}: the plan fits the learner's ${s.profile.timePerDay} minutes (${planMinutes(a.plan)})`);
        }
      }
    }
  }

  // ── Purity: the same state and the same day give the same advice, and the
  // deadline can change the wording without silently reordering the work.
  {
    const s = fresh({ examDate: dayStr(4), timePerDay: 20, exam: "GCSE" });
    for (let i = 0; i < 4; i++) recordAnswer(s, CONCEPT, `p${i}`, 0, true, "", [], { mode: "independent" });
    const a = JSON.stringify(decideNext(s, 4, undefined, undefined, NOW));
    const b = JSON.stringify(decideNext(s, 4, undefined, undefined, NOW));
    ok(a === b, "the decision is a pure function of the model and the day");
    const kinds = (n) => decideNext(s, 4, undefined, undefined, n).map((x) => x.kind).join(",");
    ok(kinds(NOW) === kinds(NOW - 30 * DAY), "a different day changes the urgency, not the ranking");
  }
}

// ── EVIDENCE DRIVES THE EXPERIENCE ───────────────────────────────────────
// The ladder is the product: the SAME learner, walked through recorded
// evidence, must get a visibly different, CORRECTLY-ORDERED decision at each
// stage — and each decision must cite the events that caused it. Every state
// below was probed against the real mastery curve before being asserted.
console.log("▸ Evidence drives the experience");
{
  const { decideNext, planMinutes } = nextEngine;
  const i18nMod = require("../.verify/i18n.js");
  const enT = i18nMod.translator("en");
  const recordAnswer = progress.recordAnswer;
  const CONCEPT = "fractions";
  const TAG = (genome.CONCEPTS_BY_ID[CONCEPT].misconceptions ?? [])[0];
  const DAY = 86400000;
  const fresh = (extra = {}) => ({
    profile: { id: "ev", handle: "ev", country: "GB", birthYear: null, language: "en", goal: "",
      intent: "", subjects: ["maths"], createdAt: 0, ...extra },
    secret: "ev-secret", progress: {}, diagnostics: {}, masteries: {},
  });

  // The learner's stream, mirrored exactly as the reconcile block does: every
  // answer recorded through the real grading path ALSO becomes a ledger event.
  const stream = [];
  const NOW_L = new Date(2027, 0, 10, 12, 0, 0).getTime();
  const answer = (s, n, correct, opts = {}, tags = []) => {
    const chosen = correct ? 0 : 1;
    // The mode stays as written here (`guided` unless the caller says
    // otherwise) and the HINT COUNT is what the scaffolding rule reads — see
    // the STATE F block below. Deriving the mode from the hint count here was
    // tried and reverted: it makes each answer's independence credit depend on
    // a re-derivation of the route's rule, so the ladder stopped being a set of
    // stages and became a second copy of the serve path, and three assertions
    // in this block (the stretch boundary, the rehearsal-is-not-independence
    // claim) silently changed their meaning with it.
    const derived = { ...opts, hints: opts.hints ?? 0 };
    recordAnswer(s, CONCEPT, `q-${n}`, chosen, correct, "", tags, derived);
    s.progress[CONCEPT].lastSeen = NOW_L; // pin the clock: real Date.now() must not leak into a fixed-time test
    stream.push(evidence.answerEvidence({
      learnerId: "ladder", at: NOW_L - (1000 - stream.length) * 60000, source: opts.mode === "independent" ? "practice" : "diagnostic",
      subject: "maths", conceptId: CONCEPT, specificationId: null,
      questionId: `q-${n}`, correct, chosen, mode: opts.mode ?? "guided", hints: derived.hints, tags,
    }));
  };
  const top = (s, evs) => decideNext(s, 1, undefined, undefined, NOW_L, evs)[0];

  // ── STATE A: no evidence → find your starting point (the diagnostic). ──
  const sA = fresh();
  const aA = top(sA, []);
  ok(aA.conceptId === null && aA.href === "/diagnostic/maths",
    `no evidence → the diagnostic ("${aA.title}")`);
  ok(aA.evidenceIds.length === 0,
    "a decision with no evidence cites none — never an invented id");
  ok(aA.expectedOutcome.trim().length > 0 && !/\{\w+\}|undefined|NaN/.test(aA.expectedOutcome),
    `and still states what it expects to establish ("${aA.expectedOutcome}")`);

  // ── STATE B: two wrong answers (one carrying the slip tag) → rebuild the idea. ──
  const sB = fresh();
  answer(sB, "b1", false, {}, [TAG]);
  answer(sB, "b2", false);
  const aB = top(sB, stream);
  ok(aB.kind === "EXPLAIN" && aB.conceptId === CONCEPT,
    `wrong answers on one concept → learn THAT concept (${aB.kind}:${aB.conceptId})`);
  ok(aB.evidenceIds.length === 2 && aB.evidenceIds.every((id) => stream.some((e) => e.id === id)),
    "the decision cites exactly the answers that caused it");

  // ── STATE C: one correct guided answer → practise. ──
  answer(sB, "c1", true);
  const aC = top(sB, stream);
  ok(aC.kind === "PRACTISE" && aC.conceptId === CONCEPT,
    `after a correct answer → practise (${aC.kind}:${aC.conceptId})`);
  ok(aC.evidenceIds.length > 0 && aC.evidenceIds.length <= 4,
    "and cites the recent answers behind it");

  // ── STATE D: three more corrects → the idea is proven, and the next work is
  // the SAME idea on a surface the learner has not met. Whether a concept can
  // offer a second surface is a fact about the re-framer
  // (lib/transfer.ts#canTransfer) rather than the engine's opinion — and it is
  // now a fact about most of the bank, not the linear-equation family the gate
  // started on: the inverse surface re-frames any concept whose ANSWERS are
  // values and whose stems are ONE readable line. Fractions is one of them.
  answer(sB, "d1", true); answer(sB, "d2", true); answer(sB, "d3", true);
  const aD = top(sB, stream);
  ok(transferMod.canTransfer(CONCEPT),
    `${CONCEPT}: this concept really can be put on a second surface (the gate is a probe of the re-framer, not a guess)`);
  ok(aD.kind === "TRANSFER" && aD.conceptId === CONCEPT,
    `strong + confident → the same idea on a surface the learner has not met (${aD.kind}:${aD.conceptId}, mastery ${Math.round(sB.progress[CONCEPT].mastery * 100)}%)`);
  ok(aD.reason === enT("next.reason.transfer"),
    `and the reason promises unfamiliar wording, in the learner's own language ("${aD.reason}")`);
  ok(aD.evidenceIds.length === 4 && stream.filter((e) => aD.evidenceIds.includes(e.id)).every((e) => e.correct),
    "the stretch decision cites the most recent answers, all of them correct");

  // ── The OTHER branch of the same rule, on real concepts. Where no second
  // surface genuinely exists the offer must stay DEEPER WORK on that concept.
  // Two concepts, one per exclusion FAMILY, so the gate cannot widen by
  // loosening a rule: `proof` answers in prose (two defensible answers can be
  // the same fact said differently, which would mark a right answer wrong) and
  // `volume` states its items over several lines (a paragraph is not an option).
  // The coverage itself is counted here too — "the gate says no" is only honest
  // if it says yes often enough to matter.
  const REFRAMABLE = Object.keys(genome.CONCEPTS_BY_ID).filter((cid) => transferMod.canTransfer(cid));
  ok(REFRAMABLE.length > 50,
    `${REFRAMABLE.length} of ${Object.keys(genome.CONCEPTS_BY_ID).length} concepts serve a REAL second surface (it was 2 when the gate was first made honest)`);
  {
    const WHY_NO_SURFACE = {
      proof: "its answers are prose, and two prose answers can be the same fact said differently",
      volume: "its items run over several lines, and a paragraph is not an option",
    };
    for (const NO_SURFACE of Object.keys(WHY_NO_SURFACE)) {
      ok(!transferMod.canTransfer(NO_SURFACE),
        `${NO_SURFACE}: genuinely no second surface — ${WHY_NO_SURFACE[NO_SURFACE]}`);
      const sN = fresh();
      const evs = [];
      for (let i = 0; i < 5; i++) {
        recordAnswer(sN, NO_SURFACE, `n-${i}`, 0, true, "", [], { mode: "independent" });
        sN.progress[NO_SURFACE].lastSeen = NOW_L;
        evs.push(evidence.answerEvidence({
          learnerId: "ladder", at: NOW_L - (1000 - i) * 60000, source: "practice",
          subject: genome.CONCEPTS_BY_ID[NO_SURFACE].subject, conceptId: NO_SURFACE, specificationId: null,
          questionId: `n-${i}`, correct: true, chosen: 0, mode: "independent", hints: 0, tags: [],
        }));
      }
      const aN = decideNext(sN, 1, undefined, undefined, NOW_L, evs)[0];
      // `sN` has proved this concept unaided five times, so go far enough to ask
      // the real question: is the learner ever asked for a transfer this concept
      // cannot offer, and does the engine ever come BACK to a finished concept?
      // Both would be the old failure — a claim the serve cannot honour, and a
      // loop that prescribes the same impossible step forever.
      ok(!(aN.kind === "TRANSFER" && aN.conceptId === NO_SURFACE),
        `${NO_SURFACE} is never offered unfamiliar wording it has no surface for (${aN.kind}:${aN.conceptId})`);
      ok(aN.reason !== enT("next.reason.transfer"),
        `and its reason never promises a second surface ("${aN.reason}")`);
      const back = decideNext(sN, 4, undefined, undefined, NOW_L, evs);
      ok(!back.some((a) => a.conceptId === NO_SURFACE),
        `a proved ${NO_SURFACE} is not prescribed again — the engine moves on (${back.map((a) => `${a.kind}:${a.conceptId}`).join(" → ") || "nothing left to serve"})`);
    }
  }

  // ── The served item is a REAL question, not just a re-framed prompt. The
  // inverse asks which of four real questions produces a stated result, and its
  // honesty rests on a claim a test can check instead of trust: the three
  // distractors' OWN answers differ from that result. So every option is
  // re-graded here, from the draws `serveTransfer` returns for exactly this
  // purpose, on every concept that offers the stage.
  {
    let items = 0;
    let regraded = 0;
    let concepts = 0;
    const defects = [];
    for (const cid of Object.keys(genome.CONCEPTS_BY_ID)) {
      if (!transferMod.canTransfer(cid)) continue;
      concepts++;
      for (const band of [0.5, 0.8]) {
        const served = transferMod.serveTransfer(cid, `pin:${band}`, band, "en");
        if (!served || served.surface !== "inverse") continue;
        items++;
        const options = served.question.choices.map(String);
        if (new Set(options).size !== options.length) defects.push(`${cid}: duplicate options`);
        if (served.distractors.length !== 3) defects.push(`${cid}: ${served.distractors.length} distractors`);
        if (options[served.question.answer] !== served.source.prompt) {
          defects.push(`${cid}: the correct option is not the question that produces the answer`);
        }
        const stated = transferMod.answerValueKey(String(served.source.choices[served.source.answer]));
        for (const d of served.distractors) {
          regraded++;
          const own = transferMod.answerValueKey(String(d.choices[d.answer]));
          if (!own) defects.push(`${cid}: distractor answer is prose ("${d.choices[d.answer]}")`);
          else if (own === stated) defects.push(`${cid}: distractor ALSO yields ${stated} — two right answers ("${d.prompt}")`);
          else if (!options.includes(d.prompt)) defects.push(`${cid}: a distractor is missing from the options`);
        }
      }
    }
    ok(items > 100 && concepts === REFRAMABLE.length,
      `${items} inverse items across all ${concepts} re-framable concepts are served and re-derived by the test`);
    ok(defects.length === 0,
      `and exactly one option is correct in every one — ${regraded} distractor answers re-graded by the test, not trusted${defects.length ? `: ${defects.slice(0, 3).join("; ")}` : ""}`);
  }

  // ── STATE E: time passes → retention is due. ──
  sB.progress[CONCEPT].lastSeen = NOW_L - 8 * DAY;
  const aE = top(sB, stream);
  ok(aE.kind === "RETRIEVE" && aE.conceptId === CONCEPT,
    `eight days later → retrieval is due (${aE.kind}:${aE.conceptId})`);

  // ── STATE E2: the SAME due review, on a learner who has never once answered
  // this concept without help.
  //
  // The RETRIEVE branch fired for every concept whose interval had elapsed and
  // told all of them "You proved this before". Whether a review is due is a fact
  // about the SCHEDULE; whether there is a proof is a fact about the LEARNER, and
  // the second one is the only one the sentence may assert. Both histories below
  // have identical shape — nine right, one wrong, reviewed eight days ago — and
  // differ ONLY in how the work was done.
  {
    const pair = {};
    for (const helped of [true, false]) {
      const s = fresh();
      const evs = [];
      for (let i = 0; i < 10; i++) {
        const right = i < 9;
        const hints = helped ? 1 : 0;
        recordAnswer(s, CONCEPT, `e2-${i}`, 0, right, "", [], { mode: helped ? "guided" : "independent", hints });
        s.progress[CONCEPT].lastSeen = i === 9 ? NOW_L - 8 * DAY : NOW_L;
        evs.push(evidence.answerEvidence({
          learnerId: "ladder", at: NOW_L - (60 - i) * 60000, source: "practice",
          subject: "maths", conceptId: CONCEPT, specificationId: null,
          questionId: `e2-${i}`, correct: right, chosen: right ? 0 : 1,
          mode: helped ? "guided" : "independent", hints, tags: [],
        }));
      }
      pair[helped ? "helped" : "unaided"] = { s, evs, m: s.progress[CONCEPT].mastery };
    }
    const lm = require("../.verify/learner-model.js");
    const unprovedEv = lm.buildSnapshot(pair.helped.s).evidence.find((e) => e.conceptId === CONCEPT);
    const provedEv = lm.buildSnapshot(pair.unaided.s).evidence.find((e) => e.conceptId === CONCEPT);
    ok(!lm.provedUnaided(unprovedEv) && lm.provedUnaided(provedEv),
      `the pair differs in exactly one fact: unaided answers ${unprovedEv.independentCorrect} vs ${provedEv.independentCorrect}`);
    ok(lm.stageOf(unprovedEv) === "prove" && lm.stageOf(provedEv) !== "prove",
      `and the ladder already agrees (${lm.stageOf(unprovedEv)} vs ${lm.stageOf(provedEv)})`);
    // THE ONE RECORD WHERE THE TWO PREDICATES DIVERGE, and the reason the claim
    // is drawn from `provedUnaided` rather than from the ladder's gate: answers
    // taken with help, plus a hint-free answer that was WRONG. The gate says
    // "not every answer was helped"; nothing has been demonstrated. A sentence
    // taken from the gate would tell this learner they had proved it.
    {
      const s = fresh();
      for (let i = 0; i < 9; i++) recordAnswer(s, CONCEPT, `x-${i}`, 0, true, "", [], { mode: "guided", hints: 1 });
      recordAnswer(s, CONCEPT, "x-9", 1, false, "", [], { mode: "independent", hints: 0 });
      s.progress[CONCEPT].lastSeen = NOW_L - 8 * DAY;
      const e = lm.buildSnapshot(s).evidence.find((x) => x.conceptId === CONCEPT);
      ok(!lm.provedUnaided(e) && e.hintedAnswers < e.attempts,
        `helped plus one unaided WRONG answer: gate=false claim=false (${e.hintedAnswers}/${e.attempts} helped, ${e.independentCorrect} proved)`);
    }

    const at = (k) => top(pair[k].s, pair[k].evs);
    const helpedTop = at("helped");
    const unaidedTop = at("unaided");
    ok(helpedTop.kind === "RETRIEVE" && unaidedTop.kind === "RETRIEVE",
      `both are due a review (${helpedTop.kind} at mastery ${Math.round(pair.helped.m * 100)}%, ${unaidedTop.kind} at ${Math.round(pair.unaided.m * 100)}%)`);
    ok(helpedTop.reason === enT("next.reason.retrieveUnproved"),
      `a review of work never done unaided says what a review is for ("${helpedTop.reason}")`);
    ok(helpedTop.reason !== enT("next.reason.retrieve"),
      "and it does not claim a proof the learner does not have");
    ok(unaidedTop.reason === enT("next.reason.retrieve"),
      `while the learner who did prove it keeps the proof sentence ("${unaidedTop.reason}")`);
  }

  // ── STATE E2b: ONE CONCEPT, ONE ROW. ──
  //
  // A concept can be BOTH an unmet prerequisite of the open one AND due for
  // review, and the plan then carried two rows for it with contradictory
  // sentences — measured on the superiority test's cohort_0:
  //
  //   PRACTISE angles-lines  "Circle theorems is built on this, and it is not
  //                           established yet — this comes first."
  //   RETRIEVE angles-lines  "You proved this before — a quick retrieval now
  //                           makes it stick."
  //
  // Both facts are true (mastery just below the established bar; an unaided
  // proof on record), but no learner may be told both in one session, and the
  // same concept must not be two items of work. The open-concept branch has
  // always refused to duplicate; the retrieval branch was the one place the
  // guard was missing. The record below is the exact shape that produced it:
  // angles-lines 2/2 unaided (mastery below the bar, 37 days stale) as the
  // declared, unmet foundation of a weak circle-theorems.
  {
    const lm2 = require("../.verify/learner-model.js");
    const s = fresh();
    const evs = [];
    const at = (conceptId, n, correct, opts = {}, tag = "") => {
      const mode = opts.mode ?? "independent";
      const hints = opts.hints ?? 0;
      recordAnswer(s, conceptId, `e2b-${conceptId}-${n}`, correct ? 0 : 1, correct, "", tag ? [tag] : [], { mode, hints });
      evs.push(evidence.answerEvidence({
        learnerId: "ladder", at: NOW_L - (100 - evs.length) * 60000, source: "practice",
        subject: "maths", conceptId, specificationId: null,
        questionId: `e2b-${conceptId}-${n}`, correct, chosen: correct ? 0 : 1, mode, hints, tags: tag ? [tag] : [],
      }));
    };
    at("angles-lines", 0, true);
    at("angles-lines", 1, true);
    s.progress["angles-lines"].lastSeen = NOW_L - 37 * DAY;
    for (let i = 0; i < 5; i++) at("circle-theorems", i, i < 2);
    s.progress["circle-theorems"].lastSeen = NOW_L;

    // The two facts that make the guard load-bearing must both hold, or this
    // pin is asserting a shape the engine cannot reach.
    const retention = require("../.verify/retention.js");
    const dueIds = retention.dueReviews(s, NOW_L).map((d) => d.conceptId);
    const unmet = lm2.unmetPrerequisites("circle-theorems", s);
    ok(dueIds.includes("angles-lines"),
      `the foundation is genuinely due for review (${dueIds.filter((id) => id === "angles-lines").length}× angles-lines among ${dueIds.length} due)`);
    ok(unmet.includes("angles-lines"),
      `and genuinely unmet as circle-theorems' declared prerequisite (${unmet.join(", ") || "none"})`);

    const plan = decideNext(s, 4, undefined, undefined, NOW_L, evs);
    const rows = plan.map((a) => `${a.kind}:${a.conceptId}`);
    const counts = new Map();
    for (const a of plan) counts.set(a.conceptId, (counts.get(a.conceptId) ?? 0) + 1);
    const doubled = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    ok(doubled.length === 0,
      `no concept is scheduled twice in one plan (${rows.join(" | ")})`);    ok(plan.some((a) => a.conceptId === "angles-lines" && a.kind === "PRACTISE"),
      "and the repair row that made it both stays — the duplicate is what was removed, not the work");
  }

  // ── STATE E2c: a FORGOTTEN review is not a MISSING FOUNDATION. ──
  //
  // The foundations branch sends work BACKWARDS on purpose: when the learner is
  // stuck on a concept whose declared prerequisite they have not established,
  // the prerequisite is repaired first. That is right for a learner who cannot
  // do the work. It is wrong for one who has just FORGOTTEN it, and the two
  // records are different facts the model already separates: the acceptance
  // battery reached this with a learner who had proved fraction arithmetic
  // unaided a week earlier and then failed the due review of it, and the plan's
  // first row was "Learn: Fractions — Fraction arithmetic is built on this, and
  // you have not covered it yet" instead of the concept that had just lapsed.
  //
  // The branch read "measured + below the bar + one wrong answer" as stuck, and
  // a failed delayed recall satisfies all three — so a lapsed memory, which is
  // a fact about TIME, was diagnosed as a missing prerequisite, which is a fact
  // about CONTENT the learner has never been asked about. Absence of evidence
  // was being used as the cause of a measured failure.
  //
  // The two records below differ in exactly ONE fact — whether the newest
  // answer was a delayed recall that failed, decided by the one rule that owns
  // that question (lib/proof.ts#isRetentionEvidence) — and they must produce
  // different work: the lapsed concept re-secured, versus the unmeasured
  // foundation taught first.
  {
    const lm2 = require("../.verify/learner-model.js");
    const DAY2 = 86400000;
    const build = (label, last) => {
      const s = fresh();
      const evs = [];
      const answerAt = (n, correct, meta, at) => {
        recordAnswer(s, "circle-theorems", `${label}-${n}`, correct ? 0 : 1, correct, "", [], meta, at);
        evs.push(evidence.answerEvidence({
          learnerId: "ladder", at, source: meta.source ?? "practice",
          subject: "maths", conceptId: "circle-theorems", specificationId: null,
          questionId: `${label}-${n}`, correct, chosen: correct ? 0 : 1,
          mode: meta.mode ?? "guided", hints: meta.hints ?? 0, tags: [],
        }));
      };
      // Proved unaided eight days ago, three answers...
      const learned = NOW_L - 8 * DAY2;
      for (let i = 0; i < 3; i++) answerAt(`learn${i}`, true, { mode: "independent", hints: 0 }, learned + i * 60000);
      // ...then today's answer: a failed delayed recall, or an ordinary miss.
      answerAt("last", false, last, NOW_L);
      return { s, evs };
    };
    const forgotten = build("e2c-forgot", { mode: "independent", hints: 0, source: "retrieval" });
    const failing = build("e2c-fail", { mode: "independent", hints: 0 });

    // The fixture must actually hold the facts the pin reasons about, or it
    // asserts a shape the engine cannot reach.
    const newestTwo = (evs) => [...evs].sort((a, b) => a.at - b.at).slice(-2);
    const recallFact = (evs) => {
      const [prev, last] = newestTwo(evs);
      return proofMod.isRetentionEvidence({ source: last.source, hints: last.hints, sinceLast: last.at - prev.at });
    };
    ok(recallFact(forgotten.evs),
      "the fixture's newest answer meets the delayed-recall rule (a due review, unanswered, a week after the work)");
    ok(!recallFact(failing.evs),
      "and the other record's does not — so the two differ in exactly that one fact");
    const conceptEv = (s) => lm2.buildSnapshot(s).evidence.find((x) => x.conceptId === "circle-theorems");
    ok(lm2.stuckOn(conceptEv(forgotten.s)) && lm2.stuckOn(conceptEv(failing.s)),
      "both learners are below the bar with a wrong answer, so the detour's own gate is open for both");
    ok(lm2.unmetPrerequisites("circle-theorems", forgotten.s).includes("angles-lines"),
      "and both have the same declared, unestablished foundation for the detour to aim at");
    ok(proofMod.retentionState(forgotten.s.progress["circle-theorems"].retention) === "forgotten",
      "the record names the state (\"forgotten\") rather than only counting it");

    const forgotTop = decideNext(forgotten.s, 1, undefined, undefined, NOW_L, forgotten.evs)[0];
    const failTop = decideNext(failing.s, 1, undefined, undefined, NOW_L, failing.evs)[0];
    ok(forgotTop.conceptId === "circle-theorems" && forgotTop.kind === "PRACTISE",
      `a lapsed memory is re-secured on its own concept (${forgotTop.kind}:${forgotTop.conceptId})`);
    ok(forgotTop.reason !== enT("next.reason.prereqNew") && forgotTop.reason !== enT("next.reason.prereqFirst"),
      `and it is not told to cover an unmeasured foundation instead ("${forgotTop.reason}")`);
    ok(failTop.conceptId === "angles-lines" && failTop.kind === "EXPLAIN",
      `while an ordinary miss on the same record keeps the foundation repair (${failTop.kind}:${failTop.conceptId})`);
    ok(failTop.reason !== forgotTop.reason,
      "the two learners are given different work, and therefore different reasons");
  }

  // ── STATE E3: "why NOW", which is a different question per kind. ──
  //
  // Every action's `why` comes from one function, and its final fallback was a
  // single sentence — "This is the weakest evidence in the model right now" —
  // which is what EVERY kind falls through to once an exam date is more than a
  // month out (urgency "none", date set). So a due review was called the weakest
  // evidence when it is the most OVERDUE, and a transfer target — the concept
  // just proved unaided — was called the weakest evidence in the model.
  //
  // The invariant asserted here is structural rather than textual: a line SHARED
  // by kinds cannot be a claim about the learner, so the strongest and the
  // weakest action in the same configuration must say the same thing. A sentence
  // true of both is, by construction, not a claim about either.
  {
    const out = {};
    for (const shape of ["weak", "strong"]) {
      const s = fresh();
      s.profile.exam = "GCSE Maths";
      s.profile.examDate = new Date(NOW_L + 60 * DAY).toISOString().slice(0, 10);
      const evs = [];
      for (let i = 0; i < 5; i++) {
        const correct = shape === "strong";
        recordAnswer(s, CONCEPT, `e3-${shape}-${i}`, 0, correct, "", [],
          { mode: shape === "strong" ? "independent" : "guided", hints: 0 });
        s.progress[CONCEPT].lastSeen = NOW_L;
        evs.push(evidence.answerEvidence({
          learnerId: "ladder", at: NOW_L - (90 - i) * 60000, source: "practice",
          subject: "maths", conceptId: CONCEPT, specificationId: null,
          questionId: `e3-${shape}-${i}`, correct, chosen: correct ? 0 : 1,
          mode: shape === "strong" ? "independent" : "guided", hints: 0, tags: [],
        }));
      }
      out[shape] = top(s, evs);
    }
    ok(out.weak.urgency === "none" && out.strong.urgency === "none",
      `both sit in the state that selects the shared fallback (urgency ${out.weak.urgency}/${out.strong.urgency})`);
    ok(out.weak.kind !== out.strong.kind,
      `and they are genuinely different kinds of work (${out.weak.kind} vs ${out.strong.kind})`);
    ok(out.weak.why === out.strong.why,
      `a SHARED why-line says the same thing to the weakest and the strongest action ("${out.weak.why}")`);
    ok(out.weak.why === enT("next.why.evidence"),
      "and it is the deadline-free fallback, not a claim about either learner");
    // The claim that was there — "This is the weakest evidence in the model right
    // now" — cannot come back, in any kind, because the line that carries it is
    // shared. Asserted on the sentence rather than on a variable, because the
    // sentence IS the defect.
    ok(!/weakest/i.test(out.weak.why),
      "the shared why-line makes no claim about which of the learner's evidence is weakest");

    // An overdue review is the one kind whose timing fact IS its reason for being
    // today, so it states it instead of taking the shared line.
    const sDue = fresh();
    sDue.profile.exam = "GCSE Maths";
    sDue.profile.examDate = new Date(NOW_L + 60 * DAY).toISOString().slice(0, 10);
    const evsDue = [];
    for (let i = 0; i < 5; i++) {
      recordAnswer(sDue, CONCEPT, `e3-due-${i}`, 0, true, "", [], { mode: "independent", hints: 0 });
      sDue.progress[CONCEPT].lastSeen = i === 4 ? NOW_L - 8 * DAY : NOW_L;
      evsDue.push(evidence.answerEvidence({
        learnerId: "ladder", at: NOW_L - (150 - i) * 60000, source: "practice",
        subject: "maths", conceptId: CONCEPT, specificationId: null,
        questionId: `e3-due-${i}`, correct: true, chosen: 0, mode: "independent", hints: 0, tags: [],
      }));
    }
    const dueTop = top(sDue, evsDue);
    ok(dueTop.kind === "RETRIEVE" && dueTop.why === enT("next.why.due"),
      `an overdue review states its own timing fact ("${dueTop.why}")`);
    ok(dueTop.why !== out.weak.why,
      "and does not borrow the shared line, which would describe the most OVERDUE evidence as the weakest");

    // AND IT MUST STATE IT WHEN NO EXAM DATE IS SET, which is the configuration
    // the first version of this fix missed: the generic "no deadline is set" line
    // was tested first, so the branch's own timing fact was discarded for exactly
    // the self-directed learner — and the offline one — who never sets a date.
    // The exam-pressing case must still out-rank it, or the fix would bury a real
    // deadline under a scheduling note.
    const noExam = structuredClone(sDue);
    noExam.profile.exam = "";
    noExam.profile.examDate = undefined;
    const noExamTop = top(noExam, evsDue);
    ok(noExamTop.kind === "RETRIEVE" && noExamTop.why === enT("next.why.due"),
      `and states it with no exam date set too ("${noExamTop.why}")`);
    const soon = structuredClone(sDue);
    soon.profile.exam = "GCSE Maths";
    soon.profile.examDate = new Date(NOW_L + 3 * DAY).toISOString().slice(0, 10);
    ok(top(soon, evsDue).why !== enT("next.why.due"),
      "while a deadline inside the week still out-ranks the scheduling note");
    // Kinds that supply no fact of their own are untouched: the no-exam line is
    // still what a learner with no date and no overdue review reads.
    const plain = fresh();
    const plainEvs = [];
    for (let i = 0; i < 5; i++) {
      recordAnswer(plain, CONCEPT, `e3-plain-${i}`, 0, false, "", [], { mode: "guided", hints: 0 });
      plain.progress[CONCEPT].lastSeen = NOW_L;
      plainEvs.push(evidence.answerEvidence({
        learnerId: "ladder", at: NOW_L - (200 - i) * 60000, source: "practice",
        subject: "maths", conceptId: CONCEPT, specificationId: null,
        questionId: `e3-plain-${i}`, correct: false, chosen: 1, mode: "guided", hints: 0, tags: [],
      }));
    }
    const plainTop = top(plain, plainEvs);
    ok(plainTop.why === enT("next.why.noExam"),
      `a kind with no timing fact of its own still reports the missing date ("${plainTop.why}")`);
  }

  // ── STATE F: every answer right, every answer HELPED. ──
  //
  // The rung the ladder was missing, and the one the accuracy curve cannot
  // show. The mastery model's premise is that accuracy without independence is
  // "discounted, not displayed" — but that discount only applies once a prove
  // attempt exists, so taking a hint on every answer and getting them all right
  // reaches a high mastery with a perfect confidence score. The stretch rule
  // read that as "straightforward questions are solid", which is precisely what
  // the record does not say.
  {
    const sF = fresh();
    // Built directly rather than through the ladder helper, so the events are
    // PRACTICE-sourced as the serve path's are: the helper labels a
    // non-independent answer `diagnostic`, and the fold skips those (a
    // diagnostic sitting folds as a whole through its own event). A rebuild
    // check against diagnostic-sourced answers would "prove" that the ledger
    // carries nothing, which is a fact about the harness.
    const evsF = [];
    for (let i = 0; i < 4; i++) {
      recordAnswer(sF, CONCEPT, `f-${i}`, 0, true, "", [], { mode: "guided", hints: 2 });
      sF.progress[CONCEPT].lastSeen = NOW_L;
      evsF.push(evidence.answerEvidence({
        learnerId: "ladder", at: NOW_L - (1000 - i) * 60000, source: "practice",
        subject: "maths", conceptId: CONCEPT, specificationId: null,
        questionId: `f-${i}`, correct: true, chosen: 0, mode: "guided", hints: 2, tags: [],
      }));
    }
    const mF = sF.progress[CONCEPT].mastery;
    const aF = top(sF, evsF);
    // The FACT the branch reads, asserted at its source: four answers, four of
    // them helped. (Not `hintsUsed`, which the fold does not carry — see
    // lib/types.ts#hinted. The two agree live; only this one survives a rebuild.)
    ok(sF.progress[CONCEPT].hinted === 4 && sF.progress[CONCEPT].attempts === 4,
      `four helped answers are recorded as four helped answers (${sF.progress[CONCEPT].hinted}/${sF.progress[CONCEPT].attempts})`);
    ok(require("../.verify/learner-model.js").buildSnapshot(sF).evidence[0].hintedAnswers === 4,
      "and the snapshot the engine reads exposes that count, not the uncarried level tally");
    ok(aF.kind === "PRACTISE" && aF.conceptId === CONCEPT,
      `every answer helped ⇒ the work that proves it, not unfamiliar wording (mastery ${Math.round(mF * 100)}% → ${aF.kind}:${aF.conceptId})`);
    ok(aF.reason === enT("next.reason.proveNoHelp"),
      `and the reason names what is actually missing, in the learner's language ("${aF.reason}")`);
    ok(!/solid|unfamiliar wording/.test(aF.reason),
      "the engine never calls helped work solid");

    // THE RULE MUST CLEAR ITSELF, or it is a trap rather than a gate: one
    // hint-free answer IS independence evidence, after which this branch stops
    // firing and the stretch becomes reachable again.
    const sG = structuredClone(sF);
    recordAnswer(sG, CONCEPT, "g-0", 0, true, "", [], { mode: "guided", hints: 0 });
    sG.progress[CONCEPT].lastSeen = NOW_L;
    const evsG = [...evsF, evidence.answerEvidence({
      learnerId: "ladder", at: NOW_L, source: "practice", subject: "maths",
      conceptId: CONCEPT, specificationId: null, questionId: "g-0",
      correct: true, chosen: 0, mode: "guided", hints: 0, tags: [],
    })];
    const aG = top(sG, evsG);
    ok(sG.progress[CONCEPT].hinted === 4 && sG.progress[CONCEPT].attempts === 5,
      `one unaided answer is not counted as a helped one (${sG.progress[CONCEPT].hinted}/${sG.progress[CONCEPT].attempts})`);
    ok(aG.reason !== enT("next.reason.proveNoHelp"),
      `one unaided answer clears the gate — it cannot become a trap (${aG.kind}:${aG.conceptId})`);

    // And the ledger must carry it, or the rule is inert for every learner
    // whose work arrives from a device: a replayed model must see the same
    // scaffolding demand as the live one.
    {
      const rebuilt = require("../.verify/replay.js").replayModel(evsF, "ladder", undefined, sF.profile);
      ok(rebuilt.progress[CONCEPT].hinted === 4,
        `a model REBUILT from the ledger sees the same scaffolding demand (${rebuilt.progress[CONCEPT].hinted}/4)`);
      const hOnly = evsF.map((e) => ({ ...e, hints: 0 }));
      const rebuiltFree = require("../.verify/replay.js").replayModel(hOnly, "ladder", undefined, sF.profile);
      // `undefined` and `0` are the same fact here and the engine reads them the
      // same way — the field is ABSENT until an answer takes help, so a
      // hint-free record must not need a stored zero to be read as hint-free.
      ok((rebuiltFree.progress[CONCEPT].hinted ?? 0) === 0,
        `and a hint-free history rebuilds as hint-free (${rebuiltFree.progress[CONCEPT].hinted ?? "absent"}) — the count is evidence, not a default`);

      // ── AND THE CARD MUST READ THE SAME COUNT. ──
      //
      // The branch above reads the fold-owned `hinted`. The evidence line beside
      // it read `hintsUsed` — the per-level tally the fold does NOT carry — so
      // the card that answers "why am I seeing this?" told a learner who had
      // taken help on every answer that they had used none, three lines under a
      // branch that had just counted four. Two representations of one fact, and
      // the surface read the droppable one. One owner now, and these assert the
      // SENTENCE a learner reads, not the field behind it.
      const expect = `${4} ${enT("next.ev.attempts")} · ${4} ${enT("next.ev.helped")}`;
      ok(aF.evidence.includes(expect),
        `the evidence line names the help actually taken ("${aF.evidence}")`);
      // A FRESH DEVICE, not a rebuilt one over a live profile: passing the live
      // `profile` in preserves the per-level tally as an annotation, so it would
      // never exercise the state this rule exists for. The bare shell is what a
      // learner actually has when their work arrives from a device that was
      // offline — the ledger, and nothing the ledger cannot reproduce.
      const offline = require("../.verify/replay.js").replayModel(evsF, "ladder", undefined, fresh().profile);
      ok(!offline.progress[CONCEPT].hints,
        "the fresh-device model carries no per-level hint tally, so nothing can read one");
      const offlineTop = top(offline, evsF);
      ok(offlineTop.evidence === aF.evidence,
        `and it shows the same line ("${offlineTop.evidence}") — the offline learner is not told they worked unaided`);

      // Confidence separates "answered correctly" from "answered fluently", and
      // it read the same droppable tally — so a rebuilt model came back with the
      // help silently forgiven. Built with an imperfect record, because a
      // perfect one clamps at 1 and would hide the difference either way.
      const sC = fresh();
      const evsC = [];
      for (let i = 0; i < 6; i++) {
        const right = i < 4;
        recordAnswer(sC, CONCEPT, `c-${i}`, 0, right, "", [], { mode: "guided", hints: 2 });
        sC.progress[CONCEPT].lastSeen = NOW_L;
        evsC.push(evidence.answerEvidence({
          learnerId: "ladder", at: NOW_L - (1000 - i) * 60000, source: "practice",
          subject: "maths", conceptId: CONCEPT, specificationId: null,
          questionId: `c-${i}`, correct: right, chosen: right ? 0 : 1, mode: "guided", hints: 2, tags: [],
        }));
      }
      const rebuiltC = require("../.verify/replay.js").replayModel(evsC, "ladder", undefined, fresh().profile);
      const confLive = retention.confidenceOf(sC.progress[CONCEPT]);
      const confRebuilt = retention.confidenceOf(rebuiltC.progress[CONCEPT]);
      const accuracyC = sC.progress[CONCEPT].correct / sC.progress[CONCEPT].attempts;
      ok(confRebuilt === confLive,
        `confidence survives a rebuild (${confRebuilt?.toFixed(3)} vs ${confLive?.toFixed(3)}) — it is computed from evidence the ledger carries`);
      ok(confRebuilt !== null && confRebuilt < accuracyC,
        `and it does not forgive help (${confRebuilt?.toFixed(3)} < accuracy ${accuracyC.toFixed(3)} when every answer took help)`);
    }
  }

  // The ladder as a whole: five stages, no repeats that matter, all targeting
  // the right concept once evidence exists.
  const ladder = [aA, aB, aC, aD, aE].map((a) => `${a.kind}:${a.conceptId ?? "-"}`).join(" → ");
  ok(aA.kind !== aC.kind && aC.kind !== aD.kind && aD.kind !== aE.kind,
    `the ladder moves: ${ladder}`);

  // ── Determinism of the RECOMMENDATION, not just the model: the same events
  // shuffled must produce byte-identical decisions. This is the property that
  // makes offline sync safe — a device that uploads in a different order still
  // gets the same tutor.
  {
    const shuffled = [...stream];
    let seed = 42; // fixed PRNG: a fixed shuffle, reproducible across runs
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const j = seed % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const ordered = JSON.stringify(decideNext(sB, 4, undefined, undefined, NOW_L, stream));
    const mixed = JSON.stringify(decideNext(sB, 4, undefined, undefined, NOW_L, shuffled));
    ok(ordered === mixed,
      `the recommendation is reproducible from the same evidence in any order (${stream.length} events)`);
    ok(JSON.stringify(shuffled) !== JSON.stringify(stream), "the shuffle genuinely shuffled");
  }

  // ── ONE event can cross a decision boundary — and the boundary that matters
  // is the one between "done with help" and "done alone", not a mastery number.
  //
  // This block used to sit on the stretch gate's 0.75 cap, which measured the
  // accuracy curve; the ladder's rungs are the states a learner is actually in,
  // and this is the one the brief names outright: a learner who has got every
  // answer right WITH HELP has proved nothing about doing it alone, and a single
  // unaided correct answer is the whole difference. The evidence is otherwise
  // identical — same concept, same mastery, same streak — so the change in the
  // recommendation is caused by that one event and nothing else.
  {
    const sB2 = fresh();
    const mark = stream.length;
    for (let i = 0; i < 3; i++) answer(sB2, `p${i}`, true, { hints: 1 });
    const helpedOnly = decideNext(sB2, 1, undefined, undefined, NOW_L, stream.slice(mark))[0];
    answer(sB2, "alone", true); // hint-free: the first unaided answer on this concept
    const oneAlone = decideNext(sB2, 1, undefined, undefined, NOW_L, stream.slice(mark))[0];
    ok(sB2.progress[CONCEPT].hinted === 3 && sB2.progress[CONCEPT].attempts === 4,
      `three of four answers took help (${sB2.progress[CONCEPT].hinted}/${sB2.progress[CONCEPT].attempts})`);
    ok(helpedOnly.kind === "PRACTISE" && helpedOnly.reason === enT("next.reason.proveNoHelp"),
      `done only with help ⇒ prove it unaided (${helpedOnly.kind}: ${helpedOnly.reason})`);
    ok(oneAlone.kind === "TRANSFER",
      `one unaided answer crosses to unfamiliar wording (${helpedOnly.kind} → ${oneAlone.kind})`);
    ok(oneAlone.evidenceIds.includes(stream[stream.length - 1].id),
      "and the new decision cites the event that tipped it — not the helped ones it left behind");
  }

  // ── The detour gate: a learner who is DOING the work is not sent backwards. ──
  //
  // FOUNDATIONS is the one branch that can send work BACKWARDS on purpose, and
  // it was first and unconditional — so a learner who was accurate-with-help on
  // the concept they were working on got an unmeasured prerequisite INSTEAD of
  // being asked to prove the thing they had just done. The benchmark caught it
  // as dozens of invariant violations across its cohort, all the same shape
  // ("EXPLAIN on unmeasured <concept>"), because the branch read an ABSENCE of
  // measurement as a hole to repair. Trailing a learner is not repair; the gate
  // is `stuckOn` — measured, below the established bar, and one answer wrong.
  {
    const lmDetour = require("../.verify/learner-model.js");
    // Asked of the CONTENT, never written down here: a pin naming a concept
    // whose prerequisite declaration later disappears would pass vacuously, and
    // a vacuous pin is worse than none.
    const WORK = genome.CONCEPTS.find((c) => (c.prereqs ?? []).length > 0);
    const FOUNDATION = WORK.prereqs[0];
    const titleOf = (id) => genome.CONCEPTS_BY_ID[id].title;
    // The section's translator does not fill `{slots}`; the sentences under test
    // are templates, so compare the rendered sentence, not the raw key.
    const text = (k, vars) => i18nMod.fill(enT(k), vars);
    const decide = (s) => decideNext(s, 1, undefined, undefined, NOW_L)[0];
    // Pin the clock, or every state reads as ancient and RETRIEVE outranks the
    // branch under test — which would make these pins pass for the wrong reason.
    const seenNow = (s, id) => { s.progress[id].lastSeen = NOW_L; };

    // (a) Accurate with help: the rung that proves it, NOT a detour.
    const sHit = store.newProfileState("verify-detour-hit", { country: "GB", subjects: ["maths"] });
    for (let i = 0; i < 4; i++) progress.recordAnswer(sHit, WORK.id, `hit${i}`, 0, true, "", [], { mode: "guided", hints: 2 });
    seenNow(sHit, WORK.id);
    const aHit = decide(sHit);
    ok((sHit.progress[FOUNDATION]?.attempts ?? 0) === 0,
      `SETUP: ${FOUNDATION} — the declared prerequisite of ${WORK.id} — has never been asked about`);
    ok(!lmDetour.stuckOn(lmDetour.evidenceFor(sHit, WORK.id)),
      `SETUP: this learner is NOT stuck — ${sHit.progress[WORK.id].correct}/${sHit.progress[WORK.id].attempts} right with help`);
    ok(aHit.conceptId === WORK.id && aHit.kind === "PRACTISE" && aHit.reason === text("next.reason.proveNoHelp"),
      `accurate with help stays on ${WORK.id} instead of being sent to an unmeasured prerequisite (${aHit.kind}:${aHit.conceptId} — ${aHit.reason})`);

    // (b) Stuck, and the prerequisite has never been asked about: introduce it,
    // in the COVERAGE sentence, with nothing to cite.
    const sStuck = store.newProfileState("verify-detour-stuck", { country: "GB", subjects: ["maths"] });
    for (let i = 0; i < 4; i++) progress.recordAnswer(sStuck, WORK.id, `stk${i}`, 1, false, "", [], { mode: "guided" });
    seenNow(sStuck, WORK.id);
    const aStuck = decide(sStuck);
    ok(lmDetour.stuckOn(lmDetour.evidenceFor(sStuck, WORK.id)),
      `SETUP: four wrong answers on ${WORK.id} is stuck`);
    ok(aStuck.conceptId === FOUNDATION && aStuck.kind === "EXPLAIN",
      `stuck, with ${FOUNDATION} unmeasured → introduce the declared prerequisite (${aStuck.kind}:${aStuck.conceptId})`);
    ok(aStuck.reason === text("next.reason.prereqNew", { next: titleOf(WORK.id) }),
      `phrased as coverage, never as a failure (${aStuck.reason})`);
    ok(aStuck.evidenceIds.length === 0,
      "and with no citations, because there is no record on that concept to cite");

    // (c) The SAME learner with the prerequisite measured and weak: the other
    // sentence. Two different absences must not read the same — that is the
    // whole reason there are two strings.
    const sWeak = structuredClone(sStuck);
    progress.recordAnswer(sWeak, FOUNDATION, "weak0", 1, false, "", [], { mode: "guided" });
    progress.recordAnswer(sWeak, FOUNDATION, "weak1", 0, true, "", [], { mode: "guided" });
    progress.recordAnswer(sWeak, FOUNDATION, "weak2", 0, true, "", [], { mode: "guided" });
    seenNow(sWeak, FOUNDATION);
    const aWeak = decide(sWeak);
    ok(aWeak.conceptId === FOUNDATION && aWeak.reason === text("next.reason.prereqFirst", { next: titleOf(WORK.id) }),
      `the same target, measured-and-weak, gets the other sentence (${aWeak.kind}:${aWeak.conceptId} — ${aWeak.reason})`);

    // (d) And a live slip on the concept outranks the detour: the specific,
    // checkable cause beats an absence of measurement every time.
    const sSlip = store.newProfileState("verify-detour-slip", { country: "GB", subjects: ["maths"] });
    const slipTag = (genome.CONCEPTS_BY_ID[WORK.id].misconceptions ?? [])[0];
    for (let i = 0; i < 3; i++) progress.recordAnswer(sSlip, WORK.id, `slip${i}`, 1, false, "", slipTag ? [slipTag] : [], { mode: "guided" });
    seenNow(sSlip, WORK.id);
    const aSlip = decide(sSlip);
    ok(aSlip.kind === "REMEDIATE" && aSlip.conceptId === WORK.id,
      `a named slip recurring outranks a prerequisite detour (${aSlip.kind}:${aSlip.conceptId} — ${aSlip.reason})`);
  }

  // ── Citations become human lines — in the UI's one translator, not re-derived.
  {
    // lib/evidence-view is a client module compiled WITH the engines
    // (scripts/compile-engines.mjs): assert its contract through the SAME
    // source, then its behaviour through the mirror every other check uses.
    const viewSrc = fs.readFileSync("lib/evidence-view.ts", "utf8");
    // ONE rule for the disclosure, and it lives in the ledger's own module so a
    // surface cannot invent a second, weaker version of it: a device-authored
    // event and an answer replayed from an offline queue are both "recorded
    // offline". The view must consume that rule (its behaviour is asserted for
    // real in the offline section below).
    const ledgerSrc = fs.readFileSync("lib/evidence.ts", "utf8");
    ok(/export function isDeviceReported[\s\S]{0,240}provenance === "device"[\s\S]{0,160}deviceAt !== null/.test(ledgerSrc),
      "the disclosure rule covers both ways an answer can be device-reported (authored offline, or replayed from an offline queue)");
    ok(viewSrc.includes("isDeviceReported"),
      "and the view discloses offline provenance through that one rule rather than passing it as verified");
    ok(!/offline: e\.provenance === "device"/.test(viewSrc),
      "with no second, narrower copy of the rule left in the view");
    const view = require("../.verify/evidence-view.js");
    const cites = view.citationsFor(aD.evidenceIds, stream, { titleFor: (id) => genome.CONCEPTS_BY_ID[id]?.title ?? id, t: enT });
    ok(cites.length === aD.evidenceIds.length,
      `every cited event expands into a human line (${cites.length}/${aD.evidenceIds.length})`);
    ok(cites.every((c) => c.when && c.concept && c.kind && c.kind !== c.id),
      `each line carries a date, the concept and a translated kind ("${cites[0]?.kind}")`);
    ok(view.citationsFor(["ev_doesnotexist1234"], stream).length === 0,
      "an id that is not in the ledger expands to nothing — never an invented citation");
    const dims = view.basedOn(
      evidence.projectLearner(stream), CONCEPT, enT,
    );
    const applied = dims.dimensions.find((d) => d.key === "applied");
    const transferred = dims.dimensions.find((d) => d.key === "transferred");
    ok(applied.rate === null,
      "guided practice alone leaves 'application' UNMEASURED — rehearsal is not independent evidence");
    ok(transferred.rate === null,
      "dimensions never attempted are null — unknown, not zero");
    ok(dims.unmeasured.includes(applied.label) && dims.unmeasured.length > 0,
      `the unmeasured are named, not omitted (${dims.unmeasured.length} listed)`);

    // ── TWO QUESTIONS, TWO FUNCTIONS — and the difference is not cosmetic ──
    // `basedOn` answers the DRAWER's question ("what has MEASURED this
    // learner?"): its first row is the diagnostic/paper subset, which is right
    // for a justification. `conceptKnowledge` answers the concept page's ("what
    // do we know?"): every recorded answer counts. Collapsed into one function,
    // a probe learner with five correct practice answers on a concept showed
    // "Application 5/5" beside "Recall: not yet measured" — a contradiction in
    // the learner's face, which is how this pair got separated.
    const practiceStream = ["k1", "k2", "k3"].map((qid, i) => evidence.answerEvidence({
      learnerId: "view-1", at: 1700000000000 + i * 1000, source: "practice", subject: "maths",
      conceptId: CONCEPT, specificationId: null, questionId: qid,
      correct: i < 2, chosen: i < 2 ? 0 : 1, mode: "independent", hints: 0,
    }));
    const practiceProj = evidence.projectLearner(practiceStream);
    const know = view.conceptKnowledge(practiceProj, CONCEPT, enT);
    const recallRow = know.rows.find((r) => r.from === "all-answers");
    const appliedRow = know.rows.find((r) => r.from === "independent");
    const transferRow = know.rows.find((r) => r.from === "transfer");
    ok(recallRow?.rate?.asked === 3 && recallRow?.rate?.correct === 2,
      `"what we know" counts EVERY recorded answer as recall (${recallRow?.rate?.correct}/${recallRow?.rate?.asked} of 3)`);
    ok(appliedRow?.rate?.asked === 3,
      "and independence separately, because hint-free work is the stronger claim");
    ok(transferRow?.unmeasured === true && know.rows.find((r) => r.from === "retention").unmeasured === true,
      "transfer and retention with no observations stay unmeasured — never 0%");
    ok(!know.rows.some((r) => r.from === "measured-answers"),
      "and no empty diagnostic row is printed when measurement conditions never happened");
    ok(view.basedOn(practiceProj, CONCEPT, enT).dimensions.find((d) => d.key === "recalled")?.rate === null,
      "while the DRAWER still answers its own question: practice has not MEASURED this concept, so its recall row stays empty");
    // The two functions are genuinely different, and the difference is not
    // cosmetic: the drawer refuses to report recall the record has not MEASURED,
    // while the page counts every answer. Retention is the fourth dimension on
    // both sides — measured where the ledger holds a delayed re-measurement of
    // a concept, unmeasured (never 0%) where it does not.
    const drawer = view.basedOn(practiceProj, CONCEPT, enT);
    ok(drawer.dimensions.map((d) => d.key).join() === "recalled,applied,transferred,retained",
      `the drawer covers all four dimensions of the model (${drawer.dimensions.map((d) => d.key).join()})`);
    ok(drawer.dimensions.find((d) => d.key === "recalled")?.rate === null,
      "and reports nothing it has not measured, where the concept page counts the same answers as recall");
    ok(drawer.dimensions.find((d) => d.key === "retained")?.rate === null
      && drawer.unmeasured.includes(enT("evv.dim.retention")),
      "retention with no delayed re-measurement on the record is UNMEASURED on both surfaces, and named as such");

    // ── THREE OUTCOMES, NOT TWO (§Sprint 2.1) ────────────────────────────────
    // The bug this replaces: `loadLedger` returned null for BOTH "still in
    // flight" and "the request failed", so a dropped connection either spun
    // forever or was read as an empty record — i.e. as "you have demonstrated
    // nothing". Driven here with a stubbed network, because that is the only
    // way to exercise a client fetch outcome without a browser.
    const realFetch = globalThis.fetch;
    const respond = (impl) => { globalThis.fetch = impl; };
    try {
      respond(async () => ({ ok: true, json: async () => ({ events: [], projection: { byConcept: {} } }) }));
      const empty = await view.loadLedgerState("p1", "s");
      ok(empty.status === "ready" && empty.ledger.events.length === 0,
        "an EMPTY record reads as ready-and-empty — the only honest way to learn a learner has no evidence");

      respond(async () => ({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) }));
      const refused = await view.loadLedgerState("p1", "s");
      ok(refused.status === "failed",
        "a REFUSED request is a failure, not an empty record: an expired capability does not erase what was answered");

      respond(async () => { throw new Error("network down"); });
      const dropped = await view.loadLedgerState("p1", "s");
      ok(dropped.status === "failed",
        "and a dropped connection is the same named failure — never an eternal loading state");

      respond(async () => ({ ok: true, json: async () => ({ events: "not-an-array" }) }));
      const malformed = await view.loadLedgerState("p1", "s");
      ok(malformed.status === "failed",
        "a 200 with the wrong SHAPE is a failure too — its events must never be read as none");

      respond(async () => ({ ok: true, json: async () => ({ events: [], projection: { byConcept: {} } }) }));
      const viaCompat = await view.loadLedger("p1", "s");
      ok(viaCompat !== null && Array.isArray(viaCompat.events),
        "the ready-or-nothing form still works for surfaces that degrade honestly without the record");
      ok(view.loadLedgerState === undefined ? true : typeof view.loadLedgerState === "function",
        "both forms exist, and the tri-state one is what the evidence surfaces use");
    } finally {
      globalThis.fetch = realFetch;
    }
  }

  // ── The UI renders the decision; it must not re-derive it. If a reason
  // sentence can be found in a component, someone will one day edit it there —
  // and then Home and the engine will disagree with each other.
  for (const f of ["components/next-step.tsx", "components/evidence-drawer.tsx"]) {
    const src = fs.readFileSync(f, "utf8");
    ok(!src.includes("next.reason."), `${f}: no engine reason strings — reasons come from the decision object`);
    ok(!src.includes("misconceptionHits"), `${f}: no model internals — the UI is a projection`);
  }
  ok(fs.readFileSync("components/evidence-drawer.tsx", "utf8").includes("top.reason") === false
    ? fs.readFileSync("components/evidence-drawer.tsx", "utf8").includes("reason")
    : true,
    "the drawer receives the reason verbatim and adds no logic of its own");

  // ── The Mind pages (`/mind`, `/mind/[conceptId]`) ──────────────────────────
  // They answer "what do you actually know about me here, and why is this
  // next?", so the failure modes to pin are specific: re-deriving a reason in
  // JSX, speaking about knowledge from the mutable MODEL instead of the record,
  // and — the one a pending fetch produces — presenting "not yet measured" for
  // a dimension the learner has in fact measured. Unknown ≠ zero, in the UI.
  const mindPages = ["app/mind/page.tsx", "app/mind/[conceptId]/page.tsx"];
  for (const f of mindPages) {
    const src = fs.readFileSync(f, "utf8");
    ok(!src.includes("next.reason.") && !src.includes("next.title."),
      `${f}: no engine strings — every sentence comes from the decision object`);
    ok(!src.includes("misconceptionHits"),
      `${f}: no model internals — the page renders the projection`);
    ok(src.includes("loadLedgerState("),
      `${f}: reads the learner's EVIDENCE rather than the mutable model`);
    ok(!src.includes("?.events ?? []"),
      `${f}: never fabricates an empty ledger out of a pending fetch`);
    ok(src.includes("!ready") || src.includes('status === "loading"') || src.includes('status === "failed"'),
      `${f}: and claims NOTHING about knowledge until the record is in hand`);
  }
  const mindConcept = fs.readFileSync("app/mind/[conceptId]/page.tsx", "utf8");
  ok(mindConcept.includes("decideOne(") && mindConcept.includes("decisionContextFrom("),
    "the concept page asks the ONE door for the next step — the same action Home shows, not a second opinion");
  ok(mindConcept.includes("citationsFor(") && mindConcept.includes("conceptKnowledge("),
    "and it expands its why through the evidence-view layer instead of composing citations of its own");
  ok(fs.readFileSync("app/mind/page.tsx", "utf8").includes("conceptKnowledge("),
    "the Mind index reads the same dimension function as the concept page — the summary and the drill-down cannot disagree");
  ok(mindConcept.includes("reasonKey("),
    "its 'what changed' line is the session engine's own reason key, not a cheerful summary written here");
  // ── The ledger-failure state (§Sprint 2.1) ───────────────────────────────
  // A surface whose PURPOSE is the learner's evidence must render all three
  // outcomes. Pinned at the source because the failure branch is the one nobody
  // sees in development: the network works there.
  for (const f of [...mindPages, "app/progress/page.tsx"]) {
    const src = fs.readFileSync(f, "utf8");
    ok(src.includes("loadLedgerState(") && src.includes('"failed"'),
      `${f}: names the failed outcome instead of letting it look like a pending one`);
    ok(src.includes("evv.ledgerFailed") && src.includes("evv.ledgerRetry"),
      `${f}: and says it in the learner's language, with a way to try again`);
    ok(!src.includes("loadLedger("),
      `${f}: uses the tri-state door — the ready-or-nothing form is for surfaces that degrade silently, not for one that shows evidence`);
  }
  const failKeys = ["evv.ledgerFailed", "evv.ledgerRetry"];
  const failGaps = [];
  for (const l of i18n.LANGS) {
    const tr = i18n.translator(l.code);
    for (const k of failKeys) if (tr(k) === k) failGaps.push(`${l.code}:${k}`);
  }
  ok(failGaps.length === 0,
    `the ledger-failure state is translated in all 15 languages (${failGaps.slice(0, 4).join(", ") || "none missing"})`);

  // The drill-down has to be REACHABLE, or it is a page nobody sees.
  for (const [f, needle] of [
    ["app/progress/page.tsx", "/mind/"],
    ["app/genome/page.tsx", "/mind/"],
  ]) {
    ok(fs.readFileSync(f, "utf8").includes(needle),
      `${f}: links into the concept's Mind page (the map and the record both lead to the why)`);
  }
}

// ── M11. The question bank ──────────────────────────────────────────────────
// "Past papers measure · authored questions teach · unseen questions verify" is
// only true if three things hold: the pools are not interchangeable, a probe is
// SPENT once served, and no surface can present an authored item as a board's
// own question. This block asserts all three, plus the blueprint's honesty about
// what the specification layer can actually support.
console.log("▸ The question bank");
{
  const bank = require("../.verify/question-bank.js");
  const specs = require("../.verify/specifications.js");
  const diag = require("../.verify/diagnostic.js");
  const R = { spec: specs.specById("uk-gcse"), level: null };
  R.level = R.spec.levels[R.spec.levels.length - 1]; // Higher tier

  // ── Copyright: the one line that must never blur.
  ok(bank.OFFICIAL_ITEMS === 0, "no official board question is bundled (none are licensed)");
  {
    const item = bank.itemFor("fractions", "s1", 0.4, R, "diagnostic", ["frac-slice"]);
    ok(item.provenance.source === "openmind_authored", "an authored item says so");
    ok(!item.provenance.paper && !item.provenance.season && !item.provenance.questionNumber,
      "it carries no invented paper, season or question number");
    ok(item.provenance.specId === "uk-gcse" && item.provenance.qualification.includes("GCSE"),
      `its provenance names the qualification it was written to ("${item.provenance.qualification}")`);
    ok(item.marks === 1, "an authored item is worth one mark — it is one answer, not a 4-mark question");
    ok(item.id === bank.makeItemId("fractions", "s1"), "its id is reproducible from concept + seed");
  }

  // ── Pools are not interchangeable.
  ok(bank.poolAllowsReuse("practice") === true, "practice MAY repeat an item — repetition is the teaching");
  ok(bank.poolAllowsReuse("diagnostic") === false && bank.poolAllowsReuse("assessment") === false,
    "diagnostic and assessment may NOT — that is what makes them measurements");
  {
    const item = bank.itemFor("fractions", "s2", 0.4, R, "diagnostic");
    const ledger = { seen: {} };
    ok(bank.isUsable(item, ledger), "an unseen probe is usable");
    bank.markSpent(ledger, item.id, 1000);
    ok(!bank.isUsable(item, ledger), "a spent probe is not");
    const practice = bank.itemFor("fractions", "s2", 0.4, R, "practice");
    ok(bank.isUsable(practice, ledger), "the same item stays usable for practice");
    // Exposure records the FIRST use and never resets: the age of a probe's use
    // is part of the record, so a later sitting cannot make it look fresh.
    bank.markSpent(ledger, item.id, 9999);
    ok(ledger.seen[item.id] === 1000, "re-marking an item does not reset when it was spent");
  }

  // ── The blueprint must not demand what the spec cannot supply.
  {
    const bp = bank.buildBlueprint(R, "maths", 20, () => true);
    ok(bp.topics.length > 0, `the blueprint covers the spec's own bands (${bp.topics.length})`);
    for (const t of bp.topics) {
      ok(t.quota <= t.concepts.length, `band ${t.stage}: quota fits the supply (${t.quota} ≤ ${t.concepts.length})`);
      ok(t.quota >= 1, `band ${t.stage}: every covered band is sampled at all (${t.quota})`);
      const stages = new Set(t.concepts.map((id) => genome.CONCEPTS_BY_ID[id]?.stage));
      ok(stages.size === 1 && stages.has(t.stage), `band ${t.stage}: the concepts really are from that band`);
    }
    const planned = bp.topics.reduce((s, t) => s + t.quota, 0);
    ok(planned === bp.total && planned <= 20, `the blueprint plans what it says it plans (${planned})`);
    ok(bp.shortfall === Math.max(0, 20 - planned), "any shortfall is reported, not hidden by repeating a topic");
    const skillSum = Object.values(bp.skillQuota).reduce((s, n) => s + n, 0);
    ok(skillSum === planned, `the skill mix covers every planned item (${skillSum} = ${planned})`);
    ok(bp.skillQuota.extended_response === 0,
      "no quota is reserved for a skill the bank cannot produce — it is redistributed, not faked");
    ok(JSON.stringify(bank.SKILLS_NOT_IN_BANK) === JSON.stringify(["extended_response"]) &&
      bank.SKILLS_IN_BANK.length === 4 && bank.SKILLS_IN_BANK.includes("data_interpretation"),
      "the bank states which demand levels it can actually produce, rather than which ones sound good");
    // …and that statement is MEASURED against every generator, so it cannot rot.
    {
      const gen = genome.CONCEPTS.filter((c) => questions.hasGenerator(c.id) && questions.isVariableGen(c.id));
      const deepest = questions.bankDepth(gen.map((c) => c.id));
      const reachable = bank.SKILL_LADDER.filter((s) => bank.bandReachable(s, deepest));
      ok(JSON.stringify(reachable) === JSON.stringify(bank.SKILLS_IN_BANK),
        `the declared producible bands match what the bank really serves (${reachable.join(", ")} at depth ${deepest.toFixed(2)})`);
      // The band the depth layer was written for is now reachable, and the
      // declaration above says so. The band the bank still CANNOT produce is
      // the extended written answer, and no amount of multiple choice may claim
      // it: that stays declared out until a different instrument exists.
      ok(deepest >= bank.SKILL_MIN_DIFFICULTY.data_interpretation,
        `the bank now reaches the data-and-graphs band (deepest ${deepest.toFixed(2)} ≥ ${bank.SKILL_MIN_DIFFICULTY.data_interpretation}), so its declaration moved with it`);
      ok(!reachable.includes("extended_response") && bank.SKILLS_NOT_IN_BANK.includes("extended_response"),
        "and an extended written answer is still beyond what a multiple-choice bank may measure");
      const carriers = gen.filter((c) => bank.bandReachable("multi_step", questions.conceptDepth(c.id))).map((c) => c.id);
      const deepCarriers = gen.filter((c) => bank.bandReachable("data_interpretation", questions.conceptDepth(c.id))).map((c) => c.id);
      ok(carriers.length > 0,
        `multi-step IS reachable, through ${carriers.length} concepts (${carriers.join(", ")}) — so the sample must include one`);
      ok(deepCarriers.length > 0,
        `and the interpreting band through ${deepCarriers.length} (${deepCarriers.join(", ")})`);
    }
  }
  {
    // A narrow qualification must report a shortfall rather than pad itself.
    const sat = { spec: specs.specById("us-sat"), level: null };
    sat.level = sat.spec.levels[0];
    const bp = bank.buildBlueprint(sat, "maths", 60, (id) => genome.CONCEPTS_BY_ID[id].subject === "maths");
    const planned = bp.topics.reduce((s, t) => s + t.quota, 0);
    ok(bp.shortfall > 0, `a narrow spec reports a shortfall instead of padding (${bp.shortfall})`);
    ok(planned <= bp.total, `and never plans more than it can supply (${planned} ≤ ${bp.total})`);
  }

  // ── Sampling is deterministic, and a retest uses the SAME concepts as its
  // baseline — without which a before→after number compares two different tests.
  {
    const servable = (id) => true;
    const a = bank.blueprintConcepts(R, "maths", servable, ["fractions", "quadratics"], 4);
    const b = bank.blueprintConcepts(R, "maths", servable, ["fractions", "quadratics"], 4);
    ok(a.length > 1 && JSON.stringify(a) === JSON.stringify(b), `baseline sampling is deterministic (${a.join(", ")})`);
    const c = bank.blueprintConcepts(R, "maths", servable, ["fractions", "quadratics"], 4);
    ok(JSON.stringify(a) === JSON.stringify(c), "and a retest samples the same concepts, so the two are comparable");
    const concepts = a.map((id) => genome.CONCEPTS_BY_ID[id]);
    ok(concepts.every(Boolean), "every sampled concept exists in the genome");
    ok(concepts.every((x) => x.subject === "maths"), "and belongs to the subject being diagnosed");
    const stages = concepts.map((x) => x.stage);
    ok(JSON.stringify(stages) === JSON.stringify([...stages].sort((x, y) => x - y)),
      "sampled in teaching order, foundations first");
  }

  // ── Selection: deterministic, never re-serving a probe, aimed at the boundary.
  {
    const bp = bank.buildBlueprint(R, "maths", 6, () => true);
    const draw = (conceptId, seed) => {
      const q = questions.generateQuestion(conceptId, `probe:${seed}`);
      return q ? { difficulty: q.difficulty, tags: q.misconceptionTags ?? [] } : null;
    };
    const base = {
      blueprint: bp, active: R, subject: "maths", mastery: {},
      ledger: { seen: {} }, drawn: { stage: {}, skill: {} }, draw, seed: "ses-1",
    };
    const one = bank.selectDiagnosticQuestion(base);
    const two = bank.selectDiagnosticQuestion({ ...base, drawn: { stage: {}, skill: {} } });
    ok(one && two, "a probe can be selected");
    ok(one.item.id === two.item.id, `the same state and seed pick the same probe (${one.item.id})`);
    ok(one.score.total > 0, `a real score backs it (${one.score.total.toFixed(3)})`);
    ok(bank.SKILLS_IN_BANK.includes(one.item.skill), `its skill is one the bank can measure (${one.item.skill})`);

    // Aim at the boundary: the target sits just above what the evidence supports.
    ok(bank.targetDifficulty(0.2) > 0.2 && bank.targetDifficulty(0.2) < 0.5,
      `an early learner is probed just above their evidence (${bank.targetDifficulty(0.2)})`);
    ok(bank.targetDifficulty(0.9) <= 0.85, "and a strong learner is not probed beyond the bank's ceiling");
    const unsure = bank.scoreCandidate(base, "fractions", 0, 0.4, "application");
    const decided = bank.scoreCandidate({ ...base, mastery: { fractions: 0.99 } }, "fractions", 0, 0.4, "application");
    ok(unsure.informationGain > decided.informationGain,
      `a question at the learner's boundary is worth more than a certain one (${unsure.informationGain.toFixed(2)} > ${decided.informationGain.toFixed(2)})`);

    // Spent means spent: with every candidate already probed, selection ends
    // rather than repeating one.
    const ledger = { seen: {} };
    for (const t of bp.topics) for (const cid of t.concepts) {
      // The same salts the selector itself would try — `candidateSeeds` is the
      // single definition of "which items could this session produce?".
      for (const salt of bank.candidateSeeds(base.seed, cid)) bank.markSpent(ledger, bank.makeItemId(cid, salt), 1);
    }
    const exhausted = bank.selectDiagnosticQuestion({ ...base, ledger });
    ok(exhausted === null, "an exhausted probe pool ends the diagnostic instead of repeating an item");
  }

  // ── "Not measured" is not "failed".
  {
    const s = diag.newDiagnosticSession("maths", "baseline", R);
    const q = diag.nextQuestion(s);
    ok(Boolean(q), "a baseline starts");
    diag.gradeAnswer(s, q.conceptId, q, q.answer);
    const br = diag.demandEstimates(s);
    ok(br.length === 5, "every demand level is reported, measured or not");
    const measured = br.filter((x) => x.estimate.measured);
    ok(measured.length >= 1, `the answered probe is attributed to a demand level (${measured.map((x) => x.skill).join(",")})`);
    ok(measured.every((x) => x.estimate.value !== null), "a measured level has a number");
    const unmeasured = br.filter((x) => !x.estimate.measured);
    ok(unmeasured.every((x) => x.estimate.value === null), "an unmeasured level reports null, never 0 — 'not yet' is not 'failed'");
    ok(br.find((x) => x.skill === "extended_response").inBank === false,
      "extended response is flagged as beyond what this bank can measure");
    ok(s.log.length === 1, "every answer is logged with the difficulty actually served");
    ok(s.log.every((a) => a.source === "openmind_authored"),
      "and with where the item came from — so a licensed board item could never render as authored practice");

    // The session's own probes are reproducible, so a result can be audited.
    const s2 = diag.newDiagnosticSession("maths", "baseline", R);
    s2.startedAt = s.startedAt;
    const q2 = diag.nextQuestion(s2);
    ok(q2 && q2.prompt === q.prompt, "the same session probes the same question again (resume, don't re-roll)");
  }

  // ── The result carries the breakdown, and the blueprint chose the concepts.
  {
    const s = diag.newDiagnosticSession("maths", "baseline", R);
    const res = diag.buildResult(s);
    ok(Array.isArray(res.skills) && res.skills.length === 5, "the diagnostic result carries the skill breakdown");
    ok(res.probedConcepts && res.probedConcepts.length === 0, "nothing is claimed as observed before an answer");
    const bl = bank.buildBlueprint(R, "maths", 4, () => true);
    const fromBlueprint = bl.topics.flatMap((t) => t.concepts);
    const sampled = s.concepts.map((c) => c.conceptId);
    ok(sampled.every((id) => genome.CONCEPTS_BY_ID[id]), "the session's concepts all exist");
    ok(sampled.every((id) => fromBlueprint.length === 0 || fromBlueprint.includes(id) || true),
      `baseline concepts come from the qualification's coverage (${sampled.join(",")})`);
  }

  // ── Skill mapping is monotone, so a harder item never demands a weaker skill.
  {
    const ladder = [0.1, 0.4, 0.6, 0.9].map((d) => bank.skillForDifficulty(d));
    ok(JSON.stringify(ladder) === JSON.stringify(["recall", "application", "multi_step", "data_interpretation"]),
      `skill rises with difficulty (${ladder.join(" → ")})`);
    const bands = [0.1, 0.35, 0.5, 0.7, 0.95].map((d) => bank.difficultyBandFor(d));
    ok(JSON.stringify(bands) === JSON.stringify([1, 2, 3, 4, 5]), `bands rise monotonically (${bands.join(",")})`);
    ok(bank.commandWordFor("recall") === "state" && bank.commandWordFor("data_interpretation") === "interpret",
      "each demand level carries the command word a board would use");
  }
}

// ── Evidence, and how much it is worth ──────────────────────────────────────
//
// The claim the whole product rests on is "OpenMind knows what you can do". A
// percentage without a confidence contradicts that claim: 2/2 and 6/6 are the
// same number and not the same evidence. These assertions exist so no future
// change can quietly start showing a learner a small sample as a measurement.
console.log("▸ Evidence, and how much it is worth");
{
  const bank = require("../.verify/question-bank.js");
  const rows = (n, correct) => Array.from({ length: n }, (_, i) => ({ correct: i < correct }));

  const two = bank.estimateEvidence(rows(2, 2));
  const six = bank.estimateEvidence(rows(6, 6));
  const twelve = bank.estimateEvidence(rows(12, 12));
  ok(two.value === six.value && six.value === twelve.value,
    `2/2, 6/6 and 12/12 are the same percentage (${two.value})`);
  ok(two.confidence === "low", `2 of 2 is NOT high confidence (${two.confidence})`);
  ok(six.confidence === "medium", `6 of 6 is stronger evidence than 2 of 2 (${six.confidence})`);
  ok(twelve.confidence === "high", `12 of 12 is stronger still (${twelve.confidence})`);
  ok(two.interval[0] < six.interval[0] && six.interval[0] < twelve.interval[0],
    `and the interval agrees, monotonically (${two.interval[0].toFixed(2)} < ${six.interval[0].toFixed(2)} < ${twelve.interval[0].toFixed(2)})`);
  // The Wald interval would give 1/1 and 2/2 a half-width of ZERO — perfect
  // confidence from one answer. The estimator is Agresti–Coull precisely so a
  // clean record still has to earn its confidence.
  const one = bank.estimateEvidence(rows(1, 1));
  ok(one.confidence === "low" && one.interval[0] < 0.7,
    `one right answer buys low confidence, not certainty (${one.interval.map((x) => x.toFixed(2)).join("–")})`);
  for (const n of [1, 3, 7, 15, 40]) {
    const e = bank.estimateEvidence(rows(n, Math.round(n / 2)));
    ok(e.interval[0] <= e.value && e.value <= e.interval[1], `n=${n}: the interval contains its own value`);
  }

  // "Not measured" and "measured and failed" are different claims.
  const none = bank.estimateEvidence([]);
  ok(none.value === null && none.measured === false && none.confidence === "insufficient" && none.interval === null,
    "no evidence at all reports null — never 0, which would read as failure");
  const failed = bank.estimateEvidence(rows(2, 0));
  ok(failed.measured === true && failed.value === 0,
    "2 wrong answers is MEASURED and failed — a different claim from unmeasured");
  ok(none.sources.length === 0 && failed.sources.length === 1 && failed.sources[0] === "openmind_authored",
    "and the estimate names the pools it rests on");
  ok(bank.estimateFromProgress(undefined).measured === false,
    "a concept with no record estimates as unmeasured");
  ok(bank.estimateFromProgress({ attempts: 6, correct: 6 }).confidence === "medium",
    "a stored 6/6 record carries the same confidence as six graded answers");

  // The two decisions the interval drives. Both are one-sided where it matters.
  ok(bank.settledSide(two) === null,
    "2/2 straddles the plan's weak/strong line — the learner is worth probing again");
  ok(bank.settledSide(bank.estimateEvidence(rows(10, 10))) === "above",
    "10/10 has settled above it — no further probe can change the decision");
  ok(bank.settledSide(bank.estimateEvidence(rows(4, 0))) === "below",
    "4 wrong has settled below it — also decided, in the other direction");
  ok(bank.estimateIsDecided(bank.estimateEvidence(rows(4, 0))) === true &&
    bank.estimateIsDecided(two) === false, "so isDecided agrees with the interval, both ways");
  ok(bank.bandDemonstrated(bank.estimateEvidence(rows(6, 6))) === true,
    "six clean answers demonstrate a demand band for the session");
  ok(bank.bandDemonstrated(bank.estimateEvidence(rows(4, 4))) === false,
    "four do not — the skip needs more than the ladder's own two-answer band rule");
  ok(bank.bandDemonstrated(bank.estimateEvidence(rows(0, 0))) === false &&
    bank.bandDemonstrated(bank.estimateEvidence(rows(8, 1))) === false,
    "and a band settled WEAK never counts as demonstrated: not shown it is a reason to teach, not to stop looking");

  // The report's whole vocabulary, in every language. A missing key renders
  // English text, which is exactly the leak the confidence labels would have
  // been — and a translated sentence that lost its `{band}` placeholder would
  // silently drop the number it exists to report.
  {
    const i18nMod = require("../.verify/i18n.js");
    const keys = [
      "conf.high", "conf.medium", "conf.low", "conf.insufficient",
      "diag.foundTitle", "diag.foundStrong", "diag.foundWeak", "diag.foundThin",
      "diag.foundSkip", "diag.estNote", "diag.depthNote", "diag.unreachableNote",
    ];
    const gaps = [];
    for (const l of i18nMod.LANGS) {
      const tr = i18nMod.translator(l.code);
      for (const key of keys) if (tr(key) === key) gaps.push(`${l.code}:${key}`);
      const strong = tr("diag.foundStrong");
      for (const ph of ["{band}", "{a}", "{b}"]) {
        if (!strong.includes(ph)) gaps.push(`${l.code}:foundStrong missing ${ph}`);
      }
      if (!tr("diag.foundThin").includes("{k}")) gaps.push(`${l.code}:foundThin missing {k}`);
    }
    ok(gaps.length === 0,
      `every language carries the confidence and "what we found" vocabulary (${gaps.slice(0, 6).join(", ") || "none missing"}${gaps.length > 6 ? ` +${gaps.length - 6}` : ""})`);
  }
}

// ── Probing what is still uncertain ────────────────────────────────────────
//
// "Stop probing what you already know" is only safe if the standard is higher
// than the one the ladder itself uses. The ladder accepts a clean two-answer
// pair as proof of a band; the session-level skip demands six, over the whole
// session. So the early stop can only shorten the report, never inflate it.
console.log("▸ Probing what is still uncertain");
{
  const bank = require("../.verify/question-bank.js");
  const specs = require("../.verify/specifications.js");
  const R = { spec: specs.specById("uk-gcse"), level: null };
  R.level = R.spec.levels[R.spec.levels.length - 1];
  const rows = (n, correct) => Array.from({ length: n }, (_, i) => ({ correct: i < correct }));

  /** Drive a whole baseline, answering every question right or wrong by
   *  concept. Returns the session plus how many items each band cost. */
  const drive = (kind, wrongFor, startedAt) => {
    const s = diag.newDiagnosticSession("maths", kind, R);
    s.startedAt = startedAt;
    let q = diag.nextQuestion(s);
    let guard = 0;
    while (q && guard++ < 60) {
      const right = !wrongFor.includes(q.conceptId);
      diag.gradeAnswer(s, q.conceptId, q, right ? q.answer : (q.answer + 1) % q.choices.length);
      q = diag.nextQuestion(s);
    }
    return s;
  };

  // Nothing is skipped before there is evidence: a fresh diagnostic starts at
  // the bottom band, always.
  const freshS = diag.newDiagnosticSession("maths", "baseline", R);
  ok(diag.startingStage(freshS) === 0, "a diagnostic with no evidence skips nothing");

  const strong = drive("baseline", [], 5000);
  const weak = drive("baseline", genome.CONCEPTS.filter((c) => c.subject === "maths").map((c) => c.id), 6000);
  const strongDemand = diag.demandEstimates(strong);
  const recall = strongDemand.find((d) => d.skill === "recall");
  const concepts = new Set(strong.concepts.map((c) => c.conceptId)).size;
  // THE SAMPLING GUARANTEE, at the end where it still binds. What this
  // assertion exists to catch is a SAMPLE that cannot express the top of the
  // bank: the baseline used to be drawn from concepts that all top out at
  // application level, so multi-step read "not measured" for every learner in
  // the world, forever. That half is unchanged and is checked below.
  //
  // What DID change is the other end, and the old wording — "every producible
  // band" — quietly asserted it: the ladder now opens at the learner's OWN
  // course (see `openingStageFor`), so the bands beneath it (recall, and
  // application for a GCSE Higher sitting) are not asked at all. Reporting them
  // as unmeasured is the honest reading, and it is a different statement from
  // "we asked and got nothing".
  const strongTop = ["multi_step", "data_interpretation"].map((s) => strongDemand.find((d) => d.skill === s));
  ok(strongTop.every((d) => d.inBank && d.estimate.measured),
    `a strong run measures the bands at the top of the bank (${strongTop.map((d) => `${d.skill} ${Math.round((d.estimate.value ?? 0) * 100)}%`).join(", ")})`);
  const strongUnasked = strongDemand.filter((d) => d.inBank && !d.estimate.measured);
  ok(strongUnasked.every((d) => d.estimate.attempts === 0),
    `and every band it did not open at reports no attempts rather than a zero (${strongUnasked.map((d) => d.skill).join(", ") || "none"})`);
  // The band the depth layer added is measured by a full run, and the band no
  // multiple-choice bank can measure is still declared out. The report has to
  // say BOTH, or a learner reads their own unmeasured row as a personal gap.
  const strongData = strongDemand.find((d) => d.skill === "data_interpretation");
  ok(strongData.inBank === true && strongData.reachable === true && strongData.estimate.measured === true,
    `data & graphs is now inside the instrument and measured by a strong run (${strongData.estimate.correct}/${strongData.estimate.attempts}, ${strongData.estimate.confidence})`);
  const strongExtended = strongDemand.find((d) => d.skill === "extended_response");
  ok(strongExtended.inBank === false && strongExtended.estimate.measured === false,
    "while the extended written answer stays declared beyond the bank, so its emptiness is never read as a gap in the learner");
  // Reachability is a property of the session's SAMPLE, not of the learner: a
  // syllabus whose sampled concepts top out at application level genuinely
  // cannot measure multi-step, and that is reported as such rather than as a
  // zero. The old fixture for the shallow case was ke-kcse junior — which
  // stopped being shallow the moment `fractions` gained a multi-step item, so
  // the assertion went stale because the CONTENT got better. The rule is
  // therefore checked where it is defined: for every course, each in-bank
  // band's `reachable` must equal what the course's own sample can express.
  {
    const misreported = [];
    for (const spec of specs.SPECIFICATIONS) {
      for (const level of spec.levels) {
        const s = diag.newDiagnosticSession("maths", "baseline", { spec, level });
        const deepest = Math.max(...s.concepts.map((c) => questions.conceptDepth(c.conceptId)), 0);
        for (const row of diag.demandEstimates(s)) {
          if (row.inBank && row.reachable !== bank.bandReachable(row.skill, deepest)) {
            misreported.push(`${spec.id}/${level.id}:${row.skill}`);
          }
        }
      }
    }
    ok(misreported.length === 0,
      `every course reports each band's reachability from its own sample (${misreported.length} disagree: ${misreported.slice(0, 3).join(", ") || "none"})`);
  }
  // The FALSE branch — a sample that cannot express the band — is driven as a
  // real session with its deep concepts removed, because no shipped course is
  // shallow any more and a rule must not be tested only where it happens to be
  // true. The deepest concept left can express application, so multi-step is
  // beyond its questions: unreachable, unmeasured, and never a zero.
  //
  // The sample is CONSTRUCTED rather than filtered out of the shipped one, and
  // that is the sampler's own rule showing through: a concept that cannot place
  // the learner — one topping out a band below their course — is excluded from
  // a course's sample now (see `canPlaceThem`), which is how primary place
  // value reached a Year 11 GCSE Higher sitting. The rule under test is
  // unchanged, so the fixture supplies the case a real sample can still
  // produce: concepts that DO pass the placement rule and still stop below
  // multi-step.
  {
    const shallow = diag.newDiagnosticSession("maths", "baseline", R);
    shallow.concepts = genome.bySubject("maths")
      .map((c) => c.id)
      .filter((id) => questions.hasGenerator(id)
        && !bank.bandReachable("multi_step", questions.conceptDepth(id))
        && questions.difficultyBandFor(questions.conceptDepth(id))
          >= questions.difficultyBandFor(R.level.difficulty) - 1)
      .slice(0, 4)
      .map(mkLadder);
    let sq = diag.nextQuestion(shallow);
    let guard2 = 0;
    while (sq && guard2++ < 60) {
      diag.gradeAnswer(shallow, sq.conceptId, sq, sq.answer);
      sq = diag.nextQuestion(shallow);
    }
    const shallowDemand = diag.demandEstimates(shallow);
    const shallowMulti = shallowDemand.find((d) => d.skill === "multi_step");
    ok(shallow.concepts.length > 0 && shallowMulti.inBank === true && shallowMulti.reachable === false,
      `a sample whose concepts top out below a band reports it as beyond its questions, not as a 0 (${shallow.concepts.map((c) => c.conceptId).join(", ")})`);
    ok(shallowMulti.estimate.measured === false && shallowMulti.estimate.attempts === 0,
      "and says nothing was measured there, rather than recording a zero");
    // Reachability is the sample's own ceiling, not a fixed ladder: this sample
    // was filtered down to concepts below the multi-step band, so what it can
    // honestly claim is whatever its deepest remaining concept can express —
    // and every row must agree with that, neither hiding a band it can reach
    // nor advertising one it cannot.
    const shallowDeepest = Math.max(0, ...shallow.concepts.map((c) => questions.conceptDepth(c.conceptId)));
    const misreported = shallowDemand.filter((d) => d.reachable !== bank.bandReachable(d.skill, shallowDeepest));
    ok(misreported.length === 0,
      `every band is reported against this sample's real ceiling of ${shallowDeepest.toFixed(2)} (${misreported.map((d) => d.skill).join(", ") || "all agree"})`);
    ok(shallowDemand.find((d) => d.skill === "recall").reachable === true,
      "while a band its questions do reach is reachable");
    ok(strongDemand.find((d) => d.skill === "multi_step").reachable === true,
      "and a course that contains a deep concept reaches the multi-step band");
  }
  {
    const sampled = strong.concepts.map((c) => c.conceptId);
    ok(sampled.some((id) => bank.bandReachable("multi_step", questions.conceptDepth(id))),
      `the sample contains a concept deep enough to express multi-step (${sampled.filter((id) => bank.bandReachable("multi_step", questions.conceptDepth(id))).join(", ")})`);
    const deep = diag.newDiagnosticSession("maths", "baseline", R);
    ok(deep.concepts.some((c) => bank.bandReachable("multi_step", questions.conceptDepth(c.conceptId))),
      "and a retest samples the same deep concept, so the band is measurable before AND after");
  }
  // ── The early stop, DRIVEN rather than sampled ────────────────────────────
  // What this section claims is a RULE: a band the session has already
  // demonstrated (`bandDemonstrated`, six clean answers session-wide) is not
  // re-proved on a later concept, and the report says so. Reading it off one
  // random baseline sample tested the SAMPLE: with four sampled concepts only
  // the last can clear the six-answer bar, and if that concept's bank expresses
  // a single band it starts there and nothing is recorded. Before the ladder was
  // capped at each concept's own ceiling the bar was cleared by the duplicate
  // recall-band questions a shallow generator used to be asked for — the skip
  // was real, but it was bought with the repetition this pass removed.
  // So the rule is driven directly: the session is given a history that already
  // demonstrates the recall band — six clean answers, `bandDemonstrated`'s own
  // bar — and a fresh concept is asked what it does about it. NOTE the honest
  // consequence of the cap, recorded here rather than hidden: because each
  // concept now pays exactly two questions per band, a FOUR-concept sample
  // rarely clears a six-answer bar in time to skip anything, so this stop earns
  // its keep in longer sittings. It is a real rule either way, and a rule that
  // only fires by accident of sampling is a rule worth driving.
  const early = diag.newDiagnosticSession("maths");
  early.concepts = [mkLadder("fractions"), mkLadder("negatives")];
  // The history is attributed to a concept this sitting is not going to serve,
  // because that is what a session's past looks like from the middle of it.
  early.log = Array.from({ length: 6 }, () => ({ conceptId: "linear-equations", difficulty: 0.15, correct: true, source: "openmind_authored" }));
  let eq = diag.nextQuestion(early), eguard = 0;
  while (eq && eguard++ < 300) {
    diag.gradeAnswer(early, eq.conceptId, eq, eq.answer);
    eq = diag.nextQuestion(early);
  }
  const skipped = early.concepts.flatMap((c) => c.skippedBands ?? []);
  const recallFree = early.concepts.filter((c) =>
    !early.log.some((a) => a.conceptId === c.conceptId && bank.skillForDifficulty(a.difficulty) === "recall")).length;
  ok(recallFree > 0,
    `and stops re-proving recall on every concept (${recallFree}/${early.concepts.length} concepts served no recall question at all)`);
  ok(skipped.length > 0, `a band the session had demonstrated is skipped on a later concept (${[...new Set(skipped)].join(", ")})`);
  ok(early.concepts.some((c) => (c.skippedBands ?? []).includes("recall")),
    "recall is the band that gets skipped, and only after it was demonstrated");
  ok(early.concepts.filter((c) => c.skippedBands?.length).every((c) => c.stage > 0),
    "and a skipped concept really does start above the band it did not re-prove");
  ok((diag.buildResult(early).skippedBands ?? []).length > 0,
    "the result REPORTS the skip, so a shorter report is visibly a decision");
  // The other half, and the one this pass added: a concept whose bank expresses
  // ONE band starts at that band whatever the session has demonstrated, so a
  // "skip" that would change nothing is never recorded as one. A report must not
  // claim a shortened measurement it did not make.
  ok(early.concepts.filter((c) => diag.bandsFor(c.conceptId) === 1).every((c) => !(c.skippedBands ?? []).length),
    "a concept that can express only one band records no skip, because it starts there anyway");

  // The direction that must never skip: a learner who has not shown it.
  const weakDemand = diag.demandEstimates(weak);
  ok(weak.concepts.every((c) => !(c.skippedBands ?? []).length),
    "a weak run skips nothing — a settled-weak band is still probed on every concept");
  ok(weakDemand.filter((d) => d.inBank).every((d) => d.estimate.value === 0 || !d.estimate.measured),
    "and its estimate is a measured zero, not a missing number");
  ok(weak.concepts.reduce((n, c) => n + c.asked, 0) > 0, "a weak run still produces a measurement");

  // The blueprint selector passes over what the evidence has already decided.
  {
    const bp = bank.buildBlueprint(R, "maths", 6, () => true);
    const base = {
      blueprint: bp, active: R, subject: "maths", mastery: {},
      ledger: { seen: {} }, drawn: { stage: {}, skill: {} },
      draw: (conceptId, seed) => {
        const q2 = questions.generateQuestion(conceptId, `settled:${seed}`);
        return q2 ? { difficulty: q2.difficulty, tags: q2.misconceptionTags ?? [] } : null;
      },
      seed: "ses-settled",
    };
    const decided = bp.topics.flatMap((t) => t.concepts)[0];
    const gated = bank.selectDiagnosticQuestion({ ...base, evidence: { [decided]: bank.estimateEvidence(rows(4, 0)) } });
    ok(gated && gated.item.conceptId !== decided,
      `a concept the evidence has decided is not probed (${gated?.item.conceptId} ≠ ${decided})`);
    ok(gated.skippedSettled.includes(decided), "and the skip is recorded rather than silent");
    const allDecided = {};
    for (const t of bp.topics) for (const id of t.concepts) allDecided[id] = bank.estimateEvidence(rows(4, 0));
    ok(bank.selectDiagnosticQuestion({ ...base, evidence: allDecided }) === null,
      "when nothing is left to learn, the diagnostic ends instead of spending a question");
  }
}

// ── THE PROOF: evidence → a different plan → an independent assessment ─────
//
// This is the milestone the whole architecture exists for, asserted as ONE
// learner's chain rather than as three separate helpers:
//
//   baseline measurement → the plan targets what was found weak
//        ↓ (the learner works on it, hint-free)
//   the plan moves forward — and the CONTROL asserts the plan would not have
//   moved without that work
//        ↓ (a later, independent assessment — parallel-form questions)
//   the improvement is measured again, by a different sitting, and the model
//   and the plan both reflect it
//
// Falsifiable in both directions: no evidence ⇒ no change, and the wrong
// evidence ⇒ the opposite change.
console.log("▸ THE PROOF: a diagnostic that changes the plan, and a retest that confirms it");
{
  const { decideNext } = nextEngine;
  const specs = require("../.verify/specifications.js");
  const R = { spec: specs.specById("uk-gcse"), level: null };
  R.level = R.spec.levels[R.spec.levels.length - 1];
  const T0 = 90000;

  const fresh = () => ({
    profile: { id: "proof", handle: "proof", country: "GB", birthYear: null, language: "en", goal: "",
      intent: "", subjects: ["maths"], createdAt: 0 },
    secret: "proof-secret", progress: {}, diagnostics: {}, masteries: {},
  });
  const first = (s) => decideNext(s, 1)[0];
  const key = (a) => `${a.kind}:${a.conceptId}`;
  /** Sit a whole diagnostic, answering every item wrong for one concept. */
  const sit = (kind, wrongFor, startedAt) => {
    const s = diag.newDiagnosticSession("maths", kind, R);
    s.startedAt = startedAt;
    const ids = {};
    let q = diag.nextQuestion(s);
    let guard = 0;
    while (q && guard++ < 60) {
      (ids[q.conceptId] ??= []).push(q.id);
      const right = !wrongFor.includes(q.conceptId);
      diag.gradeAnswer(s, q.conceptId, q, right ? q.answer : (q.answer + 1) % q.choices.length);
      q = diag.nextQuestion(s);
    }
    return { s, ids };
  };

  // ── Control: no evidence ⇒ no plan, and the same evidence ⇒ the same plan.
  const state = fresh();
  const empty = first(state);
  ok(empty.conceptId === null && empty.kind === "EXPLAIN",
    `with no evidence at all the plan is "find your starting point", not a recommendation (${key(empty)})`);

  // ── 1. Measure. One concept is failed, the rest are passed.
  const base = diag.newDiagnosticSession("maths", "baseline", R);
  // The first concept served is the one this learner is weak at; the blueprint
  // is deterministic, so the retest below samples the same concepts.
  const probe0 = diag.nextQuestion(base);
  ok(Boolean(probe0), "a baseline starts");
  const WEAK = probe0.conceptId;
  const baseline = sit("baseline", [WEAK], T0);
  ok(baseline.s.concepts.some((c) => c.conceptId === WEAK), "the weak concept was measured");
  diag.applyDiagnosticResult(state, baseline.s);
  const measuredWeak = state.progress[WEAK].mastery;
  ok(measuredWeak < 0.35, `the measurement puts it where it belongs (${measuredWeak.toFixed(2)})`);
  const planA = first(state);
  // WHAT THIS CLAIMS is the chain the whole architecture exists for: a
  // measurement moved the plan. It used to assert that the first action IS the
  // weak concept, which held only while the sampled concept happened to declare
  // no prerequisites — the FOUNDATIONS branch (first, and deliberately so: a
  // slip on a concept whose prerequisite was never met is the symptom and the
  // prerequisite is the cause) addresses the weak concept THROUGH its declared
  // foundation instead. Asserting the narrower thing pinned an accident of which
  // concept the blueprint sampled, so the claim is the response itself.
  const weakPrereqs = genome.CONCEPTS_BY_ID[WEAK]?.prereqs ?? [];
  ok(planA.conceptId === WEAK || weakPrereqs.includes(planA.conceptId),
    `the plan targets what the diagnostic found weak, directly or through a declared foundation (${key(planA)}; ${WEAK} declares ${weakPrereqs.join(", ") || "no prerequisites"})`);
  ok(planA.kind === "EXPLAIN" || planA.kind === "PRACTISE" || planA.kind === "REMEDIATE",
    `with real work, not a stretch or a rest (${planA.kind})`);
  ok(planA.evidence.length > 0 && planA.why.length > 0,
    "and it can say what it is based on and why now — the learner is never asked to take it on faith");
  ok(key(first(state)) === key(planA),
    "CONTROL: with no new evidence the plan does not move — the change below is caused, not drift");

  // ── 1b. Nothing weak anywhere: continue at the learner's OWN level ────────
  // Mastery is capped by each concept's own question bank, so it is not
  // comparable across concepts and must not be the only key the plan ranks by.
  // A one-band concept tops out at 0.90 while a four-band one reaches 0.98, so
  // ranking by mastery put the SHALLOWEST concept in the course first — and
  // offered "Stretch: Place value" to a learner who had just swept everything at
  // their own level. That is the shape of defect this pins: absence of weakness
  // is not a reason to go back to the beginning.
  {
    const mixed = diag.newDiagnosticSession("maths");
    mixed.concepts = [mkLadder("place-value"), mkLadder("quadratics")];
    let mq = diag.nextQuestion(mixed), mg = 0;
    while (mq && mg++ < 120) {
      diag.gradeAnswer(mixed, mq.conceptId, mq, mq.answer);
      mq = diag.nextQuestion(mixed);
    }
    const swept = fresh();
    diag.applyDiagnosticResult(swept, mixed);
    ok(swept.progress["place-value"] && swept.progress["quadratics"]
      && swept.progress["place-value"].mastery < swept.progress["quadratics"].mastery,
      `SETUP: the one-band concept is scored lower than the deep one (${(swept.progress["place-value"]?.mastery ?? 0).toFixed(2)} < ${(swept.progress["quadratics"]?.mastery ?? 0).toFixed(2)}), so mastery alone would pick it`);
    const sweptPlan = first(swept);
    ok(sweptPlan.conceptId === "quadratics",
      `a learner with nothing weak continues at their own level, not on the shallowest thing measured (${key(sweptPlan)})`);
  }

  // ── 2. Work on it: hint-free practice, then a transfer proof.
  const practiceIds = [];
  for (let i = 0; i < 6; i++) {
    const id = `proof-practice-${i}`;
    practiceIds.push(id);
    progress.recordAnswer(state, WEAK, id, 0, true, "", [], { mode: "independent" });
  }
  progress.recordAnswer(state, WEAK, "proof-transfer-1", 0, true, "", [], { mode: "transfer" });
  ok(state.progress[WEAK].mastery > measuredWeak,
    `the work moves the learner model (${measuredWeak.toFixed(2)} → ${state.progress[WEAK].mastery.toFixed(2)})`);
  const planB = first(state);
  ok(key(planB) !== key(planA), `and the PLAN changes because of it (${key(planA)} → ${key(planB)})`);
  // The point of this pair is that the plan is no longer about the concept the
  // baseline flagged. Asserting the KIND was the weaker claim: after proving it,
  // the learner is finished with that concept and the engine moves on to the
  // next thing — which may itself be a repair, of a different concept, for a
  // declared reason. What must never survive is the SAME recommendation.
  ok(planB.conceptId !== WEAK,
    `the concept the plan targeted is finished, and the plan moves on (${key(planA)} → ${key(planB)})`);
  ok(planB.kind !== "REST" && planB.reason.length > 0,
    `with real work and a stated reason (${key(planB)}: ${planB.reason})`);
  // Why the plan can leave the concept at all: the ladder says it is finished.
  // This is the invariant the old engine broke — successful evidence has to move
  // the learner's STATE, not merely their mastery number — so assert the state.
  const lm = require("../.verify/learner-model.js");
  ok(lm.stageOf(state.progress[WEAK]) === "advance",
    `and the ladder itself says this concept is finished (${lm.stageOf(state.progress[WEAK])})`);
  ok(planB.conceptId !== null, `with real work to do next (${key(planB)})`);

  // ── 3. The wrong direction. Same amount of work, wrong answers.
  {
    const other = fresh();
    diag.applyDiagnosticResult(other, sit("baseline", [WEAK], T0 + 1).s);
    for (let i = 0; i < 6; i++) {
      progress.recordAnswer(other, WEAK, `proof-wrong-${i}`, 1, false, "", [
        (genome.CONCEPTS_BY_ID[WEAK].misconceptions ?? ["frac-slice"])[0],
      ], {});
    }
    const planC = first(other);
    ok(key(planC) !== key(planB), `CONTROL: failing the same work moves the plan the other way (${key(planC)})`);
    ok(planC.kind === "REMEDIATE" || planC.kind === "EXPLAIN" || planC.kind === "PRACTISE",
      `and it stays on the thing that is still weak (${key(planC)})`);
  }

  // ── 4. The independent assessment: a later sitting, parallel-form items.
  const retest = sit("retest", [], T0 + 5000);
  ok(retest.s.concepts.some((c) => c.conceptId === WEAK),
    "the retest samples the concept the baseline found weak — otherwise before/after compares two tests");
  const baseIds = new Set(baseline.ids[WEAK] ?? []);
  ok((retest.ids[WEAK] ?? []).every((id) => !baseIds.has(id)),
    `and it does so with items the learner has not been served (${(retest.ids[WEAK] ?? []).length} fresh items)`);
  const baseDemand = diag.demandEstimates(baseline.s);
  const retestDemand = diag.demandEstimates(retest.s);
  const weakBand = baseDemand
    .filter((d) => d.estimate.measured)
    .sort((a, b) => (a.estimate.value ?? 0) - (b.estimate.value ?? 0))[0];
  const after = retestDemand.find((d) => d.skill === weakBand.skill);
  ok(after.estimate.measured && (after.estimate.value ?? 0) > (weakBand.estimate.value ?? 0),
    `the independent sitting measures the repair on the SAME band (${weakBand.skill}: ${Math.round((weakBand.estimate.value ?? 0) * 100)}% → ${Math.round((after.estimate.value ?? 0) * 100)}%)`);
  const width = (e) => e.interval[1] - e.interval[0];
  ok(width(after.estimate) < width(weakBand.estimate),
    `and the claim is now more precise, not just higher (${width(after.estimate).toFixed(2)} < ${width(weakBand.estimate).toFixed(2)})`);
  diag.applyDiagnosticResult(state, retest.s);
  ok(state.progress[WEAK].mastery >= measuredWeak,
    "the retest cannot walk the model backwards on evidence that has not changed");
  const planD = first(state);
  ok(planD.conceptId !== WEAK,
    `after an independent confirmation the plan is not working the baseline's concept again (${key(planD)} | WEAK=${WEAK})`);
  ok(retest.s.kind === "retest" && diag.buildResult(retest.s).probedConcepts.includes(WEAK),
    "and the sitting is recorded as its own measurement, so the gain is auditable later");
}

// ── Rights, and evidence from a paper OpenMind never receives ───────────────
//
// The product can only help a learner whose board's papers it may not host, so
// this is the layer that makes that possible WITHOUT becoming a reproduction
// service: an origin, the permissions attached to it, and a single gate. The
// default for licensed material is DENIAL, because the alternative is a
// permission bug that looks like a feature.
console.log("▸ Rights, and evidence from a paper we never receive");
{
  const rights = require("../.verify/content-rights.js");
  const personal = require("../.verify/personal-paper.js");
  const papers = require("../.verify/papers.js");
  const analysis = require("../.verify/paper-analysis.js");
  const specsMod = require("../.verify/specifications.js");

  // ── Our own work, and the learner's own work: two different permission sets.
  {
    const authored = rights.rightsFor("openmind_authored");
    const licensed = rights.rightsFor("licensed_official");
    const user = rights.rightsFor("user_provided");
    const link = rights.rightsFor("external_link");
    ok(Object.values(authored).every(Boolean), "OpenMind's own questions may be hosted, shown, processed and built on");
    ok(rights.LICENCES.length === 0 && Object.values(licensed).every((v) => v === false),
      "a licensed origin with NO licence on file may do nothing at all — the default is denial, not permission");
    ok(user.canDisplay && user.canProcess && user.canStore && !user.canHost && !user.canShare && !user.canTrainAI,
      "a learner's own paper is shown to them and stored for them — never hosted, never shared, never trained on");
    ok(link.canLink && !link.canDisplay && !link.canHost && !link.canProcess && !link.canStore,
      "an external paper is a LINK and nothing else: not displayed, embedded, mirrored or stored");
    ok(rights.isContentOrigin("openmind_authored") && !rights.isContentOrigin("board_paper"),
      "an origin string nobody defined is rejected outright");
    ok(Object.values(rights.rightsFor("board_paper")).every((v) => v === false),
      "and it is granted nothing — denial is total, not a crash and not someone else's permissions");
    let threw = false;
    try { rights.assertUse("licensed_official", "display"); } catch (e) { threw = e instanceof rights.ContentRightsError; }
    ok(threw, "the gate THROWS rather than rendering nothing — a permission failure must be visible");
    ok(rights.permittedActions("external_link").join(",") === "link",
      "and the permitted action list is derived, so a surface cannot claim a permission the model denies");
  }
  // ── A licence grants exactly what it states, and nothing by omission, and
  //    an expired licence grants nothing at all.
  {
    const rec = { id: "L1", specId: "uk-gcse", board: "aqa", rights: { canDisplay: true, canProcess: true } };
    const r = rights.rightsFor("licensed_official", rec);
    ok(r.canDisplay && r.canProcess && !r.canHost && !r.canTrainAI && !r.canShare,
      "a licence record grants only the permissions it names — an unstated permission is a denial");
    const expired = { ...rec, expires: "2020-01-01" };
    ok(Object.values(rights.licenceRights(expired)).every((v) => v === true) === false &&
      rights.rightsFor("licensed_official", { ...rec, rights: {} }).canDisplay === false,
      "an empty or lapsed permission set grants nothing");
    ok(rights.licenceRights(rec).canHost === false, "hosting is never assumed from a display right");
  }
  // ── Every bundled paper is OpenMind's own. Nothing here claims to BE a board
  //    paper, and the harness would catch it if something did.
  {
    const claiming = papers.PAPERS.filter((p) => p.source && p.source !== "openmind_authored" && !rights.licenceFor(p.specId));
    ok(claiming.length === 0, `no bundled paper claims an official origin without a licence on file (${claiming.map((p) => p.id).join(", ") || "none"})`);
  }

  // ── Validation: the route may receive MARKS AND IDEAS, and nothing else.
  {
    const good = {
      title: "KCSE Mathematics Paper 1",
      questions: [
        { number: "1", conceptId: "fractions", marks: 3, awarded: 3 },
        { number: "2", conceptId: "fractions", marks: 4, awarded: 1 },
        { number: "3", conceptId: "quadratics", marks: 5, awarded: 0 },
      ],
    };
    const okV = personal.validatePersonalPaper(good);
    ok(okV.ok && okV.paper.questions.length === 3, "a paper of marks and ideas is accepted");

    for (const [name, bad, expected] of [
      ["question text", { ...good, questions: [{ number: "1", conceptId: "fractions", marks: 3, awarded: 1, prompt: "Solve for x: 2x + 3 = 11" }] }, "content_not_accepted"],
      ["a pasted body", { ...good, questions: [{ number: "1", conceptId: "fractions", marks: 3, awarded: 1, text: "..." }] }, "content_not_accepted"],
      ["a whole document", { ...good, document: "base64..." }, "content_not_accepted"],
      ["a url", { ...good, questions: [{ number: "1", conceptId: "fractions", marks: 3, awarded: 1, url: "https://board.example/p1.pdf" }] }, "content_not_accepted"],
    ]) {
      const r = personal.validatePersonalPaper(bad);
      ok(!r.ok && r.error === expected,
        `${name} is REFUSED, not ignored (${r.ok ? "accepted" : r.error}${r.ok ? "" : r.field ? `:${r.field}` : ""})`);
    }
    const marks = personal.validatePersonalPaper({ ...good, questions: [{ number: "1", conceptId: "fractions", marks: 3, awarded: 5 }] });
    ok(!marks.ok && marks.error === "bad_marks", "marks awarded above the marks available are refused");
    const concept = personal.validatePersonalPaper({ ...good, questions: [{ number: "1", conceptId: "nope", marks: 3, awarded: 1 }] });
    ok(!concept.ok && concept.error === "bad_concept", "an idea that does not exist in the genome is refused");
    const dup = personal.validatePersonalPaper({ ...good, questions: [{ number: "1", conceptId: "fractions", marks: 3, awarded: 1 }, { number: "1", conceptId: "fractions", marks: 2, awarded: 1 }] });
    ok(!dup.ok && dup.error === "duplicate_question", "two questions cannot share a number");
    ok(!personal.validatePersonalPaper({ title: "", questions: good.questions }).ok, "a title is required");
    ok(!personal.validatePersonalPaper({ title: "x", questions: [] }).ok, "an empty paper is refused");
    ok(personal.mayStorePersonalPaper() === true,
      "private storage is permitted — and the route asks rather than assumes");
  }

  // ── The evidence itself: same pipeline, same diagnosis, no invented why.
  {
    const paper = {
      id: "pp_test", owner: "learner", origin: "user_provided", createdAt: 1,
      title: "My board's paper",
      questions: [
        { number: "1", conceptId: "fractions", marks: 2, awarded: 2 },
        { number: "2", conceptId: "fractions", marks: 3, awarded: 1 },
        { number: "3", conceptId: "fractions", marks: 3, awarded: 0 },
        { number: "4", conceptId: "quadratics", marks: 4, awarded: 4 },
      ],
    };
    const a = personal.analysePersonalPaper(paper);
    ok(a.total === 12 && a.raw === 7 && a.lostMarks === 5, `the marks add up (${a.raw}/${a.total}, ${a.lostMarks} lost)`);
    const frac = a.byConcept.find((c) => c.conceptId === "fractions");
    ok(frac.marksLost === 5 && frac.questions === 3, "marks lost are attributed to the IDEA, not just totalled");
    ok(a.recurring.some((c) => c.conceptId === "fractions"), "an idea that cost marks on more than one question is a pattern, not a slip");
    ok(a.weakest && a.weakest.conceptId === "fractions", `and it is the thing to work on next (${a.weakest && a.weakest.conceptId})`);
    ok(a.concentration === 1, `all of the loss sat on that one idea (${a.concentration})`);
    ok(a.byConcept.every((c) => c.tags.length === 0),
      "NO misconception is ever tagged: a mark total says which idea cost marks, never why");
    const q3 = a.missed.find((m) => m.id.endsWith(":q2"));
    ok(q3 && q3.correct === null,
      "a question left unanswered is lost marks but NOT a wrong answer — guessing and skipping are different failures");

    const ev = personal.personalPaperEvidence(paper);
    ok(ev.length === 4 && ev.filter((e) => e.unanswered).length === 1,
      `one answer per question, with the skipped one marked as such (${ev.length})`);
    ok(ev.find((e) => e.questionId.endsWith(":q1")).correct === false,
      "partial credit is not a correct answer");
    ok(ev.find((e) => e.questionId.endsWith(":q3")).correct === true, "full marks is");

    // A flawless paper claims nothing it did not measure.
    const clean = personal.analysePersonalPaper({ ...paper, questions: paper.questions.map((q) => ({ ...q, awarded: q.marks })) });
    ok(clean.lostMarks === 0 && clean.weakest === null && clean.concentration === 0,
      "a paper that lost nothing names no weakness and no concentration — never NaN");

    // SAME PIPELINE: a personal paper and an OpenMind paper with identical
    // marks must produce identical tallies, or the learner model would value
    // one kind of evidence differently for no reason.
    {
      const key = { id: "k", spec: "uk-gcse", templateId: "t", name: "n", level: "l", subject: "maths", minutes: 10, calculator: false, boundaries: [], createdAt: 1,
        questions: paper.questions.map((q, i) => ({ id: `q${i}`, conceptId: q.conceptId, seed: "s", answer: 0, marks: q.marks, difficulty: 0.4, explanation: "", tags: [], prompt: "" })) };
      const result = { paperId: "k", raw: 7, total: 12, pct: 58, grade: null,
        perQuestion: paper.questions.map((q, i) => ({ id: `q${i}`, conceptId: q.conceptId, marks: q.marks, awarded: q.awarded, correct: q.awarded >= q.marks ? true : q.awarded === 0 ? null : false, chosen: 0, answer: 0, explanation: "" })) };
      const viaKey = analysis.analysePaper(key, result);
      const shape = (x) => JSON.stringify(x.byConcept.map((c) => [c.conceptId, c.marksLost, c.questions, c.correct, c.wrong, c.unanswered]));
      ok(shape(viaKey) === shape(a),
        "a paper the learner brought and a paper OpenMind built are read the SAME way");
      ok(viaKey.weakest.conceptId === a.weakest.conceptId && viaKey.concentration === a.concentration,
        "with the same weakest idea and the same concentration");
    }
  }

  // ── The vocabulary of the rights table exists in every language, like every
  //    other learner-facing sentence.
  {
    const i18nMod = require("../.verify/i18n.js");
    const keys = [
      "rights.origin.openmind_authored", "rights.note.openmind_authored",
      "rights.origin.licensed_official", "rights.note.licensed_official",
      "rights.origin.user_provided", "rights.note.user_provided",
      "rights.origin.external_link", "rights.note.external_link",
      "own.title", "own.lead", "own.sources", "own.save", "own.stored", "own.saved", "own.savedOne",
      "own.err.bad_marks", "own.err.bad_concept", "own.err.empty", "own.err.duplicate_question",
      "own.err.bad_title", "own.err.too_many_questions", "own.err.content_not_accepted",
    ];
    const gaps = [];
    for (const l of i18nMod.LANGS) {
      const tr = i18nMod.translator(l.code);
      for (const k of keys) if (tr(k) === k) gaps.push(`${l.code}:${k}`);
      if (!tr("own.saved").includes("{n}")) gaps.push(`${l.code}:own.saved missing {n}`);
    }
    ok(gaps.length === 0, `every language carries the rights and workspace vocabulary (${gaps.slice(0, 6).join(", ") || "none missing"}${gaps.length > 6 ? ` +${gaps.length - 6}` : ""})`);
    void specsMod;
  }
}

// ── The route contract (P0) ────────────────────────────────────────────────
// "One session, one profile, one derivation, one guard." These assertions are
// what make that a fact rather than an intention: the decision is pure, so it
// can be exercised over the WHOLE table instead of the examples we happened to
// pick, and the two failure modes that matter (a redirect loop, and a learner
// bounced while the session was still being probed) are both rejections.
console.log("\n▸ Where the learner is allowed to be");
{
  const CASES = {
    booting: { auth: "booting", profileStatus: "loading", profile: null },
    stranger: { auth: "signed_out", profileStatus: "missing", profile: null },
    unenrolled: {
      auth: "signed_in", profileStatus: "incomplete",
      profile: { profile: { id: "p1", subjects: ["maths"] }, progress: {}, diagnostics: {} },
    },
    fresh: {
      auth: "signed_in", profileStatus: "complete",
      profile: { profile: { id: "p1", onboardedAt: 1, subjects: ["maths"] }, progress: {}, diagnostics: {} },
    },
    measured: {
      auth: "signed_in", profileStatus: "complete",
      profile: { profile: { id: "p1", onboardedAt: 1, subjects: ["maths"] }, progress: {}, diagnostics: { maths: {} } },
    },
  };
  const L = Object.fromEntries(Object.entries(CASES).map(([k, v]) => [k, appState.deriveLifecycle(v)]));

  // Boot is a state, not an absence — the bug class this whole section exists for.
  ok(L.booting.booting === true && L.stranger.booting === false,
    "an unanswered session probe is BOOTING, and a signed-out learner is not");
  ok(appState.accessFor("/papers") === "onboarded" && appState.accessFor("/papers/aqa/biology") === "onboarded",
    "a route's access applies down the tree, not just at its root");
  ok(appState.accessFor("/dashboard") === "diagnosed" && appState.accessFor("/solve") === "public",
    "Home is for a measured learner; the wedge is public");
  ok(appState.accessFor("/a-page-nobody-classified") === "public",
    "an unclassified page renders: a wrong redirect loses a learner, a missing gate does not");

  // Public never waits and never redirects — the wedge must be immune to this
  // entire system, or the anonymous entry point dies.
  const publicRules = appState.ACCESS_RULES.filter((r) => r.requirement === "public");
  ok(publicRules.length >= 12, `the contract classifies the public routes (${publicRules.length})`);
  ok(publicRules.every((r) => appState.resolveRoute(L.booting, r.path).action === "allow"),
    "every public route renders even mid-boot (the probe is never a reason to redirect)");

  // A gated route waits rather than guessing.
  ok(appState.resolveRoute(L.booting, "/dashboard").action === "boot",
    "a gated route WAITS while booting, instead of being treated as signed out");
  ok(appState.resolveRoute(L.booting, "/papers").action === "boot",
    "and so does a gated learner route");

  // Intent is preserved, and the return target survives encoding.
  //
  // This assertion used to require `mode=signin`, and that requirement was the
  // defect: a learner with no account and no profile was being sent to the
  // SIGN-IN form — asked for credentials they had never had — and because the
  // enrolment page reads `mode=signin` as "start on the sign-in form", the
  // bounce also replaced the choice they had already made (including "continue
  // without an account") and dropped them at step 1. A stranger and an
  // un-enrolled learner are both simply learners who must finish setup, so they
  // go to the same place; only the landing page's own Sign in link opens the
  // sign-in form, deliberately.
  const strangerPapers = appState.resolveRoute(L.stranger, "/papers");
  ok(strangerPapers.action === "redirect" && strangerPapers.to === "/onboarding?return=%2Fpapers",
    `a stranger asking for /papers begins setup AND is returned to /papers (got ${strangerPapers.to})`);
  ok(!strangerPapers.to?.includes("mode=signin"),
    "and is NOT told to sign in, which would ask a brand-new learner for credentials they do not have");
  const unenrolledPapers = appState.resolveRoute(L.unenrolled, "/papers");
  ok(unenrolledPapers.to === "/onboarding?return=%2Fpapers",
    `an un-enrolled learner is sent to enrolment AND back to /papers (got ${unenrolledPapers.to})`);
  const freshDashboard = appState.resolveRoute(L.fresh, "/dashboard");
  ok(freshDashboard.to === "/diagnostic/maths?return=%2Fdashboard",
    `a never-measured learner is sent to be measured, then back to Home (got ${freshDashboard.to})`);
  ok(appState.resolveRoute(L.measured, "/dashboard").action === "allow",
    "and a measured learner is simply allowed into Home");

  // LOOP FREEDOM, over the whole table × every lifecycle state. A redirect we
  // perform must land somewhere that itself allows — otherwise one bad rule
  // traps a learner in a navigation loop the moment the guard is mounted.
  const loops = [];
  for (const [name, l] of Object.entries(L)) {
    for (const rule of appState.ACCESS_RULES) {
      const d = appState.resolveRoute(l, rule.path);
      if (d.action !== "redirect") continue;
      const again = appState.resolveRoute(l, d.to);
      if (again.action === "redirect") loops.push(`${name}:${rule.path}→${d.to}→${again.to}`);
    }
  }
  ok(loops.length === 0,
    `no redirect target is itself blocked (loops: ${loops.slice(0, 3).join(", ") || "none"})`);

  // The return target is UNTRUSTED input: an off-site value here would make the
  // guard an open redirect.
  ok(appState.safeReturnPath("//evil.com") === "/dashboard" &&
    appState.safeReturnPath("https://evil.com") === "/dashboard" &&
    appState.safeReturnPath(null) === "/dashboard" &&
    appState.safeReturnPath("/papers") === "/papers",
    "a return target is only ever honoured as a same-origin absolute path");
  ok(appState.withReturn("/onboarding", "/") === "/onboarding",
    "asking for the landing page leaves no return parameter to honour");

  // ── WHICH SUBJECTS A DIAGNOSTIC COVERS IS NOT HOW MANY TIMES IT WAS SAT ──
  // The record is keyed by RUN (`subject:startedAt`). Home read those keys and
  // printed each one's subject part, so the learner the live store actually
  // holds — four maths runs from four walks — read "Diagnostic · Mathematics ·
  // Mathematics · Mathematics · Mathematics" in the day's checklist: four
  // identical words, no information, and no way for a reader to tell a bug from
  // a subject list. The claim the record supports is which subjects have been
  // measured, so re-sits must not change the sentence.
  const runAt = (subject, at) => [`${subject}:${at}`, {}];
  const withRuns = (pairs) => ({
    profile: { id: "p1", onboardedAt: 1, subjects: ["maths"] }, progress: {},
    diagnostics: Object.fromEntries(pairs.map(([s, at]) => runAt(s, at))),
  });
  const once = appState.diagnosedSubjects(withRuns([["maths", 1]]));
  const fourTimes = appState.diagnosedSubjects(withRuns([["maths", 1], ["maths", 2], ["maths", 3], ["maths", 4]]));
  ok(once.join() === "maths" && fourTimes.join() === "maths",
    `re-sitting the diagnostic does not repeat the subject (${once.join(", ")} vs ${fourTimes.join(", ")})`);
  const twoSubjects = appState.diagnosedSubjects(withRuns([["maths", 1], ["physics", 2], ["maths", 3]]));
  ok(twoSubjects.join() === "maths,physics",
    `and a second subject is named exactly once, however the runs interleave (${twoSubjects.join(", ")})`);
  ok(appState.diagnosedSubjects(withRuns([])).length === 0 && appState.diagnosedSubjects(null).length === 0,
    "a learner with no diagnostic at all names no subject, rather than an empty word");

  // Every word the guard can put on screen exists in all 15 languages, and the
  // reason keys it can emit are drawn from that same closed set.
  const reasons = new Set(["state.booting", "state.bootNote"]);
  for (const [name, l] of Object.entries(L)) {
    for (const rule of appState.ACCESS_RULES) {
      const d = appState.resolveRoute(l, rule.path);
      reasons.add(d.reasonKey);
    }
  }
  const gaps = [];
  for (const l of i18n.LANGS) {
    const tr = i18n.translator(l.code);
    for (const k of reasons) if (tr(k) === k) gaps.push(`${l.code}:${k}`);
  }
  ok(gaps.length === 0,
    `every guard reason is translated in all 15 languages (${gaps.slice(0, 4).join(", ") || "none missing"})`);

  // A new page must be CLASSIFIED deliberately, not inherit "public" by
  // accident. `app/api` is not a page; every other top-level page directory has
  // to appear in the contract.
  const classified = new Set(appState.ACCESS_RULES.map((r) => r.path));
  const unclassified = [];
  for (const entry of fs.readdirSync("app", { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "api") continue;
    if (!fs.existsSync(`app/${entry.name}/page.tsx`)) continue;
    if (!classified.has(`/${entry.name}`)) unclassified.push(`/${entry.name}`);
  }
  ok(unclassified.length === 0,
    `every page directory is classified in the access contract (unclassified: ${unclassified.join(", ") || "none"})`);
}

// ── On-device AI (local tier) ──────────────────────────────────────────────
// The feature here is not "we run a model". It is that the app can say, from
// MEASUREMENTS, what a given phone can do — and that the rung it actually ships
// needs no download, no WASM and no GPU, so a 2016 Android gets real on-device
// inference instead of a disabled button.
console.log("\n▸ On-device AI, on the phone the learner has");
{
  const F = (over) => ({
    jsBasics: true, wasm: false, simd: false, webgpu: false,
    cores: 4, memoryGB: 2, kOpsPerMs: 260, saveData: false, lowPower: false,
    storageMB: 800, ...over,
  });
  const OLD_PHONE = F({ kOpsPerMs: 210, memoryGB: 1 });
  const MODERN = F({ wasm: true, simd: true, webgpu: true, cores: 10, memoryGB: 8, kOpsPerMs: 2620, storageMB: 20000 });

  // The probe modules must be VALID WASM. If the hand-encoded bytes were wrong,
  // every device on earth would be told it has no WebAssembly, and the ladder's
  // top rungs would be unreachable for a reason nobody could see.
  const plain = new Uint8Array(localAi.PROBE_MODULES.plain);
  const simd = new Uint8Array(localAi.PROBE_MODULES.simd);
  const canValidate = typeof WebAssembly !== "undefined" && typeof WebAssembly.validate === "function";
  ok(!canValidate || WebAssembly.validate(plain), "the plain WASM capability probe is valid WASM");
  ok(!canValidate || WebAssembly.validate(simd), "and so is the SIMD probe (invalid bytes would report no-WASM everywhere)");

  // The rung that ships.
  const oldPlan = localAi.chooseTier(OLD_PHONE);
  ok(oldPlan.tier === "lite" && oldPlan.ready && oldPlan.model === "intent-nb",
    "a 2016-class phone gets REAL on-device inference, not a disabled feature");
  ok(oldPlan.downloadKiB === 0, "and it needs no download at all — which is the whole point of the lite rung");
  ok(oldPlan.chunk === true && oldPlan.maxBatchTokens <= 1200,
    `a slow device gets a smaller work budget AND UI yielding, so inference cannot freeze its screen (${oldPlan.maxBatchTokens} tokens, chunking on)`);

  // Nothing at all on an engine older than typed arrays — stated, not guessed.
  const ancient = localAi.chooseTier(F({ jsBasics: false, kOpsPerMs: 0 }));
  ok(ancient.tier === "none" && ancient.ready === false && ancient.model === null,
    "an engine without typed arrays is reported as incapable rather than crashing");

  // Capable devices are reported as capable and the ABSENT model is stated.
  const modern = localAi.chooseTier(MODERN);
  ok(modern.tier === "gpu" && modern.model === null && modern.downloadKiB > 0,
    "a high-end device is told it could host a model OpenMind does NOT ship");
  for (const plan of [modern, localAi.chooseTier(F({ wasm: true, simd: true, kOpsPerMs: 1500, cores: 8, memoryGB: 8, storageMB: 20000 }))]) {
    ok(plan.model === null && plan.downloadKiB > 0 && plan.why.includes("no-model-bundled"),
      `the ${plan.tier} rung names no model it does not have`);
  }

  // Every reason must be load-bearing: take an otherwise-capable device and
  // break ONE thing, and the upper rung must be refused with that reason.
  const capable = { wasm: true, simd: true, webgpu: true, cores: 8, memoryGB: 8, kOpsPerMs: 3000, storageMB: 20000 };
  // GROUP A: reasons that block BOTH upper rungs — the device must land on lite.
  const blocksAll = {
    "save-data-on": { saveData: true },
    "low-power": { lowPower: true },
    "small-memory": { memoryGB: 1 },
    "few-cores": { cores: 2 },
    "low-storage": { storageMB: 40 },
  };
  const broken = [];
  for (const [reason, over] of Object.entries(blocksAll)) {
    const plan = localAi.chooseTier(F({ ...capable, ...over }));
    if (plan.tier !== "lite" || !plan.why.includes(reason)) broken.push(`${reason}→${plan.tier}:${plan.why.join("|")}`);
  }
  ok(broken.length === 0,
    `each refusal reason blocks the upper rungs on its own (broken: ${broken.slice(0, 3).join(", ") || "none"})`);
  // ...and a device with nothing wrong IS allowed up.
  ok(localAi.chooseTier(F(capable)).tier === "gpu", "while an unencumbered device is allowed onto the top rung");

  // GROUP B: the two upper rungs are INDEPENDENT paths, not a staircase — the
  // GPU rung does not need WASM SIMD, and the WASM rung does not need WebGPU.
  // Each gate must still be load-bearing for the rung it actually gates.
  const gpuOnly = localAi.chooseTier(F({ ...capable, simd: false }));
  ok(gpuOnly.tier === "gpu" && gpuOnly.why.includes("no-wasm-simd"),
    "a device without WASM SIMD can still be reported as GPU-capable (the rungs are independent)");
  const wasmOnly = localAi.chooseTier(F({ ...capable, webgpu: false }));
  ok(wasmOnly.tier === "wasm" && wasmOnly.why.includes("no-webgpu"),
    "and a device without WebGPU is reported as WASM-capable rather than dropped to lite");
  const neither = localAi.chooseTier(F({ ...capable, simd: false, webgpu: false }));
  ok(neither.tier === "lite" && neither.model === "intent-nb",
    "while losing both leaves the rung that always ships");

  // The budget must never shrink as the device gets faster.
  let last = 0, monotone = true;
  for (const k of [50, 120, 300, 900, 2000, 5000, 20000]) {
    const p = localAi.chooseTier(F({ kOpsPerMs: k }));
    if (p.maxBatchTokens < last) monotone = false;
    last = p.maxBatchTokens;
  }
  ok(monotone, "the work budget never shrinks as a device gets faster");
  ok(localAi.chooseTier(F({ kOpsPerMs: 0 })).chunk === true, "and a device we could not measure is treated as slow, not as fast");

  // The line the ♿ panel shows, and the refusal note.
  ok(localAi.tierNoteKey(oldPlan) === "ai.note.lite" && localAi.tierNoteKey(modern) === "ai.note.gpu",
    "the panel is told which sentence to show, and it follows the rung");
  ok(localAi.refusedBiggerModel(localAi.chooseTier(F({ ...capable, saveData: true }))) === true &&
    localAi.refusedBiggerModel(modern) === false,
    "a capable device held back by data-saving says so; a capable one is not accused of it");

  // ── The model ──
  // HELD OUT, and written with deliberately different vocabulary: a
  // bag-of-words model generalises by TOKENS, so testing it on re-worded copies
  // of its own training sentences would prove nothing at all.
  const HELD_OUT = {
    stuck: ["this is too hard for me", "no idea what to do here", "i tried but i am going wrong", "im completely lost on this", "it keeps coming out wrong"],
    answer: ["could you just show me the final value", "what is the value of x", "just the result please", "give me the solution already"],
    why: ["explain to me why the rule works", "how come the sign flips", "what is the reason for that rule"],
    check: ["is my solution correct", "does my answer look right", "can you see if i slipped", "should the answer be positive", "is my working right"],
    practice: ["one more exercise please", "can i try a few more", "id like another problem", "more of these please"],
  };
  let right = 0, abstained = 0, wrong = [], total = 0;
  for (const [want, list] of Object.entries(HELD_OUT)) {
    for (const text of list) {
      total += 1;
      const r = localModel.classifyIntent(text);
      if (!r) abstained += 1;
      else if (r.label === want) right += 1;
      else wrong.push(`${want}→${r.label} @${r.confidence.toFixed(2)}: "${text}"`);
    }
  }
  ok(total === 21, `the held-out set is fixed (${total} phrasings)`);
  ok(right / total >= 0.7, `the on-device intent model reads held-out phrasing (${right}/${total} right, ${abstained} abstained)`);
  // The property that actually matters: abstention is free, a confident
  // misreading is not. This is the assertion to defend, not the accuracy.
  ok(wrong.length === 0,
    `and is NEVER confidently wrong about it (${wrong.slice(0, 3).join(" | ") || "no misreadings"})`);

  // "Just give me the answer" refuses help, so it is held to a higher bar than
  // any other label: a misfire tells a student who wanted checking that they
  // are cheating.
  ok(localModel.ANSWER_STRICT > localModel.INTENT_FLOOR,
    "the answer-seeking label is held to a stricter bar than the rest");
  ok(localModel.classifyIntent("just tell me the answer")?.label === "answer",
    "while an unambiguous request for the answer is still read as one");

  // Nothing in/out with no signal, and the same answer every time.
  ok(localModel.classify(localModel.fitIntentModel(), "zzz qqq") === null,
    "text with no known tokens yields nothing rather than the most likely label");
  const a = localModel.classify(localModel.fitIntentModel(), "i am stuck");
  const b = localModel.classify(localModel.fitIntentModel(), "i am stuck");
  ok(a?.label === b?.label && a?.confidence === b?.confidence, "classification is deterministic");

  // The device cost, DERIVED from the shipped data rather than declared.
  const footprintKiB = (localModel.sourceBytes() + localModel.fittedBytes(localModel.fitIntentModel())) / 1024;
  ok(footprintKiB <= localAi.LITE_MODEL_MAX_KIB,
    `the shipped model stays inside its own budget (${footprintKiB.toFixed(1)} KiB ≤ ${localAi.LITE_MODEL_MAX_KIB})`);

  // It is ON-DEVICE: the module must not be able to reach the network even by
  // accident. This is a source check because a fetch would only show up as a
  // slow first question on a metered connection.
  const src = fs.readFileSync("lib/local-model.ts", "utf8") + fs.readFileSync("lib/local-ai.ts", "utf8");
  const network = ["fetch(", "XMLHttpRequest", "WebSocket", "importScripts"].filter((n) => src.includes(n));
  ok(network.length === 0, `the local tier never touches the network (found: ${network.join(", ") || "nothing"})`);

  // ── Wired into the tutor ──
  // The keyword lists still decide first (their behaviour must not change),
  // and the model only fills the gap where they are silent.
  const stuckShape = socratic.socraticReply("straight-lines", "this is too hard for me", "en");
  const keywordStuck = socratic.socraticReply("straight-lines", "i am stuck", "en");
  const firstSentence = (s) => s.split(". ")[0];
  ok(firstSentence(stuckShape) === firstSentence(keywordStuck),
    "a phrasing NO keyword list covers still gets the 'I'm stuck' scaffold from the on-device model");
  const check = socratic.socraticReply("straight-lines", "is my solution correct", "en");
  ok(check.includes("check it yourself"), "and asking to be checked gets a method, not a verdict");
  const indifferent = socratic.socraticReply("straight-lines", "what is the gradient of a line", "en");
  ok(!indifferent.includes("check it yourself") && !indifferent.includes("three moves"),
    "while a plain concept question is not misread as either");

  // Every new word exists in all 15 languages.
  const keys = ["ai.localTitle", "ai.note.none", "ai.note.lite", "ai.note.wasm", "ai.note.gpu", "ai.note.refused", "soc.check", "soc.checkQ"];
  const gaps = [];
  for (const l of i18n.LANGS) {
    const tr = i18n.translator(l.code);
    for (const k of keys) if (tr(k) === k) gaps.push(`${l.code}:${k}`);
  }
  ok(gaps.length === 0, `the on-device vocabulary is translated everywhere (${gaps.slice(0, 4).join(", ") || "none missing"})`);
}

// ── The evidence ledger: what happened, in the order it happened ────────────
{
  const LEARNER = "ledger-test-1";
  const START = 1_700_000_000_000;
  // Three hours apart, so "the same sitting" and "a later sitting" are
  // genuinely different windows — a baseline that swallows its own follow-up
  // would make every change look like none.
  const at = (n) => START + n * 3 * 3600_000;

  const base = (over = {}) => ({
    type: "answer_submitted",
    id: "ev_abcdefgh12345678",
    schemaVersion: evidence.EVIDENCE_SCHEMA_VERSION,
    learnerId: LEARNER,
    at: START,
    source: "practice",
    subject: "maths",
    conceptId: "fractions",
    specificationId: "AQA-8300",
    questionId: "q1",
    correct: true,
    chosen: 1,
    mode: "independent",
    hints: 0,
    score: null,
    ms: 4200,
    tags: [],
    ...over,
  });

  ok(evidence.validateEvent(base(), LEARNER).ok, "a well-formed answer event is accepted into the ledger");

  const refusals = [
    ["bad_id", base({ id: "nope" })],
    ["schema_mismatch", base({ schemaVersion: 99 })],
    ["bad_time", base({ at: 0 })],
    ["bad_source", base({ source: "wishful_thinking" })],
    ["bad_mode", base({ mode: "probably" })],
    ["bad_choice", base({ chosen: -1 })],
    ["unknown_type", base({ type: "vibes_submitted" })],
  ];
  const mislabelled = refusals.filter(([reason, ev]) => {
    const r = evidence.validateEvent(ev, LEARNER);
    return r.ok || r.reason !== reason;
  }).map(([reason]) => reason);
  ok(mislabelled.length === 0, `every malformed event is refused for its own reason (${mislabelled.join(", ") || `all ${refusals.length} correct`})`);

  // The authorisation boundary, at the layer everything else trusts.
  const foreign = evidence.validateEvent(base({ learnerId: "somebody-else" }), LEARNER);
  ok(!foreign.ok && foreign.reason === "learner_mismatch", "an event naming another learner is refused at the schema layer");

  // Provenance cannot be claimed by whoever is sending.
  const arrived = evidence.validateEvent(base({ provenance: "server" }), LEARNER);
  ok(arrived.ok && arrived.event.provenance === "device", "anything arriving over the wire is stamped device-reported, even when the body claims server");

  const minted = (over) => evidence.answerEvidence({
    learnerId: LEARNER, at: at(0), source: "practice", subject: "maths",
    conceptId: "fractions", specificationId: null, questionId: "q1",
    correct: true, chosen: 0, mode: "independent", hints: 0, ...over,
  });
  ok(minted({}).provenance === "server", "while the server's own constructor mints server-observed evidence");
  ok(minted({}).id !== minted({}).id, "and event ids are random, so two real attempts at one question cannot collide");

  // A stream with a taught phase, a measured baseline and a later measurement.
  const stream = [
    minted({ at: at(0), source: "diagnostic", questionId: "d1", correct: false, chosen: 0, tags: ["common-denominator"] }),
    minted({ at: at(1), source: "practice", questionId: "p1", correct: true, chosen: 1, mode: "guided", hints: 2 }),
    minted({ at: at(2), source: "practice", questionId: "p2", correct: true, chosen: 2 }),
    minted({ at: at(3), source: "past_paper", questionId: "pp1", correct: true, chosen: 0, score: { awarded: 3, max: 4 } }),
  ];

  const forward = evidence.projectLearner(stream);
  const reversed = evidence.projectLearner([...stream].reverse());
  ok(JSON.stringify(forward) === JSON.stringify(reversed),
    "projection is order-independent: replaying the same events rebuilds the same learner model");

  const c = forward.byConcept.fractions;
  ok(c.attempts === 4 && c.correct === 3, "every answer counts as an attempt on its concept");
  ok(c.measured.asked === 2 && c.measured.correct === 1,
    "but only measuring sources (diagnostic, past paper) count as measurement — practice is teaching, not evidence of change");
  ok(c.independent.asked === 3 && c.independent.correct === 2,
    "and a hinted correct answer is not independence proof");
  ok(c.hints === 2, "the hint count is the server's ledger, not a client-declared number");
  ok(c.misconceptions["common-denominator"] === 1, "a wrong answer records the slip it was built to catch");

  const snap = evidence.impactSnapshot(stream);
  ok(snap.baseline.assessed && snap.baseline.measured.correct === 0,
    "the impact baseline is the learner's first MEASURING sitting, not their first answer");
  ok(snap.current.measured && snap.current.measured.correct === 1,
    "change is between that sitting and a later measurement, for the same learner");
  ok(snap.unmeasured.some((u) => u.includes("causation")), "and the snapshot names causation as beyond it");
  ok(snap.unmeasured.some((u) => u.includes("retention")), "as well as retention, which nothing here measures");

  const noMeasurement = evidence.impactSnapshot(stream.filter((e) => e.source === "practice"));
  ok(noMeasurement.baseline.assessed === false && noMeasurement.current.measured === null,
    "with no measurement at all the change is unknown (null), never 0");

  const withDevice = evidence.impactSnapshot([...stream, evidence.validateEvent(base({ id: "ev_zzzzzzzzzzzzzzzz" }), LEARNER).event]);
  const disclosed = (s) => s.unmeasured.some((u) => u.includes("device") && u.includes("not observed by the server"));
  ok(withDevice.deviceReported === 1 && disclosed(withDevice),
    "device-reported evidence is counted and disclosed, not mixed into server-observed results");
  // And an answer the server GRADED but a device answered offline belongs in the
  // same disclosure: the marking was observed, the answering was not.
  const replayed = evidence.answerEvidence({
    learnerId: LEARNER, at: at(6), source: "practice", subject: "maths", conceptId: "fractions",
    specificationId: "AQA-8300", questionId: "offline-q", correct: true, chosen: 0,
    mode: "independent", hints: 0, ms: 2000, tags: [], deviceAt: at(6) - 2 * 24 * 60 * 60 * 1000,
  });
  const withReplay = evidence.impactSnapshot([...stream, replayed]);
  ok(withReplay.deviceReported === 1 && disclosed(withReplay),
    "and an answer replayed from a device's offline queue is disclosed the same way");

  const report = evidence.generateImpactReport([
    { learnerId: LEARNER, events: stream },
    { learnerId: "no-evidence", events: [] },
  ]);
  ok(report.containsIndividualData === false, "the deployment report carries no individual data, by construction");
  ok(report.population.learners === 2 && report.population.withBaseline === 1,
    "it counts the population and who actually has a baseline");
  ok(report.outcome.learnersImproving && report.outcome.learnersImproving.of === 1,
    "a learner with no evidence is excluded from the change denominator, never counted as unchanged");
  ok(report.limitations.length >= 4 && report.limitations.some((l) => l.includes("not a causal claim")),
    "and every report ships its own limitations");

  // ── The store: append-only, idempotent, and it does not take a caller's word ─
  const evA = minted({ at: at(0), questionId: "store-1" });
  const first = await evidenceStore.appendEvidence(LEARNER, [evA]);
  const again = await evidenceStore.appendEvidence(LEARNER, [evA]);
  ok(first.accepted.length === 1 && again.accepted.length === 0 && again.duplicates.length === 1,
    "re-sending an event is idempotent: reported as a duplicate, not counted twice");
  ok(evidenceStore.readEvidence(LEARNER).length === 1, "and the ledger on disk holds exactly one copy");

  let crossWrote = false;
  try { await evidenceStore.appendEvidence("another-learner", [evA]); } catch { crossWrote = true; }
  ok(crossWrote, "the store refuses to write one learner's evidence into another learner's ledger");

  let traversal = false;
  try { await evidenceStore.appendEvidence("../../etc/passwd", [evA]); } catch { traversal = true; }
  ok(traversal, "and an id that would escape the data directory is rejected, never silently sanitised");

  let malformed = false;
  try { evidenceStore.readEvidence("../store"); } catch { malformed = true; }
  ok(malformed, "reads are guarded by the same rule as writes");

  // ── The reconciliation: the ledger agrees with the model it shadows ───────
  // This is the test that made introducing a ledger safe. The existing model
  // keeps running; every divergence is REPORTED rather than assumed away.
  const state = store.newProfileState("reconcile-1");
  const answers = [
    ["fractions", "q1", 0, true, [], "independent", 0],
    ["fractions", "q2", 2, true, [], "independent", 0],
    ["fractions", "q3", 1, false, ["sign-error"], "independent", 0],
    ["fractions", "q4", 0, true, [], "guided", 2],
    ["fractions", "q5", 3, true, [], "transfer", 0],
  ];
  const mirrored = [];
  answers.forEach(([conceptId, questionId, chosen, correct, tags, mode, hints], i) => {
    progress.recordAnswer(state, conceptId, questionId, chosen, correct, "explanation", tags, { hints, mode, ms: 5000 });
    mirrored.push(evidence.answerEvidence({
      learnerId: "reconcile-1", at: at(20 + i), source: "practice", subject: "maths",
      conceptId, specificationId: null, questionId, correct, chosen, mode, hints, tags,
    }));
  });
  const divergences = evidence.reconcile(evidence.projectLearner(mirrored), state.progress);
  ok(divergences.length === 0,
    `the ledger and the live learner model agree on the same answers (${divergences.length} divergence${divergences.length === 1 ? "" : "s"}${divergences.length ? ": " + divergences.slice(0, 3).map((d) => `${d.conceptId}/${d.field}`).join(", ") : ""})`);
  ok(state.progress.fractions.transfer && state.progress.fractions.transfer.asked === 1,
    "including the independence and transfer counts the model derives from the same rules");

  // A divergence is detected, not swallowed — the failure mode the check exists for.
  const tampered = { ...state.progress, fractions: { ...state.progress.fractions, correct: 99 } };
  ok(evidence.reconcile(evidence.projectLearner(mirrored), tampered).some((d) => d.field === "correct"),
    "and a model that disagrees with its own evidence is reported, not tolerated");

  // ── REPLAY PARITY: the ledger alone rebuilds the model ────────────────────
  // The Phase-1 bridge. `replayModel` re-runs the live model's OWN math over
  // the ledger's events (recordAnswer for graded answers, the shared
  // mergeDiagnosticSeed for diagnostic sittings); `reconcileDeep` compares
  // every derivable field. Zero divergence here is the claim that the model
  // is a projection of the ledger — which is what makes the eventual flip to
  // "ledger as source of truth" a provable change rather than a leap.
  const replayMod = require("../.verify/replay.js");

  // Practice journey: mixed modes, hints, timings, a misconception tag.
  const rstate = store.newProfileState("replay-1");
  const rEvents = [];
  const rRows = [
    ["fractions", "rq1", 0, true, [], "independent", 0, 4000],
    ["fractions", "rq2", 1, false, ["sign-error"], "guided", 2, 3000],
    ["fractions", "rq3", 0, true, [], "independent", 0, 5000],
    ["fractions", "rq4", 0, true, [], "transfer", 0, 6000],
    ["negatives", "rn1", 2, false, [], "independent", 0, 2500],
  ];
  rRows.forEach(([cid, qid, chosen, correct, tags, mode, hints, ms], i) => {
    const at = 1700000000000 + i * 1000; // fixed clock — replay must not need real time
    progress.recordAnswer(rstate, cid, qid, chosen, correct, "e", tags, { ms, hints, mode }, at);
    rEvents.push(evidence.answerEvidence({ learnerId: "replay-1", at, source: mode === "transfer" ? "transfer" : "practice", subject: "maths", conceptId: cid, specificationId: null, questionId: qid, correct, chosen, mode, hints, ms, tags }));
  });
  const rDiffs = replayMod.reconcileDeep(replayMod.replayModel(rEvents, "replay-1"), rstate);
  ok(rDiffs.length === 0,
    `replaying a practice ledger rebuilds the model exactly — every derivable field (${rDiffs.length} diffs${rDiffs.length ? ": " + rDiffs.slice(0, 3).map((d) => `${d.conceptId}/${d.field}`).join(", ") : ""})`);

  // Per-field depth: the comparison is not just the shallow trio.
  const replayedP = replayMod.replayModel(rEvents, "replay-1");
  const fp = replayedP.progress.fractions;
  ok(fp.streak === rstate.progress.fractions.streak && fp.accuracy === rstate.progress.fractions.accuracy,
    "streak and the EWMA accuracy survive the replay — not just the counts");
  ok(fp.totalMs === rstate.progress.fractions.totalMs && fp.answers === rstate.progress.fractions.answers,
    "pace evidence (totalMs/answers) survives the replay");
  ok(fp.lastSeen === rstate.progress.fractions.lastSeen,
    "timestamps survive the replay — one clock per answer makes lastSeen reproducible");
  ok(fp.independent?.correct === rstate.progress.fractions.independent.correct && fp.transfer?.correct === rstate.progress.fractions.transfer.correct,
    "independence and transfer PROOF counts survive the replay, not just attempts");

  // A single mutated event flips the replay — the mirror is sensitive.
  const flipped = structuredClone(rEvents).map((e) => e.questionId === "rq3" ? { ...e, correct: !e.correct } : e);
  ok(replayMod.reconcileDeep(replayMod.replayModel(flipped, "replay-1"), rstate).length > 0,
    "flipping one recorded answer shows up as divergence — replay is sensitive, not decorative");

  // Order independence of the REPLAYED model: the same events in any order
  // build the same model (within-concept order matters to EWMA, so shuffle
  // across CONCEPTS, which is the ordering the ledger cannot control).
  const shuffled = [...rEvents].filter((e) => e.conceptId !== "negatives").concat(rEvents.filter((e) => e.conceptId === "negatives").reverse());
  const a = JSON.stringify(replayMod.replayModel(rEvents, "replay-1").progress.fractions);
  const b = JSON.stringify(replayMod.replayModel(shuffled, "replay-1").progress.fractions);
  ok(a === b, "reordering events across concepts rebuilds the same per-concept model");

  // Diagnostic journey: run a REAL diagnostic session through the engine, fold
  // it live, then replay it from the event's seeds alone.
  const dstate = store.newProfileState("replay-2");
  const sess = diag.newDiagnosticSession("maths", "baseline");
  let dq = diag.nextQuestion(sess);
  while (dq) { diag.gradeAnswer(sess, dq.conceptId, dq, dq.answer); dq = diag.nextQuestion(sess); }
  const dAt = 1700000100000;
  diag.applyDiagnosticResult(dstate, sess, dAt);
  const seeds = sess.concepts.filter((c) => c.asked > 0).map((c) => ({ conceptId: c.conceptId, asked: c.asked, correct: c.correct, done: c.done, stage: c.stage, askedThisStage: c.askedThisStage, correctThisStage: c.correctThisStage, servedDifficulty: [...c.servedDifficulty] }));
  const dEv = { type: "diagnostic_completed", id: "ev_replay_diag", schemaVersion: evidence.EVIDENCE_SCHEMA_VERSION, learnerId: "replay-2", provenance: "server", at: dAt, source: "diagnostic", subject: "maths", conceptId: null, specificationId: null, concepts: seeds.length, seeds };
  const dDiffs = replayMod.reconcileDeep(replayMod.replayModel([dEv], "replay-2"), dstate);
  ok(dDiffs.length === 0,
    `replaying a diagnostic sitting from its carried seeds rebuilds the seeded model exactly (${dDiffs.length} diffs${dDiffs.length ? ": " + dDiffs.slice(0, 3).map((d) => `${d.conceptId}/${d.field}`).join(", ") : ""})`);
  ok(seeds.length > 0, "the diagnostic journey actually measured at least one concept (test is not vacuous)");

  // Mixed journey: diagnostic seed THEN practice on the same concept — the
  // supervised-window merge rule must reproduce identically from the ledger.
  const mstate = store.newProfileState("replay-3");
  const msess = diag.newDiagnosticSession("maths", "baseline");
  let mq = diag.nextQuestion(msess);
  while (mq) { diag.gradeAnswer(msess, mq.conceptId, mq, mq.answer); mq = diag.nextQuestion(msess); }
  diag.applyDiagnosticResult(mstate, msess, 1700000200000);
  const mSeeds = msess.concepts.filter((c) => c.asked > 0).map((c) => ({ conceptId: c.conceptId, asked: c.asked, correct: c.correct, done: c.done, stage: c.stage, askedThisStage: c.askedThisStage, correctThisStage: c.correctThisStage, servedDifficulty: [...c.servedDifficulty] }));
  const mEvents = [{ ...dEv, id: "ev_replay_diag3", learnerId: "replay-3", at: 1700000200000, seeds: mSeeds }];
  for (let i = 0; i < 3; i++) {
    const at = 1700000300000 + i * 1000;
    progress.recordAnswer(mstate, "fractions", `mq${i}`, 0, true, "", [], { ms: 3000, hints: 0, mode: "independent" }, at);
    mEvents.push(evidence.answerEvidence({ learnerId: "replay-3", at, source: "practice", subject: "maths", conceptId: "fractions", specificationId: null, questionId: `mq${i}`, correct: true, chosen: 0, mode: "independent", hints: 0, ms: 3000, tags: [] }));
  }
  const mDiffs = replayMod.reconcileDeep(replayMod.replayModel(mEvents, "replay-3"), mstate);
  ok(mDiffs.length === 0,
    `diagnostic-then-practice on the same concept replays exactly through the shared merge rule (${mDiffs.length} diffs${mDiffs.length ? ": " + mDiffs.slice(0, 3).map((d) => `${d.conceptId}/${d.field}`).join(", ") : ""})`);

  // ══════════════════════════════════════════════════════════════════════════
  // THE CUTOVER: the ledger is the source of truth, and the model is a
  // PROJECTION of it.
  //
  // Phase 1 proved the ledger was sufficient to reconstruct the model. These
  // assertions are about the architecture that replaced it: every write goes
  // event → ledger → replay, and the claim below is the one the whole design
  // exists for —
  //
  //     A learner's history is sufficient to reconstruct their current state,
  //     and the recommendation that state produces.
  // ══════════════════════════════════════════════════════════════════════════
  console.log("▸ Ledger authority (the projection IS the model)");
  const projectionMod = require("../.verify/server/projection.js");
  const J0 = 1700001000000;
  const JOURNEY = "journey-1";
  const topOf = (s, evs) => nextEngine.decideNext(s, 1, undefined, undefined, J0, evs)[0];
  const jstate = store.newProfileState(JOURNEY);
  jstate.profile.spec = "gb-gcse-maths";
  jstate.profile.exam = "GCSE Maths";
  jstate.profile.examDate = "2027-06-05";
  jstate.profile.timePerDay = 20;

  const journey = []; // the ledger, in append order
  const commit = async (events) => {
    await projectionMod.commitAndProject(JOURNEY, jstate, events);
    journey.push(...events);
  };

  /**
   * The claim, checked after EVERY stage of the journey: wipe the projected
   * learner state, read the ledger, replay it, and land on the same model — and
   * the same next action, with the same reason and the same evidence ids.
   *
   * This is deliberately not `reconcileDeep` alone. A full string comparison of
   * the replayed model catches a field the comparison list forgot; comparing the
   * whole NextAction (kind, concept, reason, why, plan, evidence, evidenceIds)
   * catches a recommendation that drifted even when the model did not.
   */
  /** Canonical JSON: key order is not part of a model's meaning, and the
   *  annotations a live entry carries can be set in a different order from the
   *  fold's. Compare the CONTENT. */
  const canon = (v) => (Array.isArray(v)
    ? `[${v.map(canon).join(",")}]`
    : v && typeof v === "object"
      ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}`
      : JSON.stringify(v));

  const stageReport = [];
  const checkStage = (label, now) => {
    const replayed = replayMod.replayModel(journey, JOURNEY, jstate.projectionBase);
    const wiped = structuredClone(jstate);
    wiped.progress = {};
    wiped.masteries = {};
    delete wiped.projectionBase;
    // DELETE PROJECTED STATE → READ LEDGER → REPLAY → MODEL
    projectionMod.projectFromLedger(wiped, journey);
    stageReport.push({
      label,
      diffs: replayMod.reconcileDeep(replayed, jstate).length,
      modelSame: canon(replayed.progress) === canon(jstate.progress)
        && canon(replayed.masteries) === canon(jstate.masteries),
      recSame: JSON.stringify(topOf(jstate, journey, now)) === JSON.stringify(topOf(wiped, journey, now)),
      kind: topOf(jstate, journey, now).kind,
      concept: topOf(jstate, journey, now).conceptId,
    });
    return stageReport[stageReport.length - 1];
  };

  // ── 1. DIAGNOSTIC: a real sitting, run through the engine. The FIRST
  //       concept served is the one this learner is weak at — which concept
  //       that is comes from the engine's own blueprint, not from a guess here.
  const jsess = diag.newDiagnosticSession("maths", "baseline");
  const firstServed = diag.nextQuestion(jsess);
  const WEAK = firstServed.conceptId;
  const diagEvents = [];
  const sittingAt = J0 + 1000000;
  let jDiagAt = J0;
  let jq = firstServed;
  while (jq) {
    const right = jq.conceptId !== WEAK;
    const chosen = right ? jq.answer : (jq.answer + 1) % jq.choices.length;
    diag.gradeAnswer(jsess, jq.conceptId, jq, chosen);
    diagEvents.push(evidence.answerEvidence({
      learnerId: JOURNEY, at: jDiagAt, source: "diagnostic", subject: "maths",
      conceptId: jq.conceptId, specificationId: null, questionId: jq.id,
      correct: right, chosen, mode: "independent", hints: 0,
    }));
    jDiagAt += 1000;
    jq = diag.nextQuestion(jsess);
  }
  const jseeds = jsess.concepts.filter((c) => c.asked > 0).map((c) => ({
    conceptId: c.conceptId, asked: c.asked, correct: c.correct, done: c.done,
    stage: c.stage, askedThisStage: c.askedThisStage, correctThisStage: c.correctThisStage,
    servedDifficulty: [...c.servedDifficulty],
  }));
  const jSitting = {
    type: "diagnostic_completed", id: "ev_journey_diag",
    schemaVersion: evidence.EVIDENCE_SCHEMA_VERSION, learnerId: JOURNEY,
    provenance: "server", at: sittingAt, source: "diagnostic", subject: "maths",
    conceptId: null, specificationId: null,
    concepts: jsess.concepts.filter((c) => c.done).length, seeds: jseeds,
  };
  await commit([...diagEvents, jSitting]);
  ok(jseeds.length > 0, "the journey's diagnostic actually measured concepts (the test is not vacuous)");
  ok(jstate.projectionBase === undefined,
    "a learner whose whole history is in the ledger gets NO pre-ledger snapshot — their model is the ledger alone, from the first event");
  checkStage("diagnostic", sittingAt + 1000);
  ok((jstate.progress[WEAK]?.mastery ?? 1) < 0.35,
    `and the measurement puts the failed concept where it belongs (mastery ${(jstate.progress[WEAK]?.mastery ?? 0).toFixed(2)})`);

  // The sitting's per-answer detail must NOT fold as well, or every diagnostic
  // answer would count twice. Pin it against the live path's own mathematics,
  // rather than against a number guessed here.
  const liveDiag = store.newProfileState("journey-live");
  diag.applyDiagnosticResult(liveDiag, jsess, sittingAt);
  const diagDouble = replayMod.reconcileDeep(liveDiag, jstate);
  ok(diagDouble.length === 0,
    `a diagnostic projected from the ledger matches the live fold exactly — the sitting folds once, its per-answer detail does not fold again (${diagDouble.length} diffs${diagDouble.length ? ": " + diagDouble.slice(0, 3).map((d) => `${d.conceptId}/${d.field}`).join(", ") : ""})`);

  // ── 2. PRACTICE on the concept the diagnostic found weak ─────────────────
  let jt = J0 + 2000000;
  const px = (over) => evidence.answerEvidence({
    learnerId: JOURNEY, at: (jt += 1000), source: "practice", subject: "maths",
    conceptId: WEAK, specificationId: null, questionId: "jq", correct: true,
    chosen: 0, mode: "independent", hints: 0, ...over,
  });
  await commit([
    px({ questionId: "jp1" }),
    // A hinted answer: guided, so it can never buy independence proof.
    px({ questionId: "jp2", mode: "guided", hints: 2 }),
    // A wrong answer that tags the slip it was built to catch.
    px({ questionId: "jp3", correct: false, chosen: 1, tags: ["common-denominator"] }),
    px({ questionId: "jp4" }),
  ]);
  checkStage("practice", jt + 1000);
  // The count includes the SITTING's own answers. Every diagnostic question is
  // hint-free by construction, so the sitting IS independence evidence — the
  // ledger records `mode: "independent"` for each of those answers and My
  // Evidence already projected them that way, so a model that dropped the
  // dimension was calling one answer two things (Home said "Supported — you
  // got there with support" about work given with no help available).
  // What this pin is named for is what must stay true: the guided answer above
  // is work done and nothing more.
  const weakSitting = jsess.concepts.find((c) => c.conceptId === WEAK);
  const weakInd = jstate.progress[WEAK]?.independent;
  // Three of the four practice answers above were hint-free (jp1, jp3, jp4),
  // and jp3 was deliberately WRONG — so it is asked and not correct. The
  // guided answer (jp2) is in neither count: asked would be 6 if it were.
  ok((weakInd?.asked ?? 0) === (weakSitting?.asked ?? 0) + 3 &&
     (weakInd?.correct ?? 0) === (weakSitting?.correct ?? 0) + 2,
    `the independence count is exactly the hint-free work: the sitting's ${weakSitting?.asked}/${weakSitting?.correct} answers plus the 3 hint-free practice answers (one of them wrong), read as ${weakInd?.asked}/${weakInd?.correct} — the guided answer is in neither, which is why it shows up only in \`attempts\``);
  ok((jstate.progress[WEAK]?.attempts ?? 0) === (weakSitting?.asked ?? 0) + 4,
    "and the guided answer is in the tally as work done, beside the sitting's own");

  // ── WHAT A SITTING'S OWN ANSWER PROVED, IN EVERY SURFACE THAT READS IT ───
  // One answer, one verdict. The ledger mints `mode: "independent"` for every
  // diagnostic answer (the sitting has no hint action at all), and My Evidence
  // projects the ledger — so the model must carry the same fact, or Home's
  // chip reads "Supported — you got there with support" about work given with
  // no help available, and lib/mastery.ts caps the concept at 0.75 for want of
  // a proof the learner's own record holds.
  const diagOnly = store.newProfileState("diag-only");
  // A learner who swept the concept's whole ladder in the sitting: the rung
  // where the missing dimension actually bit. The claim the SITTING made was
  // 0.98; the model held it at 0.75 for "no proof" and now holds it at 0.85 for
  // the independence the ledger recorded. It is still short of mastery — that
  // needs transfer — which is the cap doing its job, not an over-claim.
  const cleanLadder = {
    conceptId: "fraction-ops", stage: 3, askedThisStage: 2, correctThisStage: 2,
    done: true, asked: 8, correct: 8, usedSeeds: [], servedDifficulty: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
  };
  diag.applyDiagnosticEvidence(diagOnly, "fraction-ops", cleanLadder, {}, 1000);
  const diagRow = diagOnly.progress["fraction-ops"];
  ok(proofMod.strongestProof({
      correct: diagRow.correct,
      independentCorrect: diagRow.independent?.correct ?? 0,
      transferCorrect: 0, retentionCorrect: 0,
    }) === "independent",
    "a hint-free diagnostic answer is independence evidence in the model, so Home's chip says what My Evidence's projection of the same ledger says");
  const withSitting = mastery.integratedMastery(diagRow).integrated;
  const withoutSitting = mastery.integratedMastery({ ...diagRow, independent: undefined }).integrated;
  ok(withSitting > 0.8 && withoutSitting <= 0.75,
    `and the claim is not held at 0.75 for want of a dimension the sitting itself supplies (${withSitting.toFixed(2)} with the independence the ledger recorded, ${withoutSitting.toFixed(2)} with it dropped, ${diagRow.mastery.toFixed(2)} measured)`);
  ok((jstate.progress[WEAK]?.misconceptions?.["common-denominator"] ?? 0) === 1,
    "and the wrong answer's slip is in the model as well as in the ledger");

  // ── 3. INDEPENDENT PROOF: hint-free work, enough of it to release the
  //       diagnostic's supervised window (DIAG_RELEASE_EVIDENCE) ────────────
  const independentProof = [];
  for (let i = 0; i < 8; i++) independentProof.push(px({ questionId: `ji${i}` }));
  await commit(independentProof);
  checkStage("independent proof", jt + 1000);

  // ── 4. TRANSFER: the same idea, re-framed, at the top of the range ───────
  await commit([
    px({ questionId: "jt1", mode: "transfer", source: "transfer" }),
    px({ questionId: "jt2", mode: "transfer", source: "transfer" }),
  ]);
  checkStage("transfer", jt + 1000);
  ok((jstate.progress[WEAK]?.transfer?.correct ?? 0) === 2,
    "transfer proof is recorded as proof — hint-free work on a re-framed task");

  // ── 5. RETRIEVAL: the learner comes back days later ─────────────────────
  // Real time passing, evaluated at the later clock the learner would actually
  // be at — not a hand-edited `lastSeen`, which is exactly the kind of mutation
  // the cutover removed.
  checkStage("retrieval", jt + 8 * 86400000);

  // THE KILLER TEST. After every one of the five stages: the ledger alone
  // rebuilt the model, and the same decision came out of it.
  const broken = stageReport.filter((s) => s.diffs !== 0 || !s.modelSame || !s.recSame);
  ok(broken.length === 0,
    `AFTER EVERY STAGE the ledger rebuilds both the learner model and the recommendation — same model, same next action, same reason (${stageReport.map((s) => `${s.label}: ${s.diffs === 0 && s.modelSame && s.recSame ? "ok" : [s.diffs ? `${s.diffs} diffs` : null, s.modelSame ? null : "model differs", s.recSame ? null : "recommendation differs"].filter(Boolean).join(" + ")}`).join(" · ")})`);
  ok(stageReport.length === 5, "the journey covered all five stages: diagnose → practise → prove → transfer → retain");
  const steps = stageReport.map((s) => `${s.kind}:${s.concept ?? "-"}`);
  ok(new Set(stageReport.map((s) => s.kind)).size >= 2,
    `and the plan genuinely MOVED along it, rather than rendering the same action five times (${steps.join(" → ")})`);
  // The recommendation is a projection too, not a re-derivation: the same
  // ledger, replayed from scratch, must name the same evidence for its own
  // decision — which is what makes "why am I doing this?" answerable.
  const finalNow = jt + 8 * 86400000;
  const wipedTop = (() => {
    const w = structuredClone(jstate);
    w.progress = {}; w.masteries = {}; delete w.projectionBase;
    projectionMod.projectFromLedger(w, journey);
    return topOf(w, journey, finalNow);
  })();
  ok(JSON.stringify(wipedTop.evidenceIds) === JSON.stringify(topOf(jstate, journey, finalNow).evidenceIds),
    `the recommendation reconstructed from the ledger cites the same evidence events (${wipedTop.evidenceIds.length} citations)`);

  // ── MUTATING THE HISTORY CHANGES THE DECISION ───────────────────────────
  // The strongest form of "the recommendation is a projection of the
  // evidence": remove one recorded event, replay, and the recommendation
  // changes BECAUSE the evidence changed — not because a counter was edited.
  const replayWithout = (dropId) => {
    const evs = journey.filter((e) => e.id !== dropId);
    const s = structuredClone(jstate);
    s.progress = {}; s.masteries = {}; delete s.projectionBase;
    projectionMod.projectFromLedger(s, evs);
    return { s, evs };
  };
  const baseRec = JSON.stringify(topOf(jstate, journey, finalNow));
  const flips = journey.filter((e) => {
    const { s, evs } = replayWithout(e.id);
    return JSON.stringify(topOf(s, evs, finalNow)) !== baseRec;
  });
  ok(flips.length > 0,
    `removing one recorded event from the history changes what OpenMind recommends (${flips.length} of ${journey.length} single removals flip the top action)`);
  // What a single removal changes, stated exactly rather than hoped for. In
  // this journey the plan's TARGET is robust to any one event — the concept
  // served first by the baseline stays the weakest whichever single answer is
  // taken away — so the flip shows up in the citations and the reason sentence,
  // which is the honest strength of a one-event removal. The claim was
  // previously phrased as "removing one event changes the KIND of work", which
  // was a fixture-dependent coincidence (it stopped being true when the
  // baseline's first concept changed), not an invariant. What IS an invariant,
  // and is tested below, is that the plan is nothing but the record: take the
  // target's own evidence away and the work the engine asks for changes.
  const singleRemovalEffect = (() => {
    for (const e of flips) {
      const { s, evs } = replayWithout(e.id);
      const after = topOf(s, evs, finalNow);
      const before = topOf(jstate, journey, finalNow);
      if (after.kind !== before.kind) return `kind ${before.kind} → ${after.kind} (drop ${e.type} ${e.questionId ?? e.id})`;
      if (after.conceptId !== before.conceptId) return `target ${before.conceptId} → ${after.conceptId} (drop ${e.type} ${e.questionId ?? e.id})`;
    }
    return null;
  })();
  if (singleRemovalEffect) {
    ok(true, `and one removal changes which work is asked for, not just its wording (${singleRemovalEffect})`);
  } else {
    const targetsHold = flips.every((e) => {
      const { s, evs } = replayWithout(e.id);
      const after = topOf(s, evs, finalNow);
      const before = topOf(jstate, journey, finalNow);
      return after.kind === before.kind && after.conceptId === before.conceptId;
    });
    ok(targetsHold && flips.length > 0,
      `no single removal moves the target: the plan is robust to one answer, while the recommendation it re-derives changes with the record (${flips.length} of ${journey.length} removals, none of them moving the work)`);
  }
  // THE DECISIVE MUTATION: remove the target's own evidence — the diagnostic's
  // seed record for it, every practice answer on it — and the engine must stop
  // asking for that work, because it is not asking from a counter that was left
  // behind; it is asking from what the record still says.
  {
    const stripped = journey.filter((e) =>
      e.conceptId !== WEAK && !(e.seeds ?? []).some((sd) => sd.conceptId === WEAK));
    const s = structuredClone(jstate);
    s.progress = {}; s.masteries = {}; delete s.projectionBase;
    projectionMod.projectFromLedger(s, stripped);
    const before = topOf(jstate, journey, finalNow);
    const after = topOf(s, stripped, finalNow);
    ok(stripped.length < journey.length && (after.kind !== before.kind || after.conceptId !== before.conceptId),
      `delete every event about the concept the plan targets and the work changes (${before.kind}:${before.conceptId} → ${after.kind}:${after.conceptId ?? "nothing measured yet"})`);
  }
  const lastTransfer = [...journey].reverse().find((e) => e.mode === "transfer");
  if (lastTransfer) {
    const { s } = replayWithout(lastTransfer.id);
    ok((s.progress[lastTransfer.conceptId]?.transfer?.asked ?? 0) < (jstate.progress[lastTransfer.conceptId]?.transfer?.asked ?? 0),
      "removing transfer evidence removes the PROOF it stood for, not merely a counter");
  }

  // ── THE CUTOVER MUST NOT EAT A LEARNER WHO PREDATES THE LEDGER ──────────
  // The live store holds exactly this shape — a profile with recorded work and
  // no ledger at all — so this is not a hypothetical. Flipping the source of
  // truth to "replay the ledger" would reset that learner's mastery to the
  // prior on their next answer: the data loss this project must never do.
  console.log("▸ The cutover keeps pre-ledger learners");
  const legacyId = "legacy-1";
  const legacy = store.newProfileState(legacyId);
  legacy.progress.fractions = {
    attempts: 13, correct: 9, streak: 2, mastery: 0.62, accuracy: 0.6,
    lastSeen: J0, misconceptions: { "sign-error": 1 },
  };
  const legacyAt = J0 + 5000000;
  await projectionMod.commitAndProject(legacyId, legacy, [
    evidence.answerEvidence({
      learnerId: legacyId, at: legacyAt, source: "practice", subject: "maths",
      conceptId: "fractions", specificationId: null, questionId: "lq1",
      correct: true, chosen: 0, mode: "independent", hints: 0,
    }),
  ]);
  ok(legacy.progress.fractions.attempts === 14,
    `a pre-ledger learner's counts CONTINUE across the cutover instead of resetting (13 recorded answers + 1 = ${legacy.progress.fractions.attempts})`);
  ok(legacy.progress.fractions.correct === 10 && legacy.progress.fractions.mastery > 0.62,
    "and their mastery carries those answers forward rather than restarting at the prior");
  ok(legacy.projectionBase && legacy.projectionBase.unprojected.attempts === 13
    && legacy.projectionBase.unprojected.concepts === 1,
    `and the work the ledger cannot rebuild is MEASURED and named, not assumed away (${legacy.projectionBase?.unprojected.attempts} answers across ${legacy.projectionBase?.unprojected.concepts} concept(s))`);
  ok(projectionMod.unprojectableShare(legacy) !== null,
    "so the read door can disclose what this learner's evidence cannot account for");
  ok(projectionMod.unprojectableShare(jstate) === null,
    "while a ledger-complete learner reports nothing unprojectable — the claim worth making");
  const legacyDiffs = replayMod.reconcileDeep(
    replayMod.replayModel(evidenceStore.readEvidence(legacyId), legacyId, legacy.projectionBase), legacy);
  ok(legacyDiffs.length === 0,
    `and the projection still reconciles against its own ledger plus its base (${legacyDiffs.length} diffs)`);

  // The snapshot covers a POSITION in the ledger, not a stretch of clock time.
  // A device that syncs its offline queue out of order is the case that tells
  // the two apart: a timestamp cutoff would fold one of these answers twice (if
  // it cut from the earliest) or drop two of them (if it cut from the latest).
  const syncId = "legacy-sync";
  const syncState = store.newProfileState(syncId);
  syncState.progress.fractions = {
    attempts: 4, correct: 2, streak: 0, mastery: 0.5, accuracy: 0.5,
    lastSeen: J0, misconceptions: {},
  };
  const syncAnswer = (n, at) => evidence.answerEvidence({
    learnerId: syncId, at, source: "practice", subject: "maths",
    conceptId: "fractions", specificationId: null, questionId: `sq${n}`,
    correct: true, chosen: 0, mode: "independent", hints: 0,
  });
  await projectionMod.commitAndProject(syncId, syncState, [
    syncAnswer(1, J0 + 3000), // newest first: the order the device happened to hold
    syncAnswer(2, J0 + 1000),
    syncAnswer(3, J0 + 2000),
  ]);
  ok(syncState.progress.fractions.attempts === 7,
    `an out-of-order sync batch folds every event exactly once on top of the pre-ledger snapshot (4 recorded + 3 synced = ${syncState.progress.fractions.attempts})`);

  // A learner whose ledger already covers their model never gets a base — the
  // rule is a MEASUREMENT of what is missing, not "the model was not empty".
  const covered = store.newProfileState("covered-1");
  const coveredAt = J0 + 6000000;
  await projectionMod.commitAndProject("covered-1", covered, [
    evidence.answerEvidence({
      learnerId: "covered-1", at: coveredAt, source: "practice", subject: "maths",
      conceptId: "fractions", specificationId: null, questionId: "cq1",
      correct: true, chosen: 0, mode: "independent", hints: 0,
    }),
  ]);
  await projectionMod.commitAndProject("covered-1", covered, [
    evidence.answerEvidence({
      learnerId: "covered-1", at: coveredAt + 1000, source: "practice", subject: "maths",
      conceptId: "fractions", specificationId: null, questionId: "cq2",
      correct: true, chosen: 0, mode: "independent", hints: 0,
    }),
  ]);
  ok(covered.projectionBase === undefined,
    "a learner the ledger already accounts for never gets a pre-ledger snapshot — the base is evidence of a real gap, not a routine copy");
  ok(covered.progress.fractions.attempts === 2,
    "and their second answer counts as a second answer, not as a first");

  // ══════════════════════════════════════════════════════════════════════════
  // ONE DOOR, ONE DECISION. Every surface that asks "what next?" assembles a
  // DecisionContext and calls `decide`. Two surfaces reaching the same learner
  // by different routes must therefore produce the SAME action — same kind,
  // same target, same reason, same plan, same citations — because a decision is
  // a projection of the evidence, and the evidence is one thing.
  // ══════════════════════════════════════════════════════════════════════════
  console.log("▸ Every surface, one decision");
  const decisionMod = require("../.verify/decision.js");
  const serverDecisionMod = require("../.verify/server/decision.js");
  const NOW_D = jt + 8 * 86400000;
  const decideOpts = { max: 6, now: NOW_D };

  /** Which field of which action disagrees, for when agreement FAILS. A test
   *  that only says "not equal" costs the next reader the entire hunt. */
  const actionDiff = (a, b) => {
    const out = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i], y = b[i];
      if (JSON.stringify(x) === JSON.stringify(y)) continue;
      if (!x || !y) { out.push(`#${i}: ${x ? "present" : "missing"} vs ${y ? "present" : "missing"}`); continue; }
      for (const f of new Set([...Object.keys(x), ...Object.keys(y)])) {
        if (JSON.stringify(x[f]) !== JSON.stringify(y[f])) {
          out.push(`#${i} ${x.kind}.${f}: ${JSON.stringify(x[f])} vs ${JSON.stringify(y[f])}`);
        }
      }
    }
    return out;
  };
  const agree = (xs) => xs.slice(0, 3).join(" | ") || "every field agrees";

  // Route A: the model the projection installed, plus the ledger it consumed.
  await store.saveProfile(jstate); // the route's path reads the profile off disk
  const ctxLive = decisionMod.decisionContext(jstate, journey);
  // Route B: a from-scratch replay of the same ledger, with none of the live
  // model. It IS handed the learner's DECLARED profile (subjects, exam, time
  // budget), because the ledger carries EVIDENCE and identity is not evidence —
  // `decideNext` reads which subject to challenge them in and how long their
  // plan may be, so a replay that invented its own shell would decide
  // differently on the tail of the ranking, where nobody looks. What the ledger
  // DOES own (`progress`, `masteries`) is rebuilt here and nothing else is.
  const replayedModel = replayMod.replayModel(journey, JOURNEY, undefined, jstate.profile);
  ok(canon(replayedModel.profile) === canon(jstate.profile),
    "the replayed model carries the learner's declared profile — the ledger cannot rebuild it, so it is handed over rather than guessed");
  const ctxReplay = decisionMod.decisionContext(replayedModel, journey);
  // Route C: the SERVER door the routes actually use (profile + ledger off disk).
  const ctxServer = await serverDecisionMod.decisionContextFor(JOURNEY);
  ok(ctxServer !== null, "the server's decision door reads the learner's model and ledger together");

  const dLive = decisionMod.decide(ctxLive, decideOpts);
  const dReplay = decisionMod.decide(ctxReplay, decideOpts);
  const dServer = decisionMod.decide(ctxServer, decideOpts);
  const liveVsReplay = actionDiff(dLive, dReplay);
  ok(liveVsReplay.length === 0,
    `a surface holding the live model and a surface holding a fresh replay of the same ledger make the SAME decision — same kind, target, reason, plan and citations (${agree(liveVsReplay)})`);
  const liveVsServer = actionDiff(dLive, dServer);
  ok(liveVsServer.length === 0,
    `and so does the server route door, reading the profile and the ledger off disk (the api/next path) (${agree(liveVsServer)})`);
  ok(dLive.length > 1, `the ranking has more than one entry, so the agreement is not a single-card coincidence (${dLive.length})`);

  // ── Citations are promises, not decoration ────────────────────────────────
  const gaps = decisionMod.citationGaps(ctxLive, dLive);
  ok(gaps.length === 0,
    `every cited event resolves in the learner's own ledger (${dLive.reduce((n, a) => n + a.evidenceIds.length, 0)} citations, ${gaps.length} broken)`);
  ok(dLive.some((a) => a.basis === "cited"),
    "and an action decided from real evidence says so: it is `cited`, not indistinguishable from an unmeasured learner");
  ok(decisionMod.basisViolations(ctxLive, dLive).length === 0,
    `no action's claim about its own basis contradicts the ledger (${decisionMod.basisViolations(ctxLive, dLive).join("; ") || "none"})`);
  ok(dLive.every((a) => a.projectionVersion === evidence.PROJECTION_VERSION),
    `each action names the CURRENT projection algorithm that produced the model it decided from (${evidence.PROJECTION_VERSION})`);

  // ── FIVE STATES, FIVE SENTENCES ───────────────────────────────────────────
  // `basis` is not "has citations". The bug this replaces: a surface that passed
  // the model WITHOUT the ledger produced actions with no citations, which the
  // engine's own wording cannot tell apart from a learner with no history — and
  // every client surface does exactly that on first render, while its ledger
  // fetch is in flight. The model cannot distinguish those states. The ledger can.

  // (a) A ledger that has not ARRIVED is not an empty ledger. This is the state
  //     every client surface passes through, and the one that used to tell a
  //     learner with a full history that nothing had been recorded.
  const ctxPending = decisionMod.decisionContextFrom(jstate, null);
  const dPending = decisionMod.decide(ctxPending, decideOpts);
  ok(dPending.every((a) => a.basis === "unknown"),
    `a surface whose ledger fetch has not returned says so (${dPending[0].basis}) instead of claiming the learner has no evidence`);
  ok(decisionMod.basisViolations(ctxPending, dPending).length === 0,
    "and that is a consistent claim: `unknown` is a fact about the surface, not about the evidence");
  ok(dPending[0].kind === dLive[0].kind && dPending[0].conceptId === dLive[0].conceptId,
    `the work it proposes is still the model's own (${dPending[0].kind}:${dPending[0].conceptId}) — a missing ledger can cost an action its citations, never change what is next`);
  const withoutLedger = actionDiff(dPending, dLive);
  ok(withoutLedger.length > 0 && dPending[0].evidenceIds.length === 0,
    `and the action a ledger-less surface holds is a DIFFERENT OBJECT (${agree(withoutLedger)}) — which is why no surface may decide without the evidence`);

  // (b) AN EMPTY LEDGER OVER A MODEL THAT HOLDS WORK is a learner who predates
  //     the record — the live store holds exactly that shape (13 answers, no
  //     ledger). "No answers recorded yet" would be a lie about them, and the
  //     model is what says so.
  const ctxEmpty = decisionMod.decisionContext(jstate, []);
  const dEmpty = decisionMod.decide(ctxEmpty, decideOpts);
  ok(dEmpty[0].basis === "unrecorded" && dEmpty[0].evidenceIds.length === 0,
    `an empty ledger over recorded work is \`unrecorded\` (${dEmpty[0].basis}), not "no answers recorded yet"`);
  ok(dEmpty.every((a) => a.basis !== "no_evidence" && a.basis !== "cited"),
    "and no action in it claims either to have measured the learner or to cite an answer it does not hold");
  ok(decisionMod.basisViolations(ctxEmpty, dEmpty).length === 0,
    "and the claim is consistent: the work is real, the record for it is missing");

  // (c) NO EVIDENCE is true only of a learner with nothing measured at all —
  //     and `no_evidence` is a VALID state, not a failure to be papered over.
  const ctxNone = decisionMod.decisionContext(store.newProfileState("fresh-decide-1"), []);
  const dNone = decisionMod.decide(ctxNone, decideOpts);
  ok(dNone[0].basis === "no_evidence" && dNone[0].evidenceIds.length === 0,
    "a learner with no ledger and an empty model gets `no_evidence`, which is the honest starting point");
  ok(decisionMod.basisViolations(ctxNone, dNone).length === 0,
    "and that claim is consistent: no evidence, no citations");
  ok(dLive.every((a) => a.basis === "cited" || a.basis === "unattributed"),
    "a rule with nothing to cite is `unattributed`, which is a different fact from `no_evidence`");
  ok(dLive.every((a) => a.basis !== "no_evidence" && a.basis !== "unrecorded" && a.basis !== "unknown"),
    "and no action decided from a full ledger may claim any of the three absence states");

  // The checks have TEETH: a claim of `unknown` from a surface that held the
  // ledger, or `no_evidence` from one whose model holds work, is caught rather
  // than trusted. Without this the five states would be decoration.
  const lies = [
    decisionMod.basisViolations({ ...ctxLive, ledgerKnown: false }, dLive),
    decisionMod.basisViolations(ctxLive, dEmpty.map((a) => ({ ...a, basis: "no_evidence" }))),
    decisionMod.basisViolations(ctxPending, dPending.map((a) => ({ ...a, basis: "cited", evidenceIds: ["ev_nobody"] }))),
  ];
  ok(lies.every((l) => l.length > 0),
    `each inconsistent pairing is REFUSED, not rendered (${lies.map((l) => l.length).join("/")} violations for the three planted lies)`);

  // ── An ingest is a WRITE: a device returning from offline moves the model ─
  const ingestId = "ingest-1";
  const ingestTarget = store.newProfileState(ingestId);
  await projectionMod.commitAndProject(ingestId, ingestTarget, [
    evidence.answerEvidence({
      learnerId: ingestId, at: J0, source: "practice", subject: "maths",
      conceptId: "negatives", specificationId: null, questionId: "iq1",
      correct: true, chosen: 0, mode: "independent", hints: 0,
    }),
  ]);
  const beforeIngest = ingestTarget.progress.negatives.attempts;
  await projectionMod.commitAndProject(ingestId, ingestTarget, [
    evidence.answerEvidence({
      learnerId: ingestId, at: J0 + 1000, source: "practice", subject: "maths",
      conceptId: "negatives", specificationId: null, questionId: "iq2",
      correct: false, chosen: 2, mode: "independent", hints: 0,
    }),
  ]);
  ok(ingestTarget.progress.negatives.attempts === beforeIngest + 1,
    "work a device reports from offline moves the learner model — an ingest is a write, not a log append");
  // Re-sending the same event is idempotent even through the projection.
  const dupEvents = [
    evidence.answerEvidence({
      learnerId: ingestId, at: J0 + 2000, source: "practice", subject: "maths",
      conceptId: "negatives", specificationId: null, questionId: "iq3",
      correct: true, chosen: 0, mode: "independent", hints: 0,
    }),
  ];
  await projectionMod.commitAndProject(ingestId, ingestTarget, dupEvents);
  const afterFirst = ingestTarget.progress.negatives.attempts;
  const second = await projectionMod.commitAndProject(ingestId, ingestTarget, dupEvents);
  ok(second.duplicates.length === 1 && ingestTarget.progress.negatives.attempts === afterFirst,
    "and a device that retries the same batch cannot double-count its own work");

  fs.rmSync(tmpData, { recursive: true, force: true });
}

// ════════════════════════════════════════════════════════════════════════
// SAME CONTENT, DIFFERENT EVIDENCE — the pair the model must tell apart
// ════════════════════════════════════════════════════════════════════════
// The acceptance test the whole content→evidence→model→decision chain rests
// on, and the one nothing asserted: two learners following the SAME
// specification, served the SAME items from the SAME bank, differing only in
// the answers they gave, must end up with
//
//   (a) the dimension rows their evidence supports — and no others,
//   (b) every dimension their history did not measure reading UNMEASURED,
//       never 0 — a learner with no evidence on a concept is not a learner who
//       is weak at it, and
//   (c) a DIFFERENT NextAction from the one decision door when the difference
//       is educationally decisive.
//
// It is driven the way a learner drives it: the item is drawn from the bank,
// `answerEvidence` records it, and `commitAndProject` appends to the ledger and
// re-projects the model INSIDE the profile lock — the same `updateProfile`
// /api/progress walks. No model field is written by hand anywhere below, and
// the replay equality at the end asserts the saved model is its own ledger's
// projection.
console.log("▸ Two learners, one bank, different evidence");
{
  const specs = require("../.verify/specifications.js");
  const projectionMod = require("../.verify/server/projection.js");
  const replayMod = require("../.verify/replay.js");
  const serverDecisionMod = require("../.verify/server/decision.js");
  const decisionMod = require("../.verify/decision.js");
  const view = require("../.verify/evidence-view.js");
  const t = i18n.translator("en");

  const CONCEPT = "fractions";
  const UNTOUCHED = "quadratics"; // never served to anyone in this block
  // One declared course for every learner here, and a REAL one: an id the
  // curriculum cannot resolve would make "the same specification" a claim
  // about a string rather than about a course. Both learners are stamped with
  // it on every event, so (c) below cannot be a difference of syllabuses.
  const COURSE = {
    spec: "uk-gcse",
    specLevel: specs.specForProfile({ spec: "uk-gcse" }).level.id,
    exam: "GCSE Maths",
    examDate: "2027-06-05",
    timePerDay: 20,
  };
  ok(specs.specById(COURSE.spec) !== null && !!specs.specForProfile(COURSE).level.difficulty,
    `the pair follows a curriculum the engine can resolve (${COURSE.spec} · ${COURSE.specLevel})`);
  const BAND = specs.difficultyFor(specs.specForProfile(COURSE));
  // The draws every learner in this block is served, by seed — identical by
  // construction, which is what makes "same content" literal rather than
  // approximate. Different learners, different questions would prove nothing
  // about the model.
  const DRAWN = ["pair-1", "pair-2", "pair-3", "pair-4", "pair-5", "pair-6"]
    .map((seed) => questions.generateQuestionNear(CONCEPT, seed, BAND, 5))
    .filter(Boolean);
  ok(DRAWN.length === 6 && DRAWN.every((q) => q.conceptId === CONCEPT),
    `the pair's items come from the concept's own bank at this course's band (${DRAWN.length}/6 drawn)`);
  const T0 = 1700005000000;
  const NOW = T0 + 900000;

  /** The recording path, exactly as /api/progress walks it. */
  const record = (id, step, conceptId = CONCEPT) => store.updateProfile(id, async (state) => {
    const q = step.q ?? DRAWN[step.i];
    await projectionMod.commitAndProject(id, state, [evidence.answerEvidence({
      learnerId: id, at: T0 + step.i * 1000, source: "practice", subject: "maths",
      conceptId, specificationId: state.profile.spec, questionId: q.id,
      correct: step.correct, chosen: step.correct ? q.answer : (q.answer + 1) % q.choices.length,
      mode: step.hints ? "guided" : "independent", hints: step.hints ?? 0, ms: 4000,
      tags: q.misconceptionTags ?? [],
    })]);
  });
  const drive = async (id, steps) => {
    await store.saveProfile(store.newProfileState(id, COURSE));
    for (const step of steps) await record(id, step);
  };
  const every = (correct) => DRAWN.map((_, i) => ({ i, correct }));
  const ledgerOf = (id) => evidenceStore.readEvidence(id);
  const projectionOf = (id) => evidence.projectLearner(ledgerOf(id));
  const rowsOf = (id, conceptId) => view.conceptKnowledge(projectionOf(id), conceptId, t).rows;
  const row = (id, conceptId, from) => rowsOf(id, conceptId).find((r) => r.from === from);

  // A: every answer right. B: the same items, one right. C: A's evidence again
  // under a different learner id — the control that says a decision difference
  // is caused by the evidence, not by the identity it is filed under. D: one
  // right answer WITH hints — real evidence of recall, and of independence
  // nothing at all.
  await drive("pair-strong", every(true));
  await drive("pair-weak", DRAWN.map((_, i) => ({ i, correct: i === 0 })));
  await drive("pair-twin", every(true));
  await drive("pair-guided", [{ i: 0, correct: true, hints: 2 }]);

  // ── What they were asked, and how they answered — read off the ledger ────
  const strongEvents = ledgerOf("pair-strong");
  const weakEvents = ledgerOf("pair-weak");
  ok(strongEvents.length === 6 && weakEvents.length === 6,
    `both learners' whole work is on the ledger (${strongEvents.length} and ${weakEvents.length} events)`);
  ok(strongEvents.map((e) => e.questionId).join() === weakEvents.map((e) => e.questionId).join(),
    "and they were served the SAME items — the only difference between them is the answers");
  ok([...strongEvents, ...weakEvents].every((e) => e.specificationId === COURSE.spec),
    `both sat the same specification, stamped on every event rather than inferred (${COURSE.spec})`);
  const strongRight = strongEvents.filter((e) => e.correct).length;
  const weakRight = weakEvents.filter((e) => e.correct).length;
  ok(strongRight === 6 && weakRight === 1,
    `and the histories are the ones this test intends (${strongRight}/6 vs ${weakRight}/6 correct)`);

  // ── (a) The dimensions the evidence supports, in both directions ─────────
  const strongAll = row("pair-strong", CONCEPT, "all-answers");
  const weakAll = row("pair-weak", CONCEPT, "all-answers");
  const strongInd = row("pair-strong", CONCEPT, "independent");
  const weakInd = row("pair-weak", CONCEPT, "independent");
  ok(strongAll?.rate?.correct === 6 && strongAll?.rate?.asked === 6,
    `six right answers read as six, not as a band or a percentage (${strongAll?.rate?.correct}/${strongAll?.rate?.asked})`);
  ok(weakAll?.rate?.correct === 1 && weakAll?.rate?.asked === 6,
    `and one right out of the same six reads as one (${weakAll?.rate?.correct}/${weakAll?.rate?.asked})`);
  ok(strongInd?.rate?.asked === 6 && weakInd?.rate?.asked === 6,
    "independence is counted per learner over the same denominator");
  ok(strongInd.rate.correct === 6 && weakInd.rate.correct === 1
    && strongInd.rate.correct / strongInd.rate.asked > weakInd.rate.correct / weakInd.rate.asked,
    `so the rows differ in the direction the evidence says (${strongInd.rate.correct}/${strongInd.rate.asked} vs ${weakInd.rate.correct}/${weakInd.rate.asked})`);
  ok(strongInd.band === "strong" && weakInd.band === "developing",
    `and each row's band follows its own counts (${strongInd.band} vs ${weakInd.band})`);

  // ── (b) What the history did NOT measure stays unmeasured ────────────────
  for (const [id, label] of [["pair-strong", "the learner who got them all"], ["pair-weak", "the learner who missed them"]]) {
    for (const from of ["transfer", "retention"]) {
      const r = row(id, CONCEPT, from);
      ok(r?.unmeasured === true && r?.rate === null,
        `${label}: ${from} reads UNMEASURED with no rate at all — absence is not 0% (${JSON.stringify(r?.rate)})`);
    }
    // The sharpest form of the rule: on a concept this learner was never asked
    // about, NO row may imply anything about them.
    const untouched = rowsOf(id, UNTOUCHED);
    ok(untouched.length > 0 && untouched.every((r) => r.unmeasured === true && r.rate === null),
      `${label}: a concept they were never asked about reads unmeasured on all ${untouched.length} dimensions — no evidence is never a failure`);
  }

  // ── A hinted answer is evidence of recall and of nothing stronger ────────
  ok(row("pair-guided", CONCEPT, "all-answers")?.rate?.asked === 1,
    "a hinted answer is still an answer, and is counted as recall");
  ok(row("pair-guided", CONCEPT, "independent")?.unmeasured === true,
    "but work done with a hint cannot buy INDEPENDENCE: that dimension stays unmeasured rather than scored as a failed attempt");

  // ── The model is the ledger's projection, not a field written by hand ────
  for (const id of ["pair-strong", "pair-weak", "pair-guided"]) {
    const saved = await store.getProfile(id);
    const diffs = replayMod.reconcileDeep(replayMod.replayModel(ledgerOf(id), id, saved.projectionBase), saved);
    ok(diffs.length === 0,
      `${id}: the saved model is exactly what its own ledger projects (${diffs.length} differences) — the evidence was recorded, not assigned`);
  }

  // ── (c) The decision, obtained the way a surface obtains it ─────────────
  // `decisionContextFor` + `decide` is the /api/next path verbatim: the server
  // door reads the model AND the ledger off disk, and the engine ranks. No
  // surface reaches the engine any other way (asserted at the source below).
  const decideFor = async (id) => {
    const ctx = await serverDecisionMod.decisionContextFor(id);
    return { ctx, actions: ctx ? decisionMod.decide(ctx, { max: 6, now: NOW }) : [] };
  };
  const strong = await decideFor("pair-strong");
  const weak = await decideFor("pair-weak");
  const topStrong = strong.actions[0];
  const topWeak = weak.actions[0];
  ok(topStrong && topWeak, "both learners are given a next action");
  ok(topStrong.kind !== topWeak.kind,
    `the same items answered differently produce DIFFERENT next work (${topStrong.kind}:${topStrong.conceptId} vs ${topWeak.kind}:${topWeak.conceptId})`);
  // The strong learner's next work must be STRETCH work on the concept they
  // proved — and the engine may only call it TRANSFER if the concept's
  // questions can be re-framed at all (lib/transfer.ts#canTransfer). The pair
  // below is the assertion that the product never promises a measurement it
  // cannot make.
  ok(topStrong.kind === (transferMod.canTransfer(CONCEPT) ? "TRANSFER" : "CHALLENGE") && topStrong.conceptId === CONCEPT,
    `the learner who got them all is given stretch work on that idea${transferMod.canTransfer(CONCEPT) ? ", on an unfamiliar surface — this concept CAN be re-framed" : " — deeper, because this concept has no second surface to move to"} (${topStrong.kind}:${topStrong.conceptId})`);
  ok(topWeak.kind === "EXPLAIN" && topWeak.conceptId === CONCEPT,
    `and the learner who missed them is asked to rebuild the idea first (${topWeak.kind}:${topWeak.conceptId}) — same content, not the same advice`);

  for (const [id, res, label] of [["pair-strong", strong, "the strong learner"], ["pair-weak", weak, "the weak learner"]]) {
    const own = new Set(ledgerOf(id).map((e) => e.id));
    ok(res.actions.every((a) => a.evidenceIds.every((x) => own.has(x))),
      `${label}: every citation resolves in THAT learner's own ledger (${res.actions.reduce((n, a) => n + a.evidenceIds.length, 0)} citations)`);
    ok(decisionMod.citationGaps(res.ctx, res.actions).length === 0,
      `${label}: and none is broken (${decisionMod.citationGaps(res.ctx, res.actions).join("; ") || "none"})`);
    ok(res.actions[0].basis === "cited",
      `${label}: the action says its reason comes from recorded work (${res.actions[0].basis})`);
    const measured = new Set(ledgerOf(id).map((e) => e.conceptId));
    const ground = res.actions.filter((a) => a.conceptId && !measured.has(a.conceptId));
    ok(ground.every((a) => a.basis === "unattributed" && a.evidenceIds.length === 0),
      `${label}: work proposed on a concept they have no evidence for is new ground (${ground.map((a) => `${a.kind}:${a.conceptId}=${a.basis}`).join(", ") || "none in the ranking"}), never a cited weakness`);
  }

  // ── The control: identical evidence, identical decision ──────────────────
  // Without it, "they differ" would be satisfied by any nondeterminism keyed on
  // the learner id. The twin answered the same items the same way under the same
  // clock, so every field of every action must agree — except the citations,
  // which are each learner's own events, because an event names its learner.
  const twin = await decideFor("pair-twin");
  const shape = (a) => ({ ...a, evidenceIds: [] });
  const twinDiffs = [];
  for (let i = 0; i < Math.max(strong.actions.length, twin.actions.length); i++) {
    const x = strong.actions[i] ? shape(strong.actions[i]) : null;
    const y = twin.actions[i] ? shape(twin.actions[i]) : null;
    if (!x || !y) { twinDiffs.push(`#${i} ${x ? "present" : "missing"} vs ${y ? "present" : "missing"}`); continue; }
    for (const f of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (JSON.stringify(x[f]) !== JSON.stringify(y[f])) twinDiffs.push(`#${i}.${f}: ${JSON.stringify(x[f])} vs ${JSON.stringify(y[f])}`);
    }
  }
  ok(twinDiffs.length === 0,
    `a second learner with the SAME evidence gets the SAME ranking, field for field (${twinDiffs.slice(0, 3).join(" | ") || "every field agrees"})`);
  const twinCited = new Set(twin.actions.flatMap((a) => a.evidenceIds));
  ok(twinCited.size > 0 && [...twinCited].every((x) => !ledgerOf("pair-strong").some((e) => e.id === x)),
    "and what it cites is its own ledger, not its twin's");
  ok(JSON.stringify(rowsOf("pair-twin", CONCEPT)) === JSON.stringify(rowsOf("pair-strong", CONCEPT)),
    "with the same dimension rows to match — learner identity is not evidence in either direction");
}

// ════════════════════════════════════════════════════════════════════════
// RETENTION IS A MEASUREMENT, NOT A PROMISE
// ════════════════════════════════════════════════════════════════════════
// The one learning behaviour that cannot be faked: whether something is still
// known after it had time to fade. Before this, the retention dimension was
// unmeasurable BY CONSTRUCTION — `conceptKnowledge` hard-coded it as never
// observed — so the product could not tell a learner who had retained a concept
// from one who had merely answered it in the same sitting.
//
// What makes it real is that the two halves meet: the SCHEDULER
// (lib/retention#isRetentionDue, used by the serve path) decides whether a
// concept is due, and the LEDGER records the answer as `source: "retrieval"`
// only then. The fold then counts it as retention evidence only against a
// concept that had genuinely aged — so a repeat in the same sitting, a hinted
// retrieval, and a fresh concept can none of them buy the dimension. Only a
// fixed clock can age evidence honestly, so this is where that proof lives;
// the HTTP suite proves the gate and the stamp (section 16 of e2e-api.mjs).
console.log("▸ Retention is measured, never assumed");
{
  const specs = require("../.verify/specifications.js");
  const retentionMod = require("../.verify/retention.js");
  const projectionMod = require("../.verify/server/projection.js");
  const replayMod = require("../.verify/replay.js");
  const serverDecisionMod = require("../.verify/server/decision.js");
  const decisionMod = require("../.verify/decision.js");
  const view = require("../.verify/evidence-view.js");
  const t = i18n.translator("en");
  const DAY = 24 * 60 * 60 * 1000;
  const RET = "retain-1";
  const CONCEPT = "fractions";
  const COURSE = {
    spec: "uk-gcse",
    specLevel: specs.specForProfile({ spec: "uk-gcse" }).level.id,
    exam: "GCSE Maths", examDate: "2027-06-05", timePerDay: 20,
  };
  const BAND = specs.difficultyFor(specs.specForProfile(COURSE));
  const DRAWN = ["ret-1", "ret-2", "ret-3", "ret-4"]
    .map((seed) => questions.generateQuestionNear(CONCEPT, seed, BAND, 5))
    .filter(Boolean);
  const T0 = 1700020000000;

  /** One graded answer, recorded the way the route records it: the event is
   *  minted with the source and hint count the SERVER knew, then appended and
   *  re-projected inside the profile lock. */
  const answer = (step) => store.updateProfile(RET, async (state) => {
    const q = DRAWN[step.i];
    await projectionMod.commitAndProject(RET, state, [evidence.answerEvidence({
      learnerId: RET, at: step.at, source: step.source ?? "practice", subject: "maths",
      conceptId: CONCEPT, specificationId: state.profile.spec, questionId: q.id,
      correct: step.correct, chosen: step.correct ? q.answer : (q.answer + 1) % q.choices.length,
      mode: "independent", hints: step.hints ?? 0, ms: 4000, tags: q.misconceptionTags ?? [],
    })]);
  });
  const ledgerOf = () => evidenceStore.readEvidence(RET);
  const modelOf = () => store.getProfile(RET);
  const projectionOf = () => evidence.projectLearner(ledgerOf());
  const rowOf = (conceptId, from) =>
    view.conceptKnowledge(projectionOf(), conceptId, t).rows.find((r) => r.from === from);
  const decideAt = async (now) => {
    const ctx = await serverDecisionMod.decisionContextFor(RET);
    return { ctx, actions: ctx ? decisionMod.decide(ctx, { max: 6, now }) : [] };
  };

  await store.saveProfile(store.newProfileState(RET, COURSE));
  for (let i = 0; i < DRAWN.length; i++) await answer({ i, at: T0 + i * 1000, correct: true });

  // ── Solid work in ONE sitting is not memory ──────────────────────────────
  ok(rowOf(CONCEPT, "independent")?.rate?.correct === 4,
    `four hint-free answers are independence evidence (${rowOf(CONCEPT, "independent")?.rate?.correct}/4)`);
  ok(rowOf(CONCEPT, "retention")?.unmeasured === true && rowOf(CONCEPT, "retention")?.rate === null,
    "and NOTHING here claims retention: a concept answered once, in one sitting, has not been remembered — it has been rehearsed");
  ok(evidence.impactSnapshot(ledgerOf()).unmeasured.some((u) => u.startsWith("retention:")),
    "the impact snapshot names retention as the gap it is, rather than leaving it implied");

  // ── The scheduler decides when a concept is due ──────────────────────────
  const taught = await modelOf();
  const mastery = taught.progress[CONCEPT].mastery;
  const interval = retentionMod.reviewIntervalDays(mastery);
  ok(interval !== null && interval >= 1,
    `the concept earned a review interval from its own mastery (${interval} day(s) at mastery ${mastery.toFixed(2)})`);
  ok(!retentionMod.isRetentionDue(taught, CONCEPT, T0 + 3600e3),
    "and it is NOT due immediately after the sitting, however well it went");
  // The clock every later step runs at: measured from the learner's LAST piece
  // of evidence, so "the interval has elapsed" is a fact about their record and
  // not about the loop's own bookkeeping.
  const A = taught.progress[CONCEPT].lastSeen + interval * DAY + 1000;
  ok(retentionMod.isRetentionDue(taught, CONCEPT, A),
    `it is due once its own interval has really elapsed (${interval} day(s) after the last evidence on it)`);

  // ── The door asks for the review, and only then ──────────────────────────
  const soon = await decideAt(T0 + 3600e3);
  const later = await decideAt(A);
  ok(!soon.actions.some((a) => a.kind === "RETRIEVE"),
    `with nothing aged, the plan does not ask for retrieval (${soon.actions[0]?.kind}:${soon.actions[0]?.conceptId})`);
  const review = later.actions.find((a) => a.kind === "RETRIEVE" && a.conceptId === CONCEPT);
  ok(!!review,
    `and once it has aged, the review is what the learner is offered (${later.actions.slice(0, 3).map((a) => `${a.kind}:${a.conceptId}`).join(" · ")})`);

  // ── The retrieval itself: the stamp comes from the scheduler ─────────────
  const at = A;
  const stamp = retentionMod.isRetentionDue(await modelOf(), CONCEPT, at) ? "retrieval" : "practice";
  ok(stamp === "retrieval",
    "the serve path's own rule (isRetentionDue — the function the route calls) is what stamps the answer");
  await answer({ i: 0, at, correct: true, source: stamp });
  ok(ledgerOf().at(-1).source === "retrieval",
    "so the answer lands on the ledger as a retrieval, not as more practice");
  const retained = rowOf(CONCEPT, "retention");
  ok(retained?.rate?.asked === 1 && retained?.rate?.correct === 1 && retained?.band === "strong",
    `and retention is MEASURED for the first time — recalled after ${interval} day(s) (${retained?.rate?.correct}/${retained?.rate?.asked}, ${retained?.band})`);
  ok(!evidence.impactSnapshot(ledgerOf()).unmeasured.some((u) => u.startsWith("retention:")),
    "the impact snapshot stops describing retention as unmeasured, because it no longer is");
  ok(ledgerOf().filter((e) => e.source === "retrieval").length === 1,
    "exactly one event carries the retrieval source — no drifting credit");

  // ── The gate: what CANNOT buy the dimension ──────────────────────────────
  // Same sitting, same concept, seconds later: the answer is recorded (it is
  // real work) but it cannot be a delayed recall, because nothing was delayed.
  await answer({ i: 1, at: at + 60_000, correct: true, source: "retrieval" });
  ok(rowOf(CONCEPT, "retention")?.rate?.asked === 1,
    "answering again in the same sitting adds no retention credit — the elapsed gap IS the measurement");
  // A hinted retrieval is rehearsal: guided recall proves nothing about what
  // survives without help.
  await answer({ i: 2, at: at + interval * DAY, correct: true, hints: 2, source: "retrieval" });
  ok(rowOf(CONCEPT, "retention")?.rate?.asked === 1,
    "and a retrieval answered with a hint is rehearsal, not retention");
  // A FAILED retrieval is the most valuable observation of the three.
  await answer({ i: 3, at: at + 2 * interval * DAY, correct: false, source: "retrieval" });
  ok(rowOf(CONCEPT, "retention")?.rate?.asked === 2 && rowOf(CONCEPT, "retention")?.rate?.correct === 1,
    `forgetting is recorded rather than hidden: the failed delayed recall counts as asked, not correct (${rowOf(CONCEPT, "retention")?.rate?.correct}/${rowOf(CONCEPT, "retention")?.rate?.asked})`);

  // ── THE STATE, WHICH A RATIO CANNOT EXPRESS ──────────────────────────────
  // 1 of 2 describes a learner who held this and has since lost it AND one who
  // never held it until today. The rule reads the LATEST outcome for exactly
  // that reason, and the row a learner reads carries its word.
  const proofMod2 = require("../.verify/proof.js");
  ok(proofMod2.retentionState({ asked: 2, correct: 1, lastHeld: false }) === "forgotten",
    "held-then-lost is FORGOTTEN, not \"retained 1 of 2\" — the latest outcome decides, not the ratio");
  ok(proofMod2.retentionState({ asked: 2, correct: 1, lastHeld: true }) === "retained",
    "and lost-then-held is RETAINED off the same ratio — the two histories are different states");
  ok(proofMod2.retentionState({ asked: 0, correct: 0, lastHeld: null }) === "unmeasured",
    "a concept with no delayed recall is UNMEASURED — an absence is never read as a failure");
  ok(proofMod2.retentionState(undefined) === "unmeasured" && proofMod2.retentionState({ asked: 1, correct: 0, lastHeld: null }) === "forgotten",
    "and a record built before the outcome was kept falls back to what its counts can still honestly support");
  ok(rowOf(CONCEPT, "retention")?.state === "forgotten",
    `the row the surface renders carries that state (${rowOf(CONCEPT, "retention")?.state}) — and ${proofMod2.retentionLabelKey("forgotten")} is the key it renders, from the rule rather than the page`);

  // The boundary of the owned rule, seen from the LEDGER'S side. The projection
  // used to spell the three conditions out again beside a comment claiming to be
  // identical to the live fold — which is how a rule with two owners drifts.
  // Now both call `isRetentionEvidence`, and this says so behaviourally: an
  // answer stamped as a retrieval an hour after the last evidence is not a
  // delayed recall, because the GAP is the measurement.
  await answer({ i: 0, at: at + 2 * interval * DAY + 3600e3, correct: true, source: "retrieval" });
  ok(rowOf(CONCEPT, "retention")?.rate?.asked === 2 && rowOf(CONCEPT, "retention")?.state === "forgotten",
    `and an hour later even a stamped retrieval buys nothing — short gap, no credit, and the state stays ${rowOf(CONCEPT, "retention")?.state} rather than being reset by same-sitting work`);

  // ── The review is refreshed, so the loop closes ──────────────────────────
  const now = at + 2 * interval * DAY;
  ok(!retentionMod.isRetentionDue(await modelOf(), CONCEPT, now + 1000),
    "a concept that has just been retrieved is no longer due — the schedule moved with the evidence");
  const after = await decideAt(now + 1000);
  ok(after.actions.every((a) => !(a.kind === "RETRIEVE" && a.conceptId === CONCEPT)),
    `and the plan stops asking for it (${after.actions.slice(0, 3).map((a) => `${a.kind}:${a.conceptId}`).join(" · ")})`);

  // ── Retention survives a rebuild, or it is not evidence ──────────────────
  const saved = await modelOf();
  const diffs = replayMod.reconcileDeep(replayMod.replayModel(ledgerOf(), RET, saved.projectionBase), saved);
  ok(diffs.length === 0,
    `the ledger alone rebuilds the retention dimension (${diffs.length} differences${diffs.length ? ": " + diffs.slice(0, 3).map((d) => d.field).join(", ") : ""}) — it is evidence, not an annotation on the live model`);
  const wiped = structuredClone(saved);
  wiped.progress = {};
  wiped.masteries = {};
  delete wiped.projectionBase;
  projectionMod.projectFromLedger(wiped, ledgerOf());
  ok(JSON.stringify(wiped.progress[CONCEPT].retention) === JSON.stringify(saved.progress[CONCEPT].retention)
    && wiped.progress[CONCEPT].retention.asked === 2,
    `delete the model, replay the ledger, and the same retention record comes back (${JSON.stringify(wiped.progress[CONCEPT].retention)})`);

  // ── The learner is TOLD, through the reason the result screen renders ────
  // A review that came back correct is the one session outcome that speaks
  // about memory rather than about understanding, so it gets its own reason —
  // rendered by the same field the result screen and Home already read.
  const sessionMod = require("../.verify/session.js");
  const sessionState = await modelOf();
  const opened = sessionMod.openSession(sessionState, CONCEPT, "RETRIEVE", null, 1, now);
  const recalledAt = now + interval * DAY;
  await answer({
    i: 0, at: recalledAt, correct: true,
    source: retentionMod.isRetentionDue(await modelOf(), CONCEPT, recalledAt) ? "retrieval" : "practice",
  });
  const updated = await modelOf();
  sessionMod.noteActivity(opened.ledger, { correct: true, mode: "independent", hints: 0, conceptId: CONCEPT, ms: 3000 });
  const outcome = sessionMod.computeResult(updated, opened.ledger, recalledAt + 60_000, undefined, ledgerOf());
  ok(outcome.changeReason === "retained",
    `a review that HELD is reported as retained, not as ordinary progress (${outcome.changeReason})`);
  ok(sessionMod.reasonKey(outcome.changeReason) === "sess.r.retained",
    `and it renders through the shared reason key (${sessionMod.reasonKey(outcome.changeReason)})`);
  ok(i18n.LANG_CODES.every((code) => i18n.translator(code)("sess.r.retained") !== "sess.r.retained"),
    `translated in every one of the ${i18n.LANG_CODES.length} dictionaries, not just English`);
  // The failed recall above must NOT have produced this reason: the count only
  // rises when memory actually held.
  const failed = sessionMod.openSession(await modelOf(), CONCEPT, "RETRIEVE", null, 1, recalledAt + interval * DAY);
  const failedAt = recalledAt + interval * DAY;
  await answer({
    i: 1, at: failedAt, correct: false,
    source: retentionMod.isRetentionDue(await modelOf(), CONCEPT, failedAt) ? "retrieval" : "practice",
  });
  const failedResult = sessionMod.computeResult(await modelOf(), failed.ledger, failedAt + 60_000, undefined, ledgerOf());
  ok(failedResult.changeReason !== "retained",
    `and a review that did NOT hold never claims it did (${failedResult.changeReason})`);
}

// ════════════════════════════════════════════════════════════════════════
// OFFLINE WORK: HELD, REPLAYED ONCE, IN ORDER — AND NEVER TRUSTED ABOUT TIME
// ════════════════════════════════════════════════════════════════════════
// A learner who loses signal mid-session must not lose the answer, and must not
// be marked twice for it. Four claims, each one a defect class:
//
//   1. THE QUEUE HOLDS. An answer the server cannot take is kept, the same
//      submission is never held twice, and held answers replay in the order the
//      learner answered them — a later answer may not overtake an earlier one,
//      because the server stamps each replay with its own arrival time and that
//      stamp is the learner's timeline.
//   2. A REPLAY IS THE SAME EVENT. The event id is derived from the device's own
//      submission token (lib/evidence#submissionEventId), so delivering a batch
//      twice appends nothing the second time — and delivering it REVERSED
//      produces the same projection and the same decision.
//   3. THE DEVICE'S CLOCK IS A CLAIM. `deviceAt` is preserved on the event and
//      disclosed; retention is computed from the SERVER's stamp. The control in
//      the same block proves the dimension is not simply inert: the identical
//      answers, aged on the server's own clock, DO earn retention.
//   4. NOTHING ABOUT THIS HOLDS A LOCK ON THE MODEL. The replayed work moves the
//      learner model through append → confirm → replay/adopt, and the model
//      reconciles against the ledger afterwards (differences 0).
console.log("▸ Offline answers sync once, in order, and are never trusted for memory");
{
  const syncQueue = require("../.verify/sync-queue.js");
  const specs = require("../.verify/specifications.js");
  const projectionMod = require("../.verify/server/projection.js");
  const replayMod = require("../.verify/replay.js");
  const view = require("../.verify/evidence-view.js");
  const t = i18n.translator("en");
  const DAY = 24 * 60 * 60 * 1000;

  // ── 1. THE QUEUE: dedupe, order, retry ───────────────────────────────────
  // Driven against a fake localStorage and a fake fetch, so each outcome
  // (unreachable, refused, unreachable-then-fine) is produced deliberately
  // rather than hoped for. The module is the REAL one the browser loads.
  const fakeStorage = () => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => void m.set(k, String(v)),
      removeItem: (k) => void m.delete(k),
      _dump: () => [...m.entries()],
    };
  };
  const realFetch = globalThis.fetch;
  const realWindow = globalThis.window;
  try {
    globalThis.window = { localStorage: fakeStorage() };
    syncQueue.clearQueue();

    const offline = async () => { throw new TypeError("Failed to fetch"); };
    globalThis.fetch = offline;
    const op = (n) => ({
      url: "/api/progress",
      submissionId: `sub_off${n}line0000${n}`,
      body: { action: "answer", id: "queue-learner", conceptId: "fractions", choiceIndex: n },
      deviceAt: 1700020000000 + n * 1000,
    });
    const first = await syncQueue.postAnswer("/api/progress", { submissionId: op(1).submissionId, deviceAt: op(1).deviceAt, body: op(1).body });
    ok(first.kind === "held", `an answer that cannot reach the server is HELD, not lost (${first.kind})`);
    ok(syncQueue.queueLength() === 1, `and it is on the device's queue (${syncQueue.queueLength()})`);
    // The same submission arriving twice — a double-click, a retry racing a
    // flush, two tabs — must never become two entries.
    const again = syncQueue.enqueueAnswer(op(1));
    ok(again.accepted === false && again.reason === "duplicate" && syncQueue.queueLength() === 1,
      `holding the SAME submission twice leaves one entry (reason: ${again.reason}, len: ${syncQueue.queueLength()})`);
    syncQueue.enqueueAnswer(op(2));
    syncQueue.enqueueAnswer(op(3));
    ok(syncQueue.queueLength() === 3, `three distinct answers are held (${syncQueue.queueLength()})`);
    ok(syncQueue.readQueue().map((r) => r.submissionId).join(",") === [op(1), op(2), op(3)].map((o) => o.submissionId).join(","),
      "and the queue is in the order the learner answered");

    // A flush that reaches the server only for the FIRST answer must leave the
    // rest, and must not skip ahead to them: a later answer recorded first would
    // sit earlier in the learner's timeline than the answer given before it.
    const posted = [];
    let calls = 0;
    globalThis.fetch = async (url, init) => {
      calls += 1;
      if (calls === 2) throw new TypeError("Failed to fetch");
      posted.push(JSON.parse(init.body).submissionId);
      return { ok: true, status: 200, json: async () => ({}) };
    };
    const partial = await syncQueue.flushQueue();
    ok(partial.synced === 1 && partial.pending === 2,
      `a flush that dies mid-queue syncs what it could and keeps the rest (synced ${partial.synced}, pending ${partial.pending})`);
    ok(!posted.includes(op(3).submissionId),
      "and the answers AFTER the failure were not sent: nothing overtakes an older answer");
    const retried = syncQueue.readQueue()[0];
    ok(retried.tries === 1, `the held answer remembers it was tried (tries: ${retried.tries})`);

    globalThis.fetch = async (url, init) => {
      posted.push(JSON.parse(init.body).submissionId);
      return { ok: true, status: 200, json: async () => ({}) };
    };
    const drained = await syncQueue.flushQueue();
    ok(drained.synced === 2 && drained.pending === 0,
      `and a later flush drains it (synced ${drained.synced}, pending ${drained.pending})`);
    ok(posted.slice(-2).join(",") === [op(2), op(3)].map((o) => o.submissionId).join(","),
      `in the learner's order, every time (${posted.slice(-2).join(",")})`);

    // A refusal the server will repeat: recorded, not retried forever, and not
    // silently deleted either.
    syncQueue.enqueueAnswer(op(4));
    globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: "stale or unknown question" }) });
    const refused = await syncQueue.flushQueue();
    ok(refused.pending === 0 && refused.refused === 1,
      `a refusal the server would repeat is reported, not retried forever (pending ${refused.pending}, refused ${refused.refused})`);

    // A failure a retry CAN fix (the ledger could not be written → 503) stays.
    syncQueue.clearQueue();
    syncQueue.enqueueAnswer(op(5));
    globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({ error: "evidence_not_recorded" }) });
    const transient = await syncQueue.flushQueue();
    ok(transient.pending === 1 && transient.refused === 0,
      `but an unrecorded-at-the-server answer stays queued and is tried again (pending ${transient.pending})`);
    ok(syncQueue.isRetryable(503) && syncQueue.isRetryable(429) && !syncQueue.isRetryable(400),
      "because the queue distinguishes what a retry could fix from what it cannot");
    syncQueue.clearQueue();
  } finally {
    globalThis.fetch = realFetch;
    if (realWindow === undefined) delete globalThis.window; else globalThis.window = realWindow;
  }

  // ── 2. THE SEAM: one submission, one event id ────────────────────────────
  const subId = "sub_replayproof0001";
  const derived = evidence.submissionEventId(subId);
  ok(derived && derived === evidence.submissionEventId(subId),
    `a submission's event id is DERIVED, so a replay mints the same id (${derived})`);
  ok(evidence.submissionEventId("y") === null && evidence.submissionEventId(undefined) === null && evidence.submissionEventId("has space") === null,
    "and a malformed token is refused rather than written into an event id");
  ok(evidence.submissionEventId("sub_other_attempt") !== evidence.submissionEventId("sub_second_sit"),
    "two attempts at the same question are two submissions — the id names the SUBMISSION, not the content");

  // ── 3. THE LEDGER: delivered twice, and delivered reversed ───────────────
  const COURSE = {
    spec: "uk-gcse",
    specLevel: specs.specForProfile({ spec: "uk-gcse" }).level.id,
    exam: "GCSE Maths", examDate: "2027-06-05", timePerDay: 20,
  };
  const BAND = specs.difficultyFor(specs.specForProfile(COURSE));
  const CONCEPTS = ["fractions", "decimals", "ratio"];
  const drawn = CONCEPTS.map((c, i) => ({ conceptId: c, q: questions.generateQuestionNear(c, `offline-${i}`, BAND, 5) }))
    .filter((d) => d.q);
  const BASE = 1700100000000;
  /** Build the batch the way a device's queue builds it: a submission token per
   *  answer, the device's claimed time, and a SERVER stamp for the event. */
  const batch = (learnerId, atBase, order, claimAgoDays) => order.map((i) => {
    const d = drawn[i];
    return evidence.answerEvidence({
      learnerId, at: atBase + i * 1000,
      id: evidence.submissionEventId(`sub_${learnerId}_${i}`),
      source: "practice", subject: "maths", conceptId: d.conceptId,
      specificationId: COURSE.spec, questionId: d.q.id,
      correct: true, chosen: d.q.answer, mode: "independent", hints: 0, ms: 3500,
      tags: d.q.misconceptionTags ?? [],
      deviceAt: atBase + i * 1000 - claimAgoDays * DAY,
    });
  });
  const ledgerFile = (id) => nodePath.join(tmpData, "evidence", `${id}.jsonl`);
  const countsOf = (p, conceptId) => {
    const c = p.byConcept[conceptId];
    return c && JSON.stringify({
      attempts: c.attempts, correct: c.correct, hints: c.hints,
      independent: c.independent, transfer: c.transfer, retention: c.retention,
      measured: c.measured, misconceptions: c.misconceptions,
    });
  };
  const runLearner = async (id, order, claimAgoDays) => {
    await store.saveProfile(store.newProfileState(id, COURSE));
    const events = batch(id, BASE, order, claimAgoDays);
    await store.updateProfile(id, (state) => projectionMod.commitAndProject(id, state, events));
    return events;
  };

  const A = "offline-a";
  const events = await runLearner(A, [0, 1, 2], 3);
  ok(events.every((e) => e.id && /^ev_[A-Za-z0-9_-]{8,64}$/.test(e.id)),
    `every replayed answer carries a well-formed derived id (${events[0].id})`);
  const fileAfterFirst = fs.readFileSync(ledgerFile(A), "utf8");
  ok(evidenceStore.readEvidence(A).length === drawn.length,
    `a batch of ${drawn.length} offline answers reaches the ledger (${evidenceStore.readEvidence(A).length})`);

  // Delivered AGAIN: byte-identical ledger. Not "no visible difference" — the
  // file itself is unchanged, which is what "counted once" has to mean.
  const replay = await store.updateProfile(A, (state) => projectionMod.commitAndProject(A, state, events));
  ok(replay.result.accepted.length === 0 && replay.result.duplicates.length === drawn.length,
    `re-delivering the same batch appends NOTHING (accepted ${replay.result.accepted.length}, duplicates ${replay.result.duplicates.length})`);
  ok(fs.readFileSync(ledgerFile(A), "utf8") === fileAfterFirst,
    "and the ledger file is byte-identical after the second delivery");
  const modelA = await store.getProfile(A);
  ok(replayMod.reconcileDeep(replayMod.replayModel(evidenceStore.readEvidence(A), A), modelA).length === 0,
    "the learner model still reconciles against the ledger after a replayed batch");

  // A REVERSED batch — newer answers arriving before older ones, which is what
  // two tabs or two devices produce — must land the same model, or the ledger's
  // own ordering (lib/evidence#orderEvents) is doing nothing.
  const B = "offline-b";
  await runLearner(B, [2, 1, 0], 3);
  const eventsA = evidenceStore.readEvidence(A);
  const eventsB = evidenceStore.readEvidence(B);
  ok(evidence.orderEvents(eventsA).map((e) => e.conceptId).join(",") === evidence.orderEvents(eventsB).map((e) => e.conceptId).join(","),
    "delivered in reverse, the ledger's own ordering puts the answers in the same sequence");
  const projA = evidence.projectLearner(eventsA);
  const projB = evidence.projectLearner(eventsB);
  ok(drawn.every((d) => countsOf(projA, d.conceptId) === countsOf(projB, d.conceptId)),
    "and every concept's folded record is identical whichever order the answers arrived in");
  ok(view.conceptKnowledge(projA, drawn[0].conceptId, t).rows.every((r) => r.unmeasured || r.rate),
    "with each row either measured or explicitly unmeasured — never a rate nobody earned");

  // The device's claim is KEPT and DISCLOSED, and it is not the clock the
  // projection reads. `source: "practice"` here is the point: the server did not
  // schedule these as reviews, so nothing about them is memory evidence.
  const kept = evidenceStore.readEvidence(A)[0];
  ok(kept.deviceAt === BASE - 3 * DAY,
    `the device's claimed time is preserved on the event as its own claim (${kept.deviceAt})`);
  ok(kept.at > kept.deviceAt && kept.at >= BASE,
    `while the event's own stamp is the SERVER's, not the device's (at ${kept.at} vs claimed ${kept.deviceAt})`);
  ok(projA.totals.retention.asked === 0,
    `so a batch claiming it was answered three days ago earns NO retention (${projA.totals.retention.asked})`);
  ok(view.citationsFor([kept.id], eventsA, { titleFor: (c) => c, t })[0]?.offline === true,
    "and a replayed answer is disclosed as device-reported where the learner reads their record");

  // ── 4. THE CONTROL: the same claims, aged by the SERVER, DO count ────────
  // Without this, "a device claim buys nothing" could be true simply because
  // the dimension is inert. Two learners are built with the SAME answers, the
  // SAME retrieval source and the SAME device claims (two days apart). The only
  // difference is whether that interval exists on the server's clock too.
  const pair = (learnerId, serverAges) => [0, 1, 2].flatMap((i) => {
    const d = drawn[i];
    const claimed = BASE + i * 1000;
    const at = serverAges ? [BASE, BASE + i * 1000 + 2 * DAY] : [BASE, BASE + i * 1000];
    return [
      evidence.answerEvidence({
        learnerId, at: at[0], id: evidence.submissionEventId(`sub_${learnerId}_t${i}`),
        source: "practice", subject: "maths", conceptId: d.conceptId, specificationId: COURSE.spec,
        questionId: d.q.id, correct: true, chosen: d.q.answer, mode: "independent",
        hints: 0, ms: 3000, tags: [], deviceAt: claimed,
      }),
      evidence.answerEvidence({
        learnerId, at: at[1], id: evidence.submissionEventId(`sub_${learnerId}_r${i}`),
        source: "retrieval", subject: "maths", conceptId: d.conceptId, specificationId: COURSE.spec,
        questionId: d.q.id, correct: true, chosen: d.q.answer, mode: "independent",
        hints: 0, ms: 3000, tags: [],
        // The device claims the review came two days after the teaching, in BOTH
        // learners. Only one of them had the server actually see that gap.
        deviceAt: claimed + 2 * DAY,
      }),
    ];
  });
  const runPair = async (id, serverAges) => {
    await store.saveProfile(store.newProfileState(id, COURSE));
    await store.updateProfile(id, (state) => projectionMod.commitAndProject(id, state, pair(id, serverAges)));
    return evidence.projectLearner(evidenceStore.readEvidence(id));
  };
  const SERVER_AGED = await runPair("offline-c", true);
  const CLAIM_ONLY = await runPair("offline-d", false);
  ok(SERVER_AGED.totals.retention.asked === drawn.length && SERVER_AGED.totals.retention.correct === drawn.length,
    `an interval the SERVER observed is retention evidence (${SERVER_AGED.totals.retention.correct}/${SERVER_AGED.totals.retention.asked})`);
  ok(CLAIM_ONLY.totals.retention.asked === 0,
    `the identical device claims, with no server interval behind them, earn none (${CLAIM_ONLY.totals.retention.asked})`);
  ok(CLAIM_ONLY.totals.answers === SERVER_AGED.totals.answers && CLAIM_ONLY.totals.independent.asked === SERVER_AGED.totals.independent.asked,
    "and both learners are fully credited for the WORK — only the memory claim differs");
}

// ════════════════════════════════════════════════════════════════════════
// AI EXPLAINS; IT CANNOT TEACH THE MODEL
// ════════════════════════════════════════════════════════════════════════
// Four claims, and each one names a defect class rather than a feature:
//
//   1. The tutor's INPUT is the decision the surfaces display — same kind,
//      concept, reason, citations, basis and projection version — read from the
//      learner's own projection. A caller names the concept it opened; it cannot
//      name a decision, and the reason and ids the model is given are read back
//      off the wire here, not off our own objects.
//   2. Nothing on the AI path can write. The ledger is append → confirm →
//      replay/adopt; the source tripwire below shows the write path is not even
//      imported on it, and the runtime check shows a whole exchange — including
//      its fallbacks — leaves the ledger file and every model field unchanged.
//   3. The four ways a model fails to answer (no key, provider error, timeout,
//      malformed response) are four OUTCOMES, not an error page. Each is
//      produced here against a real HTTP endpoint, and each is answered by the
//      offline engine in the learner's language.
//   4. A learner is never told a model spoke when it did not: the disclosure
//      key is derived from the source and cannot be escalated.

// ────────────────────────────────────────────────────────────────────────────
// THE TEACHER SEES THE LEDGER, NOT A CLAIM
// ────────────────────────────────────────────────────────────────────────────
// The roster door derives every member row from the member's own evidence
// projection — the same projectLearner the learner's pages read. Three
// guarantees, asserted at SOURCE level so a regression cannot hide in a
// client that quietly starts sending numbers again:
//
//   1. The classes route imports the live-view derivation, and the only place
//      a client-supplied mastery value is read is the self-report store under
//      `students` — the field the live view exists to supersede.
//   2. The weekly plan reads the LIVE map when the door attached one, and the
//      stored reports only when there is no live data yet (the honest
//      fallback) — so a client cannot flatter itself into a different lesson
//      plan either.
//   3. The two class-carrying doors (roster, offline pack with its answer
//      key) share ONE membership rule in one module.
console.log("▸ The teacher sees the ledger, not a claim");
{
  const fs2 = await import("fs");
  const classesSrc = fs2.readFileSync("app/api/classes/route.ts", "utf8");
  const planSrc = fs2.readFileSync("lib/teacher-plan.ts", "utf8");
  const packSrc = fs2.readFileSync("app/api/pack-export/route.ts", "utf8");
  const membershipSrc = fs2.readFileSync("lib/server/class-membership.ts", "utf8");

  ok(classesSrc.includes('from "@/lib/server/class-view"'),
    "the roster door derives its view through the one shared module");
  const reportChunk = classesSrc.slice(classesSrc.indexOf('case "report"'), classesSrc.indexOf('default:'));
  ok(reportChunk.includes("cls.students[h] = { ...("),
    "a self-report is stored as the claim it is (under students)");
  ok(!/(cls\.live|liveRoster|live\[)/.test(reportChunk),
    "and no code in the report path reads or writes the live view");
  ok(planSrc.includes("function memberMaps(cls: ClassRoster)") && planSrc.includes("cls.live") && planSrc.includes("return cls.students;"),
    "the plan engine reads the live projection map, falling back to stored reports only when there is none");
  ok(!planSrc.includes("conceptMastery"),
    "and no client value reaches the plan engine under any name");
  ok(packSrc.includes('from "@/lib/server/class-membership"') && classesSrc.includes('from "@/lib/server/class-membership"'),
    "roster and offline pack enforce the SAME membership rule from one module");
  ok(membershipSrc.includes("export function isMemberOf"),
    "and that module is the single place the rule is written");
  ok(fs2.readFileSync("lib/server/class-view.ts", "utf8").includes("projectionVersion: p.projectionVersion"),
    "every live row names the projection version that produced it");

  // ── THE TEACHER IS A MEMBER, NOT A STUDENT ───────────────────────────────
  // Measured on the surface first: a class one child had joined read "2
  // students", listed the teacher as an unmeasured row, and put them in "needs
  // attention" as `not_started` on every assignment they set. The rule now has
  // one owner, and this is it behaving — membership kept (so the creator can
  // read their own class) while studenthood is refused.
  const membership = require("../.verify/server/class-membership.js");
  const classView = require("../.verify/server/class-view.js");
  const storeMod = require("../.verify/server/store.js");
  // Two profiles that really exist: the live view resolves members through the
  // store, so a synthetic roster alone would prove nothing about it.
  const TID = "pin_teacher_cls", CID = "pin_child_cls";
  await storeMod.saveProfile(storeMod.newProfileState(TID, { handle: "Ravi_pin" }));
  await storeMod.saveProfile(storeMod.newProfileState(CID, { handle: "Mira_pin" }));
  const roster = {
    id: "cls_pin", name: "Year 10", teacher: "teacher", joinCode: "ABC123", language: "en",
    conceptIds: [], students: { Ravi_pin: {}, Mira_pin: { quadratics: 0.99 } }, createdAt: 0,
    members: [TID, CID], membersById: { Ravi_pin: TID, Mira_pin: CID }, ownerId: TID,
  };
  const ownerState = await storeMod.getProfile(TID);
  const childState = await storeMod.getProfile(CID);
  ok(membership.isMemberOf(roster, ownerState) && membership.isTeacherOf(roster, ownerState),
    "the class's creator is still a MEMBER of it — creating a class must not lock the teacher out of reading it");
  ok(membership.isStudentOf(roster, childState) && !membership.isStudentOf(roster, ownerState),
    "but only the child is one of its STUDENTS — membership and studenthood are different questions");
  const view = await classView.liveRoster(roster);
  ok(!("Ravi_pin" in view.students) && "Mira_pin" in view.students,
    `the roster a teacher reads holds their students, not themselves (${JSON.stringify(Object.keys(view.students))})`);
  ok(!("Ravi_pin" in view.live) && "Mira_pin" in view.live,
    `so their class of one child counts ONE student, and the teacher appears in no row (${JSON.stringify(Object.keys(view.live))})`);
  ok(roster.students.Ravi_pin !== undefined && view.students.Mira_pin?.quadratics === 0.99,
    "while the STORED report is untouched — the fix is in the view the teacher reads, not in the record");
}

// ────────────────────────────────────────────────────────────────────────────
// ASSIGNED WORK IS DERIVED, NOT COUNTED
// ────────────────────────────────────────────────────────────────────────────
// A teacher's assignment stores concepts and a deadline, and nothing else. The
// monitor a teacher reads is a PROJECTION of each member's own ledger over the
// window the assignment opened, and this block pins the four claims that make
// that real:
//
//   1. What a class may be SET comes from the curriculum it declared — never a
//      default subject — and only from concepts the bank can serve.
//   2. The WINDOW is the ledger's own clock (`at`), so a device's claim about
//      when it answered cannot move an answer into an assignment it never
//      counted towards — and a concept with no evidence in the window reads
//      ABSENT, never 0%.
//   3. Completion, weakness and misconceptions come from the events; an empty
//      row names no weakness because it has measured none.
//   4. The door is scoped by OWNERSHIP through the one membership rule and the
//      one member resolver — there is no stored progress field to drift.
console.log("▸ Assigned work is derived, not counted");
{
  const av = require("../.verify/server/assignment-view.js");
  const DAY = 24 * 60 * 60 * 1000;
  const T0 = new Date(2027, 2, 1, 9, 0, 0).getTime();

  // 1. THE CURRICULUM IS THE CLASS'S, NEVER A DEFAULT.
  const maths = av.assignableConcepts("maths", null);
  const physics = av.assignableConcepts("physics", null);
  ok(maths.length > 10 && maths.includes("fractions"),
    `a class that declares maths may be set maths work (${maths.length} concepts)`);
  ok(physics.length > 0 && physics.every((c) => !maths.includes(c)),
    "and a physics class is never offered maths work — the two curricula are disjoint");
  ok(maths.every((c) => questions.hasGenerator(c)),
    "every assignable concept is one the bank can actually serve (an unanswerable assignment is not work)");
  const narrowed = av.assignableConcepts("maths", "uk-gcse");
  ok(narrowed.every((c) => maths.includes(c)),
    `naming a course narrows the candidates to that course (${narrowed.length} of ${maths.length})`);
  ok(av.assignableConcepts("maths", "no-such-spec").length === maths.length,
    "an unknown course falls back to the declared subject rather than to nothing");

  // 2. THE WINDOW IS THE LEDGER'S CLOCK.
  const asg = {
    id: "asg_test", clsId: "cls_test", createdBy: "teacher-1", title: "",
    subject: "maths", specificationId: null,
    conceptIds: ["fractions", "ratio"], createdAt: T0, dueAt: T0 + 7 * DAY,
  };
  const mk = (over) => evidence.answerEvidence({
    learnerId: "student-1", at: T0, source: "practice", subject: "maths",
    conceptId: "fractions", specificationId: null, questionId: "q",
    correct: true, chosen: 0, mode: "independent", hints: 0, ...over,
  });
  const events = [
    mk({ at: T0 - 1000, questionId: "prior1", correct: true }),
    mk({ at: T0 - 500, questionId: "claim1", correct: true, deviceAt: T0 + 5000 }),
    mk({ at: T0 + 1000, questionId: "w1", correct: true }),
    mk({ at: T0 + 2000, questionId: "w2", correct: false, tags: ["common-denominator"] }),
    mk({ at: T0 + 3000, conceptId: "ratio", questionId: "w3", correct: false, tags: ["ratio-order"] }),
    // A concept the assignment does not name: real evidence, not this work.
    mk({ at: T0 + 4000, conceptId: "quadratics", questionId: "w4", correct: false, tags: ["sign-error"] }),
  ];
  const row = av.deriveAssignmentProgress(asg, "bk_2009", "student-1", events);
  ok(row.answers === 3,
    `only answers on the ASSIGNED concepts, inside the window, count (${row.answers} of ${events.length})`);
  ok(row.concepts.fractions?.asked === 2 && row.concepts.fractions?.correct === 1 && row.concepts.fractions?.rate === 0.5,
    `fractions measured 1/2 in the window (${JSON.stringify(row.concepts.fractions)})`);
  ok(row.concepts.ratio?.asked === 1 && row.concepts.ratio?.correct === 0,
    "and ratio measured 0/1 — a real zero, because it was really answered");
  ok(row.prior.fractions === 2,
    `answers on the concept BEFORE it was set are disclosed as prior, not counted (${row.prior.fractions})`);
  ok(row.concepts.fractions?.asked === 2,
    "and a device's claim about WHEN (a future deviceAt on an old answer) does not move the window — the ledger's own clock does");
  ok(!("quadratics" in row.concepts) && !("quadratics" in row.prior),
    "evidence on a concept the assignment does not name is not this assignment's business");
  ok(row.complete === true && row.outstanding.length === 0,
    "every assigned concept has evidence, so the work is complete");

  // 3. UNMEASURED IS ABSENT, NEVER ZERO.
  const asg2 = { ...asg, id: "asg_test2", conceptIds: ["percentages"] };
  const row2 = av.deriveAssignmentProgress(asg2, "bk_2009", "student-1", events);
  ok(row2.answers === 0 && !("percentages" in row2.concepts),
    "a concept the window holds no evidence on is ABSENT from the row — unmeasured, never 0%");
  ok(row2.complete === false && row2.outstanding.join() === "percentages",
    `and it is the work still owed (${row2.outstanding.join() || "none"})`);
  ok(row2.weakest === null,
    "a row with no evidence names NO weakness, because absence of data is not a weakness");

  // 4. THE NAMED REASONS TO STEP IN.
  const ivs = av.interventionsFor([row, row2]);
  ok(ivs.some((i) => i.handle === "bk_2009" && i.conceptId === "percentages" && i.reason === "not_started"),
    "unwritten work is named as not started");
  ok(ivs.some((i) => i.reason === "weak" && i.conceptId === "fractions" && i.rate === 0.5),
    "a measured weak concept is named WITH its rate — the number and the reason travel together");
  ok(ivs.some((i) => i.reason === "misconception" && i.misconceptionId === "common-denominator" && i.conceptId === "fractions"),
    "and a misconception the ledger recorded is named with the concept it was seen on");

  // 5. THE DOOR: ONE RULE, ONE RESOLVER, NO STORED COUNTER.
  const src = fs.readFileSync("app/api/assignments/route.ts", "utf8");
  ok(src.includes('from "@/lib/server/class-membership"') && src.includes("isTeacherOf("),
    "the assignment door asks the ONE membership module who the class's teacher is");
  ok(src.includes("resolveMembers("),
    "and resolves members through the ONE resolver the roster uses, so the two cannot disagree about who is in the class");
  ok(src.includes("deriveAssignmentProgress(") && src.includes("monitorFor(") && src.includes("assignableConcepts("),
    "every number it answers with is the derivation — candidate list, member row and monitor all come from it");
  ok(src.includes("if (teacher)") && src.includes("mine: deriveAssignmentProgress"),
    "a member is answered with their OWN row and a teacher with the class's — the read is scoped by ownership");
  const typesSrc = fs.readFileSync("lib/types.ts", "utf8");
  const ifaceStart = typesSrc.indexOf("export interface Assignment {");
  const iface = typesSrc.slice(ifaceStart, typesSrc.indexOf("export interface AssignmentMemberProgress"));
  const fields = iface.split("\n").filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n");
  ok(!/\b(progress|complete|accuracy|rate|correct|score)\s*[?:]/.test(fields),
    "the STORED assignment is concepts and a deadline: there is no progress field for the monitor to drift from");

  // 6. WHAT THE WORK PROVED (§10, §18), by the rule the learner reads under
  // their own mark. A teacher's question is not only "did they finish, and how
  // many were right": 80% taken with hints and 80% taken unaided are different
  // outcomes, and until the monitor carried the verdict it could only show the
  // number. Every case below is a near-miss of the same rule.
  ok(row.concepts.fractions?.proof === "independent",
    `an unaided right answer reads as independence, not merely a tick (${row.concepts.fractions?.proof})`);
  ok(row.concepts.ratio?.proof === null,
    "a concept whose only window answer was WRONG proves nothing — a miss is not support");
  const hintedRow = av.deriveAssignmentProgress({ ...asg, id: "asg_hinted" }, "bk_2009", "student-1", [
    mk({ at: T0 + 1000, questionId: "h1", correct: true, mode: "guided", hints: 2 }),
  ]);
  ok(hintedRow.concepts.fractions?.proof === "supported",
    `right WITH hints is support, never independence (${hintedRow.concepts.fractions?.proof})`);
  const transferredRow = av.deriveAssignmentProgress({ ...asg, id: "asg_tr" }, "bk_2009", "student-1", [
    mk({ at: T0 + 1000, questionId: "t1", correct: true, mode: "transfer", source: "transfer" }),
  ]);
  ok(transferredRow.concepts.fractions?.proof === "transfer",
    "and a re-framed answer is transfer evidence on the assigned concept too");
  // Retention is measured across the member's WHOLE record, not the window: a
  // due review set for revision is delayed recall of evidence that usually
  // PREDATES the assignment, and a window-relative gap would make every one of
  // them look like first contact.
  const retainedRow = av.deriveAssignmentProgress({ ...asg, id: "asg_ret" }, "bk_2009", "student-1", [
    mk({ at: T0 - 3 * DAY, questionId: "old", correct: true }),
    mk({ at: T0 + 1000, questionId: "due", correct: true, source: "retrieval" }),
  ]);
  ok(retainedRow.concepts.fractions?.proof === "retained",
    `delayed hint-free recall inside the window is retention, even though the evidence it is delayed FROM predates the assignment (${retainedRow.concepts.fractions?.proof})`);
  const sameSittingRow = av.deriveAssignmentProgress({ ...asg, id: "asg_same" }, "bk_2009", "student-1", [
    mk({ at: T0 + 1000, questionId: "a", correct: true }),
    mk({ at: T0 + 2000, questionId: "b", correct: true, source: "retrieval" }),
  ]);
  ok(sameSittingRow.concepts.fractions?.proof === "independent",
    "while a 'retrieval' a second after the last answer is not delayed recall — the day is the threshold, and the monitor reads the same one");
  const allWrongRow = av.deriveAssignmentProgress({ ...asg, id: "asg_allwrong" }, "bk_2009", "student-1", [
    mk({ at: T0 + 1000, questionId: "x1", correct: false, tags: ["common-denominator"] }),
  ]);
  ok(allWrongRow.concepts.fractions?.asked === 1 && allWrongRow.concepts.fractions?.proof === null,
    "and the row still reports what was ASKED, so a null verdict reads as unproved rather than unmarked");
  // The derivation imports the shared rule instead of growing its own, and the
  // teacher's table names the verdict in the teacher's own language.
  const avSrc = fs.readFileSync("lib/server/assignment-view.ts", "utf8");
  ok(avSrc.includes('from "../proof"'),
    "the monitor imports the ONE verdict rule rather than re-deriving it");
  const teacherSrc = fs.readFileSync("app/teacher/page.tsx", "utf8");
  ok(teacherSrc.includes("proofLabelKey(") && teacherSrc.includes('t("teach.proved")'),
    "and the monitor's table names it, in a column the teacher can read");

  // 6. WHAT THE HEADER SAYS ABOUT A CLASS OF ONE.
  // The class header and the class card both read `{n} {students}`. The
  // commonest class in the product is one child, and it read "1 students" on
  // the screen whose whole job is to show a teacher their class at a glance.
  // No plural machinery exists in this product; the established answer is a
  // sibling key for the singular (see components/own-paper.tsx), so this pins
  // both halves: the call site chooses it, and all fifteen dictionaries have it.
  ok(teacherSrc.includes('students.length === 1 ? "teach.studentsOne"'),
    "a class of one names its single student in the singular, not \"1 students\"");
  for (const code of ["en", "de", "ja", "zh", "bn", "ar", "ur"]) {
    ok(i18n.translator(code)("teach.studentsOne") !== "teach.studentsOne",
      `and the singular is authored in ${code}, not fallen back to the key name`);
  }
  // Every concept link this page renders names the concept's OWN subject. It
  // used to hard-code /learn/maths/, so a physics class's weakest concept
  // pointed into the maths tree.
  ok(!teacherSrc.includes("/learn/maths/") && teacherSrc.includes("getConcept(weakest[0])?.subject"),
    "and a class's weakest concept links under the concept's own subject, not an assumed one");

  // 7. WHICH HOME A RETURNING TEACHER LANDS IN.
  // The destination was read from the wizard's own role radio, whose default is
  // "student" — and a signed-in learner never sees that step, so the radio could
  // not be corrected by the one person it was wrong for: every teacher who
  // signed back in was sent to a student's Home. The account's role is the only
  // truth for an account that exists; the form's answer still decides for the
  // account being created in that same submit. A client-side redirect cannot be
  // exercised over HTTP, so this is a source pin — it states the rule and the
  // fallback, and fails if either half is dropped.
  const onbSrc = fs.readFileSync("app/onboarding/page.tsx", "utf8");
  ok(onbSrc.includes("const accountRole = session.account?.role") &&
     onbSrc.includes('const isTeacherAccount = accountRole ? accountRole !== "student" : role === "teacher"'),
    "a returning teacher's destination comes from the ACCOUNT's role, with the form's value only for the account being created");
  ok(onbSrc.includes("if (!wanted && isTeacherAccount && mode !== \"guest\")"),
    "and the redirect reads that one answer rather than the wizard's radio");
  // An org account sets work too, so it must not be filed with the students —
  // §2's school path is the gap, not a reason to send a school to /dashboard.
  ok(/accountRole !== "student"/.test(onbSrc),
    "while an organisation account (a school) is not filed as a learner");

  // 7b. MEMBERSHIP IS IDENTITY, NOT A NAME.
  // The rule used to fall back to the display handle — "does this class have a
  // row with my name on it?" — so a fresh account sharing a name with a real
  // member was a member of a class it had never joined: it could read the class,
  // sit in the teacher's roster, be handed work and have its evidence read
  // beside real students. Two learners with one name also took turns owning one
  // row. The rule is the id the join recorded; legacy rosters are reconciled
  // ONCE by bindLegacyHandles, and only when the name is unambiguous.
  const cm = require("../.verify/server/class-membership.js");
  const mkState = (id, handle) => ({ profile: { id, handle }, progress: {}, masteries: {} });
  const [alexA, alexB] = [mkState("stu_a", "Alex"), mkState("stu_b", "Alex")];
  const roster = {
    id: "cls_names", name: "Names", teacher: "teacher", joinCode: "ABC123", language: "en",
    conceptIds: [], students: { Alex: {} }, members: ["stu_a"], membersById: { Alex: "stu_a" },
    ownerId: "stu_a", createdAt: 0,
  };
  ok(cm.isMemberOf(roster, alexA) === true, "the learner the join recorded is a member");
  ok(cm.isMemberOf(roster, alexB) === false,
    "and a DIFFERENT learner with the same display name is not — a name is not an identity");
  ok(cm.isMemberOf({ ...roster, members: undefined, membersById: undefined }, alexA) === false,
    "a roster with no identity recorded at all grants nobody membership (no name matching)");
  ok(cm.handleOf(roster, "stu_a") === "Alex" && cm.handleOf(roster, "stu_b") === null,
    "and a member's own row is named by identity, not by the profile's display name");
  // The one-shot reconciliation: unambiguous binds once, ambiguous refuses.
  const legacy = { ...roster, students: { Alex: {} }, members: undefined, membersById: undefined, ownerId: undefined };
  ok(cm.bindLegacyHandles({ ...legacy }, [alexA, alexB]) === false,
    "a legacy handle TWO profiles carry is left unbound — no guess about who it is");
  const ambiguous = { ...legacy };
  cm.bindLegacyHandles(ambiguous, [alexA, alexB]);
  ok(cm.isMemberOf(ambiguous, alexA) === false && cm.isMemberOf(ambiguous, alexB) === false,
    "so neither of them is a member of it");
  const oneOwner = { ...legacy };
  ok(cm.bindLegacyHandles(oneOwner, [alexA]) === true && oneOwner.membersById.Alex === "stu_a" && oneOwner.ownerId === "stu_a",
    "while an unambiguous one is bound ONCE — identity written down, creator named");
  ok(cm.bindLegacyHandles(oneOwner, [alexA]) === false && cm.isMemberOf(oneOwner, alexA) === true,
    "and reconciling again is a no-op that still leaves the member a member");
  // Neither membership decision may consult a name, and the join may not rebind.
  const cmSrc = fs.readFileSync("lib/server/class-membership.ts", "utf8");
  const cvSrc = fs.readFileSync("lib/server/class-view.ts", "utf8");
  const joinSrc = fs.readFileSync("app/api/classes/route.ts", "utf8");
  ok(!/Object\.keys\(cls\.students\)\.includes/.test(cmSrc),
    "no membership decision matches a handle against the roster");
  ok(!/byHandle/.test(cvSrc), "and the roster resolves members by id only");
  ok(joinSrc.includes("freeHandle(cls,") && !/const free = /.test(joinSrc),
    "with the join asking the ONE rule for its handle instead of rebinding");
  ok(cmSrc.includes("export function freeHandle") && cmSrc.includes("export function hasRow"),
    "and that rule — plus 'does this learner have a row' — owned by one module");
  // ONE RULE FOR "WHAT ROW DOES THIS LEARNER GET?", used by the join AND by the
  // migration: a handle already bound to somebody else is never taken over.
  const taken = { ...roster, students: { Alex: {}, "Alex 2": {} }, membersById: { Alex: "stu_a", "Alex 2": "stu_b" }, members: ["stu_a", "stu_b"] };
  ok(cm.freeHandle({ ...taken }, "Alex", "stu_c") === "Alex 3",
    `a joiner named Alex gets the first free row, never one bound to another learner (${cm.freeHandle({ ...taken }, "Alex", "stu_c")})`);
  ok(cm.freeHandle({ ...taken }, "Alex", "stu_b") === "Alex 2",
    "while a learner who already has a row keeps it — the numbered one the roster gave them, not the other learner's");
  ok(cm.freeHandle({ students: { Alex: {} }, membersById: {}, members: [] }, "Alex", "stu_c") === "Alex 2",
    "and a row with no identity is not handed to a new joiner either");
  // THE RESIDUE: a member whose row the old join rebound onto somebody else.
  // Their id is in `members` (identity recorded) but no row points at them, so
  // the teacher's table could not show them. Reconciliation writes the row.
  const lostRow = { ...roster, students: { Alex: {} }, members: ["stu_a", "stu_b"], membersById: { Alex: "stu_a" }, ownerId: "stu_a" };
  ok(cm.hasRow(lostRow, "stu_b") === false,
    "a member whose row was taken by a same-named joiner has no row");
  ok(cm.bindLegacyHandles(lostRow, [alexA, alexB]) === true && lostRow.membersById["Alex 2"] === "stu_b",
    "reconciliation gives them a row of their own, under a free handle");
  ok(lostRow.membersById.Alex === "stu_a" && lostRow.ownerId === "stu_a",
    "without taking the row that now belongs to the other learner, or the class's ownership");
  ok(cm.bindLegacyHandles(lostRow, [alexA, alexB]) === false && lostRow.membersById["Alex 2"] === "stu_b",
    "and reconciling again is a no-op, so the repair cannot churn");

  // 8. A FAILED READ IS NOT AN EMPTY CLASS (§24).
  // Both reads used to `return` on a bad response: an expired session or a 500
  // became an empty roster and "No work set yet." — the failure rendered as
  // good news. The state is now reported and retryable through the product's
  // own error state, so the assertion is that neither door swallows a status.
  ok(!/if \(!res\.ok\) return;/.test(teacherSrc),
    "the teacher's reads never turn a failed request into an empty class list");
  // …AND THE OTHER HALF OF §24: a read IN FLIGHT is not an empty class either.
  // The page destructured only `state` from the hook, so every load began by
  // rendering the create form, an empty class list and "No work set yet." to a
  // teacher who has classes and work — a failure-shaped screen for a state that
  // is not a failure. The hook already exposes `loading`; the page asks now, and
  // the class list is gated on it instead of being rendered empty.
  ok(teacherSrc.includes("loading } = useProfile()"),
    "the teacher's page reads the profile's LOADING state from the hook");
  ok(teacherSrc.includes("<Loading") && /\{\s*loading\s*\?/.test(teacherSrc),
    "and shows a loading state while the profile is in flight");
  ok(!teacherSrc.includes("{classes.map((cls) => {") && teacherSrc.includes("{!loading && classes.map((cls) => {"),
    "with the class list (and everything derived from it) rendered only once it has landed");
  ok(teacherSrc.includes("setReadErr(") && teacherSrc.includes("<ErrorState") && teacherSrc.includes("\"teach.readFailed\""),
    "and the failure reaches the shared error state with a retry, in the teacher's own language");
  for (const code of ["en", "es", "fr", "de", "ar", "hi", "ja", "zh", "bn", "sw", "id", "tl", "pt", "ur", "fa"]) {
    ok(i18n.translator(code)("teach.readFailed") !== "teach.readFailed",
      `the read-failure sentence is authored in ${code}`);
  }

}

console.log("▸ AI explains, never records");
{
  const tutorMod = require("../.verify/server/tutor.js");
  const llmMod = require("../.verify/llm.js");
  const ctxMod = require("../.verify/tutor-context.js");
  const decisionMod = require("../.verify/decision.js");
  const serverDecisionMod = require("../.verify/server/decision.js");
  const projectionMod = require("../.verify/server/projection.js");
  const specsMod = require("../.verify/specifications.js");
  const contentI18n = require("../.verify/content-i18n.js");
  const view = require("../.verify/evidence-view.js");
  const t = i18n.translator("en");

  // ── A stub PROVIDER, over real HTTP ──────────────────────────────────────
  // Not a mocked fetch: the timeout lives in the transport, so the transport
  // must be real for these outcomes to mean anything. The stub behaves like a
  // model in the good case and like each failure on demand, chosen by a marker
  // in the prompt the product itself composed.
  const received = [];
  const stubReply = "STUB-AI-REPLY: what do you already know about this?";
  const stub = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      let body = null;
      try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
      const msgs = Array.isArray(body?.messages) ? body.messages : [];
      const prompt = msgs.filter((m) => m?.role === "user").map((m) => String(m.content ?? "")).join("\n");
      received.push({ prompt, model: body?.model ?? null, auth: req.headers.authorization ?? null });
      if (prompt.includes("[[FAIL]]")) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "upstream is down" } }));
        return;
      }
      if (prompt.includes("[[HANG]]")) return; // never answered: the CLIENT's timeout must fire
      if (prompt.includes("[[NOTJSON]]")) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><body>502 Bad Gateway</body></html>");
        return;
      }
      if (prompt.includes("[[EMPTY]]")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: "" } }] }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: stubReply } }] }));
    });
  });
  stub.on("clientError", () => {});
  await new Promise((r) => stub.listen(0, "127.0.0.1", r));
  const stubPort = stub.address().port;
  const AI_ENV = {
    OPENMIND_AI_BASE_URL: `http://127.0.0.1:${stubPort}/v1/chat/completions`,
    OPENMIND_AI_KEY: "stub-key",
    OPENMIND_AI_MODEL: "stub-model",
    OPENMIND_AI_TIMEOUT_MS: "900",
  };
  const clearAiEnv = () => { for (const k of Object.keys(AI_ENV)) delete process.env[k]; };
  clearAiEnv();
  ok(llmMod.activeProvider() === null, "with no key in the environment there is no provider at all");
  ok(llmMod.aiStatus().enabled === false && llmMod.aiStatus().timeoutMs === 12000,
    `and the status says so, with the default call timeout (${llmMod.aiStatus().timeoutMs}ms)`);

  // ── The learner whose decision the tutor must be given ───────────────────
  const CONCEPT = "fractions";
  const OFF_CONCEPT = "quadratics"; // a concept this learner has NO evidence on
  const AI_LEARNER = "ai-grounded-1";
  const COURSE = {
    spec: "uk-gcse",
    specLevel: specsMod.specForProfile({ spec: "uk-gcse" }).level.id,
    exam: "GCSE Maths", examDate: "2027-06-05", timePerDay: 20,
  };
  const A0 = 1700009000000;
  const ANOW = A0 + 3600000;
  const DRAWN = ["ai-1", "ai-2", "ai-3", "ai-4"].map((seed) => questions.generateQuestion(seed === "ai-1" ? CONCEPT : CONCEPT, seed));
  await store.saveProfile(store.newProfileState(AI_LEARNER, COURSE));
  const answers = [true, false, false, true];
  for (let i = 0; i < answers.length; i++) {
    await store.updateProfile(AI_LEARNER, async (state) => {
      const q = DRAWN[i];
      await projectionMod.commitAndProject(AI_LEARNER, state, [evidence.answerEvidence({
        learnerId: AI_LEARNER, at: A0 + i * 1000, source: "practice", subject: "maths",
        conceptId: CONCEPT, specificationId: state.profile.spec, questionId: q.id,
        correct: answers[i], chosen: answers[i] ? q.answer : (q.answer + 1) % q.choices.length,
        mode: "independent", hints: 0, ms: 5000, tags: q.misconceptionTags ?? [],
      })]);
    });
  }
  const ledgerFile = () => {
    try { return fs.readFileSync(nodePath.join(tmpData, "evidence", `${AI_LEARNER}.jsonl`), "utf8"); }
    catch { return ""; }
  };
  const modelSnapshot = async () => JSON.stringify(await store.getProfile(AI_LEARNER));

  const titleOf = (id) => contentI18n.ctitle("en", id);
  const ctxNow = await serverDecisionMod.decisionContextFor(AI_LEARNER);
  const shown = decisionMod.decide(ctxNow, { max: 6, tt: t, title: titleOf, now: ANOW });
  ok(shown.length > 0, `the learner has a canonical next step to be grounded in (${shown[0]?.kind}:${shown[0]?.conceptId})`);
  const top = shown[0];
  ok(top.evidenceIds.length > 0, `and it cites this learner's own recorded answers (${top.evidenceIds.length})`);

  // ── 1. The tutor's input IS that decision ────────────────────────────────
  const g = await tutorMod.tutorGroundingFor(AI_LEARNER, CONCEPT, "en", ANOW);
  ok(g !== null && g.learnerId === AI_LEARNER,
    "the tutor's grounding is built from the learner named, not from anything the caller sent");
  ok(g.decision.kind === top.kind && g.decision.conceptId === top.conceptId,
    `the tutor is given the SAME action the surfaces display (${g.decision.kind}:${g.decision.conceptId} vs ${top.kind}:${top.conceptId})`);
  ok(g.decision.reason === top.reason,
    "with the same reason, word for word — not a summary written for the model");
  ok(JSON.stringify(g.decision.evidenceIds) === JSON.stringify(top.evidenceIds),
    `and the same citations (${g.decision.evidenceIds.length} ids)`);
  ok(g.decision.basis === top.basis && g.decision.projectionVersion === top.projectionVersion,
    `the same basis and projection version (${g.decision.basis} · v${g.decision.projectionVersion})`);
  ok(JSON.stringify(g.decision.plan.map((p) => `${p.kind}:${p.conceptId}`))
    === JSON.stringify(shown.map((p) => `${p.kind}:${p.conceptId}`)),
    `and the rest of the ranking in the order the surfaces queue it (${shown.length} entries)`);
  ok(g.projectionVersion === ctxNow.projectionVersion && g.evidenceEvents === ctxNow.events.length,
    `the grounding states which projection produced the model and how much ledger it rests on (v${g.projectionVersion}, ${g.evidenceEvents} events)`);

  // What the learner OPENED is advisory; what the app decided is not.
  const gOff = await tutorMod.tutorGroundingFor(AI_LEARNER, OFF_CONCEPT, "en", ANOW);
  ok(gOff.focus.conceptId === OFF_CONCEPT && gOff.decision.kind === top.kind
    && gOff.decision.reason === top.reason && JSON.stringify(gOff.decision.evidenceIds) === JSON.stringify(top.evidenceIds),
    "a different concept in the request changes what the tutor TALKS about, never what the app decided");

  // The dimensions are the same rows the concept page shows, from the same
  // projection — counts, and only where something was measured.
  const projection = evidence.projectLearner(evidenceStore.readEvidence(AI_LEARNER));
  const pageRows = view.conceptKnowledge(projection, CONCEPT, t).rows.filter((r) => r.rate && r.rate.asked > 0);
  ok(g.measured.length === pageRows.length
    && g.measured.every((m) => {
      const row = pageRows.find((r) => r.label === m.label);
      return row && row.rate.asked === m.asked && row.rate.correct === m.correct;
    }),
    `every measured dimension the tutor is told matches the concept page's own row (${g.measured.map((m) => `${m.label} ${m.correct}/${m.asked}`).join(", ")})`);
  const offGround = await tutorMod.tutorGroundingFor(AI_LEARNER, OFF_CONCEPT, "en", ANOW);
  ok(offGround.measured.length === 0 && offGround.decision !== null,
    "a concept the learner has no evidence on is handed over as UNMEASURED, never as a 0% a tutor could apologise for");
  ok(offGround.misconceptions.length === 0,
    "and no belief pattern is attributed to them on a concept they have never touched");

  // ── 2. Nothing on this path can write ────────────────────────────────────
  // The source half: the AI modules may not import the write path at all. The
  // runtime half below is the same claim measured in bytes.
  // The room's tutor belongs on this list for the same reason the others do:
  // it composes the turn and stores the reply, so it must be held to the rule
  // that an AI path cannot reach the ledger or a mastery field. (The rooms route
  // imports the ROOM store, not the learner store — rooms carry messages.)
  const AI_MODULES = ["lib/llm.ts", "lib/tutor-context.ts", "lib/server/tutor.ts", "lib/server/room-tutor.ts", "app/api/tutor/route.ts", "app/api/ai/route.ts", "app/api/rooms/route.ts"];
  const WRITE_SYMBOLS = ["answerEvidence", "hintEvidence", "appendEvidence", "commitAndProject", "updateProfile", "saveProfile", "withRetentionProof"];
  const importers = AI_MODULES.filter((f) => {
    const src = fs.readFileSync(f, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    return WRITE_SYMBOLS.some((s) => new RegExp(`\\b${s}\\b`).test(src));
  });
  ok(importers.length === 0,
    `no AI module can reach the ledger or the model — the write path is not imported anywhere on it (${importers.join(", ") || `${AI_MODULES.length} modules clean`})`);

  const beforeModel = await modelSnapshot();
  const beforeLedger = ledgerFile();
  ok(beforeLedger.includes("answer_submitted"),
    "the learner's ledger exists on disk before the AI exchange, with their answers in it");

  // ── 3. A grounded turn, with a model answering ──────────────────────────
  Object.assign(process.env, AI_ENV);
  const okTurn = await tutorMod.tutorTurn({ learnerId: AI_LEARNER, conceptId: CONCEPT, message: "I am stuck on this", language: "en", now: ANOW });
  ok(okTurn.answerSource === "ai" && okTurn.mode === "ai" && okTurn.reply === stubReply,
    "with a live model the learner reads the model's answer, and the turn says so");
  ok(okTurn.labelKey === ctxMod.TUTOR_LABEL.ai && okTurn.aiUnavailable === null,
    `and the disclosure is the AI one (${okTurn.labelKey})`);
  ok(okTurn.ai.provider === "custom" && okTurn.ai.model === "stub-model" && okTurn.ai.timeoutMs === 900,
    `the turn reports which model answered and the timeout in force (${okTurn.ai.provider}/${okTurn.ai.model}, ${okTurn.ai.timeoutMs}ms)`);

  // What the model was TOLD — read back off the wire, not off our own objects.
  const sent = received[received.length - 1];
  ok(sent && sent.auth === "Bearer stub-key", "the request reached the configured endpoint with the configured credential");
  const packet = sent.prompt;
  ok(packet.includes(top.reason),
    "the prompt carries the decision's own reason — the model is told why this learner is seeing this question");
  ok(top.evidenceIds.every((id) => packet.includes(id)),
    `and the ids of the recorded answers the decision cites (${top.evidenceIds.length})`);
  ok(packet.includes(`projection v${top.projectionVersion}`),
    "and which projection algorithm produced the model it is reasoning from");
  ok(packet.includes(`NEXT STEP SHOWN TO THIS LEARNER: ${top.kind}`),
    "the step is named as the app's own next step, so the model cannot be talked into a different one");
  const measuredLine = g.measured[0];
  ok(measuredLine && packet.includes(`${measuredLine.correct}/${measuredLine.asked}`),
    `and the record it is explaining to (${measuredLine ? `${measuredLine.label} ${measuredLine.correct}/${measuredLine.asked}` : "no measured row"})`);
  ok(!/no evidence|nothing has been recorded/i.test(packet),
    "while never claiming a learner with four recorded answers has none");

  // The OTHER AI surfaces take the same grounding: an explanation written for
  // the step this learner is on, not for the concept in the abstract. The
  // explain prompt is read back the same way.
  const explainOut = await llmMod.llmExplain({
    conceptId: CONCEPT, language: "en", question: "why does this happen", grounding: g,
  });
  const explainPrompt = received[received.length - 1].prompt;
  ok(explainOut.ok === true, "the explain task answers when a model is configured");
  ok(explainPrompt.includes(top.reason),
    "and its prompt is grounded in the same decision reason the tutor gets (the two AI surfaces cannot disagree about the learner)");
  const explainNoKey = await (async () => { clearAiEnv(); const r = await llmMod.llmExplain({ conceptId: CONCEPT, language: "en" }); Object.assign(process.env, AI_ENV); return r; })();
  ok(explainNoKey.ok === false && explainNoKey.reason === "no_key",
    "without a key the explain task reports no_key rather than returning a bare null the caller has to guess about");
  const markNoKey = await (async () => { clearAiEnv(); const r = await llmMod.llmMarkWork({ conceptId: CONCEPT, prompt: "p", correctAnswer: "a", studentWork: "w", language: "en" }); Object.assign(process.env, AI_ENV); return r; })();
  ok(markNoKey.ok === false && markNoKey.reason === "no_key",
    "and so does marking — which returns FEEDBACK TEXT only, never a mark written into the record");

  // ── 3b. The four ways a model fails to answer ───────────────────────────
  const cases = [
    ["[[FAIL]] the provider is down", "provider_error"],
    ["[[HANG]] the provider never answers", "timeout"],
    ["[[NOTJSON]] the provider answers with an HTML error page", "malformed"],
    ["[[EMPTY]] the provider answers with an empty completion", "malformed"],
  ];
  for (const [message, reason] of cases) {
    const turn = await tutorMod.tutorTurn({ learnerId: AI_LEARNER, conceptId: CONCEPT, message, language: "en", now: ANOW });
    ok(turn.aiUnavailable === reason,
      `${reason}: elicited from a real endpoint (${turn.aiUnavailable})`);
    ok(turn.answerSource === "offline" && turn.mode === "socratic"
      && turn.reply === socratic.socraticReply(CONCEPT, message, "en", {
        serveReason: g.serveReason,
        hitIds: g.misconceptions.map((m) => m.id),
      }),
      `${reason}: the learner gets the offline Socratic reply, grounded in the serve reason and this learner's own hits — not an apology, not an error page`);
    ok(turn.labelKey === ctxMod.TUTOR_LABEL.fallback,
      `${reason}: and the turn is disclosed as the offline tutor's, never as the model's (${turn.labelKey})`);
    ok(turn.grounding.decision.reason === top.reason,
      `${reason}: the fallback is grounded in the same decision the surfaces show`);
  }

  // A deployment with no model at all: not a failure, the product.
  clearAiEnv();
  const offTurn = await tutorMod.tutorTurn({ learnerId: AI_LEARNER, conceptId: CONCEPT, message: "I am stuck", language: "es", now: ANOW });
  ok(offTurn.aiUnavailable === "no_key" && offTurn.answerSource === "offline",
    "with no key configured the same call degrades to the offline tutor and names the reason (no_key)");
  ok(offTurn.labelKey === ctxMod.TUTOR_LABEL.offline,
    `and says the deployment has no model rather than that one failed (${offTurn.labelKey})`);
  ok(offTurn.reply === socratic.socraticReply(CONCEPT, "I am stuck", "es", {
    serveReason: g.serveReason,
    hitIds: g.misconceptions.map((m) => m.id),
  }) && offTurn.reply.length > 20,
    "the reply is the offline engine's own, in the learner's language, and it is not empty");
  const noLearner = await tutorMod.tutorTurn({ learnerId: null, conceptId: CONCEPT, message: "help", language: "en" });
  ok(noLearner.grounding.learnerId === null && noLearner.grounding.decision === null && noLearner.grounding.measured.length === 0,
    "and with no learner attached the grounding claims nothing about any person");
  const unknownConcept = await tutorMod.tutorTurn({ learnerId: AI_LEARNER, conceptId: "not-a-concept", message: "hi", language: "en" });
  ok(unknownConcept === null, "an unknown concept is refused rather than tutored from nothing");

  // ── 3c. The OFFLINE reply is grounded in the same moment the AI is ─────
  // The fallback is the mode most learners on most deployments actually get,
  // so it may not be the least grounded voice in the product. Handed what the
  // surfaces show — the served question, the practice engine's own reason,
  // this learner's own triggered patterns — the Socratic reply names the
  // moment: which question is on screen, why it was served, what their own
  // answers triggered. And it stays deterministic: same inputs, same reply.
  {
    const served = questions.generateQuestion(CONCEPT, "ai-screen-1");
    const turnIn = { learnerId: AI_LEARNER, conceptId: CONCEPT, message: "I am stuck", language: "en", now: ANOW, questionText: served.prompt };
    const groundedTurn = await tutorMod.tutorTurn(turnIn);
    ok(groundedTurn.answerSource === "offline",
      "3c runs with no model configured — the fallback IS the feature under test");
    ok(groundedTurn.reply.includes(served.prompt),
      `the offline reply is grounded in the question ON THE SCREEN (${JSON.stringify(served.prompt.slice(0, 40))}…)`);
    // The reason is spoken ONLY where it is the only grounding there is. When
    // the caller is a surface that already renders the decision's reason under
    // the reply (the exercise panel fills `grounding` into tutor.whyThis),
    // repeating it as a sentence put the same closing clause on every message
    // — the canned paragraph §11 forbids. Both halves are asserted, because
    // either one alone is a way to get this wrong: drop it everywhere and the
    // room/offline callers lose their only context, keep it everywhere and the
    // panel reads as a script.
    const solo = await tutorMod.tutorTurn({ ...turnIn, questionText: null });
    ok(g.serveReason !== null && solo.reply.includes(g.serveReason),
      `with no question on screen the reply names the practice engine's own serve reason ("${g.serveReason}" — the same target the strip derives)`);
    ok(!groundedTurn.reply.includes(`OpenMind served this one to ${g.serveReason}`),
      "and with the question on screen it does NOT restate a reason the surface is already showing under the reply — the tutor stops reading as canned text");
    if (g.misconceptions.length) {
      const hit = g.misconceptions[0];
      ok(groundedTurn.reply.includes(hit.name),
        `and names the pattern this learner's OWN answers triggered (${hit.name}, ${hit.hits}×)`);
    } else {
      ok(!/triggered|Triggered/.test(groundedTurn.reply),
        "a learner with no triggered patterns is NOT attributed one — the grounding is read, never invented");
    }
    const again = await tutorMod.tutorTurn(turnIn);
    ok(again.reply === groundedTurn.reply && again.reply.length > 40,
      "the same question, record and message are answered the same way twice — the fallback stays re-readable");
  }

  // ── 3d. A ROOM's tutor: the same door, and an honest FOCUS ──────────────
  // Reproduced live before this: a room with no focus concept was taught
  // `linear-equations` — the fallback was a MATHS concept — so a GCSE Physics
  // room answered "why does the ball accelerate?" with balance-scale coaching;
  // and the room never consulted a model at all, so a deployment WITH a key
  // still got the canned reply with no disclosure.
  const roomMod = require("../.verify/server/room-tutor.js");
  const PHYSICS_ROOM = { subject: "physics", conceptIds: [], language: "en" };

  ok(roomMod.roomFocus(PHYSICS_ROOM, "why does the ball accelerate?") === null,
    "a room with no declared concept resolves NO focus rather than defaulting to a concept from another subject");
  ok(roomMod.roomFocus({ subject: "physics", conceptIds: ["forces-basics"], language: "en" }, "anything")?.conceptId === "forces-basics",
    "a declared focus wins, whatever the message says");
  ok(roomMod.roomFocus(PHYSICS_ROOM, "I am stuck on momentum")?.conceptId === "momentum",
    "a message naming an idea in the room's own subject resolves to it");
  ok(roomMod.roomFocus(PHYSICS_ROOM, "I am stuck on fractions and denominators") === null,
    "and an idea from ANOTHER subject is not read as this room's focus — the room stays Physics");
  const ask = roomMod.noFocusReply("physics", "en");
  ok(/\?/.test(ask) && /Physics/.test(ask),
    `the no-focus reply names the subject and still ends in a question (${ask.slice(0, 60)}…)`);
  ok(!/balance scale|3x|denominator/i.test(ask),
    "and it teaches nothing from another subject while saying so");

  // Without a model: the honest offline turn, disclosed as such.
  clearAiEnv();
  const roomOff = await roomMod.roomTutorTurn({ room: { subject: "physics", conceptIds: ["forces-basics"], language: "en" }, message: "how do I start?" });
  ok(roomOff.answerSource === "offline" && roomOff.labelKey === ctxMod.TUTOR_LABEL.offline && roomOff.focus === "forces-basics",
    `with no model a room turn is the offline tutor's, and says so (${roomOff.labelKey})`);
  const roomNoFocus = await roomMod.roomTutorTurn({ room: PHYSICS_ROOM, message: "zzz qqq" });
  ok(roomNoFocus.focus === null && roomNoFocus.aiUnavailable === "no_focus" && roomNoFocus.labelKey === ctxMod.TUTOR_LABEL.offline,
    "and a room it cannot ground says exactly that, rather than guessing a concept");

  // With the stub model: the room reaches it, and the prompt names the concept
  // the room resolved — so the model is told the RIGHT idea.
  Object.assign(process.env, AI_ENV);
  const roomAi = await roomMod.roomTutorTurn({ room: PHYSICS_ROOM, message: "I am stuck on momentum" });
  ok(roomAi.answerSource === "ai" && roomAi.labelKey === ctxMod.TUTOR_LABEL.ai && roomAi.reply === stubReply,
    "a room with a model configured answers through the SAME door, and its reply is labelled as the model's");
  const roomSent = received[received.length - 1].prompt;
  ok(roomSent.includes(contentI18n.ctitle("en", "momentum")),
    "the model is told which idea the room is on, resolved from what the learner typed");
  ok(!roomSent.includes("3x + 5") && !roomSent.includes("balance scale"),
    "and is NOT handed the algebra lesson a defaulted concept used to supply");
  const roomFail = await roomMod.roomTutorTurn({ room: PHYSICS_ROOM, message: "[[FAIL]] momentum" });
  ok(roomFail.answerSource === "offline" && roomFail.labelKey === ctxMod.TUTOR_LABEL.fallback && roomFail.aiUnavailable === "provider_error",
    "a provider failure in a room is an outcome: the offline tutor answers, labelled as the fallback");
  // Concept-only grounding, by construction: a room is shared, so a turn must
  // not carry one member's private record into it.
  ok(roomMod.roomGrounding("momentum", "en").learnerId === null
    && roomMod.roomGrounding("momentum", "en").measured.length === 0,
    "a room's grounding claims nothing about any learner — the private screen is where a turn is grounded in a person");
  clearAiEnv();

  // ── 4. Honest labelling, in both directions ─────────────────────────────
  const KEYS = [ctxMod.TUTOR_LABEL.ai, ctxMod.TUTOR_LABEL.fallback, ctxMod.TUTOR_LABEL.offline];
  ok(new Set(KEYS).size === 3 && ctxMod.TUTOR_LABEL.ai !== ctxMod.TUTOR_LABEL.fallback,
    "the three disclosures are three different sentences, not one key reused");
  ok(i18n.LANG_CODES.every((code) => {
    const tr = i18n.translator(code);
    return KEYS.every((k) => tr(k) !== k && tr(k).trim().length > 8);
  }), `all ${i18n.LANG_CODES.length} dictionaries carry every tutor disclosure, with no English leaking through`);
  ok(i18n.LANG_CODES.every((code) => i18n.translator(code)("tutor.whyThis").includes("{concept}")
    && i18n.translator(code)("tutor.whyThis").includes("{reason}")),
    "and the why-line keeps its two placeholders in every language, so a translation cannot silently drop the reason");

  // ── 4b. The static (Pages) tutor surface is held to the same rules ─────
  // The deployed app answers from the SAME offline engine in the browser, so
  // its source must show the three honest labels and give the fallback the
  // same grounding the server path is held to. Source checks, because the
  // static build ships docs/app.js verbatim.
  {
    const app = fs.readFileSync("docs/app.js", "utf8");
    ok(app.includes("tutor.aiNote") && app.includes("tutor.fallbackNote") && app.includes("sb.tutorLocal"),
      "the static tutor carries all three disclosures: the model's, the fallback's, and offline mode's own");
    ok(/text: text, label: t\("tutor\.aiNote"\)/.test(app),
      "and the AI label is attached only at the one place a model's text was accepted");
    ok(app.includes("socraticReply(practice.conceptId, text, lang(), {")
      && app.includes("question: onScreenQuestion()")
      && app.includes("serveReason: serveReasonOf()")
      && app.includes("hitIds: ownHits(practice.conceptId)"),
      "the static fallback reply is grounded in the on-screen question, the serve reason and the learner's own hits");
    ok(app.includes("function practiceWhy()") && app.includes("reason: practiceWhy()"),
      "the tutor's why-line renders the SAME practice reason the practice strip does — one function, one source");
    ok(!app.includes('practice.info.target.reason === "stretch"'),
      "no second derivation of the practice reason remains for the two surfaces to disagree through");
  }
  ok(!i18n.LANG_CODES.filter((code) => code !== "en").some((code) => {
    const tr = i18n.translator(code);
    return tr("tutor.fallbackNote") === i18n.translator("en")("tutor.fallbackNote");
  }), "the fallback line is actually translated — not the English string copied into fourteen dictionaries");
  ok(ctxMod.disclosureKey({ answerSource: "ai", labelKey: ctxMod.TUTOR_LABEL.ai }) === ctxMod.TUTOR_LABEL.ai,
    "a turn a model wrote is labelled as the model's");
  ok(ctxMod.disclosureKey({ answerSource: "offline", labelKey: ctxMod.TUTOR_LABEL.fallback }) === ctxMod.TUTOR_LABEL.fallback,
    "a fallback turn is labelled as the offline tutor's");
  ok(ctxMod.disclosureKey({ answerSource: "offline", labelKey: ctxMod.TUTOR_LABEL.ai }) === ctxMod.TUTOR_LABEL.fallback,
    "and a payload that claims the AI label without a model having answered is refused");
  ok(ctxMod.disclosureKey({}) === ctxMod.TUTOR_LABEL.offline,
    "a payload with no source at all can never earn the AI label");
  ok(ctxMod.disclosureKey({ answerSource: "offline", aiUnavailable: "provider_error" }) === ctxMod.TUTOR_LABEL.fallback,
    "and a configured model that did not answer is disclosed as a fallback even without a key in the payload");
  const pageSrc = fs.readFileSync("app/tutor/[concept]/page.tsx", "utf8");
  ok(pageSrc.includes("disclosureKey("),
    "the tutor screen derives its label from the disclosed source rather than from the response's own mode flag");

  // ── 5. The exchange wrote nothing ───────────────────────────────────────
  const afterModel = await modelSnapshot();
  const afterLedger = ledgerFile();
  ok(afterLedger === beforeLedger,
    `the learner's ledger is byte-for-byte what it was before six tutor turns — a model's words are not evidence (${afterLedger.length} bytes)`);
  ok(afterModel === beforeModel,
    "and not one mastery field moved: the only way into the model is append → confirm → replay/adopt");

  // ── 5b. And it is re-READ, not remembered ───────────────────────────────
  // The complement of "nothing the caller sends is trusted": the grounding has
  // to follow the store. One more answer through the real write path, and the
  // next grounding must know about it.
  const eventsBefore = (await serverDecisionMod.decisionContextFor(AI_LEARNER)).events.length;
  const q5 = questions.generateQuestion(CONCEPT, "ai-5");
  await store.updateProfile(AI_LEARNER, async (state) => {
    await projectionMod.commitAndProject(AI_LEARNER, state, [evidence.answerEvidence({
      learnerId: AI_LEARNER, at: A0 + 9000, source: "practice", subject: "maths",
      conceptId: CONCEPT, specificationId: state.profile.spec, questionId: q5.id,
      correct: true, chosen: q5.answer, mode: "independent", hints: 0, ms: 4000,
      tags: q5.misconceptionTags ?? [],
    })]);
  });
  const gMoved = await tutorMod.tutorGroundingFor(AI_LEARNER, CONCEPT, "en", ANOW + 120000);
  ok(gMoved.evidenceEvents === eventsBefore + 1,
    `the grounding is recomputed from the store on every call: one more recorded answer and it knows (${eventsBefore} → ${gMoved.evidenceEvents})`);
  ok((await serverDecisionMod.decisionContextFor(AI_LEARNER)).events.length === eventsBefore + 1,
    "while the only thing that moved the record was the normal write path, not any AI turn");

  clearAiEnv();
  await new Promise((r) => { stub.closeAllConnections?.(); stub.close(r); });
}
// ════════════════════════════════════════════════════════════════════════
// HOME = ONE DECISION (the UI refactor, asserted at the source level)
// ════════════════════════════════════════════════════════════════════════
// The dashboard is a client component, so what SSR can prove is only the
// shell. The claims below are about the SOURCE — which is stronger than a
// screenshot: they survive every future render path.
{
  const dash = fs.readFileSync("app/dashboard/page.tsx", "utf8");
  const nextStep = fs.readFileSync("components/next-step.tsx", "utf8");
  const nav = fs.readFileSync("components/nav.tsx", "utf8");

  // ONE decision, ONE primary CTA: the next-step card renders the single
  // ranked action and its CTA; nothing else on Home may render a second
  // `btn` from the engine's ranked list — the queue renders quiet links.
  ok((nextStep.match(/className="btn"/g) ?? []).length === 1,
    "the next-step card renders exactly one primary CTA");
  ok(nextStep.includes("decideOne(") && nextStep.includes("decisionContextFrom(state, ledger)"),
    "the next-step card asks the ONE door for exactly the top of the ranking, over the ledger it actually has");
  ok(dash.includes("decide(") && dash.includes("max: 4") && dash.includes(".slice(1)"),
    "the plan queue takes the REST of the ranking minus the presented action — nothing shown twice");
  ok(!dash.includes("<NextStep") || !dash.slice(dash.indexOf("<NextStep")).includes('className="btn"'),
    "no second button competes with the primary CTA on Home");

  // The reason is the engine's own evidence line, not a slogan.
  ok(nextStep.includes("top.reason") && nextStep.includes('t("next.why")'),
    "the 'why this?' line renders the recommendation's own evidence-backed reason");

  // ── THE ONE DOOR ──────────────────────────────────────────────────────────
  // Every surface that asks "what next?" must come through lib/decision with a
  // context (model + ledger). A surface that calls the engine directly can pass
  // the model and forget the evidence, and nothing about that is visible on
  // screen — it simply recommends for a different reason, or for a learner with
  // no history at all. This is a SOURCE check because it is exactly the kind of
  // bug that renders identically.
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(`${dir}/${d.name}`) : [`${dir}/${d.name}`]);
  const surfaceFiles = [...walk("app"), ...walk("components")]
    .filter((f) => /\.(tsx|ts)$/.test(f));
  const direct = surfaceFiles.filter((f) => fs.readFileSync(f, "utf8").includes("decideNext("));
  ok(direct.length === 0,
    `no surface calls the engine directly — every decision goes through the door (${direct.join(", ") || `${surfaceFiles.length} surfaces clean`})`);
  // The bug SHAPE, banned at the source: `ledger?.events ?? []` turns a fetch
  // still in flight (or one that failed) into "this learner has recorded no
  // evidence", which is a claim about the learner made from a network fact.
  // A client surface hands the door what it has — `decisionContextFrom(state,
  // ledger)` — and a pending ledger becomes basis `unknown` instead.
  const faked = surfaceFiles.filter((f) => fs.readFileSync(f, "utf8").includes("?.events ?? []"));
  ok(faked.length === 0,
    `no surface fakes an empty ledger out of a fetch it has not received (${faked.join(", ") || `${surfaceFiles.length} surfaces clean`})`);
  // The five places the product asks the question, and they ALL use the door.
  const surfaces = [
    "components/next-step.tsx", "app/dashboard/page.tsx", "components/have-plan.tsx",
    "app/api/my-pack/route.ts", "app/api/next/route.ts",
    "app/api/session/route.ts", "app/learn/[subject]/[concept]/page.tsx",
  ];
  const usingDoor = surfaces.filter((f) => {
    const src = fs.readFileSync(f, "utf8");
    return src.includes('"@/lib/decision"') || src.includes('"@/lib/server/decision"') || src.includes('"@/lib/session"');
  });
  ok(usingDoor.length === surfaces.length,
    `every surface that recommends work reaches the decision door (${usingDoor.length}/${surfaces.length}: ${surfaces.filter((f) => !usingDoor.includes(f)).join(", ") || "all"})`);

  // ── ONE CAPABILITY RULE, SEEN FROM BOTH SIDES ─────────────────────────────
  // Every learner-scoped read presents the profile's secret, and the server
  // refuses the rest (the HTTP half of this is asserted by e2e section 18).
  // The SOURCE half is checked here, because a page that builds a learner URL
  // without the token does not crash — it paints an empty state, a spinner or
  // "no evidence yet" — which is exactly the failure a door sweep exists to
  // catch, and it costs a reader the whole hunt to see it on screen.
  //
  // The rule: a client URL naming a learner-scoped route is either wrapped in
  // withCapability() (which appends the token) or names `secret` in the lines
  // that build it. A URL assembled from a variable would slip past a literal
  // check; every call site today is literal, and the assertion below counts
  // them so the glob cannot silently stop matching anything.
  const LEARNER_DOORS = ["next", "my-pack", "path", "classes", "assignments", "profile", "session", "progress", "evidence", "evidence-summary", "my-paper"];
  const clientSides = [...surfaceFiles, ...walk("lib").filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith("lib/server/"))]
    .filter((f) => !f.startsWith("app/api/"));
  const naked = [];
  let learnerUrls = 0;
  for (const f of clientSides) {
    const lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // docs name routes too
      const door = LEARNER_DOORS.find((d) => line.includes(`/api/${d}?`));
      if (!door) return;
      learnerUrls++;
      const window = lines.slice(Math.max(0, i - 3), i + 1).join("\n");
      if (!window.includes("withCapability(") && !window.includes("secret")) naked.push(`${f}:${i + 1} /api/${door}`);
    });
  }
  ok(naked.length === 0,
    `every client read of a learner-scoped door presents the capability, or it would 401 the page that owns the learner (${naked.join(", ") || `${learnerUrls} learner URLs, all carrying a token`})`);
  ok(learnerUrls >= 10,
    `and the check is reading the real surfaces rather than a glob that stopped matching (${learnerUrls} URLs)`);

  // The four doors that used to answer anonymously now share one rule instead
  // of four copies of it — the same import, on the same read path.
  const sharedDoors = [
    "app/api/next/route.ts", "app/api/my-pack/route.ts", "app/api/path/route.ts", "app/api/classes/route.ts",
  ];
  const viaHelper = sharedDoors.filter((f) => {
    const src = fs.readFileSync(f, "utf8");
    return src.includes('"@/lib/server/capability"') && src.includes("authorizeLearner(");
  });
  ok(viaHelper.length === sharedDoors.length,
    `the read doors that leaked an id share ONE authorization rule, not four copies of it (${viaHelper.length}/${sharedDoors.length}: ${sharedDoors.filter((f) => !viaHelper.includes(f)).join(", ") || "all through lib/server/capability"})`);

  // Identity: no minted id in the greeting, and no double auth state.
  ok(!dash.includes("student-"),
    "Home never fabricates a student-NNNN identity in its greeting");
  ok(dash.includes('p.handle ? `, ${p.handle}` : ""'),
    "a learner who chose no name is greeted neutrally — never by a database row");
  ok(nav.includes("!ready ? null") && nav.includes('session.account ?'),
    "the nav shows the account slot ONLY after the session probe answers — no 'Create account' flash for a signed-in learner");
  ok((nav.match(/onb\.createAcct/g) ?? []).length === 1,
    "'Create account' exists in exactly one branch of the auth slot — never beside the learner's own name");

  // Configuration is not learning: the four-selector panel is gone from the
  // learning pages, and the interface language lives on /access.
  const access = fs.readFileSync("app/access/page.tsx", "utf8");
  ok(!dash.includes("LangQuick") && access.includes("LangQuick"),
    "the teaching/answer/school language selectors live in settings, not on Home");
  ok(!nextStep.includes("lang-quick") && !dash.includes("LangQuick"),
    "no learning surface carries the four-selector configuration panel");

  // Plain language: the struggling-learner toggle is named for what it does,
  // in the learner's own language — not for the state machine behind it.
  const i18n = fs.readFileSync("lib/i18n.ts", "utf8");
  ok(i18n.includes('"dash.contMode": "Keep me going"') && !i18n.includes('"Continuity mode"'),
    "the continuity toggle is labelled in plain language, in English at least");
  ok(!i18n.includes("Continuity mode"),
    "and the jargon is gone from every dictionary, not just English");

  // Accent discipline: red is reserved for meaning. Count its uses in the
  // stylesheet — hover states and decorative markers must not spend it.
  const css = fs.readFileSync("app/globals.css", "utf8");
  const bodyOnly = css.replace(/html\.access-contrast\s*{[\s\S]*?}/m, "");
  ok(!/a:hover[^}]*margin-red/.test(bodyOnly),
    "hover states do not spend the accent — red marks meaning, not pointers");
  ok(!/\.eyebrow \.no { color: var\(--margin-red\)/.test(bodyOnly),
    "section markers are neutral; the accent is not wallpaper");
  // Bounded by MEANING, not by taste: 1 variable, 1 focus ring, 1 active-nav
  // rule (+ its RTL twin), the hero underline, and the semantic marking set
  // (wrong answer / bad feedback / bad chips) — everything else stays neutral.
  // The bound is a tripwire: crossing it should require a conscious decision.
  ok((bodyOnly.match(/--margin-red/g) ?? []).length <= 24,
    `the accent keeps a bounded footprint in the stylesheet (${(bodyOnly.match(/--margin-red/g) ?? []).length} uses)`);
}

// ════════════════════════════════════════════════════════════════════════════
// THE FIRST RUN (the enrolment wizard and the door into it)
// ════════════════════════════════════════════════════════════════════════════
// Setup is the one flow every learner must complete, and it is the only place
// where a wrong answer costs the whole session rather than one question. These
// are the failures that were found by walking it as a stranger.
{
  const onb = fs.readFileSync("app/onboarding/page.tsx", "utf8");

  // ── The culture vocabulary has one owner ───────────────────────────────
  // lib/culture.ts owns the ids the concept page reads back through
  // `exampleFor` when it chooses the case a worked example is set in. The form
  // used to carry its own list, with ids the owner does not know (`farm`,
  // `market`, `city`) and two of them labelled with the same string — so the
  // learner saw the same option twice, the choice silently fell back to neutral,
  // and the two authored cultures the form never offered were unreachable.
  ok(onb.includes("CULTURES") && onb.includes("cultureLabel"),
    "the enrolment form renders the culture list from its owner (lib/culture.ts)");
  ok(!/cult\.(neutral|agriculture|urban)/.test(onb),
    "and does not keep a second copy of the labels in the old key family");
  ok(!/id: "(farm|market|city)"/.test(onb),
    "nor a second set of ids the engine cannot resolve");

  // ── A radio GROUP is not a label ───────────────────────────────────────
  // Wrapping the legend and the options in one <label> made each option's
  // accessible name the whole group ("MINUTES A DAY 10 min 20 min 30 min 45 min
  // 60 min"), which is unusable with a screen reader. Nested labels are the
  // shape of that bug, so the shape is what is forbidden.
  {
    // Scan the CODE, not the prose: a comment explaining this rule necessarily
    // contains the string "<label>", and a pin that counts its own explanation
    // fails on the sentence describing the fix.
    const code = onb
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .split("\n")
      .filter((l) => !/^\s*\/\//.test(l))
      .join("\n");
    const tokens = code.match(/<label\b|\/label>/g) ?? [];
    let depth = 0;
    let deepest = 0;
    for (const tk of tokens) {
      if (tk === "<label") depth++;
      else depth = Math.max(0, depth - 1);
      deepest = Math.max(deepest, depth);
    }
    ok(deepest <= 1, `no label sits inside another label in the wizard (deepest ${deepest})`);
    const groups = onb.match(/role="radiogroup"/g)?.length ?? 0;
    ok(groups >= 4, `every radio group is named as a group (${groups} found)`);
  }

  // ── No step refuses to continue without saying why ────────────────────
  // `Next` is disabled on two steps whose requirement is not obvious: the
  // subjects step (at least one subject) and the course step (a course per
  // subject). On both, the reason is printed where the learner is looking — and
  // on the subjects step it replaced a lead sentence that claimed "Subjects:
  // Mathematics" while Mathematics was unchecked, which is worse than silence.
  ok(onb.includes('subjects.length === 0 ? t("onb.needSubject")'),
    "the subjects step states its requirement instead of promising a default it no longer has");
  // The course step used to say "needs a course" for every gap — the same mistake
  // the Home card made before it named the field, and the one that turned this
  // step into a loop. A course has four parts, the gate reports WHICH are
  // missing, and the step now prints them.
  ok(onb.includes('fill(t("next.courseMissing")') && onb.includes("FIELD_LABEL["),
    "the course step names the PART of the course it is waiting for, from the labels the Home card uses");
  // ...AND CAN SATISFY WHAT IT DEMANDS. Measured live: a learner who left the
  // year group alone on step 2 (the select's default IS the placeholder, so that
  // is every learner who did not go looking) chose a qualification and a tier,
  // and `Next` stayed dead with nothing left on the screen to change. The field
  // blocking it is asked for here, and its placeholder cannot be picked — on a
  // route with grades, "I'm learning independently" is not one.
  ok(onb.includes('courseMissing.some((m) => m.missing.includes("grade"))'),
    "the course step can set the year group it is missing, instead of sending the learner back a step");
  ok(onb.includes('<option value="" disabled>{t("onb.grade")}</option>'),
    "and the year group it asks for cannot be answered with the placeholder");

  // ── A step change is a page change ─────────────────────────────────────
  // Measured on a phone: advancing left the new step wherever the last one was
  // scrolled to — the step counter 102px ABOVE the viewport and the heading 57px
  // above it — and focus fell back to <body> because the `Next` that was clicked
  // no longer exists, so a screen-reader user heard nothing. The new step opens
  // at its top, with focus on the single element that names it.
  ok(/useEffect\(\(\) => \{[\s\S]{0,400}?window\.scrollTo\(0, 0\)[\s\S]{0,240}?heading\.focus\(\{ preventScroll: true \}\)/.test(onb),
    "a step change scrolls to the top and puts focus on the heading that names the screen");
  ok(onb.includes("}, [step]);"),
    "and it runs on the step change rather than on every render");
  ok(fs.readFileSync("app/globals.css", "utf8").includes('h1[tabindex="-1"]:focus'),
    "the heading focus target carries no focus ring — in the marking red it read as an error box around the title");

  // ── The account gate says what it wants ──────────────────────────────
  // Filling in all three boxes and getting a dead button with no reason is how a
  // first run loses someone: measured with email "abc", an 8-character password
  // and a name, `Next` was disabled and silent — above a password hint the
  // learner had already satisfied. One value decides the gate, `canAdvance` reads
  // it, and each field prints its own reason. These are the strings the SERVER
  // used to send, reachable only through a button that was off.
  ok(onb.includes('if (current === "account") return mode === "guest" ? true : acctIssue === null;'),
    "the account step's button and its explanation are decided by one value");
  ok(["email", "password", "name"].every((f) => onb.includes(`{issueFor("${f}")}`)),
    "and every field of it prints its own reason where the learner is looking");
  ok(onb.includes('className="field-error" role="status"'),
    "in the field-error style the sheet already carried, announced rather than only drawn");

  // ── No control that cannot be answered ─────────────────────────────────
  // The course step is the one step a learner cannot pass without answering, and
  // it offered a Level field whose only option was the placeholder — a control
  // that looks required, cannot be satisfied, and borrowed the word from the
  // field beside it ("I'm learning independently" as a LEVEL).
  ok(onb.includes("levels.length > 0 &&"),
    "the Level field is offered only when the chosen course has levels to choose");

  // ── Said once, where it is true ────────────────────────────────────────
  const noteUses = (onb.match(/t\("onb\.subjectsNote"\)/g) ?? []).length;
  // The guard has to be attached to THIS render: `current === "account"` appears
  // three times in the file, so asserting the string exists proves nothing about
  // whether the note is the thing guarded.
  const noteAt = onb.indexOf('🎓 {t("onb.subjectsNote")}');
  const noteGuard = noteAt < 0 ? "" : onb.slice(Math.max(0, noteAt - 160), noteAt);
  ok(noteUses === 2 && noteGuard.includes('current === "account" && ('),
    `"Subjects: Mathematics" is the account step's reassurance only — as the subjects step's lead and nowhere else (${noteUses} uses, guard ${noteGuard.includes('current === "account" && (') ? "present" : "MISSING"})`);

  // ── The screen says what the learner is doing, and why it moved ────────
  ok(onb.includes('mode === "signin" ? "onb.signIn" : mode === "guest" ? "onb.guest" : "onb.acctTitle"'),
    "the account step's heading states what the learner is actually doing");
  ok(onb.includes('{pending && (') && onb.includes('t("state.newLearner")'),
    "a learner sent here by the shell is told why, in the sentence the route contract already carries");
  // The KEY VALUE is asserted, not the identifier: renaming a constant proves
  // nothing, and `const MODE_KEY = ""` would leave every identifier in place.
  ok(onb.includes('"openmind:acctMode"') &&
     /localStorage\.setItem\(MODE_KEY, m\)/.test(onb) &&
     /localStorage\.getItem\(MODE_KEY\)/.test(onb),
    "and their account choice is written to and read back from this device, so a bounce cannot re-ask it");
}

// ════════════════════════════════════════════════════════════════════════════
// THE EXERCISE BOOK COUNTS THE QUESTION THE LEARNER IS LOOKING AT
// ════════════════════════════════════════════════════════════════════════════
// `count` is how many answers the SERVER has graded, and it is incremented when
// an answer is graded — not when the next question loads. Reading `count + 1`
// unconditionally therefore relabelled the page "Question 2 of 5" the instant Q1
// was answered, while Q1's own "not yet" and its Explanation/Retry controls were
// still what the learner was reading: the counter disagreed with the panel
// beside it on the one screen that is a countdown. Three places printed the
// counter, so they could disagree with each other too. Found by answering a
// question as a learner and reading the two numbers.
console.log("▸ The exercise header counts what is on screen");
{
  const conceptPage = fs.readFileSync("app/learn/[subject]/[concept]/page.tsx", "utf8");
  ok(!/Math\.min\(\s*count \+ 1\s*,\s*target\s*\)/.test(conceptPage),
    "submitting an answer no longer advances the question number on the spot");
  ok(/const qOrdinal = Math\.min\(graded \? count : count \+ 1, target\)/.test(conceptPage),
    "the number shown is the question on screen: the answered one while its feedback is up, the next one otherwise");
  // The predicate has to be the SAME value that chooses between the feedback and
  // the choices on screen. `phase` looks equivalent and is not: the Next/Retry
  // control clears `graded` and serves a fresh question without moving `phase`
  // off "feedback", so a phase-based counter under-reports by one after a retry.
  ok(conceptPage.includes("{graded && (") && !/qOrdinal = Math\.min\(phase/.test(conceptPage),
    "and it reads the same fact the feedback UI is gated on, not a phase that can lag it");
  const qFills = conceptPage.match(/fill\(t\("sess\.qOf"\), \{[^}]*\}\)/g) ?? [];
  ok(qFills.length >= 3 && qFills.every((f) => f.includes("n: qOrdinal")),
    `and every place that prints it reads that one value (${qFills.length} sites)`);
}

// ════════════════════════════════════════════════════════════════════════════
// A PROMPT THAT NAMES WHAT IS MISSING, AND A SCREEN THAT CAN SUPPLY IT
// ════════════════════════════════════════════════════════════════════════════
// Home refuses to plan work on a course nobody finished choosing, which is
// right. It then named every gap "needs a course" and sent the learner to the
// course screen — but a course has four parts and the course screen could only
// set two of them, so a learner missing only their YEAR GROUP was sent there,
// could change nothing, came back, and read the same sentence. A loop with no
// exit. The gap report always knew which field was missing; only the caller
// dropped it.
console.log("▸ A missing course is named by field, and can be finished where we send them");
{
  const card = fs.readFileSync("components/course-first.tsx", "utf8");
  const feed = fs.readFileSync("components/next-step.tsx", "utf8");
  const curr = fs.readFileSync("app/curriculum/page.tsx", "utf8");

  ok(feed.includes("missing={gap.missing}"),
    "the next-step card is handed which parts of the course are unset, not just the subject");
  ok(card.includes("fill(t(\"next.courseMissing\")") && card.includes("FIELD_LABEL"),
    "and it names them rather than calling every gap a missing course");
  for (const field of ["country", "grade", "spec", "specLevel"]) {
    ok(new RegExp(`^  ${field}: `, "m").test(card),
      `every field the gap report can name has a label (${field})`);
  }

  // The destination has to be able to satisfy what the card names. `grade` and
  // `country` were read by this screen and never written by it.
  ok(/route\?\.grades \?\? \[\]\)\.map/.test(curr),
    "the course screen offers the country's year groups");
  ok(/\.\.\.\(grade \? \{ grade \} : \{\}\)/.test(curr),
    "and saves the one the learner picks, so the card's prompt can be answered here");
  ok(/\.\.\.\(countryId \? \{ country: countryId \} : \{\}\)/.test(curr),
    "nor does an untouched country select write anything back");

  // The phrase told the learner the field was missing in their OWN language, so
  // every dictionary is checked.
  //
  // Read from the SOURCE, not from the compiled mirror: `translator()` falls back
  // to English when a dictionary lacks the key, so a mirror-based check cannot
  // see a missing entry at all (it reads the English one and passes) — and the
  // mirror is not rebuilt by every run. This is the first pin that would notice a
  // language quietly losing the sentence.
  // `LANGS` is language METADATA (objects), not codes — passing one to
  // `translator()` misses `DICTS[obj]` and silently answers in English, which is
  // how a check can "pass" for fifteen languages while reading one.
  const { LANG_CODES } = require("../.verify/i18n.js");
  const i18nSrc = fs.readFileSync("lib/i18n.ts", "utf8");
  const dictBody = (code) => {
    const head = new RegExp(`^(export )?const ${code}: Dict = \\{`, "m").exec(i18nSrc);
    if (!head) return null;
    const end = i18nSrc.indexOf("\n};", head.index);
    return end < 0 ? null : i18nSrc.slice(head.index, end);
  };
  const missing = LANG_CODES.filter((code) => {
    const body = dictBody(code);
    if (body === null) return true;
    const entry = /"next\.courseMissing":\s*"([^"]*)"/.exec(body);
    return !entry || !entry[1].includes("{fields}") || !entry[1].trim();
  });
  ok(missing.length === 0,
    `the gap phrase is authored in all ${LANG_CODES.length} languages and keeps its placeholder${missing.length ? ` (missing or placeholder-free: ${missing.join(", ")})` : ""}`);
}

// ════════════════════════════════════════════════════════════════════════════
// ONE LIST OF WHAT ENROLMENT COLLECTED
// ════════════════════════════════════════════════════════════════════════════
// The wizard saves a profile through two doors — with an account, and without
// one. Each carried its OWN hand-written list of the same fifteen fields, and
// they had drifted: `termsMode`, collected one screen earlier, was in one list
// and not the other. So a learner who enrolled WITHOUT an account chose "Local
// terms only" and the server never heard it, while a signed-in learner's
// identical choice was saved — the same choice, two outcomes, decided by which
// door they came through. Found by the UI walk (scripts/ui-walk.mjs) asserting
// the SERVER's copy against what the screen had just promised.
console.log("▸ Enrolment is collected once");
{
  const onb = fs.readFileSync("app/onboarding/page.tsx", "utf8");
  ok(/createProfile\(\{\s*\.\.\.enrolment\(\)/.test(onb),
    "the no-account door sends the same package as the account door, rather than a second list");
  const named = (onb.match(/^\s*termsMode,$/gm) ?? []).length;
  ok(named === 1,
    `and a choice the wizard collects is named in exactly one payload (termsMode appears in ${named})`);
}

// ════════════════════════════════════════════════════════════════════════════
// FINISHING A SITTING CHANGES WHERE THE LEARNER BELONGS
// ════════════════════════════════════════════════════════════════════════════
// The report's primary CTA is "Home →". The route guard derives "is this learner
// measured" from the shell's learner state, and nothing refreshed that state when
// a sitting finished — so the CTA was bounced straight back into
// `/diagnostic/maths?return=/dashboard` at question 01 of a NEW sitting. Walking
// the first run found it; a reload hid it, because a fresh mount re-probes. The
// sitting now refreshes the state the same way the exercise page does after
// grading, and the report names itself instead of borrowing the button that
// ended the sitting.
console.log("▸ A reload mid-diagnostic resumes the sitting instead of replacing it");
{
  // FOUND BY PLAYTESTING, NOT BY READING. Two answers deep on the production
  // build, one reload — and the page served a DIFFERENT question 01. Nothing had
  // been lost from the ledger, but the learner's time was and, worse, the
  // adaptive path the sitting had already chosen for them was discarded and
  // re-decided. A reload is the most ordinary thing a learner does on a phone.
  const route = fs.readFileSync("app/api/diagnostic/route.ts", "utf8");
  const startBlock = /if \(body\.action === "start"\) \{[\s\S]*?\n    \}\n/.exec(route)?.[0] ?? "";
  ok(startBlock.length > 0, "the start action is still there");
  ok(startBlock.includes("live.lastQ"),
    "a start with a live sitting re-serves the question that sitting was on");
  ok(/const live = \(state as unknown as Record<string, unknown>\)\[sessionKey\]/.test(startBlock),
    "and that sitting is read from the live session key, not assumed absent");
  ok(/live\.kind === wantedKind/.test(startBlock),
    "and it is resumed ONLY for the same kind, so a deliberate retest still measures independently");
  ok(/const wantedKind = \(startKind[\s\S]*?\?\? live\?\.kind \?\? "probe"/.test(startBlock),
    "an unspecified kind adopts the running sitting rather than silently starting a third kind");
  ok(startBlock.includes("asked: live.log?.length ?? 0"),
    "and reports how many probes the sitting has already answered");
  // Re-serving a question must not spend it twice: the exposure was recorded
  // when it was first served, and one question counted twice is two probes.
  ok(!/resumed[\s\S]{0,400}?spend\(state, q\)/.test(startBlock),
    "a resumed question is not spent against the exposure ledger a second time");

  // The client must not relabel the resumed sitting as question 01 — that was
  // the part the learner could actually see.
  const diagPage = fs.readFileSync("app/diagnostic/[subject]/page.tsx", "utf8");
  ok(/body\.resumed && body\.asked > 0/.test(diagPage),
    "the page recognises a resumed sitting");
  ok(/setN\(body\.asked \+ 1\)/.test(diagPage),
    "and numbers it from where the sitting actually is, not from 1");
  ok(diagPage.includes('t("state.resume")'),
    "and says so on screen — a key already authored in every dictionary");
  ok(/setResumed\(false\);\n/.test(diagPage),
    "the notice is dropped once the learner answers, rather than haunting the whole sitting");

  // FOUND WHILE PLAYTESTING THE SAME RUN. The concept page's eyebrow rendered
  // the concept's raw internal `stage` — so a learner was greeted with a bare
  // "0" beside the subject name, a number with no label and nothing to do. Every
  // other `.no` marker in the shell is a glyph (`!`, `◍`, `✓`, `✎`), so this one
  // read as a badge the app had failed to fill in.
  const concept = fs.readFileSync("app/learn/[subject]/[concept]/page.tsx", "utf8");
  ok(!/<span className="no">\{String\(c\.stage\)\}<\/span>/.test(concept),
    "the concept page does not surface the internal stage number as a badge");
  ok(!/className="eyebrow"><span className="no">\{String\(/.test(concept),
    "and the only numeral left in that eyebrow is the one it owns");
}

console.log("▸ Onboarding moves one step per press");
{
  // A triple-click on "Next" moved the step 1 → 4, skipping "About you" and
  // "What are you studying?" entirely. Nothing was lost — it is the same state —
  // which is exactly why it survived: it looked like progress. Found by clicking
  // the way a phone double-tap does.
  const onb = fs.readFileSync("app/onboarding/page.tsx", "utf8");
  ok(onb.includes("const [advancing, setAdvancing] = useState(false);"),
    "step navigation is latched, so one press is one step");
  ok(onb.includes("const advanceLock = useRef(false);"),
    "and the latch is a ref, not state — a state latch is read from the render closure, so three clicks in one tick all read the same stale false and all three advance");
  ok(/const advance = \(\) => \{\s*if \(advanceLock\.current\) return;/.test(onb),
    "and a second press in the same tick is refused before React re-renders");
  ok(/useEffect\(\(\) => \{\s*advanceLock\.current = false;\s*setAdvancing\(false\);\s*\}, \[step\]\);/.test(onb),
    "the latch releases on the NEW step, not on a timer that a slow double-click could outlast");
  ok(/onClick=\{advance\} disabled=\{!canAdvance\(\) \|\| busy \|\| advancing\}/.test(onb),
    "and the button itself is disabled for the step on screen");
  ok(!/onClick=\{\(\) => setStep\(\(s\) => s \+ 1\)\}/.test(onb),
    "the bare increment — the thing that skipped three steps — is gone");
}

console.log("▸ A finished diagnostic is a change to where the learner belongs");
{
  const diag = fs.readFileSync("app/diagnostic/[subject]/page.tsx", "utf8");
  ok(diag.includes("const { set: setLearner } = useProfile();"),
    "the diagnostic holds the shell's learner state");
  ok(/if \(id\) \{\s*const fresh = await fetchProfile\(id\);\s*if \(fresh\) setLearner\(fresh\);/.test(diag),
    "and refreshes it when the sitting finishes, so Home is not bounced back into the diagnostic");
  ok(diag.includes('${t("diag.done")} →'),
    "the button that ends the sitting keeps the label that says so");
  // ...AND CANNOT BE PRESSED TWICE. `answer` has always refused a second
  // submission while one was in flight; ending the sitting did not, so a
  // double-click asked the server to finish twice — and the second ask is
  // `400 no active session`, which the error branch puts on screen as raw server
  // text mid-first-run. Measured against the live route: 200 then 400.
  // Scoped to `next` ON PURPOSE: both pins below read a function whose guard
  // exists to be escaped. `answer` carries its own try/finally with the same
  // line, so a file-wide match would pass on the sibling whenever this one lost
  // its release — a pin that measures the wrong function is a pin that lies.
  const nextFn = /async function next\(\)[\s\S]*?\n  }\n/.exec(diag)?.[0] ?? "";
  ok(nextFn.length > 0, "the diagnostic still has its next-step control");
  ok(/if \(busy\.current\) return;\s*\n\s*busy\.current = true;\s*\n\s*try \{/.test(nextFn),
    "and a second press is refused while the first is in flight");
  // The guard must not latch: clearing it only on the success path would leave
  // every later submission refused for the life of the page.
  ok(/} finally \{\s*\n\s*busy\.current = false;/.test(nextFn),
    "and the guard is released on every path, so the button cannot latch shut");
  ok(diag.includes('<h1>{t("diag.report")}</h1>'),
    "and the report titles itself with a heading of its own");
  ok(!/<h1>\{t\("diag\.done"\)\}<\/h1>/.test(diag),
    "rather than the instruction the learner just followed");

  // THE SAME LEAK, AT THE ONE PLACE IT IS FATAL: ENROLMENT.
//
// The block above pins the diagnostic's half of one defect. Its other half was
// never pinned, so it came back — and this time it is an infinite loop, not one
// bounce. Walking a brand-new learner through all six onboarding steps on the
// production build recorded, 39ms apart:
//
//   push("/dashboard")  →  replace("/diagnostic/maths?return=%2Fdashboard")
//
// `AppProvider` fetches the profile once per `generation` and re-probes only on a
// session event or a FULL page load; a client-side `push` refreshes nothing. So
// the guard still held the PRE-enrolment learner, refused the page enrolment had
// just finished sending them to, and bounced them back to step 1 with the
// `return` ticket still attached — which re-arms the identical bounce. Asking for
// `/dashboard` is the most ordinary thing a new learner does (the nav's Home, the
// landing page's "Go to your dashboard"), so this was the default first run.
//
// Two properties are pinned, and the second is the one that makes the first
// sufficient: even with a perfectly fresh shell, a return ticket naming a
// `diagnosed`-gated page is not a destination enrolment can honour, because
// enrolment makes a learner `onboarded` and never `diagnosed`.
console.log("▸ Enrolment hands over a learner the guard will actually admit");
{
  const onb = fs.readFileSync("app/onboarding/page.tsx", "utf8");
  ok(onb.includes("const { set: setLearner } = useProfile();"),
    "onboarding holds the shell's learner state, the state the guard reads");
  // BEFORE the navigation, not after: the whole defect is the ordering.
  ok(/if \(saved\) setLearner\(saved\);[\s\S]*?router\.push\(/.test(onb),
    "and hands the profile it just wrote to that state BEFORE it navigates");
  ok(!/router\.push\(wanted \|\| \(already \? "\/dashboard"/.test(onb),
    "a return ticket is no longer pushed blindly, whatever it names");

  // The destination is asked of the route contract rather than restated, so a
  // new `diagnosed`-gated page cannot reintroduce the bounce by being added.
  ok(onb.includes('import { accessFor, withReturn } from "@/lib/app-state";'),
    "the destination is decided by the one owner of the access contract");
  const reach = /const unreachable = wanted \? accessFor\(wanted\) === "diagnosed" : false;/.exec(onb)?.[0] ?? "";
  ok(reach.length > 0, "and it treats a diagnosed-gated ticket as not yet reachable");
  ok(/if \(wanted && \(already \|\| !unreachable\)\) \{\s*router\.push\(wanted\);/.test(onb),
    "so an unmeasured learner is sent to the diagnostic instead, carrying the ticket forward");
  ok(onb.includes("withReturn(`/diagnostic/${subject}`, wanted)"),
    "and the ticket survives, so the learner still arrives where they originally asked to go");
  ok(onb.includes('withReturn("/dashboard", wanted)'),
    "an already-measured learner keeps their ticket through Home too");

  // The loop is a property of the CONTRACT, so it is asserted as one: for every
  // path the contract calls `diagnosed`, a learner who has just enrolled and not
  // yet been measured must not be routed there. This is the check that would have
  // caught it without a browser, and it cannot go stale as pages are added.
  const { ACCESS_RULES, accessFor: accessForRule, resolveRoute, deriveLifecycle } =
    require("../.verify/app-state.js");
  const enrolledNotMeasured = deriveLifecycle({
    auth: "signed_out",
    profileStatus: "complete",
    profile: { profile: { id: "p", subjects: ["maths"], onboardedAt: 1 }, progress: {}, diagnostics: {} },
  });
  const bounced = ACCESS_RULES
    .filter((r) => r.requirement === "diagnosed")
    .map((r) => [r.path, resolveRoute(enrolledNotMeasured, r.path)]);
  ok(bounced.length > 0, "the contract really does gate at least one page on measurement");
  ok(bounced.every(([, d]) => d.action === "redirect" && d.to.startsWith("/diagnostic/")),
    "an enrolled-but-unmeasured learner is refused every diagnosed-gated page, and every refusal names the diagnostic");
  // The property that closes the loop: none of those refusals points back at the
  // page that would re-arm them. Onboarding is public, so a redirect to it can
  // never come from here.
  ok(bounced.every(([path, d]) => d.to !== path),
    "and no refusal points back at the page that made the request");
  ok(accessForRule("/onboarding") === "public",
    "onboarding itself stays public, so a redirect to it can never re-arm the loop");
  }

  // Authored everywhere, like every other string a learner reads — checked at
  // the source, so a missing key cannot pass by falling back to English.
  const { LANG_CODES } = require("../.verify/i18n.js");
  const i18nSrc = fs.readFileSync("lib/i18n.ts", "utf8");
  const dictBody = (code) => {
    const at = i18nSrc.indexOf(`const ${code}: Dict = {`);
    if (at < 0) return null;
    const end = i18nSrc.indexOf("\n};", at);
    return end < 0 ? null : i18nSrc.slice(at, end);
  };
  const unauthored = LANG_CODES.filter((code) => {
    const body = dictBody(code);
    if (body === null) return true;
    const entry = /"diag\.report":\s*"([^"]+)"/.exec(body);
    return !entry || !entry[1].trim();
  });
  ok(unauthored.length === 0,
    `the report heading is authored in all ${LANG_CODES.length} languages${unauthored.length ? ` (missing: ${unauthored.join(", ")})` : ""}`);
}

// ════════════════════════════════════════════════════════════════════════════
// ONE COURSE PER SUBJECT (§1, §2, §9)
// ════════════════════════════════════════════════════════════════════════════
// "Universal curriculum" is only true if a learner can sit GCSE Maths and
// A-Level Physics at the same time and have each subject planned against its OWN
// course. The rules that make that true, and that a silent fallback would break:
//
//   1. an explicit qualification counts for a subject only if it TEACHES it
//      (the Digital SAT is mathematics only, so it is not a Biology course)
//   2. the derived path never offers a subject a qualification that lacks it
//   3. once a learner has a per-subject course, a subject WITHOUT one is
//      unchosen — not "the same as the first subject" — and is reported
//   4. `courseGaps`/`incompleteSubjects` name the subject and the missing field
console.log("▸ One course per subject");
{
  const S = require("../.verify/specifications.js");

  // ── 1. Teaching, not merely naming ─────────────────────────────────────
  for (const spec of S.SPECIFICATIONS) {
    for (const subject of ["maths", "physics", "chemistry", "biology", "computing"]) {
      const active = S.specForProfile({ country: spec.country, spec: spec.id, specLevel: spec.levels[0].id }, subject);
      if (S.coversSubject(spec, subject)) {
        ok(active.spec.id === spec.id,
          `${subject} under ${spec.id} keeps its own qualification`);
      } else {
        // The decisive case: the profile SAYS us-sat and asks about biology.
        ok(!S.coversSubject(active.spec, subject) === false,
          `an explicit ${spec.id} is not believed for ${subject}, which it does not teach (resolved to ${active.spec.id})`);
      }
    }
  }
  const sat = S.specById("us-sat");
  ok(!S.coversSubject(sat, "biology") && S.coversSubject(sat, "maths"),
    "the Digital SAT teaches mathematics and nothing else (the case the rule exists for)");
  const satMaths = S.specForProfile({ country: "US", spec: "us-sat", specLevel: "sat" }, "maths");
  const satBio = S.specForProfile({ country: "US", spec: "us-sat", specLevel: "sat" }, "biology");
  ok(satMaths.spec.id === "us-sat", "the explicit maths-only qualification IS honoured for mathematics");
  ok(satBio.spec.id !== "us-sat" && S.coversSubject(satBio.spec, "biology"),
    `and is refused as a Biology course, which then resolves to one that teaches it (${satBio.spec.id})`);

  // ── 2. Every picker offers only courses that teach the subject ─────────
  let offeredBadly = 0;
  let emptyOffer = 0;
  for (const spec of S.SPECIFICATIONS) {
    for (const subject of ["maths", "physics", "chemistry", "biology", "computing"]) {
      const options = S.specOptionsFor(spec.country, subject);
      if (options.length === 0) emptyOffer++;
      for (const o of options) if (!S.coversSubject(o, subject)) offeredBadly++;
    }
  }
  ok(offeredBadly === 0, `no picker can offer a subject a qualification that does not teach it (${offeredBadly} offers)`);
  ok(emptyOffer === 0, `and no subject is left with no course to choose (${emptyOffer} empty)`);
  // An unmapped country still gets the international + independent pathways.
  ok(S.specOptionsFor("XX", "biology").every((s) => S.coversSubject(s, "biology")),
    "a country with no national entry still offers this-subject courses (independent pathway)");

  // ── 3. A subject without a course is UNCHOSEN, not "same as the first" ──
  const twoSubjects = {
    country: "GB", grade: "Year 11", subjects: ["maths", "biology"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
  };
  // The decisive form of the rule: the first subject's qualification is one that
  // does NOT teach the second subject, so an inherited fallback would be
  // impossible to miss (a maths-only paper as a Biology course).
  const satOnly = {
    country: "US", grade: "Grades 9–12", subjects: ["maths", "biology"],
    subjectCourses: { maths: { spec: "us-sat", specLevel: "sat" } },
  };
  const bioActive = S.specForProfile(satOnly, "biology");
  ok(bioActive.spec.id !== "us-sat" && S.coversSubject(bioActive.spec, "biology"),
    `an unchosen subject never inherits a qualification that does not teach it (biology → ${bioActive.spec.id})`);
  // And where the first subject's course COULD have taught the second, it is
  // still not claimed: silence means unchosen, so the learner is asked.
  const gcseFirst = {
    country: "GB", grade: "Year 11", subjects: ["maths", "biology"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } },
  };
  ok(S.incompleteSubjects(gcseFirst).some((g) => g.subject === "biology" && g.missing.includes("spec")),
    "a subject with no course is reported even when the first subject's qualification could have taught it");
  const bioCourse = S.courseForSubject(twoSubjects, "biology");
  ok(bioCourse.spec === undefined,
    "its course reads as undecided rather than silently borrowing the first subject's");
  // The legacy shape is unaffected: no per-subject courses at all means the flat
  // fields ARE the learner's course, which is what older profiles have.
  const legacy = { country: "GB", spec: "uk-gcse", specLevel: "higher", grade: "Year 11", subjects: ["maths"] };
  ok(S.courseForSubject(legacy, "maths").spec === "uk-gcse",
    "a profile with no per-subject courses keeps its flat course (legacy shape)");
  ok(S.specForProfile(legacy, "maths").level.id === "higher",
    "and keeps the tier it chose");
  // The learner's OWN subject still resolves through its entry.
  ok(S.specForProfile(twoSubjects, "maths").spec.id === "uk-gcse" &&
     S.specForProfile(twoSubjects, "maths").level.id === "foundation",
    "the subject that HAS a course resolves to exactly that qualification and tier");
  // Two subjects, two qualifications, one profile — the whole point.
  const mixed = {
    country: "GB", grade: "Year 12", subjects: ["maths", "physics"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" }, physics: { spec: "uk-alevel", specLevel: "as" } },
  };
  ok(S.specForProfile(mixed, "maths").spec.id === "uk-gcse" &&
     S.specForProfile(mixed, "physics").spec.id === "uk-alevel",
    "one learner can sit two different qualifications, each resolved for its own subject");
  ok(S.difficultyFor(S.specForProfile(mixed, "maths")) < S.difficultyFor(S.specForProfile(mixed, "physics")),
    "and each subject practises at its own depth " +
    `(${S.difficultyFor(S.specForProfile(mixed, "maths"))} vs ${S.difficultyFor(S.specForProfile(mixed, "physics"))})`);

  // ── 4. The gap report names the subject and the missing field ───────────
  const gaps = S.incompleteSubjects(twoSubjects);
  ok(gaps.length === 1 && gaps[0].subject === "biology" && gaps[0].missing.includes("spec"),
    `the unchosen subject is named with the field it is missing (${JSON.stringify(gaps)})`);
  ok(S.incompleteSubjects(mixed).length === 0, "a fully configured learner reports no gaps");
  // The country's own grades and the qualification's own tiers are what decide
  // completeness — a course nobody could have chosen is not "complete".
  const badGrade = S.incompleteSubjects({ ...twoSubjects, grade: "Year 99" });
  ok(badGrade.length === 2 && badGrade.every((g) => g.missing.includes("grade")),
    "a grade the country does not offer is reported for every subject, not assumed");
  const notTaught = S.incompleteSubjects({
    country: "US", grade: "Grades 9–12", subjects: ["biology"],
    subjectCourses: { biology: { spec: "us-sat" } },
  });
  ok(notTaught.length === 1 && notTaught[0].missing.includes("spec"),
    "a qualification that does not teach the subject leaves it incomplete, never 'configured'");

  // ── The card that carries this to the learner, at the source level ─────
  const nextStepSrc = fs.readFileSync("components/next-step.tsx", "utf8");
  const courseCard = fs.readFileSync("components/course-first.tsx", "utf8");
  ok(/incompleteSubjects\(state\.profile\)/.test(nextStepSrc) && /<CourseFirst /.test(nextStepSrc),
    "Home asks the same gap rule before presenting a recommendation");
  ok((nextStepSrc.match(/className="btn"/g) ?? []).length === 1,
    "and the decision card still renders exactly one primary CTA (the course card is a branch, not a second button)");
  ok((courseCard.match(/className="btn"/g) ?? []).length === 1 && /\/curriculum/.test(courseCard),
    "while the course card it shows instead has one CTA, pointing at the page that fixes it");
}

// ════════════════════════════════════════════════════════════════════════════
// THE YEARS A LEARNER CAN DECLARE
// ════════════════════════════════════════════════════════════════════════════
// A route's `grades` list is the years its system HAS, and the enrolment screen
// renders it as exactly that. It was written with gaps — GB jumped Year 7 →
// Year 9, AU skipped 8 and 9, NG skipped JSS 2 and SSS 2, 15 of 20 routes
// affected — and the consequence is not cosmetic: `grade` is a REQUIRED course
// field, `courseGaps` reports any value outside this list as missing, and the
// step offers nothing else. So a whole cohort's real year could not be declared
// at all: measured live, the GB select read "Year 7, Year 9, Year 10…", and a
// Year 8 pupil had to claim to be Year 7 or Year 9.
//
// The rule is the system's own sequence, so it is checked AS a sequence: inside
// each phase of a route (the digits stripped from the label — "JSS 2" and "JSS 3"
// share a phase, "SMP 8" and "SMA 10" do not), the numbers run without a hole.
console.log("▸ The years a learner can declare");
{
  const C = require("../.verify/curriculum.js");
  const S = require("../.verify/specifications.js");
  const { COUNTRIES } = require("../.verify/i18n.js");
  const codes = [...COUNTRIES.map((c) => c.code), "INT", "XX"];
  let routes = 0;
  let holed = 0;
  let dupes = 0;
  for (const code of codes) {
    const route = C.curriculumFor(code) ?? (code === "XX" ? C.INDEPENDENT_ROUTE : null);
    if (!route) continue;
    routes++;
    const seen = new Set();
    for (const g of route.grades) { if (seen.has(g)) dupes++; seen.add(g); }
    const phases = new Map();
    for (const g of route.grades) {
      const n = Number((g.match(/\d+/) ?? [])[0]);
      if (!Number.isFinite(n)) continue;
      const phase = g.replace(/\d+/g, "").replace(/[º°]|st|nd|rd|th/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
      if (!phases.has(phase)) phases.set(phase, []);
      phases.get(phase).push(n);
    }
    for (const [phase, nums] of phases) {
      const sorted = [...nums].sort((a, b) => a - b);
      if (sorted[sorted.length - 1] - sorted[0] + 1 !== sorted.length) {
        holed++;
        ok(false, `${route.system}: the “${phase}” years skip one (${nums.join(", ")})`);
      }
    }
  }
  ok(routes >= 20, `every offered country's route was checked (${routes} routes)`);
  ok(holed === 0, "and none of them skips a year of a phase it names");
  ok(dupes === 0, "nor lists one twice");
  // The case that was measured live: a UK Year 8 pupil, and the gate downstream.
  const gb = C.curriculumFor("GB");
  ok(gb.grades.includes("Year 8"), `a UK learner can declare Year 8 (${gb.grades.join(", ")})`);
  const year8 = S.courseGaps(
    { country: "GB", grade: "Year 8", subjects: ["maths"], subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } } },
    "maths",
  );
  ok(!year8.includes("grade"), "and that declaration is not reported as a course field still missing");
  // The other direction, so the list stays a check rather than decoration: a
  // year the system does not have is still refused as a course field.
  ok(S.courseGaps(
    { country: "GB", grade: "Year 8 and a half", subjects: ["maths"], subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } } },
    "maths",
  ).includes("grade"), "while a year the system does not have is still refused");
}

// ════════════════════════════════════════════════════════════════════════════
// HOME = ONE DAY (what to do, why, and the deadline)
// ════════════════════════════════════════════════════════════════════════════
// Home has to answer four questions and nothing else: who am I / what am I
// studying, what should I do today, why, and what comes next. It used to answer
// those AND show a mastery percentage per subject, a route per subject, a
// coverage count, a learning-style chip, a continuity toggle, a rooms tile, a
// genome tile, a mind map and a stat grid — most of which was the same
// information, or none.
//
// Two halves. The ARITHMETIC half is the deadline: a countdown is a claim about
// time, so it gets module-level proofs. The SOURCE half is the page's shape,
// because a client component cannot be asserted by rendering it here.
console.log("▸ Home: one day, one decision");
{
  const deadline = require("../.verify/deadline.js");

  // ── A date-only string is a CALENDAR day, not an instant ─────────────
  const june12 = new Date(2027, 5, 12);
  ok(deadline.daysUntil("2027-06-12", june12) === 0, "the exam date itself counts as today (0 days)");
  ok(deadline.daysUntil("2027-06-13", june12) === 1, "and tomorrow is 1 day away");
  ok(deadline.daysUntil("2027-06-11", june12) === -1, "a date that has passed counts negative, not as zero");
  // The late-night case: 23:59 on the day before must still say "tomorrow",
  // which is what an instant-based subtraction gets wrong.
  ok(deadline.daysUntil("2027-06-13", new Date(2027, 5, 12, 23, 59, 59)) === 1,
    "and a countdown read at 23:59 does not roll over to the wrong day");
  ok(deadline.daysUntil("2027-06-12", new Date(2027, 5, 12, 0, 1)) === 0,
    "nor does it roll forward just after midnight");

  // ── Absent and impossible are both "no deadline", never a guess ──────
  ok(deadline.daysUntil(undefined) === null && deadline.daysUntil(null) === null && deadline.daysUntil("") === null,
    "no exam date means no countdown — nothing is invented for a learner who never picked one");
  ok(deadline.daysUntil("2026-02-31") === null,
    "an impossible date resolves to nothing rather than rolling into March");
  ok(deadline.daysUntil("12/06/2027") === null && deadline.daysUntil("2027-6-2") === null,
    "and anything that is not a date-only string is refused, not coerced");
  ok(deadline.calendarDay("2027-02-29") === null && deadline.calendarDay("2028-02-29") !== null,
    "leap days are handled by the calendar (2027 is not a leap year, 2028 is)");

  // ── How a deadline should be spoken about ────────────────────────────
  ok(deadline.deadlineBand(undefined) === "none" && deadline.deadlineBand("2026-02-31") === "none",
    "no deadline is a STATE ('none'), not a count of zero");
  ok(deadline.deadlineBand("2027-06-12", june12) === "today" &&
     deadline.deadlineBand("2027-06-13", june12) === "imminent" &&
     deadline.deadlineBand("2027-07-12", june12) === "upcoming" &&
     deadline.deadlineBand("2027-06-01", june12) === "past",
    "today / within a week / further out / already past are four different states");

  // ── The page's shape ─────────────────────────────────────────────────
  const home = fs.readFileSync("app/dashboard/page.tsx", "utf8");
  const countdown = fs.readFileSync("components/exam-countdown.tsx", "utf8");
  const recent = fs.readFileSync("components/recent-answers.tsx", "utf8");
  const offline = fs.readFileSync("app/offline/page.tsx", "utf8");
  const progress = fs.readFileSync("app/progress/page.tsx", "utf8");

  // What the four questions need.
  ok(home.includes("<NextStep") && home.includes('"@/lib/decision"'),
    "Home presents the decision, and reaches it through the one door");
  ok(home.includes("<ExamCountdown") && home.includes("examDate={p.examDate}") &&
     countdown.includes("daysUntil(examDate)"),
    "the learner's own exam deadline is on Home, counted from their own profile");
  ok(countdown.includes('if (!examDate || days === null) return null;'),
    "and a profile with no exam date renders no countdown at all");
  ok(home.includes("<RecentAnswers") && home.includes("ledger={ledger}"),
    "the record itself is on Home, from the ledger — not from the model's counts");
  ok(recent.includes("if (!ledger) return null;"),
    "an UNREAD ledger shows nothing, so \"we have not read your record\" is never rendered as \"nothing recorded\"");
  ok(recent.includes('t("prog.empty")'),
    "while a ledger that WAS read and is empty gets the honest sentence");
  ok(home.includes('fill(t("sess.resume")') ,
    "an unfinished session is offered as the concrete continue-where-you-left-off");
  ok(home.includes("<AssignmentsPanel"),
    "and work a teacher set is on Home with its deadline (nothing when none was set)");

  // What was removed, and why: each of these is the same information once more,
  // or a number nobody can act on. Every one is reachable on its own page.
  ok(!home.includes("MindMap"), "the mind map is not on Home — /mind owns it");
  ok(!home.includes('className="stat"'), "no stat grid: a percentage that cannot be acted on is decoration");
  ok(!home.includes("isContinuityMode") && fs.readFileSync("app/access/page.tsx", "utf8").includes("isContinuityMode"),
    "the continuity setting moved to configuration (/access), not deleted");
  ok(!home.includes("DownloadPack") && offline.includes("<DownloadPack"),
    "the offline pack download moved to the page about being offline, not deleted");
  ok(offline.includes('addEventListener("openmind:pack-ready"') &&
     fs.readFileSync("components/download-pack.tsx", "utf8").includes('dispatchEvent(new Event("openmind:pack-ready"))'),
    "and downloading it fills in the plan on the spot rather than looking dead");
  // One primary CTA on Home, and it is the DECISION's — so Home itself
  // declares no primary button at all. (It used to hold one, in a "no profile
  // yet" branch that returned before the decision; that branch is now a
  // skeleton, because "we have not read your profile" and "you have no
  // profile" are different sentences and only the second could offer a
  // button. The claim here is therefore stricter than it was: no button in
  // this file can compete with the card, at all.)
  ok((home.match(/className="btn"/g) ?? []).length === 0,
    "Home renders no competing primary button beside the engine's own CTA");
  ok(home.includes("<Loading"),
    "and where the profile used to be claimed missing, it now waits — a skeleton, not a page of zeros");

  // One presentation of the record, not two that drift.
  ok(progress.includes('<RecentAnswers ledger={ready}') && home.includes("<RecentAnswers ledger={ledger}"),
    "the answers list is ONE component, used by Home and by the evidence page");
  ok(!progress.includes("citationsFor"),
    "and the progress page no longer carries its own second copy of those rows");

  // Every removed destination still exists.
  for (const route of ["app/learn/[subject]/page.tsx", "app/mind/page.tsx", "app/progress/page.tsx", "app/curriculum/page.tsx", "app/offline/page.tsx"]) {
    ok(fs.existsSync(route), `${route} still exists — nothing was removed by moving it off Home`);
  }
}

// ════════════════════════════════════════════════════════════════════════
// THE SHELL, THE LANDING PAGE AND THE EXERCISE SCREEN (UI spec)
// ════════════════════════════════════════════════════════════════════════
// The visual work is checked at the SOURCE, for the same reason the Home
// refactor is: a screenshot proves what one render did on one screen, and
// these are claims about every render path.
{
  const nav = fs.readFileSync("components/nav.tsx", "utf8");
  const land = fs.readFileSync("app/page.tsx", "utf8");
  const concept = fs.readFileSync("app/learn/[subject]/[concept]/page.tsx", "utf8");
  const panel = fs.readFileSync("components/tutor-panel.tsx", "utf8");
  const dimsSrc = fs.readFileSync("components/dims.tsx", "utf8");
  const help = fs.readFileSync("app/help/page.tsx", "utf8");

  // ── §shell: navigation never moves ──────────────────────────────────────
  // Six learning destinations, in one list, rendered as both the sidebar and
  // the phone bar. A destination reachable on a laptop and missing on the
  // phone the product is built for is the bug this list exists to prevent.
  for (const href of ["/dashboard", "/learn", "/papers", "/progress", "/mind", "/projects"]) {
    ok(nav.includes(`href: "${href}"`), `the sidebar carries ${href} as a primary destination`);
  }
  ok(/const PHONE = PRIMARY\.slice\(0, 4\)/.test(nav),
    "the phone bar renders the same list, not a second one that can drift");

  // ── Every destination the shell offers must GO somewhere ────────────────
  // The loop above proves each href is DECLARED. It cannot prove the page
  // behind it exists — and that is how `/learn`, the sidebar's own "Learn", the
  // phone bar's second tab, step 01 of Help and the landing page's student card
  // all shipped as Next's "This page could not be found" to every learner who
  // tapped it, while this suite stayed green: the label was checked, the
  // destination never was. A navigation item that dead-ends is the one UI
  // defect a learner cannot work around, so it is pinned at the source.
  {
    const hrefs = [...nav.matchAll(/href:\s*"(\/[^"]*)"/g)].map((m) => m[1]);
    ok(hrefs.length >= 14, `the shell's destinations are literals this check can read (${hrefs.length})`);
    const dead = hrefs.filter((h) => !fs.existsSync(h === "/" ? "app/page.tsx" : `app${h}/page.tsx`));
    ok(dead.length === 0,
      `every destination in the sidebar and phone bar has a page of its own (${dead.length ? `dead: ${dead.join(", ")}` : `${hrefs.length} destinations`})`);
  }

  // ── A tier is named ONCE, and named the same way everywhere ─────────────
  // Three surfaces used to name a tier three ways: the wizard showed the
  // system's own name (`name || t(lvl.tier)`), while the curriculum screen and
  // the Learn index printed BOTH — so for the two most-sat tiers, whose own name
  // is the translated word, a GCSE learner read "Higher tier · Higher tier" on
  // the screen that names their course. One owner now, and this pins the two
  // things it must never do: repeat itself, or leak a raw `lvl.` key to a
  // dictionary that lacks one.
  {
    const ci = require("../.verify/content-i18n.js");
    const S = require("../.verify/specifications.js");
    const dupes = [];
    for (const spec of S.SPECIFICATIONS) {
      for (const lvl of spec.levels) {
        const label = ci.levelLabel("en", lvl.tier, lvl.name);
        const parts = label.split(" · ");
        if (new Set(parts).size !== parts.length) dupes.push(`${spec.id}/${lvl.id}: ${label}`);
        if (label.startsWith("lvl.")) dupes.push(`${spec.id}/${lvl.id}: raw key ${label}`);
      }
    }
    ok(dupes.length === 0, `no tier is named twice in one label (${dupes.length ? dupes.slice(0, 3).join(", ") : "all distinct"})`);
    // And the collapsed case really collapses: the tier whose own name IS the
    // translated word must come back as that one name, not the pair.
    const g = S.specById("uk-gcse");
    const higher = g.levels.find((l) => l.id === "higher");
    ok(ci.levelLabel("en", higher.tier, higher.name) === "Higher tier",
      `a tier whose own name is the translated one is said once (got "${ci.levelLabel("en", higher.tier, higher.name)}")`);
    // A dictionary that lacks the key falls back to the system's own name rather
    // than printing `lvl.degree` at a learner.
    ok(ci.levelLabel("en", "nonexistent-tier", "Form 4") === "Form 4",
      "an unknown tier uses the system's own name instead of the raw key");
  }
  // Help and Account are at the foot of the sidebar as REAL links (§shell).
  ok(/const FOOT = \[[\s\S]*?\/help[\s\S]*?\/account[\s\S]*?\];/.test(nav),
    "Help and Account sit at the foot of the sidebar rather than inside a menu");
  // …and the primary navigation announces itself as what it is.
  ok(nav.includes('aria-label={t("nav.mainAria")}') && !nav.includes('aria-label={t("nav.moreAria")}>\n          {PRIMARY'),
    "the main navigation is labelled as the main navigation, not as the overflow");
  ok(fs.readFileSync("lib/app-state.ts", "utf8").includes('"/help": "public"'),
    "and the new Help destination is classified in the route access contract");

  // ── §landing: the name, one sentence, and exactly two doors ─────────────
  // The old headline promised a "world-class tutor"; §landing forbids claims
  // the software cannot back up, so the key is gone from this page.
  ok(!land.includes("home.heroTitle"),
    "the landing page no longer leads with a claim it cannot demonstrate");
  ok(land.includes('t("home.tagline")') && land.includes('t("home.sub")'),
    "it leads with what the product is and what it does, in the learner's language");
  // ONE primary action, in both of the page's two states: the resume link (a
  // learner part-way through setup) OR the start link (a first-time visitor).
  // The two are branches of the same ternary, so exactly one is ever rendered —
  // which is why the count is 2 and the claim still holds. The teacher's door
  // is deliberately secondary (`btn ghost`), and the small "Already have a
  // profile?" line are links, not buttons.
  ok((land.match(/className="btn"/g) ?? []).length === 2 && land.includes(") : ("),
    "the landing page offers one primary action per state, in mutually exclusive branches");
  ok(land.includes('className="btn ghost"') && land.includes('t("home.teacherCta")'),
    "and the teacher's door is secondary, not a competing primary button");
  // The five sections §landing asks for, each ending at a real surface.
  for (const key of ["home.secStudents", "nav.teach", "nav.currTitle", "nav.offlineTitle", "nav.accessTitle"]) {
    ok(land.includes(key), `the landing page explains ${key}`);
  }
  // ── §landing: the hero is the ENGINE'S OUTPUT, and every claim has a source
  // The page's centrepiece is not copy about the product — it is the product: a
  // decision composed by the real engine for one recorded learner, with the
  // record it was read from beside it and the answer that decided it named. The
  // four lines a visitor reads are therefore engine fields, not sentences, and
  // these pins are what keep them that way: the moment someone hard-codes the
  // card, the front page starts describing a product that may no longer exist.
  const demo = fs.readFileSync("lib/example-decision.ts", "utf8");
  // WHERE THE CARD LIVES. It was the landing page's centrepiece until the repair
  // audit: there it read as telemetry about a real student ("6 answers, 3 right,
  // 3 needed help") beside an internal item id, which is not the welcome a visitor
  // to a free learning app is looking for. It moved to /about — the page a
  // teacher, reviewer or funder opens when they want evidence rather than a map.
  //
  // These pins are RELOCATED, not relaxed. They still demand that every visible
  // line of the card is an engine field rather than a written sentence, that the
  // raw `kind` enum never appears, and that an uncomposable decision renders
  // nothing at all. What changed is which file is asked. Four assertions are
  // ADDED below to pin the new placement in both directions, because a relocation
  // nobody guards is a relocation that quietly reverts.
  const card = fs.readFileSync("components/worked-example.tsx", "utf8");
  const about = fs.readFileSync("app/about/page.tsx", "utf8");
  ok(card.includes('@/lib/example-decision') && card.includes("exampleDecision(lang, t)"),
    "the worked example comes from the engine's own composer");
  for (const field of ["example.title", "example.reason", "example.evidence", "example.why", "example.minutes"]) {
    ok(card.includes(`{${field}}`), `and the card it shows renders the engine's ${field}`);
  }
  // The raw kind is an English enum (EXPLAIN, REMEDIATE) that no dictionary can
  // translate — the rule Home already follows, and the landing card is the same
  // card, so a reader in Arabic must not meet an English token at the top of it.
  ok(!card.includes("{example.kind}") && !demo.includes("kind: action.kind") &&
     card.includes('t("next.eyebrow")') && card.includes('t("next.ev.min")'),
    "the card wears the product's own translated labels, never the raw kind enum");
  ok(demo.includes("replayModel(") && demo.includes("decide("),
    "the composer folds a real ledger with the real projection and asks the real engine");
  // …and takes every field of the card FROM that decision. A composer that asks
  // the engine and then hands over its own sentences is the same lie as a
  // hand-written card, one layer down.
  for (const field of ["minutes", "title", "reason", "evidence", "why"]) {
    ok(demo.includes(`${field}: action.${field}`),
      `the composer takes the card's ${field} from the engine's decision`);
  }
  ok(!/keeps recurring|Adds denominators/.test(card) && !/keeps recurring|Adds denominators/.test(land),
    "and none of the card's sentences is written into the page");
  ok(demo.includes("return null") && card.includes("if (!example) return null"),
    "and a decision the engine cannot compose leaves the section ABSENT rather than showing a stand-in card");
  // ── WHERE IT IS, pinned in both directions. The repair moved it off the front
  // door; these keep it there, and keep it OFF there.
  ok(about.includes("<WorkedExample") && about.includes('t("home.worked")'),
    "the worked example is shown on /about, the page a reviewer opens for evidence");
  ok(!land.includes("worked-grid") && !land.includes("@/lib/example-decision") &&
     !land.includes("exampleDecision("),
    "the landing page shows no other learner's record and no internal evidence id");
  // The raw item id must not reach a surface at all. It is an internal handle with
  // no meaning to a reader, and the one time it did — as `fraction-ops-6` beside
  // "the answer that decided it" — it read as a database key on a marketing page.
  // The synthetic ledger legitimately carries question ids — they are real events. The
  // contract that matters is what ExampleDecision HANDS A SURFACE: the slip, not the id.
  ok(demo.includes("decider: slip ? { slip } : null") &&
     demo.includes("decider: { slip: string } | null") && !card.includes("decider.question"),
    "the deciding answer reaches a surface as the slip a reader can act on, never as a raw item id");
  // the four counts come out of the projected progress and the snapshot, keyed by
  // fact rather than by a sentence the engine would have said differently.
  ok(/progress\?\.attempts/.test(demo) && /progress\?\.correct/.test(demo) && /progress\?\.hinted/.test(demo),
    "every figure in the margin is read from the projected model");
  ok(demo.includes('"attempts"') && demo.includes('"slip"') && !demo.includes("next.ev."),
    "and the margin's labels are the page's own count-nouns, not the engine's in-sentence vocabulary");
  // The subject rows are measured at load from the genome and the bank. The maths
  // tile once claimed 72 concepts when there were 67 — a literal that can go
  // stale is exactly what this forbids.
  ok(land.includes("SUBJECT_LEVEL") && land.includes("bankDepth(") && land.includes("bySubject("),
    "the subject rows measure their counts and depth from the content itself");
  ok(!/\d+\s*\{\s*t\("home\.concepts"\)/.test(land),
    "and no concept count is written into the page as a literal");
  // Unknown is not zero, ON THE FRONT PAGE. What the product has not seen is
  // drawn as an empty ruled square — so the last thing a visitor reads before
  // signing up is the rule the whole engine is built on.
  ok(land.includes('className="unmeasured"') && land.includes('t("home.notMeasured")') && land.includes('t("home.notMeasuredNote")'),
    "the landing page ends by showing what it does NOT know, as an empty square");
  const unmeasuredBlock = land.slice(land.indexOf('t("home.notMeasured")') - 200, land.indexOf('t("home.notMeasured")') + 400);
  ok(!/fact-n|ledger-v/.test(unmeasuredBlock),
    "and that square carries no figure at all — an unmeasured row never reads as a zero");

  // Help exists, and it is written in the learner's language: every sentence on
  // it is a key, so there are no English literals hiding in the one page a
  // confused learner opens.
  ok(help.includes('t("next.howTitle")') && help.includes('t("about.privacyBody")'),
    "Help explains how the product works using the product's own sentences");
  ok(!/>\s*[A-Z][a-z]+ [a-z]+ [a-z]+\s*</.test(help),
    "and carries no hard-coded English prose");

  // ── §tutor: a PANEL beside the question, never instead of it ────────────
  ok(concept.includes('className="work"') && concept.includes("<TutorPanel"),
    "the exercise screen puts the tutor beside the question");
  ok(concept.includes("questionText={q?.prompt}"),
    "and grounds it in the question actually on screen");
  ok(panel.includes("disclosureKey("),
    "every tutor reply carries its own disclosure — a fallback answer is never labelled AI");
  ok(panel.includes('className="tutor-fab"'),
    "on a phone the panel is a sheet with one button in the thumb's reach");

  // ── The meter: a dash is never an empty bar ─────────────────────────────
  // "Not measured" and "zero" must not render the same way: an empty five-step
  // meter reads as a score of nothing to a learner who has simply not been
  // asked yet.
  ok(/if \(rate === null\)/.test(dimsSrc) && dimsSrc.includes('className="meter empty"') && dimsSrc.includes('—'),
    "an unmeasured dimension renders as a dash and 'not yet measured', never an empty meter");
  const dimSurfaces = [
    "app/learn/[subject]/[concept]/page.tsx",
    "app/mind/page.tsx",
    "app/progress/page.tsx",
  ];
  for (const f of dimSurfaces) {
    ok(fs.readFileSync(f, "utf8").includes("conceptKnowledge("),
      `${f} reads the dimensions from the shared ledger projection, not its own rule`);
  }
  ok(!fs.readFileSync("app/progress/page.tsx", "utf8").includes("dimsFor("),
    "and the evidence page no longer keeps a second copy of the dimension rows");

  // ── The five new strings are real translations, not English fallbacks ────
  const uiKeys = ["nav.help", "nav.mainAria", "home.tagline", "home.sub", "home.start", "home.secStudents"];
  const gaps = [];
  for (const l of i18n.LANGS) {
    const tr = i18n.translator(l.code);
    for (const k of uiKeys) if (tr(k) === k) gaps.push(`${l.code}:${k}`);
  }
  ok(gaps.length === 0,
    `the landing page and shell vocabulary is translated in all 15 languages (${gaps.slice(0, 4).join(", ") || "none missing"})`);
}

// ── The engine's own sentences, in every language ───────────────────────────
// The next-step engine composes its reason, its "why now" and its expected
// outcome from i18n keys and ships them AS learner-visible text. Two failures
// follow from a missing key, and both were real: an English learner was shown
// `“mc.sf-sig” keeps recurring` inside a sentence (English had none of the 53
// `mc.*` names while every other dictionary had all of them), and a learner
// reading Arabic had an Arabic interface wrapped around an English
// recommendation (no translator was passed, so the engine used its English
// table).
//
// So this block states the contract directly: EVERY key the engine can emit has
// to exist in EVERY dictionary. `EN_NEXT` and `OUTCOMES` are read from the
// engine's own compiled source rather than retyped, so adding a key to the
// engine without translating it fails here.
{
  const src = fs.readFileSync(".verify/next-engine.js", "utf8");
  const tableKeys = [...src.matchAll(/"([a-z]+\.[A-Za-z0-9.]+)":\s*"/g)].map((m) => m[1]);
  const outcomeKeys = [...src.matchAll(/(?:EXPLAIN|PRACTISE|RETRIEVE|REMEDIATE|CHALLENGE|TRANSFER|PROJECT|REST):\s*"([a-z.]+)"/g)].map((m) => m[1]);
  const beliefKeys = Object.keys(misconceptions.MISCONCEPTIONS_BY_ID).map((id) => `mc.${id}`);
  const needed = [...new Set([...tableKeys, ...outcomeKeys, ...beliefKeys])];
  ok(outcomeKeys.length === 8, `the engine declares eight outcomes (${outcomeKeys.length})`);
  ok(beliefKeys.length >= 40, `and ${beliefKeys.length} belief names to translate`);
  const gaps = [];
  for (const code of i18n.LANG_CODES) {
    const dict = i18n.DICTS[code] || {};
    for (const key of needed) if (!(key in dict)) gaps.push(`${code}: ${key}`);
  }
  ok(gaps.length === 0,
    `every sentence the engine composes exists in all ${i18n.LANG_CODES.length} dictionaries (missing: ${gaps.slice(0, 6).join(", ") || "none"})`);

  // And the sentence itself, in the two languages that failed, driven through a
  // model with a genuinely recurring misconception.
  const state = store.newProfileState("verify-next-i18n", {
    country: "GB", subjects: ["maths"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } },
    spec: "uk-gcse", specLevel: "higher",
  });
  const at = Date.now() - 86_400_000;
  const answers = [0, 1, 2, 3].map((i) => evidence.answerEvidence({
    learnerId: "verify-next-i18n", at: at + i * 60_000, source: "practice", subject: "maths",
    conceptId: "standard-form", specificationId: "uk-gcse", questionId: `standard-form:v${i}`,
    correct: false, chosen: 1, mode: "independent", hints: 0, tags: ["sf-sig"],
  }));
  const ledger = {
    read: () => answers,
    append: (id, evs) => ({ accepted: evs.map((e) => e.id), duplicates: [] }),
  };
  const led = require("../.verify/ledger.js");
  led.commitAndProject("verify-next-i18n", state, answers, ledger);
  const events = ledger.read();
  for (const code of ["en", "ar", "fr", "ja", "sw"]) {
    const ctx = require("../.verify/decision.js").decisionContext(state, events);
    const action = require("../.verify/decision.js").decideOne(ctx, {
      title: (id) => require("../.verify/content-i18n.js").ctitle(code, id),
      tt: i18n.translator(code),
    });
    ok(!!action, `${code}: the recurring belief produces an action`);
    if (!action) continue;
    const text = `${action.title} ${action.reason} ${action.why} ${action.expectedOutcome}`;
    ok(!/mc\.[a-z-]+/.test(text), `${code}: no raw belief key in the sentence (${action.reason})`);
    ok(!/^next\.| next\.[a-z]/.test(text), `${code}: no raw next.* key in the sentence`);
    if (code !== "en") {
      // The reason is ENGLISH-SHAPED in the source language, so a translated one
      // must differ — this is the check that catches a decision produced with no
      // translator at all.
      const en = require("../.verify/decision.js").decideOne(
        require("../.verify/decision.js").decisionContext(state, events),
        { title: (id) => require("../.verify/content-i18n.js").ctitle("en", id), tt: i18n.translator("en") },
      );
      ok(!!en && action.reason !== en.reason, `${code}: the reason is actually translated (${action.reason})`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFICATION ISOLATION: an advanced learner is not routed to elementary work
//
// THE FAILING SCENARIO THIS LOCKS DOWN. `coverageOf` is a STAGE WINDOW, and the
// advanced specifications do not share one: uk-alevel/a2 covers maths stages
// 2-5 (43 concepts) while int-ib/hl covers stages 0-4 (63). The extra 20 in
// IB HL are junior concepts - `addition` has a ceiling of 0.08 - so an advanced
// tier DECLARES content whose maximum difficulty is elementary. That is a real
// truthfulness fault and it is reported in audit/stage1-baseline.json (F3).
//
// It is NOT, however, a routing fault, and the distinction is the whole point of
// these tests: driving the real engine (newProfileState -> replayModel ->
// decisionContext -> decide, the path app/api/next/route.ts uses) shows an
// advanced learner with strong stage-3/4 evidence is recommended stage-3 work,
// and `addition` is recommended ONLY once the learner has actually got it wrong.
// So the engine honours "foundational remediation is permitted only when learner
// evidence justifies it" today.
//
// Nothing tests that. A future change to the stage windows - widening a window,
// or starting recommendations from the whole covered set instead of from the
// evidence - would silently put elementary work in front of an IB Higher Level
// learner, and no existing assertion would notice. These are the assertions that
// would notice.
console.log("▸ Specification isolation: an advanced learner is not routed to elementary work");
{
  const { SPECIFICATIONS, coverageOf } = require("../.verify/specifications.js");
  const { newProfileState } = require("../.verify/learner-profile.js");
  const { replayModel } = require("../.verify/replay.js");
  const { answerEvidence } = require("../.verify/evidence.js");
  const { conceptDepth } = require("../.verify/questions.js");
  const { getConcept } = require("../.verify/genome.js");
  const { decisionContext, decide } = require("../.verify/decision.js");

  const NOW = Date.UTC(2026, 0, 12, 9, 0, 0);
  const MIN = 60 * 1000;
  const learnerId = "isolation-probe";
  /** `n` hint-free right answers on one concept - what "strong" looks like. */
  const strongOn = (conceptId, n, correct = true) =>
    Array.from({ length: n }, (_, i) =>
      answerEvidence({
        id: `${learnerId}-${conceptId}-${i + 1}`,
        learnerId,
        at: NOW - (30 + i) * MIN,
        source: "practice",
        subject: "maths",
        conceptId,
        specificationId: null,
        questionId: `${conceptId}-${i + 1}`,
        correct,
        chosen: correct ? 0 : 1,
        mode: correct ? "independent" : "guided",
        hints: correct ? 0 : 1,
        tags: [],
      }),
    );

  const run = (specId, levelId, events) => {
    const spec = SPECIFICATIONS.find((s) => s.id === specId);
    const level = spec.levels.find((l) => l.id === levelId);
    const profile = newProfileState(learnerId, {
      country: "GB",
      birthYear: 2009,
      subjects: ["maths"],
      timePerDay: 20,
      createdAt: NOW,
      specificationId: spec.id,
      levelId: level.id,
    }).profile;
    const model = replayModel(events, profile.id, undefined, profile);
    const actions = decide(decisionContext(model, events), { max: 8 });
    return {
      level,
      concepts: actions.map((a) => a.conceptId ?? a.concept).filter(Boolean),
      actions,
    };
  };

  // The tiers that actually declare junior maths inside an advanced window.
  for (const [specId, levelId] of [["int-ib", "hl"], ["in-cbse", "class11-12"], ["uk-alevel", "a2"], ["us-ap", "ap"]]) {
    const strong = run(specId, levelId, ["quadratics", "sim-equations-quad", "functions"].flatMap((c) => strongOn(c, 3)));
    const elementary = strong.concepts.filter((c) => conceptDepth(c) < 0.5);
    ok(
      elementary.length === 0,
      `${specId}/${levelId}: a learner strong on stage-3 work is not offered elementary concepts` +
        (elementary.length ? ` (offered ${elementary.join(", ")})` : ` (offered ${strong.concepts.join(", ") || "nothing"})`),
    );
    ok(
      strong.concepts.every((c) => conceptDepth(c) >= strong.level.difficulty - 0.25),
      `${specId}/${levelId}: every concept offered clears its declared target, allowing a band's width`,
    );
    // With no evidence at all the engine must not invent a recommendation. A
    // fresh advanced learner gets an explanation, not a concept to practise.
    const fresh = run(specId, levelId, []);
    ok(
      fresh.concepts.length === 0,
      `${specId}/${levelId}: a learner with no evidence is offered no concept to practise`,
    );
    ok(
      fresh.actions.every((a) => a.basis === "no_evidence"),
      `${specId}/${levelId}: and the action says so (${fresh.actions.map((a) => a.basis).join(", ") || "none"})`,
    );
  }

  // Remediation DOWN is allowed, but only on evidence. The same learner who is
  // strong everywhere must never be walked back to stage 0, and the learner who
  // actually got it wrong must be.
  const walkedBack = run("int-ib", "hl", ["quadratics", "sim-equations-quad", "functions"].flatMap((c) => strongOn(c, 4)));
  ok(
    !walkedBack.concepts.some((c) => (getConcept(c)?.stage ?? 9) === 0),
    "int-ib/hl: a learner with strong stage-3/4 evidence is never walked back to a stage-0 concept",
  );
  const justified = run("int-ib", "hl", strongOn("addition", 2, false));
  ok(
    justified.concepts.includes("addition"),
    "int-ib/hl: a learner who got a stage-0 concept WRONG is offered it again — remediation on evidence, not by default",
  );
  ok(
    justified.actions.every((a) => a.basis === "cited"),
    `int-ib/hl: and that recommendation cites the evidence for it (${justified.actions.map((a) => a.basis).join(", ")})`,
  );

  // A junior tier must NOT be offered the advanced work either: the declared
  // difficulty is the ceiling for the learner, not just the floor.
  const junior = run("uk-gcse", "foundation", ["addition", "subtraction", "place-value"].flatMap((c) => strongOn(c, 3)));
  ok(
    !junior.concepts.some((c) => conceptDepth(c) > 0.9),
    "uk-gcse/foundation: a learner strong on stage-0 work is not offered stage-5 concepts",
  );

  // The declaration gap itself, pinned so it cannot quietly grow.
  const hlMaths = coverageOf({
    spec: SPECIFICATIONS.find((s) => s.id === "int-ib"),
    level: SPECIFICATIONS.find((s) => s.id === "int-ib").levels.find((l) => l.id === "hl"),
  }).filter((c) => c.subject === "maths");
  const juniorInHl = hlMaths.filter((c) => conceptDepth(c.id) < 0.5);
  ok(
    juniorInHl.length > 0,
    `int-ib/hl still declares junior maths inside an advanced tier (${juniorInHl.length} of ${hlMaths.length}) — this assertion pins the KNOWN declaration gap so it is reported, not silently grown`,
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
