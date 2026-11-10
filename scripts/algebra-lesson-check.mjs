#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ALGEBRAIC EXPRESSIONS — THE LESSON'S ARITHMETIC, CHECKED INDEPENDENTLY.
//
// The lesson contract proves the lesson has a diagnostic, worked examples,
// assessment and retrieval. It cannot prove that the values printed in those
// parts are the values the algebra produces. This gate evaluates every claim
// that can be evaluated: the simplifications, the expansion, the substitution
// checks, the unlike-term counterexamples and the rectangle transfer. It also
// checks that each deterministic key accepts its own model answer.
//
// It is NOT teacher review. A passing run says the pinned arithmetic has not
// drifted. It says nothing about whether a pupil learns from the page.
//
// Run: node scripts/algebra-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_ALGEBRA_EXPRESSIONS: lesson } = require("../.verify/lessons/authored/maths-algebra-expressions.js");
const { evaluate } = require("mathjs");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}

const close = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const at = (expression, scope = {}) => evaluate(expression, scope);
const sameAt = (left, right, scope, label) => {
  const a = at(left, scope);
  const b = at(right, scope);
  ok(close(a, b), `${label} [${JSON.stringify(scope)}: ${left} = ${a}, ${right} = ${b}]`);
};

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "algebra-expressions", "the lesson is for algebra-expressions");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.priorKnowledge.conceptIds.length === 1 && lesson.priorKnowledge.conceptIds[0] === "order-ops",
  "order-ops is the only declared prerequisite");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.priorKnowledge.check.every((check) => check.targets[0] === "order-ops"),
  "both prerequisite checks probe order-ops");
ok(lesson.explanation.length === 4, "there are four explanation sections");
ok(lesson.explanation.flatMap((section) => section.paragraphs).length === 8,
  "there are eight explanation paragraphs");
ok(lesson.representations.length === 3, "there are three representation blocks");
ok(lesson.representations.some((block) => block.kind === "maths.expression"),
  "the mathematics framework's expression block is present");
ok(lesson.representations.some((block) => block.kind === "maths.area-model"),
  "the area model of expansion is present");
ok(lesson.workedExamples.length === 2, "there are two worked examples");
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
ok(lesson.accessibility.length >= 2, "there are at least two accessibility alternatives");
ok(lesson.summary.length >= 2, "there is a usable summary");

// ── The arithmetic the learner is asked to trust ────────────────────────────
sameAt("7*x + 4 - 3*x + 9", "4*x + 13", { x: 2 }, "worked example 1 simplifies correctly");
sameAt("7*x + 4 - 3*x + 9", "4*x + 13", { x: -3 }, "worked example 1 holds for a negative value");
sameAt("3*(2*x - 5) + 4*x", "10*x - 15", { x: 2 }, "worked example 2 expands and collects correctly");
sameAt("3*(2*x - 5) + 4*x", "10*x - 15", { x: 0 }, "worked example 2 holds at zero");
sameAt("5*x + 8 - 2*x + 3", "3*x + 11", { x: 4 }, "guided practice 1 simplifies correctly");
sameAt("2*(3*x + 4)", "6*x + 8", { x: 1 }, "guided practice 2 expands correctly");
ok(close(at("4*x - 3", { x: -2 }), -11), "guided practice 3 evaluates 4x − 3 at x = −2 as −11");
sameAt("8*x + 5 - 3*x + 2", "5*x + 7", { x: 4 }, "assessment a2 simplifies correctly");
sameAt("4*(2*x - 3)", "8*x - 12", { x: 3 }, "assessment a3 expands correctly");
sameAt("4*x + 3*x - 2", "7*x - 2", { x: 2 }, "retrieval x1 simplifies correctly");
sameAt("5*(x - 2)", "5*x - 10", { x: 3 }, "retrieval x2 expands correctly");

// The unlike-term claims are inequalities, not identities. Each pair must
// differ at the value the lesson uses to expose the mistake.
ok(!close(at("3*x + 2*y", { x: 2, y: 2 }), at("5*x*y", { x: 2, y: 2 })),
  "3x + 2y and 5xy differ at x = y = 2 (10 vs 20)");
ok(!close(at("x^2", { x: 3 }), at("2*x", { x: 3 })),
  "x squared and 2x differ at x = 3 (9 vs 6)");
ok(!close(at("3*x + 2*x^2", { x: 2 }), at("5*x^2", { x: 2 })),
  "3x + 2x squared and 5x squared differ at x = 2 (14 vs 20)");

// THE TRANSFER is a rectangle of width x and length 2x + 5. The lesson claims
// P = 6x + 10 and P(8) = 58. Both the expression and the dimensions must agree.
sameAt("2*x + 2*(2*x + 5)", "6*x + 10", { x: 8 }, "the transfer perimeter simplifies to 6x + 10");
ok(close(at("6*x + 10", { x: 8 }), 58), "the transfer perimeter at x = 8 is 58");
ok(close(at("2*(8 + (2*8 + 5))", {}), 58), "the dimensions give the same perimeter at x = 8");
ok(close(at("4*(2*x - 3)", { x: 1 }), at("8*x - 12", { x: 1 })),
  "the expansion check at x = 1 gives the same value from both forms");

// ── The deterministic keys accept their own model answers ──────────────────
const normalized = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
for (const item of lesson.assessment.filter((entry) => entry.check)) {
  ok(
    item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
    `${item.id}: the model answer is one of its own accepted answers`,
  );
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log("Algebraic expressions — independent lesson checks");
console.log(`  ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  ✗ FAIL: ${failure}`);
  process.exit(1);
}
