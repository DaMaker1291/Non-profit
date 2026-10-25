// ─────────────────────────────────────────────────────────────────────────────
// THE MARKING EXPLANATION AUDIT — how much TEACHING is in the text a learner
// reads after they press Check.
//
// Why this exists at all. The bank authored explanations as working: `Substitute:
// y = 4(2) + 0 = 8 + 0 = 8.` is an accurate derivation and a bad explanation. It
// names no operation in words, it never says what the answer MEANS, and it does
// not say why the tempting wrong option is tempting. A learner who got it wrong
// reads a formula they already failed to produce and is left where they were.
//
// So the unit here is not "is there an explanation" (there always was) but "does
// it teach": WORDS of prose, not characters of notation, because the shorthand
// problem is exactly that symbols crowd the words out. A substitution chain can
// be 50 characters and contain one word.
//
// It measures BOTH branches. `generateQuestion` picks the numeric family or the
// composed one from the seed, so a sweep of one measures half the surface — the
// same mistake the ceiling gate already paid for (see AGENTS.md). The numeric
// families are drawn directly as well, so a stub in either layer is visible.
//
// Run: node scripts/explanation-audit.mjs [--write-baseline] [--seeds N]
//   exits 1 when any concept has fallen BELOW its committed floor, which is the
//   regression the floors exist to catch. `npm run verify` asserts the same rule
//   plus an absolute standard for every concept named in REPAIRED_EXPLANATIONS.
// ─────────────────────────────────────────────────────────────────────────────
import { compileEngines } from "./compile-engines.mjs";
import fs from "node:fs";
import { createRequire } from "node:module";

const BASELINE = "audit/explanation-standard.json";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d; };
const SEEDS = Number(arg("seeds", 12));
const WRITE = process.argv.includes("--write-baseline");
const JSON_OUT = process.argv.includes("--json");

compileEngines();
const require = createRequire(import.meta.url);
const questions = require("../.verify/questions.js");
const numeric = require("../.verify/numeric-items.js");
const genome = require("../.verify/genome.js");

/** Words a learner can actually read. Deliberately 2+ letters, so `m`, `s` and
 *  single-symbol variables do not count as prose — a physics explanation made of
 *  `v = u + at` must not score better than one that says what it is doing. */
const words = (s) => (s.replace(/[^A-Za-z]+/g, " ").match(/[A-Za-z]{2,}/g) ?? []).length;
/** Sentences end in a terminator followed by space or end. A decimal point is
 *  not a sentence, which is why this is not `split(".")`. */
const sentences = (s) => (s.match(/[.!?](\s|$)/g) ?? []).length;

const rows = [];
for (const c of genome.CONCEPTS) {
  let worstWords = Infinity, worstSentences = Infinity, terse = 0, n = 0, shortest = null;
  const measure = (text) => {
    if (!text) return;
    n++;
    const w = words(text), s2 = sentences(text);
    if (w < worstWords) { worstWords = w; shortest = text; }
    if (s2 < worstSentences) worstSentences = s2;
    if (w < 25) terse++;
  };
  for (let i = 0; i < SEEDS; i++) {
    const q = questions.generateQuestion(c.id, `explain:${c.id}:${i}`);
    if (q) measure(q.explanation);
  }
  const gen = numeric.NUMERIC_GENS[c.id];
  if (gen) {
    for (let i = 0; i < SEEDS; i++) {
      // `Rng` takes a NUMBER: a string seed is NaN >>> 0, which is a constant 1,
      // so every draw would be the same one. Hash it, exactly as the bank does.
      const seed = questions.hashSeed(`explain-numeric:${c.id}:${i}`);
      try { measure(gen(new questions.Rng(seed)).explanation); } catch { /* draw refused; the serve path above covers it */ }
    }
  }
  if (!n) continue;
  rows.push({ id: c.id, subject: c.subject, worstWords, worstSentences, terse, n, share: terse / n, shortest });
}

const bySubject = {};
for (const r of rows) (bySubject[r.subject] ??= []).push(r);
const pct = (x) => `${(x * 100).toFixed(0)}%`;

if (!JSON_OUT) {
  console.log(`\nExplanations of fewer than 25 words, per subject (${SEEDS} seeds, both families):`);
  for (const [subject, rs] of Object.entries(bySubject)) {
    const t = rs.reduce((a, r) => a + r.terse, 0), n = rs.reduce((a, r) => a + r.n, 0);
    console.log(`  ${subject.padEnd(10)} ${String(t).padStart(4)}/${String(n).padEnd(4)} terse (${pct(t / n)})   worst concept: ${Math.min(...rs.map((r) => r.worstWords))} words`);
  }
  const worst = rows.filter((r) => r.terse > 0).sort((a, b) => b.share - a.share || a.worstWords - b.worstWords);
  console.log(`\n  ${worst.length} of ${rows.length} concepts have at least one terse explanation. Worst 20:`);
  for (const r of worst.slice(0, 20)) {
    console.log(`  ${r.worstWords.toString().padStart(3)}w  ${r.id.padEnd(24)} ${r.shortest.slice(0, 96).replace(/\n/g, " ⏎ ")}`);
  }
}

const floors = Object.fromEntries(rows.map((r) => [r.id, r.worstWords]));
const previous = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : null;

if (WRITE) {
  fs.mkdirSync("audit", { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify({
    note: "The worst-case word count of each concept's marking explanation. A concept may IMPROVE, never get terser: this is the floor, not a target. Regenerate with npm run explain:audit -- --write-baseline, and the diff is the review.",
    seeds: SEEDS,
    floors,
  }, null, 2) + "\n");
  console.log(`\nwrote ${BASELINE} (${Object.keys(floors).length} concepts)`);
} else if (previous?.floors) {
  const regressed = Object.entries(previous.floors).filter(([id, floor]) => id in floors && floors[id] < floor);
  if (regressed.length) {
    console.log(`\n✗ ${regressed.length} concept(s) now have a terser explanation than the committed floor:`);
    for (const [id, floor] of regressed) console.log(`    ${id}: ${floors[id]} words, floor ${floor} — ${rows.find((r) => r.id === id).shortest.slice(0, 90)}`);
    process.exit(1);
  }
  const improved = Object.entries(previous.floors).filter(([id, floor]) => id in floors && floors[id] > floor).length;
  console.log(`\n✓ no concept is below its committed floor (${improved} improved; regenerate the baseline to record them)`);
}
