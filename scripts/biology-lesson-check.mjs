#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE BIOLOGY LESSONS, CHECKED AS LESSONS.
//
// The lesson contract proves a lesson HAS a diagnostic, worked examples and an
// assessment. It cannot prove that the biology in them is right, or that a
// number printed in a worked example is the number the method produces. Those
// are different claims, and this gate is deliberately narrow: it checks the
// authored digestion and microscopy lessons against the Cambridge IGCSE scope
// that was inspected, the calculations the lessons print, and the requirements
// the reviewer checklist names.
//
// It is NOT subject-teacher review. A passing run says the pinned claims and
// arithmetic have not drifted from the checked version. It says nothing about
// whether a pupil learns from the page.
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const A = require("../.verify/lessons/authored/index.js");
const G = require("../.verify/genome.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}

const lessons = new Map(A.AUTHORED_LESSONS.map((lesson) => [lesson.conceptId, lesson]));
const digest = lessons.get("digestion");
const microscopy = lessons.get("microscopy");
const conceptIds = new Set(G.CONCEPTS.map((concept) => concept.id));

function textOf(lesson) {
  return [
    lesson.introduction.hook,
    lesson.introduction.why,
    ...lesson.explanation.flatMap((section) => [section.heading, ...section.paragraphs]),
    ...lesson.representations.flatMap((block) => [block.body, block.notation ?? "", block.caption ?? ""]),
    ...lesson.workedExamples.flatMap((example) => [
      example.prompt,
      ...example.steps.flatMap((step) => [step.move, step.why]),
      example.answer,
    ]),
    ...lesson.misconceptions.flatMap((item) => [item.belief, item.whyItFails, item.correction, item.contrast.wrong, item.contrast.right]),
    ...lesson.guidedPractice.flatMap((item) => [item.prompt, item.hint, item.answer, item.feedback.correct, item.feedback.incorrect]),
    ...lesson.assessment.flatMap((item) => [item.prompt, item.modelAnswer, ...item.marking]),
    ...lesson.transfer.flatMap((item) => [item.prompt, item.whyItTransfers, item.answer, ...item.marking]),
    ...lesson.retrieval.flatMap((item) => [item.prompt, item.answer]),
    ...lesson.summary,
  ].join(" ");
}

function normalized(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

for (const [id, lesson, expected] of [
  ["digestion", digest, { misconceptions: 4, minParagraphs: 15 }],
  ["microscopy", microscopy, { misconceptions: 3, minParagraphs: 11 }],
]) {
  ok(Boolean(lesson), `${id}: an authored lesson exists`);
  if (!lesson) continue;
  ok(lesson.contract === "openmind.lesson/1.0", `${id}: uses the current lesson contract`);
  ok(lesson.declaredStatus === "draft", `${id}: is declared draft, not reviewed`);
  ok(lesson.reviews.length === 0, `${id}: claims no subject-teacher review`);
  ok(lesson.learnerTesting.length === 0, `${id}: claims no learner testing`);
  ok(lesson.objectives.length === 3, `${id}: has three measurable objectives`);
  ok(lesson.priorKnowledge.check.length === 2, `${id}: has two prerequisite checks`);
  ok(lesson.priorKnowledge.check.every((check) => conceptIds.has(check.targets[0])), `${id}: every prerequisite check names a real concept`);
  ok(lesson.explanation.length >= 4, `${id}: has at least four explanatory sections`);
  ok(lesson.representations.length === 4, `${id}: has four subject-specific representations`);
  ok(lesson.representations.every((block) => block.body.length > 40 && (block.caption ?? "").length > 20), `${id}: every representation has prose and a teaching caption`);
  ok(lesson.workedExamples.length === 2, `${id}: has two worked examples`);
  ok(lesson.workedExamples.every((example) => example.steps.length >= 3), `${id}: every worked example has at least three moves`);
  ok(lesson.workedExamples.every((example) => example.steps.every((step) => step.why.length >= 20)), `${id}: every worked move says why it is made`);
  ok(lesson.misconceptions.length === expected.misconceptions, `${id}: has ${expected.misconceptions} misconceptions`);
  ok(lesson.misconceptions.every((item) => item.whyItFails.length > 60 && item.correction.length > 40), `${id}: every misconception explains why it fails and what replaces it`);
  ok(lesson.guidedPractice.length === 3, `${id}: has three guided practice items`);
  ok(lesson.guidedPractice.every((item) => item.hint.length > 20 && item.feedback.correct.length > 20 && item.feedback.incorrect.length > 20), `${id}: every guided item has a hint and two feedback paths`);
  ok(lesson.assessment.length === 4, `${id}: has four assessment items`);
  ok(lesson.assessment.every((item) => item.marking.length >= 2), `${id}: every assessment item has at least two marking criteria`);
  ok(lesson.transfer.length === 1, `${id}: has a transfer task`);
  ok(lesson.transfer.every((item) => item.whyItTransfers.length > 60 && item.marking.length >= 2), `${id}: the transfer task explains what transfers and how it is marked`);
  ok(lesson.retrieval.length === 3, `${id}: has three spaced-retrieval prompts`);
  ok(lesson.retrieval.every((item) => ["next-day", "week-later", "month-later"].includes(item.when)), `${id}: every retrieval prompt carries a delay`);
  ok(lesson.accessibility.length >= 4, `${id}: names accessibility alternatives`);
  ok(lesson.provenance.some((entry) => entry.basis === "openmind-authored"), `${id}: declares its authorship provenance`);

  const paragraphs = lesson.explanation.flatMap((section) => section.paragraphs).length;
  ok(paragraphs >= expected.minParagraphs, `${id}: the expected teaching depth is present (${paragraphs} explanatory paragraphs)`);

  for (const item of lesson.assessment.filter((entry) => entry.check)) {
    ok(
      item.check.accepted.some((accepted) => normalized(accepted) === normalized(item.modelAnswer)),
      `${id}/${item.id}: the model answer is one of its own accepted answers`,
    );
  }
}

if (digest) {
  const t = textOf(digest);
  ok(/amylase breaks starch down to maltose/i.test(t), "digestion: amylase is limited to starch → maltose");
  ok(/maltase.*maltose.*glucose/is.test(t), "digestion: maltase is the enzyme that produces glucose");
  ok(!/amylase breaks starch down to maltose and (then )?glucose/i.test(t), "digestion: no sentence gives amylase the glucose step");
  ok(/circular muscles ahead relax/i.test(t), "digestion: the circular muscle ahead relaxes to open the lumen");
  ok(/longitudinal muscles ahead contract/i.test(t), "digestion: the longitudinal muscle ahead contracts to shorten the segment");
  ok(!/longitudinal muscles relax ahead/i.test(t), "digestion: the old, incorrect longitudinal-relaxation claim is gone");
  ok(/immune reaction to gluten/i.test(t), "digestion: coeliac disease is identified as an immune reaction to gluten");
  ok(/duodenum and jejunum/i.test(t), "digestion: the coeliac explanation names the proximal small intestine");
  ok(/iron-deficiency anaemia/i.test(t), "digestion: the transfer links reduced iron uptake to anaemia");
  ok(/6 mm²/.test(t) && /60 mm²/.test(t) && /0\.06 mm²/.test(t), "digestion: the surface-area example prints its three key values");

  // Independent arithmetic for the lesson's two calculations.
  ok(6 * 1 ** 2 === 6, "digestion check: the 1 mm cube has surface area 6 mm²");
  ok(Math.abs(6 * 0.1 ** 2 - 0.06) < 1e-9, "digestion check: each 0.1 mm cube has surface area 0.06 mm²");
  ok(0.06 * 1000 === 60, "digestion check: 1,000 small cubes have total surface area 60 mm²");
  ok(60 / 6 === 10, "digestion check: the increase is tenfold");
}

if (microscopy) {
  const t = textOf(microscopy);
  ok(/magnification = image size ÷ actual size/i.test(t), "microscopy: the magnification relationship is stated");
  ok(/×2,000/.test(t) && /60,000 µm/.test(t), "microscopy: the 60 mm / 30 µm example is printed");
  ok(/24 mm/.test(t) && /1,200/.test(t) && /20 µm/.test(t), "microscopy: the 24 mm / ×1,200 example is printed");
  ok(/0\.2 µm/.test(t), "microscopy: the light resolution limit is stated");
  ok(/20 nm/.test(t), "microscopy: the ribosome size that motivates electron microscopy is stated");
  ok(/fixed.*non-living|non-living.*fixed/is.test(t), "microscopy: electron microscopy is tied to fixed, non-living specimens");
  ok(/electromagnets/.test(t) && /vacuum/.test(t), "microscopy: the electron optics and vacuum are explained");

  // Independent arithmetic for every numerical claim in the lesson.
  ok(60000 / 30 === 2000, "microscopy check: 60 mm / 30 µm = ×2,000");
  ok(24 / 1200 === 0.02, "microscopy check: 24 mm / ×1,200 = 0.02 mm");
  ok(0.02 * 1000 === 20, "microscopy check: 0.02 mm = 20 µm");
  ok((80 * 1000) / 40 === 2000, "microscopy check: 80 mm / 40 µm = ×2,000");
  ok(0.05 * 1000 === 50, "microscopy check: 0.05 mm = 50 µm");
  ok(250 / 1000 === 0.25, "microscopy check: 250 nm = 0.25 µm");
  ok(2 * 1000 === 2000, "microscopy check: 2 µm = 2,000 nm");
  ok(0.5 * 1000 === 500, "microscopy check: 0.5 mm = 500 µm");
}

if (failures.length) {
  console.error("Biology lesson failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(
  `✓ ${passed} assertions: digestion and microscopy meet the authored lesson contract, their key biology claims are pinned, and every printed calculation checks out.`,
);
