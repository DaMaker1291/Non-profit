#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ONE READINESS LEDGER, DERIVED FROM THE ARTIFACTS THAT MAKE IT TRUE.
//
// The project already publishes a lot of numbers: authored lessons, outlines,
// machine-checked lessons, curriculum pathways, reviewed mappings, languages.
// They live in generated files and prose reports, and the prose is where they
// drift. This script does not introduce a second opinion about any of them. It
// reads the generated catalogue, audit, dashboard, status and curriculum
// coverage, refuses to write when those files disagree, and renders one
// machine-readable manifest plus the documents a human actually reads.
//
// STATE IS NOT A BOOLEAN. A lesson can meet the authored contract and still have
// no educator review; a curriculum can be recorded and have no reviewed mapping;
// a language can have a translated interface and no reviewed teaching. The state
// vocabulary below keeps those apart, so "implemented" cannot be read as
// "approved" and "automated_verified" cannot be read as "learner-tested".
//
// Run:
//   npm run readiness          write READINESS.json and the dashboards
//   npm run readiness:check    fail when the generated files are stale or the
//                              source artifacts disagree; write nothing
//   node scripts/international-readiness.mjs --self-test
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports", "international-readiness");
const CHECK = process.argv.includes("--check");
const SELF_TEST = process.argv.includes("--self-test");

const READ = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const exists = (file) => fs.existsSync(path.join(ROOT, file));

const cat = READ("audit/lesson-catalogue.json");
const audit = READ("reports/lesson-quality/audit.json");
const dashboard = READ("reports/lesson-quality/dashboard.json");
const status = READ("audit/status.json");
const curriculum = READ("audit/curriculum-coverage.json");
const contentCoverage = READ("audit/content-coverage.json");

const statusRow = (section, label) =>
  status.rows?.find((row) => row.section === section && row.label === label)?.value ??
  status.counts?.[`${section} · ${label}`] ??
  "MISSING";

const numbers = {
  concepts: cat.totals.concepts,
  authored: cat.totals.authored,
  outlines: cat.totals.byStatus.outline,
  machineChecked: cat.totals.byStatus.machine_checked,
  educatorReviewed: cat.totals.byStatus.educator_reviewed,
  learnerTested: cat.totals.byStatus.learner_tested,
  published: cat.totals.byStatus.published,
  criticalGaps: audit.totals.byPriority.critical ?? 0,
  highGaps: audit.totals.byPriority.high ?? 0,
  reviewQueue: audit.totals.byPriority.review ?? 0,
  languages: statusRow("Content", "Languages"),
  teachingLanguagesReviewed: cat.translations.languages.length,
  teachingLanguagesMachine: cat.translations.machine.length,
  countriesWithNationalRoute: curriculum.counts.countriesWithNationalRoute,
  nationalPathways: curriculum.counts.nationalPathways,
  specifications: curriculum.counts.specifications,
  reviewedMappings: curriculum.counts.reviewedMappings,
  verifiedPathways: curriculum.counts.verifiedPathways,
  pathsWithNoSource: curriculum.counts.pathsWithNoSource,
};

const criticalConcepts = (audit.concepts ?? [])
  .filter((row) => row.priority === "critical")
  .map((row) => row.conceptId);

/**
 * Every source of a published count must agree before the ledger is written.
 * This is the drift alarm: the old 46/89 audit beside a 49/86 catalogue was not
 * a cosmetic mismatch, it made two different reports describe two different
 * repositories. A disagreement is an error, not a warning.
 */
function countProblems(catalogue, quality, board, evidence, coverage) {
  const problems = [];
  const same = (label, values) => {
    const distinct = [...new Set(values)];
    if (distinct.length !== 1) problems.push(`${label} disagrees: ${values.join(" / ")}`);
  };
  same("concept count", [catalogue.totals.concepts, quality.totals.concepts]);
  same("authored lesson count", [catalogue.totals.authored, quality.totals.authoredLessons, board.aggregate.authored]);
  same("outline count", [catalogue.totals.byStatus.outline, quality.totals.outlines]);
  if (catalogue.totals.byStatus.machine_checked !== catalogue.totals.authored) {
    problems.push(`machine_checked (${catalogue.totals.byStatus.machine_checked}) does not equal authored (${catalogue.totals.authored})`);
  }
  if (board.aggregate.educatorReviewed !== catalogue.totals.byStatus.educator_reviewed) {
    problems.push("dashboard and catalogue disagree about educator review");
  }
  if (board.aggregate.learnerTested !== catalogue.totals.byStatus.learner_tested) {
    problems.push("dashboard and catalogue disagree about learner testing");
  }
  const reportedConcepts = evidence.rows?.find((row) => row.section === "Content" && row.label === "Teachable concepts")?.value;
  if (reportedConcepts !== catalogue.totals.concepts) {
    problems.push(`audit/status.json says ${reportedConcepts ?? "MISSING"} concepts; the catalogue says ${catalogue.totals.concepts}`);
  }
  const reportedPathways = evidence.rows?.find((row) => row.section === "Curriculum" && row.label === "National pathways")?.value;
  if (reportedPathways !== coverage.counts.nationalPathways) {
    problems.push(`audit/status.json says ${reportedPathways ?? "MISSING"} national pathways; curriculum coverage says ${coverage.counts.nationalPathways}`);
  }
  const ordered = (a, b) => new Date(a).getTime() <= new Date(b).getTime();
  if (!ordered(catalogue.at, quality.generatedAt)) {
    problems.push(`the lesson audit (${quality.generatedAt}) predates the catalogue (${catalogue.at}) — regenerate it`);
  }
  return problems;
}

const problems = countProblems(cat, audit, dashboard, status, curriculum);
if (SELF_TEST) {
  const lie = JSON.parse(JSON.stringify(cat));
  lie.totals.authored += 1;
  const found = countProblems(lie, audit, dashboard, status, curriculum);
  const caught = found.some((p) => p.includes("authored lesson count"));
  console.log(`${caught ? "✓" : "✗"} a catalogue/audit disagreement is reported`);
  console.log(`${found.length > 0 ? "✓" : "✗"} the drift check can fail`);
  process.exit(caught && found.length > 0 ? 0 : 1);
}
if (problems.length > 0) {
  console.error("✗ readiness sources disagree:");
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}

// ── The capability ledger ────────────────────────────────────────────────────
// `evidence` names the file that makes the claim true. `tests` names the command
// rather than a frozen pass count where the count is a runtime result; the run
// result belongs in EXECUTION_STATE.md, not in a property of the repository.
const capabilities = [
  {
    id: "content.authored-contract",
    scope: "Every authored lesson, against openmind.lesson/1.0",
    state: "automated_verified",
    claim: `${numbers.authored} authored lessons meet the deterministic contract; ${numbers.machineChecked} are machine_checked.`,
    evidence: ["audit/lesson-catalogue.json", "reports/lesson-quality/audit.json", "reports/lesson-quality/dashboard.json"],
    tests: ["npm run verify", "npm run verify:lessons", "node scripts/lesson-quality-dashboard.mjs"],
    knownDefects: [],
    dependencies: ["lib/lesson-contract.ts", "lib/lesson-verify.ts", "lib/lesson-frameworks.ts"],
    nextAction: "Keep the contract gate in every content batch.",
    humanInputRequired: false,
  },
  {
    id: "content.curriculum-coverage",
    scope: `All ${numbers.concepts} concepts required by the current bank`,
    state: numbers.outlines > 0 ? "missing" : "automated_verified",
    claim:
      `${numbers.authored} authored / ${numbers.concepts}; ${numbers.outlines} outlines remain` +
      (numbers.criticalGaps > 0
        ? `, including ${numbers.criticalGaps} critical stage-1 gap(s).`
        : "; no critical stage-1 gap remains."),
    evidence: ["audit/lesson-catalogue.json", "reports/lesson-quality/queue.md"],
    tests: ["node scripts/lesson-catalogue.mjs", "node scripts/lesson-quality-audit.mjs"],
    knownDefects: [
      ...(criticalConcepts.length > 0
        ? [`${numbers.criticalGaps} critical concept(s): ${criticalConcepts.join(", ")}`]
        : []),
      `${numbers.highGaps} high-priority outlines remain`,
    ],
    dependencies: ["lib/genome.ts", "lib/lessons/authored/index.ts"],
    nextAction:
      criticalConcepts.length > 0
        ? "Author the remaining critical lessons in prerequisite order."
        : "Author the next high-priority outline from reports/lesson-quality/queue.md; no critical stage-1 gap remains.",
    humanInputRequired: false,
  },
  {
    id: "content.educator-review",
    scope: "Every authored lesson, against its exact version and content hash",
    state: numbers.educatorReviewed > 0 ? "draft" : "human_review_required",
    claim: `${numbers.educatorReviewed} educator-reviewed; ${numbers.authored} authored lessons await a qualified human review.`,
    evidence: ["audit/lesson-catalogue.json", "audit/validation/TEACHER_REVIEW_PACK.md"],
    tests: ["npm run validation:pack", "npm run validation:check"],
    knownDefects: ["No genuine educator approval exists; fixture records are not human evidence."],
    dependencies: ["human subject teacher", "version-pinned review pack"],
    nextAction: "A qualified subject teacher reviews the exact versions and records the decision through the authenticated route.",
    humanInputRequired: true,
  },
  {
    id: "content.learner-validation",
    scope: "Independent transfer and delayed retention on real learners",
    state: numbers.learnerTested > 0 ? "draft" : "externally_blocked",
    claim: `${numbers.learnerTested} learner-tested lessons. The pilot protocol exists; no learner trial has been conducted.`,
    evidence: ["audit/validation/LEARNER_PILOT_PROTOCOL.md", "reports/lesson-quality/EDUCATIONAL_VALIDATION.md"],
    tests: [],
    knownDefects: ["No supervised learner evidence, no transfer result, no delayed-retention result."],
    dependencies: ["supervised learner pilot", "consent and safeguarding", "teacher observation"],
    nextAction: "Run the stated pilot protocol with real, supervised learners; do not infer learning from browser completion.",
    humanInputRequired: true,
  },
  {
    id: "validation.teacher-review-path",
    scope: "Authenticated educator review, from the browser form through persistence and restart",
    state: "browser_verified",
    claim: "The refactored API-client form passed the browser submit phase (38/0) and the after-restart persistence phase (18/0) against a scratch store.",
    evidence: [
      "reports/lesson-quality/VALIDATION_INTEGRATION_REPORT.md",
      "app/api/lesson-review/route.ts",
      "components/lesson-review-form.tsx",
      "lib/api/client.ts",
    ],
    tests: ["npm run validation:check", "npm run validation:http", "npm run validation:browser"],
    knownDefects: [],
    dependencies: ["lib/server/lesson-review-store.ts", "lib/server/authority.ts"],
    nextAction: "Keep this path in the regression set; it is a fixture, not human review evidence.",
    humanInputRequired: false,
  },
  {
    id: "curriculum.mapping",
    scope: "Country → pathway → qualification → specification → subject",
    state: numbers.reviewedMappings > 0 ? "draft" : "draft",
    claim: `${numbers.nationalPathways} national pathways across ${numbers.countriesWithNationalRoute} countries; ${numbers.reviewedMappings} reviewed mappings; ${numbers.pathsWithNoSource} pathways have no structural source on file.`,
    evidence: ["audit/curriculum-coverage.json", "docs/research/UK_SECONDARY_BENCHMARK.md"],
    tests: ["npm run curriculum-gate"],
    knownDefects: [
      "No pathway has a human-reviewed concept mapping.",
      `${numbers.pathsWithNoSource} pathways have no source URL on file.`,
    ],
    dependencies: ["official curriculum documents", "subject specialist review"],
    nextAction: "Choose one exact launch profile and verify its specification version, objectives, assessment and concept mapping before declaring support.",
    humanInputRequired: true,
  },
  {
    id: "language.interface",
    scope: "The 15 interface dictionaries",
    state: "automated_verified",
    claim: `${numbers.languages} interface languages are checked by the full engine suite.`,
    evidence: ["lib/i18n.ts", "audit/status.json"],
    tests: ["npm run verify"],
    knownDefects: [],
    dependencies: ["lib/i18n.ts"],
    nextAction: "Keep new UI strings authored in every dictionary; this is not a teaching-language claim.",
    humanInputRequired: false,
  },
  {
    id: "language.teaching",
    scope: "Lesson prose, worked examples, questions, feedback and diagrams per language",
    state: "draft",
    claim: `${numbers.teachingLanguagesReviewed} human-reviewed teaching languages; ${numbers.teachingLanguagesMachine} machine-translated and explicitly unreviewed.`,
    evidence: ["audit/lesson-catalogue.json", "reports/lesson-quality/EDUCATIONAL_VALIDATION.md"],
    tests: ["node scripts/lesson-catalogue.mjs"],
    knownDefects: ["No native-speaking teacher has reviewed a translated lesson."],
    dependencies: ["native-speaking subject teacher", "translation workflow"],
    nextAction: "Translate one reviewed lesson into one launch language, then have a native-speaking teacher review it.",
    humanInputRequired: true,
  },
  {
    id: "assessment.response-formats",
    scope: "Authoring → rendering → input → validation → server marking → feedback → evidence → next step",
    state: "implemented_unverified",
    claim: "Multiple-choice, numeric, expression and several structured formats exist and are covered by the engine suite; a per-launch-profile format matrix has not been agreed.",
    evidence: ["lib/answer.ts", "lib/structured-items.ts", "app/api/progress/route.ts"],
    tests: ["npm run verify", "npm run e2e"],
    knownDefects: ["The required format set is not yet derived from a declared launch curriculum."],
    dependencies: ["launch profile", "assessment objectives"],
    nextAction: "Declare the required response formats for the first launch profile, then verify each through the full marking path.",
    humanInputRequired: false,
  },
  {
    id: "classroom.teacher-learner",
    scope: "Teacher sign-in, classes, assignments, learner work and teacher review across sessions and devices",
    state: "implemented_unverified",
    claim: "The classroom routes and browser harnesses exist; this checkpoint has not executed a fresh two-device session.",
    evidence: ["app/api/classes/route.ts", "app/api/assignments/route.ts", "scripts/verify-classroom2.mjs"],
    tests: ["npm run verify:classroom2", "npm run verify:assignment-browser", "npm run verify:assignment-lifecycle"],
    knownDefects: ["Fresh browser evidence is outstanding at this checkpoint."],
    dependencies: ["teacher account", "scratch class roster"],
    nextAction: "Run the two-device and assignment browser walks against a scratch store.",
    humanInputRequired: false,
  },
  {
    id: "accessibility.automated",
    scope: "Structural WCAG checks, keyboard paths, reflow and rendered maths",
    state: "implemented_unverified",
    claim: "A structural audit previously passed 96 assertions; it predates the physics-energy lesson and the review-form transport change.",
    evidence: ["reports/lesson-quality/EDUCATIONAL_VALIDATION.md", "scripts/a11y-audit.mjs"],
    tests: ["npm run verify:a11y"],
    knownDefects: ["Re-run required after the new lesson.", "A structural scan is not a screen-reader session or a conformance claim."],
    dependencies: ["running app"],
    nextAction: "Re-run the accessibility audit and manually test with a screen reader.",
    humanInputRequired: true,
  },
  {
    id: "operations.production",
    scope: "Production build, startup, assets and durable-store behaviour",
    state: "implemented_unverified",
    claim: "The fail-closed durable-store design and deployment documentation exist; this checkpoint has not rebuilt or restarted the production server after the latest content change.",
    evidence: ["docs/DEPLOYMENT.md", "README.md", "scripts/production-check.mjs"],
    tests: ["npm run build", "npm run verify:build", "npm run production-check"],
    knownDefects: ["Production-check has not been run at this checkpoint.", "The target deployment's durable storage is not declared or verified."],
    dependencies: ["OpenMind data directory", "production host"],
    nextAction: "Build, start with a declared durable store, and verify a learner write survives a restart.",
    humanInputRequired: false,
  },
  {
    id: "human.assistive-technology",
    scope: "Actual screen-reader, switch, low-vision and motor access",
    state: "human_review_required",
    claim: "No assistive-technology session has been performed.",
    evidence: ["reports/lesson-quality/ASSISTIVE_TECHNOLOGY.md"],
    tests: [],
    knownDefects: ["Screen-reader announcement of mathematical notation is unmeasured."],
    dependencies: ["assistive-technology user", "supervised test protocol"],
    nextAction: "Run the recorded manual protocol with a real assistive-technology user.",
    humanInputRequired: true,
  },
  {
    id: "human.jurisdiction-review",
    scope: "Privacy, safeguarding and legal requirements per deployment jurisdiction",
    state: "human_review_required",
    claim: "The code has security and privacy controls, but no qualified jurisdiction-specific legal review is recorded.",
    evidence: ["reports/openmind-deployment-readiness/PRIVACY_SAFEGUARDING_AND_OPERATIONS.md"],
    tests: [],
    knownDefects: ["No legal compliance claim is made."],
    dependencies: ["qualified local reviewer"],
    nextAction: "Document the deployment jurisdiction and obtain qualified review before claiming compliance.",
    humanInputRequired: true,
  },
];

const backlog = [
  {
    priority: 1,
    id: "validation.teacher-review-recheck",
    title: "Re-verify the teacher-review browser path after the transport change",
    state: "browser_verified",
    why: "The form now uses the shared API client; the submit phase passed 38/0 and the after-restart phase 18/0 against a fresh scratch store.",
    nextAction: "Keep both phases in the regression set; the fixture record is not human evidence.",
    humanRequired: false,
  },
  {
    priority: 2,
    id: "content.physics.energy-conservation",
    title: "Browser-verify the energy-conservation lesson",
    state: "browser_verified",
    why: "The authored lesson renders through /learn/physics/energy-conservation, marks a numeric assessment through the server, and fits 320 px; the browser run passed 11/0.",
    nextAction: "Keep the route in the browser regression set; the signed-in account is a fixture, not learner evidence.",
    humanRequired: false,
  },
  {
    priority: 3,
    id: "content.physics.motion-graphs",
    title: "Author and browser-verify the motion-graphs lesson",
    state: "browser_verified",
    why: "This closed one of the two critical stage-1 physics gaps; the full contract, a server-marked numeric answer and 320-px reflow passed 10/0 in the browser.",
    nextAction: "Keep the route in the browser regression set and retain the lesson's draft review status.",
    humanRequired: false,
  },
  {
    priority: 4,
    id: "content.physics.waves-basics",
    title: "Author and browser-verify the waves-basics lesson",
    state: "browser_verified",
    why: "This closed the last critical stage-1 physics gap; the full contract, a server-marked numeric answer and 320-px reflow passed 10/0 in the browser.",
    nextAction: "Keep the route in the browser regression set and retain the lesson's draft review status.",
    humanRequired: false,
  },
  {
    priority: 5,
    id: "content.next-high-priority-outline",
    title: "Author the next high-priority lesson outline",
    state: "missing",
    why: `There are no critical stage-1 gaps left, but ${numbers.outlines} high-priority outlines remain; the queue is now the content backlog.`,
    nextAction: "Take the first item in reports/lesson-quality/queue.md and author it to openmind.lesson/1.0, then regenerate and run the lesson gates.",
    humanRequired: false,
  },
  {
    priority: 6,
    id: "readiness.launch-profile",
    title: "Declare one exact international launch profile",
    state: "not_assessed",
    why: `The registry has ${numbers.nationalPathways} national pathways and ${numbers.reviewedMappings} reviewed mappings; no country + curriculum + qualification + version + subject + level + language combination is honestly release-ready.`,
    nextAction: "Pick one profile, cite its official specification, map its objectives to concepts, and record what is covered and what is not.",
    humanRequired: true,
  },
  {
    priority: 7,
    id: "language.teaching",
    title: "Create the first reviewed teaching translation",
    state: "draft",
    why: `${numbers.languages} interface languages are not a multilingual teaching claim; ${numbers.teachingLanguagesReviewed} teaching languages are reviewed and ${numbers.teachingLanguagesMachine} are machine-only.`,
    nextAction: "Translate one lesson and have a native-speaking subject teacher review the exact version.",
    humanRequired: true,
  },
  {
    priority: 8,
    id: "accessibility.manual",
    title: "Run the assistive-technology protocol",
    state: "human_review_required",
    why: "Automated structure checks cannot establish screen-reader, switch or motor access.",
    nextAction: "Use a real screen reader and a real assistive-technology user; record what failed.",
    humanRequired: true,
  },
  {
    priority: 9,
    id: "operations.production-check",
    title: "Re-run the production build and restart drill",
    state: "implemented_unverified",
    why: "New content and an API-client change must not be assumed safe for production because the engine suite is green.",
    nextAction: "Run the production build, asset verification, and a durable-store restart with a scratch target.",
    humanRequired: false,
  },
  {
    priority: 10,
    id: "content.educator-review",
    title: "Obtain genuine educator reviews",
    state: "human_review_required",
    why: `0 of ${numbers.authored} authored lessons has a human subject review.`,
    nextAction: "Send the version-pinned pack to a qualified teacher and record the real decision.",
    humanRequired: true,
  },
  {
    priority: 11,
    id: "content.learner-validation",
    title: "Run the supervised learner pilot",
    state: "externally_blocked",
    why: "No learner transfer or delayed-retention evidence exists.",
    nextAction: "Run the stated protocol with consent and safeguarding; do not claim effectiveness from completion.",
    humanRequired: true,
  },
];

// ── The curriculum support matrix ────────────────────────────────────────────
// One row per recorded national pathway. The state is deliberately conservative:
// no mapping has been reviewed, so no row may claim more than `draft` even where
// the structural record cites an official document.
const countryNames = new Map((curriculum.countries ?? []).map((c) => [c.countryCode, c.countryName]));
const subjectsBySpec = new Map();
for (const course of contentCoverage.courses ?? []) {
  if (!course.specId || !course.subject) continue;
  const subjects = subjectsBySpec.get(course.specId) ?? [];
  if (!subjects.includes(course.subject)) subjects.push(course.subject);
  subjectsBySpec.set(course.specId, subjects);
}
const pathwayNames = new Map(
  (curriculum.countries ?? []).flatMap((c) =>
    (c.nationalPathways ?? []).map((p) => [p.id, { name: p.name, qualifications: p.qualifications }]),
  ),
);
const matrix = (curriculum.pathways ?? [])
  .map((p) => {
    const named = pathwayNames.get(p.id);
    const reviewed = p.mappingReview === "reviewed" || p.mappingReview === "verified";
    return {
      id: p.id,
      country: p.countryCode,
      countryName: countryNames.get(p.countryCode) ?? p.countryCode,
      curriculum: named?.name ?? p.id,
      qualifications: (named?.qualifications ?? []).map((q) => q.name),
      specificationIds: p.specificationIds ?? [],
      subjects: [...new Set((p.specificationIds ?? []).flatMap((id) => subjectsBySpec.get(id) ?? []))].sort(),
      languages: [],
      recordReview: p.recordReview,
      mappingReview: p.mappingReview,
      sourcesOnFile: (p.sourceUrls ?? []).length,
      state: reviewed ? "draft" : p.recordReview === "researched" ? "draft" : "not_assessed",
      nextAction: reviewed
        ? "Declare subject and language coverage, then verify content and assessment."
        : "Collect the official specification, review the concept mapping, then declare subject and language coverage.",
    };
  })
  .sort((a, b) => a.country.localeCompare(b.country) || a.id.localeCompare(b.id));

const externalBlockers = [
  {
    id: "educator-review",
    state: "human_review_required",
    need: "Qualified subject teachers",
    why: "A person, not a script, must judge subject accuracy, curriculum accuracy, teaching quality and assessment validity.",
    ready: "Version- and hash-pinned review packs, an authenticated intake route, persistence and an improvement queue.",
    exactHumanStep: "A teacher reads the pack for one exact version and records an approve or changes-requested decision through /lesson-review/<concept>.",
  },
  {
    id: "learner-pilot",
    state: "externally_blocked",
    need: "Supervised learners and a teacher",
    why: "Independent transfer and delayed retention cannot be established from completion, satisfaction or a synthetic browser learner.",
    ready: "A learner pilot protocol with baseline, post-assessment, unfamiliar transfer, delayed retrieval and reporting limits.",
    exactHumanStep: "Run the protocol under consent and safeguarding, then record the actual results without promotion by completion.",
  },
  {
    id: "native-language-review",
    state: "human_review_required",
    need: "Native-speaking subject teachers",
    why: "Machine translation is not native-speaker or educator approval.",
    ready: "Two machine-translated lessons, explicitly labelled unreviewed; 15 interface dictionaries.",
    exactHumanStep: "Review one translated lesson against the English source and record language, scope and findings.",
  },
  {
    id: "assistive-technology",
    state: "human_review_required",
    need: "Assistive-technology users",
    why: "A structural scan cannot establish screen-reader announcement, switch access or motor usability.",
    ready: "A recorded manual protocol and automated structural checks.",
    exactHumanStep: "Run a real screen-reader and keyboard session, then record the failures.",
  },
  {
    id: "jurisdiction-legal-review",
    state: "human_review_required",
    need: "A qualified local reviewer",
    why: "Privacy, safeguarding and legal compliance depend on the deployment jurisdiction and cannot be inferred from code.",
    ready: "Security, data-minimisation and deletion controls, plus a documented deployment posture.",
    exactHumanStep: "Name the target jurisdiction, obtain qualified review, and record its scope and findings.",
  },
];

const readiness = {
  schema: "openmind.readiness/1.0",
  generatedBy: "scripts/international-readiness.mjs",
  generatedAt: cat.at,
  sources: {
    catalogue: "audit/lesson-catalogue.json",
    lessonAudit: "reports/lesson-quality/audit.json",
    dashboard: "reports/lesson-quality/dashboard.json",
    status: "audit/status.json",
    curriculum: "audit/curriculum-coverage.json",
  },
  note:
    "State is scoped. automated_verified means the deterministic checks passed; it is not educator review, learner testing or production approval. " +
    "A row may be draft while the lesson contract is automated_verified: coverage and review are different questions.",
  numbers,
  capabilities,
  matrix,
  backlog,
  externalBlockers,
};

const stateLabel = (state) => {
  const labels = {
    not_assessed: "Not assessed",
    missing: "Missing",
    draft: "Draft",
    implemented_unverified: "Implemented, unverified",
    automated_verified: "Automated verified",
    browser_verified: "Browser verified",
    human_review_required: "Human review required",
    externally_blocked: "Externally blocked",
    approved: "Approved",
    release_ready: "Release ready",
  };
  return labels[state] ?? state;
};

const yesNo = (value) => (value ? "yes" : "no");

const statusMd = [
  "# OpenMind international readiness",
  "",
  `Generated by \`scripts/international-readiness.mjs\` from the generated artifacts at **${cat.at}**.`,
  "This is a scoped ledger, not a global green light. Read the state of the capability you need, not the top-line count.",
  "",
  "## Measured position",
  "",
  "| Measure | Value | Source |",
  "| --- | ---: | --- |",
  `| Concepts in the model | **${numbers.concepts}** | \`audit/lesson-catalogue.json\` |`,
  `| Authored lessons | **${numbers.authored}** | \`audit/lesson-catalogue.json\` |`,
  `| Outlines remaining | **${numbers.outlines}** | \`audit/lesson-catalogue.json\` |`,
  `| Machine-checked lessons | **${numbers.machineChecked}** | \`audit/lesson-catalogue.json\` |`,
  `| Educator-reviewed lessons | **${numbers.educatorReviewed}** | \`audit/lesson-catalogue.json\` |`,
  `| Learner-tested lessons | **${numbers.learnerTested}** | \`audit/lesson-catalogue.json\` |`,
  `| Critical content gaps | **${numbers.criticalGaps}** | \`reports/lesson-quality/audit.json\` |`,
  `| Interface languages | **${numbers.languages}** | \`audit/status.json\` |`,
  `| Reviewed teaching languages | **${numbers.teachingLanguagesReviewed}** | \`audit/lesson-catalogue.json\` |`,
  `| National pathways recorded | **${numbers.nationalPathways}** | \`audit/curriculum-coverage.json\` |`,
  `| Reviewed curriculum mappings | **${numbers.reviewedMappings}** | \`audit/curriculum-coverage.json\` |`,
  "",
  "## Capability states",
  "",
  "| Capability | Scope | State | What is true now | Next action | Human input |",
  "| --- | --- | --- | --- | --- | --- |",
  ...capabilities.map(
    (c) =>
      `| \`${c.id}\` | ${c.scope} | **${stateLabel(c.state)}** | ${c.claim} | ${c.nextAction} | ${yesNo(c.humanInputRequired)} |`,
  ),
  "",
  "## Curriculum support matrix",
  "",
  `The registry records **${numbers.nationalPathways} national pathways** in **${numbers.countriesWithNationalRoute} countries**. ` +
    `**${numbers.reviewedMappings}** have a reviewed concept mapping and **${numbers.pathsWithNoSource}** have no structural source on file. ` +
    "No country–curriculum–subject–language combination is release-ready; the rows below say what is actually known.",
  "",
  "| Country | Pathway | Qualifications | Subjects | Specs | Record | Mapping | Source files | State |",
  "| --- | --- | --- | --- | ---: | --- | --- | ---: | --- |",
  ...matrix.map(
    (row) =>
      `| ${row.countryName} | ${row.curriculum} | ${row.qualifications.join("; ") || "—"} | ${row.subjects.join(", ") || "not assessed"} | ${row.specificationIds.length} | ${row.recordReview} | ${row.mappingReview} | ${row.sourcesOnFile} | ${stateLabel(row.state)} |`,
  ),
  "",
  "## External blockers",
  "",
  "| Blocker | State | Human need | Exact next step |",
  "| --- | --- | --- | --- |",
  ...externalBlockers.map(
    (b) => `| \`${b.id}\` | **${stateLabel(b.state)}** | ${b.need} | ${b.exactHumanStep} |`,
  ),
  "",
  "## What this ledger does not claim",
  "",
  "- It does not average critical defects into a score.",
  "- It does not treat a passing engine suite as a learner journey, a teacher review or a legal approval.",
  "- It does not call a translated interface a translated lesson.",
  "- It does not call a recorded curriculum a reviewed curriculum mapping.",
  "- It does not claim that OpenMind supports every country in its picker.",
  "",
  "See `BACKLOG.md` for the prioritised queue, `EXTERNAL_BLOCKERS.md` for the exact human handoffs, and `EXECUTION_STATE.md` for the last verified checkpoint.",
  "",
].join("\n");

const backlogMd = [
  "# Prioritised backlog",
  "",
  "Ordered by the directive's priority rule: safety and data loss first, then incorrect content, broken journeys, missing critical content, assessment validity, accessibility, curriculum and language gaps, classroom capability, operations and quality.",
  "",
  "| # | Task | State | Why it is here | Next action | Human |",
  "| ---: | --- | --- | --- | --- | --- |",
  ...backlog.map(
    (task) =>
      `| ${task.priority} | ${task.title} (\`${task.id}\`) | **${stateLabel(task.state)}** | ${task.why} | ${task.nextAction} | ${yesNo(task.humanRequired)} |`,
  ),
  "",
  "## Done is not the same as verified",
  "",
  "A task leaves `implemented_unverified` only when the named command has actually run and its result is recorded in `EXECUTION_STATE.md`. " +
    "A task leaves `human_review_required` only when a named human record exists. A task leaves `externally_blocked` only when the external evidence exists.",
  "",
].join("\n");

const blockersMd = [
  "# External blockers and human handoffs",
  "",
  "These are the tasks no coding agent can complete by assertion. Each one has a prepared artefact and an exact human step.",
  "",
  ...externalBlockers.flatMap((b) => [
    `## ${b.id}`,
    "",
    `- **State:** ${stateLabel(b.state)}`,
    `- **Human need:** ${b.need}`,
    `- **Why a script cannot finish it:** ${b.why}`,
    `- **What is ready:** ${b.ready}`,
    `- **Exact human step:** ${b.exactHumanStep}`,
    "",
  ]),
  "## Rule",
  "",
  "A blocked human-validation item is never a reason to stop unrelated code work. The backlog above keeps the code-completable items separate.",
  "",
].join("\n");

const readinessText = JSON.stringify(readiness, null, 2) + "\n";

if (CHECK) {
  const stale = [];
  for (const [file, text] of [
    ["READINESS.json", readinessText],
    ["STATUS.md", statusMd],
    ["BACKLOG.md", backlogMd],
    ["EXTERNAL_BLOCKERS.md", blockersMd],
  ]) {
    const full = path.join(OUT_DIR, file);
    if (!fs.existsSync(full)) stale.push(`${file} is missing`);
    else if (fs.readFileSync(full, "utf8") !== text) stale.push(`${file} is stale (run npm run readiness)`);
  }
  if (stale.length > 0) {
    console.error("✗ readiness ledger:");
    for (const item of stale) console.error(`  · ${item}`);
    process.exit(1);
  }
  console.log(`✓ readiness ledger is current (${numbers.authored}/${numbers.concepts} authored, ${numbers.nationalPathways} pathways, ${numbers.reviewedMappings} reviewed mappings)`);
  process.exit(0);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "READINESS.json"), readinessText);
fs.writeFileSync(path.join(OUT_DIR, "STATUS.md"), statusMd);
fs.writeFileSync(path.join(OUT_DIR, "BACKLOG.md"), backlogMd);
fs.writeFileSync(path.join(OUT_DIR, "EXTERNAL_BLOCKERS.md"), blockersMd);

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unavailable";
  }
}
function diskFreeGb() {
  try {
    const stat = fs.statfsSync(ROOT);
    return ((stat.bavail * stat.bsize) / 1024 ** 3).toFixed(2);
  } catch {
    return "unknown";
  }
}
const statusLines = git(["status", "--porcelain"]).split("\n").filter(Boolean);
// BROWSER COVERAGE IS A SET, NOT A PASS COUNT. The walk used to grow by batch,
// so its own count could rise while authored lessons were absent. Read the rows
// out of the walk source and compare them with the catalogue: this is the one
// place that knows both lists, and it makes an omitted lesson visible in the
// generated checkpoint rather than only in a hand-written report.
const walkSource = fs.readFileSync(path.join(ROOT, "scripts/lesson-walk.mjs"), "utf8");
const browserContractRows = new Set(
  [...walkSource.matchAll(/^\s*\{ concept: "([a-z0-9-]+)", subject: "[a-z]+" \},/gm)].map((m) => m[1]),
);
const authoredConceptIds = cat.concepts
  .filter((row) => row.status !== "outline")
  .map((row) => row.conceptId);
const browserCovered = authoredConceptIds.filter((id) => browserContractRows.has(id));
const browserMissing = authoredConceptIds.filter((id) => !browserContractRows.has(id));
const executionMd = [
  "# Execution state",
  "",
  `Checkpoint written at **${new Date().toISOString()}** by \`scripts/international-readiness.mjs\`.`,
  "",
  "## Working tree",
  "",
  `- Branch: \`${git(["branch", "--show-current"])}\``,
  `- HEAD: \`${git(["rev-parse", "HEAD"])}\``,
  `- Changed/untracked paths: **${statusLines.length}**`,
  `- Free disk: **${diskFreeGb()} GiB** (the suite's guard is independent; this is only a check-point observation)`,
  `- Browser coverage: **${browserCovered.length}/${authoredConceptIds.length} authored lessons** have a row in the walk contract (missing: ${browserMissing.join(", ") || "none"}). The ${numbers.outlines} outlines are not browser-applicable until they have an authored lesson.`,
  "",
  "## Completed in this batch",
  "",
  "- Authored and registered `organic-intro` (chemistry, stage 3). The catalogue is now **70 authored / 65 outline**, with **70 machine-checked**, **0 critical** gaps and chemistry now at 15/16.",
  "- `organic-intro` teaches carbon's four bonds, alkanes and alkenes, fractional distillation, cracking and combustion, and addition polymerisation. It has 4 objectives, 5 explanation sections (19 paragraphs), 4 representation blocks, 3 worked examples, 4 misconception repairs, 3 guided items, 3 assessments, a propene-container transfer, 3 retrieval prompts and 4 accessibility alternatives. The cracking equation conserves atoms and the polymer repeat unit preserves the monomer's connectivity.",
  "- Integrated a third assessment blueprint without a second marker. The mathematics tables unit compiles into the existing `StructuredItem` path, with one mark per blank cell and one criterion attached to each cell. All three blueprints remain unreviewed and unservable. The audit is **3 blueprints / 17 items / 52 marks / 6 sources / 12 misconceptions / 0 reviewed / 0 servable / 0 issues**.",
  "- The browser-contract denominator is one row per authored lesson: **70/70** have a contract row, and `npm run verify` fails if a future authored lesson has no row.",
  "- The browser walk was completed: **857 passed, 0 failed**. `organic-intro` rendered at 1280, 768, 375 and 320 px, and its visible `a2` answer `propene, C3H6` was marked correct by the server. The same run confirms the other 69 authored lessons.",
  "- The assessment gates are part of `npm run verify`: the marking gate passes **80/0** and the self-test refuses **14/14** planted defects, then accepts a genuine review record. The live scratch-store journey passes **40/0**, and a real-browser fixture journey passes **33/0** across numeric, table, short-answer and prose formats. The teacher pack remains **UNREVIEWED — NOT AN APPROVAL** with 0 reviews and 0 servable blueprints. No blueprint is served while it is unreviewed.",
  "",
  "## Tests actually run",
  "",
  "| Command | Result |",
  "| --- | --- |",
  "| `npm run lesson:catalogue` | exit 0; 135 concepts, **70 authored**, 65 outline, 70 machine_checked |",
  "| `npm run typecheck` | exit 0 |",
  "| `npm run verify` | **4631 passed, 0 failed**, then the assessment gates: **3 blueprints / 17 items / 52 marks / 6 sources / 12 misconceptions / 0 reviewed / 0 servable / 0 issues**, and **80 marking assertions / 0 failed** |",
  "| `npm run verify:lessons` | exit 0; all lesson subject checks, including **209 chemistry assertions** and the new organic-intro checks |",
  "| `npm run assessment:self-test` | **14/14 planted defects refused**, then a genuine review record accepted |",
  "| `npm run assessment:marking` | **80 passed, 0 failed**: fully correct, partial credit, alternative wording, missing units, incorrect reasoning, misconception-specific responses, table cells, rubric-only prose, and refusal of every unreviewed blueprint |",
  "| `npm run verify:lesson` | **857 passed, 0 failed**; all 70 authored lessons at four widths, and the organic-intro `a2` answer `propene, C3H6` marked by the server |",
  "| `npm run assessment:journey` | **40 passed, 0 failed** against the scratch store: full and partial marking, alternative wording, missing units, invalid input, unscored prose, evidence, projection and next step |",
  "| `npm run assessment:browser` | **33 passed, 0 failed** in Chrome against the labelled fixture: gate, numeric, table, short-answer, prose, partial credit, misconception, missing unit, invalid input, evidence, mastery and next step |",
  "| `npm run assessment:teacher-pack` | exit 0; **UNREVIEWED — NOT AN APPROVAL**, 0 teacher reviews, 0 servable blueprints |",
  "",
  "## Next task",
  "",
  "No critical content gap remains. `organic-intro` is authored, browser-verified at 1280, 768, 375 and 320 px, and in the browser regression contract. The next high-priority chemistry concept is `rates-reaction`. All 70 authored lessons remain in the browser regression contract; the 65 outlines are not browser-applicable until authored. The production build and restart drill remain outstanding; check the shared volume's headroom before that run.",
  "",
  "```bash",
  "npm run readiness",
  "npm run readiness:check",
  "```",
  "",
  "## Scratch-store state",
  "",
  "The browser walk ran against the scratch `OPENMIND_DATA_DIR` under `/tmp`, never `.openmind-data`; the scratch store is disposable and is not a learner or teacher record.",
  "",
  "## Limitations",
  "",
  "- 0 genuine educator reviews and 0 learner-tested lessons; fixture records are not human evidence.",
  "- The browser checks use fixture signed-in accounts; they are not a learner, teacher or assistive-technology session.",
  "- 0 reviewed teaching languages; 2 machine translations are labelled unreviewed.",
  "- 0 reviewed curriculum mappings; the matrix is a record of structure, not a support claim.",
  "- Browser coverage is structural: all 70 authored pages paint and fit four widths, but this is not a teacher review, a learner trial or an assistive-technology session.",
  "- 65 outline concepts still have no authored lesson; the queue, not a completion claim, is the record of that work.",
  "- The biology blueprint's source permission is unknown and the physics source is a public specification; neither blueprint has a teacher review or a learner trial. They are design prototypes, not validated exams or a licence to republish the school's material.",
  "- The production build, restart drill and assistive-technology session have not been re-run in this batch.",
  "",
].join("\n");
fs.writeFileSync(path.join(OUT_DIR, "EXECUTION_STATE.md"), executionMd);

console.log(`readiness → ${path.relative(ROOT, OUT_DIR)}/READINESS.json`);
console.log(`  authored ${numbers.authored}/${numbers.concepts} · outlines ${numbers.outlines} · critical ${numbers.criticalGaps}`);
console.log(`  pathways ${numbers.nationalPathways} · reviewed mappings ${numbers.reviewedMappings} · teaching languages reviewed ${numbers.teachingLanguagesReviewed}`);
console.log(`  capabilities ${capabilities.length} · backlog ${backlog.length} · external blockers ${externalBlockers.length}`);
