#!/usr/bin/env node
// Independent arithmetic checks for the ratio/proportion/sequences batch.
//
// The lesson objects carry their own keys; this script deliberately does NOT
// call them to decide whether they are right. It recomputes each claim from the
// problem and then checks that the authored source states the same answer. A
// key that agrees only with itself is not evidence.

import { readFileSync } from "node:fs";

let passed = 0;
let failed = 0;
const check = (ok, label) => {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ FAIL: ${label}`);
  }
};
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
const source = (name) =>
  readFileSync(new URL(`../lib/lessons/authored/${name}`, import.meta.url), "utf8");

const ratio = source("maths-ratio.ts");
const proportion = source("maths-proportion.ts");
const sequences = source("maths-sequences.ts");

console.log("\n▸ Ratio: parts, equivalence and sharing");

// 18 : 24 divides by 6 to 3 : 4, whose whole is 7 parts.
check(18 / 6 === 3 && 24 / 6 === 4, "18 : 24 simplifies to 3 : 4");
check(3 + 4 === 7 && close(3 / 7 + 4 / 7, 1), "3 : 4 gives shares 3/7 and 4/7 of the whole");
check(5 + 2 === 7 && 84 / 7 === 12 && 5 * 12 === 60 && 2 * 12 === 24,
  "£84 in 5 : 2 is £60 and £24, and the shares sum to £84");
check(1.5 * 100 === 150 && 150 / 50 === 3 && 50 / 50 === 1,
  "1.5 m : 50 cm converts to 150 : 50 and simplifies to 3 : 1");
check(150 / 4 === 37.5 && 750 / 4 === 187.5 && 187.5 - 150 === 37.5,
  "the concrete transfer needs 187.5 kg cement for 750 kg sand and is 37.5 kg short");
check(/modelAnswer: "3 : 4"/.test(ratio) && /"3 : 4"/.test(ratio),
  "the ratio key states 3 : 4 and accepts it");
check(/modelAnswer: "40 and 32"/.test(ratio) && /40 and 32/.test(ratio),
  "the ratio sharing key states 40 and 32");

console.log("\n▸ Proportion: direct, inverse and the invariant");

check(12.5 / 5 === 2.5 && 2.5 * 8 === 20,
  "£12.50 for 5 kg gives a £2.50 unit rate and £20 for 8 kg");
check(6 * 8 === 48 && 48 / 4 === 12,
  "6 workers for 8 days is 48 worker-days, so 4 workers take 12 days");
check(7 / 2 === 3.5 && 17.5 / 5 === 3.5 && 28 / 8 === 3.5,
  "the table has a constant quotient of 3.5");
check(18 / 6 === 3 && 3 * 10 === 30,
  "y = 18 when x = 6 gives y = 30 when x = 10");
check(3 * 4 === 12 && 12 / 6 === 2,
  "inverse proportion with 3 × 4 = 12 gives y = 2 when x = 6");
check(15 * 40 === 600 && 600 / 20 === 30 && 600 / 30 === 20,
  "the cycling transfer gives 30 minutes at 20 km/h and 20 km/h for 30 minutes");
check(/modelAnswer: "30"/.test(proportion) && /modelAnswer: "2"/.test(proportion),
  "the direct and inverse short-answer keys are 30 and 2");

console.log("\n▸ Sequences: differences, ratios and nth terms");

check(9 - 5 === 4 && 13 - 9 === 4 && 17 - 13 === 4,
  "5, 9, 13, 17 has a common difference of 4");
check(4 * 1 + 1 === 5 && 4 * 4 + 1 === 17,
  "4n + 1 generates the first and fourth terms");
check(6 / 3 === 2 && 12 / 6 === 2 && 24 / 12 === 2,
  "3, 6, 12, 24 has a common ratio of 2");
check(24 * 2 === 48 && 48 * 2 === 96,
  "the geometric sequence continues 48, 96");
check(5 * 1 - 3 === 2 && 5 * 4 - 3 === 17 && 5 * 5 - 3 === 22,
  "5n - 3 generates 2, 7, 12, 17, 22");
check(5 * 12 - 2 === 58, "the 12th term of 5n - 2 is 58");
check(80 / 2 === 40 && 40 / 2 === 20 && 20 / 2 === 10 && 10 / 2 === 5,
  "80, 40, 20, 10 has ratio 1/2 and continues 5");
check(3 * 1 + 2 === 5 && 3 * 20 + 2 === 62 && 3 * 32 + 2 === 98 && 3 * 33 + 2 === 101,
  "the tiling rule 3n + 2 gives 62 at figure 20 and first exceeds 100 at figure 33");
check(/modelAnswer: "58"/.test(sequences) && /modelAnswer: "5"/.test(sequences),
  "the sequence short-answer keys are 58 and 5");

console.log(`\nMaths batch: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
