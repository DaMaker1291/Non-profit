#!/usr/bin/env node
// ── WHAT THE PILOT'S OWN ITEMS CAN DIAGNOSE ─────────────────────────────────
//
// Phase 5 of the audit asked which pilot concepts have "no misconception to
// probe". This answers it from the bank rather than from the lesson prose, and
// the answer is worse than the audit assumed: SIX of the twenty pilot concepts
// (all six foundations-arithmetic ones) produce no tagged draw at all, so a
// wrong answer there cannot name a belief and no repair can fire.
//
// The cause is measurable in the same run: half of each concept's draws are the
// NUMERIC layer, which has no options and therefore no misconception tag by
// construction. The other half is multiple choice, and those families simply
// never set `misconceptionTags`.
//
// This is a REPORT, not a gate: it writes audit/assessment-quality.json and
// prints the table. It must not fail the build for a content gap that is
// honestly recorded — the gate that fails is `verify:q`, and the review that
// finds the gap is a teacher's.
//
// Usage: node scripts/assessment-quality.mjs
import fs from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const q = require("../.verify/questions.js");
const pack = JSON.parse(fs.readFileSync("audit/pilot-pack.json", "utf8"));
const SEEDS = 40;

const rows = [];
for (const concept of pack.concepts) {
  let tagged = 0;
  let numeric = 0;
  let total = 0;
  for (let i = 0; i < SEEDS; i += 1) {
    // A fixed, spread seed set: i * a prime, so consecutive draws are not
    // neighbouring states of the generator (the Rng trap this project has hit).
    const item = q.generateQuestion(concept.id, i * 7919 + 13);
    if (!item) continue;
    total += 1;
    if ((item.misconceptionTags ?? []).length > 0) tagged += 1;
    if (item.responseKind === "numeric") numeric += 1;
  }
  rows.push({
    conceptId: concept.id,
    title: concept.title,
    subject: concept.subject,
    draws: total,
    tagged,
    numeric,
    multipleChoice: total - numeric,
    repaired: tagged > 0,
  });
}

const undiagnosable = rows.filter((r) => r.tagged === 0);
const report = {
  generatedAt: new Date().toISOString(),
  seedsPerConcept: SEEDS,
  pilotConcepts: rows.length,
  conceptsWithNoTaggedDraw: undiagnosable.map((r) => r.conceptId),
  note: "A numeric draw has no options, so it cannot carry a misconception tag by construction. A concept whose MULTIPLE-CHOICE draws also carry none gives a wrong answer no diagnosis and fires no repair — that is the gap this file records.",
  rows,
};
fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync("audit/assessment-quality.json", JSON.stringify(report, null, 2) + "\n");

console.log("▸ Assessment quality — what the pilot's items can diagnose");
console.log(`  ${rows.length} pilot concepts × ${SEEDS} draws`);
for (const r of rows) {
  const flag = r.tagged === 0 ? "  ← no diagnosis at all" : "";
  console.log(
    `  ${r.conceptId.padEnd(18)} tagged ${String(r.tagged).padStart(2)}/${r.draws}  numeric ${String(r.numeric).padStart(2)}/${r.draws}${flag}`,
  );
}
console.log(`  concepts with no tagged draw: ${undiagnosable.length} (${undiagnosable.map((r) => r.conceptId).join(", ")})`);
console.log("  → audit/assessment-quality.json");
