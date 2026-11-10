#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// INDEX LAWS — the lesson's arithmetic, checked separately from its prose.
//
// The lesson contract proves the parts exist. It cannot prove that 3⁴ is 81 and
// not 12, that 27^(2/3) is 9, that 12a⁵ survives substitution at a = 2, or that
// the rumour transfer's running total is 121 rather than 243. This gate
// evaluates every pinned number independently.
//
// It is NOT teacher review and NOT a learner trial. A passing run says the
// arithmetic and the stated rules agree; it says nothing about whether a pupil
// applies an index law without being prompted.
//
// Run: node scripts/indices-intro-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_INDICES_INTRO: lesson } = require("../.verify/lessons/authored/maths-indices-intro.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b, tolerance = 1e-9) => Math.abs(Number(a) - Number(b)) < tolerance;
const sum = (values) => values.reduce((total, value) => total + value, 0);

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "indices-intro", "the lesson is for indices-intro");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.objectives.every((objective) => objective.statement.length > 50 && objective.evidence.length > 50),
  "every objective carries a measurable evidence statement");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.priorKnowledge.conceptIds.includes("order-ops"),
  "the diagnostic names the genome's declared prerequisite, order-ops");
ok(lesson.priorKnowledge.check.every((check) => check.targets.includes("order-ops")),
  "every prerequisite check actually targets order-ops");
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
ok(lesson.misconceptions.every((item) => item.contrast?.wrong && item.contrast?.right),
  "every misconception carries a wrong/right contrast");
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

// ── An index counts copies ──────────────────────────────────────────────────
ok(3 ** 4 === 81, "3⁴ is 81");
ok(3 * 4 === 12, "3 × 4 is 12, which the common error substitutes for 81");
ok(2 ** 10 === 1024, "2¹⁰ is 1024");
ok(10 * 2 === 20, "20 is the linear answer the lesson names as wrong");
ok(close(0.1 * 2 ** 10, 102.4), "ten folds of 0.1 mm make 102.4 mm");
ok(2 ** 8 === 256, "2⁸ is 256");
ok(2 ** 5 === 32 && 2 ** 3 === 8, "2⁵ is 32 and 2³ is 8");
ok(2 ** 5 * 2 ** 3 === 2 ** 8, "multiplying 2⁵ by 2³ gives 2⁸");
ok(2 ** 5 + 2 ** 3 === 40, "adding 2⁵ and 2³ gives 40, not 2⁸");
ok(5 ** 2 === 25 && 5 ** 3 === 125, "5² is 25 and 5³ is 125");
ok(2 * 2 ** 3 === 16, "2x³ with x = 2 is 16");
ok((2 * 2) ** 3 === 64, "(2x)³ with x = 2 is 64");
ok(2 * 2 ** 3 !== (2 * 2) ** 3, "2x³ and (2x)³ are different at x = 2");

// ── Multiplication and division ─────────────────────────────────────────────
ok(3 ** 2 * 3 === 27, "2³ × 3² is 72, not a single power of 6");
ok(2 ** 3 * 3 ** 2 === 72, "2³ × 3² is 8 × 9 = 72");
ok(6 ** 5 === 7776, "6⁵ is 7776, which the error would claim for 72");
ok(2 ** 5 / 2 ** 2 === 2 ** 3, "2⁵ ÷ 2² gives 2³");
ok(3 ** 5 / 3 ** 2 === 27, "3⁵ ÷ 3² is 27");
const a = 2;
ok(3 * a ** 2 * 4 * a ** 3 === 12 * a ** 5, "3a² × 4a³ = 12a⁵ at a = 2");
ok(3 * a ** 2 * 4 * a ** 3 === 3 * 4 * 4 * 8, "the original product is 3 × 4 × 4 × 8 = 384");
ok(12 * a ** 5 === 384, "12a⁵ at a = 2 is 384");
ok((2 * a ** 3) ** 2 === 4 * a ** 6, "(2x³)² = 4x⁶ at x = 2");
ok((2 * a ** 3) ** 2 * a ** 4 === 4 * a ** 10, "(2x³)² × x⁴ = 4x¹⁰ at x = 2");
ok(4 * a ** 10 === 4096, "4x¹⁰ at x = 2 is 4096");
ok(256 * 16 === 4096, "the original (2 × 8)² × 16 is 4096");
ok(8 * a ** 5 === 256 && 2 * a ** 2 === 8, "8x⁵ is 256 and 2x² is 8 at x = 2");
ok((8 * a ** 5) / (2 * a ** 2) === 4 * a ** 3, "8x⁵ ÷ 2x² = 4x³ at x = 2");
ok(4 * a ** 3 === 32, "4x³ at x = 2 is 32, the quotient of 256 and 8");
ok(4 * a ** 2 * 3 * a ** 5 === 12 * a ** 7, "4x² × 3x⁵ = 12x⁷ at x = 2");
ok(4 * a ** 2 * 3 * a ** 5 === 1536, "the original 4x² × 3x⁵ is 1536 at x = 2");
ok(12 * a ** 7 === 1536, "12x⁷ at x = 2 is 1536");
ok(5 ** 4 * 5 ** 3 === 5 ** 7, "5⁴ × 5³ = 5⁷");
ok(5 ** 7 === 78125, "5⁷ is 78,125");

// ── Zero and negative indices ───────────────────────────────────────────────
ok(5 ** 3 / 5 ** 3 === 1, "5³ ÷ 5³ is 1");
ok(5 ** 0 === 1, "5⁰ is 1");
ok(2 ** 0 === 1, "2⁰ is 1");
ok(2 ** -1 === 0.5, "2⁻¹ is 1/2");
ok(2 ** -2 === 0.25, "2⁻² is 1/4");
ok(2 ** -3 === 0.125, "2⁻³ is 1/8");
ok(4 / 32 === 1 / 8, "2² ÷ 2⁵ is 4 ÷ 32 = 1/8");
ok(close(3 ** -2, 1 / 9), "3⁻² is 1/9");
ok(2 ** -2 > 0, "2⁻² is positive, not negative");
ok(3 ** -2 > 0, "3⁻² is positive, not negative");

// ── Fractional indices ──────────────────────────────────────────────────────
ok(close(25 ** 0.5, 5), "25^(1/2) is 5");
ok(close(16 ** 0.5, 4), "16^(1/2) is 4");
ok(close(8 ** (1 / 3), 2), "8^(1/3) is 2");
ok(close(16 ** 0.25, 2), "the fourth root of 16 is 2");
ok(close(16 ** (3 / 4), 8), "16^(3/4) is 8");
ok(close(27 ** (1 / 3), 3), "the cube root of 27 is 3");
ok(close(27 ** (2 / 3), 9), "27^(2/3) is 9");
ok(close(9 ** 1.5, 27), "9^(3/2) returns 27, the consistency check");
ok(16 ** (3 / 4) !== 12, "16^(3/4) is not 12");

// ── The rumour transfer ─────────────────────────────────────────────────────
const hour = (n) => 3 ** n;
ok(hour(0) === 1, "hour 0 has one person, 3⁰");
ok(hour(1) === 3, "hour 1 has 3 new listeners");
ok(hour(4) === 81, "hour 4 has 81 new listeners");
ok(hour(5) === 243, "hour 5 has 243 new listeners");
ok(hour(4) < 100 && hour(5) > 100, "the hourly number first exceeds 100 in hour 5");
ok(sum([hour(0), hour(1), hour(2), hour(3), hour(4)]) === 121,
  "the running total by hour 4 is 1 + 3 + 9 + 27 + 81 = 121");
ok((3 ** 5 - 1) / 2 === 121, "(3⁵ − 1)/2 is 121");
ok(3 * 4 === 12, "3n at n = 4 is 12, the linear answer");
ok(hour(4) !== 12, "3⁴ is not 3 × 4");
ok(3 ** 5 === 243, "3⁵ is 243, the hourly number, not the total");

// ── Keys and prose claims ──────────────────────────────────────────────────
const a2 = lesson.assessment.find((item) => item.id === "a2");
const a3 = lesson.assessment.find((item) => item.id === "a3");
ok(a2?.modelAnswer === "12x⁷", "a2's model answer is 12x⁷");
ok(a2?.check.accepted.includes("12x^7"), "a2 accepts the typed 12x^7");
ok(a3?.modelAnswer === "9", "a3's model answer is 9");
ok(a3?.check.accepted.includes("9"), "a3 accepts 9");
ok(lesson.workedExamples[0].answer === "12a⁵", "w1's answer is 12a⁵");
ok(lesson.workedExamples[1].answer === "4x¹⁰", "w2's answer is 4x¹⁰");
ok(lesson.workedExamples[2].answer === "9", "w3's answer is 9");
ok(lesson.transfer[0].answer.includes("121"), "the transfer answer states the running total, 121");
ok(lesson.transfer[0].answer.includes("243"), "the transfer answer distinguishes hour 5's 243 from the total");

const allText = [
  lesson.introduction.hook,
  lesson.introduction.why,
  ...lesson.explanation.flatMap((section) => section.paragraphs),
  ...lesson.misconceptions.flatMap((item) => [item.belief, item.whyItFails, item.correction]),
].join(" ");
ok(/same base/i.test(allText), "the lesson states the same-base condition");
ok(/reciprocal/i.test(allText), "the lesson calls a negative index a reciprocal");
ok(/root/i.test(allText), "the lesson calls a fractional index a root");
ok(/coefficient/i.test(allText), "the lesson distinguishes the coefficient from the power");
ok(/substitut/i.test(allText), "the lesson gives substitution as the numerical check");
ok(/undefined/i.test(allText), "the lesson marks 0⁰ and division by zero as undefined");
ok(/0⁰/.test(allText) || /0\^0/.test(allText), "the lesson names the zero-base exception");
ok(/positive/i.test(allText), "the lesson says a negative index can still give a positive value");

if (failures.length) {
  console.error(`\n${failures.length} indices-intro check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
