// ─────────────────────────────────────────────────────────────────────────────
// `npm run research-check` — the register's own gate, for an operator.
//
// The same validator the suite runs (`lib/learning-research.ts#validateResearch`),
// printed as a report rather than a pass/fail line: what has actually been read,
// what is only located, what could not be reached, and every honesty or licence
// problem in one list. Two copies of these rules would eventually disagree, so
// there is one.
//
// It exits non-zero on any problem, so it can be wired into CI beside the content
// gates that are not part of `npm run verify` (explain:audit, gate:ceiling,
// gate:options).
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { compileEngines } = await import("./compile-engines.mjs");
process.env.OPENMIND_DATA_DIR ??= "/tmp/om-research-check";
compileEngines();

const research = require("../.verify/learning-research.js");
const summary = research.researchSummary();
const problems = research.validateResearch();

console.log(`▸ research register: ${summary.sources} source(s)`);
console.log(`  inspected ${summary.inspected} · identified only ${summary.identified} · blocked ${summary.blocked}`);
console.log(`  pilot concepts with completed research: ${summary.researchedConcepts.join(", ") || "none"}`);
for (const d of research.CONCEPT_DOSSIERS) {
  const cited = research.RESEARCH_SOURCES.filter((s) => s.concepts.includes(d.conceptId) && s.inspection === "inspected").length;
  console.log(`  ${d.subject.padEnd(9)} ${d.conceptId.padEnd(22)} ${d.status.padEnd(10)} ${cited} inspected · educator review ${d.educatorReview}`);
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\n✓ every inspected source says what was read; no NC/ND work is marked reusable; no concept overclaims its research");
