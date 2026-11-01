// ─────────────────────────────────────────────────────────────────────────────
// THE DEPLOYMENT STAGE GATE.
//
// `production-check` answers "does this artefact work?". It cannot answer "may
// this be used by a child in a school?" — that depends on educator signatures,
// a partner, local legal/safeguarding review, language validation and learner
// evidence, none of which a build can invent.
//
// This gate makes the five-stage deployment path executable. It derives the
// content facts from the real pilot modules, reads external evidence from
// `pilot-readiness/DEPLOYMENT_EVIDENCE.json`, and refuses a stage whose evidence
// is missing. The current tree is only Stage 1; `--stage=controlled-pilot`
// should fail, and that failure is the feature.
//
// Usage:
//   npm run deployment:check
//   npm run deployment:check -- --stage=educator-validation
//   npm run deployment:check -- --stage=controlled-pilot --json
//   npm run deployment:check -- --self-test
//
// The gate does not write evidence, approvals, names or dates. A human must
// populate the evidence file; a code change cannot manufacture a school.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const EVIDENCE_PATH = "pilot-readiness/DEPLOYMENT_EVIDENCE.json";
const STAGES = [
  "pilot-preparation",
  "educator-validation",
  "controlled-pilot",
  "limited-country",
  "multi-country",
];
const STAGE = (process.argv.find((a) => a.startsWith("--stage="))?.split("=")[1] ?? "pilot-preparation");
const JSON_OUT = process.argv.includes("--json");
const SELF_TEST = process.argv.includes("--self-test");

const readJson = (p) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
};
const has = (v) => v && typeof v === "object" && !Array.isArray(v);
const dateLike = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 2;

function report(stage, derived, evidence, files = {}) {
  const blockers = [];
  const notes = [];
  const need = (ok, label) => { if (!ok) blockers.push(label); };

  const versionMatches = evidence?.lessonVersion === derived.version;
  const completeLessons = derived.lessons === 12;
  const rightsClear = derived.rightsClear === 12;
  const prep =
    versionMatches && completeLessons && rightsClear &&
    files.validationReport && files.verificationResults && files.reviewPack;

  if (!versionMatches) blockers.push(`evidence lessonVersion is ${evidence?.lessonVersion ?? "missing"}, expected ${derived.version}`);
  if (!completeLessons) blockers.push(`only ${derived.lessons}/12 pilot lessons are defined`);
  if (!rightsClear) blockers.push(`only ${derived.rightsClear}/12 lessons are rights-clear`);
  if (!files.validationReport) blockers.push("pilot-readiness/LESSON_VALIDATION_REPORT.md is missing");
  if (!files.verificationResults) blockers.push("pilot-readiness/VERIFICATION_RESULTS.md is missing");
  if (!files.reviewPack) blockers.push("pilot-readiness/PILOT_LESSONS_REVIEW_PACK.md is missing");

  const partner = has(evidence?.schoolPartner) &&
    nonEmpty(evidence.schoolPartner.name) && nonEmpty(evidence.schoolPartner.scope) &&
    dateLike(evidence.schoolPartner.confirmedAt);
  const legal = has(evidence?.legalReview) &&
    nonEmpty(evidence.legalReview.reviewer) && nonEmpty(evidence.legalReview.jurisdiction) &&
    dateLike(evidence.legalReview.reviewedAt);
  const safeguarding = has(evidence?.safeguardingReview) &&
    nonEmpty(evidence.safeguardingReview.reviewer) && dateLike(evidence.safeguardingReview.reviewedAt);
  const technical = evidence?.technical ?? {};
  const tech = (key) => technical?.[key]?.status === "verified" && nonEmpty(technical[key].evidence);
  const operations = evidence?.operations ?? {};
  const learner = has(evidence?.learnerEvidence) &&
    evidence.learnerEvidence.status === "verified" && nonEmpty(evidence.learnerEvidence.reviewedBy) &&
    dateLike(evidence.learnerEvidence.reviewedAt);
  const language = Array.isArray(evidence?.languageReviews) &&
    evidence.languageReviews.some((r) => has(r) && nonEmpty(r.language) && nonEmpty(r.reviewer) && dateLike(r.reviewedAt));
  const countries = Array.isArray(evidence?.countryApprovals) ? evidence.countryApprovals : [];

  if (stage === "educator-validation") {
    need(prep, "Stage 1 (pilot preparation) is not complete");
    need(derived.approved >= 1, "no educator approval is on file");
    need(partner, "no confirmed school or education partner is recorded");
  }
  if (stage === "controlled-pilot") {
    need(prep, "Stage 1 (pilot preparation) is not complete");
    need(derived.approved === 12, `educator approvals are ${derived.approved}/12; a controlled pilot needs all reviewed lessons`);
    need(derived.reviewedMappings === 12, `curriculum mappings are ${derived.reviewedMappings}/12 reviewer-confirmed`);
    need(partner, "no confirmed school or education partner is recorded");
    need(legal, "local legal review is not recorded");
    need(safeguarding, "safeguarding review is not recorded");
    for (const [key, label] of [
      ["durableStore", "durable production storage"],
      ["backupRestore", "backup and restoration drill"],
      ["permissions", "authorisation matrix"],
      ["offlineJourney", "complete offline learning journey"],
      ["lowResource", "low-end device/network test"],
      ["accessibility", "WCAG 2.2 AA browser/assistive-technology test"],
    ]) need(tech(key), `${label} is not verified`);
    need(operations.teacherOnboarding?.status === "verified", "teacher onboarding is not verified");
    need(nonEmpty(operations.supportContact), "no named support contact is recorded");
  }
  if (stage === "limited-country") {
    need(prep, "Stage 1 (pilot preparation) is not complete");
    need(derived.approved === 12, `educator approvals are ${derived.approved}/12`);
    need(partner && legal && safeguarding, "partner, legal or safeguarding evidence is missing");
    need(learner, "no verified learner evidence is recorded");
    need(language, "no language review is recorded for the teaching language");
    need(countries.length >= 1, "no country-level deployment approval is recorded");
    for (const key of ["durableStore", "backupRestore", "permissions", "offlineJourney", "lowResource", "accessibility"]) {
      need(tech(key), `${key} is not verified`);
    }
    need(operations.teacherOnboarding?.status === "verified" && nonEmpty(operations.supportContact),
      "teacher onboarding/support is not operational");
  }
  if (stage === "multi-country") {
    need(prep, "Stage 1 (pilot preparation) is not complete");
    need(countries.length >= 2, `country approvals are ${countries.length}/2; every jurisdiction needs its own approval`);
    need(derived.approved === 12, "the 12-lesson pack is not fully reviewed");
    need(learner, "no verified learner evidence is recorded");
    need(partner && legal && safeguarding, "partner, legal or safeguarding evidence is missing");
    for (const key of ["durableStore", "backupRestore", "permissions", "offlineJourney", "lowResource", "accessibility"]) {
      need(tech(key), `${key} is not verified`);
    }
  }

  // Stage 1 does not mean "deployed"; say it in the return value so a caller
  // cannot read a green preparation gate as permission to open a learner path.
  if (stage === "pilot-preparation" && blockers.length === 0) {
    notes.push("Stage 1 only: technically checked review candidate. No learner path is open.");
  }
  return {
    stage,
    ready: blockers.length === 0,
    blockers: [...new Set(blockers)],
    notes,
    derived,
  };
}

// ── Self-test: the gate must be able to fail, not only pass ─────────────────
if (SELF_TEST) {
  const d = {
    lessons: 12, rightsClear: 12, approved: 0, reviewedMappings: 0, version: "test",
  };
  const e = { lessonVersion: "test", schoolPartner: null, legalReview: null, safeguardingReview: null, technical: {}, operations: {}, learnerEvidence: null, languageReviews: [], countryApprovals: [] };
  const files = { validationReport: true, verificationResults: true, reviewPack: true };
  const prep = report("pilot-preparation", d, e, files);
  const educator = report("educator-validation", d, e, files);
  const controlled = report("controlled-pilot", d, { ...e, schoolPartner: { name: "Synthetic", scope: "test", confirmedAt: "2026-01-01" } }, files);
  const full = {
    ...e,
    schoolPartner: { name: "Synthetic partner", scope: "test scope", confirmedAt: "2026-01-01" },
    legalReview: { reviewer: "Synthetic", jurisdiction: "test", reviewedAt: "2026-01-01" },
    safeguardingReview: { reviewer: "Synthetic", reviewedAt: "2026-01-01" },
    technical: Object.fromEntries(["durableStore", "backupRestore", "permissions", "offlineJourney", "lowResource", "accessibility"].map((k) => [k, { status: "verified", evidence: "synthetic" }])),
    operations: { teacherOnboarding: { status: "verified" }, supportContact: "Synthetic support" },
  };
  const fullControlled = report("controlled-pilot", { ...d, approved: 12, reviewedMappings: 12 }, full, files);
  const noLearner = report("limited-country", { ...d, approved: 12, reviewedMappings: 12 }, full, files);
  const checks = [
    ["preparation passes the current shape", prep.ready === true],
    ["educator validation refuses zero approvals", educator.ready === false && educator.blockers.some((b) => b.includes("no educator approval"))],
    ["controlled pilot refuses missing technical evidence", controlled.ready === false && controlled.blockers.some((b) => b.includes("durable production storage"))],
    ["controlled pilot can pass only with the full synthetic evidence shape", fullControlled.ready === true],
    ["limited country still refuses when learner evidence is absent", noLearner.ready === false && noLearner.blockers.some((b) => b.includes("learner evidence"))],
  ];
  let failed = 0;
  for (const [label, ok] of checks) {
    console.log(`${ok ? "  ✓" : "  ✗"} ${label}`);
    if (!ok) failed++;
  }
  console.log(`\nDeployment gate self-test: ${checks.length - failed} passed, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
}

// ── Compile the real modules, then read the evidence file ───────────────────
const evidence = readJson(EVIDENCE_PATH);
if (!evidence) {
  console.error(`deployment gate: cannot read ${EVIDENCE_PATH}; create the evidence file before claiming a stage.`);
  process.exit(1);
}
if (!STAGES.includes(STAGE)) {
  console.error(`deployment gate: unknown stage "${STAGE}". One of: ${STAGES.join(", ")}`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "openmind-deploy-"));
try {
  execSync(
    `npx tsc lib/pilot.ts lib/pilot-mappings.ts lib/pilot-rights.ts lib/source-registry.ts ` +
    `--outDir ${tmp} --rootDir . --module commonjs --target es2020 --skipLibCheck --esModuleInterop --strict`,
    { stdio: "inherit" },
  );
  const require = createRequire(import.meta.url);
  const P = require(path.join(tmp, "lib/pilot.js"));
  const M = require(path.join(tmp, "lib/pilot-mappings.js"));
  const PR = require(path.join(tmp, "lib/pilot-rights.js"));
  const rights = PR.pilotRightsCoverage();
  const derived = {
    version: P.PILOT_LESSON_VERSION,
    lessons: P.PILOT_SEQUENCE.length,
    approved: P.PILOT_APPROVALS.length,
    rightsClear: rights.clear,
    reviewedMappings: M.mappingCoverage().reviewed,
  };
  const files = {
    validationReport: fs.existsSync("pilot-readiness/LESSON_VALIDATION_REPORT.md"),
    verificationResults: fs.existsSync("pilot-readiness/VERIFICATION_RESULTS.md"),
    reviewPack: fs.existsSync("pilot-readiness/PILOT_LESSONS_REVIEW_PACK.md"),
  };
  const result = report(STAGE, derived, evidence, files);
  if (JSON_OUT) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\nDeployment gate — ${STAGE}\n`);
    console.log(`  version ${derived.version} · ${derived.lessons} lessons · ${derived.rightsClear}/12 rights-clear · ${derived.approved}/12 educator-approved · ${derived.reviewedMappings}/12 mappings reviewed`);
    if (result.ready) {
      console.log(`  ✓ stage evidence is complete${result.notes.length ? ` — ${result.notes.join(" ")}` : ""}`);
    } else {
      console.log("  ✗ stage is blocked:");
      for (const b of result.blockers) console.log(`    · ${b}`);
    }
  }
  process.exit(result.ready ? 0 : 1);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
