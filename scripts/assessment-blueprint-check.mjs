#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT BLUEPRINT GATE
//
// This checks the RECORD, not the subject. It asks the questions a
// provenance-tracked assessment layer must answer:
//
//   · does every source have a fingerprint, and is its permission honest?
//   · if permission is unknown, is use limited to pattern extraction?
//   · does every item's criteria add up to its declared marks?
//   · does every item use a response kind its archetype permits?
//   · does every misconception have an item that can diagnose it?
//   · is a review claim backed by a named, dated record for THIS version?
//
// A green run is NOT a subject review, a trial, or a claim that the school's
// material may be republished. It is a check that the blueprint says what it is
// doing. The serving gate is stricter again: both blueprints here are
// unreviewed, so neither may be served.
//
//   node scripts/assessment-blueprint-check.mjs           # check only
//   node scripts/assessment-blueprint-check.mjs --write   # write audit files
//   node scripts/assessment-blueprint-check.mjs --self-test
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const { DIET_DIGESTION_BLUEPRINT } = require("../.verify/assessment-blueprints/diet-digestion.js");
const { PHYSICS_ENERGY_BLUEPRINT } = require("../.verify/assessment-blueprints/physics-energy.js");
const { MATHS_TABLES_BLUEPRINT } = require("../.verify/assessment-blueprints/maths-tables.js");
const { validateAssessmentBlueprint, assessmentServingDecision } = require("../.verify/assessment-intelligence.js");

const blueprints = [DIET_DIGESTION_BLUEPRINT, PHYSICS_ENERGY_BLUEPRINT, MATHS_TABLES_BLUEPRINT];

if (process.argv.includes("--self-test")) {
  // A gate that has never refused anything is a green light with no bulb. Each
  // planted case is a defect this layer exists to catch; the final accepted case
  // proves the review rung is reachable, not merely impossible.
  let failures = 0;
  const blueprint = blueprints[0];
  const expectRefused = (label, mutate, base = blueprint) => {
    const copy = JSON.parse(JSON.stringify(base));
    mutate(copy);
    const check = validateAssessmentBlueprint(copy);
    if (check.ok) {
      failures += 1;
      console.error(`  ✗ self-test did not refuse: ${label}`);
    } else {
      console.log(`  ✓ refused: ${label}`);
    }
  };
  const reviewed = (copy) => {
    copy.version = "9.9.9";
    copy.reviewStatus = "teacher-reviewed";
    copy.teacherReviewed = true;
    copy.humanReviewCount = 1;
    copy.reviews = [{
      reviewer: "Dr A. Teacher",
      role: "subject-teacher",
      date: "2026-11-01",
      scope: "whole blueprint",
      verdict: "approved",
      blueprintVersion: "9.9.9",
    }];
    copy.items.forEach((item) => { item.reviewStatus = "teacher-reviewed"; });
  };

  expectRefused("unknown-rights source marked for licensed reproduction", (copy) => {
    copy.sources[0].reproduction = "licensed";
  });
  expectRefused("unknown-licensing source marked for licensed reproduction", (copy) => {
    copy.sources[0].licensing = "unknown";
    copy.sources[0].reproduction = "licensed";
  });
  expectRefused("table marks disagree with its blank cells", (copy) => {
    copy.items.find((item) => item.responseKind === "table").marks += 1;
  }, MATHS_TABLES_BLUEPRINT);
  expectRefused("an item names a concept outside its subject", (copy) => {
    copy.items[0].conceptId = "quadratics";
  });
  expectRefused("item marks disagree with its criteria", (copy) => {
    copy.items[0].marks += 1;
  });
  expectRefused("a named misconception has no diagnosing item", (copy) => {
    copy.misconceptions.push({ ...copy.misconceptions[0], id: "planted-undiagnosed" });
  });
  expectRefused("blueprint claims a teacher review", (copy) => {
    copy.teacherReviewed = true;
  });
  expectRefused("source text is stored", (copy) => {
    copy.sources[0].containsSourceText = true;
  });
  expectRefused("an item claims reproduced source text", (copy) => {
    copy.items[0].sourceTextReproduced = 1;
  });
  expectRefused("teacher-reviewed claim with no review record", (copy) => {
    reviewed(copy);
    copy.reviews = [];
    copy.humanReviewCount = 0;
  });
  expectRefused("placeholder reviewer", (copy) => {
    reviewed(copy);
    copy.reviews[0].reviewer = "TBD";
  });
  expectRefused("review of a different blueprint version", (copy) => {
    reviewed(copy);
    copy.reviews[0].blueprintVersion = "0.0.1";
  });
  expectRefused("future-dated review", (copy) => {
    reviewed(copy);
    copy.reviews[0].date = "2999-01-01";
  });
  expectRefused("prose machine-marked as a short answer", (copy) => {
    copy.items.find((item) => item.marks >= 3).responseKind = "short-answer";
  });

  const accepted = JSON.parse(JSON.stringify(blueprint));
  reviewed(accepted);
  const acceptedCheck = validateAssessmentBlueprint(accepted);
  if (!acceptedCheck.ok) {
    failures += 1;
    console.error(`  ✗ self-test refused a genuine review record: ${acceptedCheck.issues.join("; ")}`);
  } else {
    console.log("  ✓ accepted: a genuine review record for this version");
  }

  if (failures) {
    console.error(`self-test: ${failures} defect(s) were not handled correctly`);
    process.exit(1);
  }
  console.log("self-test: 14/14 planted defects refused; a genuine review record accepted");
  process.exit(0);
}

const generatedAt = new Date().toISOString();
const results = blueprints.map((blueprint) => {
  const result = validateAssessmentBlueprint(blueprint);
  return { blueprint, result, serving: assessmentServingDecision(blueprint) };
});

const totals = results.reduce((acc, { result }) => {
  acc.sources += result.summary.sources;
  acc.archetypes += result.summary.archetypes;
  acc.items += result.summary.items;
  acc.marks += result.summary.marks;
  acc.misconceptions += result.summary.misconceptions;
  acc.numericItems += result.summary.numericItems;
  acc.shortAnswerItems += result.summary.shortAnswerItems;
  acc.tableItems += result.summary.tableItems;
  acc.extendedItems += result.summary.extendedItems;
  acc.reviewedItems += result.summary.reviewedItems;
  acc.sourceTextReproduced += result.summary.sourceTextReproduced;
  acc.studentDataSources += result.summary.studentDataSources;
  return acc;
}, {
  sources: 0, archetypes: 0, items: 0, marks: 0, misconceptions: 0,
  numericItems: 0, shortAnswerItems: 0, tableItems: 0, extendedItems: 0, reviewedItems: 0,
  sourceTextReproduced: 0, studentDataSources: 0,
});
totals.blueprints = results.length;
totals.servable = results.filter(({ serving }) => serving.ok).length;
totals.issues = results.reduce((n, { result }) => n + result.issues.length, 0);

const record = {
  generatedBy: "scripts/assessment-blueprint-check.mjs",
  generatedAt,
  contract: blueprints[0].contract,
  totals,
  blueprints: results.map(({ blueprint, result, serving }) => ({
    id: blueprint.id,
    version: blueprint.version,
    title: blueprint.title,
    subject: blueprint.subject,
    level: blueprint.level,
    reviewStatus: blueprint.reviewStatus,
    teacherReviewed: blueprint.teacherReviewed,
    learnerTested: blueprint.learnerTested,
    humanReviewCount: blueprint.humanReviewCount,
    reviews: blueprint.reviews,
    serving: { ok: serving.ok, reasons: serving.reasons },
    sourcePolicy: {
      availability: [...new Set(blueprint.sources.map((source) => source.availability))],
      rights: [...new Set(blueprint.sources.map((source) => source.rights))],
      licensing: [...new Set(blueprint.sources.map((source) => source.licensing))],
      allowedUse: [...new Set(blueprint.sources.map((source) => source.allowedUse))],
      reproduction: [...new Set(blueprint.sources.map((source) => source.reproduction))],
      containsSourceText: blueprint.sources.some((source) => source.containsSourceText),
      studentDataObserved: blueprint.sources.some((source) => source.studentDataObserved),
    },
    summary: result.summary,
    issues: result.issues,
    items: blueprint.items.map((item) => ({
      id: item.id,
      archetypeId: item.archetypeId,
      responseKind: item.responseKind,
      marks: item.marks,
      criteria: item.criteria.length,
      misconceptionIds: item.criteria.map((criterion) => criterion.misconceptionId).filter(Boolean),
      originality: item.originality,
      sourceTextReproduced: item.sourceTextReproduced,
      reviewStatus: item.reviewStatus,
    })),
    limitations: blueprint.limitations,
  })),
};

const json = `${JSON.stringify(record, null, 2)}\n`;
const md = [
  "# Assessment intelligence audit",
  "",
  `Generated by \`scripts/assessment-blueprint-check.mjs\` on ${generatedAt}.`,
  "",
  "This is a provenance, consistency and review-status audit — not a subject review.",
  "",
  "## Totals",
  "",
  `- Blueprints: **${totals.blueprints}**`,
  `- Sources: **${totals.sources}**`,
  `- Archetypes: **${totals.archetypes}**`,
  `- Newly authored items: **${totals.items}** (${totals.marks} marks)`,
  `- Numeric / short-answer / table / extended: **${totals.numericItems} / ${totals.shortAnswerItems} / ${totals.tableItems} / ${totals.extendedItems}**`,
  `- Misconception profiles: **${totals.misconceptions}**`,
  `- Teacher-reviewed items: **${totals.reviewedItems}**`,
  `- Servable blueprints: **${totals.servable}**`,
  `- Source text reproduced: **${totals.sourceTextReproduced}**`,
  `- Sources with observed student data: **${totals.studentDataSources}**`,
  "",
  ...results.flatMap(({ blueprint, result }) => [
    `## ${blueprint.title}`,
    "",
    `- Id: \`${blueprint.id}\` (version \`${blueprint.version}\`)`,
    `- Subject: **${blueprint.subject}**`,
    `- Level: **${blueprint.level}**`,
    `- Review status: **${blueprint.reviewStatus}**; reviews recorded: **${blueprint.reviews.length}**`,
    `- Items: **${result.summary.items}** (${result.summary.marks} marks); numeric ${result.summary.numericItems}, short ${result.summary.shortAnswerItems}, table ${result.summary.tableItems}, extended ${result.summary.extendedItems}`,
    `- Source text reproduced: **${result.summary.sourceTextReproduced}**`,
    "",
    "| Source | Kind | Availability | Rights | Licensing | Allowed use | Reproduction | Source text stored |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...blueprint.sources.map((source) =>
      `| ${source.label} | ${source.kind} | ${source.availability} | ${source.rights} | ${source.licensing} | ${source.allowedUse} | ${source.reproduction} | ${source.containsSourceText} |`),
    "",
    "| Item | Archetype | Response | Marks | Criteria | Review |",
    "| --- | --- | --- | ---: | ---: | --- |",
    ...blueprint.items.map((item) =>
      `| \`${item.id}\` | \`${item.archetypeId}\` | ${item.responseKind} | ${item.marks} | ${item.criteria.length} | ${item.reviewStatus} |`),
    "",
    result.issues.length
      ? `**Gate failures:** ${result.issues.map((issue) => `\`${issue}\``).join("; ")}`
      : "All consistency checks passed.",
    "",
  ]),
  "## What this does not establish",
  "",
  "- No teacher has reviewed any blueprint or its items; `teacher-reviewed` is refused without a named, dated record for the version.",
  "- No learner has attempted the items; there is no learner-testing evidence.",
  "- The school's permission to reuse its material has **not** been established. The biology blueprint is limited to pattern extraction and stores no source prompt, table, option or mark-scheme sentence.",
  "- The physics source is a public specification used for unit placement and assessment style only; no specification text or examination question is reproduced. Public availability is not a reuse permission, so its rights and licensing are recorded as unknown.",
  "- The maths source is OpenMind-authored and records rights and licensing as clear, but that clears no pedagogical review; it is still refused.",
  "- No claim is made that any marking scheme agrees with an awarding body's examiner.",
  "- No blueprint is served: the serving gate requires pedagogical review, source rights, licensing and confidentiality independently, and the review is absent in all three.",
  "",
  totals.issues ? "## Failures" : "## Gate result",
  "",
  ...(totals.issues
    ? results.flatMap(({ blueprint, result }) => result.issues.map((issue) => `- \`${blueprint.id}\`: ${issue}`))
    : ["All consistency and review-status checks passed."]),
  "",
].join("\n");

if (process.argv.includes("--write")) {
  const auditDir = path.join(process.cwd(), "audit");
  fs.writeFileSync(path.join(auditDir, "assessment-intelligence.json"), json);
  fs.writeFileSync(path.join(auditDir, "assessment-intelligence.md"), md);
  console.log("wrote audit/assessment-intelligence.json and audit/assessment-intelligence.md");
}

console.log(
  `assessment blueprints: ${totals.blueprints} blueprints, ${totals.items} items, ${totals.marks} marks, ` +
    `${totals.sources} sources, ${totals.misconceptions} misconceptions, ${totals.reviewedItems} reviewed, ` +
    `${totals.servable} servable, ${totals.issues} issue${totals.issues === 1 ? "" : "s"}`,
);
if (totals.issues) {
  for (const { blueprint, result } of results) {
    for (const issue of result.issues) console.error(`  ✗ ${blueprint.id}: ${issue}`);
  }
  process.exit(1);
}
console.log("✓ provenance, marking consistency and review status hold for every blueprint; nothing unreviewed is served.");
