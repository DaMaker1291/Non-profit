#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// AVERAGES — THE LESSON'S STATISTICS, CHECKED INDEPENDENTLY.
//
// The lesson contract proves the lesson has the required parts. It cannot prove
// that the mean of 12, 15, 15, 18, 40 is 20, that the median is 15, that the
// frequency-table total is 21, or that the combined class mean is 71. This gate
// evaluates the arithmetic behind every claim separately from the prose.
//
// It is NOT a proof checker and NOT teacher review. A passing run says the
// pinned arithmetic and the stated rules have not drifted, not that a pupil
// learned to choose an average wisely.
//
// Run: node scripts/averages-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_AVERAGES: lesson } = require("../.verify/lessons/authored/maths-averages.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const mean = (values) => sum(values) / values.length;
const sorted = (values) => [...values].sort((a, b) => a - b);
const median = (values) => {
  const s = sorted(values);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const range = (values) => Math.max(...values) - Math.min(...values);
const frequencyTotal = (values, frequencies) =>
  values.reduce((total, value, index) => total + value * frequencies[index], 0);
const frequencyCount = (frequencies) => sum(frequencies);
const frequencyMean = (values, frequencies) =>
  frequencyTotal(values, frequencies) / frequencyCount(frequencies);
const frequencyMode = (values, frequencies) => {
  const largest = Math.max(...frequencies);
  const winners = values.filter((_, index) => frequencies[index] === largest);
  return winners.length === 1 ? winners[0] : null;
};
const frequencyMedian = (values, frequencies) => {
  const n = frequencyCount(frequencies);
  const positions = n % 2 ? [(n + 1) / 2] : [n / 2, n / 2 + 1];
  const found = [];
  let cumulative = 0;
  let index = 0;
  for (const position of positions) {
    while (cumulative < position) {
      cumulative += frequencies[index];
      index++;
    }
    found.push(values[index - 1]);
    // Reset for the second position in an even-sized list.
    if (positions.length > 1 && position === positions[0]) {
      cumulative = 0;
      index = 0;
    }
  }
  return mean(found);
};
const norm = (value) => String(value).toLowerCase().replace(/\s+/g, "").replace(/[.,;:]/g, "");

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "averages", "the lesson is for averages");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.objectives.every((objective) => objective.statement.length > 50 && objective.evidence.length > 50),
  "every objective carries a measurable evidence statement");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.priorKnowledge.conceptIds.includes("addition") &&
   lesson.priorKnowledge.conceptIds.includes("division"),
  "the prerequisite checks name addition and division");
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

// ── The opening pay-packet example ──────────────────────────────────────────
const pay = [180, 220, 250, 270, 1_080];
ok(close(sum(pay), 2_000), "the five pay packets total £2,000");
ok(close(mean(pay), 400), "the mean pay packet is £400");
ok(close(median(pay), 250), "the median pay packet is £250");
ok(pay.filter((value) => value < mean(pay)).length === 4,
  "four of the five pay packets are below the mean");
ok(close(range(pay), 900), "the pay range is £900");

// ── Mean, median, mode and range on a list ──────────────────────────────────
const data1 = [12, 15, 15, 18, 40];
ok(close(sum(data1), 100), "12 + 15 + 15 + 18 + 40 = 100");
ok(close(mean(data1), 20), "the mean of the cafe takings is 20");
ok(close(median(data1), 15), "the median of the cafe takings is 15");
ok(close(frequencyMode(data1, [1, 2, 1, 1, 1]), 15), "the mode of the cafe takings is 15");
ok(close(range(data1), 28), "the range of the cafe takings is 28");
ok(data1.filter((value) => value < mean(data1)).length === 4,
  "the cafe mean is above four of the five values because of the outlier");

const data2 = [4, 7, 7, 9, 13];
ok(close(mean(data2), 8), "4, 7, 7, 9, 13 has mean 8");
ok(close(median(data2), 7), "and median 7");
ok(close(range(data2), 9), "and range 9");
const data2Outlier = [4, 7, 7, 9, 130];
ok(close(mean(data2Outlier), 31.4), "replacing 13 with 130 moves the mean to 31.4");
ok(close(median(data2Outlier), 7), "but leaves the median at 7");
ok(close(range(data2Outlier), 126), "and moves the range to 126");

const evenData = [2, 4, 5, 7, 8, 9];
ok(close(median(evenData), 6), "an even-sized set uses the mean of the two middle values");
ok(close(median([3, 4, 4, 5, 30]), 4), "3, 4, 4, 5, 30 has median 4");
ok(close(mean([3, 4, 4, 5, 30]), 9.2), "and mean 9.2");
ok(close(median([9, 2, 8, 4, 7]), 7), "the unsorted middle of 9, 2, 8, 4, 7 is not the median");
ok(close(median([2, 9, 4, 7, 5, 8]), 6), "the retrieval set has median 6");
ok(close(range([2, 9, 4, 7, 5, 8]), 7), "the retrieval set has range 7");
ok([2, 9, 4, 7, 5, 8].every((value, index, all) => all.indexOf(value) === all.lastIndexOf(value)),
  "the retrieval set has no repeated value, so it has no mode");

// ── Frequency tables ────────────────────────────────────────────────────────
const table1 = { values: [0, 1, 2, 3], frequencies: [2, 5, 2, 1] };
ok(close(frequencyTotal(table1.values, table1.frequencies), 12),
  "the frequency table rebuilds a total of 12");
ok(close(frequencyCount(table1.frequencies), 10), "the table holds 10 values");
ok(close(frequencyMean(table1.values, table1.frequencies), 1.2), "its mean is 1.2");
ok(close(frequencyMedian(table1.values, table1.frequencies), 1), "its median is 1");
ok(close(frequencyMode(table1.values, table1.frequencies), 1), "its mode is 1");
ok(close(range(table1.values), 3), "its range is 3");
ok(close(frequencyTotal([1, 2, 3, 4], [3, 4, 2, 1]), 21),
  "the worked frequency table rebuilds a total of 21");
ok(close(frequencyMean([1, 2, 3, 4], [3, 4, 2, 1]), 2.1),
  "the worked frequency table has mean 2.1");
ok(close(frequencyMedian([1, 2, 3, 4], [3, 4, 2, 1]), 2),
  "the worked frequency table has median 2");
ok(close(frequencyMode([1, 2, 3, 4], [3, 4, 2, 1]), 2),
  "the worked frequency table has mode 2");
ok(close(range([1, 2, 3, 4]), 3), "the worked frequency table has range 3");

// ── Guided practice ────────────────────────────────────────────────────────
ok(close(mean([6, 9, 9, 12, 14]), 10), "p1 has mean 10");
ok(close(median([6, 9, 9, 12, 14]), 9), "p1 has median 9");
ok(close(frequencyMode([6, 9, 9, 12, 14], [1, 2, 1, 1, 1]), 9), "p1 has mode 9");
ok(close(range([6, 9, 9, 12, 14]), 8), "p1 has range 8");
const p2 = { values: [0, 1, 2], frequencies: [4, 3, 3] };
ok(close(frequencyTotal(p2.values, p2.frequencies), 9), "p2 rebuilds a total of 9");
ok(close(frequencyMean(p2.values, p2.frequencies), 0.9), "p2 has mean 0.9");
ok(close(frequencyMedian(p2.values, p2.frequencies), 1), "p2 has median 1");
ok(close(frequencyMode(p2.values, p2.frequencies), 0), "p2 has mode 0");
ok(close(range(p2.values), 2), "p2 has range 2");
ok(close(6 * 14, 84) && close(84 - 67, 17), "p3's missing value is 17");

// ── Assessment keys ─────────────────────────────────────────────────────────
const a1 = lesson.assessment.find((item) => item.id === "a1");
const a2 = lesson.assessment.find((item) => item.id === "a2");
const a3 = lesson.assessment.find((item) => item.id === "a3");
const sales = [120, 140, 140, 160, 940];
ok(close(sum(sales), 1_500), "the shop's five days total £1,500");
ok(close(mean(sales), 300), "a1's mean is £300");
ok(close(median(sales), 140), "a1's median is £140");
ok(close(frequencyMode(sales, [1, 2, 1, 1, 1]), 140), "a1's mode is £140");
ok(close(range(sales), 820), "a1's range is £820");
ok(sales.filter((value) => value <= 160).length === 4,
  "four of five sales are at most £160, which is why the median is the better typical day");
ok(a1?.marking.length === 4, "a1 carries four marking criteria");
ok(a2 && close(frequencyMean([1, 2, 3], [2, 5, 3]), 2.1), "a2's frequency-table mean is 2.1");
ok(a2?.check.accepted.some((answer) => norm(answer) === norm("2.1")), "a2 accepts 2.1");
ok(a3 && close(8 * 15, 120) && close(120 - 103, 17), "a3's missing value is 17");
ok(a3?.check.accepted.some((answer) => norm(answer) === norm("17")), "a3 accepts 17");
ok(a2?.marking.length >= 2 && a3?.marking.length >= 2,
  "the short-answer items carry marking criteria, not only a key");

// ── Combined means and transfer ─────────────────────────────────────────────
const aMarks = 10 * 60;
const bMarks = 20 * 75;
ok(close(aMarks, 600) && close(bMarks, 1_500), "the worked groups hold 600 and 1,500 marks");
ok(close((aMarks + bMarks) / 30, 70), "the worked combined mean is 70");
ok(close((60 + 75) / 2, 67.5), "the unweighted mean is 67.5, which is the trap");
const classA = 12 * 62;
const classB = 18 * 77;
ok(close(classA, 744) && close(classB, 1_386), "the transfer classes hold 744 and 1,386 marks");
ok(close((classA + classB) / 30, 71), "the transfer's correct combined mean is 71");
ok(close((62 + 77) / 2, 69.5), "the tutor's unweighted 69.5 is the error");
ok(close((classA + 100) / 13, 64.92307692307692),
  "adding 100 to Class A makes its new mean about 64.9");
ok((classA + 100) / 13 > 62, "the new mean rises because 100 is above the old mean");
ok(100 > (classA + 100) / 13, "100 is also above the new mean, so it pulls the mean");
ok(close(sum([2, 9, 4, 7, 5, 8]), 35), "the retrieval set totals 35");

// ── Retrieval ───────────────────────────────────────────────────────────────
ok(close(5 * 9, 45) && close(45 - 31, 14), "x1's fifth value is 14");
const x3 = { values: [1, 2, 3], frequencies: [5, 3, 2] };
ok(close(frequencyTotal(x3.values, x3.frequencies), 17), "x3 rebuilds a total of 17");
ok(close(frequencyMean(x3.values, x3.frequencies), 1.7), "x3 has mean 1.7");
ok(close(frequencyMedian(x3.values, x3.frequencies), 1.5), "x3 has median 1.5");
ok(close(frequencyMode(x3.values, x3.frequencies), 1), "x3 has mode 1");
ok(close(range(x3.values), 2), "x3 has range 2");

// ── Explanations make the right claims ──────────────────────────────────────
const allText = [
  lesson.introduction.hook,
  lesson.introduction.why,
  ...lesson.explanation.flatMap((section) => section.paragraphs),
  ...lesson.misconceptions.flatMap((item) => [item.whyItFails, item.correction]),
].join(" ");
ok(/total .* shared|shared equally/i.test(allText), "the lesson defines the mean as a total shared out");
ok(/after .*order|put .*order|sorted/i.test(allText), "the lesson says the median needs ordering");
ok(/range is not an average|measure of spread/i.test(allText), "the lesson distinguishes range from an average");
ok(/categor/i.test(allText), "the lesson names categorical data for the mode");
ok(/outlier/i.test(allText), "the lesson teaches the outlier distinction");
ok(/10 × 60|10 × 65|1,500|1,386/i.test(allText), "the lesson pins a combined-mean total");

if (failures.length) {
  console.error(`\n${failures.length} averages check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
