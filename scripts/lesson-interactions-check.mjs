#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE GAP-FILL, MATCHING, ORDERING AND DIAGRAM MARKER.
//
// This is a marking gate, not a renderer test. It drives the REAL authored
// items through the SAME pure marker /api/progress calls, and requires:
//   · full marks for the authored answer and accepted variants;
//   · partial marks with one criterion per authored point;
//   · zero for a wrong answer, not credit for containing a keyword;
//   · a refused payload for a missing/duplicate/unknown id;
//   · the structured method/answer split to keep a method mark when a unit is
//     missing.
//
// No projection, mastery or evidence claim is made here. The route/browser walk
// proves those separately.
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const { AUTHORED_BY_CONCEPT } = require("../.verify/lessons/authored/index.js");
const { gradeLessonInteraction } = require("../.verify/lesson-interactions.js");
const { gradeStructuredAssessment } = require("../.verify/lesson-assessment.js");

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}
const item = (concept, id) => {
  const lesson = AUTHORED_BY_CONCEPT[concept];
  if (!lesson) throw new Error(`missing authored lesson ${concept}`);
  const found = lesson.assessment.find((entry) => entry.id === id);
  if (!found) throw new Error(`missing ${concept}/${id}`);
  return found;
};

console.log("\n▸ Gap fill");
{
  const a3 = item("photosynthesis", "a3");
  const full = gradeLessonInteraction(a3, ["Carbon Dioxide", "H2O", "chloroplasts", "sugar", "O2"]);
  ok(full?.awarded === 5 && full.marks === 5, "accepted scientific variants and capitalisation earn 5/5");
  ok(full?.parts[0].criteria.length === 5, "one criterion per gap is returned");
  const partial = gradeLessonInteraction(a3, ["carbon dioxide", "", "chloroplast", "glucose", ""]);
  ok(partial?.awarded === 3 && partial.marks === 5, "two blank gaps keep the three correct marks (3/5)");
  const keyword = gradeLessonInteraction(a3, ["carbon dioxide is taken in from the air", "water", "chloroplast", "glucose", "oxygen"]);
  ok(keyword?.awarded === 4, "a wrong gap is not accepted for containing the expected word");
  ok(gradeLessonInteraction(a3, ["carbon dioxide", "water"]) === null, "a short answer array is refused");
  ok(gradeLessonInteraction(a3, ["carbon dioxide", "water", "chloroplast", "glucose", "oxygen", "extra"]) === null,
    "a long answer array is refused");
}

console.log("\n▸ Matching");
{
  const a4 = item("photosynthesis", "a4");
  const full = gradeLessonInteraction(a4, ["r1", "r2", "r3", "r4", "r5"]);
  ok(full?.awarded === 5 && full.marks === 5, "all five pairs earn 5/5");
  const partial = gradeLessonInteraction(a4, ["r2", "r1", "r3", "r4", "r5"]);
  ok(partial?.awarded === 3, "three correct pairs earn 3/5 despite two wrong pairs");
  ok(partial?.parts[0].criteria.filter((c) => c.met).length === 3,
    "the criteria name exactly the three pairs that were earned");
  ok(gradeLessonInteraction(a4, ["r1", "r1", "r3", "r4", "r5"])?.awarded === 4,
    "a duplicated match is marked as the wrong pairing it is, not refused as bad input");
  ok(gradeLessonInteraction(a4, ["r1", "r2", "r3", "r4", "r9"]) === null,
    "an unknown right-hand id is refused");
}

console.log("\n▸ Ordering");
{
  const a3 = item("what-is-code", "a3");
  const full = gradeLessonInteraction(a3, ["s1", "s3", "s4", "s2"]);
  ok(full?.awarded === 4 && full.marks === 4, "the authored sequence earns 4/4");
  const partial = gradeLessonInteraction(a3, ["s1", "s4", "s3", "s2"]);
  ok(partial?.awarded === 2, "two items in the right position earn 2/4");
  ok(partial?.parts[0].criteria.map((c) => c.met).join(",") === "true,false,false,true",
    "marks are attached to positions, not inferred from neighbouring order");
  ok(gradeLessonInteraction(a3, ["s1", "s3", "s4", "s4"]) === null,
    "a duplicate id is refused");
  ok(gradeLessonInteraction(a3, ["s1", "s3", "s4"]) === null,
    "a missing item is refused");
}

console.log("\n▸ Diagram labelling");
{
  const a3 = item("fractions", "a3");
  const full = gradeLessonInteraction(a3, ["t1", "t2", "t3", "t4"]);
  ok(full?.awarded === 4 && full.marks === 4, "all four labels earn 4/4");
  const partial = gradeLessonInteraction(a3, ["t1", "t1", "t3", ""]);
  ok(partial?.awarded === 2, "two correct labels and one blank earn 2/4");
  ok(partial?.parts[0].criteria[0].why.includes("position"),
    "the feedback names positions rather than exposing internal ids");
  ok(gradeLessonInteraction(a3, ["t1", "t2", "t9", "t4"]) === null,
    "an unknown target is refused");
  ok(gradeLessonInteraction(a3, ["t1", "t2"]) === null,
    "a missing label response is refused");
}

console.log("\n▸ Structured method and answer marks");
{
  const a3 = item("electricity-circuits", "a3");
  const full = gradeStructuredAssessment(
    a3,
    ["3 A", "2 V", "60 C"],
    ["12 ÷ 4", "0.50 × 4", "3 × 20"],
  );
  ok(full?.awarded === 6 && full.marks === 6, "three method + answer parts earn 6/6");
  const withoutUnits = gradeStructuredAssessment(
    a3,
    ["3", "2", "60"],
    ["12 ÷ 4", "0.50 × 4", "3 × 20"],
  );
  ok(withoutUnits?.awarded === 3, "missing units keep the three method marks and lose the answer marks (3/6)");
  const methodOnly = gradeStructuredAssessment(
    a3,
    ["4", "1", "20"],
    ["12 ÷ 4", "0.50 × 4", "3 × 20"],
  );
  ok(methodOnly?.awarded === 3, "right method with wrong values keeps the method marks (3/6)");
  ok(methodOnly?.parts.every((part) => part.criteria.length === 2),
    "every part reports its method and answer criteria separately");
}

console.log(`\nlesson interactions: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error("lesson interactions: a response format or partial-credit rule did not hold");
  process.exit(1);
}
console.log("✓ gap fill, matching, ordering and diagram labelling reach the same auditable mark scheme.");
