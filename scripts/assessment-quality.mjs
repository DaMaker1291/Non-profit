#!/usr/bin/env node
// ── WHAT THE PILOT'S OWN ITEMS CAN DIAGNOSE, AND WHETHER THE DIAGNOSIS IS SOUND ─
//
// Phase 5 of the audit asked which pilot concepts have "no misconception to
// probe". This answers it from the bank rather than from the lesson prose.
//
// It is now BOTH a report and a narrow gate:
//
//   · the report records, per concept, how many draws are numeric, how many
//     carry an item-level belief, and how many carry a PER-OPTION belief;
//   · the gate fails when a named belief sits on the correct option, is not in
//     the concept's catalogue, has no authored repair, or when a tagged
//     foundation item's explanation does not state its own answer;
//   · the six foundation families are also checked against independent
//     arithmetic and against the specific wrong values each distractor claims
//     to represent. That is the substance check: a question can carry a tag and
//     still print an explanation that is false.
//
// It does NOT claim to prove every explanation in the curriculum is correct.
// Human subject review remains the authority, and the report says so.
//
// Usage: node scripts/assessment-quality.mjs
import fs from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const q = require("../.verify/questions.js");
const repair = require("../.verify/repair.js");
const misconceptions = require("../.verify/misconceptions.js");
const pack = JSON.parse(fs.readFileSync("audit/pilot-pack.json", "utf8"));
const SEEDS = 40;
const FOUNDATIONS = ["place-value", "addition", "subtraction", "multiplication", "division", "fractions"];

const failures = [];
const fail = (message) => failures.push(message);

const rows = [];
for (const concept of pack.concepts) {
  let tagged = 0;
  let numeric = 0;
  let total = 0;
  let choiceTagged = 0;
  let perOptionTags = 0;
  let onKey = 0;
  let withoutRepair = 0;
  let missingAnswerInExplanation = 0;
  for (let i = 0; i < SEEDS; i += 1) {
    // A fixed, spread seed set: i * a prime, so consecutive draws are not
    // neighbouring states of the generator (the Rng trap this project has hit).
    const item = q.generateQuestion(concept.id, i * 7919 + 13);
    if (!item) continue;
    total += 1;
    if ((item.misconceptionTags ?? []).length > 0) tagged += 1;
    if (item.responseKind === "numeric") numeric += 1;
    if (item.responseKind !== "numeric" && Array.isArray(item.choices)) {
      const map = item.choiceMisconceptions;
      if (map && map.some(Boolean)) choiceTagged += 1;
      map?.forEach((tag, index) => {
        if (!tag) return;
        perOptionTags += 1;
        if (index === item.answer) onKey += 1;
        const known = misconceptions.MISCONCEPTIONS_BY_ID[tag];
        if (!known || !known.concepts.includes(concept.id)) {
          fail(`${concept.id}: option ${index} names ${tag}, which is not catalogued for the concept`);
        }
        if (!repair.repairFor(concept.id, tag)) {
          withoutRepair += 1;
          fail(`${concept.id}: option ${index} names ${tag} but no repair is authored`);
        }
      });
      if (map?.some(Boolean)) {
        const answer = String(item.choices[item.answer]);
        if (!String(item.explanation ?? "").includes(answer)) {
          missingAnswerInExplanation += 1;
          fail(`${concept.id}: tagged item's explanation does not state its answer ${answer}`);
        }
      }
    }
  }
  if (onKey > 0) fail(`${concept.id}: ${onKey} named belief(s) sit on the correct option`);
  rows.push({
    conceptId: concept.id,
    title: concept.title,
    subject: concept.subject,
    draws: total,
    tagged,
    numeric,
    multipleChoice: total - numeric,
    choiceTagged,
    perOptionTags,
    onKey,
    withoutRepair,
    missingAnswerInExplanation,
    repaired: tagged > 0,
  });
}

// ── INDEPENDENT ARITHMETIC AND DISTRACTOR SUBSTANCE, SIX FOUNDATIONS ────────
// A tag is a claim about a wrong move. These checks recompute the item from its
// own prompt and ask whether the advertised distractor values are the moves the
// family says they are. They are deliberately local: a general parser cannot
// know every subject's arithmetic, and pretending it can would be the same
// defect as a marker that trusts a string.
const arithmetic = {
  "place-value": (item) => {
    const m = /In the number (\d+), what is the VALUE of the (tens|hundreds|ones) digit\?/.exec(item.prompt);
    if (!m) return null;
    const n = Number(m[1]);
    const digit = m[2] === "tens" ? Math.floor(n / 10) % 10 : m[2] === "hundreds" ? Math.floor(n / 100) % 10 : n % 10;
    const value = m[2] === "tens" ? digit * 10 : m[2] === "hundreds" ? digit * 100 : digit;
    return { answer: value, expected: [digit, value * 10, value / 10] };
  },
  addition: (item) => {
    const m = /Work out (\d+) \+ (\d+)\./.exec(item.prompt);
    if (!m) return null;
    const [a, b] = [Number(m[1]), Number(m[2])];
    return { answer: a + b, expected: [a + b - 10, a + b + 10, a + b + 100] };
  },
  subtraction: (item) => {
    const m = /Work out (\d+) − (\d+)\./.exec(item.prompt);
    if (!m) return null;
    const [a, b] = [Number(m[1]), Number(m[2])];
    return { answer: a - b, expected: [a - b + 10, a - b - 10, b - a] };
  },
  multiplication: (item) => {
    const m = /Work out (\d+) × (\d+)\./.exec(item.prompt);
    if (!m) return null;
    const [a, b] = [Number(m[1]), Number(m[2])];
    return { answer: a * b, expected: [a * b + a, a * b - b, a + b] };
  },
  division: (item) => {
    const m = /Work out (\d+) ÷ (\d+)\./.exec(item.prompt);
    if (!m) return null;
    const [a, b] = [Number(m[1]), Number(m[2])];
    return { answer: a / b, expected: [a / b + 1, a / b - 1, a - b] };
  },
  fractions: (item) => {
    const m = /Work out (\d+)\/(\d+) of (\d+)\./.exec(item.prompt);
    if (!m) return null;
    const [n, d, amount] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return { answer: (n / d) * amount, expected: [n * d, amount / d, (n / d) * amount + d] };
  },
};

for (const id of FOUNDATIONS) {
  let checked = 0;
  let perOption = 0;
  for (let i = 0; i < SEEDS; i += 1) {
    const item = q.generateQuestion(id, i * 7919 + 13);
    if (!item || item.responseKind !== "numeric") continue;
    const got = arithmetic[id]?.(item);
    if (!got) continue;
    checked += 1;
    if (Math.abs(got.answer - item.answerValue) > 1e-9) {
      fail(`${id}: independent arithmetic gives ${got.answer}, item key is ${item.answerValue} (${item.prompt})`);
    }
    const wrongs = (item.choices ?? []).map(Number).filter((_, index) => index !== item.answer);
    if (!got.expected.some((v) => wrongs.some((w) => Math.abs(w - v) < 1e-9))) {
      fail(`${id}: no distractor is the mistake the family claims to expose (${item.prompt})`);
    }
    if (item.choiceMisconceptions?.some(Boolean)) perOption += 1;
  }
  if (checked === 0) fail(`${id}: no numeric foundation draw could be independently checked`);
  if (perOption === 0) fail(`${id}: no multiple-choice draw carries a per-option belief`);
}

const undiagnosable = rows.filter((r) => r.tagged === 0);
const report = {
  generatedAt: new Date().toISOString(),
  seedsPerConcept: SEEDS,
  pilotConcepts: rows.length,
  conceptsWithNoTaggedDraw: undiagnosable.map((r) => r.conceptId),
  failures,
  note:
    "A numeric draw has no options; it can carry an item-level belief but not a per-option one. " +
    "A per-option belief is accepted only when it sits on a wrong option, is catalogued for that concept, has a repair, " +
    "and the explanation states the item's own answer. The six foundations are additionally checked against independent arithmetic " +
    "and against the specific wrong values their distractors claim. Human subject review remains the authority.",
  rows,
};
fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync("audit/assessment-quality.json", JSON.stringify(report, null, 2) + "\n");

console.log("▸ Assessment quality — diagnosis, not only tag frequency");
console.log(`  ${rows.length} pilot concepts × ${SEEDS} draws`);
for (const r of rows) {
  const flag = r.tagged === 0 ? "  ← no diagnosis at all" : "";
  console.log(
    `  ${r.conceptId.padEnd(18)} tagged ${String(r.tagged).padStart(2)}/${r.draws}` +
    `  numeric ${String(r.numeric).padStart(2)}/${r.draws}` +
    `  per-option ${String(r.perOptionTags).padStart(2)}${flag}`,
  );
}
console.log(`  concepts with no tagged draw: ${undiagnosable.length} (${undiagnosable.map((r) => r.conceptId).join(", ")})`);
if (failures.length > 0) {
  console.error(`  ✗ ${failures.length} assessment-quality failure(s):`);
  for (const failure of failures.slice(0, 12)) console.error(`    · ${failure}`);
  console.error("  → audit/assessment-quality.json");
  process.exit(1);
}
console.log("  ✓ every named belief is on a wrong option, catalogued, repaired, and explained");
console.log("  ✓ six foundations: independent arithmetic and claimed distractors agree");
console.log("  → audit/assessment-quality.json");
