#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE LESSON-QUALITY DASHBOARD — comparisons, without inventing a score.
//
// At 46 authored lessons the useful question is no longer "does a lesson
// exist?" but "which lessons teach, which only satisfy the contract, and what
// evidence is still missing?". This report answers that with COUNTS from the
// lessons themselves:
//
//   conceptual explanation   teaching words, paragraphs
//   worked examples          examples, steps, steps that say WHY
//   misconception coverage   beliefs, each with a correction and a contrast
//   independent assessment   gradable items, constructed responses
//   transfer                 unfamiliar tasks with marking criteria
//   accessibility            needs with an authored alternative
//   retention                spaced retrieval prompts
//   educator approval        review records — 0 is reported as 0
//   learner evidence         learner-testing records — 0 is reported as 0
//
// The first seven are structural and machine-readable. They are NOT a quality
// score: a lesson can have twelve worked examples and still teach a false
// claim. The last two are the only columns that require another human being,
// and a dashboard that quietly turned their absence into a percentage would be
// the exact dishonesty this project keeps guarding against.
//
// Run: node scripts/lesson-quality-dashboard.mjs
// Writes: reports/lesson-quality/dashboard.json and dashboard.md
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const authored = require("../.verify/lessons/authored/index.js");
const plans = require("../.verify/lesson-plans.js");

const countWords = (text) => String(text ?? "").trim().split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

const lessons = authored.AUTHORED_LESSONS.map((lesson) => {
  const plan = plans.planFor(lesson.conceptId) ?? null;
  const paragraphs = lesson.explanation.flatMap((section) => section.paragraphs);
  const teachingText = [
    lesson.introduction.hook,
    lesson.introduction.why,
    ...paragraphs,
    ...lesson.workedExamples.flatMap((example) => [
      example.prompt,
      ...example.steps.flatMap((step) => [step.move, step.why]),
      example.answer,
    ]),
    ...lesson.misconceptions.flatMap((item) => [item.belief, item.whyItFails, item.correction]),
  ];
  const steps = lesson.workedExamples.flatMap((example) => example.steps);
  const unscored = lesson.assessment.filter((item) => item.scored === false).length;
  const gradable = lesson.assessment.filter(
    (item) => item.scored !== false && (item.check || item.kind === "code"),
  ).length;
  // Constructed responses include the explicitly unscored reflection: a1 is
  // still a constructed response, but it is not a graded item and is reported
  // separately rather than being allowed to look like mastery evidence.
  const constructed = lesson.assessment.length - gradable;
  const figures = lesson.representations.filter((block) => block.figure).length;
  const accessNeeds = [...new Set(lesson.accessibility.map((item) => item.need))];

  return {
    conceptId: lesson.conceptId,
    subject: lesson.subject,
    status: lesson.declaredStatus,
    planProvenance: plan?.provenance ?? "none",
    teachingWords: teachingText.reduce((sum, text) => sum + countWords(text), 0),
    paragraphs: paragraphs.length,
    representations: lesson.representations.length,
    figures,
    workedExamples: lesson.workedExamples.length,
    workedSteps: steps.length,
    stepsWithWhy: steps.filter((step) => countWords(step.why) >= 8).length,
    misconceptions: lesson.misconceptions.length,
    misconceptionsWithContrast: lesson.misconceptions.filter(
      (item) => item.correction && item.contrast?.wrong && item.contrast?.right,
    ).length,
    assessment: lesson.assessment.length,
    gradable,
    constructed,
    unscored,
    transfer: lesson.transfer.length,
    retrieval: lesson.retrieval.length,
    accessNeeds: accessNeeds.length,
    accessNeedsNamed: accessNeeds.join(", "),
    educatorReviewed: lesson.reviews.length,
    learnerTested: lesson.learnerTesting.length,
  };
});

const total = (key) => lessons.reduce((sum, row) => sum + row[key], 0);
const aggregate = {
  authored: lessons.length,
  teachingWords: total("teachingWords"),
  paragraphs: total("paragraphs"),
  representations: total("representations"),
  figures: total("figures"),
  workedExamples: total("workedExamples"),
  workedSteps: total("workedSteps"),
  stepsWithWhy: total("stepsWithWhy"),
  misconceptions: total("misconceptions"),
  gradable: total("gradable"),
  constructed: total("constructed"),
  unscored: total("unscored"),
  transfer: total("transfer"),
  retrieval: total("retrieval"),
  accessNeeds: total("accessNeeds"),
  educatorReviewed: total("educatorReviewed"),
  learnerTested: total("learnerTested"),
};

const report = {
  generatedAt: new Date().toISOString(),
  scope:
    "Structural comparison of every authored openmind.lesson/1.0 lesson. Counts are read from the lessons; no quality score is invented and no learning outcome is claimed.",
  aggregate,
  lessons,
};

const outDir = path.join("reports", "lesson-quality");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "dashboard.json"), `${JSON.stringify(report, null, 2)}\n`);

const md = [];
md.push("# OpenMind lesson-quality dashboard");
md.push("");
md.push(`Generated ${report.generatedAt}. ${report.scope}`);
md.push("");
md.push("## Totals");
md.push("");
md.push(`- Authored lessons: **${aggregate.authored}**`);
md.push(`- Teaching words: **${aggregate.teachingWords}**`);
md.push(`- Worked steps that state why: **${aggregate.stepsWithWhy} / ${aggregate.workedSteps}**`);
md.push(`- Misconceptions with a correction and contrast: **${lessons.reduce((n, r) => n + r.misconceptionsWithContrast, 0)} / ${aggregate.misconceptions}**`);
md.push(`- Drawn lesson figures: **${aggregate.figures}** across ${aggregate.representations} representation blocks`);
md.push(`- Gradable assessment items: **${aggregate.gradable}**; constructed responses: **${aggregate.constructed}**; explicitly unscored reflections: **${aggregate.unscored}**`);
md.push(`- Transfer tasks: **${aggregate.transfer}**; spaced retrieval prompts: **${aggregate.retrieval}**`);
md.push(`- Accessibility needs with an authored alternative: **${aggregate.accessNeeds}**`);
md.push(`- Subject-teacher reviewed: **${aggregate.educatorReviewed}**`);
md.push(`- Learner-tested: **${aggregate.learnerTested}**`);
md.push("");
md.push("## Every authored lesson");
md.push("");
md.push("| Concept | Subject | Status | Words | Paras | Reps | Figs | Worked | Why steps | Miscon. | Gradable | Constructed | Reflect | Transfer | Retrieval | Access | Teacher | Learner |");
md.push("| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const row of [...lessons].sort((a, b) => a.conceptId.localeCompare(b.conceptId))) {
  md.push(
    `| ${row.conceptId} | ${row.subject} | ${row.status} | ${row.teachingWords} | ${row.paragraphs} | ${row.representations} | ${row.figures} | ${row.workedExamples} | ${row.stepsWithWhy}/${row.workedSteps} | ${row.misconceptions} | ${row.gradable} | ${row.constructed} | ${row.unscored} | ${row.transfer} | ${row.retrieval} | ${row.accessNeeds} | ${row.educatorReviewed} | ${row.learnerTested} |`,
  );
}
md.push("");
md.push("## How to read this");
md.push("");
md.push("- **Words, paragraphs, representations and figures** measure the presence of teaching, not its correctness. A long explanation can be wrong.");
md.push("- **Why steps** counts worked-example moves whose reason is at least eight words. A step that says only `substitute` is arithmetic wearing a reason's label.");
md.push("- **Misconceptions** are counted; the lesson gate separately checks that each has a correction and a contrast pair.");
md.push("- **Reflect** counts explicitly unscored constructed responses. They are not gradable items and are excluded from mastery; the Constructed column still counts them because that is their form.");
md.push("- **Teacher** and **Learner** are the only columns that require evidence this repository cannot generate. They are counts of real records, and today they are zero.");
md.push("- No column is a mark, a grade or a prediction. The dashboard exists to make the gap between `machine_checked` and `educator_reviewed` visible, not to close it with a number.");
md.push("");
md.push("This report is not read by a gate. Re-run it after a lesson change; a stale dashboard is a stale claim.");
fs.writeFileSync(path.join(outDir, "dashboard.md"), `${md.join("\n")}\n`);

console.log("Lesson-quality dashboard");
console.log(`  authored: ${aggregate.authored}`);
console.log(`  drawn lesson figures: ${aggregate.figures}`);
console.log(`  why-steps: ${aggregate.stepsWithWhy}/${aggregate.workedSteps}`);
console.log(`  unscored reflections: ${aggregate.unscored}`);
console.log(`  educator-reviewed: ${aggregate.educatorReviewed} · learner-tested: ${aggregate.learnerTested}`);
console.log("  wrote reports/lesson-quality/dashboard.json and dashboard.md");
