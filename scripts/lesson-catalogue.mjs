// THE LESSON CATALOGUE — Phase 0 of the authored-teaching milestone, as a
// generated record rather than a claim in a document.
//
// It answers one question per concept: does an AUTHORED lesson meeting
// openmind.lesson/1.0 exist, and if not, what exactly is missing? The answer is
// derived from the contract lessons and the real plan table, never from a count
// anyone typed.
//
// The distinction this file exists to keep honest:
//   - an authored lesson in lib/lessons/authored/ is `draft` or above;
//   - a pilot plan is `outline` (substantial, but not assessed against the
//     contract);
//   - a supplemental plan assembled from the genome note and a lens is
//     `outline` — never `draft`, because assembly is not authorship;
//   - a concept with nothing but a title and a teaching note is
//     `metadata_only`.
//
// Run: node scripts/lesson-catalogue.mjs            (check, exit 1 on a problem)
//      node scripts/lesson-catalogue.mjs --write    (also write audit/lesson-catalogue.json)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);

compileEngines();

const genome = require("../.verify/genome.js");
const { AUTHORED_LESSONS } = require("../.verify/lessons/authored/index.js");
const lessonVerify = require("../.verify/lesson-verify.js");

// The plan table is the compiled one the read stage uses. A non-authored
// concept's rung depends on it, so it is read from code rather than guessed
// from a list in this script.
const planState = {};
try {
  // LABEL FROM THE PLAN ITSELF, NOT FROM A FIELD THAT DOES NOT EXIST. The
  // previous line tested `provenance === "pilot"`, but a pilot plan carries NO
  // provenance (`undefined`) — only supplemental plans say "supplemental". So
  // every plan fell through to the supplemental branch and the report claimed
  // 135 supplemental plans, including the 19 that were written by hand. Ask
  // `planFor` and read what it actually says.
  const plans = require("../.verify/lesson-plans.js");
  for (const concept of genome.CONCEPTS) {
    const plan = plans.planFor(concept.id);
    if (!plan) continue;
    planState[concept.id] = plan.provenance === "supplemental" ? "supplemental" : plan.provenance === "authored" ? "authored" : "pilot";
  }
} catch {
  console.warn("  (no compiled plan table: plan-only concepts will read as metadata_only)");
}

const catalogue = lessonVerify.buildCatalogue(
  AUTHORED_LESSONS,
  new Date().toISOString(),
  planState,
);

const problems = lessonVerify
  .originalityProblems(AUTHORED_LESSONS)
  .concat(AUTHORED_LESSONS.flatMap((lesson) => lessonVerify.auditLessonForStatus(lesson)));

const statusLine = Object.entries(catalogue.totals.byStatus)
  .map(([status, count]) => `${status} ${count}`)
  .join(" · ");

console.log(`\nAuthored lesson catalogue — ${catalogue.contract}`);
console.log(`  concepts: ${catalogue.totals.concepts}`);
console.log(`  authored: ${catalogue.totals.authored}`);
console.log(`  ${statusLine}`);
for (const [subject, totals] of Object.entries(catalogue.bySubject)) {
  console.log(
    `  ${subject.padEnd(10)} concepts ${String(totals.concepts).padStart(3)} · authored ${totals.authored} · outline ${totals.outline} · metadata_only ${totals.metadataOnly}`,
  );
}
console.log(`  unresolved gaps: ${catalogue.gaps.length}`);
// A PLAN IS NOT A LESSON. The counts that drifted in earlier reports (15 pilot
// plans, 19 plans, 120 assembled plans) were three counts of plan records, none
// of which is an authored lesson. Printing both numbers together, labelled, is
// what stops "135 lessons" being read off a table of 135 plans.
const planRecords = catalogue.concepts.reduce((m, c) => {
  m[c.plan] = (m[c.plan] ?? 0) + 1;
  return m;
}, {});
console.log(
  `  plan records: ${catalogue.concepts.length} (pilot plan ${planRecords.pilot ?? 0} · authored lesson ${planRecords.authored ?? 0} · supplemental ${planRecords.supplemental ?? 0} · none ${planRecords.none ?? 0}) — a plan is not a lesson`,
);
console.log(
  `  translated lessons: ${catalogue.translations.languages.length} reviewed · ${catalogue.translations.machine.length} machine (unreviewed, shown with their status)`,
);

if (problems.length) {
  console.error("\nProblems in authored lessons:");
  for (const problem of problems.slice(0, 40)) {
    console.error(`  ${problem.where}: ${problem.problem}`);
  }
  console.error(`\n${problems.length} problem(s)`);
  process.exitCode = 1;
}

if (process.argv.includes("--write")) {
  const out = path.join(process.cwd(), "audit", "lesson-catalogue.json");
  fs.writeFileSync(out, `${JSON.stringify(catalogue, null, 2)}\n`);
  console.log(`\nwrote ${path.relative(process.cwd(), out)}`);
}

if (process.argv.includes("--report")) {
  const out = path.join(process.cwd(), "audit", "lesson-catalogue.md");
  fs.writeFileSync(out, reportMarkdown(catalogue, problems, AUTHORED_LESSONS));
  console.log(`wrote ${path.relative(process.cwd(), out)}`);
}

/** The Phase 10 report: the numbers a reviewer is entitled to, and nothing
 *  claimed that this generator did not measure. The browser result is named as
 *  a separate command rather than inferred, because a catalogue cannot see a
 *  page. */
function reportMarkdown(c, defects, lessons) {
  const rows = ["| Subject | Concepts | Authored | Machine-checked | Outline | Metadata only |", "| --- | --- | --- | --- | --- | --- |"];
  for (const [subject, t] of Object.entries(c.bySubject).sort()) {
    rows.push(`| ${subject} | ${t.concepts} | ${t.authored} | ${t.machineChecked} | ${t.outline} | ${t.metadataOnly} |`);
  }
  const statusRows = ["| Status | Concepts |", "| --- | --- |"];
  for (const [status, count] of Object.entries(c.totals.byStatus)) statusRows.push(`| \`${status}\` | ${count} |`);
  const cited = lessons.filter((l) => l.provenance.some((p) => p.basis !== "openmind-authored"));
  const original = lessons.filter((l) => l.provenance.every((p) => p.reproduction === "none"));
  return `# Authored teaching catalogue

Generated by \`scripts/lesson-catalogue.mjs\` on ${c.at} against \`${c.contract}\`.
Do not hand-edit: re-run \`npm run lesson:catalogue\`.

## 1. Concepts

${c.totals.concepts} concepts in the genome; **${c.totals.authored}** have an authored lesson meeting the contract.

## 2. Authored lessons by subject

${rows.join("\n")}

## 3. Lesson status

${statusRows.join("\n")}

\`outline\` includes both the pilot plans and the supplemental plans assembled from a genome
note and a lens. Neither is authored teaching, and neither is counted as a draft.

## 4. Translation coverage

${c.translations.languages.length === 0 ? "No lesson has a complete, human-reviewed translation." : `Complete, human-reviewed translations: ${c.translations.languages.join(", ")}.`}

${c.translations.note}

## 5. Resource provenance

${cited.length} of ${lessons.length} authored lessons cite the curriculum source they were
scoped against. ${original.length} of ${lessons.length} reproduce no external text at all.

## 6. Automated validation

${defects.length === 0 ? "No defect in any authored lesson." : `${defects.length} defect(s):\n\n${defects.slice(0, 25).map((p) => `- ${p.where}: ${p.problem}`).join("\n")}`}

## 7. Educator review status

${lessons.filter((l) => l.reviews.length > 0).length} of ${lessons.length} authored lessons have a
review record. Approval requires a named subject teacher, a date, a scope and a verdict
on the exact version; no script can write one.

## 8. Learner testing status

${lessons.filter((l) => l.learnerTesting.length > 0).length} of ${lessons.length} authored lessons have
learner-testing evidence measuring understanding rather than completion.

## 9. Unresolved gaps

${c.gaps.length} concepts have no authored lesson.

${c.gaps.slice(0, 20).map((g) => `- \`${g.conceptId}\` (${g.subject}): ${g.blocker}`).join("\n")}

## 10. Browser verification

Not measured by this generator. Run \`npm run verify:lesson\` with the dev server up;
that walk drives a real browser and asserts the read stage's order, the figure geometry
at 1280 and 320, the language rule, and that every authored plan is measured.
`;
}

if (genome.CONCEPTS.length !== catalogue.totals.concepts) {
  console.error(`catalogue covers ${catalogue.totals.concepts} concepts, genome holds ${genome.CONCEPTS.length}`);
  process.exitCode = 1;
}
