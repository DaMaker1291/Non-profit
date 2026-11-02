#!/usr/bin/env node
// CONTENT PLATFORM 1.0 — the first executable gate.
//
// It compiles the engine mirror once, then checks the lesson documents and the
// resource records BEHAVIOURALLY. The claims that matter are not visible in a
// rendered page: a linked source must never satisfy an ingestion, an accepted
// mathematical form must be parseable, and an approved lesson must name a human.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

// The compiled mirror is CommonJS; this file is ESM. One explicit require keeps
// that boundary visible rather than relying on a bundler's interop.
const require = createRequire(import.meta.url);

compileEngines();

const T = require("../.verify/content-platform/types.js");
const V = require("../.verify/content-platform/validate.js");
const RV = require("../.verify/content-platform/review.js");
const R = require("../.verify/content-platform/resources.js");
const F = require("../.verify/content-platform/flagships.js");
const C = require("../.verify/content-platform/capability.js");
const M = require("../.verify/math-expression.js");
const SR = require("../.verify/source-registry.js");

let passed = 0;
const failures = [];
function ok(condition, label, detail = "") {
  if (condition) {
    passed += 1;
  } else {
    failures.push(detail ? `${label} — ${detail}` : label);
  }
}

// ── 1. The documents are structurally valid ────────────────────────────────
const documents = F.allLessonDocuments();
ok(documents.length === 3, "three flagship documents composed", `got ${documents.length}`);
const ids = new Set();
for (const doc of documents) {
  ok(!ids.has(doc.id), `lesson id is unique: ${doc.id}`);
  ids.add(doc.id);
  const problems = V.validateLesson(doc);
  ok(problems.length === 0, `${doc.id} validates`, problems.map((p) => `${p.code}: ${p.message}`).join(" | "));
  ok(doc.schemaVersion === T.LESSON_SCHEMA_VERSION, `${doc.id} carries schema version ${T.LESSON_SCHEMA_VERSION}`);
  ok(doc.review.state !== "approved", `${doc.id} does not claim approval`);
  ok(doc.review.reviewedBy === undefined, `${doc.id} names no reviewer it does not have`);
  ok(doc.assessments.length > 0, `${doc.id} has an assessment contract`);
  const assessed = doc.blocks.filter((b) => T.isAssessedBlock(b));
  ok(assessed.every((b) => doc.assessments.some((a) => a.blockId === b.id)), `${doc.id} every assessed block has a contract`);
  for (const b of assessed) {
    ok(!("answer" in b) && !("accepted" in b) && !("tests" in b) && !("answers" in b),
      `${doc.id}/${b.id} keeps the key out of the visible block`);
  }
}

// ── 2. Rights decisions are the registry's, not a website's ───────────────
const byId = (id) => R.RESOURCE_RECORDS.find((r) => r.id === id);
const openstax = R.decideResource(byId("openstax-college-physics-2e"));
ok(openstax.outcome === "review", "OpenStax is held for rights review, not ingested", JSON.stringify(openstax));
const phet = R.decideResource(byId("phet-circuit-construction-kit-dc"));
ok(phet.outcome === "link", "PhET is link-only", JSON.stringify(phet));
const authored = R.decideResource(byId("openmind-electricity-circuits"));
ok(authored.outcome === "ingest", "OpenMind-authored teaching is ingestible", JSON.stringify(authored));
const unknown = R.decideResource({ ...byId("openmind-electricity-circuits"), sourceId: "not-a-source" });
ok(unknown.outcome === "reject", "an unknown source is rejected");
const restricted = R.decideResource({
  ...byId("openmind-electricity-circuits"),
  sourceId: "ncert-textbooks",
  requestedUse: "adapt",
});
ok(restricted.outcome === "reject", "an all-rights-reserved source is rejected for adaptation", JSON.stringify(restricted));
const noLink = R.decideResource({ ...byId("phet-circuit-construction-kit-dc"), url: null });
ok(noLink.outcome === "reject", "a link with no URL is rejected");
ok(SR.sourceRecord("openstax")?.rights.proof === "secondary-research", "OpenStax's proof is still secondary research");

const physicsCoverage = R.coverageForConcept("electricity-circuits", "physics");
ok(physicsCoverage.status === "well-supported", "physics coverage has usable authored material", JSON.stringify(physicsCoverage));
ok(physicsCoverage.linked === 1, "physics coverage records the PhET link separately", JSON.stringify(physicsCoverage));
const computingCoverage = R.coverageForConcept("what-is-code", "computing");
ok(computingCoverage.status === "well-supported", "computing coverage has an authored lesson", JSON.stringify(computingCoverage));
const cellsCoverage = R.coverageForConcept("cells", "biology");
ok(cellsCoverage.status === "well-supported", "biology coverage has authored material", JSON.stringify(cellsCoverage));
ok(cellsCoverage.review === 1, "biology coverage keeps the OpenStax record in review", JSON.stringify(cellsCoverage));

// ── 3. Mathematical equivalence is mathematical ───────────────────────────
const eq = (given, accepted) => M.markMathExpression(given, accepted).correct;
ok(eq("2(x+3)", ["2x+6"]), "2(x+3) is equivalent to 2x+6");
ok(eq("2*x+6", ["2x+6"]), "2*x+6 is equivalent to 2x+6");
ok(!eq("x^2+4", ["(x+2)^2"]), "x^2+4 is NOT equivalent to (x+2)^2");
ok(eq("sqrt(8)", ["2sqrt(2)"]), "sqrt(8) is equivalent to 2sqrt(2)");
ok(eq("R=V/I", ["R=\\frac{V}{I}"]), "R=V/I is equivalent to its fraction form");
ok(eq("x^2-5x+6=0", ["(x-2)(x-3)=0"]), "the quadratic equation is compared as an equation");
ok(!eq("x=2", ["2"]), "a solution statement is not an expression");
ok(M.markMathExpression("hello", ["x"]).reason === "unreadable", "an unreadable entry is not marked wrong");
ok(M.markMathExpression("x+1", []).reason === "unsupported", "no accepted form is unsupported, not a guess");

// ── 3b. An approval is bound to the version it read ────────────────────────
// The old model had no review record at all. A later approval that merely set
// a string to "approved" would survive an edit to the lesson it approved, so
// the fingerprint is the part of the review contract that makes the state a
// claim about specific content rather than a badge on a title.
const reviewDoc = documents[0];
const allChecks = Object.fromEntries(T.REVIEW_CRITERIA.map((c) => [c.id, true]));
const baseReview = {
  id: "cr_gate",
  documentId: reviewDoc.id,
  fingerprint: RV.lessonFingerprint(reviewDoc),
  decision: "approved",
  criteria: allChecks,
  notes: "Checked the explanation, the answer key and the source rights against this version.",
  reviewer: { accountId: "acc_gate", name: "Gate Reviewer", role: "teacher" },
  createdAt: 1_700_000_000_000,
};
ok(RV.resolveLessonReview(reviewDoc, [baseReview]).review.state === "approved", "a complete teacher review approves this version");
ok(RV.resolveLessonReview({ ...reviewDoc, title: `${reviewDoc.title} (edited)` }, [baseReview]).review.state === "draft", "an approval stops applying when the lesson changes");
ok(RV.reviewRecordProblems({ ...baseReview, fingerprint: "stale" }, reviewDoc).some((p) => p.code === "content_changed"), "a stale fingerprint is reported as content change");
ok(RV.reviewInputProblems({ ...baseReview, criteria: { ...allChecks, assessment: false } }, reviewDoc.id).some((p) => p.code === "approval_requires_all"), "approval without every check is refused");
ok(RV.reviewInputProblems({ ...baseReview, notes: "too short" }, reviewDoc.id).some((p) => p.code === "approval_notes_short"), "approval without substantive notes is refused");
ok(RV.resolveLessonReview(reviewDoc, [{ ...baseReview, decision: "changes-requested" }]).review.state === "draft", "changes requested leaves the lesson in draft");

// ── 4. The matrix is measured from the modules ────────────────────────────
const matrix = C.capabilityMatrix();
ok(matrix.length === 5, "the matrix covers five subjects", `got ${matrix.length}`);
const bySubject = Object.fromEntries(matrix.map((r) => [r.subject, r]));
ok(bySubject.computing.richLessons === 1, "computing has a content-platform lesson", JSON.stringify(bySubject.computing));
ok(bySubject.physics.richLessons === 1, "physics has a content-platform lesson");
ok(bySubject.biology.richLessons === 1, "biology has a content-platform lesson");
ok(bySubject.physics.responseKinds.includes("numeric"), "physics exposes a numeric response");
ok(bySubject.physics.responseKinds.includes("math_expression"), "physics exposes a math-expression response");
ok(bySubject.computing.responseKinds.includes("code"), "computing exposes a code response");
ok(bySubject.biology.responseKinds.includes("labels"), "biology exposes a diagram-label response");
ok(bySubject.physics.approvedLessons === 0, "physics lesson is not approved");
ok(bySubject.biology.approvedLessons === 0, "biology lesson is not approved");
ok(bySubject.computing.approvedLessons === 0, "computing lesson is not approved");

const summary = C.contentPlatformSummary();
ok(summary.richLessons === 3, "summary counts three lessons");
ok(summary.approvedLessons === 0, "summary reports zero approvals");
ok(summary.resourceCoverage.review >= 3, "summary reports the review pile", JSON.stringify(summary.resourceCoverage));
ok(summary.sourceBackedLessons === 3, "all three lessons have authored provenance");

// ── 5. The contract refuses the mistakes it exists to prevent ─────────────
const broken = {
  ...documents[0],
  sources: documents[0].sources.map((s) => s.use === "linked" ? { ...s, use: "authored" } : s),
};
const brokenProblems = V.validateLesson(broken);
ok(brokenProblems.some((p) => p.code === "source_authored_kind"), "a linked source relabelled as authored is refused");
const approvedWithoutHuman = {
  ...documents[0],
  review: { state: "approved" },
};
ok(V.validateLesson(approvedWithoutHuman).some((p) => p.code === "reviewer_missing"), "approval without a named reviewer is refused");
const missingAssessment = {
  ...documents[0],
  assessments: documents[0].assessments.filter((a) => a.blockId !== "calc-resistance"),
};
ok(V.validateLesson(missingAssessment).some((p) => p.code === "assessment_missing"), "an assessed block with no contract is refused");
const linkedTeaching = {
  ...documents[0],
  blocks: documents[0].blocks.map((b) => b.id === "why" ? { ...b, sourceIds: ["phet"] } : b),
};
ok(V.validateLesson(linkedTeaching).some((p) => p.code === "link_source_on_teaching"), "a linked source cannot power teaching text");

// ── 6. Report ─────────────────────────────────────────────────────────────
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: T.LESSON_SCHEMA_VERSION,
  passed,
  failed: failures.length,
  failures,
  summary,
  matrix,
  documents: documents.map((d) => ({
    id: d.id,
    conceptId: d.conceptId,
    subject: d.subject,
    review: d.review.state,
    blocks: d.blocks.map((b) => b.kind),
    assessments: d.assessments.map((a) => a.kind),
    sources: d.sources.map((s) => ({ sourceId: s.sourceId, use: s.use, title: s.title })),
  })),
  resources: R.RESOURCE_RECORDS.map((r) => ({
    id: r.id,
    sourceId: r.sourceId,
    subject: r.subject,
    requestedUse: r.requestedUse,
    ...R.decideResource(r),
  })),
};
mkdirSync("audit", { recursive: true });
writeFileSync("audit/content-platform.json", JSON.stringify(report, null, 2) + "\n");

const rows = matrix.map((r) => `| ${r.label} | ${r.concepts} | ${r.authoredPlans} | ${r.richLessons} | ${r.blockKinds.join(", ") || "—"} | ${r.responseKinds.join(", ") || "—"} | ${r.usableResources} usable / ${r.linkedResources} link / ${r.reviewResources} review |`).join("\n");
const md = [
  "# Content Platform 1.0 — measured capability",
  "",
  `Generated by \`npm run content-platform:check\`. **${passed} checks passed, ${failures.length} failed.**`,
  "",
  "This report is evidence about the code, not educator approval. A lesson document is a draft until a qualified teacher signs it.",
  "",
  "## What exists",
  "",
  `- **${summary.richLessons}** typed lesson documents (${summary.sourceBackedLessons} with authored provenance), **${summary.assessments}** assessment contracts.`,
  `- **${summary.authoredPlans}** of **${summary.concepts}** genome concepts have an authored lesson plan.`,
  `- **${summary.resourceRecords}** resource records: ${summary.resourceCoverage.ingest} ingest, ${summary.resourceCoverage.adapt} adapt, ${summary.resourceCoverage.link} link-only, ${summary.resourceCoverage.review} rights review, ${summary.resourceCoverage.reject} reject.`,
  `- **${summary.approvedLessons}** lesson documents carry educator approval.`,
  "- Review records are append-only in `content-reviews.json`; an approval is bound to the document fingerprint and stops applying when the content changes.",
  "",
  "## Capability by subject",
  "",
  "| Subject | Concepts | Authored plans | Rich lessons | Blocks | Response contracts | Resources |",
  "|---|---:|---:|---:|---|---|---|",
  rows,
  "",
  "## Resources and their decisions",
  "",
  "| Resource | Source | Requested | Outcome | Why |",
  "|---|---|---|---|---|",
  ...R.RESOURCE_RECORDS.map((r) => {
    const d = R.decideResource(r);
    return `| ${r.title} | ${r.sourceId} | ${r.requestedUse} | **${d.outcome}** | ${d.reasons.join(" ")} |`;
  }),
  "",
  "## Lessons",
  "",
  ...documents.map((d) => `- **${d.title}** (${d.subject}) — review: **${d.review.state}**; ${d.blocks.length} blocks; ${d.assessments.length} assessments; sources: ${d.sources.map((s) => `${s.sourceId} (${s.use})`).join(", ")}.`),
  "",
  "## Blockers",
  "",
  ...C.contentPlatformBlockers().map((b) => `- ${b}`),
  "",
  "## What is deliberately not claimed",
  "",
  "- No external resource is ingested. OpenStax and PhET records are link-only or held for rights review.",
  "- The computing lab executes Python in a browser iframe, not on the application server. It has not been validated against an adversarial code corpus in this report.",
  "- The three lessons are drafts. No teacher has reviewed them, and no learner evidence exists.",
  "",
  ...(failures.length ? ["## Failures", "", ...failures.map((f) => `- ${f}`), ""] : []),
].join("\n");
writeFileSync("audit/content-platform.md", md + "\n");
mkdirSync("docs", { recursive: true });
writeFileSync("docs/CONTENT_PLATFORM.md", md + "\n");

console.log(`Content platform: ${passed} passed, ${failures.length} failed.`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log("  ✓ schema, rights, coverage and mathematical equivalence");
  console.log("  → audit/content-platform.json + audit/content-platform.md + docs/CONTENT_PLATFORM.md");
}
