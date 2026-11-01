// The pilot gate. It compiles the REAL modules and drives the resolver,
// approval rule, curriculum mappings and question bank. No source-string
// assertions: every claim below is a return value.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const OUT = "reports/.pilot-verify";
// ALWAYS compile the final tree. Caching this mirror is how a new module was
// silently absent from a gate that then reported a module-not-found instead of
// testing the code. The compile is a few seconds; a stale pass is worthless.
fs.rmSync(OUT, { recursive: true, force: true });
execSync(
  `npx tsc lib/pilot.ts lib/pilot-review.ts lib/pilot-mappings.ts lib/pilot-rights.ts lib/source-registry.ts lib/questions.ts --outDir ${OUT} --rootDir . ` +
  "--module commonjs --target es2020 --skipLibCheck --esModuleInterop --strict",
  { stdio: "inherit" },
);
const require = createRequire(import.meta.url);
const P = require(`../${OUT}/lib/pilot.js`);
const M = require(`../${OUT}/lib/pilot-mappings.js`);
const L = require(`../${OUT}/lib/lesson-plans.js`);
const R = require(`../${OUT}/lib/pilot-review.js`);
const PR = require(`../${OUT}/lib/pilot-rights.js`);
const S = require(`../${OUT}/lib/source-registry.js`);
const Q = require(`../${OUT}/lib/questions.js`);

let pass = 0;
const failures = [];
const ok = (cond, label) => {
  if (cond) { pass++; return; }
  failures.push(label);
};

const ids = [...P.PILOT_SEQUENCE];
ok(ids.length === 12, `pilot is exactly 12 lessons (got ${ids.length})`);
ok(new Set(ids).size === ids.length, "no pilot concept is listed twice");
ok(ids.filter((id) => P.pilotConcept(id)?.subject === "maths").length === 8, "8 mathematics lessons");
ok(ids.filter((id) => ["physics", "chemistry", "biology"].includes(P.pilotConcept(id)?.subject)).length === 4, "4 science lessons");
ok(P.PILOT_APPROVALS.length === 0, "no approval is invented");
ok(P.approvedPilotPath().length === 0, "the learner pilot path is empty until a real review exists");
ok(P.PILOT_SUPPORTED_LANGUAGES.length === 1 && P.PILOT_SUPPORTED_LANGUAGES[0] === "en",
  "the pilot supports one teaching language, English");
ok(!P.pilotLanguageSupported("hi") && !P.pilotLanguageSupported("bn") && !P.pilotLanguageSupported("ur"),
  "Hindi, Bengali and Urdu are not silently supported");

const cov = P.pilotCoverage();
ok(cov.total === 12 && cov.needsReview === 12 && cov.approved === 0 && cov.draft === 0 && cov.unavailable === 0,
  `coverage is 12 needs-review / 0 approved (got ${JSON.stringify(cov)})`);

for (const id of ids) {
  const s = P.lessonStatus(id);
  ok(Boolean(s.plan), `${id}: resolves to an authored plan`);
  ok(s.gaps.length === 0, `${id}: structurally complete (gaps: ${s.gaps.map((g) => g.field).join(", ")})`);
  ok(s.state === "needs-educator-review", `${id}: honest state is needs-educator-review`);
  ok(s.reasons.length > 0, `${id}: explains why it is not approved`);
  ok(P.pilotWordCount(s.plan) >= 250, `${id}: at least 250 teaching words`);
}
ok(P.lessonStatus("addition").state === "unavailable-for-pilot", "a fallback concept is unavailable, not a lesson");
ok(P.lessonStatus("addition").plan === null, "a fallback concept has no plan");
ok(!P.isPilotConcept("addition"), "a fallback concept is not in the pilot path");

for (const id of ["photosynthesis", "cells", "equations-stoich", "electricity-circuits"]) {
  const plan = P.lessonStatus(id).plan;
  ok((plan.terms?.length ?? 0) >= 4, `${id}: glossary has at least four terms`);
  ok((plan.workedExamples?.length ?? 0) >= 2, `${id}: at least two authored worked examples`);
  ok((plan.recap?.length ?? 0) >= 3, `${id}: recap has at least three points`);
  ok(plan.traps.length >= 3, `${id}: at least three named traps`);
  ok(plan.idea.length >= 5, `${id}: at least five idea paragraphs`);
}

// ── Approval cannot be fabricated ───────────────────────────────────────────
const plan = P.lessonStatus("photosynthesis").plan;
const fake = {
  conceptId: "photosynthesis",
  scopeId: P.CBSE_X_PILOT.id,
  lessonVersion: "old-version",
  reviewer: "A. Teacher",
  reviewerRole: "Science teacher",
  reviewedAt: "2026-11-01",
  checklist: {
    subjectAccuracy: true, explanationQuality: true, workedExamples: true,
    questionsAndMarking: true, diagramQuality: true, languageAndTerminology: true,
    ageAppropriateness: true, accessibility: true,
  },
};
const problems = P.approvalProblems(fake, plan);
ok(problems.includes("approval is for a different lesson version"), "an old-version approval is refused");
ok(P.approvalProblems({ ...fake, lessonVersion: P.PILOT_LESSON_VERSION, reviewedAt: "not-a-date" }, plan)
  .includes("review date is not a date"), "a non-date review is refused");
ok(P.approvalProblems({ ...fake, lessonVersion: P.PILOT_LESSON_VERSION, checklist: { ...fake.checklist, accessibility: false } }, plan)
  .some((p) => p.includes("checklist incomplete")), "an incomplete checklist is refused");
ok(P.approvalProblems({ ...fake, lessonVersion: P.PILOT_LESSON_VERSION, scopeId: "some-other-school" }, plan)
  .includes("approval is for a different scope"), "approval cannot cross scopes");

// THE APPROVED BRANCH IS TESTABLE WITHOUT AN APPROVAL EXISTING IN THE PRODUCT.
// The synthetic record is passed to the resolver explicitly; `PILOT_APPROVALS`
// remains empty, so no learner path opens. This is how the gate proves the
// state machine and rendering path, not that a human reviewed anything.
const synthetic = {
  ...fake,
  lessonVersion: P.PILOT_LESSON_VERSION,
  reviewer: "Asha Rao",
  reviewerRole: "CBSE science teacher",
  reviewedAt: "2026-10-30",
  notes: "Read against the CBSE Class X Science syllabus; the limiting-factor graph and equation are correct.",
  curriculumMappingConfirmed: true,
  languageConfirmed: true,
  requiredRevisions: [],
  decision: "approve",
};
const syntheticApproval = R.approvalFromReview(synthetic);
ok(P.approvalProblems(syntheticApproval, plan).length === 0, "a complete synthetic approval passes the approval rule");
const approvedStatus = P.lessonStatus("photosynthesis", "en", P.CBSE_X_PILOT, [syntheticApproval]);
ok(approvedStatus.state === "approved-for-pilot", "an approved lesson resolves to approved-for-pilot");
ok(approvedStatus.plan?.conceptId === "photosynthesis", "the approved lesson resolves to its intended content");
ok(P.approvedPilotPath(P.CBSE_X_PILOT, [syntheticApproval]).length === 1,
  "the approved path admits the approved lesson and only that lesson");
ok(P.approvedPilotPath().length === 0, "the real registry is still empty after the synthetic test");

const reviewProblems = R.reviewProblems(synthetic, plan, P.PILOT_LESSON_VERSION);
ok(reviewProblems.length === 0, `a complete review record is valid (${reviewProblems.join("; ")})`);
ok(R.reviewProblems({ ...synthetic, reviewer: "AI reviewer" }, plan, P.PILOT_LESSON_VERSION)
  .some((p) => p.includes("must be a person")), "a tool cannot sign a review");
ok(R.reviewProblems({ ...synthetic, lessonVersion: "old" }, plan, P.PILOT_LESSON_VERSION).length > 0,
  "a review of an old lesson version is refused");
ok(R.reviewProblems({ ...synthetic, decision: "approve", checklist: { ...synthetic.checklist, accessibility: false } }, plan, P.PILOT_LESSON_VERSION).length > 0,
  "an approval with an unticked checklist is refused");
ok(R.reviewProblems({ ...synthetic, decision: "revise", requiredRevisions: [] }, plan, P.PILOT_LESSON_VERSION)
  .some((p) => p.includes("must name")), "a revision decision must name what to revise");

// ── Language is part of the scope ──────────────────────────────────────────
const hi = P.lessonStatus("photosynthesis", "hi");
ok(hi.state === "needs-educator-review", "a Hindi request is not approved English content");
ok(hi.reasons.some((r) => r.includes("English")), "the Hindi refusal names the language limit");
ok(L.planFor("photosynthesis", "hi")?.objective === L.planFor("photosynthesis", "en")?.objective,
  "no machine translation is invented for a missing medium");

// ── Curriculum provenance ──────────────────────────────────────────────────
const maps = M.pilotMappings();
ok(maps.length === 12, `all 12 concepts have a mapping (got ${maps.length})`);
ok(maps.every((m) => m.source.url.startsWith("https://")), "every mapping cites an https source");
ok(maps.every((m) => m.reviewer === null && m.reviewedAt === null), "no mapping invents a reviewer");
ok(maps.every((m) => m.status === "provisional-unreviewed"), "every mapping is provisional, not reviewed");
ok(maps.filter((m) => m.subject !== "maths").every((m) => m.source.verification === "portal"),
  "science mappings say the PDF was not machine-read");
ok(M.mappingCoverage().reviewed === 0, "0 mappings are reviewed");

// ── Rights: the registry, not a good intention ───────────────────────────────
// The source registry is separate from the existing content-rights gate. It must
// answer four questions the strategy names: is the basis known, is PRIMARY proof
// on file, may the expression be ingested, and is a link still allowed?
ok(S.SOURCE_RECORDS.length >= 20, `the source registry is populated (${S.SOURCE_RECORDS.length} records)`);
ok(maps.every((m) => Boolean(m.sourceId) && Boolean(S.sourceRecord(m.sourceId))),
  "every curriculum mapping names a registered source");
const authored = S.sourceRecord(PR.PILOT_TEXT_SOURCE_ID);
const ncert = S.sourceRecord("ncert-textbooks");
const diksha = S.sourceRecord("diksha");
const openstax = S.sourceRecord("openstax");
ok(authored && S.ingestible(authored) && S.decideUse(authored, "adapt").status === "allowed",
  "OpenMind-authored teaching may be adapted");
ok(ncert && !S.ingestible(ncert) && S.decideUse(ncert, "link").status === "link-only",
  "NCERT is link-only, never ingestible");
ok(diksha && !S.ingestible(diksha) && S.decideUse(diksha, "host").status === "blocked",
  "DIKSHA's item-level rights are unknown, so ingestion is blocked");
ok(openstax && openstax.rights.basis === "cc-by-nc-sa" && !S.ingestible(openstax),
  "a known CC basis without primary proof still blocks ingestion");
ok(openstax && S.decideUse(openstax, "link").status === "link-only",
  "the blocked OER source may still be linked");
ok(S.sourceRecord("does-not-exist") === null, "an unregistered source is not invented");
const rights = PR.pilotRightsCoverage();
ok(rights.total === 12 && rights.clear === 12 && rights.blocked === 0,
  `all 12 pilot lessons are rights-clear (${JSON.stringify(rights)})`);
ok(rights.withExternalAssets === 0, "no pilot lesson embeds an external asset");
const rightsForPhotosynthesis = PR.pilotRightsFor("photosynthesis");
ok(rightsForPhotosynthesis?.teaching?.id === PR.PILOT_TEXT_SOURCE_ID
  && rightsForPhotosynthesis?.figures?.id === PR.PILOT_FIGURE_SOURCE_ID
  && rightsForPhotosynthesis?.curriculum?.id === "cbse-10-science-2025-26"
  && rightsForPhotosynthesis?.curriculumLink.status === "link-only",
  "a pilot lesson names its authored text, authored figure and link-only curriculum source");
ok(PR.pilotRightsFor("addition") === null, "a fallback concept has no pilot rights clearance");

// ── The question bank is real, and the key is not served ───────────────────
for (const id of ids) {
  for (let i = 0; i < 8; i++) {
    const q = Q.generateQuestion(id, `pilot-gate:${i}`);
    ok(Boolean(q), `${id}: draw ${i} exists`);
    if (!q) continue;
    ok(typeof q.explanation === "string" && q.explanation.trim().length > 20, `${id}: draw ${i} has an explanation`);
    ok(q.responseKind === "numeric" || (Array.isArray(q.choices) && q.choices.length === 4), `${id}: draw ${i} has four options`);
    if (Array.isArray(q.choices)) ok(new Set(q.choices).size === q.choices.length, `${id}: draw ${i} has no duplicate option`);
    const view = Q.serveView(q);
    ok(!("answer" in view) && !("explanation" in view) && !("misconceptionTags" in view),
      `${id}: the served view withholds the key`);
  }
}

// ── A balancing item must mark the coefficients that actually balance ──────
// The generic structural checks cannot see this: `4 and 3` is four distinct
// options, has an explanation and withholds its key. It was still wrong for
// `__ Fe + O₂ → __ Fe₂O₃`, whose product coefficient is 2, not 3. Draw each
// authored balancing equation until it appears and check the marked option
// against the atom count rather than against the generator's own string.
const BALANCES = new Map([
  ["Balance: __ H₂ + O₂ → __ H₂O", "2 and 2"],
  ["Balance: __ Mg + O₂ → __ MgO", "2 and 2"],
  ["Balance: __ Al + __ Cl₂ → AlCl₃", "2 and 3"],
  ["Balance: __ Fe + O₂ → __ Fe₂O₃", "4 and 2"],
  ["Balance: __ C₃H₈ + __ O₂ → 3CO₂ + 4H₂O", "1 and 5"],
]);
const seenBalances = new Set();
for (let i = 0; i < 600 && seenBalances.size < BALANCES.size; i++) {
  const q = Q.generateQuestion("equations-stoich", `pilot-balance:${i}`);
  if (!q || !BALANCES.has(q.prompt)) continue;
  const expected = BALANCES.get(q.prompt);
  const marked = q.choices?.[q.answer];
  ok(marked === expected, `balancing key is ${expected} for ${q.prompt} (got ${marked})`);
  seenBalances.add(q.prompt);
}
ok(seenBalances.size === BALANCES.size,
  `every authored balancing equation is reachable (${seenBalances.size}/${BALANCES.size})`);

// ── Uniqueness: the same teaching must not be pasted under twelve names ────
const tokens = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((w) => w.length > 3));
const docs = ids.map((id) => {
  const p = P.lessonStatus(id).plan;
  return { id, set: tokens([p.objective, p.intuition, ...p.idea, ...p.traps.map((t) => t.move + " " + t.why), p.usedFor].join(" ")) };
});
let max = 0, pair = "";
for (let i = 0; i < docs.length; i++) for (let j = i + 1; j < docs.length; j++) {
  let inter = 0; for (const w of docs[i].set) if (docs[j].set.has(w)) inter++;
  const sim = inter / (docs[i].set.size + docs[j].set.size - inter || 1);
  if (sim > max) { max = sim; pair = `${docs[i].id}/${docs[j].id}`; }
}
ok(max < 0.35, `no two pilot lessons are near-duplicates (max ${max.toFixed(3)} at ${pair})`);

console.log(`Pilot gate: ${pass} passed, ${failures.length} failed.`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
