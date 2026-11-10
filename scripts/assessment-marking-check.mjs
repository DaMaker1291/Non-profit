#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT MARKING BEHAVIOUR
//
// The blueprint gate checks the RECORD. This gate checks what the compiled
// scheme DOES: full marks, partial credit, accepted alternatives, a missing
// unit, a wrong method, a diagnosed misconception, and prose that must not be
// machine-marked at all.
//
// Every mark here comes from `gradeStructuredParts` — the same marker the
// papers use. This script adds no second marking engine; it proves the
// blueprint adapter reaches the real one.
//
// The reviewed blueprint below is an IN-MEMORY FIXTURE, clearly labelled. It
// exists to test the positive path of the gate (a review record makes serving
// reachable) and is never written to an audit or served to a learner. Both real
// blueprints remain unreviewed, so `approvedAssessmentItems()` must be empty.
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);

const { DIET_DIGESTION_BLUEPRINT } = require("../.verify/assessment-blueprints/diet-digestion.js");
const { PHYSICS_ENERGY_BLUEPRINT } = require("../.verify/assessment-blueprints/physics-energy.js");
const { MATHS_TABLES_BLUEPRINT } = require("../.verify/assessment-blueprints/maths-tables.js");
const { validateAssessmentBlueprint, assessmentServingDecision } = require("../.verify/assessment-intelligence.js");
const {
  compileAssessmentItem,
  advisoryMisconceptions,
  servedAssessmentItem,
  approvedAssessmentItems,
} = require("../.verify/assessment-serving.js");
const { gradeStructuredParts } = require("../.verify/structured-items.js");

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}

const itemOf = (bp, id) => bp.items.find((item) => item.id === id);
const criterion = (grade, id) => grade.parts.flatMap((part) => part.criteria).find((entry) => entry.id === id);
function mark(bp, id, given, working = "") {
  const compiled = compileAssessmentItem(bp, itemOf(bp, id));
  if (!compiled.structured) throw new Error(`${bp.id}/${id}: expected a machine-markable item`);
  return { compiled, grade: gradeStructuredParts(compiled.structured.parts, [given], [working]) };
}

const D = DIET_DIGESTION_BLUEPRINT;
const P = PHYSICS_ENERGY_BLUEPRINT;
const M = MATHS_TABLES_BLUEPRINT;

// ── BIOLOGY: NUMERIC, METHOD AND ANSWER MARKED SEPARATELY ───────────────────
{
  const full = mark(D, "dd-05", "630 J/g", "20 × 4.2 × 15 = 1260");
  ok(full.grade.awarded === 2, "dd-05 full answer earns 2");
  ok(full.grade.parts[0].criteria.every((c) => c.met), "dd-05 both criteria met");
  ok(full.grade.parts[0].criteria.some((c) => c.kind === "method"), "dd-05 has a method criterion");

  // A learner may show the substitution, its result and the final division in
  // one line. The credited step is inside that working, so the method mark is
  // earned; an exact-string match rejected this correct response in the browser.
  const extendedWorking = mark(
    D, "dd-05", "630 J/g",
    "20 × 4.2 × 15 = 1260; 1260 ÷ 2.0 = 630",
  );
  ok(extendedWorking.grade.awarded === 2, "dd-05 earns both marks when the credited step is part of longer working");
  ok(criterion(extendedWorking.grade, "dd-05-c1").met, "dd-05 method is recognised inside the full calculation");

  const missingUnit = mark(D, "dd-05", "630", "20 × 4.2 × 15 = 1260");
  ok(missingUnit.grade.awarded === 1, "dd-05 missing unit keeps the method mark (1/2)");
  ok(criterion(missingUnit.grade, "dd-05-c2").awarded === 0, "dd-05 missing unit loses the answer mark");
  ok(/unit/i.test(criterion(missingUnit.grade, "dd-05-c2").why), "dd-05 missing unit is named in the feedback");

  const wrongValue = mark(D, "dd-05", "126 J/g", "20 × 4.2 × 15 = 1260");
  ok(wrongValue.grade.awarded === 1, "dd-05 right method with wrong answer earns the method mark");
  ok(criterion(wrongValue.grade, "dd-05-c1").met && !criterion(wrongValue.grade, "dd-05-c2").met,
    "dd-05 method met, answer not met");

  const noWorking = mark(D, "dd-05", "630 J/g", "");
  ok(noWorking.grade.awarded === 1, "dd-05 correct answer without working earns only the answer mark");
  ok(!criterion(noWorking.grade, "dd-05-c1").met, "dd-05 no working cannot earn the method mark");
  ok(/No working/i.test(criterion(noWorking.grade, "dd-05-c1").why), "dd-05 says the method was not shown");

  const wrongMethod = mark(D, "dd-05", "126 J/g", "20 × 15");
  ok(wrongMethod.grade.awarded === 0, "dd-05 wrong reasoning and wrong answer earns 0");
  ok(wrongMethod.grade.parts[0].criteria.every((c) => !c.met), "dd-05 every criterion fails");
}

// ── BIOLOGY: SHORT RECALL, ALTERNATIVES AND PARTIAL CREDIT ────────────────
{
  const full = mark(D, "dd-01", "Fatty acids and glycerol.");
  ok(full.grade.awarded === 2, "dd-01 both products earn 2");

  const reordered = mark(D, "dd-01", "glycerine and fatty acid");
  ok(reordered.grade.awarded === 2, "dd-01 accepted alternative wording, either order, earns 2");

  const partial = mark(D, "dd-01", "fatty acids");
  ok(partial.grade.awarded === 1, "dd-01 one product earns 1 of 2");
  ok(criterion(partial.grade, "dd-01-c1").met && !criterion(partial.grade, "dd-01-c2").met,
    "dd-01 partial credit names which point was earned");

  const substrate = mark(D, "dd-01", "fat");
  ok(substrate.grade.awarded === 0, "dd-01 naming the substrate is not naming a product");

  const wrong = mark(D, "dd-01", "glucose and amino acids");
  ok(wrong.grade.awarded === 0, "dd-01 carbohydrate products earn nothing");
  const flagged = criterion(wrong.grade, "dd-01-c2").misconception;
  ok(flagged?.id === "fat-products-are-sugars", "dd-01 glucose response is diagnosed as fat-to-sugar");
  ok(criterion(wrong.grade, "dd-01-c2").awarded === 0, "dd-01 the diagnosis does not award a mark");
  ok(/fatty acids and glycerol/i.test(flagged?.feedback ?? ""), "dd-01 diagnosis names the correct products");
}

// ── BIOLOGY: PROSE IS A RUBRIC, NEVER A KEYWORD SCORE ─────────────────────
{
  const compiled = compileAssessmentItem(D, itemOf(D, "dd-02"));
  ok(compiled.structured === null, "dd-02 prose compiles to no machine item");
  ok(compiled.machineMarkable === false, "dd-02 prose is not machine-markable");
  ok(compiled.rubric.length === 4, "dd-02 rubric keeps all four marking points");
  ok(compiled.rubric.every((c) => c.marks === 1), "dd-02 rubric marks are the authored marks");

  const flags = advisoryMisconceptions(D, itemOf(D, "dd-02"), "Villi push food through the gut.");
  ok(flags.some((flag) => flag.id === "villi-are-muscles"), "dd-02 diagnoses villi-as-muscle as advisory");
  ok(flags.every((flag) => flag.advisory === true), "dd-02 diagnosis is labelled advisory");
  ok(flags.every((flag) => !("awarded" in flag)), "dd-02 advisory diagnosis carries no mark");

  const good = advisoryMisconceptions(
    D,
    itemOf(D, "dd-02"),
    "Villi increase the surface area, the wall is one cell thick, and capillaries maintain a gradient.",
  );
  ok(good.length === 0, "dd-02 a correct response raises no misconception flag");
}

// ── PHYSICS: THE SAME MARKER, A DIFFERENT ASSESSMENT STYLE ─────────────────
{
  const pe02 = mark(P, "pe-02", "90000 J", "2.5 × 900 × 40");
  ok(pe02.grade.awarded === 2, "pe-02 energy calculation earns 2");

  const pe02Unit = mark(P, "pe-02", "90000", "2.5 × 900 × 40");
  ok(pe02Unit.grade.awarded === 1, "pe-02 missing joule keeps the method mark");
  ok(/unit/i.test(criterion(pe02Unit.grade, "pe-02-c2").why), "pe-02 missing unit is named");

  const pe03 = mark(P, "pe-03", "600 W", "180000 / 300");
  ok(pe03.grade.awarded === 2, "pe-03 power calculation earns 2");

  const pe03BadTime = mark(P, "pe-03", "36000 W", "180000 / 5");
  ok(pe03BadTime.grade.awarded === 0, "pe-03 dividing by minutes rather than seconds earns 0");

  const pe04 = mark(P, "pe-04", "70%", "350 / 500 × 100");
  ok(pe04.grade.awarded === 2, "pe-04 efficiency earns 2");

  const pe01 = mark(P, "pe-01", "joule and watt");
  ok(pe01.grade.awarded === 2, "pe-01 both units earn 2");

  const pe01wrong = mark(P, "pe-01", "joule and joule");
  ok(pe01wrong.grade.awarded === 1, "pe-01 repeating the energy unit earns 1 of 2");
  ok(criterion(pe01wrong.grade, "pe-01-c2").misconception?.id === "power-is-energy",
    "pe-01 joule-for-power is diagnosed");

  const pe05 = compileAssessmentItem(P, itemOf(P, "pe-05"));
  ok(pe05.structured === null && pe05.machineMarkable === false, "pe-05 prose is not machine-marked");
  const pe05flags = advisoryMisconceptions(P, itemOf(P, "pe-05"), "Energy is lost as heat, so the lamp is inefficient.");
  ok(pe05flags.some((flag) => flag.id === "efficiency-is-energy-loss"),
    "pe-05 'energy is lost' is diagnosed as a misconception, not accepted");
}

// ── MATHS: THE EXISTING TABLE MARKER, ONE MARK PER BLANK CELL ──────────────
{
  const table = compileAssessmentItem(M, itemOf(M, "mt-01"));
  ok(table.structured?.parts[0].response === "table", "mt-01 compiles to the existing table part");
  ok(table.structured?.parts[0].table?.rows[0].cells.filter((c) => c.answer !== undefined).length === 4,
    "mt-01 carries four blank cells");

  const full = mark(M, "mt-01", JSON.stringify(["-1", "1", "3", "5"]));
  ok(full.grade.awarded === 4, "mt-01 all four cells earn 4");
  const partial = mark(M, "mt-01", JSON.stringify(["-1", "1", "", ""]));
  ok(partial.grade.awarded === 2, "mt-01 two correct cells keep two marks");
  ok(partial.grade.parts[0].criteria.length === 4, "mt-01 reports one criterion per cell");
  const wrong = mark(M, "mt-01", JSON.stringify(["0", "0", "0", "0"]));
  ok(wrong.grade.awarded === 0, "mt-01 wrong cells earn 0");

  const short = mark(M, "mt-02", "coefficient 2, constant 1");
  ok(short.grade.awarded === 2, "mt-02 recalls both named parts");

  const prose = compileAssessmentItem(M, itemOf(M, "mt-03"));
  ok(prose.structured === null && prose.machineMarkable === false, "mt-03 prose is not machine-marked");
  const flags = advisoryMisconceptions(M, itemOf(M, "mt-03"), "I worked out that (-1) squared is -1, so the answer is 3.");
  ok(flags.some((flag) => flag.id === "square-negative-is-negative"), "mt-03 diagnoses the square-sign slip as advisory");
}

// ── THE REVIEW GATE: UNREVIEWED IS NEVER SERVED ───────────────────────────
{
  ok(assessmentServingDecision(D).ok === false, "diet blueprint is refused for serving while unreviewed");
  ok(assessmentServingDecision(P).ok === false, "physics blueprint is refused for serving while unreviewed");
  ok(assessmentServingDecision(M).ok === false, "maths table blueprint is refused while unreviewed");
  ok(assessmentServingDecision(M).reasons.some((reason) => /unreviewed/i.test(reason)),
    "maths refusal names review, even though its rights and licensing are clear");
  ok(assessmentServingDecision(D).reasons.some((reason) => /unreviewed/i.test(reason)),
    "diet refusal names the review status");
  ok(assessmentServingDecision(D).reasons.some((reason) => /rights are unknown/i.test(reason)),
    "diet refusal also names unknown source rights");
  ok(assessmentServingDecision(P).reasons.some((reason) => /licensing is unknown/i.test(reason)),
    "physics refusal names unknown licensing");
  ok(servedAssessmentItem(D, "dd-05").ok === false, "dd-05 cannot be served from an unreviewed blueprint");
  ok(servedAssessmentItem(P, "pe-02").ok === false, "pe-02 cannot be served from an unreviewed blueprint");
  ok(servedAssessmentItem(M, "mt-01").ok === false, "mt-01 cannot be served while its review is missing");
  ok(approvedAssessmentItems().length === 0, "no assessment item is approved for papers in this repository");
  ok(validateAssessmentBlueprint(D).summary.reviewedItems === 0, "diet audit reports zero reviewed items");
  ok(validateAssessmentBlueprint(P).summary.reviewedItems === 0, "physics audit reports zero reviewed items");
}

// ── A REVIEWED FIXTURE: THE POSITIVE PATH, CLEARLY NOT A REAL REVIEW ──────
{
  const reviewed = JSON.parse(JSON.stringify(D));
  reviewed.version = "1.0.1";
  reviewed.reviewStatus = "teacher-reviewed";
  reviewed.teacherReviewed = true;
  reviewed.humanReviewCount = 1;
  reviewed.reviews = [{
    reviewer: "Dr A. Teacher",
    role: "subject-teacher",
    date: "2026-11-01",
    scope: "whole blueprint",
    verdict: "approved",
    blueprintVersion: "1.0.1",
  }];
  reviewed.items.forEach((item) => { item.reviewStatus = "teacher-reviewed"; });
  // The fixture must clear RIGHTS and LICENSING independently; a review record
  // alone cannot open the gate any more.
  reviewed.sources.forEach((source) => { source.rights = "cleared"; source.licensing = "cleared"; });

  ok(validateAssessmentBlueprint(reviewed).ok, "a blueprint with a complete review record validates");
  ok(assessmentServingDecision(reviewed).ok, "the serving gate opens for a reviewed fixture");
  const servedNumeric = servedAssessmentItem(reviewed, "dd-05");
  ok(servedNumeric.ok === true, "the reviewed fixture serves a numeric item");
  ok(servedNumeric.compiled?.machineMarkable === true, "the served numeric item is machine-markable");
  ok(servedNumeric.compiled?.structured?.id === "assessment:biology.diet-digestion.year9:dd-05",
    "the served item is namespaced as assessment content");
  const servedProse = servedAssessmentItem(reviewed, "dd-02");
  ok(servedProse.ok === true && servedProse.compiled?.machineMarkable === false,
    "the reviewed fixture serves prose as a human-marked rubric");

  const noRecord = JSON.parse(JSON.stringify(reviewed));
  noRecord.reviews = [];
  noRecord.humanReviewCount = 0;
  ok(!validateAssessmentBlueprint(noRecord).ok, "a teacher-reviewed claim with no record is refused");

  const placeholder = JSON.parse(JSON.stringify(reviewed));
  placeholder.reviews[0].reviewer = "TBD";
  ok(!validateAssessmentBlueprint(placeholder).ok, "a placeholder reviewer is refused");

  const wrongVersion = JSON.parse(JSON.stringify(reviewed));
  wrongVersion.reviews[0].blueprintVersion = "0.0.1";
  ok(!validateAssessmentBlueprint(wrongVersion).ok, "a review of another version is refused");

  const future = JSON.parse(JSON.stringify(reviewed));
  future.reviews[0].date = "2999-01-01";
  ok(!validateAssessmentBlueprint(future).ok, "a future-dated review is refused");

  const reviewOnly = JSON.parse(JSON.stringify(reviewed));
  reviewOnly.sources.forEach((source) => { source.rights = "unknown"; });
  ok(!assessmentServingDecision(reviewOnly).ok, "a review alone does not open the gate: source rights remain independent");
  ok(assessmentServingDecision(reviewOnly).reasons.some((reason) => /rights are unknown/i.test(reason)),
    "the refusal names the rights gap rather than review");
  const noLicence = JSON.parse(JSON.stringify(reviewed));
  noLicence.sources.forEach((source) => { source.licensing = "unknown"; });
  ok(!assessmentServingDecision(noLicence).ok, "a review alone does not open the gate: licensing remains independent");

  const changes = JSON.parse(JSON.stringify(reviewed));
  changes.reviews[0].verdict = "changes-requested";
  changes.humanReviewCount = 0;
  ok(!assessmentServingDecision(changes).ok, "a changes-requested review does not open the serving gate");

  const unreviewed = JSON.parse(JSON.stringify(reviewed));
  unreviewed.reviewStatus = "unreviewed";
  unreviewed.teacherReviewed = false;
  unreviewed.humanReviewCount = 0;
  unreviewed.reviews = [];
  unreviewed.items.forEach((item) => { item.reviewStatus = "unreviewed"; });
  ok(!assessmentServingDecision(unreviewed).ok, "returning to unreviewed closes the gate again");
}

console.log(
  `assessment marking: ${passed} passed, ${failed} failed ` +
    `(3 blueprints, ${D.items.length + P.items.length + M.items.length} items, 0 reviewed, 0 learner-tested)`,
);
if (failed) {
  console.error("assessment marking: marking behaviour or the review gate did not hold");
  process.exit(1);
}
console.log("✓ marking follows criteria, partial credit is preserved, prose is rubric-only, and unreviewed content is refused.");
