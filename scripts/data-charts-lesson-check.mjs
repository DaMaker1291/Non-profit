#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DATA CHARTS — the lesson's shares, angles and scale claims, checked.
//
// The lesson contract proves the parts exist. It cannot prove that the travel
// survey's angles are 90°, 144°, 72° and 54°, that the truncated axis draws
// heights of 2 and 6, or that 30 out of 250 is a larger share than 40 out of
// 400. This gate evaluates every pinned number separately from the prose.
//
// It is NOT teacher review and NOT a learner trial. A passing run says the
// arithmetic and the stated rules agree; it says nothing about whether a pupil
// reads a chart critically without being prompted.
//
// Run: node scripts/data-charts-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_DATA_CHARTS: lesson } = require("../.verify/lessons/authored/maths-data-charts.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b, tolerance = 1e-9) => Math.abs(Number(a) - Number(b)) < tolerance;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const angle = (count, total) => (count / total) * 360;
const share = (count, total) => count / total;

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "data-charts", "the lesson is for data-charts");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.objectives.every((objective) => objective.statement.length > 50 && objective.evidence.length > 50),
  "every objective carries a measurable evidence statement");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.priorKnowledge.conceptIds.includes("averages"),
  "the diagnostic names the genome's declared prerequisite, averages");
ok(lesson.priorKnowledge.check.every((check) => check.targets.includes("averages")),
  "every prerequisite check actually targets averages");
ok(lesson.explanation.length === 4, "there are four explanation sections");
ok(lesson.explanation.flatMap((section) => section.paragraphs).length === 8,
  "there are eight explanation paragraphs");
ok(lesson.representations.length === 3, "there are three representation blocks");
ok(lesson.representations.every((block) => block.kind === "maths.expression"),
  "the representations use the mathematics framework");
ok(lesson.representations.every((block) => typeof block.caption === "string" && block.caption.length > 80),
  "every representation carries a teaching caption, not a label");
ok(lesson.workedExamples.length === 3, "there are three worked examples");
ok(lesson.workedExamples.every((example) => example.steps.length >= 3),
  "every worked example models at least three moves");
ok(lesson.workedExamples.every((example) => example.steps.every((step) => step.why.length > 30)),
  "every move states a reason, not only an instruction");
ok(lesson.misconceptions.length === 3, "there are three misconceptions taught");
ok(lesson.guidedPractice.length === 3, "there are three guided practice items");
ok(lesson.assessment.length === 3, "there are three assessment items");
ok(lesson.assessment.some((item) => item.kind === "constructed-response"),
  "at least one assessment asks for reasoning in words");
ok(lesson.assessment.filter((item) => item.kind === "short-answer")
  .every((item) => Array.isArray(item.check?.accepted) && item.check.accepted.length > 0),
  "every short-answer item carries explicit accepted answers");
ok(lesson.transfer.length === 1, "there is one transfer challenge");
ok(lesson.retrieval.length === 3, "there are three retrieval prompts");
ok(lesson.retrieval.some((item) => item.when === "next-day") &&
  lesson.retrieval.some((item) => item.when === "week-later") &&
  lesson.retrieval.some((item) => item.when === "month-later"),
  "the retrieval prompts include next-day, week-later and month-later spacing");
ok(lesson.accessibility.length >= 5, "there are at least five accessibility alternatives");
ok(lesson.summary.length >= 4, "there is a usable summary");
ok(lesson.provenance.length === 2, "the lesson carries its authorship and curriculum provenance");

// ── The sports table and its bar chart ──────────────────────────────────────
const sports = { football: 12, netball: 8, swimming: 5, athletics: 3 };
const sportsTotal = sum(Object.values(sports));
ok(sportsTotal === 28, "the sports table totals 28 learners");
ok(Object.values(sports).every((count) => count > 0), "every sport has a positive count");
ok(Math.max(...Object.values(sports)) === 12, "the tallest bar is football at 12");
ok(Math.min(...Object.values(sports)) === 3, "the shortest bar is athletics at 3");
ok(close(12 / 3, 4), "the tallest bar is four times the shortest on a zero baseline");
ok(lesson.workedExamples[0].answer.includes("0–12"),
  "the worked bar example states the 0–12 scale it chose");
ok(close(sports.football / sportsTotal, 12 / 28), "football's share is consistent with its count");
ok(lesson.workedExamples[0].prompt.includes("football 12") &&
   lesson.workedExamples[0].prompt.includes("athletics 3"),
  "the worked example states the counts it asks the learner to chart");
ok(lesson.workedExamples[0].answer.includes("28"),
  "the worked example's answer states the total");

// ── The travel pie ──────────────────────────────────────────────────────────
const travel = { walk: 15, bus: 24, car: 12, cycle: 9 };
const travelTotal = sum(Object.values(travel));
const travelAngles = Object.fromEntries(
  Object.entries(travel).map(([key, count]) => [key, angle(count, travelTotal)]),
);
ok(travelTotal === 60, "the travel survey totals 60 learners");
ok(close(travelAngles.walk, 90), "walking is 90°");
ok(close(travelAngles.bus, 144), "the bus is 144°");
ok(close(travelAngles.car, 72), "the car is 72°");
ok(close(travelAngles.cycle, 54), "cycling is 54°");
ok(close(sum(Object.values(travelAngles)), 360), "the four angles sum to 360°");
ok(close(share(travel.bus, travelTotal), 0.4), "the bus is 40% of the learners");
ok(close(travel.bus, 24), "the bus count is 24, which is 40% of 60");
ok(Object.values(travelAngles).every((degrees) => degrees > 0 && degrees < 360),
  "no single category takes the whole circle");
ok(lesson.workedExamples[1].prompt.includes("walk 15") &&
   lesson.workedExamples[1].prompt.includes("cycle 9"),
  "the worked pie example states the counts it asks the learner to convert");

// ── The truncated axis ──────────────────────────────────────────────────────
const before = 32;
const after = 36;
ok(after - before === 4, "the true rise is 4");
ok(close((after - before) / before, 0.125), "the true rise is 12.5% of the starting value");
ok(after - 30 === 6 && before - 30 === 2, "a baseline of 30 draws heights of 6 and 2");
ok(close((after - 30) / (before - 30), 3), "the truncated chart draws a three-times ratio");
ok(close(after / before, 1.125), "the true ratio is 1.125, not 3");
ok(close(before / 40, 0.8) && close(after / 40, 0.9),
  "on a 0–40 axis the bars are 80% and 90% of full height");
ok(close(0.9 / 0.8, 1.125), "the zero-based picture keeps the true ratio");
ok(before > 30 && after > 30, "both values sit above the truncated baseline, so no bar is negative");
ok(lesson.representations[2].notation.includes("12.5%"),
  "the representation states the true percentage change");
ok(lesson.representations[2].notation.includes("2 and 6"),
  "the representation states the drawn heights the axis produces");

// ── Guided practice ─────────────────────────────────────────────────────────
ok(/bar chart/i.test(lesson.guidedPractice[0].answer),
  "p1 chooses a bar chart for unordered categories");
ok(/line/i.test(lesson.guidedPractice[0].answer) &&
   /no order|unordered|invent/i.test(lesson.guidedPractice[0].answer),
  "p1 explains why a line graph is wrong for unordered categories");
const p2 = { walk: 10, bus: 20, car: 10 };
const p2Total = sum(Object.values(p2));
ok(p2Total === 40, "p2's survey totals 40 learners");
ok(close(angle(p2.walk, p2Total), 90) && close(angle(p2.car, p2Total), 90),
  "p2's walking and car angles are 90°");
ok(close(angle(p2.bus, p2Total), 180), "p2's bus angle is 180°");
ok(close(angle(p2.walk, p2Total) + angle(p2.bus, p2Total) + angle(p2.car, p2Total), 360),
  "p2's angles sum to 360°");
ok(close(share(p2.bus, p2Total), 0.5), "p2's bus is half the learners, which is the half-circle sector");
const p3Before = 52;
const p3After = 58;
ok(p3After - p3Before === 6, "p3's true difference is 6");
ok(close(6 / 52, 0.11538461538461539), "p3's change is about 11.5%");
ok(p3After - 50 === 8 && p3Before - 50 === 2, "p3's truncated axis draws heights of 8 and 2");
ok(close(8 / 2, 4), "p3's picture shows a four-times difference");
ok(lesson.guidedPractice[2].answer.includes("11.5%"),
  "p3's answer states the true percentage, not only the difference");

// ── Assessment keys ─────────────────────────────────────────────────────────
const a1 = lesson.assessment.find((item) => item.id === "a1");
const a2 = lesson.assessment.find((item) => item.id === "a2");
const a3 = lesson.assessment.find((item) => item.id === "a3");
const a1Data = { bus: 80, walk: 50, car: 40, cycle: 30 };
const a1Total = sum(Object.values(a1Data));
ok(a1Total === 200, "a1's survey totals 200 learners");
ok(close(angle(a1Data.bus, a1Total), 144), "a1's bus angle is 144°");
ok(close(angle(a1Data.walk, a1Total), 90), "a1's walking angle is 90°");
ok(close(angle(a1Data.car, a1Total), 72), "a1's car angle is 72°");
ok(close(angle(a1Data.cycle, a1Total), 54), "a1's cycling angle is 54°");
ok(close(sum(Object.values(a1Data).map((count) => angle(count, a1Total))), 360),
  "a1's four angles sum to 360°");
ok(close(share(a1Data.bus, a1Total), 0.4), "a1's bus share is 40%");
ok(close(share(a1Data.cycle, a1Total), 0.15), "a1's cycling share is 15%");
ok(a1?.marking.length === 4, "a1 carries four marking criteria");
ok(a1.modelAnswer.includes("200"), "a1's model answer uses the total 200");
ok(a1.modelAnswer.includes("144") && a1.modelAnswer.includes("54"),
  "a1's model answer states the computed angles");
ok(a1.modelAnswer.includes("zero"), "a1's model answer explains the zero baseline");
ok(a2 && close(0.25 * 80, 20), "a2's 25% of 80 is 20");
ok(a2?.check.accepted.some((answer) => answer.trim() === "20"), "a2 accepts 20");
ok(a3 && close(116 - 108, 8), "a3's true difference is 8");
ok(a3?.check.accepted.some((answer) => answer.trim() === "8"), "a3 accepts 8");
ok(a2?.marking.length >= 2 && a3?.marking.length >= 2,
  "the short-answer items carry marking criteria, not only a key");

// ── Transfer: counts against shares ─────────────────────────────────────────
const schoolA = { total: 400, cyclists: 40 };
const schoolB = { total: 250, cyclists: 30 };
ok(close(share(schoolA.cyclists, schoolA.total), 0.1), "School A's cycling share is 10%");
ok(close(share(schoolB.cyclists, schoolB.total), 0.12), "School B's cycling share is 12%");
ok(schoolB.cyclists < schoolA.cyclists, "School B has fewer cyclists in total");
ok(share(schoolB.cyclists, schoolB.total) > share(schoolA.cyclists, schoolA.total),
  "School B has the higher share");
ok(close(share(30, 500), 0.06), "30 cyclists out of 500 is 6%, which reverses the second claim");
ok(lesson.transfer[0].answer.includes("40") && lesson.transfer[0].answer.includes("30"),
  "the transfer answer keeps both counts visible");
ok(lesson.transfer[0].answer.includes("10%") && lesson.transfer[0].answer.includes("12%"),
  "the transfer answer states both shares");
ok(lesson.transfer[0].answer.includes("500"),
  "the transfer answer names the total that would reverse the share claim");

// ── Retrieval ───────────────────────────────────────────────────────────────
ok(/line/i.test(lesson.retrieval[0].answer), "x1 chooses a line graph for change over time");
ok(/order/i.test(lesson.retrieval[0].answer), "x1 gives the ordered-sequence reason");
ok(close(90 / 360, 0.25), "x2's 90° is 25%");
ok(lesson.retrieval[1].answer.includes("25%") && lesson.retrieval[1].answer.includes("quarter"),
  "x2 states both the percentage and the fraction");
ok(/zero/i.test(lesson.retrieval[2].answer), "x3 answers with the zero baseline");
ok(/length/i.test(lesson.retrieval[2].answer),
  "x3 explains that bar length is what encodes the value");

// ── The prose makes the claims the lesson depends on ────────────────────────
const allText = [
  lesson.introduction.hook,
  lesson.introduction.why,
  ...lesson.explanation.flatMap((section) => section.paragraphs),
  ...lesson.misconceptions.flatMap((item) => [item.belief, item.whyItFails, item.correction]),
].join(" ");
ok(/share/i.test(allText), "the lesson distinguishes a share from a count");
ok(/zero/i.test(allText), "the lesson states the zero-baseline rule");
ok(/truncat/i.test(allText), "the lesson names truncation as the misleading choice");
ok(/total/i.test(allText), "the lesson makes the total part of reading a chart");
ok(/scatter/i.test(allText), "the lesson places the scatter graph among the chart types");
ok(/correlation|correlation is not|cause/i.test(allText),
  "the lesson warns that a relationship is not a cause");

if (failures.length) {
  console.error(`\n${failures.length} data-charts check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
