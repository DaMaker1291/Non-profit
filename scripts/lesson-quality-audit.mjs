#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE LESSON-QUALITY AUDIT.
//
// This is not a second lesson gate and it does not decide whether a lesson is
// "good". It joins the three records the repository already keeps —
//
//   · the genome (every concept),
//   · the compiled plan table (what every concept page can render today),
//   · the authored-lesson catalogue (what meets openmind.lesson/1.0),
//
// and reports, concept by concept, what a learner actually gets and what the
// highest-impact missing piece is.
//
// The distinction that matters:
//   authored lesson  = diagnostic, explained worked examples, misconceptions,
//                      guided practice, assessment, transfer, spaced retrieval.
//   plan outline     = a readable teaching sequence, but no diagnostic, no
//                      authored assessment and no human review.
//   supplemental     = assembled from the genome note and a concept lens; honest
//                      as an outline, never presented as complete teaching.
//
// A structural audit cannot establish learning. It can establish that a lesson
// has the parts an independent learner needs, and it can refuse to hide 119
// outlines behind the existence of 16 stronger lessons. Human review and learner
// testing stay explicitly absent unless a real record exists.
//
// Run: node scripts/lesson-quality-audit.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const genome = require("../.verify/genome.js");
const plans = require("../.verify/lesson-plans.js");
const authored = require("../.verify/lessons/authored/index.js");
const lessonVerify = require("../.verify/lesson-verify.js");

const planState = {};
for (const concept of genome.CONCEPTS) {
  const plan = plans.planFor(concept.id);
  if (!plan) continue;
  planState[concept.id] =
    plan.provenance === "supplemental"
      ? "supplemental"
      : plan.provenance === "authored"
        ? "authored"
        : "pilot";
}

const catalogue = lessonVerify.buildCatalogue(
  authored.AUTHORED_LESSONS,
  new Date().toISOString(),
  planState,
);
const catalogueById = new Map(catalogue.concepts.map((c) => [c.conceptId, c]));
const authoredById = new Map(authored.AUTHORED_LESSONS.map((l) => [l.conceptId, l]));

const DEFECT_LABEL = {
  no_authored_lesson: "No authored lesson meeting openmind.lesson/1.0",
  no_diagnostic: "No prerequisite diagnostic",
  no_authored_worked_examples: "No authored worked examples with reasons",
  no_assessment: "No authored assessment with marking criteria",
  no_transfer: "No transfer task",
  no_spaced_retrieval: "No spaced retrieval beyond the engine",
  no_guided_practice: "No authored guided practice with a hint",
  no_method_steps: "Method is prose, not explicit numbered moves",
  method_buried: "Method appears after the first teaching section",
  first_section_definitional: "Opens with a definition rather than a concrete case",
  no_terms: "No glossary beside the teaching",
  no_recap: "No end-of-lesson retrieval recap",
  no_figure: "No concept-specific visual representation",
  no_route: "No authored alternate route for a struggling or advanced learner",
  not_subject_reviewed: "No subject-teacher review record",
  not_learner_tested: "No learner-testing evidence",
};

function countWords(text) {
  return String(text).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

function methodIndex(sections) {
  return sections.findIndex(
    (s) =>
      (Array.isArray(s.steps) && s.steps.length > 0) ||
      /method|calculate|calculation|how to|worked|procedure|formula|step/i.test(s.heading ?? ""),
  );
}

const rows = [];
for (const concept of genome.CONCEPTS) {
  const plan = plans.planFor(concept.id) ?? null;
  const lesson = authoredById.get(concept.id) ?? null;
  const entry = catalogueById.get(concept.id);
  const sections = plan ? plans.sectionsFor(plan) : [];
  const first = sections[0] ?? null;
  const mIndex = methodIndex(sections);
  const defects = [];

  if (!lesson) defects.push("no_authored_lesson");
  if (!lesson?.priorKnowledge?.check?.length) defects.push("no_diagnostic");
  if (!lesson && !(plan?.workedExamples?.length)) defects.push("no_authored_worked_examples");
  if (!lesson?.assessment?.length) defects.push("no_assessment");
  if (!lesson?.transfer?.length) defects.push("no_transfer");
  if (!lesson?.retrieval?.length) defects.push("no_spaced_retrieval");
  if (!lesson?.guidedPractice?.length) defects.push("no_guided_practice");
  if (!lesson && !sections.some((s) => s.steps?.length)) defects.push("no_method_steps");
  if (!lesson && mIndex > 0) defects.push("method_buried");
  if (!lesson && first && /what is|is a|are a|definition|count, not|core idea/i.test(first.heading ?? "")) {
    defects.push("first_section_definitional");
  }
  if (!lesson && !(plan?.terms?.length)) defects.push("no_terms");
  if (!lesson && !(plan?.recap?.length)) defects.push("no_recap");
  if (!lesson && !(plan?.figure)) defects.push("no_figure");
  if (!lesson && !(plan?.routes?.length)) defects.push("no_route");
  if (!(lesson?.reviews?.length)) defects.push("not_subject_reviewed");
  if (!(lesson?.learnerTesting?.length)) defects.push("not_learner_tested");

  const priority = lesson
    ? "review"
    : concept.stage <= 1
      ? "critical"
      : "high";
  const highestImpact = lesson
    ? lesson.reviews.length === 0
      ? "Subject-teacher review of the mathematics/science and worked reasoning; then learner testing for independent transfer and delayed retention."
      : "Learner testing for independent transfer and delayed retention; revise only where the evidence identifies a failure."
    : plan?.provenance === "supplemental"
      ? "Replace the assembled outline with an authored lesson: diagnostic, two fully worked examples with reasons, misconception repair, guided and independent assessment, a transfer task and spaced retrieval."
      : "Upgrade the authored plan into openmind.lesson/1.0: add a prerequisite diagnostic, authored worked reasoning, assessment with marking criteria, a transfer task and spaced retrieval.";

  rows.push({
    conceptId: concept.id,
    title: concept.title,
    subject: concept.subject,
    stage: concept.stage,
    prerequisites: concept.prereqs,
    catalogueStatus: entry?.status ?? "unknown",
    planProvenance: plan?.provenance ?? "none",
    planReview: plan?.review ?? null,
    authoredLesson: Boolean(lesson),
    teachingWords: lesson
      ? lesson.explanation.flatMap((e) => e.paragraphs).reduce((n, p) => n + countWords(p), 0)
      : plan
        ? plans.planWordCount(plan)
        : 0,
    sections: sections.length,
    methodSection: mIndex >= 0 ? mIndex + 1 : null,
    firstSection: first?.heading ?? lesson?.explanation?.[0]?.heading ?? null,
    workedExamples: (lesson?.workedExamples?.length ?? 0) + (plan?.workedExamples?.length ?? 0),
    guidedPractice: lesson?.guidedPractice?.length ?? 0,
    assessment: lesson?.assessment?.length ?? 0,
    transfer: lesson?.transfer?.length ?? 0,
    retrieval: lesson?.retrieval?.length ?? plan?.recap?.length ?? 0,
    diagnostic: lesson?.priorKnowledge?.check?.length ?? 0,
    misconceptions: lesson?.misconceptions?.length ?? plan?.traps?.length ?? 0,
    figure: Boolean(lesson?.representations?.length || plan?.figure),
    terms: plan?.terms?.length ?? 0,
    routes: plan?.routes?.length ?? 0,
    subjectReviewed: Boolean(lesson?.reviews?.length),
    learnerTested: Boolean(lesson?.learnerTesting?.length),
    defects,
    priority,
    highestImpact,
  });
}

const bySubject = {};
for (const row of rows) {
  const s = (bySubject[row.subject] ??= {
    concepts: 0,
    authored: 0,
    outlines: 0,
    critical: 0,
    high: 0,
    review: 0,
  });
  s.concepts += 1;
  if (row.authoredLesson) s.authored += 1;
  else s.outlines += 1;
  s[row.priority] += 1;
}
const defectCounts = {};
for (const row of rows) for (const d of row.defects) defectCounts[d] = (defectCounts[d] ?? 0) + 1;

const report = {
  generatedBy: "scripts/lesson-quality-audit.mjs",
  generatedAt: new Date().toISOString(),
  scope:
    "Structural audit of all genome concepts against the authored-lesson contract and the real plan table. It does not measure learning, and it does not create human review or learner evidence.",
  totals: {
    concepts: rows.length,
    authoredLessons: rows.filter((r) => r.authoredLesson).length,
    outlines: rows.filter((r) => !r.authoredLesson).length,
    subjectReviewed: rows.filter((r) => r.subjectReviewed).length,
    learnerTested: rows.filter((r) => r.learnerTested).length,
    byPriority: rows.reduce((m, r) => ((m[r.priority] = (m[r.priority] ?? 0) + 1), m), {}),
  },
  bySubject,
  defectCounts,
  concepts: rows,
};

const outDir = path.join(process.cwd(), "reports", "lesson-quality");
fs.writeFileSync(path.join(outDir, "audit.json"), `${JSON.stringify(report, null, 2)}\n`);

const md = [];
md.push("# OpenMind lesson-quality audit");
md.push("");
md.push(`Generated by \`scripts/lesson-quality-audit.mjs\` on ${report.generatedAt}.`);
md.push("");
md.push("## What this measures");
md.push("");
md.push(report.scope);
md.push("");
md.push("A concept can be readable and still fail an independent learner. The audit therefore reports the **authored-lesson contract** separately from the plan outline, and never treats a plan record as a lesson.");
md.push("");
md.push("## How to read the labels");
md.push("");
md.push("- **`critical`** means a stage-1 concept has no authored lesson. It is a queue position, not a judgment that the existing plan is educationally worthless.");
md.push("- **`high`** means a later-stage concept has no authored lesson. It is lower in the queue, not a claim that its current page is adequate.");
md.push("- **`review`** means an authored lesson has every required structural part. It does **not** mean the lesson has been reviewed by a teacher or tested with learners.");
md.push("- **`machine_checked`** means the contract and deterministic checks pass. It is not a substitute for subject-teacher judgement or evidence of learning.");
md.push("- The **defect counts** count missing structural parts across 135 concepts. They are not 135 independent quality scores, and a lesson can pass every structural check while containing one serious factual error.");
md.push("");
md.push("## Totals");
md.push("");
md.push(`- Concepts: **${report.totals.concepts}**`);
md.push(`- Authored lessons meeting \`openmind.lesson/1.0\`: **${report.totals.authoredLessons}**`);
md.push(`- Plan outlines still replacing an authored lesson: **${report.totals.outlines}**`);
md.push(`- Subject-teacher reviewed: **${report.totals.subjectReviewed}**`);
md.push(`- Learner-tested with independent/retention evidence: **${report.totals.learnerTested}**`);
md.push("");
md.push("## By subject");
md.push("");
md.push("| Subject | Concepts | Authored | Outlines | Critical | High | Review |");
md.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const [subject, t] of Object.entries(bySubject).sort()) {
  md.push(`| ${subject} | ${t.concepts} | ${t.authored} | ${t.outlines} | ${t.critical} | ${t.high} | ${t.review} |`);
}
md.push("");
md.push("## Defects, in order of frequency");
md.push("");
md.push("| Defect | Concepts |");
md.push("| --- | ---: |");
for (const [defect, count] of Object.entries(defectCounts).sort((a, b) => b[1] - a[1])) {
  md.push(`| ${DEFECT_LABEL[defect] ?? defect} | ${count} |`);
}
md.push("");
md.push("## Every concept");
md.push("");
md.push("| Concept | Subject | Stage | Status | Authored | Words | Method at | First section | Defects | Highest-impact next move |");
md.push("| --- | --- | ---: | --- | --- | ---: | --- | --- | --- | --- |");
for (const r of rows.sort((a, b) => (a.subject + a.conceptId).localeCompare(b.subject + b.conceptId))) {
  const defects = r.defects.map((d) => DEFECT_LABEL[d] ?? d).join("; ");
  md.push(
    `| \`${r.conceptId}\` | ${r.subject} | ${r.stage} | ${r.catalogueStatus} | ${r.authoredLesson ? "yes" : "no"} | ${r.teachingWords} | ${r.methodSection ?? "—"} | ${(r.firstSection ?? "—").replace(/\|/g, "\\|")} | ${defects.replace(/\|/g, "\\|")} | ${r.highestImpact.replace(/\|/g, "\\|")} |`,
  );
}
md.push("");
md.push("## Honest limits");
md.push("");
md.push("- This is a **structural** audit. It cannot tell whether an explanation is mathematically or scientifically correct, whether a learner understood it, or whether a teacher would approve it.");
md.push("- `authored` means the eleven contract parts are present and machine-checked, not that a subject teacher has read the lesson.");
md.push("- `outline` means the page has a plan, not that it has a diagnostic, authored assessment or a complete teaching sequence.");
md.push("- No learner outcome is claimed. Delayed retention and transfer require supervised testing.");
fs.writeFileSync(path.join(outDir, "audit.md"), `${md.join("\n")}\n`);

const queue = [];
queue.push("# Lesson improvement queue");
queue.push("");
queue.push("Generated from `reports/lesson-quality/audit.json`. Work in batches; do not mark a lesson complete because a structural check passes.");
queue.push("");
queue.push("`critical` and `high` are queue positions for concepts without an authored lesson; `review` means the authored lesson has the required structural parts, not that a teacher or learner has validated it.");
queue.push("");
for (const priority of ["critical", "high", "review"]) {
  const group = rows.filter((r) => r.priority === priority);
  queue.push(`## ${priority[0].toUpperCase()}${priority.slice(1)} (${group.length})`);
  queue.push("");
  for (const r of group) {
    queue.push(`- [ ] \`${r.conceptId}\` (${r.subject}, stage ${r.stage}) — ${r.highestImpact}`);
  }
  queue.push("");
}
queue.push("## Review pack");
queue.push("");
queue.push("No educator approval exists in this repository. A subject teacher must review accuracy, age-appropriateness and assessment quality; a learner test must measure independent transfer and delayed retention, not completion. Those records are deliberately empty and must not be filled by a script.");
fs.writeFileSync(path.join(outDir, "queue.md"), `${queue.join("\n")}\n`);

console.log(`Lesson-quality audit: ${rows.length} concepts`);
console.log(`  authored lessons: ${report.totals.authoredLessons}`);
console.log(`  outlines: ${report.totals.outlines}`);
console.log(`  subject-reviewed: ${report.totals.subjectReviewed}`);
console.log(`  learner-tested: ${report.totals.learnerTested}`);
console.log(`  priority: ${JSON.stringify(report.totals.byPriority)}`);
console.log("  wrote reports/lesson-quality/audit.json, audit.md and queue.md");
