// Does an ADVANCED learner actually get routed to ELEMENTARY work?
//
// The specification-coverage measurement says 13 of 16 advanced tiers declare
// maths concepts whose ceiling is as low as 0.08 (int-ib/hl sweeps stages 0-4;
// uk-alevel/a2 sweeps 2-5). A declared-coverage gap is only a LABEL fault. What
// would be an EDUCATIONAL fault is the engine recommending one of those
// concepts — "advanced learners receive elementary work without evidence" is on
// the list of things that make the product not ready.
//
// So this drives the REAL production path: newProfileState -> replayModel ->
// decisionContext -> decide, exactly as app/api/next/route.ts does, and reports
// what it recommends for several evidence histories. It is a probe, not a gate:
// it prints, so the numbers can be read before deciding what to assert.
//
// Run: node scripts/compile-mirror.mjs && node audit/spec-routing-probe.mjs

const V = "../.verify";
const { decisionContext, decide } = await import(`${V}/decision.js`);
const { newProfileState } = await import(`${V}/learner-profile.js`);
const { replayModel } = await import(`${V}/replay.js`);
const { answerEvidence } = await import(`${V}/evidence.js`);
const { conceptDepth } = await import(`${V}/questions.js`);
const { getConcept } = await import(`${V}/genome.js`);
const { SPECIFICATIONS } = await import(`${V}/specifications.js`);

const NOW = Date.UTC(2026, 0, 12, 9, 0, 0);
const MIN = 60 * 1000;

/** An answer sheet: `n` correct, hint-free answers on one concept. */
function answers(learnerId, conceptId, n, { correct = true, minutesAgo = 30 } = {}) {
  return Array.from({ length: n }, (_, i) =>
    answerEvidence({
      id: `${learnerId}-${conceptId}-${i + 1}`,
      learnerId,
      at: NOW - minutesAgo * MIN + i * MIN,
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
}

const r2 = (n) => Math.round(n * 100) / 100;

/** Every distinct concept the engine names, with the facts a reader needs. */
function recommended(actions) {
  return actions
    .map((a) => a.conceptId ?? a.concept ?? null)
    .filter(Boolean)
    .map((id) => ({
      id,
      stage: getConcept(id)?.stage ?? null,
      ceiling: r2(conceptDepth(id)),
    }));
}

const CASES = [
  {
    label: "IB HL, three independent correct answers on a stage-3 concept",
    spec: "int-ib",
    level: "hl",
    on: ["quadratics", "sim-equations-quad", "functions"],
    n: 3,
  },
  {
    label: "IB HL, strong on four stage-3/4 concepts (clearly not a beginner)",
    spec: "int-ib",
    level: "hl",
    on: ["quadratics", "sim-equations-quad", "functions", "circle-theorems"],
    n: 4,
  },
  {
    label: "IB HL, WRONG twice on addition — remediation is justified here",
    spec: "int-ib",
    level: "hl",
    on: ["addition"],
    n: 2,
    correct: false,
  },
  {
    label: "A2, strong on four stage-3/4 concepts",
    spec: "uk-alevel",
    level: "a2",
    on: ["quadratics", "sim-equations-quad", "functions", "circle-theorems"],
    n: 4,
  },
];

console.log("Does the PRODUCTION engine route an advanced learner to elementary work?\n");
const rows = [];
for (const c of CASES) {
  const spec = SPECIFICATIONS.find((s) => s.id === c.spec);
  const level = spec.levels.find((l) => l.id === c.level);
  const learnerId = `probe-${c.spec}-${c.n}-${c.correct ? "right" : "wrong"}`;
  const profile = newProfileState(learnerId, {
    country: "GB",
    birthYear: 2009,
    subjects: ["maths"],
    timePerDay: 20,
    createdAt: NOW,
    specificationId: spec.id,
    levelId: level.id,
  }).profile;

  const events = c.on.flatMap((id) => answers(learnerId, id, c.n, { correct: c.correct }));
  const model = replayModel(events, profile.id, undefined, profile);
  const actions = decide(decisionContext(model, events), { max: 8 });

  console.log(`── ${c.label}`);
  console.log(`   tier ${c.spec}/${c.level}, declared target ${level.difficulty}`);
  for (const a of actions) {
    const cid = a.conceptId ?? a.concept ?? null;
    console.log(
      `   ${String(a.kind).padEnd(16)} ${(cid ?? "-").padEnd(20)}` +
        ` stage=${String(cid ? getConcept(cid)?.stage : "-").padEnd(3)}` +
        ` ceiling=${cid ? r2(conceptDepth(cid)).toFixed(2) : "-"}` +
        ` basis=${a.basis}`,
    );
  }
  const recs = recommended(actions);
  const elementary = recs.filter((r) => r.ceiling < 0.5);
  console.log(
    `   → ${recs.length} concept recommendation(s); ${elementary.length} with a ceiling below 0.5` +
      (elementary.length ? `: ${elementary.map((r) => `${r.id}(stage ${r.stage}, ceiling ${r.ceiling})`).join(", ")}` : ""),
  );
  console.log();
  rows.push({ ...c, target: level.difficulty, recs, elementary });
}

console.log("SUMMARY");
for (const r of rows) {
  console.log(
    `  ${(r.spec + "/" + r.level).padEnd(22)} ${String(r.label).slice(0, 52).padEnd(54)}` +
      ` elementary=${r.elementary.length}/${r.recs.length}`,
  );
}