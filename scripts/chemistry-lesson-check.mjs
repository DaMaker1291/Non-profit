#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE CHEMISTRY LESSONS, CHECKED AS LESSONS.
//
// The formatting defect was not "the text is bad"; it was that a lesson arrived
// as one undifferentiated block. These assertions are about the SHAPE a learner
// meets: sections, formulas, tables and worked examples, plus the reaction
// profile whose sign must agree with the arithmetic beside it. They do not claim
// the lessons are subject-reviewed — the plans say `unreviewed`, and so does the
// page.
//
// Run: node scripts/chemistry-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const P = require("../.verify/lesson-plans.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}

const CASES = {
  "moles-calcs": { tables: 2, formulas: 3, steps: 7, worked: 3, words: 450 },
  "energy-changes": { tables: 2, formulas: 4, steps: 4, worked: 2, words: 450 },
};

for (const [id, expected] of Object.entries(CASES)) {
  const plan = P.planFor(id);
  ok(Boolean(plan), `${id}: an authored plan exists`);
  if (!plan) continue;
  ok(plan.provenance === "authored", `${id}: provenance says authored`);
  ok(plan.review === "unreviewed", `${id}: review status is not overstated`);
  ok(Array.isArray(plan.sections) && plan.sections.length >= 5, `${id}: at least five teaching sections`);
  ok(plan.sections.every((s) => s.heading.trim().length > 0), `${id}: every section has a heading`);
  ok(plan.sections.every((s) => s.body.length > 0), `${id}: every section has prose`);
  ok(plan.sections.filter((s) => s.body.length >= 2).length >= 4, `${id}: sections develop more than one point where needed`);
  ok(plan.sections.filter((s) => s.formula).length >= expected.formulas, `${id}: formulas are given their own blocks`);
  ok(plan.sections.filter((s) => s.table).length >= expected.tables, `${id}: comparison tables are present`);
  ok(plan.sections.reduce((n, s) => n + (s.steps?.length ?? 0), 0) >= expected.steps, `${id}: methods are numbered steps`);
  ok(plan.workedExamples.length >= expected.worked, `${id}: worked examples are present`);
  ok(plan.traps.length >= 3, `${id}: wrong moves are named with reasons`);
  ok(plan.recap.length >= 3, `${id}: the retrieval recap has three points`);
  ok(plan.terms.length >= 5, `${id}: key terms are defined`);
  const words = plan.idea.join(" ").split(/\s+/).filter(Boolean).length;
  ok(words >= expected.words, `${id}: teaching prose is substantial (${words} words)`);
  const paragraphs = plan.sections.flatMap((s) => s.body);
  ok(paragraphs.every((p) => p.split(/\s+/).filter(Boolean).length >= 12), `${id}: no one-line orphan paragraphs`);
  const longest = Math.max(...paragraphs.map((p) => p.length));
  ok(longest <= 700, `${id}: no paragraph is a wall (longest ${longest} chars)`);
  ok(plan.sections.some((s) => s.formula?.includes("=")), `${id}: at least one formula is an equation, not a label`);
}

// THE CHEMISTRY VERTICAL IS COMPLETE ON THE THING WE CAN HONESTLY CLAIM: every
// one of the sixteen concepts has a subject-specific diagram. It has NO video
// card: the old BBC/Khan cards were longer than the lesson and opened behind a
// consent screen. A future card must clear both bars; this gate fails if an old
// source or a six-minute video returns.
const G = require("../.verify/genome.js");
const chemistry = G.CONCEPTS.filter((c) => c.subject === "chemistry");
const missingFigures = chemistry.filter((c) => !P.planFor(c.id)?.figure);
ok(chemistry.length === 16, `chemistry has its full sixteen concepts (${chemistry.length})`);
ok(missingFigures.length === 0, `every chemistry concept has a diagram (missing: ${missingFigures.map((c) => c.id).join(", ") || "none"})`);
const badVideoHost = /(?:bbc\.co\.uk|khanacademy\.org)/i;
const badSource = chemistry.filter((c) => badVideoHost.test(P.planFor(c.id)?.video?.url ?? ""));
ok(badSource.length === 0, `no chemistry video sends a learner to an unverified consent-walled host (${badSource.map((c) => c.id).join(", ") || "none"})`);
const tooLong = chemistry.filter((c) => {
  const length = P.planFor(c.id)?.video?.length;
  if (!length) return false;
  const seconds = String(length).split(":").reduce((n, part) => n * 60 + Number(part), 0);
  return seconds > 180;
});
ok(tooLong.length === 0, `no chemistry video is longer than three minutes (${tooLong.map((c) => c.id).join(", ") || "none"})`);

const energy = P.planFor("energy-changes");
ok(energy.figure?.spec?.kind === "energy-profile", "energy-changes: the reaction profile is attached");
ok(energy.figure?.spec?.delta === -185, "energy-changes: the profile's ΔH is the calculated value");
ok(energy.figure?.spec?.activation === 150, "energy-changes: the profile declares its activation barrier");
ok(/not to scale/i.test(energy.figure?.caption ?? ""), "energy-changes: the schematic caption says it is not to scale");

// The second calculation-first repair. The defect was identical in shape to the
// moles one: the lesson opened with "Enthalpy is the energy ledger", so a learner
// met the definition of ΔH before meeting a single ΔH. The first section must
// now DO the bond-energy calculation — with the table's numbers and the sign —
// and the definition may only follow it.
const energyFirst = energy.sections[0];
const energyFirstBody = energyFirst?.body.join(" ") ?? "";
ok(/calculate/i.test(energyFirst?.heading ?? ""), "energy-changes: the lesson starts with a calculation, not a definition");
ok((energyFirst?.steps?.length ?? 0) >= 4, "energy-changes: the first section carries the four-move bond-energy method");
ok(/679/.test(energyFirstBody) && /864/.test(energyFirstBody) && /−185|-185/.test(energyFirstBody), "energy-changes: the first section substitutes real bond energies and gives ΔH");
ok(!/enthalpy is the energy ledger/i.test(energyFirst?.heading ?? ""), "energy-changes: the definition no longer precedes the method");
ok(energy.sections.findIndex((s) => /what the sign/i.test(s.heading)) > 0, "energy-changes: the definition follows the worked calculation");
ok(energy.sections.some((s) => /calorimetry/i.test(s.heading) && /q = m c/.test(s.body.join(" "))), "energy-changes: calorimetry is taught with its equation");

const moles = P.planFor("moles-calcs");
const molesFirst = moles.sections[0];
ok(/calculate/i.test(molesFirst?.heading ?? ""), "moles-calcs: the lesson starts with a calculation, not a definition");
ok((molesFirst?.steps?.length ?? 0) >= 4, "moles-calcs: the first section carries the four-move method");
ok(/8\.0 g/.test(molesFirst?.body.join(" ") ?? "") && /0\.20 mol/.test(molesFirst?.body.join(" ") ?? ""), "moles-calcs: the first section substitutes real numbers and gives the answer");
ok(!/count, not a mass/i.test(molesFirst?.heading ?? ""), "moles-calcs: the definition no longer precedes the method");
ok(moles.sections.some((s) => /limiting reagent|limiting reactant/i.test(s.body.join(" "))), "moles-calcs: limiting reagent is taught, not only named");
ok(moles.sections.some((s) => /0\.0250|cm³.*1000|1000.*cm³/i.test(s.body.join(" "))), "moles-calcs: the cm³-to-dm³ conversion is explicit");

// The renderers must consume the structured field; otherwise the data is present
// and the learner still sees the old wall.
const page = readFileSync(new URL("../app/learn/[subject]/[concept]/page.tsx", import.meta.url), "utf8");
const twin = readFileSync(new URL("../docs/app.js", import.meta.url), "utf8");
const appCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const twinCss = readFileSync(new URL("../docs/app.css", import.meta.url), "utf8");
ok(page.includes("plan.sections"), "the app renders the structured sections");
ok(twin.includes("plan.sections"), "the offline twin renders the structured sections");
ok(/\.lesson-sections\s*\{/.test(appCss) && /\.lesson-sections\s*\{/.test(twinCss), "both stylesheets give the sections a layout");
ok(/\.lesson-formula\s*\{/.test(appCss) && /\.lesson-formula\s*\{/.test(twinCss), "formulas are styled in both products");
ok(/\.lesson-table\s*\{/.test(appCss) && /\.lesson-table\s*\{/.test(twinCss), "tables are styled in both products");

if (failures.length) {
  console.error("Chemistry lesson failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(`✓ ${passed} assertions: chemistry sections, formulas, tables, worked examples, complete diagram coverage, no unverified chemistry video, profile and both renderers.`);
