#!/usr/bin/env node
// ── WHAT HAS BEEN VERIFIED, AND HOW — IN FIVE TIERS THAT ARE NOT INTERCHANGEABLE
//
// The audit's central finding was that a green gate was being read as "the
// content is verified". It is not, and this script exists so the distinction is
// printed by the same command that runs the gates:
//
//   1. structural        — four distinct options, no float noise, an explanation,
//                          a sane difficulty. Every concept passes this.
//   2. prompt-derived    — a matcher re-derives the answer from the prompt, so a
//                          WRONG KEY would be caught. Five concepts pass this.
//   3. human item review — a named person read the items. Zero.
//   4. educator review   — a qualified teacher reviewed a lesson or a curriculum.
//                          Zero, and it has its own registry file.
//   5. classroom         — a real class was taught and assessed. Zero.
//
// The script does two jobs: it prints the five numbers, and it FAILS when a
// claim is bigger than its record — a review without a name and a date, an item
// review not written into the item registry, or a scope claim larger than the
// external register it is supposed to be backed by. A claim that cannot be
// traced to a person is not evidence, which is the one rule this repository
// keeps everywhere else.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};

const coverage = read("audit/verification-coverage.json", null);
const itemReviews = read("audit/item-reviews.json", { reviews: [] });
const external = read("audit/external-reviews.json", { reviews: [] });
const scope = read("OPENMIND_SCOPE.json", null);

let failed = 0;
const fail = (line) => {
  failed += 1;
  console.error(`  ✗ ${line}`);
};
const ok = (condition, label) => {
  if (!condition) fail(label);
};

console.log("▸ Content validation status — five tiers, none interchangeable");

const structure = coverage?.layers?.structure ?? 0;
const promptDerived = coverage?.layers?.promptDerived?.length ?? 0;
const structuralOnly = coverage?.layers?.structuralOnly?.length ?? 0;
const draws = coverage?.draws ?? 0;
const perConcept = coverage?.perConcept ?? {};
const humanInCoverage = Object.values(perConcept).filter((v) => v && v.humanReviewed).length;

const validItemReviews = (itemReviews.reviews ?? []).filter(
  (r) => r && typeof r.conceptId === "string" && typeof r.reviewer === "string" && r.reviewer.trim().length > 1 && /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? ""),
);
const externalReviews = external.reviews ?? [];
const lessonReviews = externalReviews.filter((r) => r.kind === "lesson" || r.kind === "curriculum");
const classroomTrials = externalReviews.filter((r) => r.kind === "classroom");

console.log(`  1 structural .................. ${structure} concepts (${draws.toLocaleString()} draws)`);
console.log(`  2 prompt-derived answers ...... ${promptDerived} of ${structure}`);
console.log(`  3 human item review .......... ${humanInCoverage}`);
console.log(`  4 educator review ............ ${lessonReviews.length} lesson/curriculum`);
console.log(`  5 classroom validation ....... ${classroomTrials.length} trial`);
console.log("  A green structural gate does NOT mean the content is independently verified.");

// ── THE RECORDS MUST ADD UP ─────────────────────────────────────────────────
ok(structure > 0, "the coverage record exists and counts a bank");
ok(promptDerived + structuralOnly === structure, `prompt-derived (${promptDerived}) + structural-only (${structuralOnly}) equals the bank (${structure})`);
ok((itemReviews.reviews ?? []).length === validItemReviews.length, "every item review names a reviewer and a date");
ok(humanInCoverage === validItemReviews.length, `the coverage record's human-reviewed count (${humanInCoverage}) matches the item registry (${validItemReviews.length})`);

// A scope claim is a PROMISE about people. It may never exceed the register.
const claims = scope?.claims ?? {};
ok(
  (claims.educatorReviewedLessons ?? 0) <= lessonReviews.length,
  `scope claims ${claims.educatorReviewedLessons ?? 0} educator-reviewed lessons; the register holds ${lessonReviews.length}`,
);
ok(
  (claims.learnerTestedLessons ?? 0) <= classroomTrials.length,
  `scope claims ${claims.learnerTestedLessons ?? 0} learner-tested lessons; the register holds ${classroomTrials.length}`,
);
ok(
  (claims.educatorReviewedCurricula ?? 0) <= lessonReviews.filter((r) => r.kind === "curriculum").length,
  `scope claims ${claims.educatorReviewedCurricula ?? 0} reviewed curricula; the register holds ${lessonReviews.filter((r) => r.kind === "curriculum").length}`,
);

if (promptDerived < structure) {
  console.log(
    `  ${structuralOnly} concepts are checked for SHAPE only. A wrong answer key in one of them would not be caught by any gate.`,
  );
}
if (humanInCoverage === 0) console.log("  No qualified person has reviewed any item. Nothing above tier 2 exists.");

if (failed > 0) {
  console.error(`✗ content validation status: ${failed} inconsistency${failed === 1 ? "" : "ies"}`);
  process.exitCode = 1;
}
