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
function scoreItem(choices, answer) {
  const lens = choices.map((c) => c.length);
  const max = Math.max(...lens);
  const longest = lens.map((n, i) => (n === max ? i : -1)).filter((i) => i >= 0);
  const shortest = Math.min(...lens);
  const isLongest = lens[answer] === max;
  const isShortest = lens[answer] === shortest && longest.length !== lens.length;
  return {
    strict: isLongest && longest.length === 1,
    longestTied: isLongest,
    pick: isLongest ? 1 / longest.length : 0,
    reverse: !isLongest && isShortest ? 1 : 0,
  };
}

function emptyTally() {
  return { n: 0, strict: 0, longestTied: 0, pick: 0, reverse: 0 };
}
function add(t, s) {
  t.n += 1;
  t.strict += s.strict ? 1 : 0;
  t.longestTied += s.longestTied ? 1 : 0;
  t.pick += s.pick;
  t.reverse += s.reverse ? 1 : 0;
}
function merge(a, b) {
  a.n += b.n; a.strict += b.strict; a.longestTied += b.longestTied; a.pick += b.pick; a.reverse += b.reverse;
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
function collect(conceptId, surface, draw) {
  const t = emptyTally();
  for (let k = 0; k < SEEDS; k++) {
    const q = draw(conceptId, `${surface}:${conceptId}:${k}`);
    if (!q || !q.choices || q.choices.length < 2) continue;
    const s = scoreItem(q.choices, q.answer);
    add(t, s);
    add(formTally(`${surface}|${q.responseKind === "numeric" ? "typed number" : "four options"}`), s);
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
    concepts: CONCEPTS.length,
    chance: CHANCE,
    surfaces: Object.fromEntries(surfaces.map((s) => [s, bySurface[s]])),
    bySubject,
    // Deliberately NOT called `reachable`: in this codebase that word already
    // means "a question in this course's bank reaches this demand row"
    // (lib/question-bank.ts), and a field that means something else wearing the
    // same name is how two true facts get read as one.
    perConcept: perConcept.map((c) => ({ ...c, achievable: pct(c.pick, c.n) / 100 })),
  };
  const file = path.join("audit", "option-bias.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nwrote ${file}`);
}
console.log("");
