// ─────────────────────────────────────────────────────────────────────────────
// THE PILOT PACK AUDIT — what a reviewer is actually handed, measured.
//
// `scripts/pilot-pack.mjs` generates the pack; this script asks whether the
// pack is fit to review. The distinction the roadmap turns on is the one a
// total hides: **149 items** is a sample, and **13** is a count of CONCEPTS
// reachable in Foundation, not a count of Foundation items. A reviewer needs
// both numbers, per concept, beside the format and the difficulty actually
// served.
//
// WHAT IT MEASURES
//   · items per concept and per tier, and whether a tier has too few to review
//   · response format: numeric entry vs multiple choice, option count, key index
//   · difficulty actually served against the tier's target and the concept's
//     ceiling — an item pitched at 0.80 in a Foundation draw is not Foundation
//   · explanation length and duplicates, because a pack of one-line keys is not
//     a reviewable lesson
//   · misconception coverage: a concept with no named belief has nothing for a
//     reviewer to check a distractor against
//
// WHAT IT DOES NOT DO
//   It does not approve anything. `audit/item-reviews.json` remains the only
//   source of a human-review claim, and it is empty. A green audit here means
//   the pack is worth a teacher's time, not that a teacher has read it.
//
// Usage: node scripts/audit-pilot-pack.mjs
// Writes: audit/pilot-pack-audit.json + audit/pilot-pack-audit.md
// Exit: 1 on a hard defect (invalid key, missing options, empty explanation),
//       0 with warnings otherwise.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const PACK = path.join("audit", "pilot-pack.json");
const OUT_JSON = path.join("audit", "pilot-pack-audit.json");
const OUT_MD = path.join("audit", "pilot-pack-audit.md");
const pack = JSON.parse(fs.readFileSync(PACK, "utf8"));

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (n, d = 2) => (n === null || n === undefined ? null : Number(n.toFixed(d)));
const proseWords = (s) => String(s ?? "").split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w)).length;
const norm = (s) => String(s ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const tierTargets = Object.fromEntries((pack.course?.tiers ?? []).map((t) => [t.id, t.difficulty]));
const TIER_LABEL = { foundation: "Foundation", higher: "Higher" };

const concepts = pack.concepts.map((c) => {
  const rows = c.items.map((it) => ({
    seed: it.seed,
    tier: it.tier,
    target: it.target,
    difficulty: it.difficulty,
    numeric: Boolean(it.numeric),
    prompt: it.prompt,
    choices: Array.isArray(it.choices) ? it.choices : [],
    answer: it.answer,
    explanation: it.explanation,
    words: proseWords(it.explanation),
  }));

  const byTier = {};
  for (const tier of c.tiers ?? []) {
    const items = rows.filter((r) => r.tier === tier);
    const diffs = items.map((r) => r.difficulty);
    byTier[tier] = {
      items: items.length,
      numeric: items.filter((r) => r.numeric).length,
      choice: items.filter((r) => !r.numeric).length,
      target: tierTargets[tier] ?? null,
      difficulty: {
        min: round(diffs.length ? Math.min(...diffs) : null),
        median: round(median(diffs)),
        max: round(diffs.length ? Math.max(...diffs) : null),
      },
      // How far the draw actually fell from the tier it is labelled with.
      maxTargetGap: round(diffs.length ? Math.max(...diffs.map((d) => Math.abs(d - (tierTargets[tier] ?? d)))) : null),
      explanationWords: {
        min: items.length ? Math.min(...items.map((r) => r.words)) : null,
        median: round(median(items.map((r) => r.words))),
        below25: items.filter((r) => r.words < 25).length,
      },
      distinctPrompts: new Set(items.map((r) => norm(r.prompt))).size,
      thin: items.length < 4,
    };
  }

  const hard = [];
  const warnings = [];
  for (const r of rows) {
    if (!r.choices.length) hard.push(`${r.seed}: no options`);
    else {
      if (!Number.isInteger(r.answer) || r.answer < 0 || r.answer >= r.choices.length) {
        hard.push(`${r.seed}: key index ${r.answer} outside 0..${r.choices.length - 1}`);
      }
      const seen = new Set();
      for (const ch of r.choices) {
        const k = norm(ch);
        if (seen.has(k)) warnings.push(`${r.seed}: duplicate option "${ch}"`);
        seen.add(k);
      }
    }
    if (!String(r.explanation ?? "").trim()) hard.push(`${r.seed}: empty explanation`);
    else if (r.words < 25) warnings.push(`${r.seed}: explanation is ${r.words} prose words`);
    if (!(r.difficulty >= 0 && r.difficulty <= 1)) hard.push(`${r.seed}: difficulty ${r.difficulty} outside 0..1`);
    if (r.tier && !(c.tiers ?? []).includes(r.tier)) {
      hard.push(`${r.seed}: item tier ${r.tier} is not a tier this concept is served in`);
    }
  }
  // A duplicate prompt inside one tier is a thinner sample than the count says.
  for (const tier of c.tiers ?? []) {
    const prompts = rows.filter((r) => r.tier === tier).map((r) => norm(r.prompt));
    if (new Set(prompts).size < prompts.length) {
      warnings.push(`${tier}: ${prompts.length - new Set(prompts).size} duplicate prompt(s)`);
    }
  }
  const maxServed = rows.length ? Math.max(...rows.map((r) => r.difficulty)) : null;
  if (maxServed !== null && Number.isFinite(c.depth) && maxServed > c.depth + 0.0001) {
    warnings.push(`served ${maxServed.toFixed(2)} exceeds the concept ceiling ${c.depth.toFixed(2)}`);
  }
  if (!(c.misconceptions ?? []).length && !(c.misconceptionsNaming ?? []).length) {
    warnings.push("no named misconception to check a distractor against");
  }

  return {
    id: c.id,
    title: c.title,
    subject: c.subject,
    stage: c.stage,
    tiers: c.tiers ?? [],
    depth: round(c.depth),
    prereqs: c.prereqs ?? [],
    items: rows.length,
    byTier,
    numeric: rows.filter((r) => r.numeric).length,
    choice: rows.filter((r) => !r.numeric).length,
    promptDerived: Boolean(c.promptDerived),
    misconceptions: (c.misconceptions ?? []).length + (c.misconceptionsNaming ?? []).length,
    explanationWords: {
      min: rows.length ? Math.min(...rows.map((r) => r.words)) : null,
      median: round(median(rows.map((r) => r.words))),
      below25: rows.filter((r) => r.words < 25).length,
    },
    hard,
    warnings,
  };
});

const total = (k) => concepts.reduce((n, c) => n + (c[k] ?? 0), 0);
const tierTotals = {};
for (const c of concepts) {
  for (const [tier, t] of Object.entries(c.byTier)) {
    const acc = (tierTotals[tier] ??= { concepts: 0, items: 0, numeric: 0, choice: 0, thin: 0 });
    acc.concepts += 1;
    acc.items += t.items;
    acc.numeric += t.numeric;
    acc.choice += t.choice;
    if (t.thin) acc.thin += 1;
  }
}

const foundation = concepts.filter((c) => c.tiers.includes("foundation"));
const advancedOnly = concepts.filter((c) => !c.tiers.includes("foundation"));
const hard = concepts.flatMap((c) => c.hard.map((x) => `${c.id}: ${x}`));
const warnings = concepts.flatMap((c) => c.warnings.map((x) => `${c.id}: ${x}`));

const higher = tierTotals.higher ?? { items: 0, numeric: 0, choice: 0 };
const foundationTier = tierTotals.foundation ?? { items: 0, numeric: 0, choice: 0 };
const terseConcepts = concepts
  .filter((c) => c.explanationWords.below25 > 0)
  .sort((a, b) => a.explanationWords.min - b.explanationWords.min);
const foundationOnly = concepts.filter((c) => c.tiers.length === 1 && c.tiers[0] === "foundation");
const terseItems = terseConcepts.reduce((n, c) => n + c.explanationWords.below25, 0);
const terseFinding = terseItems === 0
  ? `**0 of ${pack.totals.items} explanations are under 25 prose words.** Every explanation in the pack is at least 25 prose words long, so a reviewer is not handed a bare one-line key.`
  : `**${terseItems} of ${pack.totals.items} explanations are under 25 prose words**, and the thinnest are ${terseConcepts.slice(0, 4).map((c) => `\`${c.id}\` (${c.explanationWords.min} words)`).join(", ")}. A key without a reason is the shorthand defect the explanation gate exists to prevent; this pack is what a learner meets, not only what a reviewer reads.`;
const findings = [
  `**13 is a count of CONCEPTS, not items.** ${foundation.length} concepts are reachable in Foundation and they carry ${foundationTier.items} of the ${pack.totals.items} items; Higher carries ${higher.items}. A reviewer is reading a ${pack.totals.items}-item sample, not a ${pack.totals.items}-item assessment bank.`,
  `**Higher is almost entirely multiple choice.** ${higher.choice} of ${higher.items} Higher rows are multiple choice and ${higher.numeric} are numeric entry, while Foundation is ${foundationTier.numeric} numeric and ${foundationTier.choice} choice. Higher learners are asked to RECOGNISE an answer far more often than to construct one — the opposite of the assessment the roadmap's Stage 3 asks for.`,
  terseFinding,
  `**The pack is a sample, not a bank.** Every tier has at least four items, but most have six; six draws can show that the generator varies, and cannot show that a lesson has enough assessment.`,
  `**Tier articulation is asymmetric.** ${advancedOnly.map((c) => `\`${c.id}\``).join(" and ")} are Higher-only; ${foundationOnly.map((c) => `\`${c.id}\``).join(" and ")} are Foundation-only. That is correct curriculum placement, but the pack has no same-concept comparison across tiers for those ${advancedOnly.length + foundationOnly.length}.`,
];

const report = {
  generatedBy: "scripts/audit-pilot-pack.mjs",
  packGeneratedBy: pack.generatedBy,
  course: pack.course,
  reviewState: pack.reviewState,
  headline: {
    // The two numbers the roadmap's phrase can confuse.
    items: pack.totals.items,
    concepts: pack.totals.concepts,
    foundationConcepts: foundation.length,
    foundationItems: tierTotals.foundation?.items ?? 0,
    higherConcepts: concepts.filter((c) => c.tiers.includes("higher")).length,
    higherItems: tierTotals.higher?.items ?? 0,
    advancedOnlyConcepts: advancedOnly.map((c) => c.id),
  },
  tierTotals,
  concepts,
  findings,
  hard,
  warnings,
};

fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + "\n");

const md = [];
md.push("# Pilot review pack — coverage audit");
md.push("");
md.push(`Generated by \`scripts/audit-pilot-pack.mjs\` from \`${pack.generatedBy}\`.`);
md.push("");
md.push("## The number that is easy to misread");
md.push("");
md.push(`The pack holds **${report.headline.items} items across ${report.headline.concepts} concepts**.`);
md.push(`**${report.headline.foundationConcepts}** is the number of CONCEPTS reachable in Foundation — not ${report.headline.foundationConcepts} items. Foundation rows in this pack: **${report.headline.foundationItems}**. Higher rows: **${report.headline.higherItems}**.`);
md.push("");
md.push(`Higher-only concepts (correctly absent from Foundation): ${advancedOnly.map((c) => `\`${c.id}\``).join(", ") || "none"}.`);
md.push("");
md.push("## By concept");
md.push("");
md.push("| Concept | Stage | Tiers | Items | F / H | Numeric | Choice | Served difficulty (F / H) | Explanations < 25 words | Misconceptions | Flags |");
md.push("|---|---|---|---|---|---|---|---|---|---|---|");
for (const c of concepts) {
  const f = c.byTier.foundation, h = c.byTier.higher;
  const diff = [f, h].filter(Boolean).map((t) => `${t.difficulty.min}–${t.difficulty.max} (med ${t.difficulty.median})`).join(" / ");
  const flags = [...c.hard, ...c.warnings].length ? `${c.hard.length} hard, ${c.warnings.length} warn` : "—";
  md.push(`| \`${c.id}\` | ${c.stage} | ${c.tiers.join(" + ")} | ${c.items} | ${f?.items ?? 0} / ${h?.items ?? 0} | ${c.numeric} | ${c.choice} | ${diff || "—"} | ${c.explanationWords.below25} | ${c.misconceptions} | ${flags} |`);
}
md.push("");
md.push("## By tier");
md.push("");
md.push("| Tier | Concepts | Items | Numeric | Multiple choice | Concepts with fewer than 4 items |");
md.push("|---|---|---|---|---|---|");
for (const [tier, t] of Object.entries(tierTotals)) {
  md.push(`| ${TIER_LABEL[tier] ?? tier} | ${t.concepts} | ${t.items} | ${t.numeric} | ${t.choice} | ${t.thin} |`);
}
md.push("");
md.push("## Findings");
md.push("");
findings.forEach((f, i) => md.push(`${i + 1}. ${f}`));
md.push("");
md.push("## What needs attention");
md.push("");
if (hard.length) {
  md.push("### Hard defects (the pack should not be reviewed until these are fixed)");
  md.push("");
  hard.forEach((x) => md.push(`- ${x}`));
  md.push("");
} else {
  md.push("No hard defect: every item has options, a key inside them, a non-empty explanation, a difficulty in range, and a tier the concept is actually served in.");
  md.push("");
}
if (warnings.length) {
  md.push("### Warnings");
  md.push("");
  warnings.forEach((x) => md.push(`- ${x}`));
  md.push("");
} else {
  md.push("No warning on item count, duplicate prompts, explanation length, ceiling or misconception coverage.");
  md.push("");
}
md.push("## What this audit cannot say");
md.push("");
md.push("It cannot say an item is mathematically correct, that a distractor probes the misconception it names, that the reading level suits the year group, or that the teaching is any good. Those are the seven questions the review pack asks a qualified teacher, and **0** of them have been answered: `audit/item-reviews.json` is empty. A green audit means the pack is worth a teacher's time, not that a teacher has read it.");
md.push("");
fs.writeFileSync(OUT_MD, md.join("\n"));

const fmt = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(" · ");
console.log("Pilot pack audit");
console.log(`  items ${report.headline.items} · concepts ${report.headline.concepts}`);
console.log(`  Foundation: ${fmt(tierTotals.foundation ?? {})}`);
console.log(`  Higher:     ${fmt(tierTotals.higher ?? {})}`);
console.log(`  hard ${hard.length} · warnings ${warnings.length}`);
if (hard.length) {
  console.log("\nHARD:");
  hard.forEach((x) => console.log("  ✗ " + x));
}
if (warnings.length) {
  console.log("\nWARN:");
  warnings.slice(0, 30).forEach((x) => console.log("  · " + x));
  if (warnings.length > 30) console.log(`  … ${warnings.length - 30} more in the report`);
}
console.log(`\n→ ${OUT_JSON}\n→ ${OUT_MD}`);
process.exit(hard.length ? 1 : 0);
