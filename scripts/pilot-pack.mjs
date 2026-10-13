// ─────────────────────────────────────────────────────────────────────────────
// THE REVIEW PACK — the artefact a teacher is handed, generated from the content
// so it cannot describe a bank that has moved.
//
// WHY THIS EXISTS. The project's honest figure is 0 of 135 concepts reviewed by a
// qualified person, and the reason is not unwillingness: there was nothing to
// hand anyone. A reviewer needs the items a learner will actually meet, at fixed
// seeds they can reproduce, with the key and the explanation beside them and the
// misconception each distractor is supposed to probe — not a repository to read.
// The owner's decision (UK GCSE Mathematics, mixed-tier Year 10 class, reviewer
// to be recruited) fixes the CLUSTER; this script fixes the PACK.
//
// THE CLUSTER IS COMPUTED, NOT CHOSEN. Anchors are the two concepts in the GCSE
// maths strand whose answers the bank already re-derives independently
// (`surds`, `completing-square`); the cluster is the anchors plus every
// prerequisite they need, filtered to the concepts this course actually teaches,
// and each concept is labelled with the tier(s) that serve it. A reviewer reads
// 9–12 concepts, not 135, and the number came from the graph.
//
// WHAT IT DELIBERATELY DOES NOT DO: claim any review. It writes the SLOTS.
// `audit/item-reviews.json` is the one source of the human-review claim, its
// entries need a name and a date, and `npm run verify:q` refuses an entry naming
// a concept the bank cannot generate. A pack that marked itself reviewed would be
// the exact defect this project keeps finding: a claim with nothing behind it.
//
// Usage:
//   node scripts/pilot-pack.mjs            # writes audit/pilot-pack.json + docs/REVIEW_PACK.md
//   node scripts/pilot-pack.mjs --check     # fails if either is stale
//
// Prerequisite: none — it compiles the engine mirror itself, like the gates.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
const CHECK = process.argv.includes("--check");

compileEngines();
const G = require("../.verify/genome.js");
const M = require("../.verify/misconceptions.js");
const S = require("../.verify/specifications.js");
const Q = require("../.verify/questions.js");

// ── The course and the anchors ───────────────────────────────────────────────
const SPEC_ID = "uk-gcse";
const SPEC = S.specById(SPEC_ID);
// The two concepts whose answer is already re-derived from the prompt
// (scripts/verify-questions.mjs#SEMANTIC) and that sit in this course's maths
// strand. Named here because a pilot has to start somewhere; everything else
// about the cluster is derived.
const ANCHORS = ["surds", "completing-square"];
// The serve call `app/api/progress/route.ts` makes: band-first search at the
// tier's difficulty, 40 attempts. A pack sampled with the library default (4)
// would show items the pilot would never serve.
const ATTEMPTS = 40;
const DRAWS_PER_TIER = 6;
const SEED_NS = "pilot";

// Which concepts the machine already re-derives from the prompt, READ from the
// coverage record rather than typed here: a pack that claimed a verification the
// audit does not report would be the drift this project keeps finding.
const coverage = JSON.parse(fs.readFileSync(path.join("audit", "verification-coverage.json"), "utf8"));
const PROMPT_DERIVED = new Set(coverage.layers?.promptDerived ?? []);

const byTier = Object.fromEntries(
  SPEC.levels.map((level) => [level.id, S.coverageOf({ spec: SPEC, level })]),
);
const inCourse = (id) => Object.values(byTier).some((list) => list.some((c) => c.id === id));
const tiersFor = (id) => SPEC.levels.filter((level) => byTier[level.id].some((c) => c.id === id)).map((l) => l.id);

// ── The cluster: anchors ∪ every prerequisite they need, inside the course ───
const cluster = [];
for (const anchor of ANCHORS) {
  if (!G.getConcept(anchor)) throw new Error(`anchor concept does not exist: ${anchor}`);
  for (const id of [anchor, ...G.ancestorsOf(anchor)]) {
    if (!inCourse(id)) continue;
    if (!cluster.includes(id)) cluster.push(id);
  }
}
// Ordered the way the graph teaches them: by stage, then by id, so a reviewer
// reads foundations before the concepts that need them.
cluster.sort((a, b) => {
  const ca = G.getConcept(a), cb = G.getConcept(b);
  return ca.stage - cb.stage || a.localeCompare(b);
});

// ── The items, at the seeds the reviewer will see again ──────────────────────
// A reviewer's finding has to be reproducible: the same seed re-draws the same
// item, in the app and on a second run of this script, which is what makes
// "item X, as served at seed S" a usable bug report. Nothing here is randomised.
const drawFor = (conceptId, level) => {
  const items = [];
  const seen = new Set();
  for (let i = 0; i < DRAWS_PER_TIER; i++) {
    const seed = `${SEED_NS}:${conceptId}:${level.id}:${i}`;
    const q = Q.generateQuestionNear(conceptId, seed, level.difficulty, ATTEMPTS);
    if (!q) continue;
    const key = `${q.prompt}|${q.choices?.[q.answer]}`;
    if (seen.has(key)) continue; // the same item twice is not two things to read
    seen.add(key);
    items.push({
      seed,
      tier: level.id,
      target: level.difficulty,
      prompt: q.prompt,
      choices: q.choices,
      answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      numeric: Q.isNumericDraw(q),
    });
  }
  return items;
};

const concepts = cluster.map((id) => {
  const c = G.getConcept(id);
  const tiers = tiersFor(id);
  const items = SPEC.levels.filter((l) => tiers.includes(l.id)).flatMap((l) => drawFor(id, l));
  const targeted = (c.misconceptions ?? []).map((mid) => M.MISCONCEPTIONS_BY_ID[mid]).filter(Boolean);
  // Misconceptions that NAME this concept are the reverse edge — a pattern the
  // catalogue fires here without the genome listing it. The pack prints both,
  // because a reviewer judging a distractor needs the pattern's own description.
  const naming = M.MISCONCEPTIONS.filter((m) => m.concepts.includes(id) && !(c.misconceptions ?? []).includes(m.id));
  return {
    id,
    title: c.title,
    subject: c.subject,
    stage: c.stage,
    lesson: c.lesson,
    prereqs: c.prereqs,
    tiers,
    depth: Q.conceptDepth(id),
    promptDerived: PROMPT_DERIVED.has(id),
    misconceptions: targeted.map((m) => ({ id: m.id, name: m.name, pattern: m.pattern })),
    misconceptionsNaming: naming.map((m) => ({ id: m.id, name: m.name, pattern: m.pattern })),
    items,
  };
});

const allItems = concepts.flatMap((c) => c.items);
const pack = {
  generatedBy: "scripts/pilot-pack.mjs",
  course: { id: SPEC.id, country: SPEC.country, board: SPEC.board, name: SPEC.name, tiers: SPEC.levels.map((l) => ({ id: l.id, name: l.name, difficulty: l.difficulty })) },
  anchors: ANCHORS,
  method: `cluster = anchors + their prerequisites, filtered to ${SPEC.id}; items drawn with generateQuestionNear(id, seed, tier.difficulty, ${ATTEMPTS}) — the production serve`,
  reviewState: {
    reviewedConcepts: 0,
    note: "No concept is marked reviewed by this pack. Records go in audit/item-reviews.json with a reviewer, a date and a scope, and `npm run verify:q` refuses an entry without them.",
  },
  totals: {
    concepts: concepts.length,
    items: allItems.length,
    promptDerived: concepts.filter((c) => c.promptDerived).length,
    withMisconceptions: concepts.filter((c) => c.misconceptions.length || c.misconceptionsNaming.length).length,
    foundationTier: concepts.filter((c) => c.tiers.includes("foundation")).length,
    higherTier: concepts.filter((c) => c.tiers.includes("higher")).length,
  },
  concepts,
};

// ── The teacher-facing document ──────────────────────────────────────────────
const KEY_MARK = "**";
const renderItem = (item, n) => [
  `**${n}. ${item.prompt}**`,
  "",
  ...item.choices.map((choice, i) => `${i === item.answer ? `${KEY_MARK}${String.fromCharCode(65 + i)}. ${choice}${KEY_MARK} ✓ key` : `${String.fromCharCode(65 + i)}. ${choice}`}`),
  "",
  `- Explanation given: ${item.explanation}`,
  `- Difficulty as served: ${item.difficulty.toFixed(2)} (tier target ${item.target})${item.numeric ? " · answered by typing a number" : ""}`,
  `- Reproduce it: \`${item.seed}\` at the ${item.tier} target`,
  "",
].join("\n");

// The checklist is the contract with the reviewer: seven questions per concept,
// and a concept counts as reviewed only when every item type in it has been read.
const CHECKLIST = [
  "**Is the key correct?** Work the item independently and compare with the key.",
  "**Is exactly one option defensible?** Two options that are the same answer in different clothes is a defect this bank has shipped once.",
  "**Does each distractor probe a real misconception** rather than being filler — and is the named misconception the one that option would actually reveal?",
  "**Does the explanation arrive at the key**, state why the key is right, and name what the wrong options represent?",
  "**Is the difficulty honest for the year group** it is served to? (Each item below prints the difficulty actually served.)",
  "**Is the reading level and vocabulary right** for that year, in the language it is taught?",
  "**Is the figure correct**, where there is one?",
];

const md = [];
md.push("# GCSE Mathematics — the review pack");
md.push("");
md.push(`Generated by \`scripts/pilot-pack.mjs\`; regenerate with \`npm run pilot-pack\`.`);
md.push("Nothing in this file is generated against held-out or scrubbed content: it is the bank itself, as served.");
md.push("");
md.push(`- **Course:** ${pack.course.name} (${pack.course.country} · ${pack.course.board}), tiers ${pack.course.tiers.map((t) => t.name).join(" and ")}`);
md.push(`- **Concepts:** ${pack.totals.concepts} — computed from the genome's prerequisite graph, anchored on \`${ANCHORS.join("\`, \`")}\``);
md.push(`- **Items:** ${pack.totals.items} draws at fixed seeds, reproducible one by one`);
md.push(`- **Already verified by machine:** ${pack.totals.promptDerived} of ${pack.totals.concepts} have their answer re-derived from the prompt (\`npm run verify:q\`); the other ${pack.totals.concepts - pack.totals.promptDerived} are structurally checked only, which is precisely what a human is here to add`);
md.push(`- **Human-reviewed:** 0. This pack does not review anything; it is what a reviewer reads, and their answers are recorded per concept.`);
md.push("");
md.push("## What the reviewer is asked to do");
md.push("");
md.push("For each concept: read every item below, answer the seven questions, and record the result. That is the whole ask — no repository reading, no setup.");
md.push("");
CHECKLIST.forEach((q, i) => md.push(`${i + 1}. ${q}`));
md.push("");
md.push("A concept counts as reviewed only when every item type in it has been read. The record is one entry per concept:");
md.push("");
md.push("```json");
md.push(JSON.stringify({
  conceptId: "surds",
  reviewer: "A. Teacher",
  reviewedOn: "2026-11-02",
  checklistVersion: 1,
  scope: `all ${concepts.find((c) => c.id === "surds")?.items.length ?? 0} draws below, every explanation read`,
  notes: "found one distractor ambiguous; the item is flagged for a rewrite",
}, null, 2));
md.push("```");
md.push("");
md.push("Entries live in [audit/item-reviews.json](../audit/item-reviews.json) and `npm run verify:q` copies them into the coverage record, so the published \"human reviewed\" figure has exactly one source. An entry without a reviewer and a date fails the audit — that is checked by planting one.");
md.push("");
md.push("## What the reviewer is NOT given");
md.push("");
md.push("No learner names, no class data, no individual results. The pack is content only, so reviewing the bank needs no consent and carries no personal data.");
md.push("");
md.push("## The cluster");
md.push("");
md.push("| # | Concept | Stage | Tier(s) | Items | Machine-verified | Misconceptions probed |");
md.push("|---|---|---|---|---|---|---|");
concepts.forEach((c, i) => {
  md.push(`| ${i + 1} | ${c.title} (\`${c.id}\`) | ${c.stage} | ${c.tiers.join(", ") || "—"} | ${c.items.length} | ${c.promptDerived ? "answer re-derived" : "structure only"} | ${[...c.misconceptions, ...c.misconceptionsNaming].length} |`);
});
md.push("");
md.push(`Total: **${pack.totals.items} items across ${pack.totals.concepts} concepts** (${pack.totals.foundationTier} reachable in Foundation, ${pack.totals.higherTier} in Higher).`);
md.push("");
md.push("## The items");
concepts.forEach((c, ci) => {
  md.push("");
  md.push(`### ${ci + 1}. ${c.title} \`${c.id}\``);
  md.push("");
  md.push(`Stage ${c.stage} · ${c.tiers.join(" + ")} tier · concept ceiling ${c.depth.toFixed(2)} · prereqs ${c.prereqs.length ? c.prereqs.map((p) => `\`${p}\``).join(", ") : "none"}`);
  md.push("");
  md.push(`*What it teaches:* ${c.lesson}`);
  md.push("");
  const mis = [...c.misconceptions, ...c.misconceptionsNaming];
  if (mis.length === 0) {
    md.push("**Misconceptions named: none.** A distractor in this concept is not yet tied to a named pattern — itself a finding for the reviewer.");
  } else {
    md.push("**Misconceptions this concept is meant to probe:**");
    md.push("");
    for (const m of mis) md.push(`- ${m.name} (\`${m.id}\`) — ${m.pattern}`);
  }
  md.push("");
  if (c.items.length === 0) {
    md.push("**No item could be drawn for this concept at this course's tier.** That is a content gap, not an empty page: the concept is in the course and the serve returns nothing.");
  } else {
    c.items.forEach((item, i) => { md.push(renderItem(item, i + 1)); });
  }
});
md.push("");
md.push("---");
md.push("");
md.push("## What this pack cannot show");
md.push("");
md.push("- **Whether a student learns.** Review is content validity: it says the instrument is fit to measure, not that anything was measured. That is the pilot, and it needs a class.");
md.push("- **Whether the items are calibrated.** Nothing here says an item discriminates between a strong and a weak candidate; only a sitting can, and that is a later measurement.");
md.push("- **That the mapping onto the specification is right.** This pack is the concept→item layer. The course→concept mapping is recorded separately (`mappingReview` in `lib/curricula/registry.ts`), and it is currently OpenMind's own, unreviewed.");

const mdText = md.join("\n") + "\n";
const jsonText = JSON.stringify(pack, null, 2) + "\n";
const JSON_PATH = path.join("audit", "pilot-pack.json");
const MD_PATH = path.join("docs", "REVIEW_PACK.md");

if (CHECK) {
  const stale = [];
  for (const [p, want] of [[JSON_PATH, jsonText], [MD_PATH, mdText]]) {
    const have = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
    if (have !== want) stale.push(p);
  }
  if (stale.length) {
    console.error("✗ review pack is stale — run `npm run pilot-pack`:");
    for (const p of stale) console.error(`  · ${p}`);
    process.exit(1);
  }
  console.log(`✓ review pack is current (${pack.totals.concepts} concepts, ${pack.totals.items} items)`);
  process.exit(0);
}

fs.writeFileSync(JSON_PATH, jsonText);
fs.writeFileSync(MD_PATH, mdText);
console.log(`review pack → ${JSON_PATH} + ${MD_PATH}`);
console.log(`  course   ${pack.course.name} (${pack.course.tiers.map((t) => t.id).join(" + ")})`);
console.log(`  cluster  ${pack.totals.concepts} concepts from the graph (anchors: ${ANCHORS.join(", ")})`);
console.log(`  items    ${pack.totals.items} (${pack.totals.foundationTier} concepts reachable in Foundation, ${pack.totals.higherTier} in Higher)`);
console.log(`  missing  ${pack.totals.concepts - pack.totals.withMisconceptions} concept(s) with no named misconception to probe`);
const noItems = concepts.filter((c) => c.items.length === 0).map((c) => c.id);
if (noItems.length) console.log(`  GAP      no item drawn for: ${noItems.join(", ")}`);
