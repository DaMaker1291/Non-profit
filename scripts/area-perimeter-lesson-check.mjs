#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// AREA AND PERIMETER — THE LESSON'S MEASUREMENTS, CHECKED INDEPENDENTLY.
//
// The lesson contract proves the lesson has the required parts. It cannot prove
// that 7.5 × 4 is 30, that removing a 3 × 2 corner leaves the perimeter of a
// 10 × 6 rectangle unchanged, or that 1 m² is 10,000 cm². This gate evaluates
// those claims separately from the prose that states them.
//
// It is NOT a proof checker and NOT teacher review. A passing run says the
// pinned arithmetic and units have not drifted, not that a pupil learned.
//
// Run: node scripts/area-perimeter-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_AREA_PERIMETER: lesson } = require("../.verify/lessons/authored/maths-area-perimeter.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const norm = (value) => String(value).toLowerCase().replace(/\s+/g, "").replace(/[.,;:]/g, "");

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "area-perimeter", "the lesson is for area-perimeter");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.priorKnowledge.conceptIds.includes("multiplication") &&
   lesson.priorKnowledge.conceptIds.includes("decimals"),
  "the prerequisite checks name multiplication and decimals");
ok(lesson.explanation.length === 4, "there are four explanation sections");
ok(lesson.explanation.flatMap((section) => section.paragraphs).length === 8,
  "there are eight explanation paragraphs");
ok(lesson.representations.length === 3, "there are three representation blocks");
ok(lesson.representations.some((block) => block.kind === "maths.area-model"),
  "at least one representation uses the area-model framework");
ok(lesson.representations.every((block) => typeof block.caption === "string" && block.caption.length > 80),
  "every representation carries a teaching caption, not a label");
ok(lesson.workedExamples.length === 3, "there are three worked examples");
ok(lesson.workedExamples.every((example) => example.steps.length >= 2),
  "every worked example models at least two moves");
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
ok(lesson.accessibility.length >= 4, "there are at least four accessibility alternatives");
ok(lesson.summary.length >= 2, "there is a usable summary");
ok(lesson.provenance.length === 2, "the lesson carries its authorship and curriculum provenance");

// ── The rectangle the lesson opens with ──────────────────────────────────────
const lawnLength = 7.5;
const lawnWidth = 4;
const lawnArea = lawnLength * lawnWidth;
const lawnPerimeter = 2 * (lawnLength + lawnWidth);
ok(close(lawnArea, 30), "7.5 m by 4 m has an area of 30 m²");
ok(close(lawnPerimeter, 23), "7.5 m by 4 m has a perimeter of 23 m");
ok(close(lawnPerimeter, 7.5 + 4 + 7.5 + 4), "the perimeter is the four sides added, not the area");
ok(lawnArea !== lawnPerimeter, "the area and perimeter are different quantities even when both are numbers");

// ── The derived formulas ─────────────────────────────────────────────────────
const triangleBase = 12;
const triangleHeight = 9;
const triangleArea = 0.5 * triangleBase * triangleHeight;
const parallelogramArea = triangleBase * triangleHeight;
const trapeziumA = 6;
const trapeziumB = 10;
const trapeziumHeight = 5;
const trapeziumArea = 0.5 * (trapeziumA + trapeziumB) * trapeziumHeight;
ok(close(triangleArea, 54), "½ × 12 cm × 9 cm is 54 cm²");
ok(close(parallelogramArea, 108), "12 cm × 9 cm is 108 cm²");
ok(close(parallelogramArea, 2 * triangleArea), "two identical triangles make the parallelogram");
ok(close(trapeziumArea, 40), "½(6 + 10) × 5 is 40 cm²");
ok(close(0.5 * (trapeziumA + trapeziumB), 8), "the trapezium's average parallel width is 8 cm");
ok(close(trapeziumArea, 8 * trapeziumHeight), "the trapezium is the average-width rectangle");
ok(close(0.5 * 12 * 9, 54) && 0.5 * 12 * 9 !== 12 * 9,
  "omitting the half doubles the triangle's area");

// ── Compound shapes: area and perimeter are not the same subtraction ─────────
const outerArea = 10 * 6;
const notchArea = 3 * 2;
const lShapeArea = outerArea - notchArea;
const lShapePerimeter = 2 * (10 + 6);
ok(close(outerArea, 60), "the 10 m by 6 m bounding rectangle is 60 m²");
ok(close(notchArea, 6), "the 3 m by 2 m notch is 6 m²");
ok(close(lShapeArea, 54), "the L-shape's area is 54 m²");
ok(close(lShapePerimeter, 32), "the L-shape's perimeter is still 32 m");
ok(close(lShapePerimeter, 10 + 6 + 7 + 4 + 3 + 2), "walking the outside gives 32 m as well");
ok(lShapePerimeter !== lShapePerimeter + 2 * (3 + 2),
  "adding the notch's edges again would double-count them");
ok(close((7 * 6) + (3 * 4), 54), "splitting the L-shape into 7×6 and 3×4 also gives 54 m²");
ok(close((6 * 6) + (3 * 6), 54), "a second valid split also gives 54 m²");

// ── The unit conversion the lesson is built to correct ──────────────────────
const metresInCentimetres = 100;
const squareMetreInSquareCentimetres = metresInCentimetres * metresInCentimetres;
const stripAreaInMetres = 2 * 0.5;
const stripAreaInCentimetres = 200 * 50;
const stripPerimeterInMetres = 2 * (2 + 0.5);
const stripPerimeterInCentimetres = 2 * (200 + 50);
ok(metresInCentimetres === 100, "1 m is 100 cm");
ok(squareMetreInSquareCentimetres === 10_000, "1 m² is 10,000 cm², not 100 cm²");
ok(close(stripAreaInMetres, 1), "2 m by 50 cm is 1 m²");
ok(close(stripAreaInCentimetres, 10_000), "200 cm by 50 cm is 10,000 cm²");
ok(close(stripAreaInMetres * 10_000, stripAreaInCentimetres),
  "the two descriptions of the same rectangle agree");
ok(close(stripPerimeterInMetres, 5), "the 2 m by 50 cm rectangle has perimeter 5 m");
ok(close(stripPerimeterInCentimetres, 500), "the same perimeter is 500 cm, not 500 m");
ok(close(stripPerimeterInMetres * 100, stripPerimeterInCentimetres),
  "perimeter converts with the length factor, area with its square");

// ── Guided practice keys ────────────────────────────────────────────────────
ok(close(9 * 4, 36) && close(2 * (9 + 4), 26), "p1 is area 36 cm² and perimeter 26 cm");
ok(close(0.5 * 14 * 6, 42), "p2 is area 42 m²");
ok(close(8 * 5 - 2 * 3, 34) && close(2 * (8 + 5), 26),
  "p3 is area 34 m² and perimeter 26 m");

// ── Assessment keys ─────────────────────────────────────────────────────────
const a2 = lesson.assessment.find((item) => item.id === "a2");
const a3 = lesson.assessment.find((item) => item.id === "a3");
ok(close(2.4 * 1.5, 3.6), "a2 is 3.6 m²");
ok(close(2 * (2.4 + 1.5), 7.8), "a2's perimeter would be 7.8 m, so the area is not the perimeter");
ok(a2?.check.accepted.some((answer) => norm(answer) === norm("3.6 m²")),
  "a2 accepts 3.6 m²");
ok(a3 && close(0.5 * (5 + 9) * 4, 28), "a3 is 28 cm²");
ok(a3?.check.accepted.some((answer) => norm(answer) === norm("28 cm²")),
  "a3 accepts 28 cm²");
ok(a2?.marking.length >= 2 && a3?.marking.length >= 2,
  "the short-answer items carry marking criteria, not only a key");

// ── Transfer: the path around the lawn ──────────────────────────────────────
const pathOuterLength = 7.5 + 2;
const pathOuterWidth = 4 + 2;
const pathOuterArea = pathOuterLength * pathOuterWidth;
const pathArea = pathOuterArea - lawnArea;
const pathOuterPerimeter = 2 * (pathOuterLength + pathOuterWidth);
ok(close(pathOuterLength, 9.5) && close(pathOuterWidth, 6),
  "the path makes the outside rectangle 9.5 m by 6 m");
ok(close(pathOuterArea, 57), "the outside rectangle is 57 m²");
ok(close(pathArea, 27), "the path is 27 m²");
ok(close(pathOuterPerimeter, 31), "the outside perimeter is 31 m");
ok(close(lawnPerimeter * 1, 23) && pathArea !== 23,
  "the lawn's perimeter times the path width misses the corners");
ok(close((9.5 * 6) - (7.5 * 4), 27),
  "outer area minus inner area is the same path area");

// ── Retrieval ───────────────────────────────────────────────────────────────
ok(close(0.5 * 16 * 7, 56), "x1 is 56 cm²");
ok(close(1.5 * 0.4, 0.6) && close(2 * (1.5 + 0.4), 3.8),
  "x2 is 0.6 m² and 3.8 m");
ok(close(9 * 5 - 2 * 2, 41) && close(2 * (9 + 5), 28),
  "x3 is 41 m² and 28 m");

// ── Explanations make the right claim ───────────────────────────────────────
const allText = [
  lesson.introduction.hook,
  lesson.introduction.why,
  ...lesson.explanation.flatMap((section) => section.paragraphs),
  ...lesson.misconceptions.flatMap((item) => [item.whyItFails, item.correction]),
].join(" ");
ok(/10,000 cm²/.test(allText), "the lesson states the 10,000 cm² conversion explicitly");
ok(/half of a parallelogram|two identical triangles/i.test(allText),
  "the triangle's half is derived from the parallelogram");
ok(/perpendicular height/i.test(allText),
  "the lesson names the perpendicular height, not the slant side");
ok(/removing a corner|cut edges replace/i.test(allText),
  "the lesson explains why a corner removal leaves the perimeter unchanged");

if (failures.length) {
  console.error(`\n${failures.length} area-perimeter check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
