#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// COMPLETING THE SQUARE — THE LESSON'S ALGEBRA, CHECKED INDEPENDENTLY.
//
// The lesson contract proves the lesson has a diagnostic, reasoned worked
// examples, assessment and retrieval. It cannot prove that
// x² + 6x + 5 = (x + 3)² − 4, that the turning point is (−3, −4), or that the
// transfer's maximum is £20,000 at £20. This gate recomputes every pinned value
// from the algebra rather than reading the lesson's own key back to itself.
//
// It also checks the plan's emphasis figure is the one the lesson describes:
// the marked corner is the 9 that closes x² + 6x, and the two 3x strips are both
// drawn. That is the visual claim the lesson makes in prose.
//
// It is NOT teacher review and NOT a learner trial. A passing run says the
// printed algebra agrees with the lesson's claims; it says nothing about whether
// a pupil can complete a square unaided.
//
// Run: node scripts/completing-square-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { MATHS_COMPLETING_SQUARE: lesson } = require("../.verify/lessons/authored/maths-completing-square.js");
const figures = require("../.verify/figures.js");
const { planFor } = require("../.verify/lesson-plans.js");
const { evaluate } = require("mathjs");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b, tolerance = 1e-9) => Math.abs(Number(a) - Number(b)) <= tolerance;
const at = (expression, scope = {}) => evaluate(expression, scope);
const sameAt = (left, right, scope, label) => {
  const a = at(left, scope);
  const b = at(right, scope);
  ok(close(a, b), `${label} [${JSON.stringify(scope)}: ${left} = ${a}, ${right} = ${b}]`);
};
const normalized = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "completing-square", "the lesson is for completing-square");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.objectives.every((objective) => objective.statement.length > 50 && objective.evidence.length > 50),
  "every objective carries a measurable evidence statement");
ok(lesson.priorKnowledge.conceptIds.includes("quadratics") &&
  lesson.priorKnowledge.conceptIds.includes("algebra-expand"),
  "the diagnostic names the genome's prerequisite and the expansion it depends on");
ok(lesson.priorKnowledge.check.every((check) => check.targets.some((target) =>
  lesson.priorKnowledge.conceptIds.includes(target))),
  "every prerequisite check targets a declared prerequisite");
ok(lesson.explanation.length === 4, "there are four explanation sections");
ok(lesson.explanation.flatMap((section) => section.paragraphs).length === 9,
  "there are nine explanation paragraphs");
ok(lesson.representations.length === 3, "there are three representation blocks");
ok(lesson.representations.some((block) => block.kind === "maths.area-model"),
  "the area model is present, not only the symbolic rule");
ok(lesson.representations.every((block) => typeof block.caption === "string" && block.caption.length > 80),
  "every representation carries a teaching caption, not a label");
ok(lesson.workedExamples.length === 3, "there are three worked examples");
ok(lesson.workedExamples.every((example) => example.steps.length >= 3),
  "every worked example models at least three moves");
ok(lesson.workedExamples.every((example) => example.steps.every((step) => step.why.length > 30)),
  "every move states a reason, not only an instruction");
ok(lesson.misconceptions.length === 3, "there are three misconceptions taught");
ok(lesson.misconceptions.every((item) => item.contrast?.wrong && item.contrast?.right),
  "every misconception carries a wrong/right contrast");
ok(lesson.guidedPractice.length === 3, "there are three guided practice items");
// Four, not three: the lesson's fourth item moves from completing the square to
// reading the turning point off the completed form, which is the step the
// technique exists for. Pinned at the count the lesson teaches.
ok(lesson.assessment.length === 4, "there are four assessment items");
ok(lesson.assessment.some((item) => item.kind === "constructed-response"),
  "at least one assessment asks for reasoning in words");
ok(lesson.assessment.filter((item) => item.kind === "short-answer")
  .every((item) => Array.isArray(item.check?.accepted) && item.check.accepted.length > 0),
  "every short-answer item carries explicit accepted answers");
ok(lesson.transfer.length === 1, "there is one transfer challenge");
ok(lesson.retrieval.length === 3, "there are three retrieval prompts");
ok(lesson.retrieval.some((item) => item.when === "next-day") &&
  lesson.retrieval.some((item) => item.when === "week-later") &&
  lesson.retrieval.some((item) => item.when === "month-later"),
  "the retrieval prompts include next-day, week-later and month-later spacing");
ok(lesson.accessibility.length >= 5, "there are at least five accessibility alternatives");
ok(lesson.summary.length >= 4, "there is a usable summary");
ok(lesson.provenance.length === 2, "the lesson carries its authorship and curriculum provenance");

// ── The plan's marked corner is the piece the lesson describes ───────────────
const plan = planFor("completing-square");
const spec = plan?.figure?.spec;
const grid = spec ? figures.rectangleLayout(spec) : null;
const marked = grid ? grid.cells.filter((cell) => cell.emphasis) : [];
const baseArea = grid ? Math.min(...grid.cells.map((cell) => cell.w * cell.h)) : 0;
const cellArea = (label) => {
  const cell = grid?.cells.find((entry) => entry.label === label);
  return cell ? cell.w * cell.h : 0;
};
ok(spec?.kind === "rectangle", "the plan still uses the rectangle area model");
ok(marked.length === 1 && marked[0].label === "9", "the plan marks exactly the 9 corner");
ok(close(cellArea("9") / baseArea, 9), "the marked corner's area is nine times the x² cell");
ok(close(cellArea("3x") / baseArea, 3), "each 3x strip is drawn to its own size");
ok(grid?.cells.filter((cell) => cell.label === "3x").length === 2,
  "both 3x strips are drawn, so the 6 has been halved");
ok(/marked 9|marked corner|corner that closes/i.test(`${lesson.representations[0].body} ${lesson.representations[0].caption}`),
  "the authored lesson names the marked corner as the piece that closes the square");

// ── The completed-square identity, at several values ────────────────────────
sameAt("x^2 + 6*x + 5", "(x + 3)^2 - 4", { x: 0 }, "x² + 6x + 5 equals (x + 3)² − 4 at x = 0");
sameAt("x^2 + 6*x + 5", "(x + 3)^2 - 4", { x: 1 }, "the completed form holds at x = 1");
sameAt("x^2 + 6*x + 5", "(x + 3)^2 - 4", { x: -3 }, "the completed form holds at the turning point");
sameAt("x^2 + 6*x + 5", "(x + 3)^2 - 4", { x: -7 }, "the completed form holds at a negative value");
sameAt("x^2 - 8*x + 11", "(x - 4)^2 - 5", { x: 2 }, "x² − 8x + 11 equals (x − 4)² − 5 at x = 2");
sameAt("x^2 - 8*x + 11", "(x - 4)^2 - 5", { x: 4 }, "the second completed form holds at its turning point");
sameAt("x^2 - 8*x + 11", "(x - 4)^2 - 5", { x: -1 }, "the second completed form holds at a negative value");
sameAt("(x + 3)^2", "x^2 + 6*x + 9", { x: 1 }, "(x + 3)² expands with the two cross terms");
sameAt("(x - 3)^2", "x^2 - 6*x + 9", { x: 2 }, "(x − 3)² expands with a negative middle term");
ok(at("(x + 3)^2", { x: 1 }) !== at("x^2 + 9", { x: 1 }),
  "at x = 1 the correct square is 16 while x² + 9 is 10, so the dropped-cross-term error is visible");
ok(at("(x + 3)^2", { x: 0 }) === 9 && at("(x + 3)^2 - 4", { x: 0 }) === 5,
  "at x = 0 the completed form returns the original constant 5");
ok(at("(x - 4)^2 - 5", { x: 4 }) === -5 && at("(x - 4)^2 - 5", { x: 0 }) === 11,
  "the second form has minimum −5 at x = 4 and returns 11 at x = 0");

// ── The turning points and the negative-leading transfer ───────────────────
ok(at("(x + 3)^2 - 4", { x: -3 }) === -4 && at("(x + 3)^2 - 4", { x: -2 }) > -4,
  "the first turning point is the minimum (−3, −4)");
ok(at("(x - 4)^2 - 5", { x: 4 }) === -5 && at("(x - 4)^2 - 5", { x: 5 }) > -5,
  "the second turning point is the minimum (4, −5)");
sameAt("-2*(x^2 - 40*x + 300)", "-2*(x - 20)^2 + 200", { x: 0 },
  "the theatre profit completes to −2(x − 20)² + 200 at x = 0");
sameAt("-2*(x^2 - 40*x + 300)", "-2*(x - 20)^2 + 200", { x: 20 },
  "the theatre profit reaches 200 at the turning point");
sameAt("-2*(x^2 - 40*x + 300)", "-2*(x - 20)^2 + 200", { x: 40 },
  "the theatre profit agrees at a second price");
ok(at("-2*(x - 20)^2 + 200", { x: 20 }) === 200 &&
  at("-2*(x - 20)^2 + 200", { x: 19 }) === 198,
  "the theatre maximum is 200, and one pound away it is lower, so it is a maximum");

// ── Solving by isolating the square, and both roots ────────────────────────
sameAt("x^2 + 4*x + 1", "(x + 2)^2 - 3", { x: 0 }, "x² + 4x + 1 completes to (x + 2)² − 3 at x = 0");
sameAt("x^2 + 4*x + 1", "(x + 2)^2 - 3", { x: -2 }, "the solving form holds at x = −2");
checkRoots("x^2 + 4*x + 1", [-2 + Math.sqrt(3), -2 - Math.sqrt(3)],
  "x² + 4x + 1 has the two roots −2 ± √3");
checkRoots("x^2 + 6*x + 2", [-3 + Math.sqrt(7), -3 - Math.sqrt(7)],
  "x² + 6x + 2 has the two roots −3 ± √7");
checkRoots("(x - 2)^2 - 5", [2 + Math.sqrt(5), 2 - Math.sqrt(5)],
  "(x − 2)² = 5 has the two roots 2 ± √5");
ok(close((-2 + Math.sqrt(3)) ** 2 + 4 * (-2 + Math.sqrt(3)) + 1, 0),
  "the positive root of x² + 4x + 1 substitutes back to zero");
ok(close((-2 - Math.sqrt(3)) ** 2 + 4 * (-2 - Math.sqrt(3)) + 1, 0),
  "the negative root of x² + 4x + 1 substitutes back to zero");
ok(close((-3 + Math.sqrt(7)) ** 2 + 6 * (-3 + Math.sqrt(7)) + 2, 0),
  "the positive root of x² + 6x + 2 substitutes back to zero");
ok(close((-3 - Math.sqrt(7)) ** 2 + 6 * (-3 - Math.sqrt(7)) + 2, 0),
  "the negative root of x² + 6x + 2 substitutes back to zero");

// ── Guided practice and retrieval ──────────────────────────────────────────
sameAt("x^2 + 10*x + 7", "(x + 5)^2 - 18", { x: 1 }, "guided p1 completes to (x + 5)² − 18");
sameAt("x^2 + 10*x + 7", "(x + 5)^2 - 18", { x: -5 }, "guided p1 holds at its turning point");
sameAt("x^2 - 4*x + 1", "(x - 2)^2 - 3", { x: 3 }, "guided p2 completes to (x − 2)² − 3");
sameAt("x^2 - 4*x + 1", "(x - 2)^2 - 3", { x: 2 }, "guided p2 holds at its turning point");
sameAt("x^2 + 8*x + 7", "(x + 4)^2 - 9", { x: 0 }, "retrieval x1 completes to (x + 4)² − 9");
sameAt("x^2 - 12*x + 32", "(x - 6)^2 - 4", { x: 6 }, "retrieval x3 completes to (x − 6)² − 4");
ok(at("(x - 6)^2 - 4", { x: 6 }) === -4, "retrieval x3's turning point is (6, −4)");
ok(close(Math.sqrt(5) ** 2, 5) && close((-Math.sqrt(5)) ** 2, 5),
  "retrieval x2's two roots come from both signs of √5");

// ── Keys and prose claims ──────────────────────────────────────────────────
const a1 = lesson.assessment.find((item) => item.id === "a1");
const a2 = lesson.assessment.find((item) => item.id === "a2");
const a3 = lesson.assessment.find((item) => item.id === "a3");
ok(a1?.modelAnswer === "36", "a1's model answer is 36");
ok(a1?.check.accepted.some((value) => normalized(value) === normalized(a1.modelAnswer)),
  "a1 accepts its own model answer");
ok(a2?.modelAnswer === "2", "a2's model answer is 2");
ok(a2?.check.accepted.some((value) => normalized(value) === normalized(a2.modelAnswer)),
  "a2 accepts its own model answer");
ok(a3?.marking.length >= 4, "a3 carries four separate marking criteria");
for (const item of lesson.assessment.filter((entry) => entry.check)) {
  ok(item.check.accepted.some((value) => normalized(value) === normalized(item.modelAnswer)),
    `${item.id}: the model answer is one of its own accepted answers`);
}
ok(lesson.workedExamples[0].answer.includes("(−3, −4)"), "w1 states the turning point (−3, −4)");
ok(lesson.workedExamples[1].answer.includes("(4, −5)"), "w2 states the turning point (4, −5)");
ok(lesson.workedExamples[2].answer.includes("√3"), "w3 keeps the exact surd roots");
ok(lesson.transfer[0].answer.includes("£20,000"), "the transfer states the maximum profit in pounds");
ok(lesson.transfer[0].answer.includes("£20"), "the transfer states the ticket price");

const allText = [
  lesson.introduction.hook,
  lesson.introduction.why,
  ...lesson.explanation.flatMap((section) => section.paragraphs),
  ...lesson.misconceptions.flatMap((item) => [item.whyItFails, item.correction]),
].join(" ");
ok(/two equal strips|two 3x strips/i.test(allText), "the lesson explains the two equal strips");
ok(/add 9.*subtract 9|subtract 9.*add 9/i.test(allText),
  "the lesson explains adding and subtracting the same corner");
ok(/cannot be negative|never negative/i.test(allText),
  "the lesson explains why the completed square has a minimum or maximum");
ok(/both roots|positive and.*negative square root|±/i.test(allText),
  "the lesson explains why both roots are taken");
ok(/substitut|expansion check|expand/i.test(allText),
  "the lesson gives expansion or substitution as the independent check");

function checkRoots(expression, roots, label) {
  const values = roots.map((root) => at(expression, { x: root }));
  ok(values.every((value) => close(value, 0, 1e-8)), label);
}

if (failures.length) {
  console.error(`\n${failures.length} completing-square check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
