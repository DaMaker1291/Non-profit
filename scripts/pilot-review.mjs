// Validate an educator's review record. This is deliberately an OFFLINE,
// human-driven step: no endpoint creates a reviewer, and no valid record is
// copied into the product automatically.
//
//   cp pilot-readiness/REVIEW_RECORD_TEMPLATE.json /tmp/review.json
//   # a qualified teacher fills it in
//   npm run pilot:review -- --file /tmp/review.json
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const OUT = "reports/.pilot-verify";
fs.rmSync(OUT, { recursive: true, force: true });
execSync(
  `npx tsc lib/pilot.ts lib/pilot-review.ts lib/pilot-mappings.ts --outDir ${OUT} --rootDir . ` +
  "--module commonjs --target es2020 --skipLibCheck --esModuleInterop --strict",
  { stdio: "inherit" },
);
const require = createRequire(import.meta.url);
const P = require(`../${OUT}/lib/pilot.js`);
const R = require(`../${OUT}/lib/pilot-review.js`);

const fileArg = process.argv.indexOf("--file");
if (fileArg < 0 || !process.argv[fileArg + 1]) {
  console.error("Usage: npm run pilot:review -- --file <review.json>");
  console.error("Template: pilot-readiness/REVIEW_RECORD_TEMPLATE.json");
  process.exit(2);
}
const file = process.argv[fileArg + 1];
let record;
try {
  record = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error(`Could not read ${file}: ${e.message}`);
  process.exit(2);
}
if (!P.isPilotConcept(record.conceptId)) {
  console.error(`Not a pilot concept: ${record.conceptId}`);
  process.exit(1);
}
const plan = P.lessonStatus(record.conceptId).plan;
const problems = R.reviewProblems(record, plan, P.PILOT_LESSON_VERSION);
if (problems.length) {
  console.error("Review record is not valid:");
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`Review record valid for ${record.conceptId}: ${record.decision}.`);
console.log("This command does not write an approval. A real approval is a deliberate code change to PILOT_APPROVALS after this record is filed.");
if (record.decision === "approve") {
  console.log("Approval fields justified by this record:");
  console.log(JSON.stringify(R.approvalFromReview(record), null, 2));
}
