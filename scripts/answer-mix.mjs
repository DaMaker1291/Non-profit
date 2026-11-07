#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THE PRACTICE SERVE ASKS LEARNERS TO DO — measured, not assumed.
//
// The product claim is that practice is mostly production rather than
// recognition. That is a fact about the SERVED path, not about how many
// generators exist: `generateQuestionNear` decides which draw a learner meets,
// and a family that looks constructed at bank level can be unreachable at the
// tier aim. So this samples the serve the way the route does, applies the same
// response-mode conversion, and reports the mix over every concept.
//
// It is deliberately NOT wired into `npm run verify`: the engines suite is about
// correctness and this is a content-proportion gate whose bar may move when the
// bank moves. Run it with `--check` in a release review; the measured floor is
// printed beside every failure so a moved bar is visible in the diff.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
const check = process.argv.includes("--check");
const DRAWS = Number(process.env.ANSWER_MIX_DRAWS ?? 10);
const AIM = Number(process.env.ANSWER_MIX_AIM ?? 0.45);

compileEngines();

const genome = require("../.verify/genome.js");
const questions = require("../.verify/questions.js");
const modes = require("../.verify/response-mode.js");

const ids = (genome.CONCEPTS ?? []).map((concept) => concept.id).filter(Boolean);
if (!ids.length) {
  console.error("answer-mix: the genome exported no concepts");
  process.exit(1);
}

const tally = { choice: 0, numeric: 0, fraction: 0, pair: 0 };
let total = 0;
const perConcept = [];

for (const id of ids) {
  const local = { choice: 0, numeric: 0, fraction: 0, pair: 0 };
  for (let i = 0; i < DRAWS; i++) {
    // 40 attempts, the production budget (`PRACTICE_DRAW_ATTEMPTS` in
    // lib/operations.ts), not the library default of 4. A measurement taken at
    // a smaller budget would understate how often the band search reaches a
    // constructed item.
    const drawn = questions.generateQuestionNear(id, `answer-mix:${i}`, AIM, 40);
    if (!drawn) continue;
    const served = modes.withStructuredResponse(drawn);
    const kind = served.responseKind ?? "choice";
    if (!(kind in tally)) {
      console.error(`answer-mix: ${id} served an unknown response kind ${kind}`);
      process.exit(1);
    }
    tally[kind]++;
    local[kind]++;
    total++;
  }
  if (local.choice + local.numeric + local.fraction + local.pair > 0) perConcept.push([id, local]);
}

const nonChoice = total - tally.choice;
const share = total ? nonChoice / total : 0;
const structured = tally.fraction + tally.pair;

console.log(`Answer mix at the practice serve — ${total} draws, ${ids.length} concepts, aim ${AIM}`);
console.log(`  numeric      ${String(tally.numeric).padStart(5)}  ${(tally.numeric / total * 100).toFixed(1)}%`);
console.log(`  fraction     ${String(tally.fraction).padStart(5)}  ${(tally.fraction / total * 100).toFixed(1)}%`);
console.log(`  pair         ${String(tally.pair).padStart(5)}  ${(tally.pair / total * 100).toFixed(1)}%`);
console.log(`  four options ${String(tally.choice).padStart(5)}  ${(tally.choice / total * 100).toFixed(1)}%`);
console.log(`  non-multiple-choice ${nonChoice}/${total} (${(share * 100).toFixed(1)}%)`);
console.log(`  constructed (fraction + pair) ${structured}/${total}`);

const withStructured = perConcept.filter(([, local]) => local.fraction + local.pair > 0);
if (withStructured.length) {
  console.log("  concepts that serve a constructed answer:");
  for (const [id, local] of withStructured) {
    console.log(`    ${id}: ${local.fraction} fraction, ${local.pair} pair of ${local.choice + local.numeric + local.fraction + local.pair}`);
  }
}

if (!check) process.exit(0);

// A floor, not a target: the measured value is printed above, and raising the
// floor is a deliberate act with the diff in front of a reviewer.
const MIN_NON_CHOICE = 0.6;
const MIN_STRUCTURED = 10;
const failures = [];
if (share < MIN_NON_CHOICE) failures.push(`non-multiple-choice ${(share * 100).toFixed(1)}% is below the committed floor ${(MIN_NON_CHOICE * 100).toFixed(0)}%`);
if (structured < MIN_STRUCTURED) failures.push(`constructed answers ${structured} is below the committed floor ${MIN_STRUCTURED}`);
if (failures.length) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log(`✓ at least ${(MIN_NON_CHOICE * 100).toFixed(0)}% of served practice is not multiple choice, and the new kinds are reachable`);
