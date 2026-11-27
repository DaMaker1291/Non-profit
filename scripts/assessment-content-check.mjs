#!/usr/bin/env node
// ── ASSESSMENT CONTENT, NOT ASSESSMENT PLUMBING ─────────────────────────────
//
// The marker can award partial credit correctly while the model answer teaches
// the wrong quantity. This check exists because that happened: a mixed-number
// division item said five eighths of a batch was five eighths of a kilogram.
// Every schema check, marking test and build passed.
//
// This gate is deliberately small. It checks the authored content a learner
// actually reads, and it keeps the fraction/kgs error as a permanent regression:
//
//   1. every structured item's component marks add up, and every part has an
//      explanation a learner can read;
//   2. a question that asks for what is left over must have a part that asks for
//      it, not merely a sentence in the model answer;
//   3. the corrected baker item awards 5/5 for two valid methods, 4/5 for the
//      five-eighths-of-a-kilogram error, and never accepts that error;
//   4. the item's own prose and the AQA mark scheme agree on five marks and on
//      5/12 kg.
//
// It does NOT pretend to prove every explanation in a 200,000-word curriculum is
// mathematically correct. Human subject review remains the authority.
//
// Run: node scripts/assessment-content-check.mjs
// Wired into: npm run verify
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const A = require("../.verify/lessons/authored/index.js");
const L = require("../.verify/lesson-assessment.js");
const S = require("../.verify/lessons/authored/fraction-ops.js");

let passed = 0;
const failures = [];
const ok = (condition, message) => {
  if (condition) passed += 1;
  else failures.push(message);
};
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const normalise = (v) => String(v ?? "").toLowerCase().replace(/\s+/g, " ").trim();

let structuredItems = 0;
for (const lesson of A.AUTHORED_LESSONS) {
  for (const item of lesson.assessment ?? []) {
    ok(nonEmpty(item.id), `${lesson.conceptId}: an assessment has no id`);
    ok(nonEmpty(item.prompt), `${lesson.conceptId}/${item.id}: no prompt`);
    ok(nonEmpty(item.modelAnswer), `${lesson.conceptId}/${item.id}: no model answer`);
    ok(Array.isArray(item.marking) && item.marking.length > 0, `${lesson.conceptId}/${item.id}: no marking criteria`);
    if (!item.structured) continue;
    structuredItems += 1;
    const total = item.structured.parts.reduce((n, p) => n + p.marks, 0);
    ok(total > 0, `${lesson.conceptId}/${item.id}: structured item has no marks`);
    for (const part of item.structured.parts) {
      ok(nonEmpty(part.id) && nonEmpty(part.prompt), `${lesson.conceptId}/${item.id}: a part has no id or prompt`);
      ok(Number.isInteger(part.marks) && part.marks > 0, `${lesson.conceptId}/${item.id}#${part.id}: marks are not a positive integer`);
      ok(nonEmpty(part.explanation) && part.explanation.trim().length >= 40,
        `${lesson.conceptId}/${item.id}#${part.id}: the explanation is absent or too short to teach`);
      ok(part.answer !== undefined || part.response !== undefined,
        `${lesson.conceptId}/${item.id}#${part.id}: the part has no answer or response kind`);
    }
    // A CONTEXTUAL REMAINDER MUST BE ASKED FOR. A prose sentence in the model
    // answer is not an assessment of the interpretation. If the prompt asks what
    // is left, some part must ask for that value in the response, not only in its
    // explanation.
    if (/\bleft over\b|\bremaining\b/i.test(item.prompt)) {
      const asks = item.structured.parts.some((p) =>
        /\bleft over\b|\bremaining\b/i.test(p.prompt));
      ok(asks, `${lesson.conceptId}/${item.id}: asks about a remainder but no part requires it`);
    }
    // A UNIT IN A PART'S EXPLANATION must be the unit the part declares. This
    // catches the specific class of error where a quotient of batches is
    // silently reported as kilograms.
    for (const part of item.structured.parts) {
      if (!part.unit) continue;
      ok(normalise(part.explanation).includes(normalise(part.unit)),
        `${lesson.conceptId}/${item.id}#${part.id}: explanation never states its unit ${part.unit}`);
    }
  }
}
ok(structuredItems >= 1, "no structured assessment item was found");

// ── PERMANENT REGRESSION: THE BAKER ITEM ─────────────────────────────────
const baker = S.MATHS_FRACTION_OPS?.assessment?.find((item) => item.id === "a4");
ok(Boolean(baker), "fraction-ops a4 is missing");
if (baker) {
  const text = [
    baker.prompt,
    baker.modelAnswer,
    ...(baker.marking ?? []),
    ...baker.structured.parts.flatMap((p) => [p.prompt, p.explanation, ...(p.accepted ?? [])]),
  ].join("\n");
  ok(!/5\s*\/\s*8\s*kg/i.test(text), "fraction-ops a4 still says 5/8 kg; the remainder is 5/12 kg");
  ok(/5\s*\/\s*12\s*kg/i.test(baker.modelAnswer), "fraction-ops a4 model answer does not give the 5/12 kg remainder");
  ok(/how much flour is left over/i.test(baker.prompt), "fraction-ops a4 does not ask for the flour left over");
  ok(baker.structured.parts.length === 4, "fraction-ops a4 must assess conversion, division, whole batches and remainder");
  ok(baker.structured.parts.reduce((n, p) => n + p.marks, 0) === 5, "fraction-ops a4 must total 5 marks");

  const grade = (answers, working) => L.gradeStructuredAssessment(baker, answers, working);
  const reciprocal = grade(
    ["15/4", "5 5/8", "5", "5/12"],
    ["", "15/4 × 3/2", "", ""],
  );
  const commonDenominator = grade(
    ["15/4", "45/8", "5", "5/12 kg"],
    ["", "45/12 ÷ 8/12", "", ""],
  );
  const wrongRemainder = grade(
    ["15/4", "5 5/8", "5", "5/8"],
    ["", "15/4 × 3/2", "", ""],
  );
  const noWorking = grade(
    ["15/4", "5 5/8", "5", "5/12"],
    ["", "", "", ""],
  );
  ok(reciprocal?.awarded === 5 && reciprocal?.marks === 5,
    "fraction-ops a4 does not award 5/5 for the reciprocal method");
  ok(commonDenominator?.awarded === 5,
    "fraction-ops a4 does not award 5/5 for an equivalent common-denominator method");
  ok(wrongRemainder?.awarded === 4,
    "fraction-ops a4 does not withhold exactly the remainder mark for 5/8 kg");
  ok(wrongRemainder?.parts.find((p) => p.partId === "d")?.awarded === 0,
    "fraction-ops a4 awards the remainder mark to 5/8 kg");
  ok(noWorking?.awarded === 4,
    "fraction-ops a4 infers the method mark from correct answers without working");

  // Independent arithmetic, not a repeat of the lesson's string. The remainder
  // is what five whole batches do not use; it is not the fractional part of the
  // quotient, which is a fraction of a BATCH.
  const start = 15 / 4;
  const perBatch = 2 / 3;
  const full = Math.floor(start / perBatch);
  const remainder = start - full * perBatch;
  ok(full === 5, "the baker arithmetic no longer gives five whole batches");
  ok(Math.abs(remainder - 5 / 12) < 1e-12,
    `the baker arithmetic gives ${remainder} kg remaining, not 5/12 kg`);
  ok(Math.abs((start / perBatch - full) * perBatch - remainder) < 1e-12,
    "the fractional part of the quotient, multiplied by one batch, must equal the remainder");
}

// ── THE SPECIFICATION MUST NOT RESTATE THE OLD ERROR ────────────────────
const spec = JSON.parse(
  await import("node:fs").then((fs) => fs.readFileSync("audit/exam-specs/uk-gcse-maths-aqa-8300.json", "utf8")),
);
const fractions = spec.objectives.find((o) => o.id === "N2-fractions");
ok(Boolean(fractions), "N2-fractions is missing from the AQA audit");
if (fractions) {
  ok(fractions.assessment?.marks === 9, "N2-fractions records 9 marks across its four assessment items");
  ok(fractions.assessment?.examStyleItems === 4,
    "N2-fractions must count the four items that carry its assessment coverage");
  ok(!/5\s*\/\s*8\s*kg/i.test(fractions.assessment?.markScheme ?? ""),
    "N2-fractions mark scheme still says 5/8 kg");
  ok(/5\s*\/\s*12\s*kg/i.test(fractions.assessment?.markScheme ?? ""),
    "N2-fractions mark scheme does not state the 5/12 kg remainder");
  ok(fractions.assessment?.requirements?.every((r) => r.covered),
    "N2-fractions must cover every published operation requirement now that a1, a3, a5 and a4 exist");
  const coveredMarks = fractions.assessment.requirements.reduce((n, r) => n + (r.marks ?? 0), 0);
  ok(coveredMarks === 9, `N2-fractions requirement marks add to ${coveredMarks}, not the 9 total`);
  for (const [id, item] of [
    ["N2-add", "lib/lessons/authored/fraction-ops.ts#a1"],
    ["N2-subtract", "lib/lessons/authored/fraction-ops.ts#a3"],
    ["N2-multiply", "lib/lessons/authored/fraction-ops.ts#a5"],
    ["N2-divide", "lib/lessons/authored/fraction-ops.ts#a4"],
    ["N2-context", "lib/lessons/authored/fraction-ops.ts#a4"],
  ]) {
    ok(fractions.assessment.requirements.find((r) => r.id === id)?.items?.includes(item),
      `N2-fractions ${id} is not mapped to ${item}`);
  }
  const multiply = S.MATHS_FRACTION_OPS?.assessment?.find((item) => item.id === "a5");
  ok(Boolean(multiply), "fraction-ops a5 is missing");
  if (multiply) {
    const total = multiply.structured?.parts?.reduce((n, p) => n + p.marks, 0);
    ok(total === 2, "fraction-ops a5 must total 2 marks");
    const grade = L.gradeStructuredAssessment(multiply, ["7/3", "1 3/4"], ["", ""]);
    ok(grade?.awarded === 2 && grade?.marks === 2,
      "fraction-ops a5 does not award 2/2 for 7/3 and 1 3/4");
    const wrong = L.gradeStructuredAssessment(multiply, ["7/3", "7/12"], ["", ""]);
    ok(wrong?.awarded === 1,
      "fraction-ops a5 must withhold the multiplication mark when the product is 7/12");
  }
}

console.log("");
console.log("▸ ASSESSMENT CONTENT — mathematical and contextual consistency");
console.log(`  ${A.AUTHORED_LESSONS.length} authored lessons; ${structuredItems} structured items`);
if (failures.length > 0) {
  console.error(`  ✗ ${failures.length} content failure(s):`);
  for (const failure of failures) console.error(`    · ${failure}`);
  console.error(`  ${passed} checks passed`);
  process.exit(1);
}
console.log(`  ✓ ${passed} content checks passed`);
console.log("  ✓ baker remainder 5/12 kg; reciprocal and common-denominator methods both 5/5");
