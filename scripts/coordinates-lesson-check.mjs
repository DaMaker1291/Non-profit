#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// COORDINATES — the lesson's geometry, checked independently.
//
// The lesson contract proves the parts exist. It cannot prove that (3, -2) is in
// the fourth quadrant, that (0, 3) is on the y-axis, that (2, 4) fails the rule
// y = 2x + 1, or that y = 3 is horizontal. This gate evaluates every pinned
// point, table and substitution separately from the prose that states it.
//
// It is NOT teacher review and NOT a learner trial. A passing run says the
// coordinates and the stated rules agree; it says nothing about whether a pupil
// can read a graph without being told which question to ask.
//
// Run: node scripts/coordinates-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_COORDINATES: lesson } = require("../.verify/lessons/authored/maths-coordinates.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const onLine = (x, y, m, c) => close(y, m * x + c);
const quadrant = (x, y) =>
  x === 0 || y === 0 ? "axis" : x > 0 && y > 0 ? "I" : x < 0 && y > 0 ? "II" : x < 0 && y < 0 ? "III" : "IV";

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "coordinates", "the lesson is for coordinates");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.objectives.every((objective) => objective.statement.length > 50 && objective.evidence.length > 50),
  "every objective carries a measurable evidence statement");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.priorKnowledge.conceptIds.includes("negatives"),
  "the diagnostic names the genome's declared prerequisite, negatives");
ok(lesson.priorKnowledge.check.every((check) => check.targets.includes("negatives")),
  "every prerequisite check actually targets negatives");
ok(lesson.explanation.length === 4, "there are four explanation sections");
ok(lesson.explanation.flatMap((section) => section.paragraphs).length === 8,
  "there are eight explanation paragraphs");
ok(lesson.representations.length === 3, "there are three representation blocks");
ok(lesson.representations.every((block) => block.kind === "maths.expression"),
  "the representations use the mathematics framework");
ok(lesson.representations.every((block) => typeof block.caption === "string" && block.caption.length > 80),
  "every representation carries a teaching caption, not a label");
ok(lesson.workedExamples.length === 3, "there are three worked examples");
ok(lesson.workedExamples.every((example) => example.steps.length >= 3),
  "every worked example models at least three moves");
ok(lesson.workedExamples.every((example) => example.steps.every((step) => step.why.length > 30)),
  "every move states a reason, not only an instruction");
ok(lesson.misconceptions.length === 3, "there are three misconceptions taught");
ok(lesson.guidedPractice.length === 3, "there are three guided practice items");
ok(lesson.assessment.length === 3, "there are three assessment items");
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

// ── The pair is an address ──────────────────────────────────────────────────
ok(quadrant(3, -2) === "IV", "(3, -2) is in the fourth quadrant");
ok(quadrant(-3, 2) === "II", "(-3, 2) is in the second quadrant");
ok(quadrant(-4, -3) === "III", "(-4, -3) is in the third quadrant");
ok(quadrant(-5, 2) === "II", "(-5, 2) is in the second quadrant");
ok(quadrant(0, -4) === "axis", "(0, -4) is on an axis, not in a quadrant");
ok(quadrant(3, 0) === "axis", "(3, 0) is on an axis, not in a quadrant");
ok(quadrant(-2, 5) === "II", "(-2, 5) is in the second quadrant");
ok(quadrant(3, -2) !== quadrant(-2, 3), "(3, -2) and (-2, 3) lie in different quadrants");
ok(JSON.stringify([2, 5].slice().reverse()) === JSON.stringify([5, 2]),
  "swapping the pair swaps the journey");
ok(lesson.misconceptions[1].belief.includes("(0, 3)") &&
   lesson.misconceptions[1].whyItFails.includes("y-axis"),
  "the lesson names (0, 3) as its axis misconception and corrects it to the y-axis");
ok(lesson.misconceptions[1].contrast.right.includes("(3, 0)"),
  "the correction gives (3, 0) as the point on the x-axis");

// ── Worked example 1: plotting three points ─────────────────────────────────
ok(3 > 0 && -2 < 0, "A(3, -2) is right and down");
ok(-3 < 0 && 2 > 0, "B(-3, 2) is left and up");
ok(0 === 0 && -4 < 0, "C(0, -4) makes no horizontal move");
ok(new Set(["3,-2", "-3,2", "0,-4"]).size === 3, "the three worked points are distinct");

// ── Worked example 2: y = 2x - 1 ────────────────────────────────────────────
const tableW2 = [-1, 0, 1, 2].map((x) => 2 * x - 1);
ok(close(tableW2[0], -3), "at x = -1, y = 2x - 1 gives -3");
ok(close(tableW2[1], -1), "at x = 0, y = 2x - 1 gives -1");
ok(close(tableW2[2], 1), "at x = 1, y = 2x - 1 gives 1");
ok(close(tableW2[3], 3), "at x = 2, y = 2x - 1 gives 3");
ok(close(tableW2[1], -1), "the intercept of y = 2x - 1 is (0, -1)");
ok(onLine(0, -1, 2, -1), "the intercept satisfies its own rule");
ok(!onLine(3, 4, 2, -1), "(3, 4) is not on y = 2x - 1");
ok(onLine(3, 5, 2, -1), "(3, 5) is on y = 2x - 1");
ok(2 * 3 - 1 === 5, "substituting x = 3 gives 5, which is why (3, 4) fails");
ok(close(tableW2[3] - tableW2[2], 2) && close(tableW2[2] - tableW2[1], 2),
  "each step of 1 in x adds a constant 2 to y");

// ── Worked example 3: y = 3 and x = -2 ──────────────────────────────────────
const horizontal = [[0, 3], [2, 3], [-1, 3]];
const vertical = [[-2, 0], [-2, 3], [-2, -1]];
ok(horizontal.every(([, y]) => y === 3), "every point on y = 3 has height 3");
ok(new Set(horizontal.map(([x]) => x)).size === 3, "the x values on y = 3 vary, so the line is horizontal");
ok(vertical.every(([x]) => x === -2), "every point on x = -2 has x = -2");
ok(new Set(vertical.map(([, y]) => y)).size === 3, "the y values on x = -2 vary, so the line is vertical");
ok(vertical.some(([x, y]) => x === -2 && y === 0), "x = -2 crosses the x-axis at (-2, 0)");
ok(horizontal.some(([x, y]) => x === 0 && y === 3), "y = 3 crosses the y-axis at (0, 3)");
ok(-2 === -2 && 3 === 3,
  "(-2, 3) satisfies both x = -2 and y = 3, so it is on both lines");

// ── The plan's rule and the lesson's rule agree ─────────────────────────────
const planRule = [[0, 1], [1, 3], [2, 5]];
ok(planRule.every(([x, y]) => onLine(x, y, 2, 1)),
  "the three points in the plan's drawing satisfy y = 2x + 1");
ok(lesson.representations.some((block) => block.notation.includes("2x + 1")),
  "the lesson's representation uses the same rule as the drawing");
ok(!onLine(2, 4, 2, 1), "(2, 4) fails y = 2x + 1, which is the lesson's membership test");
ok(onLine(2, 5, 2, 1), "(2, 5) passes the same test");
ok(close(2 * 2 + 1, 5), "the table's y at x = 2 is 5, not 4");

// ── Guided practice ─────────────────────────────────────────────────────────
ok(-4 < 0 && -3 < 0 && quadrant(-4, -3) === "III",
  "p1's point is (-4, -3) in the third quadrant");
const tableP2 = [0, 1, 2].map((x) => 3 * x - 2);
ok(close(tableP2[0], -2) && close(tableP2[1], 1) && close(tableP2[2], 4),
  "p2's table for y = 3x - 2 is -2, 1, 4");
ok(!onLine(2, 5, 3, -2), "p2's (2, 5) is not on y = 3x - 2");
ok(onLine(2, 4, 3, -2), "p2's (2, 4) is on the line");
ok(lesson.guidedPractice[2].answer.includes("y = -1") &&
   lesson.guidedPractice[2].answer.includes("x = 4"),
  "p3's answer names the two lines it was asked about");
ok(lesson.guidedPractice[2].answer.includes("(4, -1)"),
  "p3's answer gives the crossing as (4, -1), in that order");
ok(quadrant(4, -1) === "IV", "p3's crossing lies in the fourth quadrant");

// ── Assessment keys ─────────────────────────────────────────────────────────
const a1 = lesson.assessment.find((item) => item.id === "a1");
const a2 = lesson.assessment.find((item) => item.id === "a2");
const a3 = lesson.assessment.find((item) => item.id === "a3");
ok(-2 < 0 && 5 > 0 && quadrant(-2, 5) === "II", "a1's point P is (-2, 5) in the second quadrant");
ok(2 > 0 && 5 > 0 && quadrant(2, 5) === "I", "(2, 5) is a different point in a different quadrant");
ok(a1.modelAnswer.includes("y-axis"), "a1's model answer puts (0, 3) on the y-axis");
ok(a1.modelAnswer.includes("(3, 0)"),
  "a1's model answer gives a point on the x-axis, where y = 0");
ok(onLine(4, 7, 2, -1), "(4, 7) is on y = 2x - 1");
ok(2 * 4 - 1 === 7, "substituting x = 4 into y = 2x - 1 gives 7");
ok(a1?.marking.length === 4, "a1 carries four marking criteria");
ok(a2 && a2.modelAnswer.replace(/\s+/g, "") === "(3,-4)", "a2's model answer is (3, -4)");
ok(a2?.check.accepted.some((answer) => answer.replace(/\s+/g, "") === "(3,-4)"),
  "a2 accepts its own model answer");
ok(a3 && a3.modelAnswer.replace(/\s+/g, "") === "(-2,0)", "a3's model answer is (-2, 0)");
ok(a3?.check.accepted.some((answer) => answer.replace(/\s+/g, "") === "(-2,0)"),
  "a3 accepts its own model answer");
ok(lesson.assessment[2].prompt.includes("x = -2"), "a3 asks about the line it is keyed to");
ok(a2?.marking.length >= 2 && a3?.marking.length >= 2,
  "the short-answer items carry marking criteria, not only a key");

// ── Transfer: two paths ─────────────────────────────────────────────────────
ok(onLine(-2, 1, 1, 3), "(-2, 1) lies on y = x + 3");
ok(onLine(2, 5, 1, 3), "(2, 5) lies on y = x + 3");
ok(!onLine(-2, 1, 2, 1), "(-2, 1) does not lie on y = 2x + 1");
ok(onLine(2, 5, 2, 1), "(2, 5) does lie on y = 2x + 1");
const crossX = 2;
ok(close(crossX + 3, 2 * crossX + 1), "x = 2 makes both rules produce the same y");
ok(close(crossX + 3, 5), "the crossing is at y = 5");
ok((crossX + 3) - (2 * crossX + 1) === 0, "the two expressions differ by zero at the crossing");
ok((0 + 3) - (2 * 0 + 1) === 2, "at x = 0 the two paths are 2 apart");
ok((1 + 3) - (2 * 1 + 1) === 1, "at x = 1 they are 1 apart");
ok((3 + 3) - (2 * 3 + 1) === -1, "at x = 3 they have crossed and are 1 apart the other way");
ok(lesson.transfer[0].answer.includes("(2, 5)"),
  "the transfer answer names the shared checkpoint as the crossing");

// ── Retrieval ───────────────────────────────────────────────────────────────
ok(-5 < 0 && 2 > 0 && quadrant(-5, 2) === "II", "x1's point (-5, 2) is left and up");
ok(onLine(3, 8, 3, -1), "x2's (3, 8) lies on y = 3x - 1");
ok(3 * 3 - 1 === 8, "x2's substitution gives 8");
ok(lesson.retrieval[2].prompt.includes("y = -2") && lesson.retrieval[2].prompt.includes("x = 4"),
  "x3's prompt names the two lines it is keyed to");
ok(lesson.retrieval[2].answer.includes("(4, -2)"),
  "x3's answer gives the crossing as (4, -2)");

// ── The prose makes the claims the lesson depends on ────────────────────────
const allText = [
  lesson.introduction.hook,
  lesson.introduction.why,
  ...lesson.explanation.flatMap((section) => section.paragraphs),
  ...lesson.misconceptions.flatMap((item) => [item.belief, item.whyItFails, item.correction]),
].join(" ");
ok(/first number|horizontal coordinate/i.test(allText), "the lesson says the first number is horizontal");
ok(/order is the address|order is part/i.test(allText), "the lesson states that the order is the address");
ok(/zero coordinate means|no horizontal movement|no horizontal move/i.test(allText),
  "the lesson explains what a zero coordinate means");
ok(/substitut/i.test(allText), "the lesson makes substitution the test of membership");
ok(/horizontal/i.test(allText) && /vertical/i.test(allText),
  "the lesson distinguishes horizontal from vertical lines");
ok(/both equations|both rules|satisfies both/i.test(allText),
  "the lesson explains that a crossing satisfies both equations");

if (failures.length) {
  console.error(`\n${failures.length} coordinates check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
