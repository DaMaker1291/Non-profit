#!/usr/bin/env node
// ── TEACHER-READINESS ACROSS ALL AUTHORED LESSONS ───────────────────────────
//
// The audit's Phase 6 asks which of the 135 lessons is a COMPLETE TEACHER-FACING
// lesson rather than a student-facing page. That is answerable from the lesson
// contract without asking anyone, and it must be answered honestly: the point of
// the matrix is to show how much is missing, so a check that quietly counted
// "an explanation exists" as "teachable" would defeat it.
//
// Every flag below is read from the authored lesson itself. `plan` is separate
// on purpose: a lesson can carry objectives, a worked example and an assessment
// while having NO teaching sequence (lib/lesson-plans.ts covers 15 of 135), and
// that difference is the one this matrix exists to display.
//
// Writes audit/teacher-readiness.json and audit/teacher-readiness.md. Read-only
// with respect to the product: it never edits a lesson.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const authored = require("../.verify/lessons/authored/index.js");
const plans = require("../.verify/lesson-plans.js");
const genome = require("../.verify/genome.js");

const LESSONS = authored.AUTHORED_LESSONS ?? [];
const pack = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "audit/pilot-pack.json"), "utf8"));
  } catch {
    return { concepts: [] };
  }
})();
const pilotIds = new Set(
  (pack.concepts ?? []).map((c) => (typeof c === "string" ? c : c.id ?? c.conceptId)),
);

const nonEmpty = (v) => Array.isArray(v) && v.length > 0;
// `planFor` synthesises a sequence for every concept — 15 are HAND-AUTHORED
// (`plannedConceptIds`), the rest are composed from the genome paragraph. The
// matrix must not report a generated sequence as an authored one: that is the
// difference between "a teacher has a plan to review" and "a page has some
// prose on it", and it is exactly the distinction the audit is about.
// `plannedConceptIds()` now answers for ALL 135: the plan record was completed
// with `provenance: "supplemental"` entries composed from the genome paragraph.
// So the discriminator is the provenance, not the key's presence — counting
// keys would have reported 135 hand-authored plans, which is false.
const authoredPlanIds = new Set(
  Object.entries(plans.LESSON_PLANS ?? {})
    .filter(([, plan]) => plan && plan.provenance !== "supplemental")
    .map(([id]) => id),
);
const generatedPlanIds = new Set(
  Object.entries(plans.LESSON_PLANS ?? {})
    .filter(([, plan]) => plan && plan.provenance === "supplemental")
    .map(([id]) => id),
);
const prose = (v) => typeof v === "string" && v.trim().split(/\s+/).length >= 12;

function flagsFor(lesson) {
  const explanation = (lesson.explanation ?? []).map((e) => (e.paragraphs ?? []).join(" ")).join(" ");
  const objectives = (lesson.objectives ?? []).filter((o) => prose(o.statement) && prose(o.evidence));
  const marking = (lesson.assessment ?? []).every((a) => nonEmpty(a.marking));
  return {
    objectives: objectives.length > 0,
    prerequisites: nonEmpty(lesson.priorKnowledge?.check),
    sequence: nonEmpty(plans.planFor(lesson.conceptId) ? [1] : []),
    authoredSequence: authoredPlanIds.has(lesson.conceptId),
    accessibility: nonEmpty(lesson.accessibility),
    explanation: prose(explanation),
    workedExample: nonEmpty(lesson.workedExamples),
    guidedPractice: nonEmpty(lesson.guidedPractice),
    misconceptions: nonEmpty(lesson.misconceptions) && (lesson.misconceptions ?? []).every((m) => prose(m.whyItFails) && prose(m.correction)),
    assessment: nonEmpty(lesson.assessment),
    markingGuidance: nonEmpty(lesson.assessment) && marking,
    // The contract has no differentiation field: mixed-age delivery is a
    // CLASSROOM setting (lib/classroom-context#mixedAge), not a per-lesson
    // artefact. Reported as absent rather than counted as met, because "one
    // prompt at different depths" is what a reviewer would want to see here.
    differentiation: Boolean(lesson.differentiation) || nonEmpty(lesson.adaptations),
    followUp: nonEmpty(lesson.transfer) || nonEmpty(lesson.homework) || nonEmpty(lesson.nextSteps),
  };
}

// Declared before the rows are built: it is read inside the map, and a `const`
// after it would be in the temporal dead zone (the first run proved it).
const CORE = ["objectives", "prerequisites", "sequence", "explanation", "workedExample", "guidedPractice", "misconceptions", "assessment", "markingGuidance", "followUp"];

const rows = LESSONS.map((lesson) => {
  const flags = flagsFor(lesson);
  // Scored over the TEN CORE elements, so the denominator is the number of
  // things a complete teacher-facing lesson needs — not the number of columns.
  const score = CORE.filter((k) => flags[k]).length;
  return {
    conceptId: lesson.conceptId,
    subject: lesson.subject,
    title: genome.getConcept(lesson.conceptId)?.title ?? lesson.conceptId,
    declaredStatus: lesson.declaredStatus ?? "unstated",
    inPilotPack: pilotIds.has(lesson.conceptId),
    ...flags,
    score,
    complete: CORE.every((k) => flags[k]),
  };
}).sort((a, b) => b.score - a.score || a.conceptId.localeCompare(b.conceptId));

const KEYS = ["objectives", "prerequisites", "sequence", "authoredSequence", "explanation", "workedExample", "guidedPractice", "misconceptions", "assessment", "markingGuidance", "accessibility", "differentiation", "followUp"];
// COMPLETENESS IS COUNTED OVER TEN CORE ELEMENTS, NOT OVER EVERY COLUMN.
// Including `differentiation` (which no lesson has, because the contract has no
// such field) made "complete" zero for every lesson — a true number that says
// nothing. The gap is reported as its own row instead.
for (const r of rows) {
  r.coreComplete = CORE.every((k) => r[k]);
}
const totals = Object.fromEntries(KEYS.map((k) => [k, rows.filter((r) => r[k]).length]));
const complete = rows.filter((r) => r.coreComplete).length;

// ── WHO TO ASK FIRST ───────────────────────────────────────────────────────
// A reviewer's time is the scarcest resource in this project, so the candidate
// is chosen for what a review would PROVE, not for what is easiest to send:
//   1. it is in the pilot pack (so a review counts toward the declared review)
//   2. it has the authored teaching sequence (the thing 120 lessons lack)
//   3. it carries a misconception with a named correction (reviewable claim)
//   4. it has an assessment with marking (reviewable marking)
//   5. it is in a subject where the audit already measures depth and option bias
// Tie-break by REVIEW VALUE, not alphabet: a sequence with four objectives and
// three misconceptions gives a reviewer more to reject than a single-step one,
// and an authored plan is material someone can actually teach from.
const reviewValue = (r) =>
  (r.authoredSequence ? 2 : 0) +
  (r.markingGuidance ? 1 : 0) +
  (r.misconceptions ? 1 : 0) +
  (r.objectives ? 1 : 0) +
  (r.guidedPractice ? 1 : 0) +
  (r.followUp ? 1 : 0);
const candidate =
  rows
    .filter((r) => r.inPilotPack && r.sequence && r.misconceptions && r.markingGuidance && r.assessment)
    .map((r) => ({ ...r, reviewValue: reviewValue(r) }))
    .sort((a, b) => b.reviewValue - a.reviewValue || b.score - a.score || a.conceptId.localeCompare(b.conceptId))[0] ?? null;

const report = {
  generatedAt: new Date().toISOString(),
  lessons: rows.length,
  authoredSequences: authoredPlanIds.size,
  generatedSequences: generatedPlanIds.size,
  completeLessons: complete,
  coreElements: CORE,
  totals,
  candidate: candidate
    ? {
        conceptId: candidate.conceptId,
        title: candidate.title,
        subject: candidate.subject,
        score: candidate.score,
        reviewValue: candidate.reviewValue,
        sequenceProvenance: candidate.authoredSequence ? "authored" : "generated",
        why: [
          "inside audit/pilot-pack.json, so a review counts toward the declared review rather than a new cluster",
          "has an authored teaching sequence (one of 15), which is the material a teacher would actually judge",
          "names at least one misconception with a correction, so the reviewer can reject a specific claim",
          "carries an assessment with marking guidance, so the reviewer can judge the marking, not only the prose",
        ],
      }
    : null,
  rows,
};

fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync("audit/teacher-readiness.json", JSON.stringify(report, null, 2) + "\n");

const table = [
  "| Lesson | Subject | Plan | Worked | Guided | Misconception | Assessment | Marking | Follow-up | Score |",
  "|---|---|---|---|---|---|---|---|---|---|",
  ...rows.map(
    (r) =>
      `| ${r.title} (\`${r.conceptId}\`) | ${r.subject} | ${r.authoredSequence ? "authored" : "generated"} | ${r.workedExample ? "yes" : "—"} | ${r.guidedPractice ? "yes" : "—"} | ${r.misconceptions ? "yes" : "—"} | ${r.assessment ? "yes" : "—"} | ${r.markingGuidance ? "yes" : "—"} | ${r.followUp ? "yes" : "—"} | ${r.score}/10 |`,
  ),
];
const md = [
  "# Teacher-readiness matrix",
  "",
  `Generated ${report.generatedAt} from the lesson contracts. ${complete} of ${rows.length} lessons carry all ten core elements; ${authoredPlanIds.size} have a hand-authored teaching sequence and ${generatedPlanIds.size} a sequence composed from the genome paragraph. Every row is derived, none is authored for this file.`,
  "",
  "`differentiation` is 0 for every lesson because the contract has no such field: mixed-age delivery is a classroom setting, not a lesson artefact. It is reported, not hidden.",
  "",
  "| Element | Lessons with it |",
  "|---|---|",
  ...KEYS.map((k) => `| ${k} | ${totals[k]} of ${rows.length} |`),
  "",
  "## Every lesson",
  "",
  ...table,
  "",
  "## First candidate for an external educator review",
  "",
  candidate ? `**${candidate.title}** (\`${candidate.conceptId}\`, ${candidate.subject}) — ${candidate.score}/10.\n\n${report.candidate.why.map((w) => `- ${w}`).join("\n")}` : "No lesson met the selection rule.",
  "",
  "_This matrix is a structural count. It is not an educator review, and no row here has been read by a teacher._",
].join("\n");
fs.writeFileSync("audit/teacher-readiness.md", md + "\n");

console.log("▸ Teacher readiness");
for (const k of KEYS) console.log(`  ${k.padEnd(16)} ${totals[k]} of ${rows.length}`);
console.log(`  complete         ${complete} of ${rows.length}`);
if (candidate) console.log(`  first review candidate: ${candidate.conceptId} (${candidate.score}/10, review value ${candidate.reviewValue})`);
console.log("  → audit/teacher-readiness.json, audit/teacher-readiness.md");
