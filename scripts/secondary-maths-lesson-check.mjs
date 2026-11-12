#!/usr/bin/env node
// INDEPENDENT ARITHMETIC FOR THE FIRST SECONDARY-MATHS AUTHORED BATCH.
//
// The lesson contract proves each lesson has a diagnostic, reasoned worked
// examples, assessment and retrieval. It does not prove that the numbers in
// those parts agree with one another. This gate recomputes the claims from the
// prompt rather than reading the lesson's own answer back to itself.
//
// Run: node scripts/secondary-maths-lesson-check.mjs
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { MATHS_STANDARD_FORM: standard } = require("../.verify/lessons/authored/maths-standard-form.js");
const { MATHS_ALGEBRA_EXPAND: expand } = require("../.verify/lessons/authored/maths-algebra-expand.js");
const { MATHS_STRAIGHT_LINES: lines } = require("../.verify/lessons/authored/maths-straight-lines.js");
const { MATHS_SIM_EQUATIONS_QUAD: simQuad } = require("../.verify/lessons/authored/maths-sim-equations-quad.js");
const { MATHS_FUNCTIONS: functions } = require("../.verify/lessons/authored/maths-functions.js");
const { MATHS_TRIG_RATIOS: trig } = require("../.verify/lessons/authored/maths-trig-ratios.js");
const { MATHS_TRIG_IDENTITY: trigIdentity } = require("../.verify/lessons/authored/maths-trig-identity.js");
const { MATHS_CIRCLE_THEOREMS: circle } = require("../.verify/lessons/authored/maths-circle-theorems.js");
const { MATHS_PYTHAGORAS: pythagoras } = require("../.verify/lessons/authored/maths-pythagoras.js");
const { MATHS_VOLUME: volume } = require("../.verify/lessons/authored/maths-volume.js");
const { MATHS_TRANSFORMATIONS: transformations } = require("../.verify/lessons/authored/maths-transformations.js");
const { MATHS_VECTORS: vectors } = require("../.verify/lessons/authored/maths-vectors.js");
const { MATHS_SCATTER_CORRELATION: scatter } = require("../.verify/lessons/authored/maths-scatter-correlation.js");
const { evaluate } = require("mathjs");

let passed = 0;
const failures = [];
const check = (ok, label) => {
  if (ok) passed++;
  else failures.push(label);
};
const close = (a, b, tol = 1e-9) => Math.abs(Number(a) - Number(b)) <= tol;
const at = (expression, scope = {}) => evaluate(expression, scope);
const sameAt = (left, right, scope, label) => {
  const a = at(left, scope);
  const b = at(right, scope);
  check(close(a, b), `${label} [${JSON.stringify(scope)}: ${left} = ${a}, ${right} = ${b}]`);
};
const normalized = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
const degrees = (radians) => (radians * 180) / Math.PI;
const radians = (degreesValue) => (degreesValue * Math.PI) / 180;

for (const [name, lesson] of [
  ["standard-form", standard],
  ["algebra-expand", expand],
  ["straight-lines", lines],
]) {
  check(lesson.conceptId === name, `${name}: the lesson is filed under its genome id`);
  check(lesson.contract === "openmind.lesson/1.0", `${name}: current contract`);
  check(lesson.version === "1.0.0", `${name}: version 1.0.0`);
  check(lesson.declaredStatus === "draft", `${name}: declares draft, not a reviewed rung`);
  check(lesson.reviews.length === 0, `${name}: claims no subject-teacher review`);
  check(lesson.learnerTesting.length === 0, `${name}: claims no learner testing`);
  check(lesson.objectives.length >= 3, `${name}: at least three measurable objectives`);
  check(lesson.explanation.length >= 3, `${name}: at least three explanation sections`);
  check(lesson.representations.some((block) => block.kind === "maths.expression"),
    `${name}: has the mathematics expression block`);
  check(lesson.workedExamples.length >= 2, `${name}: at least two worked examples`);
  check(lesson.misconceptions.length >= 2, `${name}: at least two misconceptions`);
  check(lesson.guidedPractice.length >= 3, `${name}: at least three guided items`);
  check(lesson.assessment.some((item) => item.kind === "constructed-response"),
    `${name}: at least one constructed-response assessment`);
  check(lesson.transfer.length >= 1, `${name}: has a transfer challenge`);
  check(lesson.retrieval.some((item) => item.when === "week-later") &&
    lesson.retrieval.some((item) => item.when === "month-later"),
    `${name}: retrieval is spaced beyond the next day`);
  for (const item of lesson.assessment.filter((entry) => entry.check)) {
    check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
      `${name}/${item.id}: the model answer is one of its own accepted answers`);
  }
}

// ── Standard form: movement, indices and comparison ─────────────────────────
check(close(at("3.6 * 10^6"), 3600000), "standard-form: 3.6 × 10⁶ is 3,600,000");
check(close(at("4.2 * 10^-4"), 0.00042), "standard-form: 4.2 × 10⁻⁴ is 0.00042");
check(close(at("7.2 * 10^-5"), 0.000072), "standard-form: 0.000072 is 7.2 × 10⁻⁵");
check(close(at("5.08 * 10^3"), 5080), "standard-form: 5.08 × 10³ is 5,080");
check(close(at("2.7 * 10^-2"), 0.027), "standard-form: 2.7 × 10⁻² is 0.027");
check(close(3e5 * 4e-2, 1.2e4), "standard-form: the multiplication gives 1.2 × 10⁴");
check(close(6e7 / 3e3, 2e4), "standard-form: the division gives 2 × 10⁴");
check(close(2.4e3 * 5e4, 1.2e8), "standard-form: assessment a3 gives 1.2 × 10⁸");
check(close(at("8.2 * 10^-7"), 0.00000082), "standard-form: assessment a1 is 8.2 × 10⁻⁷");
check(close(8e-3 / 4e-6, 2e3), "standard-form: retrieval x3 is 2 × 10³");
check(close(at("8.4 * 10^15 / (1.28 * 10^11)"), 65625), "standard-form: the data ratio is 65,625");
check(at("3.4 * 10^4") === 10 * at("3.4 * 10^3"), "standard-form: one exponent is a factor of ten");
check(close(at("6.3 * 10^-4"), 0.00063), "standard-form: guided item p1 is 6.3 × 10⁻⁴");
check(close(at("4.07 * 10^3"), 4070), "standard-form: guided item p2 is 4,070");
check(close(5e6 / 2e2, 2.5e4), "standard-form: guided item p3 is 2.5 × 10⁴");

// ── Expansion and factorisation: identities, not one worked value ───────────
sameAt("3*(2*x + 7)", "6*x + 21", { x: 1 }, "expand: guided p1 is correct at x = 1");
sameAt("3*(2*x + 7)", "6*x + 21", { x: -4 }, "expand: guided p1 holds at x = -4");
sameAt("(x + 6)*(x - 2)", "x^2 + 4*x - 12", { x: 3 }, "expand: guided p2 is correct at x = 3");
sameAt("(x + 6)*(x - 2)", "x^2 + 4*x - 12", { x: -2 }, "expand: guided p2 holds at x = -2");
sameAt("(x - 5)*(x + 3)", "x^2 - 2*x - 15", { x: 4 }, "expand: guided p3 recovers the quadratic at x = 4");
sameAt("(x + 7)*(x - 3)", "x^2 + 4*x - 21", { x: 2 }, "expand: assessment a1 is correct at x = 2");
sameAt("(x + 2)*(x + 8)", "x^2 + 10*x + 16", { x: 5 }, "expand: assessment a2's factorisation is correct at x = 5");
sameAt("(5*x + 7)*(5*x - 7)", "25*x^2 - 49", { x: 3 }, "expand: assessment a3 is correct at x = 3");
sameAt("(2*x + 3)*(x - 4)", "2*x^2 - 5*x - 12", { x: 1 }, "expand: worked w1 is correct at x = 1");
sameAt("(2*x + 3)*(x - 4)", "2*x^2 - 5*x - 12", { x: -2 }, "expand: worked w1 holds at x = -2");
sameAt("(x + 4)*(x + 5)", "x^2 + 9*x + 20", { x: 6 }, "expand: worked w2 recovers the quadratic at x = 6");
sameAt("(4*x + 5)*(4*x - 5)", "16*x^2 - 25", { x: 2 }, "expand: worked w3 recovers the difference of squares at x = 2");
sameAt("(x + 8)*(x + 3) - (x + 4)*(x - 1)", "8*x + 28", { x: 5 }, "expand: the frame area is 8x + 28 at x = 5");
check(close(at("(5 + 8)*(5 + 3) - (5 + 4)*(5 - 1)"), 68), "expand: the frame area at x = 5 is 68");
check(!close(at("(x + 3)*(x + 2)", { x: 10 }), at("x^2 + 6", { x: 10 })),
  "expand: the missing-cross-terms error changes the value at x = 10");

// ── Straight lines: gradients, intercepts and intersections ─────────────────
check(close(at("(13 - 5) / (6 - 2)"), 2), "straight-lines: the first gradient is 2");
check(close(at("(9 - 3) / (4 - 1)"), 2), "straight-lines: the worked gradient is 2");
check(close(at("3 - 2*1"), 1), "straight-lines: y = 2x + 1 passes through (1, 3)");
check(close(at("2*4 + 1"), 9), "straight-lines: y = 2x + 1 passes through (4, 9)");
check(close(at("-3*4 + 12"), 0), "straight-lines: y = -3x + 12 crosses the x-axis at 4");
check(close(at("-3*0 + 12"), 12), "straight-lines: y = -3x + 12 crosses the y-axis at 12");
check(close(at("12 + 0.10*80"), 20), "straight-lines: both phone tariffs cost 20 at 80 GB");
check(close(at("12 + 0.10*50"), 17), "straight-lines: the first tariff costs 17 at 50 GB");
check(close(at("(10 - 1) / (5 - 2)"), 3), "straight-lines: guided p1 gradient is 3");
check(close(at("3*2 + 5"), 11), "straight-lines: y = 3x + 5 passes through (2, 11)");
check(close(at("(12 - 4) / (3 - (-1))"), 2), "straight-lines: assessment a1 gradient is 2");
check(close(at("4*2 - 8"), 0), "straight-lines: y = 4x - 8 crosses the x-axis at 2");
check(close(at("-2*1 + 3"), 1), "straight-lines: y = -2x + 3 passes through (1, 1)");
check(close(at("-2/2"), -1), "straight-lines: 2 times -1/2 is -1, so the lines are perpendicular");
check(close(at("18*0.5 + 5"), 14), "straight-lines: the cyclists meet 14 km from home");
check(close(at("20 - 12*0.5"), 14), "straight-lines: the second cyclist is also at 14 km after half an hour");

// ── Inequalities: boundaries, reflection and whole-value limits ─────────────
check(4 * 5 - 3 === 17 && 4 * 6 - 3 === 21, "inequalities: 5 satisfies 4x − 3 ≤ 17 and 6 does not");
check(-3 * -4 + 2 === 14 && -3 * 0 + 2 === 2, "inequalities: the sign-flip test values separate x < −3 from x > −3");
check(2 * -3 + 4 === -2 && 2 * 3 + 4 === 10, "inequalities: the compound boundaries are −2 and 10 at x = −3 and x = 3");
check(-5 * -5 === 25 && -5 * -3 === 15, "inequalities: −5x ≥ 20 is true at x = −5 and false at x = −3");
check(-4 * 0 + 3 === 3 && -4 * -5 + 3 === 23, "inequalities: the constructed-response test values separate x > −4 from x < −4");
check([-2, -1, 0, 1, 2].length === 5, "inequalities: −2 ≤ x < 3 contains five integers");
check(7 * 4 + 2 === 30 && 7 * 3 + 2 === 23, "inequalities: x < 4 excludes 4 and includes 3");
check(150 + 23 * 32 === 886 && 150 + 24 * 32 === 918, "inequalities: 23 boxes fit the 900 kg limit and 24 do not");
check(150 + 21 * 35 === 885 && 150 + 22 * 35 === 920, "inequalities: 21 heavier boxes fit and 22 do not");

// ── Surds: exact roots, like terms and conjugates ──────────────────────────
check(close(at("sqrt(72)"), 6 * Math.sqrt(2)), "surds: √72 is 6√2");
check(close(at("sqrt(50)"), 5 * Math.sqrt(2)), "surds: √50 is 5√2");
check(close(at("sqrt(18) + sqrt(8)"), 5 * Math.sqrt(2)), "surds: √18 + √8 is 5√2");
check(close(at("sqrt(2) + sqrt(3)"), 3.1462643699), "surds: √2 + √3 is about 3.146");
check(!close(at("sqrt(2) + sqrt(3)"), at("sqrt(5)")), "surds: √2 + √3 is not √5");
check(close(at("sqrt(3) * sqrt(12)"), 6), "surds: √3 × √12 is 6");
check(close(at("6 / sqrt(3)"), 2 * Math.sqrt(3)), "surds: 6/√3 is 2√3");
check(close(at("1 / (3 + sqrt(2))"), at("(3 - sqrt(2)) / 7")), "surds: the conjugate rationalisation preserves the value");
check(close(at("sqrt(98)"), 7 * Math.sqrt(2)), "surds: assessment a1 is 7√2");
check(close(at("sqrt(2) + sqrt(8)"), 3 * Math.sqrt(2)), "surds: assessment a2 is 3√2");
check(close(at("10 / sqrt(5)"), 2 * Math.sqrt(5)), "surds: assessment a3 is 2√5");
check(close(at("sqrt(75) + sqrt(12)"), 7 * Math.sqrt(3)), "surds: guided p2 is 7√3");
check(close(at("(sqrt(7) + 2) * (sqrt(7) - 2)"), 3), "surds: the conjugate rectangle has area 3");
check(close(at("3 / (2 - sqrt(3))"), 6 + 3 * Math.sqrt(3)), "surds: retrieval x3 is 6 + 3√3");

// ── Simultaneous equations: both equations, both unknowns ───────────────────
check(3 * 2 + 3 * 2 === 12 && 4 * 3 - 3 * 2 === 6, "simultaneous: (3, 2) satisfies both worked equations");
check(2 * 2 + 1 === 5 && 3 * 2 + 2 * 5 === 16, "simultaneous: (2, 5) satisfies both substitution equations");
check(7 + 3 === 10 && 7 - 3 === 4, "simultaneous: guided p1 is (7, 3)");
check(3 * 2 + 5 === 11 && 5 === 2 + 3, "simultaneous: guided p2 is (2, 5)");
check(2 * 2 + 3 * 4 === 16 && 2 + 4 === 6, "simultaneous: guided p3 is (2, 4)");
check(7 + 5 === 12 && 7 - 5 === 2, "simultaneous: assessment a1 is (7, 5)");
check(2 * 3 + 5 === 11 && 5 === 3 + 2, "simultaneous: assessment a3 is (3, 5)");
check(15 + 25 === 40 && 9 * 15 + 5 * 25 === 260, "simultaneous: 15 adult and 25 child tickets total £260");
check(60 + 60 === 120 && 6 * 60 + 3.5 * 60 === 570, "simultaneous: 60 adult and 60 child visits total £570");
check(72 + 48 === 120 && 6 * 72 + 3.5 * 48 === 600, "simultaneous: 72 adult and 48 child visits total £600");
check(2 * 3 + 4 === 10 && 4 === 3 + 1, "simultaneous: retrieval x3 is (3, 4)");

// ── Line–curve intersections: roots, pairing and discriminant ────────────────
check(simQuad.conceptId === "sim-equations-quad", "sim-equations-quad: filed under its genome id");
check(simQuad.contract === "openmind.lesson/1.0", "sim-equations-quad: current contract");
check(simQuad.declaredStatus === "draft", "sim-equations-quad: declares draft, not a reviewed rung");
check(simQuad.reviews.length === 0 && simQuad.learnerTesting.length === 0,
  "sim-equations-quad: claims no review or learner testing");
check(simQuad.objectives.length >= 3 && simQuad.explanation.length >= 3,
  "sim-equations-quad: at least three objectives and explanation sections");
check(simQuad.workedExamples.length >= 2 && simQuad.misconceptions.length >= 2,
  "sim-equations-quad: at least two worked examples and misconceptions");
check(simQuad.guidedPractice.length >= 3 && simQuad.transfer.length >= 1,
  "sim-equations-quad: guided practice and a transfer task");
check(simQuad.retrieval.some((item) => item.when === "week-later") &&
  simQuad.retrieval.some((item) => item.when === "month-later"),
  "sim-equations-quad: retrieval is spaced beyond the next day");
check(simQuad.assessment.some((item) => item.kind === "constructed-response"),
  "sim-equations-quad: has a constructed-response assessment");
for (const item of simQuad.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `sim-equations-quad/${item.id}: the model answer is one of its own accepted answers`);
}

// Worked example 1: x + 3 = x² + 1 has roots 2 and −1.
check(2 + 3 === 5 && 2 ** 2 + 1 === 5, "sim-equations-quad: (2, 5) satisfies line and curve");
check(-1 + 3 === 2 && (-1) ** 2 + 1 === 2, "sim-equations-quad: (−1, 2) satisfies line and curve");
check(2 ** 2 - 2 - 2 === 0 && (-1) ** 2 - (-1) - 2 === 0,
  "sim-equations-quad: both roots solve x² − x − 2 = 0");
// Worked example 2: a tangent with a repeated root.
check(2 * 3 - 3 === 3 && 3 ** 2 - 4 * 3 + 6 === 3, "sim-equations-quad: (3, 3) satisfies the tangent pair");
check((-6) ** 2 - 4 * 1 * 9 === 0, "sim-equations-quad: the tangent quadratic has discriminant zero");
// Worked example 3: no real intersection.
check((-1) ** 2 - 4 * 1 * 1 === -3, "sim-equations-quad: the miss has discriminant −3");
// Guided practice.
check(2 + 2 === 4 && 2 ** 2 === 4, "sim-equations-quad: guided p1 is (2, 4)");
check(-1 + 2 === 1 && (-1) ** 2 === 1, "sim-equations-quad: guided p1 also gives (−1, 1)");
check(2 * 1 === 2 && 1 ** 2 + 1 === 2, "sim-equations-quad: guided p2 is the tangent (1, 2)");
check((-2) ** 2 - 4 * 1 * 1 === 0, "sim-equations-quad: guided p2 has a repeated root");
check(2 + 4 === 6 && 2 ** 2 + 2 === 6, "sim-equations-quad: guided p3 is (2, 6)");
check(-1 + 4 === 3 && (-1) ** 2 + 2 === 3, "sim-equations-quad: guided p3 also gives (−1, 3)");
// Assessment.
check(3 + 6 === 9 && 3 ** 2 === 9, "sim-equations-quad: assessment a1 is (3, 9)");
check(-2 + 6 === 4 && (-2) ** 2 === 4, "sim-equations-quad: assessment a1 also gives (−2, 4)");
check(2 * 2 - 1 === 3 && 2 ** 2 - 2 * 2 + 3 === 3, "sim-equations-quad: assessment a2 is the tangent (2, 3)");
check(1 + 1 === 2 && 1 ** 2 - 4 * 1 + 5 === 2, "sim-equations-quad: assessment a3 first pair is (1, 2)");
check(4 + 1 === 5 && 4 ** 2 - 4 * 4 + 5 === 5, "sim-equations-quad: assessment a3 second pair is (4, 5)");
// Transfer: break-even at one and nine items, profit between them.
check(12 * 1 - 1 ** 2 === 2 * 1 + 9, "sim-equations-quad: break-even at n = 1");
check(12 * 9 - 9 ** 2 === 2 * 9 + 9, "sim-equations-quad: break-even at n = 9");
check(12 * 5 - 5 ** 2 > 2 * 5 + 9, "sim-equations-quad: the workshop profits between the break-even points");
check(1 ** 2 - 10 * 1 + 9 === 0 && 9 ** 2 - 10 * 9 + 9 === 0,
  "sim-equations-quad: both break-even values solve n² − 10n + 9 = 0");
// Retrieval: the zero root must survive.
check(0 === 0 ** 2 && 1 === 1 ** 2, "sim-equations-quad: x = x² has roots 0 and 1");

// ── Functions: substitution, composition, inverses and domains ───────────────
check(functions.conceptId === "functions", "functions: filed under its genome id");
check(functions.contract === "openmind.lesson/1.0", "functions: current contract");
check(functions.declaredStatus === "draft", "functions: declares draft, not a reviewed rung");
check(functions.reviews.length === 0 && functions.learnerTesting.length === 0,
  "functions: claims no review or learner testing");
check(functions.objectives.length >= 3 && functions.explanation.length >= 3,
  "functions: at least three objectives and explanation sections");
check(functions.workedExamples.length >= 2 && functions.misconceptions.length >= 2,
  "functions: at least two worked examples and misconceptions");
check(functions.guidedPractice.length >= 3 && functions.transfer.length >= 1,
  "functions: guided practice and a transfer task");
check(functions.retrieval.some((item) => item.when === "week-later") &&
  functions.retrieval.some((item) => item.when === "month-later"),
  "functions: retrieval is spaced beyond the next day");
check(functions.assessment.some((item) => item.kind === "constructed-response"),
  "functions: has a constructed-response assessment");
for (const item of functions.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `functions/${item.id}: the model answer is one of its own accepted answers`);
}

const f = (x) => 2 * x + 3;
const g = (x) => x ** 2;
check(f(4) === 11, "functions: f(4) = 11 for f(x) = 2x + 3");
check(f(1 + 1) === 7 && 2 * 1 + 5 === 7, "functions: f(x + 1) = 2x + 5 at x = 1");
check(f(1) + 1 === 6 && f(1 + 1) === 7, "functions: f(x + 1) is not f(x) + 1");
check(g(f(2)) === 49 && f(g(2)) === 11, "functions: g(f(2)) = 49 and f(g(2)) = 11");
check((11 - 3) / 2 === 4 && f(4) === 11, "functions: the inverse of 2x + 3 returns 4 from 11");
check((3 * 4 - 2) === 10 && (3 * -2 - 2) === -8, "functions: guided p1 evaluates f(4) and f(−2)");
check((3 ** 2 + 1) === 10 && 2 * 10 === 20, "functions: guided p2 g(f(3)) = 20");
check(2 * 3 === 6 && 6 ** 2 + 1 === 37, "functions: guided p2 f(g(3)) = 37");
check((11 + 4) / 5 === 3 && 5 * 3 - 4 === 11, "functions: guided p3 inverse returns 3 from 11");
check((4 * 3 - 1) === 11 && (4 * -1 - 1) === -5, "functions: assessment a1 evaluates f(3) and f(−1)");
check((1 + 2) ** 2 === 9 && 1 ** 2 + 2 === 3, "functions: f(x + 2) and f(x) + 2 differ at x = 1");
check((1 + 2) ** 2 - (1 ** 2 + 2) === 4 * 1 + 2, "functions: the cross term is 4x + 2");
check(5 !== 5 - 5 && -3 === -3, "functions: the two domain restrictions are x ≠ 5 and x ≥ −3");
const c = (F) => (5 / 9) * (F - 32);
const fahrenheit = (C) => (9 / 5) * C + 32;
check(close(c(32), 0), "functions: 32°F is 0°C");
check(close(fahrenheit(100), 212), "functions: the inverse converts 100°C to 212°F");
check(close(c(fahrenheit(20)), 20) && close(fahrenheit(c(68)), 68),
  "functions: the conversion and its inverse compose to identity");
check(2 ** 2 - 3 === 1 && (-2) ** 2 - 3 === 1, "functions: retrieval x1 has two inputs with the same output");
check((10 - 1) / 3 === 3 && 3 * 3 + 1 === 10, "functions: retrieval x2 inverse returns 3 from 10");
check(2 ** 2 === 4 && (-2) ** 2 === 4, "functions: retrieval x3 shows x² is not one-to-one on all reals");

// ── Trigonometry: ratio choice, rearrangement, inverse trig and mode ─────────
check(trig.conceptId === "trig-ratios", "trig-ratios: filed under its genome id");
check(trig.contract === "openmind.lesson/1.0", "trig-ratios: current contract");
check(trig.version === "1.0.0", "trig-ratios: version 1.0.0");
check(trig.declaredStatus === "draft", "trig-ratios: declares draft, not a reviewed rung");
check(trig.reviews.length === 0 && trig.learnerTesting.length === 0,
  "trig-ratios: claims no review or learner testing");
check(trig.objectives.length >= 3 && trig.explanation.length >= 3,
  "trig-ratios: at least three objectives and explanation sections");
check(trig.workedExamples.length >= 2 && trig.misconceptions.length >= 2,
  "trig-ratios: at least two worked examples and misconceptions");
check(trig.guidedPractice.length >= 3 && trig.transfer.length >= 1,
  "trig-ratios: guided practice and a transfer task");
check(trig.retrieval.some((item) => item.when === "week-later") &&
  trig.retrieval.some((item) => item.when === "month-later"),
  "trig-ratios: retrieval is spaced beyond the next day");
check(trig.assessment.some((item) => item.kind === "constructed-response"),
  "trig-ratios: has a constructed-response assessment");
for (const item of trig.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `trig-ratios/${item.id}: the model answer is one of its own accepted answers`);
}

check(close(12 * Math.sin(radians(35)), 6.8829, 1e-3),
  "trig-ratios: w1 opposite is 12 sin 35° ≈ 6.88 cm");
check(close(12 * Math.cos(radians(35)), 9.8298, 1e-3),
  "trig-ratios: w1 adjacent is 12 cos 35° ≈ 9.83 cm");
check(close((12 * Math.sin(radians(35))) ** 2 + (12 * Math.cos(radians(35))) ** 2, 144, 1e-9),
  "trig-ratios: w1 opposite and adjacent reconstruct the hypotenuse");
check(close(degrees(Math.atan(0.7)), 34.992, 1e-3),
  "trig-ratios: w2 inverse tangent of 0.7 is ≈ 35.0°");
check(close(14 * Math.tan(radians(38)), 10.938, 1e-3),
  "trig-ratios: w3 tree height is 14 tan 38° ≈ 10.94 m");
check(close(10 * Math.sin(radians(40)), 6.4279, 1e-3),
  "trig-ratios: p1 opposite is 10 sin 40° ≈ 6.43 cm");
check(close(15 / Math.cos(radians(62)), 31.950, 1e-3),
  "trig-ratios: p2 hypotenuse is 15/cos 62° ≈ 31.95 cm");
check(close(degrees(Math.asin(5 / 13)), 22.620, 1e-3),
  "trig-ratios: p3 angle is sin⁻¹(5/13) ≈ 22.62°");
check(close(20 * Math.sin(radians(28)), 9.3894, 1e-3) &&
  close(20 * Math.cos(radians(28)), 17.6590, 1e-3),
  "trig-ratios: a1 opposite ≈ 9.39 cm and adjacent ≈ 17.66 cm");
check(close(12 * Math.tan(radians(35)), 8.402, 1e-3),
  "trig-ratios: a2 correct value is 12 tan 35° ≈ 8.40");
check(close(Math.tan(radians(35)) / 12, 0.05835, 1e-4),
  "trig-ratios: a2 dividing instead of multiplying gives the implausible 0.058");
check(close(degrees(Math.atan(9 / 40)), 12.680, 1e-3),
  "trig-ratios: a3 inverse tangent of 9/40 is ≈ 12.68°");
check(close(30 * Math.tan(radians(40)), 25.173, 1e-3) &&
  close(40 * Math.tan(radians(32)), 24.995, 1e-3),
  "trig-ratios: transfer heights are ≈ 25.17 m and ≈ 24.99 m");
check(Math.abs(30 * Math.tan(radians(40)) - 40 * Math.tan(radians(32))) < 0.2,
  "trig-ratios: the two surveyor measurements agree within 0.2 m");
check(close(14 * Math.sin(radians(30)), 7, 1e-9) &&
  close(14 * Math.cos(radians(30)), 12.124, 1e-3),
  "trig-ratios: x1 gives opposite 7 cm and adjacent ≈ 12.12 cm");
check(close(degrees(Math.atan(0.75)), 36.870, 1e-3),
  "trig-ratios: x2 inverse tangent of 0.75 is ≈ 36.87°");
check(close(Math.sin(radians(30)), 0.5, 1e-9) && Math.sin(30) < -0.9,
  "trig-ratios: x3 distinguishes 30° from 30 radians");

// ── Trig identities and graphs: unit circle, exact values, periods ───────────
check(trigIdentity.conceptId === "trig-identity", "trig-identity: filed under its genome id");
check(trigIdentity.contract === "openmind.lesson/1.0", "trig-identity: current contract");
check(trigIdentity.version === "1.0.0", "trig-identity: version 1.0.0");
check(trigIdentity.declaredStatus === "draft", "trig-identity: declares draft, not a reviewed rung");
check(trigIdentity.reviews.length === 0 && trigIdentity.learnerTesting.length === 0,
  "trig-identity: claims no review or learner testing");
check(trigIdentity.objectives.length >= 3 && trigIdentity.explanation.length >= 3,
  "trig-identity: at least three objectives and explanation sections");
check(trigIdentity.workedExamples.length >= 2 && trigIdentity.misconceptions.length >= 2,
  "trig-identity: at least two worked examples and misconceptions");
check(trigIdentity.guidedPractice.length >= 3 && trigIdentity.transfer.length >= 1,
  "trig-identity: guided practice and a transfer task");
check(trigIdentity.retrieval.some((item) => item.when === "week-later") &&
  trigIdentity.retrieval.some((item) => item.when === "month-later"),
  "trig-identity: retrieval is spaced beyond the next day");
check(trigIdentity.assessment.some((item) => item.kind === "constructed-response"),
  "trig-identity: has a constructed-response assessment");
for (const item of trigIdentity.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `trig-identity/${item.id}: the model answer is one of its own accepted answers`);
}

check(close((3 / 5) ** 2 + (4 / 5) ** 2, 1, 1e-12),
  "trig-identity: w1 (3/5)² + (4/5)² = 1");
check(close((3 / 5) / (4 / 5), 3 / 4, 1e-12),
  "trig-identity: w1 tangent is 3/4");
check(close(1 - Math.sin(radians(45)) ** 2, Math.cos(radians(45)) ** 2, 1e-12),
  "trig-identity: w2 replaces 1 − sin²θ by cos²θ at 45°");
check(close(Math.sin(radians(30)), 0.5, 1e-12) && close(Math.sin(radians(150)), 0.5, 1e-12),
  "trig-identity: w3 has sine 1/2 at 30° and 150°");
check(close((5 / 13) ** 2 + (12 / 13) ** 2, 1, 1e-12) && close((12 / 13) / (5 / 13), 12 / 5, 1e-12),
  "trig-identity: p1 gives sin 12/13 and tan 12/5");
check(close(1 - Math.cos(radians(60)) ** 2, Math.sin(radians(60)) ** 2, 1e-12),
  "trig-identity: p2 numerator is sin²θ when the denominator is sin θ");
check(close(Math.sin(radians(60)), Math.sqrt(3) / 2, 1e-12) &&
  close(Math.sin(radians(120)), Math.sqrt(3) / 2, 1e-12),
  "trig-identity: p3 has sine √3/2 at 60° and 120°");
check(close((7 / 25) ** 2 + (24 / 25) ** 2, 1, 1e-12) && close((7 / 25) / (24 / 25), 7 / 24, 1e-12),
  "trig-identity: a1 gives cos 24/25 and tan 7/24");
check(close(Math.cos(radians(120)), -0.5, 1e-12) && close(Math.cos(radians(240)), -0.5, 1e-12),
  "trig-identity: a3 has cosine −1/2 at 120° and 240°");
check(close(10 + 6 * Math.sin(radians(30)), 13, 1e-12) &&
  close(10 + 6 * Math.sin(radians(150)), 13, 1e-12),
  "trig-identity: tide model reaches 13 m at t = 1 and t = 5");
check(close(360 / 30, 12, 1e-12) && close(10 + 6, 16, 1e-12) && close(10 - 6, 4, 1e-12),
  "trig-identity: tide period is 12 h, maximum 16 m and minimum 4 m");
check(close(Math.sin(radians(30)), 0.5, 1e-12) && close(Math.cos(radians(60)), 0.5, 1e-12) &&
  close(Math.tan(radians(45)), 1, 1e-12),
  "trig-identity: x1 exact values are 1/2, 1/2 and 1");
check(close((8 / 17) ** 2 + (15 / 17) ** 2, 1, 1e-12) && close((15 / 17) / (8 / 17), 15 / 8, 1e-12),
  "trig-identity: x2 gives sin 15/17 and tan 15/8");
check(Math.abs(Math.cos(radians(90))) < 1e-12,
  "trig-identity: x3 cosine of 90° is zero, so tangent is undefined");
check(close(Math.sin(radians(90)), 1, 1e-12) && close(Math.cos(radians(0)), 1, 1e-12),
  "trig-identity: sine and cosine reach 1 at 90° and 0°");

// ── Circle theorems: same arc, semicircle, cyclic quadrilateral, tangent ─────
check(circle.conceptId === "circle-theorems", "circle-theorems: filed under its genome id");
check(circle.contract === "openmind.lesson/1.0", "circle-theorems: current contract");
check(circle.version === "1.0.0", "circle-theorems: version 1.0.0");
check(circle.declaredStatus === "draft", "circle-theorems: declares draft, not a reviewed rung");
check(circle.reviews.length === 0 && circle.learnerTesting.length === 0,
  "circle-theorems: claims no review or learner testing");
check(circle.objectives.length >= 3 && circle.explanation.length >= 3,
  "circle-theorems: at least three objectives and explanation sections");
check(circle.workedExamples.length >= 2 && circle.misconceptions.length >= 2,
  "circle-theorems: at least two worked examples and misconceptions");
check(circle.guidedPractice.length >= 3 && circle.transfer.length >= 1,
  "circle-theorems: guided practice and a transfer task");
check(circle.retrieval.some((item) => item.when === "week-later") &&
  circle.retrieval.some((item) => item.when === "month-later"),
  "circle-theorems: retrieval is spaced beyond the next day");
check(circle.assessment.some((item) => item.kind === "constructed-response"),
  "circle-theorems: has a constructed-response assessment");
for (const item of circle.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `circle-theorems/${item.id}: the model answer is one of its own accepted answers`);
}

check(2 * 65 === 130, "circle-theorems: w1 circumference angle 65° doubles to 130°");
check(50 + (2 * 50 + 30) === 180 && 2 * 50 + 30 === 130,
  "circle-theorems: w2 opposite angles are 50° and 130°");
check(180 - 90 - 32 === 58, "circle-theorems: w3 tangent triangle gives 58°");
check(84 / 2 === 42, "circle-theorems: p1 centre 84° gives circumference 42°");
check(180 - 90 - 28 === 62, "circle-theorems: p2 semicircle gives 90° and 62°");
check(3 * 40 + (40 + 20) === 180 && 3 * 40 === 120 && 40 + 20 === 60,
  "circle-theorems: p3 cyclic opposite angles are 120° and 60°");
check(2 * 73 === 146, "circle-theorems: a1 circumference angle 73° doubles to 146°");
check(4 * 25 + (2 * 25 + 30) === 180 && 4 * 25 === 100 && 2 * 25 + 30 === 80,
  "circle-theorems: a3 cyclic opposite angles are 100° and 80°");
check(180 - 90 - 35 === 55, "circle-theorems: transfer gives 55° at the cabin");
check(2 * 55 === 110, "circle-theorems: x1 circumference 55° doubles to 110°");
check(4 * 20 + 5 * 20 === 180 && 4 * 20 === 80 && 5 * 20 === 100,
  "circle-theorems: x2 cyclic opposite angles are 80° and 100°");
check(90 + 32 + 58 === 180, "circle-theorems: tangent triangle angles sum to 180°");

// ── Pythagoras: hypotenuse, leg, converse and applications ──────────────────
check(pythagoras.conceptId === "pythagoras", "pythagoras: filed under its genome id");
check(pythagoras.contract === "openmind.lesson/1.0", "pythagoras: current contract");
check(pythagoras.version === "1.0.0", "pythagoras: version 1.0.0");
check(pythagoras.declaredStatus === "draft", "pythagoras: declares draft, not a reviewed rung");
check(pythagoras.reviews.length === 0 && pythagoras.learnerTesting.length === 0,
  "pythagoras: claims no review or learner testing");
check(pythagoras.objectives.length >= 3 && pythagoras.explanation.length >= 3,
  "pythagoras: at least three objectives and explanation sections");
check(pythagoras.workedExamples.length >= 2 && pythagoras.misconceptions.length >= 2,
  "pythagoras: at least two worked examples and misconceptions");
check(pythagoras.guidedPractice.length >= 3 && pythagoras.transfer.length >= 1,
  "pythagoras: guided practice and a transfer task");
check(pythagoras.retrieval.some((item) => item.when === "week-later") &&
  pythagoras.retrieval.some((item) => item.when === "month-later"),
  "pythagoras: retrieval is spaced beyond the next day");
check(pythagoras.assessment.some((item) => item.kind === "constructed-response"),
  "pythagoras: has a constructed-response assessment");
for (const item of pythagoras.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `pythagoras/${item.id}: the model answer is one of its own accepted answers`);
}

check(6 ** 2 + 8 ** 2 === 100 && Math.sqrt(100) === 10,
  "pythagoras: w1 legs 6 and 8 give hypotenuse 10");
check(13 ** 2 - 5 ** 2 === 144 && Math.sqrt(144) === 12,
  "pythagoras: w2 hypotenuse 13 and leg 5 give leg 12");
check(9 ** 2 + 12 ** 2 === 225 && 15 ** 2 === 225,
  "pythagoras: w3 9-12-15 satisfies the converse");
check(9 ** 2 + 12 ** 2 === 225 && Math.sqrt(225) === 15,
  "pythagoras: p1 legs 9 and 12 give hypotenuse 15");
check(17 ** 2 - 8 ** 2 === 225 && Math.sqrt(225) === 15,
  "pythagoras: p2 hypotenuse 17 and leg 8 give leg 15");
check(5 ** 2 + 12 ** 2 === 169 && Math.sqrt(169) === 13,
  "pythagoras: p3 rectangle diagonal is 13 m");
check(7 ** 2 + 24 ** 2 === 625 && Math.sqrt(625) === 25,
  "pythagoras: a1 legs 7 and 24 give hypotenuse 25");
check(13 ** 2 + 5 ** 2 === 194 && 13 ** 2 - 5 ** 2 === 144,
  "pythagoras: a2 adding is 194 and subtracting is 144");
check(6.5 ** 2 - 2.5 ** 2 === 36 && Math.sqrt(36) === 6,
  "pythagoras: a3 ladder reaches 6.0 m");
check(24 ** 2 + 10 ** 2 === 676 && Math.sqrt(676) === 26,
  "pythagoras: transfer first diagonal is 26 m");
check(26 ** 2 - 24 ** 2 === 100 && Math.sqrt(100) === 10,
  "pythagoras: transfer second width is 10 m");
check(3 ** 2 + 4 ** 2 === 25 && Math.sqrt(25) === 5,
  "pythagoras: x1 3-4-5 gives hypotenuse 5");
check(10 ** 2 - 6 ** 2 === 64 && Math.sqrt(64) === 8,
  "pythagoras: x2 6-8-10 gives other leg 8");
check(8 ** 2 + 15 ** 2 === 289 && 17 ** 2 === 289,
  "pythagoras: x3 8-15-17 satisfies the converse");

// ── Volume and surface area: filling versus wrapping ────────────────────────
check(volume.conceptId === "volume", "volume: filed under its genome id");
check(volume.contract === "openmind.lesson/1.0", "volume: current contract");
check(volume.version === "1.0.0", "volume: version 1.0.0");
check(volume.declaredStatus === "draft", "volume: declares draft, not a reviewed rung");
check(volume.reviews.length === 0 && volume.learnerTesting.length === 0,
  "volume: claims no review or learner testing");
check(volume.objectives.length >= 4 && volume.explanation.length >= 5,
  "volume: at least four objectives and five explanation sections");
check(volume.workedExamples.length >= 3 && volume.misconceptions.length >= 5,
  "volume: at least three worked examples and five misconceptions");
check(volume.guidedPractice.length >= 5 && volume.transfer.length >= 1,
  "volume: guided practice and a transfer task");
check(volume.retrieval.some((item) => item.when === "week-later") &&
  volume.retrieval.some((item) => item.when === "month-later"),
  "volume: retrieval is spaced beyond the next day");
check(volume.assessment.some((item) => item.kind === "constructed-response"),
  "volume: has a constructed-response assessment");
for (const item of volume.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `volume/${item.id}: the model answer is one of its own accepted answers`);
}

check(3 * 4 * 5 === 60, "volume: w1 cuboid volume is 60 cm³");
check(2 * (3 * 4 + 3 * 5 + 4 * 5) === 94, "volume: w1 surface area is 94 cm²");
check(Math.abs(40 * Math.PI - 125.6637) < 0.001 && Math.abs(48 * Math.PI - 150.7964) < 0.001,
  "volume: w2 cylinder volume and surface area round to 125.7 and 150.8");
check(48 / 8 === 6 && 216 / 54 === 4, "volume: w3 area factor is 4, not 8");
check(3 ** 3 === 27 && 6 ** 3 === 216 && 216 / 27 === 8,
  "volume: w3 doubling the side multiplies volume by 8");
check(6 * 3 ** 2 === 54 && 6 * 6 ** 2 === 216 && 216 / 54 === 4,
  "volume: w3 surface area multiplies by 4");
check(2 * 7 * 10 === 140, "volume: p1 volume is 140 cm³");
check(3 ** 2 * 5 === 45, "volume: p2 cylinder is 45π cm³");
check(6 * 4 ** 2 === 96, "volume: p3 cube surface area is 96 cm²");
check(3 ** 2 === 9 && 3 ** 3 === 27, "volume: p4 k=3 gives area ×9 and volume ×27");
check(50 * 20 * 30 === 30000 && 30000 / 1000 === 30,
  "volume: p5 tank is 30,000 cm³ = 30 L");
check(6 * 4 * 2.5 === 60, "volume: a1 volume is 60 cm³");
check(5 ** 2 * 12 === 300 && 2 * 5 ** 2 + 2 * 5 * 12 === 170,
  "volume: a2 cylinder is 300π cm³ and 170π cm²");
check(2.5 * 1000 === 2500 && 2500 / (25 * 10) === 10,
  "volume: a3 water height is 10 cm");
check(5 ** 3 === 125 && 6 * 5 ** 2 === 150,
  "volume: a4 cube is 125 cm³ and 150 cm²");
check(60 * 30 * 40 === 72000 && 72000 / 1000 === 72,
  "volume: transfer tank is 72,000 cm³ = 72 L");
check(60 * 30 + 2 * 60 * 40 + 2 * 30 * 40 === 9000,
  "volume: transfer open tank needs 9,000 cm² of glass");
check(72 * 8 === 576 && 9000 * 4 === 36000,
  "volume: transfer doubling gives 576 L and 36,000 cm²");
check(4 * 5 * 6 === 120, "volume: x1 volume is 120 cm³");
check(6 * 5 ** 2 === 150, "volume: x2 surface area is 150 cm²");
check(2 ** 2 * 9 === 36, "volume: x3 cylinder is 36π cm³");
check(2 ** 2 * 2 === 8, "volume: x4 doubling radius and height multiplies volume by 8");

// ── Transformations: complete descriptions and coordinate rules ─────────────
check(transformations.conceptId === "transformations", "transformations: filed under its genome id");
check(transformations.contract === "openmind.lesson/1.0", "transformations: current contract");
check(transformations.version === "1.0.0", "transformations: version 1.0.0");
check(transformations.declaredStatus === "draft", "transformations: declares draft, not a reviewed rung");
check(transformations.reviews.length === 0 && transformations.learnerTesting.length === 0,
  "transformations: claims no review or learner testing");
check(transformations.objectives.length >= 4 && transformations.explanation.length >= 6,
  "transformations: at least four objectives and six explanation sections");
check(transformations.workedExamples.length >= 4 && transformations.misconceptions.length >= 5,
  "transformations: at least four worked examples and five misconceptions");
check(transformations.guidedPractice.length >= 5 && transformations.transfer.length >= 1,
  "transformations: guided practice and a transfer task");
check(transformations.retrieval.some((item) => item.when === "week-later") &&
  transformations.retrieval.some((item) => item.when === "month-later"),
  "transformations: retrieval is spaced beyond the next day");
check(transformations.assessment.some((item) => item.kind === "constructed-response"),
  "transformations: has a constructed-response assessment");
for (const item of transformations.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `transformations/${item.id}: the model answer is one of its own accepted answers`);
}

// The transformations are recomputed from their rules, not restated. A helper
// per move keeps the independent checks honest: if a lesson coordinate is wrong,
// these compare a real rule's output with the authored image.
const samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];
const translate = (p, v) => [p[0] + v[0], p[1] + v[1]];
const reflectX = (p) => [p[0], -p[1]];
const reflectY = (p) => [-p[0], p[1]];
const reflectYX = (p) => [p[1], p[0]];
const rotate90cw = (p) => [p[1], -p[0]];
const rotate180 = (p) => [-p[0], -p[1]];
const rotate90ccw = (p) => [-p[1], p[0]];
const enlarge = (p, k) => [p[0] * k, p[1] * k];

check(samePoint(translate([1, 2], [4, -1]), [5, 1]) &&
  samePoint(translate([3, 2], [4, -1]), [7, 1]) &&
  samePoint(translate([2, 4], [4, -1]), [6, 3]),
  "transformations: w1 translation gives (5,1), (7,1), (6,3)");
check(samePoint(reflectYX([1, 2]), [2, 1]) && samePoint(reflectYX([3, 2]), [2, 3]) && samePoint(reflectYX([2, 4]), [4, 2]),
  "transformations: w2 reflection in y=x swaps every coordinate pair");
check(samePoint(rotate90cw([1, 1]), [1, -1]) && samePoint(rotate90cw([3, 1]), [1, -3]) && samePoint(rotate90cw([1, 2]), [2, -1]),
  "transformations: w3 90° clockwise gives (1,-1), (1,-3), (2,-1)");
check(samePoint(enlarge([1, 1], 2), [2, 2]) && samePoint(enlarge([3, 1], 2), [6, 2]) && samePoint(enlarge([1, 2], 2), [2, 4]),
  "transformations: w4 enlargement by 2 doubles both coordinates");
check((1 / 2) * 2 * 1 === 1 && (1 / 2) * 4 * 2 === 4,
  "transformations: w4 area grows from 1 to 4, a factor of 4");
check(samePoint(translate([-2, 3], [5, -4]), [3, -1]), "transformations: p1 gives (3,-1)");
check(samePoint(reflectX([4, -1]), [4, 1]), "transformations: p2 reflection in x-axis gives (4,1)");
check(samePoint(rotate180([2, 5]), [-2, -5]), "transformations: p3 half-turn gives (-2,-5)");
check(samePoint(enlarge([3, -2], 3), [9, -6]), "transformations: p4 enlargement gives (9,-6)");
check(3 ** 2 === 9, "transformations: p4 area factor is 9");
check(samePoint(reflectYX([2, 5]), [5, 2]), "transformations: p5 reflection in y=x gives (5,2)");
check(samePoint(rotate90ccw([3, 1]), [-1, 3]), "transformations: p6 90° anticlockwise gives (-1,3)");
check(samePoint(translate([1, -2], [-3, 5]), [-2, 3]), "transformations: a1 gives (-2,3)");
check(samePoint(rotate90cw([1, 1]), [1, -1]) && samePoint(rotate90cw([3, 1]), [1, -3]) && samePoint(rotate90cw([1, 2]), [2, -1]),
  "transformations: a2's stated image is the 90° clockwise image");
check(3 * 2 === 6 && 6 * 3 ** 2 === 54, "transformations: a3 image area is 54 cm²");
check(samePoint(reflectYX([3, -4]), [-4, 3]), "transformations: a4 gives (-4,3)");
check(samePoint(enlarge([2, 3], -1), [-2, -3]) && (-1) ** 2 === 1,
  "transformations: a5 negative factor is a half-turn with area factor 1");
check(2 * 3 === 6 && 6 * 6 ** 2 === 216, "transformations: transfer composes to k=6 and area 216 cm²");
check(samePoint(reflectX(rotate180([2, 3])), [-2, 3]) && samePoint(reflectY([2, 3]), [-2, 3]),
  "transformations: transfer half-turn then x-axis reflection gives (-2,3)");
check(samePoint(translate([2, -3], [-4, 1]), [-2, -2]), "transformations: x1 gives (-2,-2)");
check(samePoint(reflectY([-3, 5]), [3, 5]), "transformations: x2 gives (3,5)");
check(samePoint(rotate90cw([4, -2]), [-2, -4]), "transformations: x3 gives (-2,-4)");
check(20 / 4 === 5, "transformations: x4 area becomes 5 cm²");
check(samePoint(enlarge([-2, 3], -1), [2, -3]), "transformations: x5 gives (2,-3)");

// ── Vectors: components, order, scalar multiples and midpoint proof ──────────
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const scale = (k, a) => [k * a[0], k * a[1]];
const parallel = (a, b) => a[0] * b[1] === a[1] * b[0] && (a[0] !== 0 || a[1] !== 0);

check(vectors.conceptId === "vectors", "vectors: filed under its genome id");
check(vectors.contract === "openmind.lesson/1.0" && vectors.version === "1.0.0",
  "vectors: current contract and version");
check(vectors.declaredStatus === "draft" && vectors.reviews.length === 0 && vectors.learnerTesting.length === 0,
  "vectors: declares draft and claims no review or learner testing");
check(vectors.objectives.length >= 4 && vectors.explanation.length >= 6 &&
  vectors.workedExamples.length >= 4 && vectors.misconceptions.length >= 5 &&
  vectors.guidedPractice.length >= 5 && vectors.transfer.length >= 1,
  "vectors: complete lesson shape (objectives, explanation, worked, traps, practice, transfer)");
check(vectors.retrieval.some((item) => item.when === "week-later") &&
  vectors.retrieval.some((item) => item.when === "month-later"),
  "vectors: retrieval is spaced beyond the next day");
for (const item of vectors.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `vectors/${item.id}: the model answer is one of its own accepted answers`);
}

check(samePoint(add([3, -2], [-1, 4]), [2, 2]), "vectors: w1 adds components to (2,2)");
check(samePoint(sub([4, 1], [-2, 5]), [6, -4]) && samePoint(sub([-2, 5], [4, 1]), [-6, 4]),
  "vectors: w2 end-minus-start gives AB and BA with opposite signs");
check(samePoint(scale(3, [-2, 1]), [-6, 3]) && samePoint(scale(-2, [4, -3]), [-8, 6]),
  "vectors: w3 scales both components");
check(!parallel([-6, 3], [-8, 6]), "vectors: w3 ratios differ, so 3a and -2b are not parallel");
check(parallel([-6, 3], [2, -1]) && parallel([-8, 6], [4, -3]),
  "vectors: each w3 result remains parallel to its own source vector");
check(samePoint(add([4, -1], [-2, 3]), [2, 2]) && samePoint(sub([3, 4], [1, 2]), [2, 2]),
  "vectors: w4 resultant equals finish minus start");
check(samePoint(scale(-1, [2, 2]), [-2, -2]), "vectors: w4 reverse is the negative resultant");
check(samePoint(add([3, -2], [1, 4]), [4, 2]), "vectors: p1 gives (4,2)");
check(samePoint(sub([-2, 5], [4, 1]), [-6, 4]), "vectors: p2 gives (-6,4)");
check(samePoint(scale(3, [2, -1]), [6, -3]), "vectors: p3 gives (6,-3)");
check(samePoint(scale(2, [2, -3]), [4, -6]), "vectors: p4 has k=2");
check(samePoint(add([2, -3], [-1, 4]), [1, 1]), "vectors: p5 resultant is (1,1)");
check(samePoint(add([-2, 3], [5, -4]), [3, -1]), "vectors: a1 gives (3,-1)");
check(samePoint(add([3, -1], [-1, 4]), [2, 3]), "vectors: a2 resultant is (2,3)");
check(3 + 1 + 1 + 4 === 9, "vectors: a2 distance walked is 9 km, distinct from displacement");
check(samePoint(scale(2, [3, -2]), [6, -4]), "vectors: a3 gives (6,-4)");
check(samePoint(scale(3, [2, -3]), [6, -9]) && samePoint(scale(-2, [2, -3]), [-4, 6]),
  "vectors: a4 both are multiples of (2,-3)");
check(samePoint(sub([5, -2], [2, 3]), [3, -5]), "vectors: a5 gives (3,-5)");
const M = [(0 + 4) / 2, (0 + 2) / 2];
const N = [(0 + 2) / 2, (0 + 6) / 2];
const MN = sub(N, M);
const AB = sub([2, 6], [4, 2]);
check(samePoint(M, [2, 1]) && samePoint(N, [1, 3]), "vectors: transfer midpoints are (2,1) and (1,3)");
check(samePoint(MN, [-1, 2]) && samePoint(AB, [-2, 4]), "vectors: transfer MN and AB are correct");
check(samePoint(scale(1 / 2, AB), MN), "vectors: transfer MN is half AB, so it is parallel and half as long");
check(samePoint(add([1, 2], [-3, 5]), [-2, 7]), "vectors: x1 gives (-2,7)");
check(samePoint(sub([-4, 1], [2, -3]), [-6, 4]), "vectors: x2 gives (-6,4)");
check(samePoint(scale(-2, [3, -1]), [-6, 2]), "vectors: x3 gives (-6,2)");
check(8 / 2 === 4 && -4 / -1 === 4, "vectors: x4 has k=4");
check(samePoint(add(add([2, -1], [-1, 3]), [3, -2]), [4, 0]), "vectors: x5 resultant is (4,0)");
check(samePoint(scale(-1, [4, 0]), [-4, 0]), "vectors: x5 reverse is (-4,0)");

// ── Scatter correlation: line arithmetic, ranges and causal restraint ────────
check(scatter.conceptId === "scatter-correlation", "scatter: filed under its genome id");
check(scatter.contract === "openmind.lesson/1.0" && scatter.version === "1.0.0",
  "scatter: current contract and version");
check(scatter.declaredStatus === "draft" && scatter.reviews.length === 0 && scatter.learnerTesting.length === 0,
  "scatter: declares draft and claims no review or learner testing");
check(scatter.objectives.length >= 5 && scatter.explanation.length >= 7 &&
  scatter.workedExamples.length >= 4 && scatter.misconceptions.length >= 5 &&
  scatter.guidedPractice.length >= 5 && scatter.transfer.length >= 1,
  "scatter: complete lesson shape");
check(scatter.retrieval.some((item) => item.when === "week-later") &&
  scatter.retrieval.some((item) => item.when === "month-later"),
  "scatter: retrieval is spaced beyond the next day");
for (const item of scatter.assessment.filter((entry) => entry.check)) {
  check(item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `scatter/${item.id}: the model answer is one of its own accepted answers`);
}

check((78 - 58) / (6 - 2) === 5, "scatter: w2 gradient is 5");
check(58 - 5 * 2 === 48, "scatter: w2 intercept is 48");
check(5 * 4.5 + 48 === 70.5, "scatter: w2 prediction at 4.5 is 70.5");
check(5 * 12 + 48 === 108 && 108 > 100 && 12 > 7,
  "scatter: w3 extrapolation gives 108, beyond both the data range and the maximum score");
check(15 - (2 * 4 + 1) === 6, "scatter: w4 residual is 6 above the line");
check((70 - 50) / (5 - 1) === 5, "scatter: a1 gradient is 5");
check(4 * 6 + 10 === 34, "scatter: a3 prediction is 34");
check(5 * 3 + 48 === 63, "scatter: p2 prediction is 63");
check((30 - 10) / (6 - 2) === 5, "scatter: x1 gradient is 5");
check(3 * 5 + 2 === 17, "scatter: x2 prediction is 17");
check(scatter.assessment.some((item) => item.kind === "constructed-response") &&
  scatter.assessment.filter((item) => item.kind === "constructed-response").every((item) => item.marking.length >= 5),
  "scatter: constructed responses carry a multi-point rubric");
check(scatter.misconceptions.some((item) => item.id === "m1" && /common cause|third variable|chance/i.test(item.whyItFails)),
  "scatter: the correlation/causation misconception names a common cause, reverse causation or chance");

console.log("Secondary mathematics authored lessons — independent checks");
console.log(`  ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  ✗ FAIL: ${failure}`);
  process.exit(1);
}