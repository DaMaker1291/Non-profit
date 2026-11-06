// THE LESSON REVIEW WORKFLOW.
//
// A reviewer needs one screen: the whole lesson, its provenance, its assessment
// and marking, what the automatic checks did and did not establish, and every
// outstanding defect. This prints exactly that.
//
// WHAT IT REFUSES TO DO. It cannot record an approval. There is no --approve
// that writes one, because an approval is a named subject teacher reading a
// specific version on a specific date, and a script that could fill it in would
// make `educator_reviewed` mean "someone ran a command". When a review is real,
// it is written into the lesson's `reviews` array by the person who did it
// (`reviewer`, `role`, `date`, `scope`, `verdict`, `lessonVersion`), and the
// gate then accepts the rung. The same is true of learner testing.
//
// Usage:
//   node scripts/lesson-review.mjs                 list the authored set
//   node scripts/lesson-review.mjs fractions       print one lesson for review
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { AUTHORED_LESSONS, AUTHORED_BY_CONCEPT } = require("../.verify/lessons/authored/index.js");
const lessonVerify = require("../.verify/lesson-verify.js");
const { CONCEPTS_BY_ID } = require("../.verify/genome.js");

const id = process.argv[2];

if (!id) {
  console.log(`\nAuthored lessons (${AUTHORED_LESSONS.length}) — pass one id to review it:\n`);
  for (const lesson of AUTHORED_LESSONS) {
    const problems = lessonVerify.auditLessonForStatus(lesson);
    const earned = lessonVerify.earnedRung(lesson, problems.length === 0);
    console.log(
      `  ${lesson.conceptId.padEnd(24)} ${lesson.subject.padEnd(10)} v${lesson.version}  declared ${lesson.declaredStatus}  earned ${earned}  problems ${problems.length}`,
    );
  }
  console.log("\nAn approval is written into the lesson's own reviews array by the reviewer. This tool never writes one.\n");
  process.exit(0);
}

const lesson = AUTHORED_BY_CONCEPT[id];
if (!lesson) {
  console.error(`No authored lesson for "${id}". Known: ${AUTHORED_LESSONS.map((l) => l.conceptId).join(", ")}`);
  process.exit(2);
}

const concept = CONCEPTS_BY_ID[lesson.conceptId];
const problems = lessonVerify.auditLessonForStatus(lesson);
const earned = lessonVerify.earnedRung(lesson, problems.length === 0);

const line = (label, value) => console.log(`  ${label.padEnd(18)} ${value}`);

console.log(`\n${concept.title} (${lesson.conceptId}) — ${lesson.subject}`);
console.log(`contract ${lesson.contract} · version ${lesson.version}`);
line("curriculum", `${lesson.curriculum.reference} — ${lesson.curriculum.level}`);
line("declared status", lesson.declaredStatus);
line("earned status", earned);
line("objectives", String(lesson.objectives.length));
line("prior knowledge", lesson.priorKnowledge.conceptIds.join(", ") || "(none declared)");
line("teaching words", String(lesson.explanation.flatMap((e) => e.paragraphs).reduce((n, p) => n + p.split(/\s+/).length, 0)));
line("worked examples", String(lesson.workedExamples.length));
line("misconceptions", String(lesson.misconceptions.length));
line("guided practice", String(lesson.guidedPractice.length));
line("assessments", `${lesson.assessment.length} (${lesson.assessment.map((a) => a.kind).join(", ")})`);
line("transfer", String(lesson.transfer.length));
line("retrieval", `${lesson.retrieval.length} (${lesson.retrieval.map((r) => r.when).join(", ")})`);
line("accessibility", String(lesson.accessibility.length));

console.log("\n  Provenance");
for (const entry of lesson.provenance) {
  console.log(`    ${entry.basis.padEnd(20)} ${entry.sourceId} · licence ${entry.licence} · reproduction ${entry.reproduction}`);
  console.log(`      ${entry.attribution}`);
}

console.log("\n  Authorship");
for (const author of lesson.authors) {
  console.log(`    ${author.author} (${author.role}) · ${author.authoredAt} · ${author.method}`);
}

console.log("\n  Subject framework");
const framework = require("../.verify/lesson-frameworks.js").frameworkFor(lesson.subject);
console.log(`    ${framework.name}: ${framework.pedagogy}`);
for (const rule of framework.rules) console.log(`    · ${rule.id}: ${rule.describe}`);

console.log("\n  Review records");
if (lesson.reviews.length === 0) console.log("    none — no subject teacher has reviewed this version");
for (const review of lesson.reviews) {
  console.log(`    ${review.date} ${review.reviewer} (${review.role}) ${review.verdict} — ${review.scope}, for v${review.lessonVersion}`);
}

console.log("\n  Learner testing");
if (lesson.learnerTesting.length === 0) console.log("    none — not tested with learners");
for (const test of lesson.learnerTesting) {
  console.log(`    ${test.date} ${test.setting} · ${test.participants} participants`);
  console.log(`      measures: ${test.measures.join("; ")}`);
  console.log(`      findings: ${test.findings.join("; ")}`);
}

console.log("\n  Outstanding defects");
if (problems.length === 0) console.log("    none found by the automated checks — which is not a review");
for (const problem of problems) console.log(`    ✗ ${problem.problem}`);

console.log("\n  To move this lesson up the ladder");
console.log("    · machine_checked → educator_reviewed requires a named subject teacher, a date,");
console.log("      a scope and a verdict, written into this lesson's reviews array.");
console.log("    · educator_reviewed → learner_tested requires participants, a setting and");
console.log("      findings that measure understanding (an assessment or a delayed retention check),");
console.log("      not completion.");
console.log("    · published additionally requires a curriculum-lead approval of the same version.\n");

process.exit(problems.length === 0 ? 0 : 1);
