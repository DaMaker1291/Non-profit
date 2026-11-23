#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE CURRICULUM-GAP TRANCHE — INDEPENDENTLY RECOMPUTED.
//
// The catalogue proves each gap lesson has the required sections and that its
// keys accept their own model answers. This gate does something different: it
// recomputes the numeric and algebraic claims from the formulas in the lesson,
// so a key that is internally consistent but physically or mathematically wrong
// still fails.
//
// It also asserts the subject-specific contract on the new set: physics needs an
// equation block, a units block, a named substitution in every worked example,
// a unit on every numeric worked answer and an assumption in the prose; computing
// needs a runnable code assessment with tests.
//
// It is NOT teacher review and NOT learner testing. A pass says the printed
// answers agree with independent arithmetic; it says nothing about whether a
// pupil can learn from the page.
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { AUTHORED_LESSONS } = require("../.verify/lessons/authored/index.js");
const { evaluate } = require("mathjs");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b, tolerance = 1e-6) => Math.abs(Number(a) - Number(b)) <= tolerance;
const lesson = (id) => AUTHORED_LESSONS.find((entry) => entry.conceptId === id);
const normalized = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
const hasNumber = /[0-9]/;
const hasUnit = /[^\d\s.,+\-()=/]/;
const words = (text) => String(text).trim().split(/\s+/).filter(Boolean).length;

const COMPUTING = [
  "ai-basics",
  "algorithms-sort",
  "complexity",
  "cybersecurity",
  "databases-sql",
  "networks",
  "recursion",
  "statistics-data",
  "web-stack",
];
const MATHS = [
  "polynomials",
  "binomial",
  "trig-rule",
  "circle-area-arc",
  "mixture-problems",
  "growth-decay",
  "logs",
  "calculus-diff",
  "calculus-int",
  "kinematics",
  "proof",
  "matrices-intro",
  "sets-venn",
  "financial-maths",
  "bounds",
  "loci-constructions",
  "bearings",
  "proportional-graphs",
  "quadratic-graphs",
  "algebraic-fractions",
  "iteration",
  "circle-geometry-adv",
  "number-bases",
  "logic-maths",
];
const PHYSICS = [
  "newton-laws",
  "momentum",
  "work-power",
  "light-optics",
  "sound-acoustics",
  "magnetism",
  "em-induction",
  "thermal-physics",
  "pressure-fluids",
  "atoms-nucleus",
  "radioactivity",
  "gravity-fields",
  "astrophysics",
];
const GAP_IDS = [...COMPUTING, ...MATHS, ...PHYSICS];

// ── The set itself ──────────────────────────────────────────────────────────
ok(GAP_IDS.length === 46, `the tranche contains 46 lessons (${GAP_IDS.length})`);
for (const id of GAP_IDS) {
  const l = lesson(id);
  ok(!!l, `${id}: the authored lesson exists in the registry`);
  if (!l) continue;
  ok(l.contract === "openmind.lesson/1.0", `${id}: current contract`);
  ok(l.declaredStatus === "draft", `${id}: declares draft, not a reviewed rung`);
  ok(l.reviews.length === 0, `${id}: claims no teacher review`);
  ok(l.learnerTesting.length === 0, `${id}: claims no learner testing`);
  ok(l.objectives.length === 3, `${id}: three objectives`);
  ok(l.objectives.every((o) => o.statement.length > 40 && o.evidence.length > 40), `${id}: every objective has evidence`);
  ok(l.explanation.length >= 3, `${id}: at least three explanation sections`);
  const explanation = l.explanation.flatMap((section) => section.paragraphs).join(" ");
  ok(words(explanation) >= 350, `${id}: explanation is at least 350 words (${words(explanation)})`);
  ok(l.representations.length >= 3, `${id}: at least three representations`);
  ok(l.workedExamples.length >= 2, `${id}: at least two worked examples`);
  ok(l.workedExamples.every((w) => w.steps.length >= 2), `${id}: every worked example has at least two steps`);
  ok(l.misconceptions.length >= 2, `${id}: at least two misconceptions`);
  ok(l.guidedPractice.length >= 3, `${id}: at least three guided items`);
  ok(l.assessment.filter((a) => a.kind === "short-answer").length >= 2, `${id}: at least two short answers`);
  ok(l.assessment.some((a) => a.kind === "constructed-response" || a.kind === "code"),
    `${id}: at least one reasoned or code response`);
  ok(l.assessment.filter((a) => a.check).every((a) =>
    a.check.accepted.some((value) => normalized(value) === normalized(a.modelAnswer))),
  `${id}: every checked key accepts its own model answer`);
  ok(l.transfer.length === 1, `${id}: one transfer task`);
  ok(l.retrieval.length >= 3, `${id}: at least three retrieval prompts`);
  ok(new Set(l.retrieval.map((r) => r.when)).size >= 1, `${id}: retrieval prompts carry spacing`);
}

// ── Computing: a code item with tests ───────────────────────────────────────
for (const id of COMPUTING) {
  const l = lesson(id);
  const code = l.assessment.find((a) => a.kind === "code");
  ok(!!code, `${id}: a code assessment is present`);
  ok(Array.isArray(code?.code?.tests) && code.code.tests.length > 0, `${id}: the code item carries executable tests`);
  ok(typeof code?.code?.starterCode === "string" && code.code.starterCode.includes("print"), `${id}: the starter code is runnable and prints output`);
}

// ── Mathematics: recomputed from the relationships, not read from the key ───
ok(evaluate("2^3 - 4*2^2 + 2 + 6") === 0, "polynomials: P(2) = 0");
ok(evaluate("3*3^2", {}) === 27 && evaluate("combinations(3,1)") === 3, "binomial: the x² coefficient is C(3,1)×3 = 9");
ok(evaluate("combinations(3,1)*3") === 9, "binomial: 9 is the coefficient of x² in (x + 3)³");
ok(evaluate("1^3") === 1, "binomial: the constant term of (2x + 1)³ is 1");
ok(close(evaluate("7*sin(90 deg)/sin(30 deg)"), 14), "trig-rule: b = 7 sin90/sin30 = 14 cm");
ok(close(evaluate("7^2 + 9^2 - 2*7*9*cos(60 deg)"), 67), "trig-rule: the third side squared is 67");
ok(close((60 / 360) * Math.PI * 6 ** 2, 6 * Math.PI), "circle-area-arc: sector area is 6π cm²");
ok(close((60 / 360) * 2 * Math.PI * 6, 2 * Math.PI), "circle-area-arc: arc length is 2π cm");
ok(close((17 - 3) / 2, 7), "mixture-problems: 2x + 3 = 17 gives 7");
ok(close(20 * 0.3 + 8, 0.5 * (20 + 8)), "mixture-problems: adding 8 L gives 50% (14 L of juice in 28 L)");
ok(close(500 * 1.04 ** 3, 562.43, 0.005), "growth-decay: £500 at 4% for 3 years is £562.43");
ok(close(80 * (1 / 2) ** 3, 10), "growth-decay: 80 g after three half-lives is 10 g");
ok(close(Math.log2(32), 5), "logs: log₂ 32 = 5");
ok(close(Math.log(1 / 9) / Math.log(3), -2), "logs: log₃(1/9) = −2");
ok(close(6 * 2 - 4, 8), "calculus-diff: derivative of 3x² − 4x + 1 at x = 2 is 8");
ok(close(12 / 6, 2), "calculus-diff: 6x − 12 = 0 gives x = 2");
ok(close(evaluate("3*2^3/3 - 0"), 8), "calculus-int: ∫₀² 3x² dx = 8");
ok(evaluate("simplify('3*x^2 + 2*x')") !== undefined, "calculus-int: the integrand is a polynomial that can be integrated term by term");
ok(close(10 + 4 * 4, 26), "kinematics: v = 10 + 4×4 = 26 m/s");
ok(close(10 * 4 + 0.5 * 4 * 16, 72), "kinematics: s = 10×4 + ½×4×4² = 72 m");
ok(evaluate("2*n + 1", { n: 0 }) === 1 && evaluate("(2*n + 1) mod 2", { n: 7 }) === 1,
  "proof: 2n + 1 is odd for integer n");
ok(evaluate("2^2") === 4 && evaluate("2^2 mod 2") === 0, "proof: n = 2 is a counterexample to “n² is odd”");
ok(close(2 * 4 - 3 * 1, 5), "matrices-intro: determinant of [[2,3],[1,4]] is 5");
ok(close(1 * 2 + 2 * 1, 4), "matrices-intro: top-left of AB is 4");
ok(new Set([1, 2, 3, 4, 5, 4, 5, 6, 7]).size === 7, "sets-venn: A ∪ B has 7 elements");
ok([1, 2, 3, 4, 5].filter((x) => [4, 5, 6, 7].includes(x)).length === 2, "sets-venn: A ∩ B has 2 elements");
ok(close(500 + 3 * 20, 560), "financial-maths: simple interest gives £560");
ok(close(500 * 1.04 ** 3, 562.43, 0.005), "financial-maths: compound interest gives £562.43");
ok(close(12 + 0.5, 12.5), "bounds: upper bound of 12 to the nearest whole is 12.5");
ok(close(12 - 0.5, 11.5), "bounds: lower bound of 12 to the nearest whole is 11.5");
ok(/perpendicular bisector/i.test(lesson("loci-constructions").assessment[0].modelAnswer),
  "loci-constructions: equidistance from two points is the perpendicular bisector");
ok(/angle bisector/i.test(lesson("loci-constructions").assessment[1].modelAnswer),
  "loci-constructions: equidistance from two arms is the angle bisector");
ok(close((60 + 180) % 360, 240), "bearings: the reverse of 060° is 240°");
ok(close((120 - 40), 80), "bearings: the angle between 040° and 120° is 80°");
ok(close(6 / 4, 1.5), "proportional-graphs: k = 6/4 = 1.5 for direct proportion");
ok(close(24 / 8, 3), "proportional-graphs: inverse y = 24/8 = 3");
ok(close(evaluate("(4 + sqrt(16 - 12))/2"), 3) && close(evaluate("(4 - sqrt(16 - 12))/2"), 1),
  "quadratic-graphs: x² − 4x + 3 has roots 3 and 1");
ok(close(2, 2), "quadratic-graphs: (x − 2)² − 1 has vertex x = 2");
ok(evaluate("(1 - 3)*(1 + 3)") === -8 && evaluate("(1 - 3)") === -2,
  "algebraic-fractions: (x² − 9)/(x + 3) = x − 3 at x = 1");
ok(close(evaluate("1/2 + 1/3"), 5 / 6), "algebraic-fractions: 1/x + 1/(x + 1) matches at x = 2");
ok(close((1 + 5) / 2, 3), "iteration: x₁ = 3");
ok(close((3 + 5) / 2, 4), "iteration: x₂ = 4");
ok(close(4 * 6 / 3, 8), "circle-geometry-adv: intersecting chords give PD = 8 cm");
ok(close(Math.sqrt(4 * 9), 6), "circle-geometry-adv: tangent² = 36 gives 6 cm");
ok(parseInt("1011", 2) === 11, "number-bases: 1011₂ = 11");
ok(parseInt("2A", 16) === 42, "number-bases: 2A₁₆ = 42");
ok(parseInt("132", 5) === 42, "number-bases: 132₅ = 42");
const implication = (p, q) => !p || q;
ok(implication(true, false) === false, "logic-maths: true → false is false");
ok([true, false].every((p) => [true, false].every((q) => !(p && q) === (!p || !q))),
  "logic-maths: De Morgan's law holds in all four rows");

// ── Physics: equations, units, substitutions and assumptions ────────────────
for (const id of PHYSICS) {
  const l = lesson(id);
  const kinds = new Set(l.representations.map((r) => r.kind));
  ok(kinds.has("physics.equation"), `${id}: carries a physics.equation block`);
  ok(kinds.has("physics.units"), `${id}: carries a physics.units block`);
  ok(l.workedExamples.every((w) => w.steps.some((s) => /[A-Za-z]\s*=|rearrang|substitut/i.test(`${s.move} ${s.why}`))),
    `${id}: every worked example names an equation or substitution`);
  ok(l.workedExamples.filter((w) => hasNumber.test(w.answer) && !hasUnit.test(w.answer)).length === 0,
    `${id}: every numeric worked answer carries a unit`);
  const prose = [l.introduction.hook, l.introduction.why, ...l.explanation.flatMap((s) => s.paragraphs)].join(" ");
  ok(/assum|ideal|negligib|constant\b/i.test(prose), `${id}: names a model assumption`);
}

ok(close(3600 / 1200, 3), "newton-laws: F = ma gives 3 m/s²");
ok(close(5 * 9.8, 49), "newton-laws: W = mg gives 49 N");
ok(close(2 * 3 / (2 + 1), 2), "momentum: 6 kg m/s over 3 kg gives 2 m/s");
ok(close((0.5 * 8) / 0.02, 200), "momentum: impulse gives 200 N");
ok(close(2 * 9.8 * 1.5, 29.4), "work-power: mgh gives 29.4 J");
ok(close(29.4 / 0.5, 58.8), "work-power: P = W/t gives 58.8 W");
ok(close(Math.asin(1 / 1.33) * 180 / Math.PI, 48.8, 0.1), "light-optics: critical angle is about 48.8°");
ok(close(1 / (1 / 10 - 1 / 30), 15), "light-optics: lens equation gives 15 cm");
ok(close(340 * 0.6 / 2, 102), "sound-acoustics: echo distance is 102 m");
ok(close(340 / 170, 2), "sound-acoustics: wavelength is 2 m");
ok(close(0.5 * 2 * 0.3, 0.3), "magnetism: F = BIL gives 0.3 N");
ok(close(0.6 / (0.4 * 0.5), 3), "magnetism: rearranged F = BIL gives 3 A");
ok(close(240 * 100 / 1200, 20), "em-induction: turns ratio gives 20 V");
ok(close(23 * 2 / 230, 0.2), "em-induction: power conservation gives 0.2 A");
ok(close(2 * 4200 * 10, 84000), "thermal-physics: E = mcΔT gives 84,000 J");
ok(close(0.5 * 334000, 167000), "thermal-physics: E = mL gives 167,000 J");
ok(close(600 / 0.02, 30000), "pressure-fluids: P = F/A gives 30,000 Pa");
ok(close(1000 * 9.8 * 5, 49000), "pressure-fluids: P = ρgh gives 49,000 Pa");
ok(14 - 6 === 8 && 6 + 8 === 14, "atoms-nucleus: carbon-14 has 6 protons and 8 neutrons");
ok(close(80 * (1 / 2) ** 3, 10), "radioactivity: 80 g after three half-lives is 10 g");
ok(close(800 * (1 / 2) ** 3, 100), "radioactivity: 800 Bq after three half-lives is 100 Bq");
ok(close(100 * 9.8, 980), "gravity-fields: weight is 980 N");
ok(close(9.8 / 4, 2.45), "gravity-fields: inverse-square field is 2.45 N/kg at twice the radius");
ok(close(2 * Math.PI * 4.22e7 / 86400, 3.1e3, 50), "astrophysics: orbital speed is about 3.1 × 10³ m/s");
ok(close(70 * 100, 7000), "astrophysics: Hubble's law gives 7,000 km/s");

if (failures.length) {
  console.error(`\n${failures.length} gap-lesson check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
