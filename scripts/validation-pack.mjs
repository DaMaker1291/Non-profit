#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// INDEPENDENT EDUCATIONAL VALIDATION 1.0 — THE HANDOFF, NOT THE EVIDENCE.
//
// Automated tests can tell us that a lesson renders, marks a deterministic
// answer and survives a phone width. They cannot tell us whether a teacher
// accepts the mathematics, whether the explanation lands, or whether a pupil can
// use it without someone explaining the page to them.
//
// This script produces the documents a real reviewer and a real pilot need:
//
//   1. audit/validation/TEACHER_REVIEW_PACK.md
//      The five connected Mathematics lessons, pinned by version AND content
//      hash, with answer keys for the reviewer and a blank per-criterion review
//      form. It is a request for review, not a review.
//
//   2. audit/validation/LEARNER_PILOT_PROTOCOL.md
//      A supervised-pilot protocol with pre-check, independent lesson,
//      confusion log, independent assessment, transfer and delayed retention.
//      It contains no learner data and reports no outcome.
//
//   3. reports/lesson-quality/EDUCATIONAL_VALIDATION.md
//      The current status of authored / machine-checked / educator-reviewed /
//      learner-tested, derived from the generated catalogue, plus the things
//      this repository has NOT measured.
//
// The important rule: this script must never fill `reviews` or `learnerTesting`.
// Those records require a named human and a date. A generated document is not a
// reviewer.
//
// Run: npm run validation:pack
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { AUTHORED_LESSONS } = require("../.verify/lessons/authored/index.js");
const genome = require("../.verify/genome.js");
const { DATA_DIR } = require("../.verify/server/store.js");
const validation = require("../.verify/validation/review.js");

const TARGETS = [
  "probability-basics",
  "ratio",
  "proportion",
  "sequences",
  "indices-intro",
];

const OUT_DIR = path.join(process.cwd(), "audit", "validation");
const REPORT_PATH = path.join(
  process.cwd(),
  "reports",
  "lesson-quality",
  "EDUCATIONAL_VALIDATION.md",
);
const CATALOGUE_PATH = path.join(process.cwd(), "audit", "lesson-catalogue.json");

const byId = new Map(AUTHORED_LESSONS.map((lesson) => [lesson.conceptId, lesson]));
const missing = TARGETS.filter((id) => !byId.has(id));
if (missing.length) {
  console.error(`Validation pack: no authored lesson for ${missing.join(", ")}`);
  process.exit(1);
}

const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, "utf8"));
const catalogConcepts = Array.isArray(catalogue.concepts) ? catalogue.concepts : [];
const catalogById = new Map(catalogConcepts.map((concept) => [concept.conceptId, concept]));

const hashOf = (lesson) => validation.lessonContentHash(lesson);

const titleOf = (id) => {
  const concept = (genome.CONCEPTS ?? []).find((entry) => entry.id === id);
  return concept?.title ?? id.replace(/-/g, " ");
};

const currentStatusOf = (id) =>
  catalogById.get(id)?.status ?? byId.get(id).declaredStatus;

const lessons = TARGETS.map((id) => byId.get(id));

// HUMAN REVIEWS ARE READ FROM THE DURABLE LEDGER, NOT FROM THE LESSON SOURCE.
// The source file holds no approval; a teacher's signed-in submission writes
// one record under OPENMIND_DATA_DIR. The pack must show what is actually on
// file, including a record that no longer applies to the current hash.
let ledger = { version: 1, reviews: [], tasks: [] };
try {
  ledger = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "lesson-validation.json"), "utf8"));
} catch {
  // No ledger is the honest initial state: no human review has been recorded.
}
const humanReviews = Array.isArray(ledger.reviews) ? ledger.reviews : [];
const allReviewRecords = lessons.flatMap((lesson) => humanReviews.filter((review) => review.lessonId === lesson.conceptId));
const embeddedReviews = lessons.reduce((sum, lesson) => sum + (lesson.reviews?.length ?? 0), 0);
const reviews = allReviewRecords.length + embeddedReviews;
const learnerTesting = lessons.reduce(
  (sum, lesson) => sum + (lesson.learnerTesting?.length ?? 0),
  0,
);
const statusTotals = catalogue.totals?.byStatus ?? {};
const reviewStateFor = (lesson) => validation.resolveLessonReview(lesson, humanReviews);
const reviewProblemsFor = (lesson, record) => validation.reviewRecordProblems(record, lesson);
const manifestPath = path.join(OUT_DIR, "PACK_MANIFEST.json");
const currentManifest = {
  generatedBy: "scripts/validation-pack.mjs",
  contract: "openmind.lesson/1.0",
  lessons: lessons.map((lesson) => ({
    lessonId: lesson.conceptId,
    version: lesson.version,
    contentHash: hashOf(lesson),
  })),
};

if (process.argv.includes("--check")) {
  let previous = null;
  try {
    previous = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    console.error("Validation pack is stale: no PACK_MANIFEST.json; run npm run validation:pack.");
    process.exit(1);
  }
  const stale = validation.packStaleness(previous, lessons);
  const staleReviews = allReviewRecords.flatMap((record) => {
    const lesson = byId.get(record.lessonId);
    if (!lesson) return [`${record.id}: lesson no longer exists`];
    return reviewProblemsFor(lesson, record)
      .filter((problem) => problem.code === "review_stale")
      .map((problem) => `${record.id}: ${problem.message}`);
  });
  const problems = [...stale, ...staleReviews];
  if (problems.length) {
    console.error("Validation pack is stale:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(`Validation pack is current: ${lessons.length} lesson versions, ${allReviewRecords.length} human review record(s).`);
  process.exit(0);
}

const fmt = (value) => String(value ?? "").trim();
const paragraphs = (items) =>
  (items ?? []).map((item) => `${fmt(item)}\n`).join("\n");
const list = (items) => (items ?? []).map((item) => `- ${fmt(item)}`).join("\n");

function reviewForm(lesson) {
  return `### Review record — ${titleOf(lesson.conceptId)}

**Lesson:** \`${lesson.conceptId}\`

**Exact version:** \`${lesson.version}\`

**Content hash:** \`${hashOf(lesson)}\`

**Current status:** \`${currentStatusOf(lesson.conceptId)}\`

**Record online:** \`/lesson-review/${lesson.conceptId}\` (signed-in teaching account)

**Reviewer name:** ______________________________

**Role / qualification:** ______________________________

**Date:** ______________________________

| Criterion | Specific finding (name the section) | Severity | Required change |
| --- | --- | --- | --- |
| Subject accuracy |  |  |  |
| Curriculum accuracy |  |  |  |
| Teaching quality |  |  |  |
| Worked-example quality |  |  |  |
| Assessment validity |  |  |  |
| Accessibility |  |  |  |

**Overall verdict:** ______________________________

**Anything the reviewer believes is unsafe, misleading or unsuitable for the stated level:**

______________________________________________________________________________

Findings recorded online become improvement tasks automatically. A blocking
finding makes an approval impossible; a completed task does not approve a later
version.

The verdict is deliberately blank. Only a qualified reviewer who has read the
exact version above may complete it. A review of an earlier version does not
apply to this hash.`;
}

function lessonBody(lesson) {
  const lines = [];
  lines.push(`## ${titleOf(lesson.conceptId)}`);
  lines.push("");
  lines.push(`- **Concept:** \`${lesson.conceptId}\``);
  lines.push(`- **Subject:** ${lesson.subject}`);
  lines.push(`- **Version:** \`${lesson.version}\``);
  lines.push(`- **Content hash:** \`${hashOf(lesson)}\``);
  lines.push(`- **Declared status:** \`${lesson.declaredStatus}\``);
  lines.push(`- **Catalogue status:** \`${currentStatusOf(lesson.conceptId)}\``);
  lines.push(`- **Current human review:** \`${reviewStateFor(lesson).state}\``);
  lines.push(`- **Curriculum reference:** ${fmt(lesson.curriculum?.reference)}`);
  lines.push(`- **Level:** ${fmt(lesson.curriculum?.level)}`);
  if (lesson.curriculum?.note) lines.push(`- **Scope note:** ${fmt(lesson.curriculum.note)}`);
  lines.push("");
  lines.push("### Authorship and evidence");
  lines.push("");
  lines.push(
    list(
      (lesson.authors ?? []).map(
        (author) => `${author.author} — ${author.role} — ${author.method} — ${author.authoredAt}`,
      ),
    ),
  );
  lines.push("");
  lines.push(`- **Teacher reviews on record:** ${(lesson.reviews?.length ?? 0) + humanReviews.filter((review) => review.lessonId === lesson.conceptId).length}`);
  lines.push(`- **Learner-testing records on record:** ${lesson.learnerTesting?.length ?? 0}`);
  lines.push("");
  lines.push("### 1. Objectives and evidence");
  lines.push("");
  for (const objective of lesson.objectives ?? []) {
    lines.push(`**Objective:** ${fmt(objective.statement)}`);
    lines.push("");
    lines.push(`**Evidence sought:** ${fmt(objective.evidence)}`);
    lines.push("");
  }
  lines.push("### 2. Prior knowledge");
  lines.push("");
  lines.push(`Prerequisite concepts: ${(lesson.priorKnowledge?.conceptIds ?? []).join(", ") || "none declared"}.`);
  lines.push("");
  for (const check of lesson.priorKnowledge?.check ?? []) {
    lines.push(`**${check.id}.** ${fmt(check.question)}`);
    lines.push("");
    lines.push(`Expected answer: ${fmt(check.answer)}`);
    lines.push("");
  }
  lines.push("### 3. Introduction");
  lines.push("");
  lines.push(fmt(lesson.introduction?.hook));
  lines.push("");
  lines.push(fmt(lesson.introduction?.why));
  lines.push("");
  lines.push("### 4. Explanation");
  lines.push("");
  for (const section of lesson.explanation ?? []) {
    lines.push(`#### ${fmt(section.heading)}`);
    lines.push("");
    lines.push(paragraphs(section.paragraphs));
  }
  lines.push("### 5. Representations");
  lines.push("");
  for (const block of lesson.representations ?? []) {
    lines.push(`#### ${block.id} — \`${block.kind}\``);
    lines.push("");
    lines.push(fmt(block.body));
    lines.push("");
    if (block.notation) {
      lines.push("```text");
      lines.push(fmt(block.notation));
      lines.push("```");
      lines.push("");
    }
    if (block.caption) {
      lines.push(`**Caption:** ${fmt(block.caption)}`);
      lines.push("");
    }
    if (block.figure) {
      lines.push(`**Drawn figure:** \`${block.figure.spec?.kind ?? "unknown"}\``);
      lines.push("");
      lines.push(`**Figure caption:** ${fmt(block.figure.caption)}`);
      lines.push("");
      lines.push("```json");
      lines.push(JSON.stringify(block.figure.spec, null, 2));
      lines.push("```");
      lines.push("");
    }
  }
  lines.push("### 6. Worked examples");
  lines.push("");
  for (const example of lesson.workedExamples ?? []) {
    lines.push(`#### ${example.id}`);
    lines.push("");
    lines.push(`**Prompt:** ${fmt(example.prompt)}`);
    lines.push("");
    for (const [index, step] of (example.steps ?? []).entries()) {
      lines.push(`${index + 1}. **Move:** ${fmt(step.move)}`);
      lines.push(`   **Why:** ${fmt(step.why)}`);
    }
    lines.push("");
    lines.push(`**Answer:** ${fmt(example.answer)}`);
    lines.push("");
  }
  lines.push("### 7. Misconceptions");
  lines.push("");
  for (const misconception of lesson.misconceptions ?? []) {
    lines.push(`#### ${misconception.id} — ${fmt(misconception.belief)}`);
    lines.push("");
    lines.push(`**Why it fails:** ${fmt(misconception.whyItFails)}`);
    lines.push("");
    lines.push(`**Correction:** ${fmt(misconception.correction)}`);
    lines.push("");
    lines.push(`**Contrast — wrong:** ${fmt(misconception.contrast?.wrong)}`);
    lines.push("");
    lines.push(`**Contrast — right:** ${fmt(misconception.contrast?.right)}`);
    lines.push("");
  }
  lines.push("### 8. Guided practice");
  lines.push("");
  for (const item of lesson.guidedPractice ?? []) {
    lines.push(`#### ${item.id}`);
    lines.push("");
    lines.push(`**Prompt:** ${fmt(item.prompt)}`);
    lines.push("");
    lines.push(`**Hint:** ${fmt(item.hint)}`);
    lines.push("");
    lines.push(`**Answer:** ${fmt(item.answer)}`);
    lines.push("");
    lines.push(`**Feedback if correct:** ${fmt(item.feedback?.correct)}`);
    lines.push("");
    lines.push(`**Feedback if incorrect:** ${fmt(item.feedback?.incorrect)}`);
    lines.push("");
  }
  lines.push("### 9. Independent assessment");
  lines.push("");
  for (const item of lesson.assessment ?? []) {
    lines.push(`#### ${item.id} — \`${item.kind}\`${item.scored === false ? " — UNSCORED REFLECTION" : ""}`);
    lines.push("");
    lines.push(`**Prompt:** ${fmt(item.prompt)}`);
    lines.push("");
    lines.push(`**Model answer (reviewer copy):** ${fmt(item.modelAnswer)}`);
    lines.push("");
    lines.push("**Marking criteria:**");
    lines.push("");
    lines.push(list(item.marking));
    lines.push("");
    if (item.check?.accepted?.length) {
      lines.push(`**Accepted deterministic answers:** ${item.check.accepted.map((answer) => `\`${fmt(answer)}\``).join(", ")}`);
      lines.push("");
    }
    if (item.scored === false) {
      lines.push("**Mastery rule:** this item is explicitly unscored and must not contribute to mastery.");
      lines.push("");
    }
  }
  lines.push("### 10. Transfer");
  lines.push("");
  for (const transfer of lesson.transfer ?? []) {
    lines.push(`#### ${transfer.id}`);
    lines.push("");
    lines.push(`**Prompt:** ${fmt(transfer.prompt)}`);
    lines.push("");
    lines.push(`**Why it transfers:** ${fmt(transfer.whyItTransfers)}`);
    lines.push("");
    lines.push(`**Answer:** ${fmt(transfer.answer)}`);
    lines.push("");
    lines.push("**Marking criteria:**");
    lines.push("");
    lines.push(list(transfer.marking));
    lines.push("");
  }
  lines.push("### 11. Retrieval");
  lines.push("");
  for (const retrieval of lesson.retrieval ?? []) {
    lines.push(`#### ${retrieval.id} — ${retrieval.when}`);
    lines.push("");
    lines.push(`**Prompt:** ${fmt(retrieval.prompt)}`);
    lines.push("");
    lines.push(`**Answer:** ${fmt(retrieval.answer)}`);
    lines.push("");
  }
  lines.push("### 12. Summary and accessibility alternatives");
  lines.push("");
  lines.push(list(lesson.summary));
  lines.push("");
  for (const alternative of lesson.accessibility ?? []) {
    lines.push(`- **${alternative.need}:** ${fmt(alternative.alternative)}`);
  }
  lines.push("");
  lines.push("### 13. Provenance");
  lines.push("");
  for (const source of lesson.provenance ?? []) {
    lines.push(`- **${source.sourceId}** — ${source.basis} — licence: ${source.licence} — reproduction: ${source.reproduction}`);
    if (source.attribution) lines.push(`  - ${fmt(source.attribution)}`);
    if (source.note) lines.push(`  - Note: ${fmt(source.note)}`);
  }
  lines.push("");
  lines.push(reviewForm(lesson));
  lines.push("");
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

const pack = `# Teacher review pack — Independent Educational Validation 1.0

Generated from the compiled authored lessons on ${new Date().toISOString()}.
Contract: \`openmind.lesson/1.0\`.

**This is a request for review, not a review.** No qualified teacher has completed
the forms below. The pack contains answer keys because a reviewer must be able to
check the mathematics; it is an internal audit document and must not be given to
a learner as a worksheet.

## What the reviewer is asked to do

1. Open the exact lesson at \`/learn/maths/<concept>\` and compare it with the
   version and content hash printed for that lesson.
2. Judge the lesson against the criteria in its blank review form. Record a
   **specific finding** — “the second worked example adds the denominators” is
   useful; “good lesson” is not.
3. Mark each finding's severity and the change required. Do not average the
   criteria into a score.
4. Return the form without editing the lesson. A later version needs a new
   review; the hash is there to make that visible.

The questions a reviewer is answering are:

- Is the mathematics correct, and is the notation used consistently?
- Is the curriculum reference accurate for the stated level?
- Does the explanation make the idea, not just the procedure, intelligible?
- Do the worked examples show the reasoning behind each move?
- Are the misconceptions plausible, and are their corrections sound?
- Is the difficulty appropriate, and does the assessment test what was taught?
- Is the lesson’s accessibility alternative genuinely usable?

## Current human-evidence status

| Measure | Value |
| --- | ---: |
| Target lessons | **${lessons.length}** |
| Teacher reviews recorded on these lessons | **${reviews}** |
| Learner-testing records on these lessons | **${learnerTesting}** |
| Authored lessons in the catalogue | **${catalogue.totals?.authored ?? "unknown"}** |
| Machine-checked lessons in the catalogue | **${statusTotals.machine_checked ?? "unknown"}** |
| Educator-reviewed lessons in the catalogue | **${statusTotals.educator_reviewed ?? "unknown"}** |
| Learner-tested lessons in the catalogue | **${statusTotals.learner_tested ?? "unknown"}** |

## Exact versions in this pack

| Lesson | Version | Content hash | Catalogue status | Human review | Reviews | Learner tests |
| --- | --- | --- | --- | --- | ---: | ---: |
${lessons
  .map(
    (lesson) =>
      `| ${titleOf(lesson.conceptId)} (\`${lesson.conceptId}\`) | \`${lesson.version}\` | \`${hashOf(lesson)}\` | \`${currentStatusOf(lesson.conceptId)}\` | \`${reviewStateFor(lesson).state}\` | ${(lesson.reviews?.length ?? 0) + humanReviews.filter((review) => review.lessonId === lesson.conceptId).length} | ${lesson.learnerTesting?.length ?? 0} |`,
  )
  .join("\n")}

## Human review records

${allReviewRecords.length === 0 ? "No human review record is on file. The blank forms below are a request for review, not evidence." : allReviewRecords.map((record) => {
  const lesson = byId.get(record.lessonId);
  const problems = lesson ? reviewProblemsFor(lesson, record) : [{ message: "lesson no longer exists" }];
  const state = problems.some((problem) => problem.code === "review_stale") ? "STALE" : problems.length ? "INVALID" : record.decision.toUpperCase();
  const findings = record.findings?.length
    ? record.findings.map((finding) => `  - **${finding.severity}${finding.blockPublication ? ", blocking" : ""} · ${finding.location}:** ${finding.problem} — consequence: ${finding.educationalConsequence}; correction: ${finding.recommendation}`).join("\n")
    : "  - No specific findings recorded.";
  return `### ${titleOf(record.lessonId)} — ${state}\n\n- **Reviewer:** ${record.reviewer?.name ?? "unknown"} (${record.reviewer?.reviewRole ?? "unknown role"})\n- **Qualifications:** ${record.reviewer?.qualifications ?? "not recorded"}\n- **Scope:** ${record.reviewer?.scope ?? "not recorded"}\n- **Version/hash:** \`${record.lessonVersion}\` / \`${record.contentHash}\`\n- **Decision:** ${record.decision}\n- **Notes:** ${record.notes}\n${findings}${problems.length ? `\n- **Does not apply:** ${problems.map((problem) => problem.message).join("; ")}` : ""}`;
}).join("\n\n")}

## The lessons

${lessons.map(lessonBody).join("\n")}

## What to do with completed reviews

A real review is recorded through \`/lesson-review/<concept>\` by a signed-in
teacher, or through \`POST /api/lesson-review\` with the same account session. The
server takes the reviewer identity from that account and rejects a stale version
or hash. The catalogue derives \`educator_reviewed\` from the actual version and
hash; this pack does not raise a status by itself. A reviewer who asks for changes
keeps the lesson at its current rung until those changes are made and the new
version is reviewed.
`;

const pilot = `# Learner pilot protocol — Independent Educational Validation 1.0

**Status: NOT CONDUCTED.** This file is a protocol and a blank record. It contains
no learner data and no outcome.

## Purpose

A small supervised pilot can reveal confusion that automated tests cannot see. It
cannot prove that OpenMind is universally effective. Report the number of pupils,
what was missing, and the limits of the sample.

## Safeguarding, consent and data

- The pilot must be organised by a responsible teacher or school, under its
  safeguarding and data-protection rules.
- Obtain consent from the pupil and, where required, their parent or carer.
- Do not put names, email addresses, school identifiers or free-text remarks that
  identify a pupil in this repository.
- Use a pseudonymous participant code (for example \`P01\`) held by the supervising
  adult, not in the lesson data.
- Do not publish a learner's answer, video, audio or screen recording without
  explicit permission.

## Baseline and post-assessment

For each selected lesson, define the baseline before the session and use the same
conditions afterwards. Do not use a post-assessment item as a worked example.

- **Baseline.** Ask the lesson's two prior-knowledge checks and one item from the
  concept that the pupil has not seen. Record the answer, whether it was independent,
  and the prerequisite it exposes. This is a starting observation, not a diagnosis.
- **Post-assessment.** Immediately after the independent lesson, ask the authored
  assessment items without hints or the model answer. Score deterministic items with
  the authored key; judge constructed responses against the authored marking criteria.
  Record hints and prompts separately from independent answers.
- **Transfer.** Ask the transfer item, which must be a situation the lesson did not
  use as an example. Record the reasoning, not only the result.
- **Delayed retrieval.** Use a retrieval item at its scheduled delay; do not count
  an immediate repeat as retention.
- **Teacher observation.** The supervising adult records what the pupil did, not a
  judgement about the pupil. Keep it separate from the pupil's own usability comments.

## Session sequence

For each selected lesson:

1. **Prior knowledge and baseline.** Ask the two prior-knowledge checks before
   teaching begins, plus the baseline item defined above. Record only whether the
   pupil could use the prerequisite, not a label about the pupil.
2. **Independent lesson.** The pupil uses the lesson without an adult explaining
   the mathematics. The adult may help with the device, not with the reasoning.
3. **Confusion log.** Record the section, item or sentence where the pupil
   stopped, what they tried, and what they said. Do not prompt them towards the
   answer while logging.
4. **Independent assessment.** The pupil answers the deterministic assessment
   items without the model answer open. Constructed responses are judged by the
   adult against the authored criteria; the app does not mark prose.
5. **Transfer.** Give the transfer task, which is deliberately a new situation.
   Record the pupil's reasoning, not only the final number.
6. **Delayed retention.** Revisit one retrieval item after the scheduled delay
   (next day, week later or month later, as available). Do not count immediate
   repetition as delayed retention.
7. **Compare and revise.** Compare the evidence with the lesson's stated
   objectives. Record a specific improvement to the lesson, not a general
   impression.

## Measures to report

| Measure | What to record |
| --- | --- |
| Baseline | Prior checks and one unseen item; independent or prompted |
| Completion | Which sections were reached, and where did the pupil stop? |
| Independent post-assessment | Item id, answer, correct/incorrect, hints used |
| Transfer | The pupil's reasoning and whether it used the taught invariant |
| Delayed retention | Delay, item, answer and whether it was independent |
| Teacher observation | What the pupil did, without a label about the pupil |
| Learner usability | The pupil's own words about what helped or obstructed them |
| Confusion | Section, observed behaviour and quoted comment (pseudonymous) |
| Accessibility | Device, input method, text size, any barrier encountered |

Do not convert a constructed response into a vocabulary score. Use the authored
marking criteria and a human judgement, and say when the judgement is uncertain.

## Blank record

| Participant | Lesson / version | Prior check | Sections reached | Independent items | Transfer | Delayed item | Confusion / change |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P01 |  |  |  |  |  |  |  |
| P02 |  |  |  |  |  |  |  |
| P03 |  |  |  |  |  |  |  |

## Exact lesson versions in scope

| Lesson | Version | Content hash |
| --- | --- | --- |
${lessons
  .map((lesson) => `| \`${lesson.conceptId}\` | \`${lesson.version}\` | \`${hashOf(lesson)}\` |`)
  .join("\n")}

## Reporting rule

Report the sample size, missing data and the conditions of the pilot. A pupil
succeeding once is an existence proof, not an effect size. A pupil failing once is
a finding to investigate, not proof that the lesson cannot work. Do not describe
the pilot as “validated”, “effective” or “proven” without a design that can
support that claim.
`;

const report = `# Educational validation status

Generated by \`npm run validation:pack\` on ${new Date().toISOString()}.

This report records what exists and what does **not** exist. It is not a quality
score and it does not promote a lesson.

## Current status

| Measure | Value | Source |
| --- | ---: | --- |
| Authored lessons | **${catalogue.totals?.authored ?? "unknown"}** | \`audit/lesson-catalogue.json\` |
| Machine-checked lessons | **${statusTotals.machine_checked ?? "unknown"}** | \`audit/lesson-catalogue.json\` |
| Educator-reviewed lessons | **${statusTotals.educator_reviewed ?? "unknown"}** | \`audit/lesson-catalogue.json\` |
| Learner-tested lessons | **${statusTotals.learner_tested ?? "unknown"}** | \`audit/lesson-catalogue.json\` |
| Target lessons in the review pack | **${lessons.length}** | this generator |
| Teacher reviews on target lessons | **${reviews}** | lesson \`reviews[]\` + \`lesson-validation.json\` |
| Stale or invalid human review records | **${allReviewRecords.filter((record) => { const lesson = byId.get(record.lessonId); return !lesson || reviewProblemsFor(lesson, record).length > 0; }).length}** | version and content-hash check |
| Learner-testing records on target lessons | **${learnerTesting}** | lesson \`learnerTesting[]\` |
| Outline concepts still to author | **${statusTotals.outline ?? "unknown"}** | \`audit/lesson-catalogue.json\` |

The current authored count is **${catalogue.totals?.authored ?? "unknown"}**. The
generated catalogue is the authority; an older checkpoint may name a lower count.

## What the automated evidence does establish

- The lesson pages render through the authored contract and pass the existing
  lesson walk, including visible submissions for the tested items.
- Deterministic answers are marked by the server and retained in the evidence
  store; the probability-specific live check is separate from the new batch's
  live check.
- The ratio lesson's reusable bar model has an independent layout gate and a
  browser geometry check.
- The accessibility audit measures structural matters: document language, one
  main heading, control names, labels, image alternatives, hidden/named SVGs,
  tabindex, skip-link targeting, reduced motion, 320-px width, 200% browser zoom
  with reflow at 640 CSS px, computed contrast on a visible-text sample, focus
  visibility, rendered maths, and a diagram's accessible name and labelled
  callout controls. It also drives the public calculation activity with keys
  (typed \`4\`, Tab, Enter, observed \`✓ correct\`) and taps the phone navigation at
  390 × 844. The teacher intake is exercised separately over HTTP against a
  scratch store: server-derived reviewer identity, 401/403 authority, blank and
  stale refusals, AI refusal, task creation and task completion.

See \`reports/lesson-quality/MATHS_BATCH_29_VERIFICATION.md\` and
\`reports/lesson-quality/PROBABILITY_BASICS_VERIFICATION.md\` for the measured
counts and their exact commands.

The structural accessibility audit is a separate command
(\`npm run verify:a11y\`), so its current output is authoritative rather than a
number copied into this report. It covers the checks named below; it is not a
screen-reader session and it is not a conformance claim.

## What the automated evidence does not establish

- That an independent teacher considers the mathematics, sequence, examples,
  misconceptions, difficulty and assessment valid.
- That a pupil who did not understand the topic can use the lesson without an
  adult explaining it and then solve an unfamiliar problem.
- That a delayed-retention claim is supported; retrieval prompts are scheduled,
  not delivered.
- That 524 browser assertions mean 524 lessons have been tested. They are test
  assertions over the behaviours the suite covers.
- That a visible \`a1\` submission proves every assessment item in that lesson
  works. Constructed responses are intentionally ungraded; the other items need
  their own evidence.

## Accessibility: measured and not measured

Measured by the structural audit:

- control names, labels and image alternatives;
- hidden or named SVGs;
- no positive tabindex;
- skip-link presence and target;
- reduced-motion behaviour;
- 320-px sideways-scroll check;
- 200% browser zoom with reflow at 640 CSS px;
- computed colour-contrast ratios on a sample of visible text;
- visible focus treatment on the first control;
- rendered maths spans, refusal of raw \`^\`/\`sqrt(\` in drawn maths, and a spoken
  slash for stacked fractions;
- a diagram's \`role="img"\` accessible name and its labelled callout controls;
- a rendered calculation form's associated label, DOM focus order and polite
  live error status (the empty-submit message was exercised in the browser);
- keyboard submission of that activity once its field is focused (typed \`4\`,
  Tab to a visibly focused Check, Enter, observed \`✓ correct\`);
- phone navigation operated by a real tap at 390 × 844;
- the learner-controlled large-text, high-contrast and reduced-motion controls.

**Not yet measured, and therefore not claimed:**

- an actual VoiceOver or NVDA session;
- keyboard-only completion of a whole lesson (the public calculation activity's
  key path is measured; the rest of a lesson is not);
- mathematical notation *as announced* by a screen reader (the DOM spans are
  measured; the announcement is not);
- error announcements in a signed-in teacher review form;
- switch or eye-gaze input;
- captioning;
- a pupil's real experience.

The structural assertions are not complete accessibility verification. Actual
assistive-technology testing is recorded separately in
\`reports/lesson-quality/ASSISTIVE_TECHNOLOGY.md\` and has not been performed.

## The next artefacts

- \`audit/validation/TEACHER_REVIEW_PACK.md\` — exact lesson versions, content
  hashes, reviewer criteria and blank review records.
- \`audit/validation/LEARNER_PILOT_PROTOCOL.md\` — supervised pilot sequence,
  measures, blank record and reporting limits.

A lesson moves from \`machine_checked\` to \`educator_reviewed\` only when a named,
qualified reviewer records a review against the exact version. It moves to
\`learner_tested\` only when the learner-testing record exists. This generator does
not create either.
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "TEACHER_REVIEW_PACK.md"), pack);
fs.writeFileSync(path.join(OUT_DIR, "LEARNER_PILOT_PROTOCOL.md"), pilot);
fs.writeFileSync(REPORT_PATH, report);

// A pack is a snapshot, not a live view. The manifest makes the next reader
// able to tell whether the lesson has moved since this pack was generated.
fs.writeFileSync(
  manifestPath,
  `${JSON.stringify({
    ...currentManifest,
    generatedAt: new Date().toISOString(),
    reviews: allReviewRecords.map((record) => ({
      id: record.id,
      lessonId: record.lessonId,
      lessonVersion: record.lessonVersion,
      contentHash: record.contentHash,
      decision: record.decision,
    })),
  }, null, 2)}\n`,
);

// Keep the exact lesson object that was reviewed, not just its hash. A hash
// proves a version existed; the snapshot lets a future reviewer inspect it.
for (const lesson of lessons) {
  const dir = path.join(OUT_DIR, "versions", lesson.conceptId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${lesson.version}-${hashOf(lesson).slice(0, 16)}.json`),
    `${JSON.stringify(lesson, null, 2)}\n`,
  );
}

console.log(`Validation pack written:
  ${path.relative(process.cwd(), path.join(OUT_DIR, "TEACHER_REVIEW_PACK.md"))}
  ${path.relative(process.cwd(), path.join(OUT_DIR, "LEARNER_PILOT_PROTOCOL.md"))}
  ${path.relative(process.cwd(), REPORT_PATH)}`);
console.log(
  `Targets: ${lessons.length}; reviews: ${reviews}; learner tests: ${learnerTesting}; ` +
    `catalogue: ${catalogue.totals?.authored ?? "?"} authored / ${statusTotals.educator_reviewed ?? "?"} educator-reviewed / ${statusTotals.learner_tested ?? "?"} learner-tested.`,
);
