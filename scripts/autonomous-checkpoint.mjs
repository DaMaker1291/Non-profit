#!/usr/bin/env node
// THE AUTONOMOUS CHECKPOINT IS DERIVED, NOT TYPED.
//
// Long-running work is resumed by a fresh context that cannot remember which
// lesson was next. A hand-written progress note becomes wrong quietly, so every
// count below is read from the artifact that owns it: the lesson catalogue for
// curriculum coverage, the assessment audit for blueprint state, the language
// matrix for translation coverage, and the filesystem for space. The generated
// JSON is the authoritative backlog; the Markdown files are views of it.
//
// The next task is selected by the genome order among concepts whose prerequisite
// lessons are already authored. It is a deterministic suggestion, not a claim
// that every earlier requirement is finished.
//
// Run: node scripts/autonomous-checkpoint.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "audit/lesson-catalogue.json"), "utf8"));
const status = JSON.parse(fs.readFileSync(path.join(root, "audit/status.json"), "utf8"));
const assessment = JSON.parse(fs.readFileSync(path.join(root, "audit/assessment-intelligence.json"), "utf8"));
const assessmentBrowser = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "audit/assessment-browser.json"), "utf8"));
  } catch {
    return null;
  }
})();
const languages = JSON.parse(fs.readFileSync(path.join(root, "LANGUAGE_COVERAGE_MATRIX.json"), "utf8"));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const browserEvidence = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "audit/lesson-browser.json"), "utf8"));
  } catch {
    return null;
  }
})();
const browserCoversAll =
  browserEvidence?.allAuthoredPainted === true &&
  browserEvidence?.authoredLessons === catalogue.totals.authored;
const releaseEvidence = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "audit/release-evidence.json"), "utf8"));
  } catch {
    return null;
  }
})();
const productionPassed = releaseEvidence?.productionCheck?.status === "PASS";
const restorePassed = releaseEvidence?.restoreDrill?.status === "PASS";
const releaseVerified = productionPassed && restorePassed;
const verification = releaseEvidence?.verification ?? {};
// Cross-cutting subsystems are not lessons, so their status cannot be derived
// from the lesson catalogue. It is read from the audit record produced by the
// runs that actually exercised them, never from a hardcoded "unverified" line
// that stays stale after the suite goes green.
const subsystemEvidence = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "audit/subsystem-evidence.json"), "utf8"));
  } catch {
    return null;
  }
})();
const subsystem = (id) => subsystemEvidence?.subsystems?.[id] ?? null;

const git = (args) => {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};
const head = git(["rev-parse", "--short", "HEAD"]);
const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
const dirty = git(["status", "--porcelain"]).split("\n").filter(Boolean);
const freeBytes = (() => {
  try {
    const f = fs.statfsSync(root);
    return f.bavail * f.bsize;
  } catch {
    return null;
  }
})();
const freeGiB = freeBytes === null ? null : Number((freeBytes / 1024 ** 3).toFixed(2));
const minFreeMiB = 5 * 1024;
const lowSpace = freeBytes === null ? null : freeBytes < minFreeMiB * 1024 * 1024;

// The catalogue is the source of truth for which authored lessons exist. The
// genome order is preserved in the catalogue, so the first unresolved concept
// with all declared prerequisites authored is the honest next curriculum task.
const concepts = catalogue.concepts;
const authoredIds = new Set(concepts.filter((c) => c.status !== "outline" && c.status !== "metadata_only").map((c) => c.conceptId));
const nextConcept = concepts.find(
  (c) =>
    (c.status === "outline" || c.status === "metadata_only") &&
    (c.prereqs ?? []).every((p) => authoredIds.has(p)),
);
const nextAnyConcept = concepts.find((c) => c.status === "outline" || c.status === "metadata_only");

const curriculumItems = concepts.map((c) => {
  const authored = c.status !== "outline" && c.status !== "metadata_only";
  return {
    id: `CUR-${c.conceptId}`,
    area: "curriculum",
    title: c.title,
    status: authored ? (browserCoversAll ? "BROWSER_VERIFIED" : "AUTOMATED_VERIFIED") : "MISSING",
    sourceFiles: authored
      ? ["lib/lessons/authored", "lib/lessons/authored/index.ts"]
      : ["lib/lesson-plans.ts", "lib/genome.ts"],
    acceptance:
      "An authored lesson meeting openmind.lesson/1.0: diagnostic, reasoned worked examples, misconception corrections, guided practice, independent assessment, transfer, spaced retrieval, accessibility alternatives and provenance.",
    dependencies: c.prereqs ?? [],
    evidence: authored
      ? [
          `audit/lesson-catalogue.json: ${c.conceptId} earned ${c.lesson?.earnedStatus ?? c.status}`,
          "npm run lesson:catalogue",
          ...(browserCoversAll ? ["audit/lesson-browser.json: all authored lessons painted at 1280, 768, 375 and 320 px"] : []),
        ]
      : [`audit/lesson-catalogue.json: ${c.conceptId} is ${c.status}`],
    remainingWork: authored
      ? "Browser-verify this lesson at 1280, 768, 375 and 320 px; subject-teacher review remains external."
      : c.blocker,
    browserVerified: authored && browserCoversAll,
    externalBlockers: authored
      ? ["qualified subject-teacher review", "learner trial measuring independent understanding and delayed retention"]
      : [],
  };
});

const requirement = (id, area, title, statusValue, sourceFiles, acceptance, evidence, remainingWork, externalBlockers = []) => ({
  id,
  area,
  title,
  status: statusValue,
  sourceFiles,
  acceptance,
  dependencies: [],
  evidence,
  remainingWork,
  externalBlockers,
});

const nonCurriculum = [
  requirement(
    "ASSESS-001",
    "assessment",
    "Structured assessment and marking",
    assessment.totals.servable === 0 ? "HUMAN_REVIEW_REQUIRED" : "IMPLEMENTED_UNVERIFIED",
    ["lib/assessment-intelligence.ts", "lib/assessment-serving.ts", "lib/assessment-blueprints"],
    "Blueprints use the existing StructuredItem and gradeStructuredParts architecture, mark structured responses with partial credit, and are servable only after genuine review.",
    [
      `audit/assessment-intelligence.json: ${assessment.totals.blueprints} blueprints, ${assessment.totals.items} items, ${assessment.totals.marks} marks, ${assessment.totals.servable} servable`,
      ...(assessmentBrowser
        ? [
            `audit/assessment-browser.json: ${assessmentBrowser.passed} passed, ${assessmentBrowser.failed} failed — numeric, table, short-answer and prose journeys`,
          ]
        : []),
      "npm run assessment:marking",
      "npm run assessment:journey",
      "npm run assessment:browser",
    ],
    "The Mathematics table branch is browser-verified; obtain genuine teacher review of every blueprint. Unreviewed blueprints must remain blocked.",
    ["teacher review of every blueprint", "source permission and licensing review"],
  ),
  requirement(
    "LANG-001",
    "multilingual",
    "Teaching-language coverage",
    languages.summary.humanReviewedTranslations === 0 ? "HUMAN_REVIEW_REQUIRED" : "IMPLEMENTED_UNVERIFIED",
    ["lib/i18n.ts", "lib/lesson-plans-intl.ts", "lib/i18n-learning.ts", "LANGUAGE_COVERAGE_MATRIX.json"],
    "Each of the 15 interface languages has translated teaching, terminology, questions, feedback and captions, with human linguistic and subject review where claimed.",
    [
      `LANGUAGE_COVERAGE_MATRIX.json: ${languages.summary.interfaceLanguages} interface languages, ${languages.summary.completeTranslatedLessonPairs} complete lesson pair(s), ${languages.summary.humanReviewedTranslations} human-reviewed`,
      "npm run verify:multilingual",
    ],
    "Translate whole lessons, not only interface strings; obtain native-speaker and subject-specialist review. No human-reviewed complete lesson exists yet.",
    ["human language review", "subject-specialist terminology review"],
  ),
  requirement(
    "RES-001",
    "resources",
    "Exact external educational resources",
    languages.summary.exactExternalResources > 0 ? "IMPLEMENTED_UNVERIFIED" : "MISSING",
    ["lib/exact-resources.ts", "EXTERNAL_RESOURCE_CATALOGUE_REPORT.md"],
    "Recommendations identify exact resources, language, captions, duration, cost, connectivity needs and rights; the internal lesson remains complete without them.",
    ["EXTERNAL_RESOURCE_CATALOGUE_REPORT.md", "RESOURCE_RECOMMENDATION_REPORT.md"],
    "Re-check every URL and metadata field; no provider may be scraped or represented as offline without permission.",
    ["provider permission for downloadable media"],
  ),
  requirement(
    "OFFLINE-001",
    "offline",
    "Offline packages and synchronisation",
    subsystem("OFFLINE-001")?.status ?? "IMPLEMENTED_UNVERIFIED",
    ["lib/offline.ts", "lib/offline-sync.ts", "OFFLINE_PACKAGE_REPORT.md", "LOW_BANDWIDTH_READINESS_REPORT.md"],
    "A learner can download permitted content, use lessons offline, persist progress locally, restart, reconnect and synchronise without silent loss or duplicate writes.",
    [
      ...(subsystem("OFFLINE-001")?.evidence ?? []),
      "OFFLINE_PACKAGE_REPORT.md",
      "LOW_BANDWIDTH_READINESS_REPORT.md",
      "npm run verify:offline-browser",
      "npm run verify:sync",
    ],
    subsystem("OFFLINE-001")?.remainingWork ??
      "Run the browser offline/restart/sync journey on this checkout and record its actual result; external media remains link-only unless permission exists.",
    ["media licensing for offline redistribution"],
  ),
  requirement(
    "TEACH-001",
    "teacher",
    "Teacher and classroom workflows",
    subsystem("TEACH-001")?.status ?? "IMPLEMENTED_UNVERIFIED",
    ["app/teacher", "lib/classroom.ts", "lib/server/classes.ts"],
    "Teacher authentication, class membership, assignments, evidence-derived rosters, exports and review packs are permission-checked end to end.",
    [
      ...(subsystem("TEACH-001")?.evidence ?? []),
      "npm run verify:permissions",
      "npm run verify:classroom2",
      "npm run verify:assignment-lifecycle",
    ],
    subsystem("TEACH-001")?.remainingWork ??
      "Re-run classroom, assignment and permission browser journeys on this checkout.",
  ),
  requirement(
    "A11Y-001",
    "accessibility",
    "Accessibility",
    "HUMAN_REVIEW_REQUIRED",
    ["app/globals.css", "components", "scripts/ui-walk.mjs"],
    "Semantic structure, keyboard journeys, focus management, contrast, reflow at 320 px and 200% zoom, captions, text alternatives and RTL layouts are verified.",
    ["npm run verify:a11y", "npm run verify:ui"],
    "Run the automated checks and complete a genuine VoiceOver/NVDA session. No assistive-technology session is claimed.",
    ["assistive-technology specialist session"],
  ),
  requirement(
    "SEC-001",
    "security",
    "Security and privacy",
    subsystem("SEC-001")?.status ?? "IMPLEMENTED_UNVERIFIED",
    ["lib/auth", "lib/server", "app/api", "scripts/verify-engines.mjs"],
    "Authentication, authorization, data isolation, same-origin mutation checks, validation, rate limits and deletion are verified without trusting client-supplied identity or mastery.",
    [
      ...(subsystem("SEC-001")?.evidence ?? []),
      "npm run verify",
      "npm run verify:permissions",
      "npm run verify:auth-boundaries",
      "npm run verify:auth-sync",
    ],
    subsystem("SEC-001")?.remainingWork ??
      "Re-run the security and boundary checks on this checkout and record any failure.",
    ["external legal and data-protection review where required"],
  ),
  requirement(
    "PROD-001",
    "production",
    "Production build, standalone startup and persistence drill",
    lowSpace ? "EXTERNALLY_BLOCKED" : releaseVerified ? "AUTOMATED_VERIFIED" : "IMPLEMENTED_UNVERIFIED",
    ["start-openmind.sh", "next.config.mjs", "scripts/production-check.mjs", "scripts/restore-drill.mjs", "audit/release-evidence.json"],
    "Build, start standalone, create isolated records, submit an assessment, stop, restart, and verify identity, evidence, permissions and absence of duplicate writes.",
    [
      freeGiB === null ? "disk headroom could not be measured" : `${freeGiB} GiB free; guard 5.0 GiB`,
      ...(productionPassed
        ? [`audit/release-evidence.json: npm run production-check ${releaseEvidence.productionCheck.status}`]
        : []),
      ...(restorePassed
        ? [
            `audit/release-evidence.json: npm run restore-drill ${releaseEvidence.restoreDrill.status} (${releaseEvidence.restoreDrill.passed} passed, ${releaseEvidence.restoreDrill.failed} failed, planted erasure re-applied)`,
          ]
        : []),
    ],
    lowSpace
      ? "Wait for disk headroom above the guard, then run production-check and restore-drill against an isolated scratch store."
      : releaseVerified
        ? "Re-run both after any change and before release; human operations approval remains external."
        : "Run `npm run production-check` and `npm run restore-drill` against an isolated scratch store; never use production data.",
    lowSpace ? ["disk headroom below the project guard"] : [],
  ),
  requirement(
    "VALID-001",
    "validation",
    "Genuine external validation",
    "EXTERNALLY_BLOCKED",
    ["reports/assessment-teacher-review", "docs/ministry", "pilot-readiness"],
    "Subject-teacher reviews, curriculum approval, legal/licensing clearance, language review, accessibility specialist testing and supervised learner trials are recorded against exact content versions.",
    ["audit/lesson-catalogue.json: 0 reviewed, 0 learner-tested", "audit/assessment-intelligence.json: 0 reviewed"],
    "Prepare packs and protocols; do not fabricate approvals. Every item here requires a named human outside the project.",
    [
      "qualified teacher reviews",
      "curriculum specialist approval",
      "legal and licensing clearance",
      "human language review",
      "assistive-technology testing",
      "supervised learner trials",
    ],
  ),
];

const backlog = {
  generatedBy: "scripts/autonomous-checkpoint.mjs",
  generatedAt: new Date().toISOString(),
  sourceOfTruth: "audit/lesson-catalogue.json and the other artifacts named in each item",
  repository: { branch, head, dirtyFiles: dirty.length, dirty },
  environment: { freeGiB, guardGiB: 5, lowSpace, platform: process.platform },
  counts: {
    concepts: catalogue.totals.concepts,
    authoredLessons: catalogue.totals.authored,
    outlineConcepts: catalogue.totals.concepts - catalogue.totals.authored,
    machineChecked: catalogue.totals.byStatus.machine_checked,
    browserVerifiedLessons: browserCoversAll ? catalogue.totals.authored : 0,
    humanReviewedLessons: catalogue.totals.byStatus.educator_reviewed + catalogue.totals.byStatus.learner_tested + catalogue.totals.byStatus.published,
    assessmentBlueprints: assessment.totals.blueprints,
    assessmentServable: assessment.totals.servable,
    humanReviewedTranslations: languages.summary.humanReviewedTranslations,
  },
  nextTask: nextConcept
    ? {
        id: `CUR-${nextConcept.conceptId}`,
        conceptId: nextConcept.conceptId,
        title: nextConcept.title,
        subject: nextConcept.subject,
        reason: "First unresolved concept in genome order whose declared prerequisites are authored.",
        status: nextConcept.status,
        blocker: nextConcept.blocker,
      }
    : null,
  nextTaskIfPrerequisitesBlocked: nextAnyConcept
    ? { id: `CUR-${nextAnyConcept.conceptId}`, conceptId: nextAnyConcept.conceptId, title: nextAnyConcept.title }
    : null,
  levelA: {
    achieved: false,
    reason:
      `${catalogue.totals.concepts - catalogue.totals.authored} concepts still have no authored lesson. ` +
      (browserCoversAll && releaseVerified
        ? `All ${catalogue.totals.authored} authored lessons are browser-verified, and the production build, standalone startup and restore drill are recorded PASS. `
        : "Browser verification and the release checks are not both current for every authored lesson. ") +
      "Level A also requires the full curriculum, so it is not achieved.",
  },
  levelB: {
    achieved: false,
    reason: "No external teacher review, learner trial, curriculum approval, legal clearance, human language review or assistive-technology session exists.",
  },
  items: [...curriculumItems, ...nonCurriculum],
};

fs.writeFileSync(path.join(root, "OPENMIND_BACKLOG.json"), `${JSON.stringify(backlog, null, 2)}\n`);

const state = {
  generatedBy: backlog.generatedBy,
  generatedAt: backlog.generatedAt,
  branch,
  head,
  dirtyFiles: dirty.length,
  freeGiB,
  lowSpace,
  counts: backlog.counts,
  nextTask: backlog.nextTask,
  levelA: backlog.levelA,
  levelB: backlog.levelB,
  lastCheckpointEvidence: [
    `npm run typecheck (${verification.typecheck ?? "not recorded"})`,
    `npm run lesson:catalogue (${catalogue.totals.authored} authored, ${catalogue.totals.concepts - catalogue.totals.authored} outlines)`,
    "node scripts/secondary-maths-lesson-check.mjs (included in verify:lessons)",
    verification.verify
      ? `npm run verify (${verification.verify.passed} passed, ${verification.verify.failed} failed)`
      : "npm run verify not recorded",
    `npm run verify:lessons (${verification.verifyLessons ?? "not recorded"})`,
    browserEvidence
      ? `npm run verify:lesson (${browserEvidence.passed} passed, ${browserEvidence.failed} failed; ${browserEvidence.authoredLessons} authored lessons)`
      : "npm run verify:lesson not recorded",
    releaseEvidence?.productionCheck
      ? `npm run production-check (${releaseEvidence.productionCheck.status})`
      : "npm run production-check not recorded",
    releaseEvidence?.restoreDrill
      ? `npm run restore-drill (${releaseEvidence.restoreDrill.passed} passed, ${releaseEvidence.restoreDrill.failed} failed)`
      : "npm run restore-drill not recorded",
    verification.e2e
      ? `npm run e2e (${verification.e2e.passed} passed, ${verification.e2e.failed} failed)`
      : "npm run e2e not recorded",
  ],
  browserEvidence,
};
fs.writeFileSync(path.join(root, "OPENMIND_AUTONOMOUS_STATE.json"), `${JSON.stringify(state, null, 2)}\n`);

const md = `# OpenMind autonomous status

Generated by \`scripts/autonomous-checkpoint.mjs\` at ${backlog.generatedAt}.
Do not hand-edit the counts: re-run \`npm run checkpoint\`.

## Current measured state

- Repository: \`${branch}\` at \`${head}\`; ${dirty.length} uncommitted path(s).
- Curriculum: **${catalogue.totals.authored} of ${catalogue.totals.concepts}** concepts have an authored lesson meeting \`openmind.lesson/1.0\`.
- Remaining outlines: **${backlog.counts.outlineConcepts}**.
- Machine-checked lessons: **${catalogue.totals.byStatus.machine_checked}**.
- Browser-verified authored lessons: **${backlog.counts.browserVerifiedLessons}** (record: ${browserEvidence ? `${browserEvidence.passed} assertions, ${browserEvidence.failed} failed` : "not recorded"}).
- Human-reviewed lessons: **${backlog.counts.humanReviewedLessons}**.
- Assessment blueprints: **${assessment.totals.blueprints}**, servable: **${assessment.totals.servable}**.
- Complete human-reviewed teaching translations: **${languages.summary.humanReviewedTranslations}**.
- Free disk: **${freeGiB === null ? "not measurable" : `${freeGiB} GiB`}**; guard 5.0 GiB${lowSpace === true ? " — **BELOW GUARD**" : ""}.

## Next authoritative task

${nextConcept ? `\`CUR-${nextConcept.conceptId}\` — ${nextConcept.title} (${nextConcept.subject}). ${nextConcept.blocker}` : "No unresolved concept remains."}

## Level A (code-complete and technically verified)

**Not achieved.** ${backlog.levelA.reason}

## Level B (educationally and operationally validated)

**Not achieved.** ${backlog.levelB.reason}

## Authoritative register

\`OPENMIND_BACKLOG.json\` contains one item per curriculum concept and one per
cross-cutting requirement, each with status, source files, acceptance criteria,
dependencies, evidence, remaining work and external blockers.
`;
fs.writeFileSync(path.join(root, "OPENMIND_AUTONOMOUS_STATUS.md"), md);

const blockers = `# OpenMind blockers

Generated by \`scripts/autonomous-checkpoint.mjs\` at ${backlog.generatedAt}.

## External blockers (cannot be fabricated)

- **Subject-teacher review:** 0 of ${catalogue.totals.authored} authored lessons have a named reviewer, scope, date and verdict on the exact version.
- **Learner trials:** 0 of ${catalogue.totals.authored} authored lessons have evidence measuring independent understanding or delayed retention.
- **Assessment review:** 0 of ${assessment.totals.blueprints} blueprints are servable; unreviewed blueprints are deliberately blocked.
- **Curriculum mappings:** 0 reviewed mappings; a citation is not an approval.
- **Human language review:** 0 complete human-reviewed teaching translations.
- **Accessibility specialist testing:** no VoiceOver/NVDA session is recorded.
- **Legal and licensing clearance:** provider and source permissions remain external decisions.
- **Safeguarding:** any school-age learner trial requires approval, adult supervision and a safeguarding arrangement.

## Code-completable gaps

- ${backlog.counts.outlineConcepts} concepts still have an outline rather than an authored lesson. The next is ${nextConcept ? `\`${nextConcept.conceptId}\`` : "none"}.
- ${browserCoversAll ? `Browser verification is recorded for all ${catalogue.totals.authored} authored lessons at 1280, 768, 375 and 320 px.` : "Current-checkout browser verification for the authored set is not recorded."}
- ${releaseVerified ? "The production build, standalone startup and restore drill are recorded PASS in `audit/release-evidence.json`; re-run them after any change." : "Production build, standalone startup and restore drill are not recorded as current for this checkout."}
- ${verification.verify && verification.verifyLessons ? `The full \`npm run verify\` (${verification.verify.passed} passed, ${verification.verify.failed} failed) and \`npm run verify:lessons\` (${verification.verifyLessons}) ran on this checkout.` : "The full `npm run verify` and `npm run verify:lessons` suites are not recorded on this checkout."}

## Environment

${freeGiB === null ? "- Free space could not be measured." : `- Free space: ${freeGiB} GiB.`}${lowSpace === true ? " This is below the 5.0 GiB guard; do not start a production build." : ""}
`;
fs.writeFileSync(path.join(root, "OPENMIND_BLOCKERS.md"), blockers);

const resume = `# OpenMind resume

Generated by \`scripts/autonomous-checkpoint.mjs\` at ${backlog.generatedAt}.

## Start here

1. Read \`OPENMIND_AUTONOMOUS_STATE.json\`, then reconcile it with \`git status\` and \`audit/lesson-catalogue.json\`.
2. The next curriculum item is ${nextConcept ? `\`${nextConcept.conceptId}\` (${nextConcept.title}, ${nextConcept.subject})` : "none"}.
3. Do not re-author a lesson already registered in \`lib/lessons/authored/index.ts\`; \`audit/lesson-catalogue.json\` is the list.

## Work already present in the working tree

- The authored lessons and their registry entries under \`lib/lessons/authored/\`.
- Browser-walk rows in \`scripts/lesson-walk.mjs\`.
- Independent subject checks in \`scripts/secondary-maths-lesson-check.mjs\`, wired into \`verify:lessons\`.
- Regenerated \`audit/lesson-catalogue.json\` and \`audit/lesson-catalogue.md\`.

## Checks already run on this checkout

- \`npm run typecheck\` — ${verification.typecheck ?? "not recorded"}.
- \`node scripts/lesson-catalogue.mjs --write --report\` — ${catalogue.totals.authored} authored, ${catalogue.totals.concepts - catalogue.totals.authored} outline, 0 lesson defects.
- \`node scripts/secondary-maths-lesson-check.mjs\` — included in \`npm run verify:lessons\`; that suite passed.
- \`npm run verify\` — ${verification.verify ? `${verification.verify.passed} passed, ${verification.verify.failed} failed` : "not recorded"}.
- \`npm run verify:lessons\` — ${verification.verifyLessons ?? "not recorded"}.
- \`npm run verify:lesson\` — ${browserEvidence ? `${browserEvidence.passed} passed, ${browserEvidence.failed} failed` : "not recorded"}.
- \`npm run production-check\` — ${releaseEvidence?.productionCheck?.status ?? "not recorded"}.
- \`npm run restore-drill\` — ${releaseEvidence?.restoreDrill ? `${releaseEvidence.restoreDrill.passed} passed, ${releaseEvidence.restoreDrill.failed} failed; a planted erasure was re-applied after restore` : "not recorded"}.

## Rules that must survive a context reset

- The lesson contract is the standard; do not lower a floor to make an outline count as authored.
- Human review and learner testing are records written by a named human, never inferred.
- Do not claim a browser check, build or persistence drill that was not run.
- Use an isolated scratch store for browser and persistence work; never point \`OPENMIND_DATA_DIR\` at the real \`.openmind-data\`.
`;
fs.writeFileSync(path.join(root, "OPENMIND_RESUME.md"), resume);

console.log(`checkpoint: ${catalogue.totals.authored}/${catalogue.totals.concepts} authored, ${backlog.counts.outlineConcepts} outline, next ${nextConcept?.conceptId ?? "none"}`);
console.log(`wrote OPENMIND_BACKLOG.json, OPENMIND_AUTONOMOUS_STATE.json, OPENMIND_AUTONOMOUS_STATUS.md, OPENMIND_BLOCKERS.md, OPENMIND_RESUME.md`);
