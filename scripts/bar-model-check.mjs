#!/usr/bin/env node
// The shared bar model's arithmetic, independent of any lesson.
//
// A bar is a claim about proportion: each segment's WIDTH is its value, the
// segments fill the whole, and the unit ticks divide the whole into equal
// pieces. A drawing that says five boxes while its caption says seven is worse
// than no drawing, so the layout is asserted directly.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { barLayout } = require("../.verify/lesson-figure.js");

let passed = 0;
const failures = [];
const ok = (condition, label) => {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.log(`  ✗ FAIL: ${label}`);
  }
};
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

const bar = barLayout({
  kind: "bar",
  parts: [
    { label: "3 parts", units: 3, shade: true },
    { label: "2 parts", units: 2 },
  ],
  totalLabel: "5 equal parts",
});

ok(bar.total === 5, "3 + 2 parts make a whole of 5");
ok(bar.parts.length === 2, "the bar draws both parts");
ok(bar.parts[0]?.shade === true && bar.parts[1]?.shade === false,
  "the first part is shaded and the second is plain");
ok(close(bar.parts[0].width / bar.bar.w, 3 / 5),
  "the first part occupies 3/5 of the bar's width");
ok(close(bar.parts[1].width / bar.bar.w, 2 / 5),
  "the second part occupies 2/5 of the bar's width");
ok(close(bar.parts[0].width + bar.parts[1].width, bar.bar.w),
  "the two parts fill the whole bar without a gap");
ok(bar.ticks.length === 4, "five equal units need four internal cuts");
ok(bar.ticks.every((x) => x > bar.bar.x && x < bar.bar.x + bar.bar.w),
  "every unit cut is inside the bar");

if (failures.length) {
  console.error(`\n${failures.length} bar-model check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`\nBar model: ${passed} passed, 0 failed`);
