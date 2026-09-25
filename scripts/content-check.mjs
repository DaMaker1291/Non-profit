// npm run content-check — the CONTENT PIPELINE's gate.
//
// The product's premise is that a recommendation is a projection of evidence,
// and evidence comes from items. That makes the item STACK part of the learning
// contract, not part of the UI: if a question can name a concept that does not
// exist, or a misconception the catalogue has never heard of, or a demand band
// the ladder does not define, then a learner's evidence is being recorded
// against a claim nobody can reconstruct. This script is where those claims are
// read across their joins, once, so that "adding content" is a DATA change that
// either passes here or fails the build.
//
// It answers four questions and is deliberately narrow about each:
//
//   1. IS THE GRAPH CONSISTENT?  (lib/content-graph.ts — every join, checked)
//   2. WHAT CAN WE ACTUALLY TEACH?  Which demand levels this bank can serve per
//      concept, and which of those are a CONTENT GAP rather than an instrument
//      limit. The distinction is the difference between a work item and an
//      honest "not yet measured" on the Mind page.
//   3. IS THE DECLARED SLICE COMPLETE?  A vertical slice is a product decision,
//      so it is declared in one constant and checked here — never inferred from
//      whatever content happens to exist.
//   4. MAY WE SHOW IT?  Every item's provenance is resolved through the rights
//      gate for every specification the item could be served under. An item
//      whose origin denies "display" must fail BEFORE a learner sees it.
//
// Usage:
//   npm run content-check            summaries + the declared slice
//   npm run content-check -- --all   the full per-concept coverage table
//
// Exit code 1 means: do not ship this content. The report says which join broke
// and, where there is one, the fix.
//
// This is the same gate as `npm run verify` (which runs `validateContentGraph`
// and the declared slice first, hard), exposed as the content AUTHOR's report:
// coverage per concept and topic, the declared slice, rights and provenance,
// and item identity on the served path. Both entry points compile through
// scripts/compile-engines.mjs, so the graph is compiled once into `.verify` —
// a second mirror beside the first is a second thing to disagree with.
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const ALL = process.argv.includes("--all");

compileEngines();

const require = createRequire(import.meta.url);
const graph = require("../.verify/content-graph.js");
const genome = require("../.verify/genome.js");
const misconceptions = require("../.verify/misconceptions.js");
const bank = require("../.verify/question-bank.js");
const specs = require("../.verify/specifications.js");
const rights = require("../.verify/content-rights.js");
const questions = require("../.verify/questions.js");
// The topic layer carries an i18n KEY, never English text (`lib/genome`'s
// `STAGE_NAMES`), so the report renders it through the same translator the
// product uses — the script used to read a `name` field that does not exist
// and printed `undefined` for every topic.
const i18n = require("../.verify/i18n.js");
const tName = (topic) => i18n.translator("en")(topic.nameKey);

let failures = 0;
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

// ── 1. Graph integrity ──────────────────────────────────────────────────────
console.log("\n▸ Graph integrity");
const violations = graph.validateContentGraph();
if (violations.length) {
  const byRelation = new Map();
  for (const v of violations) {
    if (!byRelation.has(v.relation)) byRelation.set(v.relation, []);
    byRelation.get(v.relation).push(v);
  }
  for (const [relation, list] of byRelation) {
    fail(`${relation}: ${list.length}`);
    for (const v of list.slice(0, 12)) console.log(`      ${v.id} — ${v.detail}`);
    if (list.length > 12) console.log(`      … ${list.length - 12} more`);
  }
} else {
  ok(`${genome.CONCEPTS.length} concepts, ${questions.GENERATED_CONCEPT_IDS.length} generators, ` +
     `${Object.keys(misconceptions.MISCONCEPTIONS_BY_ID).length} misconception catalogues — every join resolves`);
}

// ── 2. Coverage: what this bank can serve, per concept and per topic ────────
console.log("\n▸ Coverage — what OpenMind can actually teach");
const coverage = graph.coverageReport();
const byId = new Map(coverage.map((c) => [c.conceptId, c]));
const practisable = coverage.filter((c) => c.practisable);
const bySkill = new Map(bank.SKILL_LADDER.map((s) => [s, 0]));
for (const c of coverage) for (const s of c.skills) bySkill.set(s, bySkill.get(s) + 1);
console.log(`  ${practisable.length}/${coverage.length} concepts have a generator · ` +
  bank.SKILL_LADDER.map((s) => `${s} ${bySkill.get(s)}`).join(" · "));
const outOfBank = coverage[0]?.outOfBank ?? [];
if (outOfBank.length) {
  console.log(`  instrument limit (unreachable for every concept): ${outOfBank.join(", ")} ` +
    `— declared by the ladder, reported per concept so "not measured" is never read as a fact about a learner`);
}

// The gap list is the authoring work queue: reachable in this bank generally,
// but missing for this concept. That is the honest content backlog.
const gaps = coverage.filter((c) => c.practisable && c.gap.length);
console.log(`  ${gaps.length} practisable concepts have a content gap ` +
  `(${gaps.length ? "reported per concept below" : "every practisable concept reaches the deepest band the bank can serve"})`);

function coverageLine(c) {
  const skills = bank.SKILL_LADDER.map((s) =>
    c.skills.includes(s) ? s : outOfBank.includes(s) ? "·" : "-").join(" ");
  return `    ${c.conceptId.padEnd(24)} depth ${String(c.depth.toFixed(2)).padEnd(5)} ${skills}` +
    (c.gap.length ? `   gap: ${c.gap.join(",")}` : "");
}

// Topics are the genome's own stage bands — the only grouping the data has, so
// the report groups by exactly that rather than inventing a taxonomy.
const subjects = [...new Set(genome.CONCEPTS.map((c) => c.subject))];
const topics = graph.topicsBySubject();
if (ALL) {
  for (const subject of subjects) {
    for (const t of topics.filter((x) => x.subject === subject)) {
      const rows = t.conceptIds.filter((cid) => byId.has(cid));
      if (!rows.length) continue;
      console.log(`\n  ${subject} · ${tName(t)} (stage ${t.stage})`);
      for (const cid of rows) console.log(coverageLine(byId.get(cid)));
    }
  }
}

// ── 3. The declared vertical slice ─────────────────────────────────────────
console.log("\n▸ The declared vertical slice");
const sliceGaps = graph.sliceGaps();
if (sliceGaps.length) {
  for (const g of sliceGaps) {
    const cov = byId.get(g.conceptId);
    fail(`${g.conceptId}: missing ${g.missing.join(", ")}` +
      (cov ? ` (bank reaches: ${cov.skills.join(", ") || "nothing"})` : " (no generator — not practisable)"));
  }
} else {
  const summary = graph.SLICE_EXPECTATIONS
    .map((e) => `${e.conceptId} [${e.required.join(",")}]`).join(" · ");
  ok(`declared slice is complete: ${summary}`);
}

// ── 4. Rights and provenance ───────────────────────────────────────────────
console.log("\n▸ Rights and provenance");
if (bank.OFFICIAL_ITEMS !== 0) {
  fail(`OFFICIAL_ITEMS is ${bank.OFFICIAL_ITEMS}: the bundled bank ships no licensed board material`);
} else {
  ok("bundled bank contains 0 official board items — every item is OpenMind-authored");
}
if (rights.LICENCES.length === 0) {
  ok("no licence records on file — licensed material is therefore DENIED by default, not rendered");
}
// Every item that could ever be served, under EVERY specification and tier, must
// have a provenance whose origin actually permits being displayed and processed.
// A surface is not the place to discover a permission problem.
let checked = 0;
const denials = [];
for (const spec of specs.SPECIFICATIONS) {
  for (const level of spec.levels) {
    const active = { spec, level };
    for (const c of specs.coverageOf(active)) {
      if (!byId.get(c.id)?.practisable) continue;
      const cov = byId.get(c.id);
      const item = bank.itemFor(c.id, "rights:0", cov.depth, active, "practice", []);
      checked++;
      for (const action of ["display", "process", "store"]) {
        if (!rights.mayUse(item.provenance.source, action, rights.licenceFor(spec.id))) {
          denials.push(`${spec.id}/${level.id}: ${item.id} may not ${action}`);
        }
      }
      if (item.provenance.source !== "openmind_authored" && !rights.licenceFor(spec.id)) {
        denials.push(`${spec.id}/${level.id}: ${item.id} claims ${item.provenance.source} with no licence`);
      }
    }
  }
}
if (denials.length) {
  for (const d of denials.slice(0, 10)) fail(d);
  if (denials.length > 10) fail(`… ${denials.length - 10} more rights denials`);
} else {
  ok(`${checked} served-item × spec-tier provenance records permitted (display · process · store)`);
}

// ── 5. Item identity on the SERVED path ────────────────────────────────────
console.log("\n▸ Item identity on the served path");
// The graph validator checks the raw generator; this checks what a learner
// actually meets — the difficulty-targeted draw (`generateQuestionAt`) — because
// the seed search is part of the item's identity. An item id is `concept:seed`,
// and re-drawing the same inputs must rebuild the same question: that is what
// lets the ledger name a question without storing its text.
let ids = 0, drift = 0;
for (const cid of questions.GENERATED_CONCEPT_IDS) {
  for (const target of [0.2, 0.5]) {
    const a = questions.generateQuestionAt(cid, "id:0", target);
    const b = questions.generateQuestionAt(cid, "id:0", target);
    if (!a || !b) continue;
    ids++;
    if (a.id !== b.id || a.answer !== b.answer || a.prompt !== b.prompt ||
        a.choices.join("|") !== b.choices.join("|") || a.difficulty !== b.difficulty) drift++;
  }
}
if (drift) fail(`${drift} served draws were not reproducible from the same seed and target`);
else ok(`${ids} difficulty-targeted draws reproducible from (concept, seed, target)`);

// ── Verdict ────────────────────────────────────────────────────────────────
console.log(
  failures === 0
    ? `\nContent check: PASS — ${coverage.length} concepts, ${practisable.length} practisable, ` +
      `${gaps.length} content gaps (work items, not failures)\n`
    : `\nContent check: FAIL — ${failures} problem${failures === 1 ? "" : "s"} must be fixed before serving\n`,
);
process.exit(failures ? 1 : 0);
