#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// PROBABILITY BASICS — the sample spaces, counts and rules, checked.
//
// The lesson contract proves the parts exist. It cannot prove that two dice have
// 36 outcomes with six ways to make 7, that the Venn regions total 30, that the
// without-replacement tree sums to 1, or that the diagnostic-test transfer is
// 1/12 rather than 90%. This gate builds the sample spaces independently and
// checks every pinned value.
//
// It is NOT teacher review and NOT a learner trial. A passing run says the
// stated counts and rules agree with independent enumeration; it says nothing
// about whether a pupil chooses the right rule without being prompted.
//
// Run: node scripts/probability-basics-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const { MATHS_PROBABILITY_BASICS: lesson } = require("../.verify/lessons/authored/maths-probability-basics.js");
const lessonFigures = require("../.verify/lesson-figure.js");
const simulation = require("../.verify/probability-simulation.js");
const activities = require("../.verify/probability-activities.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const close = (a, b, tolerance = 1e-9) => Math.abs(Number(a) - Number(b)) < tolerance;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const fraction = (numerator, denominator) => numerator / denominator;

// ── Shape and honesty ────────────────────────────────────────────────────────
ok(lesson.conceptId === "probability-basics", "the lesson is for probability-basics");
ok(lesson.contract === "openmind.lesson/1.0", "the lesson uses the current contract");
ok(lesson.version === "1.0.0", "the lesson version is 1.0.0");
ok(lesson.declaredStatus === "draft", "the lesson declares draft, not a reviewed rung");
ok(lesson.reviews.length === 0, "the lesson claims no subject-teacher review");
ok(lesson.learnerTesting.length === 0, "the lesson claims no learner testing");
ok(lesson.objectives.length === 3, "there are three measurable objectives");
ok(lesson.objectives.every((objective) => objective.statement.length > 50 && objective.evidence.length > 50),
  "every objective carries a measurable evidence statement");
ok(lesson.priorKnowledge.conceptIds.length === 0,
  "the lesson invents no prerequisite edge the genome does not declare");
ok(lesson.priorKnowledge.check.length === 2, "there are two prerequisite checks");
ok(lesson.priorKnowledge.check.some((check) => check.targets.includes("fractions")),
  "the first diagnostic probes the fraction skill the lesson uses");
ok(lesson.priorKnowledge.check.some((check) => check.targets.includes("percentages")),
  "the second diagnostic probes the percentage skill the lesson uses");
ok(lesson.explanation.length === 5, "there are five explanation sections");
ok(lesson.explanation.flatMap((section) => section.paragraphs).length === 10,
  "there are ten explanation paragraphs");
ok(lesson.representations.length === 5, "there are five representation blocks");
ok(lesson.representations.every((block) => block.kind === "maths.expression"),
  "the representations use the mathematics framework");
ok(lesson.representations.every((block) => typeof block.caption === "string" && block.caption.length > 80),
  "every representation carries a teaching caption, not a label");
ok(lesson.workedExamples.length === 5, "there are five worked examples");
ok(lesson.workedExamples.every((example) => example.steps.length >= 3),
  "every worked example models at least three moves");
ok(lesson.workedExamples.every((example) => example.steps.every((step) => step.why.length > 30)),
  "every move states a reason, not only an instruction");
ok(lesson.misconceptions.length === 7, "there are seven misconceptions taught");
ok(lesson.misconceptions.every((item) => item.contrast?.wrong && item.contrast?.right),
  "every misconception carries a wrong/right contrast");
ok(lesson.guidedPractice.length === 4, "there are four guided practice items");
ok(lesson.assessment.length === 5, "there are five assessment items");
ok(lesson.assessment.filter((item) => item.kind === "constructed-response").length === 1,
  "one assessment asks for reasoning in words");
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

// ── One die and two dice ────────────────────────────────────────────────────
const die = [1, 2, 3, 4, 5, 6];
const twoDice = [];
for (const a of die) for (const b of die) twoDice.push([a, b]);
ok(twoDice.length === 36, "two dice produce 36 ordered outcomes");
ok(new Set(twoDice.map(([a, b]) => `${a},${b}`)).size === 36, "all 36 pairs are distinct");
const totalWays = (target) => twoDice.filter(([a, b]) => a + b === target).length;
ok(totalWays(7) === 6, "there are six ways to make a total of 7");
ok(totalWays(12) === 1, "there is one way to make 12");
ok(close(fraction(6, 36), 1 / 6), "P(total 7) is 6/36 = 1/6");
ok(close(fraction(1, 36), 1 / 36), "P(total 12) is 1/36");
ok(totalWays(7) + totalWays(12) === 7, "7 and 12 are mutually exclusive, so the counts add to 7");
ok(close(fraction(7, 36), 7 / 36), "P(total 7 or 12) is 7/36");
ok(twoDice.filter(([a, b]) => a === 6 || b === 6).length === 11, "there are 11 outcomes with at least one six");
ok(twoDice.filter(([a, b]) => a !== 6 && b !== 6).length === 25, "there are 25 outcomes with no six");
ok(close(fraction(11, 36), 11 / 36), "P(at least one six on two dice) is 11/36");
ok(close(fraction(25, 36), 25 / 36), "the complement no six is 25/36");
ok(close(fraction(11, 36) + fraction(25, 36), 1), "the at-least-one and none probabilities sum to 1");

// ── Coins and the two meanings of one ───────────────────────────────────────
const coins3 = [];
for (const a of ["H", "T"]) for (const b of ["H", "T"]) for (const c of ["H", "T"]) coins3.push(a + b + c);
ok(coins3.length === 8, "three coins produce eight ordered outcomes");
ok(coins3.filter((outcome) => outcome.includes("H")).length === 7, "seven of the eight lists include a head");
ok(coins3.filter((outcome) => outcome === "TTT").length === 1, "only TTT has no head");
ok(coins3.filter((outcome) => outcome.split("H").length - 1 === 1).length === 3, "exactly one head is three lists");
ok(close(fraction(7, 8), 7 / 8), "P(at least one head in three tosses) is 7/8");
ok(close(fraction(3, 8), 3 / 8), "P(exactly one head in three tosses) is 3/8");
ok(close(fraction(7, 8) + fraction(1, 8), 1), "at least one head and no head are complements");
ok(close(fraction(7, 8) - fraction(3, 8), 4 / 8), "the at-least-one event contains four outcomes the exactly-one event does not");
const coins2 = ["HH", "HT", "TH", "TT"];
ok(coins2.filter((outcome) => outcome.includes("H")).length === 3, "three of four two-coin outcomes include a head");
ok(coins2.filter((outcome) => outcome.split("H").length - 1 === 1).length === 2, "two of four have exactly one head");
ok(close(fraction(3, 4), 3 / 4) && close(fraction(2, 4), 1 / 2),
  "two coins give 3/4 for at least one head and 1/2 for exactly one");

// ── The Venn group of 30 ────────────────────────────────────────────────────
const football = 18;
const tennis = 12;
const both = 6;
const totalStudents = 30;
const footballOnly = football - both;
const tennisOnly = tennis - both;
const neither = totalStudents - footballOnly - tennisOnly - both;
ok(footballOnly === 12, "12 students like football only");
ok(tennisOnly === 6, "6 students like tennis only");
ok(neither === 6, "6 students like neither");
ok(footballOnly + tennisOnly + both + neither === 30, "the four Venn regions total 30");
ok(footballOnly + tennisOnly + both === 24, "24 students like at least one sport");
ok(close(fraction(24, 30), 4 / 5), "P(football or tennis) is 24/30 = 4/5");
ok(close(fraction(neither, 30), 1 / 5), "P(neither) is 6/30 = 1/5");
ok(close(fraction(football, 30) + fraction(tennis, 30) - fraction(both, 30), 4 / 5),
  "18/30 + 12/30 − 6/30 gives the union without double counting");
ok(close(fraction(footballOnly + tennisOnly, 30), 3 / 5), "P(exactly one sport) is 18/30 = 3/5");
ok(close(fraction(24, 30) + fraction(6, 30), 1), "the union and neither probabilities sum to 1");

// ── The without-replacement tree ────────────────────────────────────────────
const bagCounts = { RR: 0, RB: 0, BR: 0, BB: 0 };
// 3 red and 2 blue, ordered without replacement: 5 × 4 = 20 pairs.
const pairs3r2b = [];
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 5; j++) {
    if (i === j) continue;
    pairs3r2b.push([i < 3 ? "R" : "B", j < 3 ? "R" : "B"]);
  }
}
ok(pairs3r2b.length === 20, "two draws from five counters give 20 ordered pairs");
for (const pair of pairs3r2b) bagCounts[pair.join("")] += 1;
ok(bagCounts.RR === 6 && bagCounts.RB === 6 && bagCounts.BR === 6 && bagCounts.BB === 2,
  "the four tree paths have 6, 6, 6 and 2 ordered pairs");
ok(close(bagCounts.RR / 20, 3 / 10), "P(red then red) is 6/20 = 3/10");
ok(close(bagCounts.BB / 20, 1 / 10), "P(blue then blue) is 2/20 = 1/10");
ok(close(1 - bagCounts.BB / 20, 9 / 10), "P(at least one red) is 1 − 2/20 = 9/10");
ok(close(sum(Object.values(bagCounts)) / 20, 1), "the four tree paths sum to 1");
ok(close((3 / 5) * (2 / 4), 3 / 10), "the tree's RR branch is (3/5)(2/4) = 3/10");
ok(close((2 / 5) * (1 / 4), 1 / 10), "the tree's BB branch is (2/5)(1/4) = 1/10");
ok(close((2 / 5) ** 2, 4 / 25), "with replacement, P(no red) would be (2/5)² = 4/25");
ok(close(1 - (2 / 5) ** 2, 21 / 25), "with replacement, P(at least one red) would be 21/25, not 9/10");

const bag4r2b = [];
for (let i = 0; i < 6; i++) {
  for (let j = 0; j < 6; j++) {
    if (i === j) continue;
    bag4r2b.push([i < 4 ? "R" : "B", j < 4 ? "R" : "B"]);
  }
}
const bb4 = bag4r2b.filter(([a, b]) => a === "B" && b === "B").length;
ok(bag4r2b.length === 30, "two draws from six counters give 30 ordered pairs");
ok(bb4 === 2, "the 4 red, 2 blue bag has 2 blue-blue ordered pairs");
ok(close(bb4 / 30, 1 / 15), "P(blue then blue) is 2/30 = 1/15");
ok(close(1 - bb4 / 30, 14 / 15), "P(at least one red) is 14/15");
ok(close((2 / 6) * (1 / 5), 1 / 15), "the branch product (2/6)(1/5) is 1/15");

// ── Independence, exclusivity and the addition rule ─────────────────────────
ok(close(0.4 * 0.5, 0.2), "independent events with 0.4 and 0.5 have joint probability 0.2");
ok(close(0.3 + 0.5, 0.8), "mutually exclusive events with 0.3 and 0.5 have union probability 0.8");
ok(close(13 / 52, 1 / 4) && close(4 / 52, 1 / 13), "a heart is 1/4 and a king is 1/13 of a deck");
ok(close((13 / 52) * (4 / 52), 1 / 52), "heart and king are independent: the product is the king of hearts");
ok(close(fraction(1, 52), 1 / 52), "there is exactly one king of hearts");
ok(close(13 / 52 + 4 / 52 - 1 / 52, 16 / 52), "P(heart or king) is 16/52 = 4/13");
ok(close(1 - 0.35, 0.65), "P(not A) is 0.65 when P(A) = 0.35");
ok(close(5 / 8 + 3 / 8, 1), "5 red and 3 green counters give complementary probabilities 5/8 and 3/8");

// ── Repeated independent trials ─────────────────────────────────────────────
ok(close((5 / 6) ** 4, 625 / 1296), "P(no six in four rolls) is (5/6)⁴ = 625/1296");
ok(close(1 - (5 / 6) ** 4, 671 / 1296), "P(at least one six in four rolls) is 671/1296");
ok(close(671 / 1296, 0.5177469135802469), "671/1296 is approximately 0.5177");
ok(close(4 * (1 / 6) * (5 / 6) ** 3, 500 / 1296), "P(exactly one six in four rolls) is 500/1296");
ok(close(500 / 1296, 0.3858024691358025), "500/1296 is approximately 0.3858");
ok(671 / 1296 > 500 / 1296, "at least one six is more likely than exactly one six");
ok(close(5 / 6, 0.8333333333333334), "the chance of no six on one roll is 5/6");
ok(close(1 - 5 / 6, 1 / 6), "the chance of a six on one roll is 1/6");

// ── Guided and assessment keys ──────────────────────────────────────────────
ok(close(25 / 40 + 15 / 40 - 8 / 40, 4 / 5), "p3's 25/40 + 15/40 − 8/40 is 4/5");
ok(close((40 - 32) / 40, 1 / 5), "p3's neither probability is 1/5");
ok(close((2 / 6) * (1 / 5), 1 / 15) && close(1 - 1 / 15, 14 / 15),
  "p4's both-blue and at-least-one-red probabilities are 1/15 and 14/15");
const a2 = lesson.assessment.find((item) => item.id === "a2");
const a3 = lesson.assessment.find((item) => item.id === "a3");
const a4 = lesson.assessment.find((item) => item.id === "a4");
const a5 = lesson.assessment.find((item) => item.id === "a5");
ok(a2?.check.accepted.includes("3/8"), "a2 accepts 3/8");
ok(a3?.check.accepted.includes("0.2"), "a3 accepts 0.2");
ok(a4?.check.accepted.includes("0.8"), "a4 accepts 0.8");
ok(a5?.check.accepted.includes("1/5"), "a5 accepts 1/5");
ok(close(1 - 5 / 8, 3 / 8), "a2's complement 1 − 5/8 is 3/8");
ok(close(0.4 * 0.5, 0.2), "a3's product is 0.2");
ok(close(0.3 + 0.5, 0.8), "a4's sum is 0.8");
ok(close((30 - (18 + 12 - 6)) / 30, 0.2), "a5's neither probability is 0.2");

// ── The diagnostic-test transfer ────────────────────────────────────────────
const population = 10000;
const prevalence = 0.01;
const sensitivity = 0.9;
const specificity = 0.9;
const affected = population * prevalence;
const truePositives = affected * sensitivity;
const unaffected = population - affected;
const falsePositives = unaffected * (1 - specificity);
const positives = truePositives + falsePositives;
ok(affected === 100, "1% of 10,000 is 100 people with the condition");
ok(truePositives === 90, "90% sensitivity gives 90 true positives");
ok(unaffected === 9900, "9,900 people do not have the condition");
ok(close(falsePositives, 990), "10% false positives among 9,900 is 990");
ok(close(positives, 1080), "there are 1,080 positive tests in total");
ok(close(truePositives / positives, 1 / 12), "90/1,080 is 1/12");
ok(close(1 / 12, 0.08333333333333333), "1/12 is approximately 8.3%");
ok(truePositives / positives < sensitivity, "the answer is far below the 90% sensitivity");
const affected10 = population * 0.1;
const truePositives10 = affected10 * sensitivity;
const falsePositives10 = (population - affected10) * (1 - specificity);
ok(affected10 === 1000, "10% of 10,000 is 1,000");
ok(close(truePositives10, 900), "900 true positives at 10% prevalence");
ok(close(falsePositives10, 900), "900 false positives among the 9,000 unaffected");
ok(close(truePositives10 / (truePositives10 + falsePositives10), 0.5),
  "at 10% prevalence the answer is 900/1,800 = 1/2");
ok(truePositives / positives < truePositives10 / (truePositives10 + falsePositives10),
  "a higher base rate raises the probability after a positive test");

// ── Prose claims and keys ──────────────────────────────────────────────────
const allText = [
  lesson.introduction.hook,
  lesson.introduction.why,
  ...lesson.explanation.flatMap((section) => section.paragraphs),
  ...lesson.misconceptions.flatMap((item) => [item.belief, item.whyItFails, item.correction]),
].join(" ");
ok(/mutually exclusive/i.test(allText), "the lesson names mutually exclusive explicitly");
ok(/independent/i.test(allText), "the lesson names independence explicitly");
ok(/at least one/i.test(allText), "the lesson names the at-least-one event");
ok(/exactly one/i.test(allText), "the lesson names the exactly-one event");
ok(/relative frequency/i.test(allText), "the lesson distinguishes relative frequency");
ok(/equally likely/i.test(allText), "the lesson states the equally-likely assumption");
ok(/sample space/i.test(allText), "the lesson builds the sample space");
ok(/without replacement/i.test(allText), "the lesson names the without-replacement case");
ok(/base rate/i.test(lesson.transfer[0].answer), "the transfer explains the base rate");
ok(lesson.transfer[0].answer.includes("1/12"), "the transfer states 1/12");
ok(lesson.transfer[0].answer.includes("8.3%"), "the transfer states 8.3%");
ok(lesson.transfer[0].answer.includes("50%"), "the transfer states the 10%-prevalence result, 50%");
ok(lesson.workedExamples[4].answer.includes("671/1296"), "w5's answer states 671/1296");
ok(lesson.workedExamples[4].answer.includes("0.5177"), "w5's answer states 0.5177");
ok(lesson.misconceptions.some((item) => item.id === "m5" && /without replacement/i.test(item.whyItFails)),
  "m5 explains why the power formula fails without replacement");
ok(lesson.misconceptions.some((item) => item.id === "m7" && /sum/i.test(item.whyItFails + item.correction)),
  "the sum-to-one misconception is present");

// ── The lesson's drawings ───────────────────────────────────────────────────
//
// A picture is verified by the numbers it claims, not by the fact that a <svg>
// element exists. The Venn's regions must sit in the right circles and add up;
// the tree's four paths must be the products of their branches and sum to 1.
const vennBlock = lesson.representations.find((block) => block.figure?.spec.kind === "venn");
ok(!!vennBlock, "the lesson carries a drawn Venn diagram");
const treeBlock = lesson.representations.find((block) => block.figure?.spec.kind === "tree");
ok(!!treeBlock, "the lesson carries a drawn tree diagram");
ok(lesson.representations.filter((block) => block.figure).length === 2,
  "exactly the two representations that need a picture carry one");

if (vennBlock) {
  const venn = lessonFigures.vennLayout(vennBlock.figure.spec);
  ok(venn.onlyA === 12 && venn.onlyB === 6 && venn.both === 6 && venn.neither === 6,
    "the Venn's four regions are 12, 6, 6 and 6");
  ok(venn.union === 24 && venn.total === 30,
    "the union is 24 and the four regions total the 30 students");
  const circleA = venn.circles.find((circle) => circle.key === "A");
  const circleB = venn.circles.find((circle) => circle.key === "B");
  const distance = (region, circle) => Math.hypot(region.x - circle.cx, region.y - circle.cy);
  const onlyA = venn.regions.find((region) => region.key === "onlyA");
  const onlyB = venn.regions.find((region) => region.key === "onlyB");
  const both = venn.regions.find((region) => region.key === "both");
  const neither = venn.regions.find((region) => region.key === "neither");
  ok(distance(onlyA, circleA) < circleA.r && distance(onlyA, circleB) > circleB.r,
    "the football-only count is inside the football circle and outside the tennis one");
  ok(distance(onlyB, circleB) < circleB.r && distance(onlyB, circleA) > circleA.r,
    "the tennis-only count is inside the tennis circle and outside the football one");
  ok(distance(both, circleA) < circleA.r && distance(both, circleB) < circleB.r,
    "the both-sports count sits in the overlap");
  ok(distance(neither, circleA) > circleA.r && distance(neither, circleB) > circleB.r,
    "the neither count sits outside both circles");
  ok(vennBlock.figure.caption.includes("24") && vennBlock.figure.caption.includes("30"),
    "the Venn caption states the union and the total, not just the labels");
}

if (treeBlock) {
  const tree = lessonFigures.treeLayout(treeBlock.figure.spec);
  ok(tree.paths.length === 4, "the tree draws all four complete paths");
  ok(close(tree.totalProbability, 1),
    `the four path probabilities sum to 1 (${tree.totalProbability})`);
  ok(tree.paths.every((path) => path.probability > 0 && path.probability <= 1),
    "every drawn path probability is in (0, 1]");
  const bb = tree.paths.find((path) => path.first === "Blue" && path.second === "Blue");
  ok(!!bb && close(bb.probability, 2 / 20), "the blue-blue path is 2/20");
  ok(close(1 - bb.probability, 9 / 10),
    "the complement of the blue-blue path is the 9/10 chance of at least one red");
  ok(tree.firstNodes.every((node) => node.y >= 0 && node.y <= tree.height),
    "every first-stage node is inside the drawing");
  ok(tree.paths.every((path) => path.leafY >= 0 && path.leafY <= tree.height && path.leafX < tree.width),
    "every leaf is inside the drawing");
  ok(treeBlock.figure.caption.includes("2/4") && treeBlock.figure.caption.includes("2/20"),
    "the tree caption states the changed branch and the failing path");
}

// ── The simulation is a model, and it is reproducible ───────────────────────
const runA = simulation.simulateCoinTosses(2000, 11);
const runB = simulation.simulateCoinTosses(2000, 11);
ok(runA.trials === 2000 && runA.heads + runA.tails === 2000,
  "a 2,000-toss simulation accounts for every toss");
ok(runA.heads === runB.heads && runA.tails === runB.tails,
  "the same seed produces the same run, so the browser check can assert a count");
ok(Math.abs(runA.relativeFrequency - 0.5) < 0.05,
  `2,000 fair-coin tosses settle near 1/2 (${runA.relativeFrequency.toFixed(3)})`);
ok(simulation.simulateCoinTosses(0, 1).relativeFrequency === 0,
  "an empty run reports no fake frequency");
ok(simulation.simulateCoinTosses(10, 1).relativeFrequency !== simulation.simulateCoinTosses(10, 2).relativeFrequency,
  "different seeds produce different observed frequencies");

// ── The reusable activity model ─────────────────────────────────────────────
// These assertions are independent of the UI: region algebra, rational
// comparison and path products. The browser walk proves the same model reaches
// a learner through the visible controls; this proves the model itself.
ok(activities.PROBABILITY_VENN.sets === 2, "the interactive Venn uses two sets");
ok(activities.vennRegions(activities.PROBABILITY_VENN).reduce((n, region) => n + region.count, 0) === 30,
  "the interactive Venn's regions total 30");
ok(activities.vennTotal(activities.PROBABILITY_VENN) === 30,
  "the Venn total is the same 30 learners the lesson states");
ok(activities.unionRegions(activities.PROBABILITY_VENN, [0, 1]).length === 3,
  "the union is three regions, not the whole diagram");
ok(activities.complementRegions(activities.PROBABILITY_VENN, [0, 1]).join(",") === "neither",
  "the complement of the union is the neither region");
const neitherProbability = activities.vennProbability(activities.PROBABILITY_VENN, ["neither"]);
ok(!!neitherProbability && neitherProbability.count === 6 && neitherProbability.total === 30 && neitherProbability.fraction.n === 1 && neitherProbability.fraction.d === 5,
  "P(neither) is 6/30 = 1/5");
ok(activities.parseRational("6/30")?.n === 1 && activities.parseRational("6/30")?.d === 5,
  "6/30 is reduced to 1/5");
ok(activities.rationalEquals(activities.parseRational("0.2"), activities.parseRational("20%")),
  "0.2 and 20% are the same probability");
ok(activities.parseRational("1/0") === null, "a zero denominator is refused, not treated as wrong");
ok(activities.parseRational("-1/5") === null, "a negative probability is refused");
ok(activities.parseRational("not a number") === null, "unparseable input is refused");

const unionRight = activities.gradeProbabilityActivity("venn-union", ["onlyA", "onlyB", "both"]);
ok(unionRight?.correct === true, "the union selection is marked correct when it includes the overlap");
ok(unionRight?.modelAnswer.includes("Football only") && unionRight?.modelAnswer.includes("overlap"),
  "the union verdict names the regions rather than only saying right");
const unionWrong = activities.gradeProbabilityActivity("venn-union", ["onlyA", "onlyB"]);
ok(unionWrong?.correct === false && unionWrong?.feedback.includes("overlap"),
  "missing the overlap is marked wrong and says why");
ok(activities.gradeProbabilityActivity("venn-union", ["onlyA", "not-a-region"]) === null,
  "an unknown Venn region is malformed input, not a wrong answer");
ok(activities.gradeProbabilityActivity("venn-union", ["onlyA", "onlyA"]) === null,
  "a duplicated region is malformed input");
ok(activities.gradeProbabilityActivity("venn-neither", "20%")?.correct === true,
  "20% is accepted as the same answer as 1/5");
ok(activities.gradeProbabilityActivity("venn-neither", "1/4")?.correct === false,
  "1/4 is marked wrong, not merely parsed");
ok(activities.gradeProbabilityActivity("venn-neither", "nonsense") === null,
  "an unparseable probability is refused");

const tree = lessonFigures.treeLayout(activities.PROBABILITY_TREE);
ok(tree.paths.length === 4 && close(tree.totalProbability, 1),
  "the activity tree has four paths and they total 1");
ok(tree.paths.find((path) => path.first === "Blue" && path.second === "Blue")?.probability === 2 / 20,
  "the activity tree keeps the blue-blue path at 2/20");
ok(treeBlock && JSON.stringify(activities.PROBABILITY_TREE) === JSON.stringify(treeBlock.figure.spec),
  "the activity tree is the tree the authored lesson draws, not a second copy");
const treeRight = activities.gradeProbabilityActivity("tree-values", {
  rr: "6/20", bb: "0.1", atLeastOneRed: "9/10", dependent: "Dependent",
});
ok(treeRight?.correct === true, "the completed tree accepts equivalent fraction and decimal forms");
ok(treeRight?.fields?.length === 4 && treeRight.fields.every((field) => field.correct),
  "the tree verdict names all four fields");
const treePartial = activities.gradeProbabilityActivity("tree-values", {
  rr: "6/20", bb: "2/20", atLeastOneRed: "", dependent: "Dependent",
});
ok(treePartial?.correct === false && treePartial?.fields?.filter((field) => field.correct).length === 3,
  "a partial tree is marked false and preserves which three fields were right");
ok(activities.gradeProbabilityActivity("tree-values", { rr: "nonsense" }) === null,
  "an unparseable tree value is refused, not scored as a misconception");

const dieSimulation = simulation.simulateExperiment("die", 600, 7);
ok(dieSimulation.trials === 600 && dieSimulation.outcomes.reduce((n, outcome) => n + outcome.count, 0) === 600,
  "a 600-roll die simulation accounts for every roll");
ok(dieSimulation.outcomes.every((outcome) => close(outcome.theoretical, 1 / 6)),
  "every die face carries the theoretical probability 1/6");
ok(JSON.stringify(simulation.simulateExperiment("die", 600, 7)) === JSON.stringify(dieSimulation),
  "the same die seed produces the same run");
const bagSimulation = simulation.simulateExperiment("bag", 600, 7);
ok(bagSimulation.trials === 600 && bagSimulation.outcomes.reduce((n, outcome) => n + outcome.count, 0) === 600,
  "a 600-draw bag simulation accounts for every two-draw trial");
ok(bagSimulation.outcomes.find((outcome) => outcome.key === "bb")?.theoretical === 2 / 20,
  "the without-replacement bag keeps blue-blue at 2/20");
ok(bagSimulation.outcomes.find((outcome) => outcome.key === "rr")?.theoretical === 6 / 20,
  "the without-replacement bag keeps red-red at 6/20");
const combined = simulation.combineExperiments(
  simulation.simulateExperiment("die", 20, 1),
  simulation.simulateExperiment("die", 200, 2),
);
ok(combined.trials === 220 && combined.outcomes.reduce((n, outcome) => n + outcome.count, 0) === 220,
  "the cumulative experiment adds trials without losing an outcome");

const a1 = lesson.assessment.find((item) => item.id === "a1");
ok(a1?.scored === false, "a1 is explicitly labelled unscored");
ok(!lesson.assessment.some((item) => item.kind === "constructed-response" && item.scored !== false),
  "no constructed response is silently counted as a graded assessment");

const vennSource = fs.readFileSync("components/probability-venn-activity.tsx", "utf8");
ok(vennSource.includes("data-venn-region") && vennSource.includes("type=\"checkbox\""),
  "the Venn activity exposes a real checkbox table, not a click-only SVG");
ok(vennSource.includes("role=\"img\"") && vennSource.includes("aria-label={"),
  "the Venn drawing carries an accessible name");
const treeSource = fs.readFileSync("components/probability-tree-activity.tsx", "utf8");
ok(treeSource.includes("data-tree-field") && treeSource.includes("data-tree-submit"),
  "the tree activity exposes its missing values as form fields");
ok(treeSource.includes("showPaths={false}"),
  "the tree activity hides the path totals it asks the learner to calculate");
const pageSource = fs.readFileSync("app/learn/[subject]/[concept]/page.tsx", "utf8");
ok(pageSource.includes("ProbabilityVennActivity") && pageSource.includes("ProbabilityTreeActivity"),
  "the lesson page renders both interactive representations");

const figureSource = fs.readFileSync("components/lesson-figure.tsx", "utf8");
ok(figureSource.includes("vennLayout") && figureSource.includes("treeLayout"),
  "the lesson renderer draws both kinds from their geometry, not from hand-written SVG");

if (failures.length) {
  console.error(`\n${failures.length} probability-basics check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed, 0 failed`);
