// ─────────────────────────────────────────────────────────────────────────────
// CAN A GUESSER SCORE BY PICKING THE LONGEST OPTION?
//
// A learner's claim, and a measurement problem if it is true: "it's multiple
// choice, and the longest answer is always correct." A choice bank whose key is
// predictable from SURFACE FORM rather than from knowing the subject does not
// measure learning — it measures test-taking — and every downstream claim this
// project makes about evidence inherits the flaw. A diagnostic that a guesser
// can pass is a diagnostic that certifies nothing.
//
// This script puts a number on it. For every concept with a generator it draws
// the bank's own items and asks, for each one, whether the correct option is the
// longest string on screen. Two rules are measured, because they are different
// claims:
//
//   strict   the correct option is the UNIQUE longest — the heuristic as stated
//            ("the longest answer is always correct")
//   pick     a guesser who cannot count characters exactly but picks a longest
//            option uniformly at random among ties — the ACHIEVABLE score, which
//            is the number that matters, and the only one that can be compared
//            with the 25% floor of a four-option item
//
// The floor is not zero and not 25% of nothing: with four options, a blind
// guesser scores 25%. So the question is not "is the longest option ever
// correct" (it will be, sometimes, by luck) but "how far above 25% does this
// heuristic get you", and how many CONCEPTS are exploitable outright.
//
// Measured on two surfaces, deliberately:
//
//   catalogue   `generateQuestion` draws — the generator's whole range, the
//               population every serve samples from
//   served      `generateQuestionNear(…, 0.5 | 0.75, 40)` — the PRODUCTION
//               serve (40 draws, band-first, the same call the route makes), so
//               the number reported is the one a learner actually meets rather
//               than a property of an unfiltered catalogue
//
// Usage:
//   node scripts/option-bias-audit.mjs                 # measure, print the table
//   node scripts/option-bias-audit.mjs --seeds=120     # more draws per concept
//   node scripts/option-bias-audit.mjs --top=40        # more offenders listed
//   node scripts/option-bias-audit.mjs --json          # + write audit/option-bias.json
//
// Prerequisite: none — it compiles the engine mirror itself (one mirror, owned
// by scripts/compile-engines.mjs).
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const flag = (name) => argv.some((a) => a === `--${name}`);
const num = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  const v = hit ? Number(hit.split("=")[1]) : NaN;
  return Number.isFinite(v) ? v : dflt;
};

const SEEDS = num("seeds", 60);
const TOP = num("top", 20);
// --show=conceptId prints the actual items, key marked, lengths beside them. A
// number says there is a problem; the strings say which one, and a content fix
// is written against the strings.
const SHOW = argv.find((a) => a.startsWith("--show="))?.split("=")[1] ?? null;
const WRITE_JSON = flag("json");
// ── Held-out seeds ───────────────────────────────────────────────────────────
// A repair chosen by LOOKING at the same draws it is then scored on proves
// nothing about the bank: it proves something about those draws. `--prefix=`
// namespaces the seed string (the generator hashes it), so a run with a fresh
// prefix samples items no edit was chosen against — the honest generalisation
// measurement, and the one the report quotes.
const NS = argv.find((a) => a.startsWith("--prefix="))?.split("=")[1] ?? "";
// `--out=` keeps a run from overwriting the COMMITTED baseline: the pre-change
// measurement in audit/option-bias.json is the before-column of this whole
// campaign and is not ours to replace.
const OUT = argv.find((a) => a.startsWith("--out="))?.split("=")[1] ?? path.join("audit", "option-bias.json");
const CHANCE = 0.25; // four options, one key: a blind guess

compileEngines();
const Q = require("../.verify/questions.js");

const CONCEPTS = [...Q.GENERATED_CONCEPT_IDS].sort();
const pct = (n, d) => (d ? (100 * n) / d : 0);
const p2 = (n) => n.toFixed(2);

/** Score one item against the heuristic.
 *
 *  `lengths` are the strings as the learner sees them. The guesser's achievable
 *  score is 1/|argmax| when the key is among the longest and 0 otherwise — a
 *  model of a person, not of an oracle, which is why `pick` and `strict` are
 *  both reported: `strict` can look damning while `pick` is barely above
 *  chance (many ties means the guesser still has to choose), and it is `pick`
 *  that decides whether this is a real exploit. */
/** The digits a learner can SEE in one option, and the VALUE they can read.
 *  `1.372 × 10³ N` counts 4 digits and reads as 1372; `54 years` counts 2 and
 *  reads as 54; a phrase has neither, and is reported as null so the magnitude
 *  strategies stay silent about it rather than scoring it as a zero. */
const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function digitCount(s) {
  return (String(s).match(/\d/g) ?? []).length;
}
function magnitude(s) {
  const m = String(s).trim().match(/^([+-]?\d+(?:\.\d+)?)(?:\s*×\s*10([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+))?/);
  if (!m) return null;
  const mant = Number(m[1]);
  if (!Number.isFinite(mant)) return null;
  if (!m[2]) return mant;
  const exp = (m[2].startsWith("⁻") ? -1 : 1) * Number(m[2].replace("⁻", "").split("").map((c) => SUPS.indexOf(c)).join(""));
  return mant * Math.pow(10, exp);
}
/** Which options share the largest value of `vals` (nulls excluded). */
function argmaxOf(vals) {
  const nums = vals.filter((v) => v !== null);
  if (!nums.length) return [];
  const top = Math.max(...nums);
  return vals.map((v, i) => (v === top ? i : -1)).filter((i) => i >= 0);
}

function scoreItem(choices, answer) {
  const lens = choices.map((c) => c.length);
  const max = Math.max(...lens);
  const longest = lens.map((n, i) => (n === max ? i : -1)).filter((i) => i >= 0);
  const shortest = Math.min(...lens);
  const shortestIdx = lens.map((n, i) => (n === shortest ? i : -1)).filter((i) => i >= 0);
  const isLongest = lens[answer] === max;
  const isShortest = lens[answer] === shortest && longest.length !== lens.length;
  // The rank is the key's position among the DISTINCT lengths (1 = longest), and
  // the two extra strategies below are why it is measured: a learner who has
  // noticed the key is never a middle-sized option does not need to know which
  // extreme it is. Ties are handled by counting every option that shares the
  // key's length, because a guesser cannot tell them apart either.
  const distinct = [...new Set(lens)].sort((a, b) => b - a);
  const extremes = new Set([...longest, ...shortestIdx]).size;
  const middles = lens.length - extremes;
  const digits = choices.map((c) => digitCount(c));
  const digitsMax = Math.max(...digits) > 0;
  const mags = choices.map((c) => magnitude(c));
  return {
    strict: isLongest && longest.length === 1,
    longestTied: isLongest,
    pick: isLongest ? 1 / longest.length : 0,
    reverse: !isLongest && isShortest ? 1 : 0,
    rank: distinct.indexOf(lens[answer]) + 1,
    distinct: distinct.length,
    shortestPick: isShortest ? 1 / shortestIdx.length : 0,
    extremesOnly: isLongest || isShortest ? 1 / extremes : 0,
    midOnly: !isLongest && !isShortest && middles > 0 ? 1 / middles : 0,
    // The other fixed, simple strategies, each scored on its own so a repair
    // that only moves the cue cannot hide behind a good average (this is how a
    // "longest key" problem turns into a "middle-length key" one).
    digitsPick: digitsMax && digits[answer] === Math.max(...digits) && digits[answer] > 0
      ? 1 / digits.filter((d) => d === digits[answer]).length
      : 0,
    magPick: mags[answer] !== null && argmaxOf(mags).includes(answer)
      ? 1 / argmaxOf(mags).length
      : 0,
    first: answer === 0 ? 1 : 0,
    last: answer === choices.length - 1 ? 1 : 0,
  };
}

function emptyTally() {
  return {
    n: 0, strict: 0, longestTied: 0, pick: 0, reverse: 0,
    ranks: [0, 0, 0, 0], distinctSum: 0, shortestPick: 0, extremesOnly: 0, midOnly: 0,
    digitsPick: 0, magPick: 0, first: 0, last: 0,
  };
}
function add(t, s) {
  t.n += 1;
  t.strict += s.strict ? 1 : 0;
  t.longestTied += s.longestTied ? 1 : 0;
  t.pick += s.pick;
  t.reverse += s.reverse ? 1 : 0;
  if (s.rank >= 1 && s.rank <= 4) t.ranks[s.rank - 1] += 1;
  t.distinctSum += s.distinct;
  t.shortestPick += s.shortestPick;
  t.extremesOnly += s.extremesOnly;
  t.midOnly += s.midOnly;
  t.digitsPick += s.digitsPick;
  t.magPick += s.magPick;
  t.first += s.first;
  t.last += s.last;
}
function merge(a, b) {
  a.n += b.n; a.strict += b.strict; a.longestTied += b.longestTied; a.pick += b.pick; a.reverse += b.reverse;
  a.distinctSum += b.distinctSum; a.shortestPick += b.shortestPick; a.extremesOnly += b.extremesOnly; a.midOnly += b.midOnly;
  a.digitsPick += b.digitsPick; a.magPick += b.magPick; a.first += b.first; a.last += b.last;
  for (let i = 0; i < 4; i++) a.ranks[i] += b.ranks[i];
  return a;
}
/** Per-item rows are kept because the per-concept table is the thing a fix has
 *  to target: a bank-wide 30% can be four concepts at 100% (an authoring bug,
 *  fixable by hand) or every concept at 30% (a design property). */
const rows = [];
// The cue worth splitting on: a numeric draw is answered by TYPING, so its
// printed options cannot be the whole instrument, while a choice-form item is
// answerable from the screen alone. If the exploit lives only in one of these
// two families, the fix is a design decision rather than a rewrite of the bank.
const byForm = new Map();
function formTally(key) {
  if (!byForm.has(key)) byForm.set(key, emptyTally());
  return byForm.get(key);
}
const byBand = new Map();
function bandTally(key) {
  if (!byBand.has(key)) byBand.set(key, emptyTally());
  return byBand.get(key);
}
function collect(conceptId, surface, draw) {
  const t = emptyTally();
  for (let k = 0; k < SEEDS; k++) {
    const q = draw(conceptId, `${NS}${surface}:${conceptId}:${k}`);
    if (!q || !q.choices || q.choices.length < 2) continue;
    const s = scoreItem(q.choices, q.answer);
    add(t, s);
    add(formTally(`${surface}|${q.responseKind === "numeric" ? "typed number" : "four options"}`), s);
    // Standard versus deep GENERATION PATH: a base family declares < 0.5 and a
    // deep family >= 0.55, so the declaration splits the two layers the bank
    // composes, and a repair that only reached one of them is visible here.
    add(bandTally(`${surface}|${(q.difficulty ?? 0) >= 0.5 ? "deep family" : "standard family"}`), s);
  }
  if (t.n) rows.push({ conceptId, surface, subject: Q.generatorSubject(conceptId) ?? "other", ...t });
}

for (const id of CONCEPTS) {
  collect(id, "catalogue", (c, s) => Q.generateQuestion(c, s));
  collect(id, "served@0.50", (c, s) => Q.generateQuestionNear(c, s, 0.5, 40));
  collect(id, "served@0.75", (c, s) => Q.generateQuestionNear(c, s, 0.75, 40));
}

const surfaces = ["catalogue", "served@0.50", "served@0.75"];
const bySurface = {};
for (const s of surfaces) {
  const total = emptyTally();
  for (const r of rows.filter((x) => x.surface === s)) merge(total, r);
  bySurface[s] = total;
}
const total = emptyTally();
for (const r of rows) merge(total, r);

const subjects = [...new Set(rows.map((r) => r.subject))].sort();
const bySubject = {};
for (const s of subjects) {
  const t = emptyTally();
  for (const r of rows.filter((x) => x.subject === s)) merge(t, r);
  bySubject[s] = t;
}

// ── Report ───────────────────────────────────────────────────────────────────
const line = "─".repeat(78);
console.log(`\nOption-length bias — ${CONCEPTS.length} concepts × ${SEEDS} draws per surface`);
console.log(line);
console.log("surface         items   unique-longest   key-is-longest   achievable score   control: shortest");
for (const s of surfaces) {
  const t = bySurface[s];
  console.log(
    `${s.padEnd(15)} ${String(t.n).padStart(5)}   ` +
    `${p2(pct(t.strict, t.n)).padStart(10)}%   ` +
    `${p2(pct(t.longestTied, t.n)).padStart(11)}%   ` +
    `${p2(pct(t.pick, t.n)).padStart(13)}%   ` +
    `${p2(pct(t.reverse, t.n)).padStart(12)}%`,
  );
}
console.log(line);
console.log(`chance floor for a four-option item: ${p2(CHANCE * 100)}%\n`);

console.log("by subject (all surfaces)");
for (const s of subjects) {
  const t = bySubject[s];
  console.log(
    `  ${s.padEnd(10)} items ${String(t.n).padStart(5)}   longest-correct ${p2(pct(t.longestTied, t.n)).padStart(6)}%   ` +
    `achievable ${p2(pct(t.pick, t.n)).padStart(6)}%   control(shortest) ${p2(pct(t.reverse, t.n)).padStart(6)}%`,
  );
}

/** ── LENGTH-ONLY STRATEGIES ──────────────────────────────────────────────────
 *  A learner does not need to know WHICH length is right — only that length
 *  carries information. `strict` and `pick` answer "is the key the longest?",
 *  which is one strategy out of at least four, and the one a reviewer thinks of
 *  first. These four are scored against the 25% chance line of a four-option
 *  item:
 *
 *    longest        pick a longest option (uniformly among ties)
 *    shortest       pick a shortest option
 *    never-middle   pick among the extreme-length options only. This is the
 *                   strategy a bank falls into when a "longest key" problem is
 *                   "fixed" by trimming the key, and the reason a content fix
 *                   is judged on this table, not on `strict` alone.
 *    never-extreme  pick among the middle-length options only
 *
 *  The BEST of the four is the honest exposure figure: it is what a learner can
 *  score while ignoring the question entirely. */
function strategyTable(t) {
  const n = t.n || 1;
  return [
    { name: "longest text", win: pct(t.pick, n) },
    { name: "shortest text", win: pct(t.shortestPick, n) },
    { name: "never-middle (extremes only)", win: pct(t.extremesOnly, n) },
    { name: "never-extreme (middle only)", win: pct(t.midOnly, n) },
    { name: "most digits", win: pct(t.digitsPick, n) },
    { name: "largest value", win: pct(t.magPick, n) },
    { name: "first option (position)", win: pct(t.first, n) },
    { name: "last option (position)", win: pct(t.last, n) },
  ];
}
function bestStrategy(t) {
  return Math.max(...strategyTable(t).map((s) => s.win));
}
console.log("length-only strategies - what a learner scores while ignoring the question");
console.log("  " + "strategy".padEnd(34) + surfaces.map((s) => s.padStart(13)).join("") + "        best");
const strategyTables = Object.fromEntries(surfaces.map((s) => [s, strategyTable(bySurface[s])]));
for (let i = 0; i < strategyTables[surfaces[0]].length; i++) {
  const cells = surfaces.map((s) => (p2(strategyTables[s][i].win) + "%").padStart(13)).join("");
  const best = Math.max(...surfaces.map((s) => strategyTables[s][i].win));
  console.log(`  ${strategyTables[surfaces[0]][i].name.padEnd(34)}${cells}   ${(p2(best) + "%").padStart(6)}`);
}
console.log(`  ${"BEST LENGTH-ONLY STRATEGY".padEnd(34)}${surfaces.map((s) => (p2(bestStrategy(bySurface[s])) + "%").padStart(13)).join("")}`);
console.log(`  chance for a four-option item: ${p2(CHANCE * 100)}%`);
console.log("key-length rank distribution (1 = longest of the four, 4 = shortest; ties share a rank)");
for (const s of surfaces) {
  const t = bySurface[s];
  const cells = [1, 2, 3, 4].map((r) => (`rank${r} ${p2(pct(t.ranks[r - 1], t.n || 1))}%`).padStart(13)).join("");
  console.log(`  ${s.padEnd(15)}${cells}   distinct-lengths/4 ${(t.distinctSum / (t.n || 1)).toFixed(2)}`);
}
console.log("");

// ── The two forms, reported SEPARATELY ──────────────────────────────────────
// A numeric draw is answered by TYPING; its printed options are the
// multiple-choice twin, and its cue is magnitude (digits, value) rather than
// wording. Pooling the two would let a phrase-length fix hide a numeric
// regression, so the forms never share an average.
console.log(`the two answer forms, ${surfaces[2]} — a numeric draw's cue is magnitude, not wording`);
for (const form of ["typed number", "four options"]) {
  const t = formTally(`${surfaces[2]}|${form}`);
  if (!t.n) continue;
  const rows = strategyTable(t);
  const best = Math.max(...rows.map((r) => r.win));
  console.log(
    `  ${form.padEnd(13)} items ${String(t.n).padStart(5)}   longest ${p2(rows[0].win)}%   shortest ${p2(rows[1].win)}%   extremes ${p2(rows[2].win)}%   middles ${p2(rows[3].win)}%   ` +
    `most-digits ${p2(rows[4].win)}%   largest-value ${p2(rows[5].win)}%   first ${p2(rows[6].win)}%   last ${p2(rows[7].win)}%   BEST ${p2(best)}%`,
  );
}
console.log("");

// ── Standard versus deep GENERATION PATH ───────────────────────────────────
// A base family declares < 0.5 and a deep family >= 0.55, so the declaration
// splits the two layers the bank composes: a repair that reached only one of
// them shows up here rather than inside a combined figure.
console.log(`standard (<0.5) versus deep (>=0.5) family, ${surfaces[2]}`);
for (const layer of ["standard family", "deep family"]) {
  const t = bandTally(`${surfaces[2]}|${layer}`);
  if (!t.n) continue;
  const rows = strategyTable(t);
  console.log(
    `  ${layer.padEnd(16)} items ${String(t.n).padStart(5)}   BEST ${p2(Math.max(...rows.map((r) => r.win)))}%   ` +
    `longest ${p2(rows[0].win)}%   shortest ${p2(rows[1].win)}%   most-digits ${p2(rows[4].win)}%   largest-value ${p2(rows[5].win)}%   first ${p2(rows[6].win)}%   last ${p2(rows[7].win)}%`,
  );
}
console.log("");

/** Concepts where the heuristic is worth more than a coin's worth of guessing,
 *  ranked. 40% is the reporting cut: two points above the 25% floor is noise at
 *  this sample size, ten points is not. */
const perConcept = [];
for (const id of CONCEPTS) {
  const t = emptyTally();
  for (const r of rows.filter((x) => x.conceptId === id)) merge(t, r);
  if (t.n) perConcept.push({ conceptId: id, subject: Q.generatorSubject(id) ?? "other", ...t });
}
perConcept.sort((a, b) => b.pick / b.n - a.pick / a.n);
const exploitable = perConcept.filter((c) => c.pick / c.n > 0.4);
const always = perConcept.filter((c) => c.longestTied === c.n);

console.log(`\nby answer form (all surfaces) — is the exploit the options, or the box?`);
for (const surface of surfaces) {
  for (const form of ["four options", "typed number"]) {
    const t = formTally(`${surface}|${form}`);
    if (!t.n) continue;
    console.log(
      `  ${surface.padEnd(15)} ${form.padEnd(13)} items ${String(t.n).padStart(5)}   ` +
      `longest-correct ${p2(pct(t.longestTied, t.n)).padStart(6)}%   achievable ${p2(pct(t.pick, t.n)).padStart(6)}%`,
    );
  }
}

console.log(`\nconcepts worth >40% to the heuristic: ${exploitable.length} of ${perConcept.length}`);
if (always.length) console.log(`concepts where the key is the longest on EVERY draw: ${always.length}`);
console.log(`\ntop ${TOP} offenders (by achievable score)`);
for (const c of perConcept.slice(0, TOP)) {
  console.log(
    `  ${c.conceptId.padEnd(24)} ${c.subject.padEnd(9)} n=${String(c.n).padStart(4)}   ` +
    `achievable ${p2(pct(c.pick, c.n)).padStart(6)}%   unique-longest ${p2(pct(c.strict, c.n)).padStart(6)}%`,
  );
}

if (SHOW) {
  console.log(`\n── ${SHOW} ──`);
  for (let k = 0; k < 3; k++) {
    const q = Q.generateQuestion(SHOW, `show:${SHOW}:${k}`);
    if (!q) { console.log("  (no generator)"); break; }
    console.log(`\n  ${q.prompt}`);
    q.choices.forEach((c, i) => {
      const mark = i === q.answer ? "✓" : " ";
      console.log(`   ${mark} ${String(c.length).padStart(3)}  ${c}`);
    });
  }
}

if (WRITE_JSON) {
  const out = {
    generatedAt: new Date().toISOString(),
    seeds: SEEDS,
    seedPrefix: NS || "(none — the surface's own namespace)",
    concepts: CONCEPTS.length,
    chance: CHANCE,
    surfaces: Object.fromEntries(surfaces.map((s) => [s, bySurface[s]])),
    strategies: Object.fromEntries(
      surfaces.map((s) => [s, { rows: strategyTable(bySurface[s]), best: bestStrategy(bySurface[s]) }]),
    ),
    bestStrategyBySurface: Object.fromEntries(surfaces.map((s) => [s, bestStrategy(bySurface[s])])),
    bySubject,
    // Deliberately NOT called `reachable`: in this codebase that word already
    // means "a question in this course's bank reaches this demand row"
    // (lib/question-bank.ts), and a field that means something else wearing the
    // same name is how two true facts get read as one.
    perConcept: perConcept.map((c) => ({ ...c, achievable: pct(c.pick, c.n) / 100 })),
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${OUT}`);
}
console.log("");
