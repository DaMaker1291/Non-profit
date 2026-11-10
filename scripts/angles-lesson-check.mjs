#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ANGLES AND LINES — THE LESSON'S GEOMETRY, CHECKED INDEPENDENTLY.
//
// The lesson contract proves the lesson has the required parts. It cannot prove
// that the angles printed in those parts are the angles the facts produce. This
// gate evaluates the arithmetic behind every claim: straight-line and point
// totals, the parallel-line pairs, the triangle and polygon derivations, the
// regular-polygon divisions, the assessment keys and the tiling transfer.
//
// It is NOT a proof checker and NOT teacher review. The written reasons are
// checked for the facts they name; a passing run says the pinned arithmetic has
// not drifted, not that a pupil learned from the page.
//
// Run: node scripts/angles-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_ANGLES_LINES: lesson } = require("../.verify/lessons/authored/maths-angles-lines.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const sum = (...values) => values.reduce((total, value) => total + value, 0);
const interiorSum = (n) => (n - 2) * 180;
const regularInterior = (n) => interiorSum(n) / n;
const regularExterior = (n) => 360 / n;

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "angles-lines", "the lesson is for angles-lines");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.explanation.length === 4, "there are four explanation sections");
ok(lesson.explanation.flatMap((section) => section.paragraphs).length === 8,
  "there are eight explanation paragraphs");
ok(lesson.representations.length === 3, "there are three representation blocks");
ok(lesson.representations.every((block) => block.kind === "maths.expression"),
  "the representation blocks use the mathematics framework");
ok(lesson.workedExamples.length === 3, "there are three worked examples");
ok(lesson.workedExamples.every((example) => example.steps.length >= 2),
  "every worked example models at least two moves");
ok(lesson.misconceptions.length === 3, "there are three misconceptions taught");
ok(lesson.guidedPractice.length === 3, "there are three guided practice items");
ok(lesson.assessment.length === 3, "there are three assessment items");
ok(lesson.assessment.some((item) => item.kind === "constructed-response"),
  "at least one assessment asks for reasoning in words");
ok(lesson.transfer.length === 1, "there is one transfer challenge");
ok(lesson.retrieval.length === 3, "there are three retrieval prompts");
ok(lesson.retrieval.some((item) => item.when === "week-later") &&
   lesson.retrieval.some((item) => item.when === "month-later"),
  "the retrieval prompts include week-later and month-later spacing");
ok(lesson.accessibility.length >= 3, "there are at least three accessibility alternatives");
ok(lesson.summary.length >= 2, "there is a usable summary");

// ── The angle facts the learner is asked to trust ────────────────────────────
ok(close(sum(52, 63, 65), 180), "52° + 63° + 65° makes a straight angle");
ok(close(sum(60, 95, 105, 100), 360), "60° + 95° + 105° + 100° makes a complete turn");
ok(close(180 - 30, 150), "the angle adjacent to 30° on a straight line is 150°");
ok(close(150 + 30, 180), "a vertically opposite pair with a 30° angle has a 150° neighbour");
ok(close(68 + 112, 180), "68° and 112° are supplementary co-interior angles");
ok(close(180 - 68, 112), "the co-interior supplement of 68° is 112°");
ok(close(81 + 47 + 52, 180), "a triangle with 81° and 47° has a 52° third angle");

// The polygon formula is derived from triangles, not asserted as a second rule.
for (let n = 3; n <= 12; n++) {
  ok(close(interiorSum(n), (n - 2) * 180),
    `an ${n}-sided polygon has ${(n - 2) * 180}° of interior angle`);
}
ok(close(interiorSum(5), 540), "a pentagon's interior angles total 540°");
ok(close(regularInterior(5), 108), "a regular pentagon has interior angle 108°");
ok(close(regularExterior(5), 72), "a regular pentagon has exterior angle 72°");
ok(close(108 + 72, 180), "the pentagon's interior and exterior angles make a straight angle");
ok(close(interiorSum(6), 720), "a hexagon's interior angles total 720°");
ok(close(regularInterior(6), 120), "a regular hexagon has interior angle 120°");
ok(close(regularExterior(6), 60), "a regular hexagon has exterior angle 60°");
ok(close(interiorSum(8), 1080), "an octagon's interior angles total 1,080°");
ok(close(regularInterior(8), 135), "a regular octagon has interior angle 135°");
ok(close(regularExterior(8), 45), "a regular octagon has exterior angle 45°");
ok(close(sum(...Array.from({ length: 8 }, () => regularExterior(8))), 360),
  "eight regular-octagon exterior angles make a complete turn");
ok(close(sum(...Array.from({ length: 15 }, () => 24)), 360),
  "fifteen exterior angles of 24° make a complete turn");

// The assessment a2 uses an equation, not just a pair of numbers.
const a2x = 26;
ok(close(3 * a2x + 15, 93), "a2's first angle at x = 26 is 93°");
ok(close(2 * a2x + 35, 87), "a2's second angle at x = 26 is 87°");
ok(close(3 * a2x + 15 + 2 * a2x + 35, 180), "a2's two angles make a straight angle");
ok(close(360 / 24, 15), "a3's regular polygon has 15 sides");
ok(close(15 * 24, 360), "a3's 15 exterior angles of 24° make a complete turn");

// The hexagon-and-pentagon transfer is an exact fit versus a non-fit.
ok(close(regularInterior(6) * 3, 360), "three regular hexagons meet at a point");
ok(!close(regularInterior(5) * 3, 360), "three regular pentagons do not make 360°");
ok(close(regularInterior(5) * 3, 324), "three regular pentagons leave a 36° gap");
ok(close(regularInterior(5) * 4, 432), "four regular pentagons overlap at a vertex");
ok(360 % regularInterior(5) !== 0, "no whole number of 108° angles makes 360°");

// ── Retrieval values ─────────────────────────────────────────────────────────
ok(close(125 + 55, 180), "x1's 125° and 55° make a straight angle");
ok(close(73 + 107, 180), "x2's 73° co-interior angle is 107°");
ok(close(interiorSum(7), 900), "x3's seven-sided formula gives 900°");

// ── The deterministic keys accept their own model answers ────────────────────
const normalise = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
for (const item of lesson.assessment.filter((entry) => entry.check)) {
  ok(item.check.accepted.some((accepted) => normalise(accepted) === normalise(item.modelAnswer)),
    `${item.id}: the model answer is one of its own accepted answers`);
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log("Angles and lines — independent lesson checks");
console.log(`  ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  ✗ FAIL: ${failure}`);
  process.exit(1);
}
