#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// VERIFY THE HUMAN-REVIEW MACHINERY, NOT HUMAN EVIDENCE.
//
// Everything here runs against a temporary OPENMIND_DATA_DIR and a reviewer
// explicitly labelled as a test fixture. It proves the arithmetic of the system:
// a current record is accepted, an old version/hash is refused, a blocking
// finding cannot approve, findings become tasks, and a later version needs a new
// review. It does not claim that any teacher or learner ever took part.
//
// Run: npm run validation:check
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "openmind-validation-check-"));
process.env.OPENMIND_DATA_DIR = tmp;
// A temporary test store is declared ephemeral, not durable. Setting both is a
// contradiction the store refuses — the guard doing its job.
process.env.OPENMIND_ALLOW_EPHEMERAL_STORE = "1";
compileEngines();

const validation = require("../.verify/validation/review.js");
const { REVIEW_CRITERIA } = require("../.verify/validation/types.js");
const { AUTHORED_BY_CONCEPT } = require("../.verify/lessons/authored/index.js");
const store = require("../.verify/server/store.js");

let passed = 0;
let failed = 0;
const check = (name, condition, detail = "") => {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const lesson = AUTHORED_BY_CONCEPT.ratio;
if (!lesson) {
  console.error("No authored ratio lesson; cannot run the review checks.");
  process.exit(2);
}
const hash = validation.lessonContentHash(lesson);
const allCriteria = Object.fromEntries(REVIEW_CRITERIA.map((criterion) => [criterion.id, true]));
const finding = {
  id: "f1",
  location: "worked example 1",
  problem: "The example jumps from the ratio to the answer without stating the multiplier.",
  educationalConsequence: "A pupil can copy the step without being able to choose it in an unfamiliar problem.",
  recommendation: "Name the multiplier and show the multiplication for both quantities.",
  severity: "major",
  blockPublication: false,
};

function record(overrides = {}) {
  return {
    id: "lr_validation_fixture",
    lessonId: lesson.conceptId,
    lessonVersion: lesson.version,
    contentHash: hash,
    subject: lesson.subject,
    curriculum: { reference: lesson.curriculum.reference, level: lesson.curriculum.level },
    reviewer: {
      accountId: "acc_validation_fixture",
      name: "Validation test fixture",
      accountRole: "teacher",
      reviewRole: "subject-teacher",
      qualifications: "Test fixture only — not a qualification claim",
      scope: "Test fixture only — no real lesson was reviewed",
    },
    reviewedAt: "2026-11-09",
    createdAt: 1_700_000_000_000,
    criteria: allCriteria,
    decision: "changes-requested",
    findings: [finding],
    notes: "Test fixture only: this record exists to exercise the validator and is never human evidence.",
    source: "human",
    authority: "teacher-account",
    ...overrides,
  };
}

console.log("\n▸ Current-version review rules");
const changes = record();
const currentProblems = validation.reviewRecordProblems(changes, lesson);
check("a current human record passes the contract", currentProblems.length === 0, currentProblems.map((p) => p.message).join("; "));
check("a changes-requested review resolves as changes-requested", validation.resolveLessonReview(lesson, [changes]).state === "changes-requested");
const approved = record({ id: "lr_validation_approved", decision: "approved", findings: [], notes: "Test fixture approval: all six checks were exercised against the exact hashed content." });
const approvedProblems = validation.reviewRecordProblems(approved, lesson);
check("an approved record passes only with all criteria and no blocking finding", approvedProblems.length === 0, approvedProblems.map((p) => p.message).join("; "));
check("an approved record resolves as approved", validation.resolveLessonReview(lesson, [approved]).state === "approved");

const blocking = record({
  id: "lr_validation_blocking",
  decision: "approved",
  findings: [{ ...finding, severity: "blocking", blockPublication: true }],
  notes: "Test fixture blocking finding: this must never resolve as an approval.",
});
const blockingProblems = validation.reviewRecordProblems(blocking, lesson);
check("an approval carrying a blocking finding is refused", blockingProblems.some((p) => p.code === "approval_with_blocking_finding"), blockingProblems.map((p) => p.message).join("; "));

const generated = record({ source: "ai", authority: "teacher-account" });
check("an AI-sourced record is not a human review", validation.reviewRecordProblems(generated, lesson).some((p) => p.code === "not_human"));
const aiSubmission = { ...changes, source: "ai" };
check("an AI-sourced submission is refused before it can become a review", validation.reviewInputProblems(aiSubmission, lesson).some((p) => p.code === "not_human"));

const changed = { ...lesson, version: "9.9.9" };
const changedHash = validation.lessonContentHash(changed);
const blankSubmission = { lessonId: lesson.conceptId };
const blankProblems = validation.reviewInputProblems(blankSubmission, lesson);
check("a blank form is invalid, not stale, and says what is missing",
  blankProblems.length > 0 && !blankProblems.some((p) => p.code === "review_stale") && blankProblems.some((p) => p.code === "review_version_required"),
  blankProblems.map((p) => p.code).join("; "));
const staleProblems = validation.reviewRecordProblems(changes, changed);
check("an old version/hash is stale against a changed lesson", staleProblems.some((p) => p.code === "review_stale"), staleProblems.map((p) => p.message).join("; "));
check("a stale review resolves as stale, not approved", validation.resolveLessonReview(changed, [changes]).state === "stale");
const newVersionRecord = record({
  id: "lr_validation_new_version",
  lessonVersion: "9.9.9",
  contentHash: changedHash,
  decision: "approved",
  findings: [],
  notes: "Test fixture: a later version needs this separate record before it can be approved.",
});
check("a review of the new version can pass", validation.reviewRecordProblems(newVersionRecord, changed).length === 0);
check("the new version resolves as approved only with its own review", validation.resolveLessonReview(changed, [changes, newVersionRecord]).state === "approved");

console.log("\n▸ Improvement tasks");
const tasks = validation.improvementTasksFromReview(changes);
check("every finding becomes one task", tasks.length === 1, `got ${tasks.length}`);
check("the task keeps its location, severity and source review", tasks[0]?.location === finding.location && tasks[0]?.severity === "major" && tasks[0]?.reviewId === changes.id);
check("the task starts open", tasks[0]?.status === "open");
check("a task from an old version is marked as not applying", !validation.taskAppliesToLesson(tasks[0], changed));

console.log("\n▸ Persistence in a temporary store");
await store.appendLessonReview(changes, tasks);
const storedReviews = await store.listLessonReviews();
const storedTasks = await store.listLessonImprovementTasks();
check("the review is persisted", storedReviews.some((r) => r.id === changes.id));
check("the task is persisted in the same write", storedTasks.some((t) => t.reviewId === changes.id));
const updated = await store.updateLessonImprovementTask(tasks[0].id, {
  status: "done",
  resolution: { by: "Validation test fixture", at: "2026-11-09T00:00:00.000Z", note: "Test fixture correction." },
});
check("a human task can be marked done with a resolution note", updated?.status === "done" && Boolean(updated.resolution?.note));
check(
  "a completed task does not approve a later lesson version",
  updated?.status === "done" && validation.resolveLessonReview(changed, storedReviews).state === "stale" && !validation.taskAppliesToLesson(updated, changed),
  updated ? `${updated.status}; ${validation.resolveLessonReview(changed, storedReviews).state}; applies=${validation.taskAppliesToLesson(updated, changed)}` : "no task",
);

console.log("\n▸ Pack and blank forms");
const packPath = path.join(process.cwd(), "audit", "validation", "TEACHER_REVIEW_PACK.md");
const manifestPath = path.join(process.cwd(), "audit", "validation", "PACK_MANIFEST.json");
const pack = fs.readFileSync(packPath, "utf8");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
check("the pack has one blank form per target lesson", (pack.match(/^### Review record/gm) ?? []).length === 5);
check("the pack has five blank verdict lines", (pack.match(/\*\*Overall verdict:\*\* ______________________________/g) ?? []).length === 5);
check("the pack contains no fabricated approval verdict", !/\*\*Overall verdict:\*\* (approved|changes requested)/i.test(pack));
const targetLessons = ["probability-basics", "ratio", "proportion", "sequences", "indices-intro"].map((id) => AUTHORED_BY_CONCEPT[id]);
check("the pack manifest matches the current five lesson hashes", validation.packStaleness(manifest, targetLessons).length === 0, validation.packStaleness(manifest, targetLessons).join("; "));
check("the pack manifest detects a changed version", validation.packStaleness(manifest, [{ ...targetLessons[0], version: "9.9.9" }]).length > 0);

const route = fs.readFileSync(path.join(process.cwd(), "app/api/lesson-review/route.ts"), "utf8");
check("the intake route derives the reviewer from a teaching account", /teacherCaller\(req\)/.test(route));
check("the intake route stores only human/teacher-account authority", /source: "human"/.test(route) && /authority: "teacher-account"/.test(route));
check("the intake route appends the review and its tasks together", /appendLessonReview\(record, tasks\)/.test(route));

console.log("\n▸ Result");
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`  ${passed} passed, ${failed} failed`);
console.log("  The fixture was written to a temporary directory and deleted; it is not a teacher or learner record.");
process.exit(failed === 0 ? 0 : 1);
