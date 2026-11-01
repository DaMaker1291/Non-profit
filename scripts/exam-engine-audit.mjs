#!/usr/bin/env node
// THE EXAMINATION-AUTHENTICITY AUDIT.
//
// Every previous count of "how many question types" was a count of code, not of
// what a learner meets. This script builds all six AQA GCSE Mathematics papers
// and counts the questions ACTUALLY SERVED: choice, numeric and constructed
// response, then the constructed parts by response contract. It also records
// marks, tier, calculator policy, concept coverage and section demand.
//
// Run: npm run exam:audit
// Writes: audit/exam-engine.json
//
// The counts are measurements of this bank, not official board percentages. AQA
// publishes marks, time and calculator rules; it does not publish this item mix.
import { compileEngines } from "./compile-engines.mjs";
import { createRequire } from "node:module";
import fs from "node:fs";

compileEngines();
const require = createRequire(import.meta.url);
const P = require("../.verify/papers.js");
const S = require("../.verify/specifications.js");
const { structuredMarks } = require("../.verify/structured-items.js");

const spec = S.specById("uk-gcse");
if (!spec) throw new Error("uk-gcse specification is missing");
// The Foundation tier's own exclusion list is the eligibility contract. A
// Higher-only concept appearing in a Foundation paper is a content failure, not
// a difficulty wobble, so the audit refuses the paper instead of counting it.
const foundationExcluded = new Set(spec.levels.find((level) => level.id === "foundation")?.exclude ?? []);
const SEED = "exam-engine-audit-v1";
const papers = [];

for (const level of spec.levels) {
  for (const template of P.papersForSpec("uk-gcse", "maths").filter((p) => p.board === "aqa" && (p.levels ?? []).includes(level.id))) {
    const built = P.buildPaper({ active: { spec, level }, subject: "maths", seed: `${SEED}:${template.id}`, template });
    const questions = built.paper.sections.flatMap((section) => section.questions);
    const constructed = questions.filter((q) => q.structured);
    const numeric = questions.filter((q) => q.view.responseKind === "numeric");
    const choice = questions.filter((q) => !q.structured && q.view.responseKind !== "numeric");
    const parts = constructed.flatMap((q) => q.structured.parts.map((part) => part.response ?? "number"));
    const partCounts = {};
    for (const part of parts) partCounts[part] = (partCounts[part] ?? 0) + 1;
    const concepts = [...new Set(questions.map((q) => q.conceptId))].sort();
    const key = new Map(built.key.questions.map((q) => [q.id, q]));
    const marking = questions.map((q) => {
      const k = key.get(q.id);
      if (q.structured) return "constructed";
      if (q.view.responseKind === "numeric") return typeof k?.answerValue === "number" ? "numeric" : "missing_numeric_key";
      return typeof k?.answer === "number" ? "choice" : "missing_choice_key";
    });
    const totalMarks = built.paper.marks;
    if (totalMarks !== 80) throw new Error(`${template.id}: paper is ${totalMarks} marks, not 80`);
    if (questions.length !== 33) throw new Error(`${template.id}: paper is ${questions.length} questions, not 33`);
    if (marking.some((m) => m.startsWith("missing_"))) throw new Error(`${template.id}: a served question has no marking key`);
    if (level.id === "foundation") {
      const leaked = questions.filter((q) => foundationExcluded.has(q.conceptId)).map((q) => q.conceptId);
      if (leaked.length) throw new Error(`${template.id}: Foundation paper serves Higher-only concepts: ${[...new Set(leaked)].join(", ")}`);
    }
    // THE BLUEPRINT'S DEMAND IS A PROPERTY OF ITS SECTIONS. `BuiltPaper.sections`
    // carries only the served questions, so reading `s.difficulty` there returned
    // `null` for every paper — a report column that looked like a measurement and
    // measured nothing. Read the authored target and refuse a paper whose demand
    // falls instead of rising.
    const demand = template.sections.map((section) => section.difficulty);
    if (demand.some((d, i) => i > 0 && d < demand[i - 1])) {
      throw new Error(`${template.id}: section demand does not rise (${demand.join(", ")})`);
    }
    const servedDifficulty = questions.map((q) => q.difficulty);
    papers.push({
      id: template.id,
      tier: level.id,
      minutes: built.paper.minutes,
      calculator: built.paper.calculator,
      marks: totalMarks,
      questions: questions.length,
      responseFormats: {
        choice: choice.length,
        numeric: numeric.length,
        constructed: constructed.length,
        byConstructedPart: partCounts,
      },
      marksByResponseFormat: {
        choice: choice.reduce((n, q) => n + q.marks, 0),
        numeric: numeric.reduce((n, q) => n + q.marks, 0),
        constructed: constructed.reduce((n, q) => n + q.marks, 0),
      },
      constructedItems: constructed.map((q) => ({
        id: q.structured.itemId,
        marks: q.marks,
        parts: q.structured.parts.map((p) => ({ id: p.id, marks: p.marks, response: p.response ?? "number" })),
      })),
      demand,
      servedDifficulty: {
        min: Math.min(...servedDifficulty),
        max: Math.max(...servedDifficulty),
        mean: servedDifficulty.reduce((n, d) => n + d, 0) / servedDifficulty.length,
      },
      conceptsTested: concepts.length,
    });
  }
}

const totals = papers.reduce((acc, p) => {
  for (const k of ["choice", "numeric", "constructed"]) {
    acc.byFormat.questions[k] += p.responseFormats[k];
    acc.byFormat.marks[k] += p.marksByResponseFormat[k];
  }
  acc.questions += p.questions;
  acc.marks += p.marks;
  return acc;
}, {
  questions: 0,
  marks: 0,
  byFormat: {
    questions: { choice: 0, numeric: 0, constructed: 0 },
    marks: { choice: 0, numeric: 0, constructed: 0 },
  },
});

const report = {
  generatedBy: "scripts/exam-engine-audit.mjs",
  seed: SEED,
  note:
    "Measured from served questions in OpenMind's own AQA GCSE Mathematics blueprints. " +
    "The 80-mark, 90-minute and calculator rules are AQA's; the item mix and the distribution below are OpenMind's modelling, not official board percentages.",
  spec: "uk-gcse",
  subject: "maths",
  papers,
  totals,
};
fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync("audit/exam-engine.json", `${JSON.stringify(report, null, 2)}\n`);

console.log("▸ AQA GCSE Mathematics — measured from the generated papers");
for (const p of papers) {
  console.log(
    `  ${p.tier.padEnd(10)} ${p.id.padEnd(28)} ${p.questions}Q/${p.marks}m  ` +
    `${p.responseFormats.choice}c ${p.responseFormats.numeric}n ${p.responseFormats.constructed}s  ` +
    `constructed ${p.marksByResponseFormat.constructed}m`,
  );
}
console.log("");
console.log(`  ${papers.length} papers, ${totals.questions} questions, ${totals.marks} marks`);
console.log(`  choice ${totals.byFormat.questions.choice} (${totals.byFormat.marks.choice} marks) · numeric ${totals.byFormat.questions.numeric} (${totals.byFormat.marks.numeric} marks) · constructed ${totals.byFormat.questions.constructed} (${totals.byFormat.marks.constructed} marks)`);
console.log("  Report → audit/exam-engine.json");
